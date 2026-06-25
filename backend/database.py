import os
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

from sqlalchemy.engine import Engine
from sqlalchemy import event

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if dbapi_connection.__class__.__name__ == 'Connection': # SQLite specific check fallback
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
        except Exception:
            pass
        finally:
            cursor.close()

def init_db(app):
    db_url = Config.DATABASE_URL
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    if db_url and db_url.startswith("postgresql://"):
        try:
            import socket
            from urllib.parse import urlparse, urlunparse
            parsed = urlparse(db_url)
            hostname = parsed.hostname
            if hostname:
                # Resolve hostname specifically to IPv4 address to bypass Render IPv6 issues
                ipv4_address = socket.getaddrinfo(hostname, None, socket.AF_INET)[0][4][0]
                # Reconstruct netloc with resolved IPv4 address
                port_str = f":{parsed.port}" if parsed.port else ""
                auth_str = ""
                if parsed.username:
                    auth_str = parsed.username
                    if parsed.password:
                        auth_str += f":{parsed.password}"
                    auth_str += "@"
                new_netloc = f"{auth_str}{ipv4_address}{port_str}"
                db_url = urlunparse(parsed._replace(netloc=new_netloc))
                print(f"[PitchPulse] Resolved db hostname '{hostname}' to IPv4 '{ipv4_address}'")
        except Exception as e:
            print(f"[PitchPulse] Database hostname IPv4 resolution failed: {e}")

        # Log host info safely without passwords
        safe_url = db_url.split("@")[-1] if "@" in db_url else db_url
        print(f"[PitchPulse] Connecting to PostgreSQL database: {safe_url}")
    else:
        print(f"[PitchPulse] WARNING: DATABASE_URL not set. Falling back to SQLite: {db_url}")
        
    if os.getenv("FLASK_ENV") == "production":
        if not os.getenv("DATABASE_URL") or "sqlite" in db_url.lower():
            raise RuntimeError("CRITICAL: DATABASE_URL environment variable must be set in production, and SQLite is not allowed.")

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_size": 10,
        "max_overflow": 5,
        "pool_recycle": 1800,
        "pool_pre_ping": True
    }
    
    db.init_app(app)
    
    with app.app_context():
        import models
        db.create_all()
        
        # Self-healing migrations using Inspector to avoid rolling back failed transactions
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        
        # Table scheduled_brief
        if inspector.has_table("scheduled_brief"):
            columns = [col["name"] for col in inspector.get_columns("scheduled_brief")]
            if "prompt" not in columns:
                try:
                    db.session.execute(db.text("ALTER TABLE scheduled_brief ADD COLUMN prompt TEXT"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            if "length" not in columns:
                try:
                    db.session.execute(db.text("ALTER TABLE scheduled_brief ADD COLUMN length VARCHAR(20)"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            if "sections" not in columns:
                try:
                    db.session.execute(db.text("ALTER TABLE scheduled_brief ADD COLUMN sections TEXT"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
                    
        # Table watchlist
        if inspector.has_table("watchlist"):
            columns = [col["name"] for col in inspector.get_columns("watchlist")]
            if "folder_tag" not in columns:
                try:
                    db.session.execute(db.text("ALTER TABLE watchlist ADD COLUMN folder_tag VARCHAR(100)"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            if "user_notes" not in columns:
                try:
                    db.session.execute(db.text("ALTER TABLE watchlist ADD COLUMN user_notes TEXT"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            if "default_length" not in columns:
                try:
                    db.session.execute(db.text("ALTER TABLE watchlist ADD COLUMN default_length VARCHAR(20)"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            if "default_sections" not in columns:
                try:
                    db.session.execute(db.text("ALTER TABLE watchlist ADD COLUMN default_sections TEXT"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            if "last_briefed_at" not in columns:
                try:
                    db.session.execute(db.text("ALTER TABLE watchlist ADD COLUMN last_briefed_at TIMESTAMP"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()

