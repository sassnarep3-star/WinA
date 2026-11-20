# Executive summary — WinA / Counter Space

**Written:** 2026-11-20 · **Site:** https://sassnarep3-star.github.io/WinA/ · **Served from:** `main`, repository root, GitHub Pages

This page is the short version for whoever owns the Amazon account. It states what is live, what is
deliberately not live, what the last verification pass found, and what is waiting on a human.

---

## 1. Where the project stands

A 29-page affiliate publication is live and indexed-by-sitemap, covering three air fryers and two
meat thermometers, with **112 tagged outbound product links**. It is not a mockup: every page is
generated from a data register, and three independent gates run on every push and pull request.

| Surface | State |
| --- | --- |
| Reader pages | 29 total: front page + 404, 5 guides, 2 category hubs, 5 product pages, compare, register, and 10 operations pages (flagged, questions, suggestions, summary, dashboard, analytics, disclosure, privacy, about, seo/marketing/concept) |
| Data registers | 5 products · 60 spec rows · 5 policy sources · 10 policy clauses quoted · 29 flag rows · 22 questions · 16 suggestions |
| Verification mix | 22 rows `verified` · 8 `claim` · 20 `unverified` · 10 `withheld`; **30 rows carry a value, 30 are blank with a reason** |
| Compliance | OA §5 statement verbatim on all 29 pages, disclosure before the first sponsored link on every page, `rel="sponsored nofollow noopener"` + `?tag=shopnow047c-20` on all 112 product links, and the 8 submitted short links rendered as declared non-affiliate citations (`rel="nofollow"`, no tag) — counts from `scripts/compliance-gate.mjs`, cross-checked against `scripts/check-site.mjs` at 124 Amazon links / 112 sponsored |
| Measurement | Five events defined; collector written but **not deployed**, so the client is inert by design |
| Money | **Zero** revenue claims; ledger holds 0 rows, by policy |
| Gates | ~2,100 assertions across three checkers, all green; CI also fails if generated output is not committed |
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
3. **A latent misattribution bug, fixed in the generator** — `/register/` built its “Source” column
   by always emitting a tagged `amazon.com/dp/<ASIN>` link whenever a row had *any* source. Today
   every valued row happens to cite `amazon-listing`, so the fix changes no output (verified:
   byte-identical HTML), but the first row citing a manual or a USDA table would have been
   presented with a store link as its evidence, and every verification click would have carried a
   tag. Citations now resolve through `policy.json`, and only the listing source may be tagged.
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

**112 tagged product links are live; 0 of 5 per-product Special Link tests are recorded.**

The rule this project set — one tested link per product, in the enrolled workflow, before scaling —
was skipped, and it is recorded as an open action row (FLG-024). Nothing suggests the links are
wrong: the `/dp/<ASIN>?tag=` form is what the Program Policies describe. But attribution is
currently *asserted* rather than *observed*, and an attribution that never shows up in reporting is
also what a rejected application looks like from the inside. The remedy is fifteen minutes of
clicking, and the gate now warns until a test row is filled — and **fails** if the state goes
unrecorded, so nobody can close the flag quietly. A duplicate row this session nearly added
(FLG-026) was deleted for exactly that reason: the register should be extended, not inflated.

## 5. Open items, by owner (8 rows are `action`)

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
