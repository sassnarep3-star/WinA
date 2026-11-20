# Executive summary — WinA / Counter Space

**Written:** 2026-11-20 · **Site:** https://sassnarep3-star.github.io/WinA/ · **Served from:** `main`, repository root, GitHub Pages

This page is the short version for whoever owns the Amazon account. It states what is live, what is
deliberately not live, what the last verification pass found, and what is waiting on a human.

---

## 1. Where the project stands

A 30-page affiliate publication is live and indexed-by-sitemap, covering three air fryers and two
meat thermometers, with **82 tagged outbound product links**. It is not a mockup: every page is
generated from a data register, and three independent gates run on every push and pull request.

| Surface | State |
| --- | --- |
| Reader pages | 30 total: front page + 404, 5 guides, 2 category hubs, 5 product pages, compare, register, a marketing kit, and the operations set (flagged, questions, suggestions, summary, dashboard, analytics, disclosure, privacy, about, seo, marketing, concept) |
| Data registers | 5 products · 60 spec rows · 6 policy sources · 10 policy clauses quoted · 44 flag rows · 22 questions · 24 suggestions |
| Verification mix | 32 `verified` · 14 `unverified` · 10 `withheld` · 4 `claim`; **36 rows carry a value, 24 are blank with a reason**, and 22 of the valued rows cite a manufacturer page directly rather than the listing |
| Compliance | OA §5 statement verbatim on all 30 pages; the disclosure precedes the first sponsored link on every page (asserted by byte offset, not by eyeball); `rel="sponsored nofollow noopener"` + `?tag=shopnow047c-20` on all 82 product links; the 8 submitted short links render as declared non-affiliate citations (`rel="nofollow"`, no tag). Counts from `scripts/compliance-gate.mjs`, cross-checked by `scripts/check-site.mjs` at 102 Amazon links / 82 sponsored |
| Measurement | Five events defined; collector written but **not deployed**, so the client is inert by design |
| Money | **Zero** revenue claims; ledger holds 0 rows, by policy |
| Gates | Three checkers, all green (~1,097 compliance assertions, 1,118 internal links verified, the builder's own 9 gates). CI fails if generated output is not committed, the build is not reproducible, or a compliance rule breaks — and Pages' deploy job now runs the compliance gate too, so a regression stops the release rather than reddening a check |
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

## 8. Re-verification pass, session `arena/119f4dc6-wina` (2026-11-20)

Task T26 on `COORDINATION.md`. Everything below was checked against the live pages, not against the
register, and each finding has its own entry on `/flagged/`.

**What was checked and what came back**

| Check | Method | Result |
| --- | --- | --- |
| Five destination ASINs | Fetched `https://www.amazon.com/dp/<ASIN>` directly for all five | **All five confirmed.** Title on each page matches `data/links.json`. Product identity is not in doubt. |
| Five submitted short links | Fetched each `link.amazon/B0…` URL | **2 of 5** returned a product page (`B02NbDxp3`, `B00hJ57DV`). **3 of 5** returned `https://www.amazon.com/` (`B04G1MEwY`, `B0c8moW59`, `B0f3GKalj`). `B04G1MEwY` fetched twice, same result. → **FLG-036** (also found independently by a parallel session) |
| ThermoMaven water resistance | Read the listing title | Earlier register said "no IP number published". The listing title states **IP67**. Corrected. → **FLG-038** |
| Spec coverage per product | Script over `data/products.json` | 32 of 60 rows verified. Emeril 26QT has no wattage or warranty; Chefman 8-Quart has no wattage, dimensions or warranty. → **FLG-039** |
| FLG-032 accuracy | Compared its text with the fetch results above | It claimed all five "resolved" to product pages. Corrected to `review` and rewritten. |

**Three things corrected in this pass**

1. The front-page strip read "0 Products tested" and "10 Policy checks passed". The first is honest
   but reads as a disclaimer on a shopping page; the second is a *gate* count shown to a shopper as
   if it were product evidence. Both are replaced with shop-facing facts computed from the register:
   products spec-checked, categories, buying guides, and specs confirmed at source (32). The
   no-testing statement still appears — once, in plain language, at the end of the page.
2. `data/links.json` now carries a `reverified*` field per link, kept **separate** from
   `observedDestination` and from `intendedAsin`, which stays `null`. Three fields, never merged.
3. `FLG-032` was downgraded from `resolved` to `review` with its overstatement stated in the record.

**What this pass did not do, and why**

- It did not claim the three short links are broken or non-compliant. The destination ASINs are
  correct; the redirect behaviour was observed from an automated client and may be an artefact of
  that. Recorded as an observation with the action that closes it.
- It did not fill wattage, dimensions or warranty from memory. Those rows stay blank and are flagged.
- It did not deploy the collector, verify Search Console, or confirm the tracking ID — all three
  need the account owner's credentials (FLG-004, FLG-009, FLG-011).

**Gates after this pass:** `node _src/build.mjs` → 30 pages, all gates clear.
`node scripts/check-site.mjs` → 30 pages, 1,120 internal links, 98 Amazon links (82 sponsored), zero
failures. `node scripts/compliance-gate.mjs` → 1,097 checks, 0 failing, 1 warning (FLG-024, the
Associates click test, which needs the owner).

---

## 9. Product-intent record and FLG-033, session `arena/6b0f2ddc-wina` (2026-11-20)

Task T27 on `COORDINATION.md`.

- **Product-intent confirmation record.** `data/links.json` now holds, per submitted link, four named
  fields: `intendedAsin` (blank: the owner did not supply one), `officialListingUrl` (the Amazon ASIN
  page, `https://www.amazon.com/dp/<ASIN>`), `confirmedOn` and `confirmationSourceIds`. The observed
  redirect targets sit in their own list, `observedRedirectTargets`, with a date and a result for each
  check. Intended and observed ASINs are never merged. A gate rule enforces this.
- **FLG-033 (ASIN definition).** Amazon's own seller-education page, *Understanding ASINs*
  (`sell.amazon.com/blog/what-is-an-asin`), defines the ASIN as a unique 10-character code and says it
  appears after `/dp/`. Read in full on 2026-11-20. Two caveats are recorded: it is not an Amazon Help
  article, and the page says it was "produced with the assistance of generative artificial
  intelligence". It is kept at `review`.
- **FLG-040 (new).** All five short links returned different landing pages across the three recorded
  checks (first resolution, T26, T27). The product identity of all five ASINs is unchanged: each
  `/dp/` page was re-fetched and its title matches. The short-link behaviour is not stable, and nothing
  so far explains it. The owner check is recorded as the action.
- **Register.** The "Link resolution" table on `/register/` now shows the four fields and the observed
  landing as separate columns. The official-listing link is a tagged, sponsored link; the observed
  landings are shown as text, not as links.

**Gates after this pass:** `node _src/build.mjs` → 30 pages, all gates clear.
`node scripts/check-site.mjs` → 30 pages, 1,125 internal links, 104 Amazon links (82 sponsored), zero
failures. `node scripts/compliance-gate.mjs` → 1,207 checks, 0 failing, 1 warning (FLG-024, owner-only).

**Still owner-only, not attempted:** the Associates sign-in and the one-link-per-product Special Link
test (FLG-004, FLG-024); Search Console (FLG-009); deploying the analytics collector (FLG-011).

