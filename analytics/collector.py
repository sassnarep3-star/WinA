#!/usr/bin/env python3
"""Self-hosted collector for the five events in analytics/events.json.

Stores only daily counts per (day, event, path, link_id, destination_host, guide_slug).
It keeps no IP address, user agent, cookie, or other persistent identifier, and it
rejects any event name or field not defined in events.json.

Run on a server you control (see analytics/README.md):
    python3 analytics/collector.py --host 0.0.0.0 --port 8787 --store analytics/counts.json
Then set analyticsEndpoint in the site config (tools/build_site.py: analytics_endpoint).
"""

import argparse
import json
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
EVENTS = json.loads((HERE / "events.json").read_text(encoding="utf-8"))
ALLOWED = {e["name"]: e for e in EVENTS["events"]}
KEYS = ("path", "referrer_host", "link_id", "destination_host", "guide_slug")
MAX_BODY = 2048


def clean_event(payload):
    """Return (event, row_key) or raise ValueError. Unknown names and fields are rejected."""
    if not isinstance(payload, dict):
        raise ValueError("body must be a JSON object")
    name = payload.get("event")
    if name not in ALLOWED:
        raise ValueError(f"unknown event {name!r}")
    day = payload.get("day")
    if not isinstance(day, str) or len(day) != 10:
        raise ValueError("day must be YYYY-MM-DD")
    extra = set(payload) - {"event", "day"} - set(KEYS)
    if extra:
        raise ValueError(f"fields not defined for collection: {sorted(extra)}")
    fields = {}
    for k in KEYS:
        v = payload.get(k, "")
        if not isinstance(v, str) or len(v) > 200:
            raise ValueError(f"field {k} must be a short string")
        if v:
            fields[k] = v
    if "path" in fields and "?" in fields["path"]:
        raise ValueError("query strings are not collected")
    row = (day, name) + tuple(fields.get(k, "") for k in KEYS)
    return "|".join(row)


class Store:
    def __init__(self, path):
        self.path = Path(path)
        self.lock = threading.Lock()
        self.counts = json.loads(self.path.read_text(encoding="utf-8")) if self.path.exists() else {}

    def add(self, key):
        with self.lock:
            self.counts[key] = self.counts.get(key, 0) + 1
            tmp = self.path.with_suffix(".tmp")
            tmp.write_text(json.dumps(self.counts, indent=1, sort_keys=True), encoding="utf-8")
            tmp.replace(self.path)


def make_handler(store, allowed_origin):
    class Handler(BaseHTTPRequestHandler):
        server_version = "collector"

        def _cors(self):
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

        def do_OPTIONS(self):
            self.send_response(204)
            self._cors()
            self.end_headers()

        def do_POST(self):
            if self.path.split("?")[0] != "/collect":
                self.send_response(404)
                self._cors()
                self.end_headers()
                return
            length = int(self.headers.get("Content-Length", "0") or 0)
            if length <= 0 or length > MAX_BODY:
                self.send_response(413 if length > MAX_BODY else 400)
                self._cors()
                self.end_headers()
                return
            try:
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                key = clean_event(payload)
            except (ValueError, UnicodeDecodeError) as exc:
                self.send_response(400)
                self._cors()
                self.end_headers()
                self.wfile.write(str(exc).encode("utf-8"))
                return
            store.add(key)
            self.send_response(204)
            self._cors()
            self.end_headers()

        def log_message(self, fmt, *args):  # no request logging: no IP addresses kept
            return

    return Handler


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8787)
    ap.add_argument("--store", default=str(HERE / "counts.json"))
    ap.add_argument("--origin", default="https://sassnarep3-star.github.io", help="allowed site origin")
    args = ap.parse_args(argv)
    store = Store(args.store)
    srv = HTTPServer((args.host, args.port), make_handler(store, args.origin))
    print(f"collector on {args.host}:{args.port}, store {args.store}")
    srv.serve_forever()


if __name__ == "__main__":
    main(sys.argv[1:])
