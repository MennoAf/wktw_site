# Cluster Deep Dive: Analytics Blindness — No Conversion Tracking, No Event Measurement, Client-Side Only

**Client:** WKTW | **Cluster ID:** cluster_005 | **Findings:** 3 | **Pattern:** CMS Platform Debt | **Systemic:** Yes

---

## 1. The Big Picture

WKTW's stated KPIs are conversion rate, bounce rate, and contact form completions. Right now, the site cannot measure any of them with confidence. A visitor arrives, reads through the content, navigates to `/contact/`, fills out the form, and submits it — and that submission is invisible to the business. There is no event fired, no goal recorded, no attribution captured. The only data Plausible collects is that a pageview occurred on `/contact/`. Whether that visit resulted in a lead is unknown. This is not a minor gap in reporting fidelity; it is a complete absence of the measurement the business needs to make any informed decision about marketing spend, content performance, or conversion optimization.

The situation is compounded by two reinforcing failures. First, Plausible loads from a third-party domain (`plausible.io`) rather than a first-party proxy, which means privacy-focused browsers — Brave, Firefox with Enhanced Tracking Protection, and common ad-blocker configurations — will silently block the script entirely. This is particularly consequential for WKTW's B2B technical audience, which skews heavily toward exactly these tools. When the script is blocked, not even pageview data is collected for that session. Second, the site's consent banner exists in the DOM but never renders visually. Google Consent Mode is initialized with all storage types denied by default and a 500ms `wait_for_update` window — but because the banner never appears, users can never grant consent, and the consent state never updates from its default denied position. If GA4 or any consent-dependent tracking were added tomorrow, it would be permanently suppressed by this rendering failure.

The net result is a measurement architecture that is structurally incapable of answering the questions the business most needs to answer: Are visitors converting? Which traffic sources produce leads? Where does the funnel break down? The engineering foundation of this site is genuinely excellent — sub-200ms TTFB, 29KB of JavaScript, zero layout shift — but that investment in performance cannot be evaluated or optimized because the measurement layer needed to observe its impact does not function.

---

## 2. The Root Cause

All three findings share a single root cause: the analytics stack was configured for privacy compliance and lightweight deployment, but was never extended to support conversion measurement. Plausible was a reasonable choice for a privacy-first, low-overhead analytics implementation. The problem is that it was deployed in its default, out-of-the-box state — one script tag, no custom events, no proxy configuration, no integration with the consent system — and left there. The measured evidence confirms this: `custom_events_detected: 0`, `data_layer_present: False`, `first_party_proxy: False`, `server_side_fallback: False`, and the Plausible script loads with `async` and no `data-*` attributes that would indicate any goal configuration. Plausible's own documentation supports custom event tracking via a simple JavaScript API (`plausible('event_name')`), but none of the eight inline scripts on the page contain any such calls.

The consent banner failure compounds this at the infrastructure level. The DOM contains `#consent-accept` and `#consent-decline` buttons, Google Consent Mode v2 is initialized with `analytics_storage: denied` as the default, and `wait_for_update` is set to 500ms — all of which indicates someone built the consent scaffolding correctly. But `consent_banner_found: False` and `consent_mode_changed: False` in the audit data confirm the banner never renders and the consent state never transitions. This means the consent infrastructure is architecturally sound but operationally inert, and any tracking that depends on consent state will remain permanently suppressed until the rendering bug is resolved.

---

## 3. Each Finding

### Finding 1: No GA4 or Equivalent — Conversion Tracking and Enhanced Measurement Absent
**ID:** `analytics-no-ga4-no-conversion-tracking` | **Severity:** Critical | **Effort:** Quick Win

**What's broken:** The site has one analytics script. That script counts pageviews and records referrer domains. It does not know whether a visitor submitted the contact form, clicked a CTA, or completed any other meaningful action. The contact form — the site's primary conversion mechanism and an explicit KPI — has no submission tracking of any kind.

**Evidence:** The crawl detected `custom_events_detected: 0` across all eight inline scripts. The single external script is `plausible.io (async, no custom event attributes)`. `ga4_present: False`, `gtm_present: False`, `data_layer_present: False`. Plausible's custom event API (`plausible('event_name')`) is available but unused.

**Why it matters:** Without a `Contact Form Submitted` event, the `contact_form` KPI cannot be measured. Without event-level data, `conversion_rate` cannot be calculated — the business has pageview counts but no numerator for the conversion fraction. Marketing decisions made on pageview data alone will optimize for traffic volume rather than lead generation, which are not the same objective and can actively diverge.

**The fix:** Add a single JavaScript call — `plausible('Contact Form Submitted')` — to the contact form's submit handler. This requires no new scripts, no new vendors, and no changes to the existing analytics platform. It is the minimum viable fix for the `contact_form` KPI and can be implemented in under an hour. Extend the same pattern to mailto link clicks and primary CTA buttons to begin building a complete conversion event taxonomy.

---

### Finding 2: Client-Side Only Tracking — Ad Blocker and ITP Data Loss Unmitigated
**ID:** `ux-analytics-client-side-only-data-loss` | **Severity:** Medium | **Effort:** Medium

**What's broken:** Plausible loads from `plausible.io`, a third-party domain that appears on common ad-blocker and privacy-tool blocklists. When the script is blocked, the session produces zero data — no pageview, no referrer, no event. There is no server-side fallback and no first-party proxy to route around this. The audit was conducted on an iPhone 14 Pro running Safari/WebKit, which applies Intelligent Tracking Prevention by default.

**Evidence:** `analytics_vendor: Plausible (plausible.io)`, `loading_method: client-side async script`, `server_side_fallback: False`, `first_party_proxy: False`, `script_domain: plausible.io (third-party — blockable)`. The script loads unconditionally from the third-party domain with no fallback path.

**Why it matters:** WKTW's audience is B2B and technical. This demographic has disproportionately high adoption of privacy browsers and ad-blocking tools. Sessions from this audience segment — likely the highest-value sessions on the site — are the most likely to be silently dropped from analytics. The data loss is invisible: Plausible reports what it receives, not what was blocked. The reported numbers will undercount actual traffic by an unknown margin, and the undercount will be systematically biased toward the most technically sophisticated visitors.

**The fix:** Plausible natively supports first-party proxying. Two redirect rules in `netlify.toml` route `/js/script.js` to `https://plausible.io/js/script.js` and `/api/event` to `https://plausible.io/api/event`. The browser sees WKTW's own domain for both requests, which bypasses blocklists entirely. This is a configuration change, not a code change, and Netlify's redirect infrastructure handles the proxying without any server-side compute cost. For the highest-value sessions, pair this with a server-side form submission log that captures attribution data independent of client-side analytics entirely.

---

### Finding 3: Consent Banner Not Rendering — Analytics Cannot Activate, Legal Exposure Present
**ID:** `consent-banner-not-rendering` | **Severity:** Medium | **Effort:** Medium | **Legal Liability:** Yes | **Compliance:** GDPR, CCPA

**What's broken:** The consent banner infrastructure is built but broken. The DOM contains `#consent-accept` and `#consent-decline` buttons. Google Consent Mode v2 is initialized with all storage types denied by default and a 500ms update window. But the banner never renders visually — `consent_banner_found: False` in the audit — so users are never presented with a consent choice. The consent state never transitions from its default denied position (`consent_mode_changed: False`).

**Evidence:** `consent_buttons_in_dom: True`, `consent_banner_found: False`, `consent_mode_changed: False`, `default_consent_state: all denied except security_storage`, `wait_for_update_ms: 500`. The Plausible script loads `async` and unconditionally, suggesting it does not gate on consent state — but any future consent-dependent tracking (GA4, advertising pixels) would be permanently suppressed by this failure.

**Why it matters:** This finding operates on two levels. First, it is a compounding analytics failure: the consent scaffolding was built in anticipation of adding consent-dependent tracking, but the rendering bug means that scaffolding will never activate. Any GA4 implementation added without fixing this first will collect no data. Second, it is a compliance issue. GDPR requires that users be presented with a genuine, informed consent choice before personal data is processed. A consent banner that exists in the DOM but never renders does not satisfy this requirement — the mechanism for obtaining consent is present in code but absent in user experience. CCPA similarly requires that users be given a meaningful opportunity to opt out of data sale. The site currently passes pre-consent compliance (zero cookies, zero tracking before consent), but that pass is contingent on the consent system functioning as designed. A non-rendering banner is a broken consent system, not a compliant one.

**The fix:** Replace the broken consent banner with a self-contained component that renders as static HTML — visible by default without requiring JavaScript to initialize. JavaScript should handle only the interaction layer (accept, decline, persist to localStorage, fire `gtag('consent', 'update')`), not the visibility of the banner itself. This ensures a JavaScript error can never suppress the consent UI again. This fix is also the prerequisite for the broader analytics roadmap: until the consent banner renders correctly, adding any consent-dependent tracking is wasted effort.

---

## 4. The Unified Fix Strategy

These three findings should be treated as a single coordinated workstream rather than three separate tickets. They share infrastructure, share dependencies, and their fixes build on each other in a defined sequence. Executing them out of order wastes effort.

**Phase 1 — Immediate (hours, not days)**

Add `plausible('Contact Form Submitted')` to the contact form's submit handler. This is a one-line change that immediately activates measurement of the primary KPI. No dependencies, no prerequisites, no risk. Also add equivalent events for mailto link clicks and primary CTA buttons while the file is open. This phase costs almost nothing and delivers the most direct KPI impact.

**Phase 2 — Short-Term (this sprint)**

Fix the consent banner rendering bug. This is the highest-leverage change in the cluster because it unblocks not just analytics but also the privacy and accessibility findings documented in cluster_001. The banner must render as static HTML with CSS-visible default state. Once the banner renders correctly, the existing Google Consent Mode v2 initialization will function as designed. Simultaneously, configure the Plausible first-party proxy in `netlify.toml`. These two changes together — consent banner rendering and first-party proxy — close the data loss vectors and restore measurement integrity for the existing analytics stack.

**Phase 3 — Medium-Term (next planning cycle)**

With the consent system functional and Plausible properly instrumented, evaluate whether the current measurement maturity meets the business's needs. If attribution granularity, advertising platform integration, or funnel analysis beyond what Plausible supports is required, this is the point at which GA4 should be evaluated — not before. Adding GA4 before fixing the consent banner would result in a GA4 implementation that collects no data. The sequence matters.

**Dependency note:** Phase 1 has no dependencies and should not wait for Phases 2 or 3. Phase 2's consent banner fix is a prerequisite for any consent-dependent tracking added in Phase 3. The first-party proxy in Phase 2 is independent of the consent fix and can be deployed in parallel.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| `analytics-no-ga4-no-conversion-tracking` | No conversion tracking — contact form submissions invisible | Critical | Quick Win | Unique: form event instrumentation; Shared: Plausible as platform |
| `ux-analytics-client-side-only-data-loss` | Client-side only — ad blocker data loss unmitigated | Medium | Medium | Shared: Plausible proxy config (netlify.toml); Unique: server-side submission log |
| `consent-banner-not-rendering` | Consent banner not rendering — consent state permanently denied | Medium | Medium | Shared: prerequisite for any consent-dependent tracking; Unique: banner rendering fix, GDPR/CCPA compliance |
