# PitchPulse Bug Log & Architectural Fixes

This document tracks identified bugs, critical architectural gaps, and proposed fixes across **Vercel** (frontend), **Render** (API backend), and **Supabase** (PostgreSQL database).

---

## 1. Critical Bug: Briefs and User Data Lost on Redeployment

### 🔴 The Issue
Whenever a new code change is pushed and a deployment cycle is triggered on Vercel and Render, all user briefs and account data disappear.

### 🔍 Root Cause Analysis
1. **Render Ephemeral Disk Fallback**: In `backend/config.py`, if `DATABASE_URL` is not found, the app silently falls back to a local SQLite database (`sqlite:///pitchpulse.db`). Render containers have an ephemeral, stateless filesystem. Every deployment destroys the old container and creates a new one from scratch, permanently wiping the local SQLite file.
2. **Missing Render Environment Variable**: If the `DATABASE_URL` environment variable is not explicitly configured in the Render Dashboard (pointing to Supabase), the server runs on SQLite without reporting an error.
3. **Clerk Environment Mismatch**: If Clerk API keys (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`) differ between deployment branches (e.g., mixing Clerk Test and Production environments), users are issued different `clerk_user_id` tokens, making their previous database records inaccessible.

### 🛠️ The Fix
1. **Enforce Database Verification on Startup**: Modify `backend/config.py` or `backend/database.py` to raise a fatal error on startup in production if `DATABASE_URL` is missing or uses SQLite.
   ```python
   if os.getenv("FLASK_ENV") == "production" and not os.getenv("DATABASE_URL"):
       raise RuntimeError("CRITICAL: DATABASE_URL environment variable must be set in production.")
   ```
2. **Configure Environment Variables**: Set `DATABASE_URL` in the Render web service settings pointing to your Supabase PostgreSQL database URL (using PgBouncer port `6543`).
3. **Synchronize Clerk Keys**: Ensure Vercel and Render are using matching Clerk Development or Production keys.

---

## 2. Identified Bugs & Architecture Flaws

### ⚠️ Bug: Duplicate Scheduler Execution in Multi-Worker Production (Render)
* **Problem**: In `backend/app.py`, the scheduler is started as a daemon thread:
  ```python
  if __name__ == '__main__':
      start_scheduler_thread(app)
  ```
  If Gunicorn is configured with multiple worker processes (e.g. `gunicorn -w 4 "app:create_app()"`), **each worker process runs its own scheduler thread**. This leads to race conditions where duplicate briefs are generated, Tavily search runs multiple times, and users get charged multiple rate limit credits.
* **Fix**: Disable the background thread scheduler in production. Instead, trigger the scheduler exclusively through the `/api/cron/process-scheduled` endpoint via Render Cron Jobs or an external cron runner (e.g., UptimeRobot, GitHub Actions).

---

### ⚠️ Bug: CORS Preflight Latency (Vercel ➔ Render)
* **Problem**: Since the frontend is on Vercel and the backend is on Render, they reside on different domains. For every state-changing request (`POST /api/brief`, `PATCH /api/watchlist`, etc.), the browser issues a CORS preflight `OPTIONS` request, doubling the network latency.
* **Fix**: Add a CORS preflight cache header in `backend/app.py`:
  ```python
  CORS(app, origins=origins, max_age=86400)
  ```

---

### ⚠️ Bug: Supabase PostgreSQL Connection Dropping (Render)
* **Problem**: Supabase databases drop idle connections after a timeout. Without connection pooling, Flask-SQLAlchemy requests will fail with `OperationalError: connection to server lost` on subsequent request cycles.
* **Fix**: Add connection pooling and engine settings in `backend/database.py`:
  ```python
  app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
      "pool_size": 10,
      "max_overflow": 5,
      "pool_recycle": 1800,
      "pool_pre_ping": True
  }
  ```

---

### ⚠️ Bug: SQLite-specific SQLite-to-PostgreSQL Data-Type Mismatch
* **Problem**: The self-healing migrations in `backend/database.py` execute direct SQL queries like `ALTER TABLE scheduled_brief ADD COLUMN prompt TEXT` inside try-except blocks. While SQLite is highly permissive with data types, PostgreSQL (Supabase) enforces strict type rules (e.g. VARCHAR lengths and nullability).
* **Fix**: Use a formal migration tool like **Alembic** or verify all column types strictly match the target PostgreSQL database before deploying.

---

### ⚠️ Bug: Scheduler Timezone Mismatch
* **Problem**: `scheduler.py` checks for due briefs using `datetime.now(timezone.utc).replace(tzinfo=None)`. If the frontend schedules a brief for `9:00 AM` in the user's local timezone (e.g. `Asia/Kolkata`) and sends that time directly to the database without converting it to UTC first, the brief will run 5.5 hours late (or early depending on timezone offsets).
* **Fix**: The frontend must always convert scheduled times to UTC ISO strings before posting to the backend, or the backend must explicitly convert the user's local timezone input into UTC using their stored timezone preference before writing to the database.

---

### ⚠️ Bug: Out-Of-Memory (OOM) Server Crashes on Large PDF Uploads
* **Problem**: PDF extraction via `PyPDF2` is done synchronously inside the Flask request handler. Render's free tier has a strict **512MB memory limit**. Uploading large or image-heavy PDFs (e.g., 5MB+) causes memory spikes during parsing that trigger Render's OOM process killer, taking down the entire API for all users.
* **Fix**:
  1. Add a strict client-side validation file size limit (e.g., max 2MB) in the frontend uploader.
  2. Implement backend page limits (e.g., parse only the first 5 pages of the document) and release memory immediately.

---

### ⚠️ Bug: Abrupt 401 Logout on Clerk Token Drift
* **Problem**: In `api.js`, any 401 response redirects the user immediately to `/sign-in`. In production environments, slight clock differences (drift) between Render's server and Clerk's authorization servers can make valid tokens appear expired, causing active users to be suddenly logged out mid-session.
* **Fix**: Implement a retry loop in the Axios interceptor. On a 401 error, attempt to refresh the Clerk token using `getToken(forceRefresh: true)` once, and only redirect to sign-in if the retry also returns a 401.

