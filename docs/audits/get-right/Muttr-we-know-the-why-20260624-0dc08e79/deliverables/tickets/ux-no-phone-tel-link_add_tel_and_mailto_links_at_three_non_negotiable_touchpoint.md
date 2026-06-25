---
finding_id: "ux-no-phone-tel-link"
title: "No tel: or mailto: links detected — mobile users cannot tap-to-call or tap-to-email"
severity: "medium"
root_cause_cluster: "Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization"
why_this_matters: "High-intent visitors who have decided to act but prefer phone or email over form submission currently have no path to conversion — they must either complete the form or leave."
fix_summary: "Add tel: and mailto: links at three non-negotiable touchpoints — footer partial (global), /contact page, and service page CTAs — converting plain-text or absent contact information into tappable, tra…"
confidence_tier: "confirmed"
---

# No tel: or mailto: links detected — mobile users cannot tap-to-call or tap-to-email

**Finding:** No tel: or mailto: links detected — mobile users cannot tap-to-call or tap-to-email  
**Severity:** Medium  
**Why this matters:** High-intent visitors who have decided to act but prefer phone or email over form submission currently have no path to conversion — they must either complete the form or leave.  
**Root cause:** Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization  
**Fix:** Add tel: and mailto: links at three non-negotiable touchpoints — footer partial (global), /contact page, and service page CTAs — converting plain-text or absent contact information into tappable, tra…

> **Evidence Basis:** Confirmed

---

## Impact

- **Lead Capture Rate:** High-intent visitors who have decided to act but prefer phone or email over form submission currently have no path to conversion — they must either complete the form or leave. Adding tel: and mailto: links removes this forced-funnel constraint, capturing leads at peak intent without requiring form completion. The mechanism is friction reduction at the decision moment, not persuasion.
- **Form Abandonment Fallback:** The existing form is a single point of failure. Client-side validation errors, JS failures, or server errors silently block conversion with no recovery path. A visible mailto: fallback on the /contact page gives users an immediate alternative, converting what would be a lost lead into a recoverable contact attempt.
- **Mobile Conversion Path:** On mobile, tel: links trigger the native dialer with one tap — zero typing, zero copy-paste. Plain text phone numbers require the user to memorize, switch apps, and manually dial. The mechanism is elimination of a multi-step manual process that has a high abandonment rate on mobile devices.
- **Analytics Visibility:** Currently, direct contact attempts (phone calls, emails) initiated from the site are invisible to analytics. Instrumented tel:/mailto: links make these conversion events measurable for the first time, enabling attribution of leads that previously appeared as zero-conversion sessions.
- **Form As Gatekeeper Risk:** The root cause analysis identifies the form as an architectural gatekeeper. B2B consultancy buyers — particularly those evaluating a 'Talk to a Founder' CTA — frequently prefer synchronous communication. Forcing asynchronous form submission on a buyer ready for synchronous contact introduces friction at the highest-value moment in the funnel.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_008`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** On a B2B consultancy site viewed on iPhone 14 Pro, there are no tel: or mailto: links in the DOM.. If phone numbers or email addresses appear as plain text anywhere on the site (footer, contact page references), they are not wrapped in actionable links.

**Measured evidence:**
- Internal Links: 11
- External Links: 0
- Tel Links: 0
- Mailto Links: 0
- Page Title: Talk to a founder.
- Device: iPhone 14 Pro
- Primary Cta: Talk to a Founder → /contact

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
Add tel: and mailto: links at three non-negotiable touchpoints — footer partial (global), /contact page, and service page CTAs — converting plain-text or absent contact information into tappable, trackable links that serve as parallel conversion paths alongside the existing form.

### How
1. AUDIT EXISTING CONTACT DATA: Confirm the canonical phone number and email address from the client. Store both as named constants in a site-wide config file (e.g., site.config.js or equivalent CMS global settings) — never hardcode inline. All templates read from this single source.
2. FOOTER PARTIAL (global scope): Locate the footer template partial. If phone/email are rendered as plain text nodes, wrap them in <a href='tel:...'> and <a href='mailto:...'> respectively. Scope the change to the footer partial only — do not touch any other link styles. Add aria-label attributes to each link for screen reader clarity. Verify the footer renders correctly on mobile (tap target ≥ 48×48 CSS px) and desktop.
3. /CONTACT PAGE TEMPLATE: Below or adjacent to the existing form, add a 'Prefer to reach us directly?' block containing the tel: and mailto: links. This block must be visually subordinate to the form (secondary CTA hierarchy) to avoid cannibalizing the primary tracked conversion path. Do not remove or alter the form. The block is additive only.
4. SERVICE PAGE TEMPLATES (/the-get-right and equivalents): Identify the CTA component used on service pages. Add a secondary contact line beneath the primary CTA button — e.g., 'Or call us directly: [tel: link]'. Scope the change to the CTA component only; do not alter page layout, heading hierarchy, or surrounding content.
5. ANALYTICS INSTRUMENTATION: Attach click event listeners to every tel: and mailto: link using data attributes (data-track-contact='phone' / data-track-contact='email') as the selector hook — never select by href pattern, which is brittle across environments. Fire a named analytics event (e.g., contact_link_click with properties: method, page_path, page_template) on each click. Use a single delegated listener on document.body scoped to [data-track-contact] to avoid per-element listener proliferation and survive dynamic DOM updates.
6. FORM FALLBACK COPY: On the /contact page, add a visible fallback message near the form submit button: 'If the form is unavailable, email us directly at [mailto: link].' This addresses the architectural gap identified in the root cause — the form is currently a single point of failure with no fallback channel.
7. TOUCH TARGET AUDIT: After implementation, verify all new links meet 48×48 CSS px minimum tap target size. Use padding, not height/width on the <a> element itself, to avoid layout disruption. Test on iOS Safari and Android Chrome.
8. REGRESSION CHECK: Run a visual diff on footer, /contact, and one service page template before and after. Confirm no existing link styles, form behavior, or CTA button states are altered. The existing form submit handler is untouched — this fix is purely additive HTML and a single delegated JS listener.

### Code examples
```
// site.config.js — single source of truth for contact constants
// SITE-SPECIFIC ASSUMPTION: update these values before deployment
const SITE_CONTACT = Object.freeze({
  PHONE_DISPLAY: '+1 (555) 000-0000',   // human-readable format
  PHONE_E164:    '+15550000000',          // E.164 format for tel: href
  EMAIL:         'hello@example.com',     // canonical contact address
});

export default SITE_CONTACT;
<!-- footer.html partial — scoped change, additive only -->
<!-- SITE-SPECIFIC ASSUMPTION: insert after existing footer address block -->
<address class="footer__contact" aria-label="Contact information">
  <a
    href="tel:{{ SITE_CONTACT.PHONE_E164 }}"
    class="footer__contact-link footer__contact-link--phone"
    aria-label="Call us at {{ SITE_CONTACT.PHONE_DISPLAY }}"
    data-track-contact="phone"
    data-track-location="footer"
  >{{ SITE_CONTACT.PHONE_DISPLAY }}</a>

  <a
    href="mailto:{{ SITE_CONTACT.EMAIL }}"
    class="footer__contact-link footer__contact-link--email"
    aria-label="Email us at {{ SITE_CONTACT.EMAIL }}"
    data-track-contact="email"
    data-track-location="footer"
  >{{ SITE_CONTACT.EMAIL }}</a>
</address>
<!-- contact-page.html — additive block, placed after form, not replacing it -->
<!-- SITE-SPECIFIC ASSUMPTION: insert after closing </form> tag -->
<div class="contact__direct" role="complementary" aria-label="Direct contact options">
  <p class="contact__direct-label">Prefer to reach us directly?</p>
  <a
    href="tel:{{ SITE_CONTACT.PHONE_E164 }}"
    class="contact__direct-link contact__direct-link--phone"
    aria-label="Call us at {{ SITE_CONTACT.PHONE_DISPLAY }}"
    data-track-contact="phone"
    data-track-location="contact-page"
  >{{ SITE_CONTACT.PHONE_DISPLAY }}</a>
  <a
    href="mailto:{{ SITE_CONTACT.EMAIL }}"
    class="contact__direct-link contact__direct-link--email"
    aria-label="Email us at {{ SITE_CONTACT.EMAIL }}"
    data-track-contact="email"
    data-track-location="contact-page"
  >{{ SITE_CONTACT.EMAIL }}</a>
  <p class="contact__direct-fallback">
    If the form is unavailable, email us directly at
    <a
      href="mailto:{{ SITE_CONTACT.EMAIL }}"
      data-track-contact="email"
      data-track-location="contact-page-fallback"
    >{{ SITE_CONTACT.EMAIL }}</a>.
  </p>
</div>
/* contact-direct.css — scoped to .contact__direct and .footer__contact only
   SITE-SPECIFIC ASSUMPTION: adjust spacing to match existing design system tokens */

.contact__direct,
.footer__contact {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Ensure minimum 48×48px tap target via padding, not fixed dimensions,
   to avoid disrupting surrounding layout */
.contact__direct-link,
.footer__contact-link {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1rem; /* 12px top/bottom achieves ≥48px tap target at 16px base font */
  min-height: 3rem;      /* 48px explicit floor — WCAG 2.5.8 */
  text-decoration: underline;
  /* Inherit color from design system — do not override brand tokens here */
}

/* Respect user motion preferences — no animated underlines or transitions */
@media (prefers-reduced-motion: no-preference) {
  .contact__direct-link,
  .footer__contact-link {
    transition: opacity 150ms ease;
  }
}

.contact__direct-link:hover,
.footer__contact-link:hover {
  opacity: 0.8;
}

/* Visible focus indicator — never suppress outline without replacement */
.contact__direct-link:focus-visible,
.footer__contact-link:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
  border-radius: 2px;
}
// contact-tracking.js
// Delegated listener on document.body — survives dynamic DOM, no per-element listeners
// SITE-SPECIFIC ASSUMPTION: replace fireAnalyticsEvent with your analytics adapter
// (GA4 gtag, Segment track, custom data layer push, etc.)

(function initContactLinkTracking() {
  'use strict';

  // Named constant — selector is the contract between HTML and JS
  // Change the data attribute in HTML and here together, never one without the other
  const CONTACT_LINK_SELECTOR = '[data-track-contact]';

  function fireAnalyticsEvent(method, location) {
    // NULL-GUARD: verify analytics global exists before calling
    // Replace this block with your analytics adapter
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'contact_link_click', {
        contact_method:   method,
        page_location:    window.location.pathname,
        link_location:    location,
      });
    }
    // Fallback: push to dataLayer for GTM if gtag not present
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event:            'contact_link_click',
        contact_method:   method,
        page_location:    window.location.pathname,
        link_location:    location,
      });
    }
  }

  function handleContactLinkClick(event) {
    // Walk up from event.target to find the attributed element
    // Handles clicks on child nodes (e.g., icon inside <a>)
    const link = event.target.closest(CONTACT_LINK_SELECTOR);
    if (!link) return;

    const method   = link.dataset.trackContact;   // 'phone' | 'email'
    const location = link.dataset.trackLocation;  // 'footer' | 'contact-page' | 'service-page'

    if (!method || !location) return; // guard against malformed attributes

    fireAnalyticsEvent(method, location);
    // Do NOT call event.preventDefault() — tel: and mailto: must navigate
  }

  // Single delegated listener — no teardown needed for page-lifetime scripts
  // If this module is loaded in an SPA context, call cleanup() on route change
  document.body.addEventListener('click', handleContactLinkClick);

  // Exported for SPA cleanup if needed
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      cleanup: function cleanup() {
        document.body.removeEventListener('click', handleContactLinkClick);
      },
    };
  }
}());
```

## Risks
- PHONE NUMBER EXPOSURE: Publishing a direct phone number increases spam call volume. Mitigation: use a tracked forwarding number (e.g., via a call tracking service) rather than a direct line — this also enables call attribution analytics without exposing the founder's personal number.
- EMAIL HARVESTING: A mailto: link exposes the address to scraper bots. Mitigation: use a role address (hello@, contact@) rather than a personal address, and ensure the mailbox has spam filtering. Do not obfuscate the mailto: href with JS encoding — this breaks accessibility and native mail clients.
- ANALYTICS DOUBLE-COUNTING: If the existing form submission fires a conversion event and a user clicks a tel: link after viewing the form, both events fire independently. This is correct behavior, not a bug — but analytics dashboards must be configured to treat them as separate conversion types, not duplicates of the same goal.
- CTA HIERARCHY DISRUPTION: Adding a secondary contact option on service pages risks diluting the primary CTA click-through if the visual hierarchy is not maintained. Mitigation: the tel:/mailto: option must be styled as a secondary action (smaller, lower contrast than primary CTA button) — the CSS scoping in the proposal enforces this via class-based styling that inherits from the design system rather than overriding it.
- TEMPLATE REGRESSION: The footer partial is global — a markup error there breaks every page. Mitigation: the change is additive (new <address> block appended after existing content, not replacing it). Run a visual regression test across at minimum: homepage, /contact, one service page, and one blog post before deploying.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
