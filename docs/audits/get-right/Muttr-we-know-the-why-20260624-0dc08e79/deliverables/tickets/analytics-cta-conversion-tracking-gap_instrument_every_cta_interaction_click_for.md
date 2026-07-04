---
finding_id: "analytics-cta-conversion-tracking-gap"
title: "Instrument every CTA interaction (click, form submission, anchor navigation) with a unified dataLayer push that simultaneously satisfies GA4 (via GTM), direct gtag(), and Plausible — eliminating the attribution blind spot across all three tools in a single platform-level fix. The solution must be implemented at the reusable component/template layer so every instance of the CTA pattern is covered, not just the page where the gap was detected. The instrumentation must be idempotent (no double-fires on re-render), attribution-safe (preserves session continuity and UTM parameters), and resilient to partial analytics stack failures (one tool failing must not silence the others)."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "Every CTA click that previously generated zero signal across all three analytics tools will now produce a structured, parameterized event in GA4, GTM, and Plausible simultaneously."
fix_summary: "Instrument every CTA interaction (click, form submission, anchor navigation) with a unified dataLayer push that simultaneously satisfies GA4 (via GTM), direct gtag(), and Plausible — eliminating the…"
confidence_tier: "reviewer_identified"
---

# Instrument every CTA interaction (click, form submission, anchor navigation) with a unified dataLayer push that simultaneously satisfies GA4 (via GTM), direct gtag(), and Plausible — eliminating the attribution blind spot across all three tools in a single platform-level fix. The solution must be implemented at the reusable component/template layer so every instance of the CTA pattern is covered, not just the page where the gap was detected. The instrumentation must be idempotent (no double-fires on re-render), attribution-safe (preserves session continuity and UTM parameters), and resilient to partial analytics stack failures (one tool failing must not silence the others).

**Finding:** Instrument every CTA interaction (click, form submission, anchor navigation) with a unified dataLayer push that simultaneously satisfies GA4 (via GTM), direct gtag(), and Plausible — eliminating the attribution blind spot across all three tools in a single platform-level fix. The solution must be implemented at the reusable component/template layer so every instance of the CTA pattern is covered, not just the page where the gap was detected. The instrumentation must be idempotent (no double-fires on re-render), attribution-safe (preserves session continuity and UTM parameters), and resilient to partial analytics stack failures (one tool failing must not silence the others).  
**Severity:** Medium  
**Why this matters:** Every CTA click that previously generated zero signal across all three analytics tools will now produce a structured, parameterized event in GA4, GTM, and Plausible simultaneously.  
**Root cause:** Isolated issue  
**Fix:** Instrument every CTA interaction (click, form submission, anchor navigation) with a unified dataLayer push that simultaneously satisfies GA4 (via GTM), direct gtag(), and Plausible — eliminating the…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Attribution Recovery:** Every CTA click that previously generated zero signal across all three analytics tools will now produce a structured, parameterized event in GA4, GTM, and Plausible simultaneously. This restores the page's contribution to the conversion funnel — conversions that were being attributed to later touchpoints (direct, email, paid) or lost entirely will now be correctly credited to the originating CTA interaction.
- **Channel Attribution Accuracy:** Without CTA tracking, any user who clicked this CTA and later converted in a new session would have their conversion attributed to whatever channel drove the return visit (direct, email, paid search). With CTA tracking in place, the first-touch and last-touch attribution models in GA4 will correctly include this page's CTA as a touchpoint in the conversion path. This directly affects budget allocation decisions — channels that appeared to drive conversions may have been benefiting from untracked upstream intent signals.
- **False Confidence Elimination:** Three tools reporting zero conversions creates a false signal that the page is non-converting. This can drive incorrect optimization decisions: deprioritizing the page in content strategy, reducing paid traffic investment to it, or misattributing revenue to other channels. Restoring accurate measurement eliminates this false negative and enables data-driven decisions based on actual performance.
- **Optimization Enablement:** With cta_location and cta_label parameters captured, GA4 can now segment conversion events by page section and button copy. This enables A/B testing of CTA placement and messaging with measurable outcomes — previously impossible because all variants produced identical zero-event signals.
- **Funnel Visibility:** GA4's funnel exploration reports can now include CTA click as a funnel step between page view and downstream conversion events (purchase, form completion, account creation). The gap in the funnel was structurally invisible before this fix.
- **Plausible Goal Accuracy:** Plausible's goal conversion rate metric will now reflect actual CTA engagement. Previously, Plausible's conversion rate for this page was structurally 0% regardless of actual user behavior — a metric that could not be trusted for any decision-making.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/proof/our-site

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
Instrument every CTA interaction (click, form submission, anchor navigation) with a unified dataLayer push that simultaneously satisfies GA4 (via GTM), direct gtag(), and Plausible — eliminating the attribution blind spot across all three tools in a single platform-level fix. The solution must be implemented at the reusable component/template layer so every instance of the CTA pattern is covered, not just the page where the gap was detected. The instrumentation must be idempotent (no double-fires on re-render), attribution-safe (preserves session continuity and UTM parameters), and resilient to partial analytics stack failures (one tool failing must not silence the others).

### How
STEP 1 — AUDIT & INVENTORY (Pre-implementation, ~2 hours)
1a. Identify every CTA variant rendered by the platform: primary buttons (form submit), secondary buttons (anchor/link CTAs), inline text CTAs, modal-trigger CTAs, and sticky/floating CTAs. Document their DOM selectors, rendered HTML patterns, and which template/component file generates each.
1b. Confirm the GTM container ID, GA4 Measurement ID, and Plausible domain — these become named constants in the implementation. Do NOT hardcode them inline.
1c. Open GTM → Triggers → verify zero triggers exist matching CTA selectors (click element matches, form submission). Confirm the gap is structural, not a disabled trigger.
1d. Open GA4 DebugView and Plausible Goals dashboard — confirm zero events are arriving from CTA interactions during a live test session.
1e. Check whether the CTA is rendered server-side (static HTML in source) or client-side (injected by JS/framework). This determines whether the event listener must be attached at DOMContentLoaded or after hydration.
STEP 2 — DEFINE THE EVENT SCHEMA (Shared across all three tools)
2a. Agree on a canonical event name: 'cta_click' for click-based CTAs, 'cta_form_submit' for form submissions. Use snake_case to match GA4 naming conventions.
2b. Define required parameters: cta_label (visible button text), cta_location (page section identifier, e.g., 'hero', 'pricing', 'footer'), cta_destination (href or form action URL), cta_type ('button' | 'anchor' | 'form'), page_path (window.location.pathname).
2c. Document this schema in a shared tracking plan (Notion, Confluence, or a /docs/tracking-plan.md in the repo) so future CTA additions follow the same structure.
STEP 3 — IMPLEMENT THE PLATFORM-LEVEL CTA TRACKER MODULE
3a. Create a standalone JS module (cta-tracker.js) that: (i) attaches delegated event listeners to document (not individual elements — prevents re-attachment on DOM mutations), (ii) pushes to window.dataLayer for GTM/GA4, (iii) calls gtag() directly as a fallback if GTM is absent, (iv) calls window.plausible() for Plausible. See code_examples[0].
3b. Load this module from the CMS theme's global footer template (or equivalent platform-level include) so it initializes on every page without per-template modification.
3c. Use a data-cta-track attribute as the opt-in selector on CTA elements — this prevents accidental tracking of non-CTA interactive elements and makes the tracking contract explicit in the markup. See code_examples[1] for the HTML markup pattern.
STEP 4 — GTM CONFIGURATION (Parallel to code implementation)
4a. In GTM, create a Custom Event trigger: Event Name = 'cta_click' (exact match). Repeat for 'cta_form_submit'.
4b. Create a GA4 Event tag: Event Name = {{DLV - event_name}}, Parameters mapped from dataLayer variables: cta_label, cta_location, cta_destination, cta_type, page_path. Fire on the triggers from 4a.
4c. Create dataLayer Variable definitions for each parameter: Variable Type = Data Layer Variable, Data Layer Variable Name = the parameter key (e.g., 'cta_label').
4d. In GA4 property → Custom Definitions → Custom Dimensions: register cta_label, cta_location, cta_destination, cta_type as event-scoped dimensions so they appear in reports.
4e. In GA4 → Conversions: mark 'cta_click' and 'cta_form_submit' as conversion events if they represent a meaningful conversion action (lead intent, purchase initiation).
4f. Publish the GTM container. Verify in GTM Preview mode that the trigger fires on CTA click before publishing to production.
STEP 5 — PLAUSIBLE GOAL CONFIGURATION
5a. In Plausible dashboard → Goals → Add Goal → Custom Event: Name = 'CTA Click'. Repeat for 'CTA Form Submit'. (Plausible goal names are case-sensitive and must match the event name passed to window.plausible() exactly.)
5b. The cta-tracker.js module calls window.plausible() with props — verify Plausible's custom properties feature is enabled on the account (requires Plausible Business plan or self-hosted with props enabled).
STEP 6 — FORM SUBMISSION HANDLING (Special case — prevent data loss on navigation)
6a. For form-submit CTAs, the dataLayer push must complete BEFORE the form navigates away. The implementation uses a synchronous push pattern with a short navigation delay guard. See code_examples[2].
6b. If the form uses AJAX submission (no page navigation), no delay guard is needed — push fires normally after the fetch resolves.
STEP 7 — VALIDATION & QA
7a. GTM Preview mode: click each CTA variant, verify 'cta_click' event appears in the event stream with correct parameter values.
7b. GA4 DebugView (enable via ?gtm_debug=x or GA4 Debug Chrome extension): confirm event arrives with all custom dimensions populated.
7c. Plausible Real-Time dashboard: confirm 'CTA Click' goal fires within 5 seconds of interaction.
7d. Browser DevTools → Console: run window.dataLayer.filter(e => e.event === 'cta_click') after clicking a CTA — confirm the object is present with correct values.
7e. Test with GTM container blocked (uBlock Origin): verify the direct gtag() fallback fires and GA4 still receives the event.
7f. Test on mobile (real device, not emulator): verify touch events trigger correctly, no double-fires.
STEP 8 — HISTORICAL DATA ANNOTATION
8a. In GA4 → Annotations (if available) or in your internal tracking plan: document the date this fix went live. Any conversion data before this date is structurally incomplete for CTA attribution — do not compare pre/post conversion rates without this context.
8b. In Plausible, note the goal creation date in your tracking plan for the same reason.

### Code examples
```
// FILE: assets/js/cta-tracker.js
// Platform-level CTA conversion tracking module.
// Covers GA4 (via GTM dataLayer), direct gtag() fallback, and Plausible.
// Attach to every page via the CMS theme's global footer include.
//
// SITE-SPECIFIC ASSUMPTIONS — adjust these constants before deployment:
const CTA_TRACK_SELECTOR = '[data-cta-track]';          // Opt-in attribute on CTA elements
const CTA_CLICK_EVENT_NAME = 'cta_click';               // GA4 / GTM event name
const CTA_SUBMIT_EVENT_NAME = 'cta_form_submit';        // GA4 / GTM event name for forms
const PLAUSIBLE_CTA_CLICK_GOAL = 'CTA Click';           // Must match Plausible goal name exactly
const PLAUSIBLE_CTA_SUBMIT_GOAL = 'CTA Form Submit';    // Must match Plausible goal name exactly
const FORM_NAV_DELAY_MS = 300;                          // ms to hold form navigation while push completes
const MAX_LABEL_LENGTH = 100;                           // Truncate runaway button text in event params

(function initCTATracker() {
  'use strict';

  // --- Utility: safe dataLayer push ---
  // Initializes dataLayer if GTM hasn't loaded yet (race condition guard).
  function pushToDataLayer(payload) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
    } catch (err) {
      // dataLayer push must never throw — swallow silently
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[cta-tracker] dataLayer push failed:', err);
      }
    }
  }

  // --- Utility: direct gtag() fallback ---
  // Fires if GTM container is blocked or absent.
  // gtag() is initialized by the direct GA4 snippet independently of GTM.
  function fireGtagFallback(eventName, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[cta-tracker] gtag fallback failed:', err);
      }
    }
  }

  // --- Utility: Plausible custom event ---
  // window.plausible() is injected by the Plausible script.
  // Props require Plausible Business or self-hosted with props enabled.
  function firePlausible(goalName, props) {
    try {
      if (typeof window.plausible === 'function') {
        window.plausible(goalName, { props: props });
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[cta-tracker] Plausible event failed:', err);
      }
    }
  }

  // --- Utility: extract CTA metadata from element ---
  function extractCTAMeta(element) {
    // Prefer explicit data attributes; fall back to DOM inference.
    // data-cta-label overrides visible text (useful for icon-only buttons).
    var rawLabel =
      element.getAttribute('data-cta-label') ||
      (element.textContent || '').trim();

    return {
      cta_label: rawLabel.substring(0, MAX_LABEL_LENGTH) || '(unlabeled)',
      cta_location: element.getAttribute('data-cta-location') || inferLocation(element),
      cta_destination:
        element.getAttribute('href') ||
        element.getAttribute('data-cta-destination') ||
        '(no-destination)',
      cta_type: inferCTAType(element),
      page_path: window.location.pathname
    };
  }

  // Infer page section from closest ancestor with a data-section or id attribute.
  // SITE-SPECIFIC: adjust ancestor selector to match your CMS section markup.
  function inferLocation(element) {
    var section = element.closest('[data-section], section[id], header, footer, aside, main');
    if (!section) return 'unknown';
    return (
      section.getAttribute('data-section') ||
      section.getAttribute('id') ||
      section.tagName.toLowerCase()
    );
  }

  function inferCTAType(element) {
    var tag = element.tagName.toLowerCase();
    if (tag === 'a') return 'anchor';
    if (tag === 'button') return 'button';
    if (tag === 'input' && element.type === 'submit') return 'submit-input';
    return 'button'; // default for role="button" divs etc.
  }

  // --- Core: fire all three tracking tools ---
  function fireConversionEvent(eventName, plausibleGoal, meta) {
    // 1. dataLayer push (consumed by GTM → GA4 tag)
    pushToDataLayer({
      event: eventName,
      cta_label: meta.cta_label,
      cta_location: meta.cta_location,
      cta_destination: meta.cta_destination,
      cta_type: meta.cta_type,
      page_path: meta.page_path
    });

    // 2. Direct gtag() — fires independently of GTM.
    // If GTM is present AND processes the dataLayer push above, this creates
    // a duplicate GA4 event. Prevent this by checking for GTM container presence.
    // SITE-SPECIFIC: set window.__GTM_ACTIVE__ = true in your GTM container's
    // Custom HTML tag that fires on All Pages to enable this guard.
    if (!window.__GTM_ACTIVE__) {
      fireGtagFallback(eventName, {
        cta_label: meta.cta_label,
        cta_location: meta.cta_location,
        cta_destination: meta.cta_destination,
        cta_type: meta.cta_type,
        page_path: meta.page_path
      });
    }

    // 3. Plausible
    firePlausible(plausibleGoal, {
      label: meta.cta_label,
      location: meta.cta_location,
      destination: meta.cta_destination
    });
  }

  // --- Click handler (delegated to document) ---
  // Delegation means this works for CTAs injected after DOMContentLoaded
  // (e.g., by CMS preview tools, A/B test variants, or lazy-loaded sections).
  function handleCTAClick(event) {
    var target = event.target;
    // Walk up the DOM — click may land on a child element (icon, span inside button)
    var cta = target.closest ? target.closest(CTA_TRACK_SELECTOR) : null;
    if (!cta) return;

    var meta = extractCTAMeta(cta);
    fireConversionEvent(CTA_CLICK_EVENT_NAME, PLAUSIBLE_CTA_CLICK_GOAL, meta);
  }

  // --- Form submit handler (delegated to document) ---
  // Handles forms whose submit button carries data-cta-track.
  // Also handles forms where the <form> itself carries data-cta-track.
  function handleCTAFormSubmit(event) {
    var form = event.target;
    if (!form || form.tagName.toLowerCase() !== 'form') return;

    // Check if the form itself is opted in, or if the submit button is
    var isTrackedForm =
      form.matches(CTA_TRACK_SELECTOR) ||
      (form.querySelector('[type="submit"]' + CTA_TRACK_SELECTOR) !== null);

    if (!isTrackedForm) return;

    var meta = extractCTAMeta(
      form.querySelector('[type="submit"]' + CTA_TRACK_SELECTOR) || form
    );
    meta.cta_type = 'form';
    meta.cta_destination = form.getAttribute('action') || window.location.pathname;

    // For non-AJAX forms: hold navigation briefly to allow async tracking calls to dispatch.
    // This is a best-effort delay — tracking tools may still miss the event if the
    // browser navigates before the network request completes. Server-side tracking
    // (GA4 Measurement Protocol) is the robust solution for form submissions.
    var isAjaxForm = form.getAttribute('data-ajax') === 'true';
    if (!isAjaxForm) {
      event.preventDefault();
      fireConversionEvent(CTA_SUBMIT_EVENT_NAME, PLAUSIBLE_CTA_SUBMIT_GOAL, meta);
      setTimeout(function () {
        form.submit();
      }, FORM_NAV_DELAY_MS);
    } else {
      fireConversionEvent(CTA_SUBMIT_EVENT_NAME, PLAUSIBLE_CTA_SUBMIT_GOAL, meta);
    }
  }

  // --- Initialization ---
  // Guard: prevent double-initialization if script is accidentally loaded twice.
  if (window.__CTA_TRACKER_INITIALIZED__) return;
  window.__CTA_TRACKER_INITIALIZED__ = true;

  document.addEventListener('click', handleCTAClick, { passive: true });
  document.addEventListener('submit', handleCTAFormSubmit);

  // Teardown is intentionally omitted: this module lives for the full page lifetime.
  // If used inside a SPA with route-based unmounting, call the following on route change:
  // document.removeEventListener('click', handleCTAClick);
  // document.removeEventListener('submit', handleCTAFormSubmit);
  // window.__CTA_TRACKER_INITIALIZED__ = false;
})();
<!-- HTML MARKUP PATTERN -->
<!-- Add data-cta-track to every CTA element that should fire a conversion event. -->
<!-- data-cta-label: override visible text (required for icon-only buttons) -->
<!-- data-cta-location: explicit section identifier (preferred over DOM inference) -->
<!-- data-cta-destination: explicit destination (for buttons that trigger JS navigation) -->

<!-- Primary CTA button -->
<button
  type="button"
  data-cta-track
  data-cta-label="Get Started"
  data-cta-location="hero"
  data-cta-destination="/signup"
  class="btn btn--primary"
>
  Get Started
</button>

<!-- Anchor CTA -->
<a
  href="/pricing"
  data-cta-track
  data-cta-label="View Pricing"
  data-cta-location="features"
  class="btn btn--secondary"
>
  View Pricing
</a>

<!-- Form with tracked submit button -->
<!-- Add data-ajax="true" if the form submits via fetch/XHR (no page navigation) -->
<form action="/contact" method="POST">
  <label for="email">Email address</label>
  <input type="email" id="email" name="email" required />
  <button
    type="submit"
    data-cta-track
    data-cta-label="Request Demo"
    data-cta-location="contact-form"
    class="btn btn--primary"
  >
    Request Demo
  </button>
</form>

<!-- Icon-only CTA (data-cta-label is mandatory here — textContent would be empty) -->
<button
  type="button"
  data-cta-track
  data-cta-label="Add to Wishlist"
  data-cta-location="product-card"
  aria-label="Add to Wishlist"
  class="btn btn--icon"
>
  <svg aria-hidden="true" focusable="false"><!-- heart icon --></svg>
</button>
// GTM CUSTOM HTML TAG — Set GTM active flag
// Tag type: Custom HTML
// Trigger: All Pages (Page View)
// Purpose: Signals to cta-tracker.js that GTM is present and processing dataLayer,
// preventing duplicate GA4 events from the direct gtag() fallback path.
<script>
  window.__GTM_ACTIVE__ = true;
</script>
// GTM VARIABLE DEFINITIONS — Create one Data Layer Variable per parameter
// In GTM UI: Variables → New → Data Layer Variable
// Variable configurations (repeat for each):
//
// Name: DLV - cta_label
//   Data Layer Variable Name: cta_label
//   Data Layer Version: Version 2
//
// Name: DLV - cta_location
//   Data Layer Variable Name: cta_location
//
// Name: DLV - cta_destination
//   Data Layer Variable Name: cta_destination
//
// Name: DLV - cta_type
//   Data Layer Variable Name: cta_type
//
// Name: DLV - page_path
//   Data Layer Variable Name: page_path

// GTM TRIGGER — Custom Event
// Name: CE - cta_click
//   Trigger Type: Custom Event
//   Event Name: cta_click
//   This trigger fires on: All Custom Events
//
// Name: CE - cta_form_submit
//   Trigger Type: Custom Event
//   Event Name: cta_form_submit

// GTM TAG — GA4 Event for CTA Click
// Name: GA4 Event - CTA Click
//   Tag Type: Google Analytics: GA4 Event
//   Configuration Tag: [your GA4 Config tag]
//   Event Name: cta_click
//   Event Parameters:
//     cta_label      → {{DLV - cta_label}}
//     cta_location   → {{DLV - cta_location}}
//     cta_destination → {{DLV - cta_destination}}
//     cta_type       → {{DLV - cta_type}}
//     page_path      → {{DLV - page_path}}
//   Firing Triggers: CE - cta_click
//
// Duplicate the above tag for cta_form_submit, firing on CE - cta_form_submit.
// GA4 CUSTOM DIMENSIONS — Register in GA4 property
// GA4 UI: Admin → Property → Custom Definitions → Custom Dimensions → Create
//
// Dimension Name: CTA Label
//   Scope: Event
//   Event Parameter: cta_label
//
// Dimension Name: CTA Location
//   Scope: Event
//   Event Parameter: cta_location
//
// Dimension Name: CTA Destination
//   Scope: Event
//   Event Parameter: cta_destination
//
// Dimension Name: CTA Type
//   Scope: Event
//   Event Parameter: cta_type
//
// GA4 CONVERSION MARKING
// GA4 UI: Admin → Property → Events → find 'cta_click' → toggle Mark as conversion
// Repeat for 'cta_form_submit' if it represents a meaningful conversion action.
// NOTE: Only mark as conversion if the CTA click itself represents intent to convert
// (e.g., 'Request Demo', 'Buy Now'). Navigation CTAs ('Learn More') should remain
// as standard events, not conversions, to avoid inflating conversion metrics.
// VALIDATION SCRIPT — Run in browser DevTools console after implementation
// Paste this into the console, then click a tracked CTA on the page.
// Expected output: the cta_click event object with all parameters populated.

(function validateCTATracking() {
  var EXPECTED_EVENT = 'cta_click';
  var REQUIRED_PARAMS = ['cta_label', 'cta_location', 'cta_destination', 'cta_type', 'page_path'];

  if (!window.dataLayer) {
    console.error('[validate] window.dataLayer not found — GTM or cta-tracker.js not loaded');
    return;
  }

  var ctaEvents = window.dataLayer.filter(function(entry) {
    return entry.event === EXPECTED_EVENT;
  });

  if (ctaEvents.length === 0) {
    console.warn('[validate] No cta_click events found in dataLayer. Click a [data-cta-track] element first.');
    return;
  }

  ctaEvents.forEach(function(entry, index) {
    console.group('[validate] cta_click event #' + (index + 1));
    REQUIRED_PARAMS.forEach(function(param) {
      if (entry[param]) {
        console.log('✅ ' + param + ':', entry[param]);
      } else {
        console.error('❌ MISSING: ' + param);
      }
    });
    console.groupEnd();
  });
})();
```

## Risks
- DUPLICATE GA4 EVENTS: If GTM is present AND the direct gtag() fallback fires, GA4 will receive two identical events per CTA click. Mitigation: The __GTM_ACTIVE__ flag pattern in code_examples[2] prevents this. Validate in GA4 DebugView — if you see duplicate events, confirm the GTM Custom HTML tag setting the flag is firing on All Pages before the cta-tracker.js module initializes.
- FORM NAVIGATION RACE CONDITION: The FORM_NAV_DELAY_MS guard (300ms) is best-effort. If the browser navigates before tracking network requests complete, the event may be lost. Mitigation: For high-value form submissions (demo requests, purchases), implement GA4 Measurement Protocol server-side tracking as a parallel path — fire the event from your server after the form POST is received, guaranteeing delivery regardless of client-side navigation timing.
- PLAUSIBLE PROPS PLAN REQUIREMENT: Custom properties (props) on Plausible events require the Business plan or self-hosted v1.5+. If the account is on the Starter plan, window.plausible() will accept the call but silently discard the props object. Mitigation: Verify plan tier before deployment. If props are unavailable, the goal name alone (without props) still provides conversion count data — remove the props object from the firePlausible() call to avoid silent failures.
- CTA ELEMENTS RENDERED AFTER MODULE INITIALIZATION: CTAs injected by A/B testing tools (Optimizely, VWO), personalization engines, or lazy-loaded content sections may appear after DOMContentLoaded. Mitigation: The delegated event listener pattern (attached to document, not individual elements) handles this correctly — delegation captures events from elements that did not exist at initialization time. No additional handling required.
- DOUBLE-INITIALIZATION IN SPA ENVIRONMENTS: If the CMS uses client-side routing (Next.js, Nuxt, SvelteKit), the module may be re-executed on route changes, causing duplicate event listeners. Mitigation: The __CTA_TRACKER_INITIALIZED__ guard prevents re-initialization. For SPA route changes, implement the teardown pattern documented in the code comments and re-initialize after route change.
- DATA-CTA-TRACK ATTRIBUTE ADOPTION: The opt-in attribute model requires every CTA in the CMS to be updated with data-cta-track. If the CMS uses a visual page builder (Elementor, Webflow, Divi), adding custom attributes may require per-element configuration or a global CSS class approach. Mitigation: Audit the CMS's component library and add data-cta-track to the base button/CTA component template so all instances inherit it automatically. Document the attribute as a required field in the component's design system spec.
- HISTORICAL DATA INCOMPARABILITY: GA4 and Plausible will show a sharp increase in conversion events on the deployment date. This is not a real increase — it is the restoration of previously invisible data. Mitigation: Annotate the deployment date in GA4 (Admin → Annotations) and in your internal tracking plan. Communicate to stakeholders that pre-deployment conversion data for this CTA is structurally incomplete and should not be used as a baseline for post-deployment comparison.
- ICON-ONLY BUTTONS WITHOUT DATA-CTA-LABEL: If a CTA button contains only an SVG icon with no visible text, textContent will be empty and the event will log '(unlabeled)' as the cta_label. Mitigation: Require data-cta-label on all icon-only CTAs as a markup standard. Add a linting rule or CMS validation to flag buttons with data-cta-track but no accessible label (which would also be an aria-label violation).

## Effort & Cost
- **Effort:** medium
- **Cost:** low
