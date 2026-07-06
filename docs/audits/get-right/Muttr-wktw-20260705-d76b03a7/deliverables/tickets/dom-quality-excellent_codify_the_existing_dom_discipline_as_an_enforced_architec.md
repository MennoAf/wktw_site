---
finding_id: "dom-quality-excellent"
title: "DOM is lean and well-structured — ~142-146 elements, semantic HTML — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Enforcing a single <h1> and no skipped heading levels across all templates preserves the heading signal clarity that search crawlers use to understand page topic hierarchy."
fix_summary: "Codify the existing DOM discipline as an enforced architectural baseline — automated CI gates, a reusable Astro layout contract, and a DOM audit utility — so this clean state is preserved as the site…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# DOM is lean and well-structured — ~142-146 elements, semantic HTML — PASS

**Finding:** DOM is lean and well-structured — ~142-146 elements, semantic HTML — PASS  
**Severity:** Low  
**Why this matters:** Enforcing a single <h1> and no skipped heading levels across all templates preserves the heading signal clarity that search crawlers use to understand page topic hierarchy.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Codify the existing DOM discipline as an enforced architectural baseline — automated CI gates, a reusable Astro layout contract, and a DOM audit utility — so this clean state is preserved as the site…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Seo:** Enforcing a single <h1> and no skipped heading levels across all templates preserves the heading signal clarity that search crawlers use to understand page topic hierarchy. Drift from this baseline on other templates would dilute topical authority; the CI gate prevents that drift.
- **Core Web Vitals:** The DOM element ceiling (1500) enforced in CI directly prevents the DOM size growth that causes Lighthouse to flag 'Avoid an excessive DOM size' — large DOMs increase memory usage, cause longer style recalculations, and produce costly layout reflows. Keeping all templates at or near the current 142-146 element baseline eliminates this class of performance regression before it reaches production.
- **Accessibility Legal:** Automated enforcement of skip-link target resolution, single <h1>, no duplicate unlabelled landmarks, and no heading skips ensures WCAG 2.1 AA compliance is maintained as the site grows. ADA web accessibility lawsuits are well-documented; a CI gate that catches regressions before deployment is a materially lower-risk posture than post-launch remediation.
- **Developer Velocity:** Catching DOM contract violations in CI (seconds per PR) is orders of magnitude cheaper than discovering them in a post-launch audit. The written ARCHITECTURE.md contract reduces onboarding ambiguity for contributors unfamiliar with the site's structural standards.

## How to verify

**What to look for:** The DOM contains only 146 elements, well under the 1500-node threshold.. Heading hierarchy is correct: h1 → h2 → h2 → h2 → h2 → h3 → h3 (no skipped levels, single h1).

- `!important` declarations: **2** (68 total CSS rules)
  - DevTools **Console** → run:
   `document.querySelectorAll('style').length` and search stylesheets for `!important`. In **Elements** → **Computed** tab, look for properties with `!important` overrides (shown with strikethrough).

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
Codify the existing DOM discipline as an enforced architectural baseline — automated CI gates, a reusable Astro layout contract, and a DOM audit utility — so this clean state is preserved as the site scales rather than eroded by future template additions or third-party script integrations.

### How
1. Extract the structural invariants from this passing template into a named Astro base layout (BaseLayout.astro) that enforces: single <main id='main-cont'>, skip-link as first focusable child of <body>, no inline style attributes, semantic landmark order (header → main → footer). All page templates must extend this layout.
2. Write a Playwright DOM audit script (scripts/audit-dom.ts) that runs in CI on every PR. It asserts: total element count < 1500, zero duplicate landmark roles without aria-label, zero inline style attributes, single <h1>, no skipped heading levels, skip-link href resolves to an existing id in the DOM. Fail the build if any assertion fails.
3. Add a Content Security Policy header in netlify.toml that blocks inline styles at the HTTP layer (style-src 'self' — no 'unsafe-inline'). This makes inline style injection a hard browser-enforced failure, not just a lint warning, and prevents third-party scripts from injecting inline styles that would erode the zero-inline-style invariant.
4. Document the DOM contract in a ARCHITECTURE.md file at repo root. Record: target element count ceiling (1500), heading hierarchy rule, landmark requirements, skip-link requirement, inline style prohibition. This gives future contributors a written standard to check against before merging.
5. Tag this page template's component file with a JSDoc comment block (see code example) so the audit script can identify it as the canonical reference template when diffing other templates against the baseline.

### Code examples
```
// src/layouts/BaseLayout.astro
// SITE-SPECIFIC ASSUMPTION: #main-cont is the established skip-link target id.
// If the site's skip-link target changes, update SKIP_LINK_TARGET_ID and the
// corresponding id attribute on <main> in lockstep.
---
const SKIP_LINK_TARGET_ID = 'main-cont' as const;

interface Props {
  title: string;
  description: string;
  canonicalUrl: string;
}

const { title, description, canonicalUrl } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />
  </head>
  <body>
    {/* Skip link MUST be the first focusable element in <body>.
        Do not insert any focusable element above this line. */}
    <a href={`#${SKIP_LINK_TARGET_ID}`} class="skip-link">
      Skip to main content
    </a>
    <header role="banner">
      <slot name="header" />
    </header>
    <main id={SKIP_LINK_TARGET_ID}>
      <slot />
    </main>
    <footer role="contentinfo">
      <slot name="footer" />
    </footer>
  </body>
</html>

<style>
  /* Scoped to .skip-link only — no broad element selectors */
  .skip-link {
    position: absolute;
    top: -9999px;
    left: 0;
    z-index: 9999;
    padding: 0.5rem 1rem;
    background: #000;
    color: #fff;
    font-size: 1rem;
    text-decoration: none;
  }
  .skip-link:focus {
    top: 0;
  }
</style>
// scripts/audit-dom.ts
// Run via: npx playwright test scripts/audit-dom.ts
// Requires: @playwright/test installed, site running locally or against preview URL.
//
// SITE-SPECIFIC ASSUMPTIONS — adjust these constants before running:
// - AUDIT_BASE_URL: set to local dev server or Netlify preview URL
// - PAGES_TO_AUDIT: add every distinct page template that exists on the site
// - MAX_DOM_ELEMENTS: 1500 is the W3C/Lighthouse recommended ceiling
// - SKIP_LINK_TARGET_ID: must match the id on <main> in BaseLayout.astro

import { test, expect, type Page } from '@playwright/test';

const AUDIT_BASE_URL = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';
const MAX_DOM_ELEMENTS = 1500 as const; // W3C/Lighthouse DOM size threshold
const SKIP_LINK_TARGET_ID = 'main-cont' as const;
const MAX_HEADING_SKIP = 1 as const; // h1→h3 without h2 = skip of 1 level

// SITE-SPECIFIC: enumerate one URL per distinct page template
const PAGES_TO_AUDIT: ReadonlyArray<{ label: string; path: string }> = [
  { label: 'Home', path: '/' },
  { label: 'Article', path: '/blog/example-post' },
  { label: 'Product', path: '/products/example' },
] as const;

async function getDomElementCount(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelectorAll('*').length);
}

async function getInlineStyleCount(page: Page): Promise<number> {
  return page.evaluate(
    () => document.querySelectorAll('[style]').length
  );
}

async function getH1Count(page: Page): Promise<number> {
  return page.evaluate(
    () => document.querySelectorAll('h1').length
  );
}

async function getHeadingLevels(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(
      (el) => parseInt(el.tagName.replace('H', ''), 10)
    )
  );
}

async function skipLinkTargetExists(page: Page, targetId: string): Promise<boolean> {
  return page.evaluate(
    (id) => document.getElementById(id) !== null,
    targetId
  );
}

async function getDuplicateUnlabelledLandmarks(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const LANDMARK_SELECTORS = [
      'nav', 'header', 'footer', 'main', 'aside', 'section',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '[role="main"]', '[role="complementary"]', '[role="region"]',
    ] as const;
    const counts: Record<string, number> = {};
    for (const sel of LANDMARK_SELECTORS) {
      const els = Array.from(document.querySelectorAll(sel));
      // Only flag duplicates that lack distinguishing aria-label/aria-labelledby
      const unlabelled = els.filter(
        (el) => !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')
      );
      if (unlabelled.length > 1) counts[sel] = unlabelled.length;
    }
    return Object.entries(counts).map(([sel, n]) => `${sel} × ${n}`);
  });
}

function detectHeadingSkips(levels: number[]): string[] {
  const violations: string[] = [];
  for (let i = 1; i < levels.length; i++) {
    const gap = levels[i] - levels[i - 1];
    if (gap > MAX_HEADING_SKIP) {
      violations.push(`h${levels[i - 1]} → h${levels[i]} (skipped ${gap - 1} level(s))`);
    }
  }
  return violations;
}

for (const { label, path } of PAGES_TO_AUDIT) {
  test(`DOM contract: ${label} (${path})`, async ({ page }) => {
    await page.goto(`${AUDIT_BASE_URL}${path}`, { waitUntil: 'networkidle' });

    const elementCount = await getDomElementCount(page);
    expect(
      elementCount,
      `[${label}] DOM element count ${elementCount} exceeds ceiling of ${MAX_DOM_ELEMENTS}`
    ).toBeLessThanOrEqual(MAX_DOM_ELEMENTS);

    const inlineStyleCount = await getInlineStyleCount(page);
    expect(
      inlineStyleCount,
      `[${label}] Found ${inlineStyleCount} element(s) with inline style attributes — prohibited by DOM contract`
    ).toBe(0);

    const h1Count = await getH1Count(page);
    expect(
      h1Count,
      `[${label}] Expected exactly 1 <h1>, found ${h1Count}`
    ).toBe(1);

    const headingLevels = await getHeadingLevels(page);
    const headingSkips = detectHeadingSkips(headingLevels);
    expect(
      headingSkips,
      `[${label}] Heading hierarchy violations: ${headingSkips.join(', ')}`
    ).toHaveLength(0);

    const skipLinkOk = await skipLinkTargetExists(page, SKIP_LINK_TARGET_ID);
    expect(
      skipLinkOk,
      `[${label}] Skip-link target #${SKIP_LINK_TARGET_ID} not found in DOM`
    ).toBe(true);

    const duplicateLandmarks = await getDuplicateUnlabelledLandmarks(page);
    expect(
      duplicateLandmarks,
      `[${label}] Duplicate unlabelled landmarks: ${duplicateLandmarks.join(', ')}`
    ).toHaveLength(0);
  });
}
# netlify.toml
# SITE-SPECIFIC ASSUMPTION: adjust style-src if a specific self-hosted font CDN
# or analytics script legitimately requires inline styles. Document each exception.
# Do NOT add 'unsafe-inline' to style-src — that negates the entire invariant.

[[headers]]
  for = "/*"
  [headers.values]
    # Blocks inline style injection at the browser layer.
    # 'nonce-...' can be added per-request via Netlify Edge Functions if
    # a specific inline style is unavoidable (e.g., critical CSS inlining).
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

## Risks
- CSP style-src 'self' without 'unsafe-inline' will break any third-party script or analytics tag that injects inline styles (e.g., Google Tag Manager, chat widgets, A/B testing tools). Mitigation: audit all active third-party scripts for inline style injection before deploying the CSP header. Use Netlify Edge Functions to inject per-request nonces for any legitimate inline style that cannot be refactored to a stylesheet.
- The Playwright audit script uses waitUntil: 'networkidle' which can time out on pages with long-polling or persistent WebSocket connections. Mitigation: replace with waitUntil: 'domcontentloaded' plus an explicit page.waitForSelector on a known stable element if networkidle proves unreliable in CI.
- PAGES_TO_AUDIT is a static list — new page templates added to the site will not be audited until manually added to the array. Mitigation: add a CI step that diffs the Astro src/pages directory against the audit list and fails if unregistered page templates are detected.
- The MAX_DOM_ELEMENTS ceiling of 1500 is appropriate for simple page templates but may be legitimately exceeded by complex application pages (e.g., a data table, a filterable product grid). Mitigation: the audit script accepts per-page overrides via a config object rather than a single global constant — implement this before adding complex templates to the audit list.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
