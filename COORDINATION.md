# COORDINATION.md — shared task board

This file is the shared task board for every agent session working in this repository.

**Rules (summary)**
- Claim a task by writing your session ID and file scope here, then commit and push the claim before starting.
- Statuses: `unclaimed` · `in progress` · `done` · `needs review`.
- `needs review` = published on the *Flagged for Review* page; it does not block anything.
- Never start a task another session has claimed. Log cross-scope requests here instead of editing another session's files.
- Run `git pull --rebase` before every push. On a merge conflict: stop, resolve without discarding the other session's work, and log it below.
- Verification: every table row carries a link to an official source. A value that cannot be confirmed from an official source is left blank and flagged `unverified`. Values are never inferred.
- Shared outputs (`docs/` site output, navigation, index) are changed only by the final integration step.

**Branch note.** This session works on one branch: `arena/a86cb9d0-wina` (base `df3e953`). The `session-<id>/<task>` branch naming from the brief conflicts with that rule, so all task claims and work for this session live on this single branch. Task IDs below keep the per-task scoping.

**Session ID:** `arena-a86cb9d0`

---

## Task board

| ID | Task | Status | Owner (session) | Files / scope touched |
|----|------|--------|-----------------|------------------------|
| T01 | Repo review: line-by-line check of the repo and the five submitted links; flag irregularities | in progress | arena-a86cb9d0 | `COORDINATION.md`, `data/flags.json` |
| T02 | Source register: fetch and record official sources (Amazon Associates, FTC, USDA, GitHub, Google) | in progress | arena-a86cb9d0 | `data/sources.json` |
| T03 | Product-intent confirmation record (intended ASIN, official listing URL, confirmation date/source, observed redirect kept separate) | in progress | arena-a86cb9d0 | `data/products.json`, `docs/link-validation/` |
| T04 | Site build: tool, templates, styling, landing page, category pages, all-products table | in progress | arena-a86cb9d0 | `tools/`, `templates/`, `docs/` (generated), `docs/assets/` |
| T05 | Guides cluster (5 question-shaped guides), sitemap, RSS feed, robots.txt | in progress | arena-a86cb9d0 | `content/guides/`, `docs/guides/`, `docs/feed.xml`, `docs/sitemap.xml`, `docs/robots.txt` |
| T06 | Analytics: five events, privacy-preserving outbound-click counter, self-hosted collector + tests | in progress | arena-a86cb9d0 | `analytics/`, `docs/assets/analytics.js`, `docs/analytics/` |
| T07 | Compliance gate: disclosure strip on every page, `rel="sponsored"` checks, build-time policy checks, CI workflow | in progress | arena-a86cb9d0 | `tools/build_site.py` (checks), `.github/workflows/`, `tests/` |
| T08 | Questions, suggestions (decision board), executive summary, campaign ledger (empty, provenance) | in progress | arena-a86cb9d0 | `data/questions.json`, `data/suggestions.json`, `data/ledger.json`, `content/pages/` |
| T09 | Flagged for Review page | in progress | arena-a86cb9d0 | `data/flags.json`, `docs/flagged-for-review/` |
| T10 | Integration: rebuild, verify combined data line by line, check no broken links, PR to `main`, merge, confirm GitHub Pages deploy | unclaimed | — | repo-wide (final step only) |

Claim recorded: `arena-a86cb9d0` claimed T01–T10 at the start of this session.

---

## Work log

- **2026-11-20 — arena-a86cb9d0:** Claimed T01–T10. Repo found to contain only `README.md` (`# WinA`) and no license, CI, or coordination file. Created this file. Starting verification of sources and links.

---

## Handoffs and conflicts

- None so far.

---

## Cross-scope requests

- None so far. (The source register's IDs `S01`, `S02`, `S07`, `S24`, `FLG-003`, and `SG-27..SG-30` refer to a source register that is not in this repository. They are recorded as an open irregularity in `data/flags.json` (F-09). No edits were made to any file outside the claimed scope.)

---

## Integration (T10)

- Status: pending. Runs only after T01–T09 are done.
- PR: _not yet created_
- Merge result: _not yet merged_
- GitHub Pages deploy: _not yet confirmed_
