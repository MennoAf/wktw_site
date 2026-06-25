---
finding_id: "det-wcag-improper-content-structure-https-weknowthewhy-com-about"
title: "Improper content structure [WCAG]"
severity: "low"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: "Resolves WCAG 2.1 SC 1.3.1 (Level A) violations across all 8 affected templates."
fix_summary: "Refactor shared Astro components that hardcode <h4> to accept a polymorphic `headingLevel` prop, and add a design-system-level guard that decouples visual heading style from semantic heading rank."
confidence_tier: "confirmed"
---

# Improper content structure [WCAG]

**Finding:** Improper content structure [WCAG]  
**Severity:** Low  
**Why this matters:** Resolves WCAG 2.1 SC 1.3.1 (Level A) violations across all 8 affected templates.  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Refactor shared Astro components that hardcode <h4> to accept a polymorphic `headingLevel` prop, and add a design-system-level guard that decouples visual heading style from semantic heading rank.

> **Evidence Basis:** Confirmed

---

## Impact

- **Wcag Conformance:** Resolves WCAG 2.1 SC 1.3.1 (Level A) violations across all 8 affected templates. Level A is the baseline below which no WCAG conformance claim is valid — fixing this is a prerequisite for any accessibility statement.
- **Screen Reader Navigation:** Screen reader users navigating by heading (a primary navigation strategy in NVDA, JAWS, and VoiceOver) currently encounter a broken document outline that skips h3, making section relationships ambiguous. Fixing the hierarchy restores a navigable outline. The skip link eliminates the requirement to tab through the entire navigation on every page load — a direct reduction in interaction cost for keyboard and screen reader users.
- **Legal Exposure:** WCAG 2.1 Level A failures are the category most frequently cited in ADA Title III web accessibility demand letters and lawsuits. A site with documented Level A violations across every major template type has materially higher legal exposure than one with only Level AA gaps. Remediation reduces this exposure.
- **Seo:** Heading hierarchy is a documented signal in how crawlers interpret page structure and topic relationships. Correcting h2→h4 skips to h2→h3 gives crawlers a coherent content outline, which can improve topical relevance signals for affected pages.
- **Mobile Conversion:** The 20 undersized touch targets (below 48×48px) create mis-tap friction on mobile. Mis-taps on CTAs, navigation, and filter controls cause unintended navigation or failed interactions, directly increasing task abandonment on mobile devices.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

### WCAG 2.1 SC 1.4.3 (AA) — insufficient contrast ratio

**Exposure:** MEDIUM  
**What Failed:** 3 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at div > a:nth-of-type(5).  

**Remediation:** Adjust foreground/background color pairs to meet WCAG AA contrast thresholds: 4.5:1 for body text (<18pt), 3:1 for large text (>=18pt or >=14pt bold). Verify with a contrast checker.

### WCAG 2.1 SC 1.3.1 (A) — improper content structure

**Exposure:** LOW  
**What Failed:** Heading hierarchy issues: heading level jumps from h2 to h4 (skips a level).  

**Remediation:** Use a single h1 per page for the main topic. Nest headings sequentially (h1 > h2 > h3) without skipping levels. Headings should describe the content that follows, not be used for styling.

### WCAG 2.1 SC 1.4.1 (A) — color as sole indicator

**Exposure:** MEDIUM  
**What Failed:** 10 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).  

**Remediation:** Supplement color with additional visual cues: underline inline links, or add icons/patterns. Do not rely on color alone to convey meaning.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Heading hierarchy issues: heading level jumps from h2 to h4 (skips a level).

**Page(s) to check:**
- https://weknowthewhy.com/about/
- https://weknowthewhy.com/contact/
- https://weknowthewhy.com/
- https://weknowthewhy.com/legal/privacy/
- https://weknowthewhy.com/legal/terms/
- ... and 3 more pages

**Measured evidence:**
- Source: deterministic_detector
- Regulation Ref: WCAG 2.1 SC 1.3.1 (A)
- Detail: Heading hierarchy issues: heading level jumps from h2 to h4 (skips a level).

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
Refactor shared Astro components that hardcode <h4> to accept a polymorphic `headingLevel` prop, and add a design-system-level guard that decouples visual heading style from semantic heading rank. Add a skip-to-main-content link and fix the 20 undersized touch targets as part of the same accessibility pass.

### How
1. AUDIT: Run `grep -r '<h4' src/components/ src/layouts/` to enumerate every component that hardcodes an h4 element. Cross-reference against the 8 affected page templates to identify which components are shared across all of them. Expect to find 1–3 components (card, feature block, or section sub-item) responsible for the majority of violations.
2. REFACTOR SHARED COMPONENTS: For each offending component, replace the hardcoded `<h4>` with a dynamic element driven by a `headingLevel` prop (type: 2|3|4|5|6, default: 3). The component renders the correct semantic element while the visual style is applied via a CSS class — decoupling rank from appearance. See code example 1.
3. UPDATE ALL CALL SITES: At every location where the refactored component is used inside a section that opens with an h2, pass `headingLevel={3}`. Where the component is used inside an h3 section, pass `headingLevel={4}`. This is a mechanical find-and-replace once the audit in step 1 is complete.
4. ADD DESIGN SYSTEM STYLE ALIASES: Create CSS utility classes `.heading-style-label`, `.heading-style-section`, etc. that apply the visual treatment previously achieved by choosing a lower heading rank. This removes the authoring incentive to reach for h4 for visual reasons. See code example 2.
5. ADD SKIP LINK: Insert a visually-hidden-until-focused skip link as the first child of `<body>` in the root layout file (`src/layouts/Layout.astro` or equivalent). See code example 3.
6. FIX TOUCH TARGETS: Locate the 20 undersized interactive elements (buttons, links, toggles). Apply a minimum 48×48px tap target via padding or the `min-height`/`min-width` approach scoped to the specific component classes identified in the audit. Do not apply globally to `button {}` or `a {}`. See code example 4.
7. AUTHORING GUARD (OPTIONAL BUT RECOMMENDED): Add a dev-only runtime assertion in the component that warns when `headingLevel` is not passed and the component is nested inside a section with a known heading level. This prevents regression as new pages are authored. See code example 5.
8. VALIDATE: After deployment, run `npx axe-cli https://weknowthewhy.com` against all 8 affected URLs and confirm zero WCAG 1.3.1 violations. Verify skip link focus behavior manually in Chrome and VoiceOver/NVDA.

### Code examples
```
// CODE EXAMPLE 1: Polymorphic heading component (Astro)
// File: src/components/CardTitle.astro
// SITE-SPECIFIC ASSUMPTION: adjust defaultHeadingLevel to match the most common
// nesting context for this component across your templates.

---
const VALID_HEADING_LEVELS = [2, 3, 4, 5, 6] as const;
type HeadingLevel = typeof VALID_HEADING_LEVELS[number];

interface Props {
  headingLevel?: HeadingLevel;
  class?: string;
}

// Default is 3 — assumes this component lives inside an h2 section.
// Override at call site when nesting context differs.
const { headingLevel = 3, class: className = '' } = Astro.props;

if (!VALID_HEADING_LEVELS.includes(headingLevel)) {
  throw new Error(
    `CardTitle: headingLevel must be one of ${VALID_HEADING_LEVELS.join(', ')}. Received: ${headingLevel}`
  );
}

const Tag = `h${headingLevel}` as const;
---

<Tag class={`card-title heading-style-label ${className}`}>
  <slot />
</Tag>
// CODE EXAMPLE 2: Visual style aliases — decouple appearance from rank
// File: src/styles/heading-styles.css
// Scope: applied via class, never via element selector, to prevent layout regressions.

/* Visual treatment previously achieved by choosing h4 for its small size.
   Authors apply .heading-style-label to get the small-label look
   regardless of which semantic heading rank is rendered. */
.heading-style-label {
  font-size: 0.875rem;   /* 14px — SITE-SPECIFIC: adjust to match design tokens */
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.4;
}

.heading-style-section {
  font-size: 1.25rem;    /* 20px — SITE-SPECIFIC: adjust to match design tokens */
  font-weight: 700;
  line-height: 1.3;
}

.heading-style-page {
  font-size: 2rem;       /* 32px — SITE-SPECIFIC: adjust to match design tokens */
  font-weight: 800;
  line-height: 1.2;
}
// CODE EXAMPLE 3: Skip-to-main-content link
// File: src/layouts/Layout.astro — insert as first child of <body>
// Precondition: the main content area must have id="main-content".
// If it does not, add id="main-content" to the <main> element.

---
// No props needed — this is a layout-level global fix.
---

<a
  href="#main-content"
  class="skip-link"
>
  Skip to main content
</a>

<style>
  /* Scoped to .skip-link only — no risk of bleeding into other elements */
  .skip-link {
    position: absolute;
    top: -9999px;
    left: 0;
    z-index: 9999;
    padding: 0.75rem 1.25rem;
    background: #000000;       /* SITE-SPECIFIC: use brand focus color */
    color: #ffffff;            /* SITE-SPECIFIC: ensure 4.5:1 contrast with background */
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    border-radius: 0 0 4px 0;
  }

  /* Revealed on keyboard focus — never on hover alone */
  .skip-link:focus {
    top: 0;
    outline: 3px solid #ffffff; /* visible focus ring against dark background */
    outline-offset: 2px;
  }
</style>
// CODE EXAMPLE 4: Touch target fix — scoped to specific components
// File: src/styles/touch-targets.css
// SITE-SPECIFIC ASSUMPTION: replace .nav-toggle, .card-cta-link, .filter-chip
// with the actual class names of the 20 undersized elements identified in the audit.
// Do NOT apply globally to button {} or a {} — that will cause layout regressions.

/* Minimum 48x48px tap target per WCAG 2.5.8.
   Uses padding expansion rather than min-height/min-width where the element
   is inline, to avoid disrupting surrounding layout flow. */

.nav-toggle,
.card-cta-link,
.filter-chip {
  /* SITE-SPECIFIC: add all undersized component classes here */
  min-height: 48px;
  min-width: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-block: 0.5rem;   /* 8px vertical — adjust if element already has padding */
  padding-inline: 0.75rem; /* 12px horizontal — adjust per design */
}

/* Ensure adjacent targets have spacing to prevent mis-tap.
   WCAG 2.5.8 requires targets not be adjacent without spacing. */
.nav-toggle + .nav-toggle,
.filter-chip + .filter-chip {
  margin-inline-start: 0.25rem; /* 4px minimum gap — SITE-SPECIFIC: adjust to design */
}
// CODE EXAMPLE 5: Dev-only heading hierarchy guard
// File: src/components/CardTitle.astro — add inside the frontmatter fence
// Precondition: only runs in development (import.meta.env.DEV).
// Does not ship to production. No runtime cost in prod.

---
import { VALID_HEADING_LEVELS } from '../utils/headingLevels';

const { headingLevel = 3 } = Astro.props;

// Dev-only guard: warn when headingLevel prop is omitted.
// This surfaces the authoring contract violation at build/dev time
// rather than silently producing broken HTML.
if (import.meta.env.DEV && headingLevel === 3) {
  // Intentional: default of 3 is correct in most contexts, but
  // if a developer forgets to pass the prop in an h3-section context,
  // this warning prompts them to verify the nesting.
  console.warn(
    '[CardTitle] headingLevel not explicitly set. Defaulting to h3. ' +
    'Verify this component is nested inside an h2 section. ' +
    'Pass headingLevel={4} if inside an h3 section.'
  );
}
---
```

## Risks
- VISUAL REGRESSION ON HEADING STYLES: Changing a hardcoded <h4> to <h3> will inherit any CSS rules scoped to h3 that differ from h4 rules. Mitigation: the fix explicitly decouples visual style from semantic rank via the `.heading-style-label` class approach. The component renders the correct semantic element but the visual appearance is controlled by the class, not the element selector. Verify no existing CSS uses bare `h3 { }` selectors that would override the class-based styles — scope any conflicting rules to `.heading-style-section` instead.
- CALL SITE OMISSION: If any call site of the refactored component is missed during the step-3 update, it will silently render with the default headingLevel (3), which may be wrong in some nesting contexts. Mitigation: the dev-mode console warning (code example 5) surfaces omissions during development. A post-deploy axe-cli scan catches any remaining violations before they reach production.
- TOUCH TARGET PADDING DISRUPTING LAYOUT: Adding min-height/padding to inline elements can shift surrounding content. Mitigation: the fix uses `display: inline-flex` with `align-items: center` to contain the size change within the element's own box. Scope the rule to the specific component classes identified in the audit — never apply globally. Test in the components' actual layout contexts before deploying.
- SKIP LINK FOCUS STYLE CONTRAST: The skip link uses hardcoded black/white colors. If the site's focus management CSS overrides `:focus` styles globally (e.g., `*:focus { outline: none }`), the skip link focus state will be invisible. Mitigation: use `:focus-visible` in addition to `:focus`, and verify the skip link focus ring is visible in Chrome and Firefox before deploying. Remove any `outline: none` overrides that lack a replacement focus indicator.
- ASTRO COMPONENT TAG INTERPOLATION: The pattern `` const Tag = `h${headingLevel}` `` relies on Astro treating the interpolated string as a valid HTML element name. This is standard Astro/JSX behavior and is well-supported, but if the codebase uses a strict TypeScript config that does not recognize the `as const` cast on the Tag variable, a type error may surface. Mitigation: the code example includes the `as const` assertion; if type errors occur, use a lookup object `const TAG_MAP = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const` and index into it.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
