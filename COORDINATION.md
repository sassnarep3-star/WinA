# Coordination — WinA (Amazon affiliate publication site)

Shared task board for parallel agent sessions. Read before claiming work.

## Session & branch
- Branch: `arena/59299521-wina` (branched from `main` at `df3e9534`)
- Base commit: `df3e9534 Initial commit`
- Active session ID: `arena/59299521-wina` (only active session in this sandbox)
- Rule: claim a task by writing your session ID + file scope, commit and push the claim immediately, and never start a task another session has claimed. Claims idle > 60 minutes may be taken over; note the handoff here.

## Task status

| ID | Task | Status | Owner | File scope | Sources verified |
|----|------|--------|-------|------------|------------------|
| T1 | COORDINATION.md task board setup + claims | in progress | arena/59299521-wina | COORDINATION.md | — |
| T2 | Repo review + product-intent confirmation records (5 Amazon links) | in progress | arena/59299521-wina | products/index.html, index.html, flagged-review.html | Repo state (git log); Amazon links NOT fetchable from this sandbox (see irregularities) |
| T3 | Publication-style landing page (front page; leads with products) | planned | arena/59299521-wina | index.html, assets/css/style.css | — |
| T4 | Category subpages + entries/findings tables + analysis | planned | arena/59299521-wina | products/index.html | — |
| T5 | Disclosure strip above the fold + footer on every page; `rel="sponsored"` on outbound product links | planned | all HTML pages | — |
| T6 | Privacy-preserving outbound click counter + self-hosted analytics endpoint design; 5 defined events | planned | arena/59299521-wina | assets/js/app.js, analytics.html | — |
| T7 | Sitemap.xml + RSS feed; each guide added to both | planned | arena/59299521-wina | sitemap.xml, feed.xml | — |
| T8 | Question-shaped guides (4 working titles, editorial hypotheses) | planned | arena/59299521-wina | guides/*.html | — |
| T9 | Empty but defined campaign ledger (timestamp, source, channel, eligible sessions, clicks, reported orders; dated provenance trail) | planned | arena/59299521-wina | campaign-ledger.html | — |
| T10 | Compliance gate page: Associates statement, FTC/Operating Agreement review notes | planned | arena/59299521-wina | disclosures.html | — |
| T11 | "Flagged for Review" page: irregularities + unverified items with source links | planned | arena/59299521-wina | flagged-review.html | — |
| T12 | GitHub Pages enable + deploy verification (no broken links) | planned | arena/59299521-wina | repo Pages settings | — |
| T13 | Pull request from integration branch to `main`; merge; confirm Pages deploy; record PR link + result here | planned | arena/59299521-wina | COORDINATION.md | — |

## Irregularities & unverified items (also published on /flagged-review.html)

1. **Amazon product links cannot be verified from official sources in this environment.** The five `https://link.amazon/...` short links could not be fetched (sandbox outbound access is limited to github.com / api.github.com / registry.npmjs.org / pypi.org; amazon.com is not reachable). Per project guidance, the short links are NOT claimed to be invalid — their compliance status is unresolved (flagged FLG-003 equivalent).
2. **Product-intent confirmation record:** for each of the 5 submitted links, intended ASIN, official listing URL, confirmation date, source, and observed redirect target are left **blank** and flagged **unverified**. Values will be filled only from an official Amazon listing after manual review. The redirect target is kept in a separate field and never merged with the official listing URL.
3. **ASIN-format observation (flagged, not a validity claim):** each short-link path contains a 9-character code (e.g. `B04G1MEwY`). Amazon ASINs are exactly 10 alphanumeric characters, so these path segments are short-link keys, not ASINs. This is an observation only; it does not invalidate the links.
4. **Editorial guide titles are working titles/hypotheses only** ("Basket or oven-style air fryer: what should you compare?", etc.). They are not claims about popularity, search volume, or product superiority.
5. **Analytics endpoint:** GitHub Pages is static hosting, so a server-side `/analytics/collect` endpoint cannot run here. Events are logged client-side (privacy-preserving: no cookies, no fingerprinting, no IP storage) with a beacon to the self-hosted endpoint path; the endpoint must be implemented where the site is hosted server-side. Falls back to local-only logging.
6. **Reader-capture form:** newsletter capture form posts client-side only; no third-party backend integrated. Backend integration pending manual review.

## Merge policy
Flagged/unverified items do **not** block the merge. They are published on the labeled "Flagged for Review" page so they can be reviewed after the site is live.
