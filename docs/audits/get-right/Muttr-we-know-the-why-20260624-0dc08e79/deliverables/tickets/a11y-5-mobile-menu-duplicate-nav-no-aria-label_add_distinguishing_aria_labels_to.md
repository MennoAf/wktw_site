---
finding_id: "a11y-5-mobile-menu-duplicate-nav-no-aria-label"
title: "Duplicate navigation landmarks and consent buttons lack ARIA labels and verified keyboard accessibility"
severity: "medium"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: "The consent banner currently lacks role='dialog', aria-modal, and focus trapping."
fix_summary: "Add distinguishing aria-labels to all <nav> landmarks, synchronize aria-hidden state on the mobile nav with its visibility toggle, and retrofit the consent banner with focus trapping, ARIA context, a…"
confidence_tier: "confirmed"
---

# Duplicate navigation landmarks and consent buttons lack ARIA labels and verified keyboard accessibility

**Finding:** Duplicate navigation landmarks and consent buttons lack ARIA labels and verified keyboard accessibility  
**Severity:** Medium  
**Why this matters:** The consent banner currently lacks role='dialog', aria-modal, and focus trapping.  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Add distinguishing aria-labels to all <nav> landmarks, synchronize aria-hidden state on the mobile nav with its visibility toggle, and retrofit the consent banner with focus trapping, ARIA context, a…

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility Legal Exposure:** The consent banner currently lacks role='dialog', aria-modal, and focus trapping. Keyboard-only users can Tab past the banner without making a consent choice, meaning the site may be collecting data without valid consent — a GDPR/CCPA compliance gap with legal liability. Adding focus trapping ensures every user must interact with the consent mechanism before proceeding, closing this gap.
- **Seo Crawl Efficiency:** The hidden mobile nav currently exposes duplicate links to crawlers (every link in the desktop nav is duplicated in the mobile nav's DOM). Setting aria-hidden='true' and tabindex='-1' on the hidden mobile nav, combined with the ghost-markup fix of ensuring display:none or inert on the hidden state, removes these duplicate links from the accessibility tree and signals to crawlers that they are redundant. This directly reduces duplicate link signals that dilute crawl budget.
- **Screen Reader Navigation:** Two unlabeled <nav> landmarks force screen reader users to enter each one to determine its purpose. Adding aria-label allows landmark navigation (a primary screen reader workflow) to function correctly. This eliminates a barrier that causes assistive technology users to abandon the site.
- **Keyboard Conversion Path:** The consent accept button was flagged at 1.00:1 contrast ratio in a related finding. Combined with no focus indicator and no focus trapping, keyboard users literally cannot see or reach the accept button reliably. Fixing focus management and trapping ensures the consent-to-browse path works for all input modalities.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/insights/why-most-audits-dont-change-anything/
**Element:** Mobile menu first link — duplicate of desktop nav
**XPath:** `//*[@id="mobile-menu"]/div[1]/a[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id="mobile-menu"]/div[1]/a[1]")`
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
Add distinguishing aria-labels to all <nav> landmarks, synchronize aria-hidden state on the mobile nav with its visibility toggle, and retrofit the consent banner with focus trapping, ARIA context, and keyboard dismissal.

### How
1. NAVIGATION LANDMARKS — In the Astro header component (likely src/components/Header.astro or similar), add aria-label to each <nav> element: 'Primary navigation' for desktop, 'Mobile navigation' for the mobile menu. On the mobile <nav>, add aria-hidden='true' as the default (since it loads hidden). In the existing JS that toggles the mobile menu open/closed, synchronize aria-hidden to match visibility state. On the hamburger toggle button, add aria-expanded='false' (toggled to 'true' on open), aria-controls pointing to the mobile nav's id, and aria-label='Open menu' / 'Close menu' toggled with state. 2. CONSENT BANNER — Wrap the consent banner in a container with role='dialog', aria-modal='true', and aria-labelledby pointing to the banner's heading or description text element. Add aria-describedby on each button pointing to the consent description paragraph so screen readers announce what the user is consenting to. On banner mount, trap focus inside the dialog: capture the first and last focusable elements, intercept Tab/Shift+Tab at boundaries to cycle focus, and move initial focus to the decline button (conservative default). On accept or decline, release the trap and return focus to the element that was focused before the banner appeared (document.activeElement snapshot taken before trap). Add Escape key handling to trigger the decline action. 3. SKIP LINK — Add a visually-hidden skip link as the first focusable element in <body>: 'Skip to main content' targeting #main-content. Style it to become visible on :focus. This ensures the consent banner (when present) and navigation landmarks have a bypass mechanism.

### Code examples
```
---
/* Header.astro — Navigation landmark fix */
/* SITE-SPECIFIC: Adjust selectors and IDs to match your actual nav structure */
---
<header>
  <nav aria-label="Primary navigation">
    <!-- Desktop nav links -->
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>

  <button
    type="button"
    id="mobile-menu-toggle"
    aria-expanded="false"
    aria-controls="mobile-nav"
    aria-label="Open menu"
  >
    <span class="hamburger-icon" aria-hidden="true"></span>
  </button>

  <nav
    id="mobile-nav"
    aria-label="Mobile navigation"
    aria-hidden="true"
  >
    <ul>
      <li><a href="/" tabindex="-1">Home</a></li>
      <li><a href="/about" tabindex="-1">About</a></li>
      <li><a href="/contact" tabindex="-1">Contact</a></li>
    </ul>
  </nav>
</header>

<script>
  function initMobileNav() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    if (!toggle || !mobileNav) return;

    const LABEL_OPEN = 'Open menu';
    const LABEL_CLOSE = 'Close menu';

    /* SITE-SPECIFIC: This selector targets links/buttons inside the mobile nav.
       Adjust if your mobile nav contains other focusable elements. */
    const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])';

    function setMobileNavState(isOpen) {
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? LABEL_CLOSE : LABEL_OPEN);
      mobileNav.setAttribute('aria-hidden', String(!isOpen));

      const focusables = mobileNav.querySelectorAll(FOCUSABLE_SELECTOR);
      focusables.forEach(function(el) {
        el.setAttribute('tabindex', isOpen ? '0' : '-1');
      });

      if (isOpen && focusables.length > 0) {
        focusables[0].focus();
      }
    }

    toggle.addEventListener('click', function() {
      var isCurrentlyOpen = toggle.getAttribute('aria-expanded') === 'true';
      setMobileNavState(!isCurrentlyOpen);
    });

    /* Close on Escape */
    mobileNav.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        setMobileNavState(false);
        toggle.focus();
      }
    });
  }

  /* Astro re-runs scripts on client nav; guard against double-init */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav, { once: true });
  } else {
    initMobileNav();
  }
</script>
---
/* ConsentBanner.astro — Accessible consent dialog */
/* SITE-SPECIFIC: IDs consent-decline, consent-accept, consent-description
   must match your existing consent banner markup. Adjust if different. */
---
<div
  id="consent-banner"
  role="dialog"
  aria-modal="true"
  aria-labelledby="consent-heading"
  aria-describedby="consent-description"
  data-consent-state="pending"
>
  <h2 id="consent-heading" class="sr-only">Cookie consent</h2>
  <p id="consent-description">
    We use cookies for analytics and functionality.
    See our <a href="/privacy" id="consent-privacy-link">privacy policy</a>.
  </p>
  <div class="consent-actions">
    <button
      type="button"
      id="consent-decline"
      aria-describedby="consent-description"
    >Decline</button>
    <button
      type="button"
      id="consent-accept"
      aria-describedby="consent-description"
    >Accept all cookies</button>
  </div>
</div>

<script>
  function initConsentBanner() {
    var banner = document.getElementById('consent-banner');
    if (!banner) return;

    /* SITE-SPECIFIC: Adjust this check to match your consent storage key */
    var CONSENT_STORAGE_KEY = 'cookie_consent_given';

    var consentAlreadyGiven = false;
    try {
      consentAlreadyGiven = localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
    } catch (e) {
      /* Safari private browsing throws SecurityError on localStorage access */
    }

    if (consentAlreadyGiven) {
      banner.remove();
      return;
    }

    /* --- Focus trap --- */
    var FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var previouslyFocused = document.activeElement;

    function getFocusableElements() {
      return Array.prototype.slice.call(
        banner.querySelectorAll(FOCUSABLE_SELECTOR)
      );
    }

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      var focusables = getFocusableElements();
      if (focusables.length === 0) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape') {
        handleConsent('declined');
      }
    }

    banner.addEventListener('keydown', trapFocus);
    banner.addEventListener('keydown', handleEscape);

    /* Move focus into banner on mount */
    var declineBtn = document.getElementById('consent-decline');
    if (declineBtn) {
      declineBtn.focus();
    }

    /* --- Consent resolution --- */
    var isResolving = false;

    function handleConsent(choice) {
      if (isResolving) return;
      isResolving = true;

      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, choice);
      } catch (e) {
        /* Fallback: set a session cookie instead */
        document.cookie = CONSENT_STORAGE_KEY + '=' + choice + ';path=/;SameSite=Lax;Secure';
      }

      /* SITE-SPECIFIC: Fire your consent callback here.
         e.g., if (choice === 'accepted') { loadAnalytics(); } */

      /* Tear down trap and remove banner */
      banner.removeEventListener('keydown', trapFocus);
      banner.removeEventListener('keydown', handleEscape);
      banner.remove();

      /* Restore focus to previous element */
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    }

    var acceptBtn = document.getElementById('consent-accept');
    if (declineBtn) {
      declineBtn.addEventListener('click', function() {
        handleConsent('declined');
      });
    }
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function() {
        handleConsent('accepted');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsentBanner, { once: true });
  } else {
    initConsentBanner();
  }
</script>
<!-- SkipLink.astro — Must be the FIRST child of <body> -->
<!-- SITE-SPECIFIC: The href target #main-content must match the id on your <main> element -->
<a
  href="#main-content"
  class="skip-to-content"
>
  Skip to main content
</a>

<style>
  .skip-to-content {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    z-index: 10000; /* SITE-SPECIFIC: Must exceed your highest z-index (header, modals) */
    background: #000;
    color: #fff;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    text-decoration: none;
  }

  .skip-to-content:focus {
    position: fixed;
    top: 0.5rem;
    left: 0.5rem;
    width: auto;
    height: auto;
    outline: 3px solid #005fcc; /* SITE-SPECIFIC: Match your brand focus color */
    outline-offset: 2px;
  }
</style>
```

## Risks
- MOBILE NAV TOGGLE COUPLING: The fix assumes the mobile menu toggle is a <button> with id='mobile-menu-toggle' and the mobile nav has id='mobile-nav'. If the existing toggle uses a different mechanism (e.g., a CSS-only :checked hack on a hidden checkbox, or a third-party menu library), the JS event listener will not fire. MITIGATION: Before implementing, verify the toggle mechanism in DevTools. If CSS-only, refactor to a button-based toggle first. The aria-hidden and tabindex synchronization is the critical piece — the toggle button ARIA is secondary.
- CONSENT FOCUS TRAP INTERACTION WITH OTHER OVERLAYS: If another overlay (e.g., a promotional modal, chat widget) fires simultaneously with the consent banner, two focus traps will conflict — the last one to attach wins, potentially trapping focus in the wrong element. MITIGATION: The consent banner should be the highest z-index overlay and should mount before any other overlay JS initializes. The isResolving flag prevents double-fire but does not prevent external focus theft. If other overlays exist, they must defer until consent is resolved.
- ESCAPE KEY ON CONSENT MAPS TO DECLINE: The fix maps Escape to 'declined'. If the site's consent implementation treats 'declined' as an explicit opt-out (vs. simply dismissing the banner without recording a choice), this could suppress analytics/ad pixels for users who reflexively press Escape. MITIGATION: Confirm with the privacy/legal team whether Escape should map to 'declined' or to a third 'dismissed' state that re-shows the banner on next page load.
- SKIP LINK Z-INDEX: The skip link uses z-index:10000. If the site has elements with higher z-index values (some chat widgets use 2147483647), the skip link will render behind them on focus. MITIGATION: Audit the site's z-index stack and set the skip link's z-index above the maximum.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
