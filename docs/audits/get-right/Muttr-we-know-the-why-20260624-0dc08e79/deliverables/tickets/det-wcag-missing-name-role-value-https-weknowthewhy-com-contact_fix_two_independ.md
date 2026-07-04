---
finding_id: "det-wcag-missing-name-role-value-https-weknowthewhy-com-contact"
title: "Missing name/role/value [WCAG]"
severity: "medium"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: "Removing the honeypot from the accessibility tree eliminates a phantom unlabeled input that screen readers currently announce mid-form."
fix_summary: "Fix two independent WCAG 4.1.2 (Name, Role, Value) Level A violations on the contact page: (1) remove the honeypot input from the accessibility tree entirely, and (2) add an accessible name to the mo…"
confidence_tier: "confirmed"
---

# Missing name/role/value [WCAG]

**Finding:** Missing name/role/value [WCAG]  
**Severity:** Medium  
**Why this matters:** Removing the honeypot from the accessibility tree eliminates a phantom unlabeled input that screen readers currently announce mid-form.  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Fix two independent WCAG 4.1.2 (Name, Role, Value) Level A violations on the contact page: (1) remove the honeypot input from the accessibility tree entirely, and (2) add an accessible name to the mo…

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility Tree Correctness:** Removing the honeypot from the accessibility tree eliminates a phantom unlabeled input that screen readers currently announce mid-form. Users navigating by keyboard or virtual cursor will no longer encounter an unidentifiable field that breaks their mental model of the form's structure. This directly removes a form interaction blocker for assistive technology users on the primary contact conversion surface.
- **Mobile Navigation Usability:** Adding aria-label and aria-expanded to the hamburger button makes the mobile navigation operable for screen reader users on every page of the site. Without an accessible name, the button is announced as 'button' with no purpose — users cannot know what it does or whether the menu is open. This fix restores full keyboard and screen reader operability to the site's primary navigation on mobile viewports.
- **Touch Target Compliance:** Expanding the hamburger button to 48×48px reduces mis-tap rate on mobile. The current sub-48px target forces users to make precise taps on a small icon — a documented usability failure on touch devices, particularly for users with motor impairments or on small screens.
- **Legal Exposure Reduction:** Both violations are WCAG 2.1 Level A — the minimum conformance threshold cited in ADA web accessibility litigation. An inaccessible contact form is a documented pattern in demand letters targeting business websites. Remediating Level A failures on a primary conversion surface directly reduces the site's litigation exposure profile. legal_liability: true.
- **Seo Signal:** Accessible form structure and correct ARIA instrumentation are crawlable signals. Google's documentation confirms that accessibility improvements can positively affect how content is understood by crawlers, particularly for interactive elements and navigation.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

### WCAG 2.1 SC 1.4.3 (AA) — insufficient contrast ratio

**Exposure:** MEDIUM  
**What Failed:** 3 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at div > a:nth-of-type(5).  

**Remediation:** Adjust foreground/background color pairs to meet WCAG AA contrast thresholds: 4.5:1 for body text (<18pt), 3:1 for large text (>=18pt or >=14pt bold). Verify with a contrast checker.

### WCAG 2.1 SC 4.1.2 (A) — missing name/role/value

**Exposure:** MEDIUM  
**What Failed:** 2 UI component(s) lack an accessible name, preventing assistive technology from conveying their purpose.  

**Remediation:** Add accessible names (visible text, aria-label, or aria-labelledby) and appropriate roles. Prefer native HTML semantics over ARIA.

### WCAG 2.1 SC 1.3.1 (A) — improper content structure

**Exposure:** LOW  
**What Failed:** Heading hierarchy issues: heading level jumps from h1 to h4 (skips a level).  

**Remediation:** Use a single h1 per page for the main topic. Nest headings sequentially (h1 > h2 > h3) without skipping levels. Headings should describe the content that follows, not be used for styling.

### WCAG 2.1 SC 1.4.1 (A) — color as sole indicator

**Exposure:** MEDIUM  
**What Failed:** 10 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).  

**Remediation:** Supplement color with additional visual cues: underline inline links, or add icons/patterns. Do not rely on color alone to convey meaning.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/contact/
**Element:** missing name/role/value
**XPath:** `form > input:nth-of-type(1)`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("form > input:nth-of-type(1)")`
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
Fix two independent WCAG 4.1.2 (Name, Role, Value) Level A violations on the contact page: (1) remove the honeypot input from the accessibility tree entirely, and (2) add an accessible name to the mobile menu toggle button site-wide. Simultaneously bring the mobile menu button to WCAG 2.5.8 minimum touch target size (48×48px). Both fixes are scoped to their respective components with no changes to surrounding layout or form logic.

### How
HONEYPOT FIELD FIX (contact form template only):
1. Locate the honeypot input in the contact form markup. It will be a text or email input with a name attribute designed to be ignored by humans (e.g., name='website', name='url', name='phone_confirm', or a randomized string). It is currently hidden via CSS only.
2. Add aria-hidden='true' and tabindex='-1' directly to the input element in the HTML/template source. Do NOT use JavaScript to inject these — server-rendered attributes are present before the accessibility tree is built, eliminating any timing window where the field is briefly announced.
3. Verify the existing CSS hiding rule is still in place (display:none, or the off-screen technique). aria-hidden alone is sufficient to remove from the accessibility tree, but the CSS must remain for the honeypot to function — bots that parse the DOM must still see the field.
4. If the honeypot is wrapped in a <div> or <label>, add aria-hidden='true' to the wrapper instead of the input, so the entire group is suppressed in one declaration. Do not add a <label> to the honeypot input — that would make it more visible to screen readers, not less.
5. Confirm the honeypot field's name attribute is NOT included in the server-side validation logic for required fields. tabindex='-1' prevents keyboard users from reaching it; aria-hidden='true' removes it from the accessibility tree. Neither attribute affects form submission — the field value still posts with the form.
MOBILE MENU TOGGLE BUTTON FIX (global layout component — affects every page):
6. Locate the hamburger button in the theme's header template (commonly header.php, header.liquid, base.html, or equivalent). It will be a <button> element containing only an SVG icon or an icon font character with no visible text.
7. Add aria-label='Open navigation menu' to the <button> element. This is the accessible name. Do not use aria-labelledby unless a visible text label already exists in the DOM — it does not here.
8. Add aria-expanded='false' to the button's initial state. Wire the toggle logic to flip this attribute between 'true' and 'false' on each activation. This communicates menu state to screen readers without requiring visual inspection.
9. Add aria-controls pointing to the id of the nav element the button controls (e.g., aria-controls='primary-mobile-nav'). Ensure that nav element has a matching id attribute. If it does not, add one.
10. Update the aria-label dynamically on toggle: when the menu opens, set aria-label to 'Close navigation menu'; when it closes, reset to 'Open navigation menu'. This prevents the label from becoming stale relative to the current state.
11. TOUCH TARGET: Set the button's minimum dimensions to 48px × 48px via CSS scoped to the component selector. If the visual icon must remain smaller, use padding to expand the hit area without changing the icon's rendered size. Scope the rule tightly to avoid affecting other buttons.
12. If the SVG inside the button has a <title> element, add aria-hidden='true' to the SVG itself — the button's aria-label is the authoritative name, and the SVG title creates a redundant, potentially conflicting tooltip in some screen reader/browser combinations.
13. Run axe-core in the browser console against /contact/ and a second page (e.g., homepage) to confirm zero violations for rule IDs 'button-name' and 'label' before deploying.

### Code examples
```
<!-- HONEYPOT FIELD: Add aria-hidden and tabindex to the existing hidden input. -->
<!-- ASSUMPTION: honeypot input name attribute is 'website' — replace with actual field name. -->
<!-- ASSUMPTION: existing CSS already hides this field visually. Do not remove that CSS. -->
<!-- SCOPE: contact form template only. No other markup is touched. -->

<!-- BEFORE (violating) -->
<input type="text" name="website" class="honeypot-field" autocomplete="off">

<!-- AFTER (compliant) -->
<!-- aria-hidden removes from accessibility tree. tabindex=-1 prevents keyboard focus. -->
<!-- Neither attribute affects form POST behavior — field value still submits normally. -->
<input
  type="text"
  name="website"
  class="honeypot-field"
  autocomplete="off"
  aria-hidden="true"
  tabindex="-1"
>
<!-- MOBILE MENU TOGGLE BUTTON: Accessible name, state, and touch target. -->
<!-- ASSUMPTION: button is a <button> element in the global header template. -->
<!-- ASSUMPTION: the controlled nav element will receive id='primary-mobile-nav'. -->
<!-- ASSUMPTION: existing JS toggle adds/removes an 'is-open' class on the nav. -->
<!-- SCOPE: header template only. No changes to nav content, layout, or other buttons. -->

<!-- BEFORE (violating) -->
<button class="menu-toggle">
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <rect y="4" width="24" height="2"/>
    <rect y="11" width="24" height="2"/>
    <rect y="18" width="24" height="2"/>
  </svg>
</button>

<!-- AFTER (compliant) -->
<!-- aria-label provides the accessible name. -->
<!-- aria-expanded reflects open/closed state. aria-controls links button to nav. -->
<!-- SVG remains aria-hidden — button label is the single source of truth. -->
<button
  class="menu-toggle"
  aria-label="Open navigation menu"
  aria-expanded="false"
  aria-controls="primary-mobile-nav"
>
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
    <rect y="4" width="24" height="2"/>
    <rect y="11" width="24" height="2"/>
    <rect y="18" width="24" height="2"/>
  </svg>
</button>

<!-- Nav element: add id to match aria-controls value above -->
<nav id="primary-mobile-nav" aria-label="Mobile navigation">
  <!-- existing nav content unchanged -->
</nav>
/* TOUCH TARGET: Expand hamburger button hit area to WCAG 2.5.8 minimum. */
/* SCOPE: Selector targets only .menu-toggle — no other buttons affected. */
/* ASSUMPTION: .menu-toggle is the BEM class on the hamburger button only. */
/* Adjust selector to match actual class name in the theme. */

/* Named constants for WCAG minimums — do not inline these values. */
:root {
  --wcag-touch-target-min: 48px; /* WCAG 2.5.8: minimum touch target size */
  --menu-toggle-icon-size: 24px; /* ASSUMPTION: current icon render size — verify in DevTools */
}

.menu-toggle {
  /* Enforce minimum touch target without changing icon visual size */
  min-width: var(--wcag-touch-target-min);
  min-height: var(--wcag-touch-target-min);

  /* Center the icon within the expanded hit area */
  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* Preserve existing appearance — do not override color, background, or border */
  /* unless the theme's existing rules conflict with the above */

  /* Visible focus indicator — never suppress without replacement */
  /* ASSUMPTION: theme does not already provide a compliant focus style */
}

.menu-toggle:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
// TOGGLE SCRIPT: Sync aria-label and aria-expanded on each activation.
// ASSUMPTION: A single .menu-toggle button controls a single #primary-mobile-nav.
// ASSUMPTION: The nav's open state is tracked by toggling class 'is-open' on the nav.
// SCOPE: Replaces or augments existing toggle handler — do not add a second listener
//        to the same button without removing the first (duplicate listener risk).
// ORDERING: aria attributes update synchronously within the same event handler tick
//           as the class toggle — no async gap, no race condition.

(function initMenuToggle() {
  'use strict';

  // Named constants — adjust selectors to match actual theme markup.
  const TOGGLE_SELECTOR = '.menu-toggle';         // ASSUMPTION: single hamburger button
  const NAV_ID = 'primary-mobile-nav';            // ASSUMPTION: matches aria-controls value
  const LABEL_OPEN = 'Open navigation menu';      // Accessible name when menu is closed
  const LABEL_CLOSE = 'Close navigation menu';    // Accessible name when menu is open
  const NAV_OPEN_CLASS = 'is-open';               // ASSUMPTION: class toggled on nav element

  const toggleButton = document.querySelector(TOGGLE_SELECTOR);
  const navElement = document.getElementById(NAV_ID);

  // Guard: both elements must exist before wiring any behavior.
  // Fails silently on pages where the mobile menu is not rendered.
  if (!toggleButton || !navElement) {
    return;
  }

  // Remove any pre-existing click listener added by the theme's own JS
  // by cloning the node — this is the safest way to guarantee a clean slate
  // without needing access to the original handler reference.
  // RISK: If the theme's handler does work beyond toggling (e.g., animation callbacks),
  // that work must be re-implemented here or the clone approach must be abandoned
  // in favor of adding this handler alongside the existing one after confirming
  // no duplicate-listener behavior (see risks section).
  //
  // ALTERNATIVE (lower risk): If cloning is unsafe, add this handler and verify
  // via DevTools Event Listeners panel that only one click handler fires.
  const freshButton = toggleButton.cloneNode(true);
  toggleButton.parentNode.replaceChild(freshButton, toggleButton);

  freshButton.addEventListener('click', function handleMenuToggle() {
    // Read current state from the DOM — single source of truth.
    const isCurrentlyExpanded = freshButton.getAttribute('aria-expanded') === 'true';
    const willOpen = !isCurrentlyExpanded;

    // Update ARIA state synchronously — no setTimeout, no rAF.
    freshButton.setAttribute('aria-expanded', String(willOpen));
    freshButton.setAttribute('aria-label', willOpen ? LABEL_CLOSE : LABEL_OPEN);

    // Toggle nav visibility class — matches existing theme behavior.
    navElement.classList.toggle(NAV_OPEN_CLASS, willOpen);
  });
}());
```

## Risks
- CLONE-NODE LISTENER REMOVAL: The toggle script uses cloneNode to strip existing event listeners from the hamburger button. If the theme's existing JS handler performs work beyond class toggling (e.g., triggering CSS animations via a separate animation library, firing analytics events, or managing focus trapping), that behavior will be lost. Mitigation: inspect the existing handler in DevTools (Elements → Event Listeners) before deploying. If the existing handler does more than toggle a class, add the aria attribute updates inside the existing handler instead of replacing it — do not use cloneNode in that case.
- HONEYPOT FIELD NAME ASSUMPTION: The code example uses name='website' as a placeholder. The actual honeypot field name must be confirmed in the contact form template source before deploying. Applying aria-hidden to the wrong field would suppress a real input from the accessibility tree. Mitigation: search the contact form template for inputs with display:none, opacity:0, position:absolute with large negative offsets, or clip-path:rect(0,0,0,0) — that is the honeypot.
- ARIA-HIDDEN ON WRAPPER VS INPUT: If the honeypot input is wrapped in a <label> element (some form builders do this), adding aria-hidden='true' only to the input leaves the <label> visible to the accessibility tree as an orphaned label. Mitigation: add aria-hidden='true' to the outermost wrapper element containing both the label and input, not to the input alone.
- DUPLICATE EVENT LISTENERS: If the theme's JS initializes after DOMContentLoaded and re-queries .menu-toggle to attach its own handler, the cloneNode replacement will be overwritten and two handlers will fire. Mitigation: ensure this script runs after the theme's JS, or use the non-clone approach (add aria updates inside the existing handler). Verify in DevTools after deployment by clicking the button and checking the Network tab for duplicate requests or observing double-toggle behavior.
- FOCUS MANAGEMENT ON MENU CLOSE: Adding aria-expanded does not automatically move focus when the menu closes. If a user opens the menu, tabs into it, then closes it via the button, focus should return to the toggle button. This fix does not implement focus management — it is a separate enhancement. If the theme already handles this, no action needed. If not, it should be tracked as a follow-on task.
- CSS SELECTOR SPECIFICITY: The .menu-toggle touch target CSS may be overridden by the theme's existing button styles if those rules have higher specificity. Mitigation: verify in DevTools that min-width and min-height are applied (not crossed out). If overridden, increase specificity with .site-header .menu-toggle or add the rule to the theme's component stylesheet at a higher cascade position — do not use !important.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
