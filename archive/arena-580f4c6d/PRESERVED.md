# Preserved build — `arena/580f4c6d-wina` (PR #28, merged 2026-11-20)

Verbatim, non-served snapshot of the site that PR #28 put at the repository root: `index.html`,
`shop.html`, `seasonal.html`, `guides/`, `data-room/`, `analytics/`, `handoff/`, `tools/check_site.py`,
its data registers, its workflows, its README and its own coordination board. No file here was
edited. Two entries are absent from this copy, for reasons stated plainly: its `archive/` subdirectory
(copies of earlier sessions' builds, already preserved at this repository's own `archive/`) and its
`.gitignore`, whose `data/inbox/*` and `data/exports/*` patterns would have hidden parts of this
snapshot from Git.

**Why it is here rather than at the root.** The merge made a second root-level site current on top of
the build that carries this project's compliance machinery, so the generated publication
(`_src/build.mjs`, `scripts/*-gate.mjs`, `data/*.json`) stopped being what GitHub Pages serves. The
front page that merge published displays prices and customer-rating counts and hot-links product
imagery from `m.media-amazon.com` — its own board records the imagery route as its FLG-005 — while the
Associates Program Policies restrict that content to Product Advertising API or Creatives output.
That is not a judgement about the writing. This build's holiday cluster was absorbed into the
publication first, in commit `406b523`, and its guides are live on the site you are reading. The
defect is the merge order, and it is recorded with its evidence in FLG-043.

**To make this build current again:** copy this directory over the repository root, then fix the
price, rating and hot-linked-imagery rows in its `data-room/` before it stays live, and run
`python3 tools/check_site.py`. Its board sections are already unioned into
[`../../COORDINATION.md`](../../COORDINATION.md), so no decision recorded there is stranded in this
folder.
