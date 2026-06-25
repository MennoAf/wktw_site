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

**Severity scale:** `high` (undermines trust in the report) · `medium` (costs reviewer time) · `low` (polish).

---

## MUTTR-01 — Duplicate tickets within a cluster

**Severity:** high · **Category:** Output dedup
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** ~60 tickets collapse to ~25 distinct work items. The same fix is emitted 3–10×:
- Self-host Google Fonts: 5 tickets (`fonts-google-fonts-privacy-performance`, `resource-3-…`, `resource-loading-font-subsetting-opportunity`, `gdpr-google-fonts-ip-transfer-third-country`, `gdpr-google-fonts-pre-consent-ip-transmission`).
- Immutable cache headers: 3 tickets (`cache-control-…`, `st-6-…`, `server-transport-no-cdn-cache-headers`).
- Remove standalone gtag.js / consolidate analytics: ~10 tickets.
- 48px touch targets: 5 tickets.

**Why it matters:** A reviewer can't tell whether 60 tickets means 60 problems. Duplicates inflate the headline count and risk the same fix being done three times.

**Fix:** Deduplicate within `root_cause_cluster` before emitting. Emit **one** ticket per distinct fix with an `also_satisfies: [finding_id, …]` list, or nest sub-findings under the cluster ticket.

### Verify (Muttr to complete)
- [ ] Re-run produces ≤1 ticket per distinct remediation action
- [ ] Folded finding IDs are listed on the surviving ticket, not dropped
- [ ] Headline finding count reflects distinct problems, not raw detections

---

## MUTTR-02 — Empty / malformed ticket emitted

**Severity:** high · **Category:** Output validation
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** `tickets/unknown_untitled.md` ships with `finding_id: ""`, `title: "Untitled Finding"`, `severity: unknown`, empty Fix, empty Code, and `[None]` in the index. It is a null record that reached the deliverable.

**Why it matters:** An empty ticket in a paid/public deliverable reads as a pipeline failure. It also corrupts the count (it's one of the "80 findings").

**Fix:** Validate every ticket before write — drop or quarantine any finding missing `finding_id`, `title`, or `fix_summary`. Never emit `Untitled Finding`.

### Verify (Muttr to complete)
- [ ] A finding with empty `finding_id`/`title`/`fix` is rejected at write time
- [ ] No `unknown_untitled` / `Untitled Finding` artifact in the tickets folder
- [ ] Finding count excludes quarantined records

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
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** The `Confirmed (69)` tier contains items whose own slugs say otherwise: `a11y-6-prefers-reduced-motion-unverified`, `ux-sitemap-unverifiable`, `mobile-text-readability-unverified`, `escalation-og-twitter-meta-unverifiable`. "Confirmed" is defined as "directly measured or observed," which these were not.

**Why it matters:** The tier is the reader's trust signal. If "Confirmed" includes "unverifiable," the tier means nothing and every finding needs independent re-checking.

**Fix:** Add a distinct `unverified` / `needs-verification` tier. A finding may not be labeled `confirmed` unless backed by a concrete measurement or observed selector.

### Verify (Muttr to complete)
- [ ] An `unverified` tier exists and is populated
- [ ] No `…-unverified`/`…-unverifiable` finding sits under `confirmed`
- [ ] Tier assignment is driven by presence of measured evidence

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
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** Passing results are emitted as tickets proposing CI guardrails: `inp-excellent-no-issues`, `visual-stability-cls-excellent`, `server-transport-ttfb-excellent`, `api-…-waterfall-minimal`, `a11y-lang-attribute-correct`, `backwards-compat-astro-modern-css`. Each says "no remediation required" then proposes building lint/CI infrastructure.

**Why it matters:** ~7 of the "80 findings" are non-findings. It dilutes the real issues and pads the count.

**Fix:** Route passing checks to a separate "Healthy / optional hardening" list, kept out of the findings count and the tickets folder. Guardrail suggestions are opt-in, not findings.

### Verify (Muttr to complete)
- [ ] Passing checks appear in a separate section, not as tickets
- [ ] Findings count excludes passing checks
- [ ] Guardrail/CI proposals are clearly optional, not "remediation required"

---

## MUTTR-09 — Verification tests target broken / placeholder URLs

**Severity:** high · **Category:** Verification grounding
**Status:** ☐ Open ☐ Fixed ☐ Verified

**Observed:** Of 1,221 tests in `verification/tests.json`, roughly half cannot run as authored:
- **645 tests** have an **empty `target_url`**.
- Many target placeholder or nonexistent URLs: `https://example.com/contact`, `https://yourdomain.com`, `${AUDIT_BASE_URL}`, `https://your-site.netlify.app`, `/blog/*`, `/services/ecommerce-audit`, `/services/[service-slug]`, `/articles/audits-change-nothing`. The site has no `/blog`, `/services`, or `/articles` routes — they are `/insights` and `/the-get-right` here (same wrong-stack root as MUTTR-03/05).
- One target has a **typo'd domain**: `https://weknowthewify.com/proof/our-site` ("wify", not "why").
- Inconsistent trailing slashes for the same page (`/about`, `/about/`, `https://weknowthewhy.com/about`, `.../about/`) fragment results.
- 54 `visual_regression` tests have `baseline_screenshot_ref: null` — no baseline exists, so none can run.

**Why it matters:** A verification suite where ~half the tests point at empty or fictional URLs can't gate a launch. It also can't be trusted to "pass" — green may just mean "skipped, no target."

**Fix:** Resolve every test's `target_url` to a real, crawled URL on the audited origin before emit; drop or quarantine tests whose target can't be resolved. Normalize trailing slashes to the site's canonical form. Never emit a test against `example.com` / `yourdomain.com` / a templated slug. Generate visual-regression baselines (or omit the test) rather than shipping null-baseline tests.

### Verify (Muttr to complete)
- [ ] No test ships with an empty or placeholder `target_url`
- [ ] All targets resolve to real URLs on the audited origin (no `example.com`, `/blog/*`, typo'd domains)
- [ ] Trailing-slash form is normalized to the site's canonical
- [ ] `visual_regression` tests either carry a real baseline or are not emitted

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

**Theme:** The ticket *structure* is strong (impact, risks, verification rigor). The gaps are
all **grounding** — the tool reasons from generic templates and prior detections instead of
re-checking the specific target's stack, source, and measurements before it writes.

## Progress log
- 2026-06-25 — Filed 8 defects from the first triage pass of the Get Right audit.
- 2026-06-25 — Added MUTTR-09 after dissecting `verification/tests.json` (broken/placeholder test targets).
- 2026-06-25 — Added MUTTR-10 (ticket altitude) after working several tickets end-to-end. Note: verbosity is load-bearing for no-repo / locked-down-CMS clients — the fix is an additive executor card, not cutting detail.
