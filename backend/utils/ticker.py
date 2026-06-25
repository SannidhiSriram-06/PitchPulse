import httpx
import yfinance as yf
import urllib.parse

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

_PRIVATE_HINTS = {"openai", "anthropic", "stripe", "spacex", "databricks", "bytedance"}

def resolve_ticker(company_name: str) -> str:
    key = company_name.strip().lower()
    
    # 1. Hardcoded map for fast lookup
    if key in _TICKER_MAP:
        return _TICKER_MAP[key]
        
    # 2. Check hints
    if key in _PRIVATE_HINTS:
        return None

    # 3. yf.Search
    try:
        search = yf.Search(company_name, max_results=5, enable_fuzzy_query=True)
        for q in (search.quotes or []):
            if q.get("quoteType") == "EQUITY" and "." not in q.get("symbol", "."):
                return q["symbol"]
        # Fallback to any equity exchange
        for q in (search.quotes or []):
            if q.get("quoteType") == "EQUITY":
                return q["symbol"]
    except Exception as e:
        print(f"[resolve_ticker] yf.Search error: {e}")

    # 4. HTTP API search
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
                f"?q={urllib.parse.quote(company_name)}&quotesCount=5&newsCount=0"
            )
            r = httpx.get(search_url, headers=headers, timeout=8.0)
            if r.status_code == 200:
                for q in r.json().get("quotes", []):
                    if q.get("quoteType") == "EQUITY":
                        return q["symbol"]
        except Exception as e:
            print(f"[resolve_ticker] HTTP API search error on {host}: {e}")
            continue

    return None

def is_private_company(company_name: str) -> bool:
    key = company_name.strip().lower()
    if key in _PRIVATE_HINTS:
        return True
    return False
