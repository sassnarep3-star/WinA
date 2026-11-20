# WinA

Publication site for five submitted Amazon listings (air fryers & ovens, meat thermometers), with buyer-question guides and a dashboard of sources, findings, questions, suggestions and flags.

- Live site: https://sassnarep3-star.github.io/WinA/ (GitHub Pages, source `main` `/`; the site is generated at the repo root)
- Data: `data/*.json` (single source of truth; every row cites an official source; blanks are unverified and flagged)
- Build: `python3 tools/build.py` regenerates the site at the root (generated paths only; `archive/`, `data/`, `tools/` are never touched) and fails on any broken link, missing source, displayed price, or missing disclosure
- Coordination: see `COORDINATION.md` before starting work
- Archive: `archive/arena-4a5044b0/` and `archive/arena-6bd1be15/` hold earlier root-level sites, preserved unchanged and no longer served
- This session (`arena/59299521-wina`): cross-verified all five submitted short links against official Amazon listings (observed ASINs match `data/products.json`); archived its standalone build at `archive/arena-59299521-wina/`; added the `instant-read-or-wireless` guide to `data/guides.json`; PR #7 (`arena/59299521-wina` → `main`) merged into `main` as part of this integration.

Associates disclosure: As an Amazon Associate I earn from qualifying purchases.
