# Executive summary — WinA / Counter Space

**Written:** 2026-11-20 · **Site:** https://sassnarep3-star.github.io/WinA/ · **Served from:** `main`, repository root, GitHub Pages

This page is the short version for whoever owns the Amazon account. It states what is live, what is
deliberately not live, what the last verification pass found, and what is waiting on a human.

---

## 1. Where the project stands

A 33-page affiliate publication is live and indexed-by-sitemap, covering three air fryers and two
meat thermometers, with **94 tagged outbound product links**, original line art on every product
card and product page, and 8 published guides. It is not a mockup: every page is
generated from a data register, and three independent gates run on every push and pull request.

| Surface | State |
| --- | --- |
| Reader pages | 33 total: front page + 404, 8 guides, 2 category hubs, 5 product pages, compare, register, a marketing kit, and the operations set (flagged, questions, suggestions, summary, dashboard, analytics, disclosure, privacy, about, seo, marketing, concept) |
| Data registers | 5 products · 60 spec rows · 6 policy sources · 10 policy clauses quoted · 45 flag rows (10 resolved) · 27 questions · 29 suggestions · 9 recorded decisions · 3 ranked paths |
| Verification mix | 32 `verified` · 14 `unverified` · 10 `withheld` · 4 `claim`; **36 rows carry a value, 24 are blank with a reason**, and 22 of the valued rows cite a manufacturer page directly rather than the listing |
| Compliance | OA §5 statement verbatim on all 30 pages; the disclosure precedes the first sponsored link on every page (asserted by byte offset, not by eyeball); `rel="sponsored nofollow noopener"` + `?tag=shopnow047c-20` on all 94 product links; the 11 submitted short-link anchors render as declared non-affiliate citations (`rel="nofollow"`, no tag), alongside 8 other citations. Counts from `scripts/compliance-gate.mjs`, cross-checked by `scripts/check-site.mjs` at 111 Amazon links / 94 sponsored, with 1279 internal links resolved |
| Measurement | Five events defined; collector written but **not deployed**, so the client is inert by design |
| Money | **Zero** revenue claims; ledger holds 0 rows, by policy |
| Gates | Four checkers, all green (1,199 compliance assertions, 1,279 internal links verified, the builder's own gates). CI fails if generated output is not committed, the build is not reproducible, or a compliance rule breaks — and Pages' deploy job now runs the compliance gate too, so a regression stops the release rather than reddening a check |
| History | Four prior session builds preserved under `archive/` (83 files), nothing deleted |

## 2. What the product question turned out to be

The five supplied `link.amazon/B0…` codes are **not ASINs** — they are 9-character short codes. Three
independent sessions followed the redirects and recorded ten-character destinations; this session
re-checked the arithmetic and the classification rules, not the destinations:

| Short code | Observed ASIN | Product |
| --- | --- | --- |
| `B04G1MEwY` | `B0CDY277D3` | CHEFMAN 6 Quart Dual Basket Air Fryer Oven |
| `B02NbDxp3` | `B09B7SB46R` | Emeril Lagasse 26QT French Door Air Fryer Toaster Oven |
| `B00hJ57DV` | `B08DKYBTPH` | CHEFMAN 8 Qt TurboFry 4-in-1 |
| `B0c8moW59` | `B0DHZTCNR5` | ThermoMaven 1 Sec Meat Thermometer |
| `B0f3GKalj` | `B0DZFD6R9Z` | CHEF iQ Sense Smart Wireless Thermometer Gen3 |

Intended ASIN is recorded as `null` and kept in a field separate from the observed one — an earlier
session merged them (FLG-016) and that is why the separation is now a checked invariant rather than
a note. Whether `link.amazon` links are compliant is **unresolved, not invalid** (FLG-003); the site
does not depend on them.

## 3. What this session added

Four sessions built four sites on this repo. A fifth was built here too, and on reading the board
before merging it was **deleted rather than shipped** — main's site already satisfies the brief, and
two competing front pages would have hurt the one asset this property has. What was kept is the part
main lacked:

1. **`scripts/compliance-gate.mjs` (1,159 checks)** — the money-and-trust half: disclosure *ordering*
   (not just presence), three-state classification of every Amazon href including short links,
   claim bans on reader copy (prices, ratings, availability, testing and income claims) with
   documentary and quotation context so honest prose survives, schema bans (`aggregateRating`,
   `Offer`, `availability`), canonical = origin + path with no doubled base segment, and 90-day
   source staleness warnings. `--refresh-sources` re-fetches each cited page and diffs the quoted
   text, so a policy edit upstream becomes a build signal instead of a slow lie.
2. **Referential integrity across the register** — every valued spec row must name a source id that
   exists in `data/policy.json`; every flag reference must exist in `data/governance.json`; a
   Special Link test may not be marked passed without date, destination, report line and tester.
   **This found 5 dangling `SRC-02` references in `data/special_link_tests.json` on the live site —
   fixed** to point at the defined `link-redirect` source, with a note naming the archived register
   those ids came from.
3. **The same misattribution bug, found twice — and theirs kept.** `/register/` used to render a
   tagged `amazon.com/dp/<ASIN>` link in the Source column whenever a row had *any* source, so a row
   citing a manufacturer or a USDA table would have printed a store link as its evidence. Session
   `arena-f6be9b3a` fixed it in the generator (`sourceCell`: resolves the row's own source, throws on
   an unknown one, cites 22 manufacturer pages directly); this session wrote a parallel fix and, on
   merge, **deleted it** so the register has one citation path instead of two. What survived from
   this side is the register rule behind it: `manufacturer` was cited by 22 rows while defined
   nowhere in `data/policy.json`, so the cross-reference check failed the build on main's current
   data, and the source row now exists. FLG-024 also lost its hand-typed link count — a number in the
   register that a gate could compute is a number that goes stale.

4. **`scripts/analytics-server.mjs`** — a zero-dependency self-hosted collector implementing the
   *same* contract as `_worker/collector.js` (same five events, same key allow-list, same scrubbing,
   30-day retention, `/summary` aggregates). FLG-011 ("no collector deployed") is now a hosting
   choice rather than a missing feature. The build gained `site.analyticsEndpoint`: the client is
   enabled only when the governance decision *and* an endpoint both exist, and a config pair that
   disagrees fails the build.
5. **`scripts/collect.mjs` and `scripts/next-topics.mjs`** — intake that refuses unsourced values
   (and refuses prices/ratings outright), and topic ranking that refuses to run without a real
   Search Console export. Both are exercised in CI in their empty state, so "no data yet" stays a
   clear message rather than a crash.
6. **`scripts/publish-gate.mjs`** — one command that runs all three gates, proves the build is
   reproducible by hashing the output before and after a rebuild, and prints the decision plus what
   a human still owes. No `--force` anywhere.
7. **Docs** — this file, `ARCHITECTURE.md`, a tooling section in `README.md`, and a documented
   session log in `COORDINATION.md`.

## 4. The one number that should worry the owner

**94 tagged product links are live; 0 of 5 per-product Special Link tests are recorded.**

The rule this project set — one tested link per product, in the enrolled workflow, before scaling —
was skipped, and it is recorded as an open action row (FLG-024). Nothing suggests the links are
wrong: the `/dp/<ASIN>?tag=` form is what the Program Policies describe. But attribution is
currently *asserted* rather than *observed*, and an attribution that never shows up in reporting is
also what a rejected application looks like from the inside. The remedy is fifteen minutes of
clicking, and the gate now warns until a test row is filled — and **fails** if the state goes
unrecorded, so nobody can close the flag quietly. A duplicate row this session nearly added
(FLG-026) was deleted for exactly that reason: the register should be extended, not inflated.

## 5. Open items, by owner (7 rows are `action`)

| Who | What |
| --- | --- |
| Account owner | Confirm `shopnow047c-20` exists in Associates Central for `amazon.com` and that the *registered* site URL matches this deployment (FLG-002, FLG-004) |
| Account owner | Run the five link tests, record them in `data/special_link_tests.json` (FLG-024) |
| Account owner | Verify the property in Search Console and submit `/sitemap.xml`; nobody currently knows if the site is indexed (FLG-009, SG-29) |
| Account owner + you | Deploy the collector (Worker or `scripts/analytics-server.mjs`), then set `governance.analytics.enabled` + `site.analyticsEndpoint` (FLG-011, FLG-015) |
| You | A domain you own: Amazon's review criteria include “You must own your website”, so a `github.io/WinA` sub-path is staging, not the submission (FLG-013) |
| You | Content volume: ~10 original posts are expected at review; 8 guides + 5 product pages is still thin, and the gap is a cadence, not a redesign (FLG-013) |
| You | Choose a real byline and a brand that isn't a placeholder (FLG-021), and decide whether to buy the products for photography (FLG-007) |
| You | Review the three open parallel-site pull requests (#26, #28, #2): each adds a competing root-level site, none was merged here, and merging one as-is splits the canonical host (FLG-038) |
| No one | The 20 `unverified` spec rows: wattage, dimensions and warranty for all five products are *knowable* from the listing but were not captured; `npm run collect` is the route |

## 6. What is deliberately absent, and why that is the feature

No prices and no star ratings (Policies §6(y)/§6(t)) — printed as `withheld` with the reason rather
than left blank. No Amazon product photography: every drawing on the site is original line art, drawn
here and captioned as a schematic, because Program Content needs tooling this account does not have. No seasonal pages (FLG-020: there is no seasonal demand
data, so a seasonal page would be fiction). No testing claims, no "best of", no income projection.
No signup backend (FLG-010: the form is present and inert, because storing an address is a decision
you have not made). No revenue claim of any kind, and no forecast: the ledger is empty by policy and
a row without dated first-party provenance is rejected by the gate.

## 7. If you only do three things

1. Log into Associates Central, confirm the tracking ID and the registered URL, build one tagged
   link per product, click it logged out, and check reporting tomorrow. Record the five rows.
2. Verify Search Console, submit the sitemap, and drop a CSV export into `data/exports/` after two
   weeks — then `node scripts/next-topics.mjs` tells you what to write next instead of guessing.
3. Decide the domain. Everything else scales; “owned site” is the one thing that gates getting paid.

## 8. The reader-polish pass of 2026-11-20 (session `arena-a88ebd48`)

The brief asked for a shop rather than an audit, imagery and voice that do not read as generated, and
a reviewable path before anything else is built. That pass is shipped, not recommended:

| Change | Where | What it replaces |
| --- | --- | --- |
| Original SVG schematic system — one drawing per product, selected from the verified record, plus spot drawings, a brand mark and a feature band | `_src/art.mjs`, every product card, product page and guide head | No imagery at all. Amazon listing photography is Program Content and cannot be used without API access, so the site draws its own and says so on each drawing |
| Front page restructured: products first, a three-question shopper router, a dark feature band for the lead guide, guide cards instead of a ruled list, honesty stats demoted to one line | `index.html` (generated) | An audit strip — "0 products tested", "10 policy checks passed" — sitting above the products |
| Three roadmap titles promoted to published guides: a USDA-referenced doneness check, a household capacity rule, a feature-name literacy piece | `guides/thermometer-check/`, `guides/quarts-per-household/`, `guides/hi-fry/` | Hypotheses in a table. Each is added to `sitemap.xml` and `feed.xml` in the same commit, and every stated guide count is computed and gate-checked, because a hand-typed count is a future lie |
| Buy buttons relabelled "See it on Amazon" | `_src/build.mjs` | "Check price on Amazon" printed above a page that explains it will not show prices (FLG-037 → resolved) |
| Head hygiene: `og:image` only because the file exists, a real SVG favicon, the placeholder `google-site-verification` token deleted | `assets/img/`, `_src/build.mjs` | A declared large social card with no image, and a token claiming a verification that had not happened (FLG-025 → resolved) |
| Decision support: 3 ranked paths with per-step state, the decision log's first 9 entries, 5 new questions, 4 new flags | `/suggestions/`, `/questions/`, `/flagged/` | A suggestion list with no order and an empty decision log |

**Verification re-run in this pass** (2026-11-20, via the page-fetch tool; `curl` from the sandbox
cannot reach `amazon.com` or `github.io` — HTTP 000 — which is the sandbox, not the site):

| Check | Result |
| --- | --- |
| `link.amazon/B04G1MEwY` | Lands on the amazon.com home page, **not** the recorded `/dp/B0CDY277D3` |
| `link.amazon/B0c8moW59` | Lands on the amazon.com home page, **not** the recorded `/dp/B0DHZTCNR5` |
| `link.amazon/B0f3GKalj` | Reaches `/dp/B0DZFD6R9Z` and matches the record — an earlier session saw it fail once, so it is inconsistent rather than broken |
| `amazon.com/dp/B0CDY277D3` | Live; page title matches the `title` field in `data/products.json` verbatim |
| USDA FSIS safe-temperature chart | Live, last updated 2025-04-14; the sentence quoted in the new guide is reproduced from the page |
| Gates | `node _src/build.mjs` PASSED · `scripts/check-site.mjs` passed · `scripts/compliance-gate.mjs` 1,199 assertions / 0 failing · `scripts/publish-gate.mjs` 4 / 0, and the rebuild is byte-identical |
| Not verified | How the new design *looks*. No browser runs in this environment, so the polish is structurally verified only (FLG-041) |

The two short-link failures do not move the site: every button links to a constructed
`amazon.com/dp/<observed ASIN>?tag=shopnow047c-20` and never through a supplied short link. They do move the
register, which now holds both observations against FLG-036 and asks for a logged-out browser check
(Q-25) — the only test that can tell a dead short link from a fetcher that Amazon serves differently.

**What this pass deliberately did not do.** No price widget, no deal language, no star ratings, no
scraped or AI-invented product photography, no seasonal page, no new ASINs, and no merge of the three
open duplicate-site pull requests. Each of those is recorded as a rejected or deferred row in the
decision log rather than left as an unwritten judgement.

---

*Every count above was produced by running `node scripts/compliance-gate.mjs`,
`node scripts/check-site.mjs` and `node _src/build.mjs` on this tree on 2026-11-20, and every claim
on the site traces to a row in `data/policy.json` or `data/products.json`. The site's own copy of
this summary is generated at `/summary/` from the same data, so the two cannot drift.*
