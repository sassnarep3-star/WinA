---
title: Executive summary
description: Findings, decisions needed, and what is blocked for the Amazon affiliate site, as of 2026-11-20.
---

**Status as of 2026-11-20.** The site is generated from the data files in this repository, and the build stops if a compliance check fails. It has not been deployed yet, and the Associates tracking ID has not been tested in Associates Central. Intended ASINs are blank, and no commission rate is shown.

## What the build produces

- A front page led by the five products, two category pages (air fryers and meat thermometers), an all-products table, a guides index with five guides, and nine dashboard pages linked from the footer.
- An affiliate disclosure under the masthead on every page, repeated in the footer.
- Every Amazon product link carries `rel="sponsored"` and a visible Sponsored label, as Google's guidance on paid links describes ([SRC-09](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)).
- A sitemap, an RSS feed, and a robots file.
- Build checks that fail the build on a broken link or anchor, a missing disclosure, an unmarked Amazon product link, a tagged candidate link while the gate is closed, price or star-rating text, or a table row without a source link.
- A five-event analytics design and a collector script ([analytics](../analytics/)). The collector is not hosted, so the site sends nothing until an endpoint is set ([S-03](../suggestions/#s-03)).

## What is confirmed

- All five submitted short links resolve to Amazon listings, and each resolves to a different product page. The observed ASINs are B0CDY277D3, B09B7SB46R, B08DKYBTPH, B0DHZTCNR5, and B0DZFD6R9Z ([link validation](../link-validation/)).
- None of the five observed redirect URLs carries a `tag=` parameter ([F-02](../flagged-for-review/#f-02)). Participation Requirements §2(b) requires the Associates tag as a URL parameter on each link to an Amazon site ([SRC-02](https://affiliate-program.amazon.com/help/operating/policies)). Whether the supplied links are compliant is unresolved (FLG-003 as referenced in the brief; its source document was not provided, so it is tracked under [F-02](../flagged-for-review/#f-02)). The site does not call them invalid.
- Operating Agreement §5 requires the statement "As an Amazon Associate I earn from qualifying purchases." on the site ([SRC-01](https://affiliate-program.amazon.com/help/operating/agreement)).
- Standard commission is a percentage of Qualifying Revenue. Qualifying Revenue excludes shipping, gift wrap, handling, taxes, service charges, credits, rebates, card processing fees, and bad debt (Commission Income Statement §1 and §3, [SRC-02](https://affiliate-program.amazon.com/help/operating/policies)).
- A session lasts 24 hours from the click, and an order counts if it is placed within 89 days of the click (Commission Income Statement §1(b), [SRC-02](https://affiliate-program.amazon.com/help/operating/policies)).
- A purchase is disqualified if the order is cancelled or returned (Commission Income Statement §2(b)), if the customer was referred by a search-engine link (§2(d)) or a redirecting link (§2(e)), or if the links are not properly formatted (§2(g)).
- Customer reviews and star ratings may be shown only through the API (Participation Requirements §6(t)). The site shows neither ([F-05](../flagged-for-review/#f-05)).
- The USDA minimum internal temperatures used in the thermometer guide ([SRC-07](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart)).

## What is not confirmed

- **Intended ASIN for every product (0 of 5).** No intent was supplied, and the submitted codes are 9 characters, not 10 ([F-01](../flagged-for-review/#f-01), [SRC-04](https://sellercentral.amazon.com.mx/seller-forums/discussions/t/436b9105-db19-41cc-8f2a-7720c7ae5649)).
- **Whether the supplied links are compliant Special Links.** Unresolved. See above.
- **Whether the tracking ID is the enrolled one.** It has not been checked in Associates Central ([F-22](../flagged-for-review/#f-22)).
- **Commission rates.** The rate schedule needs an Amazon sign-in, so no rate is shown ([F-06](../flagged-for-review/#f-06)).
- **Prices and star ratings.** Not shown ([F-05](../flagged-for-review/#f-05)).
- **Sales, clicks, conversions, and trends.** None are available. The campaign ledger is empty by design.
- **Search demand for the guide topics.** No verified source.

## Commission potential

This site makes no revenue estimate. The rate and the price are both unconfirmed, and the terms above disqualify some purchases. The site also makes no claim that any product converts well.

## Decisions needed before anything else changes

| ID | Decision | Recommended | Source |
|---|---|---|---|
| S-01 | Confirm the intended ASIN for each product | Option A: confirm from your own records | [Amazon staff reply (SRC-04)](https://sellercentral.amazon.com.mx/seller-forums/discussions/t/436b9105-db19-41cc-8f2a-7720c7ae5649) |
| S-02 | Run the one-link test per product in Associates Central | Option A, after S-01 | [Participation Requirements §6(u)](https://affiliate-program.amazon.com/help/operating/policies) |
| S-03 | Choose where the analytics collector runs | Option A: a server you control | [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) |
| S-08 | Copy the Home & Kitchen commission rate from Associates Central | Option A | [Rate schedule (sign-in required)](https://affiliate-program.amazon.com/help/operating/schedule) |
| S-14 | Confirm disclosure placement | Option C: strip plus a note beside each sponsored link | [FTC Disclosures 101](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers) |

The full list, with options and sources, is on the [suggestions page](../suggestions/).

## Risks to weigh

- The supplied links may not credit the Associate. This is the largest open risk ([F-02](../flagged-for-review/#f-02)).
- Manufacturer claims in listing titles are not verified ([F-19](../flagged-for-review/#f-19)).
- No product was tested, and the site makes no test claims ([F-08](../flagged-for-review/#f-08)).
- Operator identity, the privacy policy, and the byline are placeholders ([F-14](../flagged-for-review/#f-14), [F-18](../flagged-for-review/#f-18)).

## Next steps once you decide

1. Confirm intents (S-01) and run the link test (S-02).
2. Fill the commission rate and date (S-08), then rebuild.
3. Host the collector and set the endpoint (S-03), so the five events start recording.
4. Connect Search Console and submit the sitemap (S-11).
5. Publish the next guide on the chosen cadence (S-05).
