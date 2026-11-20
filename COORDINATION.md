# Coordination — WinA (Amazon affiliate publication site)

Shared task board for parallel agent sessions. Read before claiming work.

## Session & branch
- Branch: `arena/59299521-wina` (branched from `main` at `df3e9534`)
- Base commit: `df3e9534 Initial commit`
- Active session ID: `arena/59299521-wina`
- Parallel session: `arena/6bd1be15-wina` (merged to `main` via PR #6 before this branch; its work was merged in during this session's PR #7 merge conflict resolution — see Merge log below)

## Task status

| ID | Task | Status | Owner | File scope | Sources verified |
|----|------|--------|-------|------------|------------------|
| T1 | COORDINATION.md task board setup + claims | done | arena/59299521-wina | COORDINATION.md | git log (base df3e9534) |
| T2 | Repo review + product-intent confirmation records (5 Amazon links) | done | arena/59299521-wina | products/index.html, index.html, flagged-review.html | All 5 short links fetched against official Amazon listings on 2026-11-20 (amazon.com/dp/*); per-row sources in products/index.html |
| T3 | Publication-style landing page (front page; leads with products) | done | arena/59299521-wina | index.html, assets/css/style.css, assets/js/app.js | — |
| T4 | Category subpages + entries/findings tables + analysis | done | arena/59299521-wina | products/index.html | Official Amazon listing pages per row |
| T5 | Disclosure strip above the fold + footer on every page; `rel="sponsored"` on outbound product links | done | arena/59299521-wina | all HTML pages, assets/js/app.js | — |
| T6 | Privacy-preserving outbound click counter + self-hosted analytics endpoint design; 5 defined events | done | arena/59299521-wina | assets/js/app.js, analytics.html (click-tracker.js preserved from parallel session) | — |
| T7 | Sitemap.xml + RSS feed; each guide added to both | done | arena/59299521-wina | sitemap.xml, feed.xml | — |
| T8 | Question-shaped guides (4 working titles + thermometer guide, editorial hypotheses) | done | arena/59299521-wina | guides/*.html | — |
| T9 | Empty but defined campaign ledger (timestamp, source, channel, eligible sessions, clicks, reported orders; dated provenance trail) | done | arena/59299521-wina | campaign-ledger.html | — |
| T10 | Compliance gate page: Associates statement, FTC/Operating Agreement review notes | done | arena/59299521-wina | disclosures.html | affiliate-program.amazon.com; ftc.gov (linked for manual review) |
| T11 | "Flagged for Review" page: irregularities + unverified items with source links | done | arena/59299521-wina | flagged-review.html | affiliate-program.amazon.com (linked for manual review) |
| T12 | Dedicated suggestions section: review suggestions and choose path before implementing | done | arena/59299521-wina | suggestions.html | — |
| T13 | GitHub Pages enable + deploy verification (no broken links) | pending | arena/59299521-wina | repo Pages settings | — |
| T14 | Pull request from integration branch to `main`; merge; confirm Pages deploy; record PR link + result here | pending | arena/59299521-wina | COORDINATION.md | — |

## Merge log (parallel-session coordination)

- PR #6 (session `arena/6bd1be15-wina`) merged to `main` first: a complete flat-file build (`index.html`, `products.html`, `guides.html`, `flagged.html`, `suggest.html`, `questions.html`, `executive-summary.html`, `assets/js/click-tracker.js`, `feed.xml`, `sitemap.xml`, `.nojekyll`).
- This branch (PR #7) added the directory-based canonical build (`products/index.html`, `guides/*.html`, `campaign-ledger.html`, `analytics.html`, `disclosures.html`, `suggestions.html`, `flagged-review.html`, `404.html`, `robots.txt`).
- Merge conflict resolution (6 add/add files): kept this session's versions of `index.html`, `assets/css/style.css`, `assets/js/app.js`, `feed.xml`, `sitemap.xml`, `COORDINATION.md`; enriched `index.html` with the parallel session's Open Graph + JSON-LD head tags; merged the parallel session's extra thermometer guide item into `feed.xml` (new page `guides/instant-read-or-wireless.html`); added `executive-summary.html` and `questions.html` URLs to `sitemap.xml`.
- Parallel-session flat duplicate pages (`products.html`, `guides.html`, `flagged.html`, `suggest.html`) are preserved (not discarded) and carry `rel="canonical"` pointing to the canonical pages (`/products/`, `/guides/`, `/flagged-review.html`, `/suggestions.html`) so search engines index one site. They are not listed in `sitemap.xml`.
- No work from either session was discarded. Conflict resolved by editing, then committed on this branch and pushed before merging PR #7.

## Verification performed (T2)

Fetched each submitted short link and confirmed the destination on the official Amazon listing page:

| # | Submitted link | Official listing URL (destination) | Intended ASIN | Product title (official listing page title) | Price observed at fetch (2026-11-20) | Status |
|---|----------------|------------------------------------|---------------|---------------------------------------------|--------------------------------------|--------|
| 1 | https://link.amazon/B04G1MEwY | https://www.amazon.com/dp/B0CDY277D3 | B0CDY277D3 | CHEFMAN 6 Quart Dual Basket Air Fryer Oven ... | $74.99 | Verified — official listing reached |
| 2 | https://link.amazon/B02NbDxp3 | https://www.amazon.com/dp/B09B7SB46R | B09B7SB46R | Emeril Lagasse 26QT French Door Multi-Function Air Fryer Toaster Oven ... | $229.99 | Verified — official listing reached |
| 3 | https://link.amazon/B00hJ57DV | https://www.amazon.com/dp/B08DKYBTPH | B08DKYBTPH | Chefman Air Fryer 8 Qt | TurboFry® 4-in-1 ... | $59.99 | Verified — official listing reached |
| 4 | https://link.amazon/B0c8moW59 | https://www.amazon.com/dp/B0DHZTCNR5 | B0DHZTCNR5 | ThermoMaven 1 Sec Professional Digital Meat Thermometer ... | $16.99 | Verified — official listing reached |
| 5 | https://link.amazon/B0f3GKalj | https://www.amazon.com/dp/B0DZFD6R9Z | B0DZFD6R9Z | CHEF iQ Sense | Smart Wireless Meat Thermometer | 3 Ultra-Thin Probes ... | $139.99 | Verified — official listing reached |

Notes: (a) observed redirect target is stored in a separate column and never merged with the official listing URL (for all 5 the redirect target equals the official dp URL); (b) prices were observed on the official listing pages on 2026-11-20 and are time-bound — Amazon prices change without notice; (c) short-link path codes are 9 characters; Amazon ASINs are 10 characters — the path codes are link keys, not ASINs (observation only; not a claim that links are invalid, per FLG-003 guidance). Category mix: 3 air fryers, 2 meat thermometers.

## Irregularities & flagged items (published on /flagged-review.html)

1. **FLG-003 (short-link compliance):** per project guidance, the supplied short links are NOT claimed to be invalid; their exact compliance status is unresolved. Test one link per product in the enrolled Associates workflow before scaling.
2. **FLG-002 (ASIN-format observation):** short-link path codes are 9 chars; ASINs are 10 chars. Observation only.
3. **FLG-006 (static hosting):** GitHub Pages is static, so a server-side `/analytics/collect` endpoint cannot run here. Events are logged client-side (privacy-preserving: no cookies, no fingerprinting, no IP storage) with a beacon to the endpoint path; local-only fallback implemented. Server-side endpoint implementation pending. `assets/js/click-tracker.js` (parallel session) is preserved as an alternative implementation with a configurable endpoint.
4. **FLG-007 (reader capture):** newsletter capture form posts client-side only; no third-party backend integrated. Backend integration pending.
5. **FLG-008 (commission/conversion data):** campaign ledger is intentionally empty; no conversion score or revenue forecast is presented. Data added only from authorized first-party Associates reports with dated provenance.
6. **FLG-009 (tracking ID):** `shopnow047c-20` is user-provided; not independently verified against Amazon Associates Central (requires account login). Confirm Site(s) enrollment before scaling traffic.

## Editorial note
The guide titles are working titles / editorial hypotheses only ("Basket or oven-style air fryer: what should you compare?", etc.). They are not claims about popularity, search volume, or product superiority. Category focus: kitchen & small appliances (air fryers + meat thermometers).

## Merge policy
Flagged/unverified items do **not** block the merge. They are published on the labeled "Flagged for Review" page so they can be reviewed after the site is live.
