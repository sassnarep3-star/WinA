// Self-hosted collector — the same contract as _worker/collector.js, for a host without Workers.
//
// The project's stated measurement plan needs one thing the repository cannot supply: a server.
// This is a complete one, with no dependencies, so "we have no collector" (FLG-011) is a choice
// about where to run this file rather than a missing feature.
//
// The contract it implements is the one the browser client actually speaks (assets/js/site.js):
//
//   POST /e   {"e":"outbound_click","p":{"path":"/…","asin":"B0…","slot":"buybox"},"w":"m"}
//
// Props nested under "p", exactly as the worker reads them, and the stored row has the worker's
// field names and length limits — day, event, path, asin, slot, viewport. Switching hosts is a
// config change, not a re-instrumentation.
//
// Two deliberate differences from the worker, neither of which changes what is collected:
// this server answers with a 1×1 pixel instead of 204, and it refuses an unregistered event with
// 400 instead of a silent 204. A beacon ignores both; an operator does not.
//
//   node scripts/analytics-server.mjs
//   HOST=0.0.0.0 PORT=8080 STATE_DIR=/var/lib/cs DATA_DAYS=30 node scripts/analytics-server.mjs
//
// Privacy, in one line: a row is (day, event, path, asin, slot, viewport class) — nothing that
// survives a day boundary, and nothing that can be joined to a person. Amazon's Program Policies
// prohibit associating a sub-tag with a specific end user; this design cannot do that even by
// accident.
//
// scripts/analytics-selftest.mjs drives this file end to end and is run in CI.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cfg } from "./lib/site.mjs";

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8787);
const STATE = process.env.STATE_DIR || join(ROOT, ".analytics-state");
const KEEP_DAYS = Number(process.env.DATA_DAYS || 30);          // worker's documented retention
const SITE_ORIGIN = new URL(cfg.site.origin).origin; // browsers send scheme+host only, never the /WinA path
// ALLOWED_ORIGINS is a comma-separated environment string. The default allows this site's own
// origin and "null" (an opaque origin, e.g. a file:// page). Setting it replaces the default
// outright, so an operator can lock the collector down to one origin.
const ALLOWED_ORIGIN = new Set(
  (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [SITE_ORIGIN, "null"])
    .map((s) => s.trim())
    .filter(Boolean)
);
const EVENTS = new Set(cfg.governance.events.map((e) => e.name || e));
const ALLOWED_KEYS = new Set(["path", "asin", "slot", "e", "p", "w"]);
const MAX_BODY = 1024;

const dayKey = () => new Date().toISOString().slice(0, 10);
const file = (d) => join(STATE, `${d}.jsonl`);
const scrub = (v, max) => (typeof v === "string" ? v.replace(/[?#].*$/, "").replace(/[^\w\-./:]/g, "").slice(0, max) : "");

function record(row) {
  mkdirSync(STATE, { recursive: true });
  appendFileSync(file(row.day), JSON.stringify(row) + "\n");
}
function readDay(d) {
  const f = file(d);
  if (!existsSync(f)) return [];
  return readFileSync(f, "utf8").split("\n").filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
}
function prune() {
  if (!existsSync(STATE)) return 0;
  const cut = Date.now() - KEEP_DAYS * 864e5;
  let removed = 0;
  for (const f of readdirSync(STATE)) {
    const d = f.replace(/\.jsonl$/, "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(d + "T00:00:00Z").getTime() < cut) { rmSync(join(STATE, f)); removed++; }
  }
  return removed;
}
const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}=${v}`);
function summary(days = 14) {
  const out = { days: [], totals: {}, retention_days: KEEP_DAYS, note: "Aggregate counts only. No identifier that could be joined to a person was collected, so none can be leaked." };
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const rows = readDay(d);
    const by = {}, pages = {}, asins = {}, slots = {};
    for (const r of rows) {
      by[r.event] = (by[r.event] || 0) + 1;
      if (r.path) pages[r.path] = (pages[r.path] || 0) + 1;
      if (r.asin) asins[r.asin] = (asins[r.asin] || 0) + 1;
      if (r.slot) slots[`${r.event}:${r.slot}`] = (slots[`${r.event}:${r.slot}`] || 0) + 1;
      out.totals[r.event] = (out.totals[r.event] || 0) + 1;
    }
    out.days.push({ day: d, events: rows.length, by_event: by, top_pages: top(pages, 8), top_asins: top(asins, 8), slots: top(slots, 12) });
  }
  return out;
}
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
function send(res, code, body, cors = {}) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors });
  res.end(body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const origin = req.headers.origin || "";
  const cors = ALLOWED_ORIGIN.has(origin) ? { "access-control-allow-origin": origin, vary: "Origin" } : {};
  const store = ALLOWED_ORIGIN.size === 0 || ALLOWED_ORIGIN.has(origin) || origin === "";

  if (req.method === "OPTIONS")
    return res.writeHead(204, { "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type", "access-control-max-age": "86400", ...cors }).end();
  if (url.pathname === "/healthz") return send(res, 200, JSON.stringify({ ok: true, day: dayKey(), events: [...EVENTS], retention_days: KEEP_DAYS }), cors);
  if (url.pathname === "/summary") {
    const token = process.env.SUMMARY_TOKEN;
    if (token && url.searchParams.get("token") !== token) return send(res, 401, JSON.stringify({ error: "SUMMARY_TOKEN required" }), cors);
    return send(res, 200, JSON.stringify(summary(Math.min(Number(url.searchParams.get("days") || 14), 90)), null, 2), cors);
  }
  if (url.pathname !== "/e" && url.pathname !== "/collect") return send(res, 404, JSON.stringify({ routes: ["/e (POST)", "/summary?days=14", "/healthz"] }), cors);
  if (req.method !== "POST") return send(res, 405, JSON.stringify({ error: "POST only" }), cors);

  let body = "";
  req.on("data", (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
  req.on("end", () => {
    let p;
    try { p = JSON.parse(body || "{}"); } catch { return send(res, 400, JSON.stringify({ error: "invalid json" }), cors); }
    // The client sends its props nested under "p" (assets/js/site.js) — the same shape the
    // Cloudflare worker reads. A flat body is accepted as a fallback for a hand-written caller;
    // nothing else is read, so a future client cannot widen what is collected by sending more.
    const props = p.p && typeof p.p === "object" ? p.p : p;
    // Exactly the worker's row: a day bucket, the event name, a page path, an ASIN, a slot and a
    // coarse viewport class. Same field names, same length limits, same scrubbing.
    const row = {
      day: /^\d{4}-\d{2}-\d{2}$/.test(p.t) ? p.t : dayKey(),
      event: scrub(p.e, 40),
      path: scrub(props.path, 120),
      asin: scrub(props.asin, 12),
      slot: scrub(props.slot, 24),
      viewport: ["s", "m", "l"].includes(p.w) ? p.w : "l"
    };
    for (const k of Object.keys(row)) if (!row[k]) delete row[k];
    if (!EVENTS.has(row.event)) return send(res, 400, JSON.stringify({ error: `unknown event "${row.event}"`, allowed: [...EVENTS] }), cors);
    if (store) record(row);
    // A rejected origin gets the same 200 and the same pixel: a beacon must never fail visibly.
    res.writeHead(200, { "content-type": "image/gif", "cache-control": "no-store", ...cors });
    res.end(GIF);
  });
});

server.listen(PORT, HOST, () => {
  const removed = prune();
  process.stdout.write(
    `counter space collector — http://${HOST}:${PORT}
  storing     ${STATE} (one .jsonl per UTC day; retention ${KEEP_DAYS} days, pruned ${removed} at boot)
  events      ${[...EVENTS].join(", ")}
  origins     ${ALLOWED_ORIGIN.size ? [...ALLOWED_ORIGIN].join(", ") : "any (set ALLOWED_ORIGINS before exposing this)"}
  summary     http://${HOST}:${PORT}/summary${process.env.SUMMARY_TOKEN ? " (token protected)" : " (OPEN — set SUMMARY_TOKEN before exposing this)"}
  client side set cfg.analyticsEnabled = true and cfg.analyticsEndpoint = this origin + "/e", then rebuild.
`
  );
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
