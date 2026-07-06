---
finding_id: "ghost-markup-no-orphaned-assets"
title: "No orphaned CSS detected — 100% CSS coverage, no unused stylesheets"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Establishes a repeatable, multi-template CSS coverage baseline."
fix_summary: "Replace the single-session Chrome DevTools CSS Coverage measurement with a multi-template, multi-viewport, interaction-exercising PurgeCSS audit integrated into the Astro build pipeline."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# No orphaned CSS detected — 100% CSS coverage, no unused stylesheets

**Finding:** No orphaned CSS detected — 100% CSS coverage, no unused stylesheets  
**Severity:** Low  
**Why this matters:** Establishes a repeatable, multi-template CSS coverage baseline.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Replace the single-session Chrome DevTools CSS Coverage measurement with a multi-template, multi-viewport, interaction-exercising PurgeCSS audit integrated into the Astro build pipeline.  

> **Evidence Basis:** Confirmed

---

> **Payload figure not grounded in transfer (MUTTR-05).** The cited ~1.82MB exceeds the run's measured network transfer (max 154KB per page) by 12×. Ground payload claims in measured transfer; treat the large figure as unverified unless it reflects bytes actually sent.
>
> **Feature reference not found on this site (MUTTR-05).** This fix names e-commerce features (checkout) but the crawl shows no transactional signal (no cart/checkout/product markup, no Product/Offer structured data). These appear inherited from a generic template — verify before acting.

## Impact

- **Build Confidence:** Establishes a repeatable, multi-template CSS coverage baseline. Future audits will have a documented scope (which URLs, viewports, and interaction states were tested) rather than a single-session snapshot that cannot be compared across deploys.
- **Css Payload Risk:** The 1824KB parsed figure is currently unexplained. If investigation reveals a CSS-in-JS runtime or an unscoped global stylesheet is inflating the number, the audit script will surface it with a specific file URL and unused-byte count — enabling a targeted fix rather than a speculative one.
- **Ci Regression Prevention:** Integrating the threshold check into the Netlify build pipeline means any future component addition that introduces globally-scoped unused rules will fail the build before reaching production, preventing CSS debt accumulation over time.
- **Interaction State Coverage:** Exercising :focus, :hover, and media query branches during coverage collection eliminates the false-positive risk of a passive page load reporting 100% coverage on rules that are never actually triggered in real user sessions.

## How to verify

**What to look for:** CSS coverage shows 0% unused CSS (0KB unused of 1824KB total — note: the 1824KB appears to be uncompressed/parsed size vs 7KB transfer).. The single stylesheet (Section.iKsGnDKO.css at 7KB transfer) has 68 rules with only 2 !important declarations.

**Measured evidence:**
- Css Unused Percent: 0
- Js Unused Percent: 15.3
- Orphaned Stylesheets: 0
- Orphaned Scripts: 0
- Orphaned Fonts: 0
- Total Wasted Bytes: 0
- Css Unused Bytes: 0
- Css Total Bytes: 1709000

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
Replace the single-session Chrome DevTools CSS Coverage measurement with a multi-template, multi-viewport, interaction-exercising PurgeCSS audit integrated into the Astro build pipeline. The goal is not to fix a CSS problem — none is confirmed — but to establish a repeatable, trustworthy measurement baseline that covers all page templates, all viewport breakpoints, and interaction states, and to resolve the 1824KB parsed vs 7KB transfer discrepancy before it is misread as a real payload problem in a future audit.

### How
1. RESOLVE THE 1824KB DISCREPANCY FIRST (prerequisite — do not skip). Open Chrome DevTools → Coverage tab → reload the page with coverage recording active. After load, expand the coverage panel and note the 'Type' column. The 1824KB figure is almost certainly the sum of all CSS sources including browser UA stylesheet, any CSS-in-JS runtime injections, and Astro's scoped style blocks compiled into <style> tags. To isolate: filter the Coverage panel to 'CSS' only, then sort by URL. Identify every entry that is NOT Section.iKsGnDKO.css. If the UA stylesheet or a framework runtime accounts for the gap, document it and close the discrepancy. If an unexpected large stylesheet appears, escalate that file specifically.
2. AUDIT ALL PAGE TEMPLATES, NOT ONE URL. Astro generates static HTML per route. The scoped stylesheet Section.iKsGnDKO.css is build-tool-generated and component-scoped — correct architecture — but other templates (blog post, 404, search, account) may have their own scoped files that were never tested. Run the Playwright script in step 4 against every distinct layout: index, blog list, blog post, 404, any form or checkout page. Record coverage per URL, not as an aggregate.
3. EXERCISE INTERACTION STATES DURING COVERAGE. A passive page load will not trigger :hover, :focus, :active, :checked, :disabled, or JS-toggled class states. The Playwright script must: tab through all focusable elements (exercises :focus), hover over navigation items and cards (exercises :hover), open and close any modals or dropdowns (exercises toggled classes), resize viewport to 375px and 1440px within the same session (exercises media query branches), and trigger print preview via page.emulateMedia({ media: 'print' }) (exercises @media print rules).
4. INTEGRATE PLAYWRIGHT CSS COVERAGE INTO CI. Add a standalone Node script (not a build plugin) that runs after `astro build` and `netlify dev` or against the deployed preview URL. The script collects per-URL, per-file CSS coverage and writes a JSON report. Fail CI if any non-UA, non-framework stylesheet has >20% unused rules across the full template matrix. The 20% threshold is configurable — see UNUSED_RULE_THRESHOLD in the code example.
5. OPTIONAL: ADD PURGECSS AS A POST-BUILD STEP FOR GLOBAL STYLESHEETS ONLY. Astro's scoped <style> blocks are already component-scoped and do not need PurgeCSS — the build tool handles dead code elimination. PurgeCSS is only warranted if a global stylesheet (e.g., a third-party CSS file in public/ or an imported npm package CSS) is confirmed to have unused rules after step 4. Do not run PurgeCSS against Astro's scoped output — it will break hashed class names.
6. DOCUMENT THE CONFIRMED-CLEAN SCOPE. Add a comment block to astro.config.mjs (or a AUDIT_NOTES.md) recording: which URLs were tested, which viewports, which interaction states were exercised, and the date. This prevents future auditors from re-escalating a non-issue.

### Code examples
```
// scripts/css-coverage-audit.mjs
// Run after build: node scripts/css-coverage-audit.mjs
// Requires: npm install -D playwright
// SITE-SPECIFIC ASSUMPTION: BASE_URL must be set to the local dev server or Netlify preview URL
// SITE-SPECIFIC ASSUMPTION: ROUTES must enumerate every distinct Astro layout/template
// SITE-SPECIFIC ASSUMPTION: UNUSED_RULE_THRESHOLD is configurable — 20% is a reasonable starting point

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE_URL = process.env.AUDIT_BASE_URL ?? 'http://localhost:4321';
const UNUSED_RULE_THRESHOLD = 0.20; // Flag if >20% of rules in a non-UA stylesheet are unused
const INTERACTION_HOVER_SELECTORS = ['nav a', 'button', '[data-card]']; // SITE-SPECIFIC: adjust to actual interactive elements
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 900 },
];

// SITE-SPECIFIC ASSUMPTION: enumerate every distinct Astro layout here
const ROUTES = [
  '/',
  '/blog',
  '/blog/sample-post', // replace with a real slug from the build output
  '/404',
];

// UA stylesheet and browser-injected sources to exclude from unused-rule analysis
// These are not controllable by the site and will always appear in coverage
const EXCLUDED_SOURCE_PATTERNS = [
  /^data:/, // inline data URIs
  /^blob:/, // blob URLs
  /user-agent-stylesheet/i,
];

async function collectCoverage() {
  const browser = await chromium.launch();
  const report = [];
  let ciFailure = false;

  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      await page.coverage.startCSSCoverage();

      const url = `${BASE_URL}${route}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Exercise :focus states — tab through focusable elements
      // Cap iterations to prevent unbounded loop on pages with many focusable elements
      const MAX_TAB_ITERATIONS = 30;
      for (let i = 0; i < MAX_TAB_ITERATIONS; i++) {
        await page.keyboard.press('Tab');
      }

      // Exercise :hover states on known interactive selectors
      for (const selector of INTERACTION_HOVER_SELECTORS) {
        try {
          const el = page.locator(selector).first();
          // Use isVisible() before hover to avoid errors on pages where selector is absent
          if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
            await el.hover();
          }
        } catch {
          // Selector absent on this route — not an error
        }
      }

      // Exercise @media print rules
      await page.emulateMedia({ media: 'print' });
      await page.emulateMedia({ media: 'screen' }); // restore

      const coverageEntries = await page.coverage.stopCSSCoverage();

      for (const entry of coverageEntries) {
        const isExcluded = EXCLUDED_SOURCE_PATTERNS.some((p) => p.test(entry.url));
        if (isExcluded) continue;

        const totalBytes = entry.text?.length ?? 0;
        const usedBytes = entry.ranges.reduce((sum, r) => sum + (r.end - r.start), 0);
        const unusedBytes = totalBytes - usedBytes;
        const unusedRatio = totalBytes > 0 ? unusedBytes / totalBytes : 0;

        const entryReport = {
          url: entry.url,
          route,
          viewport: viewport.name,
          totalBytes,
          usedBytes,
          unusedBytes,
          unusedRatio: parseFloat(unusedRatio.toFixed(4)),
          exceedsThreshold: unusedRatio > UNUSED_RULE_THRESHOLD,
        };

        report.push(entryReport);

        if (entryReport.exceedsThreshold) {
          ciFailure = true;
          console.error(
            `[CSS AUDIT FAIL] ${entry.url} on ${route} (${viewport.name}): ` +
            `${(unusedRatio * 100).toFixed(1)}% unused — exceeds ${UNUSED_RULE_THRESHOLD * 100}% threshold`
          );
        }
      }

      await context.close();
    }
  }

  await browser.close();

  writeFileSync(
    'css-coverage-report.json',
    JSON.stringify({ generatedAt: new Date().toISOString(), threshold: UNUSED_RULE_THRESHOLD, entries: report }, null, 2)
  );

  console.log(`CSS coverage audit complete. Report written to css-coverage-report.json`);

  if (ciFailure) {
    console.error('One or more stylesheets exceeded the unused-rule threshold. See report for details.');
    process.exit(1);
  }
}

collectCoverage().catch((err) => {
  console.error('CSS coverage audit failed with an unexpected error:', err);
  process.exit(1);
});
# netlify.toml addition — run audit against the deployed preview before promoting to production
# SITE-SPECIFIC ASSUMPTION: 'npm run build' is the existing build command
# SITE-SPECIFIC ASSUMPTION: 'npm run preview' starts the Astro preview server on port 4321
# The audit script is run against the preview server, not the live site

[build]
  command = "npm run build && npm run css:audit"
  publish = "dist"

[build.environment]
  # AUDIT_BASE_URL is set to the Netlify deploy preview URL in CI
  # For local runs, the script defaults to http://localhost:4321
  AUDIT_BASE_URL = "http://localhost:4321"
// package.json additions (partial)
// SITE-SPECIFIC ASSUMPTION: 'preview' script starts Astro preview server
// The audit script is intentionally separate from the build — do not merge into astro.config.mjs
{
  "scripts": {
    "preview": "astro preview --port 4321",
    "css:audit": "astro preview --port 4321 & sleep 3 && node scripts/css-coverage-audit.mjs; kill %1"
  },
  "devDependencies": {
    "playwright": "^1.44.0"
  }
}
```

## Risks
- The `& sleep 3` in the css:audit npm script is a timing assumption — if the Astro preview server takes longer than 3 seconds to start (e.g., on a slow CI runner), the audit script will connect before the server is ready and fail. Mitigation: replace the sleep with a wait-on utility (`npx wait-on http://localhost:4321 --timeout 30000`) for reliable readiness detection.
- Playwright's CSS Coverage API measures byte ranges, not rule counts. A single multi-selector rule counts as one byte range — a minified stylesheet with many selectors on one line may report higher 'used' ratios than a formatted one. The unusedRatio metric is a byte-level proxy, not a rule-level count. This is acceptable for threshold enforcement but should be noted in the report.
- The INTERACTION_HOVER_SELECTORS array is site-specific. If the selectors do not match the actual DOM (e.g., the site uses a different class for cards), the hover exercise step silently skips — it does not fail. This is intentional (the try/catch + isVisible guard), but it means interaction-state coverage is only as good as the selector list. Mitigation: after first run, verify in the Playwright trace that hover events were actually dispatched.
- Running PurgeCSS against Astro's scoped style output (the hashed class names like .iKsGnDKO) will break styles. The proposal explicitly restricts PurgeCSS to global/third-party stylesheets only. If a future developer misreads the instructions and applies PurgeCSS to the full dist/ output, scoped component styles will be stripped. Mitigation: add a comment in astro.config.mjs explicitly warning against this.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
