---
finding_id: "a11y-6-prefers-reduced-motion-unverified"
title: "prefers-reduced-motion support unverified — no animations detected in CSS metrics"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Unguarded transitions and animations can trigger vestibular symptoms (dizziness, nausea) in users with vestibular disorders."
fix_summary: "Audit the site's CSS for all transition and animation declarations, then wrap every motion declaration in a @media (prefers-reduced-motion: reduce) block that disables or replaces it."
confidence_tier: "confirmed"
---

# prefers-reduced-motion support unverified — no animations detected in CSS metrics

**Finding:** prefers-reduced-motion support unverified — no animations detected in CSS metrics  
**Severity:** Low  
**Why this matters:** Unguarded transitions and animations can trigger vestibular symptoms (dizziness, nausea) in users with vestibular disorders.  
**Root cause:** Isolated issue  
**Fix:** Audit the site's CSS for all transition and animation declarations, then wrap every motion declaration in a @media (prefers-reduced-motion: reduce) block that disables or replaces it.

> **Evidence Basis:** Confirmed

---

## Impact

- **Wcag Compliance:** Unguarded transitions and animations can trigger vestibular symptoms (dizziness, nausea) in users with vestibular disorders. WCAG 2.3.3 (AAA) and 2.1 Success Criterion 2.3.1 address motion. Respecting prefers-reduced-motion removes a documented trigger for this user population and satisfies the WCAG 2.1 AA requirement that no content causes seizures or physical reactions.
- **Legal Liability:** ADA web accessibility lawsuits are well-documented and increasing. Demonstrable failure to respect a user-expressed OS-level accessibility preference (prefers-reduced-motion) is a concrete, auditable WCAG gap. Closing it removes a specific, verifiable compliance exposure.
- **Seo And Core Web Vitals:** Removing unnecessary transitions reduces the risk of layout shifts (CLS) triggered by transition-driven geometry changes. No direct ranking signal, but CLS is a Core Web Vitals metric with documented ranking impact.
- **User Experience:** Users who have enabled reduced-motion at the OS level have expressed a preference. Honoring it prevents involuntary motion exposure and reduces the likelihood of immediate page abandonment by this population.

## How to verify

**What to look for:** The page has 0 images, no video embeds, and a lightweight 57-rule CSS file.. No auto-playing animations, carousels, or video elements are present in the DOM.

**Measured evidence:**
- Css Rules: 57
- Animations Detected: none in available data
- Auto Play Media: none detected
- Verification Needed: Confirm no CSS transitions/animations exist that should respect prefers-reduced-motion
- Dom Elements: 140
- Images: 0
- Video Elements: 0
- Auto Play Detected: False

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
Audit the site's CSS for all transition and animation declarations, then wrap every motion declaration in a @media (prefers-reduced-motion: reduce) block that disables or replaces it. Add a CI-level CSS lint rule so future motion additions are caught before deployment.

### How
1. Run a grep across all CSS files (including Astro component <style> blocks) to enumerate every transition, animation, and animation-name declaration: `grep -rn --include='*.css' --include='*.astro' --include='*.vue' --include='*.svelte' 'transition\|animation' src/`
2. For each match, classify it as: (a) purely decorative micro-interaction (hover color, focus ring glow), (b) layout-shifting motion (slide-in, expand/collapse), or (c) looping/auto-playing animation. Classes (b) and (c) are vestibular triggers; class (a) is low-risk but still requires coverage.
3. In the global stylesheet, add a single @media (prefers-reduced-motion: reduce) block at the end of the file that resets all transition and animation properties to instant. This is the safe-default pattern — it catches any declaration the grep missed and any future additions that slip through review.
4. For any JS-driven class toggles that trigger CSS transitions (e.g., adding .is-open to a drawer), verify the transition is defined in CSS (not inline style), so the @media block in step 3 already covers it. If the transition is applied via inline style or JS animation API, add a matchMedia guard in the JS module.
5. Add a stylelint rule (stylelint-a11y or a custom rule) that warns when transition or animation appears outside a @media (prefers-reduced-motion) block. Wire this into the existing CI pipeline so violations block merge.
6. Manually verify in Chrome DevTools: open Rendering panel → Emulate CSS media feature prefers-reduced-motion → confirm all hover transitions and focus animations are instant.

### Code examples
```
/* ============================================================
   FILE: src/styles/global.css
   SCOPE: Appended at end of file — does not modify existing rules.
   Targets only transition and animation properties.
   Does NOT touch color, layout, or non-motion properties.
   ============================================================ */

/* Safe-default motion reset.
   Rationale: A blanket reset at the end of the cascade is the
   most resilient pattern for a 57-rule stylesheet — it catches
   declarations the grep audit may have missed and future
   additions that bypass review. Specificity is intentionally
   broad here because the goal is a universal safety net.
   Sites with intentional reduced-motion alternatives (e.g., a
   cross-fade replaced by an instant swap) should override this
   block with component-scoped @media rules instead. */
@media (prefers-reduced-motion: reduce) {
  /* Disable all transitions and animations globally.
     The !important is deliberate: this is a user accessibility
     preference and must win over component-level specificity. */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
}
/* ============================================================
   ALTERNATIVE: Component-scoped pattern (preferred when the
   site has intentional reduced-motion alternatives, not just
   removal). Use this instead of the blanket reset if specific
   transitions need a non-motion substitute rather than instant.

   SCOPE: Replaces a specific hover transition on nav links.
   Existing behavior: color fades over 0.2s on hover.
   Change: color becomes instant under reduced-motion.
   No other properties are affected.
   ============================================================ */

/* Existing rule — DO NOT MODIFY */
.nav__link {
  color: var(--color-text);
  transition: color 0.2s ease;
}

/* Reduced-motion override — scoped to .nav__link only */
@media (prefers-reduced-motion: reduce) {
  .nav__link {
    transition: none;
  }
}
// ============================================================
// FILE: src/utils/motion.ts
// PURPOSE: JS-driven animation guard for any imperative motion
// (e.g., JS-controlled drawer, accordion, scroll-to).
// SCOPE: Only affects code paths that call animateElement().
// Does NOT touch CSS-driven transitions — those are handled
// by the @media block in global.css.
// ============================================================

// Named constant — rationale: 0ms duration causes some browsers
// to skip transitionend events; 1ms is the safe minimum that
// still fires the event reliably.
const REDUCED_MOTION_DURATION_MS = 1 as const;

// Cache the MediaQueryList so we are not re-querying on every call.
// Precondition: window exists (this module is client-only).
let motionQuery: MediaQueryList | null = null;

function getMotionQuery(): MediaQueryList | null {
  // Feature-detect before accessing — SSR environments lack window.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  if (!motionQuery) {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  return motionQuery;
}

export function prefersReducedMotion(): boolean {
  const query = getMotionQuery();
  // If matchMedia is unavailable (SSR, old browser), default to
  // false — do not suppress motion for users who have not expressed
  // a preference. This is the conservative safe default.
  return query !== null ? query.matches : false;
}

/**
 * Animate an element's height from 0 to its natural height
 * (accordion / drawer expand pattern).
 *
 * Control flow:
 *   1. Guard: if reduced-motion, set height instantly and return.
 *   2. Measure natural height synchronously before any mutation.
 *   3. Set initial state (height: 0) synchronously.
 *   4. requestAnimationFrame defers the target height assignment
 *      to the next paint — prevents the browser collapsing the
 *      0→target transition into a single frame (no animation).
 *   5. transitionend listener cleans up inline height so CSS
 *      can take over (e.g., height: auto for responsive resize).
 *   6. Timeout fallback: if transitionend never fires (element
 *      removed mid-animation, display:none, etc.), the cleanup
 *      still runs after TRANSITION_TIMEOUT_MS.
 *
 * Preconditions:
 *   - element is in the DOM and visible (not display:none).
 *   - element has a CSS transition: height defined (or reduced-
 *     motion block sets transition:none).
 *   - Caller is responsible for setting element to display:block
 *     before calling this function.
 */

// Site-specific assumption: matches the CSS transition-duration
// on expandable components. Adjust if the CSS value changes.
const TRANSITION_DURATION_MS = 300 as const;

// Safety timeout: slightly longer than the CSS transition to
// guarantee cleanup even if transitionend does not fire.
const TRANSITION_TIMEOUT_MS = TRANSITION_DURATION_MS + 100 as const;

export function expandElement(element: HTMLElement): void {
  if (prefersReducedMotion()) {
    // Instant expand — no transition, no rAF needed.
    element.style.height = 'auto';
    element.removeAttribute('aria-hidden');
    return;
  }

  // Measure before mutation to avoid forced reflow mid-animation.
  const naturalHeight = element.scrollHeight;

  element.style.height = '0px';
  element.style.overflow = 'hidden';

  let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

  function cleanup(): void {
    if (cleanupTimeout !== null) {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = null;
    }
    element.removeEventListener('transitionend', onTransitionEnd);
    // Remove inline height so CSS (height: auto) can take over.
    element.style.height = '';
    element.style.overflow = '';
  }

  function onTransitionEnd(event: TransitionEvent): void {
    // Guard: only respond to the height transition, not any
    // co-occurring transitions on the same element.
    if (event.propertyName !== 'height') return;
    cleanup();
  }

  element.addEventListener('transitionend', onTransitionEnd);

  // Fallback: guarantee cleanup if transitionend never fires.
  cleanupTimeout = setTimeout(cleanup, TRANSITION_TIMEOUT_MS);

  // Defer target assignment to next frame — required for the
  // browser to register the 0px starting state before animating.
  requestAnimationFrame(() => {
    element.style.height = `${naturalHeight}px`;
  });
}
// ============================================================
// FILE: .stylelintrc.json (or merge into existing config)
// PURPOSE: CI enforcement — blocks merges that introduce
// transition/animation outside a prefers-reduced-motion guard.
// SCOPE: Applies to all CSS and Astro component <style> blocks.
// Requires: stylelint >=15, stylelint-scss (if used).
// ============================================================
{
  "extends": ["stylelint-config-standard"],
  "plugins": [],
  "rules": {
    // Warn (not error) on transition/animation outside a
    // @media (prefers-reduced-motion) block.
    // Set to "error" once the existing codebase is clean.
    "declaration-property-value-disallowed-list": null,
    "media-feature-name-no-unknown": true,
    // Custom rule via stylelint-plugin-no-unsupported-browser-features
    // is optional; the manual grep + DevTools emulation check
    // in step 6 of the how-to is the primary verification gate.
    "no-descending-specificity": true
  },
  "overrides": [
    {
      "files": ["**/*.astro"],
      "customSyntax": "postcss-html"
    }
  ]
}
// NOTE: stylelint does not ship a built-in rule that enforces
// 'transition must be inside @media (prefers-reduced-motion)'.
// The enforcement options are:
//   (a) Use stylelint-a11y plugin (community, verify maintenance status).
//   (b) Write a custom stylelint plugin (30–60 min, most reliable).
//   (c) Use the grep command in step 1 as a pre-commit hook via
//       lint-staged — simpler and zero plugin dependency.
// Option (c) pre-commit hook shown below:

// package.json addition:
// "lint-staged": {
//   "*.{css,astro,vue,svelte}": [
//     "grep -n 'transition:\\|animation:' {} | grep -v '@media.*prefers-reduced-motion' && exit 1 || exit 0"
//   ]
// }
//
// LIMITATION: The grep hook is line-based and will not catch a
// transition declaration that is textually inside a
// prefers-reduced-motion block but structurally outside it due
// to a missing closing brace. The DevTools emulation check in
// step 6 is the authoritative verification gate.
```

## Risks
- The blanket *,*::before,*::after reset with !important will override any component-scoped reduced-motion alternative (e.g., a cross-fade replaced by an instant swap). If the site later introduces intentional reduced-motion substitutes, those rules must be placed inside their own @media (prefers-reduced-motion: reduce) block with higher specificity, or the blanket reset must be removed in favor of component-scoped overrides. Document this constraint in the codebase.
- The 0.01ms animation-duration value (not 0ms) is intentional — some browsers skip animationend/transitionend events at exactly 0ms, which can leave JS cleanup listeners dangling. If any existing JS listens for transitionend to trigger post-animation logic (e.g., removing display:none after a fade-out), those handlers will still fire at 0.01ms. Verify no existing JS depends on transitionend firing at a specific duration threshold.
- The grep-based pre-commit hook is line-based and cannot parse CSS structure. A transition declaration inside a correctly written @media (prefers-reduced-motion) block will still match the grep pattern and produce a false positive. Teams must tune the hook or replace it with a proper stylelint plugin to avoid blocking legitimate compliant code.
- The expandElement() JS utility assumes the target element has a CSS transition: height defined. If the element's transition is removed by the @media reset before expandElement() is called, the transitionend event will fire at 0.01ms — the cleanup runs correctly, but the timeout fallback will also fire 100ms later (harmless double-cleanup). The cleanup function is idempotent (removeEventListener on an already-removed listener is a no-op), so this is safe but worth noting.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
