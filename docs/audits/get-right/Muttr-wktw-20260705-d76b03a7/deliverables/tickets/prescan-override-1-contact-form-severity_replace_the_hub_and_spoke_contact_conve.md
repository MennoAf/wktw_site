---
finding_id: "prescan-override-1-contact-form-severity"
title: "Prescan Review: No Contact Form — Severity Contextually Appropriate"
severity: "high"
root_cause_cluster: "Conversion Path Architecture — No On-Page Forms, No Inline CTAs, No Trust Signals"
why_this_matters: "Users who read the full page content and reach the bottom have the highest intent."
fix_summary: "Replace the hub-and-spoke /contact/ conversion model with a distributed inline conversion architecture."
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["conv-contact-cta-path-missing", "conv-ux-001", "mobile-mailto-not-tel-friendly", "no-click-to-call-mobile-contact-friction", "ux-conversion-01", "ux-conversion-cta-clarity-competing-actions", "ux-conversion-no-form-on-page"]
---

# Prescan Review: No Contact Form — Severity Contextually Appropriate

**Finding:** Prescan Review: No Contact Form — Severity Contextually Appropriate  
**Severity:** High  
**Why this matters:** Users who read the full page content and reach the bottom have the highest intent.  
**Root cause:** Conversion Path Architecture — No On-Page Forms, No Inline CTAs, No Trust Signals  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Replace the hub-and-spoke /contact/ conversion model with a distributed inline conversion architecture.  

> **Evidence Basis:** Confirmed

---

## Also resolves (7)

One fix closes the findings below — they were folded here as the same remediation:

- `conv-contact-cta-path-missing` (Medium) — Add a primary above-the-fold CTA on the homepage that creates a direct, frictionless conversion path to the contact form. This is a template-level architectural fix: the homepage must actively route users toward the client's stated primary KPI (contact_form submission) rather than passively existing as a brand landing page. Three coordinated changes are required: (1) a hero-section CTA button linking to the contact page or a contact anchor, (2) a persistent 'Contact' link in the sticky navigation, and (3) an inline contextual prompt in the value proposition section. All three must be implemented together — any single element in isolation is insufficient because users scan pages non-linearly and may enter the viewport at different scroll depths.
- `conv-ux-001` (Medium) — Add a conversion scaffold to the article template: an end-of-article inline contact form, a sticky sidebar/bottom-bar CTA, and a structured 'next step' prompt — all rendered server-side in the template layout so every article page inherits the conversion pathway without per-article editorial effort. The fix is a template-level structural change, not a content change.
- `mobile-mailto-not-tel-friendly` (Low) — Email contact link present but no tel: link for mobile users who prefer calling
- `no-click-to-call-mobile-contact-friction` (Medium) — Add a persistent, accessible tel: link contact affordance to the base template so that mobile users have a frictionless, single-tap path to initiate a call. This is a template-level fix that propagates to every page inheriting the base layout. The implementation has three layers: (1) a tel: link in the primary navigation/header for all viewports, (2) a mobile-only sticky call-to-action bar that persists as the user scrolls, and (3) a structured data telephone property on the Organization schema so search engines surface the number in rich results and Google's mobile SERP call button. All three layers are complementary — the header link serves desktop and mobile users who are already engaged, the sticky bar captures high-intent mobile users mid-scroll who have not yet committed to contacting, and the schema layer captures users who have not yet landed on the site.
- `ux-conversion-01` (Medium) — Primary CTA 'Let's talk' positioned below fold — requires scroll commitment on mobile
- `ux-conversion-cta-clarity-competing-actions` (Medium) — Primary CTA competes with navigation links and lacks urgency or value proposition reinforcement
- `ux-conversion-no-form-on-page` (High) — No contact form on page — conversion requires full navigation to /contact/

## Impact

- **Revenue:** Users who read the full page content and reach the bottom have the highest intent. Without a visible CTA or form at that point, they must scroll back up to find the nav CTA or use the mailto: link (which bypasses tracking). This friction directly reduces contact_form conversions.
- **Conversion Rate:** Every additional click/scroll step between intent formation and form submission reduces conversion probability. The current architecture requires: read content → scroll to top → find nav CTA → click → load /contact/ → fill form — a multi-step journey that could be shortened to: read content → fill inline form.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Reviewing prescan-2-8: The finding correctly identifies that 0 forms exist on this page while contact_form is a client KPI.. The severity of 'high' is appropriate.

**Measured evidence:**
- Prescan Ref: prescan-2-8
- Resolution: confirmed_appropriate_severity
- Forms On Page: 0
- Mailto Present: True
- Nav Cta Present: True
- Nav Cta Destination: /contact/
- Bottom Of Page Cta: not detected in DOM structure
- Recommendation: Add inline contact form or prominent CTA section at bottom of page content

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
Replace the hub-and-spoke /contact/ conversion model with a distributed inline conversion architecture. Implement a reusable Astro ContactCTA component containing a native HTML form (Netlify Forms), a trust signal slot, and a mailto: fallback that is analytics-instrumented. Inject this component at the terminal section of every high-intent page template (service pages, /proof/, About, article pages). Retire the bare mailto: link as a primary CTA.

### How
1. Create `src/components/ContactCTA.astro` — a self-contained section component accepting props: `heading`, `subheading`, `trustSignal` (optional slot), `formId` (unique per page type for Netlify Forms disambiguation), and `variant` ('inline' | 'modal-trigger'). Default variant is 'inline'.
2. Mark the form with `data-netlify='true'` and `name` equal to the `formId` prop. Add a hidden `<input type='hidden' name='form-name' value={formId} />` — Netlify's static parser requires this to register the form at build time. Add a hidden `<input type='hidden' name='page_source' value={Astro.url.pathname} />` to capture attribution in every submission without relying on referrer headers.
3. Add a honeypot field (`<input name='bot-field' class='cta-form__honeypot' aria-hidden='true' tabindex='-1' autocomplete='off' />`) and configure `data-netlify-honeypot='bot-field'` on the form element for spam filtering without a third-party service.
4. Wire client-side form submission via `fetch` in a `<script>` block scoped to the component. On submit: set `isSubmitting = true`, disable the submit button, POST with `application/x-www-form-urlencoded` encoding (Netlify Forms requirement), handle success by replacing the form with a confirmation message, handle failure by showing an inline error and re-enabling the button. Use try-finally to guarantee `isSubmitting` is reset on any code path.
5. Replace the bare `mailto:` link with an instrumented anchor: add `data-cta='mailto-fallback'` and fire a `gtag` / `dataLayer` event on click so mailto: conversions become visible in analytics. Wrap the gtag call in a null guard.
6. In each high-intent layout/page file, import and place `<ContactCTA>` as the final section before `</main>`. Pass a unique `formId` per template type (e.g., `formId='service-page-cta'`, `formId='proof-page-cta'`, `formId='about-page-cta'`, `formId='article-page-cta'`) so Netlify's dashboard separates submissions by origin.
7. For article pages, also add a mid-content `<ContactCTA variant='inline' heading='Recognise these failure patterns?' />` after the second H2 — this intercepts intent at the moment of topical recognition, not only at scroll-end.
8. Add `<link rel='preload' as='fetch' href='/api/form-success' crossorigin />` only if a custom success redirect is used; otherwise omit — Netlify handles the POST response natively.
9. Validate the Netlify Forms registration by running `netlify build` locally and confirming each unique `name` value appears in the Netlify dashboard under Forms before deploying to production.
10. Add a `robots` meta or `X-Robots-Tag` noindex to the Netlify-generated `/success` redirect page if one is used, to prevent it from being indexed as a standalone page.

### Code examples
```
// src/components/ContactCTA.astro
---
import type { HTMLAttributes } from 'astro/types';

// SITE-SPECIFIC: adjust these defaults per brand
const SUBMIT_BUTTON_LABEL = 'Send message';
const SUBMITTING_LABEL    = 'Sending…';
const SUCCESS_HEADING     = 'Message received.';
const SUCCESS_BODY        = 'We typically respond within one business day.';
const ERROR_MESSAGE       = 'Something went wrong — please try again or email us directly.';

// SITE-SPECIFIC: update to the verified contact email
const CONTACT_EMAIL = 'jon@weknowthewhy.com';

interface Props {
  heading?:     string;
  subheading?:  string;
  formId:       string;   // unique per page type — required for Netlify Forms disambiguation
  variant?:     'inline'; // extend to 'modal-trigger' when modal infrastructure exists
}

const {
  heading    = 'Ready to talk?',
  subheading = 'Describe your situation and we will respond within one business day.',
  formId,
  variant    = 'inline',
} = Astro.props;
---

<section
  class="contact-cta"
  aria-labelledby={`cta-heading-${formId}`}
  data-cta-variant={variant}
>
  <div class="contact-cta__inner">
    <h2 id={`cta-heading-${formId}`} class="contact-cta__heading">{heading}</h2>
    {subheading && <p class="contact-cta__subheading">{subheading}</p>}

    <!-- Trust signal slot — pass <Fragment slot="trust"> from parent -->
    <slot name="trust" />

    <form
      id={`form-${formId}`}
      class="contact-cta__form"
      name={formId}
      method="POST"
      action="/"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      novalidate
    >
      <!-- Required by Netlify's static parser to register the form at build time -->
      <input type="hidden" name="form-name" value={formId} />

      <!-- Attribution: captures originating page path in every submission -->
      <input type="hidden" name="page_source" value={Astro.url.pathname} />

      <!-- Honeypot: hidden from real users, filled by bots -->
      <input
        name="bot-field"
        class="contact-cta__honeypot"
        aria-hidden="true"
        tabindex="-1"
        autocomplete="off"
      />

      <div class="contact-cta__field">
        <label for={`name-${formId}`} class="contact-cta__label">Your name</label>
        <input
          type="text"
          id={`name-${formId}`}
          name="name"
          class="contact-cta__input"
          autocomplete="name"
          required
          aria-required="true"
        />
      </div>

      <div class="contact-cta__field">
        <label for={`email-${formId}`} class="contact-cta__label">Work email</label>
        <input
          type="email"
          id={`email-${formId}`}
          name="email"
          class="contact-cta__input"
          autocomplete="email"
          required
          aria-required="true"
        />
      </div>

      <div class="contact-cta__field">
        <label for={`message-${formId}`} class="contact-cta__label">What are you working on?</label>
        <textarea
          id={`message-${formId}`}
          name="message"
          class="contact-cta__textarea"
          rows="4"
          required
          aria-required="true"
        ></textarea>
      </div>

      <div
        id={`form-error-${formId}`}
        class="contact-cta__error"
        role="alert"
        aria-live="polite"
        hidden
      ></div>

      <button
        type="submit"
        class="contact-cta__submit"
        data-label-default={SUBMIT_BUTTON_LABEL}
        data-label-submitting={SUBMITTING_LABEL}
      >
        {SUBMIT_BUTTON_LABEL}
      </button>
    </form>

    <!-- Instrumented mailto: fallback — analytics-visible, not a primary CTA -->
    <p class="contact-cta__fallback">
      Prefer email?
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        class="contact-cta__mailto"
        data-cta="mailto-fallback"
        data-form-id={formId}
      >
        {CONTACT_EMAIL}
      </a>
    </p>
  </div>
</section>

<script>
  // NAMED CONSTANTS — no magic numbers
  const DEBOUNCE_SUBMIT_MS = 300;  // prevents accidental double-tap on mobile
  const LOCK_TIMEOUT_MS    = 8000; // max time to hold isSubmitting lock before auto-release

  function initContactForm(formEl: HTMLFormElement): void {
    const formId       = formEl.id.replace('form-', '');
    const submitBtn    = formEl.querySelector<HTMLButtonElement>('.contact-cta__submit');
    const errorBox     = document.getElementById(`form-error-${formId}`);
    const section      = formEl.closest<HTMLElement>('.contact-cta');

    if (!submitBtn || !errorBox || !section) return;

    const defaultLabel     = submitBtn.dataset.labelDefault     ?? 'Send message';
    const submittingLabel  = submitBtn.dataset.labelSubmitting  ?? 'Sending…';

    let isSubmitting = false;
    let lockTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // Guarantee lock release — prevents permanent disabled state on unexpected errors
    function releaseLock(): void {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = defaultLabel;
      if (lockTimeoutId !== null) {
        clearTimeout(lockTimeoutId);
        lockTimeoutId = null;
      }
    }

    function acquireLock(): void {
      isSubmitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = submittingLabel;
      // Safety timeout: auto-release lock if response never arrives
      lockTimeoutId = setTimeout(releaseLock, LOCK_TIMEOUT_MS);
    }

    function showError(message: string): void {
      errorBox.textContent = message;
      errorBox.removeAttribute('hidden');
    }

    function hideError(): void {
      errorBox.textContent = '';
      errorBox.setAttribute('hidden', '');
    }

    function showSuccess(): void {
      // Replace form with confirmation — no redirect, no page reload
      const successEl = document.createElement('div');
      successEl.className = 'contact-cta__success';
      successEl.setAttribute('role', 'status');
      successEl.setAttribute('aria-live', 'polite');
      successEl.innerHTML = `
        <p class="contact-cta__success-heading">Message received.</p>
        <p class="contact-cta__success-body">We typically respond within one business day.</p>
      `;
      formEl.replaceWith(successEl);
    }

    formEl.addEventListener('submit', (event: Event) => {
      event.preventDefault();

      // Precondition: not already submitting
      if (isSubmitting) return;

      // Precondition: native validation passes
      if (!formEl.checkValidity()) {
        formEl.reportValidity();
        return;
      }

      hideError();
      acquireLock();

      const body = new URLSearchParams(
        new FormData(formEl) as unknown as Record<string, string>
      ).toString();

      // Netlify Forms requires application/x-www-form-urlencoded
      fetch('/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          showSuccess();
          // Fire analytics event — null-guarded
          if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
            (window as any).gtag('event', 'form_submit', {
              event_category: 'contact',
              event_label:    formId,
            });
          }
          if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
            (window as any).dataLayer.push({
              event:   'contact_form_submit',
              form_id: formId,
            });
          }
        })
        .catch(() => {
          showError(
            'Something went wrong — please try again or email us directly.'
          );
        })
        .finally(() => {
          // try-finally equivalent in promise chain — always release lock
          releaseLock();
        });
    });

    // Instrument mailto: fallback clicks — makes mailto: conversions analytics-visible
    const mailtoLink = section.querySelector<HTMLAnchorElement>('[data-cta="mailto-fallback"]');
    if (mailtoLink) {
      mailtoLink.addEventListener('click', () => {
        // Null-guard: gtag may not be loaded (ad blockers, consent not given)
        if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'mailto_click', {
            event_category: 'contact',
            event_label:    mailtoLink.dataset.formId ?? 'unknown',
          });
        }
        if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
          (window as any).dataLayer.push({
            event:   'mailto_click',
            form_id: mailtoLink.dataset.formId ?? 'unknown',
          });
        }
      });
    }
  }

  // Init all forms on the page — supports multiple ContactCTA instances per page
  document.querySelectorAll<HTMLFormElement>('.contact-cta__form').forEach(initContactForm);
</script>

<style>
  .contact-cta {
    /* SITE-SPECIFIC: adjust spacing to match design system */
    padding-block: 4rem;
    background-color: var(--color-surface-alt, #f8f8f8);
  }

  .contact-cta__inner {
    max-width: 640px;
    margin-inline: auto;
    padding-inline: 1.5rem;
  }

  .contact-cta__heading {
    font-size: clamp(1.5rem, 3vw, 2rem);
    margin-block-end: 0.5rem;
  }

  .contact-cta__subheading {
    margin-block-end: 1.5rem;
    color: var(--color-text-muted, #555);
  }

  .contact-cta__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .contact-cta__field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .contact-cta__label {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .contact-cta__input,
  .contact-cta__textarea {
    /* SITE-SPECIFIC: match design system border/radius tokens */
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border, #ccc);
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  /* Visible focus indicator — WCAG 2.4.7 */
  .contact-cta__input:focus-visible,
  .contact-cta__textarea:focus-visible {
    outline: 2px solid var(--color-focus, #005fcc);
    outline-offset: 2px;
  }

  .contact-cta__textarea {
    resize: vertical;
    min-height: 100px;
  }

  .contact-cta__submit {
    /* SITE-SPECIFIC: match primary button design token */
    padding: 0.75rem 1.5rem;
    background-color: var(--color-primary, #1a1a1a);
    color: var(--color-on-primary, #fff);
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    align-self: flex-start;
    /* Minimum 48x48px touch target — WCAG 2.5.8 */
    min-height: 48px;
    min-width: 48px;
  }

  .contact-cta__submit:focus-visible {
    outline: 2px solid var(--color-focus, #005fcc);
    outline-offset: 2px;
  }

  .contact-cta__submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .contact-cta__error {
    color: var(--color-error, #c0392b);
    font-size: 0.875rem;
    padding: 0.5rem;
    border: 1px solid var(--color-error, #c0392b);
    border-radius: 4px;
    background-color: var(--color-error-bg, #fdf0ef);
  }

  .contact-cta__success {
    padding: 1.5rem;
    background-color: var(--color-success-bg, #edfaf1);
    border: 1px solid var(--color-success, #27ae60);
    border-radius: 4px;
  }

  .contact-cta__success-heading {
    font-weight: 700;
    margin-block-end: 0.25rem;
  }

  .contact-cta__fallback {
    margin-block-start: 1rem;
    font-size: 0.875rem;
    color: var(--color-text-muted, #555);
  }

  /* Honeypot: visually hidden AND removed from tab order */
  .contact-cta__honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    /* No animations defined — safe by default */
  }
</style>
// Usage in a service page — src/pages/services/platform-technical-audit.astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ContactCTA from '../../components/ContactCTA.astro';
---

<BaseLayout title="Platform Technical Audit">
  <!-- ... page content ... -->

  <ContactCTA
    formId="service-page-cta"
    heading="Seen enough? Let's audit your platform."
    subheading="Describe your stack and the symptoms you're seeing. We'll tell you if we can help."
  >
    <!-- Trust signal injected via named slot -->
    <Fragment slot="trust">
      <blockquote class="cta-trust">
        <p>"The audit identified three revenue-blocking issues we had missed for two years."</p>
        <cite>— Client, B2B SaaS</cite>
      </blockquote>
    </Fragment>
  </ContactCTA>
</BaseLayout>
// Usage in /proof/ page — src/pages/proof.astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ContactCTA from '../components/ContactCTA.astro';
---

<BaseLayout title="Proof">
  <!-- ... proof/case study content ... -->

  <ContactCTA
    formId="proof-page-cta"
    heading="This could be your result."
    subheading="Every engagement starts with a conversation about what's not working."
  />
</BaseLayout>
// Usage in article pages — src/layouts/ArticleLayout.astro
// Mid-content CTA after second H2 requires author-side MDX component injection.
// For Astro content collections with Markdown, inject at layout level after the slot.
---
import ContactCTA from '../components/ContactCTA.astro';

const { headings } = Astro.props; // available from content collection entry
---

<article>
  <slot />
</article>

<!-- Terminal CTA: intercepts intent at scroll-end -->
<ContactCTA
  formId="article-page-cta"
  heading="Recognise these failure patterns in your own site?"
  subheading="We audit Astro, Next.js, and CMS-based sites. Tell us what you're working with."
/>
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
