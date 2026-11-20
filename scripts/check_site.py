#!/usr/bin/env python3
"""WinA release gate — run after scripts/build_site.py, before every push.

  python3 scripts/check_site.py        # exit 0 = pass, exit 1 = violation

Checks (the "gate in front of the parts that cannot be automated"):
  1.  disclosure strip present above <main> on every page, footer disclosure too
  2.  disclosure uses the exact Operating Agreement §5 sentence
  3.  every amazon.com anchor carries rel="sponsored"
  4.  every affiliate CTA (data-aff) carries tag=shopnow047c-20
  5.  every data-table body row links to an official source (allowed hosts)
  6.  all external links are on the allowed official-host whitelist
  7.  every internal link resolves to a file that exists
  8.  sitemap.xml covers every shipped HTML page (and vice versa)
  9.  feed.xml exists and contains one item per guide
 10.  search-index.json covers every shipped HTML page
 11.  each page has <title>, meta description, canonical
 12.  data ↔ page sync: all flags, questions, suggestions, product tokens rendered
 13.  no conflict markers / TODO / FIXME / placeholder tokens in shipped HTML
 14.  campaign ledger has a header and zero data rows (empty by design)
"""

import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRACK = "shopnow047c-20"
DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases."

ALLOWED_HOSTS = {
    "www.amazon.com", "amazon.com", "link.amazon",
    "affiliate-program.amazon.com",
    "developers.google.com", "search.google.com",
    "www.ftc.gov", "ftc.gov",
    "docs.github.com", "github.com",
    "www.schema.org", "schema.org", "www.sitemaps.org", "sitemaps.org",
    "www.w3.org", "w3.org",
}

HTML_PAGES = [
    "index.html", "products.html", "guides/index.html", "analysis.html",
    "suggestions.html", "questions.html", "executive-summary.html",
    "flagged.html", "platform.html", "search.html",
    "guides/basket-or-oven.html", "guides/capacity-checklist.html",
    "guides/cleanup-and-counter-space.html", "guides/multi-function-questions.html",
    "guides/picking-a-meat-thermometer.html",
]

GUIDE_COUNT = 5

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def host_of(url):
    m = re.match(r"https?://([^/?#]+)", url)
    return m.group(1).lower() if m else None


def load_data(name):
    with open(os.path.join(ROOT, "data", name), encoding="utf-8") as fh:
        return json.load(fh)


def check_page(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        err(f"{rel}: missing page")
        return None
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()

    # 1. disclosure strip above <main>
    strip = raw.find('class="disclosure-strip"')
    main = raw.find("<main>")
    if strip == -1:
        err(f"{rel}: disclosure strip missing")
    elif main == -1 or strip > main:
        err(f"{rel}: disclosure strip not above <main>")

    # footer disclosure
    if raw.count(DISCLOSURE) < 2:
        err(f"{rel}: disclosure must appear at least twice (strip + footer), found {raw.count(DISCLOSURE)}")
    if DISCLOSURE not in raw:
        err(f"{rel}: exact OA §5 sentence missing")

    # 11. head essentials
    if "<title>" not in raw or "</title>" not in raw:
        err(f"{rel}: missing <title>")
    if 'rel="canonical"' not in raw:
        err(f"{rel}: missing canonical")
    if 'name="description"' not in raw:
        err(f"{rel}: missing meta description")

    # 3/4. anchors
    for m in re.finditer(r"<a\s+[^>]*href=\"([^\"]+)\"[^>]*>", raw):
        tag = m.group(0)
        href = m.group(1)
        host = host_of(href)
        if host:
            if host not in ALLOWED_HOSTS:
                err(f"{rel}: external host not on whitelist: {host} ({href})")
            if host in ("www.amazon.com", "amazon.com"):
                if 'rel="sponsored' not in tag:
                    err(f"{rel}: amazon link missing rel=sponsored → {href}")
                if "data-aff" in tag and f"tag={TRACK}" not in href:
                    err(f"{rel}: affiliate CTA missing tag={TRACK} → {href}")
        else:
            # internal link (relative, anchor, or mailto skipped)
            if href.startswith("#") or href.startswith("mailto:"):
                continue
            target = href.split("#")[0].split("?")[0]
            if not target:
                continue
            base_dir = os.path.dirname(path)
            resolved = os.path.normpath(os.path.join(base_dir, target))
            if not os.path.exists(resolved):
                err(f"{rel}: broken internal link → {href}")

    # 5. data tables: every body row needs an official-source anchor
    for tbl in re.finditer(r'<table class="data"[^>]*>(.*?)</table>', raw, re.S):
        table = tbl.group(1)
        caption = re.search(r"<caption>(.*?)</caption>", table, re.S)
        cap = html.unescape(re.sub(r"<[^>]+>", "", caption.group(1))).strip() if caption else "?"
        body = re.search(r"<tbody>(.*?)</tbody>", table, re.S)
        if not body:
            continue
        for row in re.finditer(r"<tr>(.*?)</tr>", body.group(1), re.S):
            cells = row.group(1)
            if "<td" not in cells:
                continue  # header echo
            anchors = re.findall(r'<a\s+[^>]*href="(https?://[^"]+)"', cells)
            official = [a for a in anchors if host_of(a) in ALLOWED_HOSTS]
            if not official:
                snippet = html.unescape(re.sub(r"<[^>]+>", " ", cells))[:80]
                err(f"{rel}: table '{cap}' row without official source link → {snippet}")

    # 13. hygiene
    for bad in ("<<<<<<<", ">>>>>>>", "=======", "TODO", "FIXME", "PLACEHOLDER"):
        if bad in raw:
            err(f"{rel}: forbidden token {bad!r} present")

    return raw


def main():
    # 1-13 per page
    for rel in HTML_PAGES:
        check_page(rel)

    # 8. sitemap coverage
    sm_path = os.path.join(ROOT, "sitemap.xml")
    if not os.path.exists(sm_path):
        err("sitemap.xml missing")
    else:
        try:
            tree = ET.parse(sm_path)
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            locs = {e.text.rstrip("/") for e in tree.getroot().findall(".//sm:loc", ns) if e.text}
            base = "https://sassnarep3-star.github.io/WinA"
            expected = {base + "/" + p for p in HTML_PAGES}
            missing = expected - locs
            extra = locs - expected
            for m in sorted(missing):
                err(f"sitemap.xml missing page: {m}")
            for e in sorted(extra):
                warn(f"sitemap.xml lists non-shipped URL: {e}")
        except ET.ParseError as exc:
            err(f"sitemap.xml not well-formed: {exc}")

    # 9. feed
    feed_path = os.path.join(ROOT, "feed.xml")
    if not os.path.exists(feed_path):
        err("feed.xml missing")
    else:
        try:
            ftree = ET.parse(feed_path)
            items = ftree.getroot().findall(".//item")
            if len(items) != GUIDE_COUNT:
                err(f"feed.xml has {len(items)} items, expected {GUIDE_COUNT}")
        except ET.ParseError as exc:
            err(f"feed.xml not well-formed: {exc}")

    # robots
    if not os.path.exists(os.path.join(ROOT, "robots.txt")):
        err("robots.txt missing")
    else:
        with open(os.path.join(ROOT, "robots.txt"), encoding="utf-8") as fh:
            if "sitemap:" not in fh.read().lower():
                err("robots.txt does not reference the sitemap")

    # 10. search index
    si_path = os.path.join(ROOT, "search-index.json")
    if not os.path.exists(si_path):
        err("search-index.json missing")
    else:
        with open(si_path, encoding="utf-8") as fh:
            idx = json.load(fh)
        urls = {e["url"] for e in idx}
        for p in HTML_PAGES:
            if p not in urls:
                err(f"search-index.json missing page: {p}")

    # 12. data ↔ page sync
    flags = load_data("flags.json")
    with open(os.path.join(ROOT, "flagged.html"), encoding="utf-8") as fh:
        flagged_raw = fh.read()
    for f in flags["flags"]:
        if f["id"] not in flagged_raw:
            err(f"flag {f['id']} not rendered on flagged.html")

    questions = load_data("questions.json")
    with open(os.path.join(ROOT, "questions.html"), encoding="utf-8") as fh:
        q_raw = fh.read()
    for q in questions["questions"]:
        if q["id"] not in q_raw:
            err(f"question {q['id']} not rendered on questions.html")

    sugg = load_data("suggestions.json")
    with open(os.path.join(ROOT, "suggestions.html"), encoding="utf-8") as fh:
        s_raw = fh.read()
    for s in sugg["suggestions"]:
        if s["id"] not in s_raw:
            err(f"suggestion {s['id']} not rendered on suggestions.html")
    for p in sugg["paths"]:
        if p["id"] not in s_raw:
            err(f"path {p['id']} not rendered on suggestions.html")

    products = load_data("products.json")
    with open(os.path.join(ROOT, "products.html"), encoding="utf-8") as fh:
        p_raw = fh.read()
    for p in products["products"]:
        if p["submitted_token"] not in p_raw:
            err(f"product token {p['submitted_token']} not rendered on products.html")
        if p["observed_redirect_target"] not in p_raw:
            err(f"observed destination {p['observed_redirect_target']} not rendered on products.html")
        # intent fields must stay blank on the page
        if p["intended_asin"] is None and re.search(r"intended[^<]*<[^>]+>\s*B0", p_raw):
            warn("possible intended-ASIN value present while data says null")

    # 14. ledger empty
    ledger = os.path.join(ROOT, "data", "campaign-ledger.csv")
    with open(ledger, encoding="utf-8") as fh:
        lines = [l for l in fh.read().splitlines() if l.strip()]
    if not lines or not lines[0].startswith("timestamp,source,channel"):
        err("campaign-ledger.csv missing header")
    if len(lines) > 1:
        err(f"campaign-ledger.csv has {len(lines) - 1} data rows; ledger must stay empty until authorized reports exist")

    # analytics events documented (5)
    ev = load_data("analytics-events.json")
    if len(ev["events"]) != 5:
        err(f"expected exactly 5 documented events, found {len(ev['events'])}")

    # summary
    pages = len([p for p in HTML_PAGES if os.path.exists(os.path.join(ROOT, p))])
    print(f"pages checked : {pages}/{len(HTML_PAGES)}")
    print(f"warnings      : {len(warnings)}")
    for w in warnings:
        print("  WARN ", w)
    if errors:
        print(f"FAIL — {len(errors)} violation(s):")
        for e in errors:
            print("  ✗", e)
        return 1
    print("PASS — disclosure, sponsored links, source coverage, links, sitemap/feed/search, data sync all green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
