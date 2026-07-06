---
finding_id: "server-7-dns-prefetch-preconnect-minimal-external"
title: "Missing dns-prefetch/preconnect for plausible.io — minor latency optimization"
severity: "low"
root_cause_cluster: "Cache Configuration — Static Assets Revalidating on Every Request"
why_this_matters: "The plausible.io connection pipeline (DNS → TCP → TLS) currently begins cold when the browser's preload scanner encounters the script tag during HTML parsing."
fix_summary: "Add dns-prefetch and preconnect hints for plausible.io in the Astro layout component's <head>."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# Missing dns-prefetch/preconnect for plausible.io — minor latency optimization

**Finding:** Missing dns-prefetch/preconnect for plausible.io — minor latency optimization  
**Severity:** Low  
**Why this matters:** The plausible.io connection pipeline (DNS → TCP → TLS) currently begins cold when the browser's preload scanner encounters the script tag during HTML parsing.  
**Root cause:** Cache Configuration — Static Assets Revalidating on Every Request  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Add dns-prefetch and preconnect hints for plausible.io in the Astro layout component's <head>.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Analytics Beacon Latency:** The plausible.io connection pipeline (DNS → TCP → TLS) currently begins cold when the browser's preload scanner encounters the script tag during HTML parsing. On a cold connection, DNS resolution alone adds 20–120ms depending on resolver and network conditions; TLS 1.3 adds a further 1-RTT handshake. The preconnect hint moves this work to run in parallel with HTML parsing rather than sequentially after it. The result is that the analytics beacon fires sooner after page load — the latency reduction is bounded by how much of the connection pipeline can be completed before the script tag is reached. This has no effect on LCP, INP, CLS, or any user-facing rendering metric because the plausible.io script is async/deferred and not in the critical rendering path. The sole measurable outcome is faster analytics event delivery, which improves data completeness for sessions where the user navigates away quickly (short sessions where the beacon might not fire before unload on a cold connection).
- **Crawl Budget:** No impact — plausible.io is not a crawlable origin.
- **Regression Risk:** None to rendering. The hints are advisory; browsers that do not support preconnect (effectively none in active use) silently ignore them.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_007`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The page loads one external script from plausible.io but no dns-prefetch or preconnect hint is present for this domain.. With only 1 external domain and the script loaded async, the impact is minimal — the DNS lookup and TLS handshake for plausible.io add ~50-100ms but do not block rendering or interaction.

**Measured evidence:**
- External Domains: ['plausible.io']
- External Domain Count: 1
- Dns Prefetch Present: False
- Preconnect Present: False
- Threshold For Flag: >3 external domains
- Script Is Async: True
- Render Blocking: False
- Script Loading: async

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
Add dns-prefetch and preconnect hints for plausible.io in the Astro layout component's <head>. This is a byproduct fix — implement it in the same pass as the _headers/netlify.toml cluster fix to avoid a standalone deployment cycle for a sub-minute change.

### How
1. Locate the root Astro layout component that injects the plausible.io script tag (typically src/layouts/BaseLayout.astro or equivalent — confirm by searching for 'plausible.io' in the layouts directory).
2. In that component's <head> block, add a dns-prefetch hint followed by a preconnect hint for https://plausible.io. Place both hints before the plausible.io <script> tag and before any other third-party resource hints. Order: dns-prefetch first (no credentials, zero cost), preconnect second (opens TCP+TLS speculatively).
3. Do not add crossorigin to the dns-prefetch link — it is ignored for DNS-only hints and adds no value. Do add crossorigin to the preconnect link because the plausible.io script is a cross-origin fetch and the browser must negotiate credentials mode; omitting crossorigin on preconnect causes a double-connection (one anonymous for the hint, one credentialed for the actual fetch).
4. Verify the existing plausible.io <script> tag carries defer or async (it should per the finding). If it is synchronous/parser-blocking, that is a separate finding — do not conflate it here.
5. Deploy as part of the same commit that adds the _headers or netlify.toml file. No additional deployment cycle required.

### Code examples
```
<!-- src/layouts/BaseLayout.astro -->
<!-- SITE-SPECIFIC ASSUMPTION: plausible.io is the sole external analytics domain.
     If a custom Plausible domain proxy is configured (e.g., analytics.yourdomain.com),
     replace 'https://plausible.io' below with that origin and remove these hints
     for plausible.io entirely — a same-origin proxy needs no resource hints. -->

---
// No props required for this change; this is a static head addition.
// If BaseLayout accepts a Props interface, no changes to it are needed.
---

<head>
  <!-- Existing head content above this line -->

  <!--
    dns-prefetch: instructs the browser to resolve plausible.io's DNS
    in parallel with HTML parsing. No connection is opened; cost is negligible.
    crossorigin is intentionally omitted — it has no effect on dns-prefetch.
  -->
  <link rel="dns-prefetch" href="https://plausible.io" />

  <!--
    preconnect: speculatively completes DNS + TCP + TLS for plausible.io
    before the browser's preload scanner reaches the script tag.
    crossorigin is REQUIRED: the plausible.io script is a cross-origin
    anonymous-mode fetch. Without crossorigin, the browser opens a second
    connection when the actual fetch fires (credentials mode mismatch),
    negating the hint entirely.
  -->
  <link rel="preconnect" href="https://plausible.io" crossorigin />

  <!--
    Existing plausible.io script tag — must remain async or defer.
    Confirm this attribute is present; do not change it as part of this fix.
  -->
  <script
    defer
    data-domain="yourdomain.com"
    src="https://plausible.io/js/script.js"
  ></script>

  <!-- Existing head content below this line -->
</head>
```

## Risks
- If the site uses a first-party proxy for Plausible (e.g., routing /analytics/ to plausible.io via Netlify rewrites), the preconnect hint for https://plausible.io is unnecessary and should be omitted — the request becomes same-origin and incurs no cross-origin connection overhead. Verify proxy configuration before deploying.
- The crossorigin attribute on the preconnect hint must match the credentials mode of the actual script fetch. Plausible's script tag uses anonymous mode (no credentials), so crossorigin (which defaults to anonymous) is correct. If a future Plausible configuration requires credentialed requests, the hint would need crossorigin="use-credentials" — but this is not a current concern.
- Browsers cap the number of speculative preconnect connections they will open simultaneously. With only one external domain (plausible.io), this limit is not a concern. If additional external domains are added in future, audit total preconnect hints to avoid exceeding browser limits (typically 6–10 concurrent speculative connections).

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
