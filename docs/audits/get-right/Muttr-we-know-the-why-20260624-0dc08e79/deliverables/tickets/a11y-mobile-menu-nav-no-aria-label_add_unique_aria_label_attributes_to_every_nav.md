---
finding_id: "a11y-mobile-menu-nav-no-aria-label"
title: "Multiple <nav> elements missing distinguishing aria-label attributes — screen readers cannot differentiate landmarks"
severity: "medium"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: "Resolves WCAG 2.1 Level A violations 1.3.1 and 4.1.2."
fix_summary: "Add unique aria-label attributes to every <nav> element in the Astro layout and component templates so screen readers can distinguish landmarks."
confidence_tier: "confirmed"
---

# Multiple <nav> elements missing distinguishing aria-label attributes — screen readers cannot differentiate landmarks

**Finding:** Multiple <nav> elements missing distinguishing aria-label attributes — screen readers cannot differentiate landmarks  
**Severity:** Medium  
**Why this matters:** Resolves WCAG 2.1 Level A violations 1.3.1 and 4.1.2.  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Add unique aria-label attributes to every <nav> element in the Astro layout and component templates so screen readers can distinguish landmarks.

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility Compliance:** Resolves WCAG 2.1 Level A violations 1.3.1 and 4.1.2. Eliminates the condition where screen reader users encounter multiple indistinguishable 'navigation' landmarks, which forces trial-and-error navigation on every page. Adding aria-hidden to the closed mobile menu also eliminates duplicate link announcements (the ghost-markup finding), halving the number of navigation items screen reader users must traverse.
- **Legal Liability:** WCAG Level A failures are the most commonly cited violations in ADA web accessibility lawsuits. Landmark distinguishability is a concrete, testable failure that automated audit tools (axe-core, Lighthouse) flag — meaning it is trivially discoverable by plaintiff firms running automated scans. Fixing this removes a documentable violation from every page on the site.
- **Seo:** Screen reader landmark structure aligns with how search engines interpret page regions. Properly labeled nav landmarks reinforce the semantic signal that the site has distinct navigation contexts, which supports crawl efficiency and internal link equity distribution.
- **Bounce Rate:** Assistive technology users who cannot distinguish navigation regions are more likely to abandon the site. Fixing this removes a friction point for that user segment on every page load.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/legal/terms/
**Element:** Mobile menu link — duplicate of desktop nav, needs distinct landmark labeling
**XPath:** `//*[@id='mobile-menu']/div[1]/a[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id='mobile-menu']/div[1]/a[1]")`
4. This will highlight the problematic element

**Note:** This ticket shows one example location. See `deliverables/issues-list.md` for all occurrences across all pages.

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
Add unique aria-label attributes to every <nav> element in the Astro layout and component templates so screen readers can distinguish landmarks. Hide the mobile nav from the accessibility tree when it is visually closed.

### How
1. Locate every <nav> element across the Astro component tree. Expected locations: header component (desktop nav), mobile menu component, footer component, any breadcrumb or sidebar component.
2. Assign a unique, human-readable aria-label to each <nav>. Use consistent labels across the site: 'Main navigation', 'Mobile navigation', 'Footer navigation', 'Breadcrumb'. These labels must be stable strings, not dynamic or interpolated from CMS content.
3. For the mobile menu <nav>, add a reactive aria-hidden attribute bound to the menu's open/closed state. When the menu is visually hidden (display:none, translateX off-screen, etc.), set aria-hidden="true" so screen readers skip the duplicate landmark entirely. When the menu opens, set aria-hidden="false".
4. Verify that the toggle button controlling the mobile menu already has aria-expanded bound to the same state variable. If not, add it.
5. Add eslint-plugin-jsx-a11y (or the Astro-compatible equivalent astro-eslint-plugin with a11y rules) to the project's lint config to catch future unlabeled landmarks at build time.
6. Test with at least one screen reader (VoiceOver on macOS is free) by pressing the rotor/landmarks shortcut and confirming each <nav> appears with its unique label.

### Code examples
```
---
// src/components/Header.astro
// Desktop navigation — always visible on wide viewports
// Mobile navigation — toggled via JS, hidden by default
---
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>

  <button
    id="mobile-menu-toggle"
    type="button"
    aria-expanded="false"
    aria-controls="mobile-menu"
  >
    <span class="sr-only">Open menu</span>
    <!-- hamburger icon -->
  </button>

  <!--
    The mobile menu is hidden by default via CSS (display:none on .mobile-menu)
    and revealed via .mobile-menu.is-open (display:block or equivalent).
    IMPORTANT: the CSS hidden state MUST use display:none or visibility:hidden —
    NOT transform/translateX alone — so that focusable children are removed from
    the tab order when closed. Verify both rules exist before deploying.
  -->
  <nav
    id="mobile-menu"
    aria-label="Mobile navigation"
    aria-hidden="true"
    inert
    class="mobile-menu"
  >
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
</header>

<script>
  // --- Site-specific assumptions (adjust per implementation) ---
  /** @type {string} Selector for the mobile menu toggle button */
  const TOGGLE_SELECTOR = '#mobile-menu-toggle';
  /** @type {string} Selector for the mobile menu nav element */
  const MENU_SELECTOR = '#mobile-menu';
  /** @type {string} CSS class toggled on the menu to show/hide it visually */
  const MENU_OPEN_CLASS = 'is-open';

  function initMobileMenu() {
    const toggle = document.querySelector(TOGGLE_SELECTOR);
    const menu = document.querySelector(MENU_SELECTOR);

    if (!toggle || !menu) {
      return; // Elements not in DOM — nothing to bind
    }

    // Track open state in a closed-over boolean rather than reading from the
    // DOM on each click. This prevents stale reads if any other code path
    // (e.g., a close-on-outside-click handler) modifies aria-expanded
    // independently.
    let isOpen = false;

    function setMenuState(nextOpen) {
      isOpen = nextOpen;
      toggle.setAttribute('aria-expanded', String(isOpen));
      menu.setAttribute('aria-hidden', String(!isOpen));
      // inert removes the menu from tab order and AT tree when closed.
      // Pair with aria-hidden for consistent AT behaviour across browsers.
      if (isOpen) {
        menu.removeAttribute('inert');
      } else {
        menu.setAttribute('inert', '');
      }
      menu.classList.toggle(MENU_OPEN_CLASS, isOpen);
    }

    // Ensure initial state is closed
    setMenuState(false);

    // Use an AbortController so the listener can be torn down cleanly on
    // Astro View Transitions navigations (see note below).
    let controller = new AbortController();

    toggle.addEventListener(
      'click',
      () => setMenuState(!isOpen),
      { signal: controller.signal }
    );

    // Close on Escape — WCAG 2.1 Disclosure Navigation Menu pattern
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && isOpen) {
          setMenuState(false);
          toggle.focus(); // Return focus to the trigger
        }
      },
      { signal: controller.signal }
    );

    // --- Astro View Transitions cleanup ---
    // If the site uses Astro View Transitions with transition:persist on the
    // header, this script re-runs on each navigation while the DOM node is
    // reused. The AbortController tears down the previous listeners before
    // new ones are attached, preventing stacking.
    // NOTE: without View Transitions, Astro replaces the full DOM on
    // navigation and this cleanup is a no-op — safe either way.
    document.addEventListener(
      'astro:before-swap',
      () => {
        controller.abort();
        controller = new AbortController();
      },
      { once: true }
    );
  }

  initMobileMenu();
</script>
<!-- src/components/Footer.astro -->
<footer>
  <nav aria-label="Footer navigation">
    <ul>
      <li><a href="/privacy">Privacy Policy</a></li>
      <li><a href="/terms">Terms of Service</a></li>
    </ul>
  </nav>
</footer>
<!-- src/components/Breadcrumb.astro -->
<!-- If breadcrumbs use a <nav>, label it distinctly -->
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Widget</li>
  </ol>
</nav>
// Accessibility linting strategy — two complementary tools
//
// 1. eslint-plugin-jsx-a11y covers .jsx/.tsx files only (not .astro templates).
//    It has no 'landmark-unique' rule — landmark uniqueness is not detectable
//    at lint time via this plugin. Use it for any React/JSX components in the
//    project for general a11y rule coverage.
//
// .eslintrc.cjs
// Requires: npm install --save-dev eslint-plugin-jsx-a11y
module.exports = {
  plugins: ['jsx-a11y'],
  extends: ['plugin:jsx-a11y/recommended'],
  // No 'landmark-unique' rule exists in jsx-a11y@6.x — do not add it.
  // Landmark uniqueness is enforced at runtime via axe-core (see below).
};

// 2. For .astro templates, use eslint-plugin-astro with its bundled a11y rules.
//    Requires: npm install --save-dev eslint-plugin-astro
//
// astro.eslint.config.mjs (flat config)
import astro from 'eslint-plugin-astro';
export default [
  ...astro.configs.recommended,
  // astro/jsx-a11y/* rules mirror jsx-a11y for .astro template syntax
];

// 3. Landmark uniqueness — enforce via axe-core in CI.
//    axe-core's 'landmark-unique' rule fires at runtime against the rendered
//    DOM and is the correct tool for this check. Lint-time analysis cannot
//    detect duplicate landmarks because they may be conditionally rendered.
//
// Example: Playwright + axe-core integration
// Requires: npm install --save-dev @axe-core/playwright
//
// tests/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('no landmark-unique violations on homepage', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withRules(['landmark-unique'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

## Risks
- Scope containment: The fix modifies only aria-label and aria-hidden attributes on existing <nav> elements and the click handler for the mobile toggle. No visual styling, layout, or DOM structure changes. The only behavioral change is that the mobile menu's aria-hidden flips with the toggle — if the existing toggle JS already manipulates aria-hidden or aria-expanded, the new handler could conflict. Mitigation: search the codebase for existing aria-expanded and aria-hidden bindings on #mobile-menu-toggle and #mobile-menu before applying; consolidate into the single setMenuState function.
- Astro View Transitions: If the site uses Astro's View Transitions (client-side navigation), the inline <script> re-runs on each navigation by default. The initMobileMenu function is idempotent (querySelector + single addEventListener) but could stack event listeners across navigations if Astro persists the header via transition:persist. Mitigation: use an AbortController stored on the element to tear down the previous listener before attaching a new one, or gate with a data attribute flag (e.g., data-menu-initialized).
- eslint-plugin-jsx-a11y is designed for JSX/TSX. Astro's .astro template syntax is not JSX — the plugin will only lint .jsx/.tsx files in the project. For .astro files, accessibility linting requires @nicolo-ribaudo/eslint-plugin-astro or manual axe-core checks in CI. The ESLint config example covers any React/JSX components in the project but will not automatically lint .astro templates.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
