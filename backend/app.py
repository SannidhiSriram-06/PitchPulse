import os
import json
import time
import secrets
import re
import unicodedata
from datetime import datetime, timezone, timedelta
from functools import wraps, lru_cache
import jwt
import requests
from flask import Flask, request, jsonify, g, current_app
from flask_cors import CORS
from config import Config
from database import init_db, db
from models import User, Brief, Watchlist, ScheduledBrief
from agents import run_brief
from scheduler import check_and_run_due_briefs
import tools


def utc_iso(dt):
    if not dt:
        return None
    if dt.tzinfo is None:
        return f"{dt.isoformat()}Z"
    return dt.isoformat()


# ── JWKS caching ──────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_clerk_jwks():
    """Fetch and cache Clerk's JWKS public keys. Cached for the process lifetime."""
    resp = requests.get(Config.CLERK_JWKS_URL, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _verify_clerk_token(token):
    """
    Verify a Clerk-issued RS256 JWT.
    Falls back to no-signature-check when CLERK_JWKS_URL is not configured
    (development only — never acceptable in production).
    """
    if not Config.CLERK_JWKS_URL:
        # ⚠️  DEV FALLBACK — set CLERK_JWKS_URL in production
        decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["RS256"])
        return decoded

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        jwks = _get_clerk_jwks()
        key_data = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                key_data = key
                break

        if not key_data:
            # Key not found — JWKS may have rotated; bust cache and retry once
            _get_clerk_jwks.cache_clear()
            jwks = _get_clerk_jwks()
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    key_data = key
                    break

        if not key_data:
            raise Exception("Public key not found in JWKS")

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key_data))
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_exp": True}
        )
        return decoded

    except Exception as e:
        raise Exception(f"Token verification failed: {e}")


def create_app():
    app = Flask(__name__)
    Config.validate()

    origins = Config.FRONTEND_URL if os.getenv("FLASK_ENV", "development") == "production" else "*"
    CORS(app, origins=origins)

    init_db(app)

    # ── Rate limiting ──────────────────────────────────────────────────────────

    def _check_and_increment_rate_limit(user):
        """
        Returns (can_run, reset_in_minutes, hour_window_start_iso).
        Does NOT commit — caller must commit after a successful generation.
        """
        now = datetime.now(timezone.utc)
        hour_window_start = user.hour_window_start
        if hour_window_start and not hour_window_start.tzinfo:
            hour_window_start = hour_window_start.replace(tzinfo=timezone.utc)
        elif not hour_window_start:
            hour_window_start = now
            user.hour_window_start = now

        window_elapsed = now - hour_window_start
        if window_elapsed.total_seconds() > 3600:
            user.briefs_used_this_hour = 0
            user.hour_window_start = now
            hour_window_start = now
            window_elapsed = timedelta(0)

        if user.tier == 'free' and user.briefs_used_this_hour >= 3:
            reset_in_minutes = max(1, 60 - int(window_elapsed.total_seconds() / 60))
            reset_at = (hour_window_start + timedelta(hours=1)).isoformat()
            return False, reset_in_minutes, reset_at

        # Do NOT commit here — increment after successful generation
        return True, None, hour_window_start.isoformat()

    # ── Input sanitization ─────────────────────────────────────────────────────

    def _sanitize_company(name):
        """
        Sanitize company name. Allows Unicode letters/numbers plus common
        punctuation. Returns None for empty or clearly malicious input.
        """
        if not name or not name.strip():
            return None
        # Normalize unicode (NFC) and strip surrounding whitespace
        name = unicodedata.normalize("NFC", name.strip())[:120]
        # Allow Unicode word chars, spaces, and common company punctuation
        # Reject if it contains SQL/script injection patterns
        if re.search(r"[<>{}\[\];\"\\]", name):
            return None
        # Must contain at least one letter (Unicode)
        if not re.search(r"[^\W\d_]", name, re.UNICODE):
            return None
        return name

    # ── Auth ──────────────────────────────────────────────────────────────────

    def _get_current_user():
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise Exception("Please login to continue")

        token = auth_header.split(" ")[1]
        try:
            decoded = _verify_clerk_token(token)
            clerk_user_id = decoded.get("sub")
            email = decoded.get("email")
            if not clerk_user_id:
                raise Exception("Please login to continue")

            user = User.query.filter_by(clerk_user_id=clerk_user_id).first()
            is_new = False
            if not user:
                email = email or f"{clerk_user_id}@placeholder.com"
                user = User(clerk_user_id=clerk_user_id, email=email)
                db.session.add(user)
                db.session.commit()
                is_new = True

            if is_new:
                # Fire-and-forget welcome email (non-blocking)
                try:
                    from email_service import send_welcome_email
                    send_welcome_email(user.email, user.display_name)
                except Exception as e:
                    print(f"[PitchPulse] Welcome email failed (non-fatal): {e}")

            return user
        except Exception as e:
            raise Exception("Please login to continue")

    def require_auth(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                user = _get_current_user()
            except Exception as e:
                return jsonify({"error": str(e)}), 401
            g.current_user = user
            return f(*args, **kwargs)
        return decorated

    # ── Routes ────────────────────────────────────────────────────────────────

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "2.1"
        })

    @app.route('/api/stock', methods=['GET'])
    @require_auth
    def get_stock_data():
        company_name = request.args.get('company')
        if not company_name:
            return jsonify({"error": "company query parameter is required"}), 400

        # Hardcoded ticker map — avoids Yahoo Finance lookup failures for common companies
        _TICKER_MAP = {
            "nvidia": "NVDA", "apple": "AAPL", "microsoft": "MSFT", "google": "GOOGL",
            "alphabet": "GOOGL", "amazon": "AMZN", "meta": "META", "facebook": "META",
            "tesla": "TSLA", "netflix": "NFLX", "salesforce": "CRM", "adobe": "ADBE",
            "oracle": "ORCL", "intel": "INTC", "amd": "AMD", "qualcomm": "QCOM",
            "broadcom": "AVGO", "tsmc": "TSM", "ibm": "IBM", "cisco": "CSCO",
            "palantir": "PLTR", "snowflake": "SNOW", "uber": "UBER", "lyft": "LYFT",
            "airbnb": "ABNB", "doordash": "DASH", "shopify": "SHOP", "paypal": "PYPL",
            "spotify": "SPOT", "zoom": "ZM", "servicenow": "NOW", "workday": "WDAY",
            "hubspot": "HUBS", "twilio": "TWLO", "coinbase": "COIN", "robinhood": "HOOD",
            "jpmorgan": "JPM", "jp morgan": "JPM", "goldman sachs": "GS",
            "bank of america": "BAC", "wells fargo": "WFC", "boeing": "BA",
            "ford": "F", "general motors": "GM", "walmart": "WMT", "target": "TGT",
            "costco": "COST", "nike": "NKE", "disney": "DIS", "pfizer": "PFE",
            "moderna": "MRNA", "infosys": "INFY", "tata consultancy": "TCS.NS",
            "wipro": "WIT", "hcl technologies": "HCLTECH.NS", "reliance": "RELIANCE.NS",
        }
        _PRIVATE = {"openai", "anthropic", "stripe", "spacex", "databricks", "bytedance"}

        try:
            import yfinance as yf
            import httpx

            key = company_name.strip().lower()

            # 1. Check private-company list first
            if key in _PRIVATE:
                return jsonify({"error": f"{company_name} is a private company — no public stock data"}), 404

            # 2. Hardcoded map for the most common names (instant)
            ticker_symbol = _TICKER_MAP.get(key)

            # 3. yfinance built-in Search — handles Yahoo auth/cookies automatically
            if not ticker_symbol:
                try:
                    search = yf.Search(company_name, max_results=5, enable_fuzzy_query=True)
                    for q in (search.quotes or []):
                        # Prefer US equity, skip ETFs/funds/indices
                        if q.get("quoteType") == "EQUITY" and "." not in q.get("symbol", "."):
                            ticker_symbol = q["symbol"]
                            break
                    # Fallback: take first equity of any exchange
                    if not ticker_symbol:
                        for q in (search.quotes or []):
                            if q.get("quoteType") == "EQUITY":
                                ticker_symbol = q["symbol"]
                                break
                except Exception as search_err:
                    print(f"[PitchPulse] yf.Search failed: {search_err}")

            # 4. Raw Yahoo Finance API fallback (query1 → query2)
            if not ticker_symbol:
                for host in ["query1", "query2"]:
                    try:
                        headers = {
                            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                            "Accept": "application/json, */*",
                            "Accept-Language": "en-US,en;q=0.9",
                            "Referer": "https://finance.yahoo.com/",
                        }
                        search_url = (
                            f"https://{host}.finance.yahoo.com/v1/finance/search"
                            f"?q={httpx.utils.quote(company_name)}&quotesCount=5&newsCount=0"
                        )
                        r = httpx.get(search_url, headers=headers, timeout=8.0)
                        if r.status_code == 200:
                            for q in r.json().get("quotes", []):
                                if q.get("quoteType") == "EQUITY":
                                    ticker_symbol = q["symbol"]
                                    break
                        if ticker_symbol:
                            break
                    except Exception:
                        continue

            if not ticker_symbol:
                return jsonify({"error": f"No public stock ticker found for '{company_name}'. Try searching by ticker symbol instead (e.g. 'TXN' for Texas Instruments)."}), 404

            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period="1mo")
            if hist.empty:
                return jsonify({"error": "No historical stock data available"}), 404

            points = []
            for date, row in hist.iterrows():
                close_val = row.get("Close")
                if close_val is not None and not (isinstance(close_val, float) and close_val != close_val):
                    points.append({
                        "date": date.strftime("%Y-%m-%d"),
                        "close": round(float(close_val), 2)
                    })

            # Guard against empty points (NaN-only history)
            if not points:
                return jsonify({"error": "No valid historical stock data available"}), 404

            info = {}
            try:
                ticker_info = ticker.info
                current_price = ticker_info.get("currentPrice") or points[-1]["close"]
                change_pct = ticker_info.get("regularMarketChangePercent") or (
                    (points[-1]["close"] - points[0]["close"]) / points[0]["close"] * 100
                )
                info = {
                    "symbol": ticker_symbol,
                    "company_name": ticker_info.get("longName") or ticker_info.get("shortName") or company_name,
                    "currency": ticker_info.get("currency") or "USD",
                    "current_price": round(float(current_price), 2),
                    "change_percent": round(float(change_pct), 2)
                }
            except Exception:
                info = {
                    "symbol": ticker_symbol,
                    "company_name": company_name,
                    "currency": "USD",
                    "current_price": points[-1]["close"],
                    "change_percent": round(
                        (points[-1]["close"] - points[0]["close"]) / points[0]["close"] * 100, 2
                    )
                }

            return jsonify({
                "ticker": ticker_symbol,
                "info": info,
                "history": points
            })

        except Exception as e:
            print(f"Error fetching stock data: {e}")
            return jsonify({"error": f"Failed to fetch stock data: {str(e)}"}), 500

    @app.route('/api/extract-pdf', methods=['POST'])
    @require_auth
    def extract_pdf():
        import io
        # Debug: log what files/form arrived
        print(f"[PDF] files keys: {list(request.files.keys())}, form keys: {list(request.form.keys())}, content_type: {request.content_type}")

        if 'file' not in request.files:
            return jsonify({'error': 'No file received — ensure multipart/form-data with field name "file"'}), 400

        file = request.files['file']
        filename = (file.filename or '').lower()
        if not filename.endswith('.pdf'):
            return jsonify({'error': f'Only PDF files are supported (got: {file.filename})'}), 400

        # Read into memory first — Werkzeug FileStorage streams can confuse PyPDF2
        raw = file.read()
        if len(raw) > 5 * 1024 * 1024:
            return jsonify({'error': 'File too large (max 5MB)'}), 400
        if len(raw) == 0:
            return jsonify({'error': 'Empty file received'}), 400

        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(raw))
            text_parts = []
            for page in reader.pages[:30]:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
            text = '\n'.join(text_parts).strip()
            print(f"[PDF] Extracted {len(text)} chars from {len(reader.pages)} pages")
            if not text:
                return jsonify({'error': 'Could not extract text — PDF may be scanned or image-only'}), 400
            return jsonify({'text': text[:8000], 'pages': len(reader.pages)})
        except ImportError:
            return jsonify({'error': 'PyPDF2 not installed on server — run: pip install PyPDF2'}), 501
        except Exception as e:
            print(f"[PDF] Extraction error: {type(e).__name__}: {e}")
            return jsonify({'error': f'Failed to parse PDF: {str(e)}'}), 500

    @app.route('/api/brief', methods=['POST'])
    @require_auth
    def generate_brief():
        user = g.current_user

        data = request.json or {}

        # Accept either 'query' (new unified input) or legacy 'company_name'
        raw_query = data.get("query") or data.get("company_name") or ""
        if not raw_query.strip():
            return jsonify({"error": "Please describe what you want to research"}), 400

        from agents import extract_company_and_context
        extracted_company, extracted_context = extract_company_and_context(raw_query)

        company_name = _sanitize_company(extracted_company)
        if not company_name:
            # Last resort: try to use raw query as company name if short
            words = raw_query.strip().split()
            if len(words) <= 4:
                company_name = _sanitize_company(raw_query.strip())
        if not company_name:
            return jsonify({"error": "Couldn't identify a company in your query. Try: 'Research [Company], I'm pitching...'"}), 400

        length = data.get("length", user.default_brief_length or "medium")
        if length not in ("short", "medium", "long"):
            length = "medium"

        sections = data.get("sections", user.default_sections)
        if sections and isinstance(sections, str):
            try:
                sections = json.loads(sections)
            except Exception:
                pass

        # user_context comes from: (1) query-extracted context, (2) user profile default, (3) empty
        user_context = extracted_context or user.user_context or ""
        pdf_context = (data.get("pdf_context") or "").strip()[:8000]
        model_id = data.get("model_id")
        deep_mind = bool(data.get("deep_mind", False))

        # Check rate limit BEFORE running (but don't commit increment yet)
        can_run, reset_in, hour_window_iso = _check_and_increment_rate_limit(user)
        if not can_run:
            return jsonify({
                "error": "Hourly limit reached. Upgrade to Pro for unlimited briefs.",
                "reset_in_minutes": reset_in,
                "reset_at": hour_window_iso
            }), 429

        start_time = time.time()
        try:
            brief_dict, total_search_results = run_brief(
                company_name, length, sections, user_context,
                model_id=model_id, deep_mind=deep_mind,
                full_query=raw_query, pdf_context=pdf_context
            )
            gen_time_ms = int((time.time() - start_time) * 1000)

            if total_search_results == 0:
                return jsonify({
                    "error": "Couldn't find data on this company. Try a larger, publicly known company."
                }), 400

            limited_data = total_search_results < 3
            brief_dict["generated_at"] = datetime.now(timezone.utc).isoformat()

            sections_str = json.dumps(sections) if sections else None

            brief = Brief(
                user_id=user.id,
                company_name=company_name,
                brief_json=json.dumps(brief_dict),
                length_used=length,
                sections_used=sections_str,
                generation_time_ms=gen_time_ms,
                limited_data=limited_data
            )
            db.session.add(brief)

            # Update watchlist last_briefed_at if applicable
            watchlist_entry = Watchlist.query.filter_by(
                user_id=user.id, company_name=company_name
            ).first()
            if watchlist_entry:
                watchlist_entry.last_briefed_at = datetime.now(timezone.utc)

            # ✅ Only increment rate limit counter on successful generation
            user.briefs_used_this_hour += 1
            if not user.hour_window_start:
                user.hour_window_start = datetime.now(timezone.utc)

            db.session.commit()

            briefs_remaining = max(0, 3 - user.briefs_used_this_hour) if user.tier == 'free' else 999
            # Calculate exact reset time for the frontend widget
            hw = user.hour_window_start
            if hw and not hw.tzinfo:
                hw = hw.replace(tzinfo=timezone.utc)
            reset_at = (hw + timedelta(hours=1)).isoformat() if hw else None

            return jsonify({
                "id": brief.id,
                "company_name": brief.company_name,
                "brief": brief_dict,
                "limited_data": limited_data,
                "generation_time_ms": gen_time_ms,
                "briefs_remaining_this_hour": briefs_remaining,
                "reset_at": reset_at
            })

        except Exception as e:
            print(f"Error generating brief: {e}")
            return jsonify({"error": f"Generation failed: {str(e)}"}), 500

    @app.route('/api/briefs', methods=['GET'])
    @require_auth
    def get_briefs():
        search = request.args.get('search', '')
        saved_str = request.args.get('saved')
        limit = min(request.args.get('limit', 20, type=int), 100)
        offset = request.args.get('offset', 0, type=int)

        query = Brief.query.filter_by(user_id=g.current_user.id)
        if search:
            query = query.filter(Brief.company_name.ilike(f"%{search}%"))
        # Only apply saved filter when explicitly requested
        if saved_str is not None and saved_str != '':
            query = query.filter_by(saved=(saved_str.lower() == "true"))

        total = query.count()
        briefs = query.order_by(Brief.created_at.desc()).limit(limit).offset(offset).all()

        result = []
        for b in briefs:
            try:
                b_json = json.loads(b.brief_json)
                preview = b_json.get("summary", {}).get("content", "")[:120]
            except Exception:
                preview = ""
            result.append({
                "id": b.id,
                "company_name": b.company_name,
                "created_at": utc_iso(b.created_at),
                "length_used": b.length_used,
                "saved": b.saved,
                "limited_data": b.limited_data,
                "preview": preview
            })

        return jsonify({"briefs": result, "total": total})

    @app.route('/api/briefs/<int:brief_id>', methods=['GET'])
    @require_auth
    def get_brief(brief_id):
        brief = Brief.query.get_or_404(brief_id)
        if brief.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        return jsonify({
            "id": brief.id,
            "company_name": brief.company_name,
            "brief": json.loads(brief.brief_json),
            "length_used": brief.length_used,
            "sections_used": json.loads(brief.sections_used) if brief.sections_used else None,
            "saved": brief.saved,
            "feedback": json.loads(brief.feedback) if brief.feedback else None,
            "generation_time_ms": brief.generation_time_ms,
            "limited_data": brief.limited_data,
            "share_token": brief.share_token,
            "created_at": utc_iso(brief.created_at)
        })

    @app.route('/api/briefs/<int:brief_id>/save', methods=['PATCH'])
    @require_auth
    def toggle_save_brief(brief_id):
        brief = Brief.query.get_or_404(brief_id)
        if brief.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        brief.saved = not brief.saved
        db.session.commit()
        return jsonify({"saved": brief.saved})

    @app.route('/api/briefs/<int:brief_id>', methods=['DELETE'])
    @require_auth
    def delete_brief(brief_id):
        brief = Brief.query.get_or_404(brief_id)
        if brief.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        db.session.delete(brief)
        db.session.commit()
        return jsonify({"message": "Deleted"})

    @app.route('/api/briefs/<int:brief_id>/feedback', methods=['POST'])
    @require_auth
    def add_brief_feedback(brief_id):
        brief = Brief.query.get_or_404(brief_id)
        if brief.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.json or {}
        section = data.get("section")
        rating = data.get("rating")

        if not section or rating not in ('up', 'down', None):
            return jsonify({"error": "section required; rating must be 'up', 'down', or null"}), 400

        feedback_dict = {}
        if brief.feedback:
            try:
                feedback_dict = json.loads(brief.feedback)
            except Exception:
                pass

        if rating is None:
            # Toggle off — remove feedback for this section
            feedback_dict.pop(section, None)
        else:
            feedback_dict[section] = rating

        brief.feedback = json.dumps(feedback_dict)
        db.session.commit()
        return jsonify({"message": "Feedback recorded", "feedback": feedback_dict})

    @app.route('/api/briefs/<int:brief_id>/share', methods=['POST'])
    @require_auth
    def share_brief(brief_id):
        brief = Brief.query.get_or_404(brief_id)
        if brief.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        if not brief.share_token:
            brief.share_token = secrets.token_urlsafe(32)
            db.session.commit()

        return jsonify({
            "share_url": f"{Config.FRONTEND_URL}/brief/share/{brief.share_token}"
        })

    @app.route('/api/briefs/<int:brief_id>/email', methods=['POST'])
    @require_auth
    def email_brief(brief_id):
        brief = Brief.query.get_or_404(brief_id)
        if brief.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        from email_service import send_manual_brief
        success = send_manual_brief(
            to_email=g.current_user.email,
            display_name=g.current_user.display_name,
            company_name=brief.company_name,
            brief_dict=json.loads(brief.brief_json)
        )
        if success:
            return jsonify({"message": "Email sent successfully"})
        else:
            return jsonify({"error": "Failed to send email"}), 500

    @app.route('/api/share/<token>', methods=['GET'])
    def get_shared_brief(token):
        brief = Brief.query.filter_by(share_token=token).first_or_404()
        return jsonify({
            "company_name": brief.company_name,
            "brief": json.loads(brief.brief_json),
            "generation_time_ms": brief.generation_time_ms,
            "created_at": utc_iso(brief.created_at)
        })

    @app.route('/api/watchlist', methods=['GET'])
    @require_auth
    def get_watchlist():
        items = Watchlist.query.filter_by(
            user_id=g.current_user.id
        ).order_by(Watchlist.added_at.desc()).all()
        return jsonify({"watchlist": [{
            "id": i.id,
            "company_name": i.company_name,
            "folder_tag": i.folder_tag,
            "user_notes": i.user_notes,
            "default_length": i.default_length,
            "last_briefed_at": utc_iso(i.last_briefed_at),
            "added_at": utc_iso(i.added_at)
        } for i in items]})

    @app.route('/api/watchlist', methods=['POST'])
    @require_auth
    def add_to_watchlist():
        count = Watchlist.query.filter_by(user_id=g.current_user.id).count()
        if count >= 50:
            return jsonify({"error": "Watchlist limit (50) reached"}), 400

        data = request.json or {}
        raw_company_name = data.get("company_name")
        if not raw_company_name:
            return jsonify({"error": "company_name required"}), 400

        company_name = _sanitize_company(raw_company_name)
        if not company_name:
            return jsonify({"error": "Invalid company name"}), 400

        existing = Watchlist.query.filter_by(
            user_id=g.current_user.id, company_name=company_name
        ).first()
        if existing:
            return jsonify({"error": "Already in watchlist", "id": existing.id}), 409

        item = Watchlist(
            user_id=g.current_user.id,
            company_name=company_name,
            folder_tag=data.get("folder_tag"),
            user_notes=data.get("user_notes")
        )
        db.session.add(item)
        db.session.commit()
        return jsonify({"id": item.id})

    @app.route('/api/watchlist/<int:item_id>', methods=['DELETE'])
    @require_auth
    def remove_from_watchlist(item_id):
        item = Watchlist.query.get_or_404(item_id)
        if item.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Removed"})

    @app.route('/api/watchlist/<int:item_id>', methods=['PATCH'])
    @require_auth
    def update_watchlist_item(item_id):
        item = Watchlist.query.get_or_404(item_id)
        if item.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.json or {}
        if "folder_tag" in data:
            item.folder_tag = data["folder_tag"]
        if "user_notes" in data:
            item.user_notes = data["user_notes"]
        if "default_length" in data:
            item.default_length = data["default_length"]
        if "default_sections" in data:
            item.default_sections = json.dumps(data["default_sections"])

        db.session.commit()
        return jsonify({"message": "Updated"})

    @app.route('/api/scheduled', methods=['GET'])
    @require_auth
    def get_scheduled():
        items = ScheduledBrief.query.filter_by(user_id=g.current_user.id).order_by(
            ScheduledBrief.scheduled_for.asc()
        ).all()
        return jsonify([{
            "id": i.id,
            "company_name": i.company_name,
            "prompt": i.prompt,
            "scheduled_for": utc_iso(i.scheduled_for),
            "recurring": i.recurring,
            "length": i.length,
            "status": i.status,
            "last_run_at": utc_iso(i.last_run_at),
            "brief_id": i.brief_id
        } for i in items])

    @app.route('/api/scheduled', methods=['POST'])
    @require_auth
    def add_scheduled():
        data = request.json or {}
        raw_dt = data.get("scheduled_for")
        if not raw_dt:
            return jsonify({"error": "scheduled_for is required"}), 400

        try:
            # Robust ISO parsing — handle Z suffix and various offset formats
            raw_dt = str(raw_dt).strip()
            raw_dt = raw_dt.replace("Z", "+00:00")
            scheduled_for = datetime.fromisoformat(raw_dt)
        except ValueError:
            return jsonify({
                "error": "Invalid scheduled_for format. Use ISO 8601 (e.g. 2026-06-08T14:30:00Z)"
            }), 400

        # Normalise to UTC
        if scheduled_for.tzinfo:
            scheduled_for = scheduled_for.astimezone(timezone.utc).replace(tzinfo=timezone.utc)
        else:
            scheduled_for = scheduled_for.replace(tzinfo=timezone.utc)

        if scheduled_for <= datetime.now(timezone.utc):
            return jsonify({"error": "scheduled_for must be in the future"}), 400

        recurring = data.get("recurring")
        if recurring not in [None, "daily", "weekly"]:
            return jsonify({"error": "Invalid recurring value. Must be null, 'daily', or 'weekly'"}), 400

        prompt = data.get("prompt", "")
        company_name = data.get("company_name", "")

        if prompt.strip():
            from agents import extract_company_and_context
            extracted_company, extracted_context = extract_company_and_context(prompt)
            sanitized_company = _sanitize_company(extracted_company)
            if not sanitized_company:
                words = prompt.strip().split()
                if len(words) <= 4:
                    sanitized_company = _sanitize_company(prompt.strip())
            if not sanitized_company:
                return jsonify({"error": "Couldn't identify a company in your prompt. E.g. 'Research Nvidia...'"}), 400
            company_name = sanitized_company
        else:
            company_name = _sanitize_company(company_name)

        if not company_name:
            return jsonify({"error": "Invalid company_name or prompt"}), 400

        sections = data.get("sections")
        sb = ScheduledBrief(
            user_id=g.current_user.id,
            company_name=company_name,
            prompt=prompt or None,
            scheduled_for=scheduled_for,
            recurring=recurring,
            length=data.get("length", "medium"),
            sections=json.dumps(sections) if sections else None
        )
        db.session.add(sb)
        db.session.commit()
        return jsonify({"id": sb.id}), 201

    @app.route('/api/scheduled/<int:item_id>', methods=['DELETE'])
    @require_auth
    def remove_scheduled(item_id):
        item = ScheduledBrief.query.get_or_404(item_id)
        if item.user_id != g.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        # Allow deleting any status — completed items are just records
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Deleted"})

    @app.route('/api/cron/process-scheduled', methods=['POST'])
    def process_scheduled():
        secret = request.headers.get("X-Cron-Secret")
        if not secret or secret != Config.CRON_SECRET:
            return jsonify({"error": "Unauthorized"}), 401

        processed = check_and_run_due_briefs(current_app._get_current_object())
        return jsonify({
            "processed": processed,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    @app.route('/api/usage', methods=['GET'])
    @require_auth
    def get_usage():
        """Lightweight endpoint for real-time rate-limit polling (no DB writes)."""
        u = g.current_user
        now = datetime.now(timezone.utc)

        hw = u.hour_window_start
        if hw and not hw.tzinfo:
            hw = hw.replace(tzinfo=timezone.utc)
        elif not hw:
            hw = now

        # If the window already expired, compute as if it reset
        window_elapsed = (now - hw).total_seconds()
        if window_elapsed > 3600:
            # Window has passed — virtually reset (DB will catch up on next generate)
            used = 0
            reset_at = (now + timedelta(hours=1)).isoformat()
        else:
            used = u.briefs_used_this_hour or 0
            reset_at = (hw + timedelta(hours=1)).isoformat()

        limit = 3 if u.tier == 'free' else 999
        remaining = max(0, limit - used)
        seconds_to_reset = max(0, int(3600 - window_elapsed)) if window_elapsed <= 3600 else 3600

        return jsonify({
            "tier": u.tier,
            "limit": limit,
            "used": used,
            "remaining": remaining,
            "reset_at": reset_at,
            "seconds_to_reset": seconds_to_reset,
        })

    @app.route('/api/user/me', methods=['GET'])
    @require_auth
    def get_me():
        u = g.current_user
        briefs_remaining = max(0, 3 - u.briefs_used_this_hour) if u.tier == 'free' else 999
        hw = u.hour_window_start
        if hw and not hw.tzinfo:
            hw = hw.replace(tzinfo=timezone.utc)
        reset_at = (hw + timedelta(hours=1)).isoformat() if hw else None

        return jsonify({
            "id": u.id,
            "email": u.email,
            "display_name": u.display_name,
            "tier": u.tier,
            "timezone": u.timezone,
            "default_brief_length": u.default_brief_length,
            "default_sections": json.loads(u.default_sections) if u.default_sections else None,
            "user_context": u.user_context,
            "preferences": json.loads(u.preferences) if u.preferences else None,
            "briefs_used_this_hour": u.briefs_used_this_hour,
            "briefs_remaining_this_hour": briefs_remaining,
            "reset_at": reset_at
        })

    @app.route('/api/user/me', methods=['PATCH'])
    @require_auth
    def update_me():
        u = g.current_user
        data = request.json or {}
        if "display_name" in data:
            u.display_name = data["display_name"]
        if "timezone" in data:
            u.timezone = data["timezone"]
        if "default_brief_length" in data and data["default_brief_length"] in ("short", "medium", "long"):
            u.default_brief_length = data["default_brief_length"]
        if "default_sections" in data:
            u.default_sections = json.dumps(data["default_sections"])
        if "user_context" in data:
            u.user_context = data["user_context"]
        if "preferences" in data:
            current_prefs = json.loads(u.preferences) if u.preferences else {}
            current_prefs.update(data["preferences"])
            u.preferences = json.dumps(current_prefs)

        db.session.commit()
        return jsonify({"message": "Updated"})

    @app.route('/api/user/me', methods=['DELETE'])
    @require_auth
    def delete_me():
        db.session.delete(g.current_user)
        db.session.commit()
        return jsonify({"message": "Account deleted"})

    @app.route('/api/user/preferences', methods=['PATCH'])
    @require_auth
    def update_preferences():
        u = g.current_user
        data = request.json or {}
        current_prefs = json.loads(u.preferences) if u.preferences else {}

        allowed = {"theme", "default_view", "show_watchlist", "show_sources", "default_length"}
        for k in allowed:
            if k in data:
                current_prefs[k] = data[k]

        u.preferences = json.dumps(current_prefs)
        db.session.commit()
        return jsonify({"message": "Preferences updated"})

    return app


def start_scheduler_thread(app):
    import threading
    import time
    def run_scheduler_loop():
        print("[Scheduler] Background scheduler loop started")
        while True:
            try:
                from scheduler import check_and_run_due_briefs
                check_and_run_due_briefs(app)
            except Exception as e:
                print(f"[Scheduler] Loop error: {e}")
            time.sleep(30)
    thread = threading.Thread(target=run_scheduler_loop, daemon=True)
    thread.start()


app = create_app()

if __name__ == '__main__':
    if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_scheduler_thread(app)
    app.run(host='0.0.0.0', port=5001, debug=True)
