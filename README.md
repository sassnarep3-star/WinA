# The Crisp Counter 🍳

**Live site: https://sassnarep3-star.github.io/WinA/**

A publication-style Amazon affiliate site for a five-product kitchen lineup (three air
fryers, two cooking thermometers), promoted under Associates tracking ID
`shopnow047c-20`. It is designed to read like a shop a buyer can act on — question-shaped
guides, source-linked product facts, marked sponsored links — with the verification
machinery kept reachable in a "data room" instead of in the reader's face.

> **Disclosure:** As an Amazon Associate, The Crisp Counter earns from qualifying
> purchases. Every product link is a marked, `rel="sponsored"` affiliate link.

## What's on the site

| Surface | Pages | Purpose |
|---|---|---|
| Front | `index.html` | Publication front page: featured lineup, guides, seasonal note |
| Shop | `shop.html`, `compare.html` | All 5 products by category + full source-linked comparison table |
| Guides | `guides/` | 4 question-shaped buyer guides (working editorial hypotheses, labeled as such) |
| Decisions | `suggestions.html`, `questions.html` | Review-before-build suggestion queue · open-questions register |
| Summary | `executive-summary.html`, `about.html` | One-page project state · method & money disclosure |
| Data room | `data-room/` | Source register, product-intent record, campaign ledger (empty by design), measurement spec, compliance gate, **Flagged for Review**, methodology |

## Verification rules (enforced, not aspirational)

1. Every product fact was read from the official Amazon listing on **2026-11-20** and is
   stamped with that observation date.
2. Every table row is source-linked or explicitly flagged `unverified` — blanks are never
   guessed. See `data-room/source-register.html`.
3. Submitted identifiers and observed redirect targets are kept in **separate fields** and
   never merged (`data-room/product-intent.html`).
4. Listing-internal contradictions are published as contradictions (FLG-004, FLG-007).
5. `tools/check_site.py` re-checks disclosures, `rel="sponsored"` tags, source rows, and
   link integrity on every change (CI workflow `.github/workflows/site.yml`).

Run the gate locally:

```bash
python3 tools/check_site.py   # exits non-zero on any violation
```

## Machinery

- **SEO:** `sitemap.xml`, `robots.txt`, canonical tags, Open Graph, JSON-LD
  (WebSite/Article/FAQPage — deliberately conservative, no Product offers markup until
  G-4 confirms the links).
- **RSS:** `feed.xml` — every new guide lands here and in the sitemap.
- **Analytics:** privacy-preserving five-event layer (`assets/js/analytics.js`), no
  cookies/PII/third parties, fail-closed until the self-hosted endpoint
  (`analytics/worker.js`) is deployed — steps in `analytics/README.md`.
- **Compliance gate:** G-1…G-3 automated in CI; G-4…G-7 human checklists on
  `data-room/compliance-gate.html`.

## Open items for the owner (nothing else blocks)

1. **O-1 / G-4** — test one tagged Special Link per product in Associates; confirm the
   destination + tracking report for `shopnow047c-20`; then fill the intent record.
2. **O-2 / G-5** — sign off disclosure placement + endorsement context (checklist shipped).
3. **O-3 / G-6** — deploy `analytics/worker.js` and set the `cc-endpoint` meta tag.
4. **O-4** — Search Console verification token; approve (or decline) price-check automation.

All eight flags (FLG-001…FLG-008) are published on the site's
[Flagged for Review](https://sassnarep3-star.github.io/WinA/data-room/flagged.html) page
with source links.

## Repository layout

```
index.html … about.html      reader-facing pages
guides/                      question-shaped buyer guides
data-room/                   verification & compliance surfaces
assets/                      css, js, editorial imagery
analytics/                   self-hosted collect endpoint (worker + docs)
tools/check_site.py          automated compliance & link gate
.github/workflows/site.yml   CI: runs the gate on every push/PR
COORDINATION.md              shared task board (multi-session protocol)
```

See `COORDINATION.md` for the task log, sources used, verification performed, and the PR /
Pages-publish record.
