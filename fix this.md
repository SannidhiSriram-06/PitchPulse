# PitchPulse — Full Codebase Review & Issue Log

> Reviewed June 2026. Every file read, every line analyzed. Issues organized from critical security bugs → functional bugs → UX/UI problems → code quality smells.

---

## CRITICAL SECURITY BUGS

### 1. JWT Signature is NOT verified (app.py:65)
The backend decodes the Clerk JWT with `options={"verify_signature": False}`. This means **any** JWT with any `sub` field will authenticate as that user. An attacker can forge a JWT claiming to be any `clerk_user_id` and gain full access to that user's briefs, watchlist, and can even delete their account. This was noted as a known issue in context.md but never fixed. This is a complete authentication bypass and must be the first thing fixed.

**Fix:** Fetch the Clerk JWKS endpoint and verify the RS256 signature using PyJWT's key-based verification.

---

## FUNCTIONAL BUGS

### 2. Rate limit widget is stale and never updates (DashboardPage.jsx:202, authStore.js)
The `StorageWidget` receives `remaining={user?.briefs_remaining_this_hour ?? 3}`. The `user` object is fetched once at app startup in `App.jsx` via `GET /api/user/me`, then stored in `authStore`. It is **never re-fetched**. After generating briefs, the widget still shows the original count — it doesn't decrement. After the hour resets, the count doesn't go back up either. The widget is effectively a static number that lies to the user. 

Additionally, `POST /api/brief` returns `briefs_remaining_this_hour` in its response, but `BriefGeneratorPage` never uses this value to update the store. The widget also has no countdown timer showing when the hour resets — just "Resets every hour" which is useless.

**Fix:** After a successful brief generation, update `authStore` with the `briefs_remaining_this_hour` from the response. Also periodically re-fetch `/api/user/me` or add a countdown to the widget showing exact reset time.

### 3. Rate limit counter increments BEFORE generation succeeds (app.py:211)
`_check_and_increment_rate_limit(user)` is called and commits `briefs_used_this_hour += 1` to the database **before** `run_brief()` is called. If generation fails for any reason (bad company name, LLM error, timeout), the user's credit is burned. A user with 3/hour limit can lose all 3 credits to server errors without getting a single brief.

**Fix:** Only increment the counter after a successful `run_brief()` call.

### 4. HistoryPage "Load More" always fetches the same page (HistoryPage.jsx:41-43)
```js
const loadMore = () => {
  setOffset(prev => prev + 10)  // setState is async
  fetchBriefs(true)              // runs immediately, offset is still OLD value
}
```
`setOffset` queues a state update asynchronously. `fetchBriefs(true)` runs immediately with the old (pre-update) `offset` value — it re-fetches the same page every single time. Every "Load More" click appends duplicate briefs to the list.

**Fix:** Compute the new offset inline and pass it directly to `fetchBriefs`, or use a `useEffect` that watches `offset` to trigger the load-more fetch.

### 5. `showContext` state and UI never built (BriefGeneratorPage.jsx:37)
`const [showContext, setShowContext] = useState(false)` is defined on line 37 but there is no corresponding JSX for it anywhere in the component. The user context accordion — the feature that lets users override their context per-brief — was never rendered. The user has no way to add/change context during brief generation even though the backend fully supports it.

### 6. `searchMode` toggle is a fake/dead button (AIChatInput.jsx:29, 71-83)
The "Search Mode" toggle button exists in the UI and visually activates/deactivates, but `searchMode` state is never passed to `onSubmit`, never included in the API request payload, and has zero effect on anything. It is a completely non-functional decoration.

### 7. Scheduled briefs cannot be cancelled from the UI (DashboardPage.jsx:155-183)
The Scheduled tab shows scheduled items but there is no cancel/delete button. The backend supports `DELETE /api/scheduled/:id` for pending items. Completed/failed items are also stuck permanently — the delete endpoint rejects non-pending items, so there's no way to clean up old scheduled briefs at all.

### 8. No way to delete an individual brief from any page
`DELETE /api/briefs/:id` exists on the backend but there is zero delete UI anywhere: not on BriefDisplayPage, not in HistoryPage, not in DashboardPage. The only deletion available is "Delete Account" which nukes everything.

### 9. OnboardingPage `pp_onboarded` flag is user-agnostic (OnboardingPage.jsx:23, 47)
`localStorage.getItem('pp_onboarded')` and `localStorage.setItem('pp_onboarded', 'true')` have no user identifier. If User A completes onboarding on a shared browser, User B on the same browser will skip onboarding entirely. The flag should be keyed to the Clerk user ID.

### 10. OnboardingPage `completeOnboarding` has no error feedback (OnboardingPage.jsx:36-53)
If any watchlist API call returns a 409 (already in watchlist) or the user preferences call fails, the outer `catch` block just `console.error`s silently. The user sees nothing — no error message, no partial success message. If the final `localStorage.setItem` is never reached due to an uncaught rejection, the user also ends up in a broken state where they'll be redirected to onboarding every time they log in.

### 11. WatchlistSidebar silently swallows all errors (WatchlistSidebar.jsx:28-47)
When adding a company fails (409 duplicate, 400 invalid name, 400 limit reached), the only response is a `console.error`. The input appears to clear successfully because the `catch` block doesn't re-set any error state. The user types a company name, hits add, sees nothing happen visually, and has no idea if it worked.

### 12. BriefDisplayPage action buttons layout is broken (BriefDisplayPage.jsx:384-419)
The header div has `flex items-start justify-between gap-4`. Inside it, there's a child `<div>` (with title/timestamp) and then THREE `MetalIconButton` elements as **siblings** — they are not wrapped in a flex container. The buttons render in unpredictable positions, typically stacking or overflowing, rather than clustering as a right-aligned button group.

### 13. BriefDisplayPage `viewMode` ignores user preference (BriefDisplayPage.jsx:45)
`const [viewMode, setViewMode] = useState('tabs')` is hardcoded to `'tabs'`. The `prefsStore` has a `defaultView` preference that users can set during onboarding and in settings, but BriefDisplayPage never reads it. The toggle exists but the user's preference is ignored every time they open a brief.

### 14. SharePage renders most sections with empty content (SharePage.jsx:89-92)
The item rendering uses `item.title || item.headline || item.competitor || item.name || item.point` for the "title" field and `item.summary || item.why_it_matters || item.change || item.action || item.significance || item.signal` for the body. But:
- `watch_out_for` items use keys `risk` and `context` — `risk` is never in the title fallback chain, `context` is never in the body fallback chain. These items render completely empty.
- `job_signals` items use `role` and `signal` — `role` is not in the title chain. Empty.
- `leadership_changes` items use `name`, `role`, `change` — `name` works but `change` is in the body chain, which is fine.

Half the sections on the share page show empty cards for every item.

### 15. SharePage "may have expired" copy is incorrect (SharePage.jsx:51)
"The link may have expired or is invalid." — Share tokens are permanent; they don't expire. This copy is misleading. Should say "The link is invalid" or "Brief not found."

---

## UI/UX PROBLEMS

### 16. Dashboard subtitle lies about brief count (DashboardPage.jsx:199)
`${briefs.length} briefs generated` — the dashboard fetches `?limit=12` and stores only those 12 briefs. The subtitle says "12 briefs generated" for a user who might have 100. The API returns a `total` field but DashboardPage discards it. Should show the real total from the API response.

### 17. No "See all" / "View History" link on dashboard Recent Briefs tab
The Recent Briefs tab shows up to 12 items with no overflow link to `/history`. Users who've generated more than 12 briefs have no way to discover they can see the rest.

### 18. SettingsPage uses native `alert()` for success (SettingsPage.jsx:41)
`alert("Settings saved successfully")` — a native browser alert dialog in a polished dark-mode SaaS app. Breaks the entire visual design, blocks interaction, and cannot be styled. Should be a toast notification or inline success state.

### 19. AIChatInput uses native `alert()` for Pro upsell (AIChatInput.jsx:136)
Same problem — `alert("Upgrade to PitchPulse Pro...")` for locked models. Should be an inline message, a modal, or a tooltip.

### 20. Settings has only 3 timezone options (SettingsPage.jsx:81-85)
`Asia/Kolkata`, `UTC`, `America/New_York`. That's it. OnboardingPage has 5 options (includes LA and London), but Settings has 3. This is inconsistent and would block any non-India/US/UTC user from setting a sensible timezone. Should use a comprehensive list or a searchable dropdown.

### 21. CommandPalette shows fake keyboard shortcuts (CommandPalette.jsx:85-92)
`⌘D` for dark mode and `⌘L` for light mode are displayed as shortcuts in the UI but there are no event listeners for them. Only `⌘K`, `F`, and `Escape` are actually bound. Showing shortcuts that don't work is worse than showing none.

### 22. WatchlistSidebar active item detection is wrong (WatchlistSidebar.jsx:65)
Checks `new URLSearchParams(location.search).get('company')` to determine the active item. This only works on `/brief/new?company=X`. When viewing a generated brief at `/brief/123`, no company is "active" in the sidebar. When on any other page, no company is active. The active state is only ever correct for 1 second while the generator page is loading.

### 23. Deep Mind instruction is a placeholder joke (agents.py:61)
```python
"\nInstruction: Think extremely deeply, analyze step-by-step, and produce the most rigorous strategic details. (Erm, idk, think hard or something! 😂)"
```
This is a user-facing paid feature (Pro tier presumably) and the system prompt for "Deep Mind mode" literally contains "idk, think hard or something! 😂". This needs a proper, rigorous instruction.

### 24. Layout has excessive top padding (Layout.jsx:30)
`pt-32` = 128px top padding on main content. The navbar is `h-14` = 56px. That leaves 72px of dead empty space between the nav and content on every page. Should be `pt-20` or `pt-[calc(3.5rem+1.5rem)]`.

### 25. BriefDisplayPage doesn't scroll to top on tab change
When switching between tabs (Core Intelligence → Sales Strategy → Market Activity), if the user was scrolled to the middle of the previous tab, they're dropped mid-scroll into the new content. The window should scroll to the top of the content area on tab change.

### 26. `VercelNav` breadcrumb on share page is broken (VercelNav.jsx:22-25)
On `/brief/share/[token]`, the breadcrumb parses the path as `['brief', 'share', '[32-char-token]']`. Since the token isn't a number, it renders as a full raw token string in the breadcrumb: `PitchPulse › Brief › Share › abc123xyz...`. This is hideous and leaks implementation details. The share page shouldn't even use VercelNav — it has its own minimal header.

### 27. `CommandPalette` is mounted globally including on LandingPage (App.jsx:43)
`<CommandPalette />` and `<PWAInstallPrompt />` are rendered unconditionally for all routes, including unauthenticated routes like `/`, `/sign-in`, `/sign-up`, and `/brief/share/:token`. Pressing `F` or `⌘K` on the landing page opens the command palette. This is confusing and unintentional.

### 28. `BriefGeneratorPage` status messages interval is too slow (BriefGeneratorPage.jsx:58-64)
The generation progress steps cycle every 10 seconds (`setInterval(..., 10000)`). There are 7 steps. If generation takes 60 seconds total, you cycle through all 7 steps at 10s each, meaning after 70 seconds the last step was shown at second 60 and you're stuck on "Almost ready..." — fine. But if generation takes only 30 seconds, you only show 3 out of 7 steps, making it look incomplete. The interval should be based on average generation time, not an arbitrary 10s, or it should use a shorter interval (3-4s).

### 29. No 404 page (App.jsx:66-67)
The `path="*"` catch-all route just redirects to `/`, silently. A user sharing a broken or typo URL gets sent to the landing page with no explanation. Should render a proper 404 component.

### 30. BriefDisplayPage silently redirects on fetch error (BriefDisplayPage.jsx:56-59)
If the brief fetch fails (network error, 403, 404), it `navigate('/dashboard')` silently. The user has no idea why they were redirected. Should show an error state with a message and a manual "Go back" link.

### 31. Onboarding step 3 "You're all set" is underwhelming
The confirmation step only shows "X companies pinned" and "Brief length: Medium" — it doesn't tell the user what PitchPulse will do for them now, doesn't suggest a first action ("Generate your first brief →"), and has zero visual hierarchy or excitement. For a product whose value prop is speed and intelligence, the onboarding landing is bland.

### 32. Dashboard watchlist tab has no edit capability
The watchlist cards in the dashboard have a "Generate Brief" button but no way to edit the item (change folder_tag, add notes) or delete it. The API supports both. The WatchlistSidebar also has no edit button — only delete and generate. Users can't organize their watchlist after the fact without going through the API directly.

### 33. `StorageWidget` name is wrong
It's called `StorageWidget` (as in disk storage) but it represents an hourly rate limit. This name would confuse any developer reading the code. The file, component, and all references should be renamed to `RateLimitWidget` or `UsageWidget`.

---

## CODE QUALITY / ARCHITECTURE ISSUES

### 34. `_sanitize_company` rejects non-ASCII company names (app.py:51-53)
The regex `r"^[a-zA-Z0-9 .,\-'&/]+$"` rejects any character outside the ASCII subset. Real company names like "L'Oréal", "Häagen-Dazs", "Maersk A/S", or any company with accented/CJK characters fail validation and return "Invalid company_name". The sanitization should strip dangerous characters, not whitelist a narrow ASCII range.

### 35. `prefsStore` key name is inconsistent with backend (prefsStore.js:8)
`defaultView` (camelCase) in the frontend store vs `default_view` (snake_case) from the API. The preferences API endpoint accepts `default_view` but the store holds `defaultView`. If preferences are ever synced from the backend to the store, they'll be written to the wrong key and never read.

### 36. `agents.py` backup API key (`GROQ_API_KEY_2`) is referenced but may not exist
`Config.GROQ_API_KEY_2` is referenced in agents.py:131 but is not defined in `config.py` or `.env.example`. If the attribute doesn't exist on `Config`, accessing it would raise `AttributeError` on retry, crashing the generation instead of gracefully using the primary key.

### 37. `messages` array in `BriefGeneratorPage` recreated every render
The `messages` array (lines 47-55) is defined inside the component body without `useMemo`. It's recreated on every render. Since the `useEffect` depends on `messages.length`, every time the parent re-renders, this creates a new array reference — though the length stays the same so the effect doesn't retrigger. Still bad practice; should be `const` outside the component or wrapped in `useMemo`.

### 38. `useEffect` in `App.jsx` missing `setUser`/`clearUser` dependencies
```jsx
useEffect(() => { ... }, [clerkUser, isLoaded])
```
`setUser` and `clearUser` are used inside the effect but not listed as dependencies. React's exhaustive-deps rule would flag this. Minor in practice since Zustand setters are stable, but it's incorrect usage of the hook.

### 39. `BriefDisplayPage` has `SECTION_LABELS` and `SECTION_ICONS` — duplicated from `BriefGeneratorPage`
These constant maps are defined in both `BriefGeneratorPage.jsx` and `BriefDisplayPage.jsx` with identical values. Should be extracted into a shared `constants.js` file.

### 40. `api.js` response interceptor redirects on any 401, even on public pages
The interceptor does `window.location.href = '/sign-in'` for any 401 response globally. The SharePage calls `/api/share/:token` which is a public unauthenticated route — but it uses the same `api` axios instance. If the request somehow returns 401, the public share page would try to redirect the viewer to sign-in. Should have a way to opt out of the 401 redirect for public routes.

### 41. `scheduler.py` is unused in the web context
`check_and_run_due_briefs` is only triggered by the `POST /api/cron/process-scheduled` webhook. There's no background thread, no APScheduler, nothing automatic. The scheduled briefs feature is entirely dependent on an external cron service hitting the endpoint. The UI shows "Scheduled Scans" as a feature, but without the external cron configured, nothing ever runs. There's no in-app UI to tell users "scheduled briefs require external cron setup."

### 42. `HistoryPage` `savedOnly` filter sends `saved=` (empty string) when false
```js
`/api/briefs?...&saved=${savedOnly ? 'true' : ''}`
```
When `savedOnly` is false, it sends `saved=` (empty string). The backend checks `if saved_str is not None` — an empty string is not None, so it tries `empty_string.lower() == "true"` which is `False`, then filters for `saved=False`. This means when "Saved only" is OFF, the history actually returns ONLY non-saved briefs, not all briefs. To get all briefs, the `saved` param should be omitted entirely when not filtering.

### 43. No loading state in `WatchlistSidebar` when adding
When the user submits the add-company form, there's no loading indicator and the button doesn't disable. The user can spam-click the add button, sending multiple API requests for the same company.

### 44. `SharePage` never shows section items for `watch_out_for` or `job_signals`
Detailed in issue #14 above. The rendering logic hardcodes field names that don't match what the backend returns for these sections.

---

## MISSING FEATURES (noted as "built" but half-implemented)

### 45. User context per-brief override is missing from UI
The backend accepts `user_context` in `POST /api/brief`. The generator page has `[showContext, setShowContext]` state variables. The UI to expand/show the context textarea was never added. Users can't set per-brief context overrides.

### 46. Feedback is one-shot, not toggleable
Once you click thumbs up or down on a brief section, you can't change it. The button just calls `handleFeedback` which POSTs to the API and updates local state, but if you accidentally click thumbs down you can't switch to thumbs up. The API supports overwriting (it's a dict keyed by section), so clicking the other button should work, but the UX doesn't communicate that.

### 47. No way to create scheduled briefs from the UI
The "Scheduled Scans" tab shows scheduled items, but there's no "Add Scheduled Brief" button anywhere in the app. The API fully supports `POST /api/scheduled` but there's no UI to create one.

### 48. Stock chart only loads for authenticated users
`StockChart` calls the backend's authenticated `/api/stock?company=` endpoint. This means the financial chart never appears on the shared brief (`SharePage`) even though financials data is shown. The share page doesn't include the StockChart component at all, which is fine for now, but it's a gap in the feature parity.

---

## PRIORITY ORDER FOR FIXING

1. **JWT signature verification** — security hole, must fix immediately
2. **Fake financial data fed to LLM** — fabricated numbers go into real sales meeting briefs
3. **`last_search_result_count` thread-safety + last-query-only bias** — false 400 errors and race conditions in production
4. **Rate limit widget stale data** — core UX lie, high user impact
5. **Rate limit increments on failure** — users losing credits unfairly
6. **Fake AI model IDs crash generation** — Pro tier will be broken on launch
7. **HistoryPage load more duplicates** — broken core feature
8. **Scheduler `min_time` loses tasks permanently** — scheduled briefs silently disappear after any downtime
9. **Missing delete brief UI** — users can't manage their data
10. **SharePage empty item rendering** — core sharing feature broken for half the sections
11. **Settings `alert()`** — embarrassing for a premium product
12. **Fake searchMode toggle** — ship nothing, not fake features
13. **showContext UI missing** — promised feature with dead code
14. **Scheduled briefs no create UI** — feature advertised with no way to use it
15. **`/api/stock` IndexError crash** — unguarded list access on empty points array

---

## ADDITIONAL ISSUES (From Secondary Review)

### A1. Fake AI model IDs will crash brief generation on Pro launch (`AIChatInput.jsx:11-12`, `agents.py:137-139`)
The models dropdown includes two locked "Pro" models:
```javascript
{ id: 'groq/compound', name: 'Groq Compound', ... }
{ id: 'openai/gpt-oss-120b', name: 'GPT OSS (120B)', ... }
```
Neither of these is a real hosted model identifier that LiteLLM or Groq recognizes. The backend passes `model_id` directly to `LLM(model=model_path)`. The moment Pro tier ships and users can actually select these, every brief generation attempt with them will throw a LiteLLM `ModelNotFound` or API error, burning their rate limit credit (see Issue #3 — counter increments before generation).

**Fix:** Replace with real model IDs (e.g. `mixtral-8x7b-32768`, `llama3-70b-8192` for Groq; or remove until actual Pro infrastructure is in place).

### A2. `last_search_result_count` is thread-unsafe and tracks only the last query (`tools.py:13,31`, `app.py:217-225`)
`last_search_result_count` is a module-level global overwritten on every call to `company_web_search._run()`. `run_brief` runs 4 sequential search queries. After they all complete, the global holds only the count from the **4th query** — not an aggregate.

Two concrete failure modes:
1. **False 400 "Couldn't find data":** If the 4th query ("strategic initiatives…") returns 0 results for a real company while queries 1-3 had full results, the backend incorrectly tells the user "company not found" and the brief is never saved.
2. **Race condition in production:** Under gunicorn multi-worker/multi-thread, two simultaneous generations overwrite each other's count. Request A might get Request B's count, causing incorrect responses on both.

**Fix:** Replace the global with a local aggregate counter returned from `run_brief`, or pass it back via the return value. Never use module globals for per-request state.

### A3. Scheduler permanently loses tasks when cron is delayed more than 5 minutes (`scheduler.py:14-20`)
```python
min_time = now - timedelta(minutes=5)
max_time = now + timedelta(minutes=2)
due_briefs = ScheduledBrief.query.filter(
    ...
    ScheduledBrief.scheduled_for >= min_time  # ← this is the problem
).all()
```
If the cron trigger fires late (server restart, failed job, deploy) by more than 5 minutes, all tasks scheduled in that window fall below `min_time`. They remain `pending` forever — there is no retry, no re-queue, no alert. Users scheduled a brief that will silently never run.

**Fix:** Remove the `min_time` lower bound entirely. The upper bound `<= max_time` is sufficient to prevent running future tasks. Any `pending` task past its scheduled time should always be eligible.

### A4. `/api/stock` crashes with `IndexError` on empty `points` (`app.py:142-168`)
```python
hist = ticker.history(period="1mo")
if hist.empty:
    return jsonify({"error": "No historical stock data available"}), 404

points = []
for date, row in hist.iterrows():
    points.append(...)

info = {
    "current_price": round(float(ticker_info.get("currentPrice") or points[-1]["close"]), 2),
    ...
}
```
The `hist.empty` guard only checks the DataFrame. `points` is populated inside the loop — but if `hist.iterrows()` produces no rows for any other reason (e.g. the DataFrame has rows but all have NaN Close values, or a timezone edge case), `points` will be empty and `points[-1]` raises `IndexError`, returning a raw 500 to the user instead of a clean error.

**Fix:** Add `if not points: return jsonify({"error": "No historical stock data available"}), 404` after the loop.

### A5. Financial data tool generates MD5-based fake numbers for all non-hardcoded companies (`tools.py:78-95`)
For any company not in the 20-entry hardcoded dict, the tool fabricates revenue, growth, and employee counts from a hash of the company name:
```python
hash_val = int(hashlib.md5(key.encode()).hexdigest(), 16)
revenue = f"${rev_m / 1000:.1f}B"  # completely made up
growth = f"{(hash_val % 46) - 5}%"  # completely made up
```
These fake numbers are fed as "financial data" directly into the LLM context. The LLM then includes them in the `financials.snapshot` section of the brief — presented to the user as real intelligence they take into sales meetings. The disclaimer ("verify with official sources") is buried in the raw tool output string and is not surfaced in the UI. A sales rep could quote a fake "$47.3B revenue" figure to a prospect.

**Fix:** Replace with a real financial API integration (Yahoo Finance via yfinance — which is already installed and used in `/api/stock` — or a dedicated financial data provider). If no real data is available, return an explicit "No financial data available" string rather than plausible-looking fake numbers.

### A6. Scheduled brief date parsing is fragile and silent (`app.py:483`)
```python
scheduled_for = datetime.fromisoformat(data["scheduled_for"].replace("Z", "+00:00"))
```
If the client sends a format like `"2026-06-08 10:00:00+05:30"` (space separator, non-UTC offset), `fromisoformat` raises `ValueError`. The bare `except:` block catches it and returns a generic 400 with `"Invalid scheduled_for format"` — no hint of what format is expected. The frontend currently has no scheduling UI at all (see Issue #47), so this isn't user-facing yet, but it will be a silent breakage when the UI is built.

**Fix:** Use `datetime.fromisoformat()` wrapped in a specific `ValueError` catch, and document the expected format explicitly in both error message and API docs. Consider using `python-dateutil`'s `parse()` which handles most ISO 8601 variants.

### A7. Welcome email is dead code — never called (`email_service.py`, `app.py`)
`send_welcome_email()` is defined in `email_service.py` with full Resend integration, but it is never imported or called anywhere. New users are auto-created inside `_get_current_user()` with no notification, no welcome, and no onboarding prompt by email. The Resend API key is required in config (and validated on startup) but the only place it's actually used is `send_scheduled_brief()` in `scheduler.py`.

**Fix:** Either call `send_welcome_email()` after the new user creation block in `_get_current_user()`, or remove the function and stop requiring `RESEND_API_KEY` as mandatory config if it's genuinely not needed yet.
