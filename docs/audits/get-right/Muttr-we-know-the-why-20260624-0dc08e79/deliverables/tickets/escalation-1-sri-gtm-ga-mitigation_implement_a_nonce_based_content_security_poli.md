---
finding_id: "escalation-1-sri-gtm-ga-mitigation"
title: "SRI infeasible for GTM/GA4 scripts — nonce-based CSP is the appropriate mitigation"
severity: "high"
root_cause_cluster: "Missing Security Headers and Supply-Chain Protection"
why_this_matters: "CSP with nonce-based script-src eliminates the browser's ability to execute injected scripts that lack the per-response nonce."
fix_summary: "Implement a nonce-based Content-Security-Policy header in Report-Only mode first, then enforce it."
confidence_tier: "confirmed"
---

# SRI infeasible for GTM/GA4 scripts — nonce-based CSP is the appropriate mitigation

**Finding:** SRI infeasible for GTM/GA4 scripts — nonce-based CSP is the appropriate mitigation  
**Severity:** High  
**Why this matters:** CSP with nonce-based script-src eliminates the browser's ability to execute injected scripts that lack the per-response nonce.  
**Root cause:** Missing Security Headers and Supply-Chain Protection  
**Fix:** Implement a nonce-based Content-Security-Policy header in Report-Only mode first, then enforce it.

> **Evidence Basis:** Confirmed

---

## Impact

- **Security Xss Defense:** CSP with nonce-based script-src eliminates the browser's ability to execute injected scripts that lack the per-response nonce. Without CSP, a successful XSS injection can execute arbitrary JavaScript with full page context. With enforced CSP, injected scripts are blocked at the browser level before execution, regardless of how the injection entered the DOM. This is the primary defense layer against XSS — server-side sanitization is the first layer, CSP is the second.
- **Analytics Data Integrity:** Removing the standalone gtag.js eliminates the duplicate GA4 collect beacon. Every pageview currently fires two collect requests to the same GA4 property (G-91BP6NPTSM) — one from GTM's GA4 Configuration tag, one from the standalone gtag.js. The ERR_ABORTED on the second request indicates the browser or network is canceling the duplicate, but the first request may still inflate session counts, engagement metrics, or conversion attribution depending on race timing. Eliminating the duplicate source produces a single, authoritative beacon per event, making all GA4 metrics structurally reliable.
- **Attack Surface Reduction:** The current architecture requires CSP to allowlist four external script origins (googletagmanager.com, google-analytics.com, googletagservices.com, plausible.io). Each allowlisted domain is a potential script injection vector — if any of those domains were compromised or served malicious content, the browser would execute it with full page trust. Eliminating the standalone gtag.js removes googletagservices.com from the required allowlist, reducing the external script surface from four domains to three. If the architecture is later rationalized to Plausible-only (separate architectural finding), the allowlist reduces to one external domain.
- **Csp Report Only Safety:** Deploying in Report-Only mode first means zero risk of breaking existing functionality during the discovery phase. Violations are logged but not enforced. The site continues to function identically to its current state while the violation stream reveals any inline scripts or third-party origins not yet in the allowlist. Promotion to enforced CSP only occurs after the violation stream is clean, eliminating the risk of a CSP misconfiguration causing a site-wide JS blackout.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_006`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The pre-scan finding prescan-2-7 correctly identifies the absence of SRI on GTM and GA scripts.. However, the escalation correctly notes that SRI is infeasible for these scripts: Google dynamically versions GTM and gtag.js, changing file contents without changing URLs.

**Measured evidence:**
- Gtm Container: GTM-5VQTG6TH
- Ga4 Property: G-91BP6NPTSM
- Sri Feasibility: {'gtm': 'Not feasible — dynamically versioned', 'ga4_gtag': 'Not feasible — dynamically versioned', 'plausible': 'Potentially feasible — URL contains 
- Recommended Mitigation: Nonce-based CSP via Netlify Edge Functions, or server-side GTM proxy
- Implementation Path: Netlify Edge Functions can inject nonces into HTML and set CSP headers dynamically
- Prescan Finding Ref: prescan-2-7
- Escalation Reason: GTM and GA scripts are dynamically versioned — SRI hashes would break on every Google-side update
- Gtm Dynamic Versioning: True

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
Implement a nonce-based Content-Security-Policy header in Report-Only mode first, then enforce it. Simultaneously eliminate the standalone gtag.js load (duplicate GA4 beacon source) and remove SRI from any GTM/GA4/Google Fonts allowlist candidates. The fix has three sequenced phases: (1) eliminate the dual-beacon architectural defect, (2) deploy CSP in report-only mode to capture violations without breaking the site, (3) promote to enforced CSP once the violation report stream is clean. Plausible SRI is deferred until a deployment pipeline can automate hash rotation — manual pinning is explicitly rejected as operationally unsustainable.

### How
PHASE 1 — Eliminate Dual GA4 Beacon (Prerequisite for accurate CSP scope)
1a. Audit the global site template (header partial or equivalent) for the standalone gtag.js script tag loading https://www.googletagservices.com/tag/js/gpt.js or https://www.google-analytics.com/analytics.js or any gtag/js?id=G-91BP6NPTSM script. This is separate from the GTM container script.
1b. Confirm GTM container GTM-5VQTG6TH already fires GA4 via a GA4 Configuration tag targeting G-91BP6NPTSM. Open GTM workspace, navigate to Tags, filter by GA4. If a GA4 Configuration tag exists with the same measurement ID, the standalone gtag.js is fully redundant.
1c. Remove the standalone gtag.js script tag from the global template. Do not remove the GTM container script (gtm.js?id=GTM-5VQTG6TH). Do not remove the GTM noscript iframe fallback.
1d. Verify in GA4 DebugView that pageview events still fire once per page load after removal. Confirm the ERR_ABORTED on the second collect beacon disappears in DevTools Network tab.
1e. If any code outside GTM calls window.gtag() directly (e.g., custom event tracking in application JS), replace those calls with window.dataLayer.push() equivalents before removing gtag.js, or retain a minimal gtag stub — see code example 1.
PHASE 2 — Generate and Deploy CSP in Report-Only Mode
2a. Enumerate all script origins currently loading on the site. After Phase 1, the expected set is: https://www.googletagmanager.com (GTM container), https://plausible.io (Plausible script), and any GTM-injected origins (Google Ads, Floodlight, etc. — extract from GTM container preview). Do not guess — use the Network tab filtered to JS with a cold cache load.
2b. Generate a nonce on every HTTP response at the server/CDN layer. The nonce must be: cryptographically random (min 128 bits), base64-encoded, unique per response (never reused across requests), injected into both the CSP header value and every inline script tag's nonce attribute in the same response.
2c. Construct the initial CSP value using the nonce for all inline scripts and explicit host allowlists for external scripts. Use Report-Only mode. Set report-uri to a collection endpoint (see code example 2 for a minimal self-hosted endpoint, or use report-uri.com / Sentry CSP endpoint).
2d. Deploy the Content-Security-Policy-Report-Only header. Monitor the violation report stream for 5–7 days across real traffic. Expect initial violations from: GTM-injected tags (each tag that injects a script needs its origin in script-src), any inline scripts missing the nonce, any eval() usage in third-party scripts.
2e. For each violation category: if it is a legitimate first-party inline script, add the nonce attribute; if it is a third-party origin injected by GTM, add the host to script-src; if it is eval() from a third-party script, add 'unsafe-eval' scoped only if unavoidable and document the specific script requiring it.
2f. Do not add 'unsafe-inline' to script-src. The nonce directive supersedes unsafe-inline for nonce-capable browsers; adding unsafe-inline alongside a nonce degrades security for older browsers that ignore nonces.
PHASE 3 — Promote to Enforced CSP
3a. Once the Report-Only violation stream shows zero unexpected violations across 5+ days of production traffic, change the header name from Content-Security-Policy-Report-Only to Content-Security-Policy. Keep report-uri active — enforced CSP still sends violation reports.
3b. Add frame-ancestors 'self' to the CSP to replace or supplement X-Frame-Options (CSP frame-ancestors takes precedence in modern browsers and is more expressive).
3c. Add base-uri 'self' to prevent base tag injection attacks.
3d. Add object-src 'none' to block Flash/plugin vectors.
3e. Do not add SRI hashes to GTM, GA4, or Google Fonts CSS entries in the CSP. These resources are dynamically versioned — SRI would cause resource load failures on every Google-side update with no operator warning.
PHASE 4 — Plausible SRI (Deferred, Pipeline-Gated)
4a. Do not implement Plausible SRI manually. The content-hashed filename (pa-GNbSMJlnmKdl4_QO4sS4C.js) rotates on each Plausible release.
4b. Implement only if the deployment pipeline can: (a) fetch the current Plausible script URL from plausible.io/js/script.js redirect target, (b) compute sha384 of the response body, (c) write the integrity attribute and updated CSP hash-source automatically as part of the build/deploy step.
4c. Until that pipeline exists, the Plausible script is covered by the host allowlist (https://plausible.io) in script-src, which is sufficient given Plausible's self-hosted-or-CDN model and the enforced CSP blocking all other origins.

### Code examples
```
// CODE EXAMPLE 1: gtag() stub for sites with direct gtag() calls in application JS
// PURPOSE: Preserves window.gtag() API surface after standalone gtag.js removal,
// routing calls through the existing dataLayer that GTM already reads.
// PRECONDITION: GTM container script must load before this stub executes.
// SITE-SPECIFIC: Verify GTM fires before any gtag() call site in your JS bundle.
// Place this inline script in the <head> AFTER the GTM container script tag,
// with the nonce attribute injected server-side (see Example 2).

// This stub is only needed if application code calls window.gtag() directly.
// If all tracking is via dataLayer.push(), omit this entirely.
(function() {
  'use strict';

  // Guard: do not redefine if gtag.js somehow loaded (belt-and-suspenders)
  if (typeof window.gtag === 'function') {
    return;
  }

  // Ensure dataLayer exists — GTM also does this, but order is not guaranteed
  // for the stub case where this runs before GTM container parses.
  window.dataLayer = window.dataLayer || [];

  // Minimal gtag stub: pushes arguments object into dataLayer.
  // GTM's GA4 Configuration tag reads dataLayer events in the same format
  // that gtag() would have produced natively.
  window.gtag = function gtag() {
    // arguments is not an array; dataLayer.push accepts array-like objects
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  // Initialize gtag timestamp — required by GA4 for session attribution
  window.gtag('js', new Date());
}());
// CODE EXAMPLE 2: Nonce generation and CSP header injection
// TARGET ENVIRONMENT: Node.js/Express. Adapt header-setting logic for your stack
// (Nginx: add_header, Cloudflare Workers: response.headers.set, Next.js: next.config.js headers()).
// SITE-SPECIFIC: The script-src allowlist below reflects the post-Phase-1 origin set.
// Run your own Network tab audit to confirm the complete origin list before deploying.
// SITE-SPECIFIC: Replace REPORT_URI_ENDPOINT with your actual CSP report collector URL.

'use strict';

const crypto = require('crypto');

// Named constants — do not inline these values
const NONCE_BYTE_LENGTH = 16; // 128 bits — minimum for cryptographic randomness
const NONCE_ENCODING = 'base64';
const CSP_REPORT_URI_ENDPOINT = '/csp-report'; // SITE-SPECIFIC: replace with your collector
const CSP_MAX_AGE_SECONDS = 0; // Report-Only mode has no max-age concept; placeholder for enforced mode

// SITE-SPECIFIC: This allowlist reflects the expected post-Phase-1 origin set.
// Extend with any GTM-injected origins discovered during Phase 2 violation monitoring.
// Do NOT add 'unsafe-inline' — the nonce directive covers inline scripts.
// Do NOT add SRI hashes for GTM, GA4, or Google Fonts — dynamically versioned, SRI will break.
const SCRIPT_SRC_ALLOWLIST = [
  "'self'",
  'https://www.googletagmanager.com', // GTM container (gtm.js)
  'https://plausible.io',             // Plausible analytics
  // Add GTM-injected origins here after Phase 2 violation monitoring:
  // 'https://www.google-analytics.com',  // Only if GTM injects GA4 transport directly
  // 'https://googleads.g.doubleclick.net', // Only if Google Ads tags present in GTM
];

/**
 * Generates a cryptographically random nonce for CSP.
 * Returns a base64 string safe for use in HTTP headers and HTML attributes.
 * @returns {string}
 */
function generateNonce() {
  return crypto.randomBytes(NONCE_BYTE_LENGTH).toString(NONCE_ENCODING);
}

/**
 * Builds the CSP header value for a given nonce.
 * Phase 2: returns Content-Security-Policy-Report-Only value.
 * Phase 3: use this same value in Content-Security-Policy header.
 * @param {string} nonce
 * @returns {string}
 */
function buildCspValue(nonce) {
  // Nonce format in CSP: 'nonce-<base64value>' (with single quotes, no spaces)
  const nonceDirective = `'nonce-${nonce}'`;

  const directives = [
    // script-src: nonce covers inline scripts; allowlist covers external origins.
    // 'strict-dynamic' allows nonce-trusted scripts to load further scripts dynamically
    // (required for GTM, which injects additional script tags at runtime).
    // 'strict-dynamic' implicitly ignores host allowlists in supporting browsers,
    // so the allowlist serves as fallback for browsers without strict-dynamic support.
    `script-src ${nonceDirective} 'strict-dynamic' ${SCRIPT_SRC_ALLOWLIST.join(' ')}`,

    // style-src: Google Fonts CSS is served from fonts.googleapis.com.
    // Do NOT apply SRI to Google Fonts CSS — content-negotiated per User-Agent.
    // SITE-SPECIFIC: Add your own stylesheet origins here.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // font-src: Google Fonts binary files served from fonts.gstatic.com.
    "font-src 'self' https://fonts.gstatic.com",

    // img-src: GA4 and GTM use pixel beacons; plausible uses /api/event fetch, not img.
    // SITE-SPECIFIC: Add your CDN domain and any other image origins.
    "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",

    // connect-src: GA4 collect endpoint, Plausible event endpoint.
    // SITE-SPECIFIC: Add your API domain if the frontend makes fetch() calls.
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://plausible.io",

    // frame-src: GTM noscript iframe fallback uses googletagmanager.com.
    "frame-src https://www.googletagmanager.com",

    // Defensive directives — these do not require site-specific tuning.
    "frame-ancestors 'self'",  // Replaces X-Frame-Options; blocks clickjacking
    "base-uri 'self'",         // Blocks base tag injection
    "object-src 'none'",       // Blocks Flash/plugin vectors
    "form-action 'self'",      // SITE-SPECIFIC: extend if forms POST to third-party endpoints

    // report-uri: receives violation reports in both Report-Only and enforced modes.
    // Deprecated in favor of report-to, but report-uri has broader browser support.
    // Run both in parallel during transition.
    `report-uri ${CSP_REPORT_URI_ENDPOINT}`,
  ];

  return directives.join('; ');
}

/**
 * Express middleware: generates a per-request nonce, attaches it to res.locals
 * for template access, and sets the CSP header.
 *
 * PHASE 2 (Report-Only): use header name 'Content-Security-Policy-Report-Only'
 * PHASE 3 (Enforced):    change to 'Content-Security-Policy'
 *
 * ORDERING ASSUMPTION: This middleware must execute before any response is sent.
 * Mount it before your template rendering middleware.
 * It does not mutate req or call next() with an error — safe to mount globally.
 */
function cspMiddleware(req, res, next) {
  const nonce = generateNonce();

  // Expose nonce to template engine (EJS: <%= nonce %>, Handlebars: {{nonce}}, etc.)
  // SITE-SPECIFIC: Adjust property name to match your template engine's locals convention.
  res.locals.cspNonce = nonce;

  // PHASE 2: Report-Only — violations logged, nothing blocked.
  // Change header name to 'Content-Security-Policy' for Phase 3 enforcement.
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    buildCspValue(nonce)
  );

  next();
}

module.exports = { cspMiddleware, generateNonce, buildCspValue };
<!-- CODE EXAMPLE 3: Template-side nonce injection for GTM and inline scripts -->
<!-- PRECONDITION: cspMiddleware has run and res.locals.cspNonce is populated. -->
<!-- SITE-SPECIFIC: Syntax shown is EJS. Adapt to your template engine. -->
<!-- CRITICAL: The nonce attribute value must exactly match the nonce in the CSP header
     for the same response. Never hardcode a nonce value — always inject from res.locals. -->

<!-- GTM container script: nonce attribute added, no other changes -->
<!-- The nonce tells the browser this specific inline/external script is intentional. -->
<!-- GTM's own dynamically-injected child scripts are covered by 'strict-dynamic'. -->
<script
  src="https://www.googletagmanager.com/gtm.js?id=GTM-5VQTG6TH"
  nonce="<%= cspNonce %>"
  async
></script>

<!-- GTM dataLayer initialization: must have nonce, must precede GTM container script -->
<script nonce="<%= cspNonce %>">
  window.dataLayer = window.dataLayer || [];
</script>

<!-- GTM noscript fallback: lives in <body>, no nonce needed (not a script element) -->
<!-- frame-src in CSP covers this iframe -->
<noscript>
  <iframe
    src="https://www.googletagmanager.com/ns.html?id=GTM-5VQTG6TH"
    height="0"
    width="0"
    style="display:none;visibility:hidden"
    title="Google Tag Manager"
  ></iframe>
</noscript>

<!-- Plausible script: nonce added, no SRI until pipeline automates hash rotation -->
<!-- The host allowlist (https://plausible.io in script-src) covers this external script. -->
<!-- Do NOT add integrity attribute here manually — hash rotates on each Plausible release. -->
<script
  defer
  data-domain="example.com"
  src="https://plausible.io/js/script.js"
  nonce="<%= cspNonce %>"
></script>

<!-- REMOVED: standalone gtag.js script tag (Phase 1 elimination) -->
<!-- The following line must NOT appear in the template after Phase 1: -->
<!-- <script async src="https://www.googletagservices.com/tag/js/gpt.js"></script> -->
<!-- <script async src="https://www.google-analytics.com/analytics.js"></script> -->
// CODE EXAMPLE 4: Minimal CSP violation report collector endpoint (Express)
// PURPOSE: Receives browser-sent CSP violation reports during Phase 2 (Report-Only).
// This is a self-hosted alternative to third-party collectors.
// SITE-SPECIFIC: Replace console.log with your logging infrastructure (Winston, Datadog, etc.).
// SECURITY: This endpoint receives POST requests from browsers — validate Content-Type
// and enforce a body size limit to prevent log flooding.

'use strict';

const express = require('express');
const router = express.Router();

// Named constants
const MAX_REPORT_BODY_BYTES = 10240; // 10KB — CSP reports are small; cap prevents log flooding
const EXPECTED_CONTENT_TYPE = 'application/csp-report';

// CSP reports are sent as POST with Content-Type: application/csp-report
// Express's built-in json() parser does not handle this content type by default.
// Use a raw body parser scoped only to this route to avoid affecting other routes.
router.post(
  '/csp-report',
  express.json({
    type: EXPECTED_CONTENT_TYPE,
    limit: MAX_REPORT_BODY_BYTES,
  }),
  function handleCspReport(req, res) {
    // Validate that the body parsed correctly and contains a CSP report structure.
    // Malformed or empty bodies are silently discarded — do not 500 on bad reports.
    const report = req.body && req.body['csp-report'];
    if (!report) {
      res.status(204).end();
      return;
    }

    // Log the violation. In production, route to your observability stack.
    // Key fields for Phase 2 triage:
    // - violated-directive: which CSP directive was violated
    // - blocked-uri: the resource that was blocked
    // - source-file + line-number: where in your JS the violation originated
    // SITE-SPECIFIC: Replace console.log with structured logging.
    console.log('[CSP Violation]', JSON.stringify({
      violatedDirective: report['violated-directive'],
      blockedUri: report['blocked-uri'],
      documentUri: report['document-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      disposition: report['disposition'], // 'report' in Report-Only, 'enforce' when live
      timestamp: new Date().toISOString(),
    }));

    // 204 No Content is the correct response for CSP report endpoints.
    // Do not return 200 with a body — some browsers retry on non-2xx.
    res.status(204).end();
  }
);

module.exports = router;
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
