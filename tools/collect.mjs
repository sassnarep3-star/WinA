// Product collector. The one part of "automated product research" that can be automated safely:
// it reads listing data you obtained from an authorized source, writes only the fields that
// source actually contains, records where each field came from, and refuses to fill a gap.
//
//   node tools/collect.mjs                 report what would change (no writes)
//   node tools/collect.mjs --write         apply it
//   node tools/collect.mjs --from a.json   read one file instead of the inbox
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cfg } from "./lib/site.mjs";

const PRODUCTS = join(ROOT, "data", "products.json");
const INTENTS = join(ROOT, "data", "product-intent.json");
const INBOX = join(ROOT, "data", "inbox");
const FIELDS = ["title", "brand", "category", "price", "currency", "star_rating", "rating_count", "availability", "commission_category", "official_listing_url", "spec_sheet"];
const write = process.argv.includes("--write");
const single = argVal("--from");
function argVal(flag) { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; }

const reg = JSON.parse(readFileSync(PRODUCTS, "utf8"));
const intents = JSON.parse(readFileSync(INTENTS, "utf8"));
const sources = JSON.parse(readFileSync(join(ROOT, "data", "sources.json"), "utf8"));
const ASIN = /^[A-Z0-9]{10}$/;

const files = single ? [join(ROOT, single)] : existsSync(INBOX) ? readdirSync(INBOX).filter((f) => f.endsWith(".json") && !f.startsWith("README")).map((f) => join(INBOX, f)) : [];
if (!files.length) {
  console.log(`nothing to collect.

The inbox is empty, which is the correct state while the register has no confirmed listing to
fold in. To use this tool:

  1. Resolve each product in the Amazon listing you intend to promote and copy the 10 characters
     after /dp/ (see ${sources.sources.find((s) => s.id === "SRC-08").url}).
  2. Put the values in data/inbox/<id>.json — data/inbox/example.format.json shows the shape.
     Authorized sources only: a page you opened while logged into your own account, an export
     from Associates Central, or a PA-API GetItems response (PA-API needs an accepted account).
  3. Run: node tools/collect.mjs            (reads the plan)
          node tools/collect.mjs --write    (applies it)

Never paste a price or rating from a screenshot, an aggregator, or an AI answer: this tool
cannot tell those apart from a listing, and the register's whole value is that it can be checked.`);
  process.exit(0);
}

let changed = 0, refused = [];
const plan = [];
for (const file of files) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const recs = Array.isArray(raw) ? raw : [raw];
  for (const rec of recs) {
    const err = [];
    if (!rec.id && !rec.asin) err.push("no id and no asin: cannot locate a register row");
    if (!rec.source) err.push("missing source: which authorized place did this come from");
    if (!rec.retrievedAt) err.push("missing retrievedAt: the date the source was read");
    const asin = String(rec.asin || "").trim();
    if (asin && !ASIN.test(asin)) err.push(`asin "${asin}" is not 10 upper-case alphanumeric characters`);
    if (rec.official_listing_url) {
      const urlAsin = (rec.official_listing_url.match(/\/dp\/([A-Za-z0-9]{1,16})/) || [])[1];
      if (!urlAsin) err.push("official_listing_url has no /dp/<ASIN> segment to check the identifier against");
      else if (asin && urlAsin.toUpperCase() !== asin) err.push(`the URL carries ${urlAsin.toUpperCase()} but the record claims ${asin}`);
    }
    if (typeof rec.price === "number" && !rec.currency) err.push("a numeric price without a currency is meaningless");
    if (rec.star_rating != null && rec.rating_count == null) err.push("a star rating without a rating count is an orphan number");
    if (err.length) { refused.push([rec.id || asin || file, err]); continue; }

    const row = reg.products.find((p) => p.id === rec.id || p.submitted_ref === asin);
    if (!row) { refused.push([rec.id || asin, ["no register row with that id or submitted identifier — add it to data/products.json first"]]); continue; }

    const fills = [];
    row.verified_fields = row.verified_fields || [];
    row.field_provenance = row.field_provenance || {};
    for (const f of FIELDS) {
      const v = rec[f];
      if (v === undefined || v === null || v === "") {
        if (!(row.unverified_fields || []).includes(f)) row.unverified_fields = [...(row.unverified_fields || []), f];
        continue;
      }
      if (row[f] === v) continue;
      fills.push([f, row[f] === null ? "—" : JSON.stringify(row[f]), JSON.stringify(v)]);
      row[f] = v;
      if (!row.verified_fields.includes(f)) row.verified_fields.push(f);
      row.unverified_fields = (row.unverified_fields || []).filter((x) => x !== f);
      row.field_provenance[f] = { source: rec.source, retrieved_at: rec.retrievedAt, file: file.replace(ROOT + "/", "") };
    }
    if (asin) {
      row.asin_resolved = asin;
      row.asin_length = asin.length;
      row.matches_asin_format = ASIN.test(asin);
    }
    row.verification_state = (row.unverified_fields || []).length ? "partially verified" : "verified";
    if (fills.length) changed++;
    plan.push({ file: file.replace(ROOT + "/", ""), product: row.id, fills, still_blank: row.unverified_fields });

    // intent block: only confirmation metadata the record actually asserts
    const pir = intents.records.find((x) => x.product_id === row.id);
    if (pir && asin) {
      pir.intent.official_listing_url = rec.official_listing_url || pir.intent.official_listing_url;
      pir.intent.confirmation_date = rec.retrievedAt;
      pir.intent.confirmation_source = rec.source;
      if (rec.confirmed_by) pir.intent.confirmed_by = rec.confirmed_by;
      pir.intent.intended_asin_valid = ASIN.test(asin);
      // observation is never written from an intent record. If a redirect was seen, it goes in
      // through --observation only, so the two blocks cannot be confused.
      if (rec.observed_redirect_targets) {
        pir.observation.observed_redirect_targets = rec.observed_redirect_targets;
        pir.observation.observed_at = rec.observed_at || rec.retrievedAt;
        pir.observation.method = rec.observed_method || "recorded by the account owner";
        pir.observation.outcome = "observed";
      }
      const blocked = !ASIN.test(asin) || !pir.intent.official_listing_url || !pir.intent.confirmed_by;
      pir.gate.status = blocked ? "blocked" : "pending link test";
      pir.gate.blocking_reasons = blocked ? ["identifier or listing URL still unconfirmed"] : [];
      pir.gate.clear_when = blocked ? pir.gate.clear_when : ["one tagged link built in Associates Central, clicked logged out, destination confirmed, and the click visible in reporting the next day"];
    }
  }
}

for (const p of plan) {
  console.log(`\n${p.product}  (${p.file})`);
  if (!p.fills.length) console.log("   no changes: the register already holds these values");
  for (const [f, from, to] of p.fills) console.log(`   ${f}: ${from} -> ${to}`);
  if (p.still_blank.length) console.log(`   left blank, still unverified: ${p.still_blank.join(", ")}`);
}
if (refused.length) {
  console.log(`\nrefused (${refused.length}) — nothing was written for these:`);
  for (const [id, errs] of refused) for (const e of errs) console.log(`   ${id}: ${e}`);
}
if (cfg.affiliate.linksEnabled === false)
  console.log(`\nlinks remain disabled in config, so no href changes. Enable them only after the one-link test (SG-25) passes for every live row.`);
if (write) {
  writeFileSync(PRODUCTS, JSON.stringify(reg, null, 2) + "\n");
  writeFileSync(INTENTS, JSON.stringify(intents, null, 2) + "\n");
  console.log(`\nwrote data/products.json and data/product-intent.json (${changed} row${changed === 1 ? "" : "s"} touched). Re-run: npm run check`);
} else if (plan.length) {
  console.log(`\nplan only — nothing written. Re-run with --write after you have read the diff.`);
}
process.exit(refused.length ? 1 : 0);
