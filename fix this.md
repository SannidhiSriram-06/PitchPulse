# PitchPulse — Non-Security Codebase Review & Issue Log

This document tracks all identified functional bugs, UI/UX issues, and architectural suggestions across the PitchPulse codebase. Security-related items have been omitted per safety guidelines.

---

## ✅ RESOLVED ISSUES

The following issues have been fully resolved in the codebase:

1. **Mock Pro Model IDs Fixed:** Replaced placeholder Pro models with real Groq-supported model IDs (`mixtral-8x7b-32768` and `gemma2-9b-it`) in [constants.js](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/frontend/src/utils/constants.js) and matched validation logic in [agents.py](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/backend/agents.py).
2. **Watchlist Card Deletion Added:** Implemented direct watchlist removal capability in the dashboard tab card view inside [DashboardPage.jsx](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/frontend/src/pages/DashboardPage.jsx).
3. **Watchlist Sidebar Spam Protection:** Implemented an `adding` state, disabled input/buttons, and integrated a loading spinner during submission in [WatchlistSidebar.jsx](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/frontend/src/components/WatchlistSidebar.jsx) to prevent duplicate API requests.
4. **Rate Limit Widget Syncing:** `authStore` now contains `consumeBriefCredit` and `refreshUsage` to sync remaining count correctly.
5. **Load More Pagination on History:** Fixed [HistoryPage.jsx](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/frontend/src/pages/HistoryPage.jsx) load-more logic to calculate correct offset inline using `briefs.length`.
6. **Empty Section Content on SharePage:** Implemented `extractItemFields` in [SharePage.jsx](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/frontend/src/pages/SharePage.jsx) to correctly extract text fields for all structures.
7. **VercelNav Breadcrumb Cleanup:** The share token segment is now filtered to display "Shared Brief" instead of raw token strings.
8. **Non-ASCII Company Name Handling:** `_sanitize_company` in [app.py](file:///Users/sannidhidurgapavansriram/Sriram/My%20Edu/BITSOM%20Programs/Pitchpulse_Upgrade/backend/app.py) has been updated to use unicode normalization and patterns to allow accents/CJK.
9. **Action Buttons Layout:** Standardized into a clean flex layout wrapper.
