// ============================================================
// Illustration system for Counter Space.
//
// Every image on this site is drawn here and written as a static
// SVG file. Two rules drive the whole module:
//
//   1. Nothing here depicts a specific product. Program Content
//      (including product photography) may not be copied or
//      re-hosted, and substituting a different appliance's photo
//      would misrepresent the item. So these are *diagrams and
//      stationery* — form-factor shapes, a steam mark, a fold —
//      captioned as illustration wherever they appear.
//
//   2. Deterministic. No Math.random(), no wall clock, no network.
//      Two builds produce byte-identical files, which is what the
//      reproducibility gate checks.
//
// Palette values are duplicated from assets/css/site.css on
// purpose: an SVG loaded through <img> cannot inherit CSS custom
// properties, so the values have to be literal here. They are
// asserted against the stylesheet by the build gate.
// ============================================================

export const PALETTE = {
  paper: "#faf6ef",
  paperDeep: "#f2ebe0",
  card: "#fffdf8",
  ink: "#17130f",
  inkSoft: "#3d362f",
  inkMute: "#6b6157",
  inkFaint: "#9b9187",
  rule: "#e3d9ca",
  accent: "#1c4a3c",
  accentDeep: "#12352b",
  accentWash: "#e4ece6",
  clay: "#b5432a",
  clayWash: "#faeae4"
};

const C = PALETTE;

const head = (w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-hidden="true" focusable="false">`;

/* ---------------------------------------------------------------
   Form-factor marks.
   Each is the *silhouette of a category*, not of a model: a
   single drawer, two drawers, a French door. Drawn inside a
   96×96 box so they can sit in a table cell at any size.
   --------------------------------------------------------------- */
export function formMark(kind) {
  const box = (inner) =>
    `${head(120, 120)}<rect x="1" y="1" width="118" height="118" rx="8" fill="${C.card}" stroke="${C.rule}"/>${inner}</svg>`;

  switch (kind) {
    /* one deep drawer under a small control head */
    case "single-basket":
      return box(`
  <rect x="30" y="34" width="60" height="14" rx="4" fill="${C.accentWash}" stroke="${C.ink}" stroke-width="2"/>
  <rect x="22" y="54" width="76" height="44" rx="9" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="2.2"/>
  <rect x="46" y="43" width="28" height="5" rx="2.5" fill="${C.ink}"/>
  <rect x="36" y="62" width="48" height="26" rx="5" fill="${C.card}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M48 80h24" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>
  <circle cx="88" cy="76" r="3" fill="${C.clay}"/>`);

    /* two drawers, the point of the format */
    case "dual-basket":
      return box(`
  <rect x="30" y="30" width="60" height="13" rx="4" fill="${C.accentWash}" stroke="${C.ink}" stroke-width="2"/>
  <rect x="12" y="50" width="46" height="48" rx="8" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="2.2"/>
  <rect x="62" y="50" width="46" height="48" rx="8" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="2.2"/>
  <rect x="20" y="38" width="30" height="5" rx="2.5" fill="${C.ink}"/>
  <rect x="70" y="38" width="30" height="5" rx="2.5" fill="${C.ink}"/>
  <path d="M20 72h30M70 72h30" stroke="${C.rule}" stroke-width="2"/>
  <circle cx="35" cy="86" r="2.6" fill="${C.clay}"/>
  <circle cx="85" cy="86" r="2.6" fill="${C.clay}"/>`);

    /* two doors, vertical handles, the oven form */
    case "oven-french-door":
    case "oven-style":
      return box(`
  <rect x="20" y="30" width="80" height="62" rx="7" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="2.2"/>
  <path d="M60 30v62" stroke="${C.ink}" stroke-width="2.2"/>
  <rect x="50" y="52" width="4" height="17" rx="2" fill="${C.ink}"/>
  <rect x="66" y="52" width="4" height="17" rx="2" fill="${C.ink}"/>
  <rect x="28" y="40" width="24" height="14" rx="3" fill="none" stroke="${C.rule}" stroke-width="1.8"/>
  <rect x="68" y="40" width="24" height="14" rx="3" fill="none" stroke="${C.rule}" stroke-width="1.8"/>
  <path d="M14 100h92" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="92" cy="62" r="2.8" fill="${C.clay}"/>`);

    /* instant-read: housing, display, needle, no wire */
    case "instant-read":
      return box(`
  <rect x="46" y="20" width="28" height="44" rx="11" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="2.2"/>
  <rect x="53" y="30" width="14" height="17" rx="3" fill="${C.accentWash}" stroke="${C.ink}" stroke-width="1.5"/>
  <path d="M60 64v34" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
  <path d="M56 100h8" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>
  <circle cx="60" cy="52" r="2.4" fill="${C.clay}"/>`);

    /* wireless: probe plus three signal arcs, and deliberately no cable */
    case "wireless-probe":
    case "wireless-leave-in":
      return box(`
  <rect x="26" y="46" width="18" height="44" rx="8" fill="${C.paperDeep}" stroke="${C.ink}" stroke-width="2.2"/>
  <path d="M35 46V32" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="35" cy="29" r="2.8" fill="${C.clay}"/>
  <rect x="32" y="58" width="6" height="10" rx="2" fill="${C.accentWash}" stroke="${C.ink}" stroke-width="1.2"/>
  <path d="M52 36c14 6 14 42 0 48" fill="none" stroke="${C.accent}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M64 28c20 8 20 56 0 64" fill="none" stroke="${C.accent}" stroke-width="2.6" opacity=".6" stroke-linecap="round"/>
  <path d="M76 20c26 10 26 70 0 80" fill="none" stroke="${C.accent}" stroke-width="2.6" opacity=".3" stroke-linecap="round"/>`);

    default:
      throw new Error(`formMark: unknown kind "${kind}"`);
  }
}

/* ---------------------------------------------------------------
   Plate marks. Used where a photograph would go, and captioned
   as illustration. Deliberately abstract: a bowl of steam, a
   drawn scale, a folded cloth.
   --------------------------------------------------------------- */
export function plate(kind) {
  const suite = {
    /* three rising steam curls above a plate */
    steam: `
  <path d="M126 236c0-34 44-40 44-76s-36-40-36-72" fill="none" stroke="${C.accent}" stroke-width="7" stroke-linecap="round" opacity=".85"/>
  <path d="M240 236c0-26 34-32 34-62s-28-32-28-58" fill="none" stroke="${C.clay}" stroke-width="7" stroke-linecap="round" opacity=".8"/>
  <path d="M354 236c0-38 48-44 48-82s-40-44-40-78" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" opacity=".3"/>
  <path d="M70 262h340" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>
  <ellipse cx="240" cy="330" rx="152" ry="30" fill="${C.card}" stroke="${C.ink}" stroke-width="3.5"/>`,

    /* a capacity gauge: eleven ticks, four filled */
    scale: `
  ${Array.from({ length: 11 }, (_, i) => {
    const x = 84 + i * 31;
    const tall = i % 5 === 0;
    const on = i <= 4;
    return `<path d="M${x} ${tall ? 152 : 170}v${tall ? 96 : 60}" stroke="${on ? C.accent : C.ink}" stroke-width="${tall ? 4 : 2.6}" stroke-linecap="round" opacity="${on ? "1" : ".3"}"/>`;
  }).join("\n  ")}
  <path d="M74 268h330" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M84 292h124" stroke="${C.clay}" stroke-width="6" stroke-linecap="round"/>`,

    /* a folded cloth: the cleanup problem, drawn */
    towel: `
  <rect x="104" y="126" width="272" height="184" rx="10" fill="${C.card}" stroke="${C.ink}" stroke-width="3.5"/>
  <path d="M104 176h272M104 260h272" stroke="${C.rule}" stroke-width="3.5"/>
  <path d="M168 126v184M312 126v184" stroke="${C.rule}" stroke-width="2.5" opacity=".8"/>
  <path d="M240 126v184" stroke="${C.clay}" stroke-width="4" stroke-dasharray="12 11" opacity=".9"/>
  <circle cx="332" cy="152" r="11" fill="${C.accentWash}" stroke="${C.ink}" stroke-width="2.5"/>`,

    /* a probe entering a roast */
    probe: `
  <ellipse cx="228" cy="296" rx="140" ry="80" fill="${C.card}" stroke="${C.ink}" stroke-width="3.5"/>
  <path d="M118 296h220M150 268c28 10 128 10 156 0" fill="none" stroke="${C.rule}" stroke-width="3" stroke-linecap="round"/>
  <path d="M228 118v158" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
  <path d="M228 106l17 34h-34z" fill="${C.ink}"/>
  <rect x="198" y="54" width="60" height="46" rx="10" fill="${C.card}" stroke="${C.ink}" stroke-width="3.5"/>
  <rect x="209" y="66" width="38" height="22" rx="3" fill="${C.accentWash}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M228 186h112" stroke="${C.clay}" stroke-width="3" stroke-dasharray="9 9"/>
  <path d="M340 172v28" stroke="${C.clay}" stroke-width="3" stroke-linecap="round"/>`
  };

  const body = suite[kind];
  if (!body) throw new Error(`plate: unknown kind "${kind}"`);
  return `${head(480, 400)}
<rect width="480" height="400" fill="${C.paperDeep}"/>
<g>${body}</g>
</svg>`;
}

/* ---------------------------------------------------------------
   Stationery: the open-graph card and the brand mark. Both are
   built from the same type and rules as the page, so a link
   preview looks like the publication rather than a logo tile.
   --------------------------------------------------------------- */
export function ogCard({ title, kicker, footer }) {
  const lines = wrapText(title, 26).slice(0, 4);
  const size = lines.length >= 4 ? 58 : lines.length === 3 ? 66 : 76;
  return `${head(1200, 630)}
<rect width="1200" height="630" fill="${C.paper}"/>
<rect x="0" y="0" width="1200" height="14" fill="${C.accent}"/>
<text x="72" y="112" font-family="ui-sans-serif, system-ui, sans-serif" font-size="24" font-weight="600" letter-spacing="5.5" fill="${C.clay}">${escapeText(
    kicker.toUpperCase()
  )}</text>
${lines
  .map(
    (l, i) =>
      `<text x="72" y="${210 + i * (size + 10)}" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" fill="${C.ink}">${escapeText(
        l
      )}</text>`
  )
  .join("\n")}
<path d="M72 528h1056" stroke="${C.rule}" stroke-width="2"/>
<text x="72" y="578" font-family="ui-sans-serif, system-ui, sans-serif" font-size="25" letter-spacing="3.2" fill="${C.inkMute}">${escapeText(
    footer
  )}</text>
<circle cx="1108" cy="572" r="17" fill="${C.accent}"/>
<text x="1098" y="580" font-family="Georgia, serif" font-size="21" fill="${C.paper}">C</text>
</svg>`;
}

/* A small tile used as the icon / favicon / touch image. */
export function brandTile() {
  return `${head(192, 192)}
<rect width="192" height="192" rx="34" fill="${C.accent}"/>
<path d="M58 128c0-22 24-25 24-47s-20-23-20-42" fill="none" stroke="${C.paper}" stroke-width="7" stroke-linecap="round" opacity=".95"/>
<path d="M96 134c0-17 19-20 19-38s-16-19-16-34" fill="none" stroke="${C.paper}" stroke-width="7" stroke-linecap="round" opacity=".72"/>
<path d="M134 128c0-22 24-25 24-47s-20-23-20-42" fill="none" stroke="${C.paper}" stroke-width="7" stroke-linecap="round" opacity=".95"/>
<path d="M44 152h104" stroke="${C.paper}" stroke-width="9" stroke-linecap="round"/>
</svg>`;
}

/* An inline mark for the masthead and footer: no file request, inherits currentColor. */
export function inlineMark() {
  return `<svg class="mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 15c0-2.6 2.9-3 2.9-5.7S6.3 6.4 6.3 4M12 16c0-2.1 2.3-2.4 2.3-4.6S12.3 9.7 12.3 8M18 15c0-2.6 2.9-3 2.9-5.7S18.3 6.4 18.3 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M4 19h15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`;
}

/* ---------------- helpers (pure, no eval, no regex backtracking games) --------------- */

function escapeText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Greedy word wrap for the OG card. Character-count based, which is enough
// for one card in one font size and cannot loop on an unbreakable string.
function wrapText(text, max) {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = "";
  for (const w of words) {
    if (!line.length) line = w;
    else if ((line + " " + w).length <= max) line += " " + w;
    else {
      out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out;
}

/* Every generated file, so the build can write them and the gate can verify presence. */
export function files(products) {
  const out = new Map();
  out.set("assets/img/brand-tile.svg", brandTile());
  out.set(
    "assets/img/og-home.svg",
    ogCard({
      title: "Buy the one that fits your counter",
      kicker: "Counter Space",
      footer: "Air fryers & thermometers, chosen for the space they take"
    })
  );
  for (const p of products) {
    out.set(`assets/img/og-${p.slug}.svg`, ogCard({ title: p.shortName, kicker: p.brand, footer: "Counter Space — decision-first buying guide" }));
    out.set(`assets/img/form-${p.formFactor}.svg`, formMark(p.formFactor));
  }
  out.set("assets/img/plate-steam.svg", plate("steam"));
  out.set("assets/img/plate-scale.svg", plate("scale"));
  out.set("assets/img/plate-towel.svg", plate("towel"));
  out.set("assets/img/plate-probe.svg", plate("probe"));
  return out;
}
