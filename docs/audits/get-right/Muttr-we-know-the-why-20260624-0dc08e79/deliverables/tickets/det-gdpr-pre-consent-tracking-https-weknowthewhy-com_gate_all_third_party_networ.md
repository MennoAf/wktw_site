---
finding_id: "det-gdpr-pre-consent-tracking-https-weknowthewhy-com"
title: "Pre-consent tracking [GDPR]"
severity: "high"
root_cause_cluster: "Pre-Consent Tracking and Consent Mechanism Failures"
why_this_matters: "Eliminates the primary GDPR violation mechanism: third-party network requests transmitting IP address and User-Agent to Google's servers before consent."
fix_summary: "Gate all third-party network requests (GTM, GA4, any additional vendors) behind explicit consent."
confidence_tier: "confirmed"
---

# Pre-consent tracking [GDPR]

**Finding:** Pre-consent tracking [GDPR]  
**Severity:** High  
**Why this matters:** Eliminates the primary GDPR violation mechanism: third-party network requests transmitting IP address and User-Agent to Google's servers before consent.  
**Root cause:** Pre-Consent Tracking and Consent Mechanism Failures  
**Fix:** Gate all third-party network requests (GTM, GA4, any additional vendors) behind explicit consent.

> **Evidence Basis:** Confirmed

---

## Impact

- **Gdpr Legal Exposure:** Eliminates the primary GDPR violation mechanism: third-party network requests transmitting IP address and User-Agent to Google's servers before consent. Under GDPR Article 4(1) and the CJEU Planet49 ruling, IP address transmission to a third-party processor without lawful basis is a violation regardless of cookie writes. This fix removes that transmission entirely for non-consenting users by blocking script injection at the source.
- **Accountability Compliance:** The post-decline PerformanceObserver monitor creates a behavioral verification artifact — a first-party log of any post-decline third-party requests. This directly addresses the GDPR Article 5(2) accountability gap identified in the finding: the implementation can now self-verify that enforcement is working and produce evidence of that verification.
- **Analytics Data Integrity:** Consent-gated GTM means GA4 data will reflect only consenting users. This reduces raw session counts but improves data quality: sessions recorded represent users who have affirmatively agreed to tracking, eliminating the current state where all sessions are recorded without a valid lawful basis. Consent Mode v2 modeling can partially recover aggregate trends for non-consenting users without individual-level data.
- **Performance:** Removing 3 sync-blocking scripts from the HTML parse phase eliminates the earliest main-thread blocking in the page lifecycle. GTM (and its dependent tags) loads asynchronously only after consent, which for returning consenting visitors means a non-blocking async load rather than a parser-blocking synchronous execution. For new visitors and declining visitors, 296,631 bytes of vendor payload is never transferred.
- **Banner Visibility:** Rendering the banner in static HTML rather than via JS injection guarantees it is visible on first paint regardless of JS execution state, network conditions, or ad-blocker interference — closing the rendering failure scenario identified in the finding.

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

**What to look for:** 0 non-essential cookie(s) and 3 tracking request(s) fire before any consent interaction.

**Page(s) to check:**
- https://weknowthewhy.com/

**Measured evidence:**
- Source: deterministic_detector
- Regulation Ref: GDPR Art. 6(1)
- Detail: 0 non-essential cookie(s) and 3 tracking request(s) fire before any consent interaction.

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
Gate all third-party network requests (GTM, GA4, any additional vendors) behind explicit consent. No vendor script may load, no network request may fire, and no GTM container may initialize until the user has made an affirmative consent decision in the current session. Google Consent Mode v2 storage-denial defaults are retained as a secondary safeguard but are not the primary enforcement mechanism — script loading itself must be blocked pre-consent.

### How
1. REMOVE GTM from <head>/<body> HTML. Delete both the <script> snippet in <head> and the <noscript> iframe in <body> from the CMS theme/layout template. This is the only change that eliminates the sync-blocking pre-consent execution. Partial mitigations (async attribute, defer) do not prevent the network request.
2. IMPLEMENT a consent state module (consent-gate.js) that: (a) reads a first-party consent cookie on page load, (b) if consent is already granted from a prior session, loads GTM immediately via dynamic script injection, (c) if no prior consent exists, renders the consent banner and waits for user action before loading anything.
3. IMPLEMENT the consent banner in raw HTML/CSS with no JS dependency for rendering. The banner must be visible in the DOM on first paint — not injected by JS — so it renders before any script executes and is visible even if JS fails. Use a <div> with inline style='display:block' that consent-gate.js hides after a decision is recorded.
4. WIRE consent-accept and consent-decline buttons to the consent-gate module. On accept: write the consent cookie, dynamically inject GTM, push consent state to dataLayer. On decline: write the decline cookie, do not inject GTM, push denied consent state to dataLayer (for Consent Mode v2 signal only — no GTM load means no network request).
5. IMPLEMENT session persistence: read the consent cookie on every page load in consent-gate.js before any other script runs. If granted, inject GTM. If denied, do not inject. This covers direct-entry traffic to all pages, not just the homepage.
6. VERIFY geo-conditional rendering: if the banner is suppressed for non-EU visitors, the geo-detection logic must run server-side (via CDN edge function or server middleware) and set a response header or cookie that consent-gate.js reads. Client-side geo-detection is too slow and creates a race condition where scripts fire before the geo check resolves.
7. CONFIGURE GTM container: inside GTM, set all tags to fire only on a custom event (consent_granted) pushed to dataLayer by consent-gate.js. This provides defense-in-depth — even if the script injection gate fails, GTM will not fire tags without the dataLayer signal.
8. AUDIT Plausible: Plausible Analytics is cookieless and does not transmit personal data in the same manner as Google's stack, but its script still fires pre-consent and transmits IP + User-Agent to Plausible's servers. Determine whether Plausible is used as a privacy-preserving alternative to GA4 or alongside it. If it is the sole analytics tool and GA4 is removed, Plausible may qualify for a legitimate interest basis under some DPAs — document this decision. If GA4 is retained, gate Plausible identically to GTM.
9. ADD a post-reject network audit: after a user clicks decline, use a PerformanceObserver (entryType: 'resource') to assert that no requests to doubleclick.net, google-analytics.com, or googletagmanager.com appear in the resource timing buffer. Log violations to your own first-party endpoint. This is the behavioral verification layer required by GDPR Article 5(2) accountability.
10. DOCUMENT the lawful basis decision in a Data Processing Record: for each vendor (Google/GTM, GA4, Plausible), record the lawful basis, the consent mechanism, and the technical enforcement method. This record is required under GDPR Article 30 and is the accountability artifact that demonstrates compliance.

### Code examples
```
// consent-gate.js — place this as the FIRST script in <head>, inline or as a blocking script.
// It must execute before any other script. All other scripts are loaded dynamically by this module.
// SITE-SPECIFIC ASSUMPTIONS — adjust these constants before deployment:
const CONSENT_COOKIE_NAME = 'site_consent_v1'; // bump version if consent purposes change
const CONSENT_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60; // 1 year — adjust per legal guidance
const GTM_CONTAINER_ID = 'GTM-XXXXXXX'; // REQUIRED: replace with actual GTM container ID
const GTM_SCRIPT_URL = 'https://www.googletagmanager.com/gtm.js'; // standard GTM endpoint
const CONSENT_BANNER_ID = 'consent-banner';
const CONSENT_ACCEPT_ID = 'consent-accept';
const CONSENT_DECLINE_ID = 'consent-decline';
const VIOLATION_REPORT_ENDPOINT = '/api/consent-violation'; // SITE-SPECIFIC: first-party endpoint
const VIOLATION_OBSERVER_DURATION_MS = 5000; // how long to watch for post-decline requests
const BLOCKED_DOMAINS = ['doubleclick.net', 'google-analytics.com', 'googletagmanager.com'];

(function consentGate() {
  'use strict';

  // --- Cookie utilities (no external dependency) ---
  function readCookie(name) {
    try {
      const match = document.cookie.match(
        new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
      );
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null; // Safari private browsing or cookie parse error — treat as no consent
    }
  }

  function writeCookie(name, value, maxAgeSeconds) {
    try {
      document.cookie = [
        name + '=' + encodeURIComponent(value),
        'max-age=' + maxAgeSeconds,
        'path=/',
        'SameSite=Lax',
        location.protocol === 'https:' ? 'Secure' : ''
      ].filter(Boolean).join('; ');
    } catch (e) {
      // Storage write failed — non-fatal, banner will re-appear next session
    }
  }

  // --- GTM injection (only called after consent is confirmed) ---
  function loadGTM() {
    // Push Consent Mode v2 granted state before GTM loads
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'consent_granted',
      'gtm.consent': {
        ad_storage: 'granted',
        analytics_storage: 'granted',
        functionality_storage: 'granted',
        personalization_storage: 'granted',
        security_storage: 'granted'
      }
    });

    // Inject GTM script dynamically — this is the ONLY point where the network request fires
    var s = document.createElement('script');
    s.src = GTM_SCRIPT_URL + '?id=' + GTM_CONTAINER_ID + '&l=dataLayer';
    s.async = true; // non-blocking — GTM loads after parser finishes
    document.head.appendChild(s);
  }

  // --- Consent Mode v2 denied defaults (signal only — no GTM load) ---
  function pushDeniedConsentMode() {
    window.dataLayer = window.dataLayer || [];
    // gtag function required for Consent Mode v2 default call
    function gtag() { window.dataLayer.push(arguments); }
    gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted', // security_storage may be legitimate interest — review with DPO
      wait_for_update: 0 // no update coming — user declined
    });
  }

  // --- Post-decline violation monitor (Article 5(2) accountability) ---
  function startViolationMonitor() {
    if (!('PerformanceObserver' in window)) return;
    var observer;
    var timeoutId;

    try {
      observer = new PerformanceObserver(function(list) {
        list.getEntries().forEach(function(entry) {
          var url = entry.name || '';
          var isViolation = BLOCKED_DOMAINS.some(function(domain) {
            return url.indexOf(domain) !== -1;
          });
          if (isViolation) {
            // Report to first-party endpoint — do not use fetch (may not be available)
            // Use sendBeacon for reliability across page unload
            try {
              var payload = JSON.stringify({
                violation_url: url,
                page: location.href,
                ts: Date.now()
              });
              if (navigator.sendBeacon) {
                navigator.sendBeacon(VIOLATION_REPORT_ENDPOINT, payload);
              }
            } catch (e) { /* non-fatal */ }
          }
        });
      });
      observer.observe({ type: 'resource', buffered: false });

      // Disconnect after observation window — prevent unbounded execution
      timeoutId = setTimeout(function() {
        try { observer.disconnect(); } catch (e) { /* already disconnected */ }
      }, VIOLATION_OBSERVER_DURATION_MS);
    } catch (e) {
      // PerformanceObserver not supported or blocked — non-fatal
      if (observer) {
        try { observer.disconnect(); } catch (e2) { /* ignore */ }
      }
      clearTimeout(timeoutId);
    }
  }

  // --- Banner interaction handlers ---
  // isProcessing prevents double-fire if user clicks rapidly
  var isProcessing = false;

  function onAccept() {
    if (isProcessing) return;
    isProcessing = true;
    try {
      writeCookie(CONSENT_COOKIE_NAME, 'granted', CONSENT_COOKIE_MAX_AGE_SECONDS);
      hideBanner();
      loadGTM();
    } finally {
      isProcessing = false;
    }
  }

  function onDecline() {
    if (isProcessing) return;
    isProcessing = true;
    try {
      writeCookie(CONSENT_COOKIE_NAME, 'denied', CONSENT_COOKIE_MAX_AGE_SECONDS);
      hideBanner();
      pushDeniedConsentMode();
      startViolationMonitor();
    } finally {
      isProcessing = false;
    }
  }

  function hideBanner() {
    var banner = document.getElementById(CONSENT_BANNER_ID);
    if (banner) banner.style.display = 'none';
  }

  function showBanner() {
    var banner = document.getElementById(CONSENT_BANNER_ID);
    if (banner) banner.style.display = 'block';
  }

  function wireBannerButtons() {
    var acceptBtn = document.getElementById(CONSENT_ACCEPT_ID);
    var declineBtn = document.getElementById(CONSENT_DECLINE_ID);
    if (acceptBtn) acceptBtn.addEventListener('click', onAccept);
    if (declineBtn) declineBtn.addEventListener('click', onDecline);
  }

  // --- Main gate logic ---
  var existingConsent = readCookie(CONSENT_COOKIE_NAME);

  if (existingConsent === 'granted') {
    // Returning visitor who previously consented — load GTM immediately
    loadGTM();
  } else if (existingConsent === 'denied') {
    // Returning visitor who previously declined — push denied defaults, do not load GTM
    pushDeniedConsentMode();
  } else {
    // No prior decision — show banner, block all tracking until decision is made
    // Banner is already visible in HTML (display:block inline style).
    // Wire buttons once DOM is ready.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', wireBannerButtons, { once: true });
    } else {
      wireBannerButtons();
    }
  }
})();
<!-- consent-banner.html — embed directly in CMS theme/layout template BEFORE any <script> tags.
     The banner is visible by default (display:block inline). consent-gate.js hides it after a decision.
     SITE-SPECIFIC: update copy, colors, and privacy policy URL to match brand. -->
<div
  id="consent-banner"
  role="dialog"
  aria-modal="true"
  aria-labelledby="consent-banner-title"
  aria-describedby="consent-banner-desc"
  style="display:block;position:fixed;bottom:0;left:0;right:0;z-index:99999;
         background:#fff;border-top:2px solid #e0e0e0;padding:16px 24px;
         box-shadow:0 -2px 12px rgba(0,0,0,0.12);font-family:inherit;"
>
  <p id="consent-banner-title" style="margin:0 0 8px;font-weight:600;font-size:1rem;">
    We use cookies and tracking
  </p>
  <p id="consent-banner-desc" style="margin:0 0 12px;font-size:0.875rem;color:#444;">
    We use Google Analytics and advertising tools to understand how visitors use this site.
    These tools send data to Google's servers, including your IP address, before you interact.
    You can accept or decline. See our
    <a href="/legal/privacy/" style="color:inherit;text-decoration:underline;">Privacy Policy</a>.
  </p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;">
    <button
      id="consent-accept"
      type="button"
      style="padding:10px 20px;background:#1a1a1a;color:#fff;border:none;
             border-radius:4px;font-size:0.875rem;cursor:pointer;min-width:48px;min-height:48px;"
    >Accept</button>
    <button
      id="consent-decline"
      type="button"
      style="padding:10px 20px;background:#fff;color:#1a1a1a;border:1px solid #1a1a1a;
             border-radius:4px;font-size:0.875rem;cursor:pointer;min-width:48px;min-height:48px;"
    >Decline</button>
  </div>
</div>
// gtm-tag-config.js — GTM container configuration instructions (not executable code).
// In GTM UI: set ALL tags (GA4, Ads, remarketing) to fire on Custom Event trigger.
// Trigger configuration:
//   Trigger Type: Custom Event
//   Event Name: consent_granted  (exact match, case-sensitive)
//   This fires: All Custom Events
// This ensures that even if consent-gate.js script injection fails,
// GTM will not fire any data-collecting tags without the explicit dataLayer signal.
//
// dataLayer push that consent-gate.js sends on accept (already in consent-gate.js above):
window.dataLayer.push({
  event: 'consent_granted',
  'gtm.consent': {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
    security_storage: 'granted'
  }
});
// GTM tags gated on 'consent_granted' event will fire only after this push.
// Tags must NOT use 'All Pages' or 'DOM Ready' triggers — remove those triggers from all data-collecting tags.
```

## Risks
- RISK: GA4 historical data discontinuity. Consent-gating will reduce recorded session volume to consenting users only. Any dashboards or reports using absolute session counts will show a drop. MITIGATION: Enable Consent Mode v2 behavioral modeling in GA4 (Google Signals + modeling) before deploying. Document the deployment date as a data annotation in GA4. Align with analytics stakeholders before launch.
- RISK: GTM tag trigger regression. Tags currently using 'All Pages' or 'DOM Ready' triggers will stop firing after this change. MITIGATION: Audit every GTM tag before deployment. Replace all data-collecting tag triggers with the 'consent_granted' custom event trigger. Non-data-collecting tags (e.g., structured data pushes, scroll depth listeners with no network calls) may retain DOM Ready triggers after confirming they make no third-party requests.
- RISK: Geo-conditional banner suppression creates a compliance gap for EU visitors if the geo-detection logic is client-side. MITIGATION: If geo-conditional rendering is used, implement detection at the CDN edge (Cloudflare Workers, Vercel Edge Middleware, or equivalent) using the visitor's IP-derived country header. Set a server-side cookie or response header that consent-gate.js reads synchronously. Never rely on a client-side fetch for geo-detection — the async gap allows scripts to fire before the check resolves.
- RISK: Cookie write failure in Safari private browsing. The try-catch in writeCookie handles the SecurityError, but the consequence is that the consent decision is not persisted — the banner will reappear on every page load for Safari private browsing users. MITIGATION: This is acceptable behavior (no consent = no tracking). Document it. Do not attempt sessionStorage fallback for consent state — a failed cookie write in private browsing is the correct outcome.
- RISK: Plausible Analytics scope decision. If Plausible is retained alongside GA4 and gated identically, consent rates will determine whether any analytics data is collected for non-consenting users. If Plausible is used as the privacy-preserving replacement for GA4 (cookieless, no personal data per Plausible's architecture), a legitimate interest basis may be documentable — but this requires a formal DPIA and DPO sign-off, not a unilateral technical decision. MITIGATION: Do not make the legitimate interest determination in code. Gate Plausible identically to GTM until legal review is complete.
- RISK: isProcessing flag is not atomic across async boundaries. The flag prevents double-fire on rapid clicks within a single synchronous call stack, but does not protect against concurrent async operations. MITIGATION: The consent decision handlers (onAccept, onDecline) are synchronous — they write a cookie and inject a script element, neither of which is async. The isProcessing flag is sufficient for this use case. If the implementation is later extended with async operations (e.g., server-side consent logging), replace the boolean flag with a Promise queue.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
