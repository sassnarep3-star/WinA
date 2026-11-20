// Reference measurement endpoint — the counting half of the programme.
//
// Deliberately boring and deliberately private:
//   • no cookies, no localStorage, no fingerprinting, no IP retained, no user agent stored
//   • aggregates are keyed by UTC day, so a count cannot be joined to a person
//     (Amazon's Program Policies prohibit associating Associates reporting identifiers with
//      specific end users — this design cannot violate that even by accident)
//   • no secrets: the Associates credentials never touch this process
//   • one JSON file per day under tools/.analytics-state/ — deletion is a folder delete
//
//   node tools/analytics-server.mjs                      # 127.0.0.1:8787
//   HOST=0.0.0.0 PORT=8080 STATE_DIR=/var/lib/preheat node tools/analytics-server.mjs
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cfg } from "./lib/site.mjs";

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8787);
const STATE = process.env.STATE_DIR || join(ROOT, "tools", ".analytics-state");
const EVENTS = new Set(load("data/events.json").events.map((e) => e.name));
const LINKS = existsSync(join(ROOT, "data", "link-map.json")) ? load("data/link-map.json").links : {};
const MAX_BODY = 2048;
const RATE_WINDOW = 60_000;
const RATE_MAX = Number(process.env.RATE_MAX || 60);
const ALLOW_ORIGIN = new Set([cfg.baseUrl, "null"]);

function load(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}
const buckets = new Map(); // per-origin minute bucket — a counter, not a log
function rateOk(origin) {
  const now = Date.now();
  const b = buckets.get(origin) || { n: 0, at: now };
  if (now - b.at > RATE_WINDOW) { b.n = 0; b.at = now; }
  b.n++;
  buckets.set(origin, b);
  return b.n <= RATE_MAX;
}
const dayKey = () => new Date().toISOString().slice(0, 10);
const file = (day) => join(STATE, `${day}.jsonl`);
function record(row) {
  mkdirSync(STATE, { recursive: true });
  appendFileSync(file(row.t), JSON.stringify(row) + "\n");
}
function readDay(day) {
  const f = file(day);
  if (!existsSync(f)) return [];
  return readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

function send(res, code, body, headers = {}) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers });
  res.end(body);
}
function summary(days = 14) {
  const out = { days: [], totals: {}, links_enabled: cfg.affiliate.linksEnabled, note: "Aggregate counts only. No identifier in this response can be traced to a person, and none was collected." };
  const totals = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const rows = readDay(d);
    const byEvent = {};
    const byPage = {};
    const byProduct = {};
    const bySlot = {};
    for (const r of rows) {
      byEvent[r.e] = (byEvent[r.e] || 0) + 1;
      if (r.p) byPage[r.p] = (byPage[r.p] || 0) + 1;
      if (r.l) byProduct[r.l] = (byProduct[r.l] || 0) + 1;
      if (r.slot) bySlot[`${r.e}:${r.slot}`] = (bySlot[`${r.e}:${r.slot}`] || 0) + 1;
      totals[r.e] = (totals[r.e] || 0) + 1;
    }
    out.days.push({ day: d, events: rows.length, by_event: byEvent, top_pages: top(byPage, 8), top_products: top(byProduct, 8), slots: top(bySlot, 12) });
  }
  out.totals = totals;
  return out;
}
const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}=${v}`);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const origin = req.headers.origin || "null";
  if (!rateOk(origin)) return send(res, 429, JSON.stringify({ error: "rate limit" }));

  if (req.method === "OPTIONS") {
    return res.writeHead(204, { "access-control-allow-origin": origin, "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "600" }).end();
  }
  const cors = ALLOW_ORIGIN.has(origin) || ALLOW_ORIGIN.has(origin + "/") ? { "access-control-allow-origin": origin } : {};

  // health
  if (url.pathname === "/healthz") return send(res, 200, JSON.stringify({ ok: true, day: dayKey(), events: [...EVENTS], link_routes: Object.keys(LINKS).length }), cors);

  // counted redirect — only for routes the build approved
  const click = url.pathname.match(/^\/c\/([a-z0-9-]+)$/i);
  if (click) {
    const target = LINKS[click[1]];
    if (!target) {
      record({ e: "gate_block", p: "/c/" + click[1], l: click[1], reason: "no-approved-route", t: dayKey() });
      return send(res, 410, JSON.stringify({ error: "This link id has no approved route.", why: "A product appears in data/link-map.json only when its listing is verified and links are enabled in config. That is a compliance gate, not a bug.", do: "Answer Q-01, run npm run collect, then rebuild." }), cors);
    }
    record({ e: "outbound_click", p: (req.headers.referer || "").slice(0, 120) || "direct", l: click[1], slot: "redirector", t: dayKey() });
    res.writeHead(302, { location: target.href, "cache-control": "no-store", "referrer-policy": "no-referrer-when-downgrade", ...cors });
    return res.end();
  }

  // event sink
  if (url.pathname === "/e") {
    if (req.method !== "POST") return send(res, 405, JSON.stringify({ error: "POST only" }), cors);
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > MAX_BODY) req.destroy(); });
    req.on("end", () => {
      let payload;
      try {
        payload = JSON.parse(body || "{}");
      } catch {
        return send(res, 400, JSON.stringify({ error: "invalid json" }), cors);
      }
      const row = { e: String(payload.e || "").slice(0, 40), p: String(payload.p || "").slice(0, 200), l: String(payload.l || "").slice(0, 60), t: /^\d{4}-\d{2}-\d{2}$/.test(payload.t) ? payload.t : dayKey() };
      if (payload.slot) row.slot = String(payload.slot).slice(0, 30);
      if (payload.reason) row.reason = String(payload.reason).slice(0, 40);
      if (payload.ref) row.ref = String(payload.ref).slice(0, 60);
      if (!EVENTS.has(row.e)) return send(res, 400, JSON.stringify({ error: `unknown event "${row.e}"`, allowed: [...EVENTS] }), cors);
      if (!row.p.startsWith("/")) return send(res, 400, JSON.stringify({ error: "p must be a path on this site" }), cors);
      record(row);
      res.writeHead(200, { "content-type": "image/gif", "cache-control": "no-store", ...cors });
      res.end(GIF);
    });
    return;
  }

  // summary — protect it: a shared deployment should not publish its numbers to the world
  if (url.pathname === "/summary") {
    const token = process.env.SUMMARY_TOKEN;
    if (token && url.searchParams.get("token") !== token) return send(res, 401, JSON.stringify({ error: "SUMMARY_TOKEN required" }), cors);
    const days = Math.min(Number(url.searchParams.get("days") || 14), 90);
    return send(res, 200, JSON.stringify(summary(days), null, 2), cors);
  }

  send(res, 404, JSON.stringify({ routes: ["/healthz", "/e (POST)", "/c/<linkId>", "/summary?days=14"], note: "This endpoint counts events for one static site. It stores no cookies and no personal data." }), cors);
});

server.listen(PORT, HOST, () => {
  process.stdout.write(
    `preheat collector on http://${HOST}:${PORT}
  state dir    ${STATE}   (one .jsonl per UTC day; delete the folder to delete everything)
  events       ${[...EVENTS].join(", ")}
  link routes  ${Object.keys(LINKS).length}${Object.keys(LINKS).length ? "" : " — empty while links are disabled, so /c/* returns 410 by design"}
  summary      http://${HOST}:${PORT}/summary${process.env.SUMMARY_TOKEN ? " (token protected)" : " (open — set SUMMARY_TOKEN before exposing this)"}
`
  );
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
