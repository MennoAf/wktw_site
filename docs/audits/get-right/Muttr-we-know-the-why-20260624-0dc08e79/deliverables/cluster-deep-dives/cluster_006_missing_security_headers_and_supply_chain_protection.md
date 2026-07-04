# Cluster Deep Dive: Missing Security Headers and Supply-Chain Protection

**Cluster ID:** cluster_006  
**Architectural Pattern:** Server-side  
**Severity Range:** Medium – High  
**Findings in Cluster:** 3  
**Compliance Implications:** GDPR  

---

## 1. The Big Picture

Every page on weknowthewhy.com is served without the standard HTTP security headers that modern browsers expect. This is not a theoretical concern — it is a measurable, confirmed gap across all five audited pages, including the contact page where visitors submit their name, email, and company. Without a Content-Security-Policy (CSP), an attacker who gains access to the Google Tag Manager container (GTM-5VQTG6TH) can inject arbitrary JavaScript into every page on the site. That script would execute silently in the visitor's browser, with full access to anything typed into a form before it is submitted. The visitor would see nothing unusual. The data would be gone.

The absence of the other headers compounds this exposure in distinct ways. Without `X-Frame-Options`, the site can be embedded inside an invisible iframe on a malicious page — a technique called clickjacking — where a visitor believes they are interacting with a legitimate interface but are actually triggering actions on the real site beneath. Without `X-Content-Type-Options`, browsers may misinterpret the type of files the server sends, opening a secondary injection vector. Without `Referrer-Policy`, the full URL of every page a visitor navigates from is leaked to third-party services in the HTTP referrer header, including any URL parameters that may carry session tokens or campaign identifiers. These are not edge cases; they are the reason these headers exist as a baseline expectation in every modern security framework.

The supply-chain dimension of this cluster is what elevates it from a configuration gap to a business risk. The site loads scripts from Google's infrastructure — GTM and GA4 — that cannot be protected with Subresource Integrity (SRI) because Google dynamically updates their content without changing their URLs. This is confirmed by the audit: `gtm_dynamic_versioning: True`, `ga4_dynamic_versioning: True`. The practical consequence is that the only viable protection against a compromised or tampered third-party script is a well-configured CSP. The site currently has neither SRI nor CSP, leaving the contact form — the primary conversion mechanism on the site — with no technical barrier against script-based data exfiltration.

---

## 2. The Root Cause

All three findings in this cluster share a single architectural cause: security headers were never configured at the hosting layer. The site runs on Netlify, which does not apply security headers by default. They must be explicitly declared, either in a `netlify.toml` configuration file or a `_headers` file. No such configuration exists. This is a deployment omission, not a code defect — the Astro SSG architecture is sound, and the Netlify infrastructure is fully capable of serving these headers. The gap is simply that no one added the configuration.

The SRI findings are a direct consequence of the same omission, compounded by a technical constraint in how Google distributes its tag management scripts. Because GTM and gtag.js are dynamically versioned server-side by Google — meaning the file content changes without the URL changing — a static integrity hash would become invalid on every Google-side update, breaking analytics silently. The audit confirms this for both scripts (`sri_feasibility: 'Not feasible — dynamically versioned'` for both GTM and GA4). The correct architectural response to this constraint is a nonce-based CSP, which authorises script execution per-request using a cryptographically random token rather than a static content hash. That mechanism is also absent. The result is a site with no compensating control for the one class of third-party scripts it cannot hash.

---

## 3. Each Finding

### Finding 1: Missing Recommended Security Headers
**ID:** det-security-headers-https-weknowthewhy-com-about  
**Severity:** Medium | **Tier:** Platform

**What is broken:** The server does not send four security headers that browsers use to enforce safe content handling. These headers are not optional hardening — they are the baseline defence layer that every production web property is expected to provide. Their absence was confirmed across all five audited pages: the homepage, the about page, the contact page, the insights article, and the privacy policy.

**Evidence from the crawl:** The audit's deterministic detector confirmed the following headers are missing on every tested URL:
- `Content-Security-Policy` — controls which scripts, styles, and resources the browser is permitted to load and execute
- `X-Frame-Options` — prevents the page from being embedded in an iframe on another domain
- `X-Content-Type-Options` — instructs the browser not to guess the MIME type of a response
- `Referrer-Policy` — controls how much URL information is included in outbound requests

Affected pages confirmed: `weknowthewhy.com/`, `/about/`, `/contact/`, `/insights/why-most-audits-dont-change-anything/`, `/legal/privacy/`.

**Why it matters:** The contact page is the site's primary conversion point. Without `Content-Security-Policy`, any script that executes on that page — whether injected through a compromised GTM container, a browser extension exploit, or a network-level attack — has unrestricted access to form field values before they are submitted. This directly threatens the integrity of the conversion event that drives the client's revenue KPI. Without `X-Frame-Options`, the site can be used as the invisible layer in a clickjacking attack, which degrades visitor trust and can corrupt conversion attribution. The `Referrer-Policy` gap means that URL parameters from campaign traffic — UTM tags, session identifiers — are leaked to every third-party resource the page loads, which has implications for both analytics accuracy and data minimisation obligations under GDPR.

**The fix:** Add a `[[headers]]` block to `netlify.toml` that applies the following to all routes (`/*`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`. CSP requires a separate approach described in Finding 2 below. This configuration change requires no code changes to the Astro build and deploys in a single Netlify push.

---

### Finding 2: SRI Infeasible for GTM/GA4 — Nonce-Based CSP Is the Correct Mitigation
**ID:** escalation-1-sri-gtm-ga-mitigation  
**Severity:** High | **Tier:** Server

**What is broken:** A pre-scan finding correctly identified that the GTM and GA4 scripts load without Subresource Integrity attributes. This finding was escalated and refined: SRI is not a viable fix for these specific scripts. The escalation confirms that Google dynamically versions both `gtm.js?id=GTM-5VQTG6TH` and `gtag/js?id=G-91BP6NPTSM` — the file content changes on Google's servers without the URL changing. Applying a static SRI hash would cause the browser to reject the script on every Google-side update, silently breaking all analytics and tag management. The correct mitigation is a nonce-based CSP.

**Evidence from the crawl:** The audit records `gtm_dynamic_versioning: True` and `ga4_dynamic_versioning: True`. The GTM container ID is `GTM-5VQTG6TH` and the GA4 property is `G-91BP6NPTSM`. The audit also identifies a dual-beacon architectural defect: both a GTM container script and a standalone `gtag/js` script are loading GA4 data independently, meaning the same GA4 property (`G-91BP6NPTSM`) is receiving duplicate event beacons. This inflates reported conversion counts and distorts the conversion rate KPI. The recommended `script-src` allowlist for a CSP covering the current script surface is: `script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io`.

**Why it matters:** The absence of any CSP means there is no browser-enforced boundary on what scripts can execute on the site. A GTM container compromise — whether through credential theft, a supply-chain attack on a GTM tag template, or an unauthorised container publish — would allow arbitrary JavaScript to run on every page with no technical barrier. The contact form fields (name, email, company) are the specific data at risk. Beyond the direct security exposure, the dual-beacon defect means conversion rate data in GA4 is currently unreliable, which undermines any data-driven decision-making tied to the revenue and conversion rate KPIs.

**The fix:** Implement a nonce-based CSP via a Netlify Edge Function. The function generates a 128-bit cryptographically random nonce per request using `crypto.getRandomValues()`, rewrites the HTML response to inject the nonce attribute into matching `<script>` tags, and emits the `Content-Security-Policy` header referencing that nonce. This approach makes GTM's dynamically versioned scripts compliant without requiring SRI. The recommended deployment sequence is: (1) deploy in `Content-Security-Policy-Report-Only` mode first to capture violations without breaking the site, (2) monitor the violation report stream until it is clean, (3) promote to enforced CSP. Separately, remove the standalone `gtag/js` script tag from the global layout template — GTM already fires GA4 via the container, making the standalone load redundant and harmful to data accuracy.

---

### Finding 3: SRI Technically Incompatible with GTM/gtag.js — Alternative Mitigations Required
**ID:** prescan-escalation-sri-gtm-incompatibility  
**Severity:** Medium | **Tier:** Server

**What is broken:** This finding refines the original pre-scan SRI recommendation (prescan-2-7) with a technically precise amendment. The blanket recommendation to add SRI to all third-party scripts is correct in principle but architecturally incompatible with GTM and gtag.js specifically. The finding also identifies where SRI *is* viable: the Plausible analytics script uses a content-hashed filename (`pa-GNbSMJlnmKdl4_QO4sS4C.js`), which indicates versioned, stable content — a pattern that supports SRI. The Google Fonts stylesheet is identified as also problematic for SRI because Google serves different CSS content based on the requesting browser's User-Agent header, making a static hash unreliable.

**Evidence from the crawl:** The audit explicitly categorises script SRI compatibility: `gtm_sri_compatible: False`, `gtag_sri_compatible: False`, `plausible_sri_compatible: likely — filename contains content hash`. The incompatible scripts are `https://www.googletagmanager.com/gtm.js?id=GTM-5VQTG6TH` and `https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM`. The Plausible script at `https://plausible.io/js/pa-GNbSMJlnmKdl4_QO4sS4C.js` is identified as a viable SRI candidate. The Google Fonts stylesheet is flagged as SRI-problematic due to User-Agent-conditional content, and self-hosting is identified as the correct resolution — which aligns with the recommendation in cluster_005.

**Why it matters:** This finding is primarily a precision correction that prevents the engineering team from implementing a fix that would break the site. If SRI were applied to GTM or gtag.js based on the original pre-scan recommendation, analytics would fail silently on every Google-side script update — potentially multiple times per week — without any visible error to the end user or the team. The bounce rate KPI would become unmeasurable, and conversion tracking would drop out intermittently. The finding also surfaces a quick, low-effort win: adding an `integrity` attribute to the Plausible script tag is a straightforward one-line change that provides genuine supply-chain protection for that specific script at no architectural cost.

**The fix:** Amend the implementation plan for prescan-2-7 as follows. For GTM and gtag.js: replace the SRI recommendation with the nonce-based CSP approach described in Finding 2. For the Plausible script: add an `integrity` attribute with the SHA-384 hash of the current script content — verify the correct hash value against Plausible's documentation or by hashing the current file directly. For Google Fonts: self-hosting (per cluster_005) eliminates the dependency entirely and removes both the SRI problem and the associated GDPR data transfer concern.

---

## 4. The Unified Fix Strategy

These three findings are not independent tickets. They are three expressions of a single missing configuration layer, and they should be resolved as a coordinated deployment rather than sequentially. The recommended execution order is as follows.

**Step 1 — Static headers via `netlify.toml` (Quick win, low risk, immediate value)**  
Add the `[[headers]]` block for all non-CSP headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`. This resolves the most straightforward part of Finding 1 in a single configuration file change with no runtime logic. It can be deployed immediately and independently of the CSP work. This step carries no risk of breaking existing functionality.

**Step 2 — Eliminate the duplicate GA4 beacon (Prerequisite for accurate CSP scope)**  
Remove the standalone `gtag/js?id=G-91BP6NPTSM` script tag from the global layout template. Confirm that the GTM container (GTM-5VQTG6TH) already fires GA4 via a GA4 Configuration tag before removing the standalone load. This reduces the number of Google-origin scripts that need to be authorised in the CSP from two to one, simplifies the allowlist, and fixes the double-counted conversion data that is currently distorting the conversion rate KPI. Verify in GA4 DebugView before proceeding to Step 3.

**Step 3 — Nonce-based CSP via Netlify Edge Function (Medium effort, highest security value)**  
Deploy the Edge Function that generates per-request nonces, rewrites script tags, and emits the `Content-Security-Policy` header. Deploy initially in `Report-Only` mode. Monitor the violation report stream — a clean stream indicates the nonce injection is working correctly and no unauthorised scripts are present. Promote to enforced CSP once the report stream is stable. This resolves Findings 2 and 3 and completes the CSP layer of Finding 1.

**Step 4 — SRI on Plausible script (Quick win, can be done in parallel with Step 3)**  
Add the `integrity` attribute to the Plausible script tag. This is a one-line change in the Astro layout template. It provides genuine supply-chain protection for the one third-party script where SRI is technically viable.

**Dependency note:** This cluster has meaningful dependencies on two other clusters. If analytics are consolidated to Plausible only (cluster_001), the CSP `script-src` directive simplifies from a multi-origin allowlist to `script-src 'self' https://plausible.io` — eliminating the need for the nonce-based Edge Function entirely and allowing a simple static CSP in `netlify.toml`. If fonts are self-hosted (cluster_005), the `font-src` and `style-src` directives no longer need to allowlist `fonts.googleapis.com` or `fonts.gstatic.com`. Resolving clusters_001 and 005 first, or in parallel, will materially reduce the complexity of the CSP implementation in this cluster.

**GDPR exposure note:** While none of the individual findings in this cluster carry a direct legal liability flag, the cluster as a whole creates conditions for a GDPR violation. The `Referrer-Policy` gap means that full page URLs — potentially including query parameters from campaign links — are transmitted to Google and Plausible in the HTTP `Referer` header on every outbound request. Under GDPR Article 5(1)(c), personal data must be adequate, relevant, and limited to what is necessary (data minimisation). Leaking URL parameters to third-party analytics providers without a `Referrer-Policy` header is a data minimisation failure. The `strict-origin-when-cross-origin` policy recommended in Step 1 resolves this by sending only the origin (e.g., `https://weknowthewhy.com`) rather than the full URL path and parameters to cross-origin destinations. This is a low-effort fix with a direct compliance benefit.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| det-security-headers-https-weknowthewhy-com-about | Missing recommended security headers | Medium | Low (static headers) / Medium (CSP) | Shared — resolved by Steps 1 + 3 of unified strategy |
| escalation-1-sri-gtm-ga-mitigation | SRI infeasible for GTM/GA4 — nonce-based CSP required | High | Medium | Shared — resolved by Steps 2 + 3; also addresses dual-beacon defect |
| prescan-escalation-sri-gtm-incompatibility | SRI technically incompatible with GTM/gtag.js | Medium | Low (Plausible SRI) / Medium (CSP) | Shared — CSP resolved by Step 3; Plausible SRI resolved by Step 4 |
