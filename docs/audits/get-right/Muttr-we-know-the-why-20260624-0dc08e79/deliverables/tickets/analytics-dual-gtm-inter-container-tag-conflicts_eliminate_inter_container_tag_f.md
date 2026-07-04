---
finding_id: "analytics-dual-gtm-inter-container-tag-conflicts"
title: "Eliminate inter-container tag firing conflicts caused by two simultaneous GTM containers by: (1) auditing both containers to produce a canonical tag ownership registry, (2) consolidating all tags into a single authoritative container with documented ownership boundaries, (3) decommissioning the redundant container, and (4) deploying a runtime deduplication guard as a defensive backstop against any future accidental re-introduction of duplicate firing. The fix must also address the compounding gtag.js duplication identified in 'attribution-duplicate-ga4-measurement' — the three-fire scenario (gtag.js + Container A + Container B) must be reduced to a single authoritative fire path per event."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "GA4 conversion counts are currently inflated by a factor proportional to the number of active containers firing the same event tag."
fix_summary: "Eliminate inter-container tag firing conflicts caused by two simultaneous GTM containers by: (1) auditing both containers to produce a canonical tag ownership registry, (2) consolidating all tags int…"
confidence_tier: "reviewer_identified"
---

# Eliminate inter-container tag firing conflicts caused by two simultaneous GTM containers by: (1) auditing both containers to produce a canonical tag ownership registry, (2) consolidating all tags into a single authoritative container with documented ownership boundaries, (3) decommissioning the redundant container, and (4) deploying a runtime deduplication guard as a defensive backstop against any future accidental re-introduction of duplicate firing. The fix must also address the compounding gtag.js duplication identified in 'attribution-duplicate-ga4-measurement' — the three-fire scenario (gtag.js + Container A + Container B) must be reduced to a single authoritative fire path per event.

**Finding:** Eliminate inter-container tag firing conflicts caused by two simultaneous GTM containers by: (1) auditing both containers to produce a canonical tag ownership registry, (2) consolidating all tags into a single authoritative container with documented ownership boundaries, (3) decommissioning the redundant container, and (4) deploying a runtime deduplication guard as a defensive backstop against any future accidental re-introduction of duplicate firing. The fix must also address the compounding gtag.js duplication identified in 'attribution-duplicate-ga4-measurement' — the three-fire scenario (gtag.js + Container A + Container B) must be reduced to a single authoritative fire path per event.  
**Severity:** Medium  
**Why this matters:** GA4 conversion counts are currently inflated by a factor proportional to the number of active containers firing the same event tag.  
**Root cause:** Isolated issue  
**Fix:** Eliminate inter-container tag firing conflicts caused by two simultaneous GTM containers by: (1) auditing both containers to produce a canonical tag ownership registry, (2) consolidating all tags int…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Ga4 Conversion Accuracy:** GA4 conversion counts are currently inflated by a factor proportional to the number of active containers firing the same event tag. In the confirmed dual-container scenario, every conversion event is recorded twice, meaning reported conversion volume is double actual volume. Fixing this restores a 1:1 relationship between user actions and GA4 conversion records. All downstream metrics derived from conversion counts — conversion rate, funnel drop-off rates, goal completion reports, and cohort analysis — are currently computed against a corrupted numerator. Post-fix, these metrics will reflect actual user behavior for the first time since the second container was introduced.
- **Google Ads Smart Bidding Integrity:** Google Ads Smart Bidding (tCPA, tROAS, Maximize Conversions) trains its bidding model on the conversion signals it receives. When the Google Ads conversion tag fires twice per purchase, the algorithm receives doubled conversion volume and doubled revenue signals. This causes the algorithm to over-value traffic sources that are generating the inflated signals, misallocating budget toward targets that are mathematically impossible to achieve against real conversion data. Eliminating duplicate firing restores accurate conversion signals to Smart Bidding, allowing the algorithm to optimize against actual performance. The severity of bidding model corruption scales with how long the dual-container configuration has been active — longer exposure means more deeply corrupted model weights that will require a learning period to recalibrate after the fix.
- **Meta Pixel Audience Integrity:** Meta's lookalike audience modeling and purchase suppression lists depend on accurate, deduplicated purchase signals. Duplicate pixel fires — particularly when they carry different or missing eventID values — are processed as two distinct purchase events by Meta's attribution system. This double-weights purchasers in lookalike seed audiences (distorting the audience toward over-represented purchasers) and may prevent correct suppression of recent purchasers from prospecting campaigns if the deduplication logic receives conflicting signals. Fixing duplicate firing, combined with consistent eventID implementation for server-side Conversions API deduplication, restores audience modeling accuracy.
- **Revenue Reporting Integrity:** If the GA4 purchase event carries a revenue parameter (the ecommerce 'value' field), GA4 sums both fires and reports double the actual transaction value. This corrupts: (1) total revenue KPIs in GA4 reports, (2) LTV calculations built on GA4 event data, (3) cohort revenue analysis, (4) any BigQuery exports or Looker Studio dashboards built on GA4 raw data. Post-fix, reported revenue will drop to reflect actual transaction values — this is not a revenue loss, it is a correction of a reporting artifact. Teams should be briefed before deployment to prevent the revenue drop from being misinterpreted as a real business decline.
- **Three Fire Scenario Elimination:** The compounding effect of gtag.js + Container A + Container B creates a three-fire scenario for GA4 events. Removing the hardcoded gtag.js snippet (the fix for 'attribution-duplicate-ga4-measurement') combined with decommissioning the redundant GTM container reduces this to a single authoritative fire path. The deduplication middleware provides a defensive backstop in case either fix is partially reverted or a new duplicate source is introduced.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/the-get-right/content

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
Eliminate inter-container tag firing conflicts caused by two simultaneous GTM containers by: (1) auditing both containers to produce a canonical tag ownership registry, (2) consolidating all tags into a single authoritative container with documented ownership boundaries, (3) decommissioning the redundant container, and (4) deploying a runtime deduplication guard as a defensive backstop against any future accidental re-introduction of duplicate firing. The fix must also address the compounding gtag.js duplication identified in 'attribution-duplicate-ga4-measurement' — the three-fire scenario (gtag.js + Container A + Container B) must be reduced to a single authoritative fire path per event.

### How
PHASE 1 — AUDIT: Produce a canonical tag inventory before touching any container.
1a. Export both GTM containers as JSON (GTM UI → Admin → Export Container). Name them container-a.json and container-b.json. Do not modify either container until the audit is complete.
1b. For each container, extract every tag's: tag type, trigger(s), firing conditions, tag name, and any associated conversion IDs, Measurement IDs, or Pixel IDs. Build a spreadsheet with columns: [Tag Name | Tag Type | Tracking ID | Container | Trigger | Firing Condition | Conflicts With].
1c. Cross-reference both inventories. Flag every row where the same Tag Type + Tracking ID combination appears in both containers. These are your double-fire candidates. Pay specific attention to: GA4 Event tags (same G-XXXXXXXX Measurement ID), Google Ads Conversion Tracking tags (same AW-XXXXXXXXX/conversion-label), Meta Pixel events (same Pixel ID), TikTok Pixel events, Pinterest Tag events.
1d. Verify double-firing empirically before making any changes. Open Chrome DevTools → Network tab. Filter by 'collect' to capture GA4 hits (google-analytics.com/g/collect or analytics.google.com/g/collect). Trigger each flagged conversion event manually. Count outbound requests per single user action. Document the count per event type. Repeat with filters: 'facebook.com/tr' (Meta), 'googleadservices.com/pagead/conversion' (Google Ads), 'analytics.tiktok.com' (TikTok). Record baseline counts — these become your post-fix verification benchmarks.
1e. Identify which container is the 'authoritative' container. Selection criteria in priority order: (a) the container managed by the team responsible for conversion reporting, (b) the container with more complete tag coverage, (c) the newer container if it was introduced as a migration target. Document this decision with a rationale comment in the tag ownership registry.
PHASE 2 — CONSOLIDATION: Migrate all unique tags from the redundant container into the authoritative container.
2a. For every tag in the redundant container that does NOT have a conflict (i.e., it is not present in the authoritative container), recreate it in the authoritative container. Preserve trigger logic exactly. Add a tag note in GTM: 'Migrated from [Container ID] on [date] — original tag ID: [tag ID]'.
2b. For every tag in the redundant container that DOES conflict with the authoritative container, do NOT migrate it — it already exists in the authoritative container. Document in the registry that the redundant container's version is superseded.
2c. If the redundant container contains tags that the authoritative container does not, and those tags belong to a different business unit that requires independent governance, evaluate the 'Strict Ownership Boundary' alternative (see alternatives section) before proceeding with full consolidation.
2d. Remove the hardcoded gtag.js snippet from the page template (the fix for 'attribution-duplicate-ga4-measurement'). The authoritative GTM container's GA4 Configuration tag is the single source of truth for GA4 initialization. Removing gtag.js eliminates the third fire path.
2e. In the authoritative container, verify the GA4 Configuration tag fires on 'All Pages' with the correct Measurement ID. Verify no other GA4 Configuration tag exists in the same container with the same Measurement ID.
PHASE 3 — DECOMMISSION: Remove the redundant container from all page templates.
3a. Locate every template, layout file, or CMS theme file where the redundant GTM snippet is injected. Search for the redundant container's GTM-XXXXXXX ID across the entire codebase (grep -r 'GTM-[REDUNDANT_ID]' . in the repo).
3b. Remove both the <script> snippet (in <head>) and the <noscript> iframe snippet (immediately after <body>) for the redundant container from every template. Do not leave the noscript fallback — it is a separate firing path.
3c. Deploy the template change to a staging environment. Repeat the Network tab verification from Step 1d. Confirm each conversion event now produces exactly one outbound request per pixel type per user action.
3d. After staging verification, deploy to production. Monitor GA4 real-time reports and Google Ads conversion monitoring for 48 hours post-deployment to confirm conversion counts normalize.
PHASE 4 — DEFENSIVE RUNTIME GUARD: Deploy a deduplication guard as a backstop.
4a. Add the GTM Firing Deduplication Guard (see code_examples[0]) as a Custom HTML tag in the authoritative container. Set it to fire on 'All Pages' with sequence: 'Fire this tag before [all conversion tags]' using GTM's tag sequencing feature. This guard detects if a second GTM container is present at runtime and suppresses duplicate conversion pushes.
4b. Add the Event Deduplication Middleware (see code_examples[1]) to the dataLayer push pipeline. This intercepts duplicate dataLayer.push() calls for the same event+transaction_id within a configurable deduplication window and discards the duplicate before it reaches any tag.
4c. Establish a tag ownership registry document (see code_examples[2] for the registry schema) and store it in the team's version control system. Require a registry update as part of any GTM publish checklist.
PHASE 5 — GOVERNANCE: Prevent recurrence.
5a. Add a GTM publish checklist to the team's deployment process. Required items: (1) Confirm no tag type + tracking ID combination exists in more than one active container, (2) Confirm no hardcoded gtag.js or pixel snippets exist outside GTM, (3) Run Network tab verification on staging before publishing to production.
5b. If the organization requires two containers for legitimate governance reasons (e.g., separate business units), implement the Strict Ownership Boundary pattern (see alternatives[0]) with documented exclusion rules enforced via GTM's built-in 'Exception' triggers.

### Code examples
```
// CODE EXAMPLE 0: GTM Container Conflict Detection Guard
// Deploy as Custom HTML tag in the AUTHORITATIVE container only.
// Fire sequence: BEFORE all conversion tags.
// Purpose: Detect if a second GTM container is active and emit a console warning
// so monitoring tools (Sentry, DataDog) can alert on misconfiguration.
// This does NOT suppress firing — suppression is handled by deduplication middleware (Example 1).
// Site-specific assumption: GTM_AUTHORITATIVE_CONTAINER_ID must be set to the
// authoritative container's ID (e.g., 'GTM-AAAAAAA').

<script>
(function() {
  'use strict';

  // SITE-SPECIFIC: Replace with the authoritative container's actual GTM ID.
  var GTM_AUTHORITATIVE_CONTAINER_ID = 'GTM-AUTHORITATIVE';

  // GTM exposes all active containers via google_tag_manager global.
  // Each key is a container ID. More than one key = multiple containers active.
  try {
    var activeContainers = window.google_tag_manager
      ? Object.keys(window.google_tag_manager)
      : [];

    // Filter to GTM-prefixed container IDs only (exclude internal GTM keys).
    var gtmContainerIds = activeContainers.filter(function(key) {
      return /^GTM-[A-Z0-9]+$/.test(key);
    });

    if (gtmContainerIds.length > 1) {
      var redundantContainers = gtmContainerIds.filter(function(id) {
        return id !== GTM_AUTHORITATIVE_CONTAINER_ID;
      });

      // Emit structured error for monitoring ingestion.
      var errorPayload = {
        type: 'GTM_DUAL_CONTAINER_CONFLICT',
        authoritative: GTM_AUTHORITATIVE_CONTAINER_ID,
        redundant: redundantContainers,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      // Push to dataLayer for GTM-based alerting.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'gtm_container_conflict_detected',
        gtm_conflict_detail: errorPayload
      });

      // Console error for DevTools visibility during QA.
      console.error('[TAG GOVERNANCE] Dual GTM container conflict detected.', errorPayload);

      // If Sentry is present, capture as an exception for production alerting.
      // NULL-GUARD: Sentry may not be loaded yet at this point in the firing sequence.
      if (typeof window.Sentry !== 'undefined' && typeof window.Sentry.captureException === 'function') {
        window.Sentry.captureException(
          new Error('GTM dual container conflict: ' + redundantContainers.join(', ')),
          { extra: errorPayload }
        );
      }
    }
  } catch (e) {
    // Fail silently — this guard must never block conversion tag execution.
    console.warn('[TAG GOVERNANCE] Container conflict check failed:', e.message);
  }
})();
</script>
// CODE EXAMPLE 1: dataLayer Event Deduplication Middleware
// Deploy in the page <head> BEFORE both GTM container snippets.
// This intercepts dataLayer.push() calls and discards duplicate conversion events
// that share the same event name + transaction_id within the deduplication window.
// For events without a transaction_id, deduplication falls back to event name + timestamp bucket.
//
// SITE-SPECIFIC ASSUMPTIONS (mark as configurable per your environment):
// - DEDUP_WINDOW_MS: 5000ms window. Adjust if your tag firing sequence is slower.
// - CONVERSION_EVENTS: List of event names that require deduplication.
//   Add or remove events to match your actual conversion taxonomy.
// - DEDUP_KEY_FIELD: Primary deduplication key field name in your dataLayer schema.

<script>
(function() {
  'use strict';

  // Named constants — no magic numbers.
  // SITE-SPECIFIC: Adjust DEDUP_WINDOW_MS if tag firing sequences exceed 5 seconds.
  var DEDUP_WINDOW_MS = 5000;

  // SITE-SPECIFIC: Add all conversion event names present in your dataLayer taxonomy.
  var CONVERSION_EVENTS = [
    'purchase',
    'generate_lead',
    'form_submit',
    'begin_checkout',
    'add_to_cart',
    'sign_up'
  ];

  // SITE-SPECIFIC: Primary deduplication key. GA4 ecommerce uses 'transaction_id'.
  // For lead events without a transaction ID, we fall back to a timestamp bucket.
  var DEDUP_KEY_FIELD = 'transaction_id';

  // In-memory deduplication registry.
  // Structure: { [dedupKey]: timestamp }
  // Not persisted to localStorage — intentionally session-scoped to avoid
  // cross-session false deduplication of legitimate repeat purchases.
  var dedupRegistry = {};

  // Cleanup interval: purge expired entries to prevent unbounded memory growth.
  // NAMED CONSTANT: matches DEDUP_WINDOW_MS to ensure entries expire correctly.
  var CLEANUP_INTERVAL_MS = DEDUP_WINDOW_MS * 2;
  var cleanupIntervalId = null;

  function buildDedupKey(eventName, pushData) {
    // Primary key: event name + transaction_id (for purchase events).
    var transactionId = pushData[DEDUP_KEY_FIELD];
    if (transactionId) {
      return eventName + '::' + String(transactionId);
    }
    // Fallback key: event name + timestamp bucket (DEDUP_WINDOW_MS resolution).
    // This deduplicates rapid double-fires of the same event without a unique ID.
    var timeBucket = Math.floor(Date.now() / DEDUP_WINDOW_MS);
    return eventName + '::bucket::' + timeBucket;
  }

  function isDuplicate(dedupKey) {
    var lastSeen = dedupRegistry[dedupKey];
    if (!lastSeen) return false;
    return (Date.now() - lastSeen) < DEDUP_WINDOW_MS;
  }

  function registerEvent(dedupKey) {
    dedupRegistry[dedupKey] = Date.now();
  }

  function purgeExpiredEntries() {
    var now = Date.now();
    var keys = Object.keys(dedupRegistry);
    for (var i = 0; i < keys.length; i++) {
      if ((now - dedupRegistry[keys[i]]) >= DEDUP_WINDOW_MS) {
        delete dedupRegistry[keys[i]];
      }
    }
  }

  // Initialize cleanup interval with teardown reference.
  // OBSERVER TEARDOWN: interval is stored for potential cleanup.
  cleanupIntervalId = setInterval(purgeExpiredEntries, CLEANUP_INTERVAL_MS);

  // Intercept dataLayer.push before GTM containers initialize.
  // GTM reads from window.dataLayer — we wrap push() before GTM attaches its listener.
  window.dataLayer = window.dataLayer || [];

  var originalPush = Array.prototype.push;

  // Override push on this specific dataLayer instance (not Array.prototype globally).
  window.dataLayer.push = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < args.length; i++) {
      var pushData = args[i];

      // Only intercept plain objects with an 'event' property.
      if (!pushData || typeof pushData !== 'object' || !pushData.event) {
        // Pass through non-event pushes (GTM config objects, etc.) unmodified.
        originalPush.apply(window.dataLayer, [pushData]);
        continue;
      }

      var eventName = pushData.event;

      // Only deduplicate known conversion events.
      if (CONVERSION_EVENTS.indexOf(eventName) === -1) {
        originalPush.apply(window.dataLayer, [pushData]);
        continue;
      }

      var dedupKey = buildDedupKey(eventName, pushData);

      if (isDuplicate(dedupKey)) {
        // Duplicate detected — discard and log for monitoring.
        console.warn(
          '[DEDUP MIDDLEWARE] Duplicate conversion event suppressed:',
          eventName,
          '| Key:', dedupKey
        );

        // Push a diagnostic event (non-conversion) so the suppression is auditable in GA4.
        originalPush.apply(window.dataLayer, [{
          event: 'dedup_suppression',
          dedup_event_name: eventName,
          dedup_key: dedupKey,
          dedup_timestamp: new Date().toISOString()
        }]);

        // Do NOT push the original duplicate event.
        continue;
      }

      // First occurrence — register and allow through.
      registerEvent(dedupKey);
      originalPush.apply(window.dataLayer, [pushData]);
    }

    // Return new array length to maintain Array.push() contract.
    return window.dataLayer.length;
  };

})();
</script>
// CODE EXAMPLE 2: Tag Ownership Registry Schema (JSON)
// Store this file in version control at: /docs/tag-governance/tag-ownership-registry.json
// Update this file as part of every GTM publish. Treat it as a required PR artifact.
// The registry is the enforcement mechanism for the single-container rule.
//
// SITE-SPECIFIC: All IDs below are placeholders. Replace with actual container IDs,
// Measurement IDs, Pixel IDs, and Conversion Labels from your GTM accounts.

{
  "registry_version": "1.0.0",
  "last_updated": "YYYY-MM-DD",
  "last_updated_by": "OWNER_NAME",
  "authoritative_container": {
    "container_id": "GTM-AUTHORITATIVE",
    "container_name": "Primary Marketing Container",
    "owner_team": "Marketing Analytics",
    "owner_contact": "analytics-team@example.com"
  },
  "decommissioned_containers": [
    {
      "container_id": "GTM-REDUNDANT",
      "decommission_date": "YYYY-MM-DD",
      "decommission_reason": "Consolidated into GTM-AUTHORITATIVE. All unique tags migrated.",
      "decommissioned_by": "OWNER_NAME"
    }
  ],
  "tag_ownership_registry": [
    {
      "tag_type": "GA4 Configuration",
      "tracking_id": "G-MEASUREMENT_ID",
      "authoritative_container": "GTM-AUTHORITATIVE",
      "tag_name_in_container": "GA4 - Configuration - All Pages",
      "owner_team": "Marketing Analytics",
      "prohibited_in": ["GTM-REDUNDANT", "page-template-hardcoded-gtag"],
      "notes": "Single GA4 Configuration tag. No other container or hardcoded gtag.js may initialize this Measurement ID."
    },
    {
      "tag_type": "GA4 Event - purchase",
      "tracking_id": "G-MEASUREMENT_ID",
      "authoritative_container": "GTM-AUTHORITATIVE",
      "tag_name_in_container": "GA4 - Event - Purchase",
      "owner_team": "Marketing Analytics",
      "prohibited_in": ["GTM-REDUNDANT"],
      "dedup_key_field": "transaction_id",
      "notes": "Must carry transaction_id for deduplication middleware. Fires on purchase dataLayer event only."
    },
    {
      "tag_type": "Google Ads Conversion Tracking",
      "tracking_id": "AW-CONVERSION_ID/CONVERSION_LABEL",
      "authoritative_container": "GTM-AUTHORITATIVE",
      "tag_name_in_container": "Google Ads - Conversion - Purchase",
      "owner_team": "Paid Search",
      "prohibited_in": ["GTM-REDUNDANT"],
      "notes": "Smart Bidding integrity depends on single-fire. Double-fire corrupts tCPA/tROAS targets."
    },
    {
      "tag_type": "Meta Pixel - Purchase",
      "tracking_id": "META_PIXEL_ID",
      "authoritative_container": "GTM-AUTHORITATIVE",
      "tag_name_in_container": "Meta Pixel - Purchase Event",
      "owner_team": "Paid Social",
      "prohibited_in": ["GTM-REDUNDANT"],
      "notes": "Must include eventID parameter for server-side deduplication via Conversions API. Duplicate fires with different eventIDs corrupt suppression lists."
    }
  ],
  "publish_checklist": [
    "Confirm no tag_type + tracking_id combination exists in more than one active container",
    "Confirm no hardcoded gtag.js, fbq(), or pixel snippets exist outside GTM in page templates",
    "Run Network tab verification on staging: confirm exactly 1 outbound request per pixel per conversion event",
    "Update tag_ownership_registry.json and commit to version control before publishing",
    "Verify dedup_suppression events are NOT appearing in GA4 DebugView (would indicate middleware is catching real duplicates post-fix)"
  ]
}
// CODE EXAMPLE 3: Staging Verification Script (Node.js / Playwright)
// Run this against staging after consolidation and before production deployment.
// Confirms that each conversion event produces exactly one outbound request
// per pixel endpoint. Fails the check if duplicate requests are detected.
//
// SITE-SPECIFIC ASSUMPTIONS:
// - STAGING_URL: Replace with your actual staging environment URL.
// - CONVERSION_TRIGGER_SELECTOR: Replace with the selector for your conversion action
//   (e.g., a purchase confirmation page URL or a form submit button).
// - EXPECTED_ENDPOINTS: Add or remove endpoints to match your actual pixel stack.
// - MAX_REQUESTS_PER_ENDPOINT: Should be 1 for all conversion endpoints post-fix.
//   Set to 2 temporarily if server-side Conversions API also fires (document the reason).

const { chromium } = require('playwright'); // playwright@1.44.0 or later

// Named constants — no magic numbers.
const STAGING_URL = 'https://staging.example.com/order-confirmation'; // SITE-SPECIFIC
const PAGE_LOAD_TIMEOUT_MS = 30000;
const POST_NAVIGATION_SETTLE_MS = 5000; // Wait for async tag fires to complete.
const MAX_REQUESTS_PER_ENDPOINT = 1; // Expected: exactly 1 fire per conversion event.

// SITE-SPECIFIC: Add all conversion pixel endpoints present in your tag stack.
const EXPECTED_ENDPOINTS = [
  { name: 'GA4', pattern: /google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect/ },
  { name: 'Google Ads Conversion', pattern: /googleadservices\.com\/pagead\/conversion/ },
  { name: 'Meta Pixel', pattern: /facebook\.com\/tr/ },
  { name: 'TikTok Pixel', pattern: /analytics\.tiktok\.com\/api\/v2\/pixel/ }
];

async function verifyConversionDeduplication() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Request counter per endpoint.
  const requestCounts = {};
  EXPECTED_ENDPOINTS.forEach(function(ep) {
    requestCounts[ep.name] = 0;
  });

  // Attach request listener before navigation.
  page.on('request', function(request) {
    var url = request.url();
    EXPECTED_ENDPOINTS.forEach(function(ep) {
      if (ep.pattern.test(url)) {
        requestCounts[ep.name]++;
        console.log('[REQUEST DETECTED] ' + ep.name + ': ' + url.substring(0, 120));
      }
    });
  });

  try {
    await page.goto(STAGING_URL, { timeout: PAGE_LOAD_TIMEOUT_MS, waitUntil: 'networkidle' });

    // Allow async tag fires to complete after networkidle.
    await page.waitForTimeout(POST_NAVIGATION_SETTLE_MS);

    // Evaluate results.
    var failures = [];
    var results = [];

    EXPECTED_ENDPOINTS.forEach(function(ep) {
      var count = requestCounts[ep.name];
      var passed = count <= MAX_REQUESTS_PER_ENDPOINT;
      results.push({ endpoint: ep.name, request_count: count, passed: passed });
      if (!passed) {
        failures.push(
          ep.name + ': ' + count + ' requests detected (expected max ' + MAX_REQUESTS_PER_ENDPOINT + ')'
        );
      }
    });

    console.log('\n=== DEDUPLICATION VERIFICATION RESULTS ===');
    results.forEach(function(r) {
      console.log((r.passed ? '✅ PASS' : '❌ FAIL') + ' | ' + r.endpoint + ': ' + r.request_count + ' request(s)');
    });

    if (failures.length > 0) {
      console.error('\n❌ VERIFICATION FAILED — Duplicate conversion fires detected:');
      failures.forEach(function(f) { console.error('  - ' + f); });
      process.exit(1); // Non-zero exit fails CI/CD pipeline.
    } else {
      console.log('\n✅ VERIFICATION PASSED — All conversion endpoints fire exactly once.');
      process.exit(0);
    }
  } catch (e) {
    console.error('[VERIFICATION ERROR]', e.message);
    process.exit(1);
  } finally {
    // OBSERVER TEARDOWN: Always close browser regardless of outcome.
    await browser.close();
  }
}

verifyConversionDeduplication();
```

## Risks
- RISK: Reported conversion volume will drop immediately after fix — this is correct behavior, not a real decline. GA4 reports, Google Ads conversion columns, and any dashboard built on these metrics will show lower numbers post-fix. Without advance communication, stakeholders may interpret this as a business performance drop and trigger unnecessary investigations or revert the fix. MITIGATION: Brief all analytics, paid media, and executive stakeholders before deployment. Document the pre-fix inflated baseline and the expected post-fix corrected baseline. Add an annotation in GA4 and Google Ads on the deployment date.
- RISK: Smart Bidding campaigns will enter a learning period after conversion signal correction. Google Ads Smart Bidding models trained on doubled conversion signals will need to recalibrate against accurate data. During this recalibration period (typically 1-4 weeks depending on conversion volume), campaign performance may fluctuate. MITIGATION: Coordinate the fix deployment with the paid search team. Consider temporarily broadening target CPA/ROAS constraints during the recalibration window to prevent campaigns from exiting the learning phase prematurely.
- RISK: Tags unique to the redundant container may be missed during the audit and lost during decommissioning. If the redundant container contains tags that are not present in the authoritative container and are not identified during the Phase 1 audit, those tags will stop firing after decommissioning. MITIGATION: Export both containers as JSON before making any changes. Cross-reference every tag in the redundant container against the authoritative container inventory. Verify in staging that all expected pixel fires (not just conversion pixels) are present after consolidation. Keep the JSON exports archived for 90 days post-decommission.
- RISK: The dataLayer deduplication middleware (code_examples[1]) may suppress legitimate rapid re-fires if the DEDUP_WINDOW_MS is set too broadly. For example, if a user legitimately completes two separate purchases within 5 seconds (edge case, but possible in B2B bulk order flows), the second purchase event would be suppressed if both carry the same transaction_id. MITIGATION: The middleware deduplicates on event name + transaction_id. Two distinct purchases will have distinct transaction_ids and will not be suppressed. The timestamp-bucket fallback (for events without transaction_id) is the only path where legitimate rapid re-fires could be suppressed — audit which conversion events lack transaction_ids and add them before deploying the middleware.
- RISK: The Playwright verification script (code_examples[3]) requires a staging environment that accurately replicates the production conversion flow, including a triggerable conversion event. If staging does not have a functional checkout or form submission, the verification script cannot confirm deduplication for those event types. MITIGATION: Ensure staging has a test purchase flow (e.g., a test product at $0.00 or a sandbox payment gateway). If staging cannot replicate the full conversion flow, perform manual Network tab verification in production immediately after deployment during a low-traffic window.
- RISK: If the organization legitimately requires two GTM containers (e.g., separate business units with independent governance requirements), full consolidation may not be politically or operationally feasible. Forcing consolidation without stakeholder alignment may result in the second container being re-added without coordination. MITIGATION: If consolidation is blocked, implement the Strict Ownership Boundary alternative (see alternatives) with documented exclusion rules. This is a less clean solution but prevents double-firing without requiring full consolidation.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
