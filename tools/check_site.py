#!/usr/bin/env python3
"""The Crisp Counter — automated compliance & integrity gate.

Runs over the static site and enforces the publishing rules that can be
automated (gates G-1..G-3 on data-room/compliance-gate.html):

  R-01  every HTML page has the disclosure strip (#disclosure) under the masthead
  R-02  every tagged Amazon link carries rel="sponsored"
  R-03  every row of every data table is source-linked or explicitly flagged
        (tables marked data-exempt="internal" are printed instead of failing)
  R-04  every internal link and asset reference resolves to a real file,
        and cross-page #fragments exist in their target
  R-05  every page has lang, <title>, meta description and a canonical link
  R-06  no placeholder text (TODO/FIXME/Lorem) ships
  R-07  sitemap.xml covers exactly the indexable pages
  R-08  feed.xml parses and its item links resolve
  R-09  every page repeats the Amazon Associate statement in the footer

Exit code 0 = pass. Any failure prints a report and exits 1.
"""

import os
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://sassnarep3-star.github.io/WinA/"

failures = []
notes = []


def fail(rule, path, msg):
    failures.append(f"[{rule}] {os.path.relpath(path, ROOT)}: {msg}")


def html_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules", ".github", "Unselected files"}]
        for name in sorted(filenames):
            if name.endswith(".html"):
                yield os.path.join(dirpath, name)


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


class LinkCollector(HTMLParser):
    """Collects start tags of interest from an HTML document."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []          # (href, rel, tag, attrs)
        self.tags = []           # raw html of start tags we may need
        self.ids = set()
        self.in_head = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "a" and "href" in a:
            self.links.append((a.get("href", ""), a.get("rel", ""), "a", a))
        if tag == "link" and "href" in a:
            self.links.append((a.get("href", ""), a.get("rel", ""), "link", a))
        if tag == "img" and "src" in a:
            self.links.append((a.get("src", ""), "", "img", a))
        if tag == "script" and "src" in a:
            self.links.append((a.get("src", ""), "", "script", a))
        if tag == "meta":
            self.tags.append(("meta", a))
        if tag == "html":
            self.tags.append(("html", a))
        if tag == "link":
            self.tags.append(("link", a))
        if tag == "title":
            self.tags.append(("title", a))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def parse(path):
    collector = LinkCollector()
    collector.feed(read(path))
    return collector


def strip_fragment(url):
    return url.split("#", 1)[0], (url.split("#", 1)[1] if "#" in url else "")


def local_target(path, href):
    """Return the filesystem path a relative href points at (or None if external)."""
    href = href.strip()
    if not href or href.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
        return None
    pure, _ = strip_fragment(href)
    pure = unquote(pure)
    if pure == "":
        return path  # same-file fragment
    if pure.startswith("/"):
        return os.path.join(ROOT, pure.lstrip("/"))
    return os.path.normpath(os.path.join(os.path.dirname(path), pure))


# ---------------------------------------------------------------- R-01 / R-09
def check_disclosures(path, text):
    if 'id="disclosure"' not in text:
        fail("R-01", path, "missing disclosure strip with id=\"disclosure\"")
    if "disclosure-block" not in text:
        fail("R-09", path, "missing footer disclosure block")
    elif "Amazon Associate" not in text:
        fail("R-09", path, "footer disclosure does not contain the Amazon Associate statement")


# ------------------------------------------------------------------------ R-02
def check_sponsored_links(path, collector):
    for href, rel, tag, attrs in collector.links:
        if tag != "a":
            continue
        if "tag=" in href and "amazon." in href:
            if "sponsored" not in rel:
                fail("R-02", path, f"tagged Amazon link without rel=sponsored: {href[:80]}")
        if "link.amazon/" in href:
            fail("R-02", path, f"short link must not ship on the site (quarantined to data room only): {href}")


# ------------------------------------------------------------------------ R-03
ROW_KEYWORDS = (
    "unverified", "pending", "buyer input", "no official", "no rows yet",
    "rowflag", "not a manufacturer", "left blank", "awaiting",
)

def check_table_rows(path, text):
    for m in re.finditer(r"<table\b[^>]*>", text):
        tag = m.group(0)
        if 'class="data"' not in tag:
            continue
        start = m.end()
        end = text.find("</table>", start)
        body = text[start:end if end != -1 else len(text)]
        if 'data-exempt="internal"' in tag:
            notes.append(f"[R-03] exempt(internal) table in {os.path.relpath(path, ROOT)} at byte {m.start()}")
            continue
        # Header rows describe columns, not findings — only data rows need sources.
        body = re.sub(r"<thead\b[^>]*>.*?</thead>", "", body, flags=re.S)
        for rm in re.finditer(r"<tr\b[^>]*>(.*?)</tr>", body, re.S):
            row = rm.group(1)
            has_anchor = "<a " in row
            has_flag = any(k in row.lower() for k in ROW_KEYWORDS)
            if not (has_anchor or has_flag):
                snippet = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", row))[:90]
                fail("R-03", path, f"table row lacks source link or unverified flag: …{snippet}…")


# ------------------------------------------------------------------------ R-04
def check_links(path, collector, cache):
    for href, rel, tag, attrs in collector.links:
        target = local_target(path, href)
        if target is None:
            continue
        pure, frag = strip_fragment(href)
        if not os.path.exists(target):
            fail("R-04", path, f"broken internal reference: {href}")
            continue
        if frag and target.endswith(".html"):
            if target not in cache:
                cache[target] = parse(target)
            if frag not in cache[target].ids:
                fail("R-04", path, f"missing fragment #{frag} in {os.path.relpath(target, ROOT)}")


# ------------------------------------------------------------------------ R-05
def check_head(path, text, collector):
    if not re.search(r"<html[^>]+lang=", text):
        fail("R-05", path, "missing lang attribute on <html>")
    if "<title>" not in text:
        fail("R-05", path, "missing <title>")
    if 'name="description"' not in text:
        fail("R-05", path, "missing meta description")
    if 'rel="canonical"' not in text:
        fail("R-05", path, "missing canonical link")


# ------------------------------------------------------------------------ R-06
PLACEHOLDER = re.compile(r"\b(TODO|FIXME|XXX|Lorem ipsum)\b")

def check_placeholders(path, text):
    for m in PLACEHOLDER.finditer(text):
        fail("R-06", path, f"placeholder text ships: {m.group(1)}")


# ------------------------------------------------------------ R-07 / R-08
def check_sitemap_and_feed():
    sitemap = os.path.join(ROOT, "sitemap.xml")
    feed = os.path.join(ROOT, "feed.xml")
    try:
        tree = ET.parse(sitemap)
    except Exception as exc:
        fail("R-07", sitemap, f"cannot parse: {exc}")
        return
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    listed = set()
    for loc in tree.getroot().findall(".//sm:loc", ns):
        url = loc.text.strip()
        if not url.startswith(BASE):
            fail("R-07", sitemap, f"loc not under site base: {url}")
            continue
        rel = unquote(url[len(BASE):]) or "index.html"
        target = os.path.join(ROOT, rel)
        if not os.path.exists(target):
            fail("R-07", sitemap, f"listed URL has no file: {url}")
        listed.add(os.path.normpath(target))

    for path in html_files():
        text = read(path)
        if 'name="robots"' in text and "noindex" in text:
            if os.path.normpath(path) in listed:
                fail("R-07", sitemap, f"noindex page listed in sitemap: {os.path.relpath(path, ROOT)}")
        else:
            if os.path.normpath(path) not in listed:
                fail("R-07", sitemap, f"indexable page missing from sitemap: {os.path.relpath(path, ROOT)}")

    try:
        ftree = ET.parse(feed)
    except Exception as exc:
        fail("R-08", feed, f"cannot parse: {exc}")
        return
    for link in ftree.getroot().findall(".//item/link"):
        url = (link.text or "").strip()
        if url.startswith(BASE):
            rel = unquote(url[len(BASE):])
            if rel and not os.path.exists(os.path.join(ROOT, rel)):
                fail("R-08", feed, f"feed item link has no file: {url}")
        else:
            fail("R-08", feed, f"feed item link not under site base: {url}")


def main():
    cache = {}
    pages = list(html_files())
    if not pages:
        print("no HTML pages found — failing")
        return 1
    for path in pages:
        text = read(path)
        collector = parse(path)
        cache[path] = collector
        check_disclosures(path, text)
        check_sponsored_links(path, collector)
        check_table_rows(path, text)
        check_head(path, text, collector)
        check_placeholders(path, text)
    for path in pages:
        check_links(path, cache[path], cache)
    check_sitemap_and_feed()

    print(f"checked {len(pages)} HTML pages")
    for note in notes:
        print("note:", note)
    if failures:
        print(f"\nFAILED — {len(failures)} violation(s):")
        for f in failures:
            print(" ", f)
        return 1
    print("PASS — gates G-1/G-2/G-3 satisfied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
