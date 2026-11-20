# Self-hosted analytics endpoint (gate G-6)

The site ships a privacy-preserving event layer (`assets/js/analytics.js`) with **five
defined events**: `page_view`, `outbound_click`, `disclosure_view`, `guide_read`,
`signup_intent`. The full spec lives on the site at `data-room/measurement.html`.

Until an endpoint is configured, the site **fails closed**: events are queued in the
browser (localStorage, max 50) and nothing is transmitted. Do Not Track / Global Privacy
Control disables sending entirely.

## Deploy (Cloudflare Workers + KV)

1. `npm create cloudflare@latest cc-collect` (or `wrangler init`) and replace the worker
   script with `analytics/worker.js`.
2. Create a KV namespace and bind it as `CC_EVENTS` in `wrangler.toml`:

   ```toml
   name = "cc-collect"
   main = "worker.js"
   compatibility_date = "2026-11-20"

   kv_namespaces = [
     { binding = "CC_EVENTS", id = "<your-kv-namespace-id>" }
   ]
   ```

3. `wrangler deploy`, note the endpoint URL (e.g. `https://cc-collect.example.workers.dev/api/collect`).
4. Point the site at it — add this tag to every page `<head>` (or set it once via the
   integration task and re-run `tools/check_site.py`):

   ```html
   <meta name="cc-endpoint" content="https://cc-collect.example.workers.dev/api/collect">
   ```

5. Verify with:

   ```bash
   curl -X POST https://cc-collect.example.workers.dev/api/collect \
     -H 'Content-Type: application/json' \
     -d '{"event":"page_view","ts":"2026-11-20T12:00:00Z","sid":"s-test","path":"/"}'
   ```

   Then check the KV day bucket `events/2026-11-20.jsonl`.

## Privacy properties (enforced in code)

| Property | Enforcement |
|---|---|
| No cookies | `analytics.js` uses `sessionStorage` for a random session id only |
| No IP storage | worker never reads or stores `request.headers.get("cf-connecting-ip")` |
| No user agent | worker drops the header; only `CF-IPCountry` (2-letter) is kept |
| No third parties | all requests go to your own origin |
| Consent signals | DNT/GPC = never send; endpoint unset = never send |
| Data minimization | event allowlist; every string field truncated |

## Notes

- The launch-list form posts only `signup_intent` (with the email *domain*, never the
  address). A real mailing list is a separate, owner-operated decision (see
  `suggestions.html`, proposal S-07).
- Do not point `cc-endpoint` at any third-party analytics vendor if the
  privacy-preserving claim on the site is to remain accurate.
