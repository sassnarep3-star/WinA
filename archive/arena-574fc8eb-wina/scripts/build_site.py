#!/usr/bin/env python3
"""WinA site builder — renders every page from data/*.json (standard library only).

Run:  python3 scripts/build_site.py
Gate: python3 scripts/check_site.py     (must pass before any push)

Design rules enforced here (and re-checked by the gate):
  * disclosure strip under the masthead on EVERY page, disclosure repeated in the footer
  * every outbound product link is rel="sponsored nofollow" and carries tag=shopnow047c-20
  * every data-table row carries a link to an official source; unverifiable values are
    blank + flagged, never inferred
  * dashboards live in one footer nav group; the front page leads with products
"""

import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://sassnarep3-star.github.io/WinA/"
TRACK = "shopnow047c-20"
PUB = "WinA"
PUB_SUB = "Kitchen Field Guide"
DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases."
VERIFIED = "2026-11-20"
BYLINE = "WinA Editorial"

SHOP_NAV = [
    ("index.html", "Home", "home"),
    ("products.html", "Shelf", "shelf"),
    ("guides/index.html", "Guides", "guides"),
]

DASH_NAV = [
    ("platform.html", "Platform & sources"),
    ("analysis.html", "Field Notes (analysis)"),
    ("suggestions.html", "Suggestions review"),
    ("questions.html", "Open questions"),
    ("executive-summary.html", "Executive summary"),
    ("flagged.html", "Flagged for review"),
    ("search.html", "Search"),
]


# ---------------------------------------------------------------- helpers

def esc(s):
    return html.escape(str(s), quote=True)


def load(name):
    with open(os.path.join(ROOT, "data", name), encoding="utf-8") as fh:
        return json.load(fh)


def aff_url(asin):
    return f"https://www.amazon.com/dp/{asin}?tag={TRACK}"


def a_ext(href, text, aff=False, product=None, cls=None, title=None):
    """External anchor. Amazon links are always sponsored (gate-enforced)."""
    host = href.split("//")[-1].split("/")[0].split("?")[0]
    is_amazon = host in ("www.amazon.com", "amazon.com", "link.amazon")
    rel = ' rel="sponsored nofollow"' if (aff or is_amazon) else ' rel="noopener"'
    extra = ""
    if product:
        extra += f' data-aff="1" data-product="{esc(product)}"'
    if cls:
        extra += f' class="{esc(cls)}"'
    if title:
        extra += f' title="{esc(title)}"'
    return f'<a href="{esc(href)}"{rel}{extra}>{text}</a>'


def src_link(url, label, aff=False):
    return a_ext(url, esc(label), aff=aff, cls="src")


def price_cell(p):
    return (f'<td class="num"><span class="price">${p["price_usd"]:.2f}</span>'
            f'<small>observed {esc(p["price_observed"])} · {esc(p["price_kind"])}</small></td>')


def category_pill(cat):
    cls = "pill-fryer" if cat == "Air Fryers" else "pill-thermo"
    return f'<span class="pill {cls}">{esc(cat)}</span>'


# ---------------------------------------------------------------- chrome

def chrome(slug, title, desc, body, nav=None, depth=0, jsonld=None, og_type="website"):
    prefix = "../" * depth
    nav_html = []
    for href, label, key in SHOP_NAV:
        cur = ' aria-current="page"' if nav == key else ""
        nav_html.append(f'<a href="{esc(prefix + href)}"{cur}>{esc(label)}</a>')
    dash_html = "\n".join(
        f'            <li><a href="{esc(prefix + href)}">{esc(label)}</a></li>'
        for href, label in DASH_NAV
    )
    jld = ""
    if jsonld:
        jld = "\n  <script type=\"application/ld+json\">" + json.dumps(jsonld, ensure_ascii=False) + "</script>"
    canonical = BASE + ("" if slug == "index.html" else slug)
    og = f"""  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:url" content="{esc(canonical)}">
  <meta property="og:type" content="{esc(og_type)}">
  <meta property="og:site_name" content="{esc(PUB + ' — ' + PUB_SUB)}">"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="{esc(canonical)}">
{og}
  <link rel="alternate" type="application/rss+xml" title="{esc(PUB)} feed" href="{esc(prefix)}feed.xml">
  <link rel="stylesheet" href="{esc(prefix)}assets/styles.css">
  <script src="{esc(prefix)}assets/analytics.js" defer></script>
  <script src="{esc(prefix)}assets/site.js" defer></script>{jld}
</head>
<body>
  <header class="masthead">
    <div class="masthead-inner">
      <a class="brand" href="{esc(prefix)}index.html">
        <span class="brand-mark">{esc(PUB)}<span class="dot">.</span></span>
        <span class="brand-sub">{esc(PUB_SUB)}</span>
      </a>
      <nav class="nav-shop" aria-label="Shop">
        {"".join(nav_html)}
      </nav>
      <a class="nav-search" href="{esc(prefix)}search.html" aria-label="Search the site">⌕ Search</a>
    </div>
  </header>

  <div class="disclosure-strip" role="note">
    <div class="inner">
      <span class="pip" aria-hidden="true"></span>
      <span><strong>{esc(DISCLOSURE)}</strong></span>
      <span class="aside">We may earn a commission if you buy through our links — at no extra cost to you.</span>
    </div>
  </div>

  <main>
{body}
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-disclosure">{esc(DISCLOSURE)} Product prices and availability observed on official listings on {esc(VERIFIED)} and subject to change.</div>
      <div class="footer-cols">
        <div class="footer-brand">
          <span class="brand-mark">{esc(PUB)}<span class="dot">.</span></span>
          <p>{esc(PUB_SUB)} — five verified kitchen products, guides written as buyer questions, and a public record of everything we could not verify.</p>
        </div>
        <div>
          <h4>The shop</h4>
          <ul>
            <li><a href="{esc(prefix)}index.html">Home</a></li>
            <li><a href="{esc(prefix)}products.html">The shelf</a></li>
            <li><a href="{esc(prefix)}guides/index.html">Guides</a></li>
          </ul>
        </div>
        <div>
          <h4>Dashboard</h4>
          <ul>
{dash_html}
          </ul>
        </div>
      </div>
      <div class="footer-cols" style="margin-top:22px">
        <div></div>
        <div>
          <h4>Follow &amp; index</h4>
          <ul>
            <li><a href="{esc(prefix)}feed.xml">RSS feed</a></li>
            <li><a href="{esc(prefix)}sitemap.xml">Sitemap</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="{esc(prefix)}flagged.html">Flagged for review</a></li>
            <li><a href="{esc(prefix)}questions.html">What we don't know yet</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-legal">
        <span>© <span data-year>2026</span> {esc(PUB)}. All prices are point-in-time observations from official listings.</span>
        <span>Tracking ID <span class="mono">{esc(TRACK)}</span></span>
      </div>
    </div>
  </footer>
</body>
</html>
"""


# ---------------------------------------------------------------- pages

def product_card(p, ribbon=None):
    ribbon_html = f'<span class="ribbon">{esc(ribbon)}</span>' if ribbon else ""
    return f"""<article class="product-card" id="{esc(p['id'].lower())}">
      {ribbon_html}
      <div>{category_pill(p['category'])}</div>
      <h3>{esc(p['short_name'])}</h3>
      <p class="spec">{esc(spec_line(p))}</p>
      <div class="meta-row">
        <span class="price">${p['price_usd']:.2f}<small>observed {esc(p['price_observed'])}</small></span>
        <a class="btn" href="{esc(aff_url(p['observed_redirect_target']))}" rel="sponsored nofollow" data-aff="1" data-product="{esc(p['id'])}">View listing →</a>
      </div>
      <p class="sponsored-note">Sponsored link · official listing {src_link(p['observed_listing_url'], p['observed_redirect_target'], aff=True)}</p>
    </article>"""


def spec_line(p):
    """Spec facts strictly as printed in the official listing title."""
    t = p["title"]
    if p["id"] == "P-01":
        return "6 qt total · two independent 3 qt baskets · easy-view windows · sync finish · hi-fry · auto shutoff"
    if p["id"] == "P-02":
        return "26 qt french door · 24 one-touch presets · countertop convection · six cooking accessories included"
    if p["id"] == "P-03":
        return "8 qt basket · 4-in-1 (bake, dehydrate, frozen) · 450°F hi-fry option · dishwasher-safe basket"
    if p["id"] == "P-04":
        return "1-second read · ±0.5℉ accuracy · NIST & NSF certified · IP67 waterproof · auto-rotate LED"
    if p["id"] == "P-05":
        return "3 ultra-thin probes · WiFi unlimited range · 1000°F heat safe · 5 sensors · Gen3"
    return t


def page_index(data, flags, sugg):
    products = data["products"]
    fryers = [p for p in products if p["category"] == "Air Fryers"]
    thermos = [p for p in products if p["category"] == "Meat thermometers"]
    guides = load_guides()

    guide_cards = "\n".join(
        f"""<a class="guide-card" href="guides/{esc(g['slug'])}">
          <span class="kicker">{esc(g['kicker'])}</span>
          <h3>{esc(g['title'])}</h3>
          <p>{esc(g['dek'])}</p>
          <span class="read">Read the guide →</span>
        </a>""" for g in guides
    )

    shelf = "\n".join(product_card(p) for p in products)

    body = f"""    <section class="hero">
      <div>
        <p class="eyebrow">Kitchen Field Guide · November 2026</p>
        <h1>Five kitchen picks, two honest rooms.</h1>
        <p class="lede">Three air fryers and two meat thermometers — every one checked against its official Amazon listing, priced the day we looked, and linked straight to the source. The guides below answer the questions buyers actually ask, without the hype scores.</p>
        <p class="section-note">Prices observed {esc(VERIFIED)} on the official listings and subject to change. Every product link is marked <em>sponsored</em>, and the Associates disclosure sits at the top of every page.</p>
        <p style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px">
          <a class="btn" href="products.html">Browse the shelf</a>
          <a class="btn btn-ghost" href="guides/index.html">Read the guides</a>
        </p>
      </div>
      <aside class="hero-card">
        <p class="hero-kicker">Start here</p>
        <h2>Two rooms, one shelf</h2>
        <p class="small muted"><span class="pill pill-fryer">Air Fryers</span> — 3 products, from ${min(p['price_usd'] for p in fryers):.2f} observed</p>
        <p class="small muted"><span class="pill pill-thermo">Meat thermometers</span> — 2 products, from ${min(p['price_usd'] for p in thermos):.2f} observed</p>
        <hr class="hairline" style="margin:18px 0">
        <p class="hero-kicker">Fresh from the press</p>
        <ul class="small" style="padding-left:18px;margin:0;color:var(--muted)">
          {"".join(f'<li style="margin-bottom:6px"><a href="guides/{esc(g["slug"])}">{esc(g["title"])}</a></li>' for g in guides[:3])}
        </ul>
      </aside>
    </section>

    <hr class="hairline">

    <h2>The shelf</h2>
    <p class="section-note">Buyer-facing first: what each product is, what it cost when we checked, and where the official listing lives. Full register — including the link-intent record — on <a href="products.html">The shelf</a>.</p>
    <div class="shelf">
{shelf}
    </div>

    <hr class="hairline">

    <h2>Guides written as buyer questions</h2>
    <p class="section-note">Working titles are editorial hypotheses, not claims about popularity or search volume — see <a href="suggestions.html">SG-11</a>. Each guide lists the official sources behind it.</p>
    <div class="guide-grid">
{guide_cards}
    </div>

    <hr class="hairline">

    <h2>How this site works</h2>
    <div class="guide-grid">
      <a class="guide-card" href="analysis.html">
        <span class="kicker">Sourced, not guessed</span>
        <h3>Every table row carries its official source</h3>
        <p>What we verified, what we left blank, and what we flagged — all in the field notes.</p>
        <span class="read">Open field notes →</span>
      </a>
      <a class="guide-card" href="platform.html">
        <span class="kicker">Disclosure, always on</span>
        <h3>The compliance gate runs on every build</h3>
        <p>Disclosure strip, sponsored tags, source coverage and sitemap freshness are machine-checked before anything ships.</p>
        <span class="read">See the machinery →</span>
      </a>
      <a class="guide-card" href="flagged.html">
        <span class="kicker">No hype scores</span>
        <h3>Everything unverified is published, not hidden</h3>
        <p>Ten flags with sources — including the unresolved status of the supplied short links.</p>
        <span class="read">Flagged for review →</span>
      </a>
    </div>"""

    jsonld = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": f"{PUB} — {PUB_SUB}",
        "url": BASE,
        "description": "Verified Amazon kitchen products with buyer-question guides, sourced analysis, and full disclosure.",
        "potentialAction": {
            "@type": "SearchAction",
            "target": BASE + "search.html?q={search_term_string}",
            "query-input": "required name=search_term_string",
        },
    }
    return chrome("index.html", f"{PUB} — {PUB_SUB}: five verified kitchen picks",
                  "Three air fryers and two meat thermometers checked against official Amazon listings, with buyer-question guides, sourced analysis, and disclosure on every page.",
                  body, nav="home", jsonld=jsonld)


def page_products(data):
    products = data["products"]
    rows = []
    intent_rows = []
    for p in products:
        rows.append(f"""<tr>
          <td><strong>{esc(p['short_name'])}</strong><br><span class="small muted">{esc(p['title'])}</span></td>
          <td>{category_pill(p['category'])}<br><span class="small muted">{esc(p['browse_node'])}</span></td>
          {price_cell(p)}
          <td>{esc(p['availability'])}</td>
          <td><a class="btn" href="{esc(aff_url(p['observed_redirect_target']))}" rel="sponsored nofollow" data-aff="1" data-product="{esc(p['id'])}">Buy on Amazon →</a></td>
          <td class="src">{src_link(p['observed_listing_url'], 'Official listing (' + p['observed_redirect_target'] + ')', aff=True)}<br><span class="small muted">source {esc(p['listing_source'])} · observed {esc(p['observed_date'])}</span></td>
        </tr>""")
        intent_rows.append(f"""<tr>
          <td class="mono">{esc(p['submitted_token'])}</td>
          <td>{src_link(p['submitted_link'], 'link.amazon/' + esc(p['submitted_token']))}</td>
          <td class="mono">{esc(p['observed_redirect_target'])}</td>
          <td>{src_link(p['observed_listing_url'], 'official listing', aff=True)}<br><span class="small muted">{esc(p['observed_date'])} · {esc(p['observed_source'])}</span></td>
          <td><span class="blank">blank</span><span class="tag-unverified">awaiting owner</span></td>
          <td><span class="blank">blank</span></td>
        </tr>""")

    body = f"""    <p class="eyebrow">The shelf</p>
    <h1>Five products, linked straight to their official listings</h1>
    <p class="lede">Each row was read from the official Amazon product page on {esc(VERIFIED)}. Prices are buy-box observations from that day — re-check the listing before you buy. Every product link carries our tracking ID and <code>rel="sponsored"</code>.</p>

    <div class="table-wrap">
      <table class="data">
        <caption>The shelf — verified against official listings</caption>
        <thead>
          <tr><th>Product</th><th>Category</th><th>Price observed</th><th>Availability</th><th>Link</th><th>Source</th></tr>
        </thead>
        <tbody>
{chr(10).join(rows)}
        </tbody>
      </table>
    </div>

    <div class="callout">
      <strong>How links work here.</strong> The five links you supplied are short <span class="mono">link.amazon/…</span> tokens. We recorded where each one actually goes (observed {esc(VERIFIED)}), and we link out using the official <span class="mono">/dp/</span> listing URL with tracking ID <span class="mono">{esc(TRACK)}</span> until a one-link-per-product Special Link test confirms the short-link format — we do <em>not</em> claim the supplied links are invalid; their status is unresolved (see <a href="flagged.html">FLG-003</a>).
    </div>

    <h2>Link register — intent vs. observed (never merged)</h2>
    <p class="section-note">The brief requires intended and observed fields to stay in separate columns. Intended ASIN stays blank until the owner confirms it (<a href="questions.html">Q-02</a>); observed columns are measurements with dates and sources.</p>
    <div class="table-wrap">
      <table class="data">
        <caption>Product-intent confirmation record</caption>
        <thead>
          <tr><th>Submitted token</th><th>Submitted link</th><th>Observed destination</th><th>Observed evidence</th><th>Intended ASIN</th><th>Confirmation date</th></tr>
        </thead>
        <tbody>
{chr(10).join(intent_rows)}
        </tbody>
      </table>
    </div>

    <h2>Commission potential</h2>
    <div class="table-wrap">
      <table class="data">
        <caption>Commission rates by category</caption>
        <thead>
          <tr><th>Category</th><th>Rate</th><th>Why blank</th><th>Source</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>{category_pill('Air Fryers')}</td>
            <td><span class="blank">—</span><span class="tag-unverified">unverified</span></td>
            <td class="small muted">The official commission schedule redirects to Associates sign-in; no rate can be confirmed from a public official source (FLG-004). We never estimate.</td>
            <td class="src">{src_link('https://affiliate-program.amazon.com/help/operating/schedule', 'Official commission schedule')}</td>
          </tr>
          <tr>
            <td>{category_pill('Meat thermometers')}</td>
            <td><span class="blank">—</span><span class="tag-unverified">unverified</span></td>
            <td class="small muted">Same as above — rate requires a signed-in Associates account (Q-05).</td>
            <td class="src">{src_link('https://affiliate-program.amazon.com/help/operating/policies', 'Commission Income Statement')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="section-note">Product ratings are deliberately blank: we did not capture the listings' own rating blocks during verification, and we will not infer them (SG-17).</p>"""

    jsonld = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "WinA shelf — verified kitchen products",
        "itemListElement": [
            {"@type": "Product", "position": i + 1, "name": p["short_name"],
             "url": p["observed_listing_url"], "offers": {
                 "@type": "Offer", "price": f"{p['price_usd']:.2f}", "priceCurrency": "USD",
                 "availability": "https://schema.org/InStock", "url": p["observed_listing_url"]}}
            for i, p in enumerate(products)
        ],
    }
    return chrome("products.html", "The shelf — five verified kitchen products",
                  "Three air fryers and two meat thermometers with observed prices, availability, and official listing sources, plus the link-intent register.",
                  body, nav="shelf", jsonld=jsonld, og_type="website")


def load_guides():
    return [
        {"slug": "basket-or-oven.html",
         "kicker": "Air fryers · form factor",
         "title": "Basket or oven-style air fryer: what should you compare?",
         "dek": "Two shapes, two habits. Before you pick a side, compare the six things that actually change how the appliance lives in your kitchen.",
         "hypothesis": "Working title — an editorial hypothesis, not a claim about popularity, search volume, or product superiority."},
        {"slug": "capacity-checklist.html",
         "kicker": "Air fryers · capacity",
         "title": "A no-hype checklist for comparing air fryer capacity",
         "dek": "6 qt, 8 qt, 26 qt — the numbers on the box don't mean the same thing twice. A checklist for reading capacity honestly.",
         "hypothesis": "Working title — an editorial hypothesis, not a claim about popularity, search volume, or product superiority."},
        {"slug": "cleanup-and-counter-space.html",
         "kicker": "Air fryers · cleanup",
         "title": "How to assess cleanup and counter-space trade-offs",
         "dek": "The meal takes 20 minutes; the cleanup decides whether you cook again next week. What to check on the listing before you buy.",
         "hypothesis": "Working title — an editorial hypothesis, not a claim about popularity, search volume, or product superiority."},
        {"slug": "multi-function-questions.html",
         "kicker": "Multi-function · buying process",
         "title": "Questions to ask before buying a multi-function kitchen appliance",
         "dek": "Presets are cheap; counter space is not. Twelve questions that separate 'will use weekly' from 'will use twice'.",
         "hypothesis": "Working title — an editorial hypothesis, not a claim about popularity, search volume, or product superiority."},
        {"slug": "picking-a-meat-thermometer.html",
         "kicker": "Thermometers · category guide",
         "title": "Instant-read or wireless: what to decide before buying a meat thermometer",
         "dek": "Our second room holds two very different probes. Answer four questions first and the choice gets obvious.",
         "hypothesis": "Working title — an editorial hypothesis, not a claim about popularity, search volume, or product superiority."},
    ]


def guide_cta_box(ids, note="Prices observed on the official listing on " + VERIFIED + " — re-check before buying."):
    data = load("products.json")
    by_id = {p["id"]: p for p in data["products"]}
    cards = []
    for pid in ids:
        p = by_id[pid]
        cards.append(f"""<div class="meta-row" style="border-top:1px solid var(--line);padding-top:12px">
            <span><strong>{esc(p['short_name'])}</strong><br><span class="small muted">${p['price_usd']:.2f} observed {esc(p['price_observed'])} · {esc(p['category'])}</span></span>
            <a class="btn" href="{esc(aff_url(p['observed_redirect_target']))}" rel="sponsored nofollow" data-aff="1" data-product="{esc(p['id'])}">View listing →</a>
          </div>""")
    return f"""<div class="box">
      <h3>On our shelf</h3>
      <p class="small muted">{esc(note)}</p>
      {"".join(cards)}
      <p class="small" style="margin-bottom:0">{DISCLOSURE}</p>
    </div>"""


def guide_sources(urls):
    items = "\n".join(f'<li>{a_ext(u, esc(label), aff=("amazon.com" in u))}</li>' for u, label in urls)
    return f"""<div class="sources">
      <p><strong>How we check facts:</strong> every claim in this guide points to an official source below. Nothing here is a superiority score — see <a href="../suggestions.html">SG-17</a>.</p>
      <ol>
{items}
      </ol>
      <p class="sponsored-note">Some links are sponsored — we may earn a commission at no extra cost to you.</p>
    </div>"""


def guide_page(g, body_inner, sources, related, og_type="article"):
    body = f"""    <article class="guide">
      <p class="eyebrow">{esc(g['kicker'])}</p>
      <h1>{esc(g['title'])}</h1>
      <p class="byline"><span>By {esc(BYLINE)}</span><span>Published {esc(VERIFIED)}</span><span>Updated {esc(VERIFIED)}</span></p>
      <p class="hypothesis">⚠ {esc(g['hypothesis'])}</p>
{body_inner}
      <p class="box small" style="background:#fff7ed;border-color:#fcd9a8">{esc(DISCLOSURE)}</p>
{guide_sources(sources)}
      <p class="small"><strong>Keep reading:</strong> {" · ".join(f'<a href="{esc(s)}">{esc(t)}</a>' for s, t in related)}</p>
    </article>"""
    jsonld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": g["title"],
        "description": g["dek"],
        "author": {"@type": "Organization", "name": BYLINE},
        "publisher": {"@type": "Organization", "name": PUB},
        "datePublished": VERIFIED,
        "dateModified": VERIFIED,
        "mainEntityOfPage": BASE + "guides/" + g["slug"],
    }
    return chrome("guides/" + g["slug"], g["title"] + " — " + PUB, g["dek"],
                  body, nav="guides", depth=1, jsonld=jsonld, og_type=og_type)


def page_guides_index():
    guides = load_guides()
    cards = "\n".join(
        f"""<a class="guide-card" href="{esc(g['slug'])}">
          <span class="kicker">{esc(g['kicker'])}</span>
          <h3>{esc(g['title'])}</h3>
          <p>{esc(g['dek'])}</p>
          <span class="read">Read the guide →</span>
        </a>""" for g in guides
    )
    body = f"""    <p class="eyebrow">Guides</p>
    <h1>Buyer questions, answered in the open</h1>
    <p class="lede">Five guides so far — four air-fryer questions and one for the thermometer room. Each one is built from what the official listings actually say, links to its sources, and carries the disclosure inline.</p>
    <p class="section-note">Cadence target: one new guide per week (pending owner confirmation, <a href="../questions.html">Q-10</a>). New guides are added to the <a href="../feed.xml">RSS feed</a> and <a href="../sitemap.xml">sitemap</a> automatically by the build.</p>
    <div class="guide-grid">
{cards}
    </div>
    <div class="callout"><strong>Editorial policy:</strong> working titles are hypotheses, not demand claims (<a href="../suggestions.html">SG-11</a>). Sentences without an official source get deleted, not softened (<a href="../suggestions.html">SG-16</a>).</div>"""
    return chrome("guides/index.html", "Guides — " + PUB,
                  "Question-shaped buying guides for air fryers and meat thermometers, each sourced to official listings.",
                  body, nav="guides", depth=1)


# ---- individual guides

def page_guide_basket_or_oven():
    g = load_guides()[0]
    inner = """
      <p>Walk into any air-fryer listing and you are really choosing between two machines: a <strong>basket</strong> (a drawer you pull out, food in a single layer, fast and simple) and an <strong>oven</strong> (a countertop cavity with a door, racks, and often a light). Neither is “better.” They fail in different ways — and the failure mode is what you live with.</p>

      <h2>1. What actually fits in one go?</h2>
      <p>A basket concentrates heat on one layer, which is the whole trick. An oven-style cavity spreads food across a rack, so capacity numbers are not directly comparable. On our shelf: the <strong>Chefman 6 Qt Dual Basket</strong> is literally two independent 3 qt baskets (one meal, two zones, or two halves of one meal), the <strong>Chefman 8 Qt TurboFry</strong> is one big basket, and the <strong>Emeril Lagasse 26QT</strong> is a french-door oven with six cooking accessories in the box. Ask the listing, not the ad: <em>how many racks or baskets, and what size are they?</em></p>

      <div class="pull">Capacity on the box is a promise about volume. Your kitchen is a promise about surface area.</div>

      <h2>2. Where does it live when it's not cooking?</h2>
      <p>Oven-style units are taller and heavier; drawers need clearance to slide. Before anything else, measure the counter run it will call home — height under the cabinets, depth against the wall, and the swing of the door or drawer. Our <a href="cleanup-and-counter-space.html">cleanup and counter-space guide</a> has the measuring checklist.</p>

      <h2>3. How many things can cook at once?</h2>
      <p>Dual-basket designs solve the “two dishes, two finishes” problem mechanically — the Chefman 6 Qt carries “Sync Finish” in its title, which is the feature that lines up two baskets finishing together. Oven-style units solve it with racks and, in the Emeril listing's words, “24 one-touch preset options.” One approach is hardware; the other is settings. Which one matches how you actually cook?</p>

      <h2>4. What has to be washed?</h2>
      <p>Baskets are few parts and (on both Chefman listings) advertised as dishwasher-safe. Ovens mean racks, trays and accessories — the Emeril listing counts six included. More parts is not a flaw, but it is a decision. See <a href="cleanup-and-counter-space.html">the cleanup guide</a>.</p>

      <h2>5. What do the windows and displays change?</h2>
      <p>The Chefman 6 Qt lists “Easy View Windows” in its title; others ask you to open the drawer. Small feature, real daily difference — you stop lifting the basket to check progress. Same logic for touchscreens versus knobs: check the listing photos and the “About this Item” bullets, not the gallery headline.</p>

      <h2>6. What does the listing promise — and what does it not?</h2>
      <p>Write down three lines from the official listing you would be disappointed to lose, and one thing you do not need. If a product's headline features are all in the second list, it is the wrong machine for you regardless of price. That is the whole method: compare <em>your</em> list against the title and bullets — every fact in this guide came from there.</p>
"""
    sources = [
        ("https://www.amazon.com/dp/B0CDY277D3", "Official listing — Chefman 6 Qt Dual Basket (B0CDY277D3)"),
        ("https://www.amazon.com/dp/B08DKYBTPH", "Official listing — Chefman 8 Qt TurboFry (B08DKYBTPH)"),
        ("https://www.amazon.com/dp/B09B7SB46R", "Official listing — Emeril Lagasse 26QT (B09B7SB46R)"),
    ]
    related = [("capacity-checklist.html", "Capacity checklist"),
               ("cleanup-and-counter-space.html", "Cleanup & counter space"),
               ("../products.html", "The shelf")]
    return guide_page(g, inner, sources, related)


def page_guide_capacity():
    g = load_guides()[1]
    inner = """
      <p>Capacity is the number every air-fryer listing shouts and the number few buyers can compare honestly. “6 qt,” “8 qt,” “26 qt” — three numbers from our own shelf that do not mean three amounts of food. Here is the checklist we use, built only from what official listings state.</p>

      <h2>The checklist</h2>
      <ol>
        <li><strong>Read the structure, not just the number.</strong> The Chefman 6 Qt is “2 Independent 3Qt” baskets — 6 qt is the sum of two smaller zones. The Emeril's 26 qt is an oven cavity with racks. Sum-of-drawers and one-cavity are different machines wearing the same unit.</li>
        <li><strong>Match batches to people.</strong> List how many portions you cook at once on a normal weeknight. If the answer is “one tray, two plates,” a single-basket listing may be enough; if it is “two sides and a main,” dual zones answer that directly.</li>
        <li><strong>Check what “one layer” means.</strong> Basket fryers reward single-layer loading. The listing's own photos show realistic loads — count the pieces in them, not the marketing pile.</li>
        <li><strong>Measure the footprint the number implies.</strong> Bigger cavity, bigger box: depth and height matter more than litres. Use the <a href="cleanup-and-counter-space.html">counter-space checklist</a> before you decide.</li>
        <li><strong>Watch for the per-basket line.</strong> Some listings print “per count” or per-basket math right under the price. Read the fine print in the buy box; our recorded prices are the buy-box total observed on {date}.</li>
        <li><strong>Write the disappointment test.</strong> If your usual meal does not fit in one round, you will cook twice — capacity you never use is just volume on the counter.</li>
      </ol>

      <div class="pull">The right capacity is the smallest number that finishes your real meal in one round — everything beyond that is counter space with a warranty.</div>

      <h2>How our three fryers state capacity</h2>
      <ul>
        <li><strong>Chefman 6 Qt Dual Basket</strong> — 6 qt total as two independent 3 qt nonstick baskets, easy-view windows, sync finish (from the official title).</li>
        <li><strong>Chefman 8 Qt TurboFry</strong> — one 8 qt XL basket, 4-in-1 with a 450°F hi-fry option (from the official title).</li>
        <li><strong>Emeril Lagasse 26QT</strong> — french-door oven-style cavity, 24 one-touch presets, six accessories included (from the official title).</li>
      </ul>
      <p class="small muted">No usable-volume testing was performed by us; these are manufacturer-stated figures as printed on the listings. Interior usable volume can differ from stated capacity — treat the numbers as comparable only within the same structure type.</p>
""".replace("{date}", VERIFIED)
    sources = [
        ("https://www.amazon.com/dp/B0CDY277D3", "Official listing — Chefman 6 Qt Dual Basket (B0CDY277D3)"),
        ("https://www.amazon.com/dp/B08DKYBTPH", "Official listing — Chefman 8 Qt TurboFry (B08DKYBTPH)"),
        ("https://www.amazon.com/dp/B09B7SB46R", "Official listing — Emeril Lagasse 26QT (B09B7SB46R)"),
    ]
    related = [("basket-or-oven.html", "Basket or oven"),
               ("multi-function-questions.html", "Multi-function questions"),
               ("../products.html", "The shelf")]
    return guide_page(g, inner, sources, related)


def page_guide_cleanup():
    g = load_guides()[2]
    inner = """
      <p>Cleanup is the feature no one demos and every owner meets. A machine you avoid washing becomes a machine you avoid using — so read the listing like a chore chart before you read it like a spec sheet.</p>

      <h2>The 10-minute measuring drill (before you buy)</h2>
      <ul>
        <li><strong>Mark the footprint.</strong> Tape the listing's dimensions on the counter. Open your real cabinet above it — can the drawer or door clear it?</li>
        <li><strong>Count the parts.</strong> Basket designs list one or two baskets; the Chefman listings advertise dishwasher-safe nonstick baskets. The Emeril listing includes six cooking accessories — each one is a wash. Count them now, not after the first meal.</li>
        <li><strong>Check the coating claims verbatim.</strong> “Nonstick,” “dishwasher-safe,” “stainless steel” appear in our listings' own titles. Copy the exact phrase you are relying on; if the listing does not say it, do not assume it.</li>
        <li><strong>Look for windows and lights.</strong> The Chefman 6 Qt's “Easy View Windows” mean fewer lid-lifts and fewer splatters during cooking — a cleanup feature disguised as a viewing feature.</li>
        <li><strong>Plan the grease path.</strong> Drawers drip when you pull them. Where does it land on your counter — and is that surface easy to wipe?</li>
      </ul>

      <h2>For the thermometer room, cleanup is different</h2>
      <p>The <strong>ThermoMaven 1 Sec</strong> lists IP67 waterproofing in its official title — water ingress protection is the cleanup feature that matters when a probe meets raw meat and a sink. The <strong>CHEF iQ Sense Gen3</strong> is a wireless-probe system: no cable in the pan, but there is a base station to wipe and probes to store. Ask the listing how each part is cleaned and stored; the answer decides whether the gadget stays in the drawer.</p>

      <div class="pull">If washing it takes longer than cooking it, the appliance will quietly retire itself to the back of the cupboard.</div>

      <h2>Counter-space trade-offs in one pass</h2>
      <ol>
        <li>Footprint on the counter (width × depth, taped out).</li>
        <li>Vertical clearance for lids, doors, and drawer pull.</li>
        <li>Storage path: cupboard → counter → sink → dishwasher. If any leg needs a two-hand carry, that machine stays put.</li>
        <li>Heat and steam: ovens vent from the back or top — check the listing's placement guidance before choosing the wall run.</li>
      </ol>
      <p>None of this requires a review site: it requires the listing's dimensions, its parts list, and ten minutes of tape. That is the entire method behind this guide.</p>
"""
    sources = [
        ("https://www.amazon.com/dp/B0CDY277D3", "Official listing — Chefman 6 Qt (windows, dishwasher-safe baskets)"),
        ("https://www.amazon.com/dp/B08DKYBTPH", "Official listing — Chefman 8 Qt (dishwasher-safe basket, stainless steel)"),
        ("https://www.amazon.com/dp/B09B7SB46R", "Official listing — Emeril Lagasse 26QT (six accessories)"),
        ("https://www.amazon.com/dp/B0DHZTCNR5", "Official listing — ThermoMaven (IP67 waterproof in title)"),
        ("https://www.amazon.com/dp/B0DZFD6R9Z", "Official listing — CHEF iQ Sense Gen3 (wireless probes)"),
    ]
    related = [("basket-or-oven.html", "Basket or oven"),
               ("capacity-checklist.html", "Capacity checklist"),
               ("../products.html", "The shelf")]
    return guide_page(g, inner, sources, related)


def page_guide_multi_function():
    g = load_guides()[3]
    inner = """
      <p>Multi-function appliances sell on the word “more.” Before you buy one, run it through questions that cannot be answered by a preset count. Twelve of them, in the order we ask them.</p>

      <h2>The questions</h2>
      <ol>
        <li><strong>What will it cook in a normal week?</strong> Write three meals. If none of them need the extra functions, the functions are packaging.</li>
        <li><strong>What does it replace?</strong> A 26 qt french-door unit that replaces the toaster oven and the air fryer earns its footprint twice. One that replaces nothing earns it once.</li>
        <li><strong>What does it NOT replace?</strong> Honest answer now beats regret later — nothing on our shelf replaces a full-size oven for a holiday bird; check cavity size on the listing before assuming.</li>
        <li><strong>How many presets will you actually press?</strong> The Emeril listing states “24 One-Touch Preset Options.” Pick the two you would use weekly. If you cannot name two, presets are not the reason to buy.</li>
        <li><strong>Who washes it?</strong> Parts count beats function count — see the <a href="cleanup-and-counter-space.html">cleanup guide</a>.</li>
        <li><strong>Where does it live permanently?</strong> Tape the footprint. If the tape competes with your coffee station, something will lose.</li>
        <li><strong>What is the failure question?</strong> What breaks first in your home: coating, latch, window, element? Choose the listing whose headline features sit furthest from your known weak point.</li>
        <li><strong>What does the return window look like?</strong> Check the listing's current return terms on the day you buy; they change seasonally (the listings we read on {date} advertised holiday return windows).</li>
        <li><strong>What is the ceiling price you will not exceed?</strong> Set it before you see the upsell. Our observed buy-box prices for the shelf: $69.99, $79.93, $149.99 that day.</li>
        <li><strong>Do you need wireless, app, or WiFi at all?</strong> The CHEF iQ Sense lists WiFi unlimited range; a $16.99-class instant-read solves the same core problem without an account. Decide the layer you want to live with.</li>
        <li><strong>What does “multi-function” cost in preheat and storage?</strong> Modes share one cavity — check the listing's stated time and temperature ranges for the modes you named in Q1.</li>
        <li><strong>Would you buy it again after month three?</strong> That is the only review that matters, and you cannot read it yet. Buy the version whose spec sheet you can defend without a review score.</li>
      </ol>

      <div class="pull">Presets are cheap. Counter space, washing-up, and the honest answer to “what does it replace” are the real price.</div>

      <p class="small muted">Prices in this guide are buy-box observations from {date} on the official listings and change without notice — re-check before buying.</p>
""".replace("{date}", VERIFIED)
    sources = [
        ("https://www.amazon.com/dp/B09B7SB46R", "Official listing — Emeril Lagasse 26QT (24 presets, six accessories)"),
        ("https://www.amazon.com/dp/B0CDY277D3", "Official listing — Chefman 6 Qt Dual Basket"),
        ("https://www.amazon.com/dp/B08DKYBTPH", "Official listing — Chefman 8 Qt TurboFry"),
        ("https://www.amazon.com/dp/B0DZFD6R9Z", "Official listing — CHEF iQ Sense Gen3 (WiFi)"),
        ("https://www.amazon.com/dp/B0DHZTCNR5", "Official listing — ThermoMaven instant-read"),
    ]
    related = [("basket-or-oven.html", "Basket or oven"),
               ("cleanup-and-counter-space.html", "Cleanup & counter space"),
               ("../products.html", "The shelf")]
    return guide_page(g, inner, sources, related)


def page_guide_thermometer():
    g = load_guides()[4]
    inner = """
      <p>Our thermometer room holds two products that look like they solve different problems — because they do. One is a <strong>1-second instant-read</strong> with a probe you hold and dip; the other is a <strong>WiFi wireless probe system</strong> that stays in the meat while the oven does its work. Four questions settle which one is yours.</p>

      <h2>Question 1: Do you leave the food alone, or check it constantly?</h2>
      <p>Instant-read logic: you open the lid, probe, close — repeat until done. The <strong>ThermoMaven 1 Sec</strong> listing states a 1-second read and ±0.5℉ accuracy in its official title, built for that quick-check rhythm. Wireless logic: the probe reports while you stay out of the kitchen. The <strong>CHEF iQ Sense Gen3</strong> lists 3 ultra-thin probes, WiFi unlimited range, and 5 sensors in its title. If you hover, buy instant-read; if you walk away, buy wireless.</p>

      <h2>Question 2: Where does it cook?</h2>
      <p>Grill side vs oven interior changes everything. An instant-read works anywhere you can reach; a wireless probe must survive the environment it sits in — the CHEF iQ listing states 1000°F heat safe for its probes, which is a claim about the probe's surroundings, not about your target temperature. Read the listing's heat limits for <em>your</em> setup: grill lid gap, oven door seal, smoker chamber.</p>

      <h2>Question 3: What is your relationship with apps?</h2>
      <p>WiFi range in a title means an account, a phone, and a base station in the picture. The instant-read needs none of that. Neither is a flaw — but one of them adds a support surface to your kitchen. If a screen-free tool is the point, the $16.99-class instant-read keeps the loop short.</p>

      <h2>Question 4: How will it be cleaned and stored?</h2>
      <p>The ThermoMaven listing states IP67 waterproofing — rinse, wipe, done, which matters after raw meat. For the wireless system, count the parts: probes, base, charger. The <a href="cleanup-and-counter-space.html">cleanup guide</a> applies here too: every extra part is a future reason to skip the tool.</p>

      <div class="pull">Buy the thermometer whose failure mode you can live with: missing a number by opening the lid — or missing a number because the app did not connect.</div>

      <h2>What we do not claim</h2>
      <p>We did not run accuracy tests, cook-off comparisons, or long-term durability trials. Every spec above is quoted from the products' own official listing titles as read on {date}; ratings on those listings were not captured during verification and are deliberately blank on this site (see <a href="../flagged.html">FLG-007</a> discipline and <a href="../suggestions.html">SG-17</a>). If a test matters to you, run it after purchase — or tell us and we will add it as a flagged, sourced experiment (<a href="../questions.html">Q-13</a> policy).</p>
""".replace("{date}", VERIFIED)
    sources = [
        ("https://www.amazon.com/dp/B0DHZTCNR5", "Official listing — ThermoMaven 1 Sec (1 sec, ±0.5℉, IP67 in title)"),
        ("https://www.amazon.com/dp/B0DZFD6R9Z", "Official listing — CHEF iQ Sense Gen3 (3 probes, WiFi, 1000°F in title)"),
    ]
    related = [("../products.html", "The shelf"),
               ("multi-function-questions.html", "Multi-function questions"),
               ("cleanup-and-counter-space.html", "Cleanup & counter space")]
    return guide_page(g, inner, sources, related)


# ---- dashboards

def page_analysis(data, flags, sugg, questions):
    products = data["products"]
    ver_rows = []
    price_rows = []
    for p in products:
        ver_rows.append(f"""<tr>
          <td class="mono">{esc(p['submitted_token'])}</td>
          <td class="num">{len(p['submitted_token'])} chars<span class="tag-unverified">≠ ASIN (10)</span></td>
          <td class="mono">{esc(p['observed_redirect_target'])}</td>
          <td>{category_pill(p['category'])}</td>
          <td>live official listing</td>
          <td class="src">{src_link(p['submitted_link'], 'token ' + esc(p['submitted_token']))} · {src_link(p['observed_listing_url'], 'listing', aff=True)} · {src_link('https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-items', 'ASIN definition')}</td>
        </tr>""")
        price_rows.append(f"""<tr>
          <td><strong>{esc(p['short_name'])}</strong></td>
          <td class="num">${p['price_usd']:.2f}</td>
          <td>{esc(p['price_kind'])}</td>
          <td>{esc(p['price_observed'])}</td>
          <td>{esc(p['availability'])}</td>
          <td class="src">{src_link(p['observed_listing_url'], 'Official listing', aff=True)} · {esc(p['listing_source'])}</td>
        </tr>""")

    compliance_rows = [
        ("Disclosure above the fold, every page", "implemented",
         "Strip under masthead + footer repeat; gate fails the build if missing",
         "https://affiliate-program.amazon.com/help/operating/agreement", "OA §5 · S12"),
        ("Disclosure wording", "implemented",
         "Exact §5 sentence: “" + DISCLOSURE + "”",
         "https://affiliate-program.amazon.com/help/operating/agreement", "OA §5 · S12"),
        ("rel=\"sponsored\" on product links", "implemented",
         "All outbound Amazon links carry rel=\"sponsored nofollow\"; gate-enforced",
         "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links", "Google · S15"),
        ("Tracking tag on product links", "implemented (unconfirmed active)",
         "tag=" + TRACK + " on every CTA; status in reports unconfirmed",
         "https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-items", "FLG-005 · Q-03"),
        ("Supplied short links → Special Links", "pending test",
         "One-link-per-product test in enrolled workflow required before scaling",
         "https://affiliate-program.amazon.com/help/operating/agreement", "OA §1 · FLG-003 · Q-04"),
        ("Commission rates published", "deliberately blank",
         "Schedule requires sign-in; no rate estimated anywhere",
         "https://affiliate-program.amazon.com/help/operating/schedule", "FLG-004 · Q-05"),
        ("Search Console + sitemap submission", "pending owner action",
         "sitemap.xml ships; property not yet added/verified",
         "https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site", "FLG-008 · Q-09"),
    ]
    comp_rows_html = "\n".join(
        f"""<tr>
          <td><strong>{esc(what)}</strong></td>
          <td>{esc(status)}</td>
          <td class="small muted">{esc(detail)}</td>
          <td class="src">{src_link(url, 'Official source')}</td>
          <td class="small">{esc(ref)}</td>
        </tr>""" for what, status, detail, url, ref in compliance_rows
    )

    body = f"""    <p class="eyebrow">Field notes</p>
    <h1>What we verified, what we left blank, what we flagged</h1>
    <p class="lede">The analytical surface of this site. Every row links to the official source it came from; anything unconfirmable is blank and tagged <span class="tag-unverified">unverified</span>. No revenue, conversion, or demand numbers exist here because none have been obtained from authorized first-party reports.</p>

    <div class="stat-row">
      <div class="stat"><div class="stat-value">5 / 5</div><div class="stat-label">links resolved to live official listings ({esc(VERIFIED)})</div></div>
      <div class="stat"><div class="stat-value">3 + 2</div><div class="stat-label">air fryers + meat thermometers (two browse nodes)</div></div>
      <div class="stat"><div class="stat-value">{len(flags)}</div><div class="stat-label">flags published, none blocking</div></div>
      <div class="stat"><div class="stat-value">{len(questions)}</div><div class="stat-label">open questions gating further decisions</div></div>
    </div>

    <h2>Finding 1 — the shelf is two categories, not one</h2>
    <p>Three tokens land in <strong>Air Fryers (node 17659096011)</strong>; two land in <strong>Meat thermometers (node 289810)</strong>, read from the official breadcrumbs. The site therefore ships two rooms until the owner decides scope (<a href="questions.html">Q-01</a>, default Path B). Sources: the five listings in the table below.</p>

    <div class="table-wrap">
      <table class="data">
        <caption>Verification matrix — one row per submitted link</caption>
        <thead><tr><th>Token</th><th>Length</th><th>Observed destination</th><th>Category</th><th>/dp/ behavior</th><th>Sources</th></tr></thead>
        <tbody>
{chr(10).join(ver_rows)}
        </tbody>
      </table>
    </div>
    <p class="section-note">Tokens are 9 characters against Amazon's official 10-character ASIN definition (S11); direct <span class="mono">/dp/&lt;token&gt;</span> fetches did not render a product page (S18, S19 — two independent tokens). This is recorded as an observation only: the brief forbids claiming the supplied links are invalid, and their compliance status remains FLG-003.</p>

    <h2>Finding 2 — prices we observed (buy box, {esc(VERIFIED)})</h2>
    <div class="table-wrap">
      <table class="data">
        <caption>Point-in-time price observations</caption>
        <thead><tr><th>Product</th><th>Price</th><th>Kind</th><th>Observed</th><th>Availability</th><th>Source</th></tr></thead>
        <tbody>
{chr(10).join(price_rows)}
        </tbody>
      </table>
    </div>
    <p class="section-note">FLG-007: prices change without notice; re-verify on the day of republication (Q-13 policy).</p>

    <h2>Finding 3 — commission potential is blank on purpose</h2>
    <p>The official schedule page redirects to Associates sign-in (S14). Until an authorized account readout exists (Q-05), rate cells stay empty and tagged unverified — no forecast, no expected-earnings table, consistent with Operating Agreement §4 (no representation about traffic or commission income; S12).</p>

    <h2>Finding 4 — compliance gate status</h2>
    <div class="table-wrap">
      <table class="data">
        <caption>Disclosure &amp; API policy checks in the publishing workflow</caption>
        <thead><tr><th>Control</th><th>Status</th><th>Detail</th><th>Source</th><th>Ref</th></tr></thead>
        <tbody>
{comp_rows_html}
        </tbody>
      </table>
    </div>

    <h2>Finding 5 — measurement is on, data is not yet flowing</h2>
    <p>The five events (<code>page_view</code>, <code>outbound_click</code>, <code>affiliate_click</code>, <code>search_query</code>, <code>article_read</code>) are defined in <a href="platform.html">the platform</a> and recorded by <span class="mono">assets/analytics.js</span>. No endpoint is deployed yet (FLG-010), so events queue locally and no click numbers are published. The campaign ledger below stays empty until rows arrive from authorized first-party reports.</p>

    <div class="table-wrap">
      <table class="data">
        <caption>Campaign ledger — empty by design</caption>
        <thead><tr><th>Timestamp</th><th>Source</th><th>Channel</th><th>Eligible sessions</th><th>Clicks</th><th>Reported orders</th><th>Provenance</th></tr></thead>
        <tbody>
        </tbody>
      </table>
    </div>
    <p class="section-note">No conversion score or revenue forecast is presented anywhere on this site (Priority 4: measure before automating optimization). Ledger schema lives at <span class="mono">data/campaign-ledger.csv</span>.</p>

    <h2>The source register</h2>
    <div class="table-wrap">
      <table class="data">
        <caption>All sources, fetched {esc(VERIFIED)}</caption>
        <thead><tr><th>ID</th><th>Source</th><th>Publisher</th><th>What it supports</th></tr></thead>
        <tbody>
{source_rows()}
        </tbody>
      </table>
    </div>"""
    return chrome("analysis.html", "Field notes — sourced analysis " + PUB,
                  "Verification matrix, observed prices, commission blanks, compliance gate status and the full source register for the WinA shelf.",
                  body)


def source_rows():
    src = load("sources.json")
    rows = []
    for s in src["sources"]:
        rows.append(f"""<tr>
          <td class="mono">{esc(s['id'])}</td>
          <td class="src">{src_link(s['url'], esc(s['title']))}</td>
          <td class="small">{esc(s['publisher'])}</td>
          <td class="small muted">{esc(s['supports'])}</td>
        </tr>""")
    return "\n".join(rows)


def page_suggestions(sugg):
    paths_html = []
    for path in sugg["paths"]:
        paths_html.append(f"""<div class="path-card" data-path="{esc(path['id'])}">
          <span class="pill pill-plain">{esc(path['id'])}</span>
          <h3>{esc(path['name'])}</h3>
          <p>{esc(path['summary'])}</p>
          <p class="small"><strong>Consequences:</strong> {esc(path['consequences'])}</p>
          <p class="gates">Gate: {esc(path['gates'])}</p>
          <label><input type="radio" name="path" value="{esc(path['id'])}"> Choose {esc(path['id'])} — records only</label>
        </div>""")

    sugg_html = []
    for s in sugg["suggestions"]:
        st = s["status"]
        chip = "done" if "implemented" in st or "standing" in st else ("gated" if "gated" in st else "")
        if "standing" in st:
            chip = "done"
        srcs = " · ".join(src_link(url, sid, aff=("amazon.com" in url))
                           for sid, url in [(x["id"], x["url"]) for x in load("sources.json")["sources"] if x["id"] in s["sources"]])
        sugg_html.append(f"""<div class="suggestion" data-status="{esc(st)}">
          <div class="sg-head">
            <span class="sg-id">{esc(s['id'])}</span>
            <h3>{esc(s['title'])}</h3>
            <span class="status-chip {chip}">{esc(st)}</span>
          </div>
          <p>{esc(s['body'])}</p>
          <p class="sg-meta">Gate: {esc(s['prerequisite'])} · effort: {esc(s['effort'])} · impact: {esc(s['impact'])}{(' · sources: ' + srcs) if srcs else ''}</p>
        </div>""")

    body = f"""    <p class="eyebrow">Suggestions review</p>
    <h1>Review the suggestions, choose a path — nothing changes until a human applies it</h1>
    <p class="lede">This is the review surface the brief asks for: every suggestion with the prerequisite that gates it, three complete paths compared on consequences, and a chooser that <strong>records a choice locally and applies nothing</strong>.</p>

    <h2>Choose a path</h2>
    <div class="path-grid" id="path-chooser">
{chr(10).join(paths_html)}
    </div>
    <div class="chooser-bar">
      <span id="choice-out">No path recorded yet.</span>
      <button class="btn btn-ghost" id="choice-clear" type="button">Clear recorded choice</button>
      <span class="small">Stored in this browser only (localStorage). The site itself is unaffected.</span>
    </div>

    <h2>All suggestions</h2>
    <p class="section-note">IDs SG-21..SG-26 are reserved for parallel sessions and intentionally absent. Statuses: implemented = shipped in this build; gated = waiting on an open question; standing = a rule that applies to future work.</p>
    <div class="filter-row">
      <button class="active" data-filter="all" type="button">All</button>
      <button data-filter="done" type="button">Implemented</button>
      <button data-filter="gated" type="button">Gated</button>
      <button data-filter="standing" type="button">Standing rules</button>
    </div>
    <div class="flag-list">
{chr(10).join(sugg_html)}
    </div>"""
    return chrome("suggestions.html", "Suggestions review — " + PUB,
                  "Review every suggestion with its gating prerequisite, compare three complete paths, and record a choice without applying any change.",
                  body)


def page_questions(payload):
    questions = payload["questions"]
    items = []
    for q in questions:
        related = " · ".join(f'<a href="suggestions.html">{esc(r)}</a>' if r.startswith("SG") or r.startswith("PATH")
                             else (f'<a href="flagged.html">{esc(r)}</a>' if r.startswith("FLG")
                                   else f'<span class="mono">{esc(r)}</span>')
                             for r in q["related"])
        items.append(f"""<details class="qa">
          <summary><span class="sg-id">{esc(q['id'])}</span>{esc(q['question'])}<span class="qa-status">{esc(q['status'])}</span></summary>
          <div class="qa-body">
            <dl>
              <dt>What is established</dt><dd>{esc(q['established'])}</dd>
              <dt>What is missing</dt><dd>{esc(q['missing'])}</dd>
              <dt>Action that closes it</dt><dd>{esc(q['action'])}</dd>
              <dt>What it blocks</dt><dd>{esc(q['blocks'])}</dd>
              <dt>Default if unanswered</dt><dd>{esc(q['default'])}</dd>
            </dl>
            <p class="qa-links">Related: {related}</p>
          </div>
        </details>""")
    body = f"""    <p class="eyebrow">Open questions</p>
    <h1>What must be answered before any decision can reasonably be made</h1>
    <p class="lede">Fifteen questions, each with what we already have, what we do not have, the action that closes it, what it blocks, and the default that applies while it stays open. These are also the questions that <em>discover</em> the missing information — every suggestion on <a href="suggestions.html">the review page</a> maps to one of them.</p>
    <p class="section-note">No question here is rhetorical: each one has an owner action and a safe default. Open a row to read the full record.</p>
{chr(10).join(items)}"""
    return chrome("questions.html", "Open questions — " + PUB,
                  "Fifteen decision-blocking questions with what is established, what is missing, the closing action, what it blocks, and the default if unanswered.",
                  body)


def page_flagged(flags):
    cards = []
    for f in flags["flags"]:
        sev = f["severity"].lower()
        srcs = []
        src = load("sources.json")
        by_id = {s["id"]: s for s in src["sources"]}
        for sid in f["sources"]:
            s = by_id[sid]
            srcs.append(src_link(s["url"], sid + " — " + s["title"][:60], aff=("amazon.com" in s["url"])))
        cards.append(f"""<div class="flag sev-{esc(sev)}">
          <div class="flag-head">
            <span class="flag-id">{esc(f['id'])}</span>
            <span class="sev"><span class="{esc(sev)}">{esc(f['severity'])}</span></span>
            <h3>{esc(f['title'])}</h3>
          </div>
          <p>{esc(f['detail'])}</p>
          <p class="flag-status">Status: {esc(f['status'])}</p>
          <p class="flag-sources">Sources: {" · ".join(srcs) if srcs else "<em>no external source — repository-internal definition (FLG-009)</em>"}</p>
        </div>""")
    body = f"""    <p class="eyebrow">Flagged for review</p>
    <h1>Everything we could not verify, in the open</h1>
    <p class="lede">Ten flags with their source links, so review happens after the site is live — flagged items do not block the merge, and none of them are hidden behind “trust us.” If a value here is wrong, the source link is how you check it.</p>
    <div class="flag-list">
{chr(10).join(cards)}
    </div>
    <div class="callout"><strong>Nothing on this page is a verdict.</strong> The supplied short links are <em>not</em> claimed invalid — their exact compliance status is unresolved (FLG-003) and the closing action is the one-link-per-product test described in <a href="questions.html">Q-04</a>.</div>"""
    return chrome("flagged.html", "Flagged for review — " + PUB,
                  "Ten flagged irregularities with severities, statuses, and official source links — including the unresolved Special Link question.",
                  body)


def page_executive(flags, questions, sugg, data):
    products = data["products"]
    rows = "\n".join(
        f"""<tr>
          <td class="mono">{esc(p['submitted_token'])}</td>
          <td>{esc(p['short_name'])}</td>
          <td>{category_pill(p['category'])}</td>
          <td class="num">${p['price_usd']:.2f}<br><span class="small muted">observed {esc(p['price_observed'])}</span></td>
          <td class="mono">{esc(p['observed_redirect_target'])}</td>
          <td class="src">{src_link(p['observed_listing_url'], 'Official listing', aff=True)}</td>
        </tr>""" for p in products
    )
    body = f"""    <p class="eyebrow">Executive summary</p>
    <h1>The whole project on one page</h1>
    <p class="lede">WinA is a publication-grade Amazon affiliate site for five owner-supplied product links: three air fryers and two meat thermometers. This session verified every link against its official Amazon listing, built the shop-first site with disclosure and sponsored links enforced by a build gate, and published everything unverifiable on a flagged page instead of smoothing it over.</p>

    <h2>The five products (all verified {esc(VERIFIED)})</h2>
    <div class="table-wrap">
      <table class="data">
        <caption>Product register — observed destinations and buy-box prices</caption>
        <thead><tr><th>Submitted token</th><th>Product</th><th>Category</th><th>Price</th><th>Destination</th><th>Source</th></tr></thead>
        <tbody>
{rows}
        </tbody>
      </table>
    </div>

    <h2>What was built</h2>
    <ul>
      <li><strong>Shop-first front page</strong> — products and guides above the fold; all dashboard surfaces live in one footer group (<a href="index.html">Home</a>).</li>
      <li><strong>Five question-shaped guides</strong> with inline disclosure, sponsored CTAs, and per-guide source lists (<a href="guides/index.html">Guides</a>).</li>
      <li><strong>Verification surfaces</strong> — <a href="products.html">shelf + intent register</a>, <a href="analysis.html">field notes</a>, <a href="flagged.html">flags</a>, <a href="questions.html">open questions</a>, <a href="suggestions.html">suggestions review</a> with a records-only path chooser.</li>
      <li><strong>Measurement</strong> — five-event privacy-preserving counter (<span class="mono">assets/analytics.js</span>), self-hosted endpoint code (<span class="mono">tools/analytics_endpoint.py</span>), empty campaign ledger (<span class="mono">data/campaign-ledger.csv</span>).</li>
      <li><strong>Findability</strong> — sitemap.xml, robots.txt, RSS feed, client-side search, canonical/OG tags, JSON-LD (WebSite / BlogPosting / ItemList).</li>
      <li><strong>The gate</strong> — <span class="mono">scripts/check_site.py</span> enforces disclosure placement, sponsored+tagged links, source coverage on every data-table row, internal link integrity, sitemap/feed coverage, and data↔page sync before any push.</li>
    </ul>

    <h2>What is deliberately absent</h2>
    <ul>
      <li>Commission rates (blank + unverified — schedule requires sign-in; FLG-004).</li>
      <li>Product ratings (not captured from listings' own rating blocks; SG-17).</li>
      <li>Any conversion, revenue, or demand claim (no authorized first-party data exists; Priority 4).</li>
      <li>Email capture forms (provider + privacy decision pending; Q-14).</li>
      <li>Hotlinked product imagery (only official Program Content after account approval; Q-11).</li>
    </ul>

    <h2>Decision state</h2>
    <p>{len(flags)} flags published (3 High, all about link identity and Special-Link status), {len(questions)} open questions, {len([s for s in sugg['suggestions'] if 'implemented' in s['status']])} of {len(sugg['suggestions'])} suggestions implemented. Recommended path: <strong>Path B</strong> (two rooms) while Q-01 is unanswered — reversible to Path A in one edit.</p>

    <h2>Next actions, in order</h2>
    <ol class="next-list">
      <li><strong>Run the Special Link test</strong> (Q-04): one official link per product in the enrolled Associates workflow; confirm destination + tracking report; then decide the outbound link style (SG-07).</li>
      <li><strong>Confirm the tracking ID</strong> (Q-03) and the Associates account standing (Q-15); first click in Reports unlocks ledger rows.</li>
      <li><strong>Deploy the analytics endpoint</strong> (Q-08) and set <span class="mono">ANALYTICS_ENDPOINT</span>; watch the five events arrive.</li>
      <li><strong>Add + verify Search Console</strong> (Q-09), submit <span class="mono">sitemap.xml</span>, and pick the next guide from measured queries (SG-18).</li>
      <li><strong>Answer Q-01</strong> (scope) and Q-02 (intended ASINs) in the records — blanks flip to values, flags close.</li>
    </ol>

    <div class="callout"><strong>Compliance posture:</strong> disclosure uses the exact Operating Agreement §5 sentence above the fold and in the footer of every page; all product links are <code>rel="sponsored"</code> with the owner-supplied tag; no income claims; no unverified number anywhere. Sources: <a href="https://affiliate-program.amazon.com/help/operating/agreement">Operating Agreement</a> · <a href="https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers">FTC Disclosures 101</a> · <a href="https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links">Google rel=sponsored</a>.</div>"""
    return chrome("executive-summary.html", "Executive summary — " + PUB,
                  "One-page summary of the five verified products, what was built, what is deliberately absent, and the ordered next actions.",
                  body)


def page_platform():
    events = load("analytics-events.json")
    ev_rows = "\n".join(
        f"""<div class="suggestion" style="margin-bottom:12px">
          <div class="sg-head"><span class="sg-id">{esc(e['name'])}</span><h3>{esc(e['why'])}</h3></div>
          <p class="sg-meta">Trigger: {esc(e['trigger'])} · payload: <span class="mono">{esc(', '.join(e['payload']))}</span></p>
        </div>""" for e in events["events"]
    )
    body = f"""    <p class="eyebrow">Platform &amp; sources</p>
    <h1>The machinery — automated where it can be, gated where it cannot</h1>
    <p class="lede">WinA is built as a small, auditable pipeline: verified data in <span class="mono">data/</span>, a generator (<span class="mono">scripts/build_site.py</span>), and a gate (<span class="mono">scripts/check_site.py</span>) that must pass before anything is pushed. Human decisions — scope, intent, paths — are never automated; they sit on <a href="suggestions.html">the review page</a> and <a href="questions.html">the questions list</a>.</p>

    <h2>The pipeline</h2>
    <ol class="next-list">
      <li><strong>Intake</strong> — submitted link + observed redirect + date + source, stored in separate intent/observed fields (<span class="mono">data/intent-record</span> inside <span class="mono">data/products.json</span>).</li>
      <li><strong>Verify</strong> — fetch the official listing; record title, price, availability, browse node against a source ID in <span class="mono">data/sources.json</span>. Unconfirmable values stay blank + flagged.</li>
      <li><strong>Render</strong> — generator emits pages, sitemap, feed, search index from the data; no hand-copied numbers.</li>
      <li><strong>Gate</strong> — checker enforces disclosure, sponsored links, source coverage, link integrity, sitemap/feed coverage, data↔page sync. Exit code non-zero = no push.</li>
      <li><strong>Measure</strong> — five events via the privacy-preserving counter; ledger rows only from authorized first-party reports.</li>
    </ol>

    <h2>The five events (recorded, privacy-preserving)</h2>
    <p class="section-note">FLG-009: no canonical event list existed in the repository; this documented set is the adopted five — replace only on owner confirmation (Q-12). No cookies, no IPs, no fingerprinting; Do Not Track short-circuits everything.</p>
{ev_rows}

    <h2>Self-hosted endpoint</h2>
    <div class="table-wrap">
      <table class="data">
        <caption>Endpoint contract</caption>
        <thead><tr><th>Item</th><th>Value</th><th>Detail</th><th>Source</th></tr></thead>
        <tbody>
          <tr><td>Ingest</td><td class="mono">POST /e</td><td class="src">{src_link('https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site', 'GitHub Pages is static-only (S17)')} — code ships in <span class="mono">tools/analytics_endpoint.py</span></td></tr>
          <tr><td>Health</td><td class="mono">GET /healthz</td><td class="small">returns {{"ok": true, "events": n}}</td><td class="src">{src_link('https://github.com/sassnarep3-star/WinA/blob/main/tools/analytics_endpoint.py', 'Endpoint source code (this repository)')}</td></tr>
          <tr><td>Storage</td><td class="mono">data/analytics-events.ndjson</td><td class="small">append-only NDJSON; no IP or User-Agent stored</td><td class="src">{src_link('https://github.com/sassnarep3-star/WinA/blob/main/tools/analytics_endpoint.py', 'Endpoint source code (this repository)')}</td></tr>
          <tr><td>Deployment</td><td><span class="blank">not set</span><span class="tag-unverified">pending Q-08</span></td><td class="small">owner hosts it anywhere; then set ANALYTICS_ENDPOINT in assets/analytics.js</td><td class="src">{src_link('https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site', 'GitHub Pages is static-only (S17)')}</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Compliance gate (runs on every build)</h2>
    <ul>
      <li>Disclosure strip present above <code>&lt;main&gt;</code> on every page + footer repeat — exact §5 wording (<a href="https://affiliate-program.amazon.com/help/operating/agreement">OA §5</a>).</li>
      <li>Every <span class="mono">amazon.com</span> anchor carries <code>rel="sponsored nofollow"</code> (<a href="https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links">Google</a>); every CTA carries <span class="mono">tag={esc(TRACK)}</span>.</li>
      <li>Every data-table row links to an official source; blanks carry an <em>unverified</em> tag.</li>
      <li>Internal links resolve; sitemap covers every page; feed contains every guide; search index covers every page.</li>
      <li>No conflict markers, unfinished-work markers, or unresolved placeholders in shipped HTML.</li>
    </ul>
    <p class="small muted">API policy checks follow the Operating Agreement (Special Links §1, disclosure §5) and Program Policies (formatted-link requirement). The one-partner test (one link per product) remains gated on Q-04 — this build does not run it because it requires the enrolled Associates account.</p>

    <h2>Search Console checklist (owner action, FLG-008)</h2>
    <ol>
      <li>Decide the canonical domain (Q-07) — default is the github.io project URL.</li>
      <li>Add the property in Search Console and verify ownership (DNS/HTML file/meta — token not available to this build).</li>
      <li>Submit <span class="mono">{esc(BASE)}sitemap.xml</span>.</li>
      <li>After the first query report, choose the next guide from measured queries (SG-18).</li>
    </ol>

    <h2>Source register</h2>
    <div class="table-wrap">
      <table class="data">
        <caption>Official sources used by this site — all fetched {esc(VERIFIED)}</caption>
        <thead><tr><th>ID</th><th>Source</th><th>Publisher</th><th>What it supports</th></tr></thead>
        <tbody>
{source_rows()}
        </tbody>
      </table>
    </div>"""
    return chrome("platform.html", "Platform & sources — " + PUB,
                  "The WinA pipeline: intake, verify, render, gate, measure — with the five events, endpoint contract, compliance gate, and full source register.",
                  body)


def page_search():
    body = """    <p class="eyebrow">Search</p>
    <h1>Search the site</h1>
    <form class="search-box" id="search-form" action="search.html" method="get">
      <input id="q" name="q" type="search" placeholder="Try: capacity, cleanup, disclosure, thermometer…" autocomplete="off" aria-label="Search query">
      <button class="btn" type="submit">Search</button>
    </form>
    <div class="search-results" id="results"></div>
    <p class="section-note">Client-side search over <span class="mono">search-index.json</span> — no third-party search service is contacted. The query term itself is never sent anywhere; only its length is recorded as <code>search_query</code> (privacy note in <a href="platform.html">platform</a>).</p>"""
    return chrome("search.html", "Search — " + PUB,
                  "Client-side search across the WinA shelf, guides, analysis, suggestions, questions and flags.",
                  body)


# ---------------------------------------------------------------- feed / sitemap / index

def build_feed(guides):
    items = []
    for g in guides:
        url = BASE + "guides/" + g["slug"]
        items.append(f"""    <item>
      <title>{esc(g['title'])}</title>
      <link>{esc(url)}</link>
      <guid isPermaLink="true">{esc(url)}</guid>
      <description>{esc(g['dek'])}</description>
      <pubDate>Fri, 20 Nov 2026 09:00:00 GMT</pubDate>
      <author>WinA Editorial</author>
    </item>""")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{esc(PUB)} — {esc(PUB_SUB)}</title>
    <link>{esc(BASE)}</link>
    <description>Question-shaped buyer guides for the WinA shelf. Every entry links to official sources and carries the Associates disclosure.</description>
    <language>en-us</language>
    <lastBuildDate>Fri, 20 Nov 2026 09:00:00 GMT</lastBuildDate>
    <atom:link href="{esc(BASE)}feed.xml" rel="self" type="application/rss+xml"/>
{chr(10).join(items)}
  </channel>
</rss>
"""


def page_urls():
    urls = [
        "index.html", "products.html", "guides/index.html", "analysis.html",
        "suggestions.html", "questions.html", "executive-summary.html",
        "flagged.html", "platform.html", "search.html",
    ] + ["guides/" + g["slug"] for g in load_guides()]
    return urls


def build_sitemap():
    urls = "\n".join(
        f"""  <url>
    <loc>{esc(BASE + u)}</loc>
    <lastmod>{VERIFIED}</lastmod>
    <changefreq>{'weekly' if u in ('index.html', 'guides/index.html') else 'monthly'}</changefreq>
  </url>""" for u in page_urls()
    )
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>
"""


def build_robots():
    return f"""User-agent: *
Allow: /

# Sitemaps
Sitemap: {BASE}sitemap.xml
"""


def build_search_index():
    entries = []
    for u in page_urls():
        path = os.path.join(ROOT, u)
        with open(path, encoding="utf-8") as fh:
            raw = fh.read()
        title = re.search(r"<title>(.*?)</title>", raw, re.S)
        desc = re.search(r'<meta name="description" content="(.*?)"', raw, re.S)
        main = re.search(r"<main>(.*?)</main>", raw, re.S)
        text = ""
        if main:
            text = re.sub(r"<[^>]+>", " ", main.group(1))
            text = html.unescape(re.sub(r"\s+", " ", text)).strip()[:400]
        kicker = "Guides" if u.startswith("guides/") else (
            "Home" if u == "index.html" else "Dashboard")
        entries.append({
            "url": u,
            "title": html.unescape(title.group(1)) if title else u,
            "kicker": kicker,
            "text": text,
        })
    return entries


# ---------------------------------------------------------------- main

def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)
    return path


def main():
    data = load("products.json")
    flags = load("flags.json")
    sugg = load("suggestions.json")
    questions = load("questions.json")
    guides = load_guides()

    pages = {
        "index.html": page_index(data, flags, sugg),
        "products.html": page_products(data),
        "guides/index.html": page_guides_index(),
        "guides/basket-or-oven.html": page_guide_basket_or_oven(),
        "guides/capacity-checklist.html": page_guide_capacity(),
        "guides/cleanup-and-counter-space.html": page_guide_cleanup(),
        "guides/multi-function-questions.html": page_guide_multi_function(),
        "guides/picking-a-meat-thermometer.html": page_guide_thermometer(),
        "analysis.html": page_analysis(data, flags, sugg, questions["questions"]),
        "suggestions.html": page_suggestions(sugg),
        "questions.html": page_questions(questions),
        "executive-summary.html": page_executive(flags, questions["questions"], sugg, data),
        "flagged.html": page_flagged(flags),
        "platform.html": page_platform(),
        "search.html": page_search(),
    }

    written = []
    for path, content in pages.items():
        written.append(write(path, content))

    written.append(write("feed.xml", build_feed(guides)))
    written.append(write("sitemap.xml", build_sitemap()))
    written.append(write("robots.txt", build_robots()))
    written.append(write(".nojekyll", ""))
    # search index must be built after pages exist
    written.append(write("search-index.json",
                         json.dumps(build_search_index(), ensure_ascii=False, indent=1)))

    print(f"built {len(written)} files")
    for w in written:
        print("  ", w)
    return 0


if __name__ == "__main__":
    sys.exit(main())
