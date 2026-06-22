import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_API_KEY_2 = os.getenv("GROQ_API_KEY_2", "")
    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
    RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")  # Optional — only needed for scheduled email delivery
    CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
    CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY")
    # JWKS URL for Clerk token verification.
    # Find it at: Clerk Dashboard → API Keys → Advanced → JWKS URL
    # Format: https://<your-clerk-domain>/.well-known/jwks.json
    CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")
    CRON_SECRET = os.getenv("CRON_SECRET")
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        if os.path.exists("/data"):
            DATABASE_URL = "sqlite:////data/pitchpulse.db"
        else:
            DATABASE_URL = "sqlite:///pitchpulse.db"
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", 24))
    CREWAI_TRACING_ENABLED = os.getenv("CREWAI_TRACING_ENABLED", "false").lower() == "true"
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")

    @classmethod
    def validate(cls):
        required_keys = [
            "GROQ_API_KEY", "TAVILY_API_KEY",
            "CLERK_SECRET_KEY", "CRON_SECRET", "SECRET_KEY"
        ]
        for key in required_keys:
            if not getattr(cls, key):
                print(f"WARNING: Missing required environment variable {key}")

        if not cls.CLERK_JWKS_URL:
            print("WARNING: CLERK_JWKS_URL not set — JWT signature verification is DISABLED. "
                  "Set it to https://<your-clerk-domain>/.well-known/jwks.json for production security.")
        if not cls.RESEND_API_KEY:
            print("INFO: RESEND_API_KEY not set — scheduled brief emails will be skipped.")
