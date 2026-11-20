# Architecture — Counter Space, and where the human has to be

The brief asked for an autonomous platform: research products, spot trends, analyse price and
reviews, generate articles, publish and manage links, track clicks and conversions, optimise
continuously. That is a sound system design. It is also a design with two steps that must not be
delegated to a model, and this repository is arranged so that everything around those two steps is
automated *and* the two steps are impossible to skip quietly.

```
      ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  ┌───────────┐
  ──▶ │ 1 intake │─▶│ 2 verify │─▶│ 3 render │─▶│ 4 three gates     │─▶│ 5 publish │──▶ live
      │ inbox    │  │ register   │ │ _src/    │   │ build + check-site│  │ main →    │
      └──────────┘  └─────┬──────┘ │ build.mjs│   │ + compliance-gate │  │ Pages     │
            ▲             │ ▲      └──────────┘   └─────────┬─────────┘  └─────┬─────┘
            │       HUMAN CHECK 1                           │ cannot be        │
      ┌─────┴──────┐  "is this the listing                  ▼ forced open       ▼
      │ data/inbox │  I meant?"              ┌──────────────────────┐   ┌──────────────┐
      │ data/export│                         │ VALIDATION.md + exit │   │ 6 measure    │
      └────────────┘                         │ codes, CI on every   │   │ collector /  │
            ▲                                │ push and every PR    │   │ GSC export   │
            │ HUMAN CHECK 2                  └──────────────────────┘   └──────┬───────┘
       owner reads the policy page                                    ┌─────────▼────────┐
       before a claim is quoted                                       │ 7 decide: ledger │
                                                                      │ + FLG rows, path │
                                                                      └────────────────────┘
```

## Stage by stage

| # | Stage | Automated by | Human checkpoint | Why the checkpoint stays human |
| --- | --- | --- | --- | --- |
| 1 | Intake | `scripts/collect.mjs` — folds `data/inbox/*.json` into `data/products.json` + `data/links.json`, field by field, each value stamped with a source id and a date; refuses prices/ratings | confirm the listing is the product you meant | A 10-character ASIN is checkable; a *plausible* one is not, and every downstream step trusts it |
| 2 | Verification register | `data/policy.json` (6 sources, 10 policy rows), `data/products.json` (60 spec rows: 32 verified, 4 claims, 14 unverified, 10 withheld — printed as blank with the reason) | read the clause yourself before a legal sign-off | The site is only as strong as the document behind each row; a summary of a summary is not a source |
| 3 | Render | `_src/build.mjs` regenerates every page plus `sitemap.xml`, `feed.xml`, `robots.txt`, `VALIDATION.md` from `data/`; nothing is hand-written HTML. Page count is a run fact and is printed by the build, not restated here | approve the wording | Generated text states false things fluently; structure is automatable, judgement is not |
| 4 | Gate | three independent checkers (see below) — each prints its own assertion count for the tree in front of you, so no total is restated here | nothing — it runs unattended, which is the point | Disclosure placement, tagging, claim bans, cross-references and schema bans are mechanical and checkable |
| 5 | Publish | GitHub Pages from the branch root (`pages.yml`); `build.yml` refuses an uncommitted or non-reproducible build | merge the PR | The only step with an audience |
| 6 | Measure | `_worker/collector.js` (Workers) or `scripts/analytics-server.mjs` (self-host, same contract); five events; 30-day raw retention | deploy it, or set the endpoint to empty and let the build hold the client inert | A static host cannot run a counter; credentials must stay server-side |
| 7 | Decide | `scripts/next-topics.mjs` ranks candidates from a real Search Console export and refuses to rank without one; the ledger accepts a row only with dated provenance | choose the path on `/suggestions/` | Choosing what to write next from noise is how a small site self-harms |

## The three gates, and why there are three

| Gate | Written by | What it is for | Typical finding |
| --- | --- | --- | --- |
| `_src/build.mjs` (the checks listed in `VALIDATION.md`, inline) | session `ffa85037` | the publication's own invariants: disclosure, verbatim statement, tracking tag on every product link, no ratings/prices, no valued-but-unverified row, internal links, sitemap parity, no resurrected prior build, archive integrity | "prior build resurrected at the root" |
| `scripts/check-site.mjs` (13 checks) | session `41096d21`, written **without reading the builder** | markup and SEO truth: canonicals, per-page meta, heading order, alt text, third-party asset hosts, JSON-LD parse, every internal href resolving to a file, sitemap in both directions, RSS validity | found the `link.amazon` anchors bypassing the sponsored-classification regex on the live site |
| `scripts/compliance-gate.mjs` | this session | the money-and-trust half: disclosure *ordering* against the first sponsored link; three-state classification of every Amazon href including short links; **a citation must cite the source its row names**; cross-file referential integrity (spec `source` ∈ `policy.sources`, flag refs ∈ `governance.flagged`, tests traceable); claim bans with documentary and quote context; commercial schema bans; the analytics pair agreeing; canonical = origin + path with no doubled base | 5 dangling `SRC-02` references in `data/special_link_tests.json` |

Three implementations of overlapping rules is not an accident and not duplication: an independent
checker is what finds the hole the first one was blind to. Each gate has caught something the
others did not, on this repository, in production.

## Deliberate design choices

**Static, committed output.** Pages serves what is in the tree, so the deployed artefact is
reviewable in the PR diff and a failing check cannot ship. CI's reproducibility step
(`git status --porcelain` empty after a rebuild) makes "generated" mean something.

**One data path.** `data/*.json` is the only place facts live. `scripts/` and `_src/` read the same
files, so a check cannot pass on a different reality than the one published.

**Zero runtime dependencies.** No build service, no lockfile drift, no supply chain to audit for a
site whose entire product is trust. Node ≥ 20 standard library only.

**Relative asset paths + a declared base.** The site lives at `/WinA` today; `site.origin` and
`site.baseurl` are both in the data so a move to a real domain is a data edit. The trap — `origin`
already contains the base path — is asserted against, because a doubled segment in a canonical is
invisible until it costs you.

**Aggregate-only measurement.** Day, event, path, ASIN, viewport class, with a key allow-list and
scrubbing on arrival, so no field can be widened by a future client by accident. Amazon's Program
Policies prohibit associating a sub-tag with a specific end user; this design cannot do it even
deliberately, which is worth more than a promise.

**A register that must speak.** Where the site ships a state that is not ideal — links live before
the per-product test — the gate allows it only while an open flag says so out loud. Silently
resolving the flag fails the build. A register that can be quietly closed is decoration.

## Where it scales

* **New product:** open the listing → `data/inbox/<slug>.json` → `node scripts/collect.mjs`
  (plan) → `--write` → build. A value with no defined source never reaches a page.
* **New guide:** add rows to `data/questions.json` / `data/suggestions.json` and a section in
  `_src/pages-content.mjs`; the sitemap, feed, nav, register counts and the summary page update
  themselves, and all three gates judge the new page on the same run.
* **New policy claim:** it needs a row in `data/policy.json` with an `accessed` date first;
  `node scripts/compliance-gate.mjs --refresh-sources` re-reads each cited page, diffs the quoted
  text and warns past 90 days, so a clause that changed upstream becomes a build signal instead of
  a slow lie.
* **Real domain:** change `site.origin` + `site.baseurl`, set Pages' custom domain, rebuild. Nothing
  else in the tree hardcodes a host.
