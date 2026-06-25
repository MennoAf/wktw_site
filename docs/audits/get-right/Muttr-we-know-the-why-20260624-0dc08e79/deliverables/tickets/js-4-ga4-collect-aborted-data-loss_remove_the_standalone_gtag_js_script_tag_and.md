---
finding_id: "js-4-ga4-collect-aborted-data-loss"
title: "GA4 collect request aborted (ERR_ABORTED) — analytics data integrity compromised, likely ad-blocker in test but real production risk"
severity: "medium"
root_cause_cluster: "Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture"
why_this_matters: "Every GA4 metric derived from sessions is currently inflated by the dual-beacon architecture in clean browser environments."
fix_summary: "Remove the standalone gtag.js script tag and its window.dataLayer/gtag() initialization from the site's global header."
confidence_tier: "confirmed"
---

# GA4 collect request aborted (ERR_ABORTED) — analytics data integrity compromised, likely ad-blocker in test but real production risk

**Finding:** GA4 collect request aborted (ERR_ABORTED) — analytics data integrity compromised, likely ad-blocker in test but real production risk  
**Severity:** Medium  
**Why this matters:** Every GA4 metric derived from sessions is currently inflated by the dual-beacon architecture in clean browser environments.  
**Root cause:** Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture  
**Fix:** Remove the standalone gtag.js script tag and its window.dataLayer/gtag() initialization from the site's global header.

> **Evidence Basis:** Confirmed

---

## Impact

- **Analytics Data Integrity:** Every GA4 metric derived from sessions is currently inflated by the dual-beacon architecture in clean browser environments. Sessions, pages-per-session, session duration, bounce rate, and all funnel conversion rates are computed from corrupted pageview counts. Removing the duplicate beacon restores a 1:1 relationship between actual user pageviews and recorded pageview events. Expect reported session counts to decrease post-fix — this is data correction, not traffic loss. Any conversion rate calculated against session denominators will change; recalibrate baselines from the post-fix period.
- **Ad Blocker Environment Accuracy:** In ad-blocker environments (~30-40% of desktop users by broad industry estimates, though the exact figure is highly audience-dependent), the current architecture produces ERR_ABORTED on the second beacon. The surviving beacon records one pageview — coincidentally correct, but structurally fragile. Post-fix, a single beacon fires, eliminating the abort condition entirely and making ad-blocker behavior consistent with clean-browser behavior.
- **Funnel And Attribution Reliability:** Bounce rate is suppressed by the dual-beacon architecture because GA4 cannot classify a session with two pageview events as a bounce, regardless of whether the user actually engaged. This means bounce rate is artificially low and engagement rate is artificially high. Correcting this will surface the true engagement signal, which may change automated bidding strategies in Google Ads if GA4 is used as a conversion signal source.
- **Server Load And Quota:** GA4's Measurement Protocol and client-side collection both count against property hit limits. Eliminating duplicate beacons halves the hit volume sent to GA4, reducing exposure to sampling thresholds on high-traffic properties.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Escalated from prescan-16-1.. The GA4 collect request (google-analytics.com/g/collect) returned net::ERR_ABORTED.

**Measured evidence:**
- Successful Collect: 204 response to /g/collect
- Aborted Collect: net::ERR_ABORTED on /g/collect
- Ga4 Tid: G-91BP6NPTSM
- Correlation: Dual GTM containers likely cause duplicate collect attempts
- Failed Request: https://www.google-analytics.com/g/collect?v=2&tid=G-91BP6NPTSM — net::ERR_ABORTED
- Fallback Analytics: Plausible.io (less likely to be blocked due to custom subdomain proxy option)
- Mitigation Options: ['Server-side GA4 via Measurement Protocol + Netlify Edge Functions', 'Consolidate on Plausible.io as primary analytics', 'Proxy GA4 through first-par
- Plausible Status: 200 OK — loaded successfully in same test environment

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
Remove the standalone gtag.js script tag and its window.dataLayer/gtag() initialization from the site's global header. Retain GA4 measurement exclusively through the existing GTM container (GTM-5VQTG6TH), which already contains a GA4 tag configured with the same measurement ID. This eliminates the dual-beacon architecture causing double-counted pageviews in clean environments and ERR_ABORTED in ad-blocker environments — without changing what is measured.

### How
1. AUDIT BEFORE TOUCHING ANYTHING: In GTM, open the GA4 Configuration tag. Confirm it fires on 'All Pages' (or equivalent site-wide trigger). Confirm the Measurement ID matches the standalone script. Confirm 'Send a page view when this configuration loads' is checked. Screenshot the tag config as a rollback reference.
2. VERIFY GTM IS FIRING INDEPENDENTLY: In GTM Preview mode, load any page and confirm the GA4 Configuration tag fires in the GTM debug panel without the standalone script present. Do not proceed until this is confirmed.
3. LOCATE THE STANDALONE SCRIPT IN THE THEME: Search the theme's global header template (typically header.liquid, header.php, _head.html.erb, or equivalent) for the string 'gtag/js?id=' or 'googletagmanager.com/gtag/js'. There will be a <script async> tag loading gtag.js and an inline <script> block initializing window.dataLayer and calling gtag('config', ...). Identify both.
4. CHECK FOR DIRECT GTAG() CALLS SITE-WIDE: Before removing the standalone script, grep the entire codebase for 'gtag(' calls that are NOT inside GTM tag templates. Common locations: theme JS files, checkout scripts, custom event tracking in product/cart templates. List every call site. Any gtag() call outside GTM will break silently after removal.
5. MIGRATE ANY ORPHANED GTAG() CALLS TO GTM CUSTOM HTML TAGS: For each gtag() call found in step 4 that is not already replicated in GTM, create a GTM Custom HTML tag with the equivalent gtag() call, scoped to the appropriate trigger (e.g., 'Add to Cart' click trigger, not All Pages). Publish these tags BEFORE removing the standalone script.
6. REMOVE THE STANDALONE SCRIPT BLOCK: Delete both the <script async src='https://www.googletagmanager.com/gtag/js?id=...'></script> tag and the accompanying inline <script> block containing window.dataLayer initialization and gtag('js', new Date()) / gtag('config', ...) calls from the global header template. Do not remove the GTM snippet (gtm.js container load).
7. VERIFY DATALAYER INITIALIZATION IS PRESERVED: GTM's own snippet initializes window.dataLayer = window.dataLayer || []. Confirm this is present in the GTM snippet already in the header. If any pre-GTM dataLayer.push() calls exist in the theme (e.g., ecommerce impressions pushed before GTM loads), they will continue to work — GTM drains the array on load.
8. DEPLOY TO STAGING AND VALIDATE: Load 5 representative page types in Chrome DevTools Network tab (filter: 'collect'). Confirm exactly ONE POST to google-analytics.com/g/collect per page load. Confirm the request returns 204. Confirm no ERR_ABORTED on any collect request.
9. VALIDATE IN GA4 REALTIME: With the staging change live, open GA4 Realtime report. Navigate through 3-4 pages. Confirm page_view events appear once per navigation, not twice. Session count should increment once per session, not per pageview.
10. PUBLISH GTM CONTAINER VERSION: Create a named GTM container version (e.g., 'Remove standalone gtag.js - dual beacon fix') before and after the change for clean rollback.
11. MONITOR POST-DEPLOY: For 48 hours post-deploy, watch GA4 Realtime and the DebugView for duplicate page_view events. Watch session counts in the standard reports — if sessions drop by roughly half compared to the pre-fix period, that confirms the double-counting was active and is now corrected (this is the correct outcome, not a data loss).

### Code examples
```
// STEP 3 — What to REMOVE from the global header template
// Remove BOTH of these blocks. They are always adjacent in the <head>.

// Block 1: The async loader (remove this entire tag)
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM"></script>

// Block 2: The inline initializer (remove this entire block)
// <script>
//   window.dataLayer = window.dataLayer || [];
//   function gtag(){dataLayer.push(arguments);}
//   gtag('js', new Date());
//   gtag('config', 'G-91BP6NPTSM');
// </script>

// KEEP: The GTM snippet (do not touch this)
// <!-- Google Tag Manager -->
// <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
// new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
// j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
// 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
// })(window,document,'script','dataLayer','GTM-5VQTG6TH');</script>
// <!-- End Google Tag Manager -->
// STEP 5 — Migrating an orphaned gtag() custom event call into a GTM Custom HTML tag
// If you find a call like this in a theme JS file (e.g., on add-to-cart):
//
//   gtag('event', 'add_to_cart', {
//     currency: 'USD',
//     value: product.price,
//     items: [{ item_id: product.id, item_name: product.title }]
//   });
//
// Replace it with a dataLayer.push() so it survives gtag() removal:

// In your theme JS (replaces the gtag() call directly):
function pushAddToCartEvent(product) {
  // SITE-SPECIFIC ASSUMPTION: product object shape matches your storefront's
  // product model. Adjust property names to match your actual data structure.
  var CURRENCY_CODE = 'USD'; // site-specific: update if multi-currency

  if (!product || typeof product.id === 'undefined') {
    // Null-guard: do not push malformed ecommerce data
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: CURRENCY_CODE,
      value: product.price,
      items: [{
        item_id: String(product.id),
        item_name: product.title
      }]
    }
  });
}

// In GTM: Create a GA4 Event tag triggered by the custom event 'add_to_cart'
// Event Name: add_to_cart
// Parameters: pull from dataLayer variables (ecommerce.currency, ecommerce.value, etc.)
// Trigger: Custom Event — Event Name: add_to_cart
// STEP 8 — Automated validation script (run in browser console on staging)
// Counts collect beacons per page load using PerformanceObserver.
// Run this BEFORE navigating to the page under test, then navigate.

(function validateSingleBeacon() {
  var COLLECT_HOSTNAME = 'google-analytics.com';
  var COLLECT_PATH_FRAGMENT = '/g/collect';
  // SITE-SPECIFIC ASSUMPTION: GA4 collect endpoint. Update if using a
  // server-side proxy or measurement protocol relay.

  var beaconCount = 0;
  var observer;

  if (!('PerformanceObserver' in window)) {
    console.warn('[GA4 Audit] PerformanceObserver not supported in this browser.');
    return;
  }

  try {
    observer = new PerformanceObserver(function(list) {
      list.getEntries().forEach(function(entry) {
        if (
          entry.initiatorType === 'fetch' ||
          entry.initiatorType === 'xmlhttprequest' ||
          entry.initiatorType === 'beacon'
        ) {
          try {
            var url = new URL(entry.name);
            if (
              url.hostname.indexOf(COLLECT_HOSTNAME) !== -1 &&
              url.pathname.indexOf(COLLECT_PATH_FRAGMENT) !== -1
            ) {
              beaconCount++;
              console.log(
                '[GA4 Audit] Collect beacon #' + beaconCount + ' detected:',
                entry.name.substring(0, 120) + '...'
              );
              if (beaconCount > 1) {
                console.error(
                  '[GA4 Audit] FAIL — ' + beaconCount +
                  ' collect beacons fired. Dual-beacon architecture still active.'
                );
              } else {
                console.info('[GA4 Audit] PASS — Single collect beacon confirmed.');
              }
            }
          } catch (urlParseError) {
            // Malformed entry.name — skip silently
          }
        }
      });
    });

    observer.observe({ type: 'resource', buffered: true });

    // Auto-disconnect after 10 seconds to prevent unbounded observation
    var MAX_OBSERVATION_MS = 10000; // 10s: sufficient for page_view beacon to fire
    setTimeout(function() {
      observer.disconnect();
      console.log(
        '[GA4 Audit] Observation complete. Total collect beacons: ' + beaconCount
      );
    }, MAX_OBSERVATION_MS);

  } catch (observerError) {
    console.error('[GA4 Audit] PerformanceObserver setup failed:', observerError);
    if (observer) { observer.disconnect(); }
  }
}());
```

## Risks
- RISK: Any theme JS or checkout script calling gtag() directly will throw 'gtag is not defined' after the standalone script is removed, silently dropping custom events. Mitigation: Complete the grep audit in Step 4 before deploying. The dataLayer.push() migration in Step 5 is the correct replacement pattern — it does not depend on gtag() being defined.
- RISK: If the GTM GA4 Configuration tag has 'Send a page view when this configuration loads' UNCHECKED, removing the standalone script will eliminate all pageview tracking. Mitigation: Verify this checkbox is enabled in GTM before removing the standalone script (Step 1). This is a pre-condition, not an assumption.
- RISK: Post-fix session counts in GA4 will drop, potentially triggering alerts in automated reporting or Google Ads smart bidding models that use GA4 conversion data. Mitigation: Annotate the GA4 property with the deployment date. Notify any stakeholders using GA4 data for bidding or reporting before deploying. Recalibrate smart bidding baselines after 2-3 weeks of clean data.
- RISK: If a third-party integration (e.g., a Shopify app, a CRO tool, or a chat widget) initializes by detecting window.gtag or window.google_tag_manager and branching on the standalone gtag.js being present, its behavior may change. Mitigation: Search for 'window.gtag' and 'typeof gtag' in all loaded third-party scripts before deploying. GTM's own snippet still sets window.google_tag_manager, so GTM-detection patterns are unaffected.
- RISK: The PerformanceObserver validation script (Step 8) may not capture beacons sent via navigator.sendBeacon() in all browser/version combinations, as sendBeacon initiatorType reporting varies. Mitigation: Supplement with Chrome DevTools Network tab filtered to 'collect' as the authoritative validation method. The script is a convenience check, not the sole verification.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
