---
finding_id: "resource-loading-js-transfer-coverage-inconsistency"
title: "Instrument the audit pipeline to enforce cache-cleared cold-load conditions before capturing network transfer metrics, reconcile js_transfer_bytes against js_total_bytes (Coverage API) as a cross-signal validation gate, and produce a dual-baseline report (cold load vs. warm load) so that first-visit severity and repeat-visit severity are independently calibrated. This fix does not change the site's JavaScript — it fixes the measurement foundation that all JS payload findings (js-dual-gtm-ga4-payload-overhead, js-unused-bytes-low-but-present, resource-loading-analytics-scripts-dominate-payload) depend on for accurate severity framing."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "The primary impact is on the reliability of all downstream JS payload findings."
fix_summary: "Instrument the audit pipeline to enforce cache-cleared cold-load conditions before capturing network transfer metrics, reconcile js_transfer_bytes against js_total_bytes (Coverage API) as a cross-sig…"
confidence_tier: "reviewer_identified"
---

# Instrument the audit pipeline to enforce cache-cleared cold-load conditions before capturing network transfer metrics, reconcile js_transfer_bytes against js_total_bytes (Coverage API) as a cross-signal validation gate, and produce a dual-baseline report (cold load vs. warm load) so that first-visit severity and repeat-visit severity are independently calibrated. This fix does not change the site's JavaScript — it fixes the measurement foundation that all JS payload findings (js-dual-gtm-ga4-payload-overhead, js-unused-bytes-low-but-present, resource-loading-analytics-scripts-dominate-payload) depend on for accurate severity framing.

**Finding:** Instrument the audit pipeline to enforce cache-cleared cold-load conditions before capturing network transfer metrics, reconcile js_transfer_bytes against js_total_bytes (Coverage API) as a cross-signal validation gate, and produce a dual-baseline report (cold load vs. warm load) so that first-visit severity and repeat-visit severity are independently calibrated. This fix does not change the site's JavaScript — it fixes the measurement foundation that all JS payload findings (js-dual-gtm-ga4-payload-overhead, js-unused-bytes-low-but-present, resource-loading-analytics-scripts-dominate-payload) depend on for accurate severity framing.  
**Severity:** Medium  
**Why this matters:** The primary impact is on the reliability of all downstream JS payload findings.  
**Root cause:** Isolated issue  
**Fix:** Instrument the audit pipeline to enforce cache-cleared cold-load conditions before capturing network transfer metrics, reconcile js_transfer_bytes against js_total_bytes (Coverage API) as a cross-sig…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Audit Measurement Accuracy:** The primary impact is on the reliability of all downstream JS payload findings. By enforcing a cache-cleared cold load, js_transfer_bytes will reflect the actual network cost paid by first-visit users — the population most at risk of abandonment due to payload weight. The current warm-cache baseline systematically understates first-visit severity: a user arriving for the first time pays the full 2.5MB parse cost plus network transfer, while the audit recorded 0 bytes transferred. Correcting this ensures that resource-loading-analytics-scripts-dominate-payload and js-dual-gtm-ga4-payload-overhead are severity-calibrated to the worst-case user, not the best-case repeat visitor.
- **First Visit Performance Framing:** First-visit users are disproportionately high-intent (paid traffic, referral traffic, social traffic). These users pay the full cold-load JS parse cost. If cold-load instrumentation confirms the full 2.5MB is transferred on first visit, the analytics/tracking payload finding should be escalated to HIGH severity with first-visit framing. Google's Core Web Vitals research documents that parse-heavy JS payloads directly delay Time to Interactive and INP — both of which affect search ranking signals and user retention. Accurate measurement is the prerequisite for correctly prioritizing the remediation.
- **Unused Bytes Representativeness:** The 18.5% / 475KB unused bytes figure is currently untrustworthy as a per-page-load metric. It may aggregate coverage across multiple navigations or reflect a stale heap snapshot. Aligning Coverage API measurement to a single, bounded load event (start before navigation, stop after load + settle delay) will produce a per-load unused bytes figure that can be used to prioritize tree-shaking and code-splitting efforts with confidence. Reducing unused JS parse work directly reduces main thread blocking time, which is the primary mechanism through which JS payload affects INP.
- **Pipeline Integrity:** The severity gate and canary assertion prevent future audits from silently publishing warm-cache-contaminated findings. This is an operational risk control: without it, a single cache-warm crawl session can cause the pipeline to understate severity across all JS payload findings, leading to deprioritization of remediations that would materially improve first-visit performance.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/proof/our-site

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
Instrument the audit pipeline to enforce cache-cleared cold-load conditions before capturing network transfer metrics, reconcile js_transfer_bytes against js_total_bytes (Coverage API) as a cross-signal validation gate, and produce a dual-baseline report (cold load vs. warm load) so that first-visit severity and repeat-visit severity are independently calibrated. This fix does not change the site's JavaScript — it fixes the measurement foundation that all JS payload findings (js-dual-gtm-ga4-payload-overhead, js-unused-bytes-low-but-present, resource-loading-analytics-scripts-dominate-payload) depend on for accurate severity framing.

### How
STEP 1 — ENFORCE CACHE-CLEARED COLD LOAD IN PLAYWRIGHT HARNESS: Create a dedicated audit context factory that always launches a fresh BrowserContext with cache disabled and no stored state. Never reuse a context across audit runs. This is the single most important structural fix — all transfer byte measurements must originate from this context.
STEP 2 — CAPTURE WARM-LOAD BASELINE IN A SECOND PASS: After the cold-load pass completes, launch a second BrowserContext (with cache enabled, seeded from the cold-load response bodies via route interception or a real second navigation) and repeat the same metric capture. Store both result sets under separate keys: cold_load and warm_load. This produces the dual baseline required to correctly frame first-visit vs. repeat-visit severity.
STEP 3 — IMPLEMENT CROSS-SIGNAL VALIDATION GATE: Before any finding generator consumes js_transfer_bytes or js_total_bytes, run a reconciliation check. If js_transfer_bytes is zero AND js_total_bytes is greater than the COLD_LOAD_ZERO_TRANSFER_THRESHOLD, flag the measurement set as WARM_CACHE_SUSPECTED and attach a reconciliation_warning to every finding that references either key. Block severity escalation to 'high' on warm-cache-suspected data without explicit override.
STEP 4 — SEPARATE COVERAGE MEASUREMENT FROM NETWORK MEASUREMENT: The Chrome Coverage API (Page.startJSCoverage / Page.stopJSCoverage via CDP) must be started before the navigation begins and stopped after the load event fires — not after a fixed timeout. Network transfer bytes must be captured from the Network domain's responseReceived + dataReceived events, not from a post-load summary. Align both measurement windows to the same lifecycle boundary.
STEP 5 — EMIT STRUCTURED DUAL-BASELINE PAYLOAD: The audit pipeline output schema must include both baselines. Downstream finding generators must declare which baseline they consume. Findings about first-visit performance (LCP, TTFB, INP, payload weight) must consume cold_load. Findings about caching efficiency and repeat-visit experience must consume warm_load.
STEP 6 — RETROACTIVELY RE-EVALUATE AFFECTED FINDINGS: With corrected cold-load data, re-run severity assessment for resource-loading-analytics-scripts-dominate-payload and js-dual-gtm-ga4-payload-overhead. If cold-load js_transfer_bytes confirms the full 2.5MB is transferred on first visit, escalate those findings accordingly. If cold-load transfer is materially lower (e.g., GTM/GA4 served from a shared CDN already warm in the browser's HTTP cache from other sites), document that nuance explicitly.
STEP 7 — ADD PIPELINE SELF-TEST: Add a canary assertion to the audit harness CI: after a cold-load run, assert that js_transfer_bytes is greater than MINIMUM_EXPECTED_JS_TRANSFER_BYTES. If this assertion fails, the run is marked invalid and findings are not published. This prevents warm-cache contamination from silently producing misleading severity signals in future audits.

### Code examples
```
// ============================================================
// audit-context-factory.ts
// Enforces cache-cleared cold load for all transfer measurements.
// SITE-SPECIFIC ASSUMPTION: Playwright version >=1.40 required.
// ============================================================
import { chromium, BrowserContext, Page } from 'playwright';
import type { CDPSession } from 'playwright';

// Named constants — no magic numbers.
const COLD_LOAD_ZERO_TRANSFER_THRESHOLD_BYTES = 50_000; // 50KB: any JS payload below this on a cold load is suspicious
const MINIMUM_EXPECTED_JS_TRANSFER_BYTES = 100_000;    // 100KB: canary lower bound for a non-trivial page
const NAVIGATION_TIMEOUT_MS = 30_000;                  // 30s hard cap on navigation
const COVERAGE_SETTLE_DELAY_MS = 500;                  // Allow dynamically injected scripts to register

export interface LoadMetrics {
  baseline: 'cold_load' | 'warm_load';
  js_transfer_bytes: number;
  js_total_parsed_bytes: number;
  js_unused_bytes: number;
  js_unused_percent: number;
  reconciliation_warning: string | null;
  scripts: ScriptMetric[];
}

export interface ScriptMetric {
  url: string;
  transfer_bytes: number;
  encoded_data_length: number;
  from_cache: boolean;
  from_service_worker: boolean;
}

/**
 * Creates a cold-load BrowserContext with all caching disabled.
 * MUST be used for all first-visit transfer measurements.
 */
export async function createColdLoadContext(): Promise<BrowserContext> {
  const browser = await chromium.launch();
  // bypassCSP: false — never bypass CSP in audit; it masks real-world behavior.
  const context = await browser.newContext({
    bypassCSP: false,
    // No storageState — ensures no cookies, localStorage, or IndexedDB from prior runs.
  });
  // Disable cache at the network level via CDP after context creation.
  // This is belt-and-suspenders: newContext has no cache by default,
  // but CDP setCacheDisabled makes the intent explicit and auditable.
  return context;
}

/**
 * Captures JS transfer bytes and Coverage API parsed bytes
 * in a single aligned measurement window.
 *
 * Both measurements start before navigation and stop after
 * the load event — never at a fixed timeout.
 */
export async function captureJsMetrics(
  context: BrowserContext,
  targetUrl: string,
  baseline: 'cold_load' | 'warm_load'
): Promise<LoadMetrics> {
  const page: Page = await context.newPage();
  const cdp: CDPSession = await context.newCDPSession(page);

  // Disable cache via CDP for cold load runs.
  if (baseline === 'cold_load') {
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  }

  // Enable Network domain to capture transfer bytes per resource.
  await cdp.send('Network.enable', {});

  // Start JS Coverage BEFORE navigation — scripts parsed before
  // this call are invisible to the Coverage API.
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.startPreciseCoverage', {
    callCount: false,
    detailed: false,
  });

  const scriptMetrics: ScriptMetric[] = [];
  const responseMap = new Map<string, { encodedDataLength: number; fromCache: boolean; fromServiceWorker: boolean }>();

  // Capture per-script transfer data from Network events.
  cdp.on('Network.responseReceived', (event) => {
    if (event.type === 'Script') {
      responseMap.set(event.requestId, {
        encodedDataLength: 0, // populated by loadingFinished
        fromCache: event.response.fromDiskCache || event.response.fromPrefetchCache || false,
        fromServiceWorker: event.response.fromServiceWorker || false,
      });
    }
  });

  cdp.on('Network.loadingFinished', (event) => {
    const entry = responseMap.get(event.requestId);
    if (entry) {
      entry.encodedDataLength = event.encodedDataLength;
    }
  });

  cdp.on('Network.responseReceivedExtraInfo', (_event) => {
    // Reserved for future header inspection (e.g., cache-control validation).
  });

  // Navigate and wait for load event — not networkidle, which can hang on
  // long-polling or beacon endpoints.
  await page.goto(targetUrl, {
    waitUntil: 'load',
    timeout: NAVIGATION_TIMEOUT_MS,
  });

  // Brief settle delay for dynamically injected scripts (GTM-fired tags, etc.).
  // Named constant — not a magic number.
  await page.waitForTimeout(COVERAGE_SETTLE_DELAY_MS);

  // Stop coverage at the same lifecycle point for both baselines.
  const coverageResult = await cdp.send('Profiler.takePreciseCoverage');
  await cdp.send('Profiler.stopPreciseCoverage');
  await cdp.send('Profiler.disable');

  // Aggregate coverage data.
  let js_total_parsed_bytes = 0;
  let js_used_bytes = 0;

  for (const script of coverageResult.result) {
    // Exclude internal V8 / extension scripts.
    if (!script.url || script.url.startsWith('extensions::') || script.url === '') continue;
    js_total_parsed_bytes += script.source?.length ?? 0;
    for (const range of script.functions.flatMap((f) => f.ranges)) {
      if (range.count > 0) {
        js_used_bytes += range.endOffset - range.startOffset;
      }
    }
  }

  // Aggregate network transfer bytes (scripts only).
  let js_transfer_bytes = 0;
  for (const [, entry] of responseMap) {
    js_transfer_bytes += entry.encodedDataLength;
    // scriptMetrics population omitted for brevity — extend as needed.
  }

  // Cross-signal reconciliation gate.
  let reconciliation_warning: string | null = null;
  if (
    baseline === 'cold_load' &&
    js_transfer_bytes < COLD_LOAD_ZERO_TRANSFER_THRESHOLD_BYTES &&
    js_total_parsed_bytes > COLD_LOAD_ZERO_TRANSFER_THRESHOLD_BYTES
  ) {
    reconciliation_warning =
      `WARM_CACHE_SUSPECTED: js_transfer_bytes (${js_transfer_bytes}) is below ` +
      `${COLD_LOAD_ZERO_TRANSFER_THRESHOLD_BYTES} on a cold-load run while ` +
      `js_total_parsed_bytes is ${js_total_parsed_bytes}. ` +
      'Cache-disable may not have taken effect, or a service worker intercepted requests. ' +
      'Severity escalation to HIGH is blocked for JS payload findings until this is resolved.';
  }

  const js_unused_bytes = js_total_parsed_bytes - js_used_bytes;
  const js_unused_percent =
    js_total_parsed_bytes > 0
      ? Math.round((js_unused_bytes / js_total_parsed_bytes) * 100)
      : 0;

  await page.close();

  return {
    baseline,
    js_transfer_bytes,
    js_total_parsed_bytes,
    js_unused_bytes,
    js_unused_percent,
    reconciliation_warning,
    scripts: scriptMetrics,
  };
}
// ============================================================
// dual-baseline-runner.ts
// Orchestrates cold + warm passes and emits a reconciled report.
// SITE-SPECIFIC ASSUMPTION: TARGET_URL must be set per audit run.
// ============================================================
import { chromium } from 'playwright';
import {
  createColdLoadContext,
  captureJsMetrics,
  LoadMetrics,
  MINIMUM_EXPECTED_JS_TRANSFER_BYTES,
} from './audit-context-factory';

// SITE-SPECIFIC: Replace with the actual page URL under audit.
const TARGET_URL = 'https://example.com/page-under-audit';

export interface DualBaselineReport {
  cold_load: LoadMetrics;
  warm_load: LoadMetrics;
  canary_passed: boolean;
  canary_failure_reason: string | null;
  severity_gate: 'open' | 'blocked';
  severity_gate_reason: string | null;
}

export async function runDualBaseline(targetUrl: string = TARGET_URL): Promise<DualBaselineReport> {
  // --- COLD LOAD PASS ---
  const coldBrowser = await chromium.launch();
  const coldContext = await createColdLoadContext();
  const coldMetrics = await captureJsMetrics(coldContext, targetUrl, 'cold_load');
  await coldBrowser.close();

  // --- CANARY ASSERTION ---
  // If cold-load transfer bytes are below the minimum expected threshold,
  // the run is invalid. Do not publish findings based on this data.
  let canary_passed = true;
  let canary_failure_reason: string | null = null;

  if (coldMetrics.js_transfer_bytes < MINIMUM_EXPECTED_JS_TRANSFER_BYTES) {
    canary_passed = false;
    canary_failure_reason =
      `Cold-load js_transfer_bytes (${coldMetrics.js_transfer_bytes}) is below ` +
      `MINIMUM_EXPECTED_JS_TRANSFER_BYTES (${MINIMUM_EXPECTED_JS_TRANSFER_BYTES}). ` +
      'This run is marked INVALID. Cache-disable did not take effect or the page ' +
      'has no meaningful JS payload. Do not publish severity findings from this run.';
  }

  // --- WARM LOAD PASS ---
  // Second navigation in a new context WITH cache enabled.
  // The browser will have populated its HTTP cache from the cold pass
  // only if both passes share the same browser instance — which they do not here.
  // For a true warm-cache simulation, use route interception to serve
  // cold-pass response bodies from memory, or run both passes in the same browser.
  const warmBrowser = await chromium.launch();
  const warmContext = await warmBrowser.newContext();
  // First navigation seeds the cache.
  const seedPage = await warmContext.newPage();
  await seedPage.goto(targetUrl, { waitUntil: 'load', timeout: 30_000 });
  await seedPage.close();
  // Second navigation measures warm-cache behavior.
  const warmMetrics = await captureJsMetrics(warmContext, targetUrl, 'warm_load');
  await warmBrowser.close();

  // --- SEVERITY GATE ---
  const severity_gate: 'open' | 'blocked' =
    !canary_passed || coldMetrics.reconciliation_warning !== null ? 'blocked' : 'open';

  const severity_gate_reason =
    severity_gate === 'blocked'
      ? (canary_failure_reason ?? coldMetrics.reconciliation_warning)
      : null;

  return {
    cold_load: coldMetrics,
    warm_load: warmMetrics,
    canary_passed,
    canary_failure_reason,
    severity_gate,
    severity_gate_reason,
  };
}
// ============================================================
// finding-severity-gate.ts
// Wraps finding generation — blocks HIGH severity on warm-cache
// suspected data. All JS payload findings must pass through this.
// ============================================================

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface FindingInput {
  id: string;
  proposed_severity: Severity;
  evidence_keys: string[];
  baseline_consumed: 'cold_load' | 'warm_load';
}

interface GatedFinding {
  id: string;
  severity: Severity;
  severity_downgraded: boolean;
  downgrade_reason: string | null;
}

// Keys that indicate a finding depends on JS transfer/payload measurements.
// SITE-SPECIFIC ASSUMPTION: Extend this list if additional evidence keys are added.
const JS_PAYLOAD_EVIDENCE_KEYS = new Set([
  'js_transfer_bytes',
  'js_total_parsed_bytes',
  'js_total_bytes',
  'js_unused_bytes',
  'js_unused_percent',
  'script_transfer_kb',
  'js_unused_bytes_kb',
  'js_total_parsed_kb',
]);

export function applyFindingSeverityGate(
  finding: FindingInput,
  severityGate: 'open' | 'blocked',
  gateReason: string | null
): GatedFinding {
  const dependsOnJsPayload = finding.evidence_keys.some((key) =>
    JS_PAYLOAD_EVIDENCE_KEYS.has(key)
  );

  if (
    severityGate === 'blocked' &&
    dependsOnJsPayload &&
    finding.proposed_severity === 'high'
  ) {
    return {
      id: finding.id,
      severity: 'medium', // Downgrade, not suppress — the issue is real, the measurement is unverified.
      severity_downgraded: true,
      downgrade_reason:
        `Severity downgraded from HIGH to MEDIUM: measurement foundation unverified. ` +
        `Reason: ${gateReason ?? 'severity gate blocked'}. ` +
        'Re-run audit with confirmed cold-load instrumentation to restore HIGH severity.',
    };
  }

  return {
    id: finding.id,
    severity: finding.proposed_severity,
    severity_downgraded: false,
    downgrade_reason: null,
  };
}
// ============================================================
// ci-audit-guard.ts
// CI integration: fails the pipeline if canary assertion fails.
// Prevents warm-cache-contaminated findings from being published.
// ============================================================
import { runDualBaseline } from './dual-baseline-runner';

async function main(): Promise<void> {
  // SITE-SPECIFIC ASSUMPTION: TARGET_URL injected via environment variable.
  const targetUrl = process.env['AUDIT_TARGET_URL'];
  if (!targetUrl) {
    console.error('AUDIT_TARGET_URL environment variable is required.');
    process.exit(1);
  }

  let report;
  try {
    report = await runDualBaseline(targetUrl);
  } catch (err) {
    console.error('Dual-baseline runner threw an unexpected error:', err);
    process.exit(1);
  }

  console.log(JSON.stringify(report, null, 2));

  if (!report.canary_passed) {
    console.error(
      '\n[AUDIT PIPELINE FAILURE] Canary assertion failed. ' +
      'Findings will NOT be published.\n' +
      report.canary_failure_reason
    );
    process.exit(1); // Non-zero exit fails CI step.
  }

  if (report.severity_gate === 'blocked') {
    console.warn(
      '\n[AUDIT PIPELINE WARNING] Severity gate is BLOCKED. ' +
      'HIGH-severity JS payload findings have been downgraded to MEDIUM.\n' +
      report.severity_gate_reason
    );
    // Exit 0 — findings are still published, but downgraded. Not a hard failure.
  }

  console.log('\n[AUDIT PIPELINE] Dual-baseline capture complete. Severity gate:', report.severity_gate);
}

main().catch((err) => {
  console.error('Unhandled error in CI audit guard:', err);
  process.exit(1);
});
```

## Risks
- SERVICE WORKER INTERCEPTION: Even with CDP cache-disable active, a registered service worker can intercept fetch requests and serve responses from its own cache, producing js_transfer_bytes: 0 on a 'cold' load. Mitigation: detect service worker registration via navigator.serviceWorker.getRegistrations() before navigation and unregister all workers in the cold-load context, or use page.route() to intercept and pass-through all requests, bypassing the service worker entirely.
- SHARED CDN PRE-WARMING: GTM and GA4 are served from Google's CDN (googletagmanager.com, google-analytics.com). These domains are frequently pre-cached in Chrome's shared cache from other sites the user has visited. This means even a true cold load for this specific site may show reduced transfer bytes for these scripts. Mitigation: document this nuance in the report — shared CDN pre-warming is a real-world condition that benefits repeat internet users, but it is not a site-controlled optimization and should not be credited as such in severity framing.
- COVERAGE API SCRIPT SOURCE LENGTH VS. TRANSFER SIZE MISMATCH: The Coverage API reports script.source.length (uncompressed character count), while network transfer bytes are compressed (gzip/brotli). These are not directly comparable — a 2.5MB parsed figure may correspond to a 700KB-900KB compressed transfer. Mitigation: always report both figures with explicit labels (parsed_bytes vs. transfer_bytes_compressed) and never conflate them in severity framing. The code examples above maintain this separation.
- SETTLE DELAY BRITTLENESS: The 500ms COVERAGE_SETTLE_DELAY_MS constant is a heuristic for dynamically injected scripts (GTM-fired tags). Sites with slow tag firing or lazy-loaded analytics may require a longer delay, causing the coverage snapshot to miss late-arriving scripts. Mitigation: make COVERAGE_SETTLE_DELAY_MS configurable per site, and consider using a MutationObserver or network idle signal as a more reliable termination condition than a fixed timeout.
- PLAYWRIGHT VERSION DRIFT: The CDP session API surface (Profiler.startPreciseCoverage, Network.setCacheDisabled) is stable but Playwright's internal CDP session management has changed across minor versions. Mitigation: pin Playwright to a specific minor version in package.json (e.g., '1.40.1' not '^1.40.0') and test the harness against each Playwright upgrade before deploying to the audit pipeline.
- RETROACTIVE FINDING RE-EVALUATION SCOPE: Re-running severity assessment for resource-loading-analytics-scripts-dominate-payload and js-dual-gtm-ga4-payload-overhead with corrected cold-load data may change their severity from MEDIUM to HIGH. This could trigger re-notification to stakeholders and require re-prioritization of the remediation backlog. Mitigation: communicate the measurement correction proactively before re-publishing findings, framing it as a calibration improvement rather than a new discovery.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
