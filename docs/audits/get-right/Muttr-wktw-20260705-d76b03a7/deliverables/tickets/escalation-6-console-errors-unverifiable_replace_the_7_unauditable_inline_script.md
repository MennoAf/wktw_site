---
finding_id: "escalation-6-console-errors-unverifiable"
title: "JS runtime errors cannot be verified — form submission integrity at risk"
severity: "medium"
root_cause_cluster: "Contact Form Accessibility — Missing Labels and Unverified Error Handling"
why_this_matters: "Undetected JS errors in form validation could silently prevent contact form submissions."
fix_summary: "Replace the 7 unauditable inline scripts on /contact/ with a single, observable Astro component that: (1) captures and surfaces JS runtime errors to the user, (2) preserves form state on failure, (3)…"
confidence_tier: "unverified"
remediation_surface: "source_code"
---

# JS runtime errors cannot be verified — form submission integrity at risk

**Finding:** JS runtime errors cannot be verified — form submission integrity at risk  
**Severity:** Medium  
**Why this matters:** Undetected JS errors in form validation could silently prevent contact form submissions.  
**Root cause:** Contact Form Accessibility — Missing Labels and Unverified Error Handling  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Replace the 7 unauditable inline scripts on /contact/ with a single, observable Astro component that: (1) captures and surfaces JS runtime errors to the user, (2) preserves form state on failure, (3)…  

> **Evidence Basis:** Needs Verification

---

## Impact

- **Revenue:** Undetected JS errors in form validation could silently prevent contact form submissions.
- **Conversion Rate:** Negative if form JS is broken — contact_form KPI directly at risk.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_006`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Console output is not available in the scan data.. With 7 inline scripts and a form POSTing to /thanks (Netlify Forms pattern), any JS validation errors, unhandled promise rejections, or runtime exceptions would be invisible to this audit.

**Measured evidence:**
- Inline Scripts: 7
- External Scripts: 1
- Form Action: POST /thanks
- Inp Ms: 24
- Js Unused Percent: 15.3
- Js Dependency: low
- Console Data: not available
- Recommended Action: Headless browser test with console.error capture during form interaction

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
Replace the 7 unauditable inline scripts on /contact/ with a single, observable Astro component that: (1) captures and surfaces JS runtime errors to the user, (2) preserves form state on failure, (3) implements a serial async submission guard, (4) correctly identifies and hides the Netlify form-name field from the accessibility tree, and (5) fixes the confirmed h1→h3 heading skip and missing programmatic label. Add a Playwright smoke test that simulates submission and asserts no unhandledrejection events fire.

### How
1. AUDIT EXISTING INLINE SCRIPTS FIRST: Open /contact/ source, extract all 7 inline <script> blocks, and classify each as: (a) Netlify honeypot/form-name injection, (b) client-side validation, (c) analytics/pixel, (d) unknown. Discard any that duplicate Netlify's built-in behavior. This step determines which scripts survive into the new component.
2. REPLACE THE CONTACT PAGE with src/pages/contact.astro. Move all form markup into src/components/ContactForm.astro. The Astro component boundary enforces scoped styles and a single, auditable script block.
3. FIX HEADING HIERARCHY in the page layout: ensure the page has exactly one <h1> (the page title, e.g. 'Contact Us'), and any sub-headings use <h2>. Remove or demote any <h3> that currently appears before an <h2>.
4. FIX THE NETLIFY FORM-NAME FIELD: render <input type='hidden' name='form-name' value='contact' aria-hidden='true' tabindex='-1'> — the aria-hidden and tabindex='-1' remove it from the accessibility tree and tab order, resolving the WCAG 4.1.2 false-positive risk. Every other user-facing field must have an explicit <label for='fieldId'>.
5. IMPLEMENT THE SUBMISSION GUARD in the component's <script>: a single isSubmitting boolean flag wrapped in try-finally guarantees release on any throw. The flag is set before fetch() and cleared in finally. This prevents duplicate POSTs on double-click or slow network.
6. IMPLEMENT ERROR SURFACING: catch network errors, non-2xx Netlify responses, and validation failures. Write the error message into a live region (<div role='alert' aria-live='assertive'>) so screen readers announce it immediately. Never swallow exceptions silently.
7. IMPLEMENT FORM STATE PRESERVATION: on any failure path, read field values from the FormData object already constructed and write them back into the inputs via a restoreFormState() helper. This prevents data loss on network interruption or Netlify spam-filter rejection (which returns a 200 with a spam flag, not a 4xx — handle this explicitly).
8. INSTRUMENT RUNTIME ERRORS: add a window.addEventListener('unhandledrejection') and window.addEventListener('error') handler scoped to this page that writes to a visible debug banner in development (import.meta.env.DEV) and sends a structured log to a /api/client-error endpoint (or a Netlify Function) in production. This closes the observability gap without requiring Sentry.
9. ADD PLAYWRIGHT SMOKE TEST at tests/contact-form.spec.ts: navigate to /contact/, fill fields, submit, assert (a) no unhandledrejection events fired, (b) the success state or error state is visible, (c) no duplicate network requests were made. Run this in CI on every deploy via netlify.toml [build] command.
10. REMOVE ALL 7 ORIGINAL INLINE SCRIPTS from the contact page template after verifying each function is covered by the new component or confirmed unnecessary.

### Code examples
```
(No code example provided.)
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
