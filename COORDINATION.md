# COORDINATION — shared task board

**Repo:** `sassnarep3-star/WinA`
**Purpose:** affiliate publication for 5 submitted Amazon links (Tracking ID `shopnow047c-20`)
**Last updated:** 2026-11-20
**Live site:** https://sassnarep3-star.github.io/WinA/

## How to use this board

1. Read the whole board before starting anything.
2. To claim: add your session ID + file scope, commit, push **immediately**, then start.
3. Never start a task another session has claimed. Keep file scopes non-overlapping.
4. Each session works on its own branch `session-<id>/<task>` or worktree, editing only files
   in its claimed scope.
5. If a task needs a file owned by another session, log the request here — do not edit it.
6. Small, frequent commits. `git pull --rebase` before every push.
7. On finish: record sources, verification performed, irregularities, then mark `done`.
8. A claim older than 60 minutes with no commits may be taken over; note the handoff.
9. `needs review` means published on the Flagged for Review page — it does not block anything.
10. Shared outputs (`data/*.json`, nav, `index.html`) change only in final integration.

---

## Session history — read this before building anything

**Four sessions have worked on this repo, on four separate branches. This caused the exact
collision the rules exist to prevent.** Recording it plainly so the next session does not
repeat it.

| # | Session | Branch | What it built | Outcome |
|---|---|---|---|---|
| 1 | `arena-4a5044b0` | `arena/4a5044b0-wina` | First root-level site. Recorded Amazon.com as unreachable and left every product field blank. | Merged (PR #1). Archived. Its "unreachable" claim is superseded — see FLG-017. |
| 2 | `arena-6bd1be15` | `arena/6bd1be15-wina` | Verified all 5 links via page fetch, corrected the product mix to 3 air fryers + 2 thermometers. | Merged (PR #6). Archived. Its verification log is the origin of FLG-016. |
| 3 | `arena-2ca62ce9` | `arena/2ca62ce9-wina` | Third build at repo root; 18-item flag register; source register SRC-01…SRC-11. | Merged (PR #9). Archived with full data + toolchain. |
| 4 | `arena-ffa85037` | `arena/ffa85037-wina` | **This build.** Editorial publication, compliance gate, 23-item flag register absorbing all prior findings. | Integration session — see below. |

**Why it happened:** each session began from a `main` that already contained a previous
session's site, but built its own root-level site rather than extending the existing one.
Session 3 predicted this in its own register (its FLG-018: *"three independent site builds
existed"*). Sessions 1–3 each wrote a different `COORDINATION.md`; nothing was ever merged
into one board, so no session could see the others' claims.

**Lesson for the next session:** if `main` already builds, *extend it*; do not start a
fourth site. Claim the scope here first and push the claim before writing code.

---

## Task board — current state

| ID | Task | Status | Owner | Files / scope | Notes |
|---|---|---|---|---|---|
| T01 | Resolve the 5 submitted `link.amazon` links to product identity | done | 3 sessions agree | `data/links.json`, `data/products.json` | Three independent sessions reached the identical five ASINs |
| T02 | Source register: official-source row per specification | done | arena-ffa85037 | `data/policy.json`, `data/products.json` | 55 spec rows, each with a status |
| T03 | Policy + compliance verification (Associates, FTC) | done | arena-ffa85037 | `data/policy.json`, `/disclosure/`, `/privacy/` | 10 clauses quoted verbatim |
| T04 | Landing page as publication front page | done | arena-ffa85037 | `index.html` | Reader-first; dashboards in footer only |
| T05 | Category hubs (air fryers, thermometers) | done | arena-ffa85037 | `air-fryers/`, `thermometers/` | |
| T06 | Product pages ×5 | done | arena-ffa85037 | `products/*` | |
| T07 | Four question-shaped guides | done | arena-ffa85037 | `guides/*` | Working titles, not popularity claims |
| T08 | Comparison table | done | arena-ffa85037 | `compare/` | Verified specs only |
| T09 | Dashboard surfaces (register, flagged, ledger, analytics, questions, suggestions, summary) | done | arena-ffa85037 | `register/`, `flagged/`, `dashboard/`, `questions/`, `suggestions/`, `summary/`, `analytics/` | Reachable from footer on every page |
| T10 | Analytics: 5 defined events + self-hosted collector | done | arena-ffa85037 | `assets/js/site.js`, `_worker/collector.js`, `analytics/` | Client disabled — no endpoint (FLG-011) |
| T11 | SEO: sitemap, feed, robots, canonical, structured data | done | arena-ffa85037 | `sitemap.xml`, `feed.xml`, `robots.txt` | |
| T12 | Publication gate + CI | done | arena-ffa85037 | `_src/build.mjs`, `.github/workflows/build.yml` | 9 checks, fails the build |
| T13 | Preserve prior sessions' work | done | arena-ffa85037 | `archive/*` | 3 builds, 64 files, nothing deleted |
| T14 | Merge prior findings into one register | done | arena-ffa85037 | `data/governance.json` | 23 flags; 14 carried forward with attribution |
| T15 | PR → `main`, merge, confirm Pages deploy | in progress | arena-ffa85037 | — | See integration result below |
| T16 | Gap closure against the brief: sortable tables on every data table; SG-27..SG-30 parallel rows (nav labels, RSS feed, Search Console, reader capture); verified policy-citation corrections | done | arena-a86cb9d0 | `_src/build.mjs`, `_src/pages-content.mjs`, `assets/js/site.js`, `data/governance.json`, `COORDINATION.md` (arena-a86cb9d0 section only) | Extends main; does not add a second site (see conflict record) |

---

## Link resolution (verified by three independent sessions)

Each short link was opened and the landing page recorded. **The short code is not the ASIN.**
Intended ASIN was never supplied, so it is `null` in `data/links.json` and kept in a field
separate from the observed value, as the brief requires. An earlier session merged the two
(FLG-016); this build does not.

| Submitted link | Observed destination | ASIN | Product (from official title) |
|---|---|---|---|
| `link.amazon/B04G1MEwY` | `amazon.com/dp/B0CDY277D3` | B0CDY277D3 | CHEFMAN 6 Quart Dual Basket Air Fryer Oven |
| `link.amazon/B02NbDxp3` | `amazon.com/dp/B09B7SB46R` | B09B7SB46R | Emeril Lagasse 26QT French Door Air Fryer Toaster Oven |
| `link.amazon/B00hJ57DV` | `amazon.com/dp/B08DKYBTPH` | B08DKYBTPH | Chefman Air Fryer 8 Qt TurboFry 4-in-1 |
| `link.amazon/B0c8moW59` | `amazon.com/dp/B0DHZTCNR5` | B0DHZTCNR5 | ThermoMaven 1 Sec Professional Meat Thermometer |
| `link.amazon/B0f3GKalj` | `amazon.com/dp/B0DZFD6R9Z` | B0DZFD6R9Z | CHEF iQ Sense Smart Wireless Meat Thermometer Gen3 |

Verification method (this session, 2026-11-20): each `link.amazon` URL fetched with the page
tool; the returned title and redirect destination recorded. Product titles and specification
claims re-read from `https://www.amazon.com/dp/<ASIN>` on the same date. Direct `curl` from
the sandbox cannot reach amazon.com (HTTP 000) — the page tool can. Both facts are true and
both are recorded (FLG-017).

---

## Flag register — 23 items, all published on `/flagged/`

Severity: `resolved` (answered and recorded) · `review` (not knowable from here) ·
`action` (needs a credential, deploy or decision) · `withheld` (policy prevents display).

**This session's findings:** FLG-001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012,
019.
**Carried forward with attribution:** FLG-013, 014, 015, 016, 017, 018, 020, 021, 022, 023
(originally `arena-2ca62ce9` FLG-006/007/008/010/013/014/015/016/017/018).
**Independently confirmed by another session:** FLG-003, 004, 016.

### The four that matter most

1. **FLG-004** — enrolment of `shopnow047c-20` is unconfirmed. If it is not enrolled, nothing
   on this site earns anything. Highest commercial risk, and unfixable from here.
2. **FLG-003** — compliance status of the `link.amazon` short links is genuinely unresolved.
   **Not** asserted to be invalid. The site does not depend on them.
3. **FLG-009** — Search Console unverified. Nobody knows whether the site is indexed.
4. **FLG-011** — no analytics collector deployed. No learning is happening.

---

## Conflicts encountered and resolved

| Conflict | Resolution |
|---|---|
| `main` already contained a complete generated site (`index.html`, `shop/`, `guides/`, `dashboard/`, `assets/site.css`) that collided with this build's paths | No merge was attempted. Their files were exported from `origin/main` into `archive/arena-*/` verbatim, then removed from the served root. **Nothing was deleted.** |
| `data/` schema differed between sessions | This build's schema retained (it carries per-row verification status). The prior schemas are preserved under `archive/arena-2ca62ce9/data/`. |
| Prior flag register used the same IDs (FLG-001…018) for different findings | This build kept its own FLG-001…012 and minted FLG-013…023 for the carried-forward items, each naming its origin ID. No prior finding was dropped or renumbered silently. |
| Session `arena-a86cb9d0` built a parallel Python site (`tools/build_site.py`, `docs/`) and a second data set on branch `arena/a86cb9d0-wina`, from base `df3e953` (before `main` moved to `f421d5c`) | Not merged into `main`. Two served sites would conflict. Its files were retained in git history at commit `a64a3bd` (branch `arena/a86cb9d0-wina`); `main`'s site and data were kept as the only served version. Its verified policy citations are carried into T16. |
| Session `arena-a86cb9d0` branch note named a `session-<id>/<task>` scheme | Recorded in the arena-a86cb9d0 section below. All work stayed on the single branch the session was given. |
| Prior `COORDINATION.md` was lost when this session wrote its own | Recovered from `origin/main` and preserved at `archive/arena-2ca62ce9/COORDINATION.md`; its content is summarised in the session history above. |

No unresolved merge conflicts. No other session's work was discarded.

---

## Verification performed this session

| Check | Method | Result |
|---|---|---|
| 5 short links resolve | Fetched each URL; recorded destination | All 5 resolved |
| Product titles | Re-read each official listing | All match |
| Capacity / feature claims | Official listing titles and bullets | 41 rows verified, 9 claims, 5 withheld |
| Associates §5 statement | Read Operating Agreement §5 | Exact sentence in use on every page |
| Ratings prohibition | Read Program Policies §6(t) | No ratings or reviews anywhere |
| Price prohibition | Read Program Policies §6(y) | No prices, no price tracking |
| Link clarity | Read Program Policies §6(w) | Direct tagged links, no redirector |
| Disclosure placement | Read FTC Disclosures 101 | Above the content on every page |
| No false experience claims | Read FTC guidance | No page claims testing |
| HTML well-formedness | Parser pass over all 27 pages | 0 structural errors |
| Internal links | Build gate | All resolve |
| Sitemap coverage | Build gate | 26/26 pages |

Full machine-checked report: `VALIDATION.md`, regenerated on every build and uploaded as a CI
artifact.

---

## Integration result

- Branch: `arena/ffa85037-wina` → `main`
- Prior sessions' builds preserved under `archive/arena-4a5044b0/`,
  `archive/arena-6bd1be15/`, `archive/arena-2ca62ce9/`
- Build: `node _src/build.mjs` — all 9 gates clear
- Pull request and merge result: recorded in the final commit message and below
- Pages deploy: confirmed via `gh api repos/{owner}/{repo}/pages/builds/latest`

### Merge record

- **PR #10** — https://github.com/sassnarep3-star/WinA/pull/10 — merged into `main`
- Merge commit: `22dee513`
- Merge performed after the `validate` check turned green; an earlier attempt was blocked
  because the build was not reproducible (see below).
- GitHub Pages build for `22dee513`: **built**. Live site confirmed serving this build.
- Post-merge fixes (PR #12): corrected the ordering of the suggestions register (it was
  sorting weakest-first) and of the flag register (now opens with open items, not resolved
  ones).

### Two real defects found by the gates, and fixed

1. **Build was not reproducible.** `feed.xml` and `VALIDATION.md` embedded `new Date()`, so CI's
   "are generated files committed?" check failed on every run. Both now use the declared build
   date; verified by building twice and diffing — byte-identical.
2. **Merging `main` resurrected a prior site.** The merge auto-re-added `shop/`, `tools/`,
   `dashboard/`, `guides/*.html` and `data/*.json` alongside this build, which would have
   produced two competing pages per guide. Removed, and two permanent guards added: a
   duplicate-content check and an archive-integrity check.

### Note on caching

The live site served the previous build for a short period after the merge because GitHub's
CDN caches aggressively. Verified with a cache-busting query parameter (`?v=22dee51`), which
returned the correct build. If a reviewer sees stale content, hard-refresh or append a query
string.

---

## Session arena-a86cb9d0 (this session)

- **2026-11-20 — claim.** Claimed T16 (gap closure). Took a stale-base view first: the branch it was given (`arena/a86cb9d0-wina`, base `df3e953`) predated `main` `f421d5c`. Its own parallel build was not a valid merge target, so it was retained in history and not served.
- **Decision.** Extend `main`'s build, do not add a fourth site. This follows the "Lesson for the next session" above.
- **Merge.** `origin/main` merged into `arena/a86cb9d0-wina`; `main`'s files kept at every collision. No `main` content was removed.
- **Scope of T16.** (1) sortable tables; (2) SG-27..SG-30 rows; (3) corrected policy citations where a verified clause differs from the text (checked against the Program Policies, Commission Income Statement, Participation Requirements, IP License, and FTC pages on 2026-11-20).
- **Open item not changed here.** `main` publishes tagged `tag=shopnow047c-20` product links. The one-link Special Link test in the Associates Central workflow (F-22) has not been run from this sandbox, so this session cannot confirm that the tag is credited. That is recorded as a review item and is not a merge blocker.
- **2026-11-20 — arena-a86cb9d0, T16 result.**
  - **Sortable tables.** All 16 `table.data` in `_src/build.mjs` are now `table.data.sortable`. `assets/js/site.js` adds click and keyboard sorting with `aria-sort`, and `assets/css/site.css` adds the indicator. Tested in jsdom against the built pages (flagged, register, suggestions, questions): ascending and descending sorts are correct, and row counts are kept.
  - **SG-27..SG-30.** Added to `data/governance.json` as flags (now 27). Each row states only what this repository can show. SG-27 (navigation labels) and SG-28 (RSS) lack their source documents. SG-29 (Search Console) has no verification recorded. SG-30 (reader capture) is linked to EV-05 and FLG-010. No content was invented for any SG row.
  - **Citation corrections (checked verbatim against the policy text read on 2026-11-20).** FLG-010: the data-disclosure duty is Participation Requirements §3(e), not §6(e), which covers keyword bidding. FLG-005: the API-only price rule is §2(b); §6(y) bans price tracking. FLG-007: the copy and storage point is IP License §1 and §2(h), in addition to §6(a). Verified as correct and unchanged: OA §5 (including "misrepresent or embellish"), §6(a), §6(f), §6(t), §6(w), §6(y), and the FTC "hard to miss" quotation.
  - **Determinism.** `node _src/build.mjs` run twice produces identical output (SHA-256 over all generated text files). Gates: PASSED.
  - **Not done here.** The F-22 one-link Special Link test in Associates Central needs the enrolled account and was not run from this sandbox. The tagged links that `main` publishes are therefore unconfirmed (see the open item above). This is recorded for review and does not block merge.
  - **Stale claim.** `T15` remains listed as `in progress` for `arena-ffa85037`, but its PR #13 is already merged. Logged here; the claim is treated as complete.

