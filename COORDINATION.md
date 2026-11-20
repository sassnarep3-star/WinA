# COORDINATION — shared task board

**Repo:** `sassnarep3-star/WinA`
**Purpose:** affiliate publication for 5 submitted Amazon links (Tracking ID `shopnow047c-20`)
**Last updated:** 2026-11-20

## How to use this board

1. Read the table before starting anything.
2. To claim: add your session ID + file scope, commit, push **immediately**, then start.
3. Never start a task another session has claimed. Keep file scopes non-overlapping.
4. Each session works on its own branch `session-<id>/<task>` or worktree, and edits only files in its scope.
5. If a task needs a file owned by another session, log the request here — do not edit it.
6. Small, frequent commits. `git pull --rebase` before every push.
7. On finish: record sources, verification performed, irregularities, and mark `done`.
8. A claim older than 60 minutes with no commits may be taken over; note the handoff.
9. `needs review` means published on the Flagged for Review page — it does not block anything.
10. Shared outputs (`data/*.json`, nav, `index.html`) change only in final integration.

## Sessions

| Session ID | Branch | Status | Scope |
|---|---|---|---|
| `arena-ffa85037` | `arena/ffa85037-wina` | active | Entire repo — sole session, build + integration |

No other sessions have claimed any task. This build was done by a single session; the
board is kept because the brief requires it and because future sessions must be able to
pick up without guessing.

## Task board

| ID | Task | Status | Owner | Files / scope | Notes |
|---|---|---|---|---|---|
| T01 | Bootstrap repo, claim board, choose stack | done | arena-ffa85037 | `COORDINATION.md`, `README.md`, `.gitignore` | Static site, zero runtime deps, Node build |
| T02 | Resolve the 5 submitted `link.amazon` short links to product identity | done | arena-ffa85037 | `data/links.json`, `data/products.json` | Verified by following each short link; see T02 note |
| T03 | Source register: official-source row per product | done | arena-ffa85037 | `data/products.json`, `data/sources.json` | Unverified fields left blank |
| T04 | Policy + compliance verification (Associates, FTC) | done | arena-ffa85037 | `data/policy.json`, `disclosure.html`, `privacy.html` | Clauses quoted verbatim with links |
| T05 | Design system + layout (masthead, disclosure, nav, footer) | done | arena-ffa85037 | `_src/templates/*`, `assets/css/*` | |
| T06 | Landing page as publication front page | done | arena-ffa85037 | `index.html` | Reader-first, no dashboard on top |
| T07 | Category hubs (air fryers, thermometers) | done | arena-ffa85037 | `air-fryers/`, `thermometers/` | |
| T08 | Product pages ×5 | done | arena-ffa85037 | `products/*` | |
| T09 | Four question-shaped guides | done | arena-ffa85037 | `guides/*` | Working titles, not popularity claims |
| T10 | Comparison table | done | arena-ffa85037 | `compare/` | Title-derived specs only |
| T11 | Dashboard surfaces (register, flagged, ledger, analytics, questions, suggestions, summary) | done | arena-ffa85037 | `register/`, `flagged/`, `dashboard/`, `questions/`, `suggestions/`, `summary/`, `analytics/` | Reachable from footer only |
| T12 | Analytics: 5 defined events, privacy-preserving counter | done | arena-ffa85037 | `assets/js/site.js`, `analytics/`, `_worker/` | Endpoint NOT enabled — see FLG-011 |
| T13 | SEO: sitemap, feed, robots, canonical, structured data | done | arena-ffa85037 | `sitemap.xml`, `feed.xml`, `robots.txt` | |
| T14 | Build validation (links, disclosure, sponsorship, no-fabrication) | done | arena-ffa85037 | `_src/build.mjs` | Runs in CI and locally |
| T15 | PR → `main`, merge, confirm Pages deploy | done | arena-ffa85037 | — | PR link recorded below |

## T02 note — link resolution (verification performed)

Each short link was opened and the resulting landing page recorded. **The short code is not
the ASIN**; the ASIN below was *observed* from the redirect destination. Intended ASIN was
never supplied by the requester, so it is `null` in `data/links.json` and kept in a field
separate from the observed value, as the brief requires.

| Submitted link | Observed destination | ASIN | Product (from official title) |
|---|---|---|---|
| `https://link.amazon/B04G1MEwY` | `amazon.com/dp/B0CDY277D3` | B0CDY277D3 | CHEFMAN 6 Quart Dual Basket Air Fryer Oven |
| `https://link.amazon/B02NbDxp3` | `amazon.com/dp/B09B7SB46R` | B09B7SB46R | Emeril Lagasse 26QT French Door Multi-Function Air Fryer Toaster Oven |
| `https://link.amazon/B00hJ57DV` | `amazon.com/dp/B08DKYBTPH` | B08DKYBTPH | Chefman Air Fryer 8 Qt TurboFry 4-in-1 |
| `https://link.amazon/B0c8moW59` | `amazon.com/dp/B0DHZTCNR5` | B0DHZTCNR5 | ThermoMaven 1 Sec Professional Digital Meat Thermometer |
| `https://link.amazon/B0f3GKalj` | `amazon.com/dp/B0DZFD6R9Z` | B0DZFD6R9Z | CHEF iQ Sense Smart Wireless Meat Thermometer (Gen3) |

## Irregularities found

All are published on `flagged/index.html` with source links. Summary:

- **FLG-001** — `link.amazon` short links carry no ASIN in the code; product identity is only
  knowable by following the redirect. Resolved by observation, recorded 2026-11-20.
- **FLG-002** — The submitted short links carry **no Associates tag** of their own; a tag must
  be applied by us. We apply `shopnow047c-20` to constructed Special Links.
- **FLG-003** — Exact compliance status of `link.amazon` short links under the Operating
  Agreement is **unresolved**. We do not claim they are invalid; we simply do not depend on
  them. Site links point at `amazon.com/dp/<ASIN>?tag=...` directly.
- **FLG-004** — Tracking ID attribution (`shopnow047c-20`) **cannot be confirmed without
  logging in** to the Associates dashboard. Links are built with it; attribution is unverified.
- **FLG-005** — Prices cannot be displayed: no Creatives/PA-API credential is available, and
  Amazon requires price data from its API to stay accurate. Prices are omitted, not guessed.
- **FLG-006** — Star ratings and customer reviews may not be displayed without Creatives/PA-API
  (Program Policies 6(t)). Omitted.
- **FLG-007** — Product photography: no licensed images. Amazon Program Content cannot be
  hot-linked or stored without API/approved tooling. Pages are typographic; no fake product art.
- **FLG-008** — Commission rates and category bounty tables for "Home & Kitchen" are not
  published as a fixed number we can verify at build time; no revenue forecast is presented.
- **FLG-009** — Search Console ownership unverified; verification token is a placeholder.
- **FLG-010** — Newsletter/reader capture has no backend and no ESP. Form is inert by default.
- **FLG-011** — Analytics endpoint is self-hosted-capable (`_worker/`) but **not deployed**;
  the collector is disabled so nothing is silently dropped or faked.
- **FLG-012** — No first-party conversion data exists yet; campaign ledger is intentionally empty.

## Conflicts

None. No merge conflicts occurred. No other branch existed when integration ran.

## Integration result

- Branch merged: `arena/ffa85037-wina` → `main`
- Build validation: see `VALIDATION.md` (generated by `_src/build.mjs`)
- Pull request: recorded at the end of the session (link added below)
- Pages deploy: confirmed via `gh api repos/{owner}/{repo}/pages/builds/latest`

_PR link and merge result: recorded in the final commit on `main`._
