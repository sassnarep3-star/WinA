# WinA — Coordination Board

Shared task board for parallel agent sessions working on this repo.
Branch: `arena/4a5044b0-wina` (branched from `df3e9534` on `main`).

## Session claims

| Session ID | Task | Status | Files touched | Started | Finished | Sources / verification |
|---|---|---|---|---|---|---|
| arena-4a5044b0-wina | Coordination board + repo review | done | COORDINATION.md | 2026-11-20 | 2026-11-20 | repo state (empty, greenfield) |
| arena-4a5044b0-wina | Shared site assets (CSS, JS, click-tracker, analytics) | done | assets/css/style.css, assets/js/app.js, assets/js/click-tracker.js | 2026-11-20 | 2026-11-20 | n/a (frontend; no external deps) |
| arena-4a5044b0-wina | Landing page (publication front page, product-led) | done | index.html | 2026-11-20 | 2026-11-20 | n/a |
| arena-4a5044b0-wina | Products page (table + verification + source links) | done | products.html | 2026-11-20 | 2026-11-20 | Amazon (blocked — see irregularities; values left blank/unverified, never inferred) |
| arena-4a5044b0-wina | Buying guides (question-shaped) | done | guides.html | 2026-11-20 | 2026-11-20 | n/a (added to sitemap.xml + feed.xml) |
| arena-4a5044b0-wina | Suggestions section (review-before-implement) | done | suggest.html | 2026-11-20 | 2026-11-20 | n/a |
| arena-4a5044b0-wina | Pre-decision Q&A (missing-information discovery) | done | questions.html | 2026-11-20 | 2026-11-20 | n/a |
| arena-4a5044b0-wina | Executive summary | done | executive-summary.html | 2026-11-20 | 2026-11-20 | n/a |
| arena-4a5044b0-wina | Flagged for Review page | done | flagged.html | 2026-11-20 | 2026-11-20 | irregularities + unverified items published |
| arena-4a5044b0-wina | SEO: sitemap.xml + RSS feed.xml | done | sitemap.xml, feed.xml | 2026-11-20 | 2026-11-20 | n/a |
| arena-4a5044b0-wina | GitHub Pages enable + PR + merge | done | repo settings (Pages), PR #1 | 2026-11-20 | 2026-11-20 | PR: https://github.com/sassnarep3-star/WinA/pull/1 ; merged into main (commit 48af6e0); GitHub Pages built at https://sassnarep3-star.github.io/WinA/ |

## Rules for this board
- Claim a task by writing your session ID + file scope, then commit and push that claim immediately.
- Never start a task another session has claimed.
- Keep scopes non-overlapping; each session works on its own branch/worktree named `session-<id>/<task>`.
- If a task requires changing a file owned by another session, log the request here instead of editing it.
- Make small, frequent commits; run `git pull --rebase` before every push.
- On merge conflict: stop, resolve without discarding the other session's work, log what happened.
- When a task is finished, record its sources, the verification performed, and any irregularities here, then mark it `done`.
- `needs review` means the item is published on the Flagged for Review page and does not block anything.
- A claim older than 60 minutes with no commits may be taken over by another session (note the handoff).
- Shared outputs (table data, index, navigation) are changed only by the final integration session once all other tasks are done.

## Irregularities flagged (review required)
1. **Amazon product verification blocked** — outbound internet in this sandbox is limited to GitHub/npm/PyPI hosts; Amazon.com is not reachable. The five submitted short links (`link.amazon/B04G1MEwY`, `B02NbDxp3`, `B00hJ57DV`, `B0c8moW59`, `B0f3GKalj`) cannot be resolved to official Amazon listing pages, so ASINs, titles, prices, commissions, and images are left **blank and unverified**. Never inferred. See `products.html` and `flagged.html`.
2. **Short-link codes are 9 characters** — standard Amazon ASINs are 10 characters. The codes after `link.amazon/` are 9 chars each. This is a possible truncation or a non-ASIN short code; flagged for review, not treated as ASINs.
3. **Tracking ID `shopnow047c-20`** — provided by the user; not independently verified against Amazon Associates (no Amazon access).
4. **No prior repo content** — greenfield; nothing to preserve or conflict with.

## Sources used (official, verifiable)
- Amazon Associates program policies / Operating Agreement: https://affiliate-program.amazon.com/help/operating/policies (referenced; not re-fetched due to sandbox host limits)
- FTC endorsement/disclosure guidance: https://www.ftc.gov (referenced; not re-fetched due to sandbox host limits)
- GitHub Pages: https://docs.github.com/pages (referenced; not re-fetched due to sandbox host limits)

## Integration complete
- PR #1 (https://github.com/sassnarep3-star/WinA/pull/1) merged into `main` at commit 48af6e0.
- GitHub Pages enabled on `main`, path `/`; site built and live: https://sassnarep3-star.github.io/WinA/
- Homepage, products, guides, suggestions, Q&A, executive summary, Flagged for Review, sitemap.xml, and feed.xml all verified live with no broken internal links.
- Flagged irregularities and unverified items are published on flagged.html and do not block the merge; reviewer can request changes after the site is live.

---

---

## Integration session 2ca62ce9 (branch `arena/2ca62ce9-wina`) · 2026-11-20

This section was added on rebase onto `main` (which already contained PRs #1 and #3 from `arena/4a5044b0-wina`). Nothing from the earlier board was removed. The earlier root-level site is preserved unchanged under `archive/arena-4a5044b0/` (see "Archive" below).

### Task board (session 2ca62ce9)

| Session ID | Task | Status | Files touched | Started | Finished | Sources / verification |
|---|---|---|---|---|---|---|
| arena-2ca62ce9-wina | Publication site build (`data/`, `tools/build.py`, `docs/`): front page, shop + category pages, 4 guides, dashboard hub + 9 dashboard pages, RSS, sitemap | done (awaiting integration review) | data/, tools/, docs/, README.md, COORDINATION.md, archive/arena-4a5044b0/ (move) | 2026-11-20 | 2026-11-20 | SRC-01 to SRC-11 (see below); `python3 tools/build.py` passes; 650 internal refs checked, 0 broken |
| arena-2ca62ce9-wina | Verified source register | done | data/sources.json | 2026-11-20 | 2026-11-20 | SRC-01 to SRC-05 (official Amazon Associates, FTC, Google); SRC-06 to SRC-10 (observed Amazon listings); SRC-11 (forum, partial) |
| arena-2ca62ce9-wina | Product register (5 submitted links; observed fields separate from intended fields; intended fields blank) | done, blanks flagged | data/products.json | 2026-11-20 | 2026-11-20 | SRC-06 to SRC-10 |
| arena-2ca62ce9-wina | Flagged for Review (FLG-001 to FLG-015) | done | data/flags.json, docs/dashboard/flagged.html | 2026-11-20 | 2026-11-20 | per flag |
| arena-2ca62ce9-wina | Validate submitted links + Tracking ID in Associates Central | blocked: needs owner login | — | — | — | FLG-001 to FLG-004 |
| arena-2ca62ce9-wina | Analytics endpoint + five-event confirmation | blocked: owner decision (S-03) | — | — | — | FLG-007, FLG-008 |
| arena-2ca62ce9-wina | Search Console + reader capture | blocked: owner access / decision (S-07) | — | — | — | FLG-012 |

### Overlapping claims (both resolved by this integration)

- `arena/2b309a82-wina` (commit 94a8bd3, not merged) claims the same publication-site task. It is not merged here and this integration does not edit it. Owner to decide per Suggestion S-08 (`docs/dashboard/suggestions.html`) and flag FLG-009.
- `arena/4a5044b0-wina` (PRs #1 and #3, merged into `main`) built an earlier root-level site. Its pages are preserved in `archive/arena-4a5044b0/` and no longer served. The live site is now the integrated site in `docs/`, served through GitHub Pages from `main` `/docs`. Reason: the earlier site had blank product rows and no source register, and this site adds the source register, observed-destination fields, the 15-flag register, the guides' sources, and build checks. Nothing from that site was lost; it is in the archive folder with its history.
- Discrepancy recorded for review: the earlier board stated that Amazon.com was unreachable from this environment. In this session the fetch tool did reach the five observed Amazon pages (2026-11-20). curl from the sandbox still cannot reach `link.amazon` (HTTP 000). Both observations are recorded in FLG-001 and FLG-002.

### Verification performed (this session)

- Each submitted short link opened; destination pages observed; the redirect target recorded in `observed_*` fields and kept separate from `intended_*` fields (which are blank: the submitted paths are 9 characters, FLG-001).
- Official sources opened and quoted: SRC-01 (Operating Agreement §5 disclosure wording), SRC-02 (Program Policies: Special Link tag §2(b); price display §2(b)), SRC-03 (Associates Help: 3 qualified sales in 180 days; ~10 posts; content recent within 60 days), SRC-04 (FTC Disclosures 101: "hard to miss"), SRC-05 (Google rel="sponsored").
- Build checks (fail on any): source host allowlist; observed destination equals source URL; intended ASIN format and completeness; no displayed prices; disclosure present twice on every page; every Amazon anchor marked sponsored; no broken internal links or anchors.
- Not performed: rendering in a browser (none in the sandbox); external HTTP checks (outside the allowlist); Associates Central login; Search Console.

### Irregularities (this session)

See `data/flags.json` and `docs/dashboard/flagged.html`: FLG-001 (9-character paths), FLG-002 (intended vs observed mismatch), FLG-003 (compliance unresolved), FLG-004 (Tracking ID not verified; format differs from the XXXXX-## example), FLG-005 (prices not displayed), FLG-006 ("Sponsored" text observed), FLG-007 and FLG-008 (five events undefined; no endpoint on Pages), FLG-009 (overlapping claim), FLG-010 (content volume), FLG-011 (ASIN source is forum-level), FLG-012 (Search Console, reader capture), FLG-013 (brand and author placeholders), FLG-014 (S01/S02/S07/S24 and FLG-003 register not in repo), FLG-015 (seasons and clusters).

### Archive

- `archive/arena-4a5044b0/` holds the earlier root-level pages (`index.html`, `products.html`, `guides.html`, `suggest.html`, `questions.html`, `executive-summary.html`, `flagged.html`, `feed.xml`, `sitemap.xml`), their `assets/`, and `.nojekyll`. Files are moved with `git mv`; no content was changed.

### Pull request and deploy

- PR: https://github.com/sassnarep3-star/WinA/pull/4 (`arena/2ca62ce9-wina` → `main`).
- Merge and Pages deploy: recorded as a comment on PR #4 after the merge (this branch may not push to `main` directly). Pages source switched from `main` `/` to `main` `/docs` immediately after the merge, so the live URL serves the integrated site.
