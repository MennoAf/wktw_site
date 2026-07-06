---
finding_id: "inp-interaction-excellent"
title: "INP performance excellent at 24ms — well within 'Good' threshold — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The canary + build gate creates a closed feedback loop: any future change that introduces framework hydration, heavy event listeners, or large JS chunks will either fail the build (bundle budget) or…"
fix_summary: "Codify the architectural constraints that produce 24ms INP as enforced Astro conventions — preventing future contributors from inadvertently introducing the failure modes this page currently avoids."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# INP performance excellent at 24ms — well within 'Good' threshold — PASS

**Finding:** INP performance excellent at 24ms — well within 'Good' threshold — PASS  
**Severity:** Low  
**Why this matters:** The canary + build gate creates a closed feedback loop: any future change that introduces framework hydration, heavy event listeners, or large JS chunks will either fail the build (bundle budget) or…  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Codify the architectural constraints that produce 24ms INP as enforced Astro conventions — preventing future contributors from inadvertently introducing the failure modes this page currently avoids.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Inp Regression Prevention:** The canary + build gate creates a closed feedback loop: any future change that introduces framework hydration, heavy event listeners, or large JS chunks will either fail the build (bundle budget) or surface as a Plausible custom event in production before it compounds. The current 24ms INP is structurally fragile to exactly one class of change — adding a client-side component with `client:load` or `client:idle` directive — which this system catches at build time.
- **Developer Velocity:** Encoding the constraints as automated gates removes the dependency on institutional memory. Contributors who are unaware of why this page is fast cannot silently degrade it — the build fails with an explicit message naming the violated constraint.
- **Search Ranking Protection:** Google's Core Web Vitals documentation confirms INP is a ranking signal in the Page Experience system. Maintaining the current 'Good' cohort status preserves any ranking benefit already accrued; regression to 'Needs Improvement' (>200ms) or 'Poor' (>500ms) would move the page into lower-performing cohorts with documented ranking implications.

## How to verify

**What to look for:** Lab-measured INP is 24ms, well within the 'Good' threshold of <200ms.. The page has a minimal DOM (154 elements, far below the 1,500-node concern threshold), only 1 external async script (Plausible), and 7 inline scripts with low total JS payload (29KB total, 5KB unused at 15.5%).

**Measured evidence:**
- Inp Ms: 24
- Threshold: good (<200ms)
- Dom Elements: 154
- Total Js Kb: 29
- Unused Js Kb: 5
- Dcl S: 0.21
- Load S: 0.34
- Forms Present: 0

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
Codify the architectural constraints that produce 24ms INP as enforced Astro conventions — preventing future contributors from inadvertently introducing the failure modes this page currently avoids. No corrective action is required; the objective is to make the current performance posture durable.

### How
1. Add a PerformanceObserver-based INP canary to the base layout that logs to Plausible as a custom event when INP exceeds 200ms. This creates a regression tripwire without adding render-blocking code.
2. Create an Astro integration (astro.config.mjs) that enforces a JS bundle size budget. Fail the build if total client-side JS exceeds a defined threshold, preventing silent payload growth.
3. Document the three load-bearing constraints in a PERFORMANCE.md committed to the repo: (a) no client-side framework hydration on this template, (b) DOM node ceiling of 1,500, (c) third-party scripts must be async and deferred past LCP. This is the cheapest regression prevention available.
4. Add a Lighthouse CI step to the Netlify build pipeline that gates deployment on INP remaining in the 'Good' cohort (<200ms). Use the existing Netlify build plugin hook — no separate CI infrastructure required.
5. Scope the PerformanceObserver teardown explicitly: disconnect the observer after the first INP entry is captured and reported, preventing unbounded listener accumulation on long sessions.

### Code examples
```
// src/components/INPCanary.astro
// Drop into BaseLayout.astro as <INPCanary /> — renders nothing visible.
// SITE-SPECIFIC ASSUMPTION: Plausible is already loaded via <script defer> in BaseLayout.
// Adjust PLAUSIBLE_EVENT_NAME if your Plausible goal is named differently.

---
// No frontmatter needed — pure client script
---

<script>
  // Named constants — no magic numbers
  const INP_GOOD_THRESHOLD_MS = 200;       // WCAG/CWV 'Good' ceiling
  const INP_EVENT_NAME = 'INP Regression'; // Plausible custom event name — configure per site
  const MAX_OBSERVER_ENTRIES = 1;          // Capture first INP entry only, then disconnect

  (function initINPCanary() {
    // Feature-detect before use — PerformanceObserver + 'event' type not universal
    if (
      typeof PerformanceObserver === 'undefined' ||
      !PerformanceObserver.supportedEntryTypes ||
      !PerformanceObserver.supportedEntryTypes.includes('event')
    ) {
      return;
    }

    let capturedCount = 0;
    let observer;

    try {
      observer = new PerformanceObserver(function handleEntries(list) {
        const entries = list.getEntries();

        for (const entry of entries) {
          // PerformanceEventTiming: processingStart - startTime = input delay
          // duration = full INP latency (input delay + processing + presentation)
          const inp = entry.duration;

          if (inp > INP_GOOD_THRESHOLD_MS) {
            // Null-guard Plausible global — it may not have loaded yet
            if (typeof window.plausible === 'function') {
              window.plausible(INP_EVENT_NAME, {
                props: {
                  inp_ms: Math.round(inp),
                  event_type: entry.name,
                  target: entry.target
                    ? (entry.target.nodeName || 'unknown')
                    : 'unknown'
                }
              });
            }
          }

          capturedCount += 1;

          // Disconnect after MAX_OBSERVER_ENTRIES to prevent unbounded accumulation
          if (capturedCount >= MAX_OBSERVER_ENTRIES && observer) {
            observer.disconnect();
            observer = null;
          }
        }
      });

      // buffered:true captures interactions that occurred before observer registered
      observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch (err) {
      // PerformanceObserver constructor can throw in sandboxed iframes — fail silently
      if (observer) {
        observer.disconnect();
      }
    }
  })();
</script>
// astro.config.mjs — JS bundle size budget enforcement
// Fails the Astro build if any single client JS chunk exceeds the threshold.
// SITE-SPECIFIC ASSUMPTION: Vite is the underlying bundler (Astro default).
// Adjust JS_CHUNK_SIZE_LIMIT_KB based on your acceptable payload ceiling.

import { defineConfig } from 'astro/config';

// Named constants
const JS_CHUNK_SIZE_LIMIT_KB = 50;  // Current site is 29KB — ceiling set with headroom
const JS_CHUNK_SIZE_LIMIT_BYTES = JS_CHUNK_SIZE_LIMIT_KB * 1024;

export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          // Deterministic chunk naming for cache-busting traceability
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js'
        }
      },
      // Vite will warn (not fail) on chunks exceeding this — pair with the
      // custom plugin below to hard-fail the build
      chunkSizeWarningLimit: JS_CHUNK_SIZE_LIMIT_KB
    },
    plugins: [
      {
        name: 'js-budget-enforcer',
        // Runs after bundle generation, before write — safe to throw here
        generateBundle(_options, bundle) {
          const violations = [];

          for (const [fileName, chunk] of Object.entries(bundle)) {
            if (chunk.type !== 'chunk') continue;

            const sizeBytes = Buffer.byteLength(chunk.code, 'utf8');

            if (sizeBytes > JS_CHUNK_SIZE_LIMIT_BYTES) {
              violations.push(
                `${fileName}: ${(sizeBytes / 1024).toFixed(1)}KB exceeds ${JS_CHUNK_SIZE_LIMIT_KB}KB limit`
              );
            }
          }

          if (violations.length > 0) {
            // Hard build failure — Netlify deploy will not proceed
            throw new Error(
              `JS bundle budget exceeded. Fix before deploying:\n${violations.join('\n')}`
            );
          }
        }
      }
    ]
  }
});
# netlify.toml — Lighthouse CI gate on INP
# SITE-SPECIFIC ASSUMPTION: lighthouserc.json exists at repo root (see below).
# This runs Lighthouse against the Netlify deploy preview URL before promotion.

[build]
  command = "npm run build"
  publish = "dist"

[[plugins]]
  package = "netlify-plugin-lighthouse"

  [plugins.inputs]
    # Fail deploy if any Lighthouse performance audit score drops below threshold
    # INP is a component of the Performance score — regression surfaces here
    output_path = "reports/lighthouse"

    [plugins.inputs.thresholds]
      performance = 0.9
      accessibility = 0.95
      best-practices = 0.9
      seo = 0.9
// lighthouserc.json — placed at repo root
// SITE-SPECIFIC ASSUMPTION: Adjust 'url' to match your Netlify deploy preview pattern.
// The maxNumericValue for 'interaction-to-next-paint' is in milliseconds.

{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "interaction-to-next-paint": [
          "error",
          {
            "maxNumericValue": 200,
            "aggregationMethod": "median-run"
          }
        ],
        "total-blocking-time": [
          "warn",
          {
            "maxNumericValue": 150,
            "aggregationMethod": "median-run"
          }
        ]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## Risks
- The PerformanceObserver `event` entry type has ~88% browser support as of 2024 — the feature-detect guard handles non-supporting browsers silently, but INP regressions on Safari (which does not support `event` type) will not be captured by the canary. Supplement with Real User Monitoring if Safari traffic is significant.
- The Vite `generateBundle` hook measures uncompressed chunk size. Gzip/Brotli compression typically reduces JS by 60-70%, so a 50KB uncompressed limit corresponds to roughly 15-20KB on the wire. Calibrate the threshold against your actual transfer budget, not the uncompressed figure.
- The `netlify-plugin-lighthouse` runs against the deploy preview, which may differ from production in CDN edge caching behavior. A cold-cache Lighthouse run will produce higher TTFB than a warmed CDN edge — do not use Lighthouse TTFB numbers as production TTFB ground truth.
- Setting `durationThreshold: 16` on the PerformanceObserver captures all interactions above one frame (16ms), which may generate noise from fast-but-not-INP events. If Plausible event volume becomes a concern, raise the threshold to match `INP_GOOD_THRESHOLD_MS` (200) to only observe regressions.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
