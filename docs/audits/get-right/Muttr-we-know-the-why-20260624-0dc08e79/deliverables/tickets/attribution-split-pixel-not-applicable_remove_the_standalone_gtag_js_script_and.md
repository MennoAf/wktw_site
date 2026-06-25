---
finding_id: "attribution-split-pixel-not-applicable"
title: "No heavy advertising pixels detected — split-pixel strategy not required"
severity: "low"
root_cause_cluster: "Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture"
why_this_matters: "Removing the standalone gtag.js eliminates one render-blocking or async-competing script request to googletagmanager.com on every page load."
fix_summary: "Remove the standalone gtag.js script and consolidate all GA4 tracking exclusively through the existing GTM container."
confidence_tier: "confirmed"
---

# No heavy advertising pixels detected — split-pixel strategy not required

**Finding:** No heavy advertising pixels detected — split-pixel strategy not required  
**Severity:** Low  
**Why this matters:** Removing the standalone gtag.js eliminates one render-blocking or async-competing script request to googletagmanager.com on every page load.  
**Root cause:** Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture  
**Fix:** Remove the standalone gtag.js script and consolidate all GA4 tracking exclusively through the existing GTM container.

> **Evidence Basis:** Confirmed

---

## Impact

- **Page Load Performance:** Removing the standalone gtag.js eliminates one render-blocking or async-competing script request to googletagmanager.com on every page load. Removing GTM entirely eliminates the GTM container fetch (~100KB+ depending on container size) and its associated DNS lookup, TLS handshake, and script parse/execute cycle. The combined reduction in third-party script overhead directly reduces main thread blocking time during page load, which improves Time to Interactive and INP baseline.
- **Data Integrity:** The ERR_ABORTED collect beacon is caused by two GA4 collect requests racing to the same endpoint — the browser cancels the duplicate in-flight request. This means a measurable fraction of page view events are being silently dropped from GA4 reporting. Removing the duplicate load eliminates the race condition and restores 1:1 parity between actual page views and recorded GA4 sessions.
- **Analytics Cost And Complexity:** The current 290KB analytics payload (GTM container + standalone gtag.js + Plausible) is architecturally disproportionate to a zero-pixel, zero-conversion-event tracking stack. Consolidating to Plausible-only reduces the analytics payload to Plausible's ~1KB script, eliminates two third-party DNS dependencies (googletagmanager.com, google-analytics.com), and removes the operational surface area for future misconfiguration.
- **Gdpr And Privacy Exposure:** GA4 and GTM both set first-party cookies and transmit user identifiers to Google's infrastructure. Plausible is cookieless and does not transmit personal data to third parties. Removing GA4/GTM from a site with no advertising use case reduces the regulatory surface area under GDPR and ePrivacy Directive — fewer consent obligations, fewer data processing agreements to maintain, and reduced risk of pre-consent data transmission violations.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** No advertising pixels (Meta/Facebook, TikTok, Pinterest, LinkedIn Insight, etc.) were detected in network requests or script inventory.. The only tracking is analytics (GA4 + Plausible).

**Measured evidence:**
- Advertising Pixels Detected: []
- Tracking Domains: ['www.googletagmanager.com', 'www.google-analytics.com', 'plausible.io']
- Heavy Pixel Count: 0

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
Remove the standalone gtag.js script and consolidate all GA4 tracking exclusively through the existing GTM container. Then evaluate whether GTM itself is justified given zero advertising pixels and zero conversion event instrumentation — if not, replace the entire stack with Plausible-only and remove GTM entirely.

### How
PHASE 1 — CONFIRM DUAL-LOAD (prerequisite, do not skip):
1. Open Chrome DevTools > Network > filter by 'collect'. Load the page. Confirm two requests to 'https://www.google-analytics.com/g/collect' fire within the same page session. If only one fires, the duplication has already been resolved — stop here.
2. In DevTools > Sources, search all loaded scripts for 'gtag(' and 'GA_MEASUREMENT_ID' (or the live measurement ID). Identify whether the standalone gtag.js is loaded via a <script src='https://www.googletagmanager.com/gtag/js?id=G-...'> tag in the raw HTML <head>, separate from GTM.
3. In GTM > Workspace > Tags, confirm a GA4 Configuration tag exists, is set to fire on 'All Pages', and contains the same Measurement ID as the standalone script. Screenshot both for the change record.
PHASE 2 — REMOVE STANDALONE gtag.js (the surgical fix):
4. In the site's theme/template global <head> (e.g., Shopify: theme.liquid, WordPress: header.php or functions.php, custom: _document.js or index.html), locate and remove ONLY the two lines comprising the standalone GA4 snippet: the <script async src='https://www.googletagmanager.com/gtag/js?id=G-...'> tag and the inline <script> block containing window.dataLayer, gtag('js',...), gtag('config',...).
5. Do NOT remove the GTM snippet (<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-...')</script>). GTM remains the sole GA4 delivery mechanism.
6. Deploy to staging. Verify in Network tab: exactly one 'collect' request fires per page view. Verify in GA4 DebugView: sessions are recorded. Verify no ERR_ABORTED on the collect endpoint.
PHASE 3 — EVALUATE GTM RETENTION (decision gate, not automatic):
7. Audit the live GTM container: export the container JSON (Admin > Export Container). Count tags, triggers, and variables. If the container contains ONLY the GA4 Configuration tag and zero custom event tags, zero advertising pixels, and zero custom variable logic — GTM is providing zero value over a direct gtag snippet or Plausible alone.
8. Decision A — GTM is retained: justified ONLY if the team has a documented roadmap for adding advertising pixels or conversion events within 90 days. Document this decision in the change record.
9. Decision B — GTM is removed: proceed to Phase 4.
PHASE 4 — GTM REMOVAL AND PLAUSIBLE-ONLY MIGRATION (if Decision B):
10. Confirm Plausible is already loading and recording sessions (it is, per the finding). Verify Plausible goals/events cover all current measurement requirements.
11. Remove the GTM container snippet from the global <head> entirely.
12. If any remaining gtag() calls exist in the codebase (e.g., inline onclick handlers, ecommerce push calls), audit each: if they were firing into the now-removed GA4 config, remove them. If they are needed for future GA4 re-integration, comment them out with a dated TODO rather than deleting.
13. Deploy to staging. Confirm Network tab shows zero requests to googletagmanager.com and zero requests to google-analytics.com/g/collect. Confirm Plausible dashboard continues recording.
14. Monitor GA4 for 48 hours post-production deploy to confirm session counts drop to zero (expected — GA4 is intentionally removed). Confirm Plausible session counts are stable and not inflated.

### Code examples
```
// ─── PHASE 1: Detect dual GA4 load programmatically (run in DevTools console) ───
// Precondition: page is fully loaded. Checks for duplicate gtag config calls.
// This is diagnostic only — do not ship this to production.
(function detectDualGA4() {
  const EXPECTED_MAX_CONFIGS = 1; // site-specific assumption: one GA4 property
  const dataLayer = window.dataLayer;
  if (!Array.isArray(dataLayer)) {
    console.warn('[GA4 Audit] dataLayer not found — GTM may not be loaded.');
    return;
  }
  const configCalls = dataLayer.filter(
    function(entry) {
      return Array.isArray(entry) && entry[0] === 'config' &&
        typeof entry[1] === 'string' && entry[1].startsWith('G-');
    }
  );
  if (configCalls.length > EXPECTED_MAX_CONFIGS) {
    console.error(
      '[GA4 Audit] DUAL LOAD CONFIRMED: ' + configCalls.length +
      ' gtag("config") calls detected in dataLayer. Measurement IDs: ' +
      configCalls.map(function(e) { return e[1]; }).join(', ')
    );
  } else {
    console.info('[GA4 Audit] Single GA4 config detected. No duplication.');
  }
}());
// ─── PHASE 2: Standalone gtag.js snippet to REMOVE from global <head> ───
// Locate this exact pattern in theme.liquid / header.php / _document.js.
// Remove both the <script src> tag and the inline <script> block below it.
// DO NOT remove the GTM snippet — only these two blocks.

// REMOVE THIS (the async loader):
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>

// REMOVE THIS (the inline config — the exact block varies but matches this shape):
// <script>
//   window.dataLayer = window.dataLayer || [];
//   function gtag(){dataLayer.push(arguments);}
//   gtag('js', new Date());
//   gtag('config', 'G-XXXXXXXXXX');
// </script>

// KEEP THIS (GTM remains the sole delivery mechanism):
// <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
// new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
// j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
// 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
// })(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
// ─── PHASE 3: GTM container audit — export and count tags (Node.js script) ───
// Run against the exported GTM container JSON (Admin > Export Container > JSON).
// Precondition: containerExport.json is the raw GTM export file.
// Outputs a decision-ready summary of container complexity.

const fs = require('fs');

// SITE-SPECIFIC ASSUMPTION: update path to match your export location
const CONTAINER_EXPORT_PATH = './containerExport.json';

// Thresholds below which GTM provides no meaningful value over a direct snippet
const GTM_JUSTIFIED_TAG_MINIMUM = 2;    // at least 2 distinct tag types
const GTM_JUSTIFIED_PIXEL_MINIMUM = 1;  // at least 1 advertising pixel

try {
  const raw = fs.readFileSync(CONTAINER_EXPORT_PATH, 'utf8');
  const container = JSON.parse(raw);
  const tags = container?.containerVersion?.tag ?? [];
  const triggers = container?.containerVersion?.trigger ?? [];
  const variables = container?.containerVersion?.variable ?? [];

  const advertisingTypes = ['img', 'sp', 'fls', 'awct', 'flc', 'baut', 'tdc'];
  // GTM type identifiers for common ad pixels (Floodlight, Ads Conversion, etc.)
  const adTags = tags.filter(function(t) {
    return advertisingTypes.includes(t.type);
  });

  console.log('=== GTM Container Audit ===');
  console.log('Total tags:      ', tags.length);
  console.log('Total triggers:  ', triggers.length);
  console.log('Total variables: ', variables.length);
  console.log('Ad pixel tags:   ', adTags.length);
  console.log('Tag names:       ', tags.map(function(t) { return t.name; }).join(', '));

  if (adTags.length < GTM_JUSTIFIED_PIXEL_MINIMUM && tags.length < GTM_JUSTIFIED_TAG_MINIMUM) {
    console.warn(
      '\n[DECISION] GTM is NOT justified at current complexity. ' +
      'Recommend removal and Plausible-only stack unless advertising pixels are planned within 90 days.'
    );
  } else {
    console.info('\n[DECISION] GTM complexity justifies retention.');
  }
} catch (err) {
  console.error('Failed to parse container export:', err.message);
}
// ─── PHASE 4: Post-removal verification (run in DevTools console after deploy) ───
// Precondition: page is fully loaded on staging after GTM/gtag removal.
// Confirms no GA4 or GTM network requests are in-flight.
// Safe to run in production console for spot-checks.
(function verifyCleanStack() {
  const FORBIDDEN_ORIGINS = [
    'www.googletagmanager.com',
    'www.google-analytics.com'
  ];
  // PerformanceResourceTiming is broadly supported (>97% global coverage)
  if (!('performance' in window) || typeof window.performance.getEntriesByType !== 'function') {
    console.warn('[Stack Verify] PerformanceResourceTiming not available in this browser.');
    return;
  }
  const resources = window.performance.getEntriesByType('resource');
  const violations = resources.filter(function(entry) {
    return FORBIDDEN_ORIGINS.some(function(origin) {
      return entry.name.includes(origin);
    });
  });
  if (violations.length > 0) {
    console.error(
      '[Stack Verify] FAIL — ' + violations.length +
      ' request(s) to forbidden origins detected after removal:'
    );
    violations.forEach(function(v) { console.error('  ', v.name); });
  } else {
    console.info('[Stack Verify] PASS — No GTM or GA4 requests detected. Plausible-only stack confirmed.');
  }
}());
```

## Risks
- RISK: GTM may be used for non-analytics tags not visible in the GA4 audit (e.g., heatmap tools, chat widget injection, A/B test scripts). Mitigation: export and fully read the GTM container JSON before removal. Do not proceed with GTM removal until every tag's purpose is confirmed. If any non-GA4 tag exists, retain GTM and execute Phase 2 only.
- RISK: Removing the standalone gtag.js may break inline gtag() calls elsewhere in the codebase (e.g., ecommerce event pushes, custom event handlers) that depend on the globally scoped gtag function being initialized by the standalone snippet rather than GTM. Mitigation: grep the entire codebase for 'gtag(' before removal. Any call site that is not inside a GTM custom HTML tag must be audited. If GTM is retained, these calls will continue to work because GTM initializes the same global gtag function. If GTM is also removed, these call sites must be removed or replaced with Plausible goal tracking.
- RISK: GA4 historical data continuity. Removing GA4 ends data collection into the GA4 property. If the team later decides to re-enable GA4, historical continuity will be broken from the removal date. Mitigation: document the removal date in the GA4 property notes. Export any critical historical reports before removal. This is an acceptable trade-off only if the team has confirmed Plausible meets all current reporting needs.
- RISK: The ERR_ABORTED collect beacon may be misattributed to an ad blocker by stakeholders reviewing the fix. Mitigation: capture a before/after Network waterfall screenshot showing the aborted request present before the fix and absent after. Include this in the change record to prevent the fix from being reverted based on a misdiagnosis.
- RISK: Phase 3 GTM container audit script uses the exported JSON schema, which varies between GTM container versions. The tag.type field values used to detect advertising pixels are based on GTM's internal type identifiers as of 2024 — these are stable but not formally documented by Google. Mitigation: cross-reference the tag list output against the GTM UI tag list visually before making the removal decision. The script is a decision aid, not a sole authority.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
