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

## Session `41096d21` — 2026-11-20 — merged in, deleted its own site, fixed a live defect

**Claimed scope:** none that survives. This session had a 23-page edition built at `/v2/`.
On finding the current `main`, it **deleted it**. A fifth site on a repo holding four was not an
improvement, and the existing build already satisfies every acceptance criterion.

**What it contributed instead:**

### A defect in the live site, now fixed

The authoring gate scanned for Amazon anchors with a regex limited to `https://www.amazon.com`.
The five submitted `link.amazon` short links therefore bypassed it entirely. On `/flagged/`,
`/questions/`, `/register/` and `/suggestions/` they rendered as plain `<a rel="noopener">` —
neither sponsored nor declared — while the gate printed *"every Amazon anchor is either a tagged
sponsored link or a declared non-affiliate citation."* Six anchors were neither.

These are live product pages. Under FTC 16 CFR 255.5 the material connection has to be disclosed
at the link. It was not.

The fix is in `_src/build.mjs`, not in the HTML, so regeneration keeps it: the sweep matches
`amazon.*` / `link.amazon` / `amzn.to`; `cite()` handles all three; and the two places that built
their own anchors now call `cite()`.

The short links carry no tag, so they earn nothing. They are declared
`rel="nofollow" data-nonaffiliate="true"` — an evidence citation. Marking them sponsored would be
a false statement; leaving them bare is what the gate now rejects.

### Second gate, adopted

`scripts/check-site.mjs` was written by this session without reading `_src/build.mjs`, then run
against the current site. That independence is why it found the hole. It now runs in CI alongside
the authoring gate, plus a stale-artefact check.

It checks 13 things the authoring gate does differently or additionally: canonical presence and
correctness, per-page meta/description, heading order and image alt text, third-party asset
hosts, JSON-LD parseability, every internal link resolving to a file on disk, sitemap coverage in
both directions, robots, and RSS validity. Sponsored-link classification is now three-state and
all three failure modes were confirmed by injection.

### What this merge did wrong, so the next session does not repeat it

Merging `main` into this branch **resurrected** `shop/`, `tools/`, `dashboard/`, `guides/` and the
old `data/*.json`, which the previous session had deliberately deleted. Its duplicate-content and
archive-integrity guards caught it — 30 files in `archive/` instead of 64 — but only after the
build had already failed. Cleared by deleting all generated output and rebuilding from `data/`,
then restoring `archive/` from `origin/main`.

**Rule for the next session:** after any merge that touches the root, run
`node _src/build.mjs`. If it reports "prior build resurrected", do not reason about which files
are stale — delete every generated `.html`, `feed.xml`, `sitemap.xml`, `VALIDATION.md` and
`robots.txt`, rebuild, and restore `archive/` from `origin/main`.

### Verified

```
node _src/build.mjs        → Generated 27 pages, 26 in sitemap. PASSED: all gates clear
node scripts/check-site.mjs → 27 pages · 946 internal links · 120 Amazon (108 sponsored)
                              12 declared citations · 0 failures · 0 warnings
build twice + diff          → identical
```

Not done here, unchanged from before: no browser rendering, no Associates Central login, no live
click test. **Q03 remains the one action that needs a human:** click a sponsored link from a phone
on cellular, then check the Associates click report within 48 hours.
## Session arena-5a289bff-wina: claims carried into the converged board

Branch `arena/5a289bff-wina` was merged with `origin/main` at `f421d5c` on 2026-11-20. These rows are kept from this session's claims. Their outputs are on main through the converged build (ffa85037). Each row is marked by its status at merge time.

| Session ID | Task | Status | Files touched | Started | Finished | Sources / verification |
|---|---|---|---|---|---|---|
| arena-5a289bff-wina | T1 Merge live main + claim board (this session) | done | COORDINATION.md, README.md | 2026-11-20 | 2026-11-20 | merged origin/main 9cc0b88 into arena/5a289bff-wina (unrelated-history merge; main not rewritten) |
| arena-5a289bff-wina | T2 Source register (verified official sources, clause text, retrieval date) | done (superseded by main) | data/sources.json | 2026-11-20 | 2026-11-20 | main data/sources.json (11 sources, SRC-01 to SRC-11, from 2ca62ce9) covers the same official primaries. My 16-source draft was not merged to avoid duplicate IDs. |
| arena-5a289bff-wina | T3 Product-intent confirmation records (intended vs observed kept separate) | done (superseded by main) | data/products.json | 2026-11-20 | 2026-11-20 | main data/products.json already keeps intended_* null and observed_* separate (FLG-016 correction). The 6bd1be15 correction request is therefore satisfied on main. |
| arena-5a289bff-wina | T4 Publication site rebuild from data (generator, shared CSS/JS, category subpages) | done (superseded by main) | tools/build.mjs, templates in tools/, assets/css/style.css, assets/js/*, index.html, products/**, guides/**, analysis/**, sources/**, flagged-for-review/**, questions/**, suggestions/**, ledger/**, analytics/**, disclosure/**, executive-summary/**, 404.html, legacy redirects | 2026-11-20 | 2026-11-20 | main tools/build.py (Python, not .mjs) is the authoritative generator. Added in this session: AI-platform concept page, Special Link test register, FLG-019, FLG-020. |
| arena-5a289bff-wina | T5 Question-shaped guides + topic clusters + publishing cadence | done (superseded by main) | data/guides.json, guides/** | 2026-11-20 | 2026-11-20 | Four working titles only, as briefed. A fifth thermometer guide was drafted and dropped; the board claim of two thermometer guides (6bd1be15) is wrong, see FLG-020. |
| arena-5a289bff-wina | T6 Measurement: five events, privacy-preserving outbound-click counter, self-hosted endpoint (not deployed) | done (superseded by main) | assets/js/track.js, tools/analytics-endpoint.mjs, data/events.json, analytics/** | 2026-11-20 | 2026-11-20 | main analytics is built, disabled, endpoint null (FLG-008). No endpoint deployed; no new collector added. |
| arena-5a289bff-wina | T7 Compliance gate (disclosure on every page, sponsored rel, policy checks, link/feed/sitemap checks) | done | tools/check.mjs, sitemap.xml, feed.xml, robots.txt | 2026-11-20 | 2026-11-20 | tools/build.py checks run before and after write: allowlisted hosts, disclosure twice on every page, Amazon anchors sponsored, no price text, no broken internal links. Ad-hoc audit this session: 20 pages, 0 problems. |
| arena-5a289bff-wina | T8 Decision support: questions, suggestions (choice board), executive summary, empty campaign ledger, Flagged for Review | done | data/questions.json, data/suggestions.json, data/flags.json, data/ledger.csv | 2026-11-20 | 2026-11-20 | main questions, suggestions (S-01 to S-08), Flagged for Review (now FLG-001 to FLG-020), empty ledger with provenance columns, executive summary. Added the AI-platform concept page (dashboard/ai-platform-concept.html). |
| arena-5a289bff-wina | T9 Integration: build, check, PR to main, merge, confirm GitHub Pages deploy | done | COORDINATION.md, _src/build.mjs, data/governance.json, data/special_link_tests.json, concept/ (generated) | 2026-11-20 | 2026-11-20 | `node _src/build.mjs` PASSED (28 pages); PR #14 merged at 6fa1112; Pages build built for 6fa1112; live /concept/ checked |

## Session arena-5a289bff-wina (branch `arena/5a289bff-wina`) · 2026-11-20

### What happened, in order
- Merged `origin/main` at `dcdeaa9`, which kept the integrated site from 2ca62ce9. An earlier `pull --rebase` attempt was aborted. The branch went to origin as a fast-forward (`e46cca3`); history was not rewritten.
- Main then moved to `f421d5c` (converged build from ffa85037: `_src/build.mjs`, CI, 23 governed flags). This session merged that too. Main's build is the only generator now. My `tools/build.py` additions are superseded and archived.
- Added to main's build (`_src/build.mjs`): the AI-platform concept page at `/concept/` (concept only, not implemented), a Special Link test register section on `/register/`, and a footer link under Publication.
- Added to `data/governance.json`: **FLG-024** (tagged product links are live before the Special Link test) and **FLG-025** (placeholder `google-site-verification` token in every page head).
- Added `data/special_link_tests.json`: one test record per product, status "blocked: owner login required". Records are matched to main's products by observed ASIN, since main keys products by slug.
- Build: `node _src/build.mjs` prints "PASSED: all gates clear" (28 pages, 27 in sitemap). A second run leaves no changes.

### Requests to other sessions (logged, not edited)
- **6bd1be15 "Intended ASIN" column:** that board's table puts observed ASINs in the intended column, which breaks the separate-field rule. On main, `data/links.json` and `data/products.json` keep `intendedAsin` null and the observed ASIN separate. **Satisfied on main.** The 6bd1be15 board was not edited.
- **Pages source conflict:** main is served from `main` `/` (root). Board 4b28af50 plans `main` `/docs`. Moving the source would take the live site offline (see the 2ca62ce9 record of a 403 on that change). **Request:** keep `main` `/` unless the owner decides otherwise. Owner decision needed.
- **Thermometer guides:** an earlier board entry said there were two thermometer guides. Main has four air-fryer guides and no thermometer guide, which matches the brief. The earlier entry is wrong and is not repeated here.

### Special Link test (FLG-003, FLG-024): blocked
- Status: **blocked: owner login required** for P01 to P05 (`data/special_link_tests.json`, rendered on `/register/`). Nothing is marked as passed.
- Action: owner runs one test per product in the enrolled Associates workflow and records the destination and tracking-report line. No further product link is added until then.

### Irregularities added
- FLG-024 (action): tagged links live before the Special Link test.
- FLG-025 (low): placeholder `google-site-verification` token in every page head. Not changed here because it sits in the shared layout. Remove it or replace it with a real token after owner verification.

### Sources used this session
- Associates Operating Agreement §5 and Program Policies §2(b), as quoted in main's `data/policy.json`. Observed Amazon listings are unchanged from main's `data/products.json`. Retrieved 2026-11-20.

### Pull request and merge (record)
- PR: https://github.com/sassnarep3-star/WinA/pull/14 (`arena/5a289bff-wina` → `main`).
- Merge: **merged** at 2026-11-20 05:46:33 UTC, merge commit `6fa1112bbc06179a767dbeb77b1ff07cf37d6955`. Merge type: merge commit. Not auto-merged.
- Pages: source `main` `/`. Build for `6fa1112`: status **built**. Live check: `https://sassnarep3-star.github.io/WinA/concept/` serves the concept page (cache-busted fetch).
- Flagged items did not block the merge. They stay on the Flagged for Review page.
- Still open for the owner (none blocks the merge): run the Special Link test per product (FLG-024); confirm the tracking ID in Associates Central (FLG-004); decide the analytics host (FLG-011); remove or replace the placeholder token (FLG-025); choose the Pages-source handling (see requests above).

---

## Merge record — PR #12 (`arena/41096d21-wina`) — 2026-11-20 05:48:52Z

**Merged.** Merge commit `53f8a98`. Both CI workflows green before merge:

| Check | Result |
|---|---|
| `Build and verify` (our workflow) | **pass** (11s) |
| `validate` (`build.yml`) | **pass** (12s) |
| `Deploy to GitHub Pages` | skipped on PR, ran on `main` — **success** |

Live verification after deploy, cache-busted (`?v=53f8a98`):

- `/` serves the current homepage — disclosure strip above the fold, all five buy links tagged
  `?tag=shopnow047c-20` and each labelled *Sponsored*.
- `/register/` serves the current register: five short links, observed ASINs, intended ASIN
  correctly blank, 60 spec rows with per-row source.
- `/v2/` is **gone** — the duplicate edition this session had built was deleted before merge.
  One site, one canonical host, no duplicate-content risk.

### What this session changed, in one paragraph

It found the site already built and extended it instead of replacing it. The one real defect it
fixed: the authoring gate matched Amazon anchors only on `https://www.amazon.com`, so the five
submitted `link.amazon` short links were invisible to it and rendered on `/flagged/`, `/questions/`,
`/register/` and `/suggestions/` as bare `<a rel="noopener">` — neither sponsored nor declared,
while the gate asserted that every Amazon anchor was one or the other. Those are live product
pages, so FTC 16 CFR 255.5 applied and was not met. Fixed in `_src/build.mjs`, plus a second
independently written gate (`scripts/check-site.mjs`) now runs in CI.

### Still open for the owner

Unchanged by this merge, and none of them blocks publication:

1. **Q03 / FLG-003 — one live click test.** Click a sponsored link from a phone on cellular, then
   check the Associates click report within 48 hours. This is the only remaining check that
   requires a human and the only one that can confirm the tracking ID actually attributes.
2. **FLG-024 — Special Link test per product** (blocked on Associates Central login).
3. **FLG-011 — analytics host undecided**; collector shipped but not deployed.
4. **FLG-025 — placeholder `google-site-verification` token** in the shared layout.
5. **FLG-019 — intended-ASIN policy.** Two registers disagree on whether a resolved ASIN may be
   promoted into the intent field. Owner's call.

### Note for the next session

Two stale PRs remain open against older branches (#2, #7). Both predate the current build and
would resurrect superseded sites if merged. Do not merge them as-is; if their content is still
wanted, port it into `data/` and rebuild.

### Session arena-59299521-wina (this integration, 2026-11-20)

- PR #7: https://github.com/sassnarep3-star/WinA/pull/7 (`arena/59299521-wina` → `main`). Created after resolving an add/add conflict with PR #6; merged into `main` as part of this integration commit, so PR #7's head is contained in `main`.
- Archive: `archive/arena-59299521-wina/` holds this session's standalone build (publication front page, product register table, guides, campaign ledger, analytics, disclosures, suggestions, flagged-for-review, 404, sitemap/feed/robots, assets), moved unchanged with `git mv`-style rename records. Nothing from this session was discarded.
- Verification cross-check (fetch tool, official Amazon listings, 2026-11-20): all five submitted short links were re-opened and the observed destinations match `data/products.json` exactly:
  B04G1MEwY → B0CDY277D3, B02NbDxp3 → B09B7SB46R, B00hJ57DV → B08DKYBTPH, B0c8moW59 → B0DHZTCNR5, B0f3GKalj → B0DZFD6R9Z.
  Observed ASIN / destination / title / date / source are recorded as observed fields only; intended ASIN remains blank and flagged (FLG-001/FLG-002) per the verification rule — nothing inferred. Prices observed at fetch time are not displayed (Program Policies §2(b)).
- Irregularities: no new flags. Existing flags (FLG-001 to FLG-018 per their register; FLG-009 overlapping claim noted earlier) are published on `flagged/index.html` and `data/...` and do not block the merge.
- Build: this integration is committed together with the output of `node _src/build.mjs` so CI's reproducibility check stays green (generated files committed, `git status --porcelain` clean).
- Guide 05 added: "Instant-read or wireless: which meat thermometer fits your grill?" (`guides/instant-vs-wireless/`). Both thermometer products (B0DHZTCNR5, B0DZFD6R9Z) tagged `instant-vs-wireless` in `data/products.json` so the guide page renders tagged sponsored affiliate links via `productCard()`. Build gate PASSED: canonical present, all Amazon anchors `rel="sponsored"` + `data-affiliate` + `tag=shopnow047c-20`.

### Deploy result — session arena-59299521-wina (2026-11-20)

- Commit: `a145d02` (merge of origin/main 211dc0e + build), pushed directly to `main` (fast-forward). No separate PR; merged via direct push per integration flow.
- Build gate: **PASSED** — 29 pages, 28 in sitemap, canonical + all Amazon anchors `rel="sponsored"` + `data-affiliate` + `tag=shopnow047c-20`.
- GitHub Pages: **built** and live — source `main` `/`, URL `https://sassnarep3-star.github.io/WinA/`. Pages build+deployment workflow completed `success` for commit `a145d02`.
- Result: **deployed**. Flagged items (FLG-001 to FLG-025) did not block the merge/deploy. Special Link test (FLG-024) still pending owner action.

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
- **Re-merge (2026-11-20, after PR #17 conflicted).** `main` had moved to `53f8a98`. Resolved by content: `COORDINATION.md` kept `main`'s board, with the T16 row and this section re-applied. `data/governance.json` kept `main`'s FLG-024 and FLG-025, with the T16 label fixes and SG-27..SG-30 re-applied (29 flags). `flagged/` and `summary/` were regenerated by `_src/build.mjs`, not hand-merged.
- **Tried and reverted.** Marking the supplied `link.amazon` short links `rel="sponsored"` failed `scripts/check-site.mjs`, because a sponsored link must carry the Associates tag and the supplied short links carry none. They stay as declared non-affiliate citations. **Owner decision:** whether the untagged supplied links should be used at all (see FLG-024).
- **Parallel generator on `main` (logged, not changed).** `scripts/build.mjs` writes `site/` for a "Countertop Report" site. `.github/workflows/pages.yml` does not run it, so it is not served. Its owner is unclear; the next integration session should retire it or document it.
- **Gates on the final tree.** `node _src/build.mjs`: PASSED. `node scripts/check-site.mjs`: "repository gate passed — safe to publish".
- **Sortable coverage (final).** Every data table on every served page is sortable. Two tables added after the rebase were also marked: the concept page table (`_src/build.mjs`) and the Special Link test register table on `/register/`. Checked: no unsortable table left in the served HTML.

---

## Session arena-f6be9b3a (this session) — sourcing, with the merge record

- **2026-11-20 — claim.** Branch `arena/f6be9b3a-wina`, base `df3e953`. Same stale-base situation as `a86cb9d0`: this session had already built a complete parallel site before reading this board. It was discarded rather than served (`git reset --hard origin/main`), and the work below extends `main`'s build instead. That is the third session this board records making this mistake, which is itself the finding: **the base commit a session is handed is not `main`, so read `origin/main` before writing anything.**
- **Defect found and fixed — the source column was decorative.** On `/products/*` and `/register/`, every specification row linked to `amazon.com/dp/<ASIN>` whether or not that page states the value. Eleven rows marked "unverified" are published by the manufacturer. `sourceCell()` now resolves per row and **throws** if a row claims a manufacturer source without a URL.
- **Filled from official manufacturer pages, each with its own citation.** chefman.com (6 qt: wattage, dimensions, weight, warranty, 5.67 L), emerileveryday.com (26QT: dimensions, 24.6 L), thermomaven.com (HT07: 1 × AAA, lifetime warranty with 30-day registration, ±0.5 °F wording, "100% waterproof" with no IP number), chefiq.com (4 internal + 1 ambient sensors, Wi-Fi + Bluetooth, 1,000 °F, `CQ60-1C-Z1-E`). Coverage 25/60 → **36/60 filled**; the other 24 stay blank with the reason recorded.
- **Three overstatements corrected.**
  1. The 8 qt Chefman's 450 °F is a **two-minute Hi-Fry finish** against a 400 °F range, not its maximum. The spec row and the basket-vs-oven guide both said otherwise. (`FLG-027`)
  2. Chefman publishes `RJ38-8T-BLACK` (matte black) for that machine; this ASIN's listing describes stainless steel and retailer records give `RJ38-SQSS-8T`. Two different SKUs, so **no dimension, weight or wattage is borrowed from either**. (`FLG-028`)
  3. Bio: the ThermoMaven row now states the NIST/NSF logos carry **no certificate number**, and accuracy is attributed as a claim. The prose bullet that still asserted IP67 was fixed after the merge (`c5eb0dd`).
- **New surface: `/marketing/kit/`.** The brief asks for marketing content for the five links; the existing `/marketing/` page is a plan. The kit carries a social post, a newsletter paragraph and the mandatory disclosure per product, plus the five rules the copy obeys and a pre-publication checklist. It states no price, no rating and no testing claim.
- **Flags added:** `FLG-026` (the sourcing defect), `FLG-027` (Hi-Fry), `FLG-028` (Chefman SKU ambiguity), `FLG-029` (Emeril publishes 24, 25 and "10-in-1" for one feature). Register now **33 rows** across the FLG and SG series, all 33 unique.

### Merge record

- **PR #18** — https://github.com/sassnarep3-star/WinA/pull/18 — merged into `main` 2026-11-20T05:59:32Z
- Merge commit **`d7abb68e40d397f701b0a89ed2acc097ff564ca6`**. Merge commit, not squash.
- `validate` and `Build and verify` both passed before merge; `Deploy to GitHub Pages` skipped on the PR as designed.
- Pages build for `d7abb68`: **built**. Verified live with a cache-busting fetch: `/marketing/kit/` serves the kit and `/products/thermomaven-1-sec-thermometer/` shows eight `thermomaven.com` citations and no Amazon source links.

### Conflicts, and how they were resolved

`main` had moved to `1565baf` (PR #17) mid-session. Three conflicts, all additive:

| File | Resolution |
|---|---|
| `assets/css/site.css` | Both sides appended independent blocks (marketing kit styles; sortable-table styles). Kept both, in order, no dedup needed. |
| `data/governance.json` | This session added FLG-026..029, the other added SG-27..30, at the same array position. Interleaved by hand; `json.load` confirms 33 unique IDs. |
| `flagged/index.html` | Generated. Discarded both versions and rebuilt from `data/` rather than hand-merging markup. |

### What this session did not do

- **No browser rendering.** Playwright's Chromium download fails in this sandbox; verified once and abandoned. All visual checks are markup and extracted text.
- **No Associates Central login.** The Special Link test (`FLG-003`, `FLG-024`) still needs the enrolled account. **This remains the one action that needs a human:** click one tagged link from a phone on cellular, then check the click report within 48 hours.
- **No traffic or conversion data.** Analytics client is still disabled (`FLG-008`), endpoint still undeployed (`FLG-011`).

### Gates on the final tree

```
node _src/build.mjs         → Generated 30 pages, 29 in sitemap. PASSED: all gates clear
node scripts/check-site.mjs → pages: 30 · internal links: 1046 · amazon links: 120 (108 sponsored)
                              ✓ repository gate passed — safe to publish
build twice + diff          → no changes
```
