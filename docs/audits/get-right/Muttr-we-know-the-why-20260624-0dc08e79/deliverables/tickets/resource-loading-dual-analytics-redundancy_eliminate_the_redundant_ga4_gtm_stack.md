---
finding_id: "resource-loading-dual-analytics-redundancy"
title: "Redundant dual analytics stack (Plausible + GA4/GTM) — excessive overhead and attribution confusion"
severity: "high"
root_cause_cluster: "Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture"
why_this_matters: "Removing GTM (131KB) and standalone gtag.js (159KB) eliminates ~290KB of JavaScript from every page load."
fix_summary: "Eliminate the redundant GA4/GTM stack entirely."
confidence_tier: "confirmed"
---

# Redundant dual analytics stack (Plausible + GA4/GTM) — excessive overhead and attribution confusion

**Finding:** Redundant dual analytics stack (Plausible + GA4/GTM) — excessive overhead and attribution confusion  
**Severity:** High  
**Why this matters:** Removing GTM (131KB) and standalone gtag.js (159KB) eliminates ~290KB of JavaScript from every page load.  
**Root cause:** Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture  
**Fix:** Eliminate the redundant GA4/GTM stack entirely.

> **Evidence Basis:** Confirmed

---

## Impact

- **Page Load Performance:** Removing GTM (131KB) and standalone gtag.js (159KB) eliminates ~290KB of JavaScript from every page load. This directly reduces main thread parse and execution time. On mobile devices with constrained CPU, eliminating this JavaScript removes hundreds of milliseconds of main thread blocking that currently delays interactivity (INP) and competes with content rendering (LCP). The remaining Plausible script is ~5KB with defer — negligible impact.
- **Data Integrity:** GA4 property G-91BP6NPTSM currently double-counts every pageview and session due to the dual gtag.js + GTM-managed GA4 firing. All historical GA4 data is unreliable. Removing the stack and relying on Plausible establishes a single, uncorrupted data source. Any future analytics decisions based on GA4 data would be built on inflated metrics — this fix prevents that.
- **Conversion Visibility:** The current stack tracks zero conversion events despite 290KB of analytics payload. Adding Plausible custom events for form submissions and CTA clicks creates conversion tracking that did not previously exist. This enables measurement of the site's primary business actions (lead generation) for the first time.
- **Ttfb And Network:** Eliminating 2 external script fetches (googletagmanager.com domain) removes DNS resolution, TLS handshake, and download time for those resources. It also eliminates the ongoing collect beacons that GA4 fires on every interaction, reducing network contention. The ERR_ABORTED beacon errors (from duplicate GA4 requests colliding) will cease entirely.
- **Privacy Compliance:** Plausible is cookieless and does not require consent banners for GDPR/CCPA compliance. GA4 sets cookies and requires consent management. Removing GA4 simplifies or eliminates the need for cookie consent infrastructure, reducing both legal exposure and UX friction from consent banners.

## Compliance & Legal

**Compliance Domains:** performance_as_liability

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The site runs Plausible Analytics alongside GA4 (via both GTM container GTM-5VQTG6TH and standalone gtag.js for G-91BP6NPTSM).. For a service-based consultancy where the primary conversion is 'Talk to a Founder' (contact form submission), having two analytics platforms with no clear delineation of purpose creates attribution ambiguity.

**Measured evidence:**
- Plausible Kb: ~5KB (estimated)
- Gtm Ga4 Kb: 290
- Total Analytics Kb: ~295KB
- Page Content Kb: 10
- Analytics To Content Ratio: ~29:1
- Recommendation: Evaluate whether GA4/GTM provides capabilities Plausible does not (Google Ads conversion tracking, audience building, enhanced e-commerce). If not, remove GTM/GA4 and save 290KB. If GA4 is required, consider server-side GTM to reduce client payload.
- Content Transfer Size: 10KB (HTML + CSS + SVG)
- Tracking Js Transfer Size: 290KB

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
Eliminate the redundant GA4/GTM stack entirely. Retain Plausible as the sole analytics platform. Configure Plausible custom events to capture the conversion signals (form submissions, CTA clicks) that GA4 was never configured to track anyway. This removes ~290KB of JavaScript, eliminates the double-counting data corruption, and establishes a single source of truth for site analytics.

### How
Step 1: Audit current GA4 property (G-91BP6NPTSM) for any configured conversions, audiences, or Google Ads integrations. If GA4 is linked to active Google Ads campaigns, those campaigns need Plausible goal URLs or offline conversion imports as replacements BEFORE removal. If no Ads linkage exists (likely for a consultancy site), proceed directly.

Step 2: Remove the standalone gtag.js script tag from the site's <head> template. This is the line loading https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM plus its inline gtag() configuration block. On Netlify, this is typically in the site's base HTML template (index.html, _document.js, or layout file depending on framework).

Step 3: Remove the GTM container script (GTM-5VQTG6TH). This is two code blocks: the <script> tag in <head> and the <noscript> iframe in <body>. Both must be removed.

Step 4: Verify the Plausible script tag remains. It should be a single ~5KB script, typically: <script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>. If using Plausible's custom events extension, ensure the src points to script.tagged-events.js or the appropriate bundle.

Step 5: Add Plausible custom event tracking for the conversion actions that were never tracked. Deploy the code example below to track form submissions and CTA clicks. These use Plausible's lightweight event API — no additional script payload required.

Step 6: After deployment, monitor Plausible's real-time dashboard to confirm pageviews and custom events are firing. Allow 48 hours of parallel data collection if nervous — but there is no parallel here since GA4 data was corrupted by double-counting and had zero conversion events, so there is nothing valid to compare against.

Step 7: After confirming Plausible events are working, archive the GA4 property (do not delete — retain for historical reference even though the data is inflated). Remove the GTM container from tagmanager.google.com or archive it.

### Code examples
```
<!-- ============================================
     STEP 2-3: REMOVE THESE BLOCKS FROM <head> AND <body>
     ============================================ -->

<!-- REMOVE: Standalone gtag.js (Step 2) -->
<!-- Delete the following script tag and its inline config: -->
<!--
<script async src="https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-91BP6NPTSM');
</script>
-->

<!-- REMOVE: GTM container head snippet (Step 3) -->
<!-- Delete from <head>:
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5VQTG6TH');</script>
-->

<!-- REMOVE: GTM noscript fallback from <body> (Step 3) -->
<!-- Delete from <body>:
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5VQTG6TH"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
-->
<!-- ============================================
     STEP 4: VERIFY PLAUSIBLE REMAINS
     Ensure this tag exists in <head>.
     Update data-domain to match your actual domain.
     Use script.tagged-events.js to enable custom events.
     ============================================ -->
<script
  defer
  data-domain="yourdomain.com"
  src="https://plausible.io/js/script.tagged-events.js"
></script>
<!-- NOTE: data-domain is site-specific — set to your registered Plausible domain. -->
// ============================================
// STEP 5: Plausible Custom Event Tracking
// ============================================
// This script replaces the zero conversion tracking that existed
// in the GA4/GTM stack. Load this in a <script defer> block
// after the Plausible script, or inline at end of <body>.
//
// Plausible's `plausible()` function is injected by the Plausible
// script. It queues events if called before the script loads.
// No additional library is required.

(function () {
  'use strict';

  // -- SITE-SPECIFIC SELECTORS --
  // Update these if your CTA text, selectors, or form structure differs.
  /** @type {string} Selector for the primary CTA link(s) */
  var CTA_SELECTOR = 'a[href*="/contact"], a[href*="/book"], a[href*="calendly.com"]';

  /** @type {string} Selector for site forms (contact, lead gen) */
  var FORM_SELECTOR = 'form';

  // -- PLAUSIBLE EVENT HELPER --
  // Plausible creates a global `plausible` function. If it hasn't
  // loaded yet, queue the call. This matches Plausible's own
  // recommended pattern for manual event tracking.
  function trackEvent(eventName, props) {
    if (typeof window.plausible === 'function') {
      window.plausible(eventName, { props: props });
    } else {
      // Queue for when Plausible loads (Plausible reads this queue)
      window.plausible =
        window.plausible ||
        function () {
          (window.plausible.q = window.plausible.q || []).push(arguments);
        };
      window.plausible(eventName, { props: props });
    }
  }

  // -- CTA CLICK TRACKING --
  // Uses event delegation on document.body to avoid timing issues
  // with dynamically rendered CTAs. Single listener, no teardown
  // needed (lives for page lifetime, one listener total).
  document.addEventListener('click', function (event) {
    // Walk up from click target to find matching anchor
    var target = event.target;
    while (target && target !== document.body) {
      if (target.matches && target.matches(CTA_SELECTOR)) {
        trackEvent('CTA Click', {
          url: target.getAttribute('href') || 'unknown',
          text: (target.textContent || '').trim().substring(0, 100)
        });
        // Do not preventDefault — let the navigation proceed
        return;
      }
      target = target.parentElement;
    }
  });

  // -- FORM SUBMISSION TRACKING --
  // Captures all form submissions via event delegation.
  // Fires on 'submit' event which occurs before the browser
  // navigates, giving Plausible time to beacon.
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || !form.matches(FORM_SELECTOR)) {
      return;
    }

    var formAction = form.getAttribute('action') || window.location.pathname;
    var formId = form.getAttribute('id') || form.getAttribute('name') || 'unnamed-form';

    trackEvent('Form Submit', {
      form_id: formId,
      action: formAction
    });
    // Do not preventDefault — let the form submit normally.
    // Plausible beacons use navigator.sendBeacon which survives
    // page unload. No race condition with navigation.
  });
})();
// ============================================
// PRECONDITIONS & EDGE CASES:
// - plausible() queuing pattern is Plausible's documented approach.
//   If Plausible script fails to load (blocked, network error),
//   events silently queue and are lost — acceptable degradation.
// - Event delegation on document avoids needing to wait for DOM
//   elements to exist. Works with SSR, SPA, and late-injected content.
// - .matches() is supported in all browsers since IE dropped out
//   of support (Edge 12+, Safari 8+, Chrome 33+, Firefox 34+).
//   No polyfill needed for any browser in active support.
// - No async operations, no state, no mutation — no race conditions.
// ============================================
```

## Risks
- If GA4 is linked to active Google Ads campaigns, removing it breaks conversion tracking for ad optimization. MITIGATION: Step 1 explicitly requires checking for Google Ads linkage before removal. If linked, configure Plausible goal page URLs as offline conversion imports into Google Ads before removing GA4. For a consultancy site with no evidence of paid campaigns, this risk is low.
- Stakeholders may have GA4 dashboards, Looker Studio reports, or BigQuery exports that reference this property. MITIGATION: Communicate that all historical GA4 data is corrupted by double-counting and unreliable for any decision-making. Archive the property rather than deleting it. Rebuild reporting on Plausible's API or dashboard.
- Plausible's custom event tracking is simpler than GA4's event model — no user_id stitching, no audience building, no remarketing lists. MITIGATION: For a service consultancy, these advanced features are almost certainly unused (zero events were configured). If the business scales to need audience segmentation or remarketing, GA4 can be re-added deliberately through GTM with proper event configuration — but as a conscious architectural decision, not an accumulation.
- The CTA_SELECTOR and FORM_SELECTOR constants in the tracking code are assumptions based on common consultancy site patterns. If the actual site uses different URL patterns for contact/booking pages or non-standard form markup, these selectors need adjustment. MITIGATION: Both are exposed as named constants at the top of the script with comments marking them as site-specific.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
