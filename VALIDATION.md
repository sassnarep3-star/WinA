# Build validation report

Generated 2026-11-20 by `_src/build.mjs` (deterministic: no wall-clock timestamps).

**Result: PASSED** — 0 failure(s), 0 warning(s).

## Checks

- `PASS` 33 HTML pages generated
- `PASS` every page carries the disclosure strip above the fold
- `PASS` every page carries the exact statement required by OA §5
- `PASS` every page declares a canonical URL
- `PASS` every Amazon anchor is either a tagged sponsored link or a declared non-affiliate citation
- `PASS` no star ratings or review quotes displayed anywhere
- `PASS` every stated guide count matches the 7 guides published
- `PASS` no spec carries a value while marked unverified or withheld
- `PASS` all 10 policy checks quote a clause and link a primary source
- `PASS` all internal links resolve across 32 pages
- `PASS` single build owns the served root; no prior site resurrected
- `PASS` archive intact: 83 files preserved from three prior builds
- `PASS` sitemap lists all 32 pages

## What the gate enforces

| Check | Rule it protects |
|---|---|
| Disclosure strip on every page | Operating Agreement §5, FTC Disclosures 101 |
| Exact Associate statement on every page | Operating Agreement §5 |
| Canonical URL on every page | One site to index |
| Tracking tag on every product link | Attribution |
| `rel="sponsored"` on every Amazon anchor | FTC endorsement disclosure |
| No star ratings or review quotes | Program Policies §6(t) |
| No valued-but-unverified specs | No fabrication |
| Every policy row has a quote + source | Auditable compliance |
| All internal links resolve | No broken site |
| Sitemap covers every page | Indexability |

## Note

Warnings about dollar figures outside guide pages are expected for the policy and pricing
discussion pages, where a currency symbol appears in prose about *why* prices are not shown.
No product price is printed anywhere on the site.
