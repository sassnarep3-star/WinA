# COORDINATION.md — shared task board

This file is the shared task board for parallel agent sessions working in this repo.
Read it before starting any task. Claim a task by writing your session ID + file scope here,
commit, and push **immediately**. Never start a task another live session has claimed.

Scope rule: each session works on its own branch `session-<id>/<task>` and edits only the
files in its claimed scope. If a task requires changing a file owned by another session,
log the request in the **Handoff / conflict log** below instead of editing it.

Staleness rule: if a session's claim is more than 60 minutes old with no commits, any other
session may take over the task and must note the handoff in the log.

Shared outputs (`data/*.json`, `src/`, `site/index.html`, navigation) are changed only by the
final integration session once all other tasks are done.

---

## Session registry

| Session ID | Branch | Started (UTC) | Role |
|---|---|---|---|
| `41096d21` | `arena/41096d21-wina` | 2026-11-20T05:27Z | Build + integration (index, nav, data, build, verify, deploy) |

---

## Task board

Status values: `unclaimed` · `in progress` · `done` · `needs review`

A status of `needs review` means the item is published on the site's
**Flagged for Review** page and does not block anything.

| ID | Task | Status | Owner | File scope | Notes |
|---|---|---|---|---|---|
| T01 | Resolve and record the five supplied `link.amazon` short links | done | 41096d21 | `data/links.json` | All 5 resolved to a `amazon.com/dp/<ASIN>` page. Observed landing URLs carry **no** `tag=` parameter. See FLG-003. |
| T02 | Build verified product register (specs, ratings, sources) | done | 41096d21 | `data/products.json` | Amazon listing = first-party source for listing facts. Unverifiable fields left blank + flagged. |
| T03 | Policy register (Associates + FTC) | done | 41096d21 | `data/policies.json` | Quoted, dated, linked. Drives the compliance gate. |
| T04 | Link-placement + disclosure gate | done | 41096d21 | `scripts/verify.mjs` | Fails the build on missing disclosure, untagged link, or unmarked outbound link. |
| T05 | Build site (front page, category pages, product pages, guides) | done | 41096d21 | `scripts/build.mjs`, `content/` | Static generator, zero dependencies. |
| T06 | Sitemap, RSS feed, robots.txt, canonical + JSON-LD | done | 41096d21 | `scripts/build.mjs` | One canonical host: the GitHub Pages origin. |
| T07 | Outbound-click measurement layer (privacy-preserving) | done | 41096d21 | `assets/analytics.js`, `data/events.json` | Client ships disabled by default; no endpoint exists yet (FLG-006). |
| T08 | Campaign ledger (defined, empty) | done | 41096d21 | `data/ledger.json` | No revenue/conversion numbers are invented. |
| T09 | Open-questions register | done | 41096d21 | `data/questions.json` | 24 questions with why-it-matters + how to get the answer. |
| T10 | Suggestions register (decision queue) | done | 41096d21 | `data/suggestions.json` | Reviewer picks a path before anything is implemented. |
| T11 | Flagged-for-Review page | done | 41096d21 | `data/flags.json` | Every flag carries a source link + exact status. |
| T12 | GitHub Pages deploy workflow | done | 41096d21 | `.github/workflows/pages.yml` | Build + verify run in CI; deploy only if verification passes. |
| T13 | Final integration: merge, deploy, record PR | done | 41096d21 | `COORDINATION.md` | Recorded below. |

> **Single-session note:** this run used one session. Parallel-session protocol is documented
> above and remains the rule for future work. No task was claimed by a second session, and no
> merge conflict occurred.

---

## Verification performed (T01–T12)

Date of all observations: **2026-11-20** (UTC). Re-verify anything older than 30 days.

**Link resolution (T01).** Each `link.amazon` short link was fetched and the resulting landing
URL recorded verbatim. All five land on `https://www.amazon.com/dp/<ASIN>`. The landing URLs
contain `btn_ref=srctok-…` (an Amazon page share token) and **no `tag=` parameter**. Conclusion:
the redirect target is correct, but tag attribution is *not* observable from the landing URL.
We do not claim the links are invalid — their compliance status is unresolved (FLG-003).

**Listing facts (T02).** Taken only from the Amazon product detail page for each ASIN and, where
noted, the brand's own documentation. Crowd-written "review farm" pages that ranked highly in
search were **rejected as sources** because they are not first-party and contradicted each other
(e.g. 1500 W vs 1700 W vs 1000 W for the same Chefman model). Where sources conflict the field
is left blank and flagged.

**Policy facts (T03).** Quoted from `affiliate-program.amazon.com` (Operating Agreement updated
2025-10-15; Program Policies updated 2026-04-14) and from 16 CFR Part 255 on `ecfr.gov`
(current as of 2026-11-18). Direct links on every row.

**Gate (T04).** `scripts/verify.mjs` re-reads the built HTML and asserts: disclosure above the
fold on every page, disclosure repeated in every footer, `rel="sponsored"` on every Amazon
outbound link, a source link in every table row, one canonical host, sitemap ↔ page parity.
The CI workflow runs it and will not deploy if it fails.

---

## Irregularities found (published on the Flagged for Review page)

| Flag | Finding | Status |
|---|---|---|
| FLG-001 | No price is displayed anywhere on the site. Amazon policy permits showing price/availability only when Amazon serves the link or data comes from Creators/PA API. Prices were observed but are deliberately withheld. | needs review |
| FLG-002 | Associates tag `shopnow047c-20` is **unverified**. We cannot confirm enrollment, active status, or that any click is credited to it. | needs review |
| FLG-003 | The five supplied short links land on the correct ASINs but expose no `tag=`. Their exact compliance status is unresolved. Not claimed invalid. | needs review |
| FLG-004 | Emeril B09B7SB46R: title says "26QT" and "24 One-Touch Preset Options"; the bullet list says "26-quart" and "25 COOKING PRE-SETS"; spec table says 24.6 L. Three different numbers on one page. | needs review |
| FLG-005 | Chefman B08DKYBTPH: Amazon bullet states "1000 Watts/120 Volts – RJ38-SQSS-8T"; third-party listings for the same model say 1700 W. Unresolved — left blank in the spec table. | needs review |
| FLG-006 | No analytics endpoint exists. GitHub Pages is static, so a "self-hosted analytics endpoint" cannot be deployed from this repo. The event layer ships disabled. | needs review |
| FLG-007 | Chefman B0CDY277D3: spec table lists capacity as "6 liters" while the title says 6 quart (≈5.68 L). Unit mismatch on the source page. | needs review |
| FLG-008 | Emeril B09B7SB46R is sold under the "Innovation IQ" seller/store label on the page, not "Emeril" — brand vs store attribution differs. | needs review |
| FLG-009 | Review counts and star ratings are point-in-time values that change daily. Recorded with an observation timestamp, never presented as current. | needs review |
| FLG-010 | No Search Console property, RSS-subscriber data, or campaign ledger entries exist yet. All traffic/conversion reporting is empty by design. | needs review |

---

## Handoff / conflict log

| Time (UTC) | Session | Entry |
|---|---|---|
| 2026-11-20T05:30Z | 41096d21 | Board created. All tasks claimed by the single integration session. |
| 2026-11-20T06:05Z | 41096d21 | No conflicts. No second session committed to this repo during the run. |

---

## Pull request and deploy record

- PR: **#3** — `arena/41096d21-wina` → `main` — https://github.com/sassnarep3-star/WinA/pull/3
- Merge result: merged (see below)
- Deploy: GitHub Pages, Actions build type, published from `site/`
- Live URL: https://sassnarep3-star.github.io/WinA/ (legacy Pages source = `main` / root)
