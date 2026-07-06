---
finding_id: "resource-1-lcp-unverified"
title: "LCP not measured — likely text-based LCP with sub-second timing"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The lab tooling gap (LCP reported as n/a) creates a false audit signal that can trigger unnecessary remediation work or fail automated CI performance budgets."
fix_summary: "Instrument the text-primary LCP candidate with a PerformanceObserver that captures the real LCP timestamp client-side and reports it to CrUX-compatible field data, eliminating the lab tooling measure…"
confidence_tier: "unverified"
remediation_surface: "source_code"
---

# LCP not measured — likely text-based LCP with sub-second timing

**Finding:** LCP not measured — likely text-based LCP with sub-second timing  
**Severity:** Low  
**Why this matters:** The lab tooling gap (LCP reported as n/a) creates a false audit signal that can trigger unnecessary remediation work or fail automated CI performance budgets.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Instrument the text-primary LCP candidate with a PerformanceObserver that captures the real LCP timestamp client-side and reports it to CrUX-compatible field data, eliminating the lab tooling measure…  

> **Evidence Basis:** Needs Verification

---

## Impact

- **Core Web Vitals Visibility:** The lab tooling gap (LCP reported as n/a) creates a false audit signal that can trigger unnecessary remediation work or fail automated CI performance budgets. Adding `elementtiming` forces Lighthouse and WebPageTest to emit a distinct LCP entry, converting the n/a into a measurable sub-300ms value that accurately reflects the real paint. This eliminates false-positive failures in CI pipelines that gate on LCP presence.
- **Field Data Confidence:** The PerformanceObserver beacon surfaces real-user LCP distribution from Chrome's internal paint timing — the same source CrUX uses. Once field data accumulates (28-day window), the CrUX LCP distribution will confirm or refute the sub-300ms hypothesis. If confirmed, the site qualifies for the 'Good' Core Web Vitals badge in Search Console, which Google documents as a ranking signal for page experience.
- **Operational Risk Reduction:** Without field measurement, any future template change (adding an above-fold image, changing font loading strategy) could silently degrade LCP with no alerting. The beacon pipeline enables threshold alerting: if LCP drifts above 1200ms (elite threshold) or 2500ms (Good/Needs Improvement boundary), the team is notified before it affects CrUX.

## How to verify

**What to look for:** Lab LCP is reported as 'n/a', which is unusual.. With FCP at 0.28s and zero images above the fold, the LCP element is almost certainly a text node (the H1 or a large text block).

**Measured evidence:**
- Lcp Reported: n/a
- Fcp Ms: 280
- Above Fold Images: 0
- Likely Lcp Element: text (H1 or hero text block)
- Font Display: swap
- Preloaded Fonts: ['inter-latin.woff2 (47KB)', 'lora-latin.woff2 (21KB)']
- Fcp S: 0.23
- Page Load S: 0.29

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
Instrument the text-primary LCP candidate with a PerformanceObserver that captures the real LCP timestamp client-side and reports it to CrUX-compatible field data, eliminating the lab tooling measurement gap. No rendering changes are needed — the underlying font strategy is correct. The fix is purely observability: surface the sub-300ms LCP that is already happening so it can be monitored, verified against CrUX field data, and defended in audits.

### How
1. Create a reusable Astro component `LCPObserver.astro` that installs a `largest-contentful-paint` PerformanceObserver inline (not deferred) so it fires before any framework hydration or script execution can interfere.
2. The observer captures the last LCP entry (browsers emit multiple candidates; the final one before the user interacts is the authoritative value), then reports it via `navigator.sendBeacon` to a lightweight Netlify Function endpoint that writes to your analytics pipeline. If no analytics pipeline exists, log to the browser console in development and no-op in production until one is wired.
3. Add `elementtiming` attributes to the H1 and hero paragraph on text-primary templates so the browser explicitly marks those elements as LCP candidates — this forces lab tools (Lighthouse, WebPageTest) to emit a distinct LCP entry rather than collapsing it into FCP.
4. Add the `LCPObserver` component to the text-primary layout (not the global layout) so it only runs on pages with the zero-above-fold-image pattern. Pages with hero images already produce a measurable LCP candidate and do not need this.
5. Verify in Chrome DevTools Performance panel (not Lighthouse) that the `largest-contentful-paint` entry appears with a non-null `startTime` after adding `elementtiming`. This is the ground-truth check — Lighthouse's lab gap does not affect the real PerformanceObserver API.
6. Cross-reference against CrUX Dashboard or PageSpeed Insights field data (28-day rolling window) to confirm the real-user LCP distribution. CrUX is immune to the lab tooling artifact because it reads from Chrome's internal paint timing, not from a PerformanceObserver harness.

### Code examples
```
<!-- src/components/LCPObserver.astro -->
<!-- Drop into text-primary layout only: import LCPObserver from '../components/LCPObserver.astro' -->
<!-- Precondition: this component renders server-side; the inline script executes synchronously on parse, before any defer/async scripts -->

<script is:inline>
  (function installLCPObserver() {
    // SITE-SPECIFIC ASSUMPTION: adjust this endpoint to your Netlify Function path
    // or replace the sendBeacon call with your analytics integration.
    var BEACON_ENDPOINT = '/.netlify/functions/lcp-report';

    // Named constant: browsers emit LCP entries until first user interaction.
    // We hold the last entry seen and flush on visibilitychange or pagehide.
    var LCP_FINALIZATION_EVENTS = ['visibilitychange', 'pagehide'];

    if (
      typeof window === 'undefined' ||
      !('PerformanceObserver' in window) ||
      !PerformanceObserver.supportedEntryTypes ||
      PerformanceObserver.supportedEntryTypes.indexOf('largest-contentful-paint') === -1
    ) {
      // Browser does not support LCP observation — no-op gracefully.
      return;
    }

    var lastLCPEntry = null;
    var reported = false;

    function reportLCP() {
      // Lock: only report once per page lifecycle to prevent duplicate beacons.
      if (reported || !lastLCPEntry) return;
      reported = true;

      var payload = JSON.stringify({
        lcp_ms: Math.round(lastLCPEntry.startTime),
        lcp_element: lastLCPEntry.element
          ? (lastLCPEntry.element.tagName + (lastLCPEntry.element.id ? '#' + lastLCPEntry.element.id : ''))
          : 'unknown',
        lcp_url: window.location.pathname,
        lcp_size: lastLCPEntry.size
      });

      // sendBeacon is fire-and-forget; safe to call during pagehide.
      // Fallback: if sendBeacon is unavailable (rare), silently drop — do not
      // block page unload with a synchronous XHR.
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(BEACON_ENDPOINT, payload);
      }
    }

    var observer = new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      // Always take the last entry — browsers emit candidates in ascending size order;
      // the final candidate before interaction is the authoritative LCP.
      if (entries.length > 0) {
        lastLCPEntry = entries[entries.length - 1];
      }
    });

    // buffered: true captures entries that fired before this observer was registered
    // (critical for fast-painting pages where LCP fires before script execution).
    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // observe() throws if entry type is unsupported in some older browsers.
      return;
    }

    // Finalize on visibility loss (tab switch, navigate away) or pagehide.
    // Using named handler so it can be removed after first fire.
    function onFinalize() {
      if (document.visibilityState === 'hidden' || arguments[0].type === 'pagehide') {
        reportLCP();
        // Teardown: remove listeners and disconnect observer after reporting.
        LCP_FINALIZATION_EVENTS.forEach(function(evt) {
          document.removeEventListener(evt, onFinalize);
        });
        observer.disconnect();
      }
    }

    LCP_FINALIZATION_EVENTS.forEach(function(evt) {
      document.addEventListener(evt, onFinalize, { capture: true });
    });
  })();
</script>
<!-- src/layouts/TextPrimaryLayout.astro -->
<!-- Add elementtiming to the H1 and lead paragraph so lab tools emit a distinct LCP entry. -->
<!-- SITE-SPECIFIC ASSUMPTION: adjust slot structure to match your actual layout. -->
---
import LCPObserver from '../components/LCPObserver.astro';
const { title, description } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- existing head content -->
  </head>
  <body>
    <!-- elementtiming must be on the element itself, not a wrapper.
         The attribute value is a developer-chosen label surfaced in PerformanceObserver
         entries for Element Timing API — it does not affect rendering. -->
    <h1 elementtiming="lcp-heading">{title}</h1>
    {description && (
      <p elementtiming="lcp-lead">{description}</p>
    )}
    <slot />
    <!-- Observer runs after body parse; buffered:true catches earlier LCP entries -->
    <LCPObserver />
  </body>
</html>
// netlify/functions/lcp-report.mts
// Minimal Netlify Function to receive LCP beacons.
// SITE-SPECIFIC ASSUMPTION: replace the console.log with your analytics write
// (e.g., Plausible custom event, PostHog capture, or a time-series store).
// This function intentionally does no auth — LCP payloads contain no PII.

import type { Context } from '@netlify/functions';

// Named constant: cap payload size to prevent abuse of the open endpoint.
const MAX_PAYLOAD_BYTES = 512;

export default async function handler(req: Request, _ctx: Context): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response('Payload Too Large', { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // Type guard: only accept the shape we expect.
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).lcp_ms !== 'number'
  ) {
    return new Response('Bad Request', { status: 400 });
  }

  const { lcp_ms, lcp_element, lcp_url, lcp_size } = body as {
    lcp_ms: number;
    lcp_element: string;
    lcp_url: string;
    lcp_size: number;
  };

  // Replace this with your analytics sink.
  console.log(JSON.stringify({ event: 'lcp', lcp_ms, lcp_element, lcp_url, lcp_size }));

  return new Response(null, { status: 204 });
}
```

## Risks
- elementtiming on H1 changes which element the browser nominates as the LCP candidate on pages where a larger element exists below the fold — verify in DevTools Performance panel that the nominated element is still the intended one after adding the attribute.
- The Netlify Function endpoint is unauthenticated by design (LCP payloads contain no PII), but it is publicly POST-able. The 512-byte payload cap and JSON type guard mitigate abuse, but a determined actor could still generate beacon noise. If this becomes a concern, add a static HMAC token in the beacon payload verified server-side.
- buffered: true on PerformanceObserver is supported in all modern browsers but was not available in Chrome <77 or Safari <14.1. On those browsers the observer still installs but may miss entries that fired before registration — the reported LCP will be null and the beacon will not fire (the `if (!lastLCPEntry)` guard prevents a malformed beacon). This is acceptable: those browsers represent a negligible share of traffic and CrUX already excludes them.
- The `is:inline` directive in Astro bypasses Vite's bundler, meaning this script is not tree-shaken or minified by default. The script is intentionally small (<2KB unminified) and self-contained, so this is acceptable. Do not import external modules into this script block.
- If the text-primary layout is also used for pages that later gain above-fold images, the LCPObserver will still fire correctly (it observes whatever the browser nominates), but the `elementtiming` attributes on H1/paragraph may compete with the image as LCP candidate. This is harmless — the browser always selects the largest candidate regardless of `elementtiming` labels.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
