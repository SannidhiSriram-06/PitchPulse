from datetime import datetime, timezone
from database import db

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
    hour_window_start = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Brief(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), index=True)
    company_name = db.Column(db.String(255), nullable=False)
    brief_json = db.Column(db.Text, nullable=False)
    length_used = db.Column(db.String(20), nullable=True)
    sections_used = db.Column(db.Text, nullable=True)
    saved = db.Column(db.Boolean, default=False)
    share_token = db.Column(db.String(64), nullable=True, unique=True, index=True)
    feedback = db.Column(db.Text, nullable=True)
    generation_time_ms = db.Column(db.Integer, nullable=True)
    limited_data = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Watchlist(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), index=True)
    company_name = db.Column(db.String(255), nullable=False)
    folder_tag = db.Column(db.String(100), nullable=True)
    user_notes = db.Column(db.Text, nullable=True)
    default_length = db.Column(db.String(20), nullable=True)
    default_sections = db.Column(db.Text, nullable=True)
    last_briefed_at = db.Column(db.DateTime, nullable=True)
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class ScheduledBrief(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), index=True)
    company_name = db.Column(db.String(255), nullable=False)
    prompt = db.Column(db.Text, nullable=True)
    scheduled_for = db.Column(db.DateTime, nullable=False)
    recurring = db.Column(db.String(50), nullable=True)
    length = db.Column(db.String(20), default='medium')
    sections = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')
    last_run_at = db.Column(db.DateTime, nullable=True)
    brief_id = db.Column(db.Integer, db.ForeignKey('brief.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class APICache(db.Model):
    key = db.Column(db.String(255), primary_key=True)
    value = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

