import traceback
import json
import logging
from datetime import datetime, timedelta, timezone
from database import db
from models import ScheduledBrief, User, Brief
from agents import run_brief
from email_service import send_scheduled_brief

def check_and_run_due_briefs(app):
    with app.app_context():
        try:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            # Only upper bound — any pending task whose time has passed is eligible.
            # Removing the min_time lower bound prevents tasks from being permanently
            # lost when the cron trigger is delayed by more than a few minutes.
            max_time = now + timedelta(minutes=3)

            due_briefs = ScheduledBrief.query.filter(
                ScheduledBrief.status == 'pending',
                ScheduledBrief.scheduled_for <= max_time,
            ).all()

            processed_count = 0
            for sb in due_briefs:
                try:
                    sb.status = 'running'
                    db.session.commit()

                    user = User.query.get(sb.user_id)
                    if not user:
                        sb.status = 'failed'
                        db.session.commit()
                        continue

                    # Check and reset rate limit window
                    hour_window_start = user.hour_window_start
                    if hour_window_start and hour_window_start.tzinfo:
                        hour_window_start = hour_window_start.replace(tzinfo=None)
                    elif not hour_window_start:
                        hour_window_start = now

                    window_elapsed = now - hour_window_start
                    if window_elapsed.total_seconds() > 3600:
                        user.briefs_used_this_hour = 0
                        user.hour_window_start = now

                    if user.tier == 'free' and user.briefs_used_this_hour >= 3:
                        # Don't fail permanently — just reschedule for after the window resets
                        sb.status = 'pending'
                        sb.scheduled_for = hour_window_start + timedelta(hours=1, minutes=2)
                        db.session.commit()
                        logging.info(f"Rescheduled brief {sb.id} — rate limited, new time: {sb.scheduled_for}")
                        continue

                    # Run brief — only increment counter on success
                    sections = json.loads(sb.sections) if sb.sections else None
                    brief_dict, _ = run_brief(
                        sb.company_name,
                        sb.length,
                        sections,
                        user.user_context,
                        full_query=sb.prompt or sb.company_name
                    )

                    # Now increment the counter
                    user.briefs_used_this_hour += 1

                    new_brief = Brief(
                        user_id=user.id,
                        company_name=sb.company_name,
                        brief_json=json.dumps(brief_dict),
                        length_used=sb.length,
                        sections_used=sb.sections,
                        saved=False,
                        limited_data=False
                    )
                    db.session.add(new_brief)
                    db.session.flush()

                    sb.brief_id = new_brief.id

                    # Send email if available
                    if user.email:
                        try:
                            send_scheduled_brief(
                                user.email, user.display_name,
                                sb.company_name, brief_dict, sb.scheduled_for
                            )
                        except Exception as email_err:
                            logging.warning(f"Email send failed for brief {new_brief.id}: {email_err}")

                    sb.status = 'completed'
                    sb.last_run_at = now

                    # Queue next recurrence
                    if sb.recurring:
                        next_run = None
                        if sb.recurring == 'daily':
                            next_run = sb.scheduled_for + timedelta(days=1)
                        elif sb.recurring == 'weekly':
                            next_run = sb.scheduled_for + timedelta(weeks=1)

                        if next_run:
                            new_sb = ScheduledBrief(
                                user_id=sb.user_id,
                                company_name=sb.company_name,
                                scheduled_for=next_run,
                                recurring=sb.recurring,
                                length=sb.length,
                                sections=sb.sections
                            )
                            db.session.add(new_sb)

                    db.session.commit()
                    processed_count += 1

                except Exception as e:
                    logging.error(f"Error processing scheduled brief {sb.id}: {traceback.format_exc()}")
                    sb.status = 'failed'
                    try:
                        db.session.commit()
                    except Exception:
                        db.session.rollback()

            return processed_count

        except Exception as e:
            logging.error(f"Error in check_and_run_due_briefs: {traceback.format_exc()}")
            return 0
