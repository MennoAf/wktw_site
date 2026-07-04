---
finding_id: "escalation-5-ga4-err-aborted-root-cause"
title: "GA4 ERR_ABORTED likely caused by Playwright/headless browser blocking — but production ad-blocker risk is real"
severity: "medium"
root_cause_cluster: "Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture"
why_this_matters: "Eliminating the dual-beacon race condition stops double-counting of sessions and pageviews."
fix_summary: "Eliminate the dual-beacon race condition by removing the standalone gtag.js snippet, retaining GTM as the sole GA4 delivery mechanism, adding server-side GTM or first-party proxy routing to survive a…"
confidence_tier: "confirmed"
---

# GA4 ERR_ABORTED likely caused by Playwright/headless browser blocking — but production ad-blocker risk is real

**Finding:** GA4 ERR_ABORTED likely caused by Playwright/headless browser blocking — but production ad-blocker risk is real  
**Severity:** Medium  
**Why this matters:** Eliminating the dual-beacon race condition stops double-counting of sessions and pageviews.  
**Root cause:** Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture  
**Fix:** Eliminate the dual-beacon race condition by removing the standalone gtag.js snippet, retaining GTM as the sole GA4 delivery mechanism, adding server-side GTM or first-party proxy routing to survive a…

> **Evidence Basis:** Confirmed

---

## Impact

- **Data Integrity:** Eliminating the dual-beacon race condition stops double-counting of sessions and pageviews. GA4's engagement logic (which classifies a session as 'engaged' if it contains 2+ pageviews) currently misclassifies single-page bounces as engaged sessions when both beacons fire. Removing the duplicate restores accurate bounce rate, session count, and engagement rate — making GA4 data usable as a decision-making input for the first time since the dual stack was deployed.
- **Conversion Intelligence:** Zero conversion events are currently tracked. Adding generate_lead, cta_click, and scroll_depth events transforms the analytics stack from a session counter into a conversion funnel. This enables attribution of which traffic sources, landing pages, and content depths drive lead form submissions — the primary conversion action on the site.
- **Ad Blocker Resilience:** The first-party proxy routes GA4 beacons through the site's own domain, bypassing content blockers that target google-analytics.com. For a technically sophisticated B2B audience where ad-blocker penetration is likely elevated, this closes the measurement gap between the blocked GA4 population and the Plausible-measured population. The two tools can then be compared as a cross-validation signal rather than measuring incompatible user segments.
- **Performance:** Removing the standalone gtag.js snippet eliminates one of the two GA4 initialization paths. The GTM-delivered GA4 tag remains. Net script reduction is the standalone gtag.js payload (~159KB transfer) plus the duplicate dataLayer initialization overhead. Main thread parse time on low-end Android devices is reduced proportionally, improving INP responsiveness post-load.
- **Historical Data:** No retroactive fix is possible for the period the dual stack was active. The GA4 annotation (Step 7) establishes a clean-data start date. Stakeholders must be informed that pre-fix session and conversion baselines are unreliable and should not anchor future performance comparisons.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Reviewing escalated item: The net::ERR_ABORTED on the GA4 collect beacon is most likely caused by the test environment (Playwright headless browser or browser-level ad-blocking in the test profile).. Evidence: (1) the GTM container loaded successfully (200, 131KB), (2) the gtag.js loaded successfully (200, 159KB), (3) only the final collect beacon was aborted — consistent with a network-level block on google-analytics.com domain rather than a script error.

**Measured evidence:**
- Failed Request: https://www.google-analytics.com/g/collect — net::ERR_ABORTED
- Successful Loads: ['GTM container: 200, 131KB', 'GA4 gtag.js: 200, 159KB']
- Root Cause Assessment: Most likely test environment ad-blocking, not a production script error
- Production Risk: Ad blockers will block google-analytics.com/g/collect for a significant portion of desktop users
- Mitigation Options: ['Server-side GTM (sGTM) proxies analytics through first-party domain', 'Use Plausible as primary traffic metric source (already deployed)', 'Beacon A

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
Eliminate the dual-beacon race condition by removing the standalone gtag.js snippet, retaining GTM as the sole GA4 delivery mechanism, adding server-side GTM or first-party proxy routing to survive ad-blockers, and instrumenting conversion events (generate_lead, cta_click, scroll_depth) that the current stack entirely omits. Plausible remains as the ad-blocker-resilient parallel signal.

### How
STEP 1 — AUDIT CURRENT HEAD MARKUP: Locate every script tag in the document <head> that references googletagmanager.com/gtag/js or calls gtag('config', ...) outside of GTM. These are the standalone gtag.js instances to remove.
STEP 2 — VERIFY GTM CONTAINS GA4 TAG: In GTM workspace, confirm a GA4 Configuration tag exists with measurement ID G-91BP6NPTSM, trigger = All Pages, and that it fires on gtm.js (container load). If absent, create it before proceeding.
STEP 3 — REMOVE STANDALONE GTAG.JS SNIPPET: Delete the <script async src='https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM'> tag and its companion inline gtag('js', new Date()); gtag('config', 'G-91BP6NPTSM'); block from the HTML template. This is the sole change to the HTML layer — scope is limited to these two script blocks.
STEP 4 — PUBLISH GTM CONTAINER: Publish the GTM workspace. Verify in Network tab that exactly one POST to /g/collect fires per pageview (not two). Confirm client_id is consistent across navigations using GA4 DebugView.
STEP 5 — IMPLEMENT FIRST-PARTY PROXY FOR AD-BLOCKER RESILIENCE: Configure a reverse proxy path on the site's own domain (e.g., /analytics/collect) that forwards to https://www.google-analytics.com/g/collect. Update the GTM GA4 tag's transport_url to point to this first-party endpoint. This prevents ad-blockers that block google-analytics.com from aborting the beacon.
STEP 6 — INSTRUMENT CONVERSION EVENTS IN GTM: Add three GTM triggers and tags — (a) Form Submission: trigger on form submit for the lead form, fire GA4 event tag with event_name='generate_lead'; (b) CTA Click: trigger on click matching the 'Talk to a Founder' anchor, fire GA4 event tag with event_name='cta_click', parameter link_text={{Click Text}}; (c) Scroll Depth: use GTM's built-in Scroll Depth trigger at 25/50/75/90%, fire GA4 event tag with event_name='scroll', parameter percent_scrolled={{Scroll Depth Threshold}}.
STEP 7 — MARK GA4 HISTORICAL DATA AS SUSPECT: In GA4 > Admin > Annotations, add a dated annotation marking the deployment date of this fix as the start of clean data. Communicate to stakeholders that session and pageview metrics prior to this date are inflated due to dual-beacon architecture and should not be used as conversion baselines.
STEP 8 — VALIDATE IN STAGING WITH NETWORK THROTTLING: Before production deploy, run Playwright against staging with request logging enabled. Assert exactly one /g/collect POST per page navigation. Assert zero ERR_ABORTED on the proxied endpoint. Assert Plausible beacon fires independently and is unaffected.

### Code examples
```
// STEP 3 — Remove from HTML <head> (CMS template edit)
// DELETE these two blocks entirely:
//
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM"></script>
// <script>
//   window.dataLayer = window.dataLayer || [];
//   function gtag(){dataLayer.push(arguments);}
//   gtag('js', new Date());
//   gtag('config', 'G-91BP6NPTSM');
// </script>
//
// RETAIN the GTM snippet only:
// <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
// new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
// j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
// 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
// })(window,document,'script','dataLayer','GTM-5VQTG6TH');</script>
// STEP 5 — First-party proxy: Nginx config block
// Scope: applies only to /analytics/collect — no other routes affected
// Precondition: Nginx >= 1.13.10 (proxy_pass with variables supported)
// Site-specific assumption: adjust /analytics/collect path to match your routing conventions

location /analytics/collect {
    # Strip the proxy path prefix before forwarding
    rewrite ^/analytics/collect(.*)$ /g/collect$1 break;

    proxy_pass https://www.google-analytics.com;
    proxy_ssl_server_name on;
    proxy_set_header Host www.google-analytics.com;

    # Forward real client IP so GA4 geo/session data is accurate
    proxy_set_header X-Forwarded-For $remote_addr;

    # Do not cache analytics beacons — each is a unique hit
    proxy_no_cache 1;
    proxy_cache_bypass 1;

    # Prevent the proxy path itself from being indexed
    add_header X-Robots-Tag "noindex, nofollow";
}
// STEP 5 — GTM GA4 Configuration Tag: transport_url override
// Set this in GTM > Tags > GA4 Configuration > Fields to Set
// Field name: transport_url
// Value: https://yourdomain.com/analytics/collect
//
// Equivalent gtag() call for reference (do NOT add this to HTML — configure in GTM only):
// gtag('config', 'G-91BP6NPTSM', {
//   transport_url: 'https://yourdomain.com/analytics/collect'
// });
//
// Site-specific assumption: replace yourdomain.com with the actual production hostname
// STEP 6 — GTM Custom HTML Tag: Conversion event instrumentation
// Deploy as a Custom HTML tag in GTM, trigger = DOM Ready (ensures form elements exist)
// Precondition: form has a submit event; CTA anchor contains text 'Talk to a Founder'
// Precondition: window.gtag is initialized by the GTM GA4 Configuration tag before this fires
// Ordering guarantee: GTM fires tags in priority order — set this tag priority to 0,
// GA4 Configuration tag priority to 1, ensuring config fires first.

(function () {
  'use strict';

  // Named constants — adjust to match actual DOM selectors
  const LEAD_FORM_SELECTOR = 'form[data-form-type="lead"]'; // site-specific assumption
  const CTA_TEXT_PATTERN = /talk to a founder/i;            // site-specific assumption
  const SCROLL_THRESHOLDS = [25, 50, 75, 90];               // percent — adjust if needed
  const DEBOUNCE_SCROLL_MS = 200;                            // prevents scroll event flooding

  // Guard: do not instrument if gtag is not available
  if (typeof window.gtag !== 'function') {
    return;
  }

  // --- 1. Lead Form Submission ---
  const leadForm = document.querySelector(LEAD_FORM_SELECTOR);
  if (leadForm) {
    let isSubmitting = false; // async safety: prevent duplicate submissions
    leadForm.addEventListener('submit', function handleLeadSubmit(event) {
      if (isSubmitting) return;
      isSubmitting = true;

      try {
        window.gtag('event', 'generate_lead', {
          form_id: leadForm.id || 'unknown'
        });
      } catch (e) {
        // Non-fatal: analytics failure must never block form submission
      }

      // Reset flag after submission completes or fails
      // Use a timeout cap to prevent unbounded lock (Production Code Standard #11)
      const SUBMISSION_TIMEOUT_MS = 5000;
      setTimeout(function () { isSubmitting = false; }, SUBMISSION_TIMEOUT_MS);
    });
  }

  // --- 2. CTA Click ---
  // Use event delegation on document to survive dynamic DOM injection
  document.addEventListener('click', function handleCtaClick(event) {
    const anchor = event.target.closest('a');
    if (!anchor) return;
    if (!CTA_TEXT_PATTERN.test(anchor.textContent)) return;

    try {
      window.gtag('event', 'cta_click', {
        link_text: anchor.textContent.trim().slice(0, 100), // cap length
        link_url: anchor.href
      });
    } catch (e) {
      // Non-fatal
    }
  });

  // --- 3. Scroll Depth ---
  // Feature-detect IntersectionObserver before use (Production Code Standard #9)
  if (!('IntersectionObserver' in window)) return;

  const firedThresholds = new Set();
  let scrollDebounceTimer = null;

  function getScrollPercent() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return Math.round((scrollTop / docHeight) * 100);
  }

  function onScroll() {
    clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = setTimeout(function () {
      const pct = getScrollPercent();
      SCROLL_THRESHOLDS.forEach(function (threshold) {
        if (pct >= threshold && !firedThresholds.has(threshold)) {
          firedThresholds.add(threshold);
          try {
            window.gtag('event', 'scroll', {
              percent_scrolled: threshold
            });
          } catch (e) {
            // Non-fatal
          }
        }
      });
    }, DEBOUNCE_SCROLL_MS);
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Teardown on page unload to prevent listener accumulation in SPAs
  // (Production Code Standard #5)
  window.addEventListener('pagehide', function () {
    window.removeEventListener('scroll', onScroll);
    clearTimeout(scrollDebounceTimer);
  }, { once: true });

}());
// STEP 8 — Playwright validation: assert single beacon per navigation
// Run against staging before production deploy
// Precondition: Playwright >= 1.30, Node.js >= 18

const { test, expect } = require('@playwright/test');

// Site-specific assumption: adjust STAGING_URL to match your staging hostname
const STAGING_URL = 'https://staging.yourdomain.com';

// Named constants
const COLLECT_ENDPOINT_PATTERN = /\/g\/collect/;
const MAX_ALLOWED_COLLECT_REQUESTS = 1; // exactly one pageview beacon per navigation
const PAGE_LOAD_TIMEOUT_MS = 10000;
const BEACON_SETTLE_MS = 2000; // wait for async beacons to fire after load

test('GA4 fires exactly one collect beacon per pageview', async ({ page }) => {
  const collectRequests = [];

  page.on('request', function (request) {
    if (COLLECT_ENDPOINT_PATTERN.test(request.url())) {
      collectRequests.push(request.url());
    }
  });

  await page.goto(STAGING_URL, { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT_MS });

  // Allow async beacons to settle
  await page.waitForTimeout(BEACON_SETTLE_MS);

  expect(
    collectRequests.length,
    `Expected exactly ${MAX_ALLOWED_COLLECT_REQUESTS} collect request, got ${collectRequests.length}: ${JSON.stringify(collectRequests)}`
  ).toBe(MAX_ALLOWED_COLLECT_REQUESTS);
});

test('No ERR_ABORTED on analytics endpoints', async ({ page }) => {
  const abortedAnalyticsRequests = [];

  page.on('requestfailed', function (request) {
    if (COLLECT_ENDPOINT_PATTERN.test(request.url())) {
      abortedAnalyticsRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    }
  });

  await page.goto(STAGING_URL, { waitUntil: 'networkidle', timeout: PAGE_LOAD_TIMEOUT_MS });
  await page.waitForTimeout(BEACON_SETTLE_MS);

  expect(
    abortedAnalyticsRequests,
    `Aborted analytics requests detected: ${JSON.stringify(abortedAnalyticsRequests)}`
  ).toHaveLength(0);
});
```

## Risks
- RISK: GTM GA4 tag misconfiguration — if the GTM GA4 Configuration tag is not correctly set up before the standalone snippet is removed, GA4 data collection stops entirely. Mitigation: verify GTM tag fires in GA4 DebugView on staging before removing the standalone snippet from production.
- RISK: First-party proxy IP forwarding — if X-Forwarded-For is not correctly passed, GA4 geo-location and session deduplication may degrade because all hits appear to originate from the proxy server IP. Mitigation: verify the Nginx config passes $remote_addr and test with GA4 DebugView geographic data.
- RISK: Proxy path indexed by search engines — the /analytics/collect endpoint must not be crawled or indexed. Mitigation: the X-Robots-Tag header in the Nginx block handles this; additionally add Disallow: /analytics/collect to robots.txt.
- RISK: CTA selector brittleness — the CTA click handler uses text pattern matching (/talk to a founder/i). If the CTA text changes or is rendered as an image, the trigger silently stops firing. Mitigation: add a data-gtm-cta attribute to the CTA element and update the selector to use attribute matching, which survives text copy changes.
- RISK: Form selector assumption — LEAD_FORM_SELECTOR uses data-form-type='lead' which may not match the actual form markup. Mitigation: confirm the selector against the live DOM before deploying; update the named constant to match the real attribute.
- RISK: Scroll listener accumulation in SPA navigation — if the site uses client-side routing, the pagehide teardown may not fire between virtual page transitions, causing scroll listeners to stack. Mitigation: if SPA routing is confirmed, replace the pagehide listener with a route-change hook appropriate to the framework in use.
- RISK: GTM tag firing order — the conversion event Custom HTML tag must fire after the GA4 Configuration tag or gtag() will be undefined. Mitigation: set GA4 Configuration tag priority to 1 and the Custom HTML tag priority to 0 in GTM, and add the typeof window.gtag guard already present in the code example.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
