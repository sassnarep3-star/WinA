#!/usr/bin/env node
/**
 * Repository-wide publishing gate.
 *
 * v2/scripts/verify.mjs validates the v2 site it generates. This script
 * validates the WHOLE repository as it will actually be served by GitHub
 * Pages, including the hand-authored root site that other sessions built.
 *
 * Design rule: this gate must never fail because of a stylistic preference.
 * It only fails on things that are (a) a compliance violation, (b) a broken
 * link, or (c) a structural defect that would stop search engines indexing
 * the page. Anything else is a warning.
 *
 *   node scripts/check-site.mjs        -> exit 0 ship, exit 1 block
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.cwd();
const HOST = 'https://sassnarep3-star.github.io/WinA';

const errors = [];
const warnings = [];
const fail = (c, m) => errors.push({ c, m });
const warn = (c, m) => warnings.push({ c, m });

/* ------------------------------------------------------------------ gather */

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'archive' || entry === 'node_modules') continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (entry.endsWith('.html')) acc.push(p);
  }
  return acc;
}

// Archive is excluded on purpose: those pages are preserved verbatim as a
// historical record and are intentionally not maintained.
const htmlFiles = walk(ROOT).filter((f) => {
  const rel = relative(ROOT, f).split('\\').join('/');
  return !rel.startsWith('archive/') && !rel.includes('/site/');
});

const pages = htmlFiles.map((f) => ({
  file: relative(ROOT, f).split('\\').join('/'),
  html: readFileSync(f, 'utf8'),
}));

const SENTENCE = 'As an Amazon Associate I earn from qualifying purchases.';

const isShoppingAmazon = (href) => {
  if (/affiliate-program\.amazon\.com/i.test(href)) return false;
  if (/aws\.amazon\.com/i.test(href)) return false;
  return (
    /^https?:\/\/(www\.)?amazon\.[a-z.]+\/(dp|gp|stores|[A-Za-z0-9-]+\/b\/)/i.test(href) ||
    /^https?:\/\/link\.amazon\//i.test(href) ||
    /^https?:\/\/amzn\.to\//i.test(href)
  );
};

const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/https?:\/\/[^\s"'<>)]+/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&dollar;/g, '$');

const pricePattern =
  /(?:US\s?)?\$\s?\d{1,4}(?:,\d{3})*(?:\.\d{2})?(?![\w-])|£\s?\d|€\s?\d|\b\d+\.\d{2}\s?USD\b/;

/* ------------------------------------------------------------- per-page */

let amazonTotal = 0;
let amazonSponsored = 0;

for (const p of pages) {
  const { html, file } = p;

  /* --- disclosure: present, exact, and above the main landmark --- */
  const discIdx = html.indexOf('class="disclosure"');
  if (discIdx === -1) {
    fail('disclosure', `${file}: no disclosure block`);
  } else {
    const mainIdx = html.indexOf('<main');
    if (mainIdx !== -1 && discIdx > mainIdx) {
      fail('disclosure', `${file}: disclosure appears after <main> (below the fold)`);
    }
    if (!html.slice(discIdx, discIdx + 1200).includes(SENTENCE)) {
      fail('disclosure', `${file}: disclosure block is missing the exact §5 sentence`);
    }
  }

  /* --- disclosure repeated in the footer --- */
  const footIdx = Math.max(html.lastIndexOf('<footer'), html.lastIndexOf('class="footer"'));
  if (footIdx === -1) {
    warn('footer', `${file}: no footer element — disclosure is not repeated here`);
  } else if (!html.slice(footIdx).includes(SENTENCE)) {
    fail('footer', `${file}: footer does not repeat the Associates sentence`);
  }

  /* --- every buyable Amazon link is sponsored --- */
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)) {
    if (!isShoppingAmazon(m[1])) continue;
    amazonTotal++;
    const rel = (m[0].match(/rel="([^"]*)"/) || [, ''])[1];
    if (/\bsponsored\b/.test(rel)) amazonSponsored++;
    else fail('sponsored', `${file}: unsponsored Amazon link → ${m[1].slice(0, 68)}`);
    if (!/\bnoopener\b/.test(rel)) {
      fail('sponsored', `${file}: Amazon link without rel=noopener → ${m[1].slice(0, 68)}`);
    }
  }

  /* --- canonical + indexability --- */
  const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(html);
  if (!canon && !noindex) {
    fail('canonical', `${file}: no canonical link and not marked noindex`);
  } else if (canon) {
    // There are two published sites in this repo, each with its own root:
    //   the main site at /            (canonical_host .../WinA)
    //   the v2 edition at /v2/        (canonical_host .../WinA/v2)
    const siteRoot = file.startsWith('v2/') ? `${HOST}/v2` : HOST;
    if (!canon[1].startsWith(siteRoot)) {
      fail('canonical', `${file}: canonical is off-site → ${canon[1]} (expected prefix ${siteRoot})`);
    } else {
      const local = file.startsWith('v2/') ? file.slice(3) : file;
      const expected =
        local === 'index.html' ? `${siteRoot}/` : `${siteRoot}/${local.replace(/index\.html$/, '')}`;
      const norm = (u) => u.replace(/\/$/, '');
      if (norm(canon[1]) !== norm(expected)) {
        warn('canonical', `${file}: canonical (${canon[1]}) differs from this page's URL (${expected})`);
      }
    }
  }

  /* --- basic head hygiene --- */
  if (!/<title>[^<]{10,}<\/title>/.test(html)) fail('meta', `${file}: missing or stub <title>`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) {
    warn('meta', `${file}: missing or stub meta description`);
  }
  if (!/lang="/.test(html)) fail('a11y', `${file}: no lang attribute`);
  if (!/name="viewport"/.test(html)) fail('a11y', `${file}: no viewport meta`);

  /* --- no price claim anywhere in visible text --- */
  const pm = visibleText(html).match(pricePattern);
  if (pm) fail('no-price', `${file}: price-like literal "${pm[0]}" in visible text`);

  /* --- no third-party asset loading --- */
  for (const m of html.matchAll(/<img[^>]+src="(?:https?:)?\/\/([^"]+)"/g)) {
    fail('third-party', `${file}: externally hosted image → ${m[1].slice(0, 50)}`);
  }
  if (/<script[^>]+src="(?:https?:)?\/\//.test(html)) {
    fail('third-party', `${file}: third-party script`);
  }
  for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(https?:\/\/[^"]+)"/g)) {
    if (!m[1].startsWith(HOST)) fail('third-party', `${file}: external stylesheet → ${m[1]}`);
  }

  /* --- JSON-LD must be valid JSON --- */
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      fail('jsonld', `${file}: malformed JSON-LD block`);
    }
  }
}

if (amazonTotal === 0) fail('sponsored', 'no Amazon links found anywhere — the build looks empty');

/* ------------------------------------------------- internal links resolve */

const allFiles = new Set();
function collect(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) collect(p);
    else allFiles.add(relative(ROOT, p).split('\\').join('/'));
  }
}
collect(ROOT);

let internalLinks = 0;
for (const p of pages) {
  for (const m of p.html.matchAll(/(?:href|src)="(?!https?:|mailto:|#|javascript:|data:)([^"#?]+)/g)) {
    const target = m[1];
    internalLinks++;
    const resolved = target.startsWith('/')
      ? target.replace(/^\/WinA\//, '').replace(/^\//, '')
      : join(dirname(p.file), target);
    const norm = resolved.split('\\').join('/').replace(/^\.\//, '');
    const candidates = [norm, `${norm}index.html`, `${norm}/index.html`];
    if (target.endsWith('/')) candidates.push(`${norm}index.html`);
    if (!candidates.some((c) => allFiles.has(c))) {
      fail('broken-link', `${p.file}: → ${target} (no such file)`);
    }
  }
}

/* --------------------------------------------------- sitemap and robots */

function checkSitemap(sitemapFile, siteRoot, sitePrefix) {
  const full = join(ROOT, sitemapFile);
  if (!existsSync(full)) {
    fail('sitemap', `${sitemapFile} is missing`);
    return new Set();
  }
  const sm = readFileSync(full, 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const listed = new Set();

  for (const l of locs) {
    if (!l.startsWith(siteRoot)) {
      fail('sitemap', `${sitemapFile}: URL outside its own site root → ${l}`);
      continue;
    }
    const path = l.slice(siteRoot.length).replace(/^\//, '');
    const repoPath = sitePrefix + path;
    const file =
      path === '' ? `${sitePrefix}index.html`
      : path.endsWith('/') ? `${repoPath}index.html`
      : repoPath;
    listed.add(file);
    if (!allFiles.has(file)) fail('sitemap', `${sitemapFile} lists a URL with no file: ${l}`);
  }
  if (new Set(locs).size !== locs.length) fail('sitemap', `${sitemapFile}: duplicate URLs`);
  return listed;
}

// Main site: served from the repository root.
const mainListed = checkSitemap('sitemap.xml', HOST, '');

// v2 edition: served from /v2/, with its own sitemap at /v2/sitemap.xml.
const v2Root = `${HOST}/v2`;
const v2Listed = checkSitemap('v2/sitemap.xml', v2Root, 'v2/');

// Every indexable page must appear in its own site's sitemap.
for (const p of pages) {
  if (p.file.startsWith('archive/')) continue;
  if (/<meta name="robots" content="[^"]*noindex/.test(p.html)) continue;

  if (p.file === '404.html' || p.file === 'v2/404.html') continue; // never indexable

  const isV2 = p.file.startsWith('v2/');
  const listed = isV2 ? v2Listed : mainListed;
  const local = isV2 ? p.file.slice(3) : p.file;

  if (!listed.has(p.file) && !listed.has(local)) {
    fail('sitemap', `page not in sitemap: ${p.file}`);
  }
}

if (existsSync(join(ROOT, 'robots.txt'))) {
  const rb = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
  if (!/Sitemap:/i.test(rb)) fail('robots', 'robots.txt does not reference a sitemap');
}

/* --------------------------------------------------------------- feed */

if (!existsSync(join(ROOT, 'feed.xml'))) {
  fail('feed', 'feed.xml is missing');
} else {
  const fd = readFileSync(join(ROOT, 'feed.xml'), 'utf8');
  if (!/^<\?xml/.test(fd)) fail('feed', 'feed.xml does not start with an XML declaration');
  if (!/<rss version="2\.0"/.test(fd)) fail('feed', 'feed.xml is not RSS 2.0');
  const items = (fd.match(/<item>/g) || []).length;
  if (items === 0) fail('feed', 'feed.xml has no items');
  for (const m of fd.matchAll(/<(?:link|guid)[^>]*>([^<]+)<\/(?:link|guid)>/g)) {
    if (!m[1].startsWith('https://')) fail('feed', `relative URL in feed: ${m[1]}`);
    if (isShoppingAmazon(m[1])) fail('feed', `affiliate link in feed (policy): ${m[1]}`);
  }
}

/* ------------------------------------------------------------ reporting */

const checks = [
  'disclosure',
  'footer',
  'sponsored',
  'no-price',
  'canonical',
  'meta',
  'a11y',
  'third-party',
  'jsonld',
  'broken-link',
  'sitemap',
  'robots',
  'feed',
];

console.log('\nRepository publish gate');
console.log('─'.repeat(62));
for (const c of checks) {
  const n = errors.filter((e) => e.c === c).length;
  const w = warnings.filter((x) => x.c === c).length;
  console.log(
    `  ${n === 0 ? '✓' : '✗'} ${c.padEnd(16)} ${n === 0 ? (w ? `${w} warning(s)` : 'pass') : `${n} failure(s)`}`
  );
}
console.log('─'.repeat(62));
console.log(
  `  pages: ${pages.length} · internal links: ${internalLinks} · ` +
    `amazon links: ${amazonTotal} (${amazonSponsored} sponsored)`
);

if (warnings.length) {
  const shown = warnings.slice(0, 12);
  console.log(`\nWarnings (${warnings.length})`);
  for (const w of shown) console.log(`  ! [${w.c}] ${w.m}`);
  if (warnings.length > shown.length) console.log(`  … and ${warnings.length - shown.length} more`);
}

if (errors.length) {
  console.log(`\n✗ ${errors.length} failure(s) — DO NOT PUBLISH\n`);
  for (const e of errors.slice(0, 40)) console.log(`  ✗ [${e.c}] ${e.m}`);
  if (errors.length > 40) console.log(`  … and ${errors.length - 40} more`);
  console.log('');
  process.exit(1);
}

console.log('\n✓ repository gate passed — safe to publish\n');
