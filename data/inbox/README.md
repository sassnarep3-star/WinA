# `data/inbox/` — listing evidence waiting to be folded in

Drop one JSON file per product here, then run `node tools/collect.mjs` to see the plan and
`--write` to apply it. The collector writes only the fields your source actually contains:
a gap stays a gap, and the register keeps saying so.

Authorized inputs only:

| Input | Why it qualifies |
| --- | --- |
| The product detail page you opened yourself | It is the listing; copy the ten characters after `/dp/` and the values from the page's own table |
| An export from Associates Central | First-party and attributable to your account |
| A PA-API `GetItems` response | Program Content under the licence; requires an accepted account and your own credentials |

Not authorized as evidence: screenshots from an aggregator, another affiliate site's table, a
cached page, or a model's answer. The collector cannot tell those apart from a real listing, so
the rule lives with the person pasting.

See `example.format.json` for the shape, including which fields are optional.
