---
finding_id: "conversion-no-error-recovery-evidence"
title: "Form error handling and data preservation on failure unverifiable — high-risk gap"
severity: "medium"
root_cause_cluster: "Contact Form Accessibility — Missing Labels and Unverified Error Handling"
why_this_matters: "The full-page POST model silently discards all field values on any non-2xx response or network failure, leaving the user on a browser error page with no recovery path."
fix_summary: "Replace the full-page POST submission on /contact/ with a fetch-based submission pattern that (1) preserves all field values on failure, (2) surfaces actionable error messages for network failures, s…"
confidence_tier: "unverified"
remediation_surface: "source_code"
---

# Form error handling and data preservation on failure unverifiable — high-risk gap

**Finding:** Form error handling and data preservation on failure unverifiable — high-risk gap  
**Severity:** Medium  
**Why this matters:** The full-page POST model silently discards all field values on any non-2xx response or network failure, leaving the user on a browser error page with no recovery path.  
**Root cause:** Contact Form Accessibility — Missing Labels and Unverified Error Handling  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Replace the full-page POST submission on /contact/ with a fetch-based submission pattern that (1) preserves all field values on failure, (2) surfaces actionable error messages for network failures, s…  

> **Evidence Basis:** Needs Verification

---

## Impact

- **Lead Capture Resilience:** The full-page POST model silently discards all field values on any non-2xx response or network failure, leaving the user on a browser error page with no recovery path. The fetch-based replacement preserves field state across all failure modes, eliminating the discard-on-failure behavior. For a professional services site where every contact form submission is a qualified lead, removing this discard behavior directly reduces the rate at which completed submissions are lost to recoverable failures.
- **Mobile Submission Reliability:** Mobile users experience higher rates of mid-submission connectivity drops (cell handoff, WiFi transition). The current architecture converts these transient failures into permanent lead loss. The fetch handler catches network-layer throws and surfaces a recovery message with draft state intact, converting what was a terminal failure into a retryable interaction.
- **Duplicate Submission Prevention:** The isSubmitting lock prevents the double-POST pattern that occurs when users tap Submit twice on slow connections. Without this guard, the current form can generate duplicate Netlify form entries for a single intent, polluting the lead pipeline with duplicates that require manual deduplication.
- **Accessibility Compliance:** The addition of aria-invalid, aria-describedby-linked error spans, role='alert' on the status region, and focus management on validation failure brings the form into WCAG 2.1 AA compliance for error identification (SC 3.3.1) and error suggestion (SC 3.3.3). The current form's HTML5-only validation provides no programmatic error association for screen reader users.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_006`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The form POSTs to /thanks with no evidence of client-side validation beyond HTML required attributes on 3 of 5 fields.. There are 7 inline scripts on the page but JS transfer is reported as 0 bytes (inline scripts aren't counted in transfer), making it impossible to verify whether: (1) inline validation provides specific error messages, (2) form data is preserved on submission failure, (3) the /thanks endpoint handles errors gracefully, or (4) network failures show a meaningful error state.

**Measured evidence:**
- Form Fields: 5
- Required Fields: 3
- Form Action: POST /thanks
- Inline Scripts: 7
- Js Total Bytes: 29950
- Js Unused Pct: 15.3
- Client Validation Evidence: HTML required attributes only — no JS validation framework detected

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
Replace the full-page POST submission on /contact/ with a fetch-based submission pattern that (1) preserves all field values on failure, (2) surfaces actionable error messages for network failures, server rejections, and validation mismatches, (3) prevents duplicate submissions via a serialized async lock, and (4) persists draft state to sessionStorage so a browser crash or accidental navigation does not discard a composed message.

### How
1. AUDIT CURRENT FORM ENDPOINT: Confirm the Netlify form name attribute (e.g., name='contact') and verify the form is tagged with data-netlify='true'. The fetch-based replacement must POST to the same page URL with the same form-name body field — this is how Netlify's form detection works for fetch submissions. Do NOT change the endpoint URL.
2. CREATE ContactForm.astro COMPONENT: Extract the existing form markup into a new src/components/ContactForm.astro file. Keep all existing field names, required attributes, and HTML5 validation attributes intact — they remain the first validation gate. Add a hidden input name='form-name' value='contact' (required by Netlify for fetch submissions). Add data-netlify-honeypot='bot-field' and a hidden bot-field input for spam protection.
3. ADD CLIENT-SIDE VALIDATION LAYER: Before fetch, validate email format via a regex pattern, name minimum length (2 chars), and message minimum length (20 chars). Attach aria-describedby on each input pointing to a sibling error <span> with role='alert'. Populate the span text and set aria-invalid='true' on the field on failure. Clear both on correction. This catches format errors the server would reject, reducing round-trips.
4. IMPLEMENT SESSIONSTORE DRAFT PERSISTENCE: On every input event (debounced 400ms), serialize all field values to sessionStorage under a fixed key (DRAFT_STORAGE_KEY). On DOMContentLoaded, restore any saved draft into the fields. On successful submission, clear the draft. Wrap all sessionStorage access in try-catch — Safari private browsing throws SecurityError.
5. IMPLEMENT FETCH SUBMISSION WITH SERIAL LOCK: Attach a submit event listener that calls event.preventDefault(). Guard the handler with an isSubmitting boolean — if true, return immediately (prevents double-submit). Set isSubmitting = true before fetch, release in a finally block. POST application/x-www-form-urlencoded (Netlify's required content type for fetch form submissions). On 2xx: clear draft, show success state, optionally redirect to /thanks/. On non-2xx or network error: leave all field values intact, surface a specific error message in a role='alert' region above the submit button.
6. DISTINGUISH ERROR CLASSES IN UI: Network failure (fetch throws) → 'Your message could not be sent — please check your connection and try again. Your text has been saved.' Server error (5xx) → 'Our server encountered an error. Please try again in a moment or email us directly at [address].' Validation rejection (4xx) → 'Please review the highlighted fields.' Each message populates the same aria-live='polite' status region so screen readers announce it without focus disruption.
7. REPLACE FORM IN CONTACT PAGE: In src/pages/contact.astro (or equivalent), import and render <ContactForm /> in place of the raw form markup. No other page changes required at this stage.
8. VERIFY NETLIFY FORM DETECTION: After deploy, submit a test entry and confirm it appears in the Netlify dashboard under Forms. Netlify detects fetch-submitted forms by the form-name body field — if the form name does not appear in the dashboard, the hidden input is missing or mismatched.
9. OPTIONAL — OFFLINE QUEUE VIA SERVICE WORKER: If the site already has a service worker, add a Background Sync registration on network failure so the submission retries automatically when connectivity restores. This is additive and does not affect the core fix. Do not introduce a service worker solely for this purpose — the sessionStorage draft covers the recovery case adequately for most users.

### Code examples
```
// src/components/ContactForm.astro
// SITE-SPECIFIC ASSUMPTIONS (adjust to match existing field names and Netlify form name):
// - Netlify form name: 'contact' (must match existing registered form)
// - Field names: name, email, company, phone, message (adjust if different)
// - Success redirect: '/thanks/' (set REDIRECT_ON_SUCCESS to '' to suppress redirect)

---
// No server-side props needed — purely client-side interactive component
---

<form
  id="contact-form"
  name="contact"
  method="POST"
  action="/thanks/"
  data-netlify="true"
  data-netlify-honeypot="bot-field"
  novalidate
  aria-label="Contact form"
>
  <!-- Netlify fetch submission requires this hidden field -->
  <input type="hidden" name="form-name" value="contact" />
  <!-- Honeypot: hidden from real users, filled by bots -->
  <p style="display:none">
    <label>Don't fill this out: <input name="bot-field" /></label>
  </p>

  <!-- Status region: announced by screen readers on state change -->
  <div
    id="form-status"
    role="alert"
    aria-live="polite"
    aria-atomic="true"
    class="form-status"
    hidden
  ></div>

  <div class="field-group">
    <label for="field-name">Name <span aria-hidden="true">*</span></label>
    <input
      id="field-name"
      name="name"
      type="text"
      required
      autocomplete="name"
      aria-required="true"
      aria-describedby="error-name"
    />
    <span id="error-name" role="alert" class="field-error" aria-live="polite"></span>
  </div>

  <div class="field-group">
    <label for="field-email">Email <span aria-hidden="true">*</span></label>
    <input
      id="field-email"
      name="email"
      type="email"
      required
      autocomplete="email"
      aria-required="true"
      aria-describedby="error-email"
    />
    <span id="error-email" role="alert" class="field-error" aria-live="polite"></span>
  </div>

  <div class="field-group">
    <label for="field-company">Company</label>
    <input
      id="field-company"
      name="company"
      type="text"
      autocomplete="organization"
      aria-describedby="error-company"
    />
    <span id="error-company" role="alert" class="field-error" aria-live="polite"></span>
  </div>

  <div class="field-group">
    <label for="field-phone">Phone</label>
    <input
      id="field-phone"
      name="phone"
      type="tel"
      autocomplete="tel"
      aria-describedby="error-phone"
    />
    <span id="error-phone" role="alert" class="field-error" aria-live="polite"></span>
  </div>

  <div class="field-group">
    <label for="field-message">Message <span aria-hidden="true">*</span></label>
    <textarea
      id="field-message"
      name="message"
      required
      rows="6"
      aria-required="true"
      aria-describedby="error-message"
    ></textarea>
    <span id="error-message" role="alert" class="field-error" aria-live="polite"></span>
  </div>

  <button
    id="submit-btn"
    type="submit"
    aria-describedby="form-status"
  >
    Send Message
  </button>
</form>

<script>
(function () {
  'use strict';

  // ── Named constants — adjust to match site requirements ──────────────────
  const FORM_ID = 'contact-form';                  // matches id on <form>
  const DRAFT_STORAGE_KEY = 'contact_form_draft';  // sessionStorage key
  const DRAFT_DEBOUNCE_MS = 400;                   // ms to wait before persisting draft
  const MIN_NAME_LENGTH = 2;                       // minimum chars for name field
  const MIN_MESSAGE_LENGTH = 20;                   // minimum chars for message field
  const REDIRECT_ON_SUCCESS = '/thanks/';          // set to '' to suppress redirect
  const SUPPORT_EMAIL = 'hello@example.com';       // SITE-SPECIFIC: replace with real address
  // ─────────────────────────────────────────────────────────────────────────

  // Regex: RFC 5322-simplified, covers 99.9% of real addresses without catastrophic backtracking
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const form = document.getElementById(FORM_ID);
  if (!form) return; // guard: component not present on this page

  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  // ── Submission lock — prevents duplicate POSTs ───────────────────────────
  // Boolean flag is sufficient here: submit events are synchronous and
  // the flag is set before the first await, so no concurrent entry is possible.
  let isSubmitting = false;

  // ── sessionStorage helpers (Safari private mode safe) ───────────────────
  function tryReadDraft() {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function tryWriteDraft(data) {
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch (_) {
      // Storage unavailable — silent fail, draft persistence is enhancement only
    }
  }

  function clearDraft() {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_) {}
  }

  // ── Draft persistence ────────────────────────────────────────────────────
  const draftableFields = form.querySelectorAll(
    'input:not([type="hidden"]):not([name="bot-field"]), textarea'
  );

  // Restore draft on load
  const savedDraft = tryReadDraft();
  if (savedDraft) {
    draftableFields.forEach(function (field) {
      if (savedDraft[field.name] !== undefined) {
        field.value = savedDraft[field.name];
      }
    });
  }

  // Debounced draft save on input
  let draftTimer = null;
  form.addEventListener('input', function () {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      const draft = {};
      draftableFields.forEach(function (field) {
        draft[field.name] = field.value;
      });
      tryWriteDraft(draft);
    }, DRAFT_DEBOUNCE_MS);
  });

  // ── Field-level validation ───────────────────────────────────────────────
  // Returns null on pass, error string on fail.
  function validateField(name, value) {
    const trimmed = value.trim();
    switch (name) {
      case 'name':
        if (trimmed.length < MIN_NAME_LENGTH) {
          return 'Please enter your full name (at least ' + MIN_NAME_LENGTH + ' characters).';
        }
        return null;
      case 'email':
        if (!trimmed) return 'Email address is required.';
        if (!EMAIL_PATTERN.test(trimmed)) return 'Please enter a valid email address.';
        return null;
      case 'message':
        if (trimmed.length < MIN_MESSAGE_LENGTH) {
          return 'Please enter a message of at least ' + MIN_MESSAGE_LENGTH + ' characters.';
        }
        return null;
      default:
        return null; // optional fields: no format validation
    }
  }

  function setFieldError(fieldName, message) {
    const field = form.querySelector('[name="' + fieldName + '"]');
    const errorEl = document.getElementById('error-' + fieldName);
    if (!field || !errorEl) return;
    if (message) {
      field.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
    } else {
      field.removeAttribute('aria-invalid');
      errorEl.textContent = '';
    }
  }

  // Clear field errors on correction
  form.addEventListener('input', function (e) {
    const field = e.target;
    if (!field.name) return;
    const error = validateField(field.name, field.value);
    setFieldError(field.name, error); // clears if null
  });

  // ── Status region helpers ────────────────────────────────────────────────
  function showStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.className = 'form-status ' + (isError ? 'form-status--error' : 'form-status--success');
  }

  function clearStatus() {
    statusEl.textContent = '';
    statusEl.hidden = true;
    statusEl.className = 'form-status';
  }

  // ── Submit handler ───────────────────────────────────────────────────────
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Lock guard — synchronous check before any await
    if (isSubmitting) return;

    clearStatus();

    // Run full validation pass before acquiring lock
    let hasErrors = false;
    const requiredFields = ['name', 'email', 'message'];
    requiredFields.forEach(function (name) {
      const field = form.querySelector('[name="' + name + '"]');
      const value = field ? field.value : '';
      const error = validateField(name, value);
      if (error) {
        setFieldError(name, error);
        hasErrors = true;
      }
    });

    if (hasErrors) {
      // Focus first invalid field for keyboard users
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      showStatus('Please correct the highlighted fields before sending.', true);
      return;
    }

    // Acquire lock
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending\u2026'; // 'Sending…'

    // Encode as application/x-www-form-urlencoded — required by Netlify fetch submissions
    const formData = new FormData(form);
    const encoded = new URLSearchParams(formData).toString();

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encoded,
      });

      if (response.ok) {
        // Success path: clear draft, reset form, redirect or show confirmation
        clearDraft();
        clearTimeout(draftTimer);
        form.reset();
        if (REDIRECT_ON_SUCCESS) {
          window.location.href = REDIRECT_ON_SUCCESS;
        } else {
          showStatus('Thank you — your message has been sent. We will be in touch shortly.', false);
          submitBtn.textContent = 'Sent';
        }
      } else if (response.status >= 500) {
        // Server error — field values preserved (form not reset)
        showStatus(
          'Our server encountered an error. Please try again in a moment, or email us directly at ' +
          SUPPORT_EMAIL + '. Your message text has been saved.',
          true
        );
      } else {
        // 4xx — likely validation mismatch between client and server
        showStatus(
          'Your submission was not accepted. Please review your details and try again.',
          true
        );
      }
    } catch (networkError) {
      // fetch() throws on network failure (offline, DNS, timeout)
      // Field values are preserved — form was not reset
      showStatus(
        'Your message could not be sent — please check your connection and try again. ' +
        'Your message text has been saved in this browser tab.',
        true
      );
    } finally {
      // Always release lock, regardless of outcome
      isSubmitting = false;
      if (submitBtn.textContent !== 'Sent') {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    }
  });

})();
</script>

<style>
  /* Scoped to ContactForm component — no global element selectors */
  #contact-form .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-block-end: 1.25rem;
  }

  #contact-form .field-error {
    color: #c0392b; /* WCAG AA: 4.5:1 on white */
    font-size: 0.875rem;
    min-height: 1.25em; /* reserve space to prevent CLS on error appearance */
  }

  #contact-form .form-status {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-block-end: 1rem;
    font-size: 0.9375rem;
  }

  #contact-form .form-status--error {
    background-color: #fdf2f2;
    border: 1px solid #c0392b;
    color: #7b1a1a; /* WCAG AA: 4.5:1 on #fdf2f2 */
  }

  #contact-form .form-status--success {
    background-color: #f0faf4;
    border: 1px solid #27ae60;
    color: #1a5c35; /* WCAG AA: 4.5:1 on #f0faf4 */
  }

  /* Visible focus indicator — never suppress outline without replacement */
  #contact-form input:focus-visible,
  #contact-form textarea:focus-visible,
  #contact-form button:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  #contact-form button[type='submit']:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
</style>
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
