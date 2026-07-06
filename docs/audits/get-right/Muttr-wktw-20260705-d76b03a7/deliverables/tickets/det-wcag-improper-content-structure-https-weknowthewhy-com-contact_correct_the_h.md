---
finding_id: "det-wcag-improper-content-structure-https-weknowthewhy-com-contact"
title: "Improper content structure [WCAG]"
severity: "low"
root_cause_cluster: "Contact Form Accessibility — Missing Labels and Unverified Error Handling"
why_this_matters: "Screen reader users navigating by heading (H key in NVDA/JAWS/VoiceOver) currently encounter 'heading level 3' immediately after 'heading level 1'."
fix_summary: "Correct the heading hierarchy on /contact/ so the document outline reads h1 → h2 (no skipped levels), eliminating the WCAG 2.1 SC 1.3.1 and 2.4.6 violations."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# Improper content structure [WCAG]

**Finding:** Improper content structure [WCAG]  
**Severity:** Low  
**Why this matters:** Screen reader users navigating by heading (H key in NVDA/JAWS/VoiceOver) currently encounter 'heading level 3' immediately after 'heading level 1'.  
**Root cause:** Contact Form Accessibility — Missing Labels and Unverified Error Handling  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Correct the heading hierarchy on /contact/ so the document outline reads h1 → h2 (no skipped levels), eliminating the WCAG 2.1 SC 1.3.1 and 2.4.6 violations.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility Screen Reader Navigation:** Screen reader users navigating by heading (H key in NVDA/JAWS/VoiceOver) currently encounter 'heading level 3' immediately after 'heading level 1'. The implied level-2 context — which assistive technology users rely on to understand page structure and judge whether to read or skip a section — is absent. Correcting to h2 restores a coherent document outline, enabling efficient heading-based navigation for blind and low-vision users.
- **Legal Liability:** The h1→h3 skip is a documented violation of WCAG 2.1 SC 1.3.1 (Info and Relationships) and SC 2.4.6 (Headings and Labels). ADA Title III web accessibility lawsuits routinely cite heading structure failures as evidence of non-compliance. Remediation eliminates this specific violation from any future audit or demand letter.
- **Seo Heading Signals:** Search engine crawlers use heading hierarchy to infer content relationships and topical depth. A broken outline (h1→h3) weakens the semantic signal for the contact page's subheadings. Correcting the hierarchy restores the intended content relationship signal, though the SEO impact on a contact page is modest compared to content-heavy pages.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

### WCAG 2.1 SC 1.4.3 (AA) — insufficient contrast ratio

**Exposure:** MEDIUM  
**What Failed:** 4 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at #consent-accept.  

**Remediation:** Adjust foreground/background color pairs to meet WCAG AA contrast thresholds: 4.5:1 for body text (<18pt), 3:1 for large text (>=18pt or >=14pt bold). Verify with a contrast checker.

### WCAG 2.1 SC 4.1.2 (A) — missing name/role/value

**Exposure:** MEDIUM  
**What Failed:** 2 UI component(s) lack an accessible name, preventing assistive technology from conveying their purpose.  

**Remediation:** Add accessible names (visible text, aria-label, or aria-labelledby) and appropriate roles. Prefer native HTML semantics over ARIA.

### WCAG 2.1 SC 1.3.1 (A) — improper content structure

**Exposure:** LOW  
**What Failed:** Heading hierarchy issues: heading level jumps from h1 to h3 (skips a level).  

**Remediation:** Use a single h1 per page for the main topic. Nest headings sequentially (h1 > h2 > h3) without skipping levels. Headings should describe the content that follows, not be used for styling.

### WCAG 2.1 SC 1.4.1 (A) — color as sole indicator

**Exposure:** MEDIUM  
**What Failed:** 12 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).  

**Remediation:** Supplement color with additional visual cues: underline inline links, or add icons/patterns. Do not rely on color alone to convey meaning.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_006`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Heading hierarchy issues: heading level jumps from h1 to h3 (skips a level).

**Page(s) to check:**
- https://weknowthewhy.com/contact

**Measured evidence:**
- Source: deterministic_detector
- Regulation Ref: WCAG 2.1 SC 1.3.1 (A)
- Detail: Heading hierarchy issues: heading level jumps from h1 to h3 (skips a level).

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
Correct the heading hierarchy on /contact/ so the document outline reads h1 → h2 (no skipped levels), eliminating the WCAG 2.1 SC 1.3.1 and 2.4.6 violations. If any corrected heading must visually match the former h3 size, apply a scoped utility class — never re-introduce a semantic skip to achieve a visual target.

### How
1. Open the contact page template. In Astro this is most likely src/pages/contact.astro or src/pages/contact/index.astro. If the page composes a layout, the heading may live inside a child component (e.g., src/components/ContactForm.astro or src/components/SectionHeading.astro).
2. Locate every heading element below the h1. Change any h3 (or deeper) that immediately follows the h1 — with no intervening h2 — to h2. If the component hardcodes the tag (e.g., <h3 class="section-title">), change the element tag, not just the class.
3. If the heading's visual size must stay at the former h3 size, add a scoped BEM/data-attribute class (e.g., class="contact-subheading contact-subheading--sm") and write a scoped style rule that overrides font-size only. Do NOT use a lower heading level to achieve a smaller visual size.
4. If the subheading lives inside a shared SectionHeading component that hardcodes <h3>, add a required headingLevel prop (type: 1|2|3|4|5|6, default: 2) and render the tag dynamically using Astro's dynamic tag syntax (const Tag = `h${headingLevel}`). Pass headingLevel={2} from the contact page.
5. After editing, run `astro build` locally and open the built HTML in a browser. Use the axe DevTools browser extension or `npx axe-core-cli https://localhost:PORT/contact/` to confirm zero heading-order violations.
6. Optionally run `npx pa11y https://localhost:PORT/contact/` for a second-opinion WCAG AA pass.
7. Commit the change. Because this is a static Astro build on Netlify, the fix ships on the next deploy — no server-side cache invalidation required.
8. Schedule a site-wide heading audit (axe-core CLI crawl or Screaming Frog accessibility export) as a follow-on action to catch the same authoring pattern on other pages before it accumulates.

### Code examples
```
// ─── SCENARIO A: heading is hardcoded directly in src/pages/contact.astro ───
// Before (violates WCAG 1.3.1 / 2.4.6 — h1 → h3 skip)
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Contact Us">
  <h1>Contact Us</h1>
  <h3 class="section-title">Send Us a Message</h3>  <!-- ❌ skips h2 -->
  <!-- form markup -->
</BaseLayout>

// After — semantic fix with optional visual-size override
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Contact Us">
  <h1>Contact Us</h1>
  <h2 class="contact-subheading contact-subheading--sm">Send Us a Message</h2>  <!-- ✅ correct level -->
  <!-- form markup -->
</BaseLayout>

<style>
  /*
   * Scoped to .contact-subheading--sm only.
   * Matches former h3 visual size without re-introducing a semantic skip.
   * SITE-SPECIFIC ASSUMPTION: 1.25rem matches the previous h3 computed size.
   * Adjust to match your type scale if different.
   */
  .contact-subheading--sm {
    font-size: 1.25rem;   /* intentional: visual parity with former h3 */
    font-weight: 600;
    line-height: 1.4;
  }
</style>
// ─── SCENARIO B: heading lives in a shared SectionHeading component ───
// src/components/SectionHeading.astro
---
// headingLevel: which semantic heading tag to render.
// SITE-SPECIFIC ASSUMPTION: default is 2 (h2) — the most common sub-section level.
// Callers that need h3 (e.g., inside an already-h2 section) must pass headingLevel={3}.
interface Props {
  text: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  class?: string;
}

const {
  text,
  headingLevel = 2,   // named constant: default sub-section level
  class: className = '',
} = Astro.props;

// Dynamic tag — Astro supports this natively; no runtime overhead.
const Tag = `h${headingLevel}` as keyof HTMLElementTagNameMap;
---
<Tag class:list={['section-heading', className]}>
  {text}
</Tag>

<style>
  /*
   * Base styles shared across all heading levels rendered by this component.
   * Visual size is NOT tied to the semantic level — callers control appearance
   * via the class prop, not by choosing a lower heading level.
   */
  .section-heading {
    font-weight: 600;
    line-height: 1.4;
  }
</style>

// ─── Usage in src/pages/contact.astro ───
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';
---
<BaseLayout title="Contact Us">
  <h1>Contact Us</h1>
  <!-- headingLevel={2} enforces correct outline; visual size controlled by class -->
  <SectionHeading
    text="Send Us a Message"
    headingLevel={2}
    class="contact-subheading--sm"
  />
  <!-- form markup -->
</BaseLayout>
```

## Risks
- Visual regression if the h3's default browser stylesheet size was relied upon for layout: the corrected h2 will render larger by default. Mitigated by the scoped .contact-subheading--sm override shown in Scenario A, or by the class prop in Scenario B — visual size is decoupled from semantic level.
- If SectionHeading is used across multiple page types (Scenario B), adding the headingLevel prop with a default of 2 is backwards-compatible — existing call sites that omit the prop continue to render h2 unchanged. Risk is near-zero provided the default matches current usage. Verify by grepping for SectionHeading usage before deploying.
- If a third-party form embed (e.g., HubSpot, Typeform iframe) injects its own heading markup inside the page, the corrected page outline may still show unexpected levels from the embed. This is out of scope for the template fix but should be noted in the follow-on site-wide audit.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
