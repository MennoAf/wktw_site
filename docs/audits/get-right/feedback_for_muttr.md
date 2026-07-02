# Feedback for Muttr — Audit Tooling Defects

**Re:** `Muttr-we-know-the-why-20260624-0dc08e79`
**Filed:** 2026-06-25
**Filed by:** WKTW (subject of the audit, reviewing its own tooling)

> This is part of the public record. We run Muttr on our own site, find where the tool's
> output falls short, and fix it in the open — the same standard we hold client work to.
> Each item below is a defect in the **audit tool**, not the site. They are written in the
> same shape as Muttr's own tickets (lighter), and each carries a **Verify** section the
> Muttr agent completes when the fix ships. Evidence is grounded in the actual repo
> (`weknowthewhy.com`, Astro static + Tailwind v4 + Svelte).

**Severity scale:** `high` (undermines trust in the report) · `medium` (costs reviewer time) · `low` (polish) · `enhancement` (new capability, not a defect).

> **Why grounding matters — and when it's critical.** With repo access (as on this site) these
> defects are *friction*: we catch wrong-stack code, stale findings, and mismeasurements by checking
> source before acting. Without repo access — a locked-down CMS (e.g. a large Sitecore install) where
> neither the auditor (no pre-submission access) nor the client's team can grep — the same defects
> become *critical*, because the ticket is the only spec and nobody can verify it. Errors are errors
> either way; but the grounding-class defects (MUTTR-03/04/05/07) scale from annoying to load-bearing
> exactly as repo access disappears. That asymmetry motivates MUTTR-11.

---

## MUTTR-01 — Duplicate tickets within a cluster

**Severity:** high · **Category:** Output dedup
**Status:** ☐ Open ☑ Fixed ☑ Verified — **Muttr: 2026-07-01**

**Observed:** ~60 tickets collapse to ~25 distinct work items. The same fix is emitted 3–10×:
- Self-host Google Fonts: 5 tickets (`fonts-google-fonts-privacy-performance`, `resource-3-…`, `resource-loading-font-subsetting-opportunity`, `gdpr-google-fonts-ip-transfer-third-country`, `gdpr-google-fonts-pre-consent-ip-transmission`).
- Immutable cache headers: 3 tickets (`cache-control-…`, `st-6-…`, `server-transport-no-cdn-cache-headers`).
- Remove standalone gtag.js / consolidate analytics: ~10 tickets.
- 48px touch targets: 5 tickets.

**Why it matters:** A reviewer can't tell whether 60 tickets means 60 problems. Duplicates inflate the headline count and risk the same fix being done three times.

**Fix:** Deduplicate within `root_cause_cluster` before emitting. Emit **one** ticket per distinct fix with an `also_satisfies: [finding_id, …]` list, or nest sub-findings under the cluster ticket.

### Verify (Muttr to complete)
- [x] Re-run produces ≤1 ticket per distinct remediation action
- [x] Folded finding IDs are listed on the surviving ticket, not dropped
- [x] Headline finding count reflects distinct problems, not raw detections

> **Muttr (2026-07-01):** `group_ticket_duplicates` folds same-remediation
> tickets before write. The doc's prescribed "dedupe within `root_cause_cluster`"
> was measured WRONG on this audit's real 81 proposals: cluster is a root-cause
> axis, so it collapsed 11 distinct a11y fixes into one; and lexical fix-text
> similarity folds 0/10 font pairs (the remediations are phrased too
> differently). Remediation identity is the right axis and only an LLM sees it —
> so a single cheap Haiku pass (~$0.009/audit, `force_paid` like Layer-2 dedup)
> groups proposals by shared fix. Result on this workspace: **76 → 36 distinct
> tickets**, all 5 self-host-Google-Fonts (incl. the two empty-cluster
> `gdpr-google-fonts-*`), the 3 cache-header and the touch-target families folded
> correctly, while distinct a11y fixes stayed separate. The surviving ticket
> carries an `also_satisfies` frontmatter list + an "Also resolves" section, so
> **no folded finding is dropped** (recoverable even on a loose merge); the
> tickets folder, `index.json`, and `tickets_generated` count reflect distinct
> problems, with a `folded_ticket_count` telemetry field. Non-destructive: if
> Haiku is unavailable the tickets emit unfolded. Caveat: 2-3 merges are a touch
> loose (e.g. breadcrumbs absorbing some schema items) — non-lossy, and the
> precision-first prompt keeps genuinely different fixes apart.

---

## MUTTR-02 — Empty / malformed ticket emitted

**Severity:** high · **Category:** Output validation
**Status:** ☐ Open ☑ Fixed ☑ Verified — **Muttr: 2026-06-26**

**Observed:** `tickets/unknown_untitled.md` ships with `finding_id: ""`, `title: "Untitled Finding"`, `severity: unknown`, empty Fix, empty Code, and `[None]` in the index. It is a null record that reached the deliverable.

**Why it matters:** An empty ticket in a paid/public deliverable reads as a pipeline failure. It also corrupts the count (it's one of the "80 findings").

**Fix:** Validate every ticket before write — drop or quarantine any finding missing `finding_id`, `title`, or `fix_summary`. Never emit `Untitled Finding`.

### Verify (Muttr to complete)
- [x] A finding with empty `finding_id`/`title`/`fix` is rejected at write time
- [x] No `unknown_untitled` / `Untitled Finding` artifact in the tickets folder
- [x] Finding count excludes quarantined records

> **Muttr (2026-06-26):** `validate_ticket_proposal()` gates every proposal at write time; invalid records are quarantined to `deliverables/tickets/_quarantined.json` (visible, not silent) and excluded from the index, README, and count.

---

## MUTTR-03 — Wrong tech-stack assumed in fix code

**Severity:** high · **Category:** Stack detection
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** ~26 tickets contain generic-CMS code — Liquid (`{% if %}`, `page.form_html`), WordPress/Shopify ("child theme `style.css`", "Customizer", "Additional CSS panel", `.php`/`.liquid` templates). The site is **Astro static + Tailwind v4 + Svelte**. None of the code examples are drop-in; every one must be hand-ported.

**Why it matters:** "Actionable ticket" implies the code can be applied. When the template language is wrong, the executor rewrites everything, and the ticket's authority (precise selectors, exact snippets) becomes misleading.

**Fix:** Detect the framework (package.json / config / file extensions) up front and template the Code section to it. For Astro: components/layouts, scoped styles or Tailwind, `astro.config`, `public/` — not child themes or Liquid.

### Verify (Muttr to complete)
- [ ] Stack is detected and recorded in the run (e.g. "Astro/Tailwind/Svelte")
- [ ] Code examples use the detected stack's idioms, not generic CMS
- [ ] No `{% … %}` / "child theme" / "Customizer" language in an Astro run

---

## MUTTR-04 — Findings auditing the wrong layer (code vs. tag-manager vs. deployed)

**Severity:** high · **Category:** Finding provenance
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** ~10 tickets are built on a **standalone `gtag.js`** in the page source ("remove the standalone gtag.js script tag from the global header"). The repo has **no** standalone gtag — only a Consent Mode v2 `gtag('consent', …)` helper, one GTM container, and Plausible. If a second GA4 beacon exists, it's configured **inside the GTM container** (Google's console), which the audit conflates with page source.

**Why it matters:** An executor told to "remove the standalone script" finds nothing to remove and loses confidence in the whole report. Code fixes and tag-manager-config fixes are different surfaces and different owners.

**Fix:** Tag each finding with its `remediation_surface` (`source_code` | `tag_manager` | `cdn_config` | `runtime_only`). Verify source-code claims against the actual repo before asserting a specific script exists.

### Verify (Muttr to complete)
- [ ] Every finding carries a `remediation_surface`
- [ ] "Remove `<script>` X" claims are grep-verified against source before emission
- [ ] Tag-manager-config findings are not phrased as code edits

---

## MUTTR-05 — Mismeasured / hallucinated artifacts

**Severity:** high · **Category:** Measurement grounding
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** `resource-loading-js-unused-absolute-bytes-static-page` and `js-unused-bytes-low-but-present` assert a **2.56MB application bundle with ~475KB unused JS**, citing "cart, product configurators, checkout, filter/sort systems." This static Astro site has **no e-commerce** and ships **one 28KB Svelte chunk** total (`dist/_astro/client.svelte.*.js`). The numbers and the named features are imported from a generic template, not measured here.

**Why it matters:** A fabricated 2.5MB bundle and invented "checkout" features are the kind of error that discredits an otherwise solid audit at a glance.

**Fix:** Ground every payload/byte claim in the run's own measured transfer. Never inherit feature assumptions (cart/checkout) from a template the target doesn't exhibit. If a metric can't be measured, mark it `unmeasured`, don't synthesize one.

### Verify (Muttr to complete)
- [ ] Byte/payload figures trace to measured network transfer for this run
- [ ] No references to features absent from the target (cart, checkout, configurators)
- [ ] Unmeasurable metrics are labeled, not invented

---

## MUTTR-06 — "Confirmed" tier includes unverified findings

**Severity:** medium · **Category:** Confidence labeling
**Status:** ☐ Open ☑ Fixed ☑ Verified — **Muttr: 2026-06-26**

**Observed:** The `Confirmed (69)` tier contains items whose own slugs say otherwise: `a11y-6-prefers-reduced-motion-unverified`, `ux-sitemap-unverifiable`, `mobile-text-readability-unverified`, `escalation-og-twitter-meta-unverifiable`. "Confirmed" is defined as "directly measured or observed," which these were not.

**Why it matters:** The tier is the reader's trust signal. If "Confirmed" includes "unverifiable," the tier means nothing and every finding needs independent re-checking.

**Fix:** Add a distinct `unverified` / `needs-verification` tier. A finding may not be labeled `confirmed` unless backed by a concrete measurement or observed selector.

### Verify (Muttr to complete)
- [x] An `unverified` tier exists and is populated
- [x] No `…-unverified`/`…-unverifiable` finding sits under `confirmed`
- [x] Tier assignment is driven by presence of measured evidence

> **Muttr (2026-06-26):** `classify_confidence_tier` is now evidence-gated — `inferred`/no-evidence → new **Needs Verification** tier, `measured`/`observed` → confirmed (`coverage_review` origin preserved). Re-checked on this audit's 80 findings: 56 confirmed / 12 unverified / 12 reviewer-identified; every `*-unverifiable` finding (all `evidence_type: inferred`) left the Confirmed tier.

---

## MUTTR-07 — Stale findings reported as open

**Severity:** medium · **Category:** Current-state re-check
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** Several findings flag things already remediated in the current build:
- `ux-sitemap-unverifiable` — `@astrojs/sitemap` is already installed (`astro.config.mjs`).
- `escalation-2/-og-twitter-meta-*` — full OG + Twitter Card tags already present (`BaseLayout.astro`).
- `ux-mobile-hamburger-discoverability` (aria part) — button already has `aria-label` + `aria-expanded`.
- `privacy-cookies-…-dark-pattern` — privacy link already in banner body; Accept/Decline already use primary/ghost hierarchy.

**Why it matters:** Telling a client to "install a sitemap" they already have, or "add an aria-label" already present, erodes credibility and wastes the fix budget.

**Fix:** Re-check current page source/state for each finding immediately before emission; suppress or downgrade to "already addressed — verify" when the remediation is present.

### Verify (Muttr to complete)
- [ ] Each finding is re-validated against current source before emission
- [ ] Already-remediated items are suppressed or clearly marked "verify — appears resolved"
- [ ] Spot-check: sitemap, OG/Twitter, hamburger aria, consent banner no longer flagged as missing

---

## MUTTR-08 — Passing checks framed as findings

**Severity:** low · **Category:** Signal-to-noise
**Status:** ☐ Open ☑ Fixed ☐ Verified (partial recall) — **Muttr: 2026-06-26**

**Observed:** Passing results are emitted as tickets proposing CI guardrails: `inp-excellent-no-issues`, `visual-stability-cls-excellent`, `server-transport-ttfb-excellent`, `api-…-waterfall-minimal`, `a11y-lang-attribute-correct`, `backwards-compat-astro-modern-css`. Each says "no remediation required" then proposes building lint/CI infrastructure.

**Why it matters:** ~7 of the "80 findings" are non-findings. It dilutes the real issues and pads the count.

**Fix:** Route passing checks to a separate "Healthy / optional hardening" list, kept out of the findings count and the tickets folder. Guardrail suggestions are opt-in, not findings.

### Verify (Muttr to complete)
- [x] Passing checks appear in a separate section, not as tickets
- [~] Findings count excludes passing checks _(partial — see note)_
- [x] Guardrail/CI proposals are clearly optional, not "remediation required"

> **Muttr (2026-06-26):** New `Finding.remediation_required` flag + `is_healthy_check()` route passing checks to `deliverables/healthy-checks.md`, out of the tickets folder and count. On this audit, 4 of ~6 passing checks are caught by a high-precision heuristic (an explicit "no remediation required" opening), with **zero false positives** (verified against the real findings — a genuine fix whose `how` contained a conditional "if present, no action required" clause is correctly retained). The remaining ~2 (proposals phrased "Codify/Document the baseline…") need the emitter to set `remediation_required=false` — a one-line prompt change deferred to the prompt-tuning pass. The structured flag + router are already in place to receive it.

---

## MUTTR-09 — Verification tests target broken / placeholder URLs

**Severity:** high · **Category:** Verification grounding
**Status:** ☐ Open ☑ Fixed ☑ Verified — **Muttr: 2026-06-26**

**Observed:** Of 1,221 tests in `verification/tests.json`, roughly half cannot run as authored:
- **645 tests** have an **empty `target_url`**.
- Many target placeholder or nonexistent URLs: `https://example.com/contact`, `https://yourdomain.com`, `${AUDIT_BASE_URL}`, `https://your-site.netlify.app`, `/blog/*`, `/services/ecommerce-audit`, `/services/[service-slug]`, `/articles/audits-change-nothing`. The site has no `/blog`, `/services`, or `/articles` routes — they are `/insights` and `/the-get-right` here (same wrong-stack root as MUTTR-03/05).
- One target has a **typo'd domain**: `https://weknowthewify.com/proof/our-site` ("wify", not "why").
- Inconsistent trailing slashes for the same page (`/about`, `/about/`, `https://weknowthewhy.com/about`, `.../about/`) fragment results.
- 54 `visual_regression` tests have `baseline_screenshot_ref: null` — no baseline exists, so none can run.

**Why it matters:** A verification suite where ~half the tests point at empty or fictional URLs can't gate a launch. It also can't be trusted to "pass" — green may just mean "skipped, no target."

**Fix:** Resolve every test's `target_url` to a real, crawled URL on the audited origin before emit; drop or quarantine tests whose target can't be resolved. Normalize trailing slashes to the site's canonical form. Never emit a test against `example.com` / `yourdomain.com` / a templated slug. Generate visual-regression baselines (or omit the test) rather than shipping null-baseline tests.

### Verify (Muttr to complete)
- [x] No test ships with an empty or placeholder `target_url`
- [x] All targets resolve to real URLs on the audited origin (no `example.com`, `/blog/*`, typo'd domains)
- [x] Trailing-slash form is normalized to the site's canonical
- [x] `visual_regression` tests either carry a real baseline or are not emitted

> **Muttr (2026-06-26):** `_resolve_and_filter_tests()` runs before `tests.json` is written: every `target_url` is resolved against the set of real audited URLs (crawled pages ∪ findings' affected pages, trailing-slash-canonicalized); origin-level tests fall back to the crawled homepage, page-specific tests with no resolvable page are dropped (not misrouted), and baseline-less `visual_regression` tests are dropped. Dropped tests are recorded in `verification/_dropped_tests.json`. Re-run on this audit: **1221 → 721 kept / 500 dropped** (446 unresolvable + 54 null-baseline); every surviving target is a real on-origin URL with no placeholder and no trailing slash.

---

## MUTTR-10 — Single-altitude tickets: add an executor layer without losing the reviewer essay

**Severity:** medium · **Category:** Ticket format / progressive disclosure
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** Every ticket is written at one altitude — a long, reviewer-facing essay (Impact,
Risks, multi-step "How", code samples; often ~200 lines). Two consequences when *doing the work*:
- The real fix is frequently one line (remove the URL field, rename a button), so an executor
  skims a lot of prose to find a small ask. The prose-to-change ratio is large.
- Ticket boundaries follow the **detector's** taxonomy (per-finding, per-selector, per-page), not
  the **fixer's** unit of work. So one fix is fragmented across many tickets (48px touch targets →
  5 tickets), while one ticket is really a whole project (`ux-content-sparse-above-fold`: "rebuild
  the contact page with a four-component persuasion scaffold"). Neither maps to a commit.

**Why it matters — and the constraint that shapes the fix:** The verbosity is **load-bearing in the
common case**, and must not simply be cut. Many clients run locked-down stacks (e.g. a large
Sitecore install) where the auditor has **no repo access before submission**, and the client's own
team may not be able to ground in source either, given their layers of abstraction. There, the
essay *is* the spec — there is nothing else to verify against. The problem is not "too much detail";
it is "**only one altitude**." A repo-access executor (like WKTW on its own site) wants a terse
card; a no-repo reviewer needs the full narrative. Today only the second is served.

**Fix — progressive disclosure, additive not subtractive:**
1. **Add a terse fix-card** at the top of each ticket: the ask in 1–2 sentences, the remediation
   surface (`source` / `tag-manager` / `cdn-config`), and a concrete done-condition — with the full
   essay retained directly below it. The card serves executors; the essay serves no-repo reviewers.
2. **Keep the reviewer essay first-class.** Do not strip detail to make the card — the locked-down /
   no-repo client depends on it. Collapse or anchor it, don't delete it.
3. **Group by the fixer's unit of work.** Fold fragmented detections into one ticket with sub-items
   (one "48px touch targets" ticket listing the 5 elements), and split project-scale tickets out,
   labelling them as design/effort rather than a single fix.

### Verify (Muttr to complete)
- [ ] Each ticket leads with a terse fix-card (ask + surface + done-condition)
- [ ] The full reviewer narrative is retained, not removed (no-repo clients still covered)
- [ ] Fragmented detections are grouped into one ticket per unit-of-work with sub-items
- [ ] Project-scale tickets are labelled as design/effort, not as a single fix

---

## MUTTR-11 — Ship an optional "Repo-Grounding Guide" output (enhancement)

**Severity:** enhancement · **Category:** New deliverable / verification method
**Status:** ☐ Open ☑ Designing ☐ Shipped — **WKTW seed pack authored:** [`docs/grounding-packs/astro.md`](../../grounding-packs/astro.md) (+ [README](../../grounding-packs/README.md)).

**The idea:** When a client *does* have repo access, the single highest-value step is grounding each
finding against source before acting — the step that caught, on this audit alone: a phantom standalone
`gtag.js` (~10 tickets pointed at code that doesn't exist), a fabricated 2.5MB JS bundle, an
already-installed sitemap flagged as missing, and a 1:1 contrast "failure" that was a detector
artifact. Today that step is **tacit** — the executor has to invent the greps. Muttr should ship it as
an explicit, **platform-aware "Repo-Grounding Guide"**: an optional output that tells a repo-holding
team exactly how to verify the report against their own source, finding-type by finding-type.

**Why it's worth building:**
- Turns the audit from "leads" into "leads + a verification method" — a real differentiator.
- Costs the auditor nothing at scan time (it's instructions, not analysis) and degrades gracefully:
  emit it only when repo access is declared; locked-down clients simply don't get it.
- It's the natural home for the grounding discipline that several other defects (MUTTR-03/04/05/07)
  would otherwise rely on the reader to supply.

**Shape:** detect (or ask for) the stack, then emit a recipe that maps **finding category → grounding
command → decision rule** (real / stale / false / wrong-layer). Worked example from *this* engagement
(Astro + Tailwind + Svelte), which can serve as the template platform pack:

| Finding category | Grounding command (run in repo) | Decision rule |
| --- | --- | --- |
| Standalone gtag / dual analytics | `grep -rn "gtag/js\|gtag('config'" src/` | No hit → not in code; it's tag-manager-side (re-route, don't "remove a script") |
| Google Fonts / external CDN | `grep -rn "fonts.googleapis\|fonts.gstatic" src/` | Hit → real; confirm it's pre-consent in the `<head>` |
| Heading hierarchy skip | `grep -oE "<h[1-6]" <page> \| tr -d '<'` per template | Sequence shows h2→h4 → real; fix every template, not one URL |
| "X MB unused JS bundle" | `find dist -name '*.js' -exec du -h {} +` | Total ≪ claim → mismeasurement; close as false |
| Missing security / cache headers | `curl -sI <live-url> \| grep -i <header>` | Absent → real (config surface, not src/) |
| Sitemap / OG / meta "missing" | `grep -rn "sitemap\|og:\|twitter:" astro.config.* src/layouts/` | Present → stale; downgrade to "verify" |
| Contrast failure | compute WCAG ratio on the real token pair | fg==bg or passes AA → artifact; close no-op |

**WKTW offer:** we can author the first platform pack (Astro/Tailwind) from the exact commands used on
this engagement, as a reference contribution — and the structure generalizes to per-platform packs
(Sitecore, WordPress, Next.js, Shopify, etc.), each mapping the same finding categories to that
platform's grounding idioms.

### Verify (Muttr to complete)
- [ ] Audit can emit an optional Repo-Grounding Guide gated on declared repo access
- [ ] Guide is platform-aware (detected or selected stack), not generic
- [ ] Each finding category maps to a concrete grounding command + a real/stale/false/wrong-layer rule
- [ ] At least one reference platform pack exists (Astro/Tailwind is offered as the seed)

---

## Summary

| ID | Defect | Severity |
| --- | --- | --- |
| MUTTR-01 | Duplicate tickets within a cluster | high |
| MUTTR-02 | Empty/malformed ticket emitted | high |
| MUTTR-03 | Wrong tech-stack assumed in fix code | high |
| MUTTR-04 | Findings auditing the wrong layer | high |
| MUTTR-05 | Mismeasured / hallucinated artifacts | high |
| MUTTR-06 | "Confirmed" tier includes unverified | medium |
| MUTTR-07 | Stale findings reported as open | medium |
| MUTTR-08 | Passing checks framed as findings | low |
| MUTTR-09 | Verification tests target broken/placeholder URLs | high |
| MUTTR-10 | Single-altitude tickets — add executor card, keep reviewer essay | medium |
| MUTTR-11 | Ship an optional platform-aware Repo-Grounding Guide | enhancement |

**Theme:** The ticket *structure* is strong (impact, risks, verification rigor). The gaps are
all **grounding** — the tool reasons from generic templates and prior detections instead of
re-checking the specific target's stack, source, and measurements before it writes.

## Progress log
- 2026-06-25 — Filed 8 defects from the first triage pass of the Get Right audit.
- 2026-06-25 — Added MUTTR-09 after dissecting `verification/tests.json` (broken/placeholder test targets).
- 2026-06-25 — Added MUTTR-10 (ticket altitude) after working several tickets end-to-end. Note: verbosity is load-bearing for no-repo / locked-down-CMS clients — the fix is an additive executor card, not cutting detail.
- 2026-06-25 — Added top-of-doc framing note (repo-access asymmetry) + MUTTR-11 (enhancement): ship an optional platform-aware Repo-Grounding Guide; WKTW offers to author the Astro/Tailwind seed pack.
- 2026-06-25 — Authored the seed pack: `docs/grounding-packs/astro.md` (16 finding-category recipes) + `README.md` (method + decision rules + per-platform index). MUTTR-11 → Designing.
- 2026-06-26 — **Muttr** fixed the deterministic batch and signed the Verify sections: MUTTR-02 (✓ verified), MUTTR-06 (✓ verified), MUTTR-08 (fixed, partial recall — structured flag pending an emitter prompt line), MUTTR-09 (✓ verified). Re-checked on the real audit workspace, not just unit tests. Remaining: grounding batch MUTTR-03/04/05/07 + design MUTTR-10/11.
- 2026-07-01 — **Muttr** fixed MUTTR-01 (✓ verified) with a semantic ticket-fold. The doc's prescribed cluster-dedup was measured wrong on the real 81 proposals; the fix uses a cheap Haiku same-remediation grouping pass (76→36 distinct, all target dup-families folded, nothing dropped via `also_satisfies`). Remaining: grounding batch MUTTR-03/04/05/07 + design MUTTR-10/11 + the MUTTR-08 emitter one-liner.
