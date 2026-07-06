---
finding_id: "resource-loading-css-coverage-measurement-artifact"
title: "Replace the current CSS coverage measurement approach with a deterministic, multi-signal audit pipeline that (1) separates CSS bytes from font bytes at the resource classification layer, (2) gates coverage snapshot timing to post-DOMContentLoaded + post-JS-style-injection, and (3) cross-validates coverage output against three independent signals before accepting a result. The goal is not to 'fix' the CSS itself — the actual stylesheet may be fine — but to produce a trustworthy measurement so that real unused CSS waste can be detected, quantified, and acted on. Until the measurement is reliable, every CSS-related passing finding on every page is unverifiable."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "The primary impact of this fix is restoring audit reliability."
fix_summary: "Replace the current CSS coverage measurement approach with a deterministic, multi-signal audit pipeline that (1) separates CSS bytes from font bytes at the resource classification layer, (2) gates co…"
confidence_tier: "reviewer_identified"
remediation_surface: "source_code"
---

# Replace the current CSS coverage measurement approach with a deterministic, multi-signal audit pipeline that (1) separates CSS bytes from font bytes at the resource classification layer, (2) gates coverage snapshot timing to post-DOMContentLoaded + post-JS-style-injection, and (3) cross-validates coverage output against three independent signals before accepting a result. The goal is not to 'fix' the CSS itself — the actual stylesheet may be fine — but to produce a trustworthy measurement so that real unused CSS waste can be detected, quantified, and acted on. Until the measurement is reliable, every CSS-related passing finding on every page is unverifiable.

**Finding:** Replace the current CSS coverage measurement approach with a deterministic, multi-signal audit pipeline that (1) separates CSS bytes from font bytes at the resource classification layer, (2) gates coverage snapshot timing to post-DOMContentLoaded + post-JS-style-injection, and (3) cross-validates coverage output against three independent signals before accepting a result. The goal is not to 'fix' the CSS itself — the actual stylesheet may be fine — but to produce a trustworthy measurement so that real unused CSS waste can be detected, quantified, and acted on. Until the measurement is reliable, every CSS-related passing finding on every page is unverifiable.  
**Severity:** Medium  
**Why this matters:** The primary impact of this fix is restoring audit reliability.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Replace the current CSS coverage measurement approach with a deterministic, multi-signal audit pipeline that (1) separates CSS bytes from font bytes at the resource classification layer, (2) gates co…  

> **Evidence Basis:** Reviewer-Identified

---

> **Fix code targets the wrong stack (MUTTR-03).** This site was detected as **Astro**, but the code below uses Liquid/Shopify idioms — it is not drop-in and must be hand-ported. Astro uses components/layouts (`.astro`), scoped styles or Tailwind, `astro.config.*`, and `public/` — not child themes, Liquid, or PHP.

## Impact

- **Measurement Pipeline Integrity:** The primary impact of this fix is restoring audit reliability. Until CSS coverage measurement produces valid output, every CSS-related passing finding is unverifiable. A pipeline that silently reports 0% unused CSS on 1.4MB of data is not a passing result — it is a blind spot. Correcting the measurement is a prerequisite for all downstream CSS optimization decisions.
- **Css Payload Reduction Potential:** Once measurement is trustworthy, the actual unused CSS can be quantified and removed. For a shared stylesheet serving a privacy policy page with 154 DOM elements, the unused rule set is expected to be substantial — shared stylesheets routinely contain rules for navigation states, form variants, modal overlays, grid utilities, and responsive breakpoint overrides that are absent from text-heavy legal pages. Removing genuinely unused CSS reduces parse time, style recalculation cost, and initial transfer size. The magnitude depends on what the corrected measurement reveals.
- **Font Byte Misclassification Correction:** If the root cause is confirmed as font byte misclassification (most likely scenario), correcting the classification will reveal that the actual CSS payload is closer to the 7KB reported by the stylesheet count finding. This would confirm the CSS critical path finding as accurate and redirect optimization effort toward the confirmed waste already identified: the 31KB JetBrains Mono font loaded on a page with no code blocks (finding: resource-loading-jetbrains-mono-unnecessary).
- **Audit Cost Efficiency:** A measurement pipeline that produces invalid results wastes engineering time on false investigations. Every hour spent analyzing a 0% unused CSS result that is a measurement artifact is an hour not spent on confirmed issues. Fixing the pipeline reduces audit noise and improves signal-to-noise ratio across all future page audits.
- **Core Web Vitals Indirect:** CSS parse time contributes to render-blocking duration and Time to First Contentful Paint. If the corrected measurement reveals meaningful unused CSS (e.g. 40–70% of a shared stylesheet), removing it will reduce the style recalculation work the browser performs before first paint. Google's Core Web Vitals documentation identifies render-blocking resources and excessive CSS as direct contributors to LCP and FCP degradation — though the magnitude of improvement on this specific page depends on what the corrected measurement reveals.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/legal/privacy

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
Replace the current CSS coverage measurement approach with a deterministic, multi-signal audit pipeline that (1) separates CSS bytes from font bytes at the resource classification layer, (2) gates coverage snapshot timing to post-DOMContentLoaded + post-JS-style-injection, and (3) cross-validates coverage output against three independent signals before accepting a result. The goal is not to 'fix' the CSS itself — the actual stylesheet may be fine — but to produce a trustworthy measurement so that real unused CSS waste can be detected, quantified, and acted on. Until the measurement is reliable, every CSS-related passing finding on every page is unverifiable.

### How
STEP 1 — CLASSIFY RESOURCES BY CONTENT-TYPE BEFORE AGGREGATING BYTES. Audit the measurement pipeline's resource bucketing logic. Every network response must be classified by its actual Content-Type response header, not by file extension or request URL pattern. CSS bytes: Content-Type must be text/css. Font bytes: Content-Type must be font/woff2, font/woff, font/ttf, font/otf, or application/font-woff2. Any resource whose Content-Type does not match text/css must be excluded from css_transfer_bytes and css_total_bytes. Add an assertion: if css_total_bytes / css_transfer_bytes > 7.0, flag the measurement as suspect and log the Content-Type breakdown for manual review. The 7.0 threshold is the upper bound of normal gzip/Brotli CSS compression; anything above it indicates byte misclassification.
STEP 2 — GATE COVERAGE SNAPSHOT TIMING CORRECTLY. The Chrome Coverage API (CDP Page.startCSSCoverage / Page.takeCSSCoverage) must be started before navigation and the snapshot taken only after all three conditions are met: (a) 'load' event has fired, (b) a 500ms idle window has elapsed with no new network requests (to capture CSS-in-JS and consent platform injections), and (c) document.styleSheets.length is stable across two consecutive 100ms polls. If any condition is not met within a 10-second timeout, the measurement must be recorded as status: 'timeout' and excluded from pass/fail evaluation — never silently reported as 0% unused.
STEP 3 — CROSS-VALIDATE COVERAGE OUTPUT AGAINST THREE INDEPENDENT SIGNALS. After taking the coverage snapshot, run three validation checks before accepting the result: (A) STYLESHEET COUNT PARITY — document.styleSheets.length in the browser must equal the count of CSS resources in the network log. A mismatch indicates runtime-injected stylesheets not captured in the network log. (B) COMPRESSION RATIO SANITY — css_total_bytes / css_transfer_bytes must be between 1.5 and 7.0. Outside this range, flag as classification_error. (C) ZERO-UNUSED PLAUSIBILITY — if css_unused_pct == 0.0 AND css_total_bytes > 10240 (10KB), flag as measurement_suspect. Zero unused bytes on any stylesheet larger than 10KB is statistically implausible for a shared stylesheet on a content page. If any check fails, the finding must be recorded with status: 'measurement_invalid' and the specific failed check logged.
STEP 4 — IMPLEMENT A FALLBACK MANUAL AUDIT FOR THE PRIVACY POLICY PAGE. While the pipeline is being corrected, run a one-time manual CSS coverage audit using Chrome DevTools Coverage panel (F12 → More Tools → Coverage → reload). Record: total CSS bytes, used bytes, unused bytes, and the list of unused rule selectors. This produces a ground-truth baseline independent of the automated pipeline. For a privacy policy page with 154 DOM elements and a shared stylesheet, expect 40–70% unused rules. Document this baseline so the corrected automated pipeline can be validated against it.
STEP 5 — AUDIT ACTUAL UNUSED CSS ONCE MEASUREMENT IS TRUSTWORTHY. After the pipeline produces a validated measurement, apply PurgeCSS or equivalent to identify rules that are genuinely unused across the page set. For a platform-level shared stylesheet, run coverage across a representative sample of page types (home, product, blog, legal, checkout) and take the union of used selectors before purging. Never purge based on a single page's coverage — shared stylesheets serve multiple templates.
STEP 6 — ADD MEASUREMENT HEALTH MONITORING. Add a css_measurement_health object to every page's audit output containing: stylesheet_count_browser, stylesheet_count_network, compression_ratio, zero_unused_flagged, snapshot_timing_ms, and status (valid | measurement_suspect | classification_error | timeout). This makes measurement failures visible in dashboards rather than silently producing misleading pass results.

### Code examples
```
// ─────────────────────────────────────────────────────────────────────────────
// CSS COVERAGE COLLECTOR — Playwright + CDP
// Production Code Standards applied:
//   - Named constants for all thresholds (no magic numbers)
//   - try-finally for CDP session teardown
//   - Feature detection before CDP attachment
//   - Null guards on all external objects
//   - Explicit timeout with AbortController pattern
//   - No placeholder values
// ─────────────────────────────────────────────────────────────────────────────

// config/css-coverage.config.js
// SITE-SPECIFIC ASSUMPTION: adjust these values per deployment environment
export const CSS_COVERAGE_CONFIG = {
  // Maximum gzip/Brotli compression ratio for CSS.
  // Values above this indicate byte misclassification (e.g., font bytes counted as CSS).
  // Basis: CSS compresses at 3:1–6:1 via gzip; 7.0 is a conservative upper bound.
  MAX_VALID_COMPRESSION_RATIO: 7.0,

  // Minimum compression ratio. Below 1.5 suggests transfer_bytes > total_bytes (impossible)
  // or that total_bytes is being reported as compressed size (pipeline inversion).
  MIN_VALID_COMPRESSION_RATIO: 1.5,

  // Any stylesheet larger than this threshold reporting 0% unused is flagged as suspect.
  // Basis: a shared stylesheet >10KB invariably contains rules for components absent
  // from any single content page.
  ZERO_UNUSED_SUSPECT_THRESHOLD_BYTES: 10240, // 10KB

  // Milliseconds to wait for network idle after 'load' event before taking snapshot.
  // Captures CSS-in-JS injections and consent platform style insertions.
  POST_LOAD_IDLE_WAIT_MS: 500,

  // Polling interval for document.styleSheets stability check.
  STYLESHEET_STABILITY_POLL_MS: 100,

  // Number of consecutive stable polls required before snapshot is taken.
  STYLESHEET_STABILITY_REQUIRED_POLLS: 2,

  // Maximum total time to wait for snapshot conditions before recording timeout.
  SNAPSHOT_TIMEOUT_MS: 10000,

  // CSS MIME types that are valid for css_transfer_bytes classification.
  VALID_CSS_CONTENT_TYPES: ['text/css', 'text/css; charset=utf-8'],

  // Font MIME types that must be EXCLUDED from CSS byte counts.
  FONT_CONTENT_TYPES: [
    'font/woff2',
    'font/woff',
    'font/ttf',
    'font/otf',
    'application/font-woff2',
    'application/font-woff',
    'application/x-font-ttf',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// css-coverage-collector.js
// Playwright-based CSS coverage with deterministic timing and cross-validation
// ─────────────────────────────────────────────────────────────────────────────
import { CSS_COVERAGE_CONFIG as CFG } from './config/css-coverage.config.js';

/**
 * Measurement status codes — never silently swallow failures.
 * @readonly
 * @enum {string}
 */
const MeasurementStatus = {
  VALID: 'valid',
  MEASUREMENT_SUSPECT: 'measurement_suspect',
  CLASSIFICATION_ERROR: 'classification_error',
  TIMEOUT: 'timeout',
  CDP_ERROR: 'cdp_error',
};

/**
 * Collects CSS coverage for a single page with deterministic timing.
 *
 * @param {import('playwright').Page} page - Playwright page (already navigated)
 * @param {Array<{url: string, contentType: string, transferSize: number, encodedBodySize: number}>} networkLog
 *   - Pre-collected network log entries from page.on('response', ...) listener
 * @returns {Promise<CssCoverageResult>}
 */
export async function collectCssCoverage(page, networkLog) {
  // Null-guard: page must be a valid Playwright Page object
  if (!page || typeof page.coverage !== 'object') {
    throw new TypeError('collectCssCoverage: page must be a Playwright Page instance with coverage API');
  }
  if (!Array.isArray(networkLog)) {
    throw new TypeError('collectCssCoverage: networkLog must be an array of response entries');
  }

  // ── STEP 1: Classify network resources by Content-Type ──────────────────────
  const classifiedResources = classifyNetworkResources(networkLog);

  // ── STEP 2: Take coverage snapshot with deterministic timing ────────────────
  let coverageEntries = null;
  let snapshotStatus = MeasurementStatus.VALID;
  let snapshotTimingMs = 0;

  const snapshotStart = Date.now();

  try {
    // Start coverage BEFORE navigation in the calling harness.
    // Here we take the snapshot after confirming timing conditions are met.
    const timingResult = await waitForSnapshotConditions(page);
    snapshotTimingMs = Date.now() - snapshotStart;

    if (timingResult.timedOut) {
      snapshotStatus = MeasurementStatus.TIMEOUT;
      console.warn(
        `[css-coverage] Snapshot timing conditions not met within ${CFG.SNAPSHOT_TIMEOUT_MS}ms. ` +
        `Recording as status: timeout. Do not use this measurement for pass/fail evaluation.`
      );
    } else {
      coverageEntries = await page.coverage.stopCSSCoverage();
    }
  } catch (err) {
    snapshotStatus = MeasurementStatus.CDP_ERROR;
    console.error('[css-coverage] CDP error during coverage collection:', err.message);
    // Return a clearly-marked invalid result rather than propagating
    return buildInvalidResult(snapshotStatus, classifiedResources, snapshotTimingMs, err.message);
  }

  if (snapshotStatus === MeasurementStatus.TIMEOUT) {
    return buildInvalidResult(snapshotStatus, classifiedResources, snapshotTimingMs, 'Timing conditions not met');
  }

  // ── STEP 3: Compute coverage metrics from CDP entries ───────────────────────
  const coverageMetrics = computeCoverageMetrics(coverageEntries);

  // ── STEP 4: Cross-validate — three independent checks ───────────────────────
  const validation = crossValidate({
    classifiedResources,
    coverageMetrics,
    browserStylesheetCount: await getBrowserStylesheetCount(page),
  });

  // ── STEP 5: Determine final status ──────────────────────────────────────────
  const finalStatus = validation.allPassed
    ? MeasurementStatus.VALID
    : validation.hasClassificationError
      ? MeasurementStatus.CLASSIFICATION_ERROR
      : MeasurementStatus.MEASUREMENT_SUSPECT;

  return {
    status: finalStatus,
    css_transfer_bytes: classifiedResources.cssTransferBytes,
    css_total_bytes: classifiedResources.cssTotalBytes,
    css_unused_bytes: coverageMetrics.unusedBytes,
    css_unused_pct: coverageMetrics.unusedPct,
    css_used_bytes: coverageMetrics.usedBytes,
    font_transfer_bytes: classifiedResources.fontTransferBytes,
    font_total_bytes: classifiedResources.fontTotalBytes,
    measurement_health: {
      stylesheet_count_network: classifiedResources.cssFileCount,
      stylesheet_count_browser: await getBrowserStylesheetCount(page),
      compression_ratio: classifiedResources.compressionRatio,
      zero_unused_flagged: validation.zeroUnusedFlagged,
      snapshot_timing_ms: snapshotTimingMs,
      validation_checks: validation.checks,
      status: finalStatus,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Separates CSS bytes from font bytes using Content-Type response headers.
 * This is the root fix for the font byte misclassification failure mode.
 *
 * @param {Array} networkLog
 * @returns {ClassifiedResources}
 */
function classifyNetworkResources(networkLog) {
  let cssTransferBytes = 0;
  let cssTotalBytes = 0;
  let fontTransferBytes = 0;
  let fontTotalBytes = 0;
  let cssFileCount = 0;
  const unclassifiedResources = [];

  for (const entry of networkLog) {
    // Null-guard: skip malformed entries
    if (!entry || typeof entry.contentType !== 'string') {
      continue;
    }

    const contentType = entry.contentType.toLowerCase().split(';')[0].trim();

    if (CFG.VALID_CSS_CONTENT_TYPES.some(t => t.toLowerCase().startsWith(contentType))) {
      cssTransferBytes += entry.transferSize || 0;
      cssTotalBytes += entry.encodedBodySize || 0;
      cssFileCount += 1;
    } else if (CFG.FONT_CONTENT_TYPES.some(t => t.toLowerCase() === contentType)) {
      fontTransferBytes += entry.transferSize || 0;
      fontTotalBytes += entry.encodedBodySize || 0;
    } else {
      // Log unclassified resources for pipeline debugging
      unclassifiedResources.push({ url: entry.url, contentType: entry.contentType });
    }
  }

  const compressionRatio = cssTransferBytes > 0
    ? parseFloat((cssTotalBytes / cssTransferBytes).toFixed(2))
    : null;

  return {
    cssTransferBytes,
    cssTotalBytes,
    fontTransferBytes,
    fontTotalBytes,
    cssFileCount,
    compressionRatio,
    unclassifiedResources,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot Timing Gate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Waits for all three snapshot conditions before allowing coverage collection:
 * (a) 'load' event fired (guaranteed by Playwright navigation with waitUntil: 'load')
 * (b) POST_LOAD_IDLE_WAIT_MS of network idle
 * (c) document.styleSheets.length stable across STYLESHEET_STABILITY_REQUIRED_POLLS
 *
 * @param {import('playwright').Page} page
 * @returns {Promise<{timedOut: boolean}>}
 */
async function waitForSnapshotConditions(page) {
  const deadline = Date.now() + CFG.SNAPSHOT_TIMEOUT_MS;

  // Condition (b): wait for post-load idle period
  await sleep(CFG.POST_LOAD_IDLE_WAIT_MS);

  // Condition (c): poll for stylesheet count stability
  let stablePolls = 0;
  let lastCount = -1;

  while (Date.now() < deadline) {
    const currentCount = await getBrowserStylesheetCount(page);

    if (currentCount === lastCount) {
      stablePolls += 1;
    } else {
      stablePolls = 0;
      lastCount = currentCount;
    }

    if (stablePolls >= CFG.STYLESHEET_STABILITY_REQUIRED_POLLS) {
      return { timedOut: false };
    }

    await sleep(CFG.STYLESHEET_STABILITY_POLL_MS);
  }

  return { timedOut: true };
}

/**
 * Returns document.styleSheets.length from the browser context.
 * Null-guarded: returns 0 if the page context is unavailable.
 *
 * @param {import('playwright').Page} page
 * @returns {Promise<number>}
 */
async function getBrowserStylesheetCount(page) {
  try {
    return await page.evaluate(() => {
      // document.styleSheets is always defined in browser context
      return document.styleSheets ? document.styleSheets.length : 0;
    });
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Coverage Metrics Computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes used/unused byte counts from CDP CSSCoverage entries.
 *
 * @param {Array<{text: string, ranges: Array<{start: number, end: number}>}>} entries
 * @returns {{usedBytes: number, unusedBytes: number, unusedPct: number}}
 */
function computeCoverageMetrics(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { usedBytes: 0, unusedBytes: 0, unusedPct: 0 };
  }

  let totalBytes = 0;
  let usedBytes = 0;

  for (const entry of entries) {
    // Null-guard: skip malformed entries
    if (!entry || typeof entry.text !== 'string') continue;

    const entryLength = entry.text.length;
    totalBytes += entryLength;

    if (Array.isArray(entry.ranges)) {
      for (const range of entry.ranges) {
        if (
          typeof range.start === 'number' &&
          typeof range.end === 'number' &&
          range.end > range.start
        ) {
          usedBytes += range.end - range.start;
        }
      }
    }
  }

  const unusedBytes = Math.max(0, totalBytes - usedBytes);
  const unusedPct = totalBytes > 0
    ? parseFloat(((unusedBytes / totalBytes) * 100).toFixed(1))
    : 0;

  return { usedBytes, unusedBytes, unusedPct };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs three independent validation checks against the collected data.
 * A failed check does not throw — it marks the result as suspect/invalid
 * so the pipeline can surface the failure without crashing.
 *
 * @param {{classifiedResources, coverageMetrics, browserStylesheetCount: number}}
 * @returns {ValidationResult}
 */
function crossValidate({ classifiedResources, coverageMetrics, browserStylesheetCount }) {
  const checks = [];
  let hasClassificationError = false;
  let zeroUnusedFlagged = false;

  // CHECK A: Stylesheet count parity
  const countParity = classifiedResources.cssFileCount === browserStylesheetCount;
  checks.push({
    check: 'stylesheet_count_parity',
    network_count: classifiedResources.cssFileCount,
    browser_count: browserStylesheetCount,
    passed: countParity,
    note: countParity
      ? 'Network and browser stylesheet counts match'
      : `Mismatch: ${classifiedResources.cssFileCount} in network log vs ${browserStylesheetCount} in browser. ` +
        'Runtime-injected stylesheets (CSS-in-JS, consent platform) likely present.',
  });

  // CHECK B: Compression ratio sanity
  const ratio = classifiedResources.compressionRatio;
  const ratioValid = ratio !== null &&
    ratio >= CFG.MIN_VALID_COMPRESSION_RATIO &&
    ratio <= CFG.MAX_VALID_COMPRESSION_RATIO;

  if (!ratioValid && ratio !== null) {
    hasClassificationError = true;
  }

  checks.push({
    check: 'compression_ratio_sanity',
    compression_ratio: ratio,
    valid_range: `${CFG.MIN_VALID_COMPRESSION_RATIO}–${CFG.MAX_VALID_COMPRESSION_RATIO}`,
    passed: ratioValid,
    note: ratioValid
      ? `Compression ratio ${ratio}:1 is within normal CSS range`
      : ratio > CFG.MAX_VALID_COMPRESSION_RATIO
        ? `Ratio ${ratio}:1 exceeds maximum — font or other non-CSS bytes likely misclassified as CSS`
        : `Ratio ${ratio}:1 below minimum — transfer_bytes may exceed total_bytes (pipeline inversion)`,
  });

  // CHECK C: Zero-unused plausibility
  const zeroUnusedSuspect =
    coverageMetrics.unusedPct === 0 &&
    classifiedResources.cssTotalBytes > CFG.ZERO_UNUSED_SUSPECT_THRESHOLD_BYTES;

  if (zeroUnusedSuspect) {
    zeroUnusedFlagged = true;
  }

  checks.push({
    check: 'zero_unused_plausibility',
    unused_pct: coverageMetrics.unusedPct,
    css_total_bytes: classifiedResources.cssTotalBytes,
    threshold_bytes: CFG.ZERO_UNUSED_SUSPECT_THRESHOLD_BYTES,
    passed: !zeroUnusedSuspect,
    note: zeroUnusedSuspect
      ? `0% unused on ${classifiedResources.cssTotalBytes} bytes is statistically implausible. ` +
        'Coverage snapshot likely taken before stylesheets were fully applied, or coverage API returned null measurement.'
      : '0% unused is plausible given stylesheet size',
  });

  const allPassed = checks.every(c => c.passed);

  return { allPassed, hasClassificationError, zeroUnusedFlagged, checks };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildInvalidResult(status, classifiedResources, snapshotTimingMs, reason) {
  return {
    status,
    css_transfer_bytes: classifiedResources.cssTransferBytes,
    css_total_bytes: classifiedResources.cssTotalBytes,
    css_unused_bytes: null,
    css_unused_pct: null,
    css_used_bytes: null,
    font_transfer_bytes: classifiedResources.fontTransferBytes,
    font_total_bytes: classifiedResources.fontTotalBytes,
    measurement_health: {
      stylesheet_count_network: classifiedResources.cssFileCount,
      stylesheet_count_browser: null,
      compression_ratio: classifiedResources.compressionRatio,
      zero_unused_flagged: false,
      snapshot_timing_ms: snapshotTimingMs,
      validation_checks: [],
      status,
      failure_reason: reason,
    },
  };
}

/**
 * Promise-based sleep. Named constant used at call sites.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLING HARNESS — how to integrate into existing Playwright audit runner
// SITE-SPECIFIC ASSUMPTION: adjust page URL and navigation options per environment
// ─────────────────────────────────────────────────────────────────────────────
import { chromium } from 'playwright';
import { collectCssCoverage } from './css-coverage-collector.js';

async function auditPage(targetUrl) {
  // SITE-SPECIFIC ASSUMPTION: targetUrl must be set by the calling audit pipeline
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new TypeError('auditPage: targetUrl must be a non-empty string');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Collect network log BEFORE navigation
  const networkLog = [];

  page.on('response', async (response) => {
    try {
      const headers = response.headers();
      const contentType = headers['content-type'] || '';
      const request = response.request();

      networkLog.push({
        url: response.url(),
        contentType,
        // transferSize: bytes over the wire (compressed)
        // encodedBodySize: decompressed body size
        // Playwright does not expose these directly — use CDP ResourceTiming
        // SITE-SPECIFIC ASSUMPTION: replace with CDP-based sizing if available
        transferSize: 0,      // populated via CDP ResourceTiming below
        encodedBodySize: 0,   // populated via CDP ResourceTiming below
      });
    } catch {
      // Swallow — response listener must never crash the audit
    }
  });

  // Start CSS coverage BEFORE navigation (required by CDP)
  await page.coverage.startCSSCoverage();

  // Navigate and wait for load event
  await page.goto(targetUrl, {
    waitUntil: 'load',
    // SITE-SPECIFIC ASSUMPTION: adjust timeout per site's expected load time
    timeout: 30000,
  });

  // Collect resource timing via CDP to get accurate transfer/body sizes
  const cdpSession = await page.context().newCDPSession(page);
  try {
    const resourceTree = await cdpSession.send('Network.getResponseBodyForInterception', {}).catch(() => null);
    // SITE-SPECIFIC ASSUMPTION: use Performance.getEntriesByType('resource') as fallback
    const perfEntries = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(e => ({
        name: e.name,
        transferSize: e.transferSize,
        encodedBodySize: e.encodedBodySize,
        decodedBodySize: e.decodedBodySize,
      }));
    });

    // Merge performance timing into networkLog
    for (const logEntry of networkLog) {
      const perfEntry = perfEntries.find(e => e.name === logEntry.url);
      if (perfEntry) {
        logEntry.transferSize = perfEntry.transferSize || 0;
        logEntry.encodedBodySize = perfEntry.decodedBodySize || 0; // decodedBodySize = uncompressed
      }
    }
  } finally {
    // OBSERVER TEARDOWN: always detach CDP session
    await cdpSession.detach().catch(() => {});
  }

  // Collect coverage with deterministic timing and cross-validation
  const coverageResult = await collectCssCoverage(page, networkLog);

  await browser.close();

  return coverageResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL AUDIT SCRIPT — Chrome DevTools Console
// Run this in DevTools console on the privacy policy page to get ground-truth
// baseline independent of the automated pipeline.
// ─────────────────────────────────────────────────────────────────────────────

// Paste into Chrome DevTools Console after opening Coverage panel
// (F12 → More Tools → Coverage → click record → reload → stop)
// This script reads the Coverage panel results programmatically.

(function auditStylesheetCoverage() {
  const sheets = Array.from(document.styleSheets);

  console.group('CSS Coverage Manual Audit');
  console.log(`Total stylesheets in document.styleSheets: ${sheets.length}`);

  sheets.forEach((sheet, index) => {
    try {
      const rules = sheet.cssRules || sheet.rules;
      console.log(
        `Sheet ${index + 1}: ${sheet.href || '(inline)'} — ` +
        `${rules ? rules.length : 'CORS-blocked'} rules`
      );
    } catch (e) {
      // Cross-origin stylesheets throw SecurityError on cssRules access
      console.warn(`Sheet ${index + 1}: ${sheet.href} — CORS-blocked, cannot read rules`);
    }
  });

  // Report Performance API resource sizes for CSS files
  const cssResources = performance.getEntriesByType('resource')
    .filter(e => {
      // SITE-SPECIFIC ASSUMPTION: adjust initiatorType if needed
      return e.initiatorType === 'link' && e.name.includes('.css');
    });

  console.group('CSS Resource Sizes (from Performance API)');
  cssResources.forEach(r => {
    console.log([
      `URL: ${r.name}`,
      `Transfer: ${(r.transferSize / 1024).toFixed(1)}KB`,
      `Decoded: ${(r.decodedBodySize / 1024).toFixed(1)}KB`,
      `Ratio: ${r.transferSize > 0 ? (r.decodedBodySize / r.transferSize).toFixed(1) : 'N/A'}:1`,
    ].join(' | '));
  });
  console.groupEnd();

  // Report font resources separately to confirm they are NOT in CSS totals
  const fontResources = performance.getEntriesByType('resource')
    .filter(e => e.initiatorType === 'other' || e.name.match(/\.(woff2?|ttf|otf)$/i));

  console.group('Font Resource Sizes (should NOT be in CSS totals)');
  fontResources.forEach(r => {
    console.log(
      `URL: ${r.name} | Transfer: ${(r.transferSize / 1024).toFixed(1)}KB | ` +
      `Decoded: ${(r.decodedBodySize / 1024).toFixed(1)}KB`
    );
  });
  console.groupEnd();

  console.groupEnd();
})();

// ─────────────────────────────────────────────────────────────────────────────
// PURGECSS CONFIGURATION — for use AFTER measurement is validated
// Run across representative page set, not a single page
// SITE-SPECIFIC ASSUMPTION: adjust content globs per CMS template structure
// ─────────────────────────────────────────────────────────────────────────────

// purgecss.config.js
export default {
  // SITE-SPECIFIC ASSUMPTION: adjust these globs to match your CMS template paths
  content: [
    './templates/**/*.html',
    './templates/**/*.njk',
    './templates/**/*.liquid',
    './src/**/*.js',
    './src/**/*.ts',
  ],

  // SITE-SPECIFIC ASSUMPTION: point to your compiled stylesheet
  css: ['./dist/styles/main.css'],

  // Safelist: selectors that are dynamically added by JS and would be
  // incorrectly purged. Audit your JS for dynamically-added class names.
  // SITE-SPECIFIC ASSUMPTION: populate with your CMS's dynamic class patterns
  safelist: {
    standard: [
      // Consent platform injected classes
      /^onetrust-/,
      /^ot-/,
      // CMS state classes
      /^is-/,
      /^has-/,
      /^js-/,
    ],
    deep: [
      // Deep-match for nested component states
      /^menu-/,
    ],
    greedy: [],
  },

  // Output rejected selectors for audit review
  rejected: true,
  rejectedCss: true,

  // SITE-SPECIFIC ASSUMPTION: adjust output path per build pipeline
  output: './dist/styles/',
};

```

## Risks
- RISK: The corrected measurement may reveal that the 7KB stylesheet finding is accurate and the 1.4MB figure was entirely font byte misclassification — meaning there is no unused CSS problem to fix. Mitigation: treat this as a positive outcome; the manual audit baseline (Step 4) will confirm before any CSS removal is attempted.
- RISK: The stylesheet stability polling loop (Step 2, Condition C) may not terminate if a CMS or consent platform continuously injects and removes stylesheets (e.g., A/B testing tools that swap stylesheets on each poll). Mitigation: the SNAPSHOT_TIMEOUT_MS hard deadline (10 seconds) guarantees termination; the result is recorded as 'timeout' rather than hanging indefinitely.
- RISK: PurgeCSS (Step 5) may incorrectly remove selectors that are added dynamically by JavaScript at runtime (e.g., CMS state classes, consent platform overlays, JS-toggled menu states). Mitigation: the safelist configuration in the code example must be populated with all dynamic class patterns before running PurgeCSS in production. Run PurgeCSS in 'rejected' mode first and manually review the rejected selector list before deploying.
- RISK: The Performance API's transferSize may return 0 for cached resources (browser cache or service worker cache), causing the compression ratio check to produce a null result rather than a valid ratio. Mitigation: the crossValidate function treats null compression ratio as a skipped check rather than a failure; the audit harness should be run with cache disabled (page.route or CDP Network.setCacheDisabled) for accurate sizing.
- RISK: Cross-origin stylesheets (loaded from a CDN with CORS restrictions) will throw SecurityError when cssRules is accessed in the manual audit script. Mitigation: the manual script includes a try-catch that logs the CORS-blocked sheet without crashing; cross-origin sheets are still counted in document.styleSheets.length for the count parity check.
- RISK: If the platform uses CSS-in-JS (e.g., styled-components, Emotion, Stitches), the runtime-injected <style> tags will appear in document.styleSheets but not in the network log, causing a persistent count parity mismatch that is not a bug but a structural characteristic of the platform. Mitigation: if count parity mismatch is consistently observed across all pages, document it as a known platform characteristic and adjust the validation logic to treat CSS-in-JS sheets separately from network-loaded sheets.
- RISK: Removing unused CSS from a shared stylesheet may break styles on page types not included in the PurgeCSS content glob. Mitigation: run PurgeCSS content analysis across ALL template types before purging, not just the privacy policy page. Use visual regression testing (Playwright screenshots) across representative pages before deploying purged CSS to production.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
