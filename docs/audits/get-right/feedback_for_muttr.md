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
**Status:** ☐ Open ☑ Fixed (partial) ☐ Verified — **Muttr: 2026-07-01**

**Observed:** ~26 tickets contain generic-CMS code — Liquid (`{% if %}`, `page.form_html`), WordPress/Shopify ("child theme `style.css`", "Customizer", "Additional CSS panel", `.php`/`.liquid` templates). The site is **Astro static + Tailwind v4 + Svelte**. None of the code examples are drop-in; every one must be hand-ported.

**Why it matters:** "Actionable ticket" implies the code can be applied. When the template language is wrong, the executor rewrites everything, and the ticket's authority (precise selectors, exact snippets) becomes misleading.

**Fix:** Detect the framework (package.json / config / file extensions) up front and template the Code section to it. For Astro: components/layouts, scoped styles or Tailwind, `astro.config`, `public/` — not child themes or Liquid.

### Verify (Muttr to complete)
- [x] Stack is detected and recorded in the run (e.g. "Astro/Tailwind/Svelte")
- [~] Code examples use the detected stack's idioms, not generic CMS _(flagged, not rewritten — see note)_
- [~] No `{% … %}` / "child theme" / "Customizer" language in an Astro run _(flagged with an advisory; generation-side rewrite is the follow-up)_

> **Muttr (2026-07-01):** Stack detection already existed (`grounding.detect_site_stack` → **Astro 6.3.6 / Netlify**, agreement 1.0 on this site) and is now **recorded in the run** (ticket `detected_stack` telemetry). New `check_wrong_stack_code` (`phases/documentation/_stack.py`) grounds each fix's Code/How against it: when a proposal uses idioms native to a *different* framework than the one detected, the ticket gets a "**Fix code targets the wrong stack**" advisory naming the mismatch and the target stack's idioms (for Astro: components/layouts, scoped styles/Tailwind, `astro.config`, `public/`). Family-aware: WordPress/PHP idioms (`child theme`, `functions.php`, `<?php`, `wp_enqueue`, Customizer) and Liquid/Shopify idioms (`{% … %}`, `.liquid`, `theme.liquid`, `{{ product … }}`) are only flagged when they are foreign to the detected framework — so the same check correctly stays silent on a real WordPress or Shopify site. Re-run on this audit: **19 wrong-stack tickets flagged** (all high-precision token matches — `.liquid`, `child theme`, `<?php`, `{%`, `wp-content`), matching the ~26 the review noted. New `wrong_stack_count` telemetry; non-destructive (no detected stack → no flag). Tests: `tests/test_wrong_stack.py` (10).
>
> **PARTIAL:** this is a detection/advisory backstop at emission — it *flags* wrong-stack code and reframes it as "must be hand-ported", but does not rewrite the snippet into Astro idioms. Making the generator emit stack-correct code up front is the complementary prevention piece (inject the detected stack into the proposal prompt), a follow-up alongside the numeric-grounding injection work.

---

## MUTTR-04 — Findings auditing the wrong layer (code vs. tag-manager vs. deployed)

**Severity:** high · **Category:** Finding provenance
**Status:** ☐ Open ☑ Fixed ☑ Verified — **Muttr: 2026-07-01**

**Observed:** ~10 tickets are built on a **standalone `gtag.js`** in the page source ("remove the standalone gtag.js script tag from the global header"). The repo has **no** standalone gtag — only a Consent Mode v2 `gtag('consent', …)` helper, one GTM container, and Plausible. If a second GA4 beacon exists, it's configured **inside the GTM container** (Google's console), which the audit conflates with page source.

**Why it matters:** An executor told to "remove the standalone script" finds nothing to remove and loses confidence in the whole report. Code fixes and tag-manager-config fixes are different surfaces and different owners.

**Fix:** Tag each finding with its `remediation_surface` (`source_code` | `tag_manager` | `cdn_config` | `runtime_only`). Verify source-code claims against the actual repo before asserting a specific script exists.

### Verify (Muttr to complete)
- [x] Every finding carries a `remediation_surface`
- [x] "Remove `<script>` X" claims are grep-verified against source before emission
- [x] Tag-manager-config findings are not phrased as code edits

> **Muttr (2026-07-01):** `ground_remediation_surface` (new
> `phases/documentation/_surface.py`) runs at ticket emission. Every ticket now
> carries a `remediation_surface` (frontmatter + a **Surface:** masthead line +
> `index.json`), defaulting to `source_code`. The wrong-layer claim is caught by
> GROUNDING against the crawled DOM, not by re-guessing: a fix that asks to
> "remove the standalone gtag.js `<script>`" is re-labeled `tag_manager` (with a
> corrective advisory that reframes it as a GTM change, never a code edit) when
> the DOM shows `gtag/js` loaded only via the GTM container — the tell is the
> `gtm=` query param Google appends to GTM-injected gtag, absent on a
> hand-authored snippet. Origin-wide fallback: site-wide analytics findings
> (empty `pages_affected`) are grounded against every crawled page. Re-run on
> this audit's real proposals: **13 gtag/GA4 script-removal claims correctly
> re-labeled `tag_manager`** (incl. `js-4-ga4-collect-aborted-data-loss`, the
> literal "remove the standalone gtag.js" ticket) — matching the ~10 the review
> flagged — while genuine source edits stayed `source_code`. New
> `surface_corrected_count` telemetry. Non-destructive (no crawl data → stays
> `source_code`, never a false relabel). Tests: `tests/test_remediation_surface.py`
> (9). SCOPE: grounding covers the demonstrated analytics/script-removal failure;
> a broader multi-surface classifier (`cdn_config` / `runtime_only` + richer
> `tag_manager` detection beyond gtag) is a possible follow-up, not attempted
> here to avoid a brittle keyword taxonomy.

---

## MUTTR-05 — Mismeasured / hallucinated artifacts

**Severity:** high · **Category:** Measurement grounding
**Status:** ☐ Open ☑ Fixed ☑ Verified — **Muttr: 2026-07-01**

**Observed:** `resource-loading-js-unused-absolute-bytes-static-page` and `js-unused-bytes-low-but-present` assert a **2.56MB application bundle with ~475KB unused JS**, citing "cart, product configurators, checkout, filter/sort systems." This static Astro site has **no e-commerce** and ships **one 28KB Svelte chunk** total (`dist/_astro/client.svelte.*.js`). The numbers and the named features are imported from a generic template, not measured here.

**Why it matters:** A fabricated 2.5MB bundle and invented "checkout" features are the kind of error that discredits an otherwise solid audit at a glance.

**Fix:** Ground every payload/byte claim in the run's own measured transfer. Never inherit feature assumptions (cart/checkout) from a template the target doesn't exhibit. If a metric can't be measured, mark it `unmeasured`, don't synthesize one.

### Verify (Muttr to complete)
- [x] Byte/payload figures trace to measured network transfer for this run
- [x] No references to features absent from the target (cart, checkout, configurators)
- [x] Unmeasurable metrics are labeled, not invented

> **Muttr (2026-07-01):** `ground_payload_claims` (new
> `phases/documentation/_measurement.py`) runs at ticket emission. Root cause
> found: the "2.56MB bundle / 475KB unused" was **not invented** — it is the
> Chrome Coverage API `js_total_bytes` (2,573,829 measured), which counts every
> script the browser parsed (mostly third-party GTM/GA), not the site's own
> bundle. Real network transfer was **7–52KB per page**. So the fix grounds
> byte claims in *measured transfer*: when a proposal cites an MB-scale payload
> figure exceeding measured `total_transfer_bytes` by ≥5×, the ticket gets an
> advisory naming the measured transfer and the Coverage-vs-transfer gap (and,
> when the figure matches Coverage `js_total_bytes`, says so explicitly). Invented
> e-commerce feature references (cart/checkout/configurator) are flagged too, but
> **gated to fire only alongside a byte-misattribution flag** — the
> template-contamination failure couples both, and gating avoids false-positives
> on findings that correctly note the *absence* of a cart ("do not apply
> cart/filtering templates"), a negation lexical matching can't distinguish. A
> real transactional signal in the crawl (checkout script, Product/Offer schema)
> suppresses the feature note. Re-run on this audit: the exact
> `resource-loading-js-unused-absolute-bytes-static-page` ticket flagged for both
> (2.56MB vs 7KB = 345×, cart/checkout/configurator features unverified), plus 2
> more byte-only flags; **zero false positives** (the 4 negation-context mentions
> correctly skipped). New `payload_corrected_count` telemetry. Non-destructive:
> advisory only, no crawl data → no flag. Tests: `tests/test_payload_grounding.py`
> (8). This is a detection backstop at output; prevention (injecting measured
> numbers into generation prompts) is the separate in-flight numeric-grounding
> work.

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
**Status:** ☐ Open ☑ Fixed (partial) ☐ Verified — **Muttr: 2026-07-01**

**Observed:** Several findings flag things already remediated in the current build:
- `ux-sitemap-unverifiable` — `@astrojs/sitemap` is already installed (`astro.config.mjs`).
- `escalation-2/-og-twitter-meta-*` — full OG + Twitter Card tags already present (`BaseLayout.astro`).
- `ux-mobile-hamburger-discoverability` (aria part) — button already has `aria-label` + `aria-expanded`.
- `privacy-cookies-…-dark-pattern` — privacy link already in banner body; Accept/Decline already use primary/ghost hierarchy.

**Why it matters:** Telling a client to "install a sitemap" they already have, or "add an aria-label" already present, erodes credibility and wastes the fix budget.

**Fix:** Re-check current page source/state for each finding immediately before emission; suppress or downgrade to "already addressed — verify" when the remediation is present.

### Verify (Muttr to complete)
- [~] Each finding is re-validated against current source before emission _(head-meta only — see note)_
- [x] Already-remediated items are suppressed or clearly marked "verify — appears resolved"
- [~] Spot-check: sitemap, OG/Twitter, hamburger aria, consent banner no longer flagged as missing _(OG/Twitter done; others below)_

> **Muttr (2026-07-01):** `check_stale_head_meta` (new
> `phases/documentation/_staleness.py`) runs at ticket emission. When a finding
> is framed as a *missing/unverifiable* Open Graph or Twitter Card tag but the
> crawled DOM's captured `meta_tags` show it present, the ticket gets an
> "**Appears already resolved — verify**" advisory naming the coverage (e.g. "OG
> tags on 9/9 pages"). Precision-first: the absence word must sit within ~60
> chars of the element phrase (so incidental "reads og:title…" mentions and
> present-but-quality fixes don't trip), and the scope is deliberately just
> OG/Twitter — broadening to viewport/canonical/description fired on 25 findings
> (co-mentioned incidentally); OG/Twitter alone fires on **3, all true
> positives**: `escalation-2-og-twitter-meta-unknown`,
> `escalation-og-twitter-meta-unverifiable`, and `conversion-ux-social-share-1`
> (which referenced an "og:image absence" that the crawl shows present on all 9
> pages). New `stale_flagged_count` telemetry; advisory only, never suppresses.
> Tests: `tests/test_staleness.py` (8).
>
> **PARTIAL — not yet grounded:** the **sitemap** case (Astro's `@astrojs/sitemap`
> is a build-time output the crawl doesn't fetch, so presence can't be confirmed
> from crawl data), and the **hamburger-aria** and **consent-banner** cases (they
> need element-level ARIA / a11y-tree parsing, not the head-meta signal captured
> today). These remain open — a follow-up if fuller current-state re-check is
> wanted.

---

## MUTTR-08 — Passing checks framed as findings

**Severity:** low · **Category:** Signal-to-noise
**Status:** ☐ Open ☑ Fixed ☑ Verified — **Muttr: 2026-06-26, completed 2026-07-01**

**Observed:** Passing results are emitted as tickets proposing CI guardrails: `inp-excellent-no-issues`, `visual-stability-cls-excellent`, `server-transport-ttfb-excellent`, `api-…-waterfall-minimal`, `a11y-lang-attribute-correct`, `backwards-compat-astro-modern-css`. Each says "no remediation required" then proposes building lint/CI infrastructure.

**Why it matters:** ~7 of the "80 findings" are non-findings. It dilutes the real issues and pads the count.

**Fix:** Route passing checks to a separate "Healthy / optional hardening" list, kept out of the findings count and the tickets folder. Guardrail suggestions are opt-in, not findings.

### Verify (Muttr to complete)
- [x] Passing checks appear in a separate section, not as tickets
- [x] Findings count excludes passing checks
- [x] Guardrail/CI proposals are clearly optional, not "remediation required"

> **Muttr (2026-06-26):** New `Finding.remediation_required` flag + `is_healthy_check()` route passing checks to `deliverables/healthy-checks.md`, out of the tickets folder and count. On this audit, 4 of ~6 passing checks are caught by a high-precision heuristic (an explicit "no remediation required" opening), with **zero false positives** (verified against the real findings — a genuine fix whose `how` contained a conditional "if present, no action required" clause is correctly retained). The remaining ~2 (proposals phrased "Codify/Document the baseline…") need the emitter to set `remediation_required=false` — a one-line prompt change deferred to the prompt-tuning pass. The structured flag + router are already in place to receive it.
>
> **Muttr (2026-07-01, completed):** Closed the recall gap deterministically instead of waiting on the prompt change. `is_healthy_check` now also routes a low-severity proposal whose opening proposes a *guardrail* for an already-passing metric ("Codify … CLS 0.000 into … guardrails", "Establish a … guardrail system"), excluding any opening that carries a real fix verb (eliminate/remove/replace/consolidate/…) so a genuine fix that merely mentions a guardrail isn't misrouted. Re-run on this audit: **all 6 passing checks now route out** (was 4) — `visual-stability-cls-excellent` and `backwards-compat-astro-modern-css` join the list — with the real low finding `ux-analytics-cross-domain-unknown` (opens "Eliminate the dual GA4 … then add a CI guardrail") correctly retained. Tests: `tests/test_healthy_check_routing.py` (+4).

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
**Status:** ☐ Open ☑ Fixed ☑ Verified — **Muttr: 2026-07-01**

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
- [x] Each ticket leads with a terse fix-card (ask + surface + done-condition)
- [x] The full reviewer narrative is retained, not removed (no-repo clients still covered)
- [x] Fragmented detections are grouped into one ticket per unit-of-work with sub-items
- [x] Project-scale tickets are labelled as design/effort, not as a single fix

> **Muttr (2026-07-01):** Satisfied additively across this session's work — the essay is never cut, so no-repo/locked-down clients keep the full spec. The ticket masthead is now a terse fix-card: **Finding · Severity · Why · Root cause · Surface · Effort · Fix · Done when** (ask + surface from MUTTR-04 + a one-line done-condition sourced from real acceptance criteria, omitted for the generic no-tests fallback so it never shows boilerplate). **Effort** in the card labels a project-scale ticket as effort rather than a one-line fix. Fragmented detections are folded into one ticket per remediation with an "Also resolves" sub-list (MUTTR-01 semantic fold — 48px-touch-targets 5→1 etc.). The full reviewer narrative (Impact, How, Code, Risks, Things To Watch For) is retained verbatim below the card. Tests: `tests/test_ticket_fixcard.py` (3).

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
- 2026-07-01 — **Muttr** fixed MUTTR-04 (✓ verified) with DOM-grounded remediation-surface tagging. Every ticket now carries a `remediation_surface`; "remove the standalone gtag.js" claims are re-labeled `tag_manager` (with a corrective advisory) when the crawled DOM proves gtag is GTM-injected (13 re-labeled on the real audit). Remaining: grounding batch MUTTR-03/05/07 + design MUTTR-10/11 + the MUTTR-08 emitter one-liner.
- 2026-07-01 — **Muttr** fixed MUTTR-05 (✓ verified) with payload grounding. Root cause: the 2.56MB was a real Chrome Coverage `js_total_bytes` (mostly third-party), not the site bundle; measured transfer was 7–52KB. Byte claims exceeding measured transfer ≥5× now get a corrective advisory naming the gap; invented e-commerce features are flagged (gated to byte-misattribution to dodge negation false-positives). Remaining: grounding MUTTR-03/07 + design MUTTR-10/11 + the MUTTR-08 emitter one-liner.
- 2026-07-01 — **Muttr** fixed MUTTR-07 (partial) with head-meta staleness grounding. Findings framed as missing OG/Twitter tags that the crawl shows present now get an "appears already resolved — verify" advisory (3 flagged on the real audit, all true positives; precision-first proximity match). Sitemap (not crawled) and hamburger-aria/consent-banner (need a11y-tree parsing) remain open. Remaining: MUTTR-03 (stack) + design MUTTR-10/11 + the MUTTR-08 emitter one-liner + MUTTR-07 aria/consent/sitemap follow-up.
- 2026-07-01 — **Muttr** completed MUTTR-08 (✓ verified) — closed the recall gap deterministically: `is_healthy_check` now routes low-severity "build a guardrail for a passing metric" openers (excluding real fix-verb openings), so all 6 passing checks route out (was 4). Also extracted a shared `_crawl_read` helper behind the MUTTR-04/05/07 grounding modules. Remaining: MUTTR-03 (stack) + design MUTTR-10/11 + MUTTR-07 aria/consent/sitemap follow-up.
- 2026-07-01 — **Muttr** fixed MUTTR-03 (partial) with detected-stack grounding. `detect_site_stack` (Astro/Netlify here) is recorded per run, and `check_wrong_stack_code` flags tickets whose Code uses idioms foreign to the detected framework (19 wrong-stack tickets flagged on the real audit; family-aware so WordPress/Shopify sites are unaffected). Detection/advisory backstop — generation-side code rewrite (emit Astro idioms up front) is the remaining prevention piece. Remaining: design MUTTR-10/11 + MUTTR-03 generation-side + MUTTR-07 aria/consent/sitemap follow-ups.
- 2026-07-01 — **Muttr** fixed MUTTR-10 (✓ verified) — the ticket masthead is now a terse fix-card (ask · surface · effort · done-when) with the full reviewer essay retained below; fragmented detections fold into one ticket per remediation (MUTTR-01) and project-scale work is labelled by effort. Remaining: MUTTR-11 (repo-grounding guide) + MUTTR-03 generation-side + MUTTR-07 aria/consent/sitemap follow-ups.
