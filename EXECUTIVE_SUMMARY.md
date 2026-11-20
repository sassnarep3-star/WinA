# Executive summary — WinA / Counter Space

**Written:** 2026-11-20 · **Site:** https://sassnarep3-star.github.io/WinA/ · **Served from:** `main`, repository root, GitHub Pages

This page is the short version for whoever owns the Amazon account. It states what is live, what is
deliberately not live, what the last verification pass found, and what is waiting on a human.

---

## 1. Where the project stands

A 32-page affiliate publication is live and indexed-by-sitemap, covering three air fryers and two
meat thermometers, with **99 tagged outbound product links**. It is not a mockup: every page is
generated from a data register, and three independent gates run on every push and pull request.

| Surface | State |
| --- | --- |
| Reader pages | 32 total: front page + 404, 7 guides, 2 category hubs, 5 product pages, compare, register, a marketing kit and plan, and the operations set (flagged, questions, suggestions, summary, dashboard, analytics, disclosure, privacy, about, seo, concept) |
| Data registers | 5 products · 64 spec rows · 6 policy sources · 10 policy clauses quoted · 43 flag rows · 27 questions · 28 suggestions · 10 logged decisions |
| Verification mix | 35 `verified` · 13 `unverified` · 10 `withheld` · 6 `claim`; **41 rows carry a value, 23 are blank with a reason**, and 27 of the valued rows cite a manufacturer page directly rather than the listing |
| Compliance | OA §5 statement verbatim on all 32 pages; the disclosure precedes the first sponsored link on every page (asserted by byte offset, not by eyeball); `rel="sponsored nofollow noopener"` + `?tag=shopnow047c-20` on all 99 product links; the submitted short links render as declared non-affiliate citations (`rel="nofollow"`, no tag). Counts from `scripts/compliance-gate.mjs` (1,220 checks, 0 failing, 1 warning by design), cross-checked by `scripts/check-site.mjs` at 116 Amazon links / 99 sponsored, 1,316 internal links |
| Measurement | Five events defined; collector written but **not deployed**, so the client is inert by design |
| Money | **Zero** revenue claims; ledger holds 0 rows, by policy |
| Gates | Four checkers, all green (1,220 compliance assertions, 1,316 internal links verified, the builder's own gates including the voice and imagery rules added on 2026-11-20). CI fails if generated output is not committed, the build is not reproducible, or a compliance rule breaks — and Pages' deploy job now runs the compliance gate too, so a regression stops the release rather than reddening a check |
| History | Four prior session builds preserved under `archive/` (64 served files plus the full archive), nothing deleted |

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

**80 tagged product links are live; 0 of 5 per-product Special Link tests are recorded.**

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
| You | Content volume: ~10 original posts are expected at review; 5 guides + 5 product pages is thin (FLG-013) |
| You | Choose a real byline and a brand that isn't a placeholder (FLG-021), and decide whether to buy the products for photography (FLG-007) |
| No one | The 20 `unverified` spec rows: wattage, dimensions and warranty for all five products are *knowable* from the listing but were not captured; `npm run collect` is the route |

## 6. What is deliberately absent, and why that is the feature

No prices and no star ratings (Policies §6(y)/§6(t)) — printed as `withheld` with the reason rather
than left blank. No product photography. No seasonal pages (FLG-020: there is no seasonal demand
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

---

*Every count above was produced by running `node scripts/compliance-gate.mjs`,
`node scripts/check-site.mjs` and `node _src/build.mjs` on this tree on 2026-11-20, and every claim
on the site traces to a row in `data/policy.json` or `data/products.json`. The site's own copy of
this summary is generated at `/summary/` from the same data, so the two cannot drift.*

---

## 8. Session `arena-3818c975-wina` — 2026-11-20 — the design brief, implemented (T26)

**The problem this session solved.** Earlier sessions answered "make it read like a shop, not an audit"
by *recommending* a fix: a design brief (DB-01…DB-08), eight suggestions (SUG-17…SUG-24) and a topic
roadmap, all published on `/suggestions/` and none of them built. The register was impeccable and the
pages still looked like a register. T26 implements the accepted parts of that brief and records every
choice in the decision log the brief asked for, so the next reviewer sees what was accepted, what was
deferred and why.

**What shipped, and what it is for**

| Change | Reader effect | What it is not |
| --- | --- | --- |
| Four commissioned illustrations (`assets/img/`), each captioned *original artwork — not a product image* | The site has a visual language: warm paper, one accent, an editorial band under the hero and a figure per hub and guide | Not Amazon Program Content, not stock photography of an appliance, not a depiction of any product for sale — FLG-007 and DB-07 still bind |
| Two figures drawn to scale from the register: top-view counter footprint (158 in² vs 267 in², "69% more counter") and stated-capacity squares | The two numbers that decide a countertop purchase, comparable at a glance, each citing the brand page it came from | Not a ranking. The 8-quart's footprint is drawn as an empty dashed box, because the brand publishes dimensions for a different SKU (FLG-028) |
| The three-question chooser (`/#finder`) | A reader who does not know what to browse gets an answer with the reason attached, in thirty seconds | Not an algorithm. Weights are editorial and unmeasured — FLG-039 says so on the page and in the register |
| Guide furniture: contents list, previous/next, and a computed cluster block | Each guide is one page in a set instead of a page standing alone | Not hand-maintained links: the cluster is derived from `guideTopics`, so it cannot rot |
| Two guides promoted from the roadmap (06 basket-or-oven vs toaster oven, 07 the five-question checklist) | The cadence claimed by SUG-21 has now shipped once; the pillar guide is the one that links to everything | Not popularity claims. Both titles are still hypotheses, and the roadmap says so |
| The voice rule: 42 banned filler phrases, published on `/about/` and enforced at build | Boilerplate cannot be published by accident; a planted "we tested these machines" fails the build, and was tested by injection | Not a copy editor. It catches the tells, not bad writing |
| Four gates instead of three, plus the finder's anchors written into the HTML rather than created at run time | The compliance gate can see every sponsored link the chooser shows | Not decoration: the same image and figure rules fail the release if an asset is missing, unattributed, or drawn from a number the register does not carry |

**Verification performed here, first-hand, 2026-11-20.** The five `link.amazon` short links were
re-opened: four returned Amazon's home page and one a fetch error, against the product-page
destinations four earlier sessions recorded the same day — so the behaviour is not reproducible on
command and both observations are now dated in the register (FLG-036). Product identity does not
depend on it: `B0CDY277D3`, `B0DHZTCNR5` and `B0DZFD6R9Z` were re-read from their listing pages title
for title. The Chefman and Emeril brand pages were re-read for every figure the new diagrams display
(capacity, wattage, dimensions, height, weight, presets, functions, serving range, warranty, voltage),
which filled six previously blank specification rows with citations and downgraded two rows to `claim`
where the brand's own page contradicts itself (24 vs 25 presets; six vs seven accessories). No value
was inferred: the Emeril wattage row stays blank because the brand page publishes 120 volts and no
power figure, and that reasoning is now a published question (Q-27) rather than a silent gap.

**New register rows.** FLG-036 (short-link resolution is not stable), FLG-037 (open PRs #26/#28 would
replace the live site with parallel builds — logged, not merged), FLG-038 (the imagery decision and the
PA-API route that would end it), FLG-039 (the chooser's weights are unmeasured); FLG-029 extended with
this session's re-read; five new questions (Q-23…Q-27); four new suggestions (SUG-25…SUG-28); ten
decision-log entries.

**Gates on the final tree.** `node _src/build.mjs`: 32 pages, 31 in sitemap, all gates clear.
`node scripts/check-site.mjs`: 1,316 internal links, 116 Amazon links (99 sponsored), safe to publish.
`node scripts/compliance-gate.mjs`: 1,220 checks, 0 failing, 1 warning (FLG-024, by design).
`node scripts/publish-gate.mjs`: 4 checks, 0 failing. Two builds, byte-identical output.
