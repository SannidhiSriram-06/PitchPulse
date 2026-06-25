import resend
from config import Config
from datetime import datetime, timezone

resend.api_key = Config.RESEND_API_KEY

def get_confidence_badge(confidence):
    if confidence == 'high':
        return '<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: #D4EDDA; color: #155724; margin-left: 8px;">HIGH CONFIDENCE</span>'
    elif confidence == 'medium':
        return '<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: #FFF3CD; color: #856404; margin-left: 8px;">MEDIUM CONFIDENCE</span>'
    elif confidence == 'low':
        return '<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: #F8D7DA; color: #721C24; margin-left: 8px;">LOW CONFIDENCE</span>'
    return ''

def _render_brief_html(company_name, brief_dict, reason_text):
    gen_time = brief_dict.get("generated_at", datetime.now(timezone.utc).isoformat())
    summary = brief_dict.get("summary", {}).get("content", "No summary available.")
    
    sections_html = ""
    
    tp = brief_dict.get("talking_points", {})
    tp_items = tp.get("items", [])
    if tp_items:
        confidence = tp.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">TALKING POINTS{badge}</h3>
            <ol style="color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
        """
        for item in tp_items:
            sections_html += f"<li style='margin-bottom: 8px;'><strong>{item.get('point', '')}</strong>: {item.get('why_it_matters', '')}</li>"
        sections_html += "</ol></div>"
        
    wo = brief_dict.get("watch_out_for", {})
    wo_items = wo.get("items", [])
    if wo_items:
        confidence = wo.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">WATCH OUT FOR{badge}</h3>
            <ul style="color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px; list-style-type: none;">
        """
        for item in wo_items:
            sections_html += f"<li style='margin-bottom: 8px;'>⚠️ <strong>{item.get('risk', '')}</strong>: {item.get('context', '')}</li>"
        sections_html += "</ul></div>"
        
    news = brief_dict.get("news", {})
    news_items = news.get("items", [])
    if news_items:
        confidence = news.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">RECENT NEWS{badge}</h3>
            <ul style="color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 0; list-style-type: none;">
        """
        for item in news_items:
            date_str = f" <span style='color: #888; font-size: 12px;'>({item.get('date', '')})</span>" if item.get('date') else ""
            sections_html += f"<li style='margin-bottom: 12px;'><strong>{item.get('headline', 'News Link')}</strong>{date_str}<br>{item.get('summary', '')}</li>"
        sections_html += "</ul></div>"

    financials = brief_dict.get("financials", {})
    financials_content = financials.get("content", "")
    financials_snapshot = financials.get("snapshot", {})
    if financials_content or financials_snapshot:
        confidence = financials.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">FINANCIALS{badge}</h3>
        """
        if financials_snapshot:
            sections_html += '<div style="margin-bottom: 12px;">'
            for k, v in financials_snapshot.items():
                if k != 'disclaimer' and v:
                    sections_html += f"""
                    <div style="display: inline-block; background-color: #f6f6f6; border-radius: 6px; padding: 6px 10px; margin-right: 8px; margin-bottom: 8px; vertical-align: top;">
                        <div style="font-size: 9px; color: #888; text-transform: uppercase; line-height: 1.2;">{k.replace('_', ' ')}</div>
                        <div style="font-size: 12px; font-weight: bold; color: #1A1A1A; line-height: 1.3;">{v}</div>
                    </div>
                    """
            sections_html += '</div>'
        if financials_content:
            sections_html += f"<p style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0;'>{financials_content}</p>"
        sections_html += "</div>"

    lc = brief_dict.get("leadership_changes", {})
    lc_items = lc.get("items", [])
    lc_content = lc.get("content", "")
    if lc_items or lc_content:
        confidence = lc.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">LEADERSHIP CHANGES{badge}</h3>
        """
        if lc_content:
            sections_html += f"<p style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin-bottom: 12px; margin-top: 0;'>{lc_content}</p>"
        if lc_items:
            sections_html += "<ul style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;'>"
            for item in lc_items:
                sections_html += f"<li style='margin-bottom: 8px;'><strong>{item.get('name', '')}</strong>: {item.get('role', '')} ({item.get('change', '')})</li>"
            sections_html += "</ul>"
        sections_html += "</div>"

    rl = brief_dict.get("recent_launches", {})
    rl_items = rl.get("items", [])
    rl_content = rl.get("content", "")
    if rl_items or rl_content:
        confidence = rl.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">RECENT LAUNCHES{badge}</h3>
        """
        if rl_content:
            sections_html += f"<p style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin-bottom: 12px; margin-top: 0;'>{rl_content}</p>"
        if rl_items:
            sections_html += "<ul style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;'>"
            for item in rl_items:
                sections_html += f"<li style='margin-bottom: 8px;'><strong>{item.get('name', '')}</strong>: {item.get('significance', '')}</li>"
            sections_html += "</ul>"
        sections_html += "</div>"

    ca = brief_dict.get("competitor_activity", {})
    ca_items = ca.get("items", [])
    ca_content = ca.get("content", "")
    if ca_items or ca_content:
        confidence = ca.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">COMPETITOR ACTIVITY{badge}</h3>
        """
        if ca_content:
            sections_html += f"<p style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin-bottom: 12px; margin-top: 0;'>{ca_content}</p>"
        if ca_items:
            sections_html += "<ul style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;'>"
            for item in ca_items:
                sections_html += f"<li style='margin-bottom: 8px;'><strong>{item.get('competitor', '')}</strong>: {item.get('action', '')} (Impact: {item.get('impact', '')})</li>"
            sections_html += "</ul>"
        sections_html += "</div>"

    ss = brief_dict.get("social_sentiment", {})
    ss_sentiment = ss.get("sentiment", "")
    ss_content = ss.get("content", "")
    if ss_sentiment or ss_content:
        confidence = ss.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">SOCIAL SENTIMENT{badge}</h3>
        """
        if ss_sentiment:
            sections_html += f"<p style='margin-bottom: 12px; font-size: 14px;'><strong>Public Sentiment:</strong> <span style='display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: #eee; color: #333;'>{ss_sentiment.upper()}</span></p>"
        if ss_content:
            sections_html += f"<p style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0;'>{ss_content}</p>"
        sections_html += "</div>"

    js = brief_dict.get("job_signals", {})
    js_items = js.get("items", [])
    js_content = js.get("content", "")
    if js_items or js_content:
        confidence = js.get("confidence", "high")
        badge = get_confidence_badge(confidence)
        sections_html += f"""
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">JOB SIGNALS{badge}</h3>
        """
        if js_content:
            sections_html += f"<p style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin-bottom: 12px; margin-top: 0;'>{js_content}</p>"
        if js_items:
            sections_html += "<ul style='color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;'>"
            for item in js_items:
                sections_html += f"<li style='margin-bottom: 8px;'><strong>{item.get('role', '')}</strong>: {item.get('signal', '')}</li>"
            sections_html += "</ul>"
        sections_html += "</div>"
    
    return f"""
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0C0C0C; padding: 24px; text-align: left;">
            <h2 style="color: #FF6B2C; margin: 0; font-size: 22px; font-weight: bold;">PitchPulse</h2>
            <div style="color: #888; font-size: 14px; margin-top: 4px;">Pre-Meeting Intelligence Brief</div>
        </div>
        
        <div style="background-color: #FAFAF8; padding: 32px;">
            <div style="background-color: #ffffff; border: 1px solid #E5E5E5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h1 style="color: #0C0C0C; margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">{company_name}</h1>
                <div style="color: #888; font-size: 13px;">Generated on {gen_time}</div>
            </div>
            
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0; margin-bottom: 12px;">SUMMARY</h3>
                <p style="color: #1A1A1A; font-size: 14px; line-height: 1.6; margin: 0;">{summary}</p>
            </div>
            
            {sections_html}
            
            <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
                <a href="{Config.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #FF6B2C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open in PitchPulse</a>
            </div>
            
            <div style="color: #888; font-size: 13px; text-align: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 24px;">
                Generated by PitchPulse AI<br>
                {reason_text}
            </div>
        </div>
    </div>
    """

def send_scheduled_brief(to_email, display_name, company_name, brief_dict, scheduled_for):
    if not resend.api_key:
        print("Warning: RESEND_API_KEY not set")
        return False
        
    try:
        html_content = _render_brief_html(
            company_name, 
            brief_dict, 
            "You received this because you scheduled a brief."
        )
        params = {
            "from": Config.FROM_EMAIL,
            "to": [to_email],
            "subject": f"Your {company_name} brief — ready for your meeting",
            "html": html_content
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending scheduled brief email: {e}")
        return False

def send_welcome_email(to_email, display_name):
    if not resend.api_key:
        return False
        
    try:
        if not display_name:
            display_name = "there"
            
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 20px;">
            <h2 style="color: #FF6B2C;">PitchPulse</h2>
            <p style="color: #0C0C0C;">Hi {display_name},</p>
            <p style="color: #0C0C0C;">Welcome to PitchPulse. We help you generate AI-powered pre-meeting sales intelligence briefs instantly.</p>
            <a href="{Config.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #FF6B2C; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
        </div>
        """
        params = {
            "from": Config.FROM_EMAIL,
            "to": [to_email],
            "subject": "Welcome to PitchPulse",
            "html": html_content
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending welcome email: {e}")
        return False

def send_brief_ready_notification(to_email, display_name, company_name, brief_url):
    if not resend.api_key:
        return False
        
    try:
        if not display_name:
            display_name = "there"
            
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 20px;">
            <h2 style="color: #FF6B2C;">PitchPulse</h2>
            <p style="color: #0C0C0C;">Hi {display_name},</p>
            <p style="color: #0C0C0C;">Your pre-meeting brief for {company_name} is ready.</p>
            <a href="{brief_url}" style="display: inline-block; background-color: #FF6B2C; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Brief</a>
        </div>
        """
        params = {
            "from": Config.FROM_EMAIL,
            "to": [to_email],
            "subject": f"Your {company_name} brief is ready",
            "html": html_content
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending brief notification: {e}")
        return False

def send_manual_brief(to_email, display_name, company_name, brief_dict):
    if not resend.api_key:
        print("Warning: RESEND_API_KEY not set")
        return False
        
    try:
        html_content = _render_brief_html(
            company_name, 
            brief_dict, 
            "You received this because you requested this brief to be emailed to you."
        )
        params = {
            "from": Config.FROM_EMAIL,
            "to": [to_email],
            "subject": f"PitchPulse: {company_name} Brief",
            "html": html_content
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending manual brief email: {e}")
        raise e
