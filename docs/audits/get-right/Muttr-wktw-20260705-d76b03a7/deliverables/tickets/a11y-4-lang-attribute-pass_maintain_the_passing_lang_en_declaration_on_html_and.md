---
finding_id: "a11y-4-lang-attribute-pass"
title: "HTML lang attribute correctly set to 'en' — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Passing lang='en' enables JAWS, NVDA, and VoiceOver to select the correct speech synthesis engine without user intervention."
fix_summary: "Maintain the passing lang='en' declaration on <html> and extend coverage to any inline multilingual content segments per WCAG 3.1.2 (Language of Parts, Level AA)."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# HTML lang attribute correctly set to 'en' — PASS

**Finding:** HTML lang attribute correctly set to 'en' — PASS  
**Severity:** Low  
**Why this matters:** Passing lang='en' enables JAWS, NVDA, and VoiceOver to select the correct speech synthesis engine without user intervention.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Maintain the passing lang='en' declaration on <html> and extend coverage to any inline multilingual content segments per WCAG 3.1.2 (Language of Parts, Level AA).  

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility:** Passing lang='en' enables JAWS, NVDA, and VoiceOver to select the correct speech synthesis engine without user intervention. Incorrect or absent lang causes screen readers to mispronounce every word on the page, making content unusable for blind users. The passing state preserves this baseline. Extending to WCAG 3.1.2 (Language of Parts) closes the residual risk for multilingual segments — mispronounced foreign-language content breaks comprehension for screen reader users of those segments.
- **Seo:** The lang attribute on <html> is a direct input to browser auto-translation (Chrome Translate, Safari Reader). Correct language identification ensures translation prompts trigger for non-English visitors, expanding content reach without additional localization effort.
- **Legal:** WCAG 2.1 SC 3.1.1 is a Level A requirement. Maintaining this pass avoids the lowest-tier WCAG failure, which is the most commonly cited criterion in ADA web accessibility litigation. No corrective action is required — this proposal documents the guard to prevent regression.

## How to verify

**What to look for:** The <html> element has lang='en', which is a valid BCP 47 language tag.. This enables correct screen reader pronunciation and auto-translation for English content.

**Measured evidence:**
- Html Lang: en
- Bcp47 Valid: True

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
Maintain the passing lang='en' declaration on <html> and extend coverage to any inline multilingual content segments per WCAG 3.1.2 (Language of Parts, Level AA). No corrective action is required for the base declaration — this proposal documents the guard rail to prevent regression and closes the one residual risk identified in the finding.

### How
1. VERIFY BASE LAYOUT: Confirm that src/layouts/BaseLayout.astro (or equivalent root layout) is the single source of the <html lang='en'> declaration. If multiple layouts exist (e.g., BlogLayout.astro, LandingLayout.astro), confirm each either extends BaseLayout or independently declares lang.
2. AUDIT FOR MULTILINGUAL CONTENT: Search the codebase for any non-English text segments — French, Spanish, or other language strings in .astro components, MDX files, or content collections. Run: grep -rn --include='*.astro' --include='*.mdx' --include='*.md' -E '[À-ÿ]|[¡-ÿ]' src/ to surface non-ASCII Latin characters as a proxy for non-English content.
3. IF MULTILINGUAL SEGMENTS EXIST: Wrap each non-English segment in a containing element with the correct BCP 47 lang attribute (e.g., lang='fr', lang='es'). Apply to the tightest containing element — a <span> for inline, a <p> or <section> for block content.
4. IF NO MULTILINGUAL SEGMENTS EXIST: No code change required. Document the passing state in the audit log and add the ESLint/Astro check below to prevent future regression.
5. ADD REGRESSION GUARD: Install eslint-plugin-jsx-a11y (already a peer dep of @astrojs/check) and enable the lang rule in eslint.config.mjs to catch any future <html> element emitted without a lang attribute in Astro component output.

### Code examples
```
// src/layouts/BaseLayout.astro — verified passing state, no change required
// This is the single authoritative source of lang='en'.
// All other layouts must extend this component, not redeclare <html>.
---
interface Props {
  title: string;
  description?: string;
  // SITE-SPECIFIC ASSUMPTION: lang defaults to 'en'.
  // Override per-page for multilingual routes by passing lang prop.
  lang?: string;
}

const {
  title,
  description = '',
  lang = 'en', // Named constant: BCP 47 language tag for the document
} = Astro.props;
---
<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
// WCAG 3.1.2 — Language of Parts: wrap non-English inline segments.
// Apply only if multilingual content exists in the codebase.
// SITE-SPECIFIC ASSUMPTION: French testimonial segment example.
---
// No imports needed — pure HTML in Astro template
---
<section>
  <blockquote lang="fr">
    <!-- lang='fr' scoped to this element only; does not affect surrounding English content -->
    <p>"Ce produit a changé ma façon de travailler."</p>
    <cite>— Marie Dupont</cite>
  </blockquote>
</section>
// eslint.config.mjs — regression guard for lang attribute
// Requires: npm install -D eslint eslint-plugin-jsx-a11y
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // Enforces lang attribute presence on <html> elements in JSX/Astro output.
      // 'error' not 'warn' — a missing lang is a WCAG Level A failure.
      'jsx-a11y/html-has-lang': 'error',
    },
    // SITE-SPECIFIC ASSUMPTION: adjust glob if Astro files live outside src/
    files: ['src/**/*.astro', 'src/**/*.tsx', 'src/**/*.jsx'],
  },
];
```

## Risks
- If a second layout file independently declares <html lang='en'> as a hardcoded string (not via prop), adding a lang prop to BaseLayout will not propagate to that layout — the audit step 1 grep is required to catch this before assuming single-source coverage.
- The eslint-plugin-jsx-a11y html-has-lang rule evaluates JSX/TSX syntax. Astro's .astro file format uses a superset of HTML, not JSX. The rule will catch violations in .tsx island components but may not parse raw .astro template sections depending on the eslint-plugin-astro version. Verify rule fires correctly by temporarily removing lang from a test component and running eslint src/ -- if no error surfaces, add a custom Astro check or rely on @astrojs/check type-checking instead.
- Passing lang='en' as a prop opens the door to a page-level override being set incorrectly (e.g., lang='english' instead of BCP 47 'en'). If the prop pattern is adopted, add a runtime assertion or TypeScript union type restricting valid values to known BCP 47 tags for the site's supported languages.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
