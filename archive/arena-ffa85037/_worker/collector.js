/**
 * Counter Space — first-party event collector
 * ============================================================
 * Deploy target: Cloudflare Worker (or any edge runtime with the
 * same fetch signature). No third-party dependency.
 *
 * What this does NOT do, by design:
 *   - set or read cookies
 *   - store IP addresses, user agents, or referrers
 *   - build any cross-site or persistent identifier
 *   - forward anything to a third party
 *
 * What it stores: one row per event containing a day bucket, the
 * event name, a page path, an ASIN, and a coarse viewport class.
 * Raw rows are intended to be discarded after 30 days; only daily
 * aggregates should persist. That retention step is the deployer's
 * responsibility and is documented in the README.
 *
 * Deploy:
 *   wrangler deploy _worker/collector.js --name cs-collector
 * Then set CS_CONFIG.analyticsEndpoint in the build and rebuild.
 */

const EVENTS = new Set([
  "page_view",
  "outbound_click",
  "guide_read",
  "compare_view",
  "capture_intent"
]);

// Only these keys survive. Anything else the client sends is dropped,
// so a future client cannot accidentally widen what is collected.
const ALLOWED_KEYS = new Set(["path", "asin", "slot", "e", "p", "w"]);

const MAX_BODY = 1024;

function scrub(value, max) {
  if (typeof value !== "string") return "";
  // Strip anything that could carry an identifier or smuggle markup.
  return value
    .replace(/[?#].*$/, "")
    .replace(/[^\w\-./:]/g, "")
    .slice(0, max);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);

    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (!allowed.includes(origin)) {
      // Silently accept but do not store: a rejected beacon is not
      // worth an error the reader could see.
      return new Response(null, { status: 204 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return new Response(null, { status: 204 });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return new Response(null, { status: 204 });
    }

    const event = typeof body.e === "string" ? body.e : "";
    if (!EVENTS.has(event)) {
      return new Response(null, { status: 204 });
    }

    const props = body.p && typeof body.p === "object" ? body.p : {};
    const row = {
      day: new Date().toISOString().slice(0, 10),
      event,
      path: scrub(props.path, 120),
      asin: scrub(props.asin, 12),
      slot: scrub(props.slot, 24),
      viewport: ["s", "m", "l"].includes(body.w) ? body.w : "l"
    };

    // Drop any key that is not on the allow-list, defensively.
    for (const k of Object.keys(row)) {
      if (k !== "day" && k !== "event" && !ALLOWED_KEYS.has(k)) delete row[k];
    }

    if (env.EVENTS) {
      try {
        await env.EVENTS.put(`evt:${row.day}:${crypto.randomUUID()}`, JSON.stringify(row), {
          expirationTtl: 60 * 60 * 24 * 30 // 30-day retention
        });
      } catch {
        /* never fail a reader request because storage failed */
      }
    }

    return new Response(null, { status: 204, headers: cors });
  }
};
