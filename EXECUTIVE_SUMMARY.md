# Executive summary — WinA / The Preheat

**Written:** 2026-11-20 · **Site:** https://sassnarep3-star.github.io/WinA/ ·
**State:** reader-facing publication shipped; monetization built, specified, and deliberately locked.

---

## 1. The one-sentence version

A checkable affiliate publication now exists, and the single answer that turns it into a business is
the ten missing characters in the five product identifiers supplied for it.

## 2. What arrived in this branch

| Surface | State |
| --- | --- |
| Reader site | 39 generated pages: front page, 6 buyer guides, 4 sections, 6 seasonal clusters, the shelf, 5 register records, 2 calculators, printable comparison sheets, in-browser search, RSS, sitemap |
| Compliance machinery | `tools/compliance-gate.mjs` + `tools/validate-links.mjs` + `tools/validate-data.mjs` — **2,843 automated checks** pass on the current build; CI runs them on every push and pull request |
| Data registers | 20 official sources with verbatim quotations and retrieval dates; 5 intake records; 5 intent records; 16 flags; 40 suggestions in 3 paths; 14 open questions; 1 empty-but-defined campaign ledger |
| Automation | `collect.mjs` (folds verified listing data in, refuses to guess), `next-topics.mjs` (ranks topics only from a real Search Console export), `analytics-server.mjs` (five events, privacy-preserving, tested locally), `publish-gate.mjs` (computes the publish decision; no `--force` for the link gate) |
| Disclosure | The Operating Agreement's exact sentence, under the masthead on **every** page and again in the footer, verified for presence *and* order before any product control |

## 3. The blocking finding, stated precisely

`B04G1MEwY`, `B02NbDxp3`, `B00hJ57DV`, `B0c8moW59`, `B0f3GKalj` — **each is 9 characters.**
Amazon: “ASIN … a unique **10-character** alphanumeric code”, read from
[sell.amazon.com/blog/what-is-an-asin](https://sell.amazon.com/blog/what-is-an-asin). The host
supplied with them, `link.amazon`, is not an Amazon product host, and no Associates tag appears
in the URLs — the tag must appear *as a parameter in the link*
([Program Policies §2(a)](https://affiliate-program.amazon.com/help/operating/policies)).

Consequences, in order of importance:

1. **No listing was identified.** Not “invalid” — *unidentified*. Where the supplied short links
   go was not observed from this environment, so the register records “not observed” and leaves the
   redirect field empty rather than inferring a destination.
2. **Nothing product-shaped was written.** 45 register fields across the five records are blank by
   policy: no titles, brands, categories, prices, ratings, availability, commission categories or
   listing URLs. No tenth character was guessed; that would have manufactured plausible errors and
   attached them to marketing copy.
3. **No monetized link ships.** Every product control renders locked with the reason printed. The
   gate fails any build that emits an untagged or malformed Amazon link.

## 4. Compliance posture — enforced by code, not by intention

| Requirement | Source | How it is held |
| --- | --- | --- |
| Exact Associate statement, clear and prominent | [OA §5](https://affiliate-program.amazon.com/help/operating/agreement) | Emitted by the layout for every page; gate asserts presence and footer repeat |
| Disclosure precedes the action it describes | [FTC Endorsement Guides](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking) | Gate compares the byte offset of the strip against the first product link |
| Tagged Special Links only | [OA §1](https://affiliate-program.amazon.com/help/operating/agreement) | `validate-links.mjs`: tag param must equal the configured ID before a product href may exist |
| No per-user sub-tagging | [Program Policies §2(b)](https://affiliate-program.amazon.com/help/operating/policies) | Endpoint stores day-bucketed aggregates only; no cookie, no identifier, no join |
| No incentive to click, no bookmark prompts, links accessed directly | Program Policies | Banned patterns + no wrapper/interstitial pages anywhere in the build |
| No implied Amazon endorsement | OA §5 | Phrase ban; citations to Amazon policy pages carry **no** tag, so a reference never looks like a referral |
| Honest opinions, no results presented as typical | FTC | No first-person experience claims, no star ratings, no prices — asserted by pattern checks |
| `rel="sponsored"` on paid links | [Google](https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify) | Every outbound product link qualified; gate fails otherwise |
| Customer contacts go to Amazon | OA §3 | The contact page states it and routes there |

Two register rows are quoted from a readable **locale copy** (Amazon.in) rather than the US text and
are labelled as such; they inform lint rules and are never printed to readers. Re-read the US text
before any legal sign-off — see `FLG-012` on the Flagged page.

## 5. Editorial posture

Six guides, each opening on the buyer's question and closing with what was *not* checked. The four
topics proposed in the brief are published as working titles and labelled on-page as hypotheses —
no popularity, volume or trend claim appears anywhere, because no query data exists yet.
Capacity is treated as inner dimensions rather than quarts; cleanup as a weekly habit rather than a
coating; multi-function as arithmetic rather than a preset count; and one guide answers the only
question in the cluster that can be answered from an official source — USDA FSIS minimum internal
temperatures ([chart](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart)),
which is the sole numeric table on the site.

Authorship is a desk byline with an explicit “AI-drafted, human-edited, nothing tested” note;
imagery is labelled illustration. Both are one decision from being better: a named consenting editor
(Q-07) and your own photographs (Q-12) are the highest-trust upgrades available and need no code.

## 6. Measurement posture

Five events defined and implemented (`page_view`, `product_card_impression`, `outbound_click`,
`gate_block`, `newsletter_signup`). The reference endpoint runs locally and was exercised: accepts
defined events, rejects unknown ones, returns 410 for routes the register has not approved, and
serves an aggregate summary.

The correction the brief needed: **conversion is not measurable on this site.** Orders happen at
Amazon; the only authorized source for what followed a click is Associates reporting. So the ledger
may be filled only from that and from a Search Console export, a row without provenance is rejected
by the validator, and derived metrics print a dash while any input is null.

Not live: GitHub Pages cannot run a server, so `measurement.endpoint` is empty and the site counts
nothing — and no page claims otherwise (`FLG-006`, `Q-09`).

## 7. Money

There is no revenue forecast in this project, in either direction. A projection assembled without a
listing corpus, without query data, and without one measured click would be fiction in a table.
The ledger is empty and that is the accurate state; `FLG-007` records the choice so nobody later
mistakes it for a missing feature.

## 8. Risk register (top 6)

| Risk | Now | Mitigation |
| --- | --- | --- |
| Rejection for a site the applicant does not own (“You must own your website”) | live | Publish to a domain you own before submitting; Pages URL treated as staging (`SG-26`, `FLG-013`) |
| Shipping a 404 to buyers via a malformed ID | blocked by design | Links locked; validator fails malformed Amazon hrefs |
| Reading as an AI review farm | partly inherent | Byline honesty, per-page limits box, no ratings/prices/superlatives — all gate-enforced |
| Quoted policy going stale | medium | Register carries read + revision dates; validators warn past 90 days |
| Optimising a metric nobody measured | medium | Provenance-required ledger; dash instead of a derived number |
| Effort spent on an unconfirmed niche | medium | Sections carry transferable frameworks; product filing explicitly pending (`FLG-004`) |

## 9. Next 14 days

1. Answer **Q-01** (real ASINs), **Q-02** (tracking ID + registered site), **Q-03** (account state). One login, one copy-paste.
2. `node tools/collect.mjs` on the first pasted listing → confirm the register fills with zero inferred fields.
3. Build **one** tagged link per product in Associates Central; click it logged out; confirm the destination; confirm the click in reporting the next day.
4. Only then set `affiliate.linksEnabled = true`; the gate will not let anything through that the register has not verified.
5. Verify the property in Search Console; submit `/sitemap.xml`; start the cadence clock.

## 10. What is needed from the owner

Six asks, none technical, all listed with where the answer lives on
[/decision-brief/](https://sassnarep3-star.github.io/WinA/decision-brief/): the five real ASINs;
tracking-ID and site confirmation; account state; a host decision for the endpoint; a named editor
or an explicit no; and whether you will buy the products for first-hand photos.

Choose a path on [/suggestions/](https://sassnarep3-star.github.io/WinA/suggestions/) — A
“look like a shop”, B “unlock the money”, C “compound the traffic” — each with exit criteria. The
board is a menu, not a plan (`FLG-008`): 34 of 40 suggestions are already shipped by this build, and
the six that are not are waiting on a human decision, not on engineering.

---

*Every date, count and quotation in this summary is generated from `data/` at build time for the
site's own copy of this page (`/executive-summary/`), so the two cannot drift. If a number here is
wrong, the row that produced it is one click away on the dashboard.*
