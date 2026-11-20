# Architecture — how this site is built, and where the human has to be

The brief asked for an autonomous platform: research products, spot trends, analyse price and
reviews, generate articles, publish and manage links, track clicks and conversions, optimise
continuously. That is a sensible system design. It is also a system with two steps that must not
be delegated, and the whole architecture is arranged around keeping those two steps human while
automating everything around them.

```
        ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐   ┌───────────┐
  ───▶  │ 1. research │──▶│ 2. verify   │──▶│ 3. draft    │──▶│ 4. gate      │──▶│ 5. publish│
        │  intake     │   │  register   │   │  generator  │   │  blockers    │   │  docs/    │
        └─────────────┘   └──────┬──────┘   └─────────────┘   └──────────────┘   └─────┬─────┘
              ▲                   │ ▲                                    ▲              │
              │            HUMAN CHECK 1                                  │              ▼
              │            "is this the product I meant?"                 │        ┌───────────┐
              │                                                           │        │ 6. measure│
        ┌─────┴──────┐                                                    │        └─────┬─────┘
        │ data/inbox │  collect.mjs                                       │              │
        │ data/export│  next-topics.mjs                          HUMAN CHECK 2           ▼
        └────────────┘                                                    │        ┌───────────┐
                                                                          ▼        │ 7. decide │
                                                                  compliance-gate  │  ledger   │
                                                                                     └───────────┘
```

## Stage by stage

| # | Stage | Automated by | Human checkpoint | Why the checkpoint cannot be automated |
| --- | --- | --- | --- | --- |
| 1 | Intake / research | `tools/collect.mjs` normalises listing JSON from `data/inbox/`, field by field, with provenance | confirm the listing is the product you meant | A ten-character identifier is checkable; a *guessed* one is a plausible error that every downstream step will trust |
| 2 | Verification register | `data/sources.json` + `tools/validate-data.mjs` (host allow-list, dated quotes, read level, blank-vs-declared consistency) | read the clause yourself when it is legal language | The site's claims are only as good as the document behind them; a summary of a summary is not a source |
| 3 | Drafting | `site/build.mjs` renders guides from `data/` so structure, dates, links, feeds and schema cannot drift | approve each factual claim | This is exactly where generated text becomes a liability: it can state a false thing fluently |
| 4 | Gate | `tools/compliance-gate.mjs` + `tools/validate-links.mjs`, both fail the build | nothing — it runs unattended, which is the point | Disclosure placement, tagging, rel attributes and claim bans are mechanical and checkable |
| 5 | Publish | build into `docs/`, Pages serves `main:/docs` | merge the pull request | The only step with an audience |
| 6 | Measure | `tools/analytics-server.mjs` (five events), Associates Central reports for anything money-related | choose the host (Q-09) | A static host cannot run a counter, and the credentials must stay server-side |
| 7 | Decide | `tools/next-topics.mjs` ranks candidates from a real export; derived metrics print a dash until every input is measured | pick the path on `/suggestions/` | Choosing what to write next from noise is how a small site self-harms |

## Deliberate design choices

**Static, committed build output.** Pages publishing from `main:/docs` with the generated HTML in
the repository means the deployed artefact is reviewable in the diff, there is no build service to
break, and a failed check cannot ship. ([GitHub's own docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
describe both the branch-and-folder and the workflow options; the first was chosen.)

**Zero runtime dependencies.** A marketing site whose build needs 400 packages is a maintenance
liability and a supply-chain surface. Everything here is Node standard library.

**One data path.** `data/*.json` is the only place facts live; pages are rendered from it. That is
what lets the collector write, the validator police, and the dashboard display the same state
without three copies disagreeing.

**Templates that cannot omit the disclosure.** The strip is emitted by `layout()` — a new page type
gets it for free, and the gate asserts both presence *and* order relative to the first product
link, because “clear and conspicuous” is a placement question
([FTC](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)).

**Relative URLs everywhere.** The same `docs/` output works from a sub-path or a domain root, so
moving hosts is a `baseUrl` change rather than a rewrite.

**Aggregate-only measurement.** Day keys, page paths, product ids, slot names. No cookie, no
fingerprint, no per-user Associates sub-tag — the last of which is prohibited by Amazon's Program
Policies, so the design makes the violation impossible rather than discouraged.

## Where it scales

Adding a product should cost: paste a listing JSON → `npm run collect` → review the diff →
build. Adding a guide should cost: one `.mjs` file in `site/content/guides/` with a `meta` block →
`npm run build`; the sitemap, feed, search index, breadcrumbs, section counts, seasonal clusters
and “read next” rails all update themselves, and the gate checks the new page against every rule
above on the same run.
