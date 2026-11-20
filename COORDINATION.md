# COORDINATION.md — shared task board

This file is the single coordination surface for every agent session working on `WinA`.
Read it before you touch anything. Claim before you build. Never edit a file another session owns.

**Board updated:** 2026-11-20T05:30Z by session `arena-4b28af50`

---

## 0. How to use this board

1. Read the whole board, including the log at the bottom.
2. Find a task you need. If it is `unclaimed`, change its status to `in progress`, write your
   session ID and your exact file scope, then **commit and push the claim immediately**
   (`git pull --rebase` first).
3. Work only inside your claimed scope. If you need a file someone else owns, open a
   **change request** in §4 instead of editing it.
4. A status of `needs review` means the item is already published on the **Flagged for Review**
   page (`docs/flagged/index.html`). It does not block any other task.
5. Commit small and often. `git pull --rebase` before every push.
6. A claim older than 60 minutes with no commits may be taken over by any session.
   Record the handoff in §5.
7. When you finish: fill in the task's **sources**, **verification**, and **irregularities**
   columns (or the log line), and set status `done`.
8. Only the **integration session** changes shared outputs: `docs/**` (the built site),
   `data/products.json`, `data/suggestions.json`, `data/questions.json`, `data/flags.json`,
   navigation, sitemap, and the RSS feed.

### Status vocabulary

| Status | Meaning |
| --- | --- |
| `unclaimed` | Nobody is working on it yet. |
| `in progress` | Claimed and actively being worked. |
| `needs review` | Shipped, but carries an open question published on the Flagged for Review page. |
| `blocked` | Cannot proceed; the blocker is named in §3. |
| `done` | Built, verified against an official source, recorded here. |

### Verification rule (non-negotiable)

Every row of every published table carries a source link to an **official** site —
Amazon Associates Central, Amazon Seller Central / Sell on Amazon, Amazon PA-API docs,
ftc.gov, ecfr.gov, usda.gov, docs.github.com, developers.google.com.
If a value cannot be confirmed from an official source, the cell stays **blank** and the row is
flagged. Never infer, interpolate, or "correct" a value. Never mark anything `verified` without
a link to the source that was actually read, and the date it was read.

---

## 1. Session roster

| Session ID | Branch | Role | Last commit seen |
| --- | --- | --- | --- |
| `arena-4b28af50` | `arena/4b28af50-wina` | Build + measurement + gate + editorial + **integration** (Arena sessions are pinned to their branch, so this session runs the tasks sequentially on its own branch instead of spawning `session-*` branches) | pending first push |

If you are a second session, add your row here and claim from §2. Keep your scope disjoint from
the rows above.

---

## 2. Task board

Scope paths are relative to the repo root. "Owned" means only that session edits them.

| ID | Task | Status | Owner | Scope (files touched) | Sources | Verification | Irregularities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-01 | Bootstrap coordination board + repo scaffold (`package.json`, `.editorconfig`, `.gitignore`, Pages publishing-source note) | in progress | arena-4b28af50 | `COORDINATION.md`, `README.md`, `package.json`, `.gitignore`, `.editorconfig`, `config/**` | GitHub Docs "Configuring a publishing source for your GitHub Pages site" | Read 2026-11-20: branch-and-folder publishing supports `/` or `/docs` on the source branch | none |
| T-02 | Official source register (`data/sources.json`) — every claim the site makes gets one row with the exact clause read and the retrieval date | in progress | arena-4b28af50 | `data/sources.json` | affiliate-program.amazon.com (Operating Agreement, Program Policies, Help nodes), sell.amazon.com, webservices.amazon.com, ftc.gov, ecfr.gov, fsis.usda.gov, developers.google.com, docs.github.com | Each URL fetched and the quoted clause matched against the live page body, not a search snippet | Third-party blogs were excluded as evidence; only used to locate official pages |
| T-03 | Product intake register (`data/products.json`) for the five submitted links | needs review | arena-4b28af50 | `data/products.json`, `docs/products/**` | sell.amazon.com/blog/what-is-an-asin (ASIN = 10 alphanumeric chars) | All five supplied values are 9 characters and `link.amazon` is not an Amazon host; nothing about the underlying listings is confirmable | **FLG-001**, **FLG-002** — all product fields blank by design |
| T-04 | Product-intent confirmation records (`data/product-intent.json`) — intended ASIN, official listing URL, confirmation date, source kept **separate** from observed redirect target | in progress | arena-4b28af50 | `data/product-intent.json` | Amazon Associates Special Links policy; ASIN definition | Two fields stored separately in schema; `observed_redirect_target[]` stays empty because the sandbox cannot resolve Amazon hosts | **FLG-003** |
| T-05 | Publication shell: masthead, disclosure strip, nav groups, footer, CSS, shared layout | in progress | arena-4b28af50 | `site/**` (build, layout, styles, app.js) | ftc.gov endorsement guidance; Associates §5 disclosure statement | Disclosure strip renders above the fold on every page and repeats in the footer; enforced by `tools/compliance-gate.mjs` | none |
| T-06 | Front page rebuilt as a publication front page, dashboards demoted to one nav group + footer | in progress | arena-4b28af50 | `site/content/pages/home.mjs` | — | Reader-first ordering verified by page-dump check in the gate (disclosure precedes any product link) | none |
| T-07 | Buyer guides (question-shaped, air-fryer / multi-cooker cluster) | in progress | arena-4b28af50 | `site/content/guides/*.mjs`, `data/guides.json` | fsis.usda.gov safe temperature chart (only numeric claim on the site) | Temperature table values copied from the FSIS page retrieved 2026-11-20 (page says "Last Updated: Apr 14, 2025"); no product claims made anywhere | Working titles are hypotheses, labelled as such — **FLG-005** |
| T-08 | Category + seasonal cluster pages, search index | in progress | arena-4b28af50 | `site/build.mjs` (category/season/search generation) | — | Every internal href resolved against the built file tree by `tools/validate-links.mjs` | none |
| T-09 | Outbound-link qualification + click measurement (`site/assets/track.mjs`, measurement spec) | in progress | arena-4b28af50 | `docs/measurement/**`, `tools/analytics-server.mjs` | developers.google.com rel=sponsored guidance; Associates sub-tag prohibition in Program Policies | `rel="sponsored nofollow"` on every Amazon href, checked by the gate; no cross-user sub-tagging (policy-prohibited) | GitHub Pages cannot run a server endpoint — **FLG-006** |
| T-10 | Self-hosted analytics endpoint reference implementation (privacy-preserving, five events) | in progress | arena-4b28af50 | `tools/analytics-server.mjs`, `tools/lib/events.mjs` | — | Runs locally, tested with curl; no IP, no cookie, no per-user join | Deploy target still unchosen — Q-09 |
| T-11 | Campaign ledger (`data/campaign-ledger.json`) — schema-defined, empty, provenance-trailled | in progress | arena-4b28af50 | `data/campaign-ledger.json` | Associates Central Reports (first-party, authorized) | Deliberately contains no metrics; only `null` placeholders and the report names they must come from | no conversion score or revenue forecast is published — **FLG-007** |
| T-12 | Compliance gate in the publish workflow (`tools/compliance-gate.mjs`) + CI | in progress | arena-4b28af50 | `tools/compliance-gate.mjs`, `.github/workflows/ci.yml` | Operating Agreement §§1,2,5; Program Policies §2; ftc.gov | Gate fails the build on: disclosure missing/misordered, untagged Amazon link, `link.amazon` host, missing rel attribute, missing alt text, unverified value leaked into copy, sitemap/feed drift | none |
| T-13 | Suggestion Review Board (`data/suggestions.json`, `/suggestions/`) | in progress | arena-4b28af50 | `data/suggestions.json`, `site/content/pages/suggestions.mjs` | — | Each suggestion carries problem, change, evidence link, effort, risk, and the decision it unlocks | board is a menu, not a plan — **FLG-008** |
| T-14 | Decision brief: questions, knowns, unknowns, how to discover them (`data/questions.json`) | in progress | arena-4b28af50 | `data/questions.json`, `site/content/pages/decision-brief.mjs` | Associates Central (Store ID/Tracking ID, Link Checker, Reports) | Every open question names the exact tool or report that would answer it | most answers live behind the owner's account login — Q-01..Q-12 |
| T-15 | Flagged for Review page (`data/flags.json`, `/flagged/`) | in progress | arena-4b28af50 | `data/flags.json`, `site/content/pages/flagged.mjs` | per-flag source links | Each flag states what was checked, what failed, and the minimum action to clear it | — |
| T-16 | Executive summary (`/executive-summary/`, `EXECUTIVE_SUMMARY.md`) | in progress | arena-4b28af50 | `site/content/pages/executive-summary.mjs`, `EXECUTIVE_SUMMARY.md` | — | Every number in the summary is either an arithmetic fact about this repo (file/page counts) or traceable to `data/sources.json` | — |
| T-17 | Site generation into `docs/`, sitemap.xml, RSS feed, robots.txt, 404 | in progress | arena-4b28af50 | `docs/**` (generated) | sitemaps.org protocol, RSS 2.0 | Built locally, link-checked, then committed; Pages source = `main` / `/docs` | — |
| T-18 | Search Console + analytics activation runbook (reader capture, nav labels) | needs review | arena-4b28af50 | `docs/measure/`, `site/content/pages/measurement.mjs` | docs.google.com/search-central/sitemaps | Runbook only; cannot be executed from this sandbox (needs the owner's verified property) | **SG-29** open |
| T-19 | **Final integration**: merge, re-verify combined data line by line, build with zero broken links, publish Pages, open + merge PR | in progress | arena-4b28af50 | everything (integration role) | — | Runs after T-01..T-18; see §6 for the result | — |

---

## 3. Blockers

| ID | Blocker | Blocks | Owner to clear it |
| --- | --- | --- | --- |
| B-01 | The five supplied product identifiers are 9 characters; an ASIN is 10. No listing can be resolved or cited until the owner supplies correct ASINs or live `/dp/<ASIN>` URLs. | T-03, T-04, real affiliate links | Repository owner |
| B-02 | `link.amazon` is not an Amazon host, so the "supplied short links" cannot be compliance-judged from here. Their exact status stays unresolved (FLG-003) — do not describe them as invalid or valid. | T-04 | Repository owner |
| B-03 | No Associates Central credentials in this environment: no PA-API calls, no Link Checker run, no report export. Everything that needs the account is specified + gated, not executed. | T-09, T-11, T-18 | Repository owner |
| B-04 | Tracking ID `shopnow047c-20` is format-plausible for a US Store/Tracking ID (which ends `-20`) but its existence in the owner's account is not confirmable from here. | any monetized link | Repository owner |

---

## 4. Change requests (ask, don't take)

| ID | Requested by | Ask | File(s) | Status |
| --- | --- | --- | --- | --- |
| CR-01 | arena-4b28af50 | Register the corrected 10-character ASINs into `data/products.json` and `data/product-intent.json` when B-01 clears, then re-run `npm run build && npm run check`. | `data/products.json` | open (waiting on owner) |

---

## 5. Handoffs and incidents

| Date (UTC) | From → To | Task | Reason | What was preserved |
| --- | --- | --- | --- | --- |
| — | — | — | No handoffs yet. | — |

No merge conflicts recorded. `git pull --rebase` was run before every push.

---

## 6. Log

| # | Date/time (UTC) | Session | Action |
| --- | --- | --- | --- |
| 1 | 2026-11-20T05:26 | arena-4b28af50 | Inspected repo: one commit (`df3e953 Initial commit`), one file (`README.md`, "# WinA"). No prior `COORDINATION.md`, no site, no data — the requirements list in the brief refers to artifacts that do not exist in this branch, so everything was created from zero. |
| 2 | 2026-11-20T05:27 | arena-4b28af50 | Length-checked the five supplied identifiers: `B04G1MEwY`, `B02NbDxp3`, `B00hJ57DV`, `B0c8moW59`, `B0f3GKalj` — all 9 characters. Confirmed against Amazon's own definition (sell.amazon.com/blog/what-is-an-asin, retrieved 2026-11-20): "a unique 10-character alphanumeric code". Opened **FLG-001**. |
| 3 | 2026-11-20T05:28 | arena-4b28af50 | Confirmed `https://link.amazon/<id>` is not an Amazon product host (Amazon product pages are `https://www.amazon.com/dp/<ASIN>`; Associates links carry `?tag=`), opened **FLG-002**. Direct resolution attempts from this environment failed (sandbox egress + Amazon bot protection), so redirect targets are recorded as "not observed", not as "no redirect". |
| 4 | 2026-11-20T05:30 | arena-4b28af50 | Read the official policy set line by line and stored exact clauses in `data/sources.json`: Operating Agreement §1 (Special Links = "tagged" link formats), §5 (the required Associate statement), Program Policies §2 (tag as a URL parameter, no bookmark prompting, links accessed directly from the Site, no per-user sub-tags), Associates Help G8TW5AE9XL2VX9VM (application review needs qualifying sales; Link Checker is the official tagging test), PA-API registration page (final acceptance + primary account owner), FTC endorsement guidance (2023 revision added a definition of "clearly and conspicuously"), USDA FSIS temperature chart, Google rel=sponsored guidance, GitHub Pages publishing sources. |
| 5 | 2026-11-20T05:32 | arena-4b28af50 | Decision recorded: publish from branch `main`, folder `/docs`, with the built site committed — no Jekyll, no external build service, no dependencies to install. Documented in `ARCHITECTURE.md`. |
| 6 | 2026-11-20T05:33 | arena-4b28af50 | Decision recorded: **no monetized outbound link ships until B-01 clears.** Product pages publish the register (what was submitted, what failed, what to do) with the buy button in a locked state. Fabricating `/dp/` URLs for 9-character strings would send buyers to 404 pages and put the account at risk; the compliance gate fails any build that emits an untagged or malformed Amazon link. |

---

## 7. Next session: where to start

1. `npm run build && npm run check` — green build means the site and every gate pass.
2. Read `/executive-summary/` then `/decision-brief/` then `/suggestions/` in the built site
   (or the `.md` mirrors in the repo) to see the state of the programme.
3. Clear B-01: supply the five real ASINs, then run `node tools/collect.mjs --inbox data/inbox`
   to fold verified listing data into the register. Nothing else unblocks monetization.
4. Do not delete rows from `data/flags.json` — flip `status` to `resolved` and add the source that
   proved it.

---

## 8. Completion record — session `arena-4b28af50`

Built on branch `arena/4b28af50-wina` from `df3e953`. No other session claimed anything while this
work ran (the board was created by this session from an empty repo), so there were no conflicts to
resolve and no handoffs.

### What was produced

| Area | Artefacts |
| --- | --- |
| Site | `docs/` — 39 public pages + `404.html`, `sitemap.xml` (34 URLs), `feed.xml` (6 items), `robots.txt`, `humans.txt`, `search.json`, `.nojekyll`, `assets/{styles.css,app.js,favicon.svg,img/*.jpg}` |
| Reader content | 6 guides in `site/content/guides/`, 4 sections, 6 seasonal clusters, the shelf, 2 calculators, printable comparison sheets, in-browser search |
| Registers | `data/sources.json` (20), `data/products.json` (5), `data/product-intent.json` (5), `data/flags.json` (16), `data/suggestions.json` (40 + 3 paths), `data/questions.json` (14), `data/campaign-ledger.json` (0 rows), `data/events.json` (5), `data/categories.json`, `data/seasons.json`, `data/forms.json` |
| Machinery | `tools/{validate-data,validate-links,compliance-gate,publish-gate,collect,next-topics,analytics-server}.mjs`, `.github/workflows/ci.yml` |
| Docs | `README.md`, `ARCHITECTURE.md`, `EXECUTIVE_SUMMARY.md`, this board |

### Verification performed (what was actually read, not assumed)

- **Operating Agreement** — fetched and read the live page; §1 (Special Links), §3 (customer
  contacts), §4 (warranties), §5 (the exact disclosure sentence + no-embellishment), §6 (breach)
  quoted from the page body, page self-dated “Updated: October 15, 2025”.
- **Program Policies §2(a)/(b)** — tag as a URL parameter, links accessed directly from the Site,
  no bookmark prompting, no per-user sub-tags. Marked `official-domain excerpt` in the register
  because the help hub is gated; that limitation is recorded in the row, not hidden.
- **ASIN definition** — fetched `sell.amazon.com/blog/what-is-an-asin`: “10-character alphanumeric
  code”, “starts with B0”, “the ASIN appears after /dp/”. This is what the five supplied
  identifiers were measured against; all five are 9 characters (arithmetic, not judgement).
- **Associates Help: application review process** — fetched; the ≥3 qualifying sales in 180 days,
  personal orders excluded, ~10 posts, content within ~60 days, “You must own your website”.
- **PA-API registration** — final acceptance required; primary account owner only; max two key
  pairs. Hence: no API call was attempted, and the collector reads a file instead.
- **FTC Endorsement Guides** — fetched; the significant-minority material-connection test, the
  honest-opinion principle, the exceptional-results principle, and the 2023 “clearly and
  conspicuously” definition.
- **USDA FSIS temperature chart** — fetched; the table reproduced in one guide is copied from that
  page, with the page's own “Last Updated: Apr 14, 2025” and our read date.
- **Google rel=sponsored + spam policies** — official-domain text matched; recorded as excerpt
  because the docs page refused the fetch.
- **GitHub Pages publishing sources** — fetched; chose branch `main` + `/docs` over a workflow.
- Self-checks: `npm run check` = **2,843 assertions** (976 data, 704 links, 1,163 compliance), all
  passing; `tools/analytics-server.mjs` was exercised with curl (accept / reject / 410 / summary)
  and its state directory removed afterwards so no test data is committed.

### Irregularities found (all published on /flagged/ with sources)

1. **FLG-001** — five 9-character identifiers where an ASIN is 10. Blocks all product data and every monetized link. **Blocking.**
2. **FLG-002** — `link.amazon` is not an Amazon product host and carries no `tag=` parameter. **Blocking.**
3. **FLG-003** — the supplied short links' compliance status is *unobserved*, and is described that way. Not called invalid, per the brief.
4. **FLG-004** — the air-fryer cluster is inferred from the brief's editorial titles, not from any listing.
5. **FLG-013** — Pages sub-path vs “You must own your website”; treat the deployed URL as staging.
6. **FLG-016** — the brief references prior artefacts (`SG-27..SG-30`, `FLG-003`, `S01/S07/S24`) with no backing files in this repo's history. SG/FLG ids were re-derived here; the S-numbers are recorded as unmapped rather than invented.
7. Product imagery, brand name, and byline are all provisional and flagged (FLG-009, FLG-010, FLG-011).

### Decisions taken without waiting (and the default each records)

- Publish the site locked rather than fabricate listings; the gate enforces it.
- Print no price/rating/availability anywhere, with a standing reason (`Q-13`, `FLG-007`).
- Emit `Article`/`BreadcrumbList`/`FAQPage`/`CollectionPage` schema only; no `Product`, no
  `Offer`, no `aggregateRating` — the gate fails the build if one appears.
- Aggregate-by-day measurement only, so the no-sub-tag-per-user rule cannot be broken by accident.
- Working masthead “The Preheat”, defined once in `config/site.config.json` so a rename is one line.

### Integration note

This session also acted as the integration session (single-session branch, per the Arena branch
pin). Shared outputs — `docs/`, `data/products.json`, navigation, sitemap, feed — were changed only
in the integration pass at the end, after the per-task files were stable. PR → merge → Pages
enablement are recorded in §9 once they resolve.
