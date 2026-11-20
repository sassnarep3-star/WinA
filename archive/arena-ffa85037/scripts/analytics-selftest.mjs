// Self-test for the collector contract.
//
// FLG-011 says "no collector deployed". The code for one exists in two places — the Cloudflare
// worker (_worker/collector.js) and the dependency-free server (scripts/analytics-server.mjs) —
// and neither had ever been executed against a request. That makes "deploy the collector" a
// claim about untested code, which is exactly the kind of claim this repository refuses to make.
//
// This file starts the collector on an ephemeral port with a temporary state directory, drives it
// the way the browser would, and asserts the properties the privacy story depends on:
//
//   1. the health endpoint lists exactly the five registered events — no more, no fewer
//   2. each registered event is accepted and stored
//   3. an unregistered event is refused (400) instead of being quietly recorded
//   4. a request from a foreign origin still gets a 200 pixel (a beacon must never fail
//      visibly) but is not stored
//   5. only the allow-listed keys survive: no referrer, no identifier, no query string
//   6. /summary aggregates the events that were stored, and nothing else
//   7. /summary honours SUMMARY_TOKEN when one is set
//   8. rows older than the retention window are pruned at boot
//   9. the wrong method or route is refused
//
// Nothing here touches the deployed site, the live state directory, or the site's own data files.
//
//   node scripts/analytics-selftest.mjs
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync, readdirSync, existsSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT, cfg } from "./lib/site.mjs";

const SERVER = join(ROOT, "scripts", "analytics-server.mjs");
const ORIGIN = new URL(cfg.site.origin).origin;
const EVENTS = cfg.governance.events.map((e) => e.name || e);
const ALLOWED_KEYS = ["day", "event", "path", "asin", "slot", "viewport"];

let checks = 0;
const failures = [];
const ok = (cond, msg) => {
  checks++;
  if (!cond) failures.push(msg);
  return !!cond;
};

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const waitForHealth = async (base, tries = 60) => {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(base + "/healthz");
      if (r.ok) return await r.json();
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
};

function startCollector(port, stateDir, env = {}) {
  const child = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      STATE_DIR: stateDir,
      DATA_DAYS: "30",
      ALLOWED_ORIGINS: ORIGIN,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", (d) => process.stderr.write(`[collector] ${d}`));
  return child;
}

const stop = (child) =>
  new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();
    child.on("exit", () => resolve());
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 2000).unref();
  });

/* --- source parity: the two collectors must not drift apart ----------------------
   The worker (_worker/collector.js) and the server (scripts/analytics-server.mjs) are two
   implementations of one contract. A contract that only one of them implements is how a
   measurement plan quietly records nothing useful, so the lists are compared here, in code,
   against the register that defines them. */
function sourceParity() {
  const worker = readFileSync(join(ROOT, "_worker", "collector.js"), "utf8");
  const server = readFileSync(SERVER, "utf8");
  const listIn = (src, name) => {
    const m = src.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
    if (!m) return null;
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).sort();
  };
  const rowKeys = (src) => {
    const m = src.match(/const row = \{([\s\S]*?)\n {4}\};/);
    if (!m) return null;
    // both `key: value` and the shorthand `key,` used in the worker's row literal
    return [...m[1].matchAll(/^\s*([a-z]+)\s*[,:]/gm)].map((x) => x[1]).sort();
  };
  const workerEvents = listIn(worker, "EVENTS");
  const workerKeys = listIn(worker, "ALLOWED_KEYS");
  const serverKeys = listIn(server, "ALLOWED_KEYS");
  ok(!!workerEvents, "the worker's event list could not be read from _worker/collector.js");
  ok(!!workerKeys, "the worker's key allow-list could not be read from _worker/collector.js");
  ok(!!serverKeys, "the server's key allow-list could not be read from scripts/analytics-server.mjs");
  if (workerEvents)
    ok(
      JSON.stringify(workerEvents) === JSON.stringify([...EVENTS].sort()),
      `the worker must accept exactly the registered events. Worker: ${workerEvents.join(", ")}. Register: ${EVENTS.join(", ")}`
    );
  if (workerKeys && serverKeys)
    ok(
      JSON.stringify(workerKeys) === JSON.stringify(serverKeys),
      `the two collectors must share one key allow-list. Worker: ${workerKeys.join(", ")}. Server: ${serverKeys.join(", ")}`
    );
  const workerRow = rowKeys(worker);
  const serverRow = rowKeys(server);
  ok(!!workerRow, "the worker's stored row could not be read from _worker/collector.js");
  ok(!!serverRow, "the server's stored row could not be read from scripts/analytics-server.mjs");
  if (workerRow && serverRow)
    ok(
      JSON.stringify(workerRow) === JSON.stringify(serverRow),
      `the two collectors must store the same fields. Worker: ${workerRow.join(", ")}. Server: ${serverRow.join(", ")}`
    );
  ok(
    /cfg\.governance\.events/.test(server),
    "the server must read its event list from the register, not from a private copy"
  );
}

async function main() {
  sourceParity();
  const stateDir = mkdtempSync(join(tmpdir(), "cs-analytics-selftest-"));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;

  // A row older than the retention window, written before boot, so the prune can be observed.
  writeFileSync(join(stateDir, "2020-01-01.jsonl"), JSON.stringify({ day: "2020-01-01", e: "page_view" }) + "\n");

  const child = startCollector(port, stateDir);
  try {
    const health = await waitForHealth(base);
    if (!ok(health && health.ok === true, "collector did not come up on its port")) return finish(stateDir, child);

    /* 1. the registered event set, exactly */
    ok(
      Array.isArray(health.events) && health.events.length === EVENTS.length && EVENTS.every((e) => health.events.includes(e)),
      `health endpoint must list exactly the ${EVENTS.length} registered events, got ${JSON.stringify(health.events)}`
    );
    ok(health.retention_days === 30, `retention should be reported as 30 days, got ${health.retention_days}`);

    /* 8. retention prune at boot */
    ok(!existsSync(join(stateDir, "2020-01-01.jsonl")), "a row older than the retention window must be pruned at boot");

    /* 2. each registered event is accepted and stored, in the shape the browser client sends:
          props nested under "p", exactly as assets/js/site.js and _worker/collector.js use them. */
    const payloads = {
      page_view: { e: "page_view", p: { path: "/guides/basket-vs-oven/" } },
      outbound_click: { e: "outbound_click", p: { asin: "B0CDY277D3", path: "/products/chefman-6-quart-dual-basket/", slot: "buybox" } },
      guide_read: { e: "guide_read", p: { path: "/guides/capacity/" } },
      compare_view: { e: "compare_view", p: { path: "/compare/" } },
      capture_intent: { e: "capture_intent", p: { path: "/", slot: "footer" } },
    };
    for (const name of EVENTS) {
      const body = { ...payloads[name], w: "m" };
      const r = await fetch(base + "/e", {
        method: "POST",
        headers: { "content-type": "application/json", origin: ORIGIN },
        body: JSON.stringify(body),
      });
      ok(r.status === 200, `${name}: expected 200, got ${r.status}`);
      ok((r.headers.get("content-type") || "").includes("image/gif"), `${name}: a beacon must answer with a pixel`);
      ok(r.headers.get("access-control-allow-origin") === ORIGIN, `${name}: the allowed origin must receive the CORS header`);
    }

    /* 3. an unregistered event is refused */
    const bad = await fetch(base + "/e", {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ e: "not_a_real_event", p: { path: "/" } }),
    });
    ok(bad.status === 400, `an unregistered event must be refused with 400, got ${bad.status}`);

    /* 4. a foreign origin gets a 200 pixel but is not stored */
    const foreign = await fetch(base + "/e", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://not-this-site.example" },
      body: JSON.stringify({ e: "page_view", p: { path: "/from-a-foreign-origin/" } }),
    });
    ok(foreign.status === 200, "a request from an unknown origin must still receive 200 so the beacon never fails visibly");
    ok(!foreign.headers.get("access-control-allow-origin"), "an unknown origin must not receive the CORS header");

    /* 5. only allow-listed keys survive, and the query string is stripped */
    await fetch(base + "/e", {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({
        e: "page_view",
        p: {
          path: "/guides/cleanup/?utm_source=newsletter&utm_medium=email",
          referrer: "https://somewhere.example/",
          email: "reader@example.com",
          userId: "abc-123",
        },
        w: "s",
      }),
    });

    /* 6. /summary aggregates only what was stored */
    const sum = await fetch(base + "/summary?days=1");
    const summary = await sum.json();
    ok(sum.status === 200, `/summary must answer 200, got ${sum.status}`);
    const totals = summary.totals || {};
    for (const name of EVENTS) ok((totals[name] || 0) >= 1, `${name}: expected the event to be stored, summary says ${totals[name]}`);
    ok(totals.page_view === 2, `page_view: expected 2 stored events (one clean, one with a query string), summary says ${totals.page_view}`);
    ok(!JSON.stringify(summary).includes("from-a-foreign-origin"), "a request from a foreign origin must not appear in the summary");
    ok(!JSON.stringify(summary).includes("reader@example.com"), "a payload field outside the allow-list must not be stored or echoed");
    ok(!JSON.stringify(summary).includes("somewhere.example"), "a referrer must not be stored");
    ok(!JSON.stringify(summary).includes("utm_source"), "the query string must be stripped before storage");
    const today = (summary.days || []).find((d) => d.day === new Date().toISOString().slice(0, 10)) || {};
    const asins = JSON.stringify(today.top_asins || []);
    ok(asins.includes("B0CDY277D3"), "the ASIN that earned the click must appear in the summary");

    /* 9. wrong method and unknown route are refused */
    const wrongMethod = await fetch(base + "/e", { method: "GET" });
    ok(wrongMethod.status === 405, `GET /e must be refused with 405, got ${wrongMethod.status}`);
    const missing = await fetch(base + "/nothing-here");
    ok(missing.status === 404, `an unknown route must answer 404, got ${missing.status}`);

    /* stored rows carry only the allow-listed keys */
    const day = new Date().toISOString().slice(0, 10);
    const file = join(stateDir, `${day}.jsonl`);
    if (ok(existsSync(file), "the collector wrote no rows for today")) {
      const rows = readdirSync(stateDir).length;
      ok(rows >= 1, "the state directory should hold one file per day");
      const { readFileSync } = await import("node:fs");
      const lines = readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
      const keys = new Set(lines.flatMap((r) => Object.keys(r)));
      ok(
        [...keys].every((k) => ALLOWED_KEYS.includes(k)),
        `stored rows must only carry allow-listed keys, found ${[...keys].filter((k) => !ALLOWED_KEYS.includes(k)).join(", ")}`
      );
      ok(lines.every((r) => !("email" in r) && !("userId" in r) && !("referrer" in r)), "a payload field outside the allow-list must never reach storage");
      ok(
        lines.every((r) => !r.path || !r.path.includes("?")),
        "the query string must be stripped from the stored path"
      );
      /* The row that matters: the click. If the collector cannot read the client's payload shape,
         it would record that a click happened and throw away which product earned it — the one
         number the whole measurement plan exists to produce. */
      const click = lines.find((r) => r.event === "outbound_click");
      if (ok(!!click, "the outbound click must be stored")) {
        ok(click.asin === "B0CDY277D3", `the click must keep its ASIN, stored ${JSON.stringify(click.asin)}`);
        ok(click.slot === "buybox", `the click must keep its slot, stored ${JSON.stringify(click.slot)}`);
        ok(click.path === "/products/chefman-6-quart-dual-basket/", `the click must keep the page it happened on, stored ${JSON.stringify(click.path)}`);
        ok(click.viewport === "m", `the click must keep the coarse viewport class, stored ${JSON.stringify(click.viewport)}`);
      }
      ok(lines.every((r) => r.viewport && ["s", "m", "l"].includes(r.viewport)), "the viewport class must be one of s, m, l");
    }
  } finally {
    await stop(child);
  }

  /* 7. /summary honours SUMMARY_TOKEN when one is set */
  const state2 = mkdtempSync(join(tmpdir(), "cs-analytics-selftest-"));
  const port2 = await freePort();
  const base2 = `http://127.0.0.1:${port2}`;
  const child2 = startCollector(port2, state2, { SUMMARY_TOKEN: "selftest-token" });
  try {
    const health = await waitForHealth(base2);
    if (ok(health && health.ok === true, "collector with SUMMARY_TOKEN did not come up")) {
      const denied = await fetch(base2 + "/summary");
      ok(denied.status === 401, `/summary without a token must answer 401, got ${denied.status}`);
      const allowed = await fetch(base2 + "/summary?token=selftest-token");
      ok(allowed.status === 200, `/summary with the right token must answer 200, got ${allowed.status}`);
    }
  } finally {
    await stop(child2);
    rmSync(state2, { recursive: true, force: true });
  }

  finish(stateDir, null);
}

function finish(stateDir, child) {
  if (child) stop(child);
  rmSync(stateDir, { recursive: true, force: true });
  console.log(`\ncollector self-test\n===================\n  ${checks} checks, ${failures.length} failing`);
  for (const f of failures) console.log(`  FAIL  ${f}`);
  if (!failures.length) console.log("\n  ✓ the collector honours its contract: five events, an allow-list, no identifiers, a token-protected summary.");
  console.log("\n  This proves the code path. It does not deploy anything and it does not enable the");
  console.log("  client — FLG-011 stays open until the owner hosts this and sets site.analyticsEndpoint.\n");
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error("collector self-test crashed:", err);
  process.exit(1);
});
