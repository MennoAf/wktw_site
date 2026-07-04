---
finding_id: "visual-stability-cls-excellent"
title: "Visual stability is excellent — CLS 0.000, no shift sources detected"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "CLS 0.000 is the current score because the page has no images, minimal JS, and a small DOM."
fix_summary: "Codify the structural conditions producing CLS 0.000 into enforceable extension guardrails — CSS custom properties, a layout contract mixin, and a CI lint rule — so that adding images, dynamic conten…"
confidence_tier: "confirmed"
---

# Visual stability is excellent — CLS 0.000, no shift sources detected

**Finding:** Visual stability is excellent — CLS 0.000, no shift sources detected  
**Severity:** Low  
**Why this matters:** CLS 0.000 is the current score because the page has no images, minimal JS, and a small DOM.  
**Root cause:** Isolated issue  
**Fix:** Codify the structural conditions producing CLS 0.000 into enforceable extension guardrails — CSS custom properties, a layout contract mixin, and a CI lint rule — so that adding images, dynamic conten…

> **Evidence Basis:** Confirmed

---

## Impact

- **Cls Score Preservation:** CLS 0.000 is the current score because the page has no images, minimal JS, and a small DOM. Each extension vector (images, dynamic injection, new fonts) is an independent path to CLS regression. The CSS layout contract eliminates the image and dynamic-content vectors at the point of authoring. The font-display: optional directive eliminates the font-swap vector. The CI lint rule converts dimension omission from a silent runtime failure into a build-time error, catching regressions before they reach production. Without these guardrails, the first developer who adds a hero image or A/B test variant to this template will silently degrade CLS — the current score reflects page simplicity, not architectural resilience.
- **Search Ranking Stability:** CLS is a Core Web Vitals signal used in Google's page experience ranking. Maintaining CLS 0.000 as the template grows preserves the current ranking signal. Allowing CLS to degrade to the 'poor' threshold (≥0.25) would move the page into the lowest-performing cohort for this signal.
- **Conversion Path Integrity:** Above-fold layout shifts during checkout, form interaction, or CTA rendering cause mis-taps and abandoned interactions. The MutationObserver sentinel surfaces these regressions in development before they reach users.

## How to verify

**What to look for:** CLS is 0.000 — perfect score.. No images on the page eliminates dimension reservation concerns.

**Measured evidence:**
- Cls Score: 0.0
- Dom Elements: 176
- Js Dependency: low
- Images: 0
- Dynamic Injection: none detected
- Content Visibility Needed: False
- Cls: 0.0
- Images Total: 0

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
Codify the structural conditions producing CLS 0.000 into enforceable extension guardrails — CSS custom properties, a layout contract mixin, and a CI lint rule — so that adding images, dynamic content, or additional fonts to this template cannot silently degrade CLS without a build-time failure.

### How
1. Audit the three fragile extension vectors identified in the finding: (a) image insertion without reserved dimensions, (b) JS-injected content (personalization, A/B variants, hydrated components) without intrinsic-size containment, (c) additional web fonts without an explicit font-display strategy. These are the only paths through which CLS can re-enter this template.
2. Add a CSS layout contract to the template's stylesheet that enforces dimension reservation on any img, video, or iframe added to this template. Scope the rule to the template's root selector (e.g., .page--simple or the body class specific to this page type) using :not() exclusions to avoid touching globally styled media elsewhere. Do NOT write a bare img {} rule.
3. Add content-visibility: auto with contain-intrinsic-size in px/rem (never time units, never percentages — percentages resolve to 0 before layout, defeating the purpose) to any below-fold container that may receive dynamically injected content. This reserves layout space before content arrives, preventing post-paint reflow.
4. For any future web font added to this template, enforce font-display: optional (not swap) as the default. 'optional' gives the browser a zero-reflow path: if the font is not cached, the fallback is used permanently for that paint — no swap, no shift. 'swap' is acceptable only if brand guidelines explicitly require the custom font to always render, and only after confirming fallback metrics are close enough to avoid measurable shift.
5. Add a Stylelint rule (or equivalent CSS linter in the project's toolchain) that fails the build if any img, video, or iframe selector within the template scope lacks both width and height declarations or aspect-ratio. This makes dimension omission a build error, not a runtime surprise.
6. If the project uses a JS framework with client-side rendering or hydration, add a MutationObserver in development mode only (guarded by process.env.NODE_ENV === 'development') that logs a console.warn when a DOM node is inserted above the fold after first paint. This surfaces hydration-driven CLS during development before it reaches production. Disconnect the observer on page unload to prevent memory leaks.

### Code examples
```
/* ============================================================
   CLS Layout Contract — scoped to this template's root class.
   SITE-SPECIFIC ASSUMPTION: .page--simple is the body or wrapper
   class for this page type. Replace with the actual selector.
   This rule must NOT be applied globally — it is intentionally
   scoped to prevent regressions on other templates.
   ============================================================ */

/* Named constants for intrinsic containment sizes.
   Adjust per actual content column widths in your design system. */
:root {
  --cls-guard-content-width: 720px;   /* max content column width */
  /* TODO (blocks deployment): measure actual rendered height of each
     below-fold section and replace this estimate. An incorrect
     contain-intrinsic-size is itself a CLS source on back-navigation. */
  --cls-guard-below-fold-height: 400px;

  /* Fallback aspect ratio used when width/height HTML attributes are
     absent. 16/9 is a safe default for most media; override per
     element with a more specific custom property where needed.
     The lint rule (see stylelint config below) is the primary
     enforcement layer — this CSS is a belt-and-suspenders fallback. */
  --media-aspect-ratio: 16 / 9;
}

/* Dimension reservation: any media element added to this template
   must have width + height HTML attributes (primary mechanism —
   browsers compute aspect-ratio from these natively since
   Chrome 79 / Firefox 71 / Safari 15). The CSS aspect-ratio
   declaration below is a fallback for cases where attributes are
   absent; the lint rule catches that absence at build time.

   NOTE: aspect-ratio: attr(width) / attr(height) (CSS Values Level 5)
   is NOT implemented in any shipping browser as of 2024 and resolves
   to `auto` — it is NOT used here. The working pattern is:
     1. HTML attributes → browser computes aspect-ratio natively.
     2. CSS custom property fallback → catches attribute-less elements
        that slip past the lint rule (e.g., CMS-injected markup).

   The :not() exclusions protect decorative images (alt='') and
   SVG icons already sized by their container. aria-hidden is NOT
   used as the exclusion signal — decorative images should use
   alt='' per WCAG, and aria-hidden has distinct semantics. */
.page--simple img:not([alt='']):not(.icon),
.page--simple video,
.page--simple iframe {
  aspect-ratio: var(--media-aspect-ratio);
  max-inline-size: 100%;
  block-size: auto;
}

/* Below-fold container containment.
   content-visibility: auto skips rendering off-screen content.
   contain-intrinsic-size must use px/rem — percentage resolves
   to 0 before layout, which defeats space reservation entirely.

   KNOWN LIMITATIONS (evaluate before deploying):
   - Safari ≤17: content-visibility not supported; graceful degradation
     (no containment benefit, no CLS harm). Do not rely on this for
     Safari CLS protection.
   - Ctrl+F / find-in-page: content inside skipped sections is not
     searchable until the section enters the viewport.
   - Anchor navigation: links targeting anchors inside these sections
     may land at incorrect scroll positions until re-render completes.
   - Googlebot: content in skipped sections may not be indexed on first
     crawl. Evaluate whether below-fold sections contain indexable text,
     structured data, or internal links before deploying. */
.page--simple .below-fold-section {
  content-visibility: auto;
  /* SITE-SPECIFIC ASSUMPTION: .below-fold-section is the class used
     for off-screen content blocks. Replace with the actual selector.
     If sections are identified by position rather than class, use a
     more specific descendant strategy (e.g., .page--simple > section:not(:first-child)). */
  contain-intrinsic-size: 0px var(--cls-guard-below-fold-height);
}
/* Stylelint config — save as .stylelintrc.js (JS format allows comments).
   Enforces two rules on this template's stylesheet:
     1. img/video/iframe must carry width + height HTML attributes
        (caught via stylelint-use-logical or a custom plugin — see note).
     2. Any @font-face block must declare font-display: optional
        (or an explicit allowlist value).

   NOTE ON PLUGIN CHOICE:
   Stylelint does not ship a built-in rule that enforces HTML attribute
   presence from CSS. The width/height attribute requirement is best
   enforced at the HTML/template layer via:
     - eslint-plugin-jsx-a11y (rule: img-redundant-alt, and custom rules)
     - HTMLHint (rule: attr-value-not-empty)
     - A custom Stylelint plugin using the PostCSS AST if CSS-layer
       enforcement is preferred.
   The @font-face font-display rule below uses the built-in
   `font-face-no-missing-generic-family-keyword` as a model; the
   font-display enforcement requires `stylelint-font-display` plugin.
*/

// .stylelintrc.js
module.exports = {
  plugins: [
    // npm install --save-dev stylelint-font-display
    // Enforces font-display on every @font-face block.
    'stylelint-font-display'
  ],
  rules: {
    // Enforce font-display on all @font-face blocks.
    // Allowlist: 'optional' preferred (zero-reflow path).
    // 'swap' permitted only with explicit brand sign-off (see risks).
    // 'auto', 'block', 'fallback' are disallowed — each carries
    // FOIT or unbounded swap risk.
    'font-display': ['optional', 'swap'],

    // Enforce aspect-ratio or explicit dimensions on media elements.
    // Primary mechanism: HTML width + height attributes (browser
    // computes aspect-ratio natively from these since Chrome 79 /
    // Firefox 71 / Safari 15). Enforce at the template/HTML layer
    // using the tool appropriate to your stack:
    //
    //   JSX/React:  eslint-plugin-jsx-a11y + custom ESLint rule
    //   Liquid/Twig/Nunjucks: HTMLHint with attr-value-not-empty
    //   Plain HTML:  html-validate (rule: attribute-allowed-values)
    //
    // Example html-validate config (.htmlvalidate.json):
    // {
    //   "rules": {
    //     "attribute-required": [
    //       "error",
    //       {
    //         "img": ["width", "height", "alt"],
    //         "video": ["width", "height"],
    //         "iframe": ["width", "height", "title"]
    //       }
    //     ]
    //   }
    // }
  }
};
/**
 * Development-only CLS sentinel.
 * Detects above-fold DOM insertions after first paint and warns.
 * NEVER ships to production — guarded by NODE_ENV check.
 * Disconnects on pagehide to prevent memory leaks.
 *
 * REQUIRED PLACEMENT: Load this script with `defer` (or inside a
 * DOMContentLoaded handler) so document.body exists when it runs.
 * Do NOT place it as a render-blocking script — doing so causes the
 * sentinel to observe initial-render mutations with firstPaintTime === 0,
 * silently skipping the most important window.
 *
 * Framework usage example (Next.js):
 *   useEffect(() => {
 *     if (process.env.NODE_ENV === 'development') {
 *       import('./cls-sentinel').then(m => m.installCLSSentinel());
 *     }
 *   }, []);
 *
 * SPA NOTE: pagehide does not fire on pushState-based navigation.
 * For SPA frameworks, call the returned teardown() function from
 * your router's beforeRouteLeave / componentWillUnmount lifecycle.
 *
 * Preconditions this logic assumes:
 *   1. PerformancePaintTiming is available (Chrome 60+, Firefox 84+,
 *      Safari 15.4+). Guarded by feature detection.
 *   2. IntersectionObserver is available. Guarded by feature detection.
 *   3. This script runs after DOMContentLoaded so document.body exists.
 *   4. NODE_ENV is set by the build tool (Vite, webpack, Next.js all do this).
 *
 * This is NOT a CLS fix — it is a development regression detector.
 */
(function installCLSSentinel() {
  // Production guard — this block must never execute in production.
  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  // Feature detection before any API use.
  if (
    !('IntersectionObserver' in window) ||
    !('PerformanceObserver' in window) ||
    !('MutationObserver' in window)
  ) {
    return;
  }

  // Named constants — no magic numbers.
  const PAGEHIDE_EVENT = 'pagehide';

  let firstPaintTime = 0;
  let mutationObserver = null;
  // Nodes collected during MutationObserver callbacks, flushed per rAF.
  // Using a Set deduplicates nodes added and re-added in the same tick.
  let pendingNodes = new Set();
  let rafScheduled = false;

  // Synchronous fallback: if first-paint already occurred before this
  // script executed (e.g., deferred load on fast connection), capture
  // it immediately so the MutationObserver guard is not stuck at 0.
  const existingPaintEntries = performance.getEntriesByName('first-paint');
  if (existingPaintEntries.length > 0) {
    firstPaintTime = existingPaintEntries[0].startTime;
  }

  // Async path: capture first-paint if it has not occurred yet.
  const paintObserver = new PerformanceObserver((list) => {
    const entries = list.getEntriesByName('first-paint');
    if (entries.length > 0 && firstPaintTime === 0) {
      firstPaintTime = entries[0].startTime;
      paintObserver.disconnect();
    }
  });

  try {
    paintObserver.observe({ type: 'paint', buffered: true });
  } catch (_) {
    // PerformanceObserver.observe can throw if type is unsupported.
    // Sentinel degrades gracefully — no crash, no warning.
    return;
  }

  /**
   * Flush pending nodes in a single rAF to avoid forcing repeated
   * synchronous layout (getBoundingClientRect) inside the MutationObserver
   * callback. All geometry reads happen in one animation frame.
   */
  function flushPendingNodes() {
    rafScheduled = false;
    if (firstPaintTime === 0) {
      // First paint not yet recorded — discard this batch.
      // Nodes inserted before first paint are expected; they are not
      // post-paint CLS candidates.
      pendingNodes.clear();
      return;
    }

    for (const node of pendingNodes) {
      // Guard: node may have been removed between mutation and rAF flush.
      if (!document.body.contains(node)) continue;

      const rect = node.getBoundingClientRect();
      const isAboveFold = rect.top < window.innerHeight && rect.bottom > 0;

      if (isAboveFold) {
        console.warn(
          '[CLS Sentinel] Above-fold DOM insertion detected after first paint.\n' +
          'This may cause layout shift. Verify the inserting component ' +
          'reserves space before content arrives.\n' +
          'Inserted node:',
          node
        );
      }
    }

    pendingNodes.clear();
  }

  // MutationObserver collects added nodes; geometry checks are batched
  // into a single requestAnimationFrame to avoid forced synchronous layout.
  mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        pendingNodes.add(node);
      }
    }

    if (!rafScheduled && pendingNodes.size > 0) {
      rafScheduled = true;
      requestAnimationFrame(flushPendingNodes);
    }
  });

  // Observe the full document subtree for child additions.
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  function teardown() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    pendingNodes.clear();
  }

  // Teardown on page unload — prevents memory leaks on MPA navigation.
  // { once: true } is sufficient; the manual removeEventListener inside
  // the handler is omitted because once:true already removes it.
  window.addEventListener(PAGEHIDE_EVENT, teardown, { once: true });

  // Expose teardown for SPA router integration (see SPA NOTE above).
  // Example: router.beforeEach(() => window.__clsSentinelTeardown?.());
  window.__clsSentinelTeardown = teardown;
}());
```

## Risks
- `aspect-ratio: attr(width) / attr(height)` (CSS Values Level 5 typed attr()) is NOT implemented in any shipping browser as of 2024 and resolves to `aspect-ratio: auto` — it has been removed from the code examples entirely. The working mechanism is: (1) HTML `width` and `height` attributes on `<img>`, `<video>`, and `<iframe>` elements — browsers compute aspect-ratio from these natively since Chrome 79 / Firefox 71 / Safari 15; (2) a CSS `aspect-ratio: var(--media-aspect-ratio, 16/9)` custom-property fallback for elements where attributes are absent; (3) a lint rule enforcing attribute presence at build time. The CSS fallback catches CMS-injected markup that bypasses the lint rule; the lint rule is the primary enforcement layer.
- content-visibility: auto can cause incorrect scroll position restoration on back-navigation in some browser versions if contain-intrinsic-size is significantly wrong. Measure actual rendered heights and update the named constant before deploying. Incorrect intrinsic sizes cause scroll jumps, which are themselves a CLS source.
- font-display: optional means the custom font will not render on first visit if it is not already cached. For brand-sensitive pages where the custom font is a design requirement, this is a visible regression. Confirm with design/brand stakeholders before enforcing 'optional' over 'swap'. If 'swap' is required, mitigate shift risk by using the CSS size-adjust and ascent-override descriptors to match fallback font metrics to the web font metrics.
- The MutationObserver sentinel fires on ALL above-fold DOM insertions after first paint, including legitimate ones (e.g., a toast notification, a cookie banner). This will produce false-positive warnings during development. Teams must treat it as a signal to investigate, not an automatic failure. Do not promote this observer to production under any circumstances — it has no throttle and will degrade runtime performance on content-heavy pages.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
