# Countertop Report

A specification-led buying-notes site for five Amazon products in two categories:
three air fryers and two meat thermometers.

**Live:** https://sassnarep3-star.github.io/WinA/

It is built to a single rule: **a fact is published only when a primary source states it,
and that source is linked from the same row.** Anything else says "Not confirmed".

---

## What is here

```
data/                     the registers — the source of truth
  products.json           verified specs, each with its own source URL
  links.json              supplied links, intended ASIN, observed redirect (kept separate)
  policies.json           Associates + FTC rules, quoted and linked
  questions.json          24 questions blocking a reasonable decision
  suggestions.json        12 proposals with options and costs — none implemented
  flags.json              10 items flagged for review
  ledger.json             campaign ledger: schema complete, numbers empty
  events.json             the five measurement events
  site.json               site name, canonical host, base path, disclosures

content/guides.json       four question-shaped buying guides

scripts/build.mjs         static generator, zero dependencies
scripts/verify.mjs        the build gate — 15 checks, fails the deploy

assets/styles.css         typographic stylesheet, no web fonts, no images
assets/analytics.js       privacy-preserving event layer, disabled by default
assets/config.js          endpoint = null

site/                     generated output (this is what Pages serves)
```

## Why there are no prices on the site

Amazon's Associates Program Policies permit showing price and availability **only** when
Amazon serves the link containing that data, or when the data comes from the Creators API /
PA API. This is a static site, so it satisfies neither condition. Prices were observed and
are deliberately withheld. See `FLG-001`.

## Build and check

```bash
node scripts/build.mjs     # writes site/
node scripts/verify.mjs    # must pass before anything is deploys
```

The verifier checks disclosure placement, sponsored-link marking, price literals, canonical
hosts, sitemap↔page parity, broken internal links, the deploy base path, per-row sourcing,
feed validity and the absence of third-party assets. CI runs both and will not deploy if
either fails.

## Deploying

Push to `main` → `.github/workflows/pages.yml` runs build → verify → deploy.
Pages source is the GitHub Actions artifact from `./site`.

If the site moves to a custom domain: add `site/CNAME`, and change `canonical_host`,
`base_path` and `name` in `data/site.json`. Nothing else hard-codes the host.

## Reading order for a reviewer

1. `site/flags/index.html` — what could not be confirmed
2. `site/suggestions/index.html` — the decision queue
3. `site/questions/index.html` — what blocks each decision
4. `COORDINATION.md` — how the verification was performed

Nothing on this site claims hands-on testing. The five products have not been held by a
human, and no page says otherwise.
