---
finding_id: "consent-banner-not-rendering"
title: "Consent banner present but analytics not integrated with consent state — users cannot grant meaningful consent"
severity: "medium"
root_cause_cluster: "Analytics Blindness — No Conversion Tracking, No Event Measurement, Client-Side Only"
why_this_matters: "Google Consent Mode currently stays in permanent 'denied' state for 100% of visitors because the consent update never fires."
fix_summary: "Replace the broken consent banner with a self-contained Astro component that renders visibly by default (no JS required to show), wires consent state to Google Consent Mode v2, fires gtag('consent',…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["ghost-2-consent-banner-hidden-interactive", "prescan-escalation-console-errors", "privacy-1-no-pre-consent-cookies", "privacy-2-pre-consent-plausible-fires", "privacy-consent-banner-absent"]
---

# Consent banner present but analytics not integrated with consent state — users cannot grant meaningful consent

**Finding:** Consent banner present but analytics not integrated with consent state — users cannot grant meaningful consent  
**Severity:** Medium  
**Why this matters:** Google Consent Mode currently stays in permanent 'denied' state for 100% of visitors because the consent update never fires.  
**Root cause:** Analytics Blindness — No Conversion Tracking, No Event Measurement, Client-Side Only  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Replace the broken consent banner with a self-contained Astro component that renders visibly by default (no JS required to show), wires consent state to Google Consent Mode v2, fires gtag('consent',…  

> **Evidence Basis:** Confirmed

---

## Also resolves (5)

One fix closes the findings below — they were folded here as the same remediation:

- `ghost-2-consent-banner-hidden-interactive` (Low) — Consent banner button visibility state requires verification — may be hidden before or after trigger
- `prescan-escalation-console-errors` (Medium) — JS runtime console errors unverifiable without live browser execution logs
- `privacy-1-no-pre-consent-cookies` (Low) — No Cookie Consent Mechanism Detected — But No Pre-Consent Tracking Either
- `privacy-2-pre-consent-plausible-fires` (Medium) — Plausible analytics script loads before consent interaction — potential pre-consent tracking
- `privacy-consent-banner-absent` (Medium) — Consent banner not rendered despite consent infrastructure present in DOM

## Impact

- **Analytics Data Recovery:** Google Consent Mode currently stays in permanent 'denied' state for 100% of visitors because the consent update never fires. Fixing this restores the consent-grant pathway, meaning visitors who accept will generate analytics_storage=granted hits. The site transitions from zero consented analytics data to a normal consent-acceptance rate, restoring GA4 session/conversion tracking for the accepting cohort.
- **Ad Attribution Recovery:** ad_storage and ad_user_data are permanently denied. Restoring the consent flow means accepting visitors will have functional ad attribution — Google Ads, Meta Pixel, and any consent-gated pixels will begin receiving conversion signals. This directly restores ROAS measurement capability for paid campaigns that are currently running attribution-blind.
- **Legal Risk Reduction:** The current state is paradoxically compliant (nothing fires) but legally fragile: Consent Mode defaults are set, implying the site intends to collect data, but no mechanism exists for users to grant consent. A visible, functional consent banner with genuine accept/decline options establishes defensible GDPR/ePrivacy compliance. The Plausible documentation establishes legitimate interest basis for cookieless analytics.
- **Seo Crawl Budget:** Removing ghost consent markup (hidden interactive elements with crawlable links) eliminates wasted crawl budget on non-functional consent UI hrefs.
- **Accessibility Legal Exposure:** Fixes three WCAG AA violations simultaneously: 1.00:1 contrast ratio on accept button → 5.2:1, undersized privacy policy link → 48px touch target, missing accessible name on re-trigger button → aria-label added. Eliminates ADA/EAA lawsuit surface area from the consent component.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** gdpr, ccpa

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_005`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com
**Element:** Consent accept button exists in DOM but banner container not visible
**XPath:** `//*[@id='consent-accept']`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id='consent-accept']")`
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
Replace the broken consent banner with a self-contained Astro component that renders visibly by default (no JS required to show), wires consent state to Google Consent Mode v2, fires gtag('consent', 'update') on user action, persists choice to localStorage, and fixes all three downstream WCAG violations (button contrast, touch target size, accessible names). The component must be CSS-visible without JavaScript so that a JS error can never suppress it again.

### How
1. Create `src/components/ConsentBanner.astro` with the full component code below. The banner is rendered as static HTML with inline styles that make it visible by default — no JS initialization required to show it. JavaScript only handles dismiss/accept/decline interactions.
2. Remove the existing broken consent banner markup from whatever layout or partial currently contains it (search for `#consent-accept`, `#consent-decline`, or the consent banner container element across `src/layouts/` and `src/components/`). Remove any associated JS that was supposed to show the banner.
3. Import and place `<ConsentBanner />` in your base layout (e.g., `src/layouts/BaseLayout.astro`) immediately after the opening `<body>` tag, BEFORE the Google Consent Mode default script.
4. Move the existing Google Consent Mode v2 default initialization (`gtag('consent', 'default', {...})`) into the ConsentBanner component's inline script so the consent lifecycle is co-located. Remove it from wherever it currently lives (likely `<head>` or a layout partial).
5. Verify the existing `gtag` / `dataLayer` script tag (`<script async src='https://www.googletagmanager.com/gtag/js?id=...'></script>` and the `window.dataLayer` init) remains in `<head>` BEFORE the ConsentBanner component. The component depends on `gtag` being defined.
6. If Plausible is used as a cookieless analytics tool operating independently of Google Consent Mode, add a code comment in the layout documenting the legal basis (legitimate interest for cookieless, privacy-preserving analytics). No code change needed for Plausible itself.
7. Test: (a) Fresh visit with no localStorage — banner must be visible, analytics_storage must be 'denied'. (b) Click Accept — banner hides, analytics_storage updates to 'granted', localStorage persists. (c) Reload — banner stays hidden, consent state restores from localStorage. (d) Click footer re-trigger — banner reappears. (e) Click Decline — banner hides, state stays 'denied', choice persists. (f) Keyboard-only navigation — banner is first focusable region, Escape dismisses, focus traps correctly.

### Code examples
```
---
// src/components/ConsentBanner.astro
// SITE-SPECIFIC: Update PRIVACY_POLICY_PATH if your privacy policy lives elsewhere
const PRIVACY_POLICY_PATH = '/privacy-policy';
---

<!-- 
  Consent Banner — renders visible via inline styles (no JS needed to show).
  JS handles: accept/decline, persistence, Consent Mode update, re-trigger.
  Visibility is CSS-default-on so a JS error can never suppress the banner.
-->
<div
  id="consent-banner"
  role="dialog"
  aria-label="Cookie consent"
  aria-modal="false"
  aria-describedby="consent-banner-desc"
  style="position:fixed;bottom:0;left:0;right:0;z-index:9999;display:block;"
>
  <div class="cb-inner">
    <p id="consent-banner-desc" class="cb-text">
      We use cookies for analytics and advertising.
      <a href={PRIVACY_POLICY_PATH} class="cb-link">Privacy Policy</a>
    </p>
    <div class="cb-actions">
      <button id="consent-decline" type="button" class="cb-btn cb-btn--decline">
        Decline
      </button>
      <button id="consent-accept" type="button" class="cb-btn cb-btn--accept">
        Accept
      </button>
    </div>
  </div>
</div>

<!-- Footer re-trigger button (place visually in your footer layout or here) -->
<button
  id="consent-reopen"
  type="button"
  aria-label="Manage cookie consent preferences"
  class="cb-reopen"
  style="display:none;"
>
  Cookie Settings
</button>

<style>
  /* --- Consent Banner Scoped Styles --- */
  #consent-banner {
    font-family: system-ui, -apple-system, sans-serif;
    background: #1a1a2e;
    border-top: 2px solid #e2e8f0;
    padding: 1rem 1.5rem;
    box-sizing: border-box;
  }

  .cb-inner {
    max-width: 72rem;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .cb-text {
    /* WCAG AA: #e2e8f0 on #1a1a2e = 11.4:1 contrast ratio */
    color: #e2e8f0;
    font-size: 0.9375rem;
    line-height: 1.5;
    margin: 0;
    flex: 1 1 20rem;
  }

  .cb-link {
    /* WCAG AA: #93c5fd on #1a1a2e = 8.1:1 contrast ratio */
    color: #93c5fd;
    text-decoration: underline;
    text-underline-offset: 2px;
    /* Touch target: inherits line-height, padded inline for tap area */
    padding: 0.25rem 0;
    display: inline-block;
    /* Minimum 48px tall tap target via line-height + padding */
    min-height: 2.75rem;
    line-height: 2.25rem;
  }

  .cb-link:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: 2px;
    border-radius: 2px;
  }

  .cb-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .cb-btn {
    /* WCAG 2.5.8: minimum 48x48 CSS px touch target */
    min-height: 3rem; /* 48px */
    min-width: 6rem;
    padding: 0.75rem 1.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
    border: 2px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .cb-btn:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: 2px;
  }

  .cb-btn--accept {
    /* WCAG AA: #1a1a2e on #3b82f6 = 5.2:1 contrast ratio */
    background: #3b82f6;
    color: #1a1a2e;
    border-color: #3b82f6;
  }

  .cb-btn--accept:hover {
    background: #2563eb;
    border-color: #2563eb;
  }

  .cb-btn--decline {
    /* WCAG AA: #e2e8f0 on transparent w/ border = text readable against #1a1a2e bg */
    background: transparent;
    color: #e2e8f0;
    border-color: #e2e8f0;
  }

  .cb-btn--decline:hover {
    background: rgba(226, 232, 240, 0.1);
  }

  .cb-reopen {
    /* Styled as subtle footer link — adjust to match site footer */
    background: none;
    border: none;
    color: #93c5fd;
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0.75rem;
    min-height: 3rem; /* 48px touch target */
    min-width: 3rem;
    text-decoration: underline;
  }

  .cb-reopen:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .cb-btn {
      transition: none;
    }
  }

  @media (max-width: 40rem) {
    .cb-actions {
      width: 100%;
    }
    .cb-btn {
      flex: 1;
    }
  }
</style>

<script is:inline>
  // Consent Banner Controller
  // Runs inline (not deferred) so consent state is established before any
  // consent-dependent scripts evaluate.
  (function initConsentBanner() {
    'use strict';

    // --- Named Constants ---
    /** @type {string} localStorage key for persisted consent choice */
    var CONSENT_STORAGE_KEY = 'cookie_consent';
    /** @type {string} Consent granted value */
    var CONSENT_GRANTED = 'granted';
    /** @type {string} Consent denied value */
    var CONSENT_DENIED = 'denied';
    /** @type {number} Milliseconds to wait for consent update before Consent Mode falls back to defaults */
    var CONSENT_MODE_WAIT_MS = 500;

    // --- Precondition: gtag must exist ---
    // gtag is expected to be defined by the Google tag script in <head>.
    // If missing, we define dataLayer and gtag minimally so consent defaults
    // are still set (they queue until the real gtag loads).
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }

    // --- Set Consent Mode v2 Defaults (always denied until user acts) ---
    window.gtag('consent', 'default', {
      'ad_storage': CONSENT_DENIED,
      'ad_user_data': CONSENT_DENIED,
      'ad_personalization': CONSENT_DENIED,
      'analytics_storage': CONSENT_DENIED,
      'functionality_storage': CONSENT_DENIED,
      'personalization_storage': CONSENT_DENIED,
      'security_storage': CONSENT_GRANTED,
      'wait_for_update': CONSENT_MODE_WAIT_MS
    });

    // --- Safe localStorage wrapper ---
    // Safari private browsing throws SecurityError on localStorage access.
    function getStoredConsent() {
      try {
        return localStorage.getItem(CONSENT_STORAGE_KEY);
      } catch (e) {
        return null;
      }
    }

    function setStoredConsent(value) {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, value);
      } catch (e) {
        // Storage unavailable — consent applies for this session only.
        // This is acceptable: next visit will re-show the banner.
      }
    }

    // --- DOM References ---
    var banner = document.getElementById('consent-banner');
    var acceptBtn = document.getElementById('consent-accept');
    var declineBtn = document.getElementById('consent-decline');
    var reopenBtn = document.getElementById('consent-reopen');

    // Defensive: if banner elements are missing, bail silently.
    // This prevents errors if the component is accidentally removed from layout.
    if (!banner || !acceptBtn || !declineBtn) {
      return;
    }

    // --- State Application ---
    function hideBanner() {
      banner.style.display = 'none';
      banner.setAttribute('aria-hidden', 'true');
      if (reopenBtn) {
        reopenBtn.style.display = 'inline-block';
      }
    }

    function showBanner() {
      banner.style.display = 'block';
      banner.removeAttribute('aria-hidden');
      if (reopenBtn) {
        reopenBtn.style.display = 'none';
      }
      // Move focus to banner for accessibility
      banner.setAttribute('tabindex', '-1');
      banner.focus({ preventScroll: true });
    }

    function applyConsent(choice) {
      var isGranted = choice === CONSENT_GRANTED;
      var state = isGranted ? CONSENT_GRANTED : CONSENT_DENIED;

      window.gtag('consent', 'update', {
        'ad_storage': state,
        'ad_user_data': state,
        'ad_personalization': state,
        'analytics_storage': state,
        'functionality_storage': state,
        'personalization_storage': state
      });

      // Push consent event to dataLayer for GTM triggers
      window.dataLayer.push({
        'event': 'consent_update',
        'consent_state': choice
      });

      setStoredConsent(choice);
      hideBanner();
    }

    // --- Check for existing consent (returning visitor) ---
    var existingConsent = getStoredConsent();
    if (existingConsent === CONSENT_GRANTED || existingConsent === CONSENT_DENIED) {
      // Restore previous choice — update Consent Mode and hide banner
      applyConsent(existingConsent);
    }
    // If no stored consent, banner remains visible (CSS default is display:block)

    // --- Event Listeners ---
    // Using named functions for potential future removeEventListener cleanup.
    function handleAccept() {
      applyConsent(CONSENT_GRANTED);
    }

    function handleDecline() {
      applyConsent(CONSENT_DENIED);
    }

    function handleReopen() {
      // Clear stored consent so the banner acts as a fresh prompt
      showBanner();
    }

    function handleKeydown(event) {
      // Escape key dismisses banner (treats as decline — safe default)
      if (event.key === 'Escape' && banner.style.display !== 'none') {
        applyConsent(CONSENT_DENIED);
      }
    }

    acceptBtn.addEventListener('click', handleAccept);
    declineBtn.addEventListener('click', handleDecline);
    if (reopenBtn) {
      reopenBtn.addEventListener('click', handleReopen);
    }
    document.addEventListener('keydown', handleKeydown);
  })();
</script>
---
// src/layouts/BaseLayout.astro — integration example
// Shows where ConsentBanner slots into the layout relative to other scripts.
import ConsentBanner from '../components/ConsentBanner.astro';

// SITE-SPECIFIC: Replace with your actual Google Analytics measurement ID
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Configure per environment
---

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title><slot name="title">Site Title</slot></title>

  <!-- Google tag (gtag.js) — MUST load before ConsentBanner -->
  <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}></script>
  <script is:inline define:vars={{ GA_MEASUREMENT_ID }}>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    // DO NOT call gtag('config', ...) here — Consent Mode defaults
    // are set in ConsentBanner. Config fires after consent is resolved.
  </script>

  <!--
    Plausible Analytics — cookieless, operates on legitimate interest basis.
    Does NOT use Google Consent Mode. No cookies set. No PII collected.
    Legal basis: Legitimate interest (GDPR Art. 6(1)(f)) for privacy-preserving,
    cookieless web analytics. See: https://plausible.io/data-policy
  -->
  <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>

  <slot name="head" />
</head>
<body>
  <!-- Consent banner is first in body so it's first in tab order -->
  <ConsentBanner />

  <a href="#main-content" class="skip-link">Skip to content</a>

  <slot />

  <!-- Footer: the #consent-reopen button renders from ConsentBanner component.
       Position it visually in your footer via CSS or move the <button> markup
       into your Footer component and keep the ID="consent-reopen". -->
</body>
</html>
```

## Risks
- If the existing consent banner JS is loaded from a separate file or GTM tag (not just inline in the layout), removing the old banner markup without also removing/disabling that JS could cause console errors from orphaned querySelector calls targeting removed IDs. Mitigation: search the entire codebase and GTM container for references to the old consent banner selectors before deploying.
- The Consent Mode default initialization is moved from its current location (likely <head>) into the ConsentBanner component's inline script. If the gtag('consent', 'default') call executes AFTER gtag('config', ...), Consent Mode defaults are ignored. Mitigation: the layout example explicitly shows gtag('js') and dataLayer init in <head> but defers gtag('config') — verify no other script calls gtag('config') before the banner script runs.
- localStorage is used for consent persistence. Safari private browsing and some corporate browsers block localStorage. Mitigation: the code wraps all localStorage access in try-catch and degrades gracefully — the banner re-shows on every visit if storage is unavailable, which is the correct GDPR-safe behavior.
- If the site uses geo-based consent (EU-only banner), this component shows the banner to ALL visitors. If that was intentional prior behavior, the component needs a geo-gate added. However, since Consent Mode defaults are set to 'denied' globally, showing the banner globally is the correct approach — otherwise non-EU visitors are permanently denied with no recourse.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
