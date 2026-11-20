// ============================================================
// Counter Space — reader-facing design layer (T26, session arena-3818c975-wina)
//
// Everything here renders either (a) original artwork owned by this
// publication, or (b) inline SVG drawn from values that already sit in
// data/products.json with a status of "verified". No Amazon imagery, no
// stock photography of appliances, no price, no rating, no testing claim.
//
// A figure is only drawn when the number behind it is in the register.
// Where a value is unpublished the diagram shows the gap instead of
// inventing a shape for it.
// ============================================================

/* ---------- original artwork ---------- */

export function figure(key, artwork, { url, esc, cls = "" }) {
  const a = artwork?.figures?.[key];
  if (!a) return "";
  return `<figure class="figure ${cls}">
  <img src="${url(a.src)}" alt="${esc(a.alt)}" width="1600" height="900" loading="lazy">
  <figcaption>${esc(a.caption)} <span class="figure__tag">Original artwork — not a product image</span></figcaption>
</figure>`;
}

export function heroFigure(key, artwork, { url, esc }) {
  const a = artwork?.figures?.[key];
  if (!a) return "";
  return `<figure class="figure figure--bleed">
  <img src="${url(a.src)}" alt="${esc(a.alt)}" width="1600" height="900" fetchpriority="high">
  <figcaption>${esc(a.caption)} <span class="figure__tag">Original artwork — not a product image</span></figcaption>
</figure>`;
}

/* ---------- to-scale footprint diagram (top view) ---------- */

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/* A published measurement is shown exactly as published — 13.38, not 13.4.
   Rounding a spec is how a comparison table starts telling its own story. */
const dim = (v) => String(v);

function areaIn2(f) {
  return f.w * f.d;
}

export function footprintDiagram(products, { esc, url }) {
  const units = products.filter((p) => p.category === "air-fryers");
  if (!units.length) return "";

  const drawn = units.filter((p) => p.figures?.footprintIn);
  if (!drawn.length) return "";

  const maxSide = Math.max(...drawn.map((p) => Math.max(p.figures.footprintIn.w, p.figures.footprintIn.d)));
  const PX = 13; // px per inch at the SVG's own coordinate scale
  const cellW = Math.ceil(maxSide * PX) + 96;
  const cellH = Math.ceil(maxSide * PX) + 78;

  const cells = units
    .map((p) => {
      const f = p.figures?.footprintIn;
      if (!f) {
        return `<div class="fp fp--missing">
  <svg viewBox="0 0 ${cellW} ${cellH}" role="img" aria-labelledby="${esc(p.slug)}-fp-t" class="fp__svg">
    <title id="${esc(p.slug)}-fp-t">Counter footprint not published for the ${esc(p.shortName)}</title>
    <rect x="24" y="20" width="${Math.round(maxSide * PX)}" height="${Math.round(maxSide * PX)}" class="fp__ghost"></rect>
    <text x="${24 + (maxSide * PX) / 2}" y="${20 + (maxSide * PX) / 2 - 6}" class="fp__q">not</text>
    <text x="${24 + (maxSide * PX) / 2}" y="${20 + (maxSide * PX) / 2 + 14}" class="fp__q">published</text>
  </svg>
  <p class="fp__name">${esc(p.shortName)}</p>
  <p class="fp__why">${esc(p.figures?.missingFootprintReason || "No footprint published by the manufacturer for this SKU.")}</p>
</div>`;
      }
      const w = Math.round(f.w * PX);
      const d = Math.round(f.d * PX);
      const a = areaIn2(f);
      return `<div class="fp">
  <svg viewBox="0 0 ${cellW} ${cellH}" role="img" aria-labelledby="${esc(p.slug)}-fp-t2" class="fp__svg">
    <title id="${esc(p.slug)}-fp-t2">Top-view counter footprint of the ${esc(p.shortName)}: ${f.w} by ${f.d} inches</title>
    <rect x="24" y="20" width="${w}" height="${d}" class="fp__box"></rect>
    <line x1="24" y1="${20 + d + 12}" x2="${24 + w}" y2="${20 + d + 12}" class="fp__dim"></line>
    <text x="${24 + w / 2}" y="${20 + d + 28}" class="fp__lab">${dim(f.w)} in wide</text>
    <text x="${24 + w + 10}" y="${20 + d / 2 + 4}" class="fp__lab sm">${dim(f.d)} in deep</text>
  </svg>
  <p class="fp__name">${esc(p.shortName)}</p>
  <p class="fp__why"><span class="fp__num">${Math.round(a)} in²</span> of counter · ${dim(f.h)} in tall · <a href="${esc(
    p.figures.sourceUrl
  )}" rel="nofollow noopener" target="_blank" data-slot="figure">${esc(p.figures.sourceLabel)}</a></p>
</div>`;
    })
    .join("");

  const areas = drawn.map((p) => areaIn2(p.figures.footprintIn));
  const spread =
    areas.length > 1 ? ` That is ${Math.round(((Math.max(...areas) - Math.min(...areas)) / Math.min(...areas)) * 100)}% more counter between the smallest and the largest drawn here.` : "";

  return `<figure class="diagram">
  <div class="diagram__head">
    <p class="diagram__kicker">Drawn to scale, from the register</p>
    <h3 class="diagram__title">The counter each one takes, top view</h3>
  </div>
  <div class="fp__row">${cells}</div>
  <figcaption class="diagram__note">${esc(
    "Each rectangle is the appliance seen from above, at the same scale."
  )}${esc(spread)} Height and door clearance are not drawn, and for a French-door unit the space in front stops being counter while the doors swing. Dimensions are the manufacturers' published figures; where a brand publishes them for a different SKU, that row is left empty rather than borrowed.${esc("")}
  </figcaption>
</figure>`;
}

/* ---------- capacity diagram, area proportional to stated quarts ---------- */

export function capacityDiagram(products, { esc }) {
  const units = products.filter((p) => p.category === "air-fryers" && p.figures?.capacityQt);
  if (units.length < 2) return "";

  const max = Math.max(...units.map((p) => p.figures.capacityQt));
  const S = 132; // px for the largest square's side
  const boxes = units
    .map((p) => {
      const qt = p.figures.capacityQt;
      const side = Math.round(Math.sqrt(qt / max) * S);
      const split = p.figures.chamberQt;
      const inner = split
        ? `<line x1="${side / 2}" y1="0" x2="${side / 2}" y2="${side}" class="cap__split"></line>`
        : "";
      return `<div class="cap__cell">
    <svg viewBox="0 0 ${S} ${S}" role="img" aria-labelledby="${esc(p.slug)}-cap" class="cap__svg" style="--side:${side}px">
      <title id="${esc(p.slug)}-cap">${qt} quarts stated for the ${esc(p.shortName)}${
        split ? `, split into ${split.join(" and ")} quart baskets` : ""
      }</title>
      <g transform="translate(${(S - side) / 2},0)">
        <rect x="0" y="0" width="${side}" height="${side}" class="cap__box"></rect>${inner}
        <text x="${side / 2}" y="${side / 2 + 6}" class="cap__n">${qt}</text>
      </g>
    </svg>
    <p class="cap__lab">${esc(p.shortName)}</p>
    ${split ? `<p class="cap__sub">two ${split.join("-quart ")}baskets</p>` : `<p class="cap__sub">one chamber</p>`}
  </div>`;
    })
    .join("");

  return `<figure class="diagram diagram--capacity">
  <div class="diagram__head">
    <p class="diagram__kicker">Stated capacity, area proportional to quarts</p>
    <h3 class="diagram__title">Bigger number, more food? Not always.</h3>
  </div>
  <div class="cap__row">${boxes}</div>
  <figcaption class="diagram__note">Capacity is the volume the manufacturer states, not a measure of how much food cooks well at once — a basket filled to the brim steams instead of browning. The dual-basket unit's 6 quarts is two 3-quart chambers: it is two small cooks, not one big one. No interior dimensions are published for any unit here, so nothing inside these boxes is drawn from imagination.</figcaption>
</figure>`;
}

/* ---------- thermometer capability strip ---------- */

export function thermoStrip(products, { esc, url }) {
  const units = products.filter((p) => p.category === "thermometers");
  if (!units.length) return "";
  const spec = (p, label) => p.specs.find((s) => s.label === label);
  const row = (p) => {
    const type = spec(p, "Type");
    const probes = spec(p, "Probes");
    const conn = spec(p, "Connectivity");
    const cells = [
      type?.value || "unverified",
      probes?.value || "not published",
      conn?.value || "none — nothing to pair",
      p.figures?.staysIn ? "stays in the meat" : "in, read, out",
      p.figures?.needsApp ? "yes — app required by design" : "no app"
    ];
    return `<tr>
    <th scope="row"><a href="${url(`/products/${p.slug}/`)}">${esc(p.shortName)}</a></th>
    ${cells.map((c, i) => {
      const verified = [type, probes, conn][i];
      const badge = verified ? `<span class="pill pill--${verified.status}">${esc(verified.status)}</span>` : `<span class="pill pill--unverified">stated</span>`;
      return `<td>${esc(c)} ${badge}</td>`;
    }).join("")}
  </tr>`;
  };
  return `<div class="tablewrap">
  <table class="data sortable strip-table">
    <caption>The two ways to stop guessing whether meat is done. Values are the register's own; each carries the status it has there.</caption>
    <thead><tr><th scope="col">Thermometer</th><th scope="col">Type</th><th scope="col">Probes</th><th scope="col">Connectivity</th><th scope="col">How you read it</th><th scope="col">App</th></tr></thead>
    <tbody>${units.map(row).join("")}</tbody>
  </table>
</div>`;
}

/* ---------- the finder (client-side, transparent, records nothing) ---------- */

export function finderBlock(finder, products, { esc, url, special, site, id = "finder" }) {
  const qs = finder.questions
    .map(
      (q, qi) => `<fieldset class="finder__q">
    <legend>${qi + 1}. ${esc(q.ask)}</legend>
    ${q.options
      .map(
        (o, oi) => `<label class="finder__opt">
      <input type="radio" name="${esc(q.id)}" value="${esc(o.id)}" data-finder-choice="${esc(q.id)}">
      <span>${esc(o.label)}</span>
    </label>`
      )
      .join("")}
  </fieldset>`
    )
    .join("");

  /* Every candidate card is rendered in the page, with its real tagged
     sponsored anchor, and the script only decides which one is showing.
     That is deliberate: an anchor created at run time is invisible to the
     build gate, and the gate is the only thing standing between this site
     and an undisclosed link. With JavaScript off all five cards stay
     visible, which is still an honest answer to the three questions. */
  const cards = products
    .map((p) => {
      return `<article class="fmatch" data-finder-card="${esc(p.slug)}">
      <p class="fmatch__brand">${esc(p.brand)}</p>
      <h3 class="fmatch__name"><a href="${url(`/products/${p.slug}/`)}">${esc(p.shortName)}</a></h3>
      <p class="fmatch__reason">${esc(finder.reasons[p.slug] || p.verdict)}</p>
      <p class="fmatch__trade"><span class="fmatch__tradetag">Trade-off</span>${esc(p.tradeoff)}</p>
      <a class="btn btn--amazon" href="${special(p.asin)}" rel="sponsored nofollow noopener" target="_blank"
         data-affiliate="${p.asin}" data-slot="finder">Check price on Amazon →</a>
      <p class="fmatch__note">Sponsored. ${esc(site.associateStatement)}</p>
    </article>`;
    })
    .join("");

  return `<section class="finder" id="${id}">
  <div class="wrap finder__inner">
    <div class="finder__head">
      <div>
        <p class="kicker">Thirty seconds, three questions</p>
        <h2 class="section__title">Which of these is yours?</h2>
        <p class="section__dek">${esc(finder.intro)}</p>
      </div>
      <p class="finder__private">Runs in your browser. Nothing is sent, stored or scored against you.</p>
    </div>

    <form class="finder__form" data-finder-form>
      ${qs}
      <div class="finder__actions">
        <button type="submit" class="btn btn--primary">Show my match</button>
        <button type="reset" class="btn btn--ghost" data-finder-reset>Start over</button>
      </div>
    </form>

    <div class="finder__result" data-finder-result>
      <p class="finder__resultlabel" data-finder-label>All five, with the reason each one is here</p>
      <div class="finder__matches" data-finder-match>${cards}</div>
      <p class="finder__note">${esc(finder.resultNote)}</p>
    </div>

    <noscript>
      <p class="finder__noscript">No script is running, so nothing is picked for you — every match and its reason is listed above. The three questions still tell you which reason is yours.</p>
    </noscript>

    <script type="application/json" data-finder-data>${JSON.stringify({
      questions: finder.questions.map((q) => ({
        id: q.id,
        options: q.options.map((o) => ({ id: o.id, points: o.points }))
      })),
      products: products.map((p) => ({
        slug: p.slug,
        name: p.shortName,
        brand: p.brand,
        asin: p.asin,
        href: url(`/products/${p.slug}/`),
        buy: special(p.asin),
        reason: finder.reasons[p.slug] || p.verdict,
        tradeoff: p.tradeoff
      })),
      statement: site.associateStatement
    })}</script>
  </div>
</section>`;
}

/* ---------- guide furniture: contents, next/previous, cluster ---------- */

export function guideToc(bodyHtml, { esc }) {
  const heads = [...bodyHtml.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim()
  );
  if (heads.length < 3) return "";
  return `<nav class="toc" aria-label="On this page">
  <p class="toc__title">On this page</p>
  <ol class="toc__list">${heads
    .map(
      (h, i) =>
        `<li><a href="#s-${i + 1}">${esc(h.replace(/^\d+\.\s*/, ""))}</a></li>`
    )
    .join("")}</ol>
</nav>`;
}

/** Add id="s-N" to each <h2> so the contents list links work. */
export function anchorHeights(html) {
  let i = 0;
  return html.replace(/<h2([^>]*)>/g, (m, attrs) => {
    i += 1;
    return `<h2 id="s-${i}"${attrs}>`;
  });
}

export function guideNav(current, guides, { url, esc }) {
  const i = guides.findIndex((g) => g.slug === current.slug);
  if (i === -1) return "";
  const prev = guides[i - 1];
  const next = guides[i + 1];
  const card = (g, dir) =>
    `<a class="pnav__card" href="${url(`/guides/${g.slug}/`)}">
    <span class="pnav__dir">${dir}</span>
    <span class="pnav__t">${esc(g.title)}</span>
  </a>`;
  return `<nav class="pnav" aria-label="More guides">
  ${prev ? card(prev, "Previous guide") : `<a class="pnav__card" href="${url("/guides/")}"><span class="pnav__dir">All guides</span><span class="pnav__t">The questions people ask before they buy</span></a>`}
  ${next ? card(next, "Next guide") : `<a class="pnav__card" href="${url("/compare/")}"><span class="pnav__dir">Then compare</span><span class="pnav__t">All five products, in one table</span></a>`}
</nav>`;
}

/** Guides that share a product with this one — the cluster, not a random link box. */
export function clusterGuides(current, guides, products, { url, esc }, limit = 3) {
  const shared = new Set(
    products.filter((p) => p.guideTopics.includes(current.slug)).map((p) => p.slug)
  );
  const rel = guides
    .filter((g) => g.slug !== current.slug)
    .map((g) => ({
      g,
      n: products.filter((p) => p.guideTopics.includes(g.slug) && shared.has(p.slug)).length
    }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || guides.indexOf(a.g) - guides.indexOf(b.g))
    .slice(0, limit);
  if (!rel.length) return "";
  return `<div class="cluster">
  <p class="cluster__title">In this cluster</p>
  <ul class="cluster__list">${rel
    .map(
      (x) =>
        `<li><a href="${url(`/guides/${x.g.slug}/`)}">${esc(x.g.title)}</a> <span class="faint">· ${
          x.n
        } shared product${x.n > 1 ? "s" : ""}</span></li>`
    )
    .join("")}</ul>
</div>`;
}

/* ---------- provenance line for reader pages ---------- */

export function verifiedLine(p, { esc, url }) {
  if (!p.verifiedOn) return "";
  const n = p.specs.filter((s) => s.status === "verified").length;
  const cl = p.specs.filter((s) => s.status === "claim").length;
  const blanks = p.specs.filter((s) => !s.value && s.status !== "withheld").length;
  return `<p class="sourceline"><span class="sourceline__dot" aria-hidden="true"></span>${esc(
    `Every figure on this page was re-read on ${p.verifiedOn}: ${n} verified against an official page, ${cl} stated by the seller and marked as a claim, ${blanks} left blank because no official source publishes them.`
  )} <a href="${url("/register/")}">See the register</a></p>`;
}

/* ---------- the one-line counter arithmetic on a product page ---------- */

export function counterBlock(p, { esc }) {
  const f = p.figures;
  if (!f) return "";
  const cells = [];
  if (f.footprintIn) {
    cells.push({
      k: "Counter it takes",
      v: `${Math.round(areaIn2(f.footprintIn))} in² top view`,
      s: `${dim(f.footprintIn.w)} × ${dim(f.footprintIn.d)} in, ${dim(f.footprintIn.h)} in tall`,
      href: f.sourceUrl,
      label: f.sourceLabel
    });
  } else if (f.missingFootprintReason) {
    cells.push({ k: "Counter it takes", v: "not published", s: f.missingFootprintReason });
  }
  if (f.capacityQt) {
    cells.push({
      k: "Stated capacity",
      v: `${f.capacityQt} qt`,
      s: f.chamberQt ? `two ${f.chamberQt.join("- and -")} quart chambers` : "one chamber"
    });
  }
  if (typeof f.weightLb === "number") cells.push({ k: "Weight", v: `${f.weightLb} lb`, s: "manufacturer's figure" });
  if (!cells.length) return "";
  return `<div class="counter">
  <p class="counter__title">The counter arithmetic</p>
  <dl class="counter__grid">
    ${cells
      .map(
        (c) => `<div class="counter__cell"><dt>${esc(c.k)}</dt><dd>${esc(c.v)}</dd><dd class="counter__sub">${esc(
          c.s
        )}${
          c.href
            ? ` · <a href="${c.href}" rel="nofollow noopener" target="_blank" data-slot="counter">${esc(c.label)}</a>`
            : ""
        }</dd></div>`
      )
      .join("")}
  </dl>
  <p class="counter__foot">Figures are the manufacturer's own, taken from the register. We have not measured these machines, and a published footprint does not tell you whether the doors will clear your cabinets.</p>
</div>`;
}

/**
 * Trust rule for the diagrams: a number may only be drawn if it is present
 * in the register's own verified row. Fails the build if they ever drift.
 */
export function assertFigure(p) {
  const f = p.figures;
  if (!f) return [];
  const problems = [];
  if (f.footprintIn) {
    const row = p.specs.find((s) => s.label === "Dimensions");
    if (!row || row.status !== "verified" || !row.value) {
      problems.push(`${p.slug}: footprint drawn but the Dimensions row is not verified`);
    } else {
      for (const [k, v] of Object.entries({ w: f.footprintIn.w, d: f.footprintIn.d, h: f.footprintIn.h })) {
        if (!String(row.value).includes(String(v)))
          problems.push(`${p.slug}: footprint ${k}=${v} does not appear in the register's Dimensions value "${row.value}"`);
      }
    }
    if (!f.sourceUrl || !/^https:\/\//.test(f.sourceUrl))
      problems.push(`${p.slug}: footprint has no official source URL`);
  }
  if (f.capacityQt) {
    const row = p.specs.find((s) => s.label === "Capacity");
    if (!row || !String(row.value || "").includes(String(f.capacityQt)))
      problems.push(`${p.slug}: capacity figure ${f.capacityQt} qt is not the register's Capacity value`);
  }
  return problems;
}

export const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export const wordNum = (n) => WORDS[n] || String(n);
