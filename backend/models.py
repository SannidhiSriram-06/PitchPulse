from datetime import datetime
from database import db

# DESIGN TOKENS
# Dark bg: #0C0C0C | Surface: #141414 | Surface raised: #1C1C1C
# Border: rgba(255,255,255,0.08) | Accent orange: #FF6B2C
# Light bg: #FAFAF8 | Light surface: #FFFFFF
# Font: Space Grotesk + Inter + Berkeley Mono

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    clerk_user_id = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    display_name = db.Column(db.String(255), nullable=True)
    tier = db.Column(db.String(20), default='free')
    timezone = db.Column(db.String(100), default='Asia/Kolkata')
    default_brief_length = db.Column(db.String(20), default='medium')
    default_sections = db.Column(db.Text, nullable=True)
    user_context = db.Column(db.Text, nullable=True)
    preferences = db.Column(db.Text, nullable=True)
    briefs_used_this_hour = db.Column(db.Integer, default=0)
    hour_window_start = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Brief(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'))
    company_name = db.Column(db.String(255), nullable=False)
    brief_json = db.Column(db.Text, nullable=False)
    length_used = db.Column(db.String(20), nullable=True)
    sections_used = db.Column(db.Text, nullable=True)
    saved = db.Column(db.Boolean, default=False)
    share_token = db.Column(db.String(64), nullable=True, unique=True)
    feedback = db.Column(db.Text, nullable=True)
    generation_time_ms = db.Column(db.Integer, nullable=True)
    limited_data = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Watchlist(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'))
    company_name = db.Column(db.String(255), nullable=False)
    folder_tag = db.Column(db.String(100), nullable=True)
    user_notes = db.Column(db.Text, nullable=True)
    default_length = db.Column(db.String(20), nullable=True)
    default_sections = db.Column(db.Text, nullable=True)
    last_briefed_at = db.Column(db.DateTime, nullable=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

class ScheduledBrief(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'))
    company_name = db.Column(db.String(255), nullable=False)
    scheduled_for = db.Column(db.DateTime, nullable=False)
    recurring = db.Column(db.String(50), nullable=True)
    length = db.Column(db.String(20), default='medium')
    sections = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')
    last_run_at = db.Column(db.DateTime, nullable=True)
    brief_id = db.Column(db.Integer, db.ForeignKey('brief.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
