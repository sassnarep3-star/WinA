# Handoff — T34 requested changes to shared outputs

These patches hold the spec-row corrections and flag changes from T34 (arena/1cf62cfb-wina, 2026-11-20).
**Applied at integration on 2026-11-20 by arena-3818c975-wina (T35), with one deliberate divergence:** T34
blanked the Emeril preset and accessory rows because the official sources disagree; this build instead prints both
figures on the row and marks it `claim`, so a reader sees the disagreement instead of an absence. FLG-029 records the
choice and the reason. T34's own new flag became FLG-044, because FLG-043 was taken in between.

Nothing else here is unapplied. Board rule 10 reserves `data/*.json`, nav and `index.html` for the final integration session.

Both patches apply cleanly to `main` at f3f9541 (checked with `git apply --cached --check` against that tree).
Verified in a scratch copy of f3f9541: both applied; `node _src/build.mjs` passes all gates (33 pages); `node scripts/check-site.mjs` passes; `node scripts/compliance-gate.mjs` reports 1,518 checks, 0 failing, 1 intentional warning (FLG-024).

## To apply (integration session only)

    git apply handoff/T34-products.patch
    git apply handoff/T34-governance.patch
    node _src/build.mjs && node scripts/check-site.mjs && node scripts/compliance-gate.mjs && node scripts/publish-gate.mjs --committed

Figures on the patched tree, for `EXECUTIVE_SUMMARY.md`. Recompute them with a script before writing them:
- 47 flag rows
- 34 `verified` · 12 `unverified` · 10 `withheld` · 4 `claim`; 38 rows carry a value, 22 are blank
- Per product, verified of total: Chefman 6-Quart 8/12; Emeril 26QT 5/11; Chefman 8-Quart 7/12; ThermoMaven 7/12; CHEF iQ 7/13

## What the patches change

`T34-products.patch` (`data/products.json`, 11 spec rows):
- Corrected to the cited page (5): Chefman 6-qt capacity; ThermoMaven display (manual: rotates 180°); ThermoMaven battery (manual: one 1.5 V AAA); CHEF iQ type; Chefman 8-qt max temperature (listing only).
- Blanked, sources conflict (2): Emeril presets; Emeril accessories.
- Filled from an official page (4): Emeril warranty ("1-Years Warranty" badge); CHEF iQ battery life ("70+ Hours"); Chefman 8-qt dimensions and warranty (its own ASIN listing).

`T34-governance.patch` (`data/governance.json`):
- FLG-028 revised (Chefman 8-qt wattage conflict).
- FLG-029 revised (Emeril preset and accessory conflict).
- FLG-039 revised (coverage 34 of 60 with the products patch applied).
- FLG-043 added (ThermoMaven listing identity vs the HT07 F1 Stealth page). FLG-042 is taken on `main` (a collector defect), so the next free id is used.

## Not in these patches

- The CHEF iQ 1-probe variant point: already on `main` as FLG-041.
- `data/links.json`: no change. `main` already records each dated short-link run, and FLG-040 covers the redirect pattern.
- Chefman 8-qt wattage: left blank (FLG-028). Owner must read the product-information table of B08DKYBTPH.
