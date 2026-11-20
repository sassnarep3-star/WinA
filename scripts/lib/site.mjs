// Shared helpers for the gate scripts — one place that knows how this repository is shaped, so a
// check and the build can never be reading different files. Kept deliberately small: if it starts
// holding policy, that logic belongs in _src/build.mjs where the site can see it too.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const load = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
export const cfg = {
  products: load("data/products.json").products,
  site: load("data/products.json").site,
  policy: load("data/policy.json"),
  governance: load("data/governance.json"),
  links: load("data/links.json"),
  specialLink: load("data/special_link_tests.json"),
  questions: load("data/questions.json"),
  suggestions: load("data/suggestions.json")
};
export const STATEMENT = cfg.site.associateStatement;
export const TRACK = cfg.site.trackingId;
export const ORIGIN = cfg.site.origin.replace(/\/$/, "");

/** Built pages, excluding the archives (preserved, not part of this site) and data/tooling dirs. */
export function htmlFiles(dir = ROOT, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "archive", "_src", "_worker", "data", "scripts"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, acc);
    else if (e.name.endsWith(".html")) acc.push(relative(ROOT, p).split("\\").join("/"));
  }
  return acc.sort();
}
export const readOut = (f) => readFileSync(join(ROOT, f), "utf8");
const ATTR = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;
export function tags(doc, name) {
  const out = [];
  for (const m of doc.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "gi"))) {
    const a = {};
    for (const x of m[1].matchAll(ATTR)) a[x[1].toLowerCase()] = x[2];
    out.push(a);
  }
  return out;
}
export function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

export class Report {
  constructor(name) { this.name = name; this.n = 0; this.f = []; this.w = []; }
  ok(cond, msg, ctx = "") { this.n++; if (!cond) this.f.push({ msg, ctx }); return !!cond; }
  warn(cond, msg, ctx = "") { this.n++; if (!cond) this.w.push({ msg, ctx }); }
  fail(msg, ctx = "") { this.n++; this.f.push({ msg, ctx }); }
  print() {
    console.log(`\n${this.name}\n===============`);
    for (const x of this.f) console.log(`  FAIL  ${x.msg}${x.ctx ? " — " + x.ctx : ""}`);
    for (const x of this.w) console.log(`  warn  ${x.msg}${x.ctx ? " — " + x.ctx : ""}`);
    console.log(`  ${this.n} checks, ${this.f.length} failing, ${this.w.length} warning(s)`);
    return this.f.length === 0;
  }
}
