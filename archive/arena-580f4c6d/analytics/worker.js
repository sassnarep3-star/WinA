// The Crisp Counter — first-party analytics endpoint (Cloudflare Worker)
// Deploy: see analytics/README.md. Privacy posture:
//   * accepts only the five defined events, drops everything else
//   * never stores IP addresses or user-agent strings (country only, if present)
//   * stores JSON lines in Workers KV under day buckets for self-hosted reporting
//   * CORS allows only the site origin(s) in ALLOWED below

const ALLOWED = [
  "https://sassnarep3-star.github.io",
  "http://localhost:8788"
];
const EVENTS = new Set([
  "page_view",
  "outbound_click",
  "disclosure_view",
  "guide_read",
  "signup_intent"
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method === "GET" && new URL(request.url).pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "cc-collect" }), {
        headers: { "Content-Type": "application/json", ...cors }
      });
    }
    if (request.method !== "POST" || new URL(request.url).pathname !== "/api/collect") {
      return new Response("not found", { status: 404, headers: cors });
    }
    if (ALLOWED.length && origin && !ALLOWED.includes(origin)) {
      return new Response("origin not allowed", { status: 403, headers: cors });
    }

    let body;
    try { body = await request.json(); } catch (e) {
      return new Response("bad json", { status: 400, headers: cors });
    }
    if (!body || !EVENTS.has(body.event)) {
      return new Response("unknown event", { status: 400, headers: cors });
    }

    const record = {
      event: body.event,
      ts: body.ts || new Date().toISOString(),
      sid: String(body.sid || "").slice(0, 40),
      path: String(body.path || "").slice(0, 200),
      target_host: String(body.target_host || "").slice(0, 120),
      asin: String(body.asin || "").slice(0, 20),
      placement: String(body.placement || "").slice(0, 60),
      guide: String(body.guide || "").slice(0, 120),
      country: request.headers.get("CF-IPCountry") || ""
      // deliberately NO IP address, NO user agent
    };

    const day = record.ts.slice(0, 10);
    const key = `events/${day}.jsonl`;
    const prev = (await env.CC_EVENTS.get(key)) || "";
    await env.CC_EVENTS.put(key, prev + JSON.stringify(record) + "\n");

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...cors }
    });
  }
};
