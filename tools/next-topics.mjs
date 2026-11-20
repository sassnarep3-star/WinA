// Topic selection from measured queries, not from a feeling.
// Drop a Search Console Performance export into data/exports/ and run this.
// No export  ->  it says so and prints the manual route. It will not invent demand.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, load, Report, htmlFiles, OUT } from "./lib/site.mjs";

const DIR = join(ROOT, "data", "exports");
const r = new Report("topic selection");
const minImpressions = Number(process.argv.includes("--min") ? process.argv[process.argv.indexOf("--min") + 1] : 20);

if (!existsSync(DIR) || !readdirSync(DIR).some((f) => /\.csv$/i.test(f))) {
  console.log(`no query data yet — nothing to rank.

To get it:
  1. Verify the site property in Search Console (Properties → Add property → Domain or URL prefix).
  2. Submit /sitemap.xml there and wait for coverage to settle — a fortnight is realistic.
  3. Performance → Export → CSV, name it gsc-queries-YYYY-MM-DD.csv, drop it in data/exports/.
  4. Re-run: npm run topics

Until then, the honest selection method is the one already in use: pick the question a buyer asks
that this site cannot yet answer, and label the choice as a hypothesis. Every guide on the site
carries that label, which is why nothing here claims to be trending.`);
  process.exit(0);
}

function parseCsv(text) {
  const rows = [];
  let cur = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; continue; }
    if (c === '"') { q = true; continue; }
    if (c === ",") { cur.push(field); field = ""; continue; }
    if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; continue; }
    if (c === "\r") continue;
    field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((x) => x.some((v) => v !== ""));
}

const covered = new Set();
for (const page of htmlFiles()) {
  const txt = readFileSync(join(OUT, page), "utf8");
  for (const w of (txt.replace(/<[^>]+>/g, " ").toLowerCase().match(/[a-z][a-z'’-]{3,}/g) || [])) covered.add(w);
}
const cats = load("data/categories.json").categories;
const files = readdirSync(DIR).filter((f) => /\.csv$/i.test(f));
const scored = [];
for (const f of files) {
  const rows = parseCsv(readFileSync(join(DIR, f), "utf8"));
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = { query: head.indexOf("query"), clicks: head.indexOf("clicks"), imp: head.indexOf("impressions"), pos: head.indexOf("position"), page: head.indexOf("page") };
  if (idx.query < 0) { r.fail(`${f}: no "Query" column — export the Query dimension from Performance`, f); continue; }
  for (const row of rows.slice(1)) {
    const query = row[idx.query];
    if (!query) continue;
    const impressions = Number(row[idx.imp] ?? 0) || 0;
    const clicks = Number(row[idx.clicks] ?? 0) || 0;
    const position = Number(row[idx.pos] ?? 0) || 0;
    if (impressions < minImpressions) continue;
    const words = query.toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length > 3);
    const gaps = words.filter((w) => !covered.has(w));
    const untapped = position >= 6 && position <= 45 && clicks <= 1;
    scored.push({ query, impressions, clicks, position, gaps, priority: (untapped ? 3 : 0) + Math.min(gaps.length, 3) + Math.log10(impressions + 1), untapped });
  }
}
scored.sort((a, b) => b.priority - a.priority);
const top = scored.slice(0, 15);
console.log(`\n${files.length} export(s) read · ${scored.length} queries above ${minImpressions} impressions`);
if (!top.length) console.log("no query clears the threshold yet. Publish more, wait longer, do not force a topic.");
for (const s of top) {
  console.log(`\n  ${s.query}`);
  console.log(`     ${s.impressions} impressions · ${s.clicks} clicks · avg position ${s.position.toFixed(1)}`);
  if (s.untapped) console.log(`     ranked 6–45 with ~no clicks: a page exists but does not answer the phrasing`);
  if (s.gaps.length) console.log(`     words this site never uses: ${s.gaps.slice(0, 6).join(", ")}`);
  console.log(`     → write the question as asked, and put the answer in the first paragraph`);
}
r.ok(scored.length > 0, "export contained no usable rows");
console.log(`\n  reminder: a topic chosen from data is still a hypothesis about intent. The label on\nd               each guide stays, and the register stays the only place numbers come from.`);
process.exit(r.print() ? 0 : 1);
