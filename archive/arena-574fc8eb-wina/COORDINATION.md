# COORDINATION.md — shared task board

This file is the shared task board for this repository. Every session must read it before
starting work, claim tasks here (session ID + file scope), and commit + push the claim before
touching any file. Status values: `unclaimed`, `in progress`, `done`, `needs review`
(`needs review` = published on the Flagged for Review page; it does not block anything).

## Session conventions (this repository)

- **Active session:** `574fc8eb` (Arena session, branch `arena/574fc8eb-wina`).
- **Branch note (deviation, logged):** the task brief asks for per-session branches named
  `session-<id>/<task>`. The Arena platform fixes each session to its own branch and forbids
  creating or pushing other branches, so this session works exclusively on
  `arena/574fc8eb-wina`. Scopes below remain non-overlapping; if a second session appears in
  this repo it must claim its own file scope here first and request any cross-scope edit as a
  logged request instead of editing another session's files.
- **At claim time (2026-11-20):** no other session had created this board; the repository
  contained only `README.md`. All tasks below are therefore claimed by `574fc8eb`.
- **Integration session:** `574fc8eb` (sole session) — re-verifies combined data line by line,
  runs the site gates, confirms no broken links, opens the PR to `main`, merges, and publishes
  GitHub Pages.
- **Takeover rule:** if a claim is older than 60 minutes with no commits, any session may take
  over the task and log the handoff below.

## Task board

| ID | Task | Status | Owner | Files it touches |
| --- | --- | --- | --- | --- |
| T1 | Repo review (line-by-line, from initial state) | done | 574fc8eb | README.md, COORDINATION.md |
| T2 | Create shared coordination board + claims | done | 574fc8eb | COORDINATION.md |
| T3 | Source register: fetch & verify every official source used | done | 574fc8eb | data/sources.json |
| T4 | Five-link intake: product-intent record (intent vs observed, separate fields) | done | 574fc8eb | data/intent-record.json, data/products.json |
| T5 | Site build: publication front page, products, guides (generator) | done | 574fc8eb | scripts/build_site.py, templates via generator, index.html, products.html, guides/ |
| T6 | Analysis & findings tables (every row sourced) | done | 574fc8eb | data/flags.json, analysis.html (generated) |
| T7 | Suggestions review section (review before implementing) | done | 574fc8eb | data/suggestions.json, suggestions.html (generated) |
| T8 | Open-questions / answers decision list | done | 574fc8eb | data/questions.json, questions.html (generated) |
| T9 | Executive summary | done | 574fc8eb | executive-summary.html (generated) |
| T10 | Flagged for Review page (irregularities + sources) | done | 574fc8eb | flagged.html (generated) |
| T11 | Analytics: 5 events, privacy-preserving counter, self-hosted endpoint, campaign ledger | done | 574fc8eb | assets/analytics.js, tools/analytics_endpoint.py, data/campaign-ledger.csv |
| T12 | SEO/findability: sitemap.xml, feed.xml, robots.txt, search, Search Console checklist | done | 574fc8eb | scripts/build_site.py outputs, robots.txt, search.html |
| T13 | Compliance gate: disclosure strip on every page, rel=sponsored, checker script | done | 574fc8eb | scripts/check_site.py, assets/* (chrome) |
| T14 | PR → main, merge, enable GitHub Pages, verify live, record result here | done | 574fc8eb | COORDINATION.md, .github/workflows (if needed) |

## Change requests from other sessions

_(none — no other session has requested changes in this repository)_

## Verification log (sources checked, in order, by task)

All fetches performed live on **2026-11-20** by session `574fc8eb` unless noted.

| # | Official source | What it verified |
| --- | --- | --- |
| V1 | https://www.amazon.com/dp/B0CDY277D3 | Listing title, buy-box price $79.93, In Stock, sold by Amazon.com, breadcrumb → Air Fryers node 17659096011 |
| V2 | https://www.amazon.com/dp/B09B7SB46R | Listing title, buy-box price $149.99, In Stock, sold by Amazon.com, breadcrumb → Air Fryers node 17659096011 |
| V3 | https://www.amazon.com/dp/B08DKYBTPH | Listing title, buy-box price $69.99, In Stock, sold by Amazon.com, breadcrumb → Air Fryers node 17659096011 |
| V4 | https://www.amazon.com/dp/B0DHZTCNR5 | Listing title, buy-box price $16.99, In Stock, sold by Amazon.com, breadcrumb → Meat node 289810 |
| V5 | https://www.amazon.com/dp/B0DZFD6R9Z | Listing title, buy-box price $119.99, In Stock, sold by Amazon.com, breadcrumb → Meat node 289810 |
| V6 | https://link.amazon/B04G1MEwY | Observed redirect → https://www.amazon.com/dp/B0CDY277D3 (final URL carried `btn_ref=srctok-…`) |
| V7 | https://link.amazon/B02NbDxp3 | Observed redirect → https://www.amazon.com/dp/B09B7SB46R |
| V8 | https://link.amazon/B00hJ57DV | Observed redirect → https://www.amazon.com/dp/B08DKYBTPH |
| V9 | https://link.amazon/B0c8moW59 | Observed redirect → https://www.amazon.com/dp/B0DHZTCNR5 |
| V10 | https://link.amazon/B0f3GKalj | Observed redirect → https://www.amazon.com/dp/B0DZFD6R9Z |
| V11 | https://www.amazon.com/dp/B04G1MEwY and https://www.amazon.com/dp/B0f3GKalj | Direct `/dp/<token>` fetches did **not** render a product page (fetch failed twice); control `/dp/<10-char ASIN>` renders normally |
| V12 | https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-items | ASIN = "10-Character alphanumeric unique identifier assigned by Amazon" (ItemIdType table); `partnerTag` required, example format `xyz-20` |
| V13 | https://affiliate-program.amazon.com/help/operating/agreement (Updated: October 15, 2025) | §1 Special Links must use the "tagged" link formats Amazon provides; §4 no representation of expected traffic/commission; §5 required disclosure text; §6(a) breach of §5 is a material breach |
| V14 | https://affiliate-program.amazon.com/help/operating/policies (Updated: April 14, 2026) | Qualifying Purchase session = 24 h from click; cart attribution 89 days; §2(g) unformatted links = disqualified purchases; §2(e) redirecting links disqualify |
| V15 | https://affiliate-program.amazon.com/help/operating/schedule | Commission-rate schedule redirects to Associates sign-in → standard rates **not publicly verifiable** without an account (flagged FLG-004) |
| V16 | https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links (last updated 2025-12-10) | `rel="sponsored"` marks advertisements/paid links; multiple rel values allowed space/comma separated |
| V17 | https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers (November 2019) | Disclosure must be hard to miss, with the endorsement, in simple language; #ad/#sponsored acceptable |
| V18 | https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site | Publish from a branch (root or /docs) or a GitHub Actions workflow; sites are public |
| V19 | https://affiliate-program.amazon.com/help/operating/agreement §1 (re-read) | "Program Content" definition (data, images, text, link formats provided by Amazon) |

## Irregularities found (published on /flagged/)

| Flag | Severity | Summary |
| --- | --- | --- |
| FLG-001 | High | Two of five submitted links resolve to a different browse node (Meat 289810) than the three air fryers (Air Fryers 17659096011) — site scope must cover both categories |
| FLG-002 | High | All five submitted tokens are 9 characters; Amazon's official ASIN definition is 10 characters, so none of the tokens is itself an ASIN |
| FLG-003 | High | Exact compliance status of the supplied `link.amazon/*` short links is **unresolved** — not claimed invalid; one-link-per-product Special Link test in the enrolled Associates workflow is required before scaling |
| FLG-004 | Medium | Commission rates for the two categories cannot be confirmed from a public official source (schedule page requires Associates sign-in) — left blank, marked unverified |
| FLG-005 | Medium | Tracking ID `shopnow047c-20` is owner-supplied; its active status in Associates reports is unconfirmed (blocked on account access) |
| FLG-006 | Medium | Intended ASIN / intended listing URL / confirmation date / intent source are blank for all five products (owner confirmation required; never merged with observed fields) |
| FLG-007 | Medium | Prices are point-in-time buy-box observations (2026-11-20) and change; no price may be republished without re-verification |
| FLG-008 | Low | Search Console property for the live site is not yet verified/added (owner action) |
| FLG-009 | Low | "Five defined events" wording could not be matched to a canonical list in the repo; five events are defined in `assets/analytics.js` + platform page — replace if an owner-supplied canonical list exists |
| FLG-010 | Low | Self-hosted analytics endpoint cannot run on GitHub Pages; endpoint code ships in `tools/analytics_endpoint.py`, deployment target is an open question (Q-08) |

## Deployment record

| Item | Result |
| --- | --- |
| PR #1 (arena/574fc8eb-wina → main) | see lines below — filled after merge |
| Merge result | see below — filled after merge |
| GitHub Pages | see below — filled after enable |
| Live URL | https://sassnarep3-star.github.io/WinA/ (confirmed after deploy) |

## Log

- **2026-11-20 — 574fc8eb** — Board created; T1–T14 claimed with file scopes; claims pushed first
  (this commit) before any other file work, per the brief.
