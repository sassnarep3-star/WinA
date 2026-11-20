# Executive summary

**Prepared:** 2026-11-20 · **Branch:** `arena/41096d21-wina` · **Tracking ID:** `shopnow047c-20`

---

## 1. What was built

A live, static publication at **https://sassnarep3-star.github.io/WinA/** covering five Amazon
products across two categories, plus the registers that make every claim on it checkable.

**23 pages: 1 front page, 2 category pages, 5 product pages, 4 guides, a compare table, and
10 register pages** (source register, open questions, suggestions, flagged for review, campaign
ledger, event schema, disclosure, method, guide index, 404).

Nothing on the site is invented. Every specification carries a link to the page it came from.
Where a page could not be confirmed, it says **Not confirmed** rather than filling the gap.

---

## 2. The five products, as resolved

All five supplied `link.amazon` short links were followed and resolved to these listings:

| # | Supplied link | ASIN | Product | Amazon rating (observed 2026-11-20) |
|---|---|---|---|---|
| 1 | `link.amazon/B04G1MEwY` | B0CDY277D3 | CHEFMAN 6-Quart Dual Basket Air Fryer | 4.2 from 4,876 |
| 2 | `link.amazon/B02NbDxp3` | B09B7SB46R | Emeril Lagasse 26QT French Door Air Fryer Oven | 4.3 from 18,379 |
| 3 | `link.amazon/B00hJ57DV` | B08DKYBTPH | Chefman TurboFry 8-Quart Air Fryer | 4.4 from 16,892 |
| 4 | `link.amazon/B0c8moW59` | B0DHZTCNR5 | ThermoMaven 1-Sec Instant-Read Thermometer | 4.6 from 3,499 |
| 5 | `link.amazon/B0f3GKalj` | B0DZFD6R9Z | CHEF IQ Sense Gen3 Wireless Thermometer | 4.2 from 2,178 |

Every one of the five is a **correct, live listing**. The ASINs match the products.

---

## 3. The three things that should decide your next move

### ① Confirm the tag — everything else is downstream of this

The short links resolve to the right products, but **none of the landing URLs contains a
`tag=` parameter.** They carry Amazon's own page-share token (`btn_ref=srctok-…`) instead.

This is not a claim that the links are broken or non-compliant. It is an observation, and its
consequence is unavoidable: **we cannot confirm from outside the account that any click earns
a commission.**

- Cost to settle: **one click, then one look at the Associates click report 48 hours later.**
- Alternative: regenerate the five links with a visible `tag=shopnow047c-20`.

This is item one of twelve on the suggestions page because if it comes back negative, nothing
else on the site matters. → `FLG-003`, `Q02`, `Q03`, `SG-01`

### ② Analytics has no home yet

"A self-hosted analytics endpoint" was specified. **GitHub Pages cannot execute server code.**
The five-event measurement layer is written, tested and shipped — but switched off, because
pointing it at nothing is worse than pointing it at nothing on purpose.

- Three viable homes, with costs, are laid out in `SG-02`.
- Until one is chosen, the campaign ledger stays empty and topic selection stays instinct-driven.
- The ledger is nevertheless **structurally complete**: schema, definitions and provenance rules
  are fixed, so the first real report can be dropped straight in. → `FLG-006`, `Q09`

### ③ Nobody has held these products

No page on the site says "we tested", and none may. That single fact sets the honest ceiling on
the editorial voice: this is a **documented comparison**, not a review.

It also creates the clearest opportunity. One genuinely owned unit would unlock real first-hand
copy for one product — worth more than five speculative pages, and the only lawful route to
writing "we used this." → `Q10`, `SG-07`

---

## 4. Compliance position

The site is built against eight quoted, sourced rules and enforced by an automated gate.

| Rule | Source | Enforced by |
|---|---|---|
| The exact Associates statement must appear prominently | Operating Agreement §5 (2025-10-15) | Disclosure strip under the masthead on **every** page + repeated in every footer |
| Only tagged Special Links are paid | Program Policies §2(b) (2026-04-14) | All 147 Amazon links logged in the register; tag status flagged |
| Price may only be shown when Amazon supplies it | Program Policies §2(b) | **Zero price literals** anywhere — machine-checked |
| No inaccurate or misleading claims | Program Policies §2(b) | Every spec row carries a source or says "Not confirmed" |
| Content must be original | Participation Requirements §1 | All copy written for this site; no third-party imagery used |
| No affiliate links back on Amazon or in feeds | Program Policies §2(b) | Feed contains zero affiliate links — machine-checked |
| Material connection must be disclosed | 16 CFR Part 255 §255.5 (current 2026-11-18) | Disclosure above the fold + `rel="sponsored"` on every buyable link |
| Endorsements must be honest | 16 CFR Part 255 §255.1, §255.2(d) | No invented ratings, quotes or experience claims |

**The gate:** `scripts/verify.mjs` runs 15 checks on every push and **fails the deploy** if any
regresses — disclosure placement, sponsored marking, price literals, canonical host, sitemap
parity, broken links, deploy base path, per-row sourcing, feed validity, third-party assets.

Current state: **all 15 pass.** The site cannot be published in a non-compliant state without
someone deliberately deleting a check.

---

## 5. Ten items flagged for review

Published at `/flags/` with source links so they can be reviewed after launch. None blocked the
deploy.

| Flag | Finding |
|---|---|
| FLG-001 | No prices shown — deliberate, required by §2(b) |
| FLG-002 | `shopnow047c-20` enrollment **unverified** |
| FLG-003 | Short links expose no `tag=` — attribution unresolved |
| FLG-004 | Emeril listing contradicts itself: 24 presets vs 25 presets; 26 qt vs 24.6 L |
| FLG-005 | Chefman 8-qt wattage: page says 1000 W, third parties say 1700 W — left blank |
| FLG-006 | No analytics endpoint; Pages cannot host one |
| FLG-007 | Chefman 6-qt: "6 quart" in title, "6 liters" in spec table |
| FLG-008 | Emeril listing sold under "Innovation IQ", not "Emeril" |
| FLG-009 | Ratings are point-in-time, stamped, never presented as live |
| FLG-010 | No traffic, conversion or revenue data exists — all figures empty by design |

---

## 6. Twenty-four open questions

At `/questions/`, each with what we know, what is missing, why it blocks, and the cheapest route
to an answer. **Nine block a decision outright.** The four that matter most:

1. **Q01 — Is the account enrolled and in good standing?** Not publicly observable. Highest-value unknown.
2. **Q02/Q03 — Do the links actually credit the tag?** One click settles it.
3. **Q09 — Where does analytics live?** Static hosting cannot run an endpoint.
4. **Q10 — Has anyone held these products?** No. This sets the voice's honest ceiling.

The remaining fifteen are context: domain choice, API access, refresh cadence, primary reader,
event schema sign-off, ledger definitions, privacy policy, review cadence.

---

## 7. Twelve suggestions, none implemented

At `/suggestions/`, ordered by **what to decide first**, not what to build first. Each carries
its evidence, its options, the cost of each option, and a recommendation. Nothing there has been
built — that page exists precisely so you choose a path before work happens.

| # | Proposal | Recommended path |
|---|---|---|
| SG-01 | Confirm the tag | Test one link, then regenerate all with visible tag |
| SG-02 | Choose the analytics home | Cloudflare Worker (self-hosted) or hosted provider |
| SG-03 | Move to a real domain | Yes — one config value plus a CNAME |
| SG-04 | Apply for PA/Creators API | Yes — the only compliant route to prices and images |
| SG-05 | Front page leads with one pick | Yes — publications recommend, catalogues list |
| SG-06 | Published cadence | One guide per week for eight weeks |
| SG-07 | Answer the testing question | Buy one unit, document it honestly |
| SG-08 | Data refresh interval | 30 days, one owner |
| SG-09 | Visual identity | API imagery once approved; typographic until then |
| SG-10 | Search Console | Day one of the domain |
| SG-11 | Reader capture | RSS now, email once a privacy policy exists |
| SG-12 | Close the flags weekly | 15 minutes a week |

---

## 8. What the site deliberately does not do

- **No prices.** Policy, not oversight. Explained on-page wherever a reader would expect one.
- **No invented reviews, quotes or star ratings.** Only Amazon's own figures, dated.
- **No "we tested" claims.** Nothing has been tested.
- **No conversion score or revenue forecast.** Both would require inventing numbers.
- **No third-party assets.** No web fonts, no stock photos, no tracking scripts. Zero external requests.
- **No personal data.** No cookies, no storage, honouring DNT and GPC, analytics off.

---

## 9. Deliverables

| Deliverable | Location |
|---|---|
| Live site | https://sassnarep3-star.github.io/WinA/ |
| Source | `data/` (8 registers), `content/guides.json`, `scripts/`, `assets/` |
| Build gate | `scripts/verify.mjs` — 15 checks, blocks deploy |
| CI/CD | `.github/workflows/pages.yml` — build → verify → deploy |
| Coordination record | `COORDINATION.md` — tasks, verification, sources, PR/deploy record |
| This summary | `EXECUTIVE-SUMMARY.md` |

---

## 10. If you only do one thing

**Click one product link from your phone, wait 48 hours, and check the Associates click report.**

Everything else on this page is an opinion until that number appears. If it appears, the site
is a working asset and the suggestions page becomes a growth plan. If it does not, you have
found the problem for the price of one click — which is the entire argument for putting that
test ahead of the other eleven proposals.
