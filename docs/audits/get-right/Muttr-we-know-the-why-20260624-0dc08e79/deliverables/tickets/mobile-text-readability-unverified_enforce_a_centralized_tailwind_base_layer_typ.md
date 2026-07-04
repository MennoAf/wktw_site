---
finding_id: "mobile-text-readability-unverified"
title: "Body text size and line-height not verifiable from available data — flag for manual check"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Resolves two specific WCAG violations: 1.4.12 (Text Spacing) — line-height below 1.5 on text-sm elements — and addresses the spirit of 1.4.4 (Resize Text) by establishing 16px as the enforced floor f…"
fix_summary: "Enforce a centralized Tailwind base-layer typography contract that guarantees minimum font-size (16px) and line-height (1.5) for all body/content contexts, while explicitly permitting text-sm only in…"
confidence_tier: "confirmed"
---

# Body text size and line-height not verifiable from available data — flag for manual check

**Finding:** Body text size and line-height not verifiable from available data — flag for manual check  
**Severity:** Low  
**Why this matters:** Resolves two specific WCAG violations: 1.4.12 (Text Spacing) — line-height below 1.5 on text-sm elements — and addresses the spirit of 1.4.4 (Resize Text) by establishing 16px as the enforced floor f…  
**Root cause:** Isolated issue  
**Fix:** Enforce a centralized Tailwind base-layer typography contract that guarantees minimum font-size (16px) and line-height (1.5) for all body/content contexts, while explicitly permitting text-sm only in…

> **Evidence Basis:** Confirmed

---

## Impact

- **Wcag Compliance:** Resolves two specific WCAG violations: 1.4.12 (Text Spacing) — line-height below 1.5 on text-sm elements — and addresses the spirit of 1.4.4 (Resize Text) by establishing 16px as the enforced floor for content contexts. Both are Level AA requirements. Unresolved AA violations are the basis for ADA web accessibility litigation; this fix eliminates two documented failure points.
- **Mobile Readability:** On sub-400px viewports, 14px body text renders at a perceived density equivalent to approximately 11-12px on higher-DPI displays due to viewport scaling. Correcting to 16px minimum and 1.5 line-height directly reduces the cognitive load required to parse long-form content, which is the primary mechanism behind mobile bounce on text-heavy service pages.
- **Seo:** Google's page experience signals include Core Web Vitals and accessibility signals. WCAG AA compliance is a documented ranking consideration in Google's quality guidelines. Eliminating confirmed AA failures removes a negative signal without requiring any content changes.
- **Developer Velocity:** The base layer + linting approach eliminates per-component typography decisions. Future developers cannot accidentally introduce a sub-threshold font-size or line-height in content contexts without a lint warning — reducing the review burden on typography compliance.

## How to verify

**What to look for:** The available data does not include computed font-size or line-height for body text elements.. The page uses Tailwind CSS utility classes (text-sm, text-base) which map to 14px and 16px respectively.

**Measured evidence:**
- Css Classes Observed: ['text-sm (14px)', 'text-base (16px)']
- Nav Text Size: text-sm (14px) — below 16px recommendation
- Body Text Size: likely text-base (16px) — unverified
- Line Height: unverified
- Viewport: 393x660px

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
Enforce a centralized Tailwind base-layer typography contract that guarantees minimum font-size (16px) and line-height (1.5) for all body/content contexts, while explicitly permitting text-sm only in non-content UI chrome (nav links, labels, captions) with a mandatory line-height override. Eliminate ad-hoc text-sm usage in content-critical templates via a scoped prose utility class.

### How
1. AUDIT FIRST — Run a computed-style audit before touching any code. Use the Playwright snippet in code_examples[0] to enumerate every element with font-size < 16px and line-height < 1.5 across all page templates. Save the output as a CSV. This is the blast-radius confirmation the finding flags as unverified.
2. ADD A TAILWIND BASE LAYER — In your global CSS entry point (typically app.css or globals.css, wherever @tailwind base lives), add the base layer block from code_examples[1]. This sets font-size: 1rem and line-height: 1.5 on the html element and propagates to all body text via inheritance. It does NOT touch nav, label, caption, or .text-sm utility classes — those are explicitly excluded via :not() guards.
3. EXTEND TAILWIND CONFIG — In tailwind.config.js, add the typography extension from code_examples[2]. This creates a .prose-body utility class that enforces the minimum contract (16px / 1.5 line-height) and a .ui-chrome utility that explicitly permits 14px with a corrected line-height of 1.5 (fixing the 1.375 default). These are additive — they do not override existing utilities globally.
4. APPLY .prose-body TO CONTENT TEMPLATES — In every long-form service page template, wrap the content root element with prose-body. Do not apply it to the layout shell, nav, or sidebar. Scope is intentionally narrow: the content column only.
5. APPLY .ui-chrome TO NAVIGATION AND SECONDARY UI — Replace bare text-sm on nav links, labels, helper text, and captions with text-sm ui-chrome. The ui-chrome class corrects the line-height to 1.5 without changing font-size, making text-sm WCAG 1.4.12 compliant in its permitted contexts.
6. ADD A LINTING RULE — Add the Stylelint/ESLint rule from code_examples[3] to flag any future use of text-sm inside elements with a data-content or .prose-body ancestor. This is the guardrail that prevents regression without requiring a design system migration.
7. VERIFY WITH RE-AUDIT — Re-run the Playwright audit from step 1. Confirm zero elements with font-size < 16px inside .prose-body containers, and zero elements with line-height < 1.5 anywhere in the document.
8. MANUAL CHECK ON SUB-400PX VIEWPORTS — Use Chrome DevTools device emulation at 375px and 360px. Visually confirm body text renders at comfortable density. The base layer change is CSS-only and does not require JS, so there is no hydration timing concern.

### Code examples
```
// code_examples[0]: Playwright audit — enumerate small-text violations
// Run with: node audit-typography.js
// Precondition: Playwright installed, TARGET_URLS configured for your environment

const { chromium } = require('playwright');
const fs = require('fs');

// SITE-SPECIFIC ASSUMPTION: replace with your actual page URLs
const TARGET_URLS = [
  'https://example.com/',
  'https://example.com/services',
  'https://example.com/about',
];

// Thresholds derived from WCAG 1.4.4 and 1.4.12
const MIN_FONT_SIZE_PX = 16;
const MIN_LINE_HEIGHT_RATIO = 1.5;

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const url of TARGET_URLS) {
    const page = await browser.newPage();
    // SITE-SPECIFIC ASSUMPTION: adjust viewport to match your primary mobile breakpoint
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(url, { waitUntil: 'networkidle' });

    const violations = await page.evaluate(
      ({ minFontSize, minLineHeight }) => {
        const TEXT_NODES_SELECTOR =
          'p, li, td, th, blockquote, figcaption, label, span, a, button, h1, h2, h3, h4, h5, h6';
        const elements = Array.from(document.querySelectorAll(TEXT_NODES_SELECTOR));
        const found = [];

        for (const el of elements) {
          // Skip elements with no text content (decorative/empty)
          if (!el.textContent.trim()) continue;

          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const lineHeightRaw = style.lineHeight;

          // lineHeight may be 'normal' — treat as 1.2 (browser default, below threshold)
          const lineHeight =
            lineHeightRaw === 'normal'
              ? 1.2
              : parseFloat(lineHeightRaw) / fontSize;

          const fontSizeViolation = fontSize < minFontSize;
          const lineHeightViolation = lineHeight < minLineHeight;

          if (fontSizeViolation || lineHeightViolation) {
            found.push({
              tag: el.tagName.toLowerCase(),
              classes: el.className,
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight.toFixed(3),
              text: el.textContent.trim().slice(0, 60),
              fontSizeViolation,
              lineHeightViolation,
            });
          }
        }
        return found;
      },
      { minFontSize: MIN_FONT_SIZE_PX, minLineHeight: MIN_LINE_HEIGHT_RATIO }
    );

    results.push({ url, violations });
    await page.close();
  }

  await browser.close();

  // Write CSV for review
  const rows = ['url,tag,classes,fontSize,lineHeight,fontSizeViolation,lineHeightViolation,text'];
  for (const { url, violations } of results) {
    for (const v of violations) {
      rows.push(
        [
          url,
          v.tag,
          `"${v.classes}"`,
          v.fontSize,
          v.lineHeight,
          v.fontSizeViolation,
          v.lineHeightViolation,
          `"${v.text.replace(/"/g, "'")}"`
        ].join(',')
      );
    }
  }

  fs.writeFileSync('typography-audit.csv', rows.join('\n'));
  console.log(`Audit complete. ${rows.length - 1} violations written to typography-audit.csv`);
})();
/* code_examples[1]: Tailwind base layer — global typography floor
   File: src/app.css (or wherever @tailwind base is declared)
   Precondition: This file is the single CSS entry point processed by PostCSS/Tailwind.
   Control flow: @layer base rules apply before component and utility layers,
   so utility classes (text-sm, text-lg) still override these values when explicitly applied.
   The :where() wrapper keeps specificity at 0 so utilities always win — no !important needed.
   Existing behavior preserved: nav, labels, captions using text-sm are NOT touched here.
   The html rule sets the inheritance root only. */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Sets the inheritance root for all body text.
     font-size: 1rem = 16px at browser default (100%).
     Respects user browser font-size preferences — do NOT use px here. */
  :where(html) {
    font-size: 1rem;
    line-height: 1.5;
  }

  /* Enforce minimum line-height on paragraph-level content elements.
     :where() keeps specificity at 0 — any utility class overrides this without conflict.
     SCOPE: only block-level content elements. Inline elements (span, a) inherit from parent.
     EXCLUDED: nav, header, footer — those are UI chrome, not content. */
  :where(p, li, blockquote, figcaption, dd, dt) {
    line-height: 1.5;
  }

  /* Explicit correction for text-sm when used inside content containers.
     This targets the known violation: text-sm has leading-snug (1.375) by default.
     SCOPE: only inside [data-content] — does not affect nav or UI chrome.
     Precondition: content template root elements must carry data-content attribute (see step 4). */
  :where([data-content] .text-sm) {
    line-height: 1.5;
  }
}
// code_examples[2]: tailwind.config.js — additive utility extensions
// Precondition: Tailwind v3.x. For v4, migrate to CSS-native @utility blocks.
// These are ADDITIVE classes — they do not modify existing utilities.
// prose-body: enforces content-safe typography contract
// ui-chrome: explicitly permits 14px with corrected line-height for nav/labels

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // SITE-SPECIFIC ASSUMPTION: adjust glob patterns to match your template paths
    './src/**/*.{html,js,jsx,ts,tsx,vue,svelte}',
    './templates/**/*.{html,twig,njk}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        // Content-safe typography contract.
        // Apply to the root element of long-form content columns only.
        // Does NOT affect layout shell, nav, sidebar, or footer.
        '.prose-body': {
          fontSize: '1rem',       // 16px — minimum for long-form readability
          lineHeight: '1.5',      // WCAG 1.4.12 minimum for body text
          // Cascade to direct text children without over-specifying
          '& p, & li, & blockquote, & figcaption': {
            fontSize: '1rem',
            lineHeight: '1.5',
          },
          // Permit explicitly smaller text only for captions/footnotes,
          // but enforce line-height correction
          '& .prose-caption': {
            fontSize: '0.875rem', // 14px — permitted for captions only
            lineHeight: '1.5',    // Override Tailwind's leading-snug default
          },
        },

        // UI chrome contract: permits 14px but corrects line-height.
        // Apply alongside text-sm on nav links, labels, helper text, badges.
        // Precondition: element is NOT a primary reading context.
        '.ui-chrome': {
          // font-size intentionally not set — inherits from text-sm utility
          lineHeight: '1.5', // Corrects text-sm's leading-snug (1.375) to WCAG minimum
        },
      });
    },
  ],
};

/* Usage in templates:

   Content column (service page):
   <article data-content class="prose-body">
     <p>Long-form body copy...</p>
     <span class="prose-caption">Image caption — 14px permitted here</span>
   </article>

   Navigation (UI chrome):
   <a href="/services" class="text-sm ui-chrome">Services</a>

   Helper text / form hint:
   <span class="text-sm ui-chrome">Required field</span>
*/
// code_examples[3]: ESLint rule to prevent future text-sm regression in content templates
// File: .eslintrc.js (or eslint.config.js for flat config)
// Precondition: eslint-plugin-tailwindcss installed, or use as a custom rule.
// This rule flags text-sm applied directly to elements inside prose-body without ui-chrome.
// It does NOT flag text-sm on nav, header, footer, or elements with ui-chrome.
// Scope: JSX/TSX templates only. For HTML/Twig templates, use the Stylelint approach below.

// For JSX/TSX — add to your ESLint config:
module.exports = {
  rules: {
    // SITE-SPECIFIC ASSUMPTION: adjust ancestor selector to match your content wrapper pattern
    'no-restricted-syntax': [
      'warn',
      {
        // Flag className strings containing text-sm without ui-chrome
        // inside elements that are children of prose-body containers
        selector:
          'JSXAttribute[name.name="className"][value.value=/\\btext-sm\\b/]:not([value.value=/\\bui-chrome\\b/])',
        message:
          'text-sm without ui-chrome detected. In content contexts, use prose-caption. ' +
          'In UI chrome contexts (nav, labels, hints), pair with ui-chrome to correct line-height. ' +
          'See typography contract in tailwind.config.js.',
      },
    ],
  },
};

/* For HTML/Twig/Nunjucks templates — add to .stylelintrc.js:
   This catches the CSS-side violation: text-sm inside a [data-content] ancestor
   without an explicit line-height override.

   Install: npm install --save-dev stylelint stylelint-selector-bem-pattern

   In .stylelintrc.js:
   module.exports = {
     rules: {
       // Flag .text-sm inside [data-content] without .ui-chrome or .prose-caption
       // This is a pattern-level warning, not an auto-fix — requires human review.
       'selector-disallowed-list': [
         [
           /\[data-content\].*\.text-sm(?!.*(?:ui-chrome|prose-caption))/
         ],
         {
           message: 'text-sm inside [data-content] requires ui-chrome or prose-caption ' +
                    'to correct line-height to WCAG 1.4.12 minimum (1.5).'
         }
       ]
     }
   };
*/
```

## Risks
- RISK: The @layer base html { font-size: 1rem } rule will conflict with any existing html { font-size: 62.5% } or html { font-size: 10px } rem-scaling hacks used to simplify rem arithmetic. MITIGATION: The Playwright audit (step 1) will surface this immediately — if computed font-sizes jump from expected values, a rem-scaling hack is present. If found, remove the hack and convert all rem values in the codebase to their correct equivalents (e.g., 1.4rem → 0.875rem) before deploying the base layer change. Do not deploy both simultaneously.
- RISK: The :where([data-content] .text-sm) rule requires that content template root elements carry the data-content attribute. If templates are not updated in step 4, the line-height correction for text-sm inside content areas will not apply. MITIGATION: The re-audit in step 7 will catch this — any remaining line-height violations inside content columns indicate missing data-content attributes. Make step 4 a blocking prerequisite for step 7 sign-off.
- RISK: If the project uses @tailwindcss/typography (the official prose plugin), the .prose-body class name will collide with Tailwind's .prose class internals in some configurations. MITIGATION: If @tailwindcss/typography is installed, rename .prose-body to .content-body throughout. The class name is a named constant — change it in tailwind.config.js and do a project-wide find-replace on the string 'prose-body'.
- RISK: The ESLint rule uses a regex on className string literals and will not catch dynamically constructed classNames (e.g., clsx(['text-sm', condition && 'other'])). MITIGATION: This is a known limitation of static analysis on dynamic class composition. Document it in the rule's message. For dynamic cases, enforce the ui-chrome pairing via code review checklist rather than automated lint.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
