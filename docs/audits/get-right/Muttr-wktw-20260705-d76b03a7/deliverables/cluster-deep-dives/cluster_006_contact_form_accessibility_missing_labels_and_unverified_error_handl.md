# Cluster Deep Dive: Contact Form Accessibility — Missing Labels and Unverified Error Handling

**Cluster ID:** cluster_006  
**Architectural Pattern:** HTML Structure  
**Scope:** /contact/ page template (isolated, non-systemic)  
**Compliance Exposure:** WCAG 2.1 SC 1.3.1, SC 4.1.2  
**Client KPIs Affected:** contact_form, conversion_rate, bounce_rate

---

## 1. The Big Picture

The /contact/ page is the single conversion mechanism for this entire site. Every page, every article, every navigation path terminates here. That architectural reality — documented in the broader audit — means that any friction on this page does not merely inconvenience a subset of users; it degrades the only conversion action the site offers. This cluster documents a set of issues concentrated entirely within that one page's form template, and they compound in ways that are worth understanding together rather than as isolated tickets.

Here is what a user with a screen reader experiences today: they navigate to /contact/, move through the form, and encounter an input that announces itself as nothing more than "edit text." The field has no programmatic label — no `<label>` element, no `aria-label`, no association of any kind. The measured evidence confirms one missing label across five form fields. Whether that field is a Netlify housekeeping input or a genuine user-facing field is unverified, but the accessibility tree does not distinguish intent — it only reads what the markup provides. Separately, a screen reader user navigating the page by heading structure will jump from an `h1` directly to an `h3`, skipping a level entirely. This is not a visual problem; it is a structural one that breaks the document outline that assistive technology uses to help users understand page organization before they engage with content.

Layered on top of these confirmed issues is a gap the audit cannot close from static analysis alone: what happens when the form fails? The form POSTs to `/thanks` using standard HTML submission with no detected JavaScript validation framework — only HTML `required` attributes on 3 of the 5 fields. Seven inline scripts exist on the page, but their content is unauditable from the scan data. If any of those scripts contain a silent runtime error, or if the form clears all field values on a failed submission, a user who has composed a detailed message loses everything and receives no actionable guidance. On a five-field contact form that is the site's only conversion path, that failure mode is not a minor UX inconvenience — it is a direct suppressor of the contact_form KPI.

---

## 2. The Root Cause

These findings share a single origin: the contact form template was built to function correctly under ideal conditions — a sighted user, a successful submission, a standard browser — without being hardened against the conditions that fall outside that path. The Netlify form integration introduces a hidden input (`form-name`) that, if not explicitly typed as `type="hidden"`, defaults to a visible, focusable, unlabeled text input. That is the likely source of the missing label. The heading skip from `h1` to `h3` reflects a visual design decision (matching a specific type size) that was implemented semantically rather than through a CSS utility class. The unverifiable error handling reflects the absence of a client-side submission layer — the form relies entirely on the browser's native POST behavior, which provides no mechanism for preserving field data or surfacing structured error messages on failure.

None of these are signs of poor engineering — the broader audit characterizes the Astro + Netlify stack as architecturally excellent, with sub-200ms TTFB, 24ms INP, and zero layout shift. These are gaps in the contact page template specifically, and they are fixable at the template level without touching the platform or the broader design system. The fix surface is narrow and well-defined.

---

## 3. Each Finding

### 3.1 One Form Field Missing a Programmatic Label
**Finding IDs:** a11y-1-form-missing-label, form-1-missing-label

**What's broken:** The contact form has five fields — two text inputs, one email input, one additional text input, and a textarea. One of those inputs has no programmatic label association. The audit's DOM analysis locates it at XPath `//*[@id='main-content']/section[1]/div[1]/div[1]/form[1]/input[1]` — the very first input in the form. A screen reader user tabbing into the form will hear the browser's generic fallback announcement for that field, typically something like "edit text," with no indication of what information is being requested.

**The evidence:** The measured data is unambiguous: `missing_labels: 1`, `total_form_fields: 5`. The field's position as the first input in the form, combined with the Netlify form integration pattern, strongly suggests this is the `form-name` hidden field rendered without a `type="hidden"` attribute — causing it to default to a visible, focusable text input. This is unverified and must be confirmed in the source template before any fix is applied.

**Why it matters:** This is a WCAG 2.1 SC 1.3.1 (Info and Relationships) and SC 4.1.2 (Name, Role, Value) violation. Both criteria are Level A — the baseline conformance level. For a user relying on a screen reader or voice control software, an unlabeled field is functionally invisible: voice control commands like "click [field name]" fail because there is no name to target. The field cannot be reliably identified, filled, or skipped with intention. On a page where the form is the only conversion action, an accessibility barrier at the form level directly suppresses the contact_form KPI for any user in that population.

**The legal exposure:** WCAG 2.1 Level A conformance is the threshold referenced by accessibility regulations in multiple jurisdictions, including the ADA (as interpreted through DOJ guidance and case law in the United States) and the European Accessibility Act. A missing label on an interactive form field is one of the most commonly cited violations in accessibility litigation and regulatory enforcement actions. The legal mechanism is straightforward: a user with a disability encounters a barrier that prevents or impairs their ability to use the service, and the site operator is the responsible party. This finding carries confirmed legal liability.

**The fix:** If the unlabeled input is the Netlify `form-name` field, set `type="hidden"` on it. An input with `type="hidden"` is removed from the accessibility tree, the tab order, and visual rendering by the HTML specification — no `aria-hidden` required, no additional attributes needed. If the field is a genuine user-facing input, add a `<label for="[input-id]">` with descriptive text. Confirm which case applies before writing a single line of code.

---

### 3.2 Missing Name, Role, and Value on Interactive Components
**Finding ID:** det-wcag-missing-name-role-value-https-weknowthewhy-com-contact

**What's broken:** Two UI components across the site lack accessible names. One is on /contact/ (the unlabeled form input described above). The second is on the homepage — likely an icon-only navigation element such as a menu toggle or SVG-wrapped anchor that contains no visible text and no `aria-label`. Assistive technology cannot convey the purpose of either component to the user.

**The evidence:** The deterministic detector confirmed `2 UI component(s) lack an accessible name` across pages `/contact/` and `/`. The regulation reference is WCAG 2.1 SC 4.1.2 (Level A).

**Why it matters:** The homepage finding is outside this cluster's primary scope but shares the same WCAG criterion and the same legal liability. An icon-only interactive element with no accessible name is unusable for screen reader users and unreachable by voice control. The /contact/ instance directly affects the contact_form KPI; the homepage instance affects every user who relies on assistive technology to navigate the site at all.

**The fix:** For /contact/, the fix is the same as 3.1 above — resolve the `form-name` input. For the homepage element, identify the exact component (likely a navigation toggle in the shared layout), and add an `aria-label` or visually-hidden text node that describes the action. Both fixes are scoped to their respective Astro components.

---

### 3.3 Form Error Handling and Data Preservation Unverifiable
**Finding ID:** conversion-no-error-recovery-evidence

**What's broken:** The form submits via a full-page POST to `/thanks`. The audit detected no JavaScript validation framework — only HTML `required` attributes on 3 of the 5 fields. Seven inline scripts exist on the page, but because inline script content is not captured in JS transfer size metrics (`js_total_bytes: 29,950` counts external scripts only), their behavior cannot be verified from the scan data. The critical unknown is what happens when submission fails: does the form preserve the user's input, or does it clear all fields and leave the user with a blank form and no error message?

**The evidence:** `form_action: POST /thanks`, `client_validation_evidence: HTML required attributes only — no JS validation framework detected`, `inline_scripts: 7`, `js_total_bytes: 29,950`, `js_unused_pct: 15.3`. The low total JS footprint and the absence of any detected validation library make it likely that the inline scripts are minimal — but "likely minimal" is not the same as "verified safe."

**Why it matters:** A form that clears on submission failure forces the user to reconstruct their message from memory. For a five-field form that includes a textarea (the most effort-intensive field), this is a meaningful friction point. The mechanism is direct: submission failure → data loss → user abandonment → contact_form KPI degraded. This is not a compliance issue, but it is the highest-conversion-impact risk in the cluster.

**The fix:** Replace the native POST submission with a `fetch`-based submission handler that intercepts the form submit event, preserves all field values in `sessionStorage` (wrapped in a `try-catch` for Safari private browsing compatibility, where `sessionStorage` throws), and surfaces actionable error messages for network failures, server rejections, and validation mismatches. On success, clear the stored draft and redirect to `/thanks`. This also enables a serial async submission guard to prevent duplicate submissions.

---

### 3.4 Heading Hierarchy Skips from h1 to h3
**Finding ID:** det-wcag-improper-content-structure-https-weknowthewhy-com-contact

**What's broken:** The /contact/ page document outline jumps directly from an `h1` to an `h3`, skipping the `h2` level entirely. This is a structural violation, not a visual one — the heading levels communicate document hierarchy to assistive technology, and a skipped level breaks the expected outline.

**The evidence:** The deterministic detector confirmed: `heading level jumps from h1 to h3 (skips a level)` on `https://weknowthewhy.com/contact`. Regulation reference: WCAG 2.1 SC 1.3.1 (Level A).

**Why it matters:** Screen reader users frequently navigate pages by heading structure before reading content — it is the equivalent of scanning a visual page layout. A skipped heading level signals either a structural error or a missing section, and it disrupts the user's ability to build an accurate mental model of the page. This carries confirmed legal liability under WCAG 2.1 SC 1.3.1. The fix is also the lowest-effort item in this cluster.

**The fix:** Change the `h3` that follows the `h1` to an `h2`. If the visual size of that heading needs to match the former `h3` styling, apply a scoped CSS utility class to control the visual size independently of the semantic level. Never re-introduce a heading skip to achieve a visual target.

---

### 3.5 JS Runtime Errors Cannot Be Verified
**Finding ID:** escalation-6-console-errors-unverifiable

**What's broken:** Console output was not captured during the audit scan. With 7 inline scripts on the /contact/ page and a form submission as the critical conversion action, any silent JavaScript runtime errors — unhandled promise rejections, validation logic failures, or event listener exceptions — would be invisible to this audit and invisible to the user if they produce no visible feedback.

**The evidence:** `console_data: not available`, `inline_scripts: 7`, `inp_ms: 24`. The 24ms INP is a strong signal that no severe JS blocking is occurring, and the low overall JS footprint (`js_total_bytes: 29,950`, `js_unused_pct: 15.3`) reduces the probability of complex failure modes. However, the form submission path — the one user interaction that must succeed — has not been exercised with console monitoring.

**Why it matters:** A silent JS error in form validation could prevent submission without providing the user any feedback. The user sees a form that appears functional but does not submit. The mechanism: silent error → no submission → no user feedback → user abandonment → contact_form KPI degraded. The risk is moderated by the low JS complexity, but it cannot be dismissed without a verified test.

**The fix:** Run a headless browser test (Playwright is the recommended tool given the Astro + Netlify stack) that simulates a complete form interaction — fill all fields, submit, assert no `console.error` or `unhandledrejection` events fire, and assert the redirect to `/thanks` completes. This test should be added to the deployment pipeline so it runs on every build. The broader fix — consolidating the 7 inline scripts into a single observable Astro component — makes future audits of this kind straightforward.

---

## 4. The Unified Fix Strategy

All six findings in this cluster are resolved by a single coordinated intervention on the /contact/ page template. Because the scope is isolated to one Astro component (or a small set of components composing that page), the fixes can be sequenced efficiently without risk of regression elsewhere on the site.

### Recommended Sequence

**Step 1 — Verify before fixing (prerequisite, ~30 minutes)**  
Open the deployed HTML of /contact/ and locate the first `<input>` in the form. Confirm whether it has `type="hidden"` already, `type="text"`, or no `type` attribute. This single verification determines whether the label fix is a one-attribute change or requires adding a full `<label>` element. Do not write any fix code until this is confirmed.

**Step 2 — Fix the heading hierarchy (quick win, ~15 minutes)**  
Change `h3` → `h2` on /contact/. Apply a CSS utility class if the visual size needs to be preserved. This resolves finding `det-wcag-improper-content-structure` immediately and closes a confirmed WCAG violation with zero risk of side effects.

**Step 3 — Fix the unlabeled input (quick win, ~15 minutes, contingent on Step 1)**  
If the field is the Netlify `form-name` input: add `type="hidden"`. If it is a user-facing field: add a `<label>`. This resolves findings `a11y-1-form-missing-label`, `form-1-missing-label`, and the /contact/ instance of `det-wcag-missing-name-role-value`. Three findings close with one attribute change.

**Step 4 — Fix the homepage accessible name (quick win, ~20 minutes)**  
Identify the unnamed interactive element on / (likely a navigation toggle) and add `aria-label` or visually-hidden text. This closes the second instance in `det-wcag-missing-name-role-value`. Scoped to the shared layout component.

**Step 5 — Add client-side submission handling and data preservation (medium effort)**  
Extract the form into a dedicated `ContactForm.astro` component. Implement a `fetch`-based submission handler with `sessionStorage` draft preservation, structured error messaging with `aria-describedby` field associations, and a serial async submission guard. Audit and consolidate the 7 inline scripts during this step — classify each, discard duplicates of Netlify's built-in behavior, and fold survivors into the component. This resolves `conversion-no-error-recovery-evidence` and `escalation-6-console-errors-unverifiable`.

**Step 6 — Add a Playwright smoke test (medium effort, pairs with Step 5)**  
Write a test that fills all five fields, submits, and asserts: no console errors, no unhandled rejections, redirect to `/thanks` completes, `sessionStorage` draft is cleared on success. Add to the CI/CD pipeline.

### What This Achieves

Steps 2, 3, and 4 are independent quick wins that close four confirmed WCAG violations and eliminate the legal liability associated with them. They can ship in a single PR in under an hour of engineering time. Steps 5 and 6 address the conversion risk and the observability gap — they require more care but are scoped entirely to one component file and one test file. The entire cluster is resolved without touching the platform, the design system, or any other page.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| a11y-1-form-missing-label | Form field missing programmatic label | High | Quick win | Shared — same fix as form-1-missing-label and /contact/ instance of det-wcag-missing-name-role-value |
| det-wcag-missing-name-role-value | Missing name/role/value (2 components) | Medium | Quick win | Shared — /contact/ instance resolved with label fix; / instance is a unique fix in the layout component |
| form-1-missing-label | Contact form missing label — accessibility and conversion barrier | Medium | Quick win | Shared — same root cause and fix as a11y-1-form-missing-label |
| conversion-no-error-recovery-evidence | Form error handling and data preservation unverifiable | Medium | Medium | Shared — resolved together with escalation-6 via ContactForm.astro refactor |
| det-wcag-improper-content-structure | Heading hierarchy skips h1 → h3 | Low | Quick win | Unique — standalone one-element change on /contact/ |
| escalation-6-console-errors-unverifiable | JS runtime errors unverifiable — form integrity at risk | Medium | Medium | Shared — resolved together with conversion-no-error-recovery-evidence via ContactForm.astro refactor and Playwright test |
