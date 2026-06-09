# PitchPulse AI — Full Codebase & Architecture Summary

PitchPulse is an AI-powered B2B pre-meeting sales intelligence tool. It enables sales professionals to type a single unified search query (e.g. *“Research Nvidia — pitching AI defect detection for GPU wafer fabs”*), optional PDF product context, and receive a comprehensive, structured pre-meeting brief in ~60 seconds containing live news, financial signals, competitor updates, and highly tailored talking points (HOOK, BRIDGE, and OPENER format).

This document serves as an exhaustive reference for the system’s architecture, backend capabilities, frontend components, database schemas, and implementation details.

---

## ── Tech Stack & Dependencies ──

### 1. Backend Layer (Python / Flask)
* **Framework**: Flask with CORS enabled (`flask-cors`).
* **Database & ORM**: SQLAlchemy (`flask-sqlalchemy`) with SQLite by default.
* **AI & Agentic Framework**: CrewAI with LiteLLM for multi-agent orchestration.
* **Authentication**: Clerk JWT token signature verification (using cached JWKS public keys).
* **External Integrations**:
  * **Tavily API** (`tavily-python`) for targeted web searches.
  * **Yahoo Finance API** (`yfinance` + raw HTTP fallbacks) for live market pricing, historical chart points (30 days), and financials.
  * **Resend API** (`resend`) for transactional emails (welcomes, scheduled briefs).
  * **PyPDF2** for client-side PDF product documentation parsing.
* **Rate Limiting**: Sliding hour window per user enforcing a limit of 3 briefs/hour for the free tier.

### 2. Frontend Layer (React / Vite)
* **State Management**: Zustand stores (`authStore`, `briefStore`, `prefsStore`).
* **Styling**: Tailwind CSS, Vanilla CSS (`index.css`), custom Google Fonts (Inter + Space Grotesk).
* **Animations**: Framer Motion for smooth micro-interactions, word reveals, layout transitions, and page load cascades.
* **Interactive Charts**: Custom SVG/Framer-based lightweight financial charts.
* **Auth**: Clerk React SDK (`@clerk/clerk-react`) for secure authentication flows.
* **Routing**: React Router DOM (`react-router-dom`) with client-side route protection.

---

## ── Directory Structure & File Map ──

```
Pitchpulse_Upgrade/
├── backend/
│   ├── app.py                # Main Flask app, API routes, Clerk auth, and rate-limiting
│   ├── agents.py             # CrewAI multi-agent crew, LLM key rotators, prompt templates
│   ├── tools.py              # Custom Tavily Web Search and yfinance lookup tools
│   ├── scheduler.py          # Due brief queue processor called via cron endpoint
│   ├── email_service.py      # Resend client setups and HTML newsletter-style email templates
│   ├── database.py           # SQLAlchemy database initialization utility
│   ├── models.py             # User, Brief, Watchlist, ScheduledBrief db entities
│   ├── config.py             # Environment configurations and validation logic
│   ├── requirements.txt      # Python package list
│   └── .env                  # Backend secret settings (API keys, secrets)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Routing configuration & global React setup
│   │   ├── main.jsx          # React DOM mounting and Clerk context provider wrapper
│   │   ├── index.css         # Typography, global scrollbars, theme styles, Apple squircles
│   │   ├── pages/            # View components corresponding to app routes
│   │   ├── components/       # Reusable UI widgets and layout shells
│   │   ├── store/            # Zustand store definitions for auth, briefs, and prefs
│   │   ├── hooks/            # Custom hooks (e.g. useTheme for system/light/dark state)
│   │   ├── lib/              # Client setups (axios interceptors, API defaults)
│   │   └── utils/            # Helper utils
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind theme customization
│   └── vite.config.js        # Vite build configurations and PWA manifest setups
│
├── context.md                # System metadata
├── fix this.md               # Known bug tracker / checklist
└── README.md                 # System overview (this document)
```

---

## ── Database Schema (`backend/models.py`) ──

PitchPulse utilizes four primary database tables. Foreign keys map back to the `User` model, with cascading deletions enabled.

```mermaid
erDiagram
    USER ||--o{ BRIEF : generates
    USER ||--o{ WATCHLIST : tracks
    USER ||--o{ SCHEDULED_BRIEF : schedules

    USER {
        int id PK
        string clerk_user_id UK
        string email UK
        string display_name
        string tier
        string timezone
        string default_brief_length
        text default_sections
        text user_context
        int briefs_used_this_hour
        datetime hour_window_start
        datetime created_at
    }

    BRIEF {
        int id PK
        int user_id FK
        string company_name
        text brief_json
        string length_used
        text sections_used
        boolean saved
        string share_token UK
        text feedback
        int generation_time_ms
        boolean limited_data
        datetime created_at
    }

    WATCHLIST {
        int id PK
        int user_id FK
        string company_name
        string folder_tag
        text user_notes
        string default_length
        text default_sections
        datetime last_briefed_at
        datetime added_at
    }

    SCHEDULED_BRIEF {
        int id PK
        int user_id FK
        string company_name
        datetime scheduled_for
        string recurring
        string length
        text sections
        string status
        datetime last_run_at
        int brief_id FK
        datetime created_at
    }
```

---

## ── Backend Implementation Details ──

### 1. Unified Authentication & Clerk Validation (`backend/app.py`)
Clerk handles identity provider processes. The backend validates Clerk tokens locally:
* Retrieves the Clerk JWKS key list from `CLERK_JWKS_URL` and caches it using `@lru_cache`.
* On encountering unknown kids (key IDs), it clears the cache and refetches keys once to support key rotations.
* Translates the signature verification claims to verify issuer correctness and expiration (`verify_exp: True`).
* Automatically registers unknown users inside SQLite with a placeholder fallback if the email is missing, immediately triggering a non-blocking welcome email.

### 2. Multi-Agent Synthesis Crew (`backend/agents.py`)
Brief generation is driven by **CrewAI**.
* **Key Rotator**: Implements a round-robin rotation between `GROQ_API_KEY` and `GROQ_API_KEY_2` to spread rate-limit quotas under load.
* **LLM Config**:
  * **Free models**: `meta-llama/llama-4-scout-17b-16e-instruct` (30K TPM limit) and `llama-3.3-70b-versatile` (12K TPM).
  * **Pro models**: `openai/gpt-oss-120b`, `qwen/qwen3-32b`, and `groq/compound-mini`.
* **Agents**:
  1. **Senior Company Intelligence Researcher**: Reads compiled search results and Yahoo Finance output, extracting strategic company developments, hiring cues, and news. Cites sources.
  2. **Strategic Sales Intelligence Analyst**: Contextualizes findings according to the sales rep's pitch. Formulates **Talking Points** consisting of:
     * **HOOK**: A verifiable fact, date, or number from the research data.
     * **BRIDGE**: How the rep's solution maps to that fact.
     * **OPENER**: The specific conversation opener text.
  3. **Pre-Meeting Brief Specialist**: Formats the synthesized outputs into a rigid, non-markdown-fenced JSON structure.
* **JSON Repair Engine**: Includes a regex and token counting parser (`_repair_truncated_json`, `_extract_json`) that dynamically appends missing bracket/brace closures if an LLM is cut off mid-response due to token caps.

### 3. Integrated Research Tools (`backend/tools.py`)
* **`company_web_search`**: Utilizes Tavily Advanced search to perform targeted crawls. Combines counts to monitor results.
* **`company_financial_data`**: Resolves the company name to a stock ticker using Yahoo Finance Search. On discovery, fetches TTM revenues, revenue growth YoY, market cap, full-time employees, margins, sector description, and business summaries.

### 4. Cron Scheduler (`backend/scheduler.py`)
* A POST endpoint (`/api/cron/process-scheduled`) is triggered periodically by an external cron worker. It checks the authorization header using `CRON_SECRET`.
* Selects all pending scheduled briefings whose `scheduled_for` timestamp is in the past (up to `now + 2 minutes`).
* Evaluates the hourly rate limits of the owner user. If a free user has exceeded their quota, the job is rescheduled for the start of their next hour window instead of failing.
* Executes `run_brief` in the background, generates a database record, emails the HTML copy to the user via Resend, and creates the next recurring entry (daily/weekly) if required.

---

## ── Frontend Pages & Features ──

### 1. Landing Page (`frontend/src/pages/LandingPage.jsx`)
* Combines visual showcases, scroll-driven stats grids, feature check comparisons, and the interactive `SideScrollFeatures` component.
* Uses `overflow-x: clip` rather than `overflow-x: hidden` to prevent breaking CSS `position: sticky` on nested sidebar child containers.

### 2. Dashboard (`frontend/src/pages/DashboardPage.jsx`)
* Shows the user's recent briefs with pagination and text-search filtering.
* Houses a folder-organized **Watchlist** sidebar widget, showcasing tracked companies, user notes, and a direct "Generate Brief" trigger.

### 3. Brief Generator (`frontend/src/pages/BriefGeneratorPage.jsx`)
* Provides a unified natural language chat bar for inputs.
* Supports **PDF context uploads** (up to 5MB) using PyPDF2 to extract details, passing it to the backend to constrain talking points.
* Includes configurable length controls (Short, Medium, Long) and a selection model picker.

### 4. Brief Viewer (`frontend/src/pages/BriefDisplayPage.jsx`)
* Features a modular panel displaying the generated company intelligence, news cards, financial metrics, and executive summaries.
* **Interactive Stock Chart**: Generates dynamic line charts from historical stock values, showing ticker names and market movements.
* **Talking Points**: Displays the HOOK, BRIDGE, and OPENER elements in interactive cards with feedback thumbs.
* **Sharing**: Generates unique public share links (`/brief/share/:token`) that bypass auth.

---

## ── Core Workflows ──

```mermaid
sequenceDiagram
    autonumber
    actor User as Sales Rep
    participant FE as React Frontend
    participant BE as Flask Backend
    participant LLM as Groq / LLaMA
    participant DB as SQLite DB

    User->>FE: Types query & uploads PDF
    FE->>FE: PyPDF2 extracts text from PDF
    FE->>BE: POST /api/brief (query, pdf_text)
    Note over BE: Verifies Clerk Token & Checks Quota
    BE->>LLM: extract_company_and_context()
    LLM-->>BE: Extracted Company & Pitch Context
    BE->>BE: Runs Tavily searches & Yahoo Finance
    BE->>LLM: Kicks off CrewAI (3 Agents)
    LLM-->>BE: Returns structured JSON brief
    BE->>DB: Saves Brief record
    BE-->>FE: Responds with Brief JSON data
    FE->>User: Displays streaming text cascade
```

---

## ── Environment Variable Configs ──

### Backend `.env`
```ini
GROQ_API_KEY=gsk_...           # Primary Groq API key
GROQ_API_KEY_2=gsk_...         # Secondary key for load rotation (optional)
TAVILY_API_KEY=tvly-...        # Tavily search credential
RESEND_API_KEY=re_...          # Resend email API key
CLERK_SECRET_KEY=sk_test_...   # Clerk secret
CLERK_PUBLISHABLE_KEY=pk_...   # Clerk public publishable key
CLERK_JWKS_URL=https://...     # Clerk JWKS endpoint
CRON_SECRET=super_secret_...   # Cron endpoint security key
SECRET_KEY=app_signing_...     # Flask session key
FRONTEND_URL=http://localhost:5173
DATABASE_URL=sqlite:///pitchpulse.db
FROM_EMAIL=onboarding@resend.dev
```

### Frontend `.env`
```ini
VITE_CLERK_PUBLISHABLE_KEY=pk_test_... # Clerk publishable key
VITE_API_URL=http://localhost:5000     # Flask backend endpoint
```
