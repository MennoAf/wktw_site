---
finding_id: "consent-banner-ux-on-privacy-page"
title: "Consent banner competes with page CTAs and creates circular UX — appears on privacy policy page and consumes mobile viewport"
severity: "medium"
root_cause_cluster: "Pre-Consent Tracking and Consent Mechanism Failures"
why_this_matters: "Eliminates the circular UX where the consent banner obscures the privacy policy page."
fix_summary: "Add route-awareness to the consent banner so it auto-suppresses on legal/policy pages, eliminating the circular UX where users must consent before reading the policy that informs their consent."
confidence_tier: "confirmed"
---

# Consent banner competes with page CTAs and creates circular UX — appears on privacy policy page and consumes mobile viewport

**Finding:** Consent banner competes with page CTAs and creates circular UX — appears on privacy policy page and consumes mobile viewport  
**Severity:** Medium  
**Why this matters:** Eliminates the circular UX where the consent banner obscures the privacy policy page.  
**Root cause:** Pre-Consent Tracking and Consent Mechanism Failures  
**Fix:** Add route-awareness to the consent banner so it auto-suppresses on legal/policy pages, eliminating the circular UX where users must consent before reading the policy that informs their consent.

> **Evidence Basis:** Confirmed

---

## Impact

- **Legal Compliance:** Eliminates the circular UX where the consent banner obscures the privacy policy page. Under GDPR Article 7(2) and Recital 42, consent must be informed — the user must be able to access the information that informs their decision before the decision is requested. A banner that overlays or competes with the privacy policy structurally undermines this requirement. Suppressing the overlay on legal pages restores the ability to read the policy before consenting, strengthening the legal defensibility of all consent collected site-wide.
- **Mobile Usability:** On mobile, the consent banner consumes significant viewport area on content-heavy legal pages. Replacing the overlay with a non-blocking inline notice returns that viewport space to the page content, reducing scroll friction and improving readability of legal text — the primary user intent on these pages.
- **Consent Quality:** Users who can actually read the privacy policy before consenting produce higher-quality, more legally defensible consent signals. This does not change consent rates on non-legal pages (zero behavioral change there), but improves the informed-ness of consent for users who navigate to the policy page before deciding.
- **Bounce Rate:** The circular UX (banner blocks policy → user cannot make informed decision → user leaves) creates an unnecessary bounce pathway on legal pages. Removing the overlay eliminates this specific bounce trigger.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** gdpr

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_002`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/legal/privacy/
**Element:** Consent Decline button on the privacy policy page — user asked to decide before reading the policy
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
Add route-awareness to the consent banner so it auto-suppresses on legal/policy pages, eliminating the circular UX where users must consent before reading the policy that informs their consent. On suppressed pages, render a minimal, non-blocking inline notice instead.

### How
1. Define a configurable list of pathname prefixes where the full consent banner should be suppressed. 2. Before the consent banner renders (or immediately after DOM injection if the banner is third-party/async), check window.location.pathname against the suppression list. 3. If the current page matches a suppressed route: (a) hide the full overlay banner via a data attribute on <body>, (b) inject a minimal inline consent notice at the top of the page content area that does not overlay or obscure page content, and (c) ensure no tracking scripts fire on suppressed pages until consent is explicitly granted (maintain the same consent-gating behavior — suppression of the banner UI does not imply consent). 4. If the current page does NOT match a suppressed route, render the banner exactly as it does today — zero behavioral change on non-legal pages. 5. Persist consent state in the same storage mechanism already used (cookie or localStorage), so if a user navigates from the privacy page to a non-legal page, the banner appears normally if they haven't yet consented.

### Code examples
```
/**
 * Consent Banner Route-Awareness Module
 *
 * Integrates with the existing consent banner by suppressing the full
 * overlay on legal/policy pages and replacing it with a non-blocking
 * inline notice. Does NOT grant or imply consent — only changes UI.
 *
 * SITE-SPECIFIC ASSUMPTIONS (configure per environment):
 */

/* --- Configuration --- */

/** Pathname prefixes where the full banner overlay is suppressed. */
const SUPPRESSED_PATH_PREFIXES = [
  '/legal/privacy',
  '/legal/terms',
  '/legal/cookies'
];

/**
 * Selector for the existing consent banner root element.
 * SITE-SPECIFIC: Update to match the actual consent banner container.
 */
const CONSENT_BANNER_SELECTOR = '[data-consent-banner]';

/**
 * Selector for the page content area where the inline notice will be
 * prepended. SITE-SPECIFIC: Update to match the site's main content wrapper.
 */
const CONTENT_AREA_SELECTOR = 'main';

/**
 * Name of the consent storage key (cookie or localStorage).
 * SITE-SPECIFIC: Must match the key the existing consent system uses.
 */
const CONSENT_STORAGE_KEY = 'cookie_consent_status';

/** Debounce delay (ms) for MutationObserver callback to avoid thrashing. */
const OBSERVER_DEBOUNCE_MS = 50;

/** Maximum time (ms) to watch for late-injected consent banners before giving up. */
const OBSERVER_TIMEOUT_MS = 10000;

/* --- Utility --- */

/**
 * Check if consent has already been recorded.
 * Wraps storage access in try-catch for Safari private browsing.
 */
function hasExistingConsent() {
  try {
    const cookieMatch = document.cookie
      .split('; ')
      .find(function(row) { return row.startsWith(CONSENT_STORAGE_KEY + '='); });
    if (cookieMatch) return true;

    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
    }
  } catch (e) {
    /* Safari private browsing throws SecurityError on storage access */
  }
  return false;
}

/**
 * Determine if the current page is a suppressed legal page.
 */
function isLegalPage() {
  var pathname = window.location.pathname.replace(/\/+$/, ''); /* normalize trailing slash */
  for (var i = 0; i < SUPPRESSED_PATH_PREFIXES.length; i++) {
    var prefix = SUPPRESSED_PATH_PREFIXES[i].replace(/\/+$/, '');
    if (pathname === prefix || pathname.indexOf(prefix + '/') === 0) {
      return true;
    }
  }
  return false;
}

/* --- Inline Notice (non-blocking replacement) --- */

/**
 * Creates a minimal inline notice element.
 * This does NOT grant consent — it informs the user that consent
 * is pending and links to the mechanism to provide it.
 */
function createInlineNotice() {
  var notice = document.createElement('div');
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.setAttribute('data-consent-inline-notice', '');
  notice.style.cssText = [
    'background: #f8f9fa',
    'border-bottom: 1px solid #dee2e6',
    'padding: 12px 16px',
    'font-size: 14px',
    'line-height: 1.5',
    'color: #212529',
    'text-align: center'
  ].join(';');

  notice.innerHTML =
    'We use cookies as described on this page. ' +
    'You can <button type="button" data-consent-inline-accept ' +
    'style="background:none;border:none;color:#0056b3;' +
    'text-decoration:underline;cursor:pointer;font:inherit;' +
    'padding:0;min-height:48px;min-width:48px">' +
    'accept all cookies</button> or continue reading to learn more.';

  var acceptBtn = notice.querySelector('[data-consent-inline-accept]');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function handleInlineAccept() {
      acceptBtn.removeEventListener('click', handleInlineAccept);
      /*
       * Dispatch the same consent-grant action the main banner uses.
       * SITE-SPECIFIC: Replace this with the actual consent-grant call.
       * Example: window.CookieConsent.acceptAll() or similar.
       */
      if (typeof window.consentBannerAcceptAll === 'function') {
        window.consentBannerAcceptAll();
      }
      var parent = notice.parentNode;
      if (parent) {
        parent.removeChild(notice);
      }
    });
  }

  return notice;
}

/* --- Core Logic --- */

function suppressBannerOnLegalPage() {
  /* Precondition: only run on legal pages where consent is not yet recorded */
  if (!isLegalPage()) return;
  if (hasExistingConsent()) return;

  /* Set body attribute so CSS can also target suppression if needed */
  document.body.setAttribute('data-consent-suppressed', 'true');

  /**
   * Hide the banner if it already exists in the DOM.
   * Returns true if found and hidden, false otherwise.
   */
  function hideBannerIfPresent() {
    var banner = document.querySelector(CONSENT_BANNER_SELECTOR);
    if (banner) {
      banner.style.display = 'none';
      banner.setAttribute('aria-hidden', 'true');
      return true;
    }
    return false;
  }

  /* Inject inline notice into content area */
  function injectInlineNotice() {
    /* Guard: don't double-inject */
    if (document.querySelector('[data-consent-inline-notice]')) return;

    var contentArea = document.querySelector(CONTENT_AREA_SELECTOR);
    if (contentArea && contentArea.firstChild) {
      contentArea.insertBefore(createInlineNotice(), contentArea.firstChild);
    } else if (contentArea) {
      contentArea.appendChild(createInlineNotice());
    }
  }

  /* Attempt immediate suppression */
  var found = hideBannerIfPresent();
  injectInlineNotice();

  if (found) return; /* Banner was synchronous, done */

  /*
   * Banner may be injected asynchronously (e.g., by a tag manager or
   * deferred script). Use MutationObserver to catch late injection.
   */
  if (!('MutationObserver' in window)) return; /* Graceful degradation */

  var debounceTimer = null;
  var observer = new MutationObserver(function onMutation() {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(function() {
      debounceTimer = null;
      if (hideBannerIfPresent()) {
        observer.disconnect();
        clearTimeout(timeoutId);
      }
    }, OBSERVER_DEBOUNCE_MS);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  /* Safety timeout: stop observing after OBSERVER_TIMEOUT_MS */
  var timeoutId = setTimeout(function() {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }
    observer.disconnect();
  }, OBSERVER_TIMEOUT_MS);
}

/* --- Initialization --- */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function onReady() {
    document.removeEventListener('DOMContentLoaded', onReady);
    suppressBannerOnLegalPage();
  });
} else {
  suppressBannerOnLegalPage();
}

/* CSS fallback: ensures banner stays hidden even if JS timing is off */
/* Add to global stylesheet */
body[data-consent-suppressed="true"] [data-consent-banner] {
  display: none !important;
  visibility: hidden !important;
}

```

## Risks
- RISK: The inline accept button must call the same consent-grant function as the main banner. If the existing consent system's accept function is not exposed globally (e.g., it's scoped inside a closure or module), the inline button will silently fail. MITIGATION: The code uses a named global (window.consentBannerAcceptAll) as the integration point. During implementation, verify the actual consent system's API and update this reference. If the consent system has no public API, expose one or dispatch a custom event that the consent system listens for.
- RISK: If the consent banner selector (CONSENT_BANNER_SELECTOR) changes due to a CMS update or consent tool update, the suppression logic will miss the banner and it will render on legal pages. MITIGATION: The selector uses a data attribute ([data-consent-banner]) rather than a class or ID, which is more resilient to styling changes. Add the data attribute to the banner if it doesn't already have one. The CSS fallback (body[data-consent-suppressed] selector) provides a second layer of defense.
- RISK: Suppressing the banner on legal pages means a user who lands directly on /legal/privacy/ and reads the policy will not see the full banner until they navigate to another page. If the consent storage check fails (e.g., Safari private browsing), the banner will correctly reappear on the next non-legal page. No consent is implied or granted by suppression — tracking scripts must remain gated. MITIGATION: The inline notice provides an explicit accept action on the legal page itself, and the consent-gating logic is untouched.
- RISK: MutationObserver on document.body with subtree:true can fire frequently on dynamic pages. MITIGATION: The observer callback is debounced (50ms), has a hard timeout (10s), and disconnects immediately upon finding and hiding the banner. On browsers without MutationObserver (effectively none in current support, but guarded), the function degrades gracefully — the CSS fallback still applies.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
