// Link validator. Three jobs, all of them cheap to enforce and expensive to get wrong:
//   1. no reader may ever be sent to a page that does not exist;
//   2. no Amazon product link may ship untagged, unqualified, or before verification;
//   3. no citation may accidentally look like a referral.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, posix } from "node:path";
import { OUT, ROOT, cfg, load, Report, tags, htmlFiles } from "./lib/site.mjs";

const policy = JSON.parse(readFileSync(join(ROOT, "config/link-policy.json"), "utf8"));
const products = load("data/products.json").products;
const r = new Report("link validation");
const PRODUCT_RE = /\/dp\/|\/gp\/product\/|amzn\.(to|eu\.dk)\//;
const hostOf = (u) => { try { return new URL(u, "http://x").hostname; } catch { return ""; } };
const resolveFile = (page, href) => {
  if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) return null;
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return null;
  const abs = posix.normalize(posix.join(dirname(page), clean));
  return abs;
};
const exists = (relPath) => {
  const p = join(OUT, relPath);
  return existsSync(p) || existsSync(join(p, "index.html"));
};

const pages = htmlFiles();
r.ok(pages.length >= 30, "the build output looks truncated", `${pages.length} html files`);
let internal = 0, external = 0, product = 0;

for (const page of pages) {
  const html = readFileSync(join(OUT, page), "utf8");
  // ---- internal + external links
  for (const a of tags(html, "a")) {
    const href = a.href || "";
    if (!href) { r.fail("an <a> tag carries no href at all", page); continue; }
    if (href.startsWith("javascript:")) { r.fail("javascript: href is not allowed", page); continue; }
    if (/^https?:/.test(href)) {
      external++;
      const host = hostOf(href);
      const isProduct = policy.productHosts.includes(host) || PRODUCT_RE.test(href);
      if (isProduct) {
        product++;
        if (host === "link.amazon") r.fail(`forbidden product host link.amazon appears in a live href`, page);
        if (!cfg.affiliate.linksEnabled)
          r.fail("an Amazon product link was emitted while links are disabled in config — the gate is the point", `${page} ${href}`);
        else {
          const rel = (a.rel || "").toLowerCase();
          r.ok(rel.split(/\s+/).includes(policy.requireRel), `product link must carry rel="${policy.requireRel}"`, `${page} ${href}`);
          r.ok(!/_blank/.test(a.target || "") || /noopener/.test(rel), "blank product links need noopener", `${page} ${href}`);
          const tag = new URL(href).searchParams.get("tag");
          r.ok(tag === cfg.affiliate.trackingId, `product link tag must equal the configured tracking id (got ${tag})`, `${page} ${href}`);
          const asin = (href.match(/\/dp\/([A-Za-z0-9]{1,16})/) || [])[1];
          if (asin) r.ok(/^[A-Z0-9]{10}$/.test(asin), `/dp/ href carries a malformed ASIN`, `${page} ${href}`);
        }
      } else {
        r.ok(policy.citationHosts.includes(host), `external host not on the citation allow-list: ${host}`, `${page} ${href}`);
        r.ok(!/[?&]tag=/.test(href), "a citation must not carry an Associates tag — references are not referrals", `${page} ${href}`);
      }
      continue;
    }
    internal++;
    const file = resolveFile(page, href);
    if (!file) continue;
    if (!exists(file)) { r.fail(`broken internal link`, `${page} -> ${href}`); continue; }
    const anchor = href.split("#")[1];
    if (anchor) {
      const dest = existsSync(join(OUT, file, "index.html")) ? join(OUT, file, "index.html") : existsSync(join(OUT, file)) ? join(OUT, file) : null;
      if (dest) {
        const t = readFileSync(dest, "utf8");
        r.ok(new RegExp(`id="${anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(t), `anchor #${anchor} does not exist in the target`, `${page} -> ${href}`);
      }
    }
    // directory URLs must be requested with a trailing slash so canonical matches
    const pathPart = href.split("#")[0].split("?")[0];
    if (pathPart && !/\/$/.test(pathPart) && !/\.(xml|json|txt|css|js|svg|png|jpe?g|html)$/i.test(pathPart))
      r.fail(`a link to a directory page should keep its trailing slash so it matches the canonical URL`, `${page} -> ${href}`);
  }
  // ---- assets
  for (const img of tags(html, "img")) {
    r.ok(!!img.alt, "img needs alt text", `${page} ${img.src || ""}`);
    r.ok(img.src && !/^https?:/.test(img.src), "images must be local: hot-linking a CDN image is a licence question, not a shortcut", `${page} ${img.src || ""}`);
    if (img.src) { const f = resolveFile(page, img.src); if (f) r.ok(exists(f), `image does not exist`, `${page} -> ${img.src}`); }
  }
  for (const s of tags(html, "script")) {
    if (s.src) r.ok(!/^https?:/.test(s.src), "no third-party scripts", `${page} ${s.src}`);
  }
  for (const l of tags(html, "link")) {
    if (l.href && !/^https?:/.test(l.href)) { const f = resolveFile(page, l.href); if (f) r.ok(exists(f), `linked asset missing`, `${page} -> ${l.href}`); }
  }
  // ---- absolute-root paths would 404 under a project Pages sub-path
  const rooted = html.match(/(?:href|src)="\/(?!\/)[^"]+"/g) || [];
  r.ok(rooted.length === 0, `root-absolute paths break under a project sub-path`, `${page}: ${rooted.slice(0, 2).join(", ")}`);
}

// ---- feeds + robots point only at files that exist
const sitemap = readFileSync(join(OUT, "sitemap.xml"), "utf8");
const base = cfg.baseUrl.replace(/\/$/, "");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
r.ok(locs.length >= 20, "sitemap looks thin", String(locs.length));
for (const loc of locs) {
  const relPath = loc.replace(base, "").replace(/^\//, "") || "index.html";
  const withIdx = relPath.endsWith("/") ? relPath + "index.html" : relPath;
  if (!existsSync(join(OUT, withIdx))) r.fail(`sitemap lists a page that was not built`, loc);
  if (!loc.startsWith(base + "/")) r.fail("sitemap URL does not match the configured base URL", loc);
}
const feed = readFileSync(join(OUT, "feed.xml"), "utf8");
for (const m of feed.matchAll(/<link>([^<]+)<\/link>/g)) {
  const relPath = m[1].replace(base, "").replace(/^\//, "");
  r.ok(existsSync(join(OUT, relPath, "index.html")) || existsSync(join(OUT, relPath)), "feed item links to a page that was not built", m[1]);
}
const robots = readFileSync(join(OUT, "robots.txt"), "utf8");
r.ok(/Sitemap:\s*\S+\/sitemap\.xml/.test(robots), "robots.txt must advertise the sitemap at its absolute URL");
r.ok(existsSync(join(OUT, ".nojekyll")), "docs/.nojekyll missing: Jekyll would try to build the site and could fail on an underscore-free asset");
const stats = JSON.parse(readFileSync(join(OUT, "build-stats.json"), "utf8"));
const htmlNo404 = pages.filter((p) => !p.startsWith("404"));
r.ok(stats.pages === htmlNo404.length, "page count from the build does not match files on disk", `${stats.pages} vs ${htmlNo404.length}`);
// every non-noindex page must appear in the sitemap
for (const page of htmlNo404) {
  const html = readFileSync(join(OUT, page), "utf8");
  if (/name="robots" content="noindex/.test(html)) continue;
  const dir = "/" + dirname(page).replace(/^\.$/, "").replace(/^([^/]+)$/, "$1") + "/";
  const url = page === "index.html" ? base + "/" : base + (page.endsWith("index.html") ? "/" + page.replace(/index\.html$/, "") : "/" + page);
  r.ok(sitemap.includes(url), `page is indexable but absent from the sitemap`, page);
}
r.ok(!readFileSync(join(OUT, "index.html"), "utf8").includes("link.amazon"), "the front page must never contain the forbidden host");
for (const p of products) r.ok(!JSON.stringify(p).includes("&tag="), "a register row must not smuggle a tagged URL into data", p.id);

console.log(`  scope: ${pages.length} pages · ${internal} internal refs · ${external} external refs · ${product} product links · links enabled: ${cfg.affiliate.linksEnabled}`);
process.exit(r.print() ? 0 : 1);
