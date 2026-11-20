# archive/arena-574fc8eb-wina — session 574fc8eb's site build

This directory preserves the complete site build produced by Arena session `574fc8eb`
(branch `arena/574fc8eb-wina`) as a self-contained, reproducible unit, following this
repository's convention of archiving each session's build instead of serving a second
root-level site (see `COORDINATION.md`, "Session history").

**The live site at the repository root is not this build.** This archive exists so the
work stays reviewable and machine-verifiable:

```bash
python3 archive/arena-574fc8eb-wina/scripts/build_site.py   # rebuild inside the archive
python3 archive/arena-574fc8eb-wina/scripts/check_site.py   # gate — exit 1 on violation
```

CI runs both on every push (`.github/workflows/gate.yml`).

## What is in here

| Path | What it is |
| --- | --- |
| `index.html` … `search.html` + `guides/` | 15 generated pages: publication front page, shelf, 5 guides, analysis, suggestions review, questions, executive summary, flagged, platform, search |
| `data/products.json` | product-intent record: intent fields (blank) vs observed fields (dated, sourced) — never merged |
| `data/sources.json` | source register — every official page fetched 2026-11-20, with what it supports |
| `data/flags.json` | 10 flagged irregularities (ids `FLG-001..010` **in this archive's namespace**, distinct from main's `data/governance.json` register) |
| `data/suggestions.json` | 24 suggestions + the three review paths (records-only chooser) |
| `data/questions.json` | 15 decision-blocking questions with defaults |
| `data/analytics-events.json` | the five documented events + endpoint contract |
| `data/campaign-ledger.csv` | header-only ledger; rows only from authorized first-party reports |
| `scripts/build_site.py` | generator (pages + sitemap + feed + robots + search index), stdlib only |
| `scripts/check_site.py` | compliance gate: disclosure above `<main>` + footer, exact OA §5 wording, `rel="sponsored"` + `tag=shopnow047c-20` on every Amazon link, official source on every data-table row, host whitelist, internal-link integrity, sitemap/feed/search coverage, data↔page sync, empty ledger |
| `assets/` | publication stylesheet, site behaviour, privacy-preserving 5-event counter (no cookies/IPs, DNT-respecting) |
| `tools/analytics_endpoint.py` | self-hosted event endpoint (no IP/UA logging) — note: main ships its own collector at `scripts/analytics-server.mjs` + `_worker/collector.js` |

## Key official sources (all fetched 2026-11-20; full register on `platform.html`)

- Associates Operating Agreement (Updated Oct 15, 2025): https://affiliate-program.amazon.com/help/operating/agreement
- Associates Program Policies (Updated Apr 14, 2026): https://affiliate-program.amazon.com/help/operating/policies
- Creators API ASIN definition (10 characters): https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-items
- Google `rel="sponsored"` guidance: https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
- FTC Disclosures 101: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
- GitHub Pages publishing sources: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Independently verified product map (agrees with main's register): B04G1MEwY → B0CDY277D3 ·
B02NbDxp3 → B09B7SB46R · B00hJ57DV → B08DKYBTPH · B0c8moW59 → B0DHZTCNR5 ·
B0f3GKalj → B0DZFD6R9Z.
