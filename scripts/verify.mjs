#!/usr/bin/env node
/**
 * Build gate. Reads the generated site/ and fails loudly if any invariant
 * breaks. Run by .github/workflows/pages.yml before deploy, so a failing
 * check means nothing is published.
 *
 * Exit code 0 = ship. Non-zero = do not ship.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'site');

const SITE_CFG = JSON.parse(readFileSync(join(ROOT, 'data/site.json'), 'utf8'));
const BASE = SITE_CFG.site.base_path || '';
const HOST = SITE_CFG.site.canonical_host;

const errors = [];
const warnings = [];
const fail = (check, msg) => errors.push({ check, msg });
const warn = (check, msg) => warnings.push({ check, msg });

if (!existsSync(OUT)) {
  console.error('✗ site/ does not exist — run scripts/build.mjs first');
  process.exit(1);
}

/** Strip the deploy base path ("/WinA") so paths become site-relative. */
const strip = (href) => (BASE && href.startsWith(BASE + '/') ? href.slice(BASE.length) : href);

/* ------------------------------------------------------------ collect html */

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (entry.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const htmlFiles = walk(OUT);
const pages = htmlFiles.map((f) => ({
  file: relative(OUT, f).split('\\').join('/'),
  html: readFileSync(f, 'utf8'),
}));

if (pages.length === 0) fail('pages', 'no HTML pages were generated');

/* ------------------------------------------------------------- CHECK 1 + 2 */
/* Disclosure above the fold on every page; repeated in every footer.        */

const SENTENCE = 'As an Amazon Associate I earn from qualifying purchases.';

for (const p of pages) {
  const { html, file } = p;

  const stripIdx = html.indexOf('class="disclosure"');
  const mainIdx = html.indexOf('<main');

  if (stripIdx === -1) {
    fail('disclosure-above-fold', `${file}: no disclosure strip found`);
  } else {
    if (mainIdx === -1 || stripIdx > mainIdx) {
      fail('disclosure-above-fold', `${file}: disclosure strip appears after <main>`);
    }
    const inner = html.indexOf('disclosure__inner', stripIdx);
    const stripHtml = html.slice(stripIdx, inner + 400);
    if (!stripHtml.includes(SENTENCE)) {
      fail('disclosure-above-fold', `${file}: strip is missing the required Associates sentence`);
    }
  }

  const footerIdx = html.indexOf('class="footer"');
  if (footerIdx === -1) {
    fail('disclosure-in-footer', `${file}: no footer`);
  } else {
    const footer = html.slice(footerIdx);
    if (!footer.includes('Affiliate disclosure')) {
      fail('disclosure-in-footer', `${file}: footer does not repeat the disclosure`);
    }
    if (!footer.includes(SENTENCE) && !footer.includes('earn a commission')) {
      fail('disclosure-in-footer', `${file}: footer disclosure text is missing`);
    }
  }

  const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canon) fail('canonical', `${file}: no canonical link`);
  else if (!canon[1].startsWith(HOST)) {
    fail('canonical', `${file}: canonical is not on the single indexable host (${canon[1]})`);
  }

  if (!/<title>[^<]{10,}<\/title>/.test(html)) fail('meta', `${file}: missing or too-short <title>`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) {
    fail('meta', `${file}: missing or too-short meta description`);
  }

  if (!html.includes('class="skip"')) fail('a11y', `${file}: missing skip-to-content link`);
  if (!/lang="en-US"/.test(html)) fail('a11y', `${file}: missing lang attribute`);

  for (const m of html.matchAll(/<img[^>]+src="(?:https?:)?\/\/([^"]+)"/g)) {
    fail('no-third-party-assets', `${file}: external image ${m[1]}`);
  }
  for (const m of html.matchAll(/<link[^>]+href="https?:\/\/(?!sassnarep3-star\.github\.io)[^"]+"/g)) {
    fail('no-third-party-assets', `${file}: external stylesheet/preload ${m[0].slice(0, 80)}`);
  }
  if (/<script[^>]+src="(?:https?:)?\/\//.test(html)) {
    fail('no-third-party-assets', `${file}: third-party script tag`);
  }
}

/* ----------------------------------------------------------------- CHECK 3 */
/* Every Amazon SHOPPING outbound link must carry rel="sponsored".           */
/*                                                                           */
/* Two kinds of Amazon URL appear here and they are not the same thing:      */
/*  - Shopping links (amazon.com product or browse pages, link.amazon,       */
/*    amzn.to): a reader can buy through these, so they must be sponsored.   */
/*  - Documentation links (affiliate-program.amazon.com): a citation of the  */
/*    programme's own rulebook. Not a shopfront, so not marked sponsored.    */

const isShoppingAmazon = (href) => {
  if (/affiliate-program\.amazon\.com/i.test(href)) return false;
  if (/aws\.amazon\.com/i.test(href)) return false;
  return (
    /^https?:\/\/(www\.)?amazon\.[a-z.]+\/(dp|gp|stores|[A-Za-z0-9-]+\/b\/)/i.test(href) ||
    /^https?:\/\/link\.amazon\//i.test(href) ||
    /^https?:\/\/amzn\.to\//i.test(href)
  );
};

let amazonLinks = 0;
let sponsoredLinks = 0;

for (const p of pages) {
  for (const m of p.html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)) {
    const tag = m[0];
    const href = m[1];
    if (!isShoppingAmazon(href)) continue;
    amazonLinks++;
    const rel = (tag.match(/rel="([^"]*)"/) || [, ''])[1];
    if (!/\bsponsored\b/.test(rel)) {
      fail('sponsored-rel', `${p.file}: Amazon link without rel="sponsored" → ${href.slice(0, 70)}`);
    } else sponsoredLinks++;
    if (!/\bnofollow\b/.test(rel)) {
      warn('sponsored-rel', `${p.file}: Amazon link without rel="nofollow" → ${href.slice(0, 70)}`);
    }
    if (!/\bnoopener\b/.test(rel)) {
      fail('sponsored-rel', `${p.file}: Amazon link without rel="noopener" → ${href.slice(0, 70)}`);
    }
  }
}

if (amazonLinks === 0) fail('sponsored-rel', 'no Amazon outbound links found at all — build may be empty');
if (amazonLinks !== sponsoredLinks) {
  fail('sponsored-rel', `${amazonLinks - sponsoredLinks} Amazon link(s) are not marked sponsored`);
}

/* ----------------------------------------------------------------- CHECK 4 */
/* No price literal may appear in any output file.                           */
/*                                                                           */
/* The test runs on visible text only: every tag, every URL and every        */
/* attribute value is stripped first, so a "$" in a URL cannot trip it,      */
/* while a dollar figure in prose always will.                               */

const pricePattern =
  /(?:US\s?)?\$\s?\d{1,4}(?:,\d{3})*(?:\.\d{2})?(?![\w-])|£\s?\d|€\s?\d|\b\d+\.\d{2}\s?USD\b/;

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/https?:\/\/[^\s"'<>)]+/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&dollar;/g, '$');
}

for (const p of pages) {
  const m = visibleText(p.html).match(pricePattern);
  if (m) fail('no-price-literals', `${p.file}: price-like literal "${m[0]}" appears in visible text`);
}

for (const f of ['feed.xml', 'sitemap.xml', 'robots.txt']) {
  const fp = join(OUT, f);
  if (!existsSync(fp)) {
    fail('artifacts', `${f} was not generated`);
    continue;
  }
  const m = visibleText(readFileSync(fp, 'utf8')).match(pricePattern);
  if (m) fail('no-price-literals', `${f}: price-like literal "${m[0]}"`);
}

/* ----------------------------------------------------------------- CHECK 5 */
/* Sitemap must list exactly the indexable pages, and every URL must exist.  */

const sitemap = readFileSync(join(OUT, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const expected = new Set();
for (const p of pages) {
  if (p.file === '404.html') continue;
  const u = p.file.replace(/index\.html$/, '');
  expected.add(`${HOST}/${u}`);
}

const locSet = new Set(locs);
for (const e of expected) if (!locSet.has(e)) fail('sitemap', `page missing from sitemap: ${e}`);
for (const l of locs) if (!expected.has(l)) fail('sitemap', `sitemap lists a non-existent page: ${l}`);
if (new Set(locs).size !== locs.length) fail('sitemap', 'sitemap contains duplicate URLs');

for (const l of locs) {
  const path = l.slice(HOST.length);
  const file = path.endsWith('/') ? join(OUT, path, 'index.html') : join(OUT, path);
  if (!existsSync(file)) fail('sitemap', `sitemap URL has no file: ${l}`);
}

/* ----------------------------------------------------------------- CHECK 6 */
/* Internal links resolve, and every root-relative path carries the base.    */

const knownPaths = new Set(pages.map((p) => '/' + p.file.replace(/index\.html$/, '')));
knownPaths.add('/');
for (const extra of [
  '/assets/styles.css',
  '/assets/analytics.js',
  '/assets/config.js',
  '/feed.xml',
  '/sitemap.xml',
  '/robots.txt',
]) {
  knownPaths.add(extra);
}

let internalLinks = 0;
for (const p of pages) {
  for (const m of p.html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)/g)) {
    const href = strip(m[1]);
    internalLinks++;
    if (!knownPaths.has(href) && !knownPaths.has(href + '/')) {
      fail('broken-links', `${p.file}: internal link goes nowhere → ${m[1]}`);
    }
  }

  // A root-relative path that forgot the base would 404 on GitHub project Pages.
  for (const m of p.html.matchAll(/(?:src|href)="(\/(?!\/)[^"]*)"/g)) {
    if (BASE && !m[1].startsWith(BASE + '/')) {
      fail('base-path', `${p.file}: root-relative reference missing the ${BASE} base path → ${m[1]}`);
    }
  }

  for (const m of p.html.matchAll(/(?:src|href)="(\/[^"]*\/assets\/[^"?]+)"/g)) {
    const rel = strip(m[1]);
    if (!existsSync(join(OUT, rel))) fail('broken-links', `${p.file}: missing asset ${m[1]}`);
  }
}

/* ----------------------------------------------------------------- CHECK 7 */
/* Every VERIFIED DATA table must carry a per-row source.                    */
/*                                                                           */
/* Only tables marked data-verified="true" are held to this. The generator   */
/* emits that marker for product specification and comparison tables — the   */
/* ones whose cells assert facts about a real product. Definitional tables   */
/* (what a ledger field means, what an event is) make no product claim.      */

let verifiedTables = 0;
for (const p of pages) {
  const tables = p.html.match(/<table[^>]*data-verified="true"[\s\S]*?<\/table>/g) || [];
  if (tables.length === 0) continue;
  verifiedTables += tables.length;

  for (const [i, t] of tables.entries()) {
    const sourceCells = (t.match(/class="src"/g) || []).length;
    const conflictCells = (t.match(/class="conflict"/g) || []).length;
    const hasUnconfirmed = t.includes('Not confirmed');
    if (sourceCells === 0 && conflictCells === 0 && !hasUnconfirmed) {
      fail(
        'every-row-has-source',
        `${p.file}: verified table #${i + 1} has no source links, no conflict tags and no "Not confirmed" cells`
      );
    }
  }
}

if (verifiedTables === 0) {
  fail('every-row-has-source', 'no data-verified tables were rendered — the data register may be empty');
}

/* ----------------------------------------------------------------- CHECK 8 */
/* Feed: valid RSS 2.0, absolute links, and no affiliate links inside.       */

const feed = readFileSync(join(OUT, 'feed.xml'), 'utf8');
if (!feed.startsWith('<?xml')) fail('feed', 'feed.xml does not start with an XML declaration');
if (!/<rss version="2.0"/.test(feed)) fail('feed', 'feed.xml is not RSS 2.0');
const itemCount = (feed.match(/<item>/g) || []).length;
if (itemCount === 0) fail('feed', 'feed.xml has no items');
for (const m of feed.matchAll(/<(?:link|guid)[^>]*>([^<]+)<\/(?:link|guid)>/g)) {
  if (!m[1].startsWith('https://')) fail('feed', `feed contains a relative link: ${m[1]}`);
  if (/link\.amazon|amzn\.to|\/dp\//.test(m[1])) {
    fail('feed', `feed contains an affiliate/product link, which policy forbids distributing: ${m[1]}`);
  }
}

/* --------------------------------------------------------------- reporting */

const checks = [
  'pages',
  'disclosure-above-fold',
  'disclosure-in-footer',
  'sponsored-rel',
  'no-price-literals',
  'canonical',
  'meta',
  'a11y',
  'sitemap',
  'broken-links',
  'base-path',
  'every-row-has-source',
  'feed',
  'no-third-party-assets',
  'artifacts',
];

console.log('\nBuild verification');
console.log('─'.repeat(60));
for (const c of checks) {
  const n = errors.filter((e) => e.check === c).length;
  const w = warnings.filter((x) => x.check === c).length;
  const mark = n === 0 ? '✓' : '✗';
  const note = n === 0 ? (w ? `${w} warning(s)` : 'pass') : `${n} failure(s)`;
  console.log(`  ${mark} ${c.padEnd(24)} ${note}`);
}
console.log('─'.repeat(60));
console.log(
  `  pages: ${pages.length} · internal links: ${internalLinks} · amazon links: ${amazonLinks} ` +
    `(${sponsoredLinks} sponsored) · verified tables: ${verifiedTables} · feed items: ${itemCount}`
);

if (warnings.length) {
  console.log('\nWarnings');
  for (const w of warnings) console.log(`  ! [${w.check}] ${w.msg}`);
}

if (errors.length) {
  console.log(`\n✗ ${errors.length} failure(s) — DO NOT DEPLOY\n`);
  for (const e of errors) console.log(`  ✗ [${e.check}] ${e.msg}`);
  console.log('');
  process.exit(1);
}

console.log('\n✓ all checks passed — safe to deploy\n');
