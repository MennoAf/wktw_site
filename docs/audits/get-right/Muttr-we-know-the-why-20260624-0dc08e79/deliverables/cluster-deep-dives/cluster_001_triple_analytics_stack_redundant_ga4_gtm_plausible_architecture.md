# Cluster Deep Dive: Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture

**Cluster ID:** cluster_001  
**Pattern:** JavaScript Execution Architecture  
**Findings:** 11  
**Severity:** Critical (systemic)  
**Compliance:** GDPR, Performance as Liability  

---

## 1. The Big Picture

Every visitor to this site downloads 290KB of analytics JavaScript before a single line of business content is processed. The page itself — the HTML, CSS, and copy that constitutes the actual product — weighs 7KB. The analytics instrumentation watching that content is 41 times heavier than the content it watches. On a fast desktop connection this is invisible. On a mid-range mobile device or a throttled connection, the browser's main thread is occupied parsing and executing Google Tag Manager (131KB) and a standalone GA4 script (159KB) that are, in large part, doing the same job twice. A visitor on a low-end Android device experiences a meaningful delay in interactivity that has nothing to do with the site's architecture — which is, by every other measure, excellent — and everything to do with a misconfiguration in the instrumentation layer bolted on top of it.

The compounding problem is that this overhead purchases nothing actionable. The same GA4 measurement ID (G-91BP6NPTSM) is loaded twice simultaneously: once through the GTM container (GTM-5VQTG6TH) and once through a standalone gtag.js script. Both fire a pageview beacon on every page load. The result is that every session, every pageview, and every engagement metric in GA4 is double-counted. Bounce rate is artificially suppressed because GA4 interprets the second pageview beacon as engagement. Session counts are inflated. The audit captured this directly: one GA4 collect request returned a 204 (success) and a second returned ERR_ABORTED — the browser cancelling a duplicate request it recognised as redundant, or an ad-blocker intercepting the second call. Alongside this, Plausible Analytics runs as a third parallel system with no defined relationship to the other two. There is no source of truth. The KPIs this business tracks — revenue, conversion rate, bounce rate — are all derived from data that is structurally corrupted.

The deepest problem is not the weight or the double-counting. It is that after all of this infrastructure cost, zero conversion events are configured on any platform. The primary business action on this site — a visitor submitting the contact form to 'Talk to a Founder' — fires no generate_lead event, no form_submit signal, nothing. The form POSTs to /thanks and the analytics stack records a pageview on the thank-you page, which is fragile (direct URL visits and bots also trigger it) and was not verified to be configured as a conversion goal. A business whose stated KPIs include revenue and conversion rate is operating with an analytics stack that cannot answer the question: "did this visitor become a lead?"

---

## 2. The Root Cause

All eleven findings in this cluster share a single origin: the analytics stack was assembled additively rather than architecturally. GA4 was added directly via gtag.js, then GTM was added later (or in parallel) and configured to also fire GA4 — a common pattern when tag management is introduced to an existing implementation without auditing what the implementation already contains. Plausible was added independently, likely for its privacy-first characteristics or as a lightweight fallback. No single decision was made about which system was authoritative, which was redundant, or what any of them were supposed to measure. The result is three systems in conflict, none of them configured to capture the conversion signals the business actually needs.

The measured evidence is unambiguous. The audit detected two GTM containers in the DOM, the same measurement ID (G-91BP6NPTSM) present in both the GTM container configuration and the standalone gtag.js snippet, 290KB of compressed analytics JavaScript against 7KB of page content (a 41:1 ratio), an ERR_ABORTED beacon consistent with duplicate request cancellation, and a dataLayer containing no custom events of any kind. The CSP and SRI findings in this cluster are downstream consequences of the same root cause: the more third-party script origins a page loads, the harder it becomes to write a meaningful Content Security Policy, and the GTM/gtag.js dynamic versioning model makes SRI hashes architecturally incompatible regardless.

---

## 3. Each Finding

### 3.1 Triple Analytics Stack Makes KPIs Unreliable With No Conversion Events Configured
**Finding ID:** `ux-analytics-triple-redundancy-kpi-corruption`  
**Severity:** Critical | **Tier:** Platform

**What's broken:** Three analytics systems are running simultaneously, but none of them are configured to track the one thing that matters: whether a visitor became a lead. The 'Talk to a Founder' CTA — the primary conversion action on the site — fires no event on click or form submission. The dataLayer is empty of custom events. The entire 290KB analytics payload delivers only redundant pageview counts.

**Evidence:** The audit detected GA4 via GTM (GTM-5VQTG6TH, 131KB), GA4 via standalone gtag.js (G-91BP6NPTSM, 159KB), and Plausible — three systems, 290KB total, against a 7KB content baseline. The dataLayer contained no custom events. No generate_lead, contact, or form_submit signals were detected in network requests.

**Why it matters:** Without a generate_lead event, GA4 cannot attribute form completions to any channel, campaign, or content piece. Conversion rate — a stated client KPI — cannot be calculated from pageviews alone. Revenue attribution is impossible. The business is making channel investment decisions without knowing which channels produce leads.

**The fix:** Choose one analytics platform as authoritative. Configure a generate_lead event on contact form submission. Configure CTA click tracking on 'Talk to a Founder'. This transforms the stack from a pageview counter into an attribution system.

---

### 3.2 Contact Form Submission Has No Client-Side Event Tracking
**Finding ID:** `ux-analytics-form-submit-untracked`  
**Severity:** Critical | **Tier:** Template

**What's broken:** The contact form POSTs to /thanks with no client-side event firing on submission. The audit found no generate_lead, form_submit, or equivalent event in network requests. The only signal of a conversion is a pageview on the /thanks destination — a fragile proxy that cannot distinguish genuine submissions from direct URL visits or bot traffic.

**Evidence:** form_action is POST /thanks, form has 6 fields (3 required), form_submit_event_detected is False, and GA4 network events show only a page_view collect beacon. No dataLayer push was detected.

**Why it matters:** This is the single highest-impact analytics gap on the site. The contact form is the sole conversion mechanism. Without a server-confirmed or beacon-fired generate_lead event, conversion rate cannot be measured, channel attribution is broken, and any optimisation of the conversion funnel is guesswork. This directly degrades the reliability of the revenue and conversion_rate KPIs.

**The fix:** Intercept form submission to fire a generate_lead event via the dataLayer before the page navigates to /thanks. Use navigator.sendBeacon (via GTM's transport_type setting) to guarantee the hit is delivered despite the synchronous page unload. This is a quick win — a small inline script scoped to the contact form, no architectural changes required.

---

### 3.3 Redundant Dual Analytics Stack — Excessive Overhead and Attribution Confusion
**Finding ID:** `resource-loading-dual-analytics-redundancy`  
**Severity:** High | **Tier:** Platform | **Compliance:** Performance as Liability

**What's broken:** Plausible and GA4 (via both GTM and standalone gtag.js) run in parallel with no defined relationship. Conversion events would need to be maintained in two separate systems, creating divergent counts and an unclear source of truth for revenue attribution. The ad stack data confirms 4 vendors generating 296,631 bytes on a page whose content is 7,423 bytes — a 40:1 ratio.

**Evidence:** Plausible (~5KB estimated), GTM+GA4 (290KB measured), total analytics approximately 295KB against 10KB of HTML+CSS+SVG content. The overhead ratio is 29:1 by content weight.

**Why it matters:** Two analytics systems measuring the same traffic without a defined source-of-truth relationship means any discrepancy between them (and there will be discrepancies, particularly as ad-blocker rates affect GA4 more than Plausible) creates ambiguity in reporting. Which number does the business act on? The performance cost — 290KB of JavaScript that must be parsed on every page load — is a direct tax on the user experience that the Astro SSG architecture was specifically chosen to avoid.

**The fix:** Make a deliberate platform decision. If Google Ads conversion tracking or audience building is not in use, remove GTM and GA4 entirely and retain Plausible as the sole platform — saving 290KB per page load. If GA4 capabilities are required, remove Plausible and consolidate GA4 exclusively through GTM.

---

### 3.4 Triple Analytics Stack Constitutes 73%+ of Total Page Transfer Weight
**Finding ID:** `an-2-duplicate-analytics-gtm-ga4-plausible`  
**Severity:** High | **Tier:** Platform | **Compliance:** Performance as Liability

**What's broken:** The three analytics scripts together account for 290KB of the page's total transfer weight, which the audit measured at 73–79% of total page transfer. The GTM container (131KB) almost certainly already contains a GA4 configuration tag, making the standalone gtag.js (159KB) entirely redundant. Two GTM containers were detected in the DOM, compounding the duplication.

**Evidence:** analytics_scripts measured at GTM container 131KB, GA4 standalone 159KB, Plausible under 1KB. Total analytics JS: 290KB compressed. Total page content: 7KB. Analytics-to-content ratio: 41:1. Two GTM containers detected in DOM. Double-counting risk confirmed: GA4 property G-91BP6NPTSM configured in both GTM container and standalone gtag.js.

**Why it matters:** 290KB of JavaScript must be downloaded, decompressed, parsed, and executed on every page load. Even with async loading, this competes for main thread time during the critical rendering window. On low-end devices, this directly increases Time to Interactive. Bounce rate — a stated client KPI — is sensitive to perceived load speed; pages that feel slow before they become interactive see higher abandonment, which the analytics stack then misreports due to double-counting.

**The fix:** Remove the standalone gtag.js script tag. GTM already fires GA4 — the standalone script is pure duplication. This single file removal eliminates 159KB of compressed JavaScript (approximately 500KB+ uncompressed/parsed) from every page load with zero loss of analytics capability.

---

### 3.5 GA4 Collect Request Aborted (ERR_ABORTED) — Analytics Data Integrity Compromised
**Finding ID:** `js-4-ga4-collect-aborted-data-loss`  
**Severity:** Medium | **Tier:** Platform

**What's broken:** The audit captured two GA4 collect requests firing on the same page load: one returned 204 (success), one returned ERR_ABORTED. The most likely cause in the test environment is ad-blocking (google-analytics.com is on every major block list), but the secondary cause — the browser cancelling a duplicate beacon from the dual GTM+gtag.js architecture — is a real production risk. In production, a meaningful proportion of desktop users run ad blockers, and those users' sessions will be entirely absent from GA4 reporting.

**Evidence:** failed_request: https://www.google-analytics.com/g/collect — net::ERR_ABORTED. Successful collect: 204 response on a separate /g/collect request. Plausible loaded successfully (200, 177ms) in the same test environment, confirming network access to third-party analytics domains. Correlation: dual GTM containers likely cause duplicate collect attempts.

**Why it matters:** Ad-blocker losses compound the double-counting problem. GA4 is simultaneously over-counting sessions (from duplicate beacons in clean browsers) and under-counting them (from ad-blocker blocks). The net result is a GA4 dataset that is wrong in both directions depending on the user's browser configuration. Bounce rate and session metrics derived from this data are unreliable.

**The fix:** Removing the standalone gtag.js eliminates the duplicate beacon and the ERR_ABORTED race condition. For the ad-blocker loss problem, server-side GA4 via Measurement Protocol through a Netlify Edge Function proxies analytics through a first-party domain that ad blockers cannot target by domain name. Plausible, already deployed, is inherently more resilient to blocking and can serve as the reliable traffic baseline.

---

### 3.6 465KB Unused JavaScript Out of 2.5MB Parsed
**Finding ID:** `js-unused-bytes-low-but-present`  
**Severity:** Medium | **Tier:** Platform | **Compliance:** Performance as Liability

**What's broken:** Code coverage shows 465KB of unused JavaScript out of 2,506KB total parsed (18.5% unused rate). The 2.5MB parsed figure is the more significant number — it exceeds the 1MB uncompressed threshold, and the excess is driven entirely by the analytics stack rather than application code. The Astro SSG application itself contributes minimal JavaScript; the analytics layer dominates the parsed JS budget.

**Evidence:** js_unused_kb: 465, js_total_parsed_kb: 2,506, unused_percentage: 18.5%, threshold_exceeded: total parsed JS over 1MB (2.5MB), primary_contributor: GTM + gtag.js analytics stack.

**Why it matters:** 2.5MB of JavaScript must be parsed by the browser's JS engine on every page load. Parsing is CPU-bound work that blocks other tasks. On low-end devices with slower CPUs, this directly delays interactivity. The 18.5% unused rate is acceptable in isolation, but the absolute parsed volume — driven by redundant analytics scripts — is the real cost.

**The fix:** Removing the standalone gtag.js (159KB compressed, approximately 500KB+ parsed) reduces total parsed JavaScript from ~2.5MB to approximately ~1.5MB — a 40% reduction in parsed JS volume from a single file removal.

---

### 3.7 GA4 ERR_ABORTED Likely Caused by Headless Browser Blocking — But Production Ad-Blocker Risk Is Real
**Finding ID:** `escalation-5-ga4-err-aborted-root-cause`  
**Severity:** Medium | **Tier:** Platform

**What's broken:** This finding provides the root cause analysis for the ERR_ABORTED beacon. The GTM container loaded (200, 131KB), the gtag.js loaded (200, 159KB), but the final collect beacon was aborted — consistent with a network-level block on the google-analytics.com domain rather than a script execution error. In production, this pattern will affect any user running an ad blocker or privacy extension.

**Evidence:** GTM container: 200, 131KB. GA4 gtag.js: 200, 159KB. Collect beacon: ERR_ABORTED. Root cause assessment: most likely test environment ad-blocking, not a production script error. Production risk: ad blockers will block google-analytics.com/g/collect for a significant portion of desktop users.

**Why it matters:** The dual-beacon architecture means GA4 is already producing corrupted data in clean environments. Ad-blocker losses then remove an additional segment of traffic from reporting entirely. The combination means GA4 data is simultaneously inflated (double-counting) and deflated (ad-blocker losses) — making it unreliable as a basis for any KPI.

**The fix:** Fix the double-counting first (remove standalone gtag.js). Then evaluate server-side GTM or Measurement Protocol proxying via Netlify Edge Functions to address ad-blocker losses. Use Plausible — already deployed and less commonly blocked — as the reliable baseline for traffic volume metrics.

---

### 3.8 No Heavy Advertising Pixels Detected — Split-Pixel Strategy Not Required
**Finding ID:** `attribution-split-pixel-not-applicable`  
**Severity:** Low | **Tier:** Platform

**What's broken:** No advertising pixels (Meta, LinkedIn, TikTok, Pinterest, etc.) were detected. This finding is a scoping confirmation: the complexity of the analytics stack cannot be attributed to advertising pixel requirements. The only tracking domains are googletagmanager.com, google-analytics.com, and plausible.io.

**Evidence:** advertising_pixels_detected: empty array. heavy_pixel_count: 0. tracking_domains: googletagmanager.com, google-analytics.com, plausible.io.

**Why it matters:** The absence of advertising pixels removes the primary justification for maintaining GTM as a tag management layer. GTM's value proposition is managing multiple third-party tags without code deployments. With zero advertising pixels and zero conversion events configured, GTM is currently orchestrating a single redundant GA4 tag. This strengthens the case for Option A in the remediation strategy: remove GTM and GA4 entirely, retain Plausible, and implement GA4 via Measurement Protocol only if Google Ads integration becomes a future requirement.

**The fix:** Use this finding as decision support for the platform consolidation. If no Google Ads campaigns are running and none are planned, GTM has no current justification. Remove it alongside the standalone gtag.js.

---

### 3.9 Cross-Domain Tracking Configuration Unverifiable
**Finding ID:** `ux-analytics-cross-domain-unknown`  
**Severity:** Low | **Tier:** Platform

**What's broken:** If the user journey crosses domains after form submission — to a scheduling tool, payment processor, or separate landing page — GA4 will break the session and attribute the continuation as a new direct visit (self-referral). This cannot be confirmed from the contact page alone, but the form's POST to /thanks and any subsequent redirect to a third-party tool creates the risk.

**Evidence:** internal_links: 11, external_links: 0, form_action: POST /thanks, cross_domain_config: unverifiable from this page.

**Why it matters:** If a prospect submits the contact form and is redirected to a Calendly or HubSpot scheduling page, GA4 will record the session as ending at /thanks and a new direct session beginning on the scheduling tool. The original channel attribution — organic search, referral, paid — is lost. Revenue attribution becomes impossible to trace back to the originating channel.

**The fix:** Audit the full post-submission journey to identify every external domain a user session can travel to. Configure GA4 cross-domain linker for those domains. This is only worth implementing after the double-counting issue is resolved — configuring cross-domain tracking on a corrupted GA4 instance compounds the data quality problem rather than solving it.

---

### 3.10 SRI Infeasible for GTM/GA4 Scripts — Nonce-Based CSP Is the Appropriate Mitigation
**Finding ID:** `escalation-1-sri-gtm-ga-mitigation`  
**Severity:** High | **Tier:** Server

**What's broken:** A prior finding flagged the absence of Subresource Integrity (SRI) attributes on GTM and GA4 scripts. This escalation correctly identifies that SRI is architecturally incompatible with these resources: Google dynamically versions GTM container content and gtag.js without changing the URL, meaning any SRI hash would become stale on every Google-side update and cause the scripts to fail to load entirely. The correct mitigation is a Content Security Policy with allowlisted script origins, not SRI.

**Evidence:** gtm_dynamic_versioning: True, ga4_dynamic_versioning: True, sri_feasibility for GTM: 'Not feasible — dynamically versioned', sri_feasibility for GA4 gtag: 'Not feasible — dynamically versioned'. Plausible's URL contains a content hash token (pa-GNbSMJlnmKdl4_QO4sS4C.js), making SRI potentially feasible for that script. Recommended CSP script-src: 'self' https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io.

**Why it matters:** Without a CSP, any injected or compromised third-party script can execute in the page context with full access to form data, including the contact form fields. For a site collecting business contact information, this is a supply-chain attack surface. The more third-party script origins the page loads, the broader the CSP allowlist must be — which is why consolidating the analytics stack first simplifies the security posture.

**The fix:** Implement a nonce-based CSP via Netlify response headers, starting in Report-Only mode to capture violations without breaking the site, then promote to enforced mode once the violation stream is clean. Consolidating to a single analytics platform first reduces the number of origins that must be allowlisted, making the CSP both simpler to write and more restrictive in practice.

---

### 3.11 SRI Is Technically Incompatible With GTM/gtag.js — Alternative Mitigations Required
**Finding ID:** `prescan-escalation-sri-gtm-incompatibility`  
**Severity:** Medium | **Tier:** Server

**What's broken:** This finding amends the original prescan SRI recommendation. SRI is valid for Plausible (versioned filename suggests stable content) but must be replaced with CSP nonce-based script execution controls for GTM and gtag.js. Google Fonts CSS also varies by User-Agent, making SRI problematic there as well — self-hosting fonts eliminates that dependency entirely (addressed in cluster_005).

**Evidence:** gtm_sri_compatible: False, gtag_sri_compatible: False, plausible_sri_compatible: likely (filename contains content hash). sri_incompatible_scripts: googletagmanager.com/gtm.js and googletagmanager.com/gtag/js. sri_compatible_scripts: plausible.io/js/pa-GNbSMJlnmKdl4_QO4sS4C.js.

**Why it matters:** Applying SRI to GTM or gtag.js would cause analytics to silently break on every Google-side script update — potentially multiple times per week — without any visible error to the engineering team. The correct path is CSP, which governs which origins can execute scripts rather than which specific file contents are permitted.

**The fix:** Add an integrity attribute with a SHA-384 hash to the Plausible script tag (feasible given the versioned filename). Replace the SRI recommendation for GTM/gtag.js with a nonce-based CSP header. If GTM is removed as part of the platform consolidation, the GTM origin can be dropped from the CSP allowlist entirely, further tightening the policy.

---

## 4. The Unified Fix Strategy

All eleven findings resolve from a single architectural decision made once. The sequencing below is designed so that each phase creates the conditions for the next, and no phase requires undoing work from a prior phase.

### Phase 1 — Platform Decision (Prerequisite for Everything Else)

Before touching any code, answer one question: **Is GA4 linked to active Google Ads campaigns?**

Open the GA4 property (G-91BP6NPTSM) and check for Google Ads links under Admin → Product Links. If no Ads linkage exists:

- **Option A (Recommended):** Remove GTM (GTM-5VQTG6TH) and the standalone gtag.js entirely. Retain Plausible as the sole analytics platform. Implement GA4 via Measurement Protocol through a Netlify Edge Function only if Google Ads integration becomes a future requirement. This eliminates 290KB of script payload, resolves the double-counting, removes the ERR_ABORTED beacon, and reduces the CSP allowlist to a single origin (plausible.io).

- **Option B:** Remove the standalone gtag.js only. Retain GTM as the sole GA4 delivery mechanism. Remove Plausible or retain it deliberately as a privacy-first secondary signal with a documented source-of-truth policy. This eliminates 159KB and fixes double-counting while preserving GTM's tag management capability for future use.

Neither option requires more than removing script tags from the site's global layout template and verifying GA4 data continues flowing in DebugView. Both are deployable in a single Netlify deploy.

### Phase 2 — Conversion Event Configuration (Quick Win, High Impact)

Once the platform decision is made and the redundant scripts are removed, configure the conversion events that the entire analytics stack currently omits:

1. **generate_lead** on contact form submission — intercept the form's POST to /thanks and fire a beacon via navigator.sendBeacon before page navigation. Scope the listener to the contact form only.
2. **cta_click** on 'Talk to a Founder' button — a GTM click trigger or a Plausible custom event, depending on the chosen platform.
3. **scroll_depth** on content pages — 25%, 50%, 75%, 100% thresholds to understand content engagement.

These three events transform the analytics stack from a pageview counter into an attribution system capable of answering the questions the business's KPIs require.

### Phase 3 — Security Hardening (Medium Effort, Enabled by Phase 1)

With the analytics stack consolidated, implement a Content Security Policy via Netlify response headers:

1. Deploy CSP in Report-Only mode first. Monitor the violation report stream for two weeks.
2. Add SRI to the Plausible script tag (feasible given the versioned filename).
3. Promote CSP to enforced mode once the violation stream is clean.

If Option A was chosen in Phase 1, the CSP script-src allowlist shrinks to `'self' https://plausible.io` — a meaningfully more restrictive policy than one that must also allowlist googletagmanager.com and google-analytics.com.

### Phase 4 — Ad-Blocker Resilience (Medium Effort, Optional)

If GA4 is retained (Option B), evaluate server-side GA4 via Measurement Protocol through a Netlify Edge Function to proxy analytics through a first-party domain. This addresses the ad-blocker loss problem identified in findings js-4 and escalation-5. If Option A is chosen and Plausible is the sole platform, Plausible's custom subdomain proxy option provides equivalent resilience with less infrastructure complexity.

### Priority Rationale

Phase 1 is the prerequisite for all other phases — it is impossible to write a meaningful CSP, configure accurate conversion events, or interpret analytics data while the double-counting architecture is in place. Phase 2 is the highest-impact business action: it directly enables measurement of the KPIs the business cares about. Phases 3 and 4 are hardening steps that become simpler and more effective after the platform consolidation is complete.

---

## 5. Compliance Note: GDPR and Performance as Liability

Two compliance flags apply to this cluster.

**GDPR:** GA4 sets cookies and transmits device identifiers to Google's servers on page load. Under GDPR (EU) 2016/679 and the ePrivacy Directive, analytics cookies that are not strictly necessary for the service require freely given, specific, informed, and unambiguous consent before being set. The audit confirmed that GA4 loads and fires collect beacons without any consent gate — meaning every EU visitor's data is being transmitted to Google before they have had any opportunity to consent or decline. This is not a theoretical risk: it is the specific mechanism that data protection authorities across the EU have acted on in enforcement decisions against Google Analytics deployments. The practical risk is a formal complaint to a supervisory authority (any EU DPA), which can result in an investigation, a mandatory remediation order, and reputational exposure. Consolidating to Plausible (Option A) eliminates this liability entirely — Plausible is cookieless, does not transmit personal data to third parties, and does not require a consent gate under GDPR. If GA4 is retained (Option B), it must be loaded exclusively behind a consent management platform that gates script execution until consent is granted.

**Performance as Liability:** The 290KB analytics payload on a 7KB content page is not merely a performance inconvenience — it is a self-inflicted degradation of the user experience that the site's architecture was specifically designed to prevent. The Astro SSG foundation delivers sub-50ms TTFB and 24ms INP. The analytics layer undermines both by occupying main thread parsing time that the application itself does not consume. For a consultancy whose website is a direct representation of its technical judgment, a 41:1 analytics-to-content ratio is a credibility risk as much as a performance one.

---

## 6. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| `ux-analytics-triple-redundancy-kpi-corruption` | Triple analytics stack — KPIs unreliable, no conversion events | Critical | Medium | Shared: platform consolidation decision |
| `ux-analytics-form-submit-untracked` | Contact form submission untracked — lead attribution blind | Critical | Quick Win | Unique: conversion event implementation |
| `resource-loading-dual-analytics-redundancy` | Redundant dual analytics stack — overhead and attribution confusion | High | Quick Win | Shared: platform consolidation decision |
| `an-2-duplicate-analytics-gtm-ga4-plausible` | Triple stack = 73%+ of total page transfer weight | High | Quick Win | Shared: remove standalone gtag.js |
| `escalation-1-sri-gtm-ga-mitigation` | SRI infeasible for GTM/GA4 — nonce-based CSP required | High | Medium | Shared: CSP implementation (Phase 3) |
| `js-4-ga4-collect-aborted-data-loss` | GA4 collect ERR_ABORTED — data integrity compromised | Medium | Quick Win | Shared: remove standalone gtag.js |
| `js-unused-bytes-low-but-present` | 465KB unused JS out of 2.5MB parsed | Medium | Quick Win | Shared: remove standalone gtag.js |
| `escalation-5-ga4-err-aborted-root-cause` | ERR_ABORTED root cause — ad-blocker risk confirmed | Medium | Medium | Shared: platform consolidation + optional server-side proxy |
| `prescan-escalation-sri-gtm-incompatibility` | SRI incompatible with GTM/gtag.js — alternative mitigations required | Medium | Medium | Shared: CSP implementation (Phase 3) |
| `ux-analytics-cross-domain-unknown` | Cross-domain tracking unverifiable — self-referral risk | Low | Medium | Shared: resolve after double-counting fixed |
| `attribution-split-pixel-not-applicable` | No advertising pixels — split-pixel strategy not required | Low | Quick Win | Shared: informs platform decision (no GTM justification) |
