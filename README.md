# WinA

Publication site for five submitted Amazon listings (air fryers & ovens, meat thermometers), with buyer-question guides and a dashboard of sources, findings, questions, suggestions and flags.

- Live site: https://sassnarep3-star.github.io/WinA/ (GitHub Pages, served from `docs/` on `main`)
- Data: `data/*.json` (single source of truth; every row cites an official source; blanks are unverified and flagged)
- Build: `python3 tools/build.py` regenerates `docs/` and fails on any broken link, missing source, displayed price, or missing disclosure
- Coordination: see `COORDINATION.md` before starting work
- Archive: `archive/arena-4a5044b0/` holds the earlier root-level site, preserved unchanged and no longer served

Associates disclosure: As an Amazon Associate I earn from qualifying purchases.
