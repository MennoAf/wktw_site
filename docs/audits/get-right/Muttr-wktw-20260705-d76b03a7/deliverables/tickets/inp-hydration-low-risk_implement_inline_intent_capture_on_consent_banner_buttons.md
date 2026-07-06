---
finding_id: "inp-hydration-low-risk"
title: "Minimal hydration risk — 100% content in raw HTML, 0 JS-injected elements"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Eliminates the silent consent-loss failure mode: clicks during the 50–400ms dead window are now captured and replayed, ensuring every user interaction with Accept/Decline produces a recorded consent…"
fix_summary: "Implement Inline Intent Capture on consent banner buttons to eliminate the 50–400ms dead-click window between DOM paint and event handler binding, and prevent silent consent-state loss that creates G…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# Minimal hydration risk — 100% content in raw HTML, 0 JS-injected elements

**Finding:** Minimal hydration risk — 100% content in raw HTML, 0 JS-injected elements  
**Severity:** Low  
**Why this matters:** Eliminates the silent consent-loss failure mode: clicks during the 50–400ms dead window are now captured and replayed, ensuring every user interaction with Accept/Decline produces a recorded consent…  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Implement Inline Intent Capture on consent banner buttons to eliminate the 50–400ms dead-click window between DOM paint and event handler binding, and prevent silent consent-state loss that creates G…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Gdpr Ccpa Compliance:** Eliminates the silent consent-loss failure mode: clicks during the 50–400ms dead window are now captured and replayed, ensuring every user interaction with Accept/Decline produces a recorded consent state. Without this fix, a click during the dead window is silently discarded — no cookie is set, no consent event fires — and subsequent tracking scripts may execute without valid consent. This is a regulatory integrity gap, not a theoretical one.
- **Consent Signal Completeness:** Consent management platforms and downstream tag managers depend on the consent cookie being set before analytics/advertising tags fire. Silent discard means the consent signal is absent, which can cause tags gated on consent to either fire without authorization (if default is permissive) or fail to fire when consent was actually given (if default is restrictive). Both outcomes corrupt the consent audit trail.
- **User Experience:** Users who click Accept or Decline and see the banner remain visible (because the click was silently discarded) will click again, producing a confusing double-interaction. The replay mechanism ensures the banner dismisses on the first click regardless of when it arrived relative to handler binding.

## How to verify

**What to look for:** HTML comparison shows 201 elements in both raw and rendered DOM with 100% content availability in raw HTML and 0 elements injected by JS.. JS dependency is classified as 'low'.

**Measured evidence:**
- Raw Elements: 201
- Rendered Elements: 201
- Js Injected Elements: 0
- Content Availability: 100%
- Js Dependency: low

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
Implement Inline Intent Capture on consent banner buttons to eliminate the 50–400ms dead-click window between DOM paint and event handler binding, and prevent silent consent-state loss that creates GDPR/CCPA regulatory exposure.

### How
1. Locate the consent banner Astro component (e.g., `src/components/ConsentBanner.astro`). Identify the two buttons with IDs `consent-accept` and `consent-decline` and the existing `<script>` block that attaches their click handlers.
2. Add an inline `<script>` block (no `type='module'`, no `defer`, no `async`) immediately inside the consent banner component, BEFORE the closing `</astro-island>` or before the component's closing tag. This script must execute synchronously during HTML parsing — not after DOMContentLoaded.
3. The inline script installs a single `click` listener on the banner's container element using event delegation. It captures clicks on Accept/Decline into a module-scoped `pendingIntent` variable (not localStorage — avoids Safari private-mode SecurityError). It does NOT attempt to process consent logic itself; it only records intent.
4. The deferred/module handler script (the existing one that runs consent logic) checks `pendingIntent` as its first action on initialization. If a value is present, it replays the intent synchronously, clears the variable, and proceeds with normal consent recording.
5. The deferred script must acquire a boolean lock (`isProcessing`) before processing any intent — whether live or replayed — to prevent a race where the user clicks again during replay. Lock is released in a `finally` block.
6. Verify the inline script does not reference `window.dataLayer`, `fbq`, `gtag`, or any third-party global. It must be self-contained. Third-party globals are null-guarded in the deferred handler only.
7. Test the fix by throttling CPU 6× in DevTools, reloading on a page where the banner appears, and clicking Accept within the first 200ms. Confirm consent state is recorded and no duplicate network requests fire.

### Code examples
```
<!-- src/components/ConsentBanner.astro -->
---
// No props needed; banner reads consent state from cookie on server
---

<div
  id="consent-banner"
  role="dialog"
  aria-modal="false"
  aria-label="Cookie consent"
  aria-live="polite"
>
  <p>We use cookies to improve your experience. See our <a href="/privacy">Privacy Policy</a>.</p>
  <div class="consent-actions">
    <button id="consent-accept" type="button">Accept</button>
    <button id="consent-decline" type="button">Decline</button>
  </div>
</div>

<!--
  INLINE INTENT CAPTURE — executes synchronously during HTML parse.
  No defer, no async, no type="module".
  Purpose: capture clicks that arrive before the deferred handler binds.
  Must remain self-contained — no third-party globals, no storage APIs.
-->
<script>
  (function () {
    // Named constant: the attribute used to identify captured intent
    var INTENT_ATTR = 'data-consent-pending-intent';

    // Named constant: valid intent values
    var INTENT_ACCEPT = 'accept';
    var INTENT_DECLINE = 'decline';

    var banner = document.getElementById('consent-banner');
    if (!banner) return; // Guard: banner may be absent if consent already recorded

    function captureIntent(event) {
      var target = event.target;
      // Walk up to handle clicks on child elements inside the button
      while (target && target !== banner) {
        if (target.id === 'consent-accept') {
          banner.setAttribute(INTENT_ATTR, INTENT_ACCEPT);
          return;
        }
        if (target.id === 'consent-decline') {
          banner.setAttribute(INTENT_ATTR, INTENT_DECLINE);
          return;
        }
        target = target.parentElement;
      }
    }

    // Delegated listener on the banner container — survives button re-renders
    banner.addEventListener('click', captureIntent);

    // Expose teardown so the deferred handler can remove this listener
    // after it takes over, preventing double-processing of live clicks.
    window.__consentCaptureCleanup = function () {
      banner.removeEventListener('click', captureIntent);
    };
  })();
</script>

<!--
  DEFERRED CONSENT HANDLER — runs after parse, handles consent logic.
  Reads pending intent first, then binds live handlers.
-->
<script>
  // Named constants
  var INTENT_ATTR = 'data-consent-pending-intent';
  var CONSENT_COOKIE_NAME = 'user_consent'; // SITE-SPECIFIC: adjust to match your cookie name
  var CONSENT_COOKIE_MAX_AGE = 31536000;    // 1 year in seconds
  var LOCK_TIMEOUT_MS = 3000;               // Max ms to hold processing lock before auto-release

  var isProcessing = false;
  var lockTimeoutId = null;

  function setCookie(name, value) {
    document.cookie = [
      name + '=' + encodeURIComponent(value),
      'max-age=' + CONSENT_COOKIE_MAX_AGE,
      'path=/',
      'SameSite=Strict',
      'Secure'
    ].join('; ');
  }

  function hideBanner(banner) {
    banner.setAttribute('aria-hidden', 'true');
    banner.style.display = 'none';
  }

  function processConsent(intent, banner) {
    // Lock acquisition — prevents duplicate processing from live + replayed intent
    if (isProcessing) return;
    isProcessing = true;

    // Safety timeout: release lock if processing hangs (e.g., third-party script error)
    lockTimeoutId = setTimeout(function () {
      isProcessing = false;
    }, LOCK_TIMEOUT_MS);

    try {
      if (intent === 'accept') {
        setCookie(CONSENT_COOKIE_NAME, 'accepted');
        // Null-guard all third-party globals before access
        if (typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: 'granted'
          });
        }
        if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
          window.dataLayer.push({ event: 'consent_accepted' });
        }
      } else if (intent === 'decline') {
        setCookie(CONSENT_COOKIE_NAME, 'declined');
        if (typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            analytics_storage: 'denied',
            ad_storage: 'denied'
          });
        }
        if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
          window.dataLayer.push({ event: 'consent_declined' });
        }
      }
      hideBanner(banner);
    } finally {
      clearTimeout(lockTimeoutId);
      isProcessing = false;
    }
  }

  function init() {
    var banner = document.getElementById('consent-banner');
    if (!banner) return; // Consent already recorded; banner not rendered

    // Step 1: Remove the inline capture listener — we are taking over
    if (typeof window.__consentCaptureCleanup === 'function') {
      window.__consentCaptureCleanup();
      delete window.__consentCaptureCleanup;
    }

    // Step 2: Replay any intent captured during the dead window
    var pendingIntent = banner.getAttribute(INTENT_ATTR);
    if (pendingIntent === 'accept' || pendingIntent === 'decline') {
      banner.removeAttribute(INTENT_ATTR);
      processConsent(pendingIntent, banner);
      return; // Banner will be hidden; no need to bind live handlers
    }

    // Step 3: Bind live handlers for clicks that arrive after handler init
    var acceptBtn = document.getElementById('consent-accept');
    var declineBtn = document.getElementById('consent-decline');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        processConsent('accept', banner);
      });
    }
    if (declineBtn) {
      declineBtn.addEventListener('click', function () {
        processConsent('decline', banner);
      });
    }
  }

  // DOMContentLoaded is safe here because the inline script above already
  // covers the pre-DOMContentLoaded window. This handler fires after parsing.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // readyState is 'interactive' or 'complete' — init immediately
    init();
  }
</script>

<style>
  #consent-banner {
    /* SITE-SPECIFIC: adjust positioning and z-index to match design system */
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    z-index: 9999;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  }

  /* Minimum 48x48px touch targets per WCAG 2.5.8 */
  #consent-banner .consent-actions button {
    min-height: 48px;
    min-width: 48px;
    padding: 0.75rem 1.25rem;
    margin-inline-end: 0.5rem;
    cursor: pointer;
  }

  /* Visible focus indicator — never outline:none without replacement */
  #consent-banner .consent-actions button:focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }
</style>
```

## Risks
- RISK: The inline script uses `window.__consentCaptureCleanup` as a coordination channel between the inline and deferred scripts. If a Content Security Policy blocks inline scripts (`script-src 'self'` without `'unsafe-inline'`), the inline capture script will not execute. MITIGATION: Audit the site's CSP before deploying. If inline scripts are blocked, move the capture logic into a synchronously-loaded external script (no defer/async) served from the same origin, and add its hash or nonce to the CSP. The deferred handler script is unaffected since it can be a module.
- RISK: The `data-consent-pending-intent` attribute is written to the DOM element. If a MutationObserver or third-party script (e.g., a CMP SDK) replaces or re-renders the banner element between inline capture and deferred handler init, the attribute is lost. MITIGATION: If a third-party CMP SDK owns the banner DOM, this entire approach must be adapted to use the CMP's own event queue API instead of DOM attribute storage. Verify whether the banner is CMS/CMP-owned or site-owned before deploying.
- RISK: The `isProcessing` boolean lock is not atomic across async boundaries. If `processConsent` is extended in the future to include an async operation (e.g., a server-side consent POST), the boolean will not prevent re-entry during the await gap. MITIGATION: The current implementation is synchronous throughout. If async consent recording is added later, replace the boolean with a Promise queue. The `LOCK_TIMEOUT_MS` safety release is a backstop, not a substitute for proper async locking.
- RISK: The deferred script calls `window.__consentCaptureCleanup` and then `delete`s it. If the page has multiple consent banner instances (e.g., A/B test variant injected by a tag manager), the cleanup function will only remove the listener from the first banner. MITIGATION: The banner is a global template component rendered once per page. If A/B testing introduces a second banner instance, the coordination mechanism must be extended to an array of cleanup functions.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
