// The publish decision, in one command. Run this before merging anything that touches the site.
//
// It is not a convenience wrapper: the point is that "ready to publish" is a computed state
// derived from the register, not a feeling. Two things can stop it, and both are printed with
// the exact fix.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cfg, products, flags, Report } from "./lib/site.mjs";

const r = new Report("publish gate");
const STEPS = [
  ["data validation", ["tools/validate-data.mjs"]],
  ["build", ["site/build.mjs"]],
  ["link validation", ["tools/validate-links.mjs"]],
  ["compliance gate", ["tools/compliance-gate.mjs"]]
];
const step = (label, args) => {
  process.stdout.write(`\n── ${label}\n`);
  const res = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
  r.ok(res.status === 0, `${label} failed`, args.join(" "));
  return res.status === 0;
};
for (const [label, args] of STEPS) step(label, args);

// the two questions only the account can answer
const openBlocking = flags.filter((f) => f.severity === "blocking" && f.status !== "resolved");
r.ok(openBlocking.length === 0, `${openBlocking.length} blocking flag(s) still open: ${openBlocking.map((f) => f.id).join(", ")} — the site may publish as an editorial property, but not as a monetized one`);
const verified = products.filter((p) => p.link_state === "live");
if (cfg.affiliate.linksEnabled) r.ok(verified.length === products.length, "links are enabled but not every row is verified", `${verified.length}/${products.length}`);
for (const p of products.filter((x) => x.link_state === "live")) {
  const t = new RegExp(`${p.id}`);
  r.ok(!!p.field_provenance && Object.keys(p.field_provenance).length > 0, "a live row has no field provenance — where did each value come from?", p.id);
}
if (!existsSync(join(ROOT, "docs", "index.html"))) r.fail("docs/index.html missing: Pages has nothing to serve");
else {
  const html = readFileSync(join(ROOT, "docs", "index.html"), "utf8");
  r.ok(html.includes(cfg.affiliate.statement), "the front page must carry the required Associate statement");
}
const gh = spawnSync("git", ["status", "--porcelain", "docs"], { cwd: ROOT, encoding: "utf8" });
if (gh.stdout && gh.stdout.trim()) r.warn(false, "docs/ differs from the last commit — the published site is not what this build produced; commit the regenerated docs/");

console.log(`
Decision
────────
  publish as an editorial publication   ${openBlocking.length ? "yes — with the shelf visibly locked" : "yes"}
  publish with monetized links          ${cfg.affiliate.linksEnabled && verified.length === products.length ? "yes" : "NO — held by the gate"}
  what would change that                ${openBlocking.length ? `clear ${openBlocking.map((f) => f.id).join(" + ")}` : "nothing on the data side"}
  how                                   ${"answer Q-01 and Q-02 in the decision brief, run npm run collect, then re-run this"}
`);
console.log("  There is no --force flag for the link gate, on purpose: it is the thing standing between");
console.log("  a plausible-looking URL and a customer hitting a 404.");
process.exit(r.print() ? 0 : 1);
