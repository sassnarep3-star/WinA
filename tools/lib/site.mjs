// Shared helpers for the tooling: one place that knows how this repo is shaped.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const OUT = join(ROOT, "docs");
export const load = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
export const cfg = load("config/site.config.json");
export const sources = load("data/sources.json");
export const flags = load("data/flags.json").flags;
export const products = load("data/products.json").products;
export const seasons = load("data/seasons.json").seasons;
export const categories = load("data/categories.json").categories;

export function walk(dir, filter = () => true, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, filter, acc);
    else if (filter(name)) acc.push(relative(OUT, full).split("\\").join("/"));
  }
  return acc;
}
export const htmlFiles = () => walk(OUT, (n) => n.endsWith(".html")).sort();
export const readOut = (rel) => readFileSync(join(OUT, rel), "utf8");

export function attrs(tag) {
  const out = {};
  const re = /([:@a-zA-Z0-9_-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = m[3] !== undefined ? m[3] : m[4];
  return out;
}
export function tags(html, name) {
  const re = new RegExp(`<${name}\\b[^>]*>`, "gi");
  return (html.match(re) || []).map((t) => attrs(t));
}
export class Report {
  constructor(title) {
    this.title = title;
    this.errors = [];
    this.warnings = [];
    this.checks = 0;
  }
  ok(cond, msg, where = "") {
    this.checks++;
    if (!cond) this.errors.push(where ? `${msg} — ${where}` : msg);
    return !!cond;
  }
  warn(cond, msg, where = "") {
    if (!cond) this.warnings.push(where ? `${msg} — ${where}` : msg);
  }
  add(n = 1) {
    this.checks += n;
  }
  fail(msg, where = "") {
    this.checks++;
    this.errors.push(where ? `${msg} — ${where}` : msg);
  }
  print() {
    const p = (s) => process.stdout.write(s + "\n");
    p(`\n${this.title}`);
    p("=".repeat(this.title.length));
    for (const e of this.errors) p(`  FAIL  ${e}`);
    for (const w of this.warnings) p(`  warn  ${w}`);
    p(`  ${this.errors.length ? "" : "all clear — "}${this.checks} checks, ${this.errors.length} failing, ${this.warnings.length} warning${this.warnings.length === 1 ? "" : "s"}`);
    return this.errors.length === 0;
  }
}
