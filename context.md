# PitchPulse v2 Context

## Project Name and Description
PitchPulse v2 — an AI-powered pre-meeting sales intelligence platform. The platform gathers comprehensive intelligence about a company through web searches and financial data, synthesizes it into actionable sales insights, and formats it into structured JSON briefs using CrewAI.

## Folder Structure
```
Pitchpulse_Upgrade/
  backend/
    app.py             # Main Flask application and API route definitions
    agents.py          # CrewAI setup, defining Researcher, Analyst, and Formatter agents
    tools.py           # CrewAI tools for Tavily search and financial data retrieval
    models.py          # SQLAlchemy database models definition
    database.py        # Database initialization and setup
    scheduler.py       # Logic for running scheduled pre-meeting briefs
    email_service.py   # Resend integration for sending transactional emails
    config.py          # Environment configuration loading and validation
    requirements.txt   # Python dependencies
    .env               # Local environment variables
    .env.example       # Example environment variables template
    .gitignore         # Files to ignore in git
  frontend/            # Empty folder for future frontend application
  context.md           # This file, detailing the project context
```

## Environment Variables
- `GROQ_API_KEY` (Required): API key for Groq to access the LLaMA model
- `TAVILY_API_KEY` (Required): API key for Tavily search tool
- `RESEND_API_KEY` (Required): API key for Resend email service
- `CLERK_SECRET_KEY` (Required): Secret key for Clerk authentication JWT verification
- `CLERK_PUBLISHABLE_KEY`: Clerk public key for the frontend
- `CRON_SECRET` (Required): Random string to authenticate the webhook triggering cron jobs
- `DATABASE_URL`: Connection string for the database (default: `sqlite:///pitchpulse.db`)
- `FRONTEND_URL`: URL of the frontend application (default: `http://localhost:5173`)
- `SECRET_KEY` (Required): Flask secret key for sessions/security
- `JWT_EXPIRY_HOURS`: Token expiry duration (default: 24)
- `CREWAI_TRACING_ENABLED`: Feature flag for CrewAI tracing (default: false)
- `FLASK_ENV`: "development" or "production" (default: development)
- `FROM_EMAIL`: From address for Resend emails (default: onboarding@resend.dev)

## API Routes
- `GET /api/health`: Health check. No auth. Returns status and version.
- `POST /api/brief`: Generate a brief. Auth: Skip for Phase 1. Body: `company_name`, `length`, `sections`, `user_context`. Returns generated brief.
- `GET /api/briefs`: Get user's briefs. Auth required. Query params: `search`, `saved`, `limit`, `offset`. Returns list of briefs.
- `GET /api/briefs/:id`: Get full brief JSON. Auth required. Returns brief JSON.
- `PATCH /api/briefs/:id/save`: Toggle saved status. Auth required. Returns new saved status.
- `DELETE /api/briefs/:id`: Delete a brief. Auth required. Returns message.
- `POST /api/briefs/:id/feedback`: Add feedback to a brief. Auth required. Body: `section`, `rating`. Returns message.
- `POST /api/briefs/:id/share`: Generate a shareable link. Auth required. Returns share URL.
- `GET /api/share/:token`: Public route to view a shared brief. No auth. Returns brief JSON.
- `GET /api/watchlist`: Get user's watchlist. Auth required. Returns list.
- `POST /api/watchlist`: Add company to watchlist. Auth required. Body: `company_name`, `folder_tag`, `user_notes`. Returns item ID.
- `DELETE /api/watchlist/:id`: Remove from watchlist. Auth required. Returns message.
- `PATCH /api/watchlist/:id`: Update watchlist item. Auth required. Body: `folder_tag`, `user_notes`, `default_length`, `default_sections`. Returns message.
- `GET /api/scheduled`: Get user's scheduled briefs. Auth required. Returns list.
- `POST /api/scheduled`: Add scheduled brief. Auth required. Body: `company_name`, `scheduled_for`, `recurring`, `length`, `sections`. Returns item ID.
- `DELETE /api/scheduled/:id`: Remove scheduled brief. Auth required. Returns message.
- `POST /api/cron/process-scheduled`: Trigger scheduled briefs logic. Auth: Header `X-Cron-Secret`. Returns processed count.
- `GET /api/user/me`: Get current user profile. Auth required. Returns user info.
- `PATCH /api/user/me`: Update profile. Auth required. Body: display_name, timezone, etc. Returns message.
- `DELETE /api/user/me`: Delete user and cascade delete everything. Auth required. Returns message.
- `PATCH /api/user/preferences`: Update preferences. Auth required. Body: UI settings. Returns message.

## Database Schema
**User**
- `id` (Int, PK)
- `clerk_user_id` (Str, Unique)
- `email` (Str, Unique)
- `display_name` (Str)
- `tier` (Str, default 'free')
- `timezone` (Str, default 'Asia/Kolkata')
- `default_brief_length` (Str, default 'medium')
- `default_sections` (Text, JSON)
- `user_context` (Text)
- `preferences` (Text, JSON)
- `briefs_used_this_hour` (Int, default 0)
- `hour_window_start` (DateTime)
- `created_at` (DateTime)

**Brief**
- `id` (Int, PK)
- `user_id` (Int, FK -> User)
- `company_name` (Str)
- `brief_json` (Text)
- `length_used` (Str)
- `sections_used` (Text, JSON)
- `saved` (Bool, default False)
- `share_token` (Str, Unique)
- `feedback` (Text, JSON)
- `generation_time_ms` (Int)
- `limited_data` (Bool, default False)
- `created_at` (DateTime)

**Watchlist**
- `id` (Int, PK)
- `user_id` (Int, FK -> User)
- `company_name` (Str)
- `folder_tag` (Str)
- `user_notes` (Text)
- `default_length` (Str)
- `default_sections` (Text, JSON)
- `last_briefed_at` (DateTime)
- `added_at` (DateTime)

**ScheduledBrief**
- `id` (Int, PK)
- `user_id` (Int, FK -> User)
- `company_name` (Str)
- `scheduled_for` (DateTime)
- `recurring` (Str)
- `length` (Str, default 'medium')
- `sections` (Text, JSON)
- `status` (Str, default 'pending')
- `last_run_at` (DateTime)
- `brief_id` (Int, FK -> Brief)
- `created_at` (DateTime)

## Agents
1. **Intelligence Researcher**: Searches web and financial data for recent info. Output: comprehensive research.
2. **Strategic Sales Analyst**: Transforms raw research into sales-actionable insights. Output: targeted analysis.
3. **Brief Formatter**: Formats insights into exact structured JSON for the frontend. Output: Valid JSON.

## Design System Tokens
- Dark bg: `#0C0C0C` | Surface: `#141414` | Surface raised: `#1C1C1C`
- Border: `rgba(255,255,255,0.08)` | Accent orange: `#FF6B2C`
- Light bg: `#FAFAF8` | Light surface: `#FFFFFF`
- Font: `Space Grotesk + Inter + Berkeley Mono`

## Phase 1 Completed
- All backend routes, models, agents, tools, config, scheduler, and email logic fully built.
- Local SQLite database integrated.

## Phase 2 Completed
- All routes fully working and authenticated:
  `GET /api/health`, `GET /api/user/me`, `PATCH /api/user/me`, `DELETE /api/user/me`,
  `PATCH /api/user/preferences`, `POST /api/brief`, `GET /api/briefs`, `GET /api/briefs/:id`,
  `PATCH /api/briefs/:id/save`, `DELETE /api/briefs/:id`, `POST /api/briefs/:id/feedback`,
  `POST /api/briefs/:id/share`, `GET /api/share/:token`, `GET /api/watchlist`,
  `POST /api/watchlist`, `DELETE /api/watchlist/:id`, `PATCH /api/watchlist/:id`,
  `GET /api/scheduled`, `POST /api/scheduled`, `DELETE /api/scheduled/:id`,
  `POST /api/cron/process-scheduled`

## Not Yet Built
- Frontend (React/Next.js/Vite application).
- Strict Clerk JWT validation with public key (bypassed for testing).
- Deployment scripts.
- Phase 3: React/Vite frontend with Clerk auth integration.

## Decisions & Why
- Used SQLite for quick dev setup, but mapped Postgres URLs for immediate production readiness (Render quirk).
- Leveraged LiteLLM via CrewAI to connect seamlessly to Groq's high-speed API.

## Known Issues and Watch-outs
- Rate limits on Groq and Tavily (handle 429 errors appropriately).
- Apple M-series chips typically use port 5000 for AirPlay, hence port 5001 is used.
- LLM outputs can occasionally wrap JSON in markdown even when instructed not to, handled robustly in `_extract_json()`.
- CrewAI event pairing mismatch warnings — harmless, ignore
- LiteLLM botocore warnings — harmless, no AWS SDK needed
- SECURITY: X-Test-User-Email bypass is active in _get_current_user() — must be removed before Phase 3 frontend build.

## Test Commands
1. `cd "backend"`
2. `python -m venv venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `python app.py`

In a second terminal:
```bash
curl -X GET http://localhost:5001/api/health

curl -X POST http://localhost:5001/api/brief \
  -H "Content-Type: application/json" \
  -H "X-Test-User-Email: test@example.com" \
  -d '{"company_name": "Infosys", "length": "short"}' \
  --max-time 120
```

## Phase 3 Complete (Frontend Scaffold & Integration)
The Phase 3 frontend has been successfully built and connected to the backend.

### Full list of pages and components created:
**Pages:**
- `LandingPage.jsx`: Hero, features, comparison, and CTA.
- `SignInPage.jsx` & `SignUpPage.jsx`: Clerk UI for authentication.
- `OnboardingPage.jsx`: 3-step wizard (Watchlist, Preferences).
- `DashboardPage.jsx`: Recent briefs overview.
- `BriefGeneratorPage.jsx`: New brief creation with length and sections.
- `BriefDisplayPage.jsx`: Tab/Card views for generated briefs, feedback, save, and share functionality.
- `SharePage.jsx`: Public read-only view for shared briefs.
- `HistoryPage.jsx`: Detailed list of all briefs with search and filter.
- `SettingsPage.jsx`: Account settings, preferences, and delete account.

**Components:**
- `Layout.jsx`: Responsive shell with sidebar, top nav, and mobile bottom nav.
- `WatchlistSidebar.jsx`: Quick access to pinned companies.
- `ProtectedRoute.jsx`: Clerk auth wrapper for restricted routes.
- `RateLimitModal.jsx`: Rate-limit warning UI.
- `CommandPalette.jsx`: Global search and command execution (⌘K).
- `PWAInstallPrompt.jsx`: Prompt for users to install the app as a PWA.

### Routing Structure:
- `/` -> LandingPage (Public)
- `/sign-in`, `/sign-up` -> Auth flows (Public)
- `/brief/share/:token` -> SharePage (Public)
- `/onboarding` -> OnboardingPage (Protected)
- `/dashboard` -> DashboardPage (Protected)
- `/brief/new` -> BriefGeneratorPage (Protected)
- `/brief/:id` -> BriefDisplayPage (Protected)
- `/history` -> HistoryPage (Protected)
- `/settings` -> SettingsPage (Protected)

### State Management (Zustand Stores):
- `authStore.js`: Syncs custom DB user profile with Clerk user.
- `briefStore.js`: Handles brief generation UI state.
- `prefsStore.js`: Persisted UI preferences (theme, default views).

### Clerk Auth Flow Description:
Users log in/sign up via Clerk UI components. A global token exposer (`ClerkTokenExposer` in `main.jsx`) grabs the JWT and attaches it to the Axios interceptor in `api.js`. The backend validates this token in `_get_current_user()` and matches/creates a User record via the `clerk_user_id`.

### Frontend Environment Variables:
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk Frontend API key
- `VITE_API_URL`: Backend URL (http://localhost:5001)

### Status:
- The `X-Test-User-Email` test bypass in `backend/app.py` has been fully removed.
- End-to-end functionality (Auth -> Generate -> Display) is working correctly.

### What is NOT yet built (Phase 4 polish items):
- Complex/Real-time socket updates for brief generation (currently relies on static frontend timer).
- Integration for Pro Tier billing (Stripe).
- Webhook endpoints to handle Clerk updates/deletions robustly.
- Calendar integrations for automated event-based triggers.
