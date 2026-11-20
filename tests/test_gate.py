"""The build's compliance gate must fail on each defect it is meant to catch.

Each test copies the built site, injects one defect, and expects check_site() to report it.
"""
import importlib.util
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("build_site", ROOT / "tools" / "build_site.py")
bs = importlib.util.module_from_spec(spec)
sys.modules["build_site"] = bs
spec.loader.exec_module(bs)


class GateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = bs.build(check_only=False)
        cls.clean = bs.check_site(bs.DOCS, cls.d)
        assert cls.clean == [], cls.clean

    def mutate(self, rel, old, new):
        tmp = Path(tempfile.mkdtemp())
        out = tmp / "docs"
        shutil.copytree(bs.DOCS, out)
        p = out / rel
        text = p.read_text(encoding="utf-8")
        self.assertIn(old, text, f"fixture missing in {rel}")
        p.write_text(text.replace(old, new, 1), encoding="utf-8")
        try:
            return bs.check_site(out, self.d)
        finally:
            shutil.rmtree(tmp)

    def test_clean_site_passes(self):
        self.assertEqual(self.clean, [])

    def test_missing_footer_disclosure_fails(self):
        errs = self.mutate("index.html", 'id="footer-disclosure"', 'id="footer-x"')
        self.assertTrue(any("footer disclosure" in e for e in errs), errs)

    def test_unmarked_amazon_link_fails(self):
        errs = self.mutate("products/index.html", 'rel="sponsored nofollow noopener"', 'rel="noopener"')
        self.assertTrue(any("not marked sponsored" in e for e in errs), errs)

    def test_broken_internal_link_fails(self):
        errs = self.mutate("index.html", 'href="air-fryers/"', 'href="no-such-page/"')
        self.assertTrue(any("broken" in e for e in errs), errs)

    def test_published_tagged_link_fails_while_gate_closed(self):
        errs = self.mutate("link-validation/index.html", "<code class=\"wrap\">https://www.amazon.com/dp/B0CDY277D3",
                           "<a href=\"https://www.amazon.com/dp/B0CDY277D3?tag=shopnow047c-20\">x</a><code class=\"wrap\">https://www.amazon.com/dp/B0CDY277D3")
        self.assertTrue(any("tagged candidate" in e for e in errs), errs)

    def test_price_text_fails(self):
        errs = self.mutate("products/index.html", "Every entry in one table.", "Every entry, $74.99 today.")
        self.assertTrue(any("price" in e for e in errs), errs)

    def test_missing_dashboard_footer_link_fails(self):
        errs = self.mutate("guides/index.html", 'href="../ledger/"', 'href="../nowhere/"')
        self.assertTrue(any("does not link dashboard" in e for e in errs), errs)

    def test_gate_open_without_validation_fails_data_check(self):
        products = bs.load_json("products.json")
        products["products"][0]["candidate_validated"] = True
        errs = bs.validate_data({**self.d, "products": products})
        self.assertTrue(any("candidate_validated set without the gate" in e for e in errs), errs)


if __name__ == "__main__":
    unittest.main()
