---
finding_id: "api-1-minimal-network-waterfall"
title: "Network waterfall is minimal — no API calls, over-fetching, or sequential dependency issues"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The current minimal waterfall directly supports fast TTFB and low LCP on this page type."
fix_summary: "No corrective action required."
confidence_tier: "confirmed"
---

# Network waterfall is minimal — no API calls, over-fetching, or sequential dependency issues

**Finding:** Network waterfall is minimal — no API calls, over-fetching, or sequential dependency issues  
**Severity:** Low  
**Why this matters:** The current minimal waterfall directly supports fast TTFB and low LCP on this page type.  
**Root cause:** Isolated issue  
**Fix:** No corrective action required.

> **Evidence Basis:** Confirmed

---

## Impact

- **Regression Prevention:** The current minimal waterfall directly supports fast TTFB and low LCP on this page type. Without a guard, a future developer adding a client-side fetch, a new tag manager tag, or an additional script file can silently degrade the network profile. The CI check converts the current architectural correctness into an enforced contract — regressions are caught at deploy time, not after they reach production users.
- **Developer Clarity:** Documenting the intentional absence of client-side data fetching prevents well-meaning refactors that introduce unnecessary API calls or hydration overhead. The ADR annotation eliminates the ambiguity that causes these regressions.

## How to verify

**What to look for:** The page makes zero API/fetch calls on load (the single fetch request is the GA4 collect beacon, which is an analytics outbound hit, not a data-fetching API call).. The form submits via POST to /thanks, which is a Netlify Forms endpoint.

**Measured evidence:**
- Total Requests: 11
- Total Transfer: 395KB
- Api Calls: 0
- Fetch Calls: 1
- Fetch Purpose: GA4 analytics beacon (fire-and-forget)
- Sequential Dependencies: none
- Api Calls On Load: 0
- Request Breakdown: {'document': 2, 'script': 3, 'stylesheet': 2, 'font': 2, 'fetch_analytics': 1}

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
No corrective action required. Document the current architecture as a verified baseline and establish a monitoring contract to detect regressions if dynamic pages are added.

### How
1. Mark this finding as PASS in the audit tracker with status 'architectural_baseline_confirmed'.
2. Record the current resource inventory as the approved baseline: 1 document, 3 scripts, 2 stylesheets, 2 fonts, 1 analytics beacon. Any future deviation on this page type triggers re-audit.
3. Add a Netlify build plugin or CI step (see code example) that asserts the page's network request count stays within the approved envelope on each deploy. Fail the build if new blocking requests appear.
4. Create a separate audit ticket for any page type that introduces client-side data fetching (dynamic listings, search, personalization). Do not inherit this page's PASS status for those templates.
5. Annotate the site's architecture decision record (ADR) or README to document that this page intentionally delegates form handling to Netlify Forms and analytics to a fire-and-forget GA4 beacon — so future developers do not 'fix' the absence of client-side fetch logic.

### Code examples
```
// CI regression guard — Playwright script asserting the approved resource envelope.
// Run in CI on every deploy targeting this page type.
// SITE-SPECIFIC ASSUMPTION: adjust PAGE_URL and envelope counts to match your deployment.

import { chromium } from 'playwright';

// Named constants — adjust to match the approved baseline for this page type.
const PAGE_URL = process.env.DEPLOY_PRIME_URL ?? 'https://example.com/contact'; // SITE-SPECIFIC
const MAX_DOCUMENT_REQUESTS = 1;
const MAX_SCRIPT_REQUESTS = 3;
const MAX_STYLESHEET_REQUESTS = 2;
const MAX_FONT_REQUESTS = 2;
const MAX_BEACON_REQUESTS = 1;
const MAX_TOTAL_REQUESTS = 9; // sum of above + 0 API calls
const NAVIGATION_TIMEOUT_MS = 15_000; // 15 s — generous for CI cold starts
const LOAD_SETTLE_MS = 2_000;         // wait for async beacons after load

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const requests = {
    document: 0,
    script: 0,
    stylesheet: 0,
    font: 0,
    ping: 0,   // covers navigator.sendBeacon and fetch keepalive
    other: 0,
  };

  page.on('request', (req) => {
    const type = req.resourceType();
    if (type in requests) {
      requests[type]++;
    } else {
      requests.other++;
    }
  });

  try {
    await page.goto(PAGE_URL, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    // Allow late-firing beacons (GA4 collect) to register.
    await page.waitForTimeout(LOAD_SETTLE_MS);
  } finally {
    await browser.close();
  }

  const total = Object.values(requests).reduce((a, b) => a + b, 0);

  const violations = [];

  if (requests.document > MAX_DOCUMENT_REQUESTS)
    violations.push(`document requests: ${requests.document} > ${MAX_DOCUMENT_REQUESTS}`);
  if (requests.script > MAX_SCRIPT_REQUESTS)
    violations.push(`script requests: ${requests.script} > ${MAX_SCRIPT_REQUESTS}`);
  if (requests.stylesheet > MAX_STYLESHEET_REQUESTS)
    violations.push(`stylesheet requests: ${requests.stylesheet} > ${MAX_STYLESHEET_REQUESTS}`);
  if (requests.font > MAX_FONT_REQUESTS)
    violations.push(`font requests: ${requests.font} > ${MAX_FONT_REQUESTS}`);
  if (requests.ping > MAX_BEACON_REQUESTS)
    violations.push(`beacon requests: ${requests.ping} > ${MAX_BEACON_REQUESTS}`);
  if (total > MAX_TOTAL_REQUESTS)
    violations.push(`total requests: ${total} > ${MAX_TOTAL_REQUESTS}`);
  // Any XHR or fetch against a first-party API endpoint is a regression on this page type.
  if (requests.other > 0)
    violations.push(`unexpected resource types detected: ${requests.other} request(s)`);

  if (violations.length > 0) {
    console.error('\n[WATERFALL REGRESSION] Approved resource envelope exceeded:');
    violations.forEach((v) => console.error(`  - ${v}`));
    process.exit(1); // Fails the CI build
  }

  console.log('[WATERFALL PASS] Resource envelope within approved baseline:', requests);
  process.exit(0);
})();
```

## Risks
- The Playwright CI check uses waitForTimeout(LOAD_SETTLE_MS) to catch late-firing beacons. If GA4 fires its collect beacon after 2 s on a slow CI runner, the ping count will read 0 and the guard will pass silently — not a false failure, but a missed count. Mitigation: increase LOAD_SETTLE_MS to 4000 on known-slow CI environments, or switch to page.waitForResponse() targeting the GA4 collect endpoint explicitly.
- The resource type 'ping' covers navigator.sendBeacon but Playwright may classify some keepalive fetch requests as 'fetch' or 'xhr' instead. If GA4 migrates its transport mechanism, the beacon count may shift to 'other', triggering a false failure. Mitigation: inspect the 'other' bucket in CI logs before treating it as a hard block; adjust the type mapping if the transport changes.
- The MAX_TOTAL_REQUESTS envelope is additive — if a legitimate new asset is approved (e.g., a second font weight), the constants must be updated in the same PR that adds the asset. Failing to do so will cause CI failures on the next unrelated deploy. Mitigation: treat the constants file as a required change in any PR that modifies the page's resource graph.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
