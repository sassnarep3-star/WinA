// Docs gate — the three documents a human reads first must not lie about the register.
//
// Why this exists. Every other gate in this repository reads HTML or reads `data/`. None of them
// reads `README.md`, `ARCHITECTURE.md` or `EXECUTIVE_SUMMARY.md`, so those three could drift while
// every check stayed green — which is exactly what happened: eleven figures in them were stale
// (37 flag rows when the register held 39, 16 suggestions when it held 24, "5 sources" when the
// register defined 6, "22 verified, 8 claims, 20 unverified" when the census was 32/4/14/10, and a
// "Current state" block that still described a 27-page build). A reviewer is told to read those
// three documents first, so a stale number in one of them is not a cosmetic problem.
//
// The rule this gate encodes:
//
//   * Facts ABOUT THE REGISTER (how many products, spec rows, sources, clauses, flags,
//     questions, suggestions, guides, pages, links) are stated in prose and checked here.
//   * Facts ABOUT A RUN (assertion counts, "the build printed N") are never restated in prose;
//     the command prints them. You cannot keep a run fact honest in a file that is not regenerated.
//
// So: if you add a product, a flag or a guide, this gate fails and tells you which sentence to
// update. That friction is the point — it is cheaper than a reviewer finding the lie.
//
//   node scripts/docs-gate.mjs        -> exit 0 ship, exit 1 block
import { guides } from "../_src/content.mjs";
import { cfg, htmlFiles, readOut, Report } from "./lib/site.mjs";

const r = new Report("docs gate");

/* ---------------------------------------------------------------- figures */

const products = cfg.products;
const policy = cfg.policy;
const gov = cfg.governance;

const mix = { verified: 0, claim: 0, unverified: 0, withheld: 0 };
let specRows = 0;
let valued = 0;
for (const p of products) {
  for (const s of p.specs) {
    specRows++;
    if (Object.hasOwn(mix, s.status)) mix[s.status]++;
    const v = s.value;
    if (v !== null && v !== undefined && v !== "" && v !== "—" && v !== "-") valued++;
  }
}

// The same matcher scripts/check-site.mjs uses, so this gate and that one agree by construction.
const isShoppingAmazon = (href) => {
  if (/affiliate-program\.amazon\.com/i.test(href)) return false;
  if (/aws\.amazon\.com/i.test(href)) return false;
  return (
    /^https?:\/\/(www\.)?amazon\.[a-z.]+\/(dp|gp|stores|[A-Za-z0-9-]+\/b(?:\/|\?))/i.test(href) ||
    /^https?:\/\/link\.amazon\//i.test(href) ||
    /^https?:\/\/amzn\.to\//i.test(href)
  );
};

let amazonLinks = 0;
let sponsored = 0;
let shortLinkAnchors = 0;
for (const f of htmlFiles()) {
  const html = readOut(f);
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)) {
    if (/^https?:\/\/link\.amazon\//i.test(m[1])) shortLinkAnchors++;
    if (!isShoppingAmazon(m[1])) continue;
    amazonLinks++;
    const rel = (m[0].match(/rel="([^"]*)"/) || [, ""])[1];
    if (/\bsponsored\b/.test(rel)) sponsored++;
  }
}

const pages = htmlFiles().length;
const tests = cfg.specialLink.tests;
const recorded = tests.filter((t) => t.tested_on).length;

const fig = {
  products: products.length,
  specRows,
  valued,
  blank: specRows - valued,
  policySources: policy.sources.length,
  policyClauses: policy.policy.length,
  flags: gov.flagged.length,
  questions: cfg.questions.questions.length,
  suggestions: cfg.suggestions.suggestions.length,
  guides: guides.length,
  pages,
  amazonLinks,
  sponsored,
  shortLinkAnchors,
  testsTotal: tests.length,
  testsRecorded: recorded,
  mix,
};

/* ------------------------------------------------------------- assertions */

/**
 * { file, label, re, want }
 *   re    — must match somewhere in the file, with one capture group per expected value
 *   want  — number, or array of numbers, the captures must equal (in order)
 * A missing match is itself a failure: if the document stops stating a figure, the gate says so
 * rather than passing silently on an absence.
 */
const assertions = [
  // ---- EXECUTIVE_SUMMARY.md: the one page a reader is pointed at first
  {
    file: "EXECUTIVE_SUMMARY.md",
    label: "tagged outbound product links (opening sentence)",
    re: /\*\*(\d+) tagged outbound product links\*\*/,
    want: () => [fig.sponsored],
  },
  {
    file: "EXECUTIVE_SUMMARY.md",
    label: "reader pages",
    re: /\| Reader pages \| (\d+) total/,
    want: () => [fig.pages],
  },
  {
    file: "EXECUTIVE_SUMMARY.md",
    label: "data registers",
    re:
      /\| Data registers \| (\d+) products · (\d+) spec rows · (\d+) policy sources · (\d+) policy clauses quoted · (\d+) flag rows · (\d+) questions · (\d+) suggestions/,
    want: () => [
      fig.products,
      fig.specRows,
      fig.policySources,
      fig.policyClauses,
      fig.flags,
      fig.questions,
      fig.suggestions,
    ],
  },
  {
    file: "EXECUTIVE_SUMMARY.md",
    label: "submitted short links vs their anchor instances",
    re: /the \*\*five\*\* submitted short links render as declared non-affiliate citations[^—]*— (\d+) anchor instances/,
    want: () => [fig.shortLinkAnchors],
  },
  {
    file: "EXECUTIVE_SUMMARY.md",
    label: "live tagged links and recorded Special Link tests",
    re: /\*\*(\d+) tagged product links are live; (\d+) of (\d+) per-product Special Link tests are recorded\.\*\*/,
    want: () => [fig.sponsored, fig.testsRecorded, fig.testsTotal],
  },
  {
    file: "EXECUTIVE_SUMMARY.md",
    label: "guides + product pages",
    re: /(\d+) guides \+ (\d+) product pages is thin/,
    want: () => [fig.guides, fig.products],
  },

  // ---- ARCHITECTURE.md: the register census
  {
    file: "ARCHITECTURE.md",
    label: "policy sources and clauses",
    re: /data\/policy\.json` \((\d+) sources, (\d+) policy rows\)/,
    want: () => [fig.policySources, fig.policyClauses],
  },
  {
    file: "ARCHITECTURE.md",
    label: "spec rows and status census",
    re: /(\d+) spec rows: (\d+) verified, (\d+) claims, (\d+) unverified, (\d+) withheld/,
    want: () => [fig.specRows, fig.mix.verified, fig.mix.claim, fig.mix.unverified, fig.mix.withheld],
  },

  // ---- README.md: the entry point
  {
    file: "README.md",
    label: "open questions",
    re: /(\d+) open questions with what is missing/,
    want: () => [fig.questions],
  },
  {
    file: "README.md",
    label: "reviewable suggestions",
    re: /(\d+) reviewable suggestions with cost/,
    want: () => [fig.suggestions],
  },
  {
    file: "README.md",
    label: "flagged findings in the reading order",
    re: /flagged\/\) \((\d+) open and resolved\s+findings\)/,
    want: () => [fig.flags],
  },
];

/* ------------------------------------------------------------------ report */

for (const a of assertions) {
  const doc = readOut(a.file);
  const m = doc.match(a.re);
  const want = a.want();
  if (!m) {
    r.fail(
      `${a.file} no longer states: ${a.label}`,
      `expected a match for ${a.re} — the sentence was edited or removed; restore the figure or drop this assertion deliberately`
    );
    continue;
  }
  const got = m.slice(1).map((x) => Number(x));
  const ok = got.length === want.length && got.every((v, i) => v === want[i]);
  r.ok(
    ok,
    `${a.file}: "${a.label}" is stale`,
    `document says ${got.join(" / ")}, data says ${want.join(" / ")}`
  );
}

// The census must account for every row: if a new status appears, the four stated numbers stop
// summing to the total and this catches it even though no single assertion above would.
const statedMixTotal = [fig.mix.verified, fig.mix.claim, fig.mix.unverified, fig.mix.withheld].reduce(
  (a, b) => a + b,
  0
);
r.ok(
  statedMixTotal === fig.specRows,
  "spec status census does not sum to the spec row count",
  `${statedMixTotal} vs ${fig.specRows} — a status outside verified/claim/unverified/withheld is in use`
);

// Sanity: this gate must actually have found the documents.
for (const f of ["README.md", "ARCHITECTURE.md", "EXECUTIVE_SUMMARY.md"]) {
  r.ok(readOut(f).length > 500, `${f} is missing or empty`, f);
}

const printed = Object.fromEntries(
  Object.entries(fig).filter(([k]) => k !== "mix")
);
console.log(`\nregister figures used: ${JSON.stringify(printed)}`);
console.log(`spec status census:     ${JSON.stringify(fig.mix)}`);

process.exit(r.print() ? 0 : 1);
