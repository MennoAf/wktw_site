---
finding_id: "ux-mobile-hamburger-discoverability"
title: "Hamburger menu button has empty accessible name and 40x40px touch target — below WCAG minimum"
severity: "high"
root_cause_cluster: "Global Touch Target and Interactive Element Sizing Deficit"
why_this_matters: "This button is the sole gateway to mobile navigation."
fix_summary: "Add an accessible name (aria-label) to the hamburger menu button and increase its touch target to 48x48 CSS pixels minimum."
confidence_tier: "confirmed"
---

# Hamburger menu button has empty accessible name and 40x40px touch target — below WCAG minimum

**Finding:** Hamburger menu button has empty accessible name and 40x40px touch target — below WCAG minimum  
**Severity:** High  
**Why this matters:** This button is the sole gateway to mobile navigation.  
**Root cause:** Global Touch Target and Interactive Element Sizing Deficit  
**Fix:** Add an accessible name (aria-label) to the hamburger menu button and increase its touch target to 48x48 CSS pixels minimum.

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility Legal Risk:** This button is the sole gateway to mobile navigation. Without an accessible name, screen reader users on mobile cannot identify or activate it, rendering the entire site's navigation inaccessible. Adding aria-label and aria-expanded eliminates a WCAG 2.1 Level A failure (4.1.2 Name, Role, Value) and a Level AA failure (2.5.8 Target Size). WCAG Level A failures on primary navigation are high-priority targets in ADA web accessibility litigation. legal_liability=True.
- **Mobile Usability:** Increasing the touch target from 40x40px to 48x48px reduces mis-tap rate for all mobile users, particularly in one-handed use, in-motion, or impaired-dexterity scenarios. The hamburger button is the highest-frequency interactive element on mobile — every session that uses navigation touches it. Reducing interaction friction on this element directly reduces navigation abandonment.
- **Seo Crawl:** Screen-reader-inaccessible navigation can suppress mobile usability scores in Google's page experience signals. Fixing the accessible name removes a flag that Lighthouse and automated accessibility audits surface, which feeds into Core Web Vitals reporting.
- **Bounce Rate:** Motor-impaired users and users in suboptimal touch conditions who mis-tap the undersized button may retry or abandon. Expanding the target eliminates this friction point at the top of every mobile session's navigation funnel.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_003`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/proof/our-site/
**Element:** Button with empty accessible name — likely hamburger menu toggle or footer interaction
**XPath:** `/html/body/footer[1]/div[1]/div[2]/button[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("/html/body/footer[1]/div[1]/div[2]/button[1]")`
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
Add an accessible name (aria-label) to the hamburger menu button and increase its touch target to 48x48 CSS pixels minimum. Both fixes target the single header component template, scoped to avoid side effects on other interactive elements.

### How
1. Locate the hamburger button element in the site header component template. It will be a <button> (or element with role='button') containing only an SVG or icon element, rendered in the mobile-viewport header. Common locations: header.html, Header.jsx, header.liquid, or equivalent partial/component.
2. Add aria-label='Open navigation menu' directly to the <button> element. Do NOT add it to the SVG child — the label belongs on the interactive element itself. If the button already has an aria-label with an empty string, replace it.
3. Add aria-expanded='false' to the button. Wire the toggle logic so aria-expanded flips to 'true' when the menu is open and back to 'false' when closed. This attribute must reflect actual menu state — verify the existing toggle handler updates it.
4. Increase the button's minimum touch target to 48x48px. Apply min-width: 48px and min-height: 48px to the button element using a scoped selector (target by a class, data attribute, or component-specific selector — never a bare 'button' selector). If the button currently has explicit width/height of 40px, replace those values. If using Tailwind, change w-10 h-10 to min-w-12 min-h-12 (48px). The visual icon inside can remain its current size — the tap target expansion uses padding or min-dimensions on the button, not the icon.
5. Verify the SVG icon inside the button has aria-hidden='true' and focusable='false' to prevent screen readers from attempting to announce the decorative icon separately.
6. Test: (a) Screen reader on iOS VoiceOver and Android TalkBack — button must announce 'Open navigation menu, button' (collapsed) or 'Open navigation menu, button, expanded' (expanded). (b) Tap target in Chrome DevTools mobile emulation — button bounding box must be ≥48x48px. (c) Visual regression — confirm the 8px size increase does not cause header layout overflow or element overlap at the narrowest supported viewport (320px).

### Code examples
```
/* === FIX: Hamburger Menu Button — Accessible Name + Touch Target === */

/* --- HTML (before) --- */
/*
<button class="mobile-nav-toggle">
  <svg viewBox="0 0 24 24" width="24" height="24">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2"/>
  </svg>
</button>
*/

/* --- HTML (after) --- */
/*
<button
  class="mobile-nav-toggle"
  aria-label="Open navigation menu"
  aria-expanded="false"
>
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2"/>
  </svg>
</button>
*/

/* --- CSS — scoped to the hamburger button only --- */
/* SITE-SPECIFIC ASSUMPTION: .mobile-nav-toggle is the class on the hamburger button.
   Adjust selector to match actual class/data-attribute in your header component. */
.mobile-nav-toggle {
  /* Touch target: WCAG 2.5.8 minimum 48x48 CSS pixels */
  min-width: 48px;  /* was 40px — 8px increase */
  min-height: 48px; /* was 40px — 8px increase */
  
  /* Center the icon within the expanded tap area */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* Preserve existing visual appearance — icon stays same size,
     extra tap area comes from padding, not icon scaling */
  padding: 12px; /* (48 - 24) / 2 = 12px padding around a 24px icon */
  
  /* Reset any inherited box-sizing issues */
  box-sizing: border-box;
  
  /* Ensure the button itself has a visible focus indicator */
  /* SITE-SPECIFIC ASSUMPTION: adjust outline color to match brand */
}

.mobile-nav-toggle:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Prevent SVG from capturing pointer events or expanding beyond icon size */
.mobile-nav-toggle > svg {
  pointer-events: none;
  flex-shrink: 0;
}
/* === JavaScript — aria-expanded toggle wiring === */
/* SITE-SPECIFIC ASSUMPTION: .mobile-nav-toggle is the button selector.
   SITE-SPECIFIC ASSUMPTION: The menu panel has a class or ID that the
   existing toggle logic shows/hides. Adjust MENU_PANEL_SELECTOR below. */

(function initHamburgerA11y() {
  'use strict';

  /* --- Named constants --- */
  /** @type {string} Selector for the hamburger button — adjust to match site markup */
  var BUTTON_SELECTOR = '.mobile-nav-toggle';
  /** @type {string} Label when menu is closed */
  var LABEL_CLOSED = 'Open navigation menu';
  /** @type {string} Label when menu is open */
  var LABEL_OPEN = 'Close navigation menu';

  var button = document.querySelector(BUTTON_SELECTOR);
  if (!button) {
    return; /* Button not in DOM — desktop viewport or SSR mismatch */
  }

  /* Ensure baseline attributes exist (defensive — HTML fix is primary) */
  if (!button.hasAttribute('aria-label')) {
    button.setAttribute('aria-label', LABEL_CLOSED);
  }
  if (!button.hasAttribute('aria-expanded')) {
    button.setAttribute('aria-expanded', 'false');
  }

  /* SVG child hardening */
  var svg = button.querySelector('svg');
  if (svg) {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  }

  /**
   * Sync aria-expanded and aria-label to reflect current menu state.
   * Called on every toggle. Does NOT perform the toggle itself —
   * this layers onto the existing open/close logic.
   */
  function syncExpandedState() {
    var isCurrentlyExpanded = button.getAttribute('aria-expanded') === 'true';
    var newState = !isCurrentlyExpanded;
    button.setAttribute('aria-expanded', String(newState));
    button.setAttribute('aria-label', newState ? LABEL_OPEN : LABEL_CLOSED);
  }

  /*
   * Attach listener. This fires AFTER any existing click handlers
   * because addEventListener appends, not prepends. The sync function
   * reads the attribute it just toggled, so ordering is self-contained.
   *
   * If the existing toggle logic ALSO sets aria-expanded, this will
   * double-toggle. In that case, REMOVE this listener and ensure the
   * existing handler calls syncExpandedState() or sets the attributes
   * directly. Test by clicking once and inspecting aria-expanded value.
   */
  button.addEventListener('click', syncExpandedState);

  /*
   * No teardown needed — this button persists for the page lifetime.
   * If the header is dynamically replaced (SPA route change), the
   * framework must re-run this init or manage attributes in its
   * component lifecycle.
   */
})();

/*
 * EDGE CASE: Double-toggle risk.
 * If the site's existing JS already toggles aria-expanded on this button,
 * adding this listener will flip it twice per click (net zero change).
 * DETECTION: Click the button once, inspect aria-expanded in DevTools.
 *   - If it shows 'true' → working correctly (only one handler sets it).
 *   - If it shows 'false' → double-toggle. Remove this listener and
 *     ensure the existing handler sets both aria-expanded and aria-label.
 */
```

## Risks
- Double-toggle on aria-expanded: If the site's existing JavaScript already manages aria-expanded on this button, the added click listener will flip the attribute twice per click (net: no change). DETECTION: Click once, inspect aria-expanded in DevTools. If the value doesn't change, remove the JS listener and wire aria-label/aria-expanded updates into the existing toggle handler instead.
- Header layout shift at narrow viewports: The 8px increase (40→48px) could cause the button to overlap adjacent header elements (logo, cart icon) at 320px viewport width. MITIGATION: The fix uses min-width/min-height rather than fixed width/height, and centers the icon with flexbox + padding. Visually test at 320px, 360px, and 375px widths. If overlap occurs, reduce horizontal padding and rely on min-height alone (vertical tap target is more critical than horizontal for a square icon button).
- SPA re-initialization: If the site is a single-page application that replaces the header DOM on route changes, the JS listener and attributes will be lost. The framework's component lifecycle must re-apply attributes on mount. The IIFE approach works for traditional multi-page sites and initial SPA load but does not survive DOM replacement.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
