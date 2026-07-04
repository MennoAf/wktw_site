---
finding_id: "conv-ux-001"
title: "Add a structured conversion terminus block to the About page template — a primary CTA (discovery call or contact), a secondary directional link (services or case studies), and an optional lightweight inline contact form — so that high-intent visitors who finish reading the company narrative and team bios are given a clear, low-friction next step rather than a dead end requiring self-navigation."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "The About page currently terminates with no navigational exit path toward conversion."
fix_summary: "Add a structured conversion terminus block to the About page template — a primary CTA (discovery call or contact), a secondary directional link (services or case studies), and an optional lightweight…"
confidence_tier: "reviewer_identified"
---

# Add a structured conversion terminus block to the About page template — a primary CTA (discovery call or contact), a secondary directional link (services or case studies), and an optional lightweight inline contact form — so that high-intent visitors who finish reading the company narrative and team bios are given a clear, low-friction next step rather than a dead end requiring self-navigation.

**Finding:** Add a structured conversion terminus block to the About page template — a primary CTA (discovery call or contact), a secondary directional link (services or case studies), and an optional lightweight inline contact form — so that high-intent visitors who finish reading the company narrative and team bios are given a clear, low-friction next step rather than a dead end requiring self-navigation.  
**Severity:** Medium  
**Why this matters:** The About page currently terminates with no navigational exit path toward conversion.  
**Root cause:** Isolated issue  
**Fix:** Add a structured conversion terminus block to the About page template — a primary CTA (discovery call or contact), a secondary directional link (services or case studies), and an optional lightweight…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Bounce Rate:** The About page currently terminates with no navigational exit path toward conversion. Visitors who finish reading and are not yet committed enough to manually locate the contact page will exit the site entirely — registering as a bounce. Adding a primary CTA and secondary directional link gives these visitors a frictionless next step without requiring self-navigation. The mechanism is direct: reducing the number of steps between intent and action reduces the probability of abandonment at that step.
- **Contact Form Submissions:** The inline modal form reduces the conversion path from three steps (read About → navigate to Contact → fill form) to two steps (read About → fill form in modal). Each eliminated navigation step removes a decision point where a mid-confidence visitor can abandon. The mechanism is step-count reduction, not persuasion — the visitor's intent is already present; the current template simply provides no outlet for it.
- **About Page Exit Rate:** Visitors who click the secondary CTA ('See our work') will navigate to the services or case studies page rather than exiting. This converts a terminal exit into a continued session, extending engagement and giving the site a second opportunity to convert the visitor.
- **Seo Internal Linking:** Adding outbound internal links from the About page to Services and Contact pages improves internal link equity distribution. Pages with no outbound internal links are isolated nodes in the site graph — adding links improves crawlability and distributes PageRank to conversion-critical pages.
- **Core Web Vitals Impact:** The CTA block is static HTML with no render-blocking dependencies. It will not negatively affect LCP, CLS, or INP. The modal is hidden by default (display:none via [hidden] attribute) and imposes no layout cost until triggered. The form submission uses async fetch with an AbortController timeout, ensuring the main thread is not blocked during submission.
- **Accessibility And Legal:** The modal implementation includes role='dialog', aria-modal='true', focus trapping, ESC-to-close, and focus restoration — meeting WCAG 2.1 AA requirements for modal dialogs. Form inputs have programmatically associated labels and aria-describedby error linkage. Touch targets meet the 48×48px minimum per WCAG 2.5.8. Missing these would constitute WCAG violations with documented legal exposure under ADA and the European Accessibility Act.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/about

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
Add a structured conversion terminus block to the About page template — a primary CTA (discovery call or contact), a secondary directional link (services or case studies), and an optional lightweight inline contact form — so that high-intent visitors who finish reading the company narrative and team bios are given a clear, low-friction next step rather than a dead end requiring self-navigation.

### How
1. AUDIT CURRENT TEMPLATE STRUCTURE: Identify the last semantic element in the About page template (typically the closing </section> of the team bios or values block). This is the insertion point for the CTA terminus block. Confirm the template file path (e.g., templates/about.html, pages/about.jsx, or the CMS page builder layout for /about).
2. DEFINE CONVERSION INTENT TIERS: The About page serves two visitor cohorts — (a) high-intent visitors ready to initiate contact, and (b) mid-funnel visitors still evaluating. The terminus block must serve both without forcing either into the wrong path. Primary CTA targets cohort (a); secondary link targets cohort (b).
3. IMPLEMENT THE CTA TERMINUS BLOCK: Insert the HTML/component block immediately after the final content section and before the page footer. Use a visually distinct background (e.g., a light brand-tinted surface) to signal a transition from content to action. See code_examples[0] for the full semantic HTML implementation.
4. IMPLEMENT THE OPTIONAL INLINE CONTACT FORM (modal variant): For sites where a full contact page exists but adds navigation friction, a modal-triggered inline form reduces the step count from 'read bio → navigate to contact → fill form' to 'read bio → click → fill form in place'. See code_examples[1] for the modal trigger pattern and code_examples[2] for the accessible modal implementation.
5. WIRE UP FORM SUBMISSION WITH ASYNC SAFETY: The inline form must use a serialized submission guard (isSubmitting flag + try-finally reset) to prevent duplicate POST requests on double-click or slow network. See code_examples[3] for the submission handler.
6. APPLY WCAG-COMPLIANT FOCUS MANAGEMENT FOR MODAL: On modal open, move focus to the modal container or first focusable element. On modal close (ESC key or close button), return focus to the trigger button. Trap Tab/Shift+Tab within the open modal. See code_examples[4] for the focus trap implementation.
7. CONFIGURE ANALYTICS EVENT TRACKING: Fire distinct events for (a) primary CTA click, (b) secondary link click, (c) modal open, (d) form submission attempt, (e) form submission success, (f) form submission error. This creates a funnel you can measure in GA4 or equivalent. See code_examples[5] for the event dispatch pattern.
8. VALIDATE ACCESSIBILITY: Run the completed block through axe-core or equivalent. Verify: single visible h2 heading in the block (does not skip from page h1), all interactive elements reachable by keyboard, focus indicator visible on CTA buttons and form inputs, form inputs have programmatically associated labels, error messages linked via aria-describedby, modal has role='dialog' + aria-modal='true' + aria-labelledby pointing to modal heading.
9. TEST ACROSS BREAKPOINTS: Verify the block renders correctly at 320px (single-column), 768px (tablet), and 1280px+ (desktop). The primary CTA button must meet 48×48px minimum touch target at all breakpoints. Confirm the secondary link has adequate spacing from the primary CTA to prevent mis-tap.
10. DEPLOY AND MONITOR: After deployment, monitor the new analytics events for 2–4 weeks to establish baseline click-through rates on the primary CTA and secondary link. Use this data to A/B test CTA copy variants (e.g., 'Book a discovery call' vs. 'Start a conversation' vs. 'Get in touch').

### Code examples
```
<!-- code_examples[0]: CTA Terminus Block — Semantic HTML -->
<!-- SITE-SPECIFIC ASSUMPTION: Adjust href values, CTA copy, and color tokens to match brand. -->
<!-- SITE-SPECIFIC ASSUMPTION: Replace '#contact-modal' trigger with direct href if no modal is used. -->

<section
  class="about-cta-terminus"
  aria-labelledby="about-cta-heading"
>
  <div class="about-cta-terminus__inner">
    <h2 id="about-cta-heading" class="about-cta-terminus__heading">
      Ready to work together?
    </h2>
    <p class="about-cta-terminus__subtext">
      We take on a small number of engagements each quarter.
      If you're evaluating partners, let's talk.
    </p>

    <div class="about-cta-terminus__actions">
      <!-- Primary CTA: highest-intent action -->
      <button
        type="button"
        class="btn btn--primary about-cta-terminus__primary"
        data-modal-trigger="contact-modal"
        data-analytics-event="about_cta_primary_click"
        aria-haspopup="dialog"
      >
        Book a discovery call
      </button>

      <!-- Secondary CTA: mid-funnel visitors not yet ready to contact -->
      <!-- SITE-SPECIFIC ASSUMPTION: Update href to actual services or case studies URL. -->
      <a
        href="/services"
        class="btn btn--secondary about-cta-terminus__secondary"
        data-analytics-event="about_cta_secondary_click"
      >
        See our work
      </a>
    </div>
  </div>
</section>

<style>
  /* SITE-SPECIFIC ASSUMPTION: Replace CSS custom property values with brand tokens. */
  .about-cta-terminus {
    background-color: var(--color-surface-subtle, #f5f5f5);
    padding: 4rem 1.5rem;
    text-align: center;
  }

  .about-cta-terminus__inner {
    max-width: 640px;
    margin-inline: auto;
  }

  .about-cta-terminus__heading {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 700;
    margin-block-end: 0.75rem;
    color: var(--color-text-primary, #111);
  }

  .about-cta-terminus__subtext {
    font-size: 1.0625rem;
    color: var(--color-text-secondary, #555);
    margin-block-end: 2rem;
    line-height: 1.6;
  }

  .about-cta-terminus__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    align-items: center;
  }

  /* Minimum 48x48px touch target per WCAG 2.5.8 */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    min-width: 48px;
    padding: 0.75rem 1.75rem;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    border: 2px solid transparent;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }

  /* SITE-SPECIFIC ASSUMPTION: Verify contrast ratio meets 4.5:1 for your brand colors. */
  .btn--primary {
    background-color: var(--color-brand-primary, #1a56db);
    color: var(--color-on-brand, #ffffff);
    border-color: var(--color-brand-primary, #1a56db);
  }

  .btn--primary:hover,
  .btn--primary:focus-visible {
    background-color: var(--color-brand-primary-hover, #1648c0);
    border-color: var(--color-brand-primary-hover, #1648c0);
  }

  .btn--secondary {
    background-color: transparent;
    color: var(--color-brand-primary, #1a56db);
    border-color: var(--color-brand-primary, #1a56db);
  }

  .btn--secondary:hover,
  .btn--secondary:focus-visible {
    background-color: var(--color-brand-primary, #1a56db);
    color: var(--color-on-brand, #ffffff);
  }

  /* Visible focus indicator — never suppress without replacement */
  .btn:focus-visible {
    outline: 3px solid var(--color-focus-ring, #f59e0b);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition: none;
    }
  }
</style>
<!-- code_examples[1]: Modal Trigger Initialization -->
<!-- Attach to DOMContentLoaded; no jQuery dependency. -->

<script>
(function initAboutCtaModalTrigger() {
  'use strict';

  // SITE-SPECIFIC ASSUMPTION: data-modal-trigger value must match the modal element's id.
  var TRIGGER_ATTR = 'data-modal-trigger';
  var MODAL_ID = 'contact-modal'; // SITE-SPECIFIC ASSUMPTION: update if modal id differs.

  function openModal(modalId, triggerEl) {
    var modal = document.getElementById(modalId);
    if (!modal) {
      // Graceful fallback: navigate to contact page if modal element is missing.
      // SITE-SPECIFIC ASSUMPTION: Update fallback href to actual contact page URL.
      window.location.href = '/contact';
      return;
    }
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.setAttribute('data-modal-open', 'true');
    // Store trigger reference for focus restoration on close.
    modal._triggerEl = triggerEl;
    // Move focus into modal (focus trap handles Tab from here).
    var firstFocusable = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }
    dispatchAnalyticsEvent('about_contact_modal_open');
  }

  function handleTriggerClick(event) {
    var trigger = event.currentTarget;
    var modalId = trigger.getAttribute(TRIGGER_ATTR);
    if (modalId) {
      openModal(modalId, trigger);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var triggers = document.querySelectorAll('[' + TRIGGER_ATTR + ']');
    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', handleTriggerClick);
    });
  });
}());
</script>
<!-- code_examples[2]: Accessible Contact Modal HTML -->
<!-- SITE-SPECIFIC ASSUMPTION: Adjust form action endpoint, field set, and copy. -->

<div
  id="contact-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="contact-modal-heading"
  hidden
  aria-hidden="true"
  class="contact-modal"
>
  <div class="contact-modal__backdrop" data-modal-close="contact-modal"></div>

  <div class="contact-modal__panel">
    <button
      type="button"
      class="contact-modal__close"
      data-modal-close="contact-modal"
      aria-label="Close contact form"
    >
      <!-- Inline SVG preferred over icon font for reliability -->
      <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20">
        <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <h2 id="contact-modal-heading" class="contact-modal__heading">
      Start a conversation
    </h2>

    <form
      id="about-contact-form"
      class="contact-modal__form"
      novalidate
      data-form="about-contact"
    >
      <!-- SITE-SPECIFIC ASSUMPTION: Replace action endpoint with actual form handler URL or API route. -->

      <div class="form-field">
        <label for="contact-name" class="form-field__label">
          Your name <span aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          class="form-field__input"
          autocomplete="name"
          required
          aria-required="true"
          aria-describedby="contact-name-error"
        />
        <span
          id="contact-name-error"
          class="form-field__error"
          role="alert"
          aria-live="polite"
          hidden
        ></span>
      </div>

      <div class="form-field">
        <label for="contact-email" class="form-field__label">
          Work email <span aria-hidden="true">*</span>
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          class="form-field__input"
          autocomplete="email"
          required
          aria-required="true"
          aria-describedby="contact-email-error"
        />
        <span
          id="contact-email-error"
          class="form-field__error"
          role="alert"
          aria-live="polite"
          hidden
        ></span>
      </div>

      <div class="form-field">
        <label for="contact-message" class="form-field__label">
          What are you working on?
        </label>
        <textarea
          id="contact-message"
          name="message"
          class="form-field__input form-field__input--textarea"
          rows="4"
          aria-describedby="contact-message-hint"
        ></textarea>
        <span id="contact-message-hint" class="form-field__hint">
          Optional — helps us prepare for the call.
        </span>
      </div>

      <div
        id="contact-form-status"
        class="contact-modal__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        hidden
      ></div>

      <button
        type="submit"
        class="btn btn--primary contact-modal__submit"
        data-analytics-event="about_contact_form_submit_attempt"
      >
        Send message
      </button>
    </form>
  </div>
</div>

<style>
  .contact-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .contact-modal[hidden] {
    display: none;
  }

  .contact-modal__backdrop {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.55);
    cursor: pointer;
  }

  .contact-modal__panel {
    position: relative;
    background: var(--color-surface-base, #ffffff);
    border-radius: 8px;
    padding: 2rem;
    width: 100%;
    max-width: 480px; /* SITE-SPECIFIC ASSUMPTION: Adjust max-width to match design system. */
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .contact-modal__close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    min-height: 48px;
    min-width: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary, #555);
    border-radius: 4px;
  }

  .contact-modal__close:focus-visible {
    outline: 3px solid var(--color-focus-ring, #f59e0b);
    outline-offset: 2px;
  }

  .contact-modal__heading {
    font-size: 1.375rem;
    font-weight: 700;
    margin-block-end: 1.5rem;
    padding-inline-end: 3rem; /* Prevent overlap with close button */
    color: var(--color-text-primary, #111);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-block-end: 1.25rem;
  }

  .form-field__label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-primary, #111);
  }

  /* SITE-SPECIFIC ASSUMPTION: Scope selector to .contact-modal to avoid global input override. */
  .contact-modal .form-field__input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1.5px solid var(--color-border, #d1d5db);
    border-radius: 4px;
    font-size: 1rem;
    color: var(--color-text-primary, #111);
    background-color: var(--color-surface-base, #ffffff);
    box-sizing: border-box;
    min-height: 48px;
  }

  .contact-modal .form-field__input:focus-visible {
    outline: 3px solid var(--color-focus-ring, #f59e0b);
    outline-offset: 1px;
    border-color: var(--color-brand-primary, #1a56db);
  }

  .contact-modal .form-field__input[aria-invalid='true'] {
    border-color: var(--color-error, #dc2626);
  }

  .form-field__input--textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-field__error {
    font-size: 0.875rem;
    color: var(--color-error, #dc2626);
    font-weight: 500;
  }

  .form-field__hint {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #555);
  }

  .contact-modal__status {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-size: 0.9375rem;
    margin-block-end: 1rem;
  }

  .contact-modal__status[data-state='success'] {
    background-color: var(--color-success-surface, #f0fdf4);
    color: var(--color-success-text, #166534);
    border: 1px solid var(--color-success-border, #bbf7d0);
  }

  .contact-modal__status[data-state='error'] {
    background-color: var(--color-error-surface, #fef2f2);
    color: var(--color-error-text, #991b1b);
    border: 1px solid var(--color-error-border, #fecaca);
  }

  .contact-modal__submit {
    width: 100%;
    margin-block-start: 0.5rem;
  }

  /* Scroll lock when modal is open */
  body[data-modal-open='true'] {
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .contact-modal__panel {
      animation: none;
    }
  }
</style>
// code_examples[3]: Form Submission Handler with Async Safety
// No external library dependency — vanilla JS.
// SITE-SPECIFIC ASSUMPTION: Replace FORM_ENDPOINT with actual API route or form service URL.
// SITE-SPECIFIC ASSUMPTION: Replace ANALYTICS_MEASUREMENT_ID references with actual config.

(function initContactFormHandler() {
  'use strict';

  // Named constants — no magic numbers.
  var FORM_ENDPOINT = '/api/contact'; // SITE-SPECIFIC ASSUMPTION: update to actual endpoint.
  var SUBMISSION_TIMEOUT_MS = 10000; // 10s — reasonable timeout for a contact form POST.
  var DEBOUNCE_DELAY_MS = 300;       // Prevent accidental double-submit on slow tap.

  var form = document.getElementById('about-contact-form');
  if (!form) return; // Guard: form may not exist on non-About pages.

  var statusEl = document.getElementById('contact-form-status');
  var submitBtn = form.querySelector('[type="submit"]');

  // Submission lock — prevents duplicate POST on double-click or slow network.
  var isSubmitting = false;
  var abortController = null;

  function setFieldError(inputId, errorId, message) {
    var input = document.getElementById(inputId);
    var errorEl = document.getElementById(errorId);
    if (!input || !errorEl) return;
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    errorEl.removeAttribute('hidden');
  }

  function clearFieldError(inputId, errorId) {
    var input = document.getElementById(inputId);
    var errorEl = document.getElementById(errorId);
    if (!input || !errorEl) return;
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
    errorEl.setAttribute('hidden', '');
  }

  function validateForm() {
    var valid = true;
    var nameInput = document.getElementById('contact-name');
    var emailInput = document.getElementById('contact-email');

    clearFieldError('contact-name', 'contact-name-error');
    clearFieldError('contact-email', 'contact-email-error');

    if (!nameInput || !nameInput.value.trim()) {
      setFieldError('contact-name', 'contact-name-error', 'Please enter your name.');
      valid = false;
    }

    if (!emailInput || !emailInput.value.trim()) {
      setFieldError('contact-email', 'contact-email-error', 'Please enter your work email.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
      setFieldError('contact-email', 'contact-email-error', 'Please enter a valid email address.');
      valid = false;
    }

    return valid;
  }

  function showStatus(state, message) {
    if (!statusEl) return;
    statusEl.setAttribute('data-state', state);
    statusEl.textContent = message;
    statusEl.removeAttribute('hidden');
  }

  function hideStatus() {
    if (!statusEl) return;
    statusEl.removeAttribute('data-state');
    statusEl.textContent = '';
    statusEl.setAttribute('hidden', '');
  }

  function setSubmitState(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Sending…' : 'Send message';
    submitBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Debounce guard — reject if already in flight.
    if (isSubmitting) return;

    hideStatus();

    if (!validateForm()) {
      // Focus first invalid field for keyboard/screen reader users.
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    isSubmitting = true;
    setSubmitState(true);
    dispatchAnalyticsEvent('about_contact_form_submit_attempt');

    // AbortController for timeout safety.
    abortController = new AbortController();
    var timeoutId = setTimeout(function () {
      if (abortController) abortController.abort();
    }, SUBMISSION_TIMEOUT_MS);

    try {
      var formData = new FormData(form);
      var payload = Object.fromEntries(formData.entries());

      var response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Server responded with status ' + response.status);
      }

      dispatchAnalyticsEvent('about_contact_form_submit_success');
      showStatus('success', 'Message sent — we'll be in touch within one business day.');
      form.reset();

    } catch (err) {
      clearTimeout(timeoutId);

      var isAborted = err && err.name === 'AbortError';
      var userMessage = isAborted
        ? 'The request timed out. Please try again or email us directly.'
        : 'Something went wrong. Please try again or email us directly.';

      dispatchAnalyticsEvent('about_contact_form_submit_error');
      showStatus('error', userMessage);

    } finally {
      // Lock MUST release in finally — prevents permanent lock on error.
      isSubmitting = false;
      abortController = null;
      setSubmitState(false);
    }
  }

  form.addEventListener('submit', handleSubmit);
}());
// code_examples[4]: Accessible Focus Trap + Modal Close Handler
// Handles: ESC key, backdrop click, close button, Tab/Shift+Tab containment.
// No external library dependency.

(function initModalFocusTrap() {
  'use strict';

  // SITE-SPECIFIC ASSUMPTION: Update MODAL_ID if modal element id differs.
  var MODAL_ID = 'contact-modal';
  var CLOSE_ATTR = 'data-modal-close';

  // Selectors for focusable elements within the modal.
  var FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(function (el) {
      return !el.closest('[hidden]') && getComputedStyle(el).display !== 'none';
    });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
    document.body.removeAttribute('data-modal-open');

    // Restore focus to the element that triggered the modal.
    if (modal._triggerEl && typeof modal._triggerEl.focus === 'function') {
      modal._triggerEl.focus();
    }
    modal._triggerEl = null;
  }

  function handleKeydown(event) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal || modal.hasAttribute('hidden')) return;

    // ESC closes modal.
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(modal);
      return;
    }

    // Tab / Shift+Tab: contain focus within modal.
    if (event.key === 'Tab') {
      var focusable = getFocusableElements(modal);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      var firstEl = focusable[0];
      var lastEl = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last.
        if (document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: if focus is on last element, wrap to first.
        if (document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    }
  }

  function handleCloseClick(event) {
    var target = event.target;
    // Walk up DOM to find a close trigger (handles SVG child clicks).
    var closeTrigger = target.closest('[' + CLOSE_ATTR + ']');
    if (!closeTrigger) return;

    var modalId = closeTrigger.getAttribute(CLOSE_ATTR);
    var modal = document.getElementById(modalId);
    closeModal(modal);
  }

  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleCloseClick);
}());
// code_examples[5]: Analytics Event Dispatcher
// Null-guards all third-party globals before access.
// Dispatches to GA4 (gtag) with a CustomEvent fallback for other listeners.
// SITE-SPECIFIC ASSUMPTION: Replace ANALYTICS_MEASUREMENT_ID with actual GA4 measurement ID.
// SITE-SPECIFIC ASSUMPTION: If using a different analytics platform, replace gtag calls.

var ANALYTICS_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // SITE-SPECIFIC ASSUMPTION: configure before deploy.

function dispatchAnalyticsEvent(eventName, eventParams) {
  var params = eventParams || {};

  // GA4 via gtag — null-guard required (gtag may not load in ad-blocked environments).
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, Object.assign({ send_to: ANALYTICS_MEASUREMENT_ID }, params));
    } catch (e) {
      // Silently fail — analytics must never break user-facing functionality.
    }
  }

  // CustomEvent fallback: allows GTM data layer listeners or other analytics
  // integrations to subscribe without coupling to gtag directly.
  if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
    try {
      var customEvent = new window.CustomEvent('analytics:event', {
        detail: Object.assign({ event: eventName }, params),
        bubbles: true
      });
      document.dispatchEvent(customEvent);
    } catch (e) {
      // Silently fail.
    }
  }
}

// Recommended event names for GA4 funnel tracking:
// 'about_cta_primary_click'       — Primary CTA button clicked
// 'about_cta_secondary_click'     — Secondary link clicked
// 'about_contact_modal_open'      — Modal opened
// 'about_contact_form_submit_attempt' — Form submit button clicked (pre-validation)
// 'about_contact_form_submit_success' — POST succeeded
// 'about_contact_form_submit_error'   — POST failed or timed out
```

## Risks
- CTA COPY MISMATCH WITH BRAND VOICE: 'Book a discovery call' may not match the consultancy's actual engagement model (e.g., they may not offer discovery calls, or may prefer 'Start a conversation'). Risk: CTA creates a false expectation that damages trust. Mitigation: Confirm CTA copy with the client before deployment. The code uses a named constant pattern — copy is isolated in the HTML template and requires no logic changes to update.
- FORM ENDPOINT NOT YET CONFIGURED: The fetch handler targets '/api/contact' as a placeholder. If no server-side handler exists at deployment time, all form submissions will return 404 or 500 errors. Risk: Broken form at launch damages credibility with high-intent visitors. Mitigation: Confirm endpoint availability before enabling the modal. As an interim, replace the fetch call with a Formspree or Netlify Forms endpoint — both are operational within minutes and require no server-side code.
- MODAL SCROLL LOCK ON iOS SAFARI: The body overflow:hidden scroll lock technique has known issues on iOS Safari where the page can still scroll behind the modal. Risk: Background content scrolls while modal is open, creating a disorienting UX. Mitigation: Add position:fixed to body when modal opens and restore scroll position on close. Alternatively, use the inert attribute on the page content behind the modal (supported in all modern browsers as of 2023).
- DUPLICATE FORM IF CONTACT PAGE ALREADY HAS A FORM: If /contact already has a form, the inline modal creates a second submission path with potentially different field sets or routing. Risk: Submissions from the modal may land in a different inbox or CRM pipeline than submissions from /contact, causing missed leads. Mitigation: Ensure both forms POST to the same endpoint and trigger the same CRM/notification workflow. Document both submission paths in the client's ops runbook.
- ANALYTICS EVENT NAMING CONFLICTS: If GTM or GA4 already has events named 'about_cta_primary_click' or similar, the new events may collide with existing triggers. Risk: Double-counting or trigger misfires in reporting. Mitigation: Audit existing GA4 event taxonomy before deployment. Prefix new events with a namespace if conflicts exist (e.g., 'about_v2_cta_primary_click').
- FOCUS TRAP BREAKING BROWSER AUTOFILL: Some browser autofill dropdowns (Chrome address suggestions) are rendered outside the modal DOM and may be dismissed by the focus trap's Tab interception. Risk: Users cannot use browser autofill for email field. Mitigation: This is a known browser limitation with modal focus traps. The impact is low for a short 2-field form. No mitigation required beyond documentation.
- CLS FROM MODAL INJECTION IF MODAL IS JS-RENDERED: If the modal HTML is injected into the DOM by JavaScript after page load (rather than present in the initial HTML as shown), it may cause a brief layout shift. Risk: CLS regression. Mitigation: Include the modal HTML in the server-rendered page source with the hidden attribute. The [hidden] attribute ensures it has no layout impact until triggered. Never inject the modal via innerHTML on click.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
