---
finding_id: "an-2-duplicate-analytics-gtm-ga4-plausible"
title: "Triple analytics stack (GTM + standalone GA4 gtag.js + Plausible) constitutes 73%+ of total page transfer weight"
severity: "high"
root_cause_cluster: "Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture"
why_this_matters: "Removing standalone gtag.js eliminates ~159KB of JavaScript transfer."
fix_summary: "Consolidate to a single analytics architecture: GTM as the sole analytics orchestrator firing one GA4 tag, remove the standalone gtag.js script entirely, and make a deliberate keep-or-kill decision o…"
confidence_tier: "confirmed"
---

# Triple analytics stack (GTM + standalone GA4 gtag.js + Plausible) constitutes 73%+ of total page transfer weight

**Finding:** Triple analytics stack (GTM + standalone GA4 gtag.js + Plausible) constitutes 73%+ of total page transfer weight  
**Severity:** High  
**Why this matters:** Removing standalone gtag.js eliminates ~159KB of JavaScript transfer.  
**Root cause:** Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture  
**Fix:** Consolidate to a single analytics architecture: GTM as the sole analytics orchestrator firing one GA4 tag, remove the standalone gtag.js script entirely, and make a deliberate keep-or-kill decision o…

> **Evidence Basis:** Confirmed

---

## Impact

- **Page Weight:** Removing standalone gtag.js eliminates ~159KB of JavaScript transfer. Combined with resolving the duplicate GTM snippet (if confirmed), total analytics payload drops from ~290KB to ~131KB (GTM only) or ~136KB (GTM + Plausible). This is a in analytics JavaScript weight.
- **Main Thread Parsing:** 159KB less JavaScript to parse and execute on every page load. On low-end mobile devices, JavaScript parsing runs at roughly 1MB/s uncompressed — removing this payload eliminates hundreds of milliseconds of main thread blocking that currently competes with interactive elements (forms, navigation, CTAs).
- **Inp And Interactivity:** Reducing main thread contention from analytics parsing directly improves Interaction to Next Paint. The removed scripts currently compete for main thread time during and after page load, delaying response to user input. Google's Core Web Vitals documentation establishes that main thread blocking is the primary driver of poor INP scores.
- **Data Integrity:** Eliminating double-counted pageviews restores GA4 to accurate measurement. Bounce rate will rise to its true value (currently suppressed by phantom second pageview). Session counts will drop to actual numbers. Any conversion rate calculations will use correct denominators for the first time. This is not a metric degradation — it is the first accurate baseline.
- **Err Aborted Beacons:** The duplicate GA4 collect beacon race condition is eliminated at source. Both GA4 instances currently attempt to send the same measurement simultaneously; the browser cancels one, producing ERR_ABORTED errors in the console and potential data loss. Single-instance GA4 via GTM sends one beacon per event.
- **Attribution Accuracy:** If Google Ads or any paid media targets this GA4 property, conversion attribution is currently corrupted by inflated session denominators. Fixing this restores accurate ROAS calculation — the actual impact depends on current ad spend and conversion volume.
- **Search Ranking:** Reducing JavaScript payload and improving INP moves Core Web Vitals scores toward passing thresholds. Google uses Core Web Vitals as a ranking signal — sites in the 'good' cohort receive preferential treatment over sites in the 'poor' cohort for otherwise equivalent content.

## Compliance & Legal

**Compliance Domains:** performance_as_liability

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The page loads three analytics-related scripts: (1) GTM container (GTM-5VQTG6TH, 131KB), (2) standalone GA4 gtag.js (G-91BP6NPTSM, 159KB), and (3) Plausible analytics (lightweight).. Additionally, the data shows 2 GTM containers detected.

**Measured evidence:**
- Analytics Scripts: [{'url': 'https://www.googletagmanager.com/gtm.js?id=GTM-5VQTG6TH', 'size_kb': 131, 'type': 'GTM container'}, {'url': 'https://www.googletagmanager.co
- Gtm Containers Detected: 2
- Total Analytics Js Kb: 290
- Total Page Content Kb: 7
- Analytics To Content Ratio: 41:1
- Double Counting Risk: GA4 property G-91BP6NPTSM likely configured in both GTM container AND standalone gtag.js
- Recommendation: Consolidate: load GA4 exclusively through GTM (remove standalone gtag.js), or remove GTM and use only standalone gtag.js. Keep Plausible as a lightweight privacy-respecting fallback for ad-blocked users.
- Gtm Container Size: 131KB compressed

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
Consolidate to a single analytics architecture: GTM as the sole analytics orchestrator firing one GA4 tag, remove the standalone gtag.js script entirely, and make a deliberate keep-or-kill decision on Plausible. This eliminates ~160KB of redundant JavaScript, fixes double-counted pageviews, and restores GA4 data integrity.

### How
Phase 1 — Audit & Baseline (before any removal):
1. Open GA4 Realtime report. Load any page. Confirm you see 2 pageview events per page load (evidence of double-counting). Screenshot this as your before-state.
2. In GTM (container GTM-5VQTG6TH), open the workspace and identify the GA4 Configuration tag. Confirm it fires measurement ID G-91BP6NPTSM on 'All Pages' trigger. Document all custom event tags, if any, that depend on this configuration tag.
3. Search the GTM container for any 'Custom HTML' tags that load a second GTM container or inject additional gtag.js. If found, pause (do not delete yet) those tags.
4. In your CMS or site template (likely Netlify config, Hugo partial, or site-wide <head> include), locate the standalone gtag.js snippet. It will look like: <script async src='https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM'></script> followed by a <script> block calling gtag('config', 'G-91BP6NPTSM'). Document its exact location (file path, line numbers).
5. Check if the GTM container snippet appears twice in the HTML source (View Source, Ctrl+F for 'GTM-5VQTG6TH'). If duplicated, document both locations.

Phase 2 — Remove standalone gtag.js:
6. Remove the standalone gtag.js snippet identified in step 4 from the CMS template / site config. This is the primary fix — it eliminates the duplicate GA4 instance.
7. If a duplicate GTM snippet was found in step 5, remove the second instance. Keep exactly one GTM snippet in <head> and optionally the noscript iframe in <body>.
8. Deploy to a staging/preview environment. Verify in browser DevTools Network tab: only one request to googletagmanager.com/gtm.js (the GTM container), zero requests to googletagmanager.com/gtag/js (the standalone library). GA4 collect beacons should now fire once per pageview, not twice.
9. Check GA4 Realtime: confirm exactly 1 pageview event per page load. The ERR_ABORTED collect beacon issue should disappear.

Phase 3 — Plausible decision:
10. If Plausible serves a distinct purpose (privacy-first public dashboard, GDPR-compliant analytics without consent requirement, stakeholder who refuses GA4), keep it. At ~5KB it is not a performance concern.
11. If Plausible was added as a workaround for unreliable GA4 data (which this fix resolves), remove it to eliminate a redundant source of truth that nobody reconciles.

Phase 4 — GTM container hygiene:
12. Inside GTM, verify only one GA4 Configuration tag (or GA4 Event tag with 'send_to' parameter) fires on All Pages. Delete any paused tags from step 3.
13. Publish the GTM container version with a descriptive name: 'Cleanup: removed duplicate GA4, single config tag'.

Phase 5 — Post-deployment validation:
14. After production deploy, monitor GA4 Realtime for 24 hours. Pageview counts should drop by roughly 50% (reflecting the removal of double-counting, not lost traffic).
15. After 7 days, compare session counts and bounce rates to the prior period. Sessions will appear to drop (they were inflated). Bounce rate will appear to rise (it was artificially suppressed by double pageview hits). Both changes reflect corrected data, not degraded performance.
16. Document the new baseline metrics as the first trustworthy dataset.

### Code examples
```
<!-- BEFORE: Broken state — standalone gtag.js AND GTM both present in <head> -->
<!-- This entire block must be REMOVED from the CMS template / site-wide head partial -->
<!-- ============================================================ -->
<!-- DELETE START -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-91BP6NPTSM');
</script>
<!-- DELETE END -->
<!-- ============================================================ -->

<!-- AFTER: Only GTM remains — this is the ONLY analytics snippet in <head> -->
<!-- GTM fires GA4 internally via its Configuration tag -->
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5VQTG6TH');</script>
<!-- End Google Tag Manager -->

<!-- If Plausible is kept (privacy-first, lightweight, separate purpose): -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
<!-- Note: data-domain is site-specific — configure to match your actual domain -->
// POST-DEPLOYMENT VALIDATION SCRIPT
// Run this in browser DevTools console on any page after deploying the fix.
// It checks that the duplicate analytics pattern is fully eliminated.

(function validateAnalyticsCleanup() {
  'use strict';

  const EXPECTED_GTM_CONTAINER_ID = 'GTM-5VQTG6TH';
  const EXPECTED_GA4_MEASUREMENT_ID = 'G-91BP6NPTSM';

  const results = {
    gtmSnippets: 0,
    standaloneGtagScripts: 0,
    plausibleScripts: 0,
    dataLayerExists: typeof window.dataLayer !== 'undefined',
    gtagFunctionExists: typeof window.gtag === 'function',
    errors: []
  };

  // Count GTM container script tags in DOM
  var allScripts = document.querySelectorAll('script');
  for (var i = 0; i < allScripts.length; i++) {
    var scriptEl = allScripts[i];
    var src = scriptEl.getAttribute('src') || '';
    var textContent = scriptEl.textContent || '';

    // Standalone gtag.js (the one we removed)
    if (src.indexOf('googletagmanager.com/gtag/js') !== -1) {
      results.standaloneGtagScripts++;
      results.errors.push(
        'FAIL: Standalone gtag.js still present — src: ' + src
      );
    }

    // GTM container loader
    if (src.indexOf('googletagmanager.com/gtm.js') !== -1 ||
        textContent.indexOf('gtm.js') !== -1) {
      results.gtmSnippets++;
    }

    // Plausible
    if (src.indexOf('plausible.io') !== -1) {
      results.plausibleScripts++;
    }
  }

  if (results.standaloneGtagScripts > 0) {
    results.errors.push(
      'CRITICAL: ' + results.standaloneGtagScripts +
      ' standalone gtag.js script(s) detected. Removal incomplete.'
    );
  }

  if (results.gtmSnippets > 1) {
    results.errors.push(
      'WARNING: ' + results.gtmSnippets +
      ' GTM snippets detected. Should be exactly 1.'
    );
  }

  if (results.gtmSnippets === 0) {
    results.errors.push(
      'CRITICAL: No GTM snippet found. GTM was accidentally removed.'
    );
  }

  // Check network requests via Performance API
  if (typeof performance !== 'undefined' &&
      typeof performance.getEntriesByType === 'function') {
    var resources = performance.getEntriesByType('resource');
    var gtagRequests = 0;
    var collectRequests = 0;
    for (var j = 0; j < resources.length; j++) {
      if (resources[j].name.indexOf('gtag/js') !== -1) {
        gtagRequests++;
      }
      if (resources[j].name.indexOf('google-analytics.com/g/collect') !== -1 ||
          resources[j].name.indexOf('analytics.google.com/g/collect') !== -1) {
        collectRequests++;
      }
    }
    results.networkGtagRequests = gtagRequests;
    results.networkCollectBeacons = collectRequests;

    if (gtagRequests > 0) {
      results.errors.push(
        'FAIL: ' + gtagRequests +
        ' standalone gtag.js network request(s) detected.'
      );
    }
    // After fix, expect exactly 1 collect beacon per pageview
    // (GTM-fired GA4 tag). More than 1 suggests duplication persists.
    if (collectRequests > 1) {
      results.errors.push(
        'WARNING: ' + collectRequests +
        ' GA4 collect beacons fired. Expected 1. Possible duplication inside GTM container.'
      );
    }
  }

  if (results.errors.length === 0) {
    console.log('%c✅ Analytics cleanup validated successfully', 'color: green; font-weight: bold');
  } else {
    console.warn('%c❌ Analytics cleanup issues found:', 'color: red; font-weight: bold');
    for (var k = 0; k < results.errors.length; k++) {
      console.warn('  ' + results.errors[k]);
    }
  }

  console.table(results);
  return results;
})();
```

## Risks
- RISK: The standalone gtag.js snippet may be the ONLY place where gtag('config') initializes GA4, and the GTM container may not actually contain a GA4 Configuration tag. MITIGATION: Step 2 explicitly verifies the GTM container has a working GA4 tag BEFORE removing the standalone snippet. If GTM lacks a GA4 tag, create one in GTM first (Measurement ID: G-91BP6NPTSM, trigger: All Pages), publish, then remove the standalone snippet.
- RISK: A CMS plugin, Netlify build plugin, or theme setting auto-injects the standalone gtag.js, and it reappears after the next deploy. MITIGATION: Search the entire codebase and CMS admin for the measurement ID string 'G-91BP6NPTSM' and the gtag.js URL. Disable the source (plugin setting, theme option, environment variable) rather than just deleting the output HTML. Run the validation script after every deploy for the first 2 weeks.
- RISK: Stakeholders see GA4 session counts drop ~50% post-fix and interpret it as lost traffic. MITIGATION: Brief stakeholders BEFORE deployment that metrics will change because the current data is double-counted. Frame the post-fix data as the first accurate baseline. Provide the before/after Realtime screenshots from Phase 1.
- RISK: Removing Plausible (if chosen) eliminates a data source that a stakeholder relies on for reporting. MITIGATION: Phase 3 is a deliberate decision point, not an automatic removal. Confirm with all analytics consumers before removing Plausible. If in doubt, keep it — at 5KB it is not a performance concern.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
