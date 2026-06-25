---
finding_id: "no-horizontal-scroll-issues"
title: "No horizontal scroll or viewport overflow issues detected on mobile"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The CI breakpoint matrix catches overflow regressions before deployment."
fix_summary: "Close five responsive audit gaps left unverified by the 393px spot-check: (1) intermediate breakpoints 393–768px, (2) mobile landscape at 844px, (3) narrow viewports at 320px, (4) JS-injected overflo…"
confidence_tier: "confirmed"
---

# No horizontal scroll or viewport overflow issues detected on mobile

**Finding:** No horizontal scroll or viewport overflow issues detected on mobile  
**Severity:** Low  
**Why this matters:** The CI breakpoint matrix catches overflow regressions before deployment.  
**Root cause:** Isolated issue  
**Fix:** Close five responsive audit gaps left unverified by the 393px spot-check: (1) intermediate breakpoints 393–768px, (2) mobile landscape at 844px, (3) narrow viewports at 320px, (4) JS-injected overflo…

> **Evidence Basis:** Confirmed

---

## Impact

- **Responsive Regression Prevention:** The CI breakpoint matrix catches overflow regressions before deployment. Without it, a third-party widget update or CMS content change can silently introduce horizontal scroll on mobile — a layout failure that forces users to scroll horizontally to read content, directly increasing bounce rate on affected pages.
- **Long String Overflow On Content Pages:** CMS-entered URLs, email addresses, and code blocks without overflow-wrap rules cause horizontal scroll on narrow viewports. Horizontal scroll on a content page signals a broken layout to users and search crawlers. The overflow-wrap fix eliminates this failure mode for all current and future CMS content without touching layout.
- **Landscape And Narrow Viewport Coverage:** The 320px and 844px landscape viewports are the most common breakpoints where intermediate CSS grid/flexbox implementations fail. Catching failures at these widths prevents layout breakage for iPhone SE users and any user who rotates their device — both segments that a 393px portrait-only test misses entirely.
- **Third Party Widget Overflow:** Chat overlays, cookie banners, and JS-injected components frequently render outside viewport bounds because they are sized relative to their own container, not the viewport. The runtime sentinel detects these post-render overflows and surfaces the offending element, enabling targeted fixes rather than broad layout changes.

## How to verify

**What to look for:** The page renders correctly within the 393px viewport width of the iPhone 14 Pro.. No fixed-width elements, unconstrained images, or unresponsive tables detected.

**Measured evidence:**
- Viewport Meta: width=device-width, initial-scale=1
- Viewport Width: 393px
- Horizontal Overflow: False
- User Scalable Restricted: False

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
Close five responsive audit gaps left unverified by the 393px spot-check: (1) intermediate breakpoints 393–768px, (2) mobile landscape at 844px, (3) narrow viewports at 320px, (4) JS-injected overflow from third-party widgets, and (5) long unbreakable strings on content pages. Implement a CSS overflow safety net and a runtime overflow sentinel to catch regressions before they reach production.

### How
1. ADD CSS OVERFLOW SAFETY NET — Scope the rule to the document root and known problem containers only. Do not apply overflow:hidden to <body> or <html> (breaks position:fixed overlays). Target the layout wrapper instead.
2. ADD WORD-BREAK RULE — Scope to CMS-rendered content regions only (e.g., .entry-content, .prose, [data-cms-content]). Do not apply globally — breaks intentional nowrap on badges, labels, and code tokens.
3. IMPLEMENT RUNTIME OVERFLOW SENTINEL — A ResizeObserver watches the document body width against window.innerWidth. When any element causes the body to exceed the viewport, it logs the offending element to the console (dev) or dispatches a custom event (prod) for your error monitoring pipeline. Teardown is handled via disconnect().
4. RUN BREAKPOINT MATRIX IN CI — Add Playwright viewport tests covering: 320px portrait, 393px portrait, 844px landscape, 768px portrait, 820px portrait. Each test asserts document.documentElement.scrollWidth <= window.innerWidth after a 500ms settle (accounts for JS-injected content).
5. VERIFY THIRD-PARTY WIDGETS — After each test viewport, query all iframes and elements with a z-index > 100 or position:fixed. Assert none exceed viewport width. This catches chat overlays and cookie banners that inject after DOMContentLoaded.
6. DEPLOY SENTINEL IN PRODUCTION — Wire the custom 'overflow-detected' event to your existing error monitoring (e.g., dataLayer push or console.error in staging). Do not alert on every resize — debounce to 300ms and cap at one report per element per session.

### Code examples
```
/* ============================================================
   CSS OVERFLOW SAFETY NET
   Scope: layout wrapper only — NOT html or body (breaks fixed overlays)
   Site-specific assumption: .site-wrapper is the outermost layout container.
   Replace with your actual wrapper selector.
   ============================================================ */

/* Site-specific config — adjust selector to match your layout root */
:root {
  --layout-wrapper-selector: '.site-wrapper'; /* document this in your design tokens */
}

.site-wrapper {
  max-width: 100%;
  overflow-x: clip; /* clip, not hidden — does not create a new scroll container */
}

/* CMS content regions only — prevents long URLs/code from overflowing */
/* Site-specific assumption: CMS content lives in .entry-content or [data-cms-content] */
.entry-content,
[data-cms-content] {
  overflow-wrap: break-word;
  word-break: break-word; /* legacy fallback for Safari < 15.4 */
  min-width: 0; /* fixes flexbox/grid children ignoring overflow-wrap */
}
/* ============================================================
   RUNTIME OVERFLOW SENTINEL
   Watches for any element causing horizontal overflow.
   Dispatches 'overflow-detected' custom event for error monitoring.
   Teardown: call sentinel.disconnect() on SPA route change.
   ============================================================ */

(function initOverflowSentinel() {
  'use strict';

  // Named constants — no magic numbers
  const DEBOUNCE_MS = 300;          // Settle time after resize before checking
  const MAX_REPORTS_PER_SESSION = 5; // Cap noise from pathological pages
  const OVERFLOW_THRESHOLD_PX = 1;  // 1px tolerance for subpixel rounding

  // Feature-detect before use
  if (typeof ResizeObserver === 'undefined') {
    // ResizeObserver: ~97% global support as of 2024. Graceful no-op for older browsers.
    return;
  }

  let debounceTimer = null;
  let reportCount = 0;
  const reportedElements = new WeakSet(); // Avoid duplicate reports per element

  function findOverflowingElements() {
    if (reportCount >= MAX_REPORTS_PER_SESSION) return;

    const viewportWidth = window.innerWidth;
    // querySelectorAll returns a live-ish snapshot — safe for iteration
    const allElements = document.querySelectorAll('body *');

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];

      // Skip already-reported elements this session
      if (reportedElements.has(el)) continue;

      let rect;
      try {
        rect = el.getBoundingClientRect();
      } catch (_) {
        // getBoundingClientRect can throw on detached nodes in some browsers
        continue;
      }

      const rightEdge = rect.right;
      if (rightEdge > viewportWidth + OVERFLOW_THRESHOLD_PX) {
        reportedElements.add(el);
        reportCount++;

        const detail = {
          tagName: el.tagName,
          id: el.id || null,
          className: typeof el.className === 'string' ? el.className.slice(0, 100) : null,
          rightEdgePx: Math.round(rightEdge),
          viewportWidthPx: viewportWidth,
          overflowPx: Math.round(rightEdge - viewportWidth),
          href: window.location.href
        };

        // Dev: surface immediately in console
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[OverflowSentinel] Overflow detected:', detail);
        }

        // Prod: dispatch for error monitoring pipeline
        // Wire this to your dataLayer, Sentry, or custom analytics
        try {
          document.dispatchEvent(new CustomEvent('overflow-detected', {
            bubbles: false,
            detail: detail
          }));
        } catch (_) {
          // CustomEvent constructor not available (IE11 without polyfill) — silent fail
        }

        if (reportCount >= MAX_REPORTS_PER_SESSION) break;
      }
    }
  }

  // Debounced resize handler — prevents thrashing on continuous resize events
  const observer = new ResizeObserver(function onResize() {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      findOverflowingElements();
    }, DEBOUNCE_MS);
  });

  // Observe body — ResizeObserver fires when body dimensions change
  observer.observe(document.body);

  // Run once on init to catch pre-existing overflow
  findOverflowingElements();

  // Expose teardown for SPA route changes
  // Usage: window.__overflowSentinel.disconnect()
  window.__overflowSentinel = {
    disconnect: function () {
      observer.disconnect();
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    }
  };
}());
// ============================================================
// PLAYWRIGHT BREAKPOINT MATRIX — CI REGRESSION SUITE
// Site-specific assumption: base URL is read from SITE_BASE_URL env var.
// Add to your existing Playwright config. Requires @playwright/test.
// ============================================================

const { test, expect } = require('@playwright/test');

// Named constants — adjust to match your actual page inventory
const SITE_BASE_URL = process.env.SITE_BASE_URL; // Required — set in CI environment
if (!SITE_BASE_URL) throw new Error('SITE_BASE_URL environment variable is required');

// Site-specific assumption: these paths cover your highest-traffic page types.
// Extend with blog posts, PDFs, and any CMS-heavy templates.
const TEST_PATHS = [
  '/',
  '/blog',           // Adjust to your blog index path
  '/contact',        // Adjust to your contact/form page path
];

const VIEWPORTS = [
  { name: 'narrow-portrait',    width: 320,  height: 568  }, // iPhone SE
  { name: 'standard-portrait',  width: 393,  height: 852  }, // iPhone 14 Pro
  { name: 'standard-landscape', width: 844,  height: 390  }, // iPhone 14 Pro landscape
  { name: 'tablet-portrait',    width: 768,  height: 1024 }, // iPad Mini
  { name: 'tablet-large',       width: 820,  height: 1180 }, // iPad Air
];

// Named constants
const JS_SETTLE_MS = 500;       // Wait for JS-injected widgets to render
const OVERFLOW_TOLERANCE_PX = 1; // Subpixel rounding tolerance

for (const viewport of VIEWPORTS) {
  for (const path of TEST_PATHS) {
    test(`no horizontal overflow — ${viewport.name} — ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${SITE_BASE_URL}${path}`, { waitUntil: 'networkidle' });

      // Wait for JS-injected third-party widgets (chat, cookie banners)
      await page.waitForTimeout(JS_SETTLE_MS);

      const overflowData = await page.evaluate(function (tolerancePx) {
        const viewportWidth = window.innerWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const overflowPx = scrollWidth - viewportWidth;

        if (overflowPx <= tolerancePx) {
          return { overflows: false, overflowPx: 0, offenders: [] };
        }

        // Identify offending elements for actionable failure output
        const offenders = [];
        const allElements = document.querySelectorAll('body *');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          let rect;
          try { rect = el.getBoundingClientRect(); } catch (_) { continue; }
          if (rect.right > viewportWidth + tolerancePx) {
            offenders.push({
              tag: el.tagName,
              id: el.id || null,
              class: typeof el.className === 'string' ? el.className.slice(0, 80) : null,
              rightEdge: Math.round(rect.right)
            });
            if (offenders.length >= 5) break; // Cap output for readability
          }
        }

        return { overflows: true, overflowPx: overflowPx, offenders: offenders };
      }, OVERFLOW_TOLERANCE_PX);

      expect(
        overflowData.overflows,
        `Horizontal overflow of ${overflowData.overflowPx}px at ${viewport.name} on ${path}. Offenders: ${JSON.stringify(overflowData.offenders)}`
      ).toBe(false);
    });
  }
}
```

## Risks
- overflow-x:clip on .site-wrapper will clip any child element that intentionally renders outside the wrapper bounds (e.g., full-bleed section backgrounds, sticky sidebars, dropdown menus that extend beyond the wrapper). Mitigation: audit all position:absolute and negative-margin elements inside .site-wrapper before deploying. If full-bleed children exist, apply clip only to specific inner containers rather than the outermost wrapper.
- overflow-wrap:break-word on .entry-content will break intentional nowrap in inline code snippets if <code> elements inside .entry-content rely on horizontal scroll for readability. Mitigation: add a carve-out: .entry-content pre, .entry-content code { overflow-wrap: normal; overflow-x: auto; } to preserve code block scrollability.
- The ResizeObserver sentinel iterates document.querySelectorAll('body *') on every debounced resize. On pages with DOM node counts above 3,000, this loop can take 10–30ms on low-end mobile hardware. Mitigation: the DEBOUNCE_MS constant (300ms) prevents continuous firing; the MAX_REPORTS_PER_SESSION cap (5) stops iteration early. If profiling shows main-thread impact, move the loop into a requestIdleCallback wrapper.
- The Playwright JS_SETTLE_MS timeout (500ms) is a fixed wait, not a condition-based wait. If a third-party widget takes longer than 500ms to inject (e.g., slow consent platform initialization), the test will pass despite a post-render overflow. Mitigation: replace waitForTimeout with page.waitForFunction(() => document.readyState === 'complete' && !document.querySelector('.cookie-banner-loading')) using your actual consent banner selector, or increase JS_SETTLE_MS to 1500ms for consent-heavy pages.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
