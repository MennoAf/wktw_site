# Grounding Packs

A **grounding pack** turns an audit report (e.g. Muttr) from a list of *leads* into *verified,
file-mapped work* — for teams that have repo access. Each pack maps a finding category to a concrete
**grounding command**, a rule for reading the output (**real / stale / false / wrong-layer /
additive**), and where the fix lives in that platform.

Why this exists: with repo access, the highest-value step is verifying each finding against source
*before* acting. It's what catches phantom findings (a "remove the standalone gtag.js" ticket when no
such script exists), mismeasurements (a "2.5MB JS bundle" on a static site that ships 28KB), and stale
findings (a "install a sitemap" that's already installed). See `MUTTR-11` in
`../audits/get-right/feedback_for_muttr.md` for the full rationale.

> Packs apply **only when you have repo access**. For locked-down stacks where the auditor and client
> can't read source, the audit's full ticket narrative is the spec — these packs don't apply.

## The method (every pack follows it)

For each finding: **locate** the remediation surface → **run** the grounding command → **classify**
with the decision rule → **map** to `file:line` → fix → **verify** (build clean, command re-run flips).

## Decision rules

| Verdict | Meaning | Action |
| --- | --- | --- |
| **real** | Premise reproduces in source | Fix; map to file:line |
| **stale** | Already remediated in current code | Downgrade to "verify & close" |
| **false** | Premise can't hold for this stack (mismeasurement / wrong-CMS) | Document why; close |
| **wrong-layer** | Real issue, but not in source (tag manager / CDN / host config) | Re-route to the right surface/owner |
| **additive** | Not a defect — a net-new enhancement | Rank by value; not a "fix" |

## Packs

| Platform | File | Status |
| --- | --- | --- |
| Astro (static) + Tailwind | [astro.md](./astro.md) | Reference pack (seed) |
| Sitecore / SXA | — | Wanted |
| WordPress (classic/block themes) | — | Wanted |
| Next.js | — | Wanted |
| Shopify (Liquid) | — | Wanted |

New packs reuse the same finding categories as `astro.md`; only the commands and fix locations change.
