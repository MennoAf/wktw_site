---
finding_id: "privacy-cookies-compound-consent-dark-pattern"
title: "Atomic consent flow remediation addressing three co-located defects in the consent banner as a single compliant unit: (1) add an inline, clearly visible privacy policy link within the banner body text — not in the footer, not post-acceptance; (2) equalize the visual weight of Accept and Decline/Reject buttons — identical size, identical color treatment, identical placement tier, no hierarchy asymmetry; (3) audit and enforce a hard cookie gate ensuring zero non-essential cookies are set prior to affirmative Accept interaction. All three changes must ship in a single deployment. Shipping any subset leaves the compound GDPR Article 7 / Recital 32 violation materially intact and does not constitute a compliant consent flow under ICO or CNIL enforcement standards."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "The compound violation — simultaneous visual steering toward Accept and absence of the privacy policy link — fails GDPR Article 7's 'freely given' and 'informed' tests together."
fix_summary: "Atomic consent flow remediation addressing three co-located defects in the consent banner as a single compliant unit: (1) add an inline, clearly visible privacy policy link within the banner body tex…"
confidence_tier: "reviewer_identified"
---

# Atomic consent flow remediation addressing three co-located defects in the consent banner as a single compliant unit: (1) add an inline, clearly visible privacy policy link within the banner body text — not in the footer, not post-acceptance; (2) equalize the visual weight of Accept and Decline/Reject buttons — identical size, identical color treatment, identical placement tier, no hierarchy asymmetry; (3) audit and enforce a hard cookie gate ensuring zero non-essential cookies are set prior to affirmative Accept interaction. All three changes must ship in a single deployment. Shipping any subset leaves the compound GDPR Article 7 / Recital 32 violation materially intact and does not constitute a compliant consent flow under ICO or CNIL enforcement standards.

**Finding:** Atomic consent flow remediation addressing three co-located defects in the consent banner as a single compliant unit: (1) add an inline, clearly visible privacy policy link within the banner body text — not in the footer, not post-acceptance; (2) equalize the visual weight of Accept and Decline/Reject buttons — identical size, identical color treatment, identical placement tier, no hierarchy asymmetry; (3) audit and enforce a hard cookie gate ensuring zero non-essential cookies are set prior to affirmative Accept interaction. All three changes must ship in a single deployment. Shipping any subset leaves the compound GDPR Article 7 / Recital 32 violation materially intact and does not constitute a compliant consent flow under ICO or CNIL enforcement standards.  
**Severity:** Medium  
**Why this matters:** The compound violation — simultaneous visual steering toward Accept and absence of the privacy policy link — fails GDPR Article 7's 'freely given' and 'informed' tests together.  
**Root cause:** Isolated issue  
**Fix:** Atomic consent flow remediation addressing three co-located defects in the consent banner as a single compliant unit: (1) add an inline, clearly visible privacy policy link within the banner body tex…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Gdpr Regulatory Exposure Reduction:** The compound violation — simultaneous visual steering toward Accept and absence of the privacy policy link — fails GDPR Article 7's 'freely given' and 'informed' tests together. CNIL's 2022 cookie consent guidance explicitly identifies this pairing as a priority enforcement pattern. Remediating both defects atomically removes the primary basis for a formal complaint or regulatory investigation. The mechanism: regulators assess consent validity holistically; fixing only one element while the other remains leaves the compound violation legally intact and does not constitute a compliant consent flow.
- **Analytics Data Integrity:** Pre-consent cookie firing contaminates analytics datasets with sessions from users who have not consented to tracking. This inflates session counts, distorts conversion funnels, and produces attribution data that cannot be legally relied upon for business decisions in GDPR-regulated markets. Implementing the hard cookie gate produces a smaller but legally clean dataset — a necessary trade-off for data integrity and regulatory defensibility.
- **Consent Rate Directional Impact:** Equalizing button visual weight will reduce the artificial inflation of Accept rates caused by UI asymmetry. The resulting consent rate will more accurately reflect genuine user preference. This is a directional reduction in raw Accept clicks — but the consented user cohort will be legally valid, making the data more actionable and defensible. Regulators and DPAs treat inflated consent rates from dark patterns as invalid consent, meaning the pre-fix Accept clicks may not constitute valid consent at all.
- **User Trust And Brand Signal:** Providing an inline privacy policy link before the consent decision signals transparency. Users who can access privacy information before consenting are more likely to trust the site's data practices. This is a qualitative brand signal — not quantifiable without A/B testing against your specific audience — but it is directionally positive for trust-sensitive conversion flows (account creation, checkout, subscription sign-up).
- **Search Ranking Indirect Signal:** Google's Core Web Vitals and site quality signals include user experience factors. While consent banner design is not a direct ranking factor, sites that trigger regulatory complaints or receive enforcement actions face reputational and indirect SEO risks. This is a risk-mitigation signal, not a direct ranking improvement.
- **Accessibility Legal Exposure Reduction:** The remediated banner meets WCAG 2.1 AA requirements for keyboard navigation, focus management, ARIA dialog semantics, and touch target sizing. This reduces ADA/EAA legal exposure for the consent interaction specifically — a well-documented litigation target given that consent banners are mandatory touchpoints for all users.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/legal/privacy

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
Atomic consent flow remediation addressing three co-located defects in the consent banner as a single compliant unit: (1) add an inline, clearly visible privacy policy link within the banner body text — not in the footer, not post-acceptance; (2) equalize the visual weight of Accept and Decline/Reject buttons — identical size, identical color treatment, identical placement tier, no hierarchy asymmetry; (3) audit and enforce a hard cookie gate ensuring zero non-essential cookies are set prior to affirmative Accept interaction. All three changes must ship in a single deployment. Shipping any subset leaves the compound GDPR Article 7 / Recital 32 violation materially intact and does not constitute a compliant consent flow under ICO or CNIL enforcement standards.

### How
STEP 1 — AUDIT CURRENT COOKIE BEHAVIOR (pre-fix baseline, required before any code change)
1a. Open the site in an incognito/private window with DevTools → Application → Cookies panel visible.
1b. Do NOT interact with the consent banner. Record every cookie set at page load before any click. Export the list (name, domain, expiry, SameSite, Secure, HttpOnly flags).
1c. Classify each cookie: strictly necessary (session ID, CSRF token, load balancer affinity) vs. non-essential (analytics, advertising, personalization, A/B testing). Strictly necessary cookies may be set without consent under GDPR Recital 47 / ePrivacy Directive Article 5(3) — but this classification must be defensible and documented.
1d. For every non-essential cookie found firing before consent: identify the script responsible (GTM tag, inline script, third-party SDK auto-init), and add it to the suppression list in Step 3.
1e. Repeat after clicking Accept — verify all expected cookies now fire. Repeat after clicking Decline/Reject — verify non-essential cookies do NOT fire.
STEP 2 — REDESIGN BANNER MARKUP AND VISUAL HIERARCHY
2a. Locate the consent banner component in your codebase. Common locations: a dedicated CMP SDK (OneTrust, Cookiebot, Usercentrics, CookieYes), a custom React/Vue/Svelte component, or a CMS plugin (WordPress: GDPR Cookie Consent, Complianz). Identify whether the banner HTML is generated by a third-party SDK or is custom markup you control.
2b. If using a third-party CMP (OneTrust, Cookiebot, etc.): use the platform's style configuration panel to equalize button styles. Do NOT override via external CSS injection — CMP updates will overwrite injected styles. Use the platform's official theming API or CSS variable system. Document the platform version and configuration export.
2c. If using a custom component: apply the markup and CSS changes in Steps 2d–2f directly.
2d. Add the privacy policy link inline within the banner body text — it must appear before the action buttons so users can access it before making a choice. The link must be keyboard-focusable, have visible focus styling, and open in the same tab (not a new tab that obscures the banner) OR in a new tab with aria-label indicating this behavior. See code_examples[0] for the full banner markup.
2e. Equalize button visual weight: both Accept and Decline buttons must share the same CSS class for size, border-radius, font-weight, and padding. Differentiate them ONLY by semantic color meaning (e.g., both outlined, or both filled with neutral colors) — never use a high-contrast filled primary color for Accept alongside a ghost/text-only Decline. See code_examples[1] for the CSS.
2f. Button placement: Accept and Decline must appear at the same DOM level, in the same flex/grid row, with no size or margin asymmetry. If your design requires a visual distinction, use icon + label (checkmark vs. X) with equal button dimensions — never size asymmetry.
STEP 3 — IMPLEMENT HARD COOKIE GATE (consent-before-fire enforcement)
3a. If using Google Tag Manager: implement a custom consent state variable and fire all non-essential tags only when the consent trigger fires. Use GTM's native Consent Mode v2 (Google's framework) for Google tags, and a custom dataLayer event ('consent_granted') for all other tags. See code_examples[2] for the GTM dataLayer pattern.
3b. If using a CMP SDK: enable the SDK's 'block until consent' mode. For Cookiebot: set data-blockingmode='auto' on the script tag. For OneTrust: use the OptanonWrapper callback pattern. For CookieYes: enable 'Script Blocker' in settings. Verify the SDK version supports this — check release notes.
3c. For any third-party SDK that auto-initializes on script load (Meta Pixel, TikTok Pixel, Intercom, Hotjar, etc.): do NOT load the script tag until consent is granted. Use dynamic script injection post-consent rather than async/defer on a static script tag. See code_examples[3] for the dynamic injection pattern.
3d. For first-party analytics (GA4 via gtag.js): implement Google Consent Mode v2 with default denied state. See code_examples[4] for the gtag consent initialization pattern.
3e. Strictly necessary cookies (session, CSRF, load balancer) may remain ungated — but document each one with its legal basis in your cookie policy. Any cookie you cannot justify as strictly necessary must be gated.
STEP 4 — CONSENT STATE PERSISTENCE AND RECALL
4a. Store consent state in a first-party cookie (not localStorage — localStorage is not accessible cross-subdomain and is cleared by ITP/Safari). Cookie name example: 'consent_state'. Attributes: SameSite=Lax; Secure; HttpOnly=false (must be JS-readable for client-side gating); Max-Age=31536000 (1 year — GDPR does not mandate a specific duration but ICO guidance suggests re-prompting annually is reasonable).
4b. On page load, read the consent cookie before rendering the banner. If consent_state=accepted or consent_state=declined, do not show the banner — respect the stored choice and fire/suppress scripts accordingly.
4c. Provide a persistent, accessible mechanism for users to change their consent choice after initial interaction (required by GDPR Article 7(3) — withdrawal must be as easy as giving consent). This is typically a 'Cookie Settings' link in the site footer. See code_examples[5] for the consent state management module.
STEP 5 — ACCESSIBILITY AUDIT OF THE REMEDIATED BANNER
5a. Banner must be announced to screen readers on appearance: use role='dialog' and aria-labelledby pointing to the banner heading, aria-describedby pointing to the body text.
5b. On banner appearance, move focus to the banner (not to Accept — to the heading or first focusable element, so screen reader users hear the full context before reaching action buttons).
5c. Focus must be trapped within the banner while it is visible — Tab and Shift+Tab must cycle only within banner interactive elements.
5d. After consent choice, return focus to the element that was focused before the banner appeared (typically document.body or the first main content element).
5e. Privacy policy link must have descriptive link text — not 'click here' or 'learn more'. Use 'Privacy Policy' or 'our Privacy Policy'.
5f. Both buttons must have explicit aria-label if the button text alone is ambiguous in context.
STEP 6 — QA VERIFICATION CHECKLIST (must pass before deployment)
6a. Incognito page load → zero non-essential cookies before any interaction. PASS/FAIL.
6b. Click Accept → all expected analytics/advertising cookies fire within 2 seconds. PASS/FAIL.
6c. Click Decline → zero non-essential cookies set. PASS/FAIL.
6d. Reload after Accept → banner does not reappear, scripts fire immediately. PASS/FAIL.
6e. Reload after Decline → banner does not reappear, scripts remain suppressed. PASS/FAIL.
6f. Privacy policy link visible in banner body, keyboard-focusable, correct href. PASS/FAIL.
6g. Accept and Decline buttons: identical computed height, identical computed font-size, identical computed padding. Verify via DevTools Computed panel. PASS/FAIL.
6h. Screen reader test (NVDA+Firefox or VoiceOver+Safari): banner announced on load, full body text read before buttons, both buttons reachable via Tab, choice confirmed audibly. PASS/FAIL.
6i. Keyboard-only navigation: Tab into banner, reach privacy policy link, reach both buttons, make choice, focus returns to page. PASS/FAIL.
6j. Mobile viewport (375px): both buttons visible without horizontal scroll, touch targets ≥48×48px. PASS/FAIL.

### Code examples
```
// code_examples[0] — Consent Banner HTML (custom component)
// SITE-SPECIFIC ASSUMPTION: Adjust PRIVACY_POLICY_URL, banner copy, and class names to match your design system.
// This markup assumes a custom component. If using a CMP SDK, use the SDK's template/theming system instead.

// Named constants — configure before use
const CONSENT_BANNER_CONFIG = {
  PRIVACY_POLICY_URL: '/privacy-policy', // SITE-SPECIFIC: update to your actual privacy policy path
  COOKIE_NAME: 'consent_state',
  COOKIE_MAX_AGE_SECONDS: 31536000, // 1 year — re-evaluate annually per ICO guidance
  BANNER_ID: 'consent-banner',
  ACCEPTED_VALUE: 'accepted',
  DECLINED_VALUE: 'declined',
};

// Banner HTML template (rendered server-side or injected before any third-party scripts)
const BANNER_TEMPLATE = `
<div
  id="${CONSENT_BANNER_CONFIG.BANNER_ID}"
  role="dialog"
  aria-modal="true"
  aria-labelledby="consent-banner-heading"
  aria-describedby="consent-banner-body"
  class="consent-banner"
  tabindex="-1"
>
  <div class="consent-banner__inner">
    <h2 id="consent-banner-heading" class="consent-banner__heading">
      We use cookies
    </h2>
    <p id="consent-banner-body" class="consent-banner__body">
      We use cookies and similar technologies to improve your experience,
      analyse site traffic, and serve relevant content. Read our
      <a
        href="${CONSENT_BANNER_CONFIG.PRIVACY_POLICY_URL}"
        class="consent-banner__policy-link"
        aria-label="Privacy Policy (opens in same tab)"
      >Privacy Policy</a>
      to understand what data we collect and how we use it.
      You can accept all cookies or decline non-essential cookies.
    </p>
    <div class="consent-banner__actions" role="group" aria-label="Cookie consent options">
      <button
        type="button"
        id="consent-decline"
        class="consent-banner__btn consent-banner__btn--decline"
        aria-label="Decline non-essential cookies"
        data-consent-action="decline"
      >
        Decline
      </button>
      <button
        type="button"
        id="consent-accept"
        class="consent-banner__btn consent-banner__btn--accept"
        aria-label="Accept all cookies"
        data-consent-action="accept"
      >
        Accept
      </button>
    </div>
  </div>
</div>
`;
// NOTE: Decline appears first in DOM order (left on desktop, top on mobile).
// This is intentional — DOM order = screen reader order = keyboard order.
// Visual order matches DOM order. Neither button is visually privileged.
// code_examples[1] — Consent Banner CSS (equal visual weight)
// SITE-SPECIFIC ASSUMPTION: Replace CSS custom property values with your design system tokens.
// Scoped to .consent-banner to prevent layout regressions on other components.

:root {
  /* SITE-SPECIFIC: Replace with your design system tokens */
  --consent-btn-height: 44px;          /* Minimum 44px for WCAG 2.5.8 touch target */
  --consent-btn-min-width: 120px;
  --consent-btn-padding-x: 24px;
  --consent-btn-font-size: 1rem;
  --consent-btn-font-weight: 600;
  --consent-btn-border-radius: 4px;    /* SITE-SPECIFIC: match your design system */
  --consent-btn-border-width: 2px;
  --consent-btn-color-neutral: #1a1a1a; /* SITE-SPECIFIC: must meet 4.5:1 contrast on banner background */
  --consent-btn-bg-neutral: transparent;
  --consent-btn-border-color: #1a1a1a;
  --consent-banner-bg: #ffffff;
  --consent-banner-z: 9999;            /* SITE-SPECIFIC: verify no higher z-index in your stack */
  --consent-focus-ring: 3px solid #005fcc; /* SITE-SPECIFIC: must be visible on your background */
}

.consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--consent-banner-z);
  background: var(--consent-banner-bg);
  border-top: 1px solid #e0e0e0;
  padding: 20px 24px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
}

.consent-banner__inner {
  max-width: 960px; /* SITE-SPECIFIC: match your site's max content width */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.consent-banner__heading {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  /* Inherits body color — verify contrast meets 4.5:1 */
}

.consent-banner__body {
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0;
  color: #333333; /* SITE-SPECIFIC: verify 4.5:1 contrast on banner background */
}

.consent-banner__policy-link {
  color: inherit;
  text-decoration: underline;
  font-weight: 600;
}

.consent-banner__policy-link:focus-visible {
  outline: var(--consent-focus-ring);
  outline-offset: 2px;
  border-radius: 2px;
}

.consent-banner__actions {
  display: flex;
  flex-direction: row;
  gap: 12px;
  flex-wrap: wrap; /* Wraps gracefully on narrow viewports */
}

/* BASE BUTTON — identical for both Accept and Decline */
/* CRITICAL: Both buttons share this class. No size, padding, or font-size difference. */
.consent-banner__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--consent-btn-height);
  min-width: var(--consent-btn-min-width);
  padding: 0 var(--consent-btn-padding-x);
  font-size: var(--consent-btn-font-size);
  font-weight: var(--consent-btn-font-weight);
  border-radius: var(--consent-btn-border-radius);
  border: var(--consent-btn-border-width) solid var(--consent-btn-border-color);
  background: var(--consent-btn-bg-neutral);
  color: var(--consent-btn-color-neutral);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  /* Touch target: min 44px height already set. Ensure no margin compression. */
  flex-shrink: 0;
}

.consent-banner__btn:focus-visible {
  outline: var(--consent-focus-ring);
  outline-offset: 2px;
}

.consent-banner__btn:hover {
  background: #f0f0f0; /* SITE-SPECIFIC: neutral hover for both buttons equally */
}

/* MODIFIER: Accept — semantic differentiation ONLY via icon, not size or prominence */
/* Allowed: a subtle filled background if BOTH buttons get a filled treatment */
/* PROHIBITED: filled primary color on Accept + ghost/text-only on Decline */
.consent-banner__btn--accept {
  /* No size overrides. Color differentiation is optional and must be symmetric in weight. */
  /* If you want a filled Accept, use a neutral fill — not your brand primary CTA color. */
  /* Example neutral fill (comment out if using outlined-only approach): */
  /* background: #e8e8e8; */
}

.consent-banner__btn--decline {
  /* No size overrides. Mirrors Accept exactly. */
}

/* Mobile: stack buttons full-width for easier touch interaction */
@media (max-width: 480px) {
  .consent-banner__actions {
    flex-direction: column;
  }
  .consent-banner__btn {
    width: 100%;
    min-width: unset;
  }
}

/* Reduced motion: disable transition for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  .consent-banner__btn {
    transition: none;
  }
}
// code_examples[2] — Consent State Manager (vanilla JS, framework-agnostic)
// Handles: cookie read/write, banner show/hide, focus management, script gating, dataLayer events.
// SITE-SPECIFIC ASSUMPTION: Adjust CONSENT_BANNER_CONFIG values at top of file.
// Production Code Standards applied: try-catch on storage, named constants, observer teardown,
// null guards on external objects, no magic numbers.

(function initConsentManager() {
  'use strict';

  // ─── CONFIGURATION (all site-specific values isolated here) ───────────────
  const CONFIG = {
    COOKIE_NAME: 'consent_state',
    COOKIE_MAX_AGE: 31536000,        // 1 year in seconds — re-evaluate annually
    COOKIE_SAME_SITE: 'Lax',         // Lax: sent on top-level navigations, not cross-site
    BANNER_ID: 'consent-banner',
    ACCEPT_BTN_SELECTOR: '[data-consent-action="accept"]',
    DECLINE_BTN_SELECTOR: '[data-consent-action="decline"]',
    ACCEPTED_VALUE: 'accepted',
    DECLINED_VALUE: 'declined',
    FOCUS_RETURN_DELAY_MS: 50,       // Brief delay to allow banner removal before focus shift
    DATALAYER_CONSENT_EVENT: 'consent_update', // GTM trigger listens for this event name
  };

  // ─── COOKIE UTILITIES ─────────────────────────────────────────────────────

  /**
   * Read a cookie value by name.
   * Returns null if not found.
   */
  function getCookie(name) {
    try {
      const match = document.cookie
        .split('; ')
        .find(function(row) { return row.startsWith(name + '='); });
      return match ? decodeURIComponent(match.split('=')[1]) : null;
    } catch (err) {
      // Defensive: cookie access can fail in sandboxed iframes
      console.warn('[ConsentManager] getCookie failed:', err);
      return null;
    }
  }

  /**
   * Write a consent state cookie.
   * HttpOnly intentionally omitted — must be JS-readable for client-side gating.
   * Secure flag: set only on HTTPS. Detected at runtime.
   */
  function setConsentCookie(value) {
    try {
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = [
        CONFIG.COOKIE_NAME + '=' + encodeURIComponent(value),
        'Max-Age=' + CONFIG.COOKIE_MAX_AGE,
        'SameSite=' + CONFIG.COOKIE_SAME_SITE,
        'Path=/',
        secure,
      ].join('; ');
    } catch (err) {
      console.warn('[ConsentManager] setConsentCookie failed:', err);
    }
  }

  // ─── FOCUS MANAGEMENT ────────────────────────────────────────────────────

  /** Element that held focus before the banner appeared — restored on dismissal. */
  var _preBannerFocus = null;

  /**
   * Trap focus within the banner element.
   * Returns a cleanup function — call it when banner is removed.
   */
  function trapFocus(bannerEl) {
    var FOCUSABLE_SELECTORS = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    function getFocusable() {
      return Array.prototype.slice.call(bannerEl.querySelectorAll(FOCUSABLE_SELECTORS));
    }

    function handleKeydown(event) {
      if (event.key !== 'Tab') return;
      var focusable = getFocusable();
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeydown);

    // Return teardown function
    return function removeTrap() {
      document.removeEventListener('keydown', handleKeydown);
    };
  }

  // ─── BANNER LIFECYCLE ─────────────────────────────────────────────────────

  var _removeFocusTrap = null;

  function showBanner() {
    var banner = document.getElementById(CONFIG.BANNER_ID);
    if (!banner) {
      console.warn('[ConsentManager] Banner element not found in DOM. Verify BANNER_ID config.');
      return;
    }

    // Store pre-banner focus target for restoration
    _preBannerFocus = document.activeElement || document.body;

    banner.removeAttribute('hidden');
    banner.style.display = ''; // Remove any inline display:none

    // Move focus to banner heading (not Accept button) so screen readers hear full context
    var heading = banner.querySelector('[id$="-heading"]') || banner;
    // Use tabindex=-1 on heading to allow programmatic focus without adding to tab order
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
    }
    heading.focus();

    // Activate focus trap
    _removeFocusTrap = trapFocus(banner);
  }

  function hideBanner() {
    var banner = document.getElementById(CONFIG.BANNER_ID);
    if (banner) {
      banner.setAttribute('hidden', '');
    }

    // Release focus trap
    if (typeof _removeFocusTrap === 'function') {
      _removeFocusTrap();
      _removeFocusTrap = null;
    }

    // Restore focus to pre-banner element
    var returnTarget = _preBannerFocus;
    _preBannerFocus = null;
    if (returnTarget && typeof returnTarget.focus === 'function') {
      setTimeout(function() {
        returnTarget.focus();
      }, CONFIG.FOCUS_RETURN_DELAY_MS);
    }
  }

  // ─── CONSENT ACTIONS ─────────────────────────────────────────────────────

  /**
   * Push a consent update event to the dataLayer.
   * GTM listens for CONFIG.DATALAYER_CONSENT_EVENT to fire consent-gated tags.
   * Null-guarded: window.dataLayer may not exist if GTM is not used.
   */
  function pushConsentEvent(consentValue) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: CONFIG.DATALAYER_CONSENT_EVENT,
        consent_state: consentValue,
        consent_timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[ConsentManager] dataLayer push failed:', err);
    }
  }

  function onAccept() {
    setConsentCookie(CONFIG.ACCEPTED_VALUE);
    pushConsentEvent(CONFIG.ACCEPTED_VALUE);
    hideBanner();
    // Fire deferred non-essential scripts (see code_examples[3])
    if (typeof window.__consentGrantedCallbacks === 'function') {
      try {
        window.__consentGrantedCallbacks();
      } catch (err) {
        console.warn('[ConsentManager] consentGrantedCallbacks error:', err);
      }
    }
  }

  function onDecline() {
    setConsentCookie(CONFIG.DECLINED_VALUE);
    pushConsentEvent(CONFIG.DECLINED_VALUE);
    hideBanner();
    // Non-essential scripts remain suppressed — no action needed
  }

  // ─── INITIALIZATION ───────────────────────────────────────────────────────

  function init() {
    var existingConsent = getCookie(CONFIG.COOKIE_NAME);

    if (existingConsent === CONFIG.ACCEPTED_VALUE) {
      // Consent already given — fire scripts immediately, no banner
      pushConsentEvent(CONFIG.ACCEPTED_VALUE);
      if (typeof window.__consentGrantedCallbacks === 'function') {
        try { window.__consentGrantedCallbacks(); } catch (e) {}
      }
      return;
    }

    if (existingConsent === CONFIG.DECLINED_VALUE) {
      // Consent already declined — suppress scripts, no banner
      return;
    }

    // No prior consent — show banner
    showBanner();

    // Attach button handlers
    var banner = document.getElementById(CONFIG.BANNER_ID);
    if (!banner) return;

    var acceptBtn = banner.querySelector(CONFIG.ACCEPT_BTN_SELECTOR);
    var declineBtn = banner.querySelector(CONFIG.DECLINE_BTN_SELECTOR);

    if (acceptBtn) {
      acceptBtn.addEventListener('click', onAccept);
    } else {
      console.warn('[ConsentManager] Accept button not found. Verify ACCEPT_BTN_SELECTOR config.');
    }

    if (declineBtn) {
      declineBtn.addEventListener('click', onDecline);
    } else {
      console.warn('[ConsentManager] Decline button not found. Verify DECLINE_BTN_SELECTOR config.');
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── PUBLIC API (for Cookie Settings re-prompt in footer) ─────────────────
  window.ConsentManager = {
    /**
     * Re-open the consent banner (e.g., triggered by 'Cookie Settings' footer link).
     * Clears stored consent to force re-evaluation.
     */
    reopenBanner: function() {
      try {
        // Expire the consent cookie
        document.cookie = CONFIG.COOKIE_NAME + '=; Max-Age=0; Path=/; SameSite=' + CONFIG.COOKIE_SAME_SITE;
      } catch (err) {
        console.warn('[ConsentManager] Cookie clear failed:', err);
      }
      showBanner();
    },
    getConsentState: function() {
      return getCookie(CONFIG.COOKIE_NAME);
    },
  };

}());
// code_examples[3] — Deferred Non-Essential Script Injection (post-consent)
// Pattern: register scripts as callbacks, fire only after consent is granted.
// SITE-SPECIFIC ASSUMPTION: Replace script URLs and initialization logic with your actual vendors.
// This pattern works for any third-party SDK that auto-initializes on script load.

(function setupConsentGatedScripts() {
  'use strict';

  // ─── CONFIGURATION ────────────────────────────────────────────────────────
  // SITE-SPECIFIC: Add or remove entries for your actual third-party vendors.
  // Each entry: { id: unique DOM id, src: script URL, onload: init callback }
  var GATED_SCRIPTS = [
    {
      id: 'script-meta-pixel',
      // SITE-SPECIFIC: Replace with your actual Meta Pixel script URL
      src: 'https://connect.facebook.net/en_US/fbevents.js',
      onload: function() {
        // SITE-SPECIFIC: Replace ANALYTICS_PIXEL_ID with your named constant
        // Do NOT hardcode pixel IDs here — use a config object or data attribute
        var pixelId = document.documentElement.dataset.metaPixelId;
        if (!pixelId) {
          console.warn('[ConsentGate] Meta Pixel ID not found in data-meta-pixel-id attribute.');
          return;
        }
        if (typeof window.fbq !== 'function') {
          console.warn('[ConsentGate] fbq not available after script load.');
          return;
        }
        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');
      },
    },
    {
      id: 'script-hotjar',
      // SITE-SPECIFIC: Replace with your actual Hotjar script URL
      src: 'https://static.hotjar.com/c/hotjar-SITE_ID.js?sv=6', // SITE-SPECIFIC: update SITE_ID
      onload: function() {
        // Hotjar auto-initializes on load when URL contains site ID
        // No additional init call required for standard embed
      },
    },
    // Add additional gated scripts here following the same pattern
  ];

  var SCRIPT_LOAD_TIMEOUT_MS = 10000; // 10 seconds — flag if script fails to load

  /**
   * Dynamically inject a script tag after consent is granted.
   * Null-guards: checks for duplicate injection, validates src.
   */
  function injectScript(scriptConfig) {
    if (!scriptConfig || !scriptConfig.src || !scriptConfig.id) {
      console.warn('[ConsentGate] Invalid script config:', scriptConfig);
      return;
    }

    // Prevent duplicate injection
    if (document.getElementById(scriptConfig.id)) {
      return;
    }

    var script = document.createElement('script');
    script.id = scriptConfig.id;
    script.src = scriptConfig.src;
    script.async = true;

    var timeoutId = setTimeout(function() {
      console.warn('[ConsentGate] Script load timeout:', scriptConfig.src);
    }, SCRIPT_LOAD_TIMEOUT_MS);

    script.addEventListener('load', function() {
      clearTimeout(timeoutId);
      if (typeof scriptConfig.onload === 'function') {
        try {
          scriptConfig.onload();
        } catch (err) {
          console.warn('[ConsentGate] Script onload callback error for', scriptConfig.id, err);
        }
      }
    });

    script.addEventListener('error', function() {
      clearTimeout(timeoutId);
      console.warn('[ConsentGate] Script failed to load:', scriptConfig.src);
    });

    document.head.appendChild(script);
  }

  /**
   * Fire all gated scripts.
   * Called by ConsentManager after Accept, or on page load if consent cookie = accepted.
   */
  function fireAllGatedScripts() {
    GATED_SCRIPTS.forEach(function(scriptConfig) {
      injectScript(scriptConfig);
    });
  }

  // Register as the consent-granted callback consumed by code_examples[2]
  window.__consentGrantedCallbacks = fireAllGatedScripts;

}());
// code_examples[4] — Google Consent Mode v2 Initialization
// Must appear BEFORE the gtag.js script tag and BEFORE any gtag() calls.
// SITE-SPECIFIC ASSUMPTION: Replace ANALYTICS_MEASUREMENT_ID with your named constant.
// This snippet must be inline in <head> — do not defer or async it.

// Named constant — configure before deployment
// SITE-SPECIFIC: Set this to your actual GA4 Measurement ID via server-side template or data attribute
var ANALYTICS_MEASUREMENT_ID = document.documentElement.dataset.gaMeasurementId;

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }

// Set consent defaults BEFORE gtag.js loads
// All consent types default to 'denied' until user accepts
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted', // Strictly necessary — session security
  wait_for_update: 2000, // ms to wait for consent update before sending hits
});

// After user accepts (called from ConsentManager.onAccept via dataLayer event or direct call):
function updateConsentGranted() {
  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  });
}

// After user declines (called from ConsentManager.onDecline):
function updateConsentDenied() {
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
  });
}

// Wire to ConsentManager dataLayer events
// GTM trigger: Custom Event = 'consent_update', fires 'Update Consent State' tag
// OR: listen directly if not using GTM
document.addEventListener('DOMContentLoaded', function() {
  // If not using GTM, listen for the consent_update dataLayer push
  // and call updateConsentGranted/updateConsentDenied accordingly
  // GTM users: configure a Custom Event trigger on 'consent_update' instead
});
// code_examples[5] — Cookie Settings Footer Link (re-prompt mechanism)
// GDPR Article 7(3): withdrawal must be as easy as giving consent.
// Add this link to your site footer. It calls ConsentManager.reopenBanner().
// SITE-SPECIFIC ASSUMPTION: Adjust class names to match your footer design system.

// HTML to add to footer template:
/*
<button
  type="button"
  class="footer__cookie-settings-btn"
  onclick="if (window.ConsentManager && typeof window.ConsentManager.reopenBanner === 'function') { window.ConsentManager.reopenBanner(); } else { console.warn('ConsentManager not initialized'); }"
  aria-label="Open cookie settings to change your consent preferences"
>
  Cookie Settings
</button>
*/

// CSS for footer button (scoped, no layout regressions):
/*
.footer__cookie-settings-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: inherit;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
}
.footer__cookie-settings-btn:focus-visible {
  outline: 3px solid currentColor; /* SITE-SPECIFIC: match your focus ring style */
  outline-offset: 2px;
  border-radius: 2px;
}
*/

// Vanilla JS alternative (avoids inline onclick, preferred for CSP compliance):
(function initCookieSettingsLink() {
  'use strict';
  var COOKIE_SETTINGS_SELECTOR = '.footer__cookie-settings-btn'; // SITE-SPECIFIC

  function attachCookieSettingsHandler() {
    var btn = document.querySelector(COOKIE_SETTINGS_SELECTOR);
    if (!btn) return; // Footer link is optional — not an error if absent on some page types

    btn.addEventListener('click', function() {
      if (window.ConsentManager && typeof window.ConsentManager.reopenBanner === 'function') {
        window.ConsentManager.reopenBanner();
      } else {
        console.warn('[CookieSettings] ConsentManager not available. Verify load order.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachCookieSettingsHandler);
  } else {
    attachCookieSettingsHandler();
  }
}());
```

## Risks
- CONSENT RATE DROP (expected, not a defect): Equalizing button visual weight will reduce artificially inflated Accept rates. This is the correct outcome — the pre-fix rate reflected dark pattern steering, not genuine user preference. Stakeholders must be briefed before deployment to prevent the rate drop being misread as a regression. Prepare a stakeholder communication explaining that the new rate reflects valid consent.
- ANALYTICS DATA GAP: Implementing the hard cookie gate will reduce analytics data volume for non-consenting users. In GDPR-regulated markets, this data was never legally collectible — the gap reveals the true consented audience size. Mitigate by implementing Google Consent Mode v2's modeled conversions to partially recover aggregate insights without individual tracking.
- CMP SDK VERSION CONFLICTS: If using a third-party CMP (OneTrust, Cookiebot, etc.), the platform's auto-update mechanism may overwrite custom CSS or configuration changes. Mitigate by: (a) using only the CMP's official theming API, never external CSS overrides; (b) pinning the CMP SDK version and testing updates in staging before production; (c) documenting all configuration changes in the CMP's admin panel, not in external code.
- GTAG / GTM CONSENT MODE MISCONFIGURATION: Incorrect Consent Mode v2 implementation can result in Google tags firing before consent (if wait_for_update is too short) or never firing after consent (if the update call is missing). Mitigate by testing with Google Tag Assistant and verifying consent state transitions in the GTM Preview mode before going live.
- STRICTLY NECESSARY COOKIE MISCLASSIFICATION: Teams may incorrectly classify analytics or A/B testing cookies as 'strictly necessary' to avoid gating them. This is a GDPR violation and increases regulatory risk. Mitigate by requiring legal/DPO sign-off on the strictly necessary cookie list before deployment. Document the legal basis for each ungated cookie.
- FOCUS MANAGEMENT REGRESSION IN SINGLE-PAGE APPLICATIONS (SPAs): In React, Vue, or Angular SPAs, programmatic focus management can conflict with framework rendering cycles. If the banner is rendered by a framework component, the focus call in showBanner() may fire before the DOM element is painted. Mitigate by wrapping the focus call in requestAnimationFrame() or using the framework's nextTick/useEffect equivalent.
- BANNER FLASH ON RETURN VISITS: If the consent cookie is read client-side (JS), there is a brief window between page paint and JS execution where the banner may flash visible before being hidden. Mitigate by: (a) reading the consent cookie server-side and conditionally rendering the banner in HTML (preferred); or (b) adding a CSS rule that hides the banner by default and shows it only when a JS-added class is present.
- CROSS-SUBDOMAIN CONSENT STATE: The consent cookie set with Path=/ applies only to the current domain. If your site spans multiple subdomains (shop.example.com, blog.example.com), users will be re-prompted on each subdomain. Mitigate by setting the cookie Domain attribute to .example.com (note leading dot). SITE-SPECIFIC: evaluate whether cross-subdomain consent sharing is appropriate for your data architecture.
- THIRD-PARTY CMP LEGAL RESPONSIBILITY TRANSFER: Using a CMP SDK does not automatically transfer GDPR liability to the CMP vendor. The data controller (your organization) remains responsible for the consent flow's compliance. The CMP is a tool, not a legal shield. Ensure your DPO reviews the final consent flow regardless of which implementation approach is used.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
