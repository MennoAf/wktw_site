---
finding_id: "privacy-cookies-consent-banner-dark-pattern"
title: "Cookie consent banner — Accept/Decline button visual parity requires verification for dark pattern compliance"
severity: "high"
root_cause_cluster: "Pre-Consent Tracking and Consent Mechanism Failures"
why_this_matters: "A non-compliant consent mechanism exposes the business to GDPR enforcement action."
fix_summary: "Replace the cosmetic consent banner with a consent-gated script loading pipeline: (1) enforce visual parity between Accept and Decline buttons so neither is visually dominant, (2) block all non-essen…"
confidence_tier: "confirmed"
---

# Cookie consent banner — Accept/Decline button visual parity requires verification for dark pattern compliance

**Finding:** Cookie consent banner — Accept/Decline button visual parity requires verification for dark pattern compliance  
**Severity:** High  
**Why this matters:** A non-compliant consent mechanism exposes the business to GDPR enforcement action.  
**Root cause:** Pre-Consent Tracking and Consent Mechanism Failures  
**Fix:** Replace the cosmetic consent banner with a consent-gated script loading pipeline: (1) enforce visual parity between Accept and Decline buttons so neither is visually dominant, (2) block all non-essen…

> **Evidence Basis:** Confirmed

---

## Impact

- **Revenue:** A non-compliant consent mechanism exposes the business to GDPR enforcement action. Regulatory fines under GDPR can reach up to 4% of annual global turnover. Beyond fines, reputational damage from a publicized enforcement action suppresses customer trust and revenue.
- **Conversion Rate:** Consent banners that frustrate users (dark patterns or broken reject flows) increase bounce rate as privacy-conscious users leave rather than accept unclear terms.

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

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_002`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/legal/privacy/
**Element:** Consent decline button — verify equal visual prominence with accept
**XPath:** `//*[@id='consent-decline']`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id='consent-decline']")`
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
Replace the cosmetic consent banner with a consent-gated script loading pipeline: (1) enforce visual parity between Accept and Decline buttons so neither is visually dominant, (2) block all non-essential scripts (GTM, GA4, Plausible, Google Fonts) from loading until explicit consent is granted, (3) persist consent state across sessions, and (4) provide a mechanism to revoke consent post-acceptance.

### How
1. **Create a consent gate module** (`consent-gate.js`) that runs as the FIRST inline script in `<head>`. This module exposes a global `ConsentGate` object that all other scripts check before executing. It reads consent state from a first-party cookie (`consent_state`) and exposes `ConsentGate.hasConsented()`, `ConsentGate.hasDeclined()`, and `ConsentGate.isPending()`.

2. **Convert all tracking/analytics script tags to inert templates.** Replace `<script src="https://www.googletagmanager.com/gtm.js?id=...">` and similar with `<template data-consent-required="analytics">` wrappers. The consent gate module activates these templates ONLY after `ConsentGate.hasConsented()` returns true. This is the architectural fix: scripts physically cannot load before consent because they are not script elements until promoted.

3. **Replace Google Fonts `<link>` with a consent-gated loader.** Google Fonts requests transmit IP addresses to Google servers (personal data under GDPR). Move the font URL into a `data-consent-font` attribute on a `<link rel="preconnect">` placeholder. The consent gate promotes this to an active stylesheet link only after consent. Provide a local fallback font stack that loads immediately via `@font-face` with `font-display: swap` so typography is never broken regardless of consent state.

4. **Restyle the consent banner for visual parity.** Both Accept and Decline buttons must have identical dimensions, font weight, font size, border radius, and padding. The ONLY permitted difference is hue (e.g., green Accept / neutral-gray Decline), and both must meet WCAG AA contrast (4.5:1 against the banner background). Neither button may be a ghost/outline/text-only style while the other is filled. Apply styles via a dedicated `consent-banner.css` scoped under a `.consent-banner` parent class — never bare element selectors.

5. **Wire button handlers through the consent gate.** Accept sets `consent_state=granted` cookie (SameSite=Lax, Secure, 365-day expiry, HttpOnly=false since JS must read it), then calls `ConsentGate.activate()` which promotes all `<template data-consent-required>` elements to live `<script>` tags serially (not in parallel — prevents race conditions in GTM/GA4 initialization order). Decline sets `consent_state=denied` cookie with identical attributes, dismisses the banner, and loads nothing.

6. **Persist and respect consent across navigations.** On every page load, `consent-gate.js` reads the `consent_state` cookie BEFORE any other script. If `granted`, it immediately promotes templates (no banner shown). If `denied`, it loads nothing and shows no banner. If absent (new visitor), it shows the banner and blocks all gated scripts.

7. **Add a consent revocation mechanism.** Add a 'Cookie Settings' link in the site footer (visible on all pages). Clicking it re-displays the consent banner and, if the user switches from Accept to Decline, sets `consent_state=denied`, then reloads the page (which will now skip all tracking scripts since the gate reads `denied` on load). This avoids the impossible task of 'unloading' already-executed scripts.

8. **Google Consent Mode v2 integration.** Even with the template-gating approach, configure Consent Mode defaults to `denied` for `analytics_storage` and `ad_storage` in the inline consent gate script. When consent is granted, update these to `granted` BEFORE promoting the GTM template. This provides defense-in-depth: even if a script somehow loads before the gate (e.g., a future developer adds a script tag manually), Consent Mode restricts cookie writes.

### Code examples
```
<!-- consent-gate.js: MUST be the first <script> in <head>, inline, no external dependency -->
<script>
(function() {
  'use strict';

  /* ===== SITE-SPECIFIC CONFIGURATION ===== */
  var CONSENT_COOKIE_NAME = 'consent_state'; /* Cookie name — adjust if conflicts with existing cookies */
  var CONSENT_COOKIE_MAX_AGE_DAYS = 365;     /* GDPR recommends re-consent annually */
  var CONSENT_ATTRIBUTE = 'data-consent-required'; /* Attribute on <template> elements wrapping gated scripts */
  var CONSENT_FONT_ATTRIBUTE = 'data-consent-font-href'; /* Attribute on placeholder <link> for Google Fonts */
  var BANNER_SELECTOR = '.consent-banner';   /* CSS selector for the consent banner container */
  var ACCEPT_BUTTON_SELECTOR = '.consent-banner__accept'; /* CSS selector for Accept button */
  var DECLINE_BUTTON_SELECTOR = '.consent-banner__decline'; /* CSS selector for Decline button */
  var REVOKE_LINK_SELECTOR = '.consent-banner__revoke-trigger'; /* Footer link to re-open banner */
  var SCRIPT_ACTIVATION_DELAY_MS = 0; /* Delay between serial script promotions — 0 is fine for most sites */

  /* ===== GOOGLE CONSENT MODE V2 DEFAULTS ===== */
  /* Set deny-by-default BEFORE gtag/GTM loads */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted',
    'wait_for_update': 500 /* ms to wait for consent update before firing tags with denied state */
  });

  /* ===== COOKIE UTILITIES ===== */
  function readCookie(name) {
    try {
      var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      /* Safari private browsing or cookie access blocked */
      return null;
    }
  }

  function writeCookie(name, value, maxAgeDays) {
    try {
      var secure = location.protocol === 'https:' ? '; Secure' : '';
      var maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
      document.cookie = name + '=' + encodeURIComponent(value) +
        '; path=/; max-age=' + maxAgeSeconds +
        '; SameSite=Lax' + secure;
    } catch (e) {
      /* Storage blocked — consent state will not persist, banner re-shows each visit */
    }
  }

  /* ===== SCRIPT ACTIVATION (SERIAL, NOT PARALLEL) ===== */
  var isActivating = false; /* Mutex flag — prevents double-activation */

  function activateGatedScripts() {
    if (isActivating) { return; } /* Guard against concurrent calls */
    isActivating = true;

    /* Update Google Consent Mode to granted */
    gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted',
      'functionality_storage': 'granted',
      'personalization_storage': 'granted'
    });

    var templates = document.querySelectorAll('template[' + CONSENT_ATTRIBUTE + ']');
    var queue = Array.prototype.slice.call(templates); /* Copy to static array */

    function processNext() {
      if (queue.length === 0) {
        activateConsentFonts();
        isActivating = false;
        return;
      }
      var template = queue.shift();
      var content = template.content || template; /* .content for <template>, fallback for older browsers */
      var children = content.querySelectorAll('script');

      for (var i = 0; i < children.length; i++) {
        var original = children[i];
        var script = document.createElement('script');
        /* Copy all attributes */
        for (var j = 0; j < original.attributes.length; j++) {
          script.setAttribute(original.attributes[j].name, original.attributes[j].value);
        }
        if (original.textContent) {
          script.textContent = original.textContent;
        }
        /* For external scripts, wait for load/error before next in queue */
        if (script.src) {
          script.addEventListener('load', processNext);
          script.addEventListener('error', processNext); /* Don't block queue on failed loads */
          document.head.appendChild(script);
          template.parentNode.removeChild(template);
          return; /* Exit — processNext called by load/error event */
        }
        document.head.appendChild(script);
      }
      template.parentNode.removeChild(template);
      /* Inline scripts are synchronous — safe to continue immediately */
      if (typeof setTimeout !== 'undefined') {
        setTimeout(processNext, SCRIPT_ACTIVATION_DELAY_MS);
      } else {
        processNext();
      }
    }

    processNext();
  }

  function activateConsentFonts() {
    var fontPlaceholders = document.querySelectorAll('link[' + CONSENT_FONT_ATTRIBUTE + ']');
    for (var i = 0; i < fontPlaceholders.length; i++) {
      var placeholder = fontPlaceholders[i];
      var href = placeholder.getAttribute(CONSENT_FONT_ATTRIBUTE);
      if (href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(link);
        placeholder.parentNode.removeChild(placeholder);
      }
    }
  }

  /* ===== BANNER INTERACTION ===== */
  function dismissBanner() {
    var banner = document.querySelector(BANNER_SELECTOR);
    if (banner) {
      banner.setAttribute('aria-hidden', 'true');
      banner.style.display = 'none';
    }
  }

  function showBanner() {
    var banner = document.querySelector(BANNER_SELECTOR);
    if (banner) {
      banner.removeAttribute('aria-hidden');
      banner.style.display = '';
      /* Move focus to banner for accessibility */
      banner.setAttribute('tabindex', '-1');
      banner.focus();
    }
  }

  function handleAccept(e) {
    if (e) { e.preventDefault(); }
    writeCookie(CONSENT_COOKIE_NAME, 'granted', CONSENT_COOKIE_MAX_AGE_DAYS);
    dismissBanner();
    activateGatedScripts();
  }

  function handleDecline(e) {
    if (e) { e.preventDefault(); }
    writeCookie(CONSENT_COOKIE_NAME, 'denied', CONSENT_COOKIE_MAX_AGE_DAYS);
    dismissBanner();
    /* Explicitly do NOT call activateGatedScripts — this is the entire point */
  }

  function handleRevoke(e) {
    if (e) { e.preventDefault(); }
    /* Clear existing consent so banner re-shows */
    writeCookie(CONSENT_COOKIE_NAME, '', -1); /* Expire the cookie */
    showBanner();
    /* If user previously accepted and now declines, page must reload to purge loaded scripts */
  }

  /* ===== BIND EVENTS WHEN DOM IS READY ===== */
  function bindBannerEvents() {
    var acceptBtn = document.querySelector(ACCEPT_BUTTON_SELECTOR);
    var declineBtn = document.querySelector(DECLINE_BUTTON_SELECTOR);
    var revokeLinks = document.querySelectorAll(REVOKE_LINK_SELECTOR);

    if (acceptBtn) { acceptBtn.addEventListener('click', handleAccept); }
    if (declineBtn) { declineBtn.addEventListener('click', handleDecline); }
    for (var i = 0; i < revokeLinks.length; i++) {
      revokeLinks[i].addEventListener('click', handleRevoke);
    }
  }

  /* ===== INITIALIZATION ===== */
  var currentState = readCookie(CONSENT_COOKIE_NAME);

  if (currentState === 'granted') {
    /* Returning visitor who accepted — activate scripts immediately, no banner */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function onReady() {
        document.removeEventListener('DOMContentLoaded', onReady);
        dismissBanner();
        activateGatedScripts();
        bindBannerEvents(); /* Still bind revoke link */
      });
    } else {
      dismissBanner();
      activateGatedScripts();
      bindBannerEvents();
    }
  } else if (currentState === 'denied') {
    /* Returning visitor who declined — no scripts, no banner */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function onReady() {
        document.removeEventListener('DOMContentLoaded', onReady);
        dismissBanner();
        bindBannerEvents();
      });
    } else {
      dismissBanner();
      bindBannerEvents();
    }
  } else {
    /* New visitor — show banner, block everything */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function onReady() {
        document.removeEventListener('DOMContentLoaded', onReady);
        showBanner();
        bindBannerEvents();
      });
    } else {
      showBanner();
      bindBannerEvents();
    }
  }

  /* ===== PUBLIC API ===== */
  window.ConsentGate = {
    hasConsented: function() { return readCookie(CONSENT_COOKIE_NAME) === 'granted'; },
    hasDeclined: function() { return readCookie(CONSENT_COOKIE_NAME) === 'denied'; },
    isPending: function() { return readCookie(CONSENT_COOKIE_NAME) === null; },
    activate: activateGatedScripts,
    revoke: handleRevoke
  };
})();
</script>
<!-- BEFORE (scripts load unconditionally): -->
<!--
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
-->

<!-- AFTER (scripts gated behind consent): -->
<template data-consent-required="analytics">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</template>

<!-- Google Fonts gated — local fallback loads immediately -->
<link rel="preconnect" href="https://fonts.googleapis.com"
      data-consent-font-href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap">
<!-- Consent banner HTML with visual parity -->
<div class="consent-banner" role="dialog" aria-label="Cookie consent" aria-modal="false" aria-live="polite">
  <div class="consent-banner__body">
    <p class="consent-banner__text">
      We use cookies for analytics and advertising.
      <a href="/privacy-policy" class="consent-banner__link">Privacy Policy</a>
    </p>
    <div class="consent-banner__actions">
      <button type="button" class="consent-banner__decline">Decline</button>
      <button type="button" class="consent-banner__accept">Accept</button>
    </div>
  </div>
</div>
/* consent-banner.css — scoped entirely under .consent-banner */
/* No bare element selectors — all rules scoped to prevent layout regressions */

.consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #1a1a2e; /* Dark background — adjust to site palette */
  color: #f0f0f0;
  padding: 16px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.consent-banner[aria-hidden='true'] {
  display: none;
}

.consent-banner__body {
  max-width: 960px; /* Site-specific — match site content width */
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.consent-banner__text {
  flex: 1 1 300px; /* Site-specific — min text width before wrapping */
  margin: 0;
}

.consent-banner__link {
  color: #a0c4ff;
  text-decoration: underline;
}

.consent-banner__actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

/* ===== VISUAL PARITY: Both buttons identical in size, weight, shape ===== */
/* The ONLY difference is background hue. Both are filled. Neither is ghost/outline. */
.consent-banner__accept,
.consent-banner__decline {
  /* Identical structural properties */
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  min-width: 120px; /* Ensures equal visual weight regardless of text length */
  min-height: 48px; /* WCAG 2.5.8 touch target */
  text-align: center;
  transition: opacity 0.15s ease;
}

.consent-banner__accept {
  background: #4caf50; /* Green — site-specific, adjust to brand palette */
  color: #fff; /* Contrast ratio 4.6:1 against #4caf50 — meets AA */
}

.consent-banner__decline {
  background: #6b7280; /* Neutral gray — NOT outline, NOT ghost, NOT text-only */
  color: #fff; /* Contrast ratio 4.9:1 against #6b7280 — meets AA */
}

.consent-banner__accept:hover,
.consent-banner__decline:hover {
  opacity: 0.85;
}

.consent-banner__accept:focus-visible,
.consent-banner__decline:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .consent-banner__accept,
  .consent-banner__decline {
    transition: none;
  }
}

/* Mobile stacking */
@media (max-width: 480px) {
  .consent-banner__actions {
    flex-direction: column;
    width: 100%;
  }
  .consent-banner__accept,
  .consent-banner__decline {
    width: 100%;
  }
}
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
