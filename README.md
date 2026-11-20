# The Preheat — `WinA`

An affiliate kitchen-gear publication with a verification register, a compliance gate and a
measurement spec, published as a static site on GitHub Pages.

**Live site:** https://sassnarep3-star.github.io/WinA/
**Start reading at:** [the front page](https://sassnarep3-star.github.io/WinA/) →
[the executive summary](https://sassnarep3-star.github.io/WinA/executive-summary/) →
[the decision brief](https://sassnarep3-star.github.io/WinA/decision-brief/) →
[the suggestion board](https://sassnarep3-star.github.io/WinA/suggestions/)

## What this repository is

| Path | What it holds |
| --- | --- |
| `docs/` | The built, publishable site. Everything here is generated — never hand-edit it. |
| `site/` | The generator (`site/build.mjs`), the guides (`site/content/guides/*.mjs`), CSS and the one client script. |
| `data/` | The registers: sources, products, intent records, categories, flags, suggestions, questions, ledger, events, forms. |
| `config/` | Brand, base URL, affiliate state, measurement wiring, link policy. One file to change when anything brand- or host-related changes. |
| `tools/` | Validation and automation: data checks, link checks, the compliance gate, the publish decision, the collector, the topic ranker, the reference analytics endpoint. |
| `COORDINATION.md` | Shared task board for parallel agent sessions: claims, scopes, blockers, log. Read it first. |

## Commands

```bash
npm run build            # regenerate docs/ from data/ + site/
npm run check            # data validation → build → link validation → compliance gate
npm run gate             # the publish decision, with the reasoning printed
npm run collect          # fold verified listing data from data/inbox/ into the register
npm run topics           # rank next topics from a Search Console export in data/exports/
npm run analytics        # run the reference measurement endpoint on localhost
node site/build.mjs      # build only
node tools/compliance-gate.mjs --refresh-sources   # re-read the register against the live pages
```

No dependencies. Node 20+. `npm ci` is not needed and the CI says so out loud.

## The rule the whole repository is built around

**A value is either traceable to an official source or it is not on the page.** Not "estimated",
not "typically", not "about". If a field could not be confirmed, it is blank and a flag says why.
That is why the shelf currently shows locked buttons: the five product identifiers supplied for
this project are nine characters long, and Amazon defines an ASIN as a ten-character alphanumeric
code ([source](https://sell.amazon.com/blog/what-is-an-asin)). Resolving that is the one answer
that turns this from a publication with a locked shelf into a monetized site — see
[Q-01](https://sassnarep3-star.github.io/WinA/decision-brief/#q-01).

## Deploying / re-deploying

GitHub Pages publishes from **branch `main`, folder `/docs`**
([how that works](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)).
So: edit `data/` or `site/`, run `npm run check`, commit the regenerated `docs/`, push to `main`.

Moving to your own domain is one config line (`baseUrl` in `config/site.config.json`) plus the
Pages custom-domain setting — and it matters commercially: Amazon's own review criteria include
“You must own your website”
([source](https://affiliate-program.amazon.com/help/node/topic/G8TW5AE9XL2VX9VM)), so the
`github.io` path is treated here as staging. That is recorded as
[FLG-013](https://sassnarep3-star.github.io/WinA/flagged/#flg-013).

## Deliberate absences

No prices, no star ratings, no “best of” rankings, no testing claims, no live analytics, no
revenue forecast, no working signup form. Each one is absent because it could not be sourced or
authorized, and each is explained on the page that would otherwise have quietly pretended:
[flagged for review](https://sassnarep3-star.github.io/WinA/flagged/).
