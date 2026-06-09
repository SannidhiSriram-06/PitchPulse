from crewai.tools import tool
from tavily import TavilyClient
from config import Config

# DESIGN TOKENS
# Dark bg: #0C0C0C | Surface: #141414 | Surface raised: #1C1C1C
# Border: rgba(255,255,255,0.08) | Accent orange: #FF6B2C
# Light bg: #FAFAF8 | Light surface: #FFFFFF
# Font: Space Grotesk + Inter + Berkeley Mono

_search_max_results = 5

# NOTE: This global is only used by the direct ._run() call path in agents.py.
# It is reset at the top of run_brief() and aggregated via += across all queries.
# In single-worker dev this is fine; in multi-worker production use the returned
# tuple from run_brief() instead of reading this directly.
_search_total_results = 0


@tool
def company_web_search(query: str) -> str:
    """Uses Tavily to perform a web search about a company."""
    global _search_total_results
    try:
        if not Config.TAVILY_API_KEY:
            return "Search failed: No TAVILY_API_KEY provided"

        client = TavilyClient(api_key=Config.TAVILY_API_KEY)
        response = client.search(
            query=query,
            search_depth="advanced",
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

        return "".join(formatted_results)
    except Exception as e:
        return f"Search failed: {str(e)}"


@tool
def company_financial_data(company_name: str) -> str:
    """Returns real financial data for a company using Yahoo Finance."""
    try:
        import yfinance as yf
        import httpx

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
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
            return (
                f"Financial Overview for {company_name}:\n"
                f"No public market listing found. This may be a private company.\n"
                f"Disclaimer: Verify all financial information with official sources before use."
            )

        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info or {}

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

        return "\n".join(lines)

    except Exception as e:
        return (
            f"Financial Overview for {company_name}:\n"
            f"Could not retrieve live financial data ({str(e)}).\n"
            f"Disclaimer: Verify all financial information with official sources before use."
        )
