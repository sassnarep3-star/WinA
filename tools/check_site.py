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
  R-06  no placeholder text (TODO/FIXME/Lorem) or unresolved merge-conflict
        markers ship
  R-07  sitemap.xml covers exactly the indexable pages
  R-08  feed.xml parses and its item links resolve
  R-09  every page repeats the Amazon Associate statement in the footer
  R-10  no price figures ship (Participation Requirements §2(b): prices and
        availability only via API-served links; §6(y): no price tracking/alerting)
        — see FLG-044/FLG-048/FLG-051
  R-11  no star ratings, review counts, review stars, "Amazon's Choice" badges
        or popularity badges ship (Participation Requirements §6(t): customer
        reviews and star ratings only via Creators API/PA API) — see FLG-044
R-12  counts stated in reviewer prose match the register they describe
  R-13   every data/*.json parses and carries no conflict markers (the machine
        register drives the tools; found the hard way 2026-11-20 when a merge
        committed unresolved markers into data/links.json)

Checked scope: the served site only. `archive/` holds superseded session builds
(see COORDINATION.md) and `data/` is not a published surface either, but R-12 reads
it as the authority for figures the published pages assert — a page that says "N more are in the
register" is making a claim about `data/governance.json`, and that claim is checkable.

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
        dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules", ".github", "Unselected files", "archive", "data"}]
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
CONFLICT_MARKER = re.compile(r"^(<{7}( |$)|={7}$|>{7}( |$))", re.M)

def check_placeholders(path, text):
    for m in PLACEHOLDER.finditer(text):
        fail("R-06", path, f"placeholder text ships: {m.group(1)}")


def check_conflict_markers(path, text):
    for m in CONFLICT_MARKER.finditer(text):
        fail("R-06", path, f"unresolved merge-conflict marker ships: {m.group(0).strip()!r}")


# ------------------------------------------------------------------------ R-13
# The machine register drives the gates and the tools. A data file that does not
# parse is worse than an empty one: it fails silently downstream. (Found the hard
# way on 2026-11-20, when a merge committed conflict markers into data/links.json.)
def check_data_json():
    import json as _json
    data_dir = os.path.join(ROOT, "data")
    if not os.path.isdir(data_dir):
        return
    for name in sorted(os.listdir(data_dir)):
        if not name.endswith(".json"):
            continue
        path = os.path.join(data_dir, name)
        raw = open(path, encoding="utf-8").read()
        if CONFLICT_MARKER.search(raw):
            fail("R-13", path, "conflict markers in a data file — merge was committed unresolved")
            continue
        try:
            _json.loads(raw)
        except Exception as exc:
            fail("R-13", path, f"data JSON does not parse: {exc}")


# -------------------------------------------------------- R-10 / R-11
# FLG-044 (2026-11-20): the integrated shop build displayed hand-copied prices,
# star ratings and review counts. Associates rules reserve that display content
# for PA API / Creators API data. The values were removed from every page; these
# rules keep them from returning. Page copy that explains the withholding (the
# phrases below) is the allowed way to talk about it.
R10_ALLOWED = (
    "out of stock",
    "not shown", "not reproduced", "not displayed", "price not shown",
    "not ship", "withheld", "no star ratings", "not obtain",
    "current price is on", "read the current price", "§2(b)", "§6(t)", "2(b))", "6(t))",
)

def check_figures(path, text):
    import re as _re
    # strip script/style so JS string literals do not trip the scanner
    body = _re.sub(r"<(script|style)\b.*?</\1>", " ", text, flags=_re.S | _re.I)
    # remove HTML comments
    body = _re.sub(r"<!--.*?-->", " ", body, flags=_re.S)
    # split into text nodes + attribute values worth scanning
    chunks = _re.split(r"<[^>]+>", body)
    for i, chunk in enumerate(chunks):
        low = chunk.lower()
        hit = None
        m = _re.search(r"(\$\s?\d|\b\d+\s?USD\b|\bin stock\b)", chunk)
        if m:
            hit = ("R-10", m.group(0))
        else:
            m2 = _re.search(r"(★|\b[0-4]\.\d\s*/\s*5\b|\b\d+(?:\.\d+)?\s*(?:out of\s*5|stars?\b)|\b\d[\d,.]*\s*(?:ratings|reviews)\b|amazon'?s choice|bought (?:last month|in the past month|this month)|\b\d+k\+\s*bought)", chunk, _re.I)
            if m2:
                hit = ("R-11", m2.group(0)[:40])
        if not hit:
            continue
        rule, found = hit
        # an allowed-withholding phrase nearby on the same text chunk excuses it
        if any(phrase in low for phrase in R10_ALLOWED):
            continue
        fail(rule, path, f"withheld display figure shipped in text: {found!r} — see FLG-044; use the 'not shown' phrasing instead")


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


# ----------------------------------------------------------------------- R-12
# Reviewer documents state counts. A count a script can compute is a count that
# will be wrong the next time the data changes, and no other rule here reads
# prose — so this one does. It recomputes each stated figure and fails only when
# the figure is present and wrong. An absent figure makes no claim, so it passes:
# this rule polices false statements, not the presence of statements.
#
# It exists because four figures on this site had already gone stale while every
# other rule stayed green — the flagged page's "Seventeen more", the executive
# summary's "13 proposals", the compliance table's "all 20 pages" and README's
# "4 question-shaped buyer guides". handoff/README.md asked for this in as many
# words: "Recompute them with a script before writing them."
def check_stated_counts(pages):
    import json

    def text_of(rel):
        try:
            with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
                return fh.read()
        except OSError:
            return None

    def jload(rel):
        body = text_of(rel)
        if body is None:
            return None
        try:
            return json.loads(body)
        except ValueError:
            return None

    def check(rel, pattern, expected, label):
        body = text_of(rel)
        if body is None:
            return
        m = re.search(pattern, body)
        if not m:
            notes.append(f"R-12: {rel} no longer states \"{label}\" — nothing to check")
            return
        got = int(m.group(1))
        if got != expected:
            fail("R-12", rel, f"stale figure: the page says {got} {label}, the register says {expected}")

    # 1. flags the Flagged page does not show, against the register it links to.
    #    Counted from the captioned flags table, not from the whole page: the page
    #    also names flags in prose (FLG-043 among them), and the caption's arithmetic
    #    is about the rows it prints.
    gov = jload("data/governance.json") or {}
    body = text_of("data-room/flagged.html") or ""
    flags_table = ""
    for m in re.finditer(r"<table\b.*?</table>", body, re.S):
        if re.search(r"<caption[^>]*>Flags a reader can act on", m.group(0), re.S):
            flags_table = m.group(0)
            break
    #    The ID lives in <th scope="row">. Counting every id anywhere in the table
    #    would overcount, because rows cross-reference other flags in their prose
    #    (row "FLG-004" cites FLG-045, row "FLG-008" cites FLG-043).
    shown = set()
    for cell in re.findall(r'<th scope="row">\s*((?:FLG|SG)-\d{2,3})\s*</th>', flags_table):
        shown.add(cell)
    if isinstance(gov.get("flagged"), list):
        check("data-room/flagged.html", r"(\d+) more are in the register",
              len(gov["flagged"]) - len(shown), "more flags in the register")

    # 2/3. the two decision registers the executive summary points at
    n_sugg = len(set(re.findall(r"\bS-\d{2}\b", text_of("suggestions.html") or "")))
    n_qs = len(set(re.findall(r"\bQ-\d{2}\b", text_of("questions.html") or "")))
    if n_sugg:
        check("executive-summary.html", r"\((\d+) proposals", n_sugg, "proposals")
    if n_qs:
        check("executive-summary.html", r"\((\d+) questions with discovery paths", n_qs, "questions")

    # 4. pages the compliance table says carry the disclosure strip
    check("data-room/compliance-gate.html", r"on all (\d+) pages", len(pages), "pages")

    # 5/6. README's guide and product counts
    guides_dir = os.path.join(ROOT, "guides")
    n_guides = (len([f for f in os.listdir(guides_dir)
                     if f.endswith(".html") and f != "index.html"])
                if os.path.isdir(guides_dir) else 0)
    check("README.md", r"(\d+) question-shaped buyer guides", n_guides, "guides")

    prod = jload("data/products.json") or {}
    if isinstance(prod.get("products"), list):
        check("README.md", r"All (\d+) products", len(prod["products"]), "products")


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
        check_conflict_markers(path, text)
        check_figures(path, text)
    for path in pages:
        check_links(path, cache[path], cache)
    check_sitemap_and_feed()
    check_stated_counts(pages)
    check_data_json()

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
