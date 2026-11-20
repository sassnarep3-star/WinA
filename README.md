# Counter Notes

A static, publication-style editorial front page for researching kitchen-appliance products and buyer questions. It intentionally distinguishes submitted link references from verified product facts. No product names, specifications, prices, ratings, commissions, trends, conversions, or earnings are fabricated.

## Preview locally

Open `index.html` in a browser or run a static web server from the repository root, for example:

```sh
python3 -m http.server 8000
```

## Current scope and limitations

- Five submitted Amazon short URLs appear in a research register. Their product identity and official listing destinations are unverified; corresponding fields remain blank.
- Outbound links are marked `rel="sponsored nofollow noopener"` and disclosure language appears below the masthead and in the footer.
- The click counter is deliberately browser-local only. It sends no event to a self-hosted endpoint and cannot measure sessions, orders, or revenue.
- No analytics backend, Amazon API integration, article CMS, RSS feed, sitemap, Search Console property, or verified GitHub Pages deployment is configured by this static repository.
- See `COORDINATION.md` for verification boundaries, source references, and irregularities.

## Manual review sources

- [Amazon Associates Program Policies](https://affiliate-program.amazon.com/help/operating/policies)
- [Amazon Associates Participation Requirements](https://affiliate-program.amazon.com/help/operating/participation)
- [FTC Endorsements and Reviews guidance](https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews)
