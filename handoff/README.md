# Handoff — T29 requested changes to shared outputs

These patches hold the spec-row corrections and flag changes from T29 (arena/1cf62cfb-wina, 2026-11-20).
They are **not applied**. Board rule 10 reserves `data/*.json`, nav and `index.html` for the final integration session.

Both patches apply cleanly to `main` at fe6783b and later (checked with `git apply --cached --check`).
Verified in a scratch copy: both applied, `node _src/build.mjs` passes all gates, `node scripts/check-site.mjs` passes, `node scripts/compliance-gate.mjs` reports 0 failing.

## To apply (integration session only)

    git apply handoff/T29-products.patch
    git apply handoff/T29-governance.patch
    node _src/build.mjs && node scripts/check-site.mjs && node scripts/compliance-gate.mjs && node scripts/publish-gate.mjs --committed

Then update `EXECUTIVE_SUMMARY.md` to these figures (computed on the patched tree, not typed):
- 45 flag rows (was 43)
- 34 `verified` · 12 `unverified` · 10 `withheld` · 4 `claim`; 38 rows carry a value, 22 are blank
- Emeril 26QT: 5 of 11 verified; Chefman 8-Quart: 7 of 12; CHEF iQ: 7 of 13; Chefman 6-Quart: 8 of 12; ThermoMaven: 7 of 12

## What the patches change

`T29-products.patch` (`data/products.json`, 11 spec rows):
- Corrected to the cited page (5): Chefman 6-qt capacity; ThermoMaven display (manual: rotates 180°); ThermoMaven battery (manual: one 1.5 V AAA); CHEF iQ type; Chefman 8-qt max temperature (listing only).
- Blanked, sources conflict (2): Emeril presets; Emeril accessories.
- Filled from an official page (4): Emeril warranty (manufacturer "1-Years Warranty"); CHEF iQ battery life ("70+ Hours"); Chefman 8-qt dimensions and warranty (own ASIN listing).

`T29-governance.patch` (`data/governance.json`):
- FLG-028, FLG-029, FLG-039 revised to the current facts.
- FLG-040 added (CHEF iQ model CQ60-1C-Z1-E vs the listing's 3-probe title).
- FLG-041 added (ThermoMaven listing identity vs the HT07 F1 Stealth page).

## Not in these patches

- `data/links.json`: no change. Main's `verificationLog` already holds the third short-link run, and it matches this session's run.
- Chefman 8-qt wattage: left blank (FLG-028). Owner must read the product-information table of B08DKYBTPH.
