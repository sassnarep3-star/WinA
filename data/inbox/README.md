# `data/inbox/` — listing evidence, waiting to be folded in

One JSON file per product, then `node scripts/collect.mjs` to read the plan and `--write` to apply
it. The collector writes only what your source contains, stamps every value with the source id and
the date you read it, and leaves a gap a gap.

| Authorized input | Why it qualifies |
| --- | --- |
| The product detail page you opened yourself | It is the listing. Copy the ten characters after `/dp/` and the values from the page's own text. |
| An export from Associates Central | First-party and attributable to the account |
| A PA-API `GetItems` response | Program Content under the licence — needs an accepted account and your own credentials |

Not authorized as evidence: a screenshot, another affiliate site's table, a cached page, or a
model's answer. The collector cannot tell those from a real listing, so that rule is enforced by
the person pasting — which is exactly why the register prints *what was read and when* next to
every number.

`example.format.json` shows the shape. This directory is data, not code: nothing here is served.
