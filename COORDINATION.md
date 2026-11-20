# WinA — Coordination Board

Shared task board for parallel agent sessions working on this repo.
Current branch: `arena/6bd1be15-wina` (branched from `48af6e0` on `main`, PR #1 merge).

## Session claims

| Session ID | Task | Status | Files touched | Started | Sources / verification |
|---|---|---|---|---|---|
| arena-4a5044b0-wina | Coordination board + repo review | done | COORDINATION.md | 2026-11-20 | repo state (empty) — merged via PR #1 |
| arena-4a5044b0-wina | Shared site assets (CSS, JS, click-tracker, analytics) | done | assets/css/style.css, assets/js/app.js, assets/js/click-tracker.js | 2026-11-20 | n/a (frontend) — merged via PR #1 |
| arena-4a5044b0-wina | Landing page (publication front page, product-led) | done | index.html | 2026-11-20 | n/a — merged via PR #1 |
| arena-4a5044b0-wina | Products page (table + verification + source links) | done | products.html | 2026-11-20 | Amazon blocked at the time — superseded by arena-6bd1be15 verification below |
| arena-4a5044b0-wina | Buying guides (question-shaped) | done | guides.html | 2026-11-20 | n/a — merged via PR #1 |
| arena-4a5044b0-wina | Suggestions section (review-before-implement) | done | suggest.html | 2026-11-20 | n/a — merged via PR #1 |
| arena-4a5044b0-wina | Pre-decision Q&A (missing-information discovery) | done | questions.html | 2026-11-20 | n/a — merged via PR #1 |
| arena-4a5044b0-wina | Executive summary | done | executive-summary.html | 2026-11-20 | n/a — merged via PR #1 |
| arena-4a5044b0-wina | Flagged for Review page | done | flagged.html | 2026-11-20 | n/a — merged via PR #1 |
| arena-4a5044b0-wina | SEO: sitemap.xml + RSS feed.xml | done | sitemap.xml, feed.xml | 2026-11-20 | n/a — merged via PR #1 |
| arena-4a5044b0-wina | GitHub Pages enable + PR + merge | done | .nojekyll, repo settings | 2026-11-20 | GitHub Pages live at https://sassnarep3-star.github.io/WinA/ (status: built) |
| arena-6bd1be15-wina | Product verification (all 5 links vs official Amazon listings) | done | products.html, flagged.html, COORDINATION.md | 2026-11-20 | Amazon.com listing pages via fetch (see Verification log) |
| arena-6bd1be15-wina | Publication polish: landing as shop front page + categories + guides + SEO | done | index.html, products.html, guides.html, suggest.html, questions.html, executive-summary.html, flagged.html, assets/css/style.css, assets/js/app.js, sitemap.xml, feed.xml, robots.txt | 2026-11-20 | Amazon listings + Associates Policies (2026-04-14) + FTC Endorsement Guides |
| arena-6bd1be15-wina | Final integration: build check, link check, PR to main + merge + Pages confirm | in progress | COORDINATION.md, .github/ if needed | — | GitHub |

## Rules for this board
- Claim a task by writing your session ID + file scope, then commit and push that claim immediately.
- Never start a task another session has claimed.
- Keep scopes non-overlapping; each session works on its own branch/worktree named `session-<id>/<task>`.
- If a task requires changing a file owned by another session, log the request here instead of editing it.
- Make small, frequent commits; run `git pull --rebase` before every push.
- On merge conflict: stop, resolve without discarding the other session's work, log what happened.
- When a task is finished, record its sources, the verification performed, and any irregularities here, then mark it `done`.
- `needs review` means the item is published on the Flagged for Review page and does not block anything.
- A claim older than 60 minutes with no commits may be taken over by another session (note the handoff).
- Shared outputs (table data, index, navigation) are changed only by the final integration session once all other tasks are done.

## Verification log — arena-6bd1be15-wina (2026-11-20)

All five submitted short links were resolved live against official Amazon.com listing pages
(`https://www.amazon.com/dp/<ASIN>`). Titles, breadcrumbs (browse nodes), spec tables, and
"About this item" bullets below were read from those pages on 2026-11-20. Prices and star
ratings were observed on the same date but are **intentionally not published** on the site
(see Compliance decisions). Every product row on `products.html` links to its official listing
for manual review.

| # | Submitted short link | Observed redirect target (separate field) | Intended ASIN | Official listing (title, abridged) | Category (breadcrumb leaf) | Source |
|---|---|---|---|---|---|---|
| 1 | https://link.amazon/B04G1MEwY | https://www.amazon.com/dp/B0CDY277D3 | B0CDY277D3 | CHEFMAN 6 Quart Dual Basket Air Fryer Oven with Easy View Windows, Sync Finish, Hi-Fry, Auto Shutoff, 2 Independent 3Qt Nonstick Dishwasher Safe Frying Baskets, Digital Double Air Fryer - Black | Air Fryers (17659096011) | https://www.amazon.com/dp/B0CDY277D3 |
| 2 | https://link.amazon/B02NbDxp3 | https://www.amazon.com/dp/B09B7SB46R | B09B7SB46R | Emeril Lagasse 26QT French Door Multi-Function Air Fryer Toaster Oven \| Countertop Convection Cooker, 24 One-Touch Preset Options, Extra Large Interior, Six Cooking Accessories Included | Air Fryers (17659096011) | https://www.amazon.com/dp/B09B7SB46R |
| 3 | https://link.amazon/B00hJ57DV | https://www.amazon.com/dp/B08DKYBTPH | B08DKYBTPH | Chefman Air Fryer 8 Qt \| TurboFry 4-in-1 with 450°F Hi-Fry Option for Crispier Results \| Bake, Dehydrate, Frozen \| XL Nonstick Dishwasher-Safe Basket \| Stainless Steel | Air Fryers (17659096011) | https://www.amazon.com/dp/B08DKYBTPH |
| 4 | https://link.amazon/B0c8moW59 | https://www.amazon.com/dp/B0DHZTCNR5 | B0DHZTCNR5 | ThermoMaven 1 Sec Professional Digital Meat Thermometer, ±0.5°F Accuracy \| NIST&NSF Certified, Auto-Rotate Bright LED Screen, IP67 Waterproof for Grill BBQ, Stocking Stuffers Gifts for Men, Black | Meat Thermometers (289810) | https://www.amazon.com/dp/B0DHZTCNR5 |
| 5 | https://link.amazon/B0f3GKalj | https://www.amazon.com/dp/B0DZFD6R9Z | B0DZFD6R9Z | CHEF iQ Sense \| Smart Wireless Meat Thermometer \| 3 Ultra-Thin Probes \| WiFi Unlimited Range \| 1000°F Heat Safe \| 5 Sensors \| BBQ, Grill, Oven, Smoker, Air Fryer \| Gen3 | Meat Thermometers (289810) | https://www.amazon.com/dp/B0DZFD6R9Z |

Key finding: the set is **3 air fryers + 2 meat thermometers**, not 5 air fryers.
The prior site's "Air fryers, decoded" hero was therefore corrected. Guides now cover both
clusters (4 air-fryer guides as briefed + 2 thermometer guides).

Confirmation date for all five rows: 2026-11-20. Source: official Amazon.com listing page
(each row links to it). Observed redirect targets were recorded in a separate field and were
**not** merged with the intended-ASIN field.

### Compliance decisions (no hallucinations, no stale data)
- **Prices not displayed.** Prices observed 2026-11-20 (e.g. $79.93, $149.99, $69.99, $16.99,
  $119.99) change without notice and may only be shown via an approved API with a freshness
  disclaimer. The site shows "Check current price on Amazon" instead. Source for the rule:
  Associates Program Policies (Updated April 14, 2026), https://affiliate-program.amazon.com/help/operating/policies
- **Star ratings / review counts not displayed.** Same reason (API-only). The site links to the
  official listing where shoppers can see live ratings.
- **Amazon product images not hotlinked.** Associates IP License restricts image use; the site
  uses styled category placeholders instead of `m.media-amazon.com` images.
- **Exact Associates statement used:** "As an Amazon Associate I earn from qualifying purchases"
  (Operating Agreement §5). Disclosure strip sits above the fold on every page (under the
  masthead) and repeats in the footer. All outbound product links carry `rel="nofollow sponsored"`.
- **FTC:** disclosures are clear and conspicuous, unavoidable, and adjacent to recommendations,
  per FTC Endorsement Guides, https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- **Short-link status (FLG-003, S02):** unresolved. The site does **not** claim the supplied
  short links are invalid. One link per product must be tested in the enrolled Associates
  workflow (destination + tracking report) before scaling to validated Special Links
  (`https://www.amazon.com/dp/<ASIN>?tag=shopnow047c-20`). Observed redirects above did not
  surface a `tag=` parameter in the fetch, which is why this remains flagged.
- **Commission rates not stated.** Left blank; see the official fee schedule in Associates
  Central. No revenue forecast or conversion score is published (Priority 4: empty ledger).

## Irregularities flagged (review required)
1. **Tracking ID `shopnow047c-20`** — provided by the user; not independently verified against
   Amazon Associates Central (requires account login). Flagged on `flagged.html`.
2. **Short-link compliance unresolved (FLG-003 / S02)** — exact compliance status of the five
   `link.amazon/` short links is unresolved. Do not claim they are invalid. Test one per
   product in the enrolled Associates workflow; confirm destination and tracking report before
   replacing with validated Special Links. Flagged on `flagged.html`.
3. **Short-link codes are 9 characters** — the codes after `link.amazon/` are 9 chars each;
   standard ASINs are 10 chars. They are short codes, not ASINs. Resolved to 10-char ASINs
   above via observed redirects; the short codes themselves are preserved in the register.
4. **Prices, ratings, images intentionally omitted** — see Compliance decisions above. Not a
   data gap; a policy gate. Flagged on `flagged.html` so reviewers do not mistake omission
   for missing verification.
5. **Analytics endpoint not yet configured** — `winA.analyticsEndpoint` is null (local-only).
   Configure a self-hosted collector to enable remote measurement. Flagged on `flagged.html`.
6. **Search Console not yet submitted** — sitemap is published at `/sitemap.xml`; submit it in
   Google Search Console to complete SG-29. Flagged on `flagged.html`.
7. **Prior-session correction** — the merged PR #1 site described all five products as air
   fryers and left every field blank ("Amazon not reachable"). Both statements were wrong:
   Amazon was reachable via the fetch tool, and two products are meat thermometers. This
   session corrects the record; the correction is logged here rather than silently overwritten.

## Sources used (official, verifiable)
- Amazon.com listing pages (5): https://www.amazon.com/dp/B0CDY277D3 · https://www.amazon.com/dp/B09B7SB46R · https://www.amazon.com/dp/B08DKYBTPH · https://www.amazon.com/dp/B0DHZTCNR5 · https://www.amazon.com/dp/B0DZFD6R9Z (fetched 2026-11-20)
- Amazon Associates Program Policies (Updated April 14, 2026): https://affiliate-program.amazon.com/help/operating/policies
- Amazon Associates Operating Agreement: https://affiliate-program.amazon.com/help/operating/agreement
- FTC Endorsement Guides — What People Are Asking: https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- GitHub Pages docs: https://docs.github.com/pages — live site: https://sassnarep3-star.github.io/WinA/

---
