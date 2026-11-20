# COORDINATION.md — shared task board

Project: **The Crisp Counter** (Amazon affiliate publication) — repo `sassnarep3-star/WinA`
Working branch for this session: `arena/580f4c6d-wina` (branched from `main` @ df3e953).
Session ID for this agent: `arena/580f4c6d-wina`.

Rules honored: tasks are claimed before work starts; scopes are file-disjoint per task; finished
tasks record sources, verification performed, and irregularities; "needs review" items are
published on the site's Flagged for Review page and block nothing; shared outputs (site index,
navigation, table data) change only in the integration task (T-08).

## Task table

| ID  | Task | Status | Owner (session) | File scope | Notes |
|-----|------|--------|-----------------|------------|-------|
| T-01 | Repo review + source register (compliance/official sources) | done | arena/580f4c6d-wina | `data-room/source-register.html`, `data-room/method.html` | Sources listed below; OA page verified live 2026-11-20 |
| T-02 | Product link resolution + listing fact verification (5 products) | done | arena/580f4c6d-wina | `data-room/product-intent.html`, `shop.html`, `compare.html` | All 5 `link.amazon/*` links resolved to canonical `amazon.com/dp/<ASIN>` listings; facts captured 2026-11-20 |
| T-03 | Publication front (landing, brand, nav, disclosure strip, imagery) | done | arena/580f4c6d-wina | `index.html`, `about.html`, `assets/**` | Disclosure strip under masthead on every page + footer repeat |
| T-04 | Question-shaped buyer guides (4 working titles) + guides hub | done | arena/580f4c6d-wina | `guides/**` | Editorial hypotheses from owner brief; no popularity claims |
| T-05 | Suggestions decision queue + open-questions register + executive summary | done | arena/580f4c6d-wina | `suggestions.html`, `questions.html`, `executive-summary.html` | Proposals staged "awaiting decision"; nothing implemented from the queue without review |
| T-06 | Data room: intent record, campaign ledger, measurement spec, compliance gate, flagged page | done | arena/580f4c6d-wina | `data-room/**` | Campaign ledger intentionally empty (no first-party reports yet) |
| T-07 | Findability + machinery: sitemap, RSS, robots, checker script, CI gate | done | arena/580f4c6d-wina | `sitemap.xml`, `feed.xml`, `robots.txt`, `tools/**`, `.github/**` | `tools/check_site.py` = automated gate (disclosure, rel=sponsored, source rows, broken links) |
| T-08 | Final integration: re-verify combined data, build check, PR → main, Pages publish | done | arena/580f4c6d-wina | `README.md`, `COORDINATION.md`, merge commit | PR #1 merged to main 2026-11-20; Pages live at https://sassnarep3-star.github.io/WinA/ |
| T-09 | Analytics layer (5 events, outbound-click counter, self-hosted endpoint spec) | done | arena/580f4c6d-wina | `assets/js/analytics.js`, `analytics/**`, `data-room/measurement.html` | Client ships no cookies/PII; endpoint deploy = owner action O-3 |

No other sessions are active. If a second session appears, claim only `unclaimed` rows above,
work on branch `session-<id>/<task>`, and keep to your file scope.

## Sources used (official)

| Use | Source | URL | Checked |
|-----|--------|-----|---------|
| Disclosure duty (FTC) | FTC — Guides Concerning the Use of Endorsements and Testimonials in Advertising, 16 CFR Part 255 | https://www.ftc.gov/legal-library/browse/rules/guides-concerning-use-endorsements-testimonials-advertising | 2026-11-20 |
| Disclosure duty (FTC FAQ) | FTC — The FTC's Endorsement Guides: What People Are Asking | https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking | 2026-11-20 |
| Disclosure duty (FTC how-to) | FTC — Disclosures 101 for Social Media Influencers | https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers | 2026-11-20 |
| Disclosure text (regulation) | eCFR — 16 CFR Part 255 | https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255 | 2026-11-20 |
| Special Links / tagging rules | Amazon Associates Program Operating Agreement (updated 2025-10-15) | https://affiliate-program.amazon.com/help/operating/agreement | 2026-11-20 |
| Participation requirements, IP license | Amazon Associates Program Policies | https://affiliate-program.amazon.com/help/operating/policies | 2026-11-20 |
| Product facts (all 5) | Amazon.com official listing pages `amazon.com/dp/<ASIN>` (buy box, rating, specs, images) | see `data-room/product-intent.html` rows | 2026-11-20 |
| ASIN definition | Amazon — What is an ASIN? (Seller Central help) | https://sellercentral.amazon.com/help/hub/reference/external/G200386250 | 2026-11-20 (URL form; page may require login — see FLG-006) |

## Verification performed (2026-11-20)

1. Each of the five submitted `link.amazon/...` links was fetched and its redirect target recorded
   (kept strictly separate from the submitted identifier). Targets are canonical
   `https://www.amazon.com/dp/<ASIN>` pages; titles, breadcrumbs, buy-box price/stock/seller,
   rating + rating counts, list prices, and product-detail rows were read from those pages.
2. Every fact table on the site links to its official source; unconfirmed cells are left blank
   and flagged `unverified` (see `tools/check_site.py` rules R-01…R-08).
3. Compliance URLs above were fetched (live page titles confirmed) before citation.

## Irregularities (see Flagged for Review page)

- FLG-001: submitted identifiers (e.g. `B04G1MEwY`) are 9-character tokens, not canonical
  10-character ASINs. Not merged with observed targets.
- FLG-002: tracking ID `shopnow047c-20` cannot be validated without Associates report access;
  tagged link attribution is unconfirmed (pilot state).
- FLG-003: `link.amazon/...` short links' compliance status is unresolved (not claimed valid or
  invalid); observed redirect targets recorded separately.
- FLG-004: Chefman 8 QT listing title says "450°F Hi-Fry" while its bullets say "200–400°F"
  range — official page is internally inconsistent; both claims quoted as-is with source.
- FLG-005: product thumbnails are hot-linked from Amazon's media CDN (m.media-amazon.com);
  replace with PA-API-sourced images when API access is active.
- FLG-006: ASIN-definition help URL may require Seller Central login to view.

## Owner actions (cannot be automated — logged in `data-room/compliance-gate.html`)

- O-1: Confirm Associates enrollment for `shopnow047c-20`, test one Special Link per product,
  confirm destination + tracking report (gate G-4 before link scale-up).
- O-2: Review disclosure placement + endorsement context vs Operating Agreement + FTC guidance
  (human sign-off, gate G-5).
- O-3: Deploy `analytics/worker.js` to a first-party endpoint and set `data-endpoint` (gate G-6).
- O-4: Add Google Search Console verification token (site ships the meta-tag hook).

## Log

- 2026-11-20 — session `arena/580f4c6d-wina` created this board, claimed T-01…T-09 (no competing
  claims existed), built the site, ran `tools/check_site.py` (pass), opened PR #1 to `main`,
  merged (squash), confirmed GitHub Pages deploy: https://sassnarep3-star.github.io/WinA/ —
  final page check performed against the live URL. Merge result + PR link recorded here per rules.
  PR: https://github.com/sassnarep3-star/WinA/pull/1 (merged 2026-11-20).
