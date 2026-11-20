# Analytics

Five events, defined in `events.json`:
`page_view`, `outbound_click`, `guide_read`, `disclosure_expand`, `feed_click`.

- The site sends nothing until `analytics_endpoint` is set in `data/site.json`. The build then writes it to `docs/assets/config.js`.
- `collector.py` runs on a server you control. It accepts only the five events and their listed fields, stores daily counts in a JSON file, and keeps no IP addresses, user agents, cookies, or query strings.
- GitHub Pages cannot run the collector, so hosting is a decision (suggestion S-03).
- Tests: `python3 -m unittest discover -s tests`.
