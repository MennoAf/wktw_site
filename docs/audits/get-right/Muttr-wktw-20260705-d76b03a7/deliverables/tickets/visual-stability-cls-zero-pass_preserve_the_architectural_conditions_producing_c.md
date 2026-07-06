---
finding_id: "visual-stability-cls-zero-pass"
title: "CLS at 0.000 — no layout shifts detected — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "No change required — CLS 0.000 is already optimal."
fix_summary: "Preserve the architectural conditions producing CLS 0.000 on this text-only template, and extend equivalent CLS discipline to page types that do not inherit these conditions (product pages, listing g…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# CLS at 0.000 — no layout shifts detected — PASS

**Finding:** CLS at 0.000 — no layout shifts detected — PASS  
**Severity:** Low  
**Why this matters:** No change required — CLS 0.000 is already optimal.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Preserve the architectural conditions producing CLS 0.000 on this text-only template, and extend equivalent CLS discipline to page types that do not inherit these conditions (product pages, listing g…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Cls Stability (Text-Only Template):** No change required — CLS 0.000 is already optimal. This proposal prevents regression as the site grows.
- **Cls On Dynamic Templates:** Font metrics overrides eliminate the dimensional mismatch between fallback and web font, removing the primary remaining CLS vector on templates that do add images or dynamic content. The ReservedSlot wrapper prevents consent banners and JS-injected elements from shifting page content after first paint.
- **Search Ranking:** Google uses CLS as a Core Web Vitals ranking signal. Maintaining CLS in the 'Good' band (≤0.1) across all page types preserves ranking eligibility. Allowing CLS to degrade on product or listing pages as the site scales would move those templates into the 'Needs Improvement' or 'Poor' cohort, with a direct documented effect on search visibility.
- **Ci Regression Gate:** The Playwright gate catches CLS regressions before they reach production, eliminating the lag between a bad deploy and a manual audit discovery.

## How to verify

**What to look for:** CLS is measured at 0.000, which is perfect.. This is expected for a text-only page with no images, no dynamic content injection, no ads, and font-display: swap with preloaded fonts (minimizing FOUT-induced reflow).

**Measured evidence:**
- Cls Score: 0.0
- Threshold Good: 0.1
- Images: 0
- Js Injected Elements: 0
- Content In Raw Html Percent: 100
- Dom Elements: 142
- Font Display: swap with preloads
- Dynamic Content: False

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
Preserve the architectural conditions producing CLS 0.000 on this text-only template, and extend equivalent CLS discipline to page types that do not inherit these conditions (product pages, listing grids, hero image pages, JS-injected banner/consent overlay pages).

### How
1. CODIFY THE PASSING CONDITIONS AS AN ASTRO BASE LAYOUT CONSTRAINT: Document the four structural invariants (no images/iframes/ads without explicit dimensions, font preload + font-display:swap, no JS-injected structural elements, DOM ≤ 1500 nodes) in a shared BaseLayout.astro comment block so future contributors understand what must not be broken.
2. ADD A FONT METRICS OVERRIDE TO ELIMINATE FOUT-INDUCED MICRO-SHIFTS ON OTHER TEMPLATES: The current pass relies on fallback/web font metric proximity. Formalize this with @font-face size-adjust, ascent-override, descent-override, and line-gap-override on the fallback stack so the swap is dimensionally neutral across all templates, not just this one.
3. ENFORCE EXPLICIT WIDTH/HEIGHT ON ALL MEDIA ELEMENTS SITE-WIDE: Any image, video, iframe, or embed added to non-text templates must carry width and height attributes (or CSS aspect-ratio) to reserve layout space before the asset loads. Add an Astro component wrapper (CLSSafeImage.astro) that enforces this contract and throws a build-time error if dimensions are absent.
4. GUARD AGAINST JS-INJECTED STRUCTURAL REFLOW ON DYNAMIC TEMPLATES: For pages with consent overlays, banners, or hydrated components, use CSS containment (contain: layout) on the injection target and pre-reserve the slot height via min-height so the injected element does not push content.
5. ADD A CLS REGRESSION GATE TO CI: Use Playwright + web-vitals to measure CLS on the text-only template and at least one dynamic template on every deploy. Fail the build if CLS exceeds 0.05 (Google 'Good' threshold) on any audited route.

### Code examples
```
// src/layouts/BaseLayout.astro
// CLS INVARIANTS — do not remove without audit:
// 1. All <img> must have width + height or aspect-ratio (see CLSSafeImage.astro)
// 2. No JS-injected structural elements (<nav>, <header>, <main>, <footer>) outside of pre-reserved slots
// 3. Font preload + font-display:swap on every critical web font
// 4. DOM target: ≤ 1500 nodes per page
---
const { title, description } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />

    <!-- FONT PRELOAD: crossorigin required — omitting causes double-fetch -->
    <!-- SITE-SPECIFIC: update href to match your actual font file path in /public/fonts/ -->
    <link
      rel="preload"
      href="/fonts/primary-regular.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  /*
   * FONT METRICS OVERRIDE
   * Purpose: make the system fallback font dimensionally match the web font
   * so the font-display:swap does not shift layout on any template.
   *
   * SITE-SPECIFIC: these values are calibrated for Inter → system-ui fallback.
   * Recalibrate using https://screenspan.net/fallback if you change the web font.
   * Methodology: adjust size-adjust until a paragraph of text occupies the same
   * pixel height in both the fallback and the loaded web font.
   */
  @font-face {
    font-family: 'PrimaryFallback';
    src: local('system-ui'), local('-apple-system'), local('BlinkMacSystemFont');
    font-display: swap;
    /* Calibrated overrides — measure and adjust per font pairing */
    size-adjust: 100.6%;
    ascent-override: 92%;
    descent-override: 23%;
    line-gap-override: 0%;
  }

  :root {
    /* SITE-SPECIFIC: update font stack to match your chosen web font */
    font-family: 'YourWebFont', 'PrimaryFallback', system-ui, sans-serif;
  }
</style>
// src/components/CLSSafeImage.astro
// Drop-in replacement for <img> on any template.
// Enforces the width+height contract that prevents CLS from image load.
// Build-time error if width or height is missing — catches violations before deploy.
---
interface Props {
  src: string;
  alt: string;
  width: number;   // intrinsic pixel width of the source image
  height: number;  // intrinsic pixel height of the source image
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
  class?: string;
}

const {
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  fetchpriority = 'auto',
  class: className,
} = Astro.props;

// Build-time guard: missing dimensions = guaranteed CLS
if (!width || !height) {
  throw new Error(
    `CLSSafeImage: 'width' and 'height' are required on <CLSSafeImage src="${src}" />. ` +
    'Omitting them removes the browser\'s ability to reserve layout space before the image loads, causing CLS.'
  );
}
---
<img
  src={src}
  alt={alt}
  width={width}
  height={height}
  loading={loading}
  fetchpriority={fetchpriority}
  class={className}
/>

<style>
  img {
    /* aspect-ratio derived from explicit width/height prevents CLS
       even when CSS resizes the image responsively */
    max-width: 100%;
    height: auto;
  }
</style>
// src/components/ReservedSlot.astro
// Use this wrapper for any JS-injected or hydrated structural element
// (consent banners, announcement bars, dynamic nav items).
// Pre-reserves the layout space so injection does not shift content.
---
interface Props {
  // SITE-SPECIFIC: set minHeight to the known rendered height of the injected element.
  // Measure in px from DevTools after the element renders. Use rem if the element
  // scales with font size. Do NOT use a time-based approach — measure the real height.
  minHeight: string; // e.g. '56px' for a 56px banner
  id?: string;
  class?: string;
}

const { minHeight, id, class: className } = Astro.props;
---
<div
  id={id}
  class={className}
  style={`min-height: ${minHeight};`}
  aria-live="polite"
>
  <slot />
</div>

<style>
  div {
    /*
     * contain:layout isolates this subtree from the rest of the document layout.
     * Injected children cannot cause reflow outside this boundary.
     * Browser support: 95%+ (caniuse.com/css-containment)
     */
    contain: layout;
  }
</style>
// scripts/cls-regression.mjs
// Run via: node scripts/cls-regression.mjs
// Add to Netlify build: netlify.toml [build] command = "npm run build && node scripts/cls-regression.mjs"
// Requires: npm install -D playwright @web-vitals/attribution
//
// SITE-SPECIFIC: update ROUTES to cover your text-only template and
// at least one dynamic template (product page, listing grid).

import { chromium } from 'playwright';

// Named constants — no magic numbers
const CLS_GOOD_THRESHOLD = 0.05;       // Google Core Web Vitals 'Good' ceiling
const MEASUREMENT_WAIT_MS = 5000;      // Wait for layout to stabilize post-load
const VIEWPORT_DESKTOP = { width: 1280, height: 800 };
const VIEWPORT_MOBILE  = { width: 390, height: 844 };

// SITE-SPECIFIC: replace with your actual Netlify preview URL or localhost
const BASE_URL = process.env.DEPLOY_PRIME_URL ?? 'http://localhost:4321';

const ROUTES = [
  // SITE-SPECIFIC: add all page types that need CLS coverage
  { path: '/',              label: 'Home (text-only)',   viewport: VIEWPORT_DESKTOP },
  { path: '/',              label: 'Home (mobile)',       viewport: VIEWPORT_MOBILE  },
  // { path: '/products/example', label: 'Product page', viewport: VIEWPORT_DESKTOP },
];

async function measureCLS(page, url) {
  // Inject web-vitals CLS collector before navigation
  await page.addInitScript(() => {
    window.__clsValue = 0;
    // PerformanceObserver is universally supported in Chromium
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count shifts not caused by user input
        if (!entry.hadRecentInput) {
          window.__clsValue += entry.value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for post-load layout stabilization (fonts, lazy images, hydration)
  await page.waitForTimeout(MEASUREMENT_WAIT_MS);

  return page.evaluate(() => window.__clsValue ?? 0);
}

async function run() {
  const browser = await chromium.launch();
  const failures = [];

  for (const route of ROUTES) {
    const context = await browser.newContext({ viewport: route.viewport });
    const page = await context.newPage();

    let cls;
    try {
      cls = await measureCLS(page, `${BASE_URL}${route.path}`);
    } finally {
      await page.close();
      await context.close();
    }

    const passed = cls <= CLS_GOOD_THRESHOLD;
    console.log(`[CLS] ${route.label}: ${cls.toFixed(4)} — ${passed ? 'PASS' : 'FAIL'}`);

    if (!passed) {
      failures.push({ label: route.label, cls });
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error('\nCLS regression detected on:');
    failures.forEach(f => console.error(`  ${f.label}: ${f.cls.toFixed(4)} (threshold: ${CLS_GOOD_THRESHOLD})`));
    process.exit(1); // Fails Netlify build
  }

  console.log('\nAll CLS checks passed.');
}

run().catch((err) => {
  console.error('CLS regression script failed unexpectedly:', err);
  process.exit(1);
});
```

## Risks
- Font metrics overrides (size-adjust, ascent-override, descent-override) require calibration per font pairing. Incorrect values can make the fallback text larger or smaller than the web font, producing a visible reflow on slow connections. Mitigation: calibrate using https://screenspan.net/fallback and verify on a throttled (3G) connection before deploying.
- ReservedSlot min-height must match the actual rendered height of the injected element. If the injected element's height changes (e.g., a multi-line consent banner on narrow viewports), the reserved space will be wrong and CLS will occur. Mitigation: measure height at each breakpoint and use a responsive min-height or a ResizeObserver to adjust the slot dynamically — but note that ResizeObserver-driven height changes themselves can cause CLS if not handled carefully; prefer measuring and hardcoding per breakpoint.
- The CLS regression script uses page.waitForTimeout(5000) as a stabilization wait. On very slow CI runners or pages with long-running hydration, 5000ms may be insufficient. Mitigation: increase MEASUREMENT_WAIT_MS if false negatives appear in CI, or supplement with a MutationObserver-based idle detection.
- CLSSafeImage.astro throws a build-time error for missing dimensions. This will break builds for any existing <img> usage that has not been migrated. Mitigation: migrate existing images before switching to CLSSafeImage, or add a non-throwing warning mode during the migration window by replacing throw with console.warn and a process.env.CLS_STRICT flag.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
