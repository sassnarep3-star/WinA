#!/usr/bin/env python3
"""Build the static site in docs/ from data/, content/, static/ and analytics/events.json.

Standard library only. Run:  python3 tools/build_site.py

The build is also the compliance gate. It exits non-zero (and writes nothing
that counts as published) if any of these checks fail:

  * data: every source ID cited exists; every source URL is on an official host;
    observed ASINs are 10 characters; observed listing URLs match the ASIN.
  * gate: a tagged candidate link may appear on the site only when
    data/products.json sets candidate_validated = true.
  * every page: one primary navigation group; the disclosure strip under the
    masthead and the disclosure in the footer carry the Associates statement;
    every dashboard page is linked from the footer; the page has a title,
    description and canonical URL.
  * every Amazon link carries rel="sponsored".
  * no internal link, anchor, or asset reference is broken.
  * no price or star-rating text appears on the site (Associates policy).
  * every data-table row that is not an empty placeholder contains a link.
  * no un-rendered markdown or placeholder text remains.
"""

import datetime
import email.utils
import html
import json
import re
import shutil
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CONTENT = ROOT / "content"
STATIC = ROOT / "static"
DOCS = ROOT / "docs"

OFFICIAL_HOSTS = {
    "affiliate-program.amazon.com",
    "sellercentral.amazon.com.mx",
    "www.ftc.gov",
    "www.fsis.usda.gov",
    "docs.github.com",
    "developers.google.com",
    "www.rssboard.org",
    "www.amazon.com",
    "link.amazon",
}
AMAZON_HOST_RE = re.compile(r"(^|\.)amazon\.[a-z.]+$|^link\.amazon(\.[a-z]+)?$")
TAGGED_ID = "shopnow047c-20"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
DASHBOARD_PAGES = [
    "executive-summary/", "products/", "link-validation/", "sources/", "questions/",
    "suggestions/", "ledger/", "analytics/", "flagged-for-review/",
]
POLICY_PAGES = ["about/", "disclosure/", "privacy/"]
PRICE_PATTERNS = [re.compile(r"\$\s?\d"), re.compile(r"\d\.\d\s*out of\s*5", re.I), re.compile(r"★")]


class BuildError(Exception):
    pass


# --------------------------------------------------------------------------- utils

def esc(text):
    return html.escape(str(text), quote=True)


def load_json(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def read_md(path):
    raw = path.read_text(encoding="utf-8")
    meta, body = {}, raw
    if raw.startswith("---\n"):
        _, front, body = raw.split("---\n", 2)
        for line in front.strip().splitlines():
            key, _, value = line.partition(":")
            meta[key.strip()] = value.strip()
    return meta, body


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def depth_prefix(out_rel):
    """Relative prefix from a page to the site root, e.g. 'air-fryers/index.html' -> '../'."""
    return "../" * out_rel.count("/")


def is_amazon(url):
    """True for Amazon product links: link.amazon short links and /dp/ or /gp/ product pages.

    Amazon's own policy pages (affiliate-program.amazon.com) are official references, not
    affiliate links, so they do not take rel="sponsored".
    """
    parts = urlsplit(url)
    host = (parts.hostname or "")
    if host == "link.amazon":
        return True
    if host in ("www.amazon.com", "amazon.com"):
        return parts.path.startswith(("/dp/", "/gp/", "/product/"))
    return False


def ext_attrs(url):
    """rel/target attributes for an outbound link. Amazon links are always sponsored."""
    if is_amazon(url):
        return ' rel="sponsored nofollow noopener" target="_blank"'
    return ' rel="noopener" target="_blank"'


def a_tag(url, text, extra=""):
    if not url.startswith(("http://", "https://")):
        return f'<a href="{esc(url)}"{extra}>{text}</a>'
    return f'<a href="{esc(url)}"{ext_attrs(url)}{extra}>{text}</a>'


def sponsored_tag():
    return '<span class="sp">Sponsored</span>'


# --------------------------------------------------------------------------- markdown

INLINE_PRODUCT = re.compile(r"\{\{product:(P-\d{2})\}\}")
INLINE_LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
INLINE_BOLD = re.compile(r"\*\*([^*]+)\*\*")


def make_inline(products_by_id):
    def inline(text):
        out = esc(text)
        # protect markdown link text from later bold/product substitution
        out = INLINE_BOLD.sub(r"<strong>\1</strong>", out)

        # links: escape happened above, so unescape the markdown link syntax first
        def link_escaped(m):
            label = m.group(1)
            url = html.unescape(m.group(2))
            return a_tag(url, label)

        out = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link_escaped, out)

        def product(m):
            p = products_by_id[m.group(1)]
            return (f'<a class="product-ref" href="{esc(current_product_link(p))}" '
                    f'rel="sponsored nofollow noopener" target="_blank" data-event="outbound_click" '
                    f'data-link-id="{p["id"]}">{esc(p["short_name"])} {sponsored_tag()}</a>')

        out = INLINE_PRODUCT.sub(product, out)
        return out
    return inline


def md_to_html(body, inline):
    lines = body.strip("\n").splitlines()
    blocks, i = [], 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("## "):
            text = line[3:].strip()
            blocks.append(f'<h2 id="{slugify(text)}">{inline(text)}</h2>')
            i += 1
        elif line.startswith("### "):
            text = line[4:].strip()
            blocks.append(f'<h3 id="{slugify(text)}">{inline(text)}</h3>')
            i += 1
        elif line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[-| :]+\|$", lines[i + 1].strip()):
            header = [c.strip() for c in line.strip().strip("|").split("|")]
            i += 2
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            thead = "".join(f"<th>{inline(c)}</th>" for c in header)
            tbody = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows)
            blocks.append(f'<div class="table-wrap"><table class="data-table"><thead><tr>{thead}</tr></thead>'
                          f"<tbody>{tbody}</tbody></table></div>")
        elif re.match(r"^- ", line):
            items = []
            while i < len(lines) and lines[i].startswith("- "):
                items.append(f"<li>{inline(lines[i][2:].strip())}</li>")
                i += 1
            blocks.append("<ul>" + "".join(items) + "</ul>")
        elif re.match(r"^\d+\. ", line):
            items = []
            while i < len(lines) and re.match(r"^\d+\. ", lines[i]):
                item_text = re.sub(r"^\d+\. ", "", lines[i]).strip()
                items.append(f"<li>{inline(item_text)}</li>")
                i += 1
            blocks.append("<ol>" + "".join(items) + "</ol>")
        else:
            para = [line.strip()]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r"^(## |### |- |\d+\. |\|)", lines[i]):
                para.append(lines[i].strip())
                i += 1
            blocks.append(f"<p>{inline(' '.join(para))}</p>")
    return "\n".join(blocks)


# --------------------------------------------------------------------------- data

def current_product_link(p):
    """The link a reader is sent to. Tagged candidates are used only when the gate is open."""
    if p.get("candidate_validated"):
        return p["candidate_special_link"]
    return p["submitted_link"]


def load_all():
    d = {}
    d["products"] = load_json("products.json")
    d["sources"] = load_json("sources.json")
    d["flags"] = load_json("flags.json")
    d["questions"] = load_json("questions.json")
    d["suggestions"] = load_json("suggestions.json")
    d["ledger"] = load_json("ledger.json")
    d["site"] = load_json("site.json")
    d["events"] = json.loads((ROOT / "analytics" / "events.json").read_text(encoding="utf-8"))
    d["guides"] = []
    for path in sorted((CONTENT / "guides").glob("*.md")):
        meta, body = read_md(path)
        meta["body"] = body
        d["guides"].append(meta)
    d["guides"].sort(key=lambda g: int(g["order"]))
    d["pages"] = {}
    for name in ["executive-summary", "about", "disclosure", "privacy"]:
        meta, body = read_md(CONTENT / "pages" / f"{name}.md")
        meta["body"] = body
        d["pages"][name] = meta
    return d


def validate_data(d):
    errors = []
    source_ids = {s["id"] for s in d["sources"]["sources"]}
    suggestion_ids = {s["id"] for s in d["suggestions"]["suggestions"]}
    for s in d["sources"]["sources"]:
        host = urlsplit(s["url"]).hostname or ""
        if urlsplit(s["url"]).scheme != "https":
            errors.append(f"{s['id']}: source URL is not https")
        if host not in OFFICIAL_HOSTS:
            errors.append(f"{s['id']}: source host {host} is not on the official allowlist")
    products = d["products"]["products"]
    if len(products) != 5:
        errors.append(f"expected 5 products, found {len(products)}")
    seen = set()
    for p in products:
        pid = p["id"]
        if pid in seen:
            errors.append(f"duplicate product id {pid}")
        seen.add(pid)
        for sid in p["source_ids"]:
            if sid not in source_ids:
                errors.append(f"{pid}: unknown source {sid}")
        obs = p["observed"]
        if not re.fullmatch(r"B0[A-Z0-9]{8}", obs["observed_asin"]):
            errors.append(f"{pid}: observed ASIN {obs['observed_asin']} is not a 10-character B0 ASIN")
        if obs["observed_listing_url"] != f"https://www.amazon.com/dp/{obs['observed_asin']}":
            errors.append(f"{pid}: observed listing URL does not match observed ASIN")
        if obs["tag_parameter_present"]:
            errors.append(f"{pid}: tag parameter recorded as present; update the link-validation record")
        intent = p["intent"]
        if intent["intended_asin"] and not re.fullmatch(r"[A-Z0-9]{10}", intent["intended_asin"]):
            errors.append(f"{pid}: intended ASIN is not 10 characters")
        if intent["intended_asin"] and not intent["confirmation_source"]:
            errors.append(f"{pid}: intended ASIN has no confirmation source")
        if p.get("candidate_validated") and not d["products"]["gate"]["candidate_special_links_validated"]:
            errors.append(f"{pid}: candidate_validated set without the gate")
    if d["products"]["gate"]["candidate_special_links_validated"] is False:
        for p in products:
            if p.get("candidate_validated"):
                errors.append(f"{p['id']}: gate is closed but candidate_validated is set")
    flag_ids = set()
    for f in d["flags"]["flags"]:
        if f["id"] in flag_ids:
            errors.append(f"duplicate flag {f['id']}")
        flag_ids.add(f["id"])
        for sid in f["evidence"]:
            if sid not in source_ids:
                errors.append(f"{f['id']}: unknown evidence {sid}")
        if not f.get("action"):
            errors.append(f"{f['id']}: no action given")
    for q in d["questions"]["questions"]:
        for sid in q["sources"]:
            if sid not in source_ids:
                errors.append(f"{q['id']}: unknown source {sid}")
        for fid in q["flags"]:
            if fid not in flag_ids:
                errors.append(f"{q['id']}: unknown flag {fid}")
        for token in re.findall(r"S-\d{2}", q["discover"]):
            if token not in suggestion_ids:
                errors.append(f"{q['id']}: unknown suggestion {token}")
    for s in d["suggestions"]["suggestions"]:
        if urlsplit(s["source"]["url"]).hostname not in OFFICIAL_HOSTS:
            errors.append(f"{s['id']}: suggestion source is not on the official allowlist")
        for qid in s["answers"]:
            if qid not in {q["id"] for q in d["questions"]["questions"]}:
                errors.append(f"{s['id']}: unknown question {qid}")
    for g in d["guides"]:
        for sid in g.get("sources", "").split(","):
            sid = sid.strip()
            if sid and sid not in source_ids:
                errors.append(f"guide {g['slug']}: unknown source {sid}")
    return errors


# --------------------------------------------------------------------------- page chrome

FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
           "%3Crect width='32' height='32' rx='6' fill='%231f3d33'/%3E%3Ctext x='16' y='22' font-size='18' "
           "text-anchor='middle' fill='%23faf7f2' font-family='Georgia,serif'%3EC%3C/text%3E%3C/svg%3E")


def page_shell(d, out_rel, title, description, body, canonical, active=""):
    site = d["site"]
    R = depth_prefix(out_rel)
    base = site["base_url"]
    nav_items = []
    for item in site["nav"]:
        cls = ' class="active"' if active and item["href"] == active else ""
        nav_items.append(f'<a href="{R}{item["href"]}"{cls}>{esc(item["title"])}</a>')
    nav = '<nav class="primary-nav" aria-label="Main">' + "".join(nav_items) + "</nav>"

    strip = (
        '<div id="disclosure-strip" class="disclosure-strip" role="note" aria-label="Affiliate disclosure">'
        '<p><strong>Affiliate disclosure.</strong> Links marked <span class="sp">Sponsored</span> go to Amazon. '
        f'{esc(site["disclosure_statement"])} '
        f'<a href="{R}disclosure/" data-event="disclosure_expand">Full disclosure</a></p></div>'
    )

    dash_links = "".join(
        f'<li><a href="{R}{x["href"]}">{esc(x["title"])}</a></li>' for x in site["dashboards"]
    )
    policy_links = "".join(
        f'<li><a href="{R}{x["href"]}">{esc(x["title"])}</a></li>'
        for x in [{"href": "about/", "title": "About"}, {"href": "disclosure/", "title": "Disclosure"},
                  {"href": "privacy/", "title": "Privacy"}]
    )
    guide_links = "".join(
        f'<li><a href="{R}guides/{g["slug"]}/">{esc(g["title"])}</a></li>' for g in d["guides"]
    )
    footer = f"""
<footer class="site-footer">
  <div class="footer-grid">
    <section aria-labelledby="f-dash"><h2 id="f-dash">Dashboards</h2><ul>{dash_links}</ul></section>
    <section aria-labelledby="f-guides"><h2 id="f-guides">Guides</h2><ul>{guide_links}<li><a href="{R}guides/">All guides</a></li></ul></section>
    <section aria-labelledby="f-policy"><h2 id="f-policy">Site</h2><ul>{policy_links}
      <li><a href="{R}feed.xml" data-event="feed_click">RSS feed</a></li>
      <li><a href="{R}sitemap.xml">Sitemap</a></li>
      <li><a href="{esc(site["repo_url"])}" rel="noopener" target="_blank">Source repository</a></li></ul></section>
  </div>
  <p id="footer-disclosure" class="footer-disclosure"><strong>Affiliate disclosure.</strong> {esc(site["disclosure_statement"])} Links marked Sponsored go to Amazon.</p>
  <p class="footer-fine">{esc(site["site_name"])} is a working name. Last checked {esc(site["last_checked"])}. Prices and star ratings are not shown (Amazon Associates policy).</p>
</footer>"""

    canon = base + canonical
    og = (f'<meta property="og:title" content="{esc(title)}">'
          f'<meta property="og:description" content="{esc(description)}">'
          f'<meta property="og:url" content="{esc(canon)}">'
          '<meta property="og:type" content="website">')
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · {esc(site["site_name"])}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{esc(canon)}">
{og}
<meta name="robots" content="index, follow">
<link rel="icon" href="{FAVICON}">
<link rel="alternate" type="application/rss+xml" title="{esc(site["site_name"])} guides" href="{R}feed.xml">
<link rel="stylesheet" href="{R}assets/site.css">
<script src="{R}assets/config.js"></script>
<script src="{R}assets/analytics.js" defer></script>
<script src="{R}assets/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="masthead">
  <div class="masthead-inner">
    <a class="brand" href="{R}">{esc(site["site_name"])}</a>
    <p class="tagline">{esc(site["tagline"])}</p>
  </div>
</header>
{strip}
{nav}
<main id="main">
{body}
</main>
{footer}
</body>
</html>
"""


# --------------------------------------------------------------------------- renderers

def card_product(d, p, R):
    claims = "".join(f"<li>“{esc(c)}”</li>" for c in p["listing_claims"][:4])
    return f"""<article class="card product-card" id="{p['id'].lower()}">
  <p class="kicker">{esc(p['category_label'])} · {esc(p['brand_as_written'])}</p>
  <h3>{esc(p['short_name'])}</h3>
  <p class="listing-title">{esc(p['product_name'])}</p>
  <p class="says">Listing claims (manufacturer's words, not verified):</p>
  <ul class="claims">{claims}</ul>
  <p class="cta-row"><a class="btn" href="{esc(current_product_link(p))}" rel="sponsored nofollow noopener" target="_blank" data-event="outbound_click" data-link-id="{p['id']}">View on Amazon {sponsored_tag()}</a></p>
  <p class="meta">Observed ASIN <code>{esc(p['observed']['observed_asin'])}</code> · {a_tag(p['observed']['observed_listing_url'], 'Listing source')} · {esc(p['id'])}</p>
</article>"""


def table(headers, rows, cls="data-table", empty_message=None):
    thead = "".join(f"<th scope=\"col\">{h}</th>" for h in headers)
    if empty_message and not rows:
        body = f'<tr class="empty"><td colspan="{len(headers)}">{empty_message}</td></tr>'
    else:
        body = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f'<div class="table-wrap"><table class="{cls}"><thead><tr>{thead}</tr></thead><tbody>{body}</tbody></table></div>'


def src_link(d, sid):
    s = next(x for x in d["sources"]["sources"] if x["id"] == sid)
    return a_tag(s["url"], f'{esc(sid)}')


def src_links(d, ids):
    return " ".join(src_link(d, s) for s in ids) if ids else '<span class="unverified">No official source</span>'


def flag_link(fid, R):
    return f'<a href="{R}flagged-for-review/#{fid.lower()}">{fid}</a>'


def products_table(d, R, product_ids=None):
    rows = []
    for p in d["products"]["products"]:
        if product_ids and p["category"] not in product_ids:
            continue
        rows.append([
            esc(p["id"]),
            esc(p["short_name"]) + f'<br><span class="small">{esc(p["product_name"])}</span>',
            esc(p["category_label"]),
            f'<code>{esc(p["observed"]["observed_asin"])}</code>',
            '<span class="unverified">Unverified</span> ' + flag_link("F-03", "../"),
            a_tag(p["observed"]["observed_listing_url"], f"Listing {esc(p['source_ids'][0])}"),
            a_tag(p["submitted_link"], "Submitted link " + sponsored_tag(), extra=f' data-link-id="{p["id"]}"'),
        ])
    return table(["ID", "Product (listing title)", "Category", "Observed ASIN", "Intended ASIN", "Source", "Link"], rows)


def page_home(d):
    R = ""
    cards = "".join(card_product(d, p, R) for p in d["products"]["products"])
    guides = d["guides"]
    lead = guides[0]
    guide_cards = "".join(
        f'<article class="card guide-card"><p class="kicker">{esc(g["cluster"])}</p>'
        f'<h3><a href="guides/{g["slug"]}/">{esc(g["title"])}</a></h3>'
        f'<p>{esc(g["description"])}</p></article>'
        for g in guides[1:4]
    )
    body = f"""
<section class="hero">
  <p class="kicker">Front page · {esc(d["site"]["last_checked"])}</p>
  <h1>Five kitchen products, read against their own listings.</h1>
  <p class="dek">Three air fryers and two meat thermometers, each with the source for every claim. We do not show prices or star ratings, because Amazon's Associates rules limit how they can be displayed.</p>
  <p class="hero-links"><a class="btn btn-ghost" href="air-fryers/">Air fryers</a> <a class="btn btn-ghost" href="meat-thermometers/">Meat thermometers</a> <a class="btn btn-ghost" href="products/">All products</a></p>
</section>
<section class="section" aria-labelledby="products-h">
  <h2 id="products-h">The products</h2>
  <div class="card-grid">{cards}</div>
</section>
<section class="section split" aria-labelledby="lead-h">
  <div>
    <h2 id="lead-h">Start here</h2>
    <article class="card feature">
      <p class="kicker">{esc(lead["cluster"])} · Guide</p>
      <h3><a href="guides/{lead["slug"]}/">{esc(lead["title"])}</a></h3>
      <p>{esc(lead["description"])}</p>
      <p><a href="guides/{lead["slug"]}/">Read the guide →</a></p>
    </article>
  </div>
  <div>
    <h2>More guides</h2>
    <div class="stack">{guide_cards}</div>
    <p><a href="guides/">All guides</a></p>
  </div>
</section>
<section class="section" aria-labelledby="how-h">
  <h2 id="how-h">How we check</h2>
  <p>Every product entry links to its Amazon listing and to the official sources we used. Things we could not confirm are flagged rather than filled in. Start with the <a href="flagged-for-review/">flagged items</a>, the <a href="link-validation/">link validation record</a>, or the <a href="executive-summary/">executive summary</a>.</p>
</section>
"""
    return page_shell(d, "index.html", "Five kitchen products, read against their listings",
                      "Air fryers and meat thermometers, read against their Amazon listings, with sources for each claim. Affiliate links are marked sponsored.",
                      body, "", active="")


def page_category(d, key, title, intro, out, active):
    cards = "".join(card_product(d, p, "../") for p in d["products"]["products"] if p["category"] == key)
    body = f"""
<section class="hero hero-small">
  <p class="kicker">Category</p>
  <h1>{esc(title)}</h1>
  <p class="dek">{esc(intro)}</p>
</section>
<section class="section"><div class="card-grid">{cards}</div></section>
<section class="section" aria-labelledby="t-h"><h2 id="t-h">Entries in this category</h2>
<p class="note">Prices and star ratings are not shown. Associates policy limits how they can be displayed (see <a href="../flagged-for-review/#f-05">F-05</a>). Every row links to its Amazon listing.</p>
{products_table(d, "../", [key])}
</section>"""
    return page_shell(d, out, title, intro, body, out.replace("index.html", ""), active=active)


def page_products(d):
    body = f"""
<section class="hero hero-small"><p class="kicker">Dashboard</p><h1>All products</h1>
<p class="dek">Every entry in one table. Intended ASIN values are blank until confirmed (F-03). Observed values are kept in <a href="../link-validation/">link validation</a>.</p></section>
<section class="section">{products_table(d, "../")}</section>
<section class="section"><h2>Withheld by policy</h2>
<p>Prices, availability, customer ratings, and review counts are not shown. Associates Participation Requirements §2(b) and §6(t) restrict them (<a href="../flagged-for-review/#f-05">F-05</a>, <a href="https://affiliate-program.amazon.com/help/operating/policies">SRC-02</a>).</p>
</section>"""
    return page_shell(d, "products/index.html", "All products", "Every product entry with its Amazon listing source and intended ASIN status.", body, "products/", active="products/")


def page_link_validation(d):
    prods = d["products"]["products"]
    intent_rows = []
    for p in prods:
        i = p["intent"]
        intent_rows.append([
            esc(p["id"]), esc(p["short_name"]),
            f'<span class="unverified">{esc(i["intended_asin"]) or "Unverified"}</span>',
            esc(i["official_listing_url"]) or '<span class="unverified">Unverified</span>',
            esc(i["confirmation_date"]) or '<span class="unverified">Unverified</span>',
            esc(i["confirmation_source"]) or '<span class="unverified">Unverified</span>',
            f'{a_tag("https://sellercentral.amazon.com.mx/seller-forums/discussions/t/436b9105-db19-41cc-8f2a-7720c7ae5649", "SRC-04")} · <span class="small">{esc(i["intended_asin_status"])}</span>',
        ])
    observed_rows = []
    for p in prods:
        o = p["observed"]
        observed_rows.append([
            esc(p["id"]),
            f'<code>{esc(p["submitted_link"])}</code><br><span class="small">Sponsored (supplied link)</span>',
            f'<code class="wrap">{esc(o["observed_redirect_url"])}</code>',
            f'<code>{esc(o["observed_asin"])}</code>',
            esc(o["observed_listing_title"]),
            esc(o["observed_on"]),
            "No" if not o["tag_parameter_present"] else "Yes",
            a_tag(o["observed_listing_url"], "Listing " + esc(p["source_ids"][0])),
        ])
    test_rows = []
    for p in prods:
        test_rows.append([
            esc(p["id"]),
            f'One-link test in Associates Central, click-through only (no purchase; §6(u))',
            '<span class="unverified">Not run</span> — needs your Associates login. ' + flag_link("F-22", "../") + ' · S-02',
            f'<code class="wrap">{esc(p["candidate_special_link"])}</code><br><span class="small">{esc(p["candidate_status"])}</span>',
            a_tag("https://affiliate-program.amazon.com/help/operating/policies", "SRC-02 §2(b)"),
        ])
    body = f"""
<section class="hero hero-small"><p class="kicker">Dashboard</p><h1>Link validation</h1>
<p class="dek">A product-intent record. Intended values and observed values are kept in separate tables and are never merged. Confirmation dates and sources are blank until a confirmation is actually made.</p></section>
<section class="section"><h2>A. Intent fields</h2>
<p class="note">Intended ASIN, official listing URL, confirmation date, and confirmation source. Blank means not confirmed.</p>
{table(["ID", "Product", "Intended ASIN", "Official listing URL", "Confirmation date", "Confirmation source", "ASIN definition source · status"], intent_rows)}
</section>
<section class="section"><h2>B. Observed fields (kept separate)</h2>
<p class="note">Read from the submitted link on 2026-11-20. These describe what the link did on that day. They do not confirm intent. Redirect URLs are shown as text, not clickable links.</p>
{table(["ID", "Submitted link", "Observed redirect target", "Observed ASIN", "Observed listing title", "Observed on", "Tag parameter present", "Source"], observed_rows)}
</section>
<section class="section"><h2>C. Tests and candidates</h2>
<p class="note">Candidate tagged links are not published. The build gate in <code>data/products.json</code> keeps them out of the site until the one-link test is recorded and the gate is opened.</p>
{table(["ID", "Test", "Status", "Candidate Special Link (not published)", "Source"], test_rows)}
</section>
<section class="section"><h2>Findings</h2>
<ul>
<li>The codes in the submitted links are 9 characters. An Amazon ASIN is 10 characters ({flag_link("F-01", "../")}).</li>
<li>No observed redirect carries a tag parameter ({flag_link("F-02", "../")}). The compliance status of the supplied links is unresolved, and this record does not call them invalid.</li>
<li>P-01 may have a second listing with a similar title ({flag_link("F-04", "../")}).</li>
</ul></section>"""
    return page_shell(d, "link-validation/index.html", "Link validation",
                      "Product-intent record: intended ASIN, official listing URL and confirmation fields kept separate from observed redirect data.",
                      body, "link-validation/", active="link-validation/")


def page_sources(d):
    rows = []
    for s in d["sources"]["sources"]:
        status = s.get("status", "")
        read = "<br>".join(esc(x) for x in s.get("verified_statements", [])[:3]) or '<span class="unverified">No value read</span>'
        if status:
            read = f'<span class="unverified">{esc(status)}</span>'
        rows.append([
            esc(s["id"]),
            esc(s["org"]),
            a_tag(s["url"], esc(s["title"])),
            esc(s["verified_on"]),
            esc(s.get("method", "")),
            read,
            esc(s.get("not_read", "") or s.get("note", "") or "—"),
        ])
    body = f"""
<section class="hero hero-small"><p class="kicker">Dashboard</p><h1>Sources</h1>
<p class="dek">Each official source used, what was read, and when. Quotes are as read on the verified date. Anything marked NOT VERIFIED was not used.</p></section>
<section class="section">{table(["ID", "Organisation", "Source (link)", "Verified", "Method", "What was read", "Limits"], rows)}</section>"""
    return page_shell(d, "sources/index.html", "Sources", "Official sources used on this site, with what was read and when.", body, "sources/", active="")


def page_questions(d, R=""):
    rows = []
    for q in d["questions"]["questions"]:
        status = {"answered": "Answered", "partial": "Partial", "unanswered": "Unanswered"}[q["status"]]
        disc = q["discover"]
        disc_html = " ".join(f'<a href="../suggestions/#{t.lower()}">{t}</a>' for t in re.findall(r"S-\d{2}", disc)) or "—"
        flags_html = " ".join(flag_link(f, "../") for f in q["flags"]) or "—"
        rows.append([
            f'<span id="{q["id"].lower()}">{esc(q["id"])}</span>',
            esc(q["area"]),
            esc(q["question"]),
            esc(q["known"]),
            esc(q["missing"]),
            f'<span class="status status-{q["status"]}">{status}</span>',
            disc_html,
            src_links(d, q["sources"]) + (f"<br>{flags_html}" if flags_html != "—" else ""),
        ])
    body = f"""
<section class="hero hero-small"><p class="kicker">Dashboard</p><h1>Questions</h1>
<p class="dek">{esc(d["questions"]["intro"])}</p></section>
<section class="section"><p class="note">Rows with no official source say so, and link to the flag that tracks them.</p>
{table(["ID", "Area", "Question", "What we know", "What is missing", "Status", "How to find out", "Source"], rows)}</section>"""
    return page_shell(d, "questions/index.html", "Questions", "What must be answered before a decision, with what is known, what is missing, and how to find out.", body, "questions/", active="")


def page_suggestions(d):
    rows = []
    for s in d["suggestions"]["suggestions"]:
        opts = "<br>".join(f"<strong>{esc(o['id'])}.</strong> {esc(o['label'])}" for o in s["options"])
        rows.append([
            f'<span id="{s["id"].lower()}">{esc(s["id"])}</span>',
            f'<strong>{esc(s["title"])}</strong><br><span class="small">{esc(s["why"])}</span>',
            opts,
            esc(s["recommended"]),
            f'<span class="status status-unanswered">{esc(s["status"])}</span>',
            a_tag(s["source"]["url"], esc(s["source"]["label"])),
        ])
    options_html = []
    for s in d["suggestions"]["suggestions"]:
        radios = "".join(
            f'<label class="opt"><input type="radio" name="{esc(s["id"])}" value="{esc(o["id"])}"> <strong>{esc(o["id"])}.</strong> {esc(o["label"])} <span class="small">— {esc(o["tradeoff"])}</span></label>'
            for o in s["options"]
        )
        options_html.append(f'<fieldset class="decision" data-id="{esc(s["id"])}"><legend>{esc(s["id"])} · {esc(s["title"])}</legend>{radios}'
                            f'<p class="small">Recommended for your review: {esc(s["recommended"])}</p></fieldset>')
    body = f"""
<section class="hero hero-small"><p class="kicker">Dashboard</p><h1>Suggestions</h1>
<p class="dek">{esc(d["suggestions"]["intro"])}</p></section>
<section class="section"><h2>Decision table</h2>
{table(["ID", "Suggestion", "Options", "Recommended", "Status", "Source"], rows)}</section>
<section class="section" id="choose"><h2>Choose your path</h2>
<p class="note">Nothing below changes the site. Pick options, then copy the reply and send it back.</p>
<form class="decisions" onsubmit="return false">{''.join(options_html)}
<p><button type="button" class="btn" id="copy-choices">Copy my choices</button> <span id="copy-status" class="small" role="status"></span></p>
<textarea id="choices-out" class="choices-out" readonly rows="3" aria-label="Your choices"></textarea>
</form></section>"""
    return page_shell(d, "suggestions/index.html", "Suggestions", "Decisions to make before any change is implemented. Pick options and copy your choices.", body, "suggestions/", active="")


def page_ledger(d):
    lg = d["ledger"]
    cols = "".join(f"<li><code>{esc(c['name'])}</code> — {esc(c['meaning'])}</li>" for c in lg["columns"])
    prov_rows = [[esc(p["date"]), esc(p["entry"]), a_tag(p["source"]["url"], esc(p["source"]["label"]))] for p in lg["provenance_trail"]]
    body = f"""
<section class="hero hero-small"><p class="kicker">Dashboard</p><h1>Campaign ledger</h1>
<p class="dek">{esc(lg["status"])}</p></section>
<section class="section"><h2>Rule</h2><p>{esc(lg["rule"])}</p>
<h3>Columns</h3><ul>{cols}</ul></section>
<section class="section"><h2>Rows</h2>
{table(["timestamp_utc", "source", "channel", "eligible_sessions", "clicks", "reported_orders", "provenance_url"], [], empty_message="No rows. No authorised first-party report has been received.")}</section>
<section class="section"><h2>Provenance trail</h2>
{table(["Date", "Entry", "Source"], prov_rows)}</section>
<section class="section"><h2>What this ledger does not show</h2>
<p>No conversion score, revenue forecast, trend, or ranking. None can be supported by the data we have (<a href="../flagged-for-review/#f-10">F-10</a>).</p></section>"""
    return page_shell(d, "ledger/index.html", "Campaign ledger", "Empty campaign ledger with its schema and provenance trail. No rows until authorised first-party reports exist.", body, "ledger/", active="")


def page_analytics(d):
    ev = d["events"]
    rows = []
    for e in ev["events"]:
        rows.append([esc(e["name"]), esc(e["when"]), esc(", ".join(e["fields"])),
                     a_tag("https://affiliate-program.amazon.com/help/operating/policies", "SRC-02 §3(e)")])
    never = "".join(f"<li>{esc(x)}</li>" for x in ev["never_collected"])
    body = f"""
<section class="hero hero-small"><p class="kicker">Dashboard</p><h1>Analytics</h1>
<p class="dek">{esc(ev["status"])}</p></section>
<section class="section"><h2>Five events</h2><p class="note">{esc(ev["note"])}</p>
{table(["Event", "When it fires", "Fields sent", "Source"], rows)}</section>
<section class="section"><h2>Never collected</h2><ul>{never}</ul>
<p>The collector stores daily counts only. The source is in <code>analytics/collector.py</code>.</p></section>
<section class="section"><h2>Endpoint status</h2>
<p><span class="unverified">Not connected.</span> The endpoint in <code>docs/assets/config.js</code> is empty, so the site sends nothing. See <a href="../suggestions/#s-03">S-03</a> and <a href="../flagged-for-review/#f-11">F-11</a>.</p></section>"""
    return page_shell(d, "analytics/index.html", "Analytics", "Five defined events, the privacy rules, and the endpoint status.", body, "analytics/", active="")


def page_flags(d):
    rows = []
    for f in d["flags"]["flags"]:
        if f["evidence"]:
            ev = " ".join(src_link(d, s) for s in f["evidence"])
        else:
            tracked = [q["id"] for q in d["questions"]["questions"] if f["id"] in q["flags"]]
            links = " ".join(f'<a href="../questions/#{qid.lower()}">{qid}</a>' for qid in tracked)
            ev = '<span class="unverified">No external source.</span> Tracked in ' + (links or "Questions")
        rows.append([
            f'<span id="{f["id"].lower()}">{esc(f["id"])}</span>',
            esc(f["area"]),
            esc(f["kind"]),
            f'<strong>{esc(f["title"])}</strong><br><span class="small">{esc(f["detail"])}</span>',
            ev,
            esc(f["action"]),
        ])
    body = f"""
<section class="hero hero-small"><p class="kicker">Flagged for Review</p><h1>Flagged for review</h1>
<p class="dek">Irregularities and unverified items, with sources, so you can review them after the site is live. <strong>None of these blocks the merge.</strong></p></section>
<section class="section">{table(["ID", "Area", "Kind", "Item and detail", "Source", "Action needed"], rows)}</section>"""
    return page_shell(d, "flagged-for-review/index.html", "Flagged for review",
                      "Irregularities and unverified items, with sources, for review after the site is live.", body, "flagged-for-review/", active="")


def page_exec(d):
    meta = d["pages"]["executive-summary"]
    inline = make_inline(d["products_by_id"])
    body = f"""<section class="hero hero-small"><p class="kicker">Dashboard</p><h1>{esc(meta["title"])}</h1>
<p class="dek">{esc(meta["description"])}</p></section>
<article class="prose">{md_to_html(meta["body"], inline)}</article>"""
    return page_shell(d, "executive-summary/index.html", meta["title"], meta["description"], body, "executive-summary/", active="")


def page_policy(d, key):
    meta = d["pages"][key]
    inline = make_inline(d["products_by_id"])
    body = f"""<section class="hero hero-small"><p class="kicker">Site</p><h1>{esc(meta["title"])}</h1>
<p class="dek">{esc(meta["description"])}</p></section>
<article class="prose">{md_to_html(meta["body"], inline)}</article>"""
    return page_shell(d, f"{key}/index.html", meta["title"], meta["description"], body, f"{key}/", active="")


def page_guides_index(d):
    clusters = {}
    for g in d["guides"]:
        clusters.setdefault(g["cluster"], []).append(g)
    parts = []
    for name, items in clusters.items():
        cards = "".join(
            f'<article class="card guide-card"><p class="kicker">{esc(g["cluster"])} · {esc(g["publish_date"]) if "publish_date" in g else esc(d["site"]["publish_date"])}</p>'
            f'<h3><a href="{g["slug"]}/">{esc(g["title"])}</a></h3><p>{esc(g["description"])}</p></article>'
            for g in items)
        parts.append(f'<section class="section"><h2>{esc(name)}</h2><div class="card-grid">{cards}</div></section>')
    body = f"""<section class="hero hero-small"><p class="kicker">Guides</p><h1>Buying guides</h1>
<p class="dek">Questions a buyer should answer before choosing, grouped by cluster. Each guide cites its sources.</p></section>
{''.join(parts)}
<section class="section"><p class="note">Publishing cadence is proposed as two guides a month and is not yet confirmed (<a href="../suggestions/#s-05">S-05</a>). New guides join the <a href="../feed.xml">RSS feed</a> and the sitemap when published.</p></section>"""
    return page_shell(d, "guides/index.html", "Guides", "Question-led buying guides for air fryers and meat thermometers, with sources.", body, "guides/", active="guides/")


def page_guide(d, g):
    inline = make_inline(d["products_by_id"])
    out = f"guides/{g['slug']}/index.html"
    srcs = [s.strip() for s in g.get("sources", "").split(",") if s.strip()]
    src_items = "".join(f"<li>{src_link(d, s)} — {esc(next(x['title'] for x in d['sources']['sources'] if x['id'] == s))}</li>" for s in srcs)
    body = f"""<section class="hero hero-small"><p class="kicker">{esc(g["cluster"])} · Guide</p><h1>{esc(g["title"])}</h1>
<p class="dek">{esc(g["description"])}</p>
<p class="byline">By {esc(d["site"]["byline"])} · Published {esc(d["site"]["publish_date"])} · Last checked {esc(d["site"]["last_checked"])}</p></section>
<article class="prose" data-guide="{esc(g["slug"])}">{md_to_html(g["body"], inline)}</article>
<section class="section"><h2>Sources cited</h2><ul class="sources">{src_items}</ul>
<p class="note">Listing claims are the manufacturer's, not verified. Prices and ratings are not shown. Links marked Sponsored go to Amazon. <a href="../../disclosure/">Disclosure</a>.</p></section>"""
    return page_shell(d, out, g["title"], g["description"], body, out.replace("index.html", ""), active="guides/")


def page_category_pair(d):
    return [
        page_category(d, "air-fryers", "Air fryers",
                      "Three air fryers, one oven-style and two basket-style, read against their listings. Compare the shape, the capacity claim, and the cleanup before you compare prices.",
                      "air-fryers/index.html", active=""),
        page_category(d, "meat-thermometers", "Meat thermometers",
                      "Two digital meat thermometers: one listed as a 1-second thermometer, one as a wireless system. The question is which temperature to confirm, and the USDA chart answers that.",
                      "meat-thermometers/index.html", active=""),
    ]


def page_404(d):
    body = """<section class="hero hero-small"><h1>Page not found</h1>
<p class="dek">That page does not exist. Try the <a href="./">front page</a> or the <a href="products/">products</a>.</p></section>"""
    return page_shell(d, "404.html", "Page not found", "This page does not exist.", body, "404.html", active="")


# --------------------------------------------------------------------------- feeds

def build_feed(d):
    site = d["site"]
    base = site["base_url"]
    items = []
    for g in sorted(d["guides"], key=lambda g: site["publish_date"], reverse=True):
        dt = datetime.datetime.strptime(site["publish_date"], "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc)
        url = base + f"guides/{g['slug']}/"
        items.append(
            "<item>"
            f"<title>{esc(g['title'])}</title>"
            f"<link>{esc(url)}</link>"
            f"<guid isPermaLink=\"true\">{esc(url)}</guid>"
            f"<pubDate>{email.utils.format_datetime(dt)}</pubDate>"
            f"<description>{esc(g['description'])}</description>"
            "</item>"
        )
    now_dt = datetime.datetime.strptime(site["publish_date"], "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<rss version="2.0"><channel>'
            f"<title>{esc(site['site_name'])}</title>"
            f"<link>{esc(base)}</link>"
            f"<description>{esc(site['tagline'])}</description>"
            "<language>en</language>"
            f"<lastBuildDate>{email.utils.format_datetime(now_dt)}</lastBuildDate>"
            + "".join(items) +
            "</channel></rss>\n")


def build_sitemap(paths, d):
    base = d["site"]["base_url"]
    lastmod = d["site"]["last_checked"]
    urls = "".join(f"<url><loc>{esc(base + p)}</loc><lastmod>{lastmod}</lastmod></url>" for p in paths)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls + "</urlset>\n")


# --------------------------------------------------------------------------- validation of built HTML

class PageScan(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.links = []          # (tag, attr, value)
        self.anchors = []        # dicts: href, rel, text
        self.navs = 0
        self.tables = []         # (table_classes, rows) where rows = list of (is_empty, has_link)
        self._text = []
        self._in_table = None
        self._row = None
        self._in_tbody = False
        self._cur_a = None
        self._skip = 0
        self.title = ""
        self._in_title = False
        self.meta = {}
        self.canonical = None
        self.ids_by_element = {}
        self.footer_text = ""
        self._in_footer = False
        self.footer_links = set()
        self.in_strip = ""
        self._in_strip = False
        self._in_foot_disc = False
        self.foot_disc_text = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a and a["id"]:
            self.ids.add(a["id"])
        if tag == "nav":
            self.navs += 1
        if tag == "title":
            self._in_title = True
        if tag == "meta" and a.get("name"):
            self.meta[a["name"]] = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "footer":
            self._in_footer = True
        if self._in_footer and tag == "a" and "href" in a:
            self.footer_links.add(a["href"])
        if a.get("id") == "disclosure-strip":
            self._in_strip = True
        if a.get("id") == "footer-disclosure":
            self._in_foot_disc = True
        if tag == "table":
            self._in_table = a.get("class", "")
            self.tables.append([self._in_table, []])
        if tag == "tbody" and self._in_table is not None:
            self._in_tbody = True
        if tag == "tr" and self._in_tbody:
            self._row = {"empty": "empty" in a.get("class", ""), "link": False, "text": ""}
        if tag == "a":
            self._cur_a = {"href": a.get("href", ""), "rel": a.get("rel", ""), "text": ""}
            self.anchors.append(self._cur_a)
            if self._row is not None:
                self._row["link"] = True
        for name in ("href", "src"):
            if name in a and a[name] is not None and tag != "a":
                self.links.append((tag, name, a[name]))
            if tag == "a" and name in a:
                self.links.append((tag, name, a[name]))
        if tag in ("script",) and "src" in a:
            pass
        if tag in ("script", "style") :
            self._skip += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "footer":
            self._in_footer = False
        if tag == "a":
            self._cur_a = None
        if tag == "tr" and self._row is not None and self._in_table is not None:
            self.tables[-1][1].append(self._row)
            self._row = None
        if tag == "tbody":
            self._in_tbody = False
        if tag == "table":
            self._in_table = None
        if tag in ("script", "style"):
            self._skip = max(0, self._skip - 1)
        if tag == "div" and self._in_strip:
            self._in_strip = False
        if tag == "p" and self._in_foot_disc:
            self._in_foot_disc = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._skip:
            return
        if self._cur_a is not None:
            self._cur_a["text"] += data
        if self._in_strip:
            self.in_strip += data
        if self._in_foot_disc:
            self.foot_disc_text += data
        if self._row is not None:
            self._row["text"] += data
        self._text.append(data)

    @property
    def text(self):
        return "".join(self._text)


def check_site(out_dir, d):
    """Run every built-HTML check. Returns a list of error strings."""
    errors = []
    pages = sorted(out_dir.rglob("*.html"))
    scans = {}
    dash_hrefs = [x["href"] for x in d["site"]["dashboards"]]
    for path in pages:
        rel = path.relative_to(out_dir).as_posix()
        scan = PageScan()
        scan.feed(path.read_text(encoding="utf-8"))
        scans[rel] = scan
        prefix = depth_prefix(rel)
        if scan.navs != 1:
            errors.append(f"{rel}: expected exactly one navigation group, found {scan.navs}")
        if not scan.title.strip():
            errors.append(f"{rel}: missing title")
        if not scan.meta.get("description"):
            errors.append(f"{rel}: missing meta description")
        if rel != "404.html" and not scan.canonical:
            errors.append(f"{rel}: missing canonical link")
        if not scan.in_strip or d["site"]["disclosure_statement"] not in scan.in_strip:
            errors.append(f"{rel}: disclosure strip under the masthead is missing the Associates statement")
        if d["site"]["disclosure_statement"] not in scan.foot_disc_text:
            errors.append(f"{rel}: footer disclosure is missing the Associates statement")
        if rel != "404.html":
            for href in dash_hrefs:
                if prefix + href not in scan.footer_links:
                    errors.append(f"{rel}: footer does not link dashboard {href}")
        for tag, attr, val in scan.links:
            if val is None:
                continue
            if attr == "href" and tag == "a" and "tag=" in val and TAGGED_ID in val:
                errors.append(f"{rel}: tagged candidate link {val} is published while the gate is closed")
            if tag == "a" and is_amazon(val) and attr == "href":
                # find the anchor's rel
                pass
        for an in scan.anchors:
            href = an["href"]
            if is_amazon(href) and "sponsored" not in an["rel"]:
                errors.append(f"{rel}: Amazon link is not marked sponsored: {href[:90]}")
        for pat in PRICE_PATTERNS:
            if pat.search(scan.text):
                errors.append(f"{rel}: price or star-rating text found ({pat.pattern})")
        for marker in ("{{product:", "**", "](", "[ "):
            if marker in scan.text:
                errors.append(f"{rel}: un-rendered markup '{marker}' in text")
        for table_cls, rows in scan.tables:
            if "data-table" not in table_cls:
                continue
            for r in rows:
                if r["empty"]:
                    continue
                if not r["link"]:
                    errors.append(f"{rel}: a data-table row has no source link: {r['text'][:60]!r}")
    # internal links and anchors
    for rel, scan in scans.items():
        file_dir = (out_dir / rel).parent
        for tag, attr, val in scan.links:
            if val is None or val.startswith(("http://", "https://", "mailto:", "tel:", "javascript:", "data:")):
                continue
            path_part, _, frag = val.partition("#")
            if path_part == "":
                target_file = out_dir / rel
            else:
                target = (file_dir / path_part)
                if path_part.endswith("/"):
                    target = target / "index.html"
                elif target.is_dir():
                    target = target / "index.html"
                target_file = target
            if not target_file.exists():
                errors.append(f"{rel}: broken {attr} -> {val}")
                continue
            if frag:
                tgt_rel = target_file.relative_to(out_dir).as_posix()
                tgt_scan = scans.get(tgt_rel)
                if tgt_scan is None:
                    tgt_scan = PageScan()
                    tgt_scan.feed(target_file.read_text(encoding="utf-8"))
                if frag not in tgt_scan.ids:
                    errors.append(f"{rel}: broken anchor #{frag} in {val}")
    return errors


# --------------------------------------------------------------------------- main build

def build(check_only=False):
    d = load_all()
    d["products_by_id"] = {p["id"]: p for p in d["products"]["products"]}
    errors = validate_data(d)
    if errors:
        raise BuildError("data checks failed:\n  " + "\n  ".join(errors))

    if not check_only:
        if DOCS.exists():
            shutil.rmtree(DOCS)
        DOCS.mkdir(parents=True)
        (DOCS / ".nojekyll").write_text("", encoding="utf-8")
        (DOCS / "assets").mkdir()
        shutil.copy(STATIC / "site.css", DOCS / "assets" / "site.css")
        shutil.copy(STATIC / "site.js", DOCS / "assets" / "site.js")
        shutil.copy(STATIC / "analytics.js", DOCS / "assets" / "analytics.js")
        cfg = {"analyticsEndpoint": d["site"].get("analytics_endpoint", "")}
        (DOCS / "assets" / "config.js").write_text(
            "// Analytics is off until analyticsEndpoint is set. See analytics/README.md.\n"
            f"window.ARENA_CONFIG = {json.dumps(cfg)};\n", encoding="utf-8")

        def write(rel, content):
            p = DOCS / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content, encoding="utf-8")

        pages = {}
        pages["index.html"] = page_home(d)
        pages["air-fryers/index.html"], pages["meat-thermometers/index.html"] = page_category_pair(d)
        pages["products/index.html"] = page_products(d)
        pages["link-validation/index.html"] = page_link_validation(d)
        pages["sources/index.html"] = page_sources(d)
        pages["questions/index.html"] = page_questions(d)
        pages["suggestions/index.html"] = page_suggestions(d)
        pages["ledger/index.html"] = page_ledger(d)
        pages["analytics/index.html"] = page_analytics(d)
        pages["flagged-for-review/index.html"] = page_flags(d)
        pages["executive-summary/index.html"] = page_exec(d)
        pages["about/index.html"] = page_policy(d, "about")
        pages["disclosure/index.html"] = page_policy(d, "disclosure")
        pages["privacy/index.html"] = page_policy(d, "privacy")
        pages["guides/index.html"] = page_guides_index(d)
        for g in d["guides"]:
            pages[f"guides/{g['slug']}/index.html"] = page_guide(d, g)
        pages["404.html"] = page_404(d)
        for rel, content in pages.items():
            write(rel, content)
        sitemap_paths = [p.replace("index.html", "") for p in pages if p != "404.html"]
        write("sitemap.xml", build_sitemap(sorted(sitemap_paths), d))
        write("feed.xml", build_feed(d))
        write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {d['site']['base_url']}sitemap.xml\n")

    errors = check_site(DOCS, d)
    if errors:
        raise BuildError("site checks failed:\n  " + "\n  ".join(errors))
    return d


def main(argv):
    check_only = "--check" in argv
    try:
        d = build(check_only=check_only)
    except BuildError as exc:
        print(f"BUILD FAILED\n{exc}", file=sys.stderr)
        return 1
    count = sum(1 for _ in DOCS.rglob("*.html"))
    print(f"OK: {count} HTML pages, {len(d['products']['products'])} products, {len(d['guides'])} guides, "
          f"{len(d['sources']['sources'])} sources, {len(d['flags']['flags'])} flags. Checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
