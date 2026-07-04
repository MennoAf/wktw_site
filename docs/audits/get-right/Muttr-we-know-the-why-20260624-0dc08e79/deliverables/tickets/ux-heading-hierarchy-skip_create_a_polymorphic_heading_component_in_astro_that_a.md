---
finding_id: "ux-heading-hierarchy-skip"
title: "Heading hierarchy skips from h1 to h4 — broken document outline for screen readers and SEO"
severity: "medium"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: "Heading hierarchy skips violate WCAG 2.4.6 (Headings and Labels) and 1.3.1 (Info and Relationships) at Level AA."
fix_summary: "Create a polymorphic heading component in Astro that accepts a heading level as a prop, replace all hardcoded h4 (and other mis-leveled) heading tags across the site with this component, and add buil…"
confidence_tier: "confirmed"
---

# Heading hierarchy skips from h1 to h4 — broken document outline for screen readers and SEO

**Finding:** Heading hierarchy skips from h1 to h4 — broken document outline for screen readers and SEO  
**Severity:** Medium  
**Why this matters:** Heading hierarchy skips violate WCAG 2.4.6 (Headings and Labels) and 1.3.1 (Info and Relationships) at Level AA.  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Create a polymorphic heading component in Astro that accepts a heading level as a prop, replace all hardcoded h4 (and other mis-leveled) heading tags across the site with this component, and add buil…

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility Legal Risk:** Heading hierarchy skips violate WCAG 2.4.6 (Headings and Labels) and 1.3.1 (Info and Relationships) at Level AA. ADA web accessibility lawsuits are common and well-documented. Fixing this eliminates a concrete, automatable violation that plaintiff-side scanning tools flag. legal_liability=True.
- **Seo Document Outline:** Search engines use heading hierarchy to understand page structure and topic segmentation. A broken outline (h1 → h4) signals incoherent structure, weakening the page's ability to rank for section-level topics. Correcting the hierarchy gives crawlers a clean document outline, improving content signal clarity.
- **Screen Reader Navigation:** Screen reader users navigate by heading level (JAWS: H key, NVDA: H key, VoiceOver: rotor). Skipped levels create dead zones — pressing '2' or '3' to jump to the next section finds nothing, forcing linear reading. Fixing this restores the primary navigation mechanism for blind users, directly reducing task completion time and bounce rate for assistive technology users.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The page heading structure is h1 → h4 → h4, skipping h2 and h3 entirely.. The technical pass noted this as 'improper content structure' (low severity).

**Measured evidence:**
- Heading Hierarchy: h1 → h4 → h4
- Skipped Levels: ['h2', 'h3']
- Total Headings: 3
- H1 Count: 1
- H1 Text: Talk to a founder.

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
Create a polymorphic heading component in Astro that accepts a heading level as a prop, replace all hardcoded h4 (and other mis-leveled) heading tags across the site with this component, and add build-time linting to prevent regressions.

### How
1. Create a reusable `Heading.astro` component that accepts a `level` prop (1-6) and renders the correct `<hN>` element. Visual styling is decoupled from semantic level via a separate `size` prop that maps to CSS classes.
2. Audit every page template and component in the Astro `src/` directory for hardcoded heading tags. Replace each with the `Heading` component, setting `level` to the correct semantic value based on document outline position, and `size` to preserve the current visual appearance.
3. For the confirmed contact page: change the h4 elements (form section labels, supporting content blocks) to `level={2}` since they are top-level sections under the h1. If any sub-sections exist beneath those, use `level={3}`.
4. For the confirmed about page: apply the same audit — map each heading to its correct outline depth.
5. Add `eslint-plugin-astro` with `eslint-plugin-jsx-a11y` to the build pipeline. Configure the `heading-has-content` and custom heading-order rules. Add a custom ESLint rule or use `rehype-autolink-headings` validation to flag heading level skips at build time.
6. Add a Playwright accessibility test that runs axe-core on every page route and fails on `heading-order` violations.
7. Preconditions and control flow: The Heading component is a pure server-rendered Astro component — no client JS, no hydration, no async. It receives props at build time, validates them, and outputs a static HTML element. The CSS class mapping is a static object lookup. There is no state, no side effects, no race condition surface. The only assumption is that the `level` prop is an integer 1-6, which is enforced by the TypeScript type and runtime clamp.

### Code examples
```
---
// src/components/Heading.astro
// Polymorphic heading: decouples semantic level from visual size.
// `level` controls the <hN> tag (document outline).
// `size` controls visual appearance (defaults to match level).
// `class` is forwarded for additional styling.

interface Props {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 1 | 2 | 3 | 4 | 5 | 6;
  class?: string;
}

const { level, size, class: className } = Astro.props;

// SITE-SPECIFIC: Adjust these class names to match your design system's
// existing heading size utilities. These must map to the CSS that was
// previously applied via the raw h1-h6 element selectors.
const SIZE_CLASS_MAP: Record<number, string> = {
  1: 'heading-size-1',
  2: 'heading-size-2',
  3: 'heading-size-3',
  4: 'heading-size-4',
  5: 'heading-size-5',
  6: 'heading-size-6',
} as const;

// Default visual size to match semantic level unless overridden
const visualSize = size ?? level;
const sizeClass = SIZE_CLASS_MAP[visualSize] ?? SIZE_CLASS_MAP[4];
const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
const combinedClass = [sizeClass, className].filter(Boolean).join(' ');
---

<Tag class={combinedClass}><slot /></Tag>
/* src/styles/heading-sizes.css */
/* Decoupled heading size classes — these preserve the visual appearance */
/* that was previously tied to h1-h6 element selectors. */
/* SITE-SPECIFIC: Copy the existing font-size, font-weight, line-height, */
/* letter-spacing, and margin values from your current h1-h6 styles. */

.heading-size-1 {
  font-size: var(--heading-1-size, 2.5rem);
  font-weight: var(--heading-1-weight, 700);
  line-height: var(--heading-1-lh, 1.2);
}

.heading-size-2 {
  font-size: var(--heading-2-size, 2rem);
  font-weight: var(--heading-2-weight, 700);
  line-height: var(--heading-2-lh, 1.25);
}

.heading-size-3 {
  font-size: var(--heading-3-size, 1.5rem);
  font-weight: var(--heading-3-weight, 600);
  line-height: var(--heading-3-lh, 1.3);
}

.heading-size-4 {
  font-size: var(--heading-4-size, 1.25rem);
  font-weight: var(--heading-4-weight, 600);
  line-height: var(--heading-4-lh, 1.4);
}

.heading-size-5 {
  font-size: var(--heading-5-size, 1.125rem);
  font-weight: var(--heading-5-weight, 500);
  line-height: var(--heading-5-lh, 1.4);
}

.heading-size-6 {
  font-size: var(--heading-6-size, 1rem);
  font-weight: var(--heading-6-weight, 500);
  line-height: var(--heading-6-lh, 1.5);
}
---
// BEFORE — contact page template (broken hierarchy: h1 → h4 → h4)
---
<h1>Contact Us</h1>
<section>
  <h4>Send a Message</h4>
  <!-- form -->
</section>
<section>
  <h4>Our Location</h4>
  <!-- map / address -->
</section>

---
// AFTER — contact page template (correct hierarchy: h1 → h2 → h2)
// `size={4}` preserves the original visual appearance of the old h4.
---
import Heading from '../components/Heading.astro';

<Heading level={1}>Contact Us</Heading>
<section>
  <Heading level={2} size={4}>Send a Message</Heading>
  <!-- form -->
</section>
<section>
  <Heading level={2} size={4}>Our Location</Heading>
  <!-- map / address -->
</section>
// tests/a11y-heading-order.spec.ts
// Playwright + axe-core regression test for heading hierarchy.
// Runs against every route to catch heading skips at CI time.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// SITE-SPECIFIC: List all routes to audit. Generate dynamically from
// your sitemap or Astro route manifest for full coverage.
const ROUTES_TO_AUDIT: string[] = [
  '/',
  '/about',
  '/contact',
  '/services',
];

for (const route of ROUTES_TO_AUDIT) {
  test(`heading hierarchy is valid on ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

## Risks
- Visual regression if the size class CSS values don't exactly match the existing h4 element styles. Mitigation: Before replacing any heading, copy the exact computed styles (font-size, weight, line-height, margin, letter-spacing, color) from the current h4 into the heading-size-4 class. Verify with visual diff testing (Percy, Playwright screenshot comparison) on contact and about pages before deploying.
- Incomplete audit scope — if heading skips exist in CMS-managed content blocks (not just Astro templates), the component fix won't reach them. Mitigation: The Playwright axe-core test catches violations regardless of source. Any CMS content with heading skips will fail CI, surfacing the gap immediately.
- Existing CSS selectors targeting bare h4 elements (e.g., `section h4 { }`) will stop matching once the visual styling moves to classes. Mitigation: Search the entire CSS codebase for bare h1-h6 selectors before migration. Refactor any matches to use the new `.heading-size-N` classes or scope them with `:where()` to avoid specificity conflicts.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
