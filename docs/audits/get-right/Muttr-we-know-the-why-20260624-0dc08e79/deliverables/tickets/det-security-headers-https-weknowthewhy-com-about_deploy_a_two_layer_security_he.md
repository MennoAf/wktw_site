---
finding_id: "det-security-headers-https-weknowthewhy-com-about"
title: "Missing recommended security headers"
severity: "medium"
root_cause_cluster: "Missing Security Headers and Supply-Chain Protection"
why_this_matters: "A compromised or maliciously modified GTM container is the primary attack vector on this site."
fix_summary: "Deploy a two-layer security header configuration: (1) static headers for all non-CSP directives via netlify.toml, and (2) a nonce-based Content-Security-Policy injected per-request via a Netlify Edge…"
confidence_tier: "confirmed"
---

# Missing recommended security headers

**Finding:** Missing recommended security headers  
**Severity:** Medium  
**Why this matters:** A compromised or maliciously modified GTM container is the primary attack vector on this site.  
**Root cause:** Missing Security Headers and Supply-Chain Protection  
**Fix:** Deploy a two-layer security header configuration: (1) static headers for all non-CSP directives via netlify.toml, and (2) a nonce-based Content-Security-Policy injected per-request via a Netlify Edge…

> **Evidence Basis:** Confirmed

---

## Impact

- **Supply Chain Integrity:** A compromised or maliciously modified GTM container is the primary attack vector on this site. Without CSP, any JavaScript injected via GTM executes with full page privileges — including reading and exfiltrating contact form field values (name, email, company) to an attacker-controlled endpoint. The nonce-based CSP closes this vector: only scripts carrying the server-issued nonce execute, and the nonce is unguessable per-request. GTM's own runtime receives the nonce and passes it to dynamically created child scripts via strict-dynamic, preserving full GTM functionality while eliminating the exfiltration path.
- **Clickjacking Protection:** X-Frame-Options: DENY prevents the site from being embedded in a cross-origin iframe. Without it, an attacker can overlay a transparent iframe over a legitimate-looking page to capture clicks intended for the contact form — a documented technique for credential and form data theft.
- **Referrer Data Leakage:** The current absence of Referrer-Policy causes the browser to send the full URL (including path and query string) in the Referer header to every third-party origin the page contacts — including Google Analytics and GTM. With strict-origin-when-cross-origin, only the origin (scheme + host) is sent cross-origin, eliminating path and query parameter leakage. The irony of this leaking from /legal/privacy/ to external destinations is a concrete data hygiene failure that this fix directly resolves.
- **Mime Sniffing Attacks:** X-Content-Type-Options: nosniff prevents browsers from MIME-sniffing response bodies away from the declared Content-Type. Without it, a browser may execute a response declared as text/plain as JavaScript if it detects script-like content — a known attack vector when user-controlled content is served.
- **Seo And Trust:** HSTS with includeSubDomains eliminates protocol downgrade attacks and ensures all connections are HTTPS from the first request after the initial visit. HSTS preload list submission (after eligibility confirmation) extends this protection to first-time visitors. Google's search ranking signals include HTTPS as a confirmed factor; HSTS preload ensures no HTTP fallback path exists that could trigger mixed-content warnings or ranking penalties.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_006`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Missing recommended security headers: Content-Security-Policy (mitigates XSS / data injection); X-Frame-Options (clickjacking protection); X-Content-Type-Options (MIME-sniffing protection); Referrer-Policy (limits referrer information leakage).

**Page(s) to check:**
- https://weknowthewhy.com/about/
- https://weknowthewhy.com/contact/
- https://weknowthewhy.com/
- https://weknowthewhy.com/insights/why-most-audits-dont-change-anything/
- https://weknowthewhy.com/legal/privacy/
- ... and 4 more pages

**Measured evidence:**
- Source: deterministic_detector
- Missing Headers: ['Content-Security-Policy (mitigates XSS / data injection)', 'X-Frame-Options (clickjacking protection)', 'X-Content-Type-Options (MIME-sniffing prote
- Remediation: Add the missing response headers at the edge/server: a restrictive Content-Security-Policy, X-Frame-Options: SAMEORIGIN (or DENY), X-Content-Type-Options: nosniff, and a Referrer-Policy such as strict-origin-when-cross-origin.

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
Deploy a two-layer security header configuration: (1) static headers for all non-CSP directives via netlify.toml, and (2) a nonce-based Content-Security-Policy injected per-request via a Netlify Edge Function. The Edge Function generates a cryptographically unique nonce per response, rewrites matching <script> tags in the HTML to carry that nonce, and emits the CSP header referencing it — making GTM's dynamically versioned scripts compliant without SRI.

### How
1. Add netlify.toml [[headers]] block for all non-CSP headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS). These are static and safe to serve from CDN edge without per-request logic.
2. Create netlify/edge-functions/csp-nonce.ts. This function: (a) generates a 128-bit cryptographically random nonce via crypto.getRandomValues(), (b) fetches the origin response, (c) rewrites the response body using a streaming TextDecoder/TextEncoder pass to inject nonce='<value>' onto every <script> tag that currently lacks a nonce attribute, (d) sets the Content-Security-Policy response header referencing that nonce.
3. Wire the Edge Function to all routes in netlify.toml [[edge_functions]] with path = '/*'.
4. Audit the CSP script-src directive: include 'nonce-<value>' plus 'strict-dynamic' (which allows GTM's dynamically created child scripts to inherit trust without needing their own nonce), plus https: as a fallback for browsers that do not support strict-dynamic. Do NOT include 'unsafe-inline' — it silently voids nonce protection in browsers that support CSP Level 2+.
5. Set CSP to report-only mode (Content-Security-Policy-Report-Only) for the first deployment cycle. Point report-uri to a free endpoint (e.g., report-uri.com or a Netlify Function echo endpoint) to capture violations before enforcing.
6. After one full traffic cycle with zero unexpected violations, switch to enforced Content-Security-Policy.
7. Verify HSTS preload eligibility at hstspreload.org after confirming the header is live. Submit only after confirming all subdomains also serve HTTPS — HSTS with includeSubDomains preloads the entire domain tree.
8. Test the nonce injection against GTM's tag-firing flow in a staging deploy: fire a custom HTML tag in GTM preview mode and confirm the injected script receives the nonce and executes without CSP violation.

### Code examples
```
# netlify.toml
# SITE-SPECIFIC ASSUMPTION: adjust Permissions-Policy directives if the site
# legitimately uses camera, microphone, or geolocation features.
# SITE-SPECIFIC ASSUMPTION: HSTS max-age set to 1 year (31536000s). Do not add
# 'preload' until hstspreload.org eligibility is confirmed for all subdomains.

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[edge_functions]]
  function = "csp-nonce"
  path = "/*"
// netlify/edge-functions/csp-nonce.ts
// Runs at Netlify edge (Deno runtime). Generates a per-request CSP nonce,
// rewrites <script> tags in the HTML response body, and emits the CSP header.
//
// SITE-SPECIFIC ASSUMPTIONS (adjust before deploying):
//   CSP_ADDITIONAL_SCRIPT_ORIGINS — add any first-party script CDN origins here.
//   CSP_STYLE_ORIGINS            — adjust if self-hosted fonts or external CSS changes.
//   CSP_IMG_ORIGINS              — extend if image CDN domains are added.
//   CSP_CONNECT_ORIGINS          — extend for any XHR/fetch API endpoints.
//   NONCE_BYTE_LENGTH            — 16 bytes = 128 bits. Do not reduce below 16.
//   HTML_CONTENT_TYPE_PREFIX     — only rewrite HTML responses; skip assets.

import type { Context } from "https://edge.netlify.com";

const NONCE_BYTE_LENGTH = 16; // 128-bit nonce — sufficient for cryptographic uniqueness
const HTML_CONTENT_TYPE_PREFIX = "text/html";

// Named origin constants — configure per deployment environment
const CSP_ADDITIONAL_SCRIPT_ORIGINS = ""; // e.g. "https://cdn.example.com"
const CSP_STYLE_ORIGINS = "'self' https://fonts.googleapis.com";
const CSP_IMG_ORIGINS = "'self' data: https://www.google-analytics.com";
const CSP_CONNECT_ORIGINS =
  "'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com";
const CSP_FONT_ORIGINS = "'self' https://fonts.gstatic.com";
const CSP_FRAME_ORIGINS = "'none'";
const CSP_OBJECT_ORIGINS = "'none'";
const CSP_BASE_URI = "'self'";
const CSP_FORM_ACTION = "'self'";

function generateNonce(): string {
  const bytes = new Uint8Array(NONCE_BYTE_LENGTH);
  crypto.getRandomValues(bytes);
  // btoa over Uint8Array requires conversion to binary string
  return btoa(String.fromCharCode(...bytes));
}

function buildCspHeader(nonce: string): string {
  // 'strict-dynamic' allows GTM's dynamically created child scripts to inherit
  // nonce trust without requiring individual nonces. 'https:' is the fallback
  // for browsers that do not support strict-dynamic (CSP Level 1).
  // 'unsafe-inline' is intentionally ABSENT — its presence would silently void
  // nonce protection in CSP Level 2+ browsers.
  const scriptSrc = [
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https:",
    CSP_ADDITIONAL_SCRIPT_ORIGINS,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    `script-src ${scriptSrc}`,
    `style-src ${CSP_STYLE_ORIGINS}`,
    `img-src ${CSP_IMG_ORIGINS}`,
    `connect-src ${CSP_CONNECT_ORIGINS}`,
    `font-src ${CSP_FONT_ORIGINS}`,
    `frame-src ${CSP_FRAME_ORIGINS}`,
    `object-src ${CSP_OBJECT_ORIGINS}`,
    `base-uri ${CSP_BASE_URI}`,
    `form-action ${CSP_FORM_ACTION}`,
    // SITE-SPECIFIC ASSUMPTION: report-uri endpoint. Replace with your
    // report collection endpoint before switching from report-only to enforced.
    // Remove this directive entirely if no reporting endpoint is configured.
    // "report-uri https://your-report-endpoint.example.com/csp",
  ].join("; ");
}

// Rewrites <script> tags to carry the nonce attribute.
// Preconditions:
//   - Input is valid UTF-8 HTML text.
//   - Only tags without an existing nonce attribute are modified (idempotent).
//   - Does not modify <script type="application/ld+json"> (structured data —
//     these are not executed as JS and must not carry a nonce).
// Control flow:
//   1. Regex matches opening <script ...> tags.
//   2. If the tag already has nonce=, skip (prevents double-injection on retry).
//   3. If the tag is type="application/ld+json" or type="application/json", skip.
//   4. Otherwise, insert nonce attribute before the closing > of the opening tag.
function injectNonce(html: string, nonce: string): string {
  // Matches opening <script> tags, capturing everything up to the closing >
  // Non-greedy to avoid spanning multiple tags.
  return html.replace(/<script(\b[^>]*)>/gi, (match, attrs: string) => {
    // Skip if nonce already present (idempotent guard)
    if (/\bnonce=/i.test(attrs)) return match;
    // Skip non-executable script types (JSON-LD, application/json, text/template)
    if (/\btype\s*=\s*["'](?:application\/(?:ld\+)?json|text\/(?:template|x-template))["']/i.test(attrs)) {
      return match;
    }
    return `<script${attrs} nonce="${nonce}">`;
  });
}

export default async function handler(
  request: Request,
  context: Context
): Promise<Response> {
  const response = await context.next();

  // Only process HTML responses — pass assets (JS, CSS, images) through unmodified
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith(HTML_CONTENT_TYPE_PREFIX)) {
    return response;
  }

  const nonce = generateNonce();
  const cspDirective = buildCspHeader(nonce);

  // SITE-SPECIFIC ASSUMPTION: Using Content-Security-Policy-Report-Only for
  // initial deployment. Change header name to "Content-Security-Policy" after
  // confirming zero unexpected violations across a full traffic cycle.
  const CSP_HEADER_NAME = "Content-Security-Policy-Report-Only";

  let html: string;
  try {
    html = await response.text();
  } catch {
    // If body read fails (e.g., streaming error), return original response
    // without CSP modification rather than serving a broken page.
    return response;
  }

  const rewrittenHtml = injectNonce(html, nonce);

  const headers = new Headers(response.headers);
  headers.set(CSP_HEADER_NAME, cspDirective);
  // Remove any pre-existing CSP header from origin to prevent header duplication
  headers.delete(
    CSP_HEADER_NAME === "Content-Security-Policy"
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy"
  );

  return new Response(rewrittenHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
```

## Risks
- RISK: Overly restrictive script-src breaks GTM tags or inline scripts not covered by nonce injection. MITIGATION: Deploy in Content-Security-Policy-Report-Only mode first. Monitor the report endpoint for violations across at least one full traffic cycle (minimum 48–72 hours covering all page types and GTM tag firing conditions) before switching to enforced mode. The regex in injectNonce() targets all executable <script> tags; any inline script not matched (e.g., unusual attribute ordering) will appear as a violation in report-only mode before it becomes a breakage.
- RISK: The injectNonce() regex does not handle malformed HTML (e.g., unclosed attributes, nested quotes). MITIGATION: The regex is intentionally conservative — it matches the common well-formed pattern and skips on ambiguity. Netlify's static site output is generated by a build tool (Gatsby/Next/Hugo/etc.) and will be well-formed. If the site ever introduces server-rendered or user-generated HTML fragments, replace the regex with an HTML parser (e.g., HTMLRewriter if available in the edge runtime).
- RISK: HSTS with includeSubDomains preload locks all subdomains to HTTPS permanently. If any subdomain (staging, dev, internal tool) serves HTTP, it becomes inaccessible to browsers that have cached the HSTS preload entry. MITIGATION: Do not add 'preload' to the HSTS header until hstspreload.org eligibility is confirmed for every subdomain. The netlify.toml example above intentionally omits 'preload' — add it only after explicit verification.
- RISK: Edge Function adds latency to every HTML response. MITIGATION: Netlify Edge Functions run at CDN edge nodes (Deno Deploy infrastructure), not at origin. The body rewrite is a single synchronous string operation on already-fetched HTML. Measured overhead is typically under 5ms at edge. The 38.7ms TTFB baseline is CDN-edge delivery; this overhead does not reintroduce origin round-trip latency.
- RISK: Permissions-Policy header may break legitimate browser feature usage if the site adds camera/microphone/geolocation functionality in the future. MITIGATION: The policy is defined as a named constant in netlify.toml with an explicit comment marking it as a site-specific assumption. Any future feature addition requires a deliberate policy update — the comment ensures this is not an invisible constraint.
- RISK: Removing 'unsafe-inline' from script-src may break any inline <script> blocks that were added directly to HTML templates (not via GTM) and are not caught by the nonce injection regex. MITIGATION: The report-only phase will surface these as violations. Any legitimate inline script must either be moved to an external file or have its nonce injected by the Edge Function. Do not re-add 'unsafe-inline' as a fix — it silently voids nonce protection.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
