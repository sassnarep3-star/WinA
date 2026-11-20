#!/usr/bin/env python3
"""Build the static site at the repo root from data/*.json (GitHub Pages source: main /).

Checks run before any file is written (the build fails on any error):
  * every source URL is on an allowlisted official host
  * every product row links to its observed Amazon destination and source ID
  * intended ASINs are null unless a 10-character ID, source, date and listing URL are all present
  * no price is displayed (Associates Program Policies, section 2(b))
  * every referenced flag, source and product ID exists

Checks run on the generated HTML (the build fails on any error):
  * every internal link and asset resolves to a generated file
  * every page carries the disclosure text
  * every outbound Amazon link carries rel="sponsored"

Usage: python3 tools/build.py   (writes the site to the repo root; archive/ is excluded)
"""
import datetime
import html
import json
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT  # GitHub Pages serves the repo root (source: main /), so the site is generated at the root

ALLOWED_HOSTS = {
    "www.amazon.com",
    "affiliate-program.amazon.com",
    "www.ftc.gov",
    "developers.google.com",
    "sellercentral.amazon.com",
    "github.com",
    "sassnarep3-star.github.io",
}
BUILD_DATE = "2026-11-20"
BUILD_DATE_RFC822 = datetime.date(2026, 11, 20).strftime("%a, %d %b %Y 00:00:00 +0000")

errors = []


def err(msg):
    errors.append(msg)


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


site = load("site.json")
products_doc = load("products.json")
sources_doc = load("sources.json")
flags_doc = load("flags.json")
questions_doc = load("questions.json")
suggestions_doc = load("suggestions.json")
guides_doc = load("guides.json")

PRODUCTS = products_doc["products"]
SOURCES = {s["id"]: s for s in sources_doc["sources"]}
FLAGS = {f["id"]: f for f in flags_doc["flags"]}
GUIDES = guides_doc["guides"]
TAG = site["tracking_id"]
BASE = site["base_url"]
DISCLOSURE = site["disclosure"]

# ---------------------------------------------------------------- data validation
for s in sources_doc["sources"]:
    host = urlparse(s["url"]).netloc
    if host not in ALLOWED_HOSTS:
        err(f"source {s['id']} host not allowlisted: {host}")

for p in PRODUCTS:
    pid = p["id"]
    if not p["submitted_url"].startswith("https://link.amazon/"):
        err(f"{pid}: submitted_url is not a link.amazon URL")
    if p["source_id"] not in SOURCES:
        err(f"{pid}: unknown source {p['source_id']}")
    dest = p["observed_destination_url"]
    m = re.fullmatch(r"https://www\.amazon\.com/dp/([A-Z0-9]{10})", dest)
    if not m:
        err(f"{pid}: observed destination is not an amazon.com /dp/ URL")
    elif m.group(1) != p["observed_asin"]:
        err(f"{pid}: observed_asin does not match destination")
    if p["source_id"] in SOURCES and SOURCES[p["source_id"]]["url"] != dest:
        err(f"{pid}: source URL differs from observed destination")
    if p["intended_asin"] is not None:
        if not re.fullmatch(r"[A-Z0-9]{10}", p["intended_asin"]):
            err(f"{pid}: intended_asin is not 10 characters")
        if not (p.get("intended_source") and p.get("intended_confirmation_date") and p.get("intended_listing_url")):
            err(f"{pid}: intended_asin set without source, date and listing URL")
    if p.get("price_displayed") is not None:
        err(f"{pid}: price displayed; Program Policies section 2(b) limits price display")
    for f in p.get("flags", []):
        if f not in FLAGS:
            err(f"{pid}: unknown flag {f}")

for g in GUIDES:
    for sid in g["source_ids"]:
        if sid not in SOURCES:
            err(f"guide {g['slug']}: unknown source {sid}")
    for pid in g["product_ids"]:
        if pid not in {p["id"] for p in PRODUCTS}:
            err(f"guide {g['slug']}: unknown product {pid}")

# ---------------------------------------------------------------- html helpers
PAGES = []  # (relative path, title, description)


def esc(v):
    return html.escape("" if v is None else str(v), quote=True)


def unverified():
    return '<span class="badge badge-warn">Unverified (blank)</span>'


def val(v):
    return unverified() if v in (None, "") else esc(v)


def badge(text, kind="ok"):
    return f'<span class="badge badge-{kind}">{esc(text)}</span>'


def flag_links(ids, root):
    if not ids:
        return "none"
    return " ".join(f'<a href="{root}dashboard/flagged.html#{esc(i)}">{esc(i)}</a>' for i in ids)


def source_link(sid):
    s = SOURCES[sid]
    return f'<a href="{esc(s["url"])}" rel="noopener" target="_blank">{esc(sid)}</a>'


def table(headers, rows, cls="data"):
    head = "".join(f"<th>{h}</th>" for h in headers)
    body = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f'<div class="table-wrap"><table class="{cls}"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


def outbound_url(p):
    return f"{p['observed_destination_url']}?tag={TAG}"


def cta(p):
    return (
        f'<a class="btn" href="{esc(outbound_url(p))}" rel="sponsored noopener" target="_blank" '
        f'data-outbound="{esc(p["id"])}">View listing on Amazon</a>'
    )


def product_card(p, root):
    return f"""
<article class="card product">
  <div class="card-kicker">{esc(p["category_label"])} · {esc(p["id"])}</div>
  <h3>{esc(p["observed_title"])}</h3>
  <dl class="facts">
    <dt>Observed ASIN</dt><dd><code>{esc(p["observed_asin"])}</code></dd>
    <dt>Price</dt><dd>Not shown (Program Policies §2(b))</dd>
    <dt>Intended ASIN</dt><dd>{unverified()}</dd>
  </dl>
  <div class="card-actions">{cta(p)}<a class="link" href="{root}dashboard/register.html#{esc(p["id"])}">Register row</a></div>
  <p class="small muted">Destination observed {esc(p["observed_date"])} · <a href="{esc(SOURCES[p["source_id"]]["url"])}" rel="noopener" target="_blank">source</a></p>
</article>"""


def guide_card(g, root):
    return f"""
<article class="card">
  <div class="card-kicker">{esc(g["label"])}</div>
  <h3><a href="{root}guides/{esc(g["slug"])}.html">{esc(g["title"])}</a></h3>
  <p>{esc(g["dek"])}</p>
  <a class="link" href="{root}guides/{esc(g["slug"])}.html">Read the guide →</a>
</article>"""


def layout(title, body, root, active, description="", rel="index.html"):
    nav_items = [
        ("shop", "Shop", f"{root}shop/index.html"),
        ("guides", "Guides", f"{root}guides/index.html"),
        ("dashboard", "Dashboard", f"{root}dashboard/index.html"),
    ]
    nav = "".join(
        f'<a href="{href}" class="{"active" if key == active else ""}">{label}</a>'
        for key, label, href in nav_items
    )
    footer_dashboard = "".join(
        f'<li><a href="{root}dashboard/{slug}.html">{label}</a></li>'
        for slug, label in DASHBOARD_PAGES
    )
    base = site.get("base_url", "https://sassnarep3-star.github.io/WinA/")
    if rel == "index.html":
        canonical = base
    elif rel.endswith("/index.html"):
        canonical = base + rel[: -len("index.html")]
    else:
        canonical = base + rel

    blocks = []
    if rel == "index.html":
        blocks.append({
            "@context": "https://schema.org", "@type": "WebSite",
            "name": site["site_name"], "url": base,
            "description": site.get("tagline", ""),
        })
    else:
        blocks.append({
            "@context": "https://schema.org", "@type": "WebPage",
            "url": canonical, "name": title or site["site_name"],
            "description": description or site.get("tagline", ""),
            "isPartOf": {"@type": "WebSite", "url": base, "name": site["site_name"]},
        })
    parts = Path(rel).parts[:-1]
    if parts:
        items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": base}]
        for i, seg in enumerate(parts, start=2):
            items.append({
                "@type": "ListItem", "position": i,
                "name": seg.replace("-", " ").title(),
                "item": base + "/".join(parts[: i - 1]) + ("/" if i > 2 else ""),
            })
        blocks.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items})

    jsonld = "\n".join(
        '<script type="application/ld+json">' + json.dumps(b, ensure_ascii=False, separators=(",", ":")) + "</script>"
        for b in blocks
    )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title) + " · " if title != site["site_name"] else ""}{esc(site["site_name"])}</title>
<meta name="description" content="{esc(description or site["tagline"])}">
<link rel="stylesheet" href="{root}assets/site.css">
<link rel="alternate" type="application/rss+xml" title="{esc(site["site_name"])} guides" href="{root}feed.xml">
<script>window.CG_CONFIG = {{"endpoint": null, "events": {json.dumps([e["name"] for e in site["analytics"]["proposed_events"]])}}};</script>
<script src="{root}assets/analytics.js" defer></script>
<link rel="canonical" href="{canonical}">
{jsonld}
</head>
<body>
<header class="masthead">
  <div class="wrap masthead-inner">
    <a class="brand" href="{root}index.html">{esc(site["site_name"])}</a>
    <nav class="nav" aria-label="Main">{nav}</nav>
  </div>
</header>
<div class="disclosure" role="note"><div class="wrap">{esc(DISCLOSURE)} <span class="muted">Links to Amazon are tagged and marked sponsored. Prices are not shown.</span></div></div>
<main class="wrap">
{body}
</main>
<footer class="footer">
  <div class="disclosure disclosure-footer" role="note"><div class="wrap">{esc(DISCLOSURE)}</div></div>
  <div class="wrap footer-grid">
    <div>
      <p class="brand-small">{esc(site["site_name"])}</p>
      <p class="small muted">{esc(site["tagline"])}</p>
      <p class="small muted">Built {esc(BUILD_DATE)} from <code>data/*.json</code>. Every row cites an official source; unverified fields are blank and flagged.</p>
    </div>
    <div>
      <p class="footer-h">Shop &amp; guides</p>
      <ul class="plain">
        <li><a href="{root}shop/index.html">Shop</a></li>
        <li><a href="{root}shop/air-fryers-ovens.html">Air fryers &amp; ovens</a></li>
        <li><a href="{root}shop/meat-thermometers.html">Meat thermometers</a></li>
        <li><a href="{root}guides/index.html">Guides</a></li>
        <li><a href="{root}feed.xml">RSS feed</a></li>
      </ul>
    </div>
    <div>
      <p class="footer-h">Dashboard</p>
      <ul class="plain">{footer_dashboard}</ul>
    </div>
    <div>
      <p class="footer-h">Preview edition</p>
      <ul class="plain">
        <li><a href="{root}v2/">Typographic edition</a></li>
        <li><a href="{root}v2/compare/">Compare all five</a></li>
        <li><a href="{root}v2/links/">Link register</a></li>
        <li><a href="{root}v2/flags/">Flagged for review</a></li>
        <li><a href="{root}v2/suggestions/">Suggestions</a></li>
        <li><a href="{root}v2/questions/">Open questions</a></li>
      </ul>
    </div>
  </div>
</footer>
</body>
</html>
"""


DASHBOARD_PAGES = [
    ("register", "Product register"),
    ("sources", "Source register"),
    ("analysis", "Analysis &amp; findings"),
    ("questions", "Open questions"),
    ("suggestions", "Suggestions"),
    ("flagged", "Flagged for Review"),
    ("ledger", "Campaign ledger"),
    ("analytics", "Analytics status"),
    ("executive-summary", "Executive summary"),
]


AMAZON_A = re.compile(r'<a\s([^>]*?)>')


def _mark_sponsored(m):
    attrs = m.group(1)
    href = re.search(r'href="([^"]*)"', attrs)
    if not href or not re.match(r"https://(www\.amazon\.com|link\.amazon)/", href.group(1)):
        return m.group(0)
    attrs = re.sub(r'\s*rel="[^"]*"', "", attrs)
    return f'<a rel="sponsored noopener" {attrs}>'


def write(rel, content, title="", description="", active=""):
    # every link to an Amazon host is an outbound product link: mark it sponsored
    content = AMAZON_A.sub(_mark_sponsored, content)
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    PAGES.append((rel, title, description))


def root_for(rel):
    depth = len(Path(rel).parts) - 1
    return "../" * depth


def product_jsonld(rel):
    """Product structured data, emitted only from the verified register."""
    if not rel.startswith("shop/"):
        return ""
    blocks = []
    for p in PRODUCTS:
        asin = p.get("observed_asin")
        title = p.get("observed_title")
        if not asin or not title:
            continue
        blocks.append({
            "@context": "https://schema.org", "@type": "Product",
            "name": title, "sku": asin, "asin": asin,
            "category": p.get("category_label", ""),
            "url": p.get("observed_destination_url") or f"https://www.amazon.com/dp/{asin}",
        })
    return "\n".join(
        '<script type="application/ld+json">' + json.dumps(b, ensure_ascii=False, separators=(",", ":")) + "</script>"
        for b in blocks
    )


def page(rel, title, body, active, description=""):
    root = root_for(rel)
    write(rel, layout(title, body, root, active, description, rel), title, description, active)


# ---------------------------------------------------------------- pages
# Only generated paths are removed. The repo root, archive/, data/, tools/ and .git are never touched.
GENERATED = ["index.html", "shop", "guides", "dashboard", "assets", "feed.xml", "sitemap.xml", "robots.txt"]
GENERATED_DIRS = {"shop", "guides", "dashboard", "assets"}
for name in GENERATED:
    target = OUT / name
    if target.is_dir():
        shutil.rmtree(target)
    elif target.exists():
        target.unlink()

# Front page: products first
hero = f"""
<section class="hero">
  <p class="kicker">Buyer questions · Amazon listings · checked against source</p>
  <h1>Five listings, read the way a buyer would read them.</h1>
  <p class="lede">Three air fryers and ovens and two meat thermometers, one of them a smart wireless unit, each with the listing it points to, the date we looked at it, and a flag wherever a detail could not be confirmed.</p>
  <div class="hero-actions"><a class="btn btn-ghost" href="shop/index.html">Browse the shop</a><a class="link" href="guides/index.html">Read the buyer guides →</a></div>
</section>"""
featured = "".join(product_card(p, "") for p in PRODUCTS[:3])
home_body = f"""
{hero}
<section class="section">
  <div class="section-head"><h2>Featured listings</h2><a class="link" href="shop/index.html">All five listings →</a></div>
  <div class="grid grid-3">{featured}</div>
</section>
<section class="section">
  <div class="section-head"><h2>Meat thermometers</h2><a class="link" href="shop/meat-thermometers.html">Category →</a></div>
  <div class="grid grid-2">{"".join(product_card(p, "") for p in PRODUCTS if p["category"] == "meat-thermometers")}</div>
</section>
<section class="section">
  <div class="section-head"><h2>Buyer questions</h2><a class="link" href="guides/index.html">All guides →</a></div>
  <p class="muted">Working titles. These guides ask the question first and compare only what the listings state.</p>
  <div class="grid grid-2">{"".join(guide_card(g, "") for g in GUIDES[:2])}</div>
</section>
<section class="section callout">
  <h2>How we check</h2>
  <p>Each row has a source link to an official page. Prices are not shown under Amazon's policy. Intended ASINs for the submitted links are not yet confirmed, so they are blank and flagged. The full register, sources, questions and open decisions are in the <a href="dashboard/index.html">Dashboard</a>.</p>
</section>
"""
page("index.html", site["site_name"], home_body, "home", site["tagline"])

# Shop
shop_body = f"""
<section class="page-head">
  <p class="kicker">Shop</p>
  <h1>All listings</h1>
  <p class="lede">Each button opens the Amazon listing we observed on {esc(BUILD_DATE)}, with the tracking ID attached. Intended ASINs are not yet confirmed (FLG-001), so the button goes to the observed listing rather than to a confirmed product.</p>
</section>
<section class="section"><div class="grid grid-3">{"".join(product_card(p, "../") for p in PRODUCTS[:3])}</div></section>
<section class="section"><div class="grid grid-2">{"".join(product_card(p, "../") for p in PRODUCTS[3:])}</div></section>
<section class="section"><h2>Categories</h2>
<div class="grid grid-2">
  <a class="card cat" href="air-fryers-ovens.html"><h3>Air fryers &amp; ovens</h3><p>3 listings · basket and oven-style units</p></a>
  <a class="card cat" href="meat-thermometers.html"><h3>Meat thermometers</h3><p>2 listings · a digital thermometer and a smart wireless unit</p></a>
</div></section>
"""
page("shop/index.html", "Shop", shop_body, "shop", "All five observed listings.")

for slug, label, intro in [
    ("air-fryers-ovens", "Air fryers &amp; ovens", "Basket and oven-style units. The sizes below are the seller's wording in each listing title."),
    ("meat-thermometers", "Meat thermometers", "A digital thermometer and a smart wireless unit. Accuracy and range claims are the seller's wording, not tested here."),
]:
    items = [p for p in PRODUCTS if p["category"] == slug]
    body = f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Shop</a> / {label}</p>
  <h1>{label}</h1>
  <p class="lede">{intro}</p>
</section>
<section class="section"><div class="grid grid-2">{"".join(product_card(p, "../") for p in items)}</div></section>
<section class="section"><h2>Register rows</h2>
{table(["ID", "Observed title", "Observed ASIN", "Source", "Flags"],
       [[esc(p["id"]), esc(p["observed_title"]), f'<code>{esc(p["observed_asin"])}</code>', source_link(p["source_id"]), flag_links(p["flags"], "../")] for p in items])}
</section>"""
    page(f"shop/{slug}.html", label.replace("&amp;", "&"), body, "shop", intro)

# Guides index + guide pages
guide_list = "".join(guide_card(g, "../") for g in GUIDES)
page("guides/index.html", "Guides", f"""
<section class="page-head">
  <p class="kicker">Guides</p>
  <h1>Buyer questions</h1>
  <p class="lede">These guides start with the question a buyer would ask and then compare only what the listings say. They are working titles, not claims about popularity or product quality.</p>
</section>
<section class="section"><div class="grid grid-2">{guide_list}</div></section>
""", "guides", "Buyer questions for kitchen appliances.")

for g in GUIDES:
    sections = "".join(f"<h2>{esc(s['heading'])}</h2><p>{esc(s['body'])}</p>" for s in g["sections"])
    checklist = "".join(f"<li>{esc(item)}</li>" for item in g["checklist"])
    src = "".join(f"<li>{source_link(sid)} · {esc(SOURCES[sid]['title'])}</li>" for sid in g["source_ids"])
    prods = " ".join(
        f'<a class="btn btn-small" href="{esc(outbound_url(p))}" rel="sponsored noopener" target="_blank" data-outbound="{esc(p["id"])}">{esc(p["id"])}: view listing</a>'
        for p in PRODUCTS if p["id"] in g["product_ids"]
    )
    body = f"""
<article class="article">
  <p class="kicker"><a href="index.html">Guides</a> · <span class="badge badge-info">{esc(g["label"])}</span> · Published {esc(guides_doc["published"])} · By {esc(site["byline"])}</p>
  <h1>{esc(g["title"])}</h1>
  <p class="dek">{esc(g["dek"])}</p>
  {sections}
  <h2>Checklist</h2>
  <ul class="checklist">{checklist}</ul>
  <h2>Listings referenced</h2>
  <p>{prods}</p>
  <h2>Sources</h2>
  <ul class="plain">{src}</ul>
  <p class="small muted">Listing details were observed {esc(BUILD_DATE)}. Anything not stated on those listings is not in this guide.</p>
</article>"""
    page(f"guides/{g['slug']}.html", g["title"], body, "guides", g["dek"])

# Dashboard hub
hub_items = [
    ("register", "Product register", "Every row with its submitted link, observed ASIN, source, and flags."),
    ("sources", "Source register", "Official sources opened on 2026-11-20, with what each supports."),
    ("analysis", "Analysis &amp; findings", "Counts and findings from the register. No scores or forecasts."),
    ("questions", "Open questions", "What is answered, what is not, and how to find out."),
    ("suggestions", "Suggestions", "Options for each open decision. Nothing is changed until you choose."),
    ("flagged", "Flagged for Review", "Irregularities and unverified items, with sources and actions."),
    ("ledger", "Campaign ledger", "Empty by design until authorized first-party reports exist."),
    ("analytics", "Analytics status", "Proposed events and endpoint status (currently disabled)."),
    ("executive-summary", "Executive summary", "One-page overview of status, risks and decisions."),
]
hub_cards = "".join(
    f'<a class="card cat" href="{slug}.html"><h3>{label}</h3><p>{desc}</p></a>' for slug, label, desc in hub_items
)
page("dashboard/index.html", "Dashboard", f"""
<section class="page-head">
  <p class="kicker">Dashboard</p>
  <h1>Dashboard</h1>
  <p class="lede">Every table on this site is here. Each row cites its source, and blank fields are marked as unverified.</p>
</section>
<section class="section"><div class="grid grid-3">{hub_cards}</div></section>
""", "dashboard", "Register, sources, findings, questions, suggestions, flags.")

# Register
reg_rows = []
for p in PRODUCTS:
    reg_rows.append([
        f'<span id="{esc(p["id"])}"></span>{esc(p["id"])}',
        esc(p["category_label"]),
        f'<a href="{esc(p["submitted_url"])}" rel="noopener" target="_blank">{esc(p["submitted_url"])}</a><br><span class="small muted">{p["submitted_id_length"]} characters</span>',
        val(p["intended_asin"]),
        val(p["intended_listing_url"]),
        val(p["intended_confirmation_date"]),
        val(p["intended_source"]),
        f'<code>{esc(p["observed_asin"])}</code>',
        f'<a href="{esc(p["observed_destination_url"])}" rel="noopener" target="_blank">{esc(p["observed_destination_url"])}</a>',
        esc(p["observed_title"]),
        f'{esc(p["observed_breadcrumb"])} <span class="small muted">(node {esc(p["observed_browse_node"])})</span>',
        esc(p["observed_date"]),
        f'{unverified()} <span class="small muted">not displayed (§2(b))</span>',
        unverified(),
        source_link(p["source_id"]),
        flag_links(p["flags"], "../"),
    ])
reg_headers = [
    "ID", "Category", "Submitted link", "Intended ASIN", "Official listing URL (intended)",
    "Confirmation date", "Intended source", "Observed ASIN (redirect target)",
    "Observed destination", "Observed title", "Observed category (breadcrumb)", "Observed date", "Price", "Rating", "Source", "Flags",
]
page("dashboard/register.html", "Product register", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Register</p>
  <h1>Product register</h1>
  <p class="lede">Intended ASIN and the observed redirect target are kept in separate columns and never merged. Blank values are unverified and flagged.</p>
</section>
<section class="section">{table(reg_headers, reg_rows)}</section>
<section class="section"><h2>Submitted short links</h2>
<p class="small muted">The five submitted link paths are 9 characters long. Amazon's ASIN is described as 10 characters (SRC-11, forum-level support; see FLG-001 and FLG-011).</p></section>
""", "dashboard", "Product register with sources and flags.")

# Sources
src_rows = []
for s in sources_doc["sources"]:
    src_rows.append([
        f'<code>{esc(s["id"])}</code>',
        f'<a href="{esc(s["url"])}" rel="noopener" target="_blank">{esc(s["title"])}</a>',
        esc(s["publisher"]),
        esc(s["updated"]),
        esc(s["supports"]),
    ])
page("dashboard/sources.html", "Source register", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Sources</p>
  <h1>Source register</h1>
  <p class="lede">{esc(sources_doc["note"])}</p>
</section>
<section class="section">{table(["ID", "Source (official)", "Publisher", "Updated", "What it supports"], src_rows)}</section>
""", "dashboard", "Official sources with what each supports.")

# Analysis
n_products = len(PRODUCTS)
n_observed = sum(1 for p in PRODUCTS if p.get("observed_asin"))
n_intended = sum(1 for p in PRODUCTS if p.get("intended_asin"))
n_price = sum(1 for p in PRODUCTS if p.get("price_displayed"))
n_src_ok = sum(1 for p in PRODUCTS if SOURCES[p["source_id"]]["url"] == p["observed_destination_url"])
n_short_9 = sum(1 for p in PRODUCTS if p["submitted_id_length"] == 9)
n_answered = len(questions_doc["answered"])
n_open = len(questions_doc["unanswered"])
n_flags = len(FLAGS)
findings = [
    ["A1", f"{n_observed} of {n_products} submitted links resolved to an amazon.com /dp/ page", "Observed through the fetch tool on 2026-11-20. Curl from the build host could not reach link.amazon.", f"SRC-06 to SRC-10 · {flag_links(['FLG-002'], '../')}"],
    ["A2", f"{n_intended} of {n_products} intended ASINs confirmed", "The submitted paths are 9 characters, not 10 (FLG-001). Intended fields stay blank.", flag_links(["FLG-001"], "../")],
    ["A3", f"{n_src_ok} of {n_products} register rows link their source to the observed destination", "The source link on each row is the Amazon page that was observed.", "Verification check in build.py"],
    ["A4", f"{n_price} of {n_products} prices displayed", "Price display is limited by Program Policies §2(b). No price is shown.", flag_links(["FLG-005"], "../")],
    ["A5", f"{n_short_9} of {n_products} submitted paths are 9 characters", "ASIN length is taken from a forum source only (FLG-011).", flag_links(["FLG-011"], "../")],
    ["A6", "2 of 5 destination pages show the word 'Sponsored' near the product summary", "Meaning not established; recorded only.", flag_links(["FLG-006"], "../")],
    ["A7", f"{n_answered} questions answered from official sources; {n_open} open", "See the questions page.", '<a href="questions.html">Questions</a>'],
    ["A8", "Associates content bar not yet met for an application", "Associates Help rule of thumb is at least 10 posts; this site has 4 guides and 5 register rows.", flag_links(["FLG-010"], "../")],
    ["A9", "No conversion, commission or revenue figures are presented", "No authorized first-party reports exist (see the ledger). Commission rates were not checked in this session.", '<a href="ledger.html">Ledger</a>'],
]
page("dashboard/analysis.html", "Analysis & findings", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Analysis</p>
  <h1>Analysis &amp; findings</h1>
  <p class="lede">Counts come from the data files, not from estimates. No conversion score or revenue forecast is presented.</p>
</section>
<section class="section kpis">
  <div class="kpi"><span>{n_products}</span>register rows</div>
  <div class="kpi"><span>{n_observed}/{n_products}</span>destinations observed</div>
  <div class="kpi"><span>{n_intended}/{n_products}</span>intended ASINs confirmed</div>
  <div class="kpi"><span>{n_flags}</span>flags logged</div>
</section>
<section class="section">{table(["#", "Finding", "Detail", "Evidence"], findings)}</section>
""", "dashboard", "Counts and findings from the register.")

# Questions
ans_rows = [[f'<code>{esc(q["id"])}</code>', esc(q["question"]), esc(q["answer"]), " ".join(source_link(s) for s in q["sources"])] for q in questions_doc["answered"]]
open_rows = [[f'<code>{esc(q["id"])}</code>', esc(q["question"]), esc(q["why_it_matters"]), esc(q["how_to_discover"]),
              f'<a href="suggestions.html#{esc(q["suggestion"])}">{esc(q["suggestion"])}</a>', flag_links([q["flag"]], "../")] for q in questions_doc["unanswered"]]
page("dashboard/questions.html", "Open questions", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Questions</p>
  <h1>Questions before any decision</h1>
  <p class="lede">What the current sources answer, what they do not, and how each open question can be closed.</p>
</section>
<section class="section"><h2>Answered ({n_answered})</h2>{table(["ID", "Question", "Answer", "Sources"], ans_rows)}</section>
<section class="section"><h2>Open ({n_open})</h2>{table(["ID", "Question", "Why it matters", "How to find out", "Suggestion", "Flag"], open_rows)}</section>
""", "dashboard", "Answered and open questions.")

# Suggestions
sug_blocks = []
for it in suggestions_doc["items"]:
    opts = "".join(
        f'<tr><td><code>{esc(it["id"])}-{esc(o["id"])}</code></td><td>{esc(o["label"])}</td><td>{"<strong>Recommended</strong>" if o.get("recommended") else ""}</td><td>{esc(o["changes"])}</td></tr>'
        for o in it["options"]
    )
    sug_blocks.append(f"""
<section class="section decision" id="{esc(it["id"])}">
  <h2><span class="badge badge-info">{esc(it["id"])}</span> {esc(it["topic"])}</h2>
  <p>{esc(it["question"])}</p>
  <div class="table-wrap"><table class="data"><thead><tr><th>Option</th><th>Choice</th><th></th><th>What changes</th></tr></thead><tbody>{opts}</tbody></table></div>
</section>""")
page("dashboard/suggestions.html", "Suggestions", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Suggestions</p>
  <h1>Suggestions</h1>
  <p class="lede">{esc(suggestions_doc["note"])}</p>
</section>
{"".join(sug_blocks)}
""", "dashboard", "Options for open decisions.")

# Flagged
flag_rows = []
for f in flags_doc["flags"]:
    srcs = " ".join(source_link(s) for s in f["sources"]) or "none"
    flag_rows.append([f'<span id="{esc(f["id"])}"></span><code>{esc(f["id"])}</code>', badge(f["severity"], "warn" if f["severity"] == "high" else "info"),
                      f'<strong>{esc(f["title"])}</strong><br><span class="small">{esc(f["detail"])}</span>', srcs, esc(f["action"])])
page("dashboard/flagged.html", "Flagged for Review", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Flagged for Review</p>
  <h1>Flagged for Review</h1>
  <p class="lede">Irregularities and unverified items. They are published for the owner to review after the site is live. They do not block the merge.</p>
</section>
<section class="section">{table(["ID", "Severity", "Item", "Sources", "Action"], flag_rows)}</section>
""", "dashboard", "Irregularities and unverified items for review.")

# Ledger
page("dashboard/ledger.html", "Campaign ledger", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Ledger</p>
  <h1>Campaign ledger</h1>
  <p class="lede">Empty by design. Rows are added only from authorized first-party reports, with timestamp, source and provenance. No conversion score or revenue forecast is presented.</p>
</section>
<section class="section">{table(["timestamp_utc", "source", "channel", "eligible_sessions", "clicks", "reported_orders", "provenance"], [])}
<p class="small muted">Empty table. CSV template: <a href="ledger.csv">ledger.csv</a>.</p></section>
""", "dashboard", "Empty campaign ledger.")
shutil.copyfile(DATA / "ledger.csv", OUT / "dashboard" / "ledger.csv")

# Analytics status
ev_rows = [[f'<code>{esc(e["name"])}</code>', esc(e["fires"]), esc(e["personal_data"])] for e in site["analytics"]["proposed_events"]]
page("dashboard/analytics.html", "Analytics status", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Analytics</p>
  <h1>Analytics status</h1>
  <p class="lede"><strong>Status: {esc(site["analytics"]["status"])}.</strong> {esc(site["analytics"]["status_note"])}</p>
</section>
<section class="section"><h2>Proposed events (not recording)</h2>{table(["Event", "Fires when", "Personal data"], ev_rows)}
<p class="small muted">{esc(site["analytics"]["policy_note"])} Five events are proposed because the request did not list them (FLG-007).</p></section>
""", "dashboard", "Analytics status and proposed events.")

# Executive summary
page("dashboard/executive-summary.html", "Executive summary", f"""
<section class="page-head">
  <p class="kicker"><a href="index.html">Dashboard</a> / Executive summary</p>
  <h1>Executive summary</h1>
  <p class="lede">Status as of {esc(BUILD_DATE)}.</p>
</section>
<section class="section prose">
  <h2>What this is</h2>
  <p>A small buyer-question publication for five Amazon listings in two categories, with four guides built on working titles. It is designed to keep every claim tied to a source and to flag what cannot be confirmed.</p>
  <h2>What is confirmed</h2>
  <ul>
    <li>{n_observed} of {n_products} submitted short links resolved to an amazon.com product page when opened on {esc(BUILD_DATE)}. Each page is cited (SRC-06 to SRC-10).</li>
    <li>The disclosure wording, tag requirement, price-display limit and sponsored-link practice were checked against the Associates Operating Agreement, Program Policies, FTC guidance and Google's documentation (SRC-01 to SRC-05).</li>
  </ul>
  <h2>What is not confirmed</h2>
  <ul>
    <li>Intended ASIN for {n_products - n_intended} of {n_products} rows. The submitted paths are 9 characters (FLG-001, FLG-002).</li>
    <li>Whether the submitted links and the Tracking ID are compliant and enrolled (FLG-003, FLG-004).</li>
    <li>Prices, ratings and availability. Prices are not shown under Program Policies §2(b) (FLG-005).</li>
    <li>Analytics, outbound-click counting and Search Console. None is recording (FLG-007, FLG-008, FLG-012).</li>
    <li>Commission rates were not checked in this session.</li>
  </ul>
  <h2>Risks to review first</h2>
  <ul>
    <li>Link validity and tracking (FLG-001 to FLG-004).</li>
    <li>Parallel session claim on arena/2b309a82-wina (FLG-009).</li>
    <li>Content volume against the Associates review bar (FLG-010).</li>
  </ul>
  <h2>Decisions needed</h2>
  <p>Eight open decisions are listed with options and their effects on the <a href="suggestions.html">Suggestions</a> page (S-01 to S-08). Nothing has been changed on the basis of those suggestions.</p>
</section>
""", "dashboard", "One-page executive summary: the five verified listings, what was confirmed against official Amazon sources, what remains unverified, and the decisions awaiting the owner.")

# ---------------------------------------------------------------- feed, sitemap, robots
items = []
for g in GUIDES:
    link = f"{BASE}guides/{g['slug']}.html"
    items.append(f"""  <item>
    <title>{esc(g["title"])}</title>
    <link>{esc(link)}</link>
    <guid isPermaLink="true">{esc(link)}</guid>
    <pubDate>{BUILD_DATE_RFC822}</pubDate>
    <description>{esc(g["dek"])}</description>
  </item>""")
feed = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>{esc(site["site_name"])}: buyer guides</title>
  <link>{esc(BASE)}</link>
  <description>{esc(site["tagline"])}</description>
  <language>en-us</language>
  <lastBuildDate>{BUILD_DATE_RFC822}</lastBuildDate>
{chr(10).join(items)}
</channel>
</rss>
"""
(OUT / "feed.xml").write_text(feed, encoding="utf-8")

urls = [rel for rel, _, _ in PAGES]
sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for rel in sorted(urls):
    sitemap.append(f"  <url><loc>{esc(BASE + rel if rel != 'index.html' else BASE)}</loc><lastmod>{BUILD_DATE}</lastmod></url>")
sitemap.append("</urlset>")
(OUT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /archive/\n\nSitemap: {BASE}sitemap.xml\n", encoding="utf-8")
(OUT / ".nojekyll").write_text("", encoding="utf-8")

# ---------------------------------------------------------------- assets
(OUT / "assets").mkdir(parents=True, exist_ok=True)
shutil.copyfile(ROOT / "tools" / "assets" / "site.css", OUT / "assets" / "site.css")
shutil.copyfile(ROOT / "tools" / "assets" / "analytics.js", OUT / "assets" / "analytics.js")

# ---------------------------------------------------------------- generated-html checks
internal_ref = re.compile(r'(?:href|src)="([^"#?]+)')
outbound_ref = re.compile(r'<a ([^>]*href="https://www\.amazon\.com[^"]*"[^>]*)>')
html_files = [q for q in OUT.rglob("*.html") if q.parent == OUT or q.relative_to(OUT).parts[0] in GENERATED_DIRS]
for f in html_files:
    text = f.read_text(encoding="utf-8")
    rel = f.relative_to(OUT).as_posix()
    if DISCLOSURE not in text:
        err(f"{rel}: disclosure missing")
    if text.count(DISCLOSURE) < 2:
        err(f"{rel}: disclosure must appear under the masthead and in the footer")
    for m in outbound_ref.finditer(text):
        attrs = m.group(1)
        if "sponsored" not in attrs or "noopener" not in attrs:
            err(f"{rel}: outbound Amazon link missing rel=sponsored")
    for m in internal_ref.finditer(text):
        target = m.group(1)
        if target.startswith(("http://", "https://", "mailto:", "//")):
            continue
        if not target:
            continue
        resolved = (f.parent / target).resolve()
        if not resolved.exists():
            err(f"{rel}: broken internal link -> {target}")
# every nav-ready dashboard surface is linked from the dashboard hub and footer
for slug, _ in DASHBOARD_PAGES:
    if f"dashboard/{slug}.html" not in (OUT / "dashboard/index.html").read_text(encoding="utf-8"):
        err(f"dashboard hub missing link to {slug}")
    if not (OUT / "dashboard" / f"{slug}.html").exists():
        err(f"missing dashboard page {slug}")
# price strings must not appear in product rows
for f in html_files:
    text = f.read_text(encoding="utf-8")
    if re.search(r"\$\d+\.\d{2}", text):
        err(f"{f.relative_to(OUT).as_posix()}: a dollar price is shown")

# feed and sitemap references
for g in GUIDES:
    if not (OUT / "guides" / f"{g['slug']}.html").exists():
        err(f"guide page missing for {g['slug']}")

if errors:
    print("BUILD FAILED")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print(f"Built {len(html_files)} HTML pages, feed.xml, sitemap.xml ({len(urls)} URLs) at the repo root (GitHub Pages source)")
