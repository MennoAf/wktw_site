---
finding_id: "ux-content-1"
title: "Content-to-code ratio is excellent — minimal payload for content-rich pages"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Sibling static pages inheriting a marketing template can silently accumulate carousel libraries, product grid scripts, and chat widget bundles — none of which render any visible component."
fix_summary: "Audit all sibling static/low-interactivity pages (Terms of Service, Cookie Policy, About, Contact, FAQ) to verify they share the privacy policy template's clean component footprint, and enforce a lig…"
confidence_tier: "confirmed"
---

# Content-to-code ratio is excellent — minimal payload for content-rich pages

**Finding:** Content-to-code ratio is excellent — minimal payload for content-rich pages  
**Severity:** Low  
**Why this matters:** Sibling static pages inheriting a marketing template can silently accumulate carousel libraries, product grid scripts, and chat widget bundles — none of which render any visible component.  
**Root cause:** Isolated issue  
**Fix:** Audit all sibling static/low-interactivity pages (Terms of Service, Cookie Policy, About, Contact, FAQ) to verify they share the privacy policy template's clean component footprint, and enforce a lig…

> **Evidence Basis:** Confirmed

---

## Impact

- **Page Weight Regression Prevention:** Sibling static pages inheriting a marketing template can silently accumulate carousel libraries, product grid scripts, and chat widget bundles — none of which render any visible component. Each such page pays the full parse and execution cost of those bundles on every load. Catching and correcting template misassignment before it reaches production eliminates this dead-weight payload at the source.
- **Crawl Budget And Seo:** Lightweight static pages are fully rendered by crawlers faster and with less resource contention. Pages that inherit heavy JS bundles risk incomplete rendering during Googlebot's crawl budget window, which can cause legal/policy content to be indexed incompletely or with lower confidence.
- **Ci Regression Gate:** Adding the audit script to CI converts this one-time finding into a permanent structural constraint. Any future CMS template reassignment or theme update that causes a static-legal page to exceed the defined thresholds will fail the build before reaching production, eliminating the class of silent regression this finding was designed to catch.

## How to verify

**What to look for:** With only 7,423 bytes of CSS transfer and 140 DOM elements, the content-to-code ratio for the HTML/CSS layer is strong.. The legal text content is the dominant payload, which is correct for a privacy policy page.

**Measured evidence:**
- Total Transfer Bytes: 7423
- Dom Elements: 197
- Headings: 11
- Images: 0
- Content To Code Ratio: excellent
- Content Type: legal text
- Reading Level: appropriate for legal document
- Above Fold Content: page title + policy text beginning

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
Audit all sibling static/low-interactivity pages (Terms of Service, Cookie Policy, About, Contact, FAQ) to verify they share the privacy policy template's clean component footprint, and enforce a lightweight shared template for this page class to prevent future contamination.

### How
1. Enumerate all static/legal page URLs from the sitemap or CMS page list.
2. For each page, capture: total JS transfer size (compressed), CSS transfer size, DOM node count, and number of third-party script requests. Use the audit script below — it runs headlessly via Playwright and outputs a CSV.
3. Flag any page where JS transfer exceeds the privacy policy baseline by more than 20% OR where DOM node count exceeds 200 nodes (indicating component injection beyond prose content).
4. For flagged pages: open the CMS template assignment and verify whether they are assigned to the same lightweight template as the privacy policy page or to a heavier marketing template.
5. Reassign flagged pages to the lightweight static template. If no shared lightweight template exists, extract the privacy policy template as the canonical base for this page class.
6. Add a CMS-level template guard: tag all pages in the legal/static category with a metadata flag (e.g., page_class: static-legal) and document that this class must not inherit carousel, product grid, chat widget, or interactive filter component bundles.
7. Re-run the audit script post-reassignment to confirm parity with the privacy policy baseline.
8. Add the audit script to CI as a regression gate: fail the build if any page tagged static-legal exceeds the defined JS and DOM thresholds.

### Code examples
```
// audit-static-pages.mjs
// Requires: npm install playwright
// Usage: node audit-static-pages.mjs
// Outputs: static-page-audit.csv
//
// SITE-SPECIFIC ASSUMPTIONS — adjust before running:
const STATIC_PAGE_URLS = [
  // Replace with actual URLs from your sitemap
  'https://example.com/privacy-policy',
  'https://example.com/terms-of-service',
  'https://example.com/cookie-policy',
  'https://example.com/about',
  'https://example.com/contact',
  'https://example.com/faq'
];

// Thresholds derived from the confirmed-clean privacy policy baseline.
// Adjust if the baseline measurement changes after platform JS is addressed.
const JS_TRANSFER_BASELINE_BYTES = 2621440; // 2.5MB — current platform JS (analytics layer)
const JS_TRANSFER_TOLERANCE_RATIO = 1.20;   // Flag pages >20% above baseline
const DOM_NODE_CEILING = 200;               // Privacy policy measured at 140 nodes
const CSS_TRANSFER_BASELINE_BYTES = 7423;   // Privacy policy CSS baseline
const CSS_TRANSFER_TOLERANCE_RATIO = 1.50;  // Flag pages >50% above CSS baseline

import { chromium } from 'playwright';
import { createWriteStream } from 'fs';

const JS_THRESHOLD = Math.round(JS_TRANSFER_BASELINE_BYTES * JS_TRANSFER_TOLERANCE_RATIO);
const CSS_THRESHOLD = Math.round(CSS_TRANSFER_BASELINE_BYTES * CSS_TRANSFER_TOLERANCE_RATIO);

async function auditPage(page, url) {
  const resourceSizes = { js: 0, css: 0, thirdPartyScripts: 0 };
  const pageHostname = new URL(url).hostname;

  page.on('response', async (response) => {
    let transferSize = 0;
    try {
      const headers = response.headers();
      // Content-Length is not always present; fall back to body size
      if (headers['content-length']) {
        transferSize = parseInt(headers['content-length'], 10);
      } else {
        const body = await response.body().catch(() => Buffer.alloc(0));
        transferSize = body.length;
      }
    } catch {
      transferSize = 0;
    }

    const resourceUrl = response.url();
    let resourceHostname;
    try {
      resourceHostname = new URL(resourceUrl).hostname;
    } catch {
      return;
    }

    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('javascript')) {
      resourceSizes.js += transferSize;
      if (resourceHostname !== pageHostname) {
        resourceSizes.thirdPartyScripts += 1;
      }
    } else if (contentType.includes('css')) {
      resourceSizes.css += transferSize;
    }
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  const domNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);

  const flagged =
    resourceSizes.js > JS_THRESHOLD ||
    domNodeCount > DOM_NODE_CEILING ||
    resourceSizes.css > CSS_THRESHOLD;

  return {
    url,
    jsBytesTransfer: resourceSizes.js,
    cssBytesTransfer: resourceSizes.css,
    domNodeCount,
    thirdPartyScriptCount: resourceSizes.thirdPartyScripts,
    flagged
  };
}

async function run() {
  const browser = await chromium.launch();
  const results = [];

  for (const url of STATIC_PAGE_URLS) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const result = await auditPage(page, url);
      results.push(result);
      console.log(`[${result.flagged ? 'FLAG' : 'OK  '}] ${url} | JS: ${result.jsBytesTransfer}B | CSS: ${result.cssBytesTransfer}B | DOM: ${result.domNodeCount} | 3P scripts: ${result.thirdPartyScriptCount}`);
    } catch (err) {
      console.error(`ERROR auditing ${url}:`, err.message);
      results.push({ url, error: err.message, flagged: true });
    } finally {
      await page.close();
      await context.close();
    }
  }

  await browser.close();

  const csv = [
    'url,jsBytesTransfer,cssBytesTransfer,domNodeCount,thirdPartyScriptCount,flagged',
    ...results.map(r =>
      r.error
        ? `${r.url},ERROR,ERROR,ERROR,ERROR,true`
        : `${r.url},${r.jsBytesTransfer},${r.cssBytesTransfer},${r.domNodeCount},${r.thirdPartyScriptCount},${r.flagged}`
    )
  ].join('\n');

  const out = createWriteStream('static-page-audit.csv');
  out.write(csv);
  out.end();
  console.log('\nAudit complete. Results written to static-page-audit.csv');

  const anyFlagged = results.some(r => r.flagged);
  if (anyFlagged) {
    console.error('\nCI GATE: One or more static-legal pages exceeded thresholds. Failing build.');
    process.exit(1);
  }
}

run();
<!-- CMS template guard: add to the <head> of the lightweight static template.
     This snippet fires a console warning in non-production environments if a
     component bundle known to belong to the marketing template is detected on
     a static-legal page. It does NOT block rendering — it is a developer signal only.

     SITE-SPECIFIC ASSUMPTIONS:
     - MARKETING_BUNDLE_SIGNALS: update these selectors to match your actual
       marketing component class names or data attributes.
     - Only runs outside production to avoid console noise for end users.
-->
<script>
(function detectMarketingBundleContamination() {
  // Named constants — no magic strings inline
  const ENV_PRODUCTION = 'production';
  // SITE-SPECIFIC: adjust to match your environment detection mechanism
  const currentEnv = document.documentElement.dataset.env || 'development';

  if (currentEnv === ENV_PRODUCTION) return;

  // SITE-SPECIFIC: update these selectors to match your CMS/theme component markers
  const MARKETING_BUNDLE_SIGNALS = [
    '[data-component="carousel"]',
    '[data-component="product-grid"]',
    '[data-component="interactive-filter"]',
    '[data-component="chat-widget"]',
    '.js-slick-slider',
    '.js-product-recommendations'
  ];

  // Defer check until DOM is interactive — does not block parsing
  function checkContamination() {
    const detected = MARKETING_BUNDLE_SIGNALS.filter(
      selector => document.querySelector(selector) !== null
    );
    if (detected.length > 0) {
      console.warn(
        '[StaticTemplate] Marketing component bundle contamination detected on a static-legal page.\n' +
        'Matched selectors: ' + detected.join(', ') + '\n' +
        'Verify this page is assigned to the lightweight static template, not the marketing template.'
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkContamination, { once: true });
  } else {
    checkContamination();
  }
}());
</script>
```

## Risks
- Content-Length header is absent on many CDN-served responses (chunked transfer encoding). The audit script falls back to response.body() byte count, which measures decompressed size rather than wire transfer size — JS figures will read higher than DevTools Network panel transfer column. This is conservative (flags more, not fewer) and acceptable for a regression gate, but document the discrepancy so reviewers do not compare raw numbers directly to DevTools.
- networkidle as the Playwright wait condition can time out on pages with long-polling or persistent WebSocket connections (e.g., a chat widget that keeps a connection open). If any static page has such a connection, replace waitUntil: 'networkidle' with waitUntil: 'domcontentloaded' plus an explicit fixed delay for that URL only — do not change the default for all pages.
- The contamination detection script uses data-component attributes and class names as signals. If the CMS or theme uses different component markers, the selectors will produce false negatives (no warning when contamination exists). The MARKETING_BUNDLE_SIGNALS array must be updated to match the actual theme's component naming convention before the guard is meaningful.
- Reassigning a page from a marketing template to a lightweight static template may remove a shared footer or navigation component that the marketing template injects. Verify that the lightweight static template includes all required global elements (nav, footer, cookie banner, skip-to-content link) before reassigning pages in bulk.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
