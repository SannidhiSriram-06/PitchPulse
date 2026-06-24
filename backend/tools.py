from crewai.tools import tool
from tavily import TavilyClient
from config import Config

# DESIGN TOKENS
# Dark bg: #0C0C0C | Surface: #141414 | Surface raised: #1C1C1C
# Border: rgba(255,255,255,0.08) | Accent orange: #FF6B2C
# Light bg: #FAFAF8 | Light surface: #FFFFFF
# Font: Space Grotesk + Inter + Berkeley Mono

_search_max_results = 5
_search_depth = "advanced"

# NOTE: This global is only used by the direct ._run() call path in agents.py.
# It is reset at the top of run_brief() and aggregated via += across all queries.
# In single-worker dev this is fine; in multi-worker production use the returned
# tuple from run_brief() instead of reading this directly.
_search_total_results = 0

import random
from datetime import datetime, timedelta
from flask import current_app

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0"
]

def get_random_user_agent():
    return random.choice(USER_AGENTS)

def get_cached_val(key):
    try:
        if current_app:
            from database import db
            from models import APICache
            cache_item = db.session.get(APICache, key) if hasattr(db.session, "get") else APICache.query.get(key)
            if cache_item:
                created_at = cache_item.created_at
                if datetime.utcnow() - created_at < timedelta(hours=24):
                    return cache_item.value
                else:
                    db.session.delete(cache_item)
                    db.session.commit()
    except Exception as e:
        print(f"[Cache] DB Read Error: {e}")
    return None

def set_cached_val(key, val):
    try:
        if current_app:
            from database import db
            from models import APICache
            cache_item = db.session.get(APICache, key) if hasattr(db.session, "get") else APICache.query.get(key)
            if cache_item:
                cache_item.value = val
                cache_item.created_at = datetime.utcnow()
            else:
                cache_item = APICache(key=key, value=val, created_at=datetime.utcnow())
                db.session.add(cache_item)
            db.session.commit()
    except Exception as e:
        print(f"[Cache] DB Write Error: {e}")



@tool
def company_web_search(query: str) -> str:
    """Uses Tavily to perform a web search about a company."""
    global _search_total_results
    
    # Check cache first
    cache_key = f"tavily:{_search_depth}:{query}"
    cached = get_cached_val(cache_key)
    if cached:
        print(f"[Cache Hit] Tavily query: {query}")
        return cached

    try:
        if not Config.TAVILY_API_KEY:
            return "Search failed: No TAVILY_API_KEY provided"

        client = TavilyClient(api_key=Config.TAVILY_API_KEY)
        response = client.search(
            query=query,
            search_depth=_search_depth,
            max_results=_search_max_results,
            include_raw_content=False
        )
        results = response.get("results", [])
        _search_total_results += len(results)  # AGGREGATE across all queries

        formatted_results = []
        for res in results:
            url = res.get("url", "")
            date = res.get("published_date", "")
            title = (res.get("title", "") or "")[:100]
            content = (res.get("content", "") or "")[:400]
            formatted_results.append(
                f"SOURCE: {url}\nTITLE: {title}\nDATE: {date}\nCONTENT: {content}\n\n"
            )

        output = "".join(formatted_results)
        set_cached_val(cache_key, output)
        return output
    except Exception as e:
        return f"Search failed: {str(e)}"


@tool
def company_financial_data(company_name: str) -> str:
    """Returns real financial data for a company using Yahoo Finance."""
    
    # Check cache first
    cache_key = f"yfinance:{company_name}"
    cached = get_cached_val(cache_key)
    if cached:
        print(f"[Cache Hit] yfinance query: {company_name}")
        return cached

    # Import requests and other modules
    import requests
    import yfinance as yf
    import httpx

    try:
        user_agent = get_random_user_agent()
        headers = {"User-Agent": user_agent}
        search_url = (
            f"https://query2.finance.yahoo.com/v1/finance/search"
            f"?q={httpx.utils.quote(company_name)}&quotesCount=5"
        )
        r = httpx.get(search_url, headers=headers, timeout=8.0)
        data = r.json()
        quotes = data.get("quotes", [])

        # Prefer equity type
        ticker_symbol = None
        for q in quotes:
            if q.get("quoteType") == "EQUITY":
                ticker_symbol = q["symbol"]
                break
        if not ticker_symbol and quotes:
            ticker_symbol = quotes[0].get("symbol")

        if not ticker_symbol:
            # Fall back to Tavily search right away if ticker not found
            raise ValueError("No ticker symbol found")

        # Set up a requests session with the rotated user agent
        session = requests.Session()
        session.headers.update({"User-Agent": user_agent})
        
        ticker = yf.Ticker(ticker_symbol, session=session)
        info = ticker.info or {}

        if not info or "totalRevenue" not in info and "marketCap" not in info:
            # If the response is empty, it's likely blocked or has restricted data
            raise ValueError("Empty or blocked ticker info")

        def fmt_large(val):
            if val is None:
                return "N/A"
            if val >= 1e12:
                return f"${val / 1e12:.2f}T"
            if val >= 1e9:
                return f"${val / 1e9:.1f}B"
            if val >= 1e6:
                return f"${val / 1e6:.0f}M"
            return f"${val:,.0f}"

        revenue = info.get("totalRevenue")
        market_cap = info.get("marketCap")
        employees = info.get("fullTimeEmployees")
        growth = info.get("revenueGrowth")
        pe_ratio = info.get("trailingPE")
        gross_margin = info.get("grossMargins")
        sector = info.get("sector", "N/A")
        country = info.get("country", "N/A")
        exchange = info.get("exchange", "N/A")
        summary = info.get("longBusinessSummary", "")[:300] if info.get("longBusinessSummary") else ""

        lines = [
            f"Financial Overview for {company_name} (Ticker: {ticker_symbol})",
            f"Revenue (TTM): {fmt_large(revenue)}",
            f"Revenue Growth YoY: {f'{growth * 100:.1f}%' if growth else 'N/A'}",
            f"Market Cap: {fmt_large(market_cap)}",
            f"Gross Margin: {f'{gross_margin * 100:.1f}%' if gross_margin else 'N/A'}",
            f"Employees: {f'{employees:,}' if employees else 'N/A'}",
            f"P/E Ratio: {f'{pe_ratio:.1f}x' if pe_ratio else 'N/A'}",
            f"Sector: {sector}",
            f"Country: {country}",
            f"Exchange: {exchange}",
        ]
        if summary:
            lines.append(f"Business: {summary}")
        lines.append(
            f"\nDisclaimer: Figures from Yahoo Finance ({ticker_symbol}). "
            f"Verify with official filings before quoting in meetings."
        )

        output = "\n".join(lines)
        set_cached_val(cache_key, output)
        return output

    except Exception as e:
        print(f"[yfinance Error] Failed for {company_name}: {e}. Trying Tavily search fallback...")
        try:
            client = TavilyClient(api_key=Config.TAVILY_API_KEY)
            search_query = f"{company_name} stock financials revenue market cap growth employees sector site:finance.yahoo.com OR site:ycharts.com"
            response = client.search(
                query=search_query,
                search_depth="basic",
                max_results=3
            )
            results = response.get("results", [])
            
            lines = [
                f"Financial Overview for {company_name} (Source: Web Search Fallback)",
            ]
            for res in results:
                title = res.get("title", "")
                content = res.get("content", "")
                lines.append(f"- {title}: {content}")
                
            lines.append("\nDisclaimer: Figures compiled via web search fallback. Verify with official sources before quoting.")
            output = "\n".join(lines)
            set_cached_val(cache_key, output)
            return output
        except Exception as fallback_err:
            return (
                f"Financial Overview for {company_name}:\n"
                f"Could not retrieve live financial data ({str(fallback_err)}).\n"
                f"Disclaimer: Verify all financial information with official sources before use."
            )

