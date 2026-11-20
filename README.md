# WinA

AI-powered Amazon affiliate marketing platform — built as a polished, publication-style marketing site.

## What this is
A clean, buyer-facing affiliate site for Amazon products. It leads with products (not verification), keeps every dashboard surface reachable from the footer and a single navigation group, and reads like a publication rather than generated AI slop.

Tracking ID: `shopnow047c-20` (user-provided; see flagged-review.html — not independently verified against Amazon Associates Central).

## Site structure
| Page | Purpose |
|------|---------|
| `index.html` | Publication front page — product-led hero + featured picks + guide preview |
| `products/index.html` (canonical) / `products.html` (preserved) | Product-intent confirmation register + outbound-link table + findings |
| `guides/index.html` + `guides/*.html` | Question-shaped buying guides (published to sitemap + RSS feed) |
| `suggestions.html` / `suggest.html` (preserved) | Suggestions section — review before implementing |
| `questions.html` | Pre-decision Q&A + missing-information discovery |
| `executive-summary.html` | Executive summary |
| `flagged-review.html` / `flagged.html` (preserved) | Flagged for Review — irregularities + unverified items |
| `campaign-ledger.html` | Empty, defined campaign ledger |
| `analytics.html` | Click & conversion measurement (5 defined events) |
| `disclosures.html` | Associates statement & compliance gate |
| `sitemap.xml` | Search-engine sitemap (one site to index) |
| `feed.xml` | RSS feed for guides |

## Key policies (implemented)
- **Disclosure above the fold** on every page (under the masthead), repeated in the footer.
- **All outbound product links marked sponsored** (`rel="sponsored noopener"`) with a visible sponsored chip.
- **Product-intent confirmation record**: intended ASIN, official listing URL, confirmation date, and source — kept in separate fields from the observed redirect target; the two are never merged.
- **Privacy-preserving click counter** + self-hosted analytics endpoint design (`assets/js/app.js`; `assets/js/click-tracker.js` preserved from the parallel session); five defined events: page_view, outbound_click, guide_read, reader_capture, disclosure_view.
- **Compliance gate**: Associates statement visible; disclosure placement and endorsement context reviewed against the Operating Agreement and FTC guidance.
- **Suggestions section**: no change goes live without a recorded decision.

## Verification status
All five submitted short links were fetched against the official Amazon listings on 2026-11-20 and resolved to verified 10-char ASINs:
- B04G1MEwY → B0CDY277D3 (Chefman 6 Qt Dual Basket Air Fryer Oven)
- B02NbDxp3 → B09B7SB46R (Emeril Lagasse 26QT French Door Air Fryer Toaster Oven)
- B00hJ57DV → B08DKYBTPH (Chefman 8 Qt TurboFry Air Fryer)
- B0c8moW59 → B0DHZTCNR5 (ThermoMaven 1 Sec Meat Thermometer)
- B0f3GKalj → B0DZFD6R9Z (CHEF iQ Sense Gen3 Wireless Meat Thermometer)

Observed redirect targets are recorded in a separate column and never merged with the official listing URL. Prices observed at fetch time are time-bound. Short-link path codes are 9 characters; ASINs are 10 characters (observation only, not a validity claim). Short-link compliance status is unresolved — do not claim the supplied short links are invalid; test one link per product in the enrolled Associates workflow before scaling.

See `products/index.html` and `flagged-review.html` for per-row sources and flags.

## Publishing
GitHub Pages (static). One site to index via `sitemap.xml`; guides syndicated via `feed.xml` (RSS). `.nojekyll` is set so Pages serves the site as-is.

## Parallel-session note
This branch (`arena/59299521-wina`) was merged into `main` via PR #7 after resolving an add/add merge conflict with PR #6 (session `arena/6bd1be15-wina`), which had already merged a parallel flat-file build to `main`. Both sessions' work is preserved: the directory-based build is canonical; the parallel session's flat pages (`products.html`, `guides.html`, `flagged.html`, `suggest.html`), plus `executive-summary.html`, `questions.html` and `assets/js/click-tracker.js`, are retained with canonical tags pointing to the canonical pages.
