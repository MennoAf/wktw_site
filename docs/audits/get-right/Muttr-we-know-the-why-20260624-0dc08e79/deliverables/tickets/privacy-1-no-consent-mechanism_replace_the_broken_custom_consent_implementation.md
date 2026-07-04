---
finding_id: "privacy-1-no-consent-mechanism"
title: "Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure"
severity: "critical"
root_cause_cluster: "Pre-Consent Tracking and Consent Mechanism Failures"
why_this_matters: "GDPR enforcement carries fines up to 4% of annual global revenue."
fix_summary: "Replace the broken custom consent implementation with a consent-gated script loading architecture where GTM, GA4, Plausible, and Google Fonts are blocked from loading until the user grants explicit c…"
confidence_tier: "confirmed"
---

# Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure

**Finding:** Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure  
**Severity:** Critical  
**Why this matters:** GDPR enforcement carries fines up to 4% of annual global revenue.  
**Root cause:** Pre-Consent Tracking and Consent Mechanism Failures  
**Fix:** Replace the broken custom consent implementation with a consent-gated script loading architecture where GTM, GA4, Plausible, and Google Fonts are blocked from loading until the user grants explicit c…

> **Evidence Basis:** Confirmed

---

## Impact

- **Revenue:** GDPR enforcement carries fines up to 4% of annual global revenue. Pre-consent tracking on a lead-capture form — where users submit name, email, and company — compounds the exposure because personal data collection occurs alongside non-consented tracking. Reputational damage from a data protection complaint can suppress inbound leads from privacy-conscious B2B prospects.
- **Conversion Rate:** If the consent banner is geo-conditionally hidden, non-EU users never see it — acceptable. But if it's broken for EU users, those users have no mechanism to grant consent, meaning all their analytics data is collected in degraded cookieless mode, reducing attribution accuracy for EU traffic segments.
- **Bounce Rate:** No direct bounce rate impact from the consent mechanism itself.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

### GDPR Art. 6(1)(a) + ePrivacy Art. 5(3) — pre-consent tracking

**Exposure:** HIGH  
**What Failed:** 0 non-essential cookie(s) and 3 tracking request(s) detected before user consent interaction  

**Remediation:** Block all non-essential cookies and tracking requests until the user provides affirmative consent via the CMP. Implement Google Consent Mode v2 or equivalent tag-gating. Pre-consent state must have zero non-essential cookies.

### GDPR Art. 6(1)(a) + Art. 13 — missing consent mechanism

**Exposure:** HIGH  
**What Failed:** No consent banner detected, yet non-essential cookies/tracking are active. Users have no mechanism to provide or withhold consent.  

**Remediation:** Implement a GDPR-compliant Consent Management Platform (CMP) that blocks non-essential processing until affirmative consent is obtained. The banner must clearly identify purposes, provide granular controls, and link to the privacy policy.

### CCPA 1798.120 + 1798.135 — opt-out mechanism deficiency

**Exposure:** MEDIUM  
**What Failed:** California consumers must be able to opt out of the sale/sharing of personal information. Tracking activity detected that may constitute 'sharing' under CCPA's broad definition.  

**Remediation:** Implement a 'Do Not Sell or Share My Personal Information' link in the website footer. Honor Global Privacy Control (GPC) signals. Ensure opt-out stops cross-context behavioral advertising pixels (Meta, Google Ads, etc.).

### CCPA 1798.135(e) + Cal. AG Regulations 999.315 — GPC signal non-compliance

**Exposure:** MEDIUM  
**What Failed:** Tracking requests fire before consent, suggesting Global Privacy Control (GPC) browser signals may not be honored. CCPA requires businesses to treat GPC as a valid opt-out request.  

**Remediation:** Detect the Sec-GPC: 1 header or navigator.globalPrivacyControl JavaScript API. When present, treat as opt-out of sale/sharing — suppress advertising pixels and cross-site tracking.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_002`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/contact/
**Element:** Consent decline button — present in DOM but tracking fires before interaction
**XPath:** `//*[@id="consent-decline"]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id="consent-decline"]")`
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
Replace the broken custom consent implementation with a consent-gated script loading architecture where GTM, GA4, Plausible, and Google Fonts are blocked from loading until the user grants explicit consent. Self-host Google Fonts to eliminate the pre-consent IP transmission entirely. Implement a minimal, spec-compliant consent manager that persists state, replays consent decisions, and injects scripts only after affirmative action.

### How
1. SELF-HOST GOOGLE FONTS IMMEDIATELY — Download all Google Font files currently loaded from fonts.googleapis.com. Convert to WOFF2 if not already. Serve from the site's own origin or existing CDN. Update all CSS @font-face rules to reference local paths. This eliminates the Google Fonts GDPR vector entirely and removes it from the consent gate (fonts become first-party assets). This step has zero consent dependency and should ship first.

2. REMOVE ALL INLINE GTM/GA4/PLAUSIBLE SCRIPT TAGS FROM HTML TEMPLATES — Delete the hardcoded <script> tags for GTM (GTM-5VQTG6TH), gtag.js (G-91BP6NPTSM), and Plausible from every template. These must never appear in raw HTML. They will be injected dynamically by the consent manager only after consent is granted.

3. DEPLOY THE CONSENT MANAGER (code below) — Add the consent manager script as an inline <script> in the <head>, BEFORE any other scripts. It must be first-party, inline, and synchronous so it executes before anything else. The consent manager: (a) checks localStorage for prior consent state, (b) if no prior state, renders the consent banner and blocks all tracking, (c) on accept, persists consent to localStorage with timestamp and version, then injects tracking scripts, (d) on decline, persists refusal and injects nothing, (e) on subsequent page loads with stored consent, injects scripts immediately without showing the banner.

4. CONFIGURE GOOGLE CONSENT MODE V2 DEFAULTS — Before GTM loads, push default deny states to the dataLayer. When consent is granted, push update commands. This ensures that even if GTM somehow loads before consent (defense in depth), Consent Mode defaults prevent cookie writes and restrict data collection.

5. REPLACE THE EXISTING CONSENT BANNER DOM — Remove the current #consent-accept / #consent-decline elements from server-rendered HTML. The consent manager injects its own banner dynamically. This avoids the current failure mode where the banner exists in DOM but is invisible.

6. ADD A PERSISTENT 'MANAGE COOKIES' LINK IN THE SITE FOOTER — This allows users to revoke or modify consent post-decision, which is required under GDPR Article 7(3). The link calls the consent manager's revoke function, clears stored consent, removes injected scripts' cookies, and re-displays the banner.

7. VERIFY WITH EU-ORIGIN TESTING — After deployment, test from an EU IP (VPN or proxy) to confirm: (a) no network requests to google-analytics.com, googletagmanager.com, or plausible.io before consent interaction, (b) banner renders and is interactive, (c) accept injects scripts and fires beacons, (d) decline persists and no scripts load on subsequent navigation, (e) revoke clears cookies and re-gates scripts.

### Code examples
```
/* ============================================================
 * STEP 1: Self-hosted Google Fonts CSS
 * Replace the <link href="https://fonts.googleapis.com/..." /> tag
 * with this inline or local CSS file.
 *
 * SITE-SPECIFIC ASSUMPTION: Font families, weights, and file paths
 * below must match the fonts currently loaded from Google.
 * Adjust FONT_BASE_PATH and font-family names to match your site.
 * ============================================================ */

/* -- fonts.css (self-hosted) -- */

/* SITE-SPECIFIC: adjust path to where font files are deployed */
/* e.g., /assets/fonts/, /wp-content/themes/mytheme/fonts/, etc. */

@font-face {
  font-family: 'Inter'; /* SITE-SPECIFIC: replace with actual font family */
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/inter-v13-latin-regular.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/assets/fonts/inter-v13-latin-700.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}
/* ============================================================
 * STEPS 2-6: Consent Manager — inline in <head> before all other scripts
 *
 * ARCHITECTURE:
 * - Consent state stored in localStorage (key: 'mttr_consent')
 * - Scripts injected dynamically only after explicit accept
 * - Google Consent Mode v2 defaults pushed before GTM injection
 * - Banner rendered by JS, not server HTML (eliminates invisible-banner bug)
 * - Footer 'Manage Cookies' link calls MttrConsent.revoke()
 *
 * PRECONDITIONS:
 * - No GTM, GA4, or Plausible <script> tags exist in HTML
 * - Google Fonts are self-hosted (Step 1 complete)
 * - This script is the FIRST <script> in <head>
 *
 * WHAT THIS BREAKS:
 * - Any GTM triggers that assume GTM is always loaded will not fire
 *   until consent is granted. This is the intended behavior.
 * - Analytics data will drop for users who decline. This is legally
 *   required — the prior "100% tracking" was non-compliant.
 * - Plausible's dashboard will show reduced pageviews proportional
 *   to consent decline rate.
 *
 * SCOPING:
 * - The consent manager only touches elements it creates (the banner)
 *   and scripts it injects. It does not modify existing DOM.
 * - All selectors target elements created by this script via
 *   data-mttr-consent attributes, not existing site selectors.
 * - Cookie cleanup on revoke targets only known tracking cookies
 *   by prefix (_ga, _gid, _gat, plausible). Site-functional cookies
 *   are not touched.
 *
 * ORDERING / LOCKING:
 * - Script injection uses a boolean gate (consentProcessed) set
 *   synchronously before any async injection begins.
 * - Banner click handlers are attached once and remove the banner
 *   synchronously before injection, preventing double-click races.
 * - localStorage writes happen synchronously before script injection.
 *   If localStorage throws (Safari private browsing), consent falls
 *   back to session-only memory state — banner re-appears next visit
 *   but scripts still gate correctly for the current session.
 *
 * BROWSER SUPPORT:
 * - localStorage: wrapped in try-catch for Safari private browsing
 * - JSON.parse/stringify: IE9+ (effectively universal)
 * - document.createElement: universal
 * - No dependency on IntersectionObserver, MutationObserver, or
 *   any API requiring feature detection
 * ============================================================ */

<script>
(function() {
  'use strict';

  /* ---- NAMED CONSTANTS ---- */

  /* Storage key for consent state in localStorage */
  var CONSENT_STORAGE_KEY = 'mttr_consent';

  /* Consent record version — increment when consent scope changes
   * to force re-consent from all users */
  var CONSENT_VERSION = 1;

  /* Maximum age of a consent record in milliseconds (13 months).
   * GDPR guidance from multiple DPAs recommends re-consent within
   * 13 months. After this period, the banner re-appears. */
  var CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

  /* SITE-SPECIFIC: GTM container ID */
  var GTM_CONTAINER_ID = 'GTM-5VQTG6TH';

  /* SITE-SPECIFIC: GA4 measurement ID */
  var GA4_MEASUREMENT_ID = 'G-91BP6NPTSM';

  /* SITE-SPECIFIC: Plausible script source */
  var PLAUSIBLE_SCRIPT_SRC = 'https://plausible.io/js/script.js';

  /* SITE-SPECIFIC: Plausible data-domain attribute */
  var PLAUSIBLE_DATA_DOMAIN = 'example.com';

  /* Cookie prefixes to clear on consent revocation */
  var TRACKING_COOKIE_PREFIXES = ['_ga', '_gid', '_gat'];

  /* Z-index for consent banner — must be above all site content.
   * SITE-SPECIFIC: adjust if site uses z-index values above 10000 */
  var BANNER_Z_INDEX = 10000;

  /* ---- STATE ---- */

  /* In-memory consent state for current session.
   * Used as fallback when localStorage is unavailable. */
  var sessionConsentState = null;

  /* Gate to prevent double-processing of consent action */
  var consentProcessed = false;

  /* ---- STORAGE HELPERS ---- */

  function readConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!raw) return sessionConsentState;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== CONSENT_VERSION) return null;
      if (Date.now() - parsed.timestamp > CONSENT_MAX_AGE_MS) {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch (e) {
      /* Safari private browsing or corrupted data */
      return sessionConsentState;
    }
  }

  function writeConsent(granted) {
    var record = {
      granted: granted,
      version: CONSENT_VERSION,
      timestamp: Date.now()
    };
    sessionConsentState = record;
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      /* Safari private browsing — session-only consent is acceptable.
       * Banner will re-appear on next visit, which is compliant. */
    }
    return record;
  }

  /* ---- GOOGLE CONSENT MODE V2 ---- */

  /* Push default deny states BEFORE GTM loads.
   * This is defense-in-depth: even if GTM somehow loads,
   * Consent Mode defaults prevent cookie writes. */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted',
    'wait_for_update': 500
  });

  /* ---- SCRIPT INJECTION ---- */

  function injectGTM() {
    /* Update Consent Mode to granted before GTM initializes */
    gtag('consent', 'update', {
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted',
      'analytics_storage': 'granted',
      'functionality_storage': 'granted',
      'personalization_storage': 'granted'
    });

    /* GTM snippet — standard async injection */
    (function(w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0];
      var j = d.createElement(s);
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i +
              '&l=' + l;
      if (f && f.parentNode) {
        f.parentNode.insertBefore(j, f);
      }
    })(window, document, 'script', 'dataLayer', GTM_CONTAINER_ID);
  }

  function injectPlausible() {
    var s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', PLAUSIBLE_DATA_DOMAIN);
    s.src = PLAUSIBLE_SCRIPT_SRC;
    var firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(s, firstScript);
    }
  }

  function injectAllTracking() {
    injectGTM();
    injectPlausible();
  }

  /* ---- COOKIE CLEANUP ---- */

  function clearTrackingCookies() {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      var name = cookie.split('=')[0];
      for (var j = 0; j < TRACKING_COOKIE_PREFIXES.length; j++) {
        if (name.indexOf(TRACKING_COOKIE_PREFIXES[j]) === 0) {
          /* Clear cookie on current path and root path,
           * with and without domain, to cover all variants */
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' +
            window.location.hostname;
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' +
            window.location.hostname;
        }
      }
    }
  }

  /* ---- BANNER RENDERING ---- */

  function createBanner() {
    var overlay = document.createElement('div');
    overlay.setAttribute('data-mttr-consent', 'overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Cookie consent');

    /* Inline styles scoped to data-mttr-consent elements only.
     * No external selectors are used. This cannot conflict with
     * existing site styles because these elements do not exist
     * in the site's HTML or CSS. */
    overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;' +
      'background:rgba(0,0,0,0.85);color:#fff;padding:20px;' +
      'z-index:' + BANNER_Z_INDEX + ';font-family:system-ui,-apple-system,sans-serif;' +
      'font-size:15px;line-height:1.5;display:flex;flex-wrap:wrap;' +
      'align-items:center;justify-content:center;gap:16px;';

    var text = document.createElement('p');
    text.setAttribute('data-mttr-consent', 'text');
    text.style.cssText = 'margin:0;max-width:600px;flex:1 1 300px;';
    text.innerHTML = 'We use cookies and analytics services to understand how you use this site. ' +
      '<a href="/privacy-policy" style="color:#93c5fd;text-decoration:underline;" ' +
      'data-mttr-consent="privacy-link">Privacy Policy</a>';

    var btnWrap = document.createElement('div');
    btnWrap.setAttribute('data-mttr-consent', 'buttons');
    btnWrap.style.cssText = 'display:flex;gap:12px;flex-shrink:0;';

    /* Button base styles — identical sizing and weight for both buttons.
     * This prevents dark pattern accusations from unequal button styling. */
    var BTN_BASE = 'padding:12px 24px;border:2px solid #fff;border-radius:6px;' +
      'font-size:15px;font-weight:600;cursor:pointer;min-width:120px;' +
      'min-height:48px;text-align:center;line-height:1;';

    var acceptBtn = document.createElement('button');
    acceptBtn.setAttribute('data-mttr-consent', 'accept');
    acceptBtn.setAttribute('type', 'button');
    acceptBtn.textContent = 'Accept';
    /* White background, dark text — high contrast (passes WCAG AA) */
    acceptBtn.style.cssText = BTN_BASE + 'background:#fff;color:#111;';

    var declineBtn = document.createElement('button');
    declineBtn.setAttribute('data-mttr-consent', 'decline');
    declineBtn.setAttribute('type', 'button');
    declineBtn.textContent = 'Decline';
    /* Transparent background, white text/border — high contrast on dark bg */
    declineBtn.style.cssText = BTN_BASE + 'background:transparent;color:#fff;';

    btnWrap.appendChild(acceptBtn);
    btnWrap.appendChild(declineBtn);
    overlay.appendChild(text);
    overlay.appendChild(btnWrap);

    /* ---- EVENT HANDLERS ---- */

    function handleAccept() {
      if (consentProcessed) return;
      consentProcessed = true;
      removeBanner();
      writeConsent(true);
      injectAllTracking();
    }

    function handleDecline() {
      if (consentProcessed) return;
      consentProcessed = true;
      removeBanner();
      writeConsent(false);
    }

    function removeBanner() {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }

    acceptBtn.addEventListener('click', handleAccept);
    declineBtn.addEventListener('click', handleDecline);

    /* Trap focus within banner for accessibility.
     * Only two focusable elements: accept and decline. */
    overlay.addEventListener('keydown', function handleKeydown(e) {
      if (e.key === 'Tab' || e.keyCode === 9) {
        var focusable = [acceptBtn, declineBtn];
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    document.body.appendChild(overlay);

    /* Move focus to the banner for screen reader announcement */
    acceptBtn.focus();
  }

  /* ---- PUBLIC API (for footer 'Manage Cookies' link) ---- */

  window.MttrConsent = {
    revoke: function() {
      consentProcessed = false;
      sessionConsentState = null;
      try {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
      } catch (e) { /* ignore */ }
      clearTrackingCookies();

      /* Reset Consent Mode to denied */
      gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied',
        'functionality_storage': 'denied',
        'personalization_storage': 'denied'
      });

      /* Note: already-injected GTM/GA4 scripts cannot be fully
       * unloaded without a page reload. Consent Mode update stops
       * further data collection. For complete cleanup, reload: */
      if (document.body) {
        createBanner();
      }
    },
    getState: function() {
      var record = readConsent();
      return record ? record.granted : null;
    }
  };

  /* ---- INITIALIZATION ---- */

  function init() {
    var existing = readConsent();
    if (existing && existing.granted === true) {
      /* Returning visitor who previously accepted */
      consentProcessed = true;
      injectAllTracking();
    } else if (existing && existing.granted === false) {
      /* Returning visitor who previously declined — do nothing */
      consentProcessed = true;
    } else {
      /* No consent record — show banner */
      if (document.body) {
        createBanner();
      } else {
        document.addEventListener('DOMContentLoaded', function onDCL() {
          document.removeEventListener('DOMContentLoaded', onDCL);
          createBanner();
        });
      }
    }
  }

  init();
})();
</script>
<!-- STEP 6: Footer 'Manage Cookies' link -->
<!-- Add this to your site footer template, alongside Privacy Policy link -->
<a href="#" data-mttr-consent="manage-link"
   onclick="if(window.MttrConsent){MttrConsent.revoke();}return false;"
   style="cursor:pointer;">
  Manage Cookies
</a>
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
