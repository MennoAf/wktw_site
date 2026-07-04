---
finding_id: "prescan-escalation-sri-gtm-incompatibility"
title: "SRI is technically incompatible with GTM/gtag.js — alternative mitigations required"
severity: "medium"
root_cause_cluster: "Missing Security Headers and Supply-Chain Protection"
why_this_matters: "A nonce-based CSP with strict-dynamic eliminates the primary XSS execution vector: injected scripts cannot execute without a valid per-request nonce, which an attacker cannot predict."
fix_summary: "Replace SRI (architecturally incompatible with GTM/gtag.js) with a nonce-based Content Security Policy that governs script execution site-wide, eliminate the redundant standalone gtag.js load (alread…"
confidence_tier: "confirmed"
---

# SRI is technically incompatible with GTM/gtag.js — alternative mitigations required

**Finding:** SRI is technically incompatible with GTM/gtag.js — alternative mitigations required  
**Severity:** Medium  
**Why this matters:** A nonce-based CSP with strict-dynamic eliminates the primary XSS execution vector: injected scripts cannot execute without a valid per-request nonce, which an attacker cannot predict.  
**Root cause:** Missing Security Headers and Supply-Chain Protection  
**Fix:** Replace SRI (architecturally incompatible with GTM/gtag.js) with a nonce-based Content Security Policy that governs script execution site-wide, eliminate the redundant standalone gtag.js load (alread…

> **Evidence Basis:** Confirmed

---

## Impact

- **Security Posture:** A nonce-based CSP with strict-dynamic eliminates the primary XSS execution vector: injected scripts cannot execute without a valid per-request nonce, which an attacker cannot predict. This closes the gap that SRI was intended to address — script execution control — via a mechanism that is architecturally compatible with GTM's dynamic model.
- **Performance:** Removing standalone gtag.js eliminates 159KB of JavaScript from every page load globally. This reduces main-thread parse and execution time on every page, with the largest relative gain on mobile devices where JS parse time is 3–5× slower than desktop. The reduction directly improves Time to Interactive and INP by shrinking the total JS work the browser must complete before the page is interactive.
- **Analytics Integrity:** Consolidating to a single GTM entry point eliminates the risk of duplicate GA4 event firing (one from GTM's GA4 tag, one from the standalone gtag.js). Duplicate events corrupt session counts, conversion attribution, and funnel analysis — removing the redundant script restores data integrity without any tag reconfiguration.
- **Csp Violation Monitoring:** The report-uri endpoint provides real-time visibility into injection attempts and policy regressions. A spike in CSP violation reports is an early warning signal for supply chain compromise in the GTM container — a detection capability the site currently lacks entirely.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_006`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Escalated item review: The prescan finding prescan-2-7 correctly identifies that GTM and gtag.js scripts lack SRI integrity attributes.. However, SRI is fundamentally incompatible with these resources because Google dynamically updates the file content with each GTM container publish and gtag.js version update, making static integrity hashes immediately stale.

**Measured evidence:**
- Gtm Sri Compatible: False
- Gtag Sri Compatible: False
- Plausible Sri Compatible: likely — filename contains content hash
- Recommended Mitigation: CSP with nonce-based script-src instead of SRI for GTM/gtag; SRI feasible for Plausible
- Prescan Finding Amended: prescan-2-7
- Amendment: GTM/gtag SRI recommendation should be replaced with CSP nonce recommendation; Plausible SRI recommendation stands
- Sri Incompatible Scripts: ['https://www.googletagmanager.com/gtm.js?id=GTM-5VQTG6TH', 'https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM']
- Sri Compatible Scripts: ['https://plausible.io/js/pa-GNbSMJlnmKdl4_QO4sS4C.js (versioned filename suggests stable content)']

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
Replace SRI (architecturally incompatible with GTM/gtag.js) with a nonce-based Content Security Policy that governs script execution site-wide, eliminate the redundant standalone gtag.js load (already covered by GTM), and apply SRI to the two resources where it is viable: Plausible's versioned script and the Google Fonts stylesheet. The end state is: one Google analytics entry point (GTM only), a strict CSP enforced via HTTP response headers with per-request nonces, and SRI on every third-party resource whose content is stable.

### How
STEP 1 — ELIMINATE STANDALONE gtag.js (prerequisite for all subsequent steps). Remove the <script src='https://www.googletagmanager.com/gtag/js?id=...'> tag from the global layout template. Verify GTM container already contains a GA4 tag configured to fire on All Pages. Confirm GA4 data continues flowing in GA4 DebugView before proceeding. This reduces the unprotectable Google-origin script surface from two to one and cuts 159KB from every page load.
STEP 2 — GENERATE A CRYPTOGRAPHICALLY RANDOM NONCE PER REQUEST on the server. The nonce must be generated fresh for every HTTP response — never reused, never static. Inject it into (a) every <script> tag in the HTML response that must execute, and (b) the Content-Security-Policy response header. The nonce replaces 'unsafe-inline' as the mechanism that permits inline scripts and trusted external scripts. Implementation location depends on stack: Next.js middleware, Express middleware, Nginx lua_by_lua_block, Cloudflare Worker, or equivalent. See code examples.
STEP 3 — CONSTRUCT THE CSP HEADER. The policy must: (a) use script-src with nonce-{NONCE} instead of unsafe-inline, (b) explicitly allowlist the Google Tag Manager origin (https://www.googletagmanager.com) and Google's analytics collection origin (https://www.google-analytics.com), (c) allowlist Plausible's origin, (d) use strict-dynamic so GTM's dynamically injected child scripts inherit the nonce grant without requiring individual origin allowlisting, (e) include object-src 'none' and base-uri 'self'. Do NOT include unsafe-eval unless GTM's container requires it — audit the container first.
STEP 4 — APPLY THE NONCE TO GTM'S SCRIPT TAG ONLY. The GTM snippet's outer <script> tag receives the nonce attribute. GTM propagates the nonce to its dynamically created child scripts via strict-dynamic. The GTM container's inline dataLayer initialization script also receives the nonce. No other change to the GTM snippet is required.
STEP 5 — COMPUTE AND APPLY SRI TO PLAUSIBLE'S SCRIPT. The content-hash in the filename (pa-GNbSMJlnmKdl4_QO4sS4C.js) indicates immutable versioned deployment. Fetch the current file, compute SHA-384, embed as integrity attribute. Automate recomputation in CI on Plausible script version bumps. See code example.
STEP 6 — COMPUTE AND APPLY SRI TO THE GOOGLE FONTS STYLESHEET. Google Fonts CSS is stable for a given font specification URL. Fetch the stylesheet, compute SHA-384, embed as integrity on the <link rel='stylesheet'> tag. Re-verify on any font family or weight change.
STEP 7 — DEPLOY IN REPORT-ONLY MODE FIRST. Set Content-Security-Policy-Report-Only with a report-uri or report-to endpoint (use a free CSP reporting service or a self-hosted endpoint). Run for a minimum of 48 hours across real traffic. Inspect violation reports for any legitimate scripts blocked by the policy. Adjust allowlist before switching to enforcement mode.
STEP 8 — SWITCH TO ENFORCEMENT MODE. Replace Content-Security-Policy-Report-Only with Content-Security-Policy. Retain report-uri/report-to in the enforcement header for ongoing violation monitoring. Set up an alert on violation spike (>10 violations/minute indicates a policy regression or an active injection attempt).
STEP 9 — AUDIT GTM CONTAINER FOR unsafe-eval DEPENDENCY. Open GTM container GTM-5VQTG6TH, review all tags for use of Custom HTML tags with eval(), Function(), or setTimeout(string). If found, refactor those tags to use Custom JavaScript variables (which do not require eval) or migrate logic server-side. Only add unsafe-eval to CSP if no alternative exists after this audit.

### Code examples
```
// ─── EXAMPLE 1: Nonce generation — Cloudflare Worker (runs on every request) ───
// SITE-SPECIFIC ASSUMPTION: This site uses Cloudflare Workers for edge middleware.
// Adjust for your runtime (Next.js middleware, Express, Nginx njs, etc.).

const NONCE_BYTE_LENGTH = 16; // 128 bits — sufficient entropy for a per-request nonce
const CSP_REPORT_URI = 'https://csp.yourdomain.com/report'; // SITE-SPECIFIC: replace with your reporting endpoint

// Origins that GTM dynamically injects scripts from.
// Verify this list against your GTM container's actual tag inventory before deploying.
const SCRIPT_ALLOWLIST_ORIGINS = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://cdn.plausible.io', // SITE-SPECIFIC: confirm Plausible's actual CDN origin
].join(' ');

function generateNonce() {
  const bytes = new Uint8Array(NONCE_BYTE_LENGTH);
  crypto.getRandomValues(bytes);
  // btoa over Uint8Array requires conversion to binary string
  return btoa(String.fromCharCode(...bytes));
}

function buildCSP(nonce, reportOnly = false) {
  // strict-dynamic: scripts loaded by a nonced script inherit trust.
  // This is what allows GTM's dynamically injected child scripts to execute
  // without individually allowlisting every origin GTM might load from.
  // 'unsafe-inline' is ignored by browsers that support nonces — included
  // only as a fallback for browsers that support CSP Level 1 but not nonces
  // (effectively no modern browser — included for belt-and-suspenders).
  const policy = [
    `script-src 'nonce-${nonce}' 'strict-dynamic' ${SCRIPT_ALLOWLIST_ORIGINS} 'unsafe-inline'`,
    "object-src 'none'",
    "base-uri 'self'",
    `report-uri ${CSP_REPORT_URI}`,
  ].join('; ');

  return policy;
}

export default {
  async fetch(request, env) {
    const response = await fetch(request);

    // Only inject CSP on HTML responses — skip assets, API routes, redirects
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    const nonce = generateNonce();

    // Rewrite HTML to inject nonce into script tags
    const rewriter = new HTMLRewriter()
      .on('script', new NonceInjector(nonce))
      .on('link[rel="preload"][as="script"]', new NonceInjector(nonce));

    const transformedResponse = rewriter.transform(response);

    // Clone headers — Response headers are immutable
    const newHeaders = new Headers(transformedResponse.headers);

    // Deploy in Report-Only first; switch header name to enforce
    // Content-Security-Policy once violation reports are clean.
    newHeaders.set('Content-Security-Policy-Report-Only', buildCSP(nonce));

    return new Response(transformedResponse.body, {
      status: transformedResponse.status,
      statusText: transformedResponse.statusText,
      headers: newHeaders,
    });
  },
};

class NonceInjector {
  constructor(nonce) {
    this.nonce = nonce;
  }
  element(element) {
    // Do not overwrite an existing nonce — indicates server-rendered nonce already present
    if (!element.getAttribute('nonce')) {
      element.setAttribute('nonce', this.nonce);
    }
  }
}
// ─── EXAMPLE 2: GTM snippet with nonce — server-rendered template (Jinja2/Nunjucks/Twig syntax) ───
// SITE-SPECIFIC ASSUMPTION: Template engine injects `csp_nonce` as a per-request variable.
// Replace {{ csp_nonce }} with your template engine's variable syntax.
// The nonce value must match the value in the CSP header for this response.

// Place in <head> — dataLayer init must precede GTM loader
/*
<script nonce="{{ csp_nonce }}">
  // Named constant — do not inline the container ID as a magic string
  // SITE-SPECIFIC: GTM-5VQTG6TH confirmed from audit finding
  var GTM_CONTAINER_ID = 'GTM-5VQTG6TH';

  window.dataLayer = window.dataLayer || [];
  // Preserve any dataLayer pushes that occurred before GTM loaded
</script>

<script nonce="{{ csp_nonce }}">
  // GTM loader — standard snippet with nonce attribute added
  // Do NOT add integrity attribute here — GTM content is not SRI-compatible (see finding)
  (function(w,d,s,l,i){
    w[l]=w[l]||[];
    w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),
        dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;
    j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
    // Propagate nonce to dynamically created script element
    // Required for strict-dynamic to grant trust to GTM's child scripts
    j.setAttribute('nonce', '{{ csp_nonce }}');
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer', GTM_CONTAINER_ID);
</script>
*/

// ─── REMOVE this tag entirely (standalone gtag.js — redundant with GTM) ───
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
// Verify GA4 tag exists in GTM container before removing.
// ─── EXAMPLE 3: SRI hash computation for Plausible script — Node.js CI script ───
// Run this in CI whenever Plausible releases a new script version.
// Output the integrity value; update the <script> tag in your layout template.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// SITE-SPECIFIC: Confirm the exact Plausible script URL from your implementation
const PLAUSIBLE_SCRIPT_URL = 'https://cdn.plausible.io/pa-GNbSMJlnmKdl4_QO4sS4C.js';
const HASH_ALGORITHM = 'sha384'; // SHA-384 is the minimum recommended for SRI

async function computeSRI(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const hash = createHash(HASH_ALGORITHM)
    .update(Buffer.from(buffer))
    .digest('base64');
  return `${HASH_ALGORITHM}-${hash}`;
}

(async () => {
  try {
    const integrity = await computeSRI(PLAUSIBLE_SCRIPT_URL);
    console.log(`integrity="${integrity}"`);
    console.log(`\nFull tag:`);
    console.log(
      `<script defer src="${PLAUSIBLE_SCRIPT_URL}" integrity="${integrity}" crossorigin="anonymous"></script>`
    );
  } catch (err) {
    // Exit non-zero so CI fails loudly rather than silently deploying without SRI
    console.error('SRI computation failed:', err.message);
    process.exit(1);
  }
})();
// ─── EXAMPLE 4: SRI-protected Plausible script tag (output of Example 3) ───
// SITE-SPECIFIC: Replace integrity value with output of the CI script above.
// crossorigin="anonymous" is REQUIRED — omitting it causes a double-fetch
// because the browser makes a non-CORS request first, then a CORS request for SRI verification.

/*
<script
  defer
  src="https://cdn.plausible.io/pa-GNbSMJlnmKdl4_QO4sS4C.js"
  integrity="sha384-REPLACE_WITH_CI_COMPUTED_HASH"
  crossorigin="anonymous"
  nonce="{{ csp_nonce }}"
></script>
*/

// ─── Google Fonts stylesheet with SRI ───
// Fetch the stylesheet URL, compute hash with the same CI script pattern,
// then embed as shown. Re-verify whenever font family or weight parameters change.
// SITE-SPECIFIC: Replace href and integrity with your actual font URL and computed hash.
/*
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
  integrity="sha384-REPLACE_WITH_CI_COMPUTED_HASH"
  crossorigin="anonymous"
/>
*/
```

## Risks
- GTM tags using Custom HTML with eval() or Function() constructor will be blocked by the CSP unless unsafe-eval is added. Mitigation: audit the GTM container for eval-dependent tags before switching from Report-Only to enforcement. Refactor offending tags to Custom JavaScript variables, which execute in a sandboxed context that does not require eval.
- Third-party tags injected via GTM that load scripts from origins not in the CSP allowlist will be silently blocked in enforcement mode. Mitigation: the 48-hour Report-Only window surfaces these violations before enforcement. Review all GTM tags for external script loads and add their origins to the allowlist, or migrate them to server-side GTM to remove client-side origin exposure.
- Nonce injection via HTMLRewriter (Cloudflare) or middleware rewrites the response body, which can conflict with existing response streaming or chunked transfer encoding. Mitigation: verify the middleware runs after any streaming layer; test with large HTML responses. If streaming is required, generate the nonce server-side before the stream begins and inject it into the initial HTML chunk.
- Removing standalone gtag.js will break GA4 data collection if the GTM container does not have a GA4 Configuration tag firing on All Pages. Mitigation: verify in GTM's Preview mode that GA4 page_view events fire correctly before removing the standalone script tag from the template. Do not remove the tag until Preview mode confirms data flow.
- Google Fonts SRI hash will become invalid if Google silently updates the stylesheet content for the same URL (they occasionally do for minor fixes). Mitigation: add the SRI hash recomputation to a weekly CI job that fetches the stylesheet, recomputes the hash, and fails the build if the hash has changed — forcing a deliberate review and template update.
- Plausible script SRI hash must be updated on every Plausible release. If the CI script is not wired to the deployment pipeline, a Plausible update will cause the script to be blocked silently. Mitigation: the CI script (Example 3) exits non-zero on fetch failure and should be run as a pre-deploy check. Wire it to fail the deployment if the computed hash does not match the value in the template.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
