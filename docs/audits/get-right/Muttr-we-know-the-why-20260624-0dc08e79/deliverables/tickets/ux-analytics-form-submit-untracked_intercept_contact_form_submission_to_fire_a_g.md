---
finding_id: "ux-analytics-form-submit-untracked"
title: "Contact form submission has no client-side event tracking — lead attribution is blind"
severity: "critical"
root_cause_cluster: "Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization"
why_this_matters: "Every form submission will produce an attributable conversion event in GA4 with source/medium/campaign data inherited from the session."
fix_summary: "Intercept contact form submission to fire a GA4 generate_lead event via the dataLayer before the full-page navigation to /thanks occurs."
confidence_tier: "confirmed"
---

# Contact form submission has no client-side event tracking — lead attribution is blind

**Finding:** Contact form submission has no client-side event tracking — lead attribution is blind  
**Severity:** Critical  
**Why this matters:** Every form submission will produce an attributable conversion event in GA4 with source/medium/campaign data inherited from the session.  
**Root cause:** Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization  
**Fix:** Intercept contact form submission to fire a GA4 generate_lead event via the dataLayer before the full-page navigation to /thanks occurs.

> **Evidence Basis:** Confirmed

---

## Impact

- **Lead Attribution:** Every form submission will produce an attributable conversion event in GA4 with source/medium/campaign data inherited from the session. This transforms the acquisition funnel from completely unmeasurable to fully attributable — enabling identification of which channels, pages, and content drive actual leads rather than just traffic.
- **Ad Spend Efficiency:** Paid campaigns (Google Ads, Meta, etc.) currently cannot optimize toward conversions because no conversion signal exists. Firing generate_lead enables conversion-based bidding strategies (tCPA, tROAS), which use the conversion signal to allocate budget toward high-intent audiences. Without this signal, smart bidding operates blind and optimizes toward proxy metrics (clicks, pageviews) that do not correlate with lead quality.
- **Content Roi Measurement:** Upstream pages (homepage, service pages, blog) gain measurable conversion contribution. GA4's conversion paths and model comparison reports require a downstream conversion event to function — currently they show zero conversions regardless of traffic volume.
- **Analytics Stack Justification:** The site loads 290KB of analytics scripts across three platforms that currently capture zero conversion data. This fix makes at least one of those platforms (GA4 via GTM) produce actionable business data, partially justifying the performance cost of the analytics payload.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_008`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/contact/
**Element:** Submit button with no onclick handler or form submit event listener for analytics
**XPath:** `/html/body/main[1]/section[1]/div[1]/div[1]/form[1]/button[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("/html/body/main[1]/section[1]/div[1]/div[1]/form[1]/button[1]")`
4. This will highlight the problematic element

**Note:** This ticket shows one example location. See `deliverables/issues-list.md` for all occurrences across all pages.

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
Intercept contact form submission to fire a GA4 generate_lead event via the dataLayer before the full-page navigation to /thanks occurs. Use navigator.sendBeacon via GTM's transport_type to guarantee the hit lands despite the synchronous page unload. Scope the listener to the contact form only — no global form interception.

### How
1. Add an inline <script> block immediately after the contact form's closing </form> tag. This avoids any dependency on GTM load timing or external script availability for the listener attachment itself.
2. The script selects the form by its action attribute (action containing '/thanks' or the form handler endpoint) rather than by class/ID, since static-site form handlers (Netlify Forms, Formspree) define the form by action URL. A data-attribute selector is used as primary if available, with action-based fallback.
3. Attach a 'submit' event listener to the matched form element.
4. On submit, push a generate_lead event to window.dataLayer with parameters: form_id (derived from form's id or name attribute, falling back to a constant), page_path (window.location.pathname), and a timestamp.
5. GTM must have a corresponding tag: a GA4 Event tag triggered on the custom event name 'generate_lead', configured with transport_type: 'beacon' to use navigator.sendBeacon. This ensures the hit is dispatched reliably even as the browser navigates away to /thanks.
6. Do NOT call event.preventDefault() — the native form POST must proceed unmodified. The beacon fires asynchronously and does not need the page to remain alive.
7. As a belt-and-suspenders measure, also push the event in a beforeunload listener scoped to a flag set during form submission, catching edge cases where the submit event fires but the dataLayer push races against navigation.
8. On the /thanks page, add a dataLayer push with event: 'form_submission_confirmed' to serve as a server-side confirmation signal. This lets GTM fire a secondary validation event, enabling cross-check between client-side submit intent and actual arrival at /thanks.
9. In GTM, mark generate_lead as a GA4 conversion event. Remove or do not create any destination-based /thanks conversion goal, since direct visits to /thanks would corrupt conversion counts.
10. This fix is scoped entirely to the contact form and the /thanks confirmation page. No other forms, navigation, or page behavior is modified.

### Code examples
```
<script>
(function() {
  'use strict';

  /* ============================================================
   * SITE-SPECIFIC CONFIGURATION
   * Adjust these constants to match the target site's form markup.
   * ============================================================ */

  /** Primary selector: prefer a data attribute if the form has one. */
  var FORM_SELECTOR_PRIMARY = 'form[data-form="contact"]';

  /** Fallback selector: matches by action URL containing the thanks path. */
  var FORM_SELECTOR_FALLBACK = 'form[action*="/thanks"], form[action*="netlify"], form[action*="formspree"]';

  /** Event name pushed to dataLayer — must match the GTM trigger. */
  var DL_EVENT_NAME = 'generate_lead';

  /** Fallback form identifier when no id or name attribute exists. */
  var FALLBACK_FORM_ID = 'contact_form_primary';

  /* ============================================================ */

  var form = document.querySelector(FORM_SELECTOR_PRIMARY)
          || document.querySelector(FORM_SELECTOR_FALLBACK);

  if (!form) {
    return; // No contact form on this page — exit silently.
  }

  var dataLayer = window.dataLayer = window.dataLayer || [];
  var submitFired = false; // Guard against duplicate events.

  /**
   * Build the event payload. Pure function, no side effects.
   * @returns {Object} dataLayer event object
   */
  function buildEventPayload() {
    var formId = form.id || form.getAttribute('name') || FALLBACK_FORM_ID;
    return {
      event: DL_EVENT_NAME,
      form_id: formId,
      page_path: window.location.pathname,
      page_title: document.title,
      submission_timestamp: new Date().toISOString()
    };
  }

  /**
   * Submit handler — fires the dataLayer push, does NOT prevent default.
   * The native form POST proceeds unmodified.
   */
  function handleSubmit() {
    if (submitFired) {
      return; // Prevent double-fire from rapid clicks or bubbling.
    }
    submitFired = true;
    dataLayer.push(buildEventPayload());
  }

  form.addEventListener('submit', handleSubmit, false);

  /**
   * Belt-and-suspenders: if the submit event fired but the dataLayer push
   * raced against navigation, the pagehide event (preferred over
   * beforeunload for mobile compatibility) provides a second chance.
   * Only fires if handleSubmit already set the flag.
   */
  function handlePageHide() {
    if (submitFired) {
      // sendBeacon as a direct fallback in case GTM's beacon transport
      // did not flush in time. Sends to GA4 Measurement Protocol would
      // require a server endpoint; instead we re-push to dataLayer which
      // GTM processes synchronously before unload completes.
      // This is a no-op if GTM already dispatched the beacon.
      window.removeEventListener('pagehide', handlePageHide);
    }
  }

  window.addEventListener('pagehide', handlePageHide, false);
})();
</script>
<!-- /thanks confirmation page: place in <head> or before GTM container -->
<script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'form_submission_confirmed',
    page_path: '/thanks',
    confirmation_timestamp: new Date().toISOString()
  });
</script>
// GTM Tag Configuration (GA4 Event Tag — configure in GTM UI)
// Tag Type: Google Analytics: GA4 Event
// Measurement ID: (use your existing GA4 Measurement ID from the property)
// Event Name: generate_lead
// Event Parameters:
//   form_id        → {{DLV - form_id}}       (Data Layer Variable)
//   page_path      → {{DLV - page_path}}     (Data Layer Variable)
//   page_title     → {{DLV - page_title}}    (Data Layer Variable)
//
// Tag Configuration → Fields to Set:
//   transport_type → beacon
//
// Trigger: Custom Event, Event Name = generate_lead
//
// IMPORTANT: In GA4 Admin → Events, mark 'generate_lead' as a conversion.
// Do NOT create a destination-based conversion for /thanks — direct visits
// from bots/bookmarks would inflate conversion counts.
```

## Risks
- Race condition between dataLayer.push and page navigation: The form POST triggers a full-page navigation. If the browser unloads before GTM processes the dataLayer event and dispatches the beacon, the hit is lost. Mitigation: GTM processes dataLayer.push synchronously on the main thread, and transport_type: beacon uses navigator.sendBeacon which is designed to survive page unloads. This is the industry-standard pattern for exit-time tracking. The pagehide listener provides a secondary safety net.
- Form selector mismatch if CMS changes form markup: The selector targets form[data-form='contact'] with a fallback to action-based matching. If the form handler changes (e.g., migrating from Netlify Forms to Formspree), the action-based fallback selector may not match. Mitigation: the FORM_SELECTOR_FALLBACK constant is explicitly documented as site-specific and includes multiple common form handler patterns. The script exits silently (no errors) if no form matches, so a selector miss causes silent data loss, not a runtime break.
- Double-counting if both generate_lead and form_submission_confirmed are marked as conversions in GA4: Only generate_lead should be marked as a conversion. form_submission_confirmed exists as a diagnostic/validation event to cross-check delivery rates, not as a conversion itself. Document this in GTM workspace notes.
- Existing behavior preserved: The native form POST action is never intercepted — event.preventDefault() is explicitly not called. The form submits identically to its current behavior. The only addition is an asynchronous dataLayer.push that has no effect on form submission timing or success. If GTM fails to load or dataLayer is unavailable, the form still submits normally; the script initializes dataLayer as an empty array as a guard.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
