---
finding_id: "ux-interactive-no-dead-zones-detected"
title: "No hover-dependent functionality or dead zones detected — PASS for mobile"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Conditionally-rendered components (post-authentication, A/B variants, post-scroll injections) are the most common source of interaction regressions because they are invisible to static crawl audits."
fix_summary: "Establish a regression guard that continuously validates mobile interaction integrity for conditionally-rendered components (authenticated views, A/B variants, geo-targeted content, post-scroll injec…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# No hover-dependent functionality or dead zones detected — PASS for mobile

**Finding:** No hover-dependent functionality or dead zones detected — PASS for mobile  
**Severity:** Low  
**Why this matters:** Conditionally-rendered components (post-authentication, A/B variants, post-scroll injections) are the most common source of interaction regressions because they are invisible to static crawl audits.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Establish a regression guard that continuously validates mobile interaction integrity for conditionally-rendered components (authenticated views, A/B variants, geo-targeted content, post-scroll injec…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Regression Prevention:** Conditionally-rendered components (post-authentication, A/B variants, post-scroll injections) are the most common source of interaction regressions because they are invisible to static crawl audits. The sentinel closes this gap by auditing the live DOM at runtime, catching dead zones before they reach production users. The mechanism: a dead zone on a primary CTA (add-to-cart, checkout, form submit) silently discards user intent — the user perceives the product as broken and exits. Catching these in CI prevents that class of regression entirely.
- **Ci Build Safety:** Wiring the Playwright assertion to the build pipeline converts a manual audit step into an automated gate. Any future component injection that introduces a touch-target violation or pointer-events dead zone fails the build before deployment, maintaining the current passing state without requiring re-audit.

## How to verify

**What to look for:** All interactive elements (buttons, links) in the DOM correspond to functional navigation or consent actions.. No elements are styled as clickable but non-interactive.

**Measured evidence:**
- Buttons In Dom: 3
- Links In Dom: 14
- Hover Only Patterns: 0
- Dead Zones Detected: 0
- Dom Elements: 201
- Api Calls: 0
- Js Frameworks Detected: None — static HTML

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
Establish a regression guard that continuously validates mobile interaction integrity for conditionally-rendered components (authenticated views, A/B variants, geo-targeted content, post-scroll injections) that were outside the crawl snapshot scope. The current pass is bounded by static DOM state; this guard closes the audit gap without modifying any passing behavior.

### How
1. Create a MutationObserver-based interaction sentinel as an Astro client-side island (`src/components/InteractionSentinel.astro`) that activates only in development and CI environments via `import.meta.env.DEV` — zero production overhead.
2. The sentinel watches for newly-injected interactive elements (buttons, anchors, inputs, [role=button], [role=link]) and runs three checks on each: (a) touch-target size ≥ 48×48 CSS px, (b) no hover-only event listeners without a touch/focus equivalent, (c) no pointer-events:none on visible, focusable elements.
3. Violations are emitted to the browser console as structured warnings with the offending element's outerHTML snippet, computed styles, and the check that failed — actionable without a separate dashboard.
4. In CI, wire a Playwright smoke test (`tests/interaction-sentinel.spec.ts`) that loads each key route, triggers scroll to bottom (to flush post-scroll injections), and asserts zero sentinel violations in the console log. Fail the build on any violation.
5. Add the sentinel island to the root layout (`src/layouts/BaseLayout.astro`) behind the DEV guard so it is tree-shaken from production builds automatically by Astro's build pipeline.
6. Document the four component categories excluded from the original audit (authenticated state, A/B variants, geo-targeted, post-scroll) as explicit test scenarios in the Playwright spec so future audits have a checklist to verify coverage.

### Code examples
```
// src/components/InteractionSentinel.astro
// Drop into BaseLayout.astro inside <head> or before </body>.
// Astro's build pipeline tree-shakes this entirely from production
// because the <script> block is guarded by import.meta.env.DEV.
---
// No server-side props needed
---
{import.meta.env.DEV && (
  <script>
    (function initInteractionSentinel() {
      'use strict';

      // ── Named constants (no magic numbers) ──────────────────────────
      const MIN_TOUCH_TARGET_PX = 48;       // WCAG 2.5.8 minimum
      const OBSERVER_DEBOUNCE_MS = 200;     // coalesce rapid DOM mutations
      const MAX_OBSERVER_ITERATIONS = 5000; // safety cap — prevents unbounded loops
      const SENTINEL_PREFIX = '[InteractionSentinel]';

      // ── Selector for interactive elements ───────────────────────────
      // Scoped to semantic/ARIA interactive roles only — not bare element selectors
      const INTERACTIVE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[role="button"]',
        '[role="link"]',
        '[role="menuitem"]',
        '[role="tab"]',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',');

      // ── Feature detection ────────────────────────────────────────────
      if (
        typeof MutationObserver === 'undefined' ||
        typeof WeakSet === 'undefined'
      ) {
        console.warn(SENTINEL_PREFIX, 'MutationObserver or WeakSet unavailable — sentinel inactive.');
        return;
      }

      const audited = new WeakSet();
      let iterationCount = 0;
      let debounceTimer = null;

      // ── Core checks ─────────────────────────────────────────────────
      function checkTouchTarget(el) {
        const rect = el.getBoundingClientRect();
        if (rect.width < MIN_TOUCH_TARGET_PX || rect.height < MIN_TOUCH_TARGET_PX) {
          return {
            pass: false,
            check: 'touch-target-size',
            detail: `Computed size ${Math.round(rect.width)}×${Math.round(rect.height)}px — minimum ${MIN_TOUCH_TARGET_PX}×${MIN_TOUCH_TARGET_PX}px required (WCAG 2.5.8)`
          };
        }
        return { pass: true };
      }

      function checkPointerEvents(el) {
        const computed = window.getComputedStyle(el);
        if (computed.pointerEvents === 'none' && computed.display !== 'none' && computed.visibility !== 'hidden') {
          return {
            pass: false,
            check: 'pointer-events-none-on-visible-interactive',
            detail: 'pointer-events:none on a visible, focusable element creates a dead zone'
          };
        }
        return { pass: true };
      }

      function checkHoverOnlyListeners(el) {
        // Detects elements that have mouseenter/mouseover listeners
        // but no touchstart/focus equivalent — a proxy check via data attributes
        // set by framework event binding (Astro client directives, Alpine, etc.).
        // Full listener introspection requires DevTools protocol; this catches
        // the common pattern of data-hover-only="true" convention or inline onmouseenter
        // without ontouchstart. Flag for manual review rather than hard-fail.
        const hasHoverAttr = el.hasAttribute('onmouseenter') || el.hasAttribute('onmouseover');
        const hasTouchAttr = el.hasAttribute('ontouchstart') || el.hasAttribute('onfocus');
        if (hasHoverAttr && !hasTouchAttr) {
          return {
            pass: false,
            check: 'hover-only-listener-detected',
            detail: 'Inline onmouseenter/onmouseover without ontouchstart/onfocus — verify touch equivalent exists'
          };
        }
        return { pass: true };
      }

      // ── Audit runner ─────────────────────────────────────────────────
      function auditElement(el) {
        if (audited.has(el)) return;
        audited.add(el);

        const checks = [checkTouchTarget(el), checkPointerEvents(el), checkHoverOnlyListeners(el)];
        checks.forEach(function(result) {
          if (!result.pass) {
            // Emit structured warning — CI Playwright test asserts on this prefix
            console.warn(
              SENTINEL_PREFIX,
              result.check,
              '|',
              result.detail,
              '|',
              el.outerHTML.slice(0, 200) // truncate to avoid console flood
            );
          }
        });
      }

      function auditNewNodes(nodes) {
        nodes.forEach(function(node) {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (iterationCount >= MAX_OBSERVER_ITERATIONS) {
            console.warn(SENTINEL_PREFIX, 'MAX_OBSERVER_ITERATIONS reached — sentinel paused to prevent runaway loop.');
            observer.disconnect();
            return;
          }
          iterationCount++;

          // Audit the node itself if interactive
          if (node.matches && node.matches(INTERACTIVE_SELECTOR)) {
            auditElement(node);
          }
          // Audit interactive descendants
          if (node.querySelectorAll) {
            node.querySelectorAll(INTERACTIVE_SELECTOR).forEach(auditElement);
          }
        });
      }

      // ── MutationObserver with debounce ───────────────────────────────
      const observer = new MutationObserver(function(mutations) {
        const addedNodes = [];
        mutations.forEach(function(m) {
          m.addedNodes.forEach(function(n) { addedNodes.push(n); });
        });
        if (addedNodes.length === 0) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          auditNewNodes(addedNodes);
        }, OBSERVER_DEBOUNCE_MS);
      });

      // Observe full document subtree for injected components
      observer.observe(document.documentElement, { childList: true, subtree: true });

      // Audit elements already in DOM at script execution time
      document.querySelectorAll(INTERACTIVE_SELECTOR).forEach(auditElement);

      // ── Teardown on page unload ──────────────────────────────────────
      window.addEventListener('unload', function onUnload() {
        clearTimeout(debounceTimer);
        observer.disconnect();
        window.removeEventListener('unload', onUnload);
      }, { once: true });

      console.info(SENTINEL_PREFIX, 'Active — monitoring for interaction regressions in injected components.');
    })();
  </script>
)}

// tests/interaction-sentinel.spec.ts
// Playwright CI smoke test — fails build on any sentinel violation.
// Run via: npx playwright test tests/interaction-sentinel.spec.ts
// Requires PLAYWRIGHT_BASE_URL env var or falls back to localhost:4321 (Astro dev default).
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

// ── Config — site-specific values, adjust per environment ───────────
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321';
const SENTINEL_PREFIX = '[InteractionSentinel]';
const SCROLL_PAUSE_MS = 600;   // allow post-scroll injections to settle
const ROUTES_TO_TEST: string[] = [
  '/',
  // Add additional routes here — authenticated, geo-targeted, A/B variant URLs
  // e.g. '/account', '/products', '/blog'
];

// ── Helper ───────────────────────────────────────────────────────────
async function collectSentinelViolations(page: Page, route: string): Promise<string[]> {
  const violations: string[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'warning' && msg.text().startsWith(SENTINEL_PREFIX)) {
      violations.push(`[${route}] ${msg.text()}`);
    }
  });

  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });

  // Scroll to bottom to trigger post-scroll component injection
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(SCROLL_PAUSE_MS);

  // Scroll back to top to trigger any scroll-position-dependent components
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(SCROLL_PAUSE_MS);

  return violations;
}

// ── Tests ─────────────────────────────────────────────────────────────
for (const route of ROUTES_TO_TEST) {
  test(`No interaction sentinel violations on ${route}`, async ({ page }) => {
    const violations = await collectSentinelViolations(page, route);

    // Surface all violations in the failure message for actionable CI output
    expect(
      violations,
      `Interaction sentinel detected ${violations.length} violation(s):\n${violations.join('\n')}`
    ).toHaveLength(0);
  });
}

```

## Risks
- The touch-target check calls getBoundingClientRect() on mutation — elements injected into a detached subtree or before layout paint will return 0×0 and produce false positives. Mitigation: the debounce (200ms) allows the browser to complete layout before measurement; elements returning 0×0 should be logged as 'unmeasurable at injection time' rather than violations, and re-checked on the next requestAnimationFrame if needed.
- The hover-only listener check is limited to inline attribute detection (onmouseenter, onmouseover) — addEventListener-bound hover listeners are not introspectable from userland JS without DevTools protocol. This means programmatically-bound hover-only patterns will not be caught by the sentinel. Mitigation: document this limitation explicitly in the sentinel console.info output so developers know manual review is still required for addEventListener-based patterns.
- The MutationObserver iteration cap (MAX_OBSERVER_ITERATIONS = 5000) will silence the sentinel on pages with extremely high DOM churn (e.g., infinite scroll with thousands of items). Mitigation: the cap emits a console.warn before disconnecting, making the silence visible. Adjust the constant upward for high-churn pages if needed.
- The sentinel is guarded by import.meta.env.DEV — it will not run in Netlify preview deployments unless ASTRO_DEV=true is set in the preview environment. The Playwright CI test covers this gap for preview branches, but manual QA on preview URLs will not have the sentinel active. Mitigation: optionally enable the sentinel in preview environments by checking a SENTINEL_ENABLED env var in addition to DEV.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
