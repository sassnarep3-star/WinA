// ============================================================
// Art: original, hand-written SVG line drawings.
//
// Why SVG and not photography: Amazon's Program Policies restrict Program
// Content (listing images, titles, prices) to approved tools — Product
// Advertising / Creatives — which this site does not have. So instead of
// pretending to have product photos, every image on the site is a schematic
// drawn here from the published specification. It is original work, it loads
// instantly, it prints crisply, and each one is labelled as what it is.
//
// Rules for this file:
//   - no remote URLs, no embedded rasters, no base64
//   - no product claims: a drawing shows a shape, never a performance number
//   - every informative drawing carries role="img" and an aria-label
//   - output must be deterministic (the build is hashed in CI)
// ============================================================

const STROKE = 'stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const THIN = 'stroke="currentColor" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity=".55"';

const svgOpen = ({ label, view = "0 0 220 150", decorative = false }) =>
  `<svg class="art__svg" viewBox="${view}" ${decorative ? 'aria-hidden="true"' : `role="img" aria-label="${label}"`} focusable="false">` +
  (decorative ? "" : `<title>${label}</title>`);

/* ---------- product schematics ---------- */

/** Two independent drawers, side by side, each with a window and a handle. */
function dualBasket() {
  return `${svgOpen({ label: "Schematic: a dual-basket air fryer, two independent drawers side by side, each with a viewing window" })}
  <rect x="18" y="30" width="184" height="92" rx="9" ${STROKE}/>
  <path d="M110 30 V122" ${THIN}/>
  <rect x="32" y="48" width="62" height="42" rx="5" ${STROKE}/>
  <rect x="126" y="48" width="62" height="42" rx="5" ${STROKE}/>
  <path d="M46 60 h34 M46 70 h26" ${THIN}/>
  <path d="M140 60 h34 M140 70 h26" ${THIN}/>
  <path d="M40 100 h46 M134 100 h46" ${STROKE}/>
  <path d="M42 38 h18 M160 38 h18" ${THIN}/>
  <circle cx="110" cy="20" r="4" ${STROKE}/>
</svg>`;
}

/** One wide drawer, one temperature, one dial row. */
function singleBasket() {
  return `${svgOpen({ label: "Schematic: a single-basket air fryer, one wide drawer and one control row" })}
  <rect x="26" y="26" width="168" height="98" rx="10" ${STROKE}/>
  <rect x="44" y="58" width="132" height="48" rx="6" ${STROKE}/>
  <path d="M62 74 h96 M62 86 h64" ${THIN}/>
  <path d="M64 44 h34" ${STROKE}/>
  <circle cx="150" cy="44" r="8" ${STROKE}/>
  <circle cx="176" cy="44" r="8" ${STROKE}/>
</svg>`;
}

/** French-door oven body: twin doors, tall cavity, racks. */
function frenchDoorOven() {
  return `${svgOpen({ label: "Schematic: an oven-style air fryer with two glass doors and stacked racks" })}
  <rect x="22" y="22" width="176" height="106" rx="9" ${STROKE}/>
  <rect x="38" y="42" width="66" height="70" rx="4" ${STROKE}/>
  <rect x="116" y="42" width="66" height="70" rx="4" ${STROKE}/>
  <path d="M50 60 h42 M128 60 h42 M50 78 h42 M128 78 h42" ${THIN}/>
  <path d="M100 76 v8 M120 76 v8" ${STROKE}/>
  <rect x="46" y="28" width="30" height="6" rx="3" ${THIN}/>
  <circle cx="176" cy="31" r="4" ${STROKE}/>
</svg>`;
}

/** Instant-read: folding probe thermometer held in the hand, no cable. */
function instantRead() {
  return `${svgOpen({ label: "Schematic: a folding instant-read thermometer — short probe, body, small display" })}
  <rect x="70" y="20" width="80" height="66" rx="8" ${STROKE}/>
  <rect x="84" y="32" width="52" height="26" rx="3" ${STROKE}/>
  <path d="M92 45 h36" ${THIN}/>
  <circle cx="94" cy="59" r="4" ${STROKE}/>
  <circle cx="110" cy="59" r="4" ${STROKE}/>
  <circle cx="126" cy="59" r="4" ${STROKE}/>
  <path d="M104 86 h12 l-3 34 a3 3 0 0 1 -6 0 Z" ${STROKE}/>
  <path d="M110 124 v14" ${STROKE}/>
  <path d="M110 138 l-5 -8 h10 Z" fill="currentColor" stroke="none"/>
</svg>`;
}

/** Leave-in wireless: probe in the meat, cable to a puck, radio arcs to a phone. */
function wirelessLeaveIn() {
  return `${svgOpen({ label: "Schematic: a wireless leave-in thermometer — probe in the food, cable to a transmitter, signal to a phone" })}
  <ellipse cx="52" cy="106" rx="34" ry="16" ${STROKE}/>
  <path d="M40 96 l-4 -26" ${STROKE}/>
  <rect x="30" y="52" width="14" height="20" rx="4" ${STROKE}/>
  <path d="M66 104 h34" ${STROKE}/>
  <rect x="98" y="86" width="40" height="34" rx="7" ${STROKE}/>
  <circle cx="118" cy="103" r="7" ${STROKE}/>
  <path d="M150 96 a16 16 0 0 1 0 -16 M158 102 a26 26 0 0 0 0 -28" ${THIN}/>
  <rect x="170" y="46" width="30" height="54" rx="6" ${STROKE}/>
  <path d="M176 58 h18 M176 68 h18 M176 78 h10" ${THIN}/>
</svg>`;
}

/* ---------- editorial spot drawings (one per guide topic) ---------- */

/** Each spot is a *function* returning markup, so a caller can never
 *  accidentally embed an object and the render path stays one shape. */
const spot = (label, inner) => () =>
  `<svg class="spot" viewBox="0 0 64 64" role="img" aria-label="${label}" focusable="false"><title>${label}</title>${inner}</svg>`;

const spots = {
  // two candidate shapes on a counter line
  formfactor: spot("Two appliance outlines: a drawer shape and an oven shape",
    `<path d="M6 52 h52" ${STROKE}/>
     <rect x="8" y="26" width="22" height="20" rx="4" ${STROKE}/>
     <path d="M13 33 h12" ${THIN}/>
     <rect x="36" y="14" width="22" height="32" rx="4" ${STROKE}/>
     <path d="M41 22 h12 M41 30 h12" ${THIN}/>`),
  // stacked measures
  capacity: spot("Three nested volume measures of increasing size",
    `<path d="M10 50 h44" ${STROKE}/>
     <rect x="12" y="38" width="12" height="12" rx="2" ${STROKE}/>
     <rect x="26" y="28" width="16" height="22" rx="2" ${STROKE}/>
     <rect x="44" y="18" width="10" height="32" rx="2" ${STROKE}/>`),
  // a sink and a basket
  cleanup: spot("A washing symbol beside a fryer basket",
    `<path d="M8 34 h30 v14 a8 8 0 0 1 -8 8 h-14 a8 8 0 0 1 -8 -8 Z" ${STROKE}/>
     <path d="M14 42 q5 -5 9 0 q5 5 9 0" ${THIN}/>
     <path d="M44 22 h14 l-3 22 h-8 Z" ${STROKE}/>
     <path d="M47 16 h8" ${STROKE}/>`),
  // a tape measure across a counter
  counter: spot("A tape measure stretched across a counter edge",
    `<path d="M8 44 h48" ${STROKE}/>
     <path d="M8 44 v-10 h48 v10" ${STROKE}/>
     <path d="M16 34 v6 M24 34 v8 M32 34 v6 M40 34 v8 M48 34 v6" ${THIN}/>`),
  // a question over a dial
  multifunction: spot("A function dial with four positions and a question mark",
    `<circle cx="26" cy="32" r="16" ${STROKE}/>
     <path d="M26 16 v6 M26 42 v6 M10 32 h6 M36 32 h6" ${THIN}/>
     <path d="M26 32 l8 -7" ${STROKE}/>
     <path d="M46 22 q6 -8 12 0 q4 6 -2 10 q-3 2 -3 6" ${STROKE}/>
     <circle cx="53" cy="45" r="1.8" fill="currentColor" stroke="none"/>`),
  // a probe and a degree sign
  temperature: spot("A probe tip with a heat mark and a degree symbol",
    `<path d="M14 46 l24 -24" ${STROKE}/>
     <path d="M38 22 l6 6" ${STROKE}/>
     <circle cx="48" cy="16" r="5" ${STROKE}/>
     <path d="M12 34 q6 -8 0 -14 q10 4 16 -2" ${THIN}/>`),
  // two arrows meeting a plate
  timing: spot("Two cooking timelines converging on one plate",
    `<path d="M8 20 h22 M8 32 h34" ${STROKE}/>
     <path d="M30 20 l-4 -3 v6 Z" fill="currentColor" stroke="none"/>
     <path d="M42 32 l-4 -3 v6 Z" fill="currentColor" stroke="none"/>
     <ellipse cx="46" cy="48" rx="12" ry="5" ${STROKE}/>
     <path d="M8 44 h18" ${THIN}/>`),
  // a shopping bag with a question
  buy: spot("A shopping bag with a question mark above it",
    `<path d="M16 28 h32 l-3 26 h-26 Z" ${STROKE}/>
     <path d="M24 28 a8 8 0 0 1 16 0" ${STROKE}/>
     <path d="M30 40 q3 -5 6 0 q2 4 -3 6" ${THIN}/>
     <circle cx="33" cy="50" r="1.4" fill="currentColor" stroke="none"/>`),
  // a calendar with a marked day
  season: spot("A calendar page with one marked week",
    `<rect x="10" y="14" width="44" height="38" rx="5" ${STROKE}/>
     <path d="M10 26 h44" ${STROKE}/>
     <path d="M20 8 v10 M44 8 v10" ${THIN}/>
     <rect x="18" y="32" width="12" height="10" rx="2" ${STROKE}/>
     <path d="M36 36 h12 M18 48 h28" ${THIN}/>`),
  // generic chevron diagram for ops pages
  ledger: spot("A ruled ledger with three columns",
    `<rect x="8" y="12" width="48" height="40" rx="4" ${STROKE}/>
     <path d="M8 24 h48 M24 24 v28 M40 24 v28" ${THIN}/>`),
  compass: spot("A compass rose pointing to one direction",
    `<circle cx="32" cy="32" r="20" ${STROKE}/>
     <path d="M32 14 l6 14 -6 18 -6 -18 Z" ${STROKE}/>
     <path d="M14 32 h36" ${THIN}/>`),
  mail: spot("An envelope with a stamp",
    `<rect x="8" y="16" width="48" height="32" rx="4" ${STROKE}/>
     <path d="M8 20 l24 16 l24 -16" ${THIN}/>
     <rect x="42" y="22" width="10" height="10" rx="2" ${THIN}/>`),
  magnify: spot("A magnifier over a short list of rows",
    `<path d="M10 18 h28 M10 28 h20 M10 38 h14" ${THIN}/>
     <circle cx="38" cy="34" r="12" ${STROKE}/>
     <path d="M47 43 l8 8" ${STROKE}/>`),
  bolt: spot("A speed mark beside a temperature line",
    `<path d="M28 8 l-12 24 h12 l-6 24 l22 -30 h-13 l8 -18 Z" ${STROKE}/>
     <path d="M44 48 h12" ${THIN}/>
     <circle cx="52" cy="18" r="4" ${STROKE}/>`),
  scale: spot("A balance with two trays at the same height",
    `<path d="M32 12 v34 M20 46 h24" ${STROKE}/>
     <path d="M10 22 h44" ${STROKE}/>
     <path d="M10 22 l-6 14 a8 8 0 0 0 16 0 Z" ${STROKE}/>
     <path d="M54 22 l-6 14 a8 8 0 0 0 16 0 Z" ${STROKE}/>`),
  split: spot("A single path dividing into two",
    `<path d="M10 32 h16" ${STROKE}/>
     <path d="M26 32 q10 0 12 -14" ${STROKE}/>
     <path d="M26 32 q10 0 12 14" ${STROKE}/>
     <circle cx="46" cy="14" r="4" ${STROKE}/>
     <circle cx="46" cy="50" r="4" ${STROKE}/>`),
  // counter Space hero composition: a counter line, two silhouettes, a window of light
  hero: () => `${svgOpen({ label: "Line drawing of two air fryer silhouettes sitting on a kitchen counter under a window", view: "0 0 260 170" })}
  <path d="M10 142 h240" ${STROKE}/>
  <path d="M10 152 h240" ${THIN}/>
  <rect x="26" y="86" width="66" height="56" rx="7" ${STROKE}/>
  <rect x="38" y="100" width="42" height="24" rx="3" ${THIN}/>
  <path d="M36 92 h20" ${THIN}/>
  <path d="M112 66 h64 a8 8 0 0 1 8 8 v68 h-80 v-68 a8 8 0 0 1 8 -8 Z" ${STROKE}/>
  <rect x="124" y="84" width="40" height="46" rx="4" ${STROKE}/>
  <path d="M130 96 h28 M130 110 h20" ${THIN}/>
  <circle cx="144" cy="74" r="3" ${STROKE}/>
  <path d="M188 18 v40 M204 18 v40 M196 12 v52" ${THIN}/>
  <path d="M180 12 h32" ${THIN}/>
  <path d="M56 46 q10 -14 22 -4" ${THIN}/>
</svg>`,
  // a page corner used for the front-page feature band
  feature: () => `${svgOpen({ label: "Editorial line drawing of a plate, a probe thermometer and two heat marks", view: "0 0 240 150" })}
  <ellipse cx="96" cy="98" rx="58" ry="22" ${STROKE}/>
  <ellipse cx="96" cy="94" rx="34" ry="12" ${THIN}/>
  <path d="M164 40 l-38 40" ${STROKE}/>
  <rect x="160" y="24" width="26" height="18" rx="5" ${STROKE}/>
  <path d="M60 54 q10 -16 20 -4 q10 12 20 -4" ${THIN}/>
  <path d="M74 36 q8 -12 16 -3" ${THIN}/>
  <path d="M18 118 h204" ${THIN}/>
</svg>`
};

/* ---------- brand mark ---------- */

const brandMark = () =>
  `<svg class="brandmark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
  <rect x="2.5" y="2.5" width="27" height="27" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
  <path d="M9 21 h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M11 16 a5.5 5.5 0 1 1 8.4 -4.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

/**
 * Which schematic a product gets. Keyed on data/products.json fields so the
 * drawing follows the verified record: if the form factor changes, the art
 * changes with it, and nobody has to remember to update a picture.
 */
function forProduct(p) {
  const ff = `${p.formFactor} ${p.category}`;
  if (/dual-basket/.test(ff)) return dualBasket();
  if (/single basket|single-basket/.test(ff)) return singleBasket();
  if (/french door|french-door|oven-style/.test(ff)) return frenchDoorOven();
  if (/instant-read/.test(ff)) return instantRead();
  if (/wireless|leave-in/.test(ff)) return wirelessLeaveIn();
  return p.category === "thermometers" ? instantRead() : singleBasket();
}

/** Caption that appears under every drawing. Not optional — a reader must
 *  know they are looking at a diagram, not at the item in their kitchen. */
const caption = (extra = "") =>
  `<figcaption class="art__cap">Original schematic, drawn from the published specification. Not a product photograph.${extra ? ` ${extra}` : ""}</figcaption>`;

export const art = { forProduct, spots, caption, brandMark, hero: spots.hero, feature: spots.feature, dualBasket, singleBasket, frenchDoorOven, instantRead, wirelessLeaveIn };
