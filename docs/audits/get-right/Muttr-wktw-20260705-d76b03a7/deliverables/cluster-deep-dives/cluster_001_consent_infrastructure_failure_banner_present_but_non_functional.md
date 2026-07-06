# Cluster Deep Dive: Consent Infrastructure Failure — Banner Present but Non-Functional

**Cluster ID:** cluster_001 | **Architectural Pattern:** CMS Platform Debt | **Systemic:** Yes | **Findings:** 8

**Compliance Exposure:** GDPR, CCPA, WCAG

---

## 1. The Big Picture

Every visitor to the WKTW site arrives at a page that contains a consent banner — the HTML is there, the buttons are there, the Google Consent Mode infrastructure is there — but the banner never actually appears on screen. From the user's perspective, nothing happens. There is no prompt, no choice, no visible mechanism to accept or decline data collection. This is not a minor cosmetic issue. It means that every visitor who should be offered a consent decision is silently denied the opportunity to make one. The consent buttons (`#consent-accept`, `#consent-decline`) exist in the DOM but are hidden by an unknown rendering condition that was never satisfied during the audit. The banner has simply never shown up.

The downstream consequences compound quickly. Because the banner never renders, users cannot interact with it — which means Google Consent Mode remains permanently locked in its default denied state (`analytics_storage: denied`, `ad_storage: denied`, and all other storage types denied). Any analytics that depend on consent signals can never activate. Meanwhile, the Plausible Analytics script loads unconditionally at 161ms — before any consent interaction could theoretically occur — raising a question about the legal basis for that pre-consent load that the site has not documented. And if a user somehow found the banner, they would encounter an accept button with a measured contrast ratio of 1.00:1 (invisible text on an identical background), a privacy policy link with a touch target height of only 17px (against a 48px minimum), and a footer button with no accessible name that appears to be a consent re-trigger but announces nothing to assistive technology. The broken rendering is the trunk of the tree; every other finding in this cluster is a branch.

For a site whose primary conversion mechanism is the contact form, this matters directly. Visitors who cannot understand the site's data practices — because the privacy policy link is practically untappable and the consent UI never appears — are less likely to submit personal information through that form. Trust is a precondition for conversion, and a consent system that silently fails erodes it without the visitor ever knowing why they felt uneasy.

---

## 2. The Root Cause

All eight findings in this cluster share a single origin: a custom consent banner implementation that depends on a rendering condition that is never met. The audit confirmed that the consent elements exist in the DOM (`#consent-accept` with class `btn btn-gold`, `#consent-decline` with class `btn btn-outline`) and that Google Consent Mode is initialized with a full default-denied push — this is a complete consent infrastructure. But `banner_rendered: False` and `cmp_detected: None` confirm that the banner never became visible. The most likely causes are a JavaScript runtime error in one of the 7 inline scripts that silently prevents the show logic from executing, a CSS rule that hides the banner container before JS can reveal it, or a conditional gate (such as a geo-IP check or a cookie presence check) that evaluated to false and suppressed rendering entirely. The audit cannot resolve which of these is the cause without live browser console capture — that diagnostic gap is itself one of the eight findings.

The accessibility failures (invisible button text, undersized touch target, unlabeled footer button) are not independent design oversights. They are artifacts of a consent component that was built, partially styled, and then never validated in a rendered state — because it never rendered. A contrast ratio of 1.00:1 on the accept button is only possible if the button text and background were assigned the same color value, which would be caught immediately in any visual QA pass. The fact that it was not caught is consistent with a component that has never been seen working. The root cause is therefore not just a rendering bug — it is a consent component that was deployed without end-to-end validation.

---

## 3. Each Finding

### 3.1 Consent Banner Not Rendered Despite Infrastructure Present in DOM
**Finding ID:** `privacy-consent-banner-absent` | **Severity:** Medium | **Legal Liability:** Yes

**What's broken:** The consent banner HTML exists — buttons, classes, and a full Google Consent Mode default-denied initialization are all present in the DOM — but the banner never appears on screen. The audit measured `banner_rendered: False` and `cmp_detected: None` despite finding `consent_elements_in_dom` containing both `#consent-accept` and `#consent-decline`. The hidden interactive elements log confirms both buttons are present but hidden by an unknown method.

**Why it matters:** Under GDPR, processing personal data requires a lawful basis. For analytics and tracking, that basis is typically explicit consent. A consent mechanism that exists in code but never presents itself to users does not satisfy the requirement for freely given, specific, informed, and unambiguous consent — because the user was never given the opportunity to consent at all. The CCPA similarly requires that users be informed of data collection and given a meaningful opt-out path. A banner that never renders provides neither. The practical risk is regulatory exposure: if a supervisory authority audited this site and found that a consent UI existed in the codebase but was never shown to users, the defense that "the infrastructure was there" would not be persuasive.

**The fix:** Debug the rendering condition. The banner must be visible by default — rendered as static HTML with inline styles — so that no JavaScript failure, CSS load delay, or conditional gate can suppress it. JS should enhance the banner (handling button clicks, persisting decisions, firing Consent Mode updates) but must not be required for the banner to appear.

---

### 3.2 Analytics Not Integrated With Consent State — Users Cannot Grant Meaningful Consent
**Finding ID:** `consent-banner-not-rendering` | **Severity:** Medium | **Legal Liability:** Yes

**What's broken:** Google Consent Mode is initialized with `wait_for_update: 500ms` and all storage types denied. The intent is correct: hold the denied state, wait for a user interaction, then update. But `consent_mode_changed: False` confirms that no update ever fires. Because the banner never renders, the user never clicks accept, and the Consent Mode state never transitions. The system is permanently frozen in its default-denied initialization.

**Why it matters:** This finding adds a data integrity dimension to the compliance problem. If analytics consent can never be granted — not because users declined, but because they were never asked — then the analytics data collected under the denied state may not reflect actual user intent. More practically, any consent-dependent measurement or reporting is permanently suppressed, which degrades the site's ability to measure the contact form conversion KPI accurately. The site is flying partially blind on its primary revenue metric.

**The fix:** Once the banner renders, wire the accept button's click handler to fire `gtag('consent', 'update', { analytics_storage: 'granted', ... })` and verify that `consent_mode_changed` transitions to `True` after interaction. The consent state change must propagate before any analytics events are processed.

---

### 3.3 Plausible Analytics Loads Before Consent Interaction
**Finding ID:** `privacy-2-pre-consent-plausible-fires` | **Severity:** Medium | **Legal Liability:** Yes

**What's broken:** The Plausible Analytics script (`plausible.io/js/pa-GNbSMJlnmKdl4_QO4sS4C.js`) is loaded as an unconditional async script in the page source and fires at 161ms — before any consent interaction is possible. The pre-consent cookie count is zero, which is consistent with Plausible's cookieless architecture, but script execution and data transmission to a third-party server can constitute processing of personal data (specifically, IP addresses and behavioral data) under GDPR regardless of whether cookies are set.

**Why it matters:** Plausible's cookieless design is a genuine privacy advantage and may support a legitimate interest or strictly necessary basis for pre-consent loading — but that legal basis must be documented, not assumed. The site currently has no documented basis. If the specific Plausible configuration in use includes custom event tracking or any form of user identification, the legitimate interest argument weakens further. The risk is not that Plausible is inherently non-compliant; it is that the site has not made a documented, defensible decision about why it loads before consent.

**The fix:** Either gate the Plausible script behind the consent accept interaction (cleanest from a compliance standpoint), or document in writing — in a privacy policy and in internal records — the specific legal basis under which Plausible is classified as strictly necessary or legitimate interest. If the legitimate interest route is chosen, a Legitimate Interest Assessment (LIA) should be completed and retained.

---

### 3.4 Privacy Policy Link at 17px Height — Critically Undersized in a Legally Significant Context
**Finding ID:** `mobile-privacy-policy-link-critically-undersized` | **Severity:** High | **Legal Liability:** Yes

**What's broken:** The privacy policy link within the consent banner measures 91×17px. The WCAG 2.5.8 minimum touch target is 48×48px. At 17px height, this link is 65% below the minimum height requirement — the worst touch target violation measured across the site. On a mobile viewport (the audit used an iPhone 14 Pro at 393×660px), a 17px-tall tap target requires precise stylus-level accuracy to activate reliably.

**Why it matters:** This is not just an accessibility failure — it is a failure in a legally significant context. GDPR's informed consent requirement means users must be able to access privacy information before making a consent decision. A privacy policy link that is practically untappable on mobile undermines that right in practice, even if it technically exists in the DOM. Users who cannot read the privacy policy cannot give informed consent. This finding directly degrades the contact form conversion KPI: a user who cannot access privacy terms before submitting personal data through the contact form has a rational reason to abandon.

**The fix:** Apply `min-height: 48px; min-width: 48px; display: inline-flex; align-items: center; padding-block: [calculated value]` to the privacy policy anchor within the consent banner component. Scope the fix to the consent banner component so it does not affect other anchor elements site-wide. This is a quick win once the banner is rendering.

---

### 3.5 Consent Banner Viewport Impact on Mobile
**Finding ID:** `ux-mobile-consent-banner-viewport-impact` | **Severity:** Medium | **Legal Liability:** No

**What's broken:** The consent banner contains at least 3 interactive elements (accept button, decline button, privacy policy link) on a 393×660px viewport. A banner of this complexity, if rendered as a full-width overlay or sticky footer, could consume 20–30% of the visible viewport height, pushing the page's primary heading and opening content below the fold on first load.

**Why it matters:** First impressions on mobile are formed within the visible viewport. If the consent banner occupies a significant portion of that space and the page's value proposition is pushed below the fold, visitors may bounce before engaging with the content — directly affecting the bounce rate KPI. This is a compounding effect: the banner is currently invisible, so this problem does not exist today, but it must be designed correctly when the banner is fixed so that solving the compliance problem does not introduce a UX problem.

**The fix:** Design the replacement banner with a compact single-row layout on viewports below 768px, capped at ≤40vh. Avoid scroll-lock. Ensure the banner does not obscure the page's primary heading on initial render. This is a design constraint to build into the new component, not a separate remediation effort.

---

### 3.6 Consent Banner Hidden Interactive Elements — Dismissal State Unverified
**Finding ID:** `ghost-2-consent-banner-hidden-interactive` | **Severity:** Low | **Legal Liability:** No

**What's broken:** The audit confirmed that consent buttons exist in the DOM but could not verify their initial visibility state from static analysis alone. The concern is specifically about post-dismissal state: if the banner is hidden after a user accepts or declines, it must be hidden via `display: none` (which removes it from the accessibility tree) rather than `visibility: hidden` or `opacity: 0` (which leave it announced by screen readers as phantom interactive elements).

**Why it matters:** Screen reader users navigating the page after dismissing the consent banner should not encounter ghost buttons that appear interactive but serve no function. This is a lower-severity issue but contributes to the overall accessibility posture, which has WCAG compliance implications. The `hidden_interactive_detected: False` result is moderately confident but not definitive given that a full computed-style scan of all 154 DOM elements was not available.

**The fix:** In the replacement consent banner component, implement dismissal via `display: none` on the banner container element, not via opacity or visibility transitions alone. If a CSS transition is desired for visual polish, apply the transition first and then set `display: none` after the transition completes via a `transitionend` event listener.

---

### 3.7 Footer Button With No Accessible Name
**Finding ID:** `interactive-footer-button-purpose-unclear` | **Severity:** Medium | **Legal Liability:** Yes

**What's broken:** A button element exists in the footer at xpath `/html/body/footer[1]/div[2]/div[2]/button[1]` with class `inline-flex items-center` but no visible text content and no `aria-label` in the audit data. This button is distinct from the `#consent-accept` and `#consent-decline` elements. Based on its position and the consent infrastructure context, it is likely a consent re-trigger ("Cookie Settings") button, but this cannot be confirmed from the available data.

**Why it matters:** WCAG 4.1.2 requires that all interactive elements have an accessible name. A button with no name is announced by screen readers as simply "button" — its purpose is completely opaque. If this is a consent re-trigger, it is the mechanism by which users who previously declined can revisit their decision — a legally relevant function under GDPR's right to withdraw consent. An unlabeled button in that role fails both accessibility and compliance requirements simultaneously. The WCAG violation creates legal liability independent of the consent question.

**The fix:** If the button is a consent re-trigger, add `aria-label="Cookie settings"` and a visible label (even a small text label alongside the icon). If the button is orphaned code with no active function, remove it from the DOM entirely. Dead interactive elements create confusion for all users and inflate the interactive element count for assistive technology users navigating by element type.

---

### 3.8 JS Runtime Console Errors Unverifiable — Consent Failure May Be Silent JS Error
**Finding ID:** `prescan-escalation-console-errors` | **Severity:** Medium | **Legal Liability:** No

**What's broken:** The audit detected 7 inline scripts on the page, including the consent banner logic, but no live browser console capture was available. This means a JavaScript runtime error in the consent initialization code — the most likely cause of the banner's failure to render — cannot be confirmed or ruled out from the audit data alone. The performance signals are healthy (TBT: 1ms, INP: 24ms, longest task: 51ms), which suggests the JS is not crashing the main thread, but a silent error in the consent-specific code path would not necessarily surface in performance metrics.

**Why it matters:** If the banner's non-rendering is caused by a JS runtime error, the fix is a targeted code correction. If it is caused by a CSS hiding condition or a conditional gate, the fix is different. Without console capture, the engineering team risks spending time on the wrong diagnosis. This finding is a diagnostic prerequisite, not a standalone remediation — it must be resolved first to inform the correct fix path for findings 3.1 and 3.2.

**The fix:** Open DevTools in a browser, load the site, and capture the Console output on initial page load before any interaction. Search specifically for errors referencing `#consent-accept`, `#consent-decline`, or any consent-related function names. Set a breakpoint at the top of the consent initialization script and step through execution to identify where the show logic fails. Document the exact error and call stack before beginning remediation.

---

## 4. The Unified Fix Strategy

This cluster has a clear dependency chain. The console error diagnostic must come first because it determines the correct fix path for everything else. Once the root cause of the rendering failure is identified, the consent banner can be rebuilt as a self-contained, defensively-rendered component — and that single component rebuild resolves six of the eight findings simultaneously.

**Recommended execution order:**

**Step 1 — Diagnose (30 minutes, prerequisite for everything else)**
Capture live browser console output on page load. Identify whether the banner's non-rendering is caused by a JS runtime error, a CSS hide condition, or a conditional gate. This is not optional — it determines whether Step 2 is a bug fix or a component rebuild.

**Step 2 — Rebuild the consent banner component (primary effort, resolves findings 3.1, 3.2, 3.5, 3.6, 3.7)**
Replace the existing custom consent implementation with a new `ConsentBanner.astro` component that: renders as visible static HTML with inline styles (no JS required for display); fires `gtag('consent', 'update', ...)` on accept/decline; persists the decision to localStorage; caps height at ≤40vh on mobile; dismisses via `display: none`; and includes a functional, labeled footer re-trigger button. Remove all existing `#consent-accept`, `#consent-decline`, and related markup from layout files to eliminate orphaned event listeners.

**Step 3 — Fix the accept button contrast and privacy policy touch target (quick wins, within Step 2)**
These are CSS corrections that should be built into the new component during Step 2, not treated as separate tickets. The accept button needs a foreground color with ≥4.5:1 contrast against its background. The privacy policy link needs `min-height: 48px` with appropriate padding.

**Step 4 — Document or gate Plausible (compliance decision, parallel to Step 2)**
This requires a business decision, not just a code change. Either gate the Plausible script behind the consent accept interaction (one additional line in the consent update handler), or complete and document a Legitimate Interest Assessment for pre-consent Plausible loading. This decision should be made before the new banner ships so the implementation reflects the chosen legal basis.

**Step 5 — Verify Consent Mode propagation (validation, after Step 2)**
After the new banner is deployed, verify in a live browser session that clicking accept transitions `consent_mode_changed` to `True` and that `analytics_storage` updates from `denied` to `granted`. This is a 10-minute validation step that confirms the entire chain is working end-to-end.

**Quick wins vs. larger efforts:**
- The console diagnostic (Step 1) and the CSS fixes within the new component (Step 3) are quick wins once the component rebuild is underway.
- The component rebuild itself (Step 2) is a medium effort — it is a focused, well-scoped piece of work on a lean codebase (29KB total JS, ~150 DOM elements, single layout file), but it requires careful removal of the existing implementation to avoid orphaned code.
- The Plausible legal basis decision (Step 4) is not a technical effort — it is a compliance decision that may require legal counsel input.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| `privacy-consent-banner-absent` | Consent banner not rendered despite infrastructure present | Medium | Medium | **Shared** — resolved by banner rebuild |
| `consent-banner-not-rendering` | Analytics not integrated with consent state | Medium | Medium | **Shared** — resolved by banner rebuild + GCM wiring |
| `privacy-2-pre-consent-plausible-fires` | Plausible loads before consent interaction | Medium | Medium | **Shared** — resolved by consent gate or LIA documentation |
| `mobile-privacy-policy-link-critically-undersized` | Privacy policy link at 17px height | High | Quick Win | **Shared** — CSS fix within banner rebuild |
| `ux-mobile-consent-banner-viewport-impact` | Consent banner viewport impact on mobile | Medium | Medium | **Shared** — design constraint within banner rebuild |
| `ghost-2-consent-banner-hidden-interactive` | Hidden interactive elements — dismissal state unverified | Low | Quick Win | **Shared** — `display: none` pattern within banner rebuild |
| `interactive-footer-button-purpose-unclear` | Footer button with no accessible name | Medium | Quick Win | **Shared** — aria-label added within banner rebuild |
| `prescan-escalation-console-errors` | JS runtime errors unverifiable | Medium | Quick Win | **Unique** — diagnostic prerequisite; must be completed before rebuild begins |
