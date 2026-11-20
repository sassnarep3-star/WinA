# Preserved build — `arena/580f4c6d-wina` lineage (PR #28 and its follow-ups), snapshot of `main` at `022e00e`

Verbatim, non-served copy of the site that PR #28 put at the repository root: `index.html`, `shop.html`,
`seasonal.html`, `about.html`, `compare.html`, `questions.html`, `suggestions.html`,
`executive-summary.html`, `guides/`, `data-room/`, `analytics/`, `handoff/`, `tools/check_site.py`, its own
data registers, its workflows, its README and its own coordination board. No file was edited. Two entries
are absent from this copy and the reason is stated rather than left to guesswork: its `archive/`
subdirectory (copies of earlier sessions' builds, already preserved at this repository's own `archive/`)
and its `.gitignore`, whose `data/inbox/*` and `data/exports/*` patterns would have hidden parts of this
snapshot from Git.

**Why it is here rather than at the root.** The merge made a second root-level site current on top of the
build that carries this project's compliance machinery, so the generated publication — `_src/build.mjs`,
the four checkers under `scripts/`, the dated registers in `data/` — stopped being what GitHub Pages
serves. The root that merge published displayed hand-copied prices and customer ratings alongside product
images hot-linked from `m.media-amazon.com`. **That tree has since been repaired on its own terms:** PR #54
(`dccc21c`) removed every price, rating, review count and merchandising badge from its served pages, cited
Participation Requirements §6(t)/§6(y) and IP License §2(b) verbatim, and added gate rules R-10 and R-11 to
`tools/check_site.py`; the snapshot here includes that repair. What remains open on it is the imagery —
three `m.media-amazon.com` anchors on `index.html`, which its own register carries as FLG-005 pending
Product Advertising API access.

So the case for this directory being an archive rather than the root is not that the other session ignored
the rules; it recorded them. The case is that a rule with no gate behind it survives exactly as long as the
next person editing the front page remembers it. On this tree the image policy is a build failure: every
`<img>` must resolve to a real file under `assets/img/`, carry alt text and an intrinsic size, and not name
an Amazon, stock-library or other third-party host.

**What was carried forward rather than left here.** Its guides were already absorbed into the publication in
commit `406b523`. Its board sections are unioned into [`../../COORDINATION.md`](../../COORDINATION.md). Its
flags FLG-043 to FLG-048 are now rows in this repository's own register under the same ids, and two of them
corrected this build: the 8-quart's "final two minutes" Hi-Fry wording is gone from the copy because it is
published only on the black SKU's page (their FLG-045), and the CHEF iQ model number is blank with the
reason printed on the product page (their FLG-046).

**To make this build current again:** copy this directory over the repository root and run
`python3 tools/check_site.py`. Before it stays live, replace the three `m.media-amazon.com` anchors in
`index.html` with its own `assets/img/` set — that directory already has five originals, so this is a
markup change and not a sourcing problem.
