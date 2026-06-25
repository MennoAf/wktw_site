---
finding_id: "ux-revenue-no-pricing-signals"
title: "No pricing transparency or engagement model clarity"
severity: "medium"
root_cause_cluster: "Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization"
why_this_matters: "The homepage CTA currently asks for a high-commitment action (synchronous founder call) with no upstream context about scope, duration, or fee structure."
fix_summary: "Add engagement model framing to /the-get-right and the homepage CTA zone."
confidence_tier: "confirmed"
---

# No pricing transparency or engagement model clarity

**Finding:** No pricing transparency or engagement model clarity  
**Severity:** Medium  
**Why this matters:** The homepage CTA currently asks for a high-commitment action (synchronous founder call) with no upstream context about scope, duration, or fee structure.  
**Root cause:** Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization  
**Fix:** Add engagement model framing to /the-get-right and the homepage CTA zone.

> **Evidence Basis:** Confirmed

---

## Impact

- **Contact Form Conversion Rate:** The homepage CTA currently asks for a high-commitment action (synchronous founder call) with no upstream context about scope, duration, or fee structure. B2B buyers who cannot answer 'what am I committing to' before initiating contact will abandon rather than reach out blind. Adding the expectation-setter and the engagement model link reduces the perceived commitment of clicking 'Talk to a Founder' by making the next step legible. The mechanism is friction reduction at the decision point, not persuasion.
- **Lead Qualification Rate:** Prospects who read the engagement model section before contacting arrive with a self-selected fit signal — they have already matched their problem to an engagement type. This reduces founder time spent on discovery calls that end in scope mismatch. The mechanism is pre-qualification through information, not filtering through a form gate.
- **Bounce Rate On Service Page:** The current /the-get-right page provides no answer to 'what happens if I engage'. Prospects who arrive with budget and timeline questions leave without answers. The engagement model section gives those prospects a reason to stay and a path to contact. The mechanism is content completeness at the decision stage.
- **Search Ranking Signal:** The new section adds substantive, unique content to /the-get-right — a page that currently competes on thin content. Structured, specific content about engagement types (duration, fee structure, scope) is more indexable than generic service descriptions. The mechanism is content depth, not keyword stuffing.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_008`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The site offers no pricing information, engagement model description, or even a general indication of how the consultancy works (project-based, retainer, audit-then-fix).. The 'The Get Right' page is the service page, but from the homepage there is no indication of what a prospect is committing to when they click 'Talk to a Founder.' B2B consultancy prospects self-qualify on pricing range and engagement model before initiating contact.

**Measured evidence:**
- Pricing Visible: False
- Engagement Model Described: False
- Service Page: https://weknowthewhy.com/the-get-right

Open the affected page in Chrome DevTools and verify these values in the relevant tab (Network, Elements, Console, Application, or Performance).

## Done when

No automated verification tests available for this finding.

**Manual validation steps:**

1. Implement the fix on a staging environment
2. Open the affected page(s) in Chrome DevTools
3. Run a Lighthouse audit (Performance + Accessibility)
4. Compare scores against the pre-fix baseline
5. Check the Console tab for new errors or warnings

## Code

### What to do
Add engagement model framing to /the-get-right and the homepage CTA zone. The goal is not to publish prices — it is to answer the three B2B pre-qualification questions (relevance, budget range, commitment scope) before the prospect reaches the contact form. This requires two targeted content additions: (1) an Engagement Model section on /the-get-right describing how the firm works (scope types, typical duration, what a first engagement looks like), and (2) a CTA context block on the homepage that sets expectations immediately below or adjacent to 'Talk to a Founder'. No existing page structure is removed or restructured.

### How
1. AUDIT EXISTING MARKUP: Identify the exact DOM structure of the 'Talk to a Founder' CTA on the homepage and the primary content container on /the-get-right. Record the CSS class names, landmark roles, and heading hierarchy at both insertion points before writing any code. This prevents selector drift and confirms the heading level to use for the new section (must not skip levels).
2. DEFINE ENGAGEMENT MODEL CONTENT: Draft three engagement types with the founder before implementation. Each type needs: a name (e.g., 'Diagnostic Audit'), a scope sentence (what is delivered), a duration signal (e.g., '2–3 weeks'), and a budget signal (e.g., 'fixed-fee, scoped before work begins' — not a number, but a structure signal). This content must be approved before any code is written. The implementation is blocked on this step.
3. BUILD THE ENGAGEMENT MODEL SECTION COMPONENT: Create a self-contained HTML/CSS component for /the-get-right. The component renders a three-column card grid (collapsing to single-column on mobile) with one card per engagement type. Each card contains: heading (h3, assuming the section heading is h2), scope sentence, duration badge, and budget-structure label. No JavaScript required — this is static content. Apply CSS Grid with a named grid-template-areas so the layout is explicit and survives CMS re-renders.
4. INSERT THE COMPONENT INTO /the-get-right: Place the Engagement Model section immediately before the existing CTA block on the service page. This positions it as the final pre-qualification step before the ask. Do not insert it above the problem/solution content — the prospect must understand the problem before the engagement model is meaningful.
5. BUILD THE CTA CONTEXT BLOCK FOR THE HOMEPAGE: Create a two-line expectation-setter that renders directly below the 'Talk to a Founder' button. Content: one sentence describing what happens after contact (e.g., 'A 20-minute scoping call — no pitch, no obligation') and one sentence linking to the service page for prospects who want more detail first. This is static HTML, no JS.
6. SCOPE ALL CSS TO COMPONENT CLASSES: All new styles must use a BEM-namespaced class prefix (e.g., .engagement-model__) or a data attribute (data-component='engagement-model'). No bare element selectors. Verify no existing stylesheet defines the same class names before shipping.
7. VERIFY HEADING HIERARCHY: After insertion, run an automated heading-order check (axe-core or equivalent) on both pages. The new h2 section heading and h3 card headings must not create a skip in the existing hierarchy. If the existing page uses h2 for section headings, the engagement model section heading is h2 and card headings are h3. If the page uses h3 for sections, adjust accordingly.
8. VERIFY KEYBOARD AND SCREEN READER FLOW: Tab through both pages after insertion. Confirm: (a) the engagement model section is reachable by keyboard in logical order, (b) card headings are announced correctly by VoiceOver/NVDA, (c) the CTA context block on the homepage is read before the button is activated (DOM order must match visual order — do not use CSS to visually reorder).
9. TEST ON MOBILE AT 320px AND 375px: The three-column card grid must collapse gracefully. Verify no horizontal overflow, no text truncation, and that touch targets on any links within cards meet 48x48px minimum.
10. DEPLOY BEHIND A FEATURE FLAG OR STAGED ROLLOUT: If the CMS supports it, deploy to a staging URL first and share with the founder for content approval before production push. The content decisions (engagement type names, duration signals, budget-structure language) are higher-risk than the implementation — get sign-off before the page goes live.

### Code examples
```
<!-- /the-get-right: Engagement Model Section -->
<!-- ASSUMPTION: Existing section headings on this page are h2. Adjust heading levels if the page hierarchy differs. -->
<!-- ASSUMPTION: .service-page__content is the existing main content wrapper class. Replace with actual class from DOM audit in Step 1. -->

<section
  class="engagement-model"
  aria-labelledby="engagement-model-heading"
  data-component="engagement-model"
>
  <h2 id="engagement-model-heading" class="engagement-model__heading">
    How We Work
  </h2>
  <p class="engagement-model__intro">
    Every engagement is scoped before work begins. No open-ended retainers unless explicitly agreed.
  </p>

  <ul class="engagement-model__grid" role="list">

    <li class="engagement-model__card">
      <h3 class="engagement-model__card-title">Diagnostic Audit</h3>
      <p class="engagement-model__card-scope">
        A structured review of your current acquisition system — traffic, conversion path, and revenue attribution — delivered as a prioritised findings report.
      </p>
      <dl class="engagement-model__card-meta">
        <div class="engagement-model__card-meta-item">
          <dt class="engagement-model__card-meta-label">Duration</dt>
          <dd class="engagement-model__card-meta-value">2–3 weeks</dd>
        </div>
        <div class="engagement-model__card-meta-item">
          <dt class="engagement-model__card-meta-label">Fee structure</dt>
          <dd class="engagement-model__card-meta-value">Fixed fee, agreed before start</dd>
        </div>
      </dl>
    </li>

    <li class="engagement-model__card">
      <h3 class="engagement-model__card-title">Implementation Sprint</h3>
      <p class="engagement-model__card-scope">
        Hands-on execution of a defined scope — typically following a Diagnostic Audit or an existing internal brief. Deliverables and acceptance criteria agreed upfront.
      </p>
      <dl class="engagement-model__card-meta">
        <div class="engagement-model__card-meta-item">
          <dt class="engagement-model__card-meta-label">Duration</dt>
          <dd class="engagement-model__card-meta-value">4–8 weeks</dd>
        </div>
        <div class="engagement-model__card-meta-item">
          <dt class="engagement-model__card-meta-label">Fee structure</dt>
          <dd class="engagement-model__card-meta-value">Fixed fee or milestone-based</dd>
        </div>
      </dl>
    </li>

    <li class="engagement-model__card">
      <h3 class="engagement-model__card-title">Advisory</h3>
      <p class="engagement-model__card-scope">
        Ongoing strategic input for founders and growth leads who need a senior thinking partner without a full-time hire. Structured around a defined monthly scope.
      </p>
      <dl class="engagement-model__card-meta">
        <div class="engagement-model__card-meta-item">
          <dt class="engagement-model__card-meta-label">Duration</dt>
          <dd class="engagement-model__card-meta-value">3-month minimum</dd>
        </div>
        <div class="engagement-model__card-meta-item">
          <dt class="engagement-model__card-meta-label">Fee structure</dt>
          <dd class="engagement-model__card-meta-value">Monthly retainer, defined scope</dd>
        </div>
      </dl>
    </li>

  </ul>
</section>
/* engagement-model.css */
/* Scoped entirely to [data-component='engagement-model'] to prevent bleed into existing styles. */
/* ASSUMPTION: --color-surface, --color-border, --color-text-primary, --color-text-secondary,
   --font-size-lg, --font-size-base, --font-size-sm are defined in the existing design token file.
   Replace with actual token names or hardcoded values if tokens are not available. */

/* Layout constants — adjust to match site grid */
:root {
  --engagement-model-gap: 1.5rem;       /* gutter between cards */
  --engagement-model-card-padding: 1.5rem;
  --engagement-model-min-col: 18rem;    /* minimum card width before wrapping */
  --engagement-model-border-radius: 0.5rem;
}

[data-component='engagement-model'] {
  container-type: inline-size;
  margin-block: 3rem;
}

[data-component='engagement-model'] .engagement-model__heading {
  font-size: var(--font-size-lg, 1.5rem);
  margin-block-end: 0.5rem;
}

[data-component='engagement-model'] .engagement-model__intro {
  color: var(--color-text-secondary, #555);
  margin-block-end: 2rem;
  max-width: 60ch;
}

[data-component='engagement-model'] .engagement-model__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--engagement-model-min-col), 1fr));
  gap: var(--engagement-model-gap);
  list-style: none;
  margin: 0;
  padding: 0;
}

[data-component='engagement-model'] .engagement-model__card {
  background: var(--color-surface, #f9f9f9);
  border: 1px solid var(--color-border, #e0e0e0);
  border-radius: var(--engagement-model-border-radius);
  padding: var(--engagement-model-card-padding);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

[data-component='engagement-model'] .engagement-model__card-title {
  font-size: var(--font-size-base, 1rem);
  font-weight: 600;
  margin: 0;
}

[data-component='engagement-model'] .engagement-model__card-scope {
  font-size: var(--font-size-base, 1rem);
  color: var(--color-text-primary, #222);
  margin: 0;
  flex-grow: 1; /* pushes meta to bottom of card */
}

[data-component='engagement-model'] .engagement-model__card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding-block-start: 0.75rem;
  border-block-start: 1px solid var(--color-border, #e0e0e0);
}

[data-component='engagement-model'] .engagement-model__card-meta-item {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

[data-component='engagement-model'] .engagement-model__card-meta-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #555);
  font-weight: 500;
  white-space: nowrap;
}

[data-component='engagement-model'] .engagement-model__card-meta-value {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-primary, #222);
  font-weight: 600;
}

/* Reduced motion: no animations on this component, so no override needed.
   If the site adds entrance animations globally, scope them out here: */
@media (prefers-reduced-motion: reduce) {
  [data-component='engagement-model'] * {
    animation: none !important;
    transition: none !important;
  }
}
<!-- Homepage: CTA context block -->
<!-- ASSUMPTION: .cta-primary is the existing class on the 'Talk to a Founder' button.
     The context block is inserted as the next sibling of the button's containing element.
     DOM order must match visual order — do not use CSS order or position to resequence. -->
<!-- ASSUMPTION: /the-get-right is the correct href for the service page. Confirm before deploy. -->

<div
  class="cta-context"
  data-component="cta-context"
  aria-label="What to expect when you reach out"
>
  <p class="cta-context__expectation">
    A 20-minute scoping call — no pitch, no obligation. We establish fit before either side commits.
  </p>
  <p class="cta-context__detail">
    Want to understand how we work first?
    <a href="/the-get-right" class="cta-context__link">
      See our engagement model
    </a>
  </p>
</div>
/* cta-context.css */
/* Scoped to [data-component='cta-context'] — no bare element selectors. */
/* ASSUMPTION: This block renders immediately after the primary CTA button in DOM order.
   Do not use CSS to visually reposition it above the button — screen readers follow DOM order. */

[data-component='cta-context'] {
  margin-block-start: 0.75rem;
  text-align: center; /* ASSUMPTION: homepage CTA zone is center-aligned. Adjust if left-aligned. */
}

[data-component='cta-context'] .cta-context__expectation {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #555);
  margin: 0 0 0.25rem;
}

[data-component='cta-context'] .cta-context__detail {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #555);
  margin: 0;
}

[data-component='cta-context'] .cta-context__link {
  color: var(--color-link, #0057b8);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Ensure link meets 4.5:1 contrast against background.
   --color-link must be verified against the page background in Step 7. */
[data-component='cta-context'] .cta-context__link:focus-visible {
  outline: 2px solid var(--color-link, #0057b8);
  outline-offset: 2px;
  border-radius: 2px;
}
```

## Risks
- CONTENT ACCURACY RISK: If the engagement model descriptions do not match how the founder actually scopes and prices work, the page creates expectation mismatches that damage trust on the first call. Mitigation: founder must review and approve all three engagement type descriptions before deploy. Block implementation on this approval.
- HEADING HIERARCHY DISRUPTION: Inserting a new h2 section on /the-get-right could break the existing heading order if the page already uses h2 for other sections in a way that makes the new section semantically out of place. Mitigation: run axe-core heading audit on the page before and after insertion. Adjust heading level to match the existing hierarchy — the component heading level is a site-specific assumption, not a fixed value.
- CMS RE-RENDER OVERWRITE: If /the-get-right is generated from a CMS template, a template re-save or theme update could overwrite the manually inserted HTML. Mitigation: implement the engagement model section as a CMS-native block or component (page builder block, custom field, shortcode) rather than raw HTML injection. The HTML above is the target output — the CMS implementation method depends on the platform.
- DESIGN SYSTEM CONFLICT: The component uses CSS custom properties (--color-surface, --color-border, etc.) that may not exist in the current design token file, causing fallback values to render instead of brand colours. Mitigation: audit the existing token file before deploy and replace all var() references with confirmed token names or hardcoded values. The fallback values in the CSS are functional but may not match brand.
- MOBILE OVERFLOW ON NARROW VIEWPORTS: The auto-fit grid with minmax(18rem, 1fr) will render a single column below ~576px, which is correct. However, if the page has a narrow content container (e.g., max-width: 600px with padding), the minimum column width may cause overflow at 320px. Mitigation: test at 320px viewport width and reduce --engagement-model-min-col if overflow occurs.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
