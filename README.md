# WinA — Kitchen Field Guide

A publication-grade Amazon affiliate site for five owner-supplied product links — three air
fryers and two meat thermometers — plus the small, auditable pipeline that builds, verifies,
and gates it.

**Live site:** https://sassnarep3-star.github.io/WinA/ (GitHub Pages, published from `main`)
**Tracking ID:** `shopnow047c-20` (owner-supplied; active status unconfirmed — see FLG-005)

## Principles (enforced, not aspirational)

1. **Lead with products.** The front page is a shop/publication page; every dashboard surface
   lives in one footer nav group.
2. **Disclosure above the fold, every page.** Exact Operating Agreement §5 sentence under the
   masthead and again in the footer — machine-checked on every build.
3. **Every outbound product link is sponsored.** `rel="sponsored nofollow"` + the tracking tag —
   machine-checked on every build.
4. **Every table row carries an official source link.** Unconfirmable values are blank and tagged
   `unverified` — never inferred.
5. **Intent and observed are never merged.** `intended_asin / intended_listing_url /
   confirmation_date / intent_source` stay blank until the owner confirms them.
6. **No hype scores, no revenue forecasts, no demand claims.** The campaign ledger is empty by
   design until authorized first-party reports exist.

## Commands

```bash
python3 scripts/build_site.py     # render pages + sitemap.xml + feed.xml + robots.txt + search-index.json
python3 scripts/check_site.py     # the gate — exit 1 on any violation; must pass before every push
```

Standard library only — no dependencies, no build toolchain.

## Layout

| Path | What it is |
| --- | --- |
| `data/products.json` | product-intent record: intent fields (blank) vs observed fields (dated, sourced) |
| `data/sources.json` | source register — every official page fetched, with what it supports |
| `data/flags.json` | the 10 flagged irregularities (published on /flagged/) |
| `data/suggestions.json` | suggestions + the three paths for the review-and-choose page |
| `data/questions.json` | the 15 decision-blocking questions with defaults |
| `data/analytics-events.json` | the five documented events + endpoint contract |
| `data/campaign-ledger.csv` | header-only ledger; rows only from authorized first-party reports |
| `scripts/build_site.py` | the generator (all HTML, feed, sitemap, robots, search index) |
| `scripts/check_site.py` | the gate: disclosure, sponsored links, source coverage, link integrity, sync |
| `tools/analytics_endpoint.py` | self-hosted, privacy-preserving event endpoint (no IP/UA logging) |
| `assets/` | stylesheet, site behaviour, privacy-preserving analytics counter |
| `COORDINATION.md` | shared task board, verification log, irregularities, deployment record |

## Pages

Home (`index.html`) · The shelf (`products.html`) · Guides (`guides/`) · Field notes /
analysis (`analysis.html`) · Suggestions review (`suggestions.html`) · Open questions
(`questions.html`) · Executive summary (`executive-summary.html`) · Flagged for review
(`flagged.html`) · Platform & sources (`platform.html`) · Search (`search.html`)

Machine-readable: `sitemap.xml`, `feed.xml` (RSS), `robots.txt`, `search-index.json`.

## Key official sources (all fetched 2026-11-20; full register on /platform/)

- Associates Operating Agreement (Updated Oct 15, 2025): https://affiliate-program.amazon.com/help/operating/agreement
- Associates Program Policies (Updated Apr 14, 2026): https://affiliate-program.amazon.com/help/operating/policies
- Creators API ASIN definition (10 characters): https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-items
- Google `rel="sponsored"` guidance: https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
- FTC Disclosures 101: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
- GitHub Pages publishing sources: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Review surfaces

- **Flagged for review** — every irregularity with sources: `/flagged/`
- **Open questions** — what must be answered before decisions: `/questions/`
- **Suggestions review** — review, filter, and choose a path (records only, applies nothing): `/suggestions/`

See `COORDINATION.md` for the task board, the full verification log, and the deployment record.
