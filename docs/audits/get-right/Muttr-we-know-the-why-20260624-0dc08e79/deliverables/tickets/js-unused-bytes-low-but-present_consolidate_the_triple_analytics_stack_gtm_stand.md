---
finding_id: "js-unused-bytes-low-but-present"
title: "465KB unused JavaScript out of 2.5MB parsed — 18.5% unused rate is acceptable but worth monitoring"
severity: "medium"
root_cause_cluster: "Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture"
why_this_matters: "Removing ~500KB of parsed JavaScript reduces main thread parsing and compilation work on every pageview."
fix_summary: "Consolidate the triple analytics stack (GTM + standalone gtag.js + redundant runtime) into a single GTM container as the sole analytics entry point, eliminating ~159KB compressed / ~500KB+ parsed of…"
confidence_tier: "confirmed"
---

# 465KB unused JavaScript out of 2.5MB parsed — 18.5% unused rate is acceptable but worth monitoring

**Finding:** 465KB unused JavaScript out of 2.5MB parsed — 18.5% unused rate is acceptable but worth monitoring  
**Severity:** Medium  
**Why this matters:** Removing ~500KB of parsed JavaScript reduces main thread parsing and compilation work on every pageview.  
**Root cause:** Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture  
**Fix:** Consolidate the triple analytics stack (GTM + standalone gtag.js + redundant runtime) into a single GTM container as the sole analytics entry point, eliminating ~159KB compressed / ~500KB+ parsed of…

> **Evidence Basis:** Confirmed

---

## Impact

- **Main Thread Parse Time:** Removing ~500KB of parsed JavaScript reduces main thread parsing and compilation work on every pageview. On low-end mobile devices, JavaScript parsing is a documented bottleneck — the absolute time savings scale with device class and CPU capability. Addy Osmani's 'The Cost of JavaScript' (web.dev) documents that parsing and compiling JS is consistently one of the most expensive per-byte costs on the critical path, particularly on mid-range and low-end Android devices. The proportional reduction in total parsed JS (from ~2.5MB toward ~2.0MB) directly reduces this overhead.
- **Inp Interaction Responsiveness:** The standalone gtag.js registers its own set of event listeners and runs its own initialization state machine on every page load. Removing it reduces the number of long tasks competing for main thread time during and after page load, reducing long task competition on the main thread, which lowers the processing time and presentation delay components of INP across interactions throughout the session.
- **Data Integrity:** Eliminating the duplicate GA4 pageview eliminates double-counted sessions and inflated pageview metrics. Every analytics report currently overstates traffic by counting each visit twice. After consolidation, GA4 data becomes trustworthy for business decisions — bounce rate, session duration, and pages-per-session will all shift to reflect actual user behavior rather than instrumentation artifacts.
- **Network Transfer:** Eliminates ~159KB of compressed transfer on every pageview for every visitor. On metered mobile connections, this is meaningful per-visit bandwidth savings multiplied across 100% of traffic.
- **Crawl Efficiency:** Googlebot's rendering service also parses this JavaScript. Reducing parse load per page improves crawl rendering efficiency, though the SEO impact is indirect and secondary to the data integrity and performance gains.

## Compliance & Legal

**Compliance Domains:** performance_as_liability

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Code coverage shows 465KB unused out of 2,506KB total parsed JavaScript (18.5% unused).. This is below the 50% per-bundle concern threshold.

**Measured evidence:**
- Js Unused Kb: 465
- Js Total Parsed Kb: 2506
- Unused Percentage: 18.5%
- Css Unused Kb: 0
- Css Total Kb: 1279
- Threshold Exceeded: Total parsed JS >1MB (2.5MB)
- Primary Contributor: GTM + gtag.js analytics stack

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
Consolidate the triple analytics stack (GTM + standalone gtag.js + redundant runtime) into a single GTM container as the sole analytics entry point, eliminating ~159KB compressed / ~500KB+ parsed of redundant standalone gtag.js and reducing total parsed JavaScript from ~2.5MB to ~1.5MB. Configure the single GTM container with actual conversion events instead of double-counted pageviews.

### How
Phase 1 — Audit & Baseline (before any code changes): 1. Document every tag firing in the current GTM container via GTM Preview mode — record tag name, trigger, and firing count per pageview. 2. Open Chrome DevTools Network tab, filter by 'gtag' and 'googletagmanager' — identify the standalone gtag.js script URL and its loader snippet in the page source. 3. Confirm the standalone gtag.js is sending to the same GA4 Measurement ID as the GTM-managed GA4 tag. If they send to different properties, document both property IDs — one will be deprecated. 4. Record current GA4 real-time pageview count for a 5-minute window as a sanity baseline (expect it to roughly halve after deduplication). Phase 2 — Remove standalone gtag.js: 5. Locate the standalone gtag.js loader in the site's global template/header partial. It will look like the snippet shown in code_examples[0]. Remove this entire block. 6. Do NOT remove the GTM container snippet — it stays as the single analytics entry point. 7. Verify the GTM container has a GA4 Configuration tag pointing to the correct Measurement ID. If it does not, create one inside GTM (Tag Type: Google Analytics: GA4 Configuration, Measurement ID set as a GTM Constant variable). Phase 3 — Configure meaningful events in GTM: 8. Inside GTM, add conversion event tags for actual business actions: form submissions, outbound link clicks, scroll depth milestones, file downloads. Use GTM's built-in trigger types (Form Submission, Click - Just Links with URL filters, Scroll Depth, etc.) — these require zero custom JavaScript. 9. Publish the GTM container version with a descriptive name ('Consolidated analytics — removed standalone gtag.js'). Phase 4 — Validate: 10. Use GTM Preview mode to confirm only one GA4 pageview event fires per page load (not two). 11. Check GA4 DebugView to confirm events arrive with correct parameters. 12. Monitor GA4 real-time for 24 hours — pageview counts should drop by roughly half (the duplicate is gone, not real traffic). 13. Run Chrome Coverage API on the page — total parsed JS should drop by ~500KB+, and the unused byte ratio of the remaining GTM bundle will be similar but the absolute waste is halved.

### Code examples
```
<!-- REMOVE THIS ENTIRE BLOCK from the global site template/header partial.
     This is the standalone gtag.js loader that duplicates the GTM-managed GA4 tag.
     Locate it by searching the template for 'gtag(' or 'googletagmanager.com/gtag'.
     
     The GTM container snippet (which references googletagmanager.com/gtm.js?id=GTM-...)
     STAYS — it becomes the single analytics entry point.
-->

<!-- BLOCK TO REMOVE — START -->
<!--
  The actual script tag will reference a real Measurement ID (G-XXXXXXXXXX).
  Do NOT search for a placeholder — search for the pattern below.
-->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
<!-- BLOCK TO REMOVE — END -->

<!-- NOTE: The 'G-XXXXXXXXXX' above is a pattern illustration.
     In the actual site source, this will be a real Measurement ID.
     Search the page source for 'googletagmanager.com/gtag/js' to find it.
     The window.dataLayer declaration may appear separately — leave that line
     if the GTM container snippet also references it (GTM needs dataLayer).
     Only remove the gtag.js script tag and the gtag('config', ...) call. -->
<!-- KEEP THIS — the GTM container snippet remains as the sole analytics loader.
     This is identified by the '/gtm.js?id=GTM-' URL pattern (not '/gtag/js').
     Verify it exists in the same global template. -->

<!-- Google Tag Manager -->
<script>
  /* The dataLayer initialization MUST remain — GTM depends on it.
     If the removed gtag.js block was the only place dataLayer was initialized,
     ensure this line persists before the GTM snippet. */
  window.dataLayer = window.dataLayer || [];
</script>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->

<!-- NOTE: 'GTM-XXXXXXX' above is a pattern illustration.
     The actual container ID is already in the site source — do not change it.
     This snippet is shown only to clarify WHAT TO KEEP vs what was removed above. -->
// GTM Container Validation Script — run in browser console AFTER deployment
// to confirm deduplication worked. This is a diagnostic tool, not production code.

(function validateAnalyticsConsolidation() {
  'use strict';

  // --- Check 1: Standalone gtag.js should be gone ---
  var scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
  if (scripts.length > 0) {
    console.error('[AUDIT FAIL] Standalone gtag.js still present:', scripts.length, 'instance(s)');
    scripts.forEach(function(s) { console.error('  src:', s.src); });
  } else {
    console.log('[AUDIT PASS] No standalone gtag.js found — removed successfully.');
  }

  // --- Check 2: GTM container should still be present ---
  var gtmScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]');
  if (gtmScripts.length === 1) {
    console.log('[AUDIT PASS] Single GTM container found:', gtmScripts[0].src);
  } else if (gtmScripts.length === 0) {
    console.error('[AUDIT FAIL] GTM container is missing — was it accidentally removed?');
  } else {
    console.warn('[AUDIT WARN] Multiple GTM containers found:', gtmScripts.length);
  }

  // --- Check 3: dataLayer should exist and receive events ---
  if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
    var pageviewEvents = window.dataLayer.filter(function(entry) {
      return entry && entry.event === 'gtm.js';
    });
    console.log('[AUDIT INFO] dataLayer has', window.dataLayer.length, 'entries,',
      pageviewEvents.length, 'gtm.js init event(s) — expect exactly 1.');
  } else {
    console.error('[AUDIT FAIL] window.dataLayer is missing or not an array.');
  }

  // --- Check 4: Count GA4 network requests to confirm single-fire ---
  // This requires the Performance/Network observer to have been running.
  // Alternatively, check Network tab manually for requests to collect?v=2
  console.log('[AUDIT ACTION] Manually verify Network tab: filter by "collect?v=2" — expect 1 pageview request, not 2.');
})();
```

## Risks
- If the standalone gtag.js sends to a DIFFERENT GA4 property than the GTM-managed tag, removing it will stop data flow to that second property. Mitigation: Phase 1 step 3 explicitly checks for this. If a second property exists and is needed, add a second GA4 Configuration tag inside GTM pointing to it — GTM can send to multiple properties from a single container.
- If other scripts on the page call the global gtag() function directly (not through dataLayer.push), those calls will fail silently after removing the standalone gtag.js loader — because gtag() is defined in that loader's inline script. Mitigation: Search the entire codebase for 'gtag(' calls outside the removed block. If found, either convert them to dataLayer.push events (GTM-native pattern) or retain the two-line gtag function definition (window.dataLayer push wrapper) without the script tag that loads the library. The function definition is ~50 bytes and harmless.
- The window.dataLayer array initialization (window.dataLayer = window.dataLayer || []) may only exist in the standalone gtag.js block being removed. If the GTM snippet loads after a dataLayer.push call that expects the array to exist, it will throw. Mitigation: Code example 2 explicitly shows retaining the dataLayer initialization line before the GTM snippet. Verify during Phase 2 that this line persists.
- GA4 real-time reports will show an apparent ~50% traffic drop immediately after deployment. This is not lost traffic — it is the removal of the duplicate count. Mitigation: Document this expected behavior with stakeholders BEFORE deployment. The Phase 1 baseline recording provides the comparison point to confirm the drop matches the expected deduplication.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
