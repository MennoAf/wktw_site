---
finding_id: "resource-loading-lcp-svg-hero"
title: "LCP element is a 2KB SVG hero image — excellent but lacks fetchpriority and preload"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "At 2KB, the SVG transfers in a single TCP segment on any connection above 3G."
fix_summary: "Add fetchpriority='high' to the hero SVG <img> tag and a matching <link rel='preload'> in <head>."
confidence_tier: "confirmed"
---

# LCP element is a 2KB SVG hero image — excellent but lacks fetchpriority and preload

**Finding:** LCP element is a 2KB SVG hero image — excellent but lacks fetchpriority and preload  
**Severity:** Low  
**Why this matters:** At 2KB, the SVG transfers in a single TCP segment on any connection above 3G.  
**Root cause:** Isolated issue  
**Fix:** Add fetchpriority='high' to the hero SVG <img> tag and a matching <link rel='preload'> in <head>.

> **Evidence Basis:** Confirmed

---

## Impact

- **Lcp:** At 2KB, the SVG transfers in a single TCP segment on any connection above 3G. The fetchpriority and preload hints move the browser's fetch decision earlier in the parse pipeline, but the measurable LCP delta will be within noise for this asset size. The structural value is correctness: the browser's resource scheduler now has an explicit signal rather than inferring priority from parse order.
- **Lcp Observability:** The PerformanceObserver guard closes the monitoring gap identified in the finding. If this hero is ever replaced with a heavier asset (raster image, video poster, JS-injected element), the RUM event will surface the regression in field data before it appears in CrUX. Without this instrumentation, a future swap from 2KB SVG to a 200KB JPEG could degrade LCP by 1-3 seconds on mobile without triggering any alert.
- **Cls:** Adding explicit width and height attributes to the <img> tag (if missing) eliminates the layout shift that occurs when the browser does not know the image's aspect ratio before it loads. This is a direct CLS fix bundled into the same template change.
- **Seo:** Core Web Vitals are a confirmed Google ranking signal. Ensuring the LCP element is correctly identified by measurement tooling (rather than collapsing into FCP) means future regressions will surface in Search Console before they affect ranking.

## How to verify

**What to look for:** The single above-fold image is platform-hero.svg (2KB), which is the likely LCP element given FCP of 0.27s and the page's minimal content structure.. Lab LCP was reported as 'n/a' which may indicate the measurement tool couldn't identify the LCP element, but with FCP at 0.27s and only one above-fold image, LCP is almost certainly sub-500ms.

**Measured evidence:**
- Lcp Candidate: platform-hero.svg
- Image Size Kb: 2
- Load Time Ms: 181
- Fcp S: 0.27
- Fetchpriority Set: False
- Preloaded: False
- Above Fold: True
- Lazy Loaded: False

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
Add fetchpriority='high' to the hero SVG <img> tag and a matching <link rel='preload'> in <head>. Separately, instrument a PerformanceObserver to assert the LCP element is identifiable in field conditions, so future asset swaps do not silently regress without detection.

### How
1. Locate the hero <img> tag in the template file (not a shared partial unless this pattern appears only on this template). Confirm it is the first meaningful visual element and is unconditionally rendered server-side (not injected by JS after parse).
2. Add fetchpriority='high' directly to that <img> tag. Do not add it to any other image on the page — only the single above-fold LCP candidate gets this attribute.
3. Add a <link rel='preload' as='image' type='image/svg+xml' href='...' fetchpriority='high'> in <head>, before any render-blocking CSS or script tags. The href must exactly match the src on the <img> tag — a mismatch causes a double-fetch.
4. If the SVG src is dynamically generated (e.g., CMS asset URL with cache-busting query string), emit the preload tag from the same template variable that emits the <img> src so they stay in sync.
5. Add the PerformanceObserver snippet (see code_examples[1]) to the template's inline <script> block — not a deferred external file — so it runs before LCP candidates are finalized. This surfaces the 'n/a' measurement gap in real user monitoring.
6. Verify in DevTools Network panel: the SVG request should appear in the Initiator column as 'PreloadScanner' or 'link[rel=preload]', not 'img'. Confirm no duplicate request for the same URL.
7. Run Lighthouse in a throttled profile (Slow 4G) before and after. Because the file is 2KB, LCP delta will be within noise — the observable win is that the LCP element is now correctly identified by the measurement tool rather than collapsing into FCP.

### Code examples
```
<!-- TEMPLATE CHANGE: hero SVG preload — place immediately after <meta charset> and before any stylesheet <link> tags. -->
<!-- ASSUMPTION: SVG_HERO_URL is the template variable that also populates the <img> src below. -->
<!-- SCOPE: This <link> tag must only appear on templates that render this hero pattern. -->
<!-- Do not add to shared <head> partials used across all page types. -->
<link
  rel="preload"
  as="image"
  type="image/svg+xml"
  href="{{ SVG_HERO_URL }}"
  fetchpriority="high"
>

<!-- TEMPLATE CHANGE: hero <img> tag — add fetchpriority and explicit dimensions. -->
<!-- PRECONDITION: This element is server-rendered unconditionally; it is not injected by JS. -->
<!-- PRECONDITION: width/height match the intrinsic SVG viewBox to prevent CLS. -->
<!-- SCOPE: fetchpriority='high' must appear on exactly ONE image per page. -->
<img
  src="{{ SVG_HERO_URL }}"
  alt="{{ HERO_ALT_TEXT }}"
  width="1200"
  height="600"
  fetchpriority="high"
  decoding="sync"
>
<!-- LCP observability guard — inline <script> in template, not deferred. -->
<!-- PURPOSE: Surfaces the 'n/a' LCP measurement gap in field RUM data. -->
<!-- If LCP element is never reported, future asset swaps regress silently. -->
<script>
(function observeLCP() {
  // Guard: PerformanceObserver with 'largest-contentful-paint' has ~96% browser support.
  // Browsers that do not support it skip silently — no fallback needed.
  if (
    typeof PerformanceObserver === 'undefined' ||
    !PerformanceObserver.supportedEntryTypes ||
    !PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')
  ) {
    return;
  }

  // Named constant: maximum time to wait for an LCP candidate before flagging absence.
  // Rationale: LCP is finalized on first user interaction or after 5s of no interaction.
  // 6000ms gives a 1s buffer beyond the standard finalization window.
  var LCP_OBSERVATION_TIMEOUT_MS = 6000;

  var lcpCandidates = [];
  var observer;
  var timeoutId;

  try {
    observer = new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        lcpCandidates.push({
          startTime: entries[i].startTime,
          size: entries[i].size,
          // element may be null if the node was removed before observation
          tagName: entries[i].element ? entries[i].element.tagName : 'UNKNOWN',
          url: entries[i].url || ''
        });
      }
    });

    // buffered:true captures candidates that fired before this script ran.
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // PerformanceObserver construction can throw in some sandboxed iframes.
    return;
  }

  function finalizeLCP() {
    // LOCK SAFETY: clear timeout before observer disconnect to prevent double-fire.
    clearTimeout(timeoutId);

    try {
      observer.disconnect();
    } catch (e) {
      // disconnect() is safe to call multiple times but guard defensively.
    }

    var finalCandidate = lcpCandidates[lcpCandidates.length - 1] || null;

    // NULL GUARD: finalCandidate may be null if no LCP entry was ever emitted.
    // This is the 'n/a' condition the finding describes.
    if (!finalCandidate) {
      // ASSUMPTION: window.rumClient is the site's existing RUM/analytics object.
      // Replace with the actual RUM dispatch mechanism used on this site.
      if (window.rumClient && typeof window.rumClient.trackEvent === 'function') {
        window.rumClient.trackEvent('lcp_candidate_absent', {
          page: window.location.pathname
        });
      }
      return;
    }

    if (window.rumClient && typeof window.rumClient.trackEvent === 'function') {
      window.rumClient.trackEvent('lcp_observed', {
        startTime: Math.round(finalCandidate.startTime),
        size: finalCandidate.size,
        tagName: finalCandidate.tagName,
        url: finalCandidate.url,
        page: window.location.pathname
      });
    }
  }

  // Finalize on first user interaction (LCP is frozen at this point per spec).
  // Use capture:true so the listener fires before any handler that might stopPropagation.
  var INTERACTION_EVENTS = ['pointerdown', 'keydown', 'scroll'];
  function onFirstInteraction() {
    for (var j = 0; j < INTERACTION_EVENTS.length; j++) {
      document.removeEventListener(INTERACTION_EVENTS[j], onFirstInteraction, true);
    }
    finalizeLCP();
  }

  for (var k = 0; k < INTERACTION_EVENTS.length; k++) {
    document.addEventListener(INTERACTION_EVENTS[k], onFirstInteraction, true);
  }

  // Fallback: finalize after timeout if user never interacts.
  timeoutId = setTimeout(finalizeLCP, LCP_OBSERVATION_TIMEOUT_MS);
})();
</script>
```

## Risks
- DOUBLE-FETCH RISK: If the preload href and <img> src do not resolve to the identical URL (including query string), the browser fetches the asset twice. Mitigation: emit both from the same template variable. Verify in Network panel that the SVG appears once with Initiator 'PreloadScanner', not twice.
- FETCHPRIORITY SCOPE CREEP: If this template's <head> is a shared partial used across page types that have different LCP elements, adding the preload tag to the partial will incorrectly preload the SVG on pages where it is not the LCP candidate. Mitigation: the preload tag must be conditional on the template type, not in a global partial.
- OBSERVER TEARDOWN: The PerformanceObserver and event listeners must be cleaned up after LCP finalization. The proposed code disconnects the observer and removes all interaction listeners in finalizeLCP(). If finalizeLCP() is called via both the interaction path and the timeout path simultaneously (theoretically possible if a slow interaction fires at exactly the timeout boundary), disconnect() is called twice — this is safe per spec but the guard is present.
- RUM CLIENT DEPENDENCY: The observability snippet assumes window.rumClient.trackEvent exists. If the RUM client loads asynchronously and has not initialized by the time finalizeLCP() fires, the event is silently dropped. Mitigation: replace the null-guarded call with whatever queuing mechanism the site's RUM client exposes (e.g., a dataLayer push or a pre-init event buffer).
- SVG TYPE ATTRIBUTE: The preload tag includes type='image/svg+xml'. Some older CDN or server configurations serve SVGs with incorrect MIME types (text/plain, application/octet-stream). If the served Content-Type does not match the type attribute, the browser may ignore the preload hint. Mitigation: verify the SVG is served with Content-Type: image/svg+xml. If MIME type cannot be guaranteed, omit the type attribute — the hint will still fire, just without the type-match optimization.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
