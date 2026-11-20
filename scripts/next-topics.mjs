// Cadence from measured queries. Drop a Search Console Performance export into data/exports/ and
// run this. Without an export it says so and prints the manual route — it will not manufacture
// demand, which is how a small site ends up with pages written for a keyword nobody searched.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cfg, htmlFiles, readOut, textOf } from "./lib/site.mjs";

const DIR = join(ROOT, "data", "exports");
const MIN = Number(process.argv.includes("--min") ? process.argv[process.argv.indexOf("--min") + 1] : 20);
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => /\.csv$/i.test(f)) : [];

if (!files.length) {
  console.log(`no query data yet — nothing to rank.

  1. Verify the property in Search Console (Properties → Add property), and submit /sitemap.xml.
  2. Wait for coverage to settle; a fortnight is realistic for a new site on a sub-path.
  3. Performance → Export → CSV → data/exports/gsc-queries-YYYY-MM-DD.csv.
  4. node scripts/next-topics.mjs

Until then the only honest selection method is the one already in use: the question a buyer asks
that this site cannot yet answer, labelled a hypothesis. Nine of the open rows on
data/questions.json are exactly that kind of question, and /guides/ carries the working titles.

A note on why this refuses to guess: this site publishes no volume figures anywhere, and a topic
list built from invented volume would be the first unverified claim on the property.`);
  process.exit(0);
}

function parseCsv(text) {
  const rows = []; let cur = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; continue; }
    if (c === '"') { q = true; continue; }
    if (c === ",") { cur.push(f); f = ""; continue; }
    if (c === "\n") { cur.push(f); rows.push(cur); cur = []; f = ""; continue; }
    if (c !== "\r") f += c;
  }
  if (f || cur.length) { cur.push(f); rows.push(cur); }
  return rows.filter((x) => x.some((v) => v !== ""));
}
const covered = new Set();
for (const page of htmlFiles()) for (const w of textOf(readOut(page)).toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []) covered.add(w);
const live = new Set(cfg.products.map((p) => p.asin));

const scored = [];
for (const f of files) {
  const rows = parseCsv(readFileSync(join(DIR, f), "utf8"));
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const i = { q: head.indexOf("query"), c: head.indexOf("clicks"), im: head.indexOf("impressions"), p: head.indexOf("position") };
  if (i.q < 0) { console.log(`  skip ${f}: no "Query" column`); continue; }
  for (const row of rows.slice(1)) {
    const query = row[i.q]; if (!query) continue;
    const impressions = Number(row[i.im] ?? 0) || 0, clicks = Number(row[i.c] ?? 0) || 0, position = Number(row[i.p] ?? 0) || 0;
    if (impressions < MIN) continue;
    const words = query.toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length > 3);
    const gaps = words.filter((w) => !covered.has(w));
    const untapped = position >= 6 && position <= 45 && clicks <= 1;
    scored.push({ query, impressions, clicks, position, gaps, untapped, score: (untapped ? 3 : 0) + Math.min(gaps.length, 3) + Math.log10(impressions + 1) });
  }
}
scored.sort((a, b) => b.score - a.score);
console.log(`\n${files.length} export(s) · ${scored.length} queries at ${MIN}+ impressions · ${new Set(htmlFiles()).size} pages indexed locally`);
if (!scored.length) console.log("nothing clears the threshold. Publish more, wait longer, do not force a topic.");
for (const s of scored.slice(0, 15)) {
  console.log(`\n  ${s.query}`);
  console.log(`     ${s.impressions} impressions · ${s.clicks} clicks · avg position ${s.position.toFixed(1)}`);
  if (s.untapped) console.log("     ranked 6–45 with ~no clicks: a page exists but does not answer this phrasing");
  if (s.gaps.length) console.log(`     words this site never uses: ${s.gaps.slice(0, 6).join(", ")}`);
  console.log("     → answer the question as asked, in the first paragraph, from a source we can cite");
  console.log("     → if it needs a product in hand, it is a buy first (Q on data/questions.json), not a draft");
}
console.log(`\n  ${scored.length} candidate(s). A topic chosen from data is still a hypothesis about intent —\n  the register, not the ranking, is what makes a page publishable.`);
