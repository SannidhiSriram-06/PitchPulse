import os
from flask_sqlalchemy import SQLAlchemy
from config import Config

db = SQLAlchemy()

def init_db(app):
    db_url = Config.DATABASE_URL
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        # Log host info safely without passwords
        safe_url = db_url.split("@")[-1] if "@" in db_url else db_url
        print(f"[PitchPulse] Connecting to PostgreSQL database: {safe_url}")
    else:
        print(f"[PitchPulse] WARNING: DATABASE_URL not set. Falling back to SQLite: {db_url}")
        
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    db.init_app(app)
    
    with app.app_context():
        import models
        db.create_all()
        try:
            db.session.execute(db.text("ALTER TABLE scheduled_brief ADD COLUMN prompt TEXT"))
            db.session.commit()
        except Exception:
            db.session.rollback()
