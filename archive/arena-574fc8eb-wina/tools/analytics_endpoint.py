#!/usr/bin/env python3
"""Self-hosted, privacy-preserving analytics endpoint for WinA (FLG-010 / Q-08).

Standard library only. Designed to run on any small host the owner controls —
GitHub Pages cannot run it (static hosting only).

Privacy properties:
  * does NOT log client IP or User-Agent
  * stores events as append-only NDJSON: {event, ts, path, ...payload}
  * no cookies, no identifiers, no third-party calls

Usage:
  python3 tools/analytics_endpoint.py --port 8080 \
      --out data/analytics-events.ndjson

  GET  /healthz  -> 200 {"ok": true, "events": <count>}
  POST /e        -> accepts one JSON object or a JSON array of objects,
                    each with a string "event" in the five-event allowlist.
                    Unknown events are dropped (400 for single, dropped for batches).
"""

import argparse
import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ALLOWED_EVENTS = {
    "page_view",
    "outbound_click",
    "affiliate_click",
    "search_query",
    "article_read",
}

_lock = threading.Lock()


def append_events(out_path: str, events: list) -> int:
    kept = [e for e in events if isinstance(e, dict) and e.get("event") in ALLOWED_EVENTS]
    if not kept:
        return 0
    with _lock:
        os.makedirs(os.path.dirname(os.path.abspath(out_path)) or ".", exist_ok=True)
        with open(out_path, "a", encoding="utf-8") as fh:
            for e in kept:
                # Strip anything unexpected — never persist unknown fields.
                clean = {"event": e["event"], "ts": e.get("ts"), "path": e.get("path")}
                for k in ("referrer_host", "host", "product_id", "q_length"):
                    if k in e:
                        clean[k] = e[k]
                fh.write(json.dumps(clean, separators=(",", ":")) + "\n")
    return len(kept)


def count_events(out_path: str) -> int:
    if not os.path.exists(out_path):
        return 0
    with _lock:
        with open(out_path, "r", encoding="utf-8") as fh:
            return sum(1 for line in fh if line.strip())


def make_handler(out_path: str):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):  # silence default access log (no IPs on stdout)
            pass

        def _send(self, code: int, payload: dict):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path.split("?")[0] == "/healthz":
                self._send(200, {"ok": True, "events": count_events(out_path)})
            else:
                self._send(404, {"ok": False, "error": "not found"})

        def do_OPTIONS(self):
            self._send(204, {})

        def do_POST(self):
            if self.path.split("?")[0] != "/e":
                self._send(404, {"ok": False, "error": "not found"})
                return
            try:
                length = int(self.headers.get("Content-Length") or 0)
                if length <= 0 or length > 64_000:
                    self._send(400, {"ok": False, "error": "bad length"})
                    return
                raw = self.rfile.read(length)
                data = json.loads(raw.decode("utf-8"))
                events = data if isinstance(data, list) else [data]
                kept = append_events(out_path, events)
                if kept:
                    self._send(202, {"ok": True, "accepted": kept})
                else:
                    self._send(400, {"ok": False, "error": "no allowed events"})
            except (ValueError, UnicodeDecodeError):
                self._send(400, {"ok": False, "error": "invalid json"})

    return Handler


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="WinA self-hosted analytics endpoint")
    ap.add_argument("--port", type=int, default=8080)
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--out", default=os.path.join("data", "analytics-events.ndjson"))
    args = ap.parse_args(argv)

    server = ThreadingHTTPServer((args.host, args.port), make_handler(args.out))
    print(f"WinA analytics endpoint on http://{args.host}:{args.port} -> {args.out}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
