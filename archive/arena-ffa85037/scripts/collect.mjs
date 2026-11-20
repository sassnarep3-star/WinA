// Listing intake. Automates the part of "automated product research" that is safe to automate:
// transcribing a value you already read off an authorized source into the register, with the
// provenance attached, and refusing to fill a gap you did not fill.
//
//   node scripts/collect.mjs              read the plan, write nothing
//   node scripts/collect.mjs --write      apply it to data/products.json + data/links.json
//   node scripts/collect.mjs --from f.json
//
// What it will not do: invent a spec, accept a value without a source id defined in
// data/policy.json, mark a Special Link test passed, or touch a price or a rating (Policies
// §6(t)/§6(y) — those rows exist only as "withheld").
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cfg, Report } from "./lib/site.mjs";

const INBOX = join(ROOT, "data", "inbox");
const write = process.argv.includes("--write");
const only = arg("--from");
function arg(f) { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; }
const r = new Report("listing intake");
const PRODUCTS = join(ROOT, "data", "products.json");
const sourceIds = new Set(cfg.policy.sources.map((s) => s.id));
const ASIN = /^[A-Z0-9]{10}$/;

const files = only ? [join(ROOT, only)] : existsSync(INBOX) ? readdirSync(INBOX).filter((f) => f.endsWith(".json") && !/^example/.test(f)).map((f) => join(INBOX, f)) : [];
if (!files.length) {
  console.log(`nothing to collect — data/inbox/ is empty, which is the correct state between intakes.

How this works:
  1. Open the listing you intend to promote and copy the 10 characters after /dp/.
  2. Write data/inbox/<slug>.json (see data/inbox/example.format.json for the shape).
     Authorized sources only: the page you opened, an Associates Central export, or a PA-API
     GetItems response. A price or rating from a screenshot, an aggregator, or a model answer is
     not authorized — and this tool cannot tell the difference, so the rule lives with you.
  3. node scripts/collect.mjs        → prints the plan
     node scripts/collect.mjs --write → applies it
  4. node _src/build.mjs && node scripts/compliance-gate.mjs

The register's 30 valued spec rows came in through this discipline: every one names a source id
that exists in data/policy.json. That is the property this tool protects.`);
  process.exit(0);
}

const doc = JSON.parse(readFileSync(PRODUCTS, "utf8"));
let touched = 0;
for (const file of files) {
  const recs = JSON.parse(readFileSync(file, "utf8"));
  for (const rec of Array.isArray(recs) ? recs : [recs]) {
    const p = doc.products.find((x) => x.slug === rec.slug || x.asin === rec.asin);
    const errs = [];
    if (!p) errs.push(`no product with slug "${rec.slug}" or asin "${rec.asin}" — add the product row first, this tool does not create products`);
    if (!rec.source) errs.push(`no source: must name an id from data/policy.json (${[...sourceIds].join(", ")})`);
    else if (!sourceIds.has(rec.source)) errs.push(`source "${rec.source}" is not defined in data/policy.json`);
    if (!rec.accessed) errs.push("no accessed date: the date you read the source, not today's date by default");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(rec.accessed)) errs.push(`accessed "${rec.accessed}" is not YYYY-MM-DD`);
    if (rec.asin && !ASIN.test(rec.asin)) errs.push(`asin "${rec.asin}" is not 10 upper-case alphanumeric characters`);
    for (const banned of ["price", "star_rating", "rating_count", "availability"])
      if (rec.fields && rec.fields[banned] != null) errs.push(`"${banned}" is not collectable — the register records it as withheld (Policies §6(t)/(y))`);
    if (!rec.fields || !Object.keys(rec.fields).length) errs.push("no fields: an empty record changes nothing");
    if (errs.length) { r.fail(`${rec.slug || "?"}: ${errs.join("; ")}`, file.replace(ROOT + "/", "")); continue; }

    const rows = [];
    for (const [label, value] of Object.entries(rec.fields)) {
      if (value === null || value === "") continue;                       // a gap stays a gap
      const spec = p.specs.find((s) => s.label.toLowerCase() === label.toLowerCase());
      const row = { label, value: String(value), status: "verified", source: rec.source, accessed: rec.accessed };
      if (spec) {
        if (spec.value === row.value && spec.source === rec.source) continue;
        if (spec.value !== null && spec.value !== row.value) rows.push(`  update  ${label}: "${spec.value}" → "${row.value}"`);
        else rows.push(`  same    ${label} (already "${row.value}")`);
        Object.assign(spec, row);
      } else { p.specs.push(row); rows.push(`  add     ${label}: "${row.value}"`); }
      touched++;
    }
    if (rec.observed_destination) {
      const l = cfg.links.links.find((x) => x.observedAsin === rec.asin || x.shortCode === rec.shortCode);
      if (l) {
        // two fields, deliberately never merged
        r.ok(!l.intendedAsin || l.intendedAsin === rec.asin, "intended and observed ASINs disagree — keep them separate and say which the owner meant", p.slug);
        l.observedDestination = rec.observed_destination;
        l.confidence = "observed";
      } else r.warn(false, `no link row for ${rec.asin}: observation recorded on the product only`, p.slug);
    }
    console.log(`\n${p.slug}  (${file.replace(ROOT + "/", "")})`);
    console.log(rows.length ? rows.join("\n") : "   no changes: the register already holds these values");
    const blanks = p.specs.filter((s) => s.status === "unverified" || s.status === "withheld").map((s) => s.label);
    if (blanks.length) console.log(`   still blank by policy: ${blanks.join(", ")}`);
  }
}
r.ok(touched > 0 || !files.length, "the intake contained nothing new");
if (write && touched) {
  writeFileSync(PRODUCTS, JSON.stringify(doc, null, 2) + "\n");
  writeFileSync(join(ROOT, "data", "links.json"), JSON.stringify(cfg.links, null, 2) + "\n");
  console.log(`\nwrote data/products.json (${touched} row(s)). Next: node _src/build.mjs && node scripts/compliance-gate.mjs`);
} else if (touched) {
  console.log(`\nplan only — ${touched} row(s) would change. Re-read it, then run with --write.`);
}
process.exit(r.print() ? 0 : 1);
