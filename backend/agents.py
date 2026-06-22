import itertools
import json
import os
import re
import time
import requests
from crewai import Agent, Task, Crew, Process, LLM
from config import Config
from tools import company_web_search, company_financial_data
import tools as tools_module

# Real Groq-hosted model IDs (from the official rate limits table).
VALID_FREE_MODELS = {
    "meta-llama/llama-4-scout-17b-16e-instruct",  # 30K TPM — best default
    "groq/compound-mini",                        # 70K TPM — high capacity free
}
VALID_PRO_MODELS = {
    "llama-3.3-70b-versatile",                     # 12K TPM — high capability pro
    "openai/gpt-oss-120b",                         # 8K TPM — massive reasoning pro
    "groq/compound",                               # 70K TPM — complex composition pro
}
ALL_VALID_MODELS = VALID_FREE_MODELS | VALID_PRO_MODELS

DEFAULT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

# Round-robin key rotator — alternates between GROQ_API_KEY and GROQ_API_KEY_2
# on every call to spread load and avoid per-key rate limits.
def _make_key_cycle():
    keys = [k for k in [Config.GROQ_API_KEY, Config.GROQ_API_KEY_2] if k]
    if not keys:
        raise RuntimeError("No GROQ_API_KEY configured")
    return itertools.cycle(keys)

_key_cycle = None

def _next_api_key():
    global _key_cycle
    if _key_cycle is None:
        _key_cycle = _make_key_cycle()
    return next(_key_cycle)


def extract_company_and_context(prompt, api_key=None):
    if not prompt or not prompt.strip():
        return "", ""
    
    # Strip any bracketed prefixes (e.g. [Compare Mode], [Meeting Type: ...])
    clean_prompt = re.sub(r"^\[[^\]]+\]\s*", "", prompt).strip()
    
    words = clean_prompt.split()
    if len(words) <= 3:
        return clean_prompt, ""

    key = api_key or _next_api_key()
    try:
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            # llama-4-scout: 30K TPM — best for parsing, never rate-limited
            # Note: Groq REST API uses bare model IDs (no "groq/" prefix — that's LiteLLM only)
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a precise JSON extractor for a B2B sales intelligence tool. "
                        "The user provides a natural language research query which may include: "
                        "the company to research, what they are selling, and their specific pitch angle. "
                        "Extract exactly two fields: "
                        "1. company_name — the single specific company name to research (just the name, nothing else). "
                        "2. user_context — concise description of what the rep sells and their pitch angle "
                        "(e.g. 'AI software for real-time chip manufacturing defect detection and quality control'). "
                        "Return ONLY valid JSON: "
                        '{\"company_name\": \"<company>\", \"user_context\": \"<pitch>\"}. '
                        "If no company is identifiable, set company_name to empty string. "
                        "No markdown, no explanation, no extra keys."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"}
        }
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload, headers=headers, timeout=5
        )
        if res.status_code == 200:
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return (
                parsed.get("company_name", prompt).strip(),
                parsed.get("user_context", "").strip()
            )
    except Exception as e:
        print(f"[PitchPulse] Prompt parsing error: {e}")

    return prompt, ""


def run_brief(company_name, length, sections, user_context, model_id=None, deep_mind=False, full_query="", pdf_context=""):
    """
    Generate a pre-meeting intelligence brief.
    Returns (brief_dict, total_search_results) tuple.
    """
    # Configure search depth by length
    if length == 'short':
        tools_module._search_max_results = 3
    elif length == 'medium':
        tools_module._search_max_results = 5
    else:
        tools_module._search_max_results = 6

    # Reset aggregate search counter for this request (thread-local in dev)
    tools_module._search_total_results = 0

    # Validate and normalise model ID — reject fake/invalid model names
    if model_id and model_id not in ALL_VALID_MODELS:
        print(f"[PitchPulse] Unknown model '{model_id}', falling back to default.")
        model_id = None
    chosen_model = model_id or DEFAULT_MODEL

    # LiteLLM always needs "groq/<model_id>" to route to Groq.
    # Models like "groq/compound-mini" or "groq/compound" already start with "groq/".
    # To query the Groq API provider, the LiteLLM format must be "groq/groq/compound-mini",
    # where the first "groq/" specifies the provider, and the remainder "groq/compound-mini"
    # is the actual model ID sent to Groq.
    if chosen_model.startswith("groq/") and chosen_model not in ("groq/compound-mini", "groq/compound"):
        model_path = chosen_model
    else:
        model_path = f"groq/{chosen_model}"

    # Per-model char budgets — sized to stay comfortably under each model's TPM limit.
    if chosen_model == "meta-llama/llama-4-scout-17b-16e-instruct":
        _search_per_query_cap = 4000
        _pdf_cap              = 5500
        _financial_cap        = 1500
    elif chosen_model == "groq/compound-mini":
        _search_per_query_cap = 6000
        _pdf_cap              = 7500
        _financial_cap        = 2000
    elif chosen_model == "llama-3.1-8b-instant":
        _search_per_query_cap = 1500
        _pdf_cap              = 2000
        _financial_cap        = 800
    elif chosen_model == "llama-3.3-70b-versatile":
        _search_per_query_cap = 2500
        _pdf_cap              = 3500
        _financial_cap        = 1200
    elif chosen_model == "openai/gpt-oss-120b":
        _search_per_query_cap = 2000
        _pdf_cap              = 3000
        _financial_cap        = 1000
    elif chosen_model == "groq/compound":
        _search_per_query_cap = 6000
        _pdf_cap              = 7500
        _financial_cap        = 2000
    else:
        # Default fallback
        _search_per_query_cap = 3000
        _pdf_cap              = 4500
        _financial_cap        = 1400

    # ── Build context instruction from the user's full natural query ──────────
    pitch_context = full_query or user_context or ""

    # Extract a short label for what the rep is selling (used inline in JSON schema)
    product_label = "the rep's product/solution"
    if pdf_context and "===" not in pdf_context[:100]:
        # First line of the PDF might say the product name
        first_line = pdf_context.split('\n')[0][:80].strip()
        if first_line:
            product_label = first_line

    if pitch_context:
        context_instruction = f"""━━━ REP'S SALES CONTEXT (READ THIS FIRST) ━━━
Query: "{pitch_context}"
{f'Product documentation is also included below.' if pdf_context else ''}

You are NOT writing a generic company profile. You are writing a pre-meeting brief for a SPECIFIC rep with a SPECIFIC product to sell. This context must shape EVERY sentence you write.

Rules:
1. Each insight must answer: "How does this help or hurt the rep close THIS specific deal?"
2. When mentioning a company fact, always add: "...which means [implication for the rep's pitch]"
3. Generic statements like "Nvidia is a large company" are FORBIDDEN unless they contain a specific implication for the rep.
4. If a section has no obvious connection to the rep's pitch — say so briefly, don't pad it.
━━━ END CONTEXT ━━━"""
    else:
        context_instruction = ""

    if pdf_context:
        context_instruction += f"""

━━━ PRODUCT DOCUMENTATION ━━━
The rep uploaded a product PDF. Key rules:
- Treat it as your primary source for the rep's VALUE PROPOSITION.
- In EVERY section (not just talking points), ask: "Which specific feature/metric from this PDF addresses what I just found about the company?"
- Minimum: 2 explicit references to the PDF content in talking_points and at least 1 in watch_out_for.
- Quote specific metrics, percentages, integration capabilities, or customer results from the PDF.
━━━ END PDF RULES ━━━"""

    if deep_mind:
        context_instruction += """

DEEP ANALYSIS MODE: First-principles reasoning. Non-obvious connections. Contrarian insights. Think like a McKinsey partner 48 hours before the most important pitch of the year. No filler. Every sentence must earn its place."""

    # Tailor the final 2 search queries to the rep's specific pitch when context exists
    if pitch_context:
        # Extract keywords from pitch context for targeted searches
        context_keywords = pitch_context[:200]
    else:
        context_keywords = ""

    length_guide = {
        "short": "Write 2-3 sentences per section. Include 3-5 items per list. Total ~800 words.",
        "medium": "Write 3-5 sentences with specific data points per section. Include 5-7 items per list. Each item 2-3 sentences. Total ~1500 words.",
        "long": "Write comprehensive multi-paragraph analysis (4-8 sentences minimum) per section. Include 7-12 items per list with 3-5 sentence explanations including names, numbers, dates, and strategic implications. Total ~3000+ words. This is a DEEP DIVE."
    }
    depth = length_guide.get(length, length_guide["medium"])

    if length == 'short':
        length_instruction = "Be brief. Max 2-3 bullet points per section. Max 40 words per section."
        output_instruction = "Each section: max 2 bullet points, max 30 words per bullet. Max 2 items per array."
        items_min = "2"
    elif length == 'medium':
        length_instruction = "Be moderate. Max 1 short paragraph per section."
        output_instruction = "Each section: max 1 short paragraph, max 60 words. Max 4 items per array."
        items_min = "4"
    else:
        length_instruction = "Be thorough. Full analysis per section with specifics."
        output_instruction = "Each section: full analysis, no word limit. Include all relevant items."
        items_min = "7"

    # Resolve active sections (default to all if none provided)
    all_available_sections = [
        "summary", "news", "financials", "social_sentiment", 
        "talking_points", "watch_out_for", "leadership_changes", 
        "job_signals", "recent_launches", "competitor_activity"
    ]
    if not sections:
        sections = all_available_sections
    else:
        # Filter to ensure only valid keys are present
        sections = [s for s in sections if s in all_available_sections]

    # 1. Research topics list for task1
    research_topics = []
    topic_num = 1
    if "news" in sections:
        research_topics.append(f"{topic_num}. Recent news and press releases (last 30-60 days) — include specific headlines, dates, dollar figures")
        topic_num += 1
    if "financials" in sections:
        research_topics.append(f"{topic_num}. Financial performance, earnings, revenue, funding — cite actual numbers")
        topic_num += 1
    if "social_sentiment" in sections:
        research_topics.append(f"{topic_num}. Social media / employee sentiment — Glassdoor themes, Reddit sentiment, analyst opinions")
        topic_num += 1
    if "leadership_changes" in sections:
        research_topics.append(f"{topic_num}. C-suite and VP-level leadership changes in last 6 months — names, titles, implications")
        topic_num += 1
    if "job_signals" in sections:
        research_topics.append(f"{topic_num}. Strategic job postings — what open roles reveal about priorities and spend")
        topic_num += 1
    if "recent_launches" in sections:
        research_topics.append(f"{topic_num}. New product launches, features, platform changes — dates and market reception")
        topic_num += 1
    if "competitor_activity" in sections:
        research_topics.append(f"{topic_num}. Competitor moves that directly affect this company")
        topic_num += 1
    research_topics.append(f"{topic_num}. Partnerships, acquisitions, strategic initiatives") # Always include
    research_topics_prompt = "\n".join(research_topics)

    # 2. Analysis required list for task2
    analysis_required = []
    sect_num = 1
    if "talking_points" in sections:
        analysis_required.append(f"""━━━ {sect_num}. TALKING POINTS ({'3-5' if length == 'short' else '5-8' if length == 'medium' else '8-12'} points) ━━━
Each talking point MUST follow this exact 3-part structure:
  • HOOK: One specific, verifiable fact about {company_name} from the research (include a number, name, or date)
  • BRIDGE: Exactly HOW the rep's product/solution addresses or capitalises on that specific fact
  • OPENER: A conversation starter that references BOTH the company fact AND the product/solution
    Example format: "I saw [specific fact about company] — we've been helping teams solve exactly this with [specific feature]. Curious how you're thinking about it."
BAD talking point (reject these): "Nvidia is a large GPU company investing in AI."
GOOD talking point: "Nvidia's Blackwell GPU yield rate at TSMC dropped below 60% in Q4 — WaferSense AI's real-time defect classification maps directly onto that problem. Opener: 'We noticed the Blackwell yield press reports — we're working with TSMC-adjacent fabs on exactly this problem. Would love to show you what we're seeing.'\"
If a PRODUCT DOCUMENTATION section exists in the research, you MUST quote at least one specific metric or feature from it in the talking points.""")
        sect_num += 1

    if "watch_out_for" in sections:
        analysis_required.append(f"""━━━ {sect_num}. WATCH OUT FOR ({'2-3' if length == 'short' else '3-5' if length == 'medium' else '5-8'} risks) ━━━
Each risk: specific trigger + evidence from the research + one concrete mitigation action.""")
        sect_num += 1

    if "leadership_changes" in sections:
        analysis_required.append(f"━━━ {sect_num}. LEADERSHIP CHANGES ━━━\nNames, titles, previous companies, and what the change signals about buying priorities.")
        sect_num += 1

    if "competitor_activity" in sections:
        analysis_required.append(f"━━━ {sect_num}. COMPETITOR ACTIVITY ━━━\nSpecific actions taken by competitors, with evidence and implications for this deal.")
        sect_num += 1

    if "recent_launches" in sections:
        analysis_required.append(f"━━━ {sect_num}. RECENT LAUNCHES ━━━\nProduct/service launches with dates, market reception, and deal relevance.")
        sect_num += 1

    if "job_signals" in sections:
        analysis_required.append(f"━━━ {sect_num}. JOB SIGNALS (if data exists) ━━━\nRoles that reveal strategic spend — and how the rep can reference them in conversation.")
        sect_num += 1

    analysis_required_prompt = "\n\n".join(analysis_required)

    # 3. JSON output structure for task3
    json_elements = []
    json_elements.append(f'  "company_name": "{company_name}"')
    json_elements.append('  "generated_at": "<current ISO timestamp>"')
    json_elements.append('  "rep_pitch_context": "<1-sentence summary of what the rep is selling and to whom, extracted from the query>"')

    if "summary" in sections:
        json_elements.append(f"""  "summary": {{
    "content": "<Company overview: what they do, current momentum, why they matter to the rep's pitch RIGHT NOW. {('2-3' if length == 'short' else '3-4' if length == 'medium' else '5-7')} sentences. Last sentence: why this company is a compelling target for the rep's specific solution.>",
    "confidence": "high|medium|low",
    "sources": ["<url>"]
  }}""")

    if "news" in sections:
        json_elements.append(f"""  "news": {{
    "content": "<{('2' if length == 'short' else '3' if length == 'medium' else '4-5')} sentences: which recent news items are most relevant to the rep's pitch and why.>",
    "confidence": "high|medium|low",
    "sources": ["<url>"],
    "items": [{{"headline": "<exact headline>", "summary": "<what happened + why it matters for this specific deal in {('1' if length == 'short' else '2' if length == 'medium' else '2-3')} sentences>", "url": "<url>", "date": "<YYYY-MM-DD>", "pitch_relevance": "<one sentence: direct implication for the rep's pitch>"}}]
  }}""")

    if "financials" in sections:
        json_elements.append(f"""  "financials": {{
    "content": "<{('2' if length == 'short' else '3-4' if length == 'medium' else '5-6')} sentences: key financial metrics + what the budget/growth trajectory means for closing a deal with this company.>",
    "confidence": "high|medium|low",
    "sources": [],
    "snapshot": {{
      "revenue": "<e.g. $81.6B>", "growth": "<e.g. +85% YoY>", "funding": "<if startup>",
      "market_cap": "<e.g. $2.1T>", "employees": "<headcount>", "disclaimer": "Verify with official filings"
    }}
  }}""")

    if "social_sentiment" in sections:
        json_elements.append(f"""  "social_sentiment": {{
    "content": "<{('2' if length == 'short' else '3' if length == 'medium' else '4')} sentences: employee/public sentiment + whether internal morale or public perception creates an opening or risk for the rep.>",
    "confidence": "high|medium|low",
    "sources": ["<url>"],
    "sentiment": "positive|neutral|negative|mixed"
  }}""")

    if "talking_points" in sections:
        json_elements.append(f"""  "talking_points": {{
    "content": "<2-sentence overview of the core pitch angle — what is the single strongest reason this company needs the rep's product right now?>",
    "confidence": "high|medium|low",
    "items": [
      {{
        "point": "<HOOK: one specific verifiable fact about {company_name} — must include a number, name, or date>",
        "why_it_matters": "<BRIDGE: exactly how the rep's product addresses this specific fact, citing a specific product feature or metric. Then OPENER: exact words the rep can say in the first 30 seconds of the meeting, referencing both the company fact and the product capability.>"
      }}
    ]
  }}""")

    if "watch_out_for" in sections:
        json_elements.append(f"""  "watch_out_for": {{
    "content": "<{('1-2' if length == 'short' else '2-3' if length == 'medium' else '3-4')} sentences: what could kill this deal + how to pre-empt each risk.>",
    "confidence": "high|medium|low",
    "items": [{{"risk": "<specific named risk with evidence>", "context": "<why this is a real risk for THIS deal + a concrete mitigation move the rep can make before or during the meeting>"}}]
  }}""")

    if "leadership_changes" in sections:
        json_elements.append(f"""  "leadership_changes": {{
    "content": "<{('1-2' if length == 'short' else '2' if length == 'medium' else '3')} sentences: which personnel changes create new buying opportunities or new risks.>",
    "confidence": "high|medium|low",
    "items": [{{"name": "<full name>", "role": "<title>", "change": "<what changed, when, where from, and what this signals about budget/priorities for the rep>", "date": "<YYYY-MM-DD>"}}]
  }}""")

    if "job_signals" in sections:
        json_elements.append(f"""  "job_signals": {{
    "content": "<{('1' if length == 'short' else '2' if length == 'medium' else '2-3')} sentences: what the hiring patterns reveal about where the company is spending — and whether that overlaps with the rep's pitch.>",
    "confidence": "high|medium|low",
    "items": [{{"role": "<job title>", "signal": "<what this role signals about company priorities + one specific way the rep can reference this hiring trend in their pitch>"}}]
  }}""")

    if "recent_launches" in sections:
        json_elements.append(f"""  "recent_launches": {{
    "content": "<{('1-2' if length == 'short' else '2' if length == 'medium' else '3')} sentences: which launches create integrations opportunities or competitive pressure relevant to the rep's solution.>",
    "confidence": "high|medium|low",
    "items": [{{"name": "<product/feature name>", "date": "<YYYY-MM-DD>", "significance": "<market impact + direct relevance to the rep's pitch in {('1' if length == 'short' else '2' if length == 'medium' else '2-3')} sentences>"}}]
  }}""")

    if "competitor_activity" in sections:
        json_elements.append(f"""  "competitor_activity": {{
    "content": "<{('1-2' if length == 'short' else '2' if length == 'medium' else '3')} sentences: competitive landscape + how competitor moves create urgency or threats for the rep.>",
    "confidence": "high|medium|low",
    "items": [{{"competitor": "<company>", "action": "<specific move with date/evidence>", "impact": "<effect on {company_name} + implication for the rep's deal in {('1' if length == 'short' else '2' if length == 'medium' else '2-3')} sentences>"}}]
  }}""")

    json_structure_prompt = "{\n" + ",\n".join(json_elements) + "\n}"

    # 4. Hard rules list for task3
    hard_rules = []
    rule_id = 1
    if "talking_points" in sections:
        hard_rules.append(f"{rule_id}. talking_points MUST have {{'3-5' if length == 'short' else '5-8' if length == 'medium' else '8-12'}} items — populate these FIRST before anything else.")
        rule_id += 1
    hard_rules.append(f"{rule_id}. No section 'content' field may be a generic company description — every content field must end with a pitch implication.")
    rule_id += 1
    if "watch_out_for" in sections:
        hard_rules.append(f"{rule_id}. 'watch_out_for' keys: 'risk' and 'context' only.")
        rule_id += 1
    if "job_signals" in sections:
        hard_rules.append(f"{rule_id}. 'job_signals' keys: 'role' and 'signal' only.")
        rule_id += 1
    hard_rules.append(f"{rule_id}. Complete the ENTIRE object.")
    hard_rules_prompt = "\n".join(hard_rules)

    sections_count = len(sections)
    if sections_count > 7:
        per_section_limit = "3 items max per section, 50 words max per item"
    elif sections_count > 4:
        per_section_limit = "4 items max per section, 70 words max per item"
    else:
        per_section_limit = "6 items max per section, 100 words max per item"

    # ── Run tools directly (bypasses LLM tool-calling entirely) ──────────────
    financial_overview = company_financial_data._run(company_name)[:_financial_cap]

    # Base queries always run
    search_queries = [
        f"{company_name} latest news announcements 2024 2025",
        f"{company_name} revenue earnings financial performance funding",
        f"{company_name} leadership changes executive appointments",
    ]
    # 4th query: tailor to the rep's specific pitch angle if context exists
    if context_keywords:
        search_queries.append(
            f"{company_name} {context_keywords[:100]} strategy investment challenges"
        )
    else:
        search_queries.append(
            f"{company_name} product launches partnerships strategic initiatives competitors"
        )

    search_results = []
    for q in search_queries:
        res = company_web_search._run(q)
        # Cap each result block per model token budget
        search_results.append(f"### {q}\n{res[:_search_per_query_cap]}\n")

    # Append PDF product context (capped to model budget)
    pdf_section = ""
    if pdf_context:
        pdf_section = f"\n\n=== PRODUCT DOCUMENTATION (rep's PDF) ===\n{pdf_context[:_pdf_cap]}"

    compiled_research = (
        f"=== FINANCIAL OVERVIEW ===\n{financial_overview}\n\n"
        f"=== WEB SEARCH RESULTS ===\n" + "\n".join(search_results)
        + pdf_section
    )

    # Capture total results for the caller
    total_search_results = tools_module._search_total_results

    # ── CrewAI multi-agent synthesis ─────────────────────────────────────────
    max_retries = 3
    last_error = None
    inputs = {}

    for attempt in range(max_retries):
        try:
            # Rotate API key on every attempt — spreads load across both keys
            current_key = _next_api_key()
            print(f"[PitchPulse] Using API key ending ...{current_key[-4:]} (attempt {attempt + 1}/{max_retries})")

            # Scout (30K TPM) can afford 4500 output tokens; tighter models get 3500.
            _max_out = 4500 if "scout" in chosen_model or "llama-4" in chosen_model else 3500
            llm = LLM(
                model=model_path,
                api_key=current_key,
                max_tokens=_max_out,
                temperature=0.1
            )

            researcher = Agent(
                role="Senior Company Intelligence Researcher",
                goal=f"Synthesize the compiled, current intelligence about {company_name}",
                backstory=(
                    "You are a former McKinsey researcher turned competitive intelligence specialist. "
                    "You analyze provided raw search and financial data with rigorous attention to detail. "
                    "You extract recent news, financial indicators, social media sentiment, leadership changes, "
                    "job postings, product launches, and competitor moves. "
                    "You always cite every source URL. You synthesize into a structured, actionable report."
                ),
                tools=[],
                llm=llm,
                verbose=False,
                max_iter=3
            )

            analyst = Agent(
                role="Strategic Sales Intelligence Analyst",
                goal="Transform raw research into deeply actionable, meeting-ready sales intelligence",
                backstory=(
                    "You are a 20-year enterprise sales veteran who has closed $500M+ in deals. "
                    "You know exactly what a rep needs to walk into a meeting fully prepared. "
                    "You identify specific talking points with conversation starters, "
                    "hidden risks that could derail a deal, buying signals that indicate urgency, "
                    "political dynamics in the org chart, budget cycle indicators, "
                    "and competitive threats. You think like the buyer AND the seller. "
                    "You provide SPECIFIC, ACTIONABLE advice — not generic platitudes. "
                    "Every insight must contain a specific fact, name, or number."
                ),
                tools=[],
                llm=llm,
                verbose=False,
                max_iter=3
            )

            formatter = Agent(
                role="Pre-Meeting Brief Specialist",
                goal="Format analysis into a richly detailed, perfectly structured JSON brief",
                backstory=(
                    "You produce detailed, structured JSON briefs that give sales reps a genuine competitive edge. "
                    "You never include markdown fences. You always output valid JSON and nothing else. "
                    "You ensure EVERY section has substantial content — no empty strings unless truly no data exists. "
                    "You write in a direct, confident tone. "
                    "For 'long' length briefs, you MUST write extensively — "
                    "each content field should be multiple sentences, each list item should have detailed explanations."
                ),
                tools=[],
                llm=llm,
                verbose=False,
                max_iter=3
            )

            task1 = Task(
                description=f"""
Synthesize the compiled raw research about {company_name} with the depth of a McKinsey analyst.

{context_instruction}

COMPILED RAW RESEARCH:
{compiled_research}

Synthesize this raw data into a highly structured report covering:
{research_topics_prompt}

IF the PRODUCT DOCUMENTATION section exists in the compiled research:
- Identify every place where {company_name}'s challenges, priorities, or recent moves
  DIRECTLY map to a capability described in the product documentation.
- Flag these matches explicitly as "PRODUCT FIT: <company challenge> ↔ <product capability>"
  so the next analyst agent can build precise talking points.

Brief length: {length_instruction}
Cite EVERY source with URL and date. Include specific numbers, names, and quotes.
Output constraint: {per_section_limit}
""",
                expected_output="Structured research summary with explicit PRODUCT FIT flags. Bullet points. Max 800 words.",
                agent=researcher
            )

            task2 = Task(
                description=f"""
You are preparing the rep for the most important meeting of their quarter with {company_name}.

{context_instruction}

ANALYSIS REQUIRED ({length} brief):

{analysis_required_prompt}

Be RUTHLESSLY specific. "Build rapport" and "mention ROI" are USELESS. Every sentence must contain a name, number, or date.
For a "{length}" brief, produce ALL the requested points (no fewer than the minimum counts listed above).
""",
                expected_output=f"Sales analysis with {'3-5' if length == 'short' else '5-8' if length == 'medium' else '8-12'} talking points, each with HOOK + BRIDGE + OPENER. Bullet points. No preamble.",
                agent=analyst
            )

            task3 = Task(
                description=f"""You are formatting a pre-meeting sales brief for {company_name}.
Output ONLY valid JSON — no markdown, no explanation, nothing before or after the object.

{context_instruction}

LENGTH: {length} brief — {output_instruction}

PITCH-AWARENESS RULES (apply to EVERY section):
- Every "content" field must end with one sentence explaining what this means for the rep's specific pitch.
- Every list item must contain at least one specific fact (number, name, date, or quoted metric).
- The word "generic" should never describe any sentence you write.

OUTPUT THIS EXACT STRUCTURE:

{json_structure_prompt}

HARD RULES:
{hard_rules_prompt}
""",
            )

            crew = Crew(
                agents=[researcher, analyst, formatter],
                tasks=[task1, task2, task3],
                process=Process.sequential,
                verbose=False
            )
            result = crew.kickoff(inputs=inputs)
            return _extract_json(str(result)), total_search_results

        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            if any(x in error_str for x in ['rate_limit', '429', 'ratelimit', 'tokens per minute', 'tpm']):
                if attempt < max_retries - 1:
                    wait = (attempt + 1) * 6
                    print(f"[PitchPulse] Rate limited. Waiting {wait}s before retry {attempt + 2}/{max_retries}...")
                    time.sleep(wait)
                    continue
            raise e

    raise last_error


def _repair_truncated_json(text):
    """
    Attempt to close a truncated JSON string so it can be parsed.
    Works by counting open braces/brackets and appending the missing closers.
    """
    # Count open structures
    depth_brace = 0
    depth_bracket = 0
    in_string = False
    escape_next = False

    for ch in text:
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == '{':
            depth_brace += 1
        elif ch == '}':
            depth_brace -= 1
        elif ch == '[':
            depth_bracket += 1
        elif ch == ']':
            depth_bracket -= 1

    # If we're inside a string, close it
    suffix = ''
    if in_string:
        suffix += '"'
    # Close open arrays/objects in reverse order (approximate)
    suffix += ']' * max(0, depth_bracket)
    suffix += '}' * max(0, depth_brace)
    return text + suffix


def _extract_json(text):
    text = text.strip()

    # Strip markdown fences
    if '```' in text:
        text = re.sub(r'```(?:json)?\n?', '', text).strip()

    # Find outermost JSON object
    start = text.find('{')
    if start == -1:
        raise ValueError("No JSON object found in output")

    candidate = text[start:]

    # 1. Try the full text as-is (happy path)
    end = candidate.rfind('}')
    if end != -1:
        try:
            return json.loads(candidate[:end + 1])
        except json.JSONDecodeError:
            pass

    # 2. Try progressive truncation from the last closing brace inward
    for i in range(len(candidate) - 1, 0, -1):
        if candidate[i] == '}':
            try:
                return json.loads(candidate[:i + 1])
            except Exception:
                continue

    # 3. Try to repair a truncated JSON (model hit token limit mid-string)
    repaired = _repair_truncated_json(candidate)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError:
        pass

    # 4. Try repair + progressive truncation on the repaired version
    for i in range(len(repaired) - 1, 0, -1):
        if repaired[i] == '}':
            try:
                return json.loads(repaired[:i + 1])
            except Exception:
                continue

    raise ValueError(
        f"Could not parse JSON even after repair attempt.\nPreview: {candidate[:300]}"
    )
