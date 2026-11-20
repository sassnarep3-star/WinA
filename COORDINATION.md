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
