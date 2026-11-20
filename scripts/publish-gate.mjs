// The publish decision, computed instead of felt. Everything before "merge" in one command.
//
// It is deliberately not a wrapper that hides the gates: it runs the three of them in the order CI
// runs them, then prints the two things a gate cannot decide — whether the account is enrolled, and
// whether the owner accepts live links with no recorded test.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cfg, Report } from "./lib/site.mjs";

const r = new Report("publish gate");
const run = (label, args) => {
  process.stdout.write(`\n── ${label}\n`);
  const res = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
  return r.ok(res.status === 0, `${label} failed`, args.join(" "));
};
run("build + publication gate", ["_src/build.mjs"]);
run("site checks (structure, links, feeds, schema)", ["scripts/check-site.mjs"]);
run("compliance gate (disclosure, claims, cross-references)", ["scripts/compliance-gate.mjs"]);
run("docs gate (reviewer documents vs the register)", ["scripts/docs-gate.mjs"]);

// determinism: two builds must produce the same bytes, or "what we checked" is not "what shipped"
const hash = () => {
  const out = spawnSync(process.execPath, ["-e", `
import { createHash } from "node:crypto"; import { readFileSync, readdirSync } from "node:fs"; import { join } from "node:path";
const skip=new Set([".git","node_modules","archive","_src","_worker","scripts","data"]);const acc=[];
(function walk(d){for(const e of readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const p=join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(html|xml)$/.test(e.name)||e.name==="VALIDATION.md")acc.push(p);}})(".");
const h=createHash("sha256");for(const f of acc.sort())h.update(readFileSync(f));console.log(h.digest("hex"), acc.length);
`], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  return out;
};
const before = hash();
spawnSync(process.execPath, ["_src/build.mjs"], { cwd: ROOT, stdio: "ignore" });
const after = hash();
r.ok(before === after, "the build is not reproducible — regenerated output differs from what is in the tree", `${before} → ${after}`);
if (process.argv.includes("--committed")) {
  const dirty = spawnSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  r.ok(dirty === "", "generated files are not committed (this is the check CI runs) — commit the build output", dirty.split("\n").slice(0, 4).join(" | "));
} else console.log("\n── committed-output check skipped (CI runs it on a clean checkout; add --committed to run it here)");

const passing = cfg.specialLink.tests.filter((t) => /passed/.test(t.test_status)).length;
const openBlocking = cfg.governance.flagged.filter((f) => /action/.test(f.severity));
const stale = cfg.policy.sources.filter((s) => Date.now() - new Date(s.accessed + "T00:00:00Z").getTime() > 90 * 864e5);
console.log(`
Decision
────────
  publish as an editorial publication     ${r.f.length ? "NO — fix the failures above" : "yes"}
  publish with monetized links            ${passing ? `${passing}/${cfg.specialLink.tests.length} tests recorded — proceed for the tested rows` : `${passing}/${cfg.specialLink.tests.length} recorded while the per-product tests are unrecorded (FLG-024)`}
  open action rows                        ${openBlocking.length ? `${openBlocking.length}: ${openBlocking.map((f) => f.id).join(", ")}` : "none"}
  sources past the 90-day review window   ${stale.length ? stale.map((s) => s.id).join(", ") : "none — all read within 90 days"}
  pages served                            ${existsSync(join(ROOT, "index.html")) ? "index.html present at the root (Pages publishes the branch root)" : "NO index.html"}
  built for                               ${cfg.site.origin} (base ${cfg.site.baseurl}) · Tracking ID ${cfg.site.trackingId}

  Nothing here has a --force flag for a compliance failure. A gate you can argue out of is a note
  to yourself, and notes do not survive a deadline.
`);
if (!passing) console.log("  To close FLG-024: build one link per product in Associates Central, click it logged out, confirm the");
console.log("  destination and the reporting line the next day, then record it in data/special_link_tests.json.");
process.exit(r.print() ? 0 : 1);
