# WinA

AI-powered Amazon affiliate marketing platform — built as a polished, publication-style marketing site.

## What this is
A clean, buyer-facing affiliate site for Amazon products. It leads with products (not verification), keeps every dashboard surface reachable from the footer and a single navigation group, and reads like a publication rather than generated AI slop.

Tracking ID: `shopnow047c-20` (user-provided; not yet verified against Amazon).

## Site structure
| Page | Purpose |
|------|---------|
| `index.html` | Publication front page — product-led hero + featured picks + guide preview |
| `products.html` | Product-intent confirmation register + outbound-link table + click/conv. measurement |
| `guides.html` | Question-shaped buying guides (published to sitemap + RSS feed) |
| `suggest.html` | Suggestions section — review before implementing |
| `questions.html` | Pre-decision Q&A + missing-information discovery |
| `executive-summary.html` | Executive summary |
| `flagged.html` | Flagged for Review — irregularities + unverified items |
| `sitemap.xml` | Search-engine sitemap (one site to index) |
| `feed.xml` | RSS feed for guides |

## Key policies (implemented)
- **Disclosure above the fold** on every page (under the masthead), repeated in the footer.
- **All outbound product links marked sponsored** (`rel="nofollow sponsored"`).
- **Product-intent confirmation record**: intended ASIN, official listing URL, confirmation date, source — kept separate from observed redirect target (never merged).
- **Privacy-preserving click counter** + self-hosted analytics endpoint (`assets/js/click-tracker.js`); 5 events recorded.
- **Compliance gate**: Associates statement visible; disclosure and endorsement context reviewed against the Operating Agreement and FTC guidance.

## Verification status
Amazon.com is not reachable from this build environment, so ASINs, listing URLs, prices, commissions, and images are **left blank and unverified** — never inferred. See `products.html` and `flagged.html`. Nothing on this site should be treated as verified until reviewed against the official Amazon listing.

## Publishing
GitHub Pages (static). One site to index via `sitemap.xml`; guides syndicated via `feed.xml` (RSS).
