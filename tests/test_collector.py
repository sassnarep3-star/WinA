import json
import sys
import tempfile
import threading
import unittest
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "analytics"))
import collector  # noqa: E402


class CleanEventTests(unittest.TestCase):
    def test_accepts_defined_event(self):
        key = collector.clean_event({"event": "outbound_click", "day": "2026-11-20", "path": "/air-fryers/",
                                     "link_id": "P-01", "destination_host": "www.amazon.com"})
        self.assertEqual(key, "2026-11-20|outbound_click|/air-fryers/||P-01|www.amazon.com|")

    def test_rejects_unknown_event(self):
        with self.assertRaises(ValueError):
            collector.clean_event({"event": "link_check_view", "day": "2026-11-20"})

    def test_rejects_undefined_field(self):
        with self.assertRaises(ValueError):
            collector.clean_event({"event": "page_view", "day": "2026-11-20", "ip": "203.0.113.5"})

    def test_rejects_query_string(self):
        with self.assertRaises(ValueError):
            collector.clean_event({"event": "page_view", "day": "2026-11-20", "path": "/x/?utm=1"})

    def test_requires_day(self):
        with self.assertRaises(ValueError):
            collector.clean_event({"event": "page_view", "day": "today"})

    def test_five_events_only(self):
        self.assertEqual(sorted(collector.ALLOWED),
                         ["disclosure_expand", "feed_click", "guide_read", "outbound_click", "page_view"])


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store_path = Path(self.tmp.name) / "counts.json"
        store = collector.Store(self.store_path)
        from http.server import HTTPServer
        self.srv = HTTPServer(("127.0.0.1", 0), collector.make_handler(store, "https://example.test"))
        self.port = self.srv.server_address[1]
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def tearDown(self):
        self.srv.shutdown()
        self.srv.server_close()
        self.tmp.cleanup()

    def post(self, body):
        req = urllib.request.Request(f"http://127.0.0.1:{self.port}/collect", data=json.dumps(body).encode(),
                                     headers={"Content-Type": "text/plain"}, method="POST")
        try:
            with urllib.request.urlopen(req) as r:
                return r.status
        except urllib.error.HTTPError as e:
            return e.code

    def test_counts_and_stores_no_ip(self):
        self.assertEqual(self.post({"event": "feed_click", "day": "2026-11-20", "path": "/"}), 204)
        self.assertEqual(self.post({"event": "feed_click", "day": "2026-11-20", "path": "/"}), 204)
        data = json.loads(self.store_path.read_text())
        self.assertEqual(list(data.values()), [2])
        self.assertNotIn("203.0.113", self.store_path.read_text())

    def test_rejects_bad_payload(self):
        self.assertEqual(self.post({"event": "nope", "day": "2026-11-20"}), 400)
        self.assertFalse(self.store_path.exists())


if __name__ == "__main__":
    unittest.main()
