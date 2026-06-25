---
finding_id: "ux-analytics-triple-redundancy-kpi-corruption"
title: "Triple analytics stack (GA4 via GTM + direct GA4 + Plausible) makes KPIs unreliable with no conversion events configured"
severity: "critical"
root_cause_cluster: "Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture"
why_this_matters: "Removing the standalone gtag.js eliminates one full GA4 script load per page."
fix_summary: "Consolidate to a single GTM-managed GA4 property with conversion events configured."
confidence_tier: "confirmed"
---

# Triple analytics stack (GA4 via GTM + direct GA4 + Plausible) makes KPIs unreliable with no conversion events configured

**Finding:** Triple analytics stack (GA4 via GTM + direct GA4 + Plausible) makes KPIs unreliable with no conversion events configured  
**Severity:** Critical  
**Why this matters:** Removing the standalone gtag.js eliminates one full GA4 script load per page.  
**Root cause:** Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture  
**Fix:** Consolidate to a single GTM-managed GA4 property with conversion events configured.

> **Evidence Basis:** Confirmed

---

## Impact

- **Page Weight:** Removing the standalone gtag.js eliminates one full GA4 script load per page. The exact byte savings depend on the gtag.js version served by Google's CDN at deploy time — verify the actual transfer size in DevTools Network tab (filter by 'gtag') before and after removal. Combined with the ERR_ABORTED duplicate collect beacon resolving itself, total analytics script overhead is reduced to the GTM container alone. If Plausible is also removed, an additional ~1KB is saved.
- **Core Web Vitals Inp:** Removing the standalone gtag.js eliminates a second GA4 initialization on every page load. Each initialization parses and executes a full GA4 script bundle on the main thread, contributing to Total Blocking Time and degrading INP. Eliminating this removes one full script parse-and-execute cycle from every page.
- **Core Web Vitals Lcp:** One fewer render-blocking-adjacent async script reduces main thread contention during initial page load, allowing the browser to prioritize rendering the largest contentful element sooner.
- **Data Integrity:** Currently every GA4 pageview fires twice per page load, inflating pageview counts, inflating session counts, and suppressing bounce rate (a single-page visit registers as two pageviews, which GA4 treats as an engaged session). After fix, each metric reflects actual user behavior. This is the prerequisite for any data-driven decision — without it, channel attribution, content performance, and conversion analysis are all built on corrupted denominators.
- **Conversion Measurement:** Currently zero conversion events exist across all three analytics platforms. The primary business action (contact form submission) is invisible to analytics. After fix, generate_lead events enable: channel attribution for leads, page-level conversion rate analysis, and campaign ROI measurement. This transforms analytics from a performance liability into a functional measurement system.
- **Cascade Resolution:** Resolves the ERR_ABORTED collect beacon finding (the duplicate GA4 request canceled by the browser disappears when the duplicate script is removed), reduces CSP allowlist complexity (one fewer script origin to allowlist), and eliminates the unused bytes finding for the standalone gtag.js bundle.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/proof/our-site/
**Element:** Primary CTA 'Talk to a Founder' — no click event tracking configured
**XPath:** `/html/body/header[1]/nav[1]/div[1]/a[5]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("/html/body/header[1]/nav[1]/div[1]/a[5]")`
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
Consolidate to a single GTM-managed GA4 property with conversion events configured. Remove the standalone gtag.js script entirely. Remove Plausible or retain it deliberately as a privacy-first secondary source (decision required from client). Configure business-meaningful events in GTM for the primary conversion action ('Talk to a Founder' CTA → contact form submission) and supporting engagement signals.

### How
Phase 1 — Remove redundant scripts (same deploy): (1) Locate and remove the standalone gtag.js include that loads GA4 measurement ID G-91BP6NPTSM directly. This is the <script async src="https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM"> tag plus its inline gtag('config', ...) block. Do NOT touch the GTM container script (GTM-5VQTG6TH). (2) Decide on Plausible: if the client wants privacy-compliant analytics as a secondary source, keep it — it is lightweight (~1KB) and does not conflict with GA4. If not needed, remove the <script data-domain="..." src="https://plausible.io/js/script.js"> tag. (3) Verify in GTM workspace that the GA4 Configuration tag fires measurement ID G-91BP6NPTSM on 'All Pages' trigger. This is already happening inside the container — removing the standalone script simply stops the double-fire. Phase 2 — Configure conversion events in GTM (same or next deploy): (4) Create a dataLayer push on the contact form's submit handler that fires before the form navigates or shows confirmation. (5) In GTM, create a Custom Event trigger matching the dataLayer event name. (6) In GTM, create a GA4 Event tag using the existing GA4 Configuration tag, firing on that trigger, with event name 'generate_lead' and parameters form_id, form_name, page_path. (7) Create additional engagement event tags: scroll depth (use GTM's built-in Scroll Depth trigger at 25/50/75/90%), outbound link clicks (use GTM's built-in Click URL trigger with a regex matching non-site domains), and CTA clicks (use a Click Element trigger matching the 'Talk to a Founder' button selector). (8) In GA4 Admin → Conversions, mark 'generate_lead' as a conversion event. Phase 3 — Validate (pre-publish): (9) Use GTM Preview mode to confirm: exactly one GA4 pageview fires per page load, the generate_lead event fires on form submission with correct parameters, scroll and click events fire at expected thresholds. (10) Check GA4 DebugView to confirm events arrive without duplication. (11) Publish GTM container. (12) After 48 hours, compare GA4 Realtime report session counts against Plausible (if retained) — they should be in the same order of magnitude, confirming deduplication.

### Code examples
```
<!-- REMOVE THIS ENTIRE BLOCK — standalone gtag.js causing double-fire -->
<!-- Find and delete from your site template/layout file: -->
<!--
<script async src="https://www.googletagmanager.com/gtag/js?id=G-91BP6NPTSM"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-91BP6NPTSM');
</script>
-->

<!-- KEEP THIS — GTM container script (already loads GA4 internally) -->
<!-- Verify this exists in <head>: -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5VQTG6TH');
</script>
/**
 * Contact form dataLayer push — add to the contact form's submit handler.
 *
 * SITE-SPECIFIC ASSUMPTIONS (configure per implementation):
 * - CONTACT_FORM_SELECTOR: CSS selector for the contact form element(s).
 *   If multiple forms match (e.g., footer form + modal form), all are tracked.
 * - FORM_ID_VALUE: unique identifier for this form in analytics
 * - FORM_NAME_VALUE: human-readable form name for GA4 reports
 *
 * TRADITIONAL POST FORMS: The dataLayer.push fires synchronously, but GTM
 * dispatches the GA4 beacon asynchronously. To prevent beacon loss on page
 * navigation, configure the GA4 Event tag in GTM with Transport Type = 'Beacon'
 * (navigator.sendBeacon), which survives page unload. See GTM config in
 * code_examples[2] for the corresponding tag setting.
 *
 * SPA/FETCH FORMS: Fire the dataLayer push after a successful response,
 * then reset the tracking guard on the form element.
 *
 * SCRIPT LOAD CONTEXT: This script may be injected by GTM (Custom HTML tag)
 * or included in the page bundle. The guard uses a DOM data attribute
 * (data-tracking-bound) rather than a module-scoped variable, so it is
 * safe against multiple script loads from different contexts.
 */

/* --- Site-specific configuration --- */
const CONTACT_FORM_SELECTOR = '[data-form="contact"]'; // Adjust to match actual form(s)
const FORM_ID_VALUE         = 'contact_main';           // Unique form identifier
const FORM_NAME_VALUE       = 'Talk to a Founder';      // Human-readable name

function handleContactFormSubmit(event) {
  const form = event.currentTarget;

  // DOM-scoped guard: survives multiple script loads from different contexts.
  // A module-scoped boolean would create separate closures per load instance.
  if (form.dataset.trackingBound === 'firing') {
    return;
  }
  form.dataset.trackingBound = 'firing';

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event':     'generate_lead',
      'form_id':   FORM_ID_VALUE,
      'form_name': FORM_NAME_VALUE,
      'page_path': window.location.pathname
    });
  } catch (e) {
    // Analytics failure must never block form submission
  } finally {
    // Reset guard after push so the form can be resubmitted if the page
    // stays loaded (e.g., validation error returned by server, SPA flow).
    // For traditional POST with redirect, this reset is a no-op.
    form.dataset.trackingBound = 'bound';
  }

  // For traditional form POST: allow default behavior to proceed.
  // GTM GA4 Event tag MUST have Transport Type = 'Beacon' to survive navigation.
  // For fetch-based forms: call your submit logic here.
}

function initContactFormTracking() {
  // querySelectorAll handles pages with multiple form instances
  // (e.g., inline form + modal form) — querySelector returns only the first match.
  const forms = document.querySelectorAll(CONTACT_FORM_SELECTOR);
  if (!forms.length) {
    return; // Form(s) not on this page — no-op
  }
  forms.forEach(function (form) {
    // Skip if already bound (handles repeated initContactFormTracking() calls)
    if (form.dataset.trackingBound) {
      return;
    }
    form.dataset.trackingBound = 'bound';
    form.addEventListener('submit', handleContactFormSubmit);
  });
}

// Initialize when DOM is ready.
// NOTE: If injected via GTM Custom HTML tag, GTM fires after DOMContentLoaded
// by default — the else branch will always execute in that context.
// Both branches are live when this script is also included in the page bundle.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContactFormTracking);
} else {
  initContactFormTracking();
}
/**
 * GTM Custom Event Trigger configuration (apply in GTM UI):
 *
 * PRE-DEPLOY VERIFICATION (do this before Phase 2):
 *   - Open GTM-5VQTG6TH workspace → Tags.
 *   - Confirm a GA4 Configuration tag for G-91BP6NPTSM exists AND is present
 *     in the most recently PUBLISHED container version (not just a draft or paused).
 *   - If the tag exists only in a draft, publish it first — GA4 Event tags
 *     without a published parent Configuration tag silently drop all events.
 *   - Search all Custom HTML tags for direct gtag() calls (e.g., gtag('event', ...)).
 *     These depend on a gtag global being initialized. The GTM GA4 Configuration
 *     tag does initialize gtag(), but firing order must be confirmed in GTM
 *     Preview mode. Any Custom HTML tag calling gtag() must fire AFTER the
 *     GA4 Configuration tag, or it will throw 'gtag is not a function'.
 *
 * 1. Trigger:
 *    - Type: Custom Event
 *    - Event name: generate_lead
 *    - Fires on: All Custom Events (matching 'generate_lead')
 *
 * 2. GA4 Event Tag:
 *    - Tag Type: Google Analytics: GA4 Event
 *    - Configuration Tag: (select the published GA4 config tag for G-91BP6NPTSM)
 *    - Event Name: generate_lead
 *    - Event Parameters:
 *        form_id   → {{DLV - form_id}}   (Data Layer Variable)
 *        form_name → {{DLV - form_name}} (Data Layer Variable)
 *        page_path → {{DLV - page_path}} (Data Layer Variable)
 *    - Advanced Settings → Transport Type: Beacon
 *      REQUIRED for traditional POST forms: navigator.sendBeacon survives
 *      page navigation/unload. Without this, the beacon may be aborted before
 *      reaching GA4 servers on a redirect. Supported in all modern browsers;
 *      IE11 (EOL) would fall back to XHR — acceptable for typical SaaS audiences.
 *    - Firing Trigger: generate_lead (the trigger from step 1)
 *
 * 3. Data Layer Variables (create in GTM):
 *    - Variable Name: DLV - form_id
 *      Type: Data Layer Variable
 *      Data Layer Variable Name: form_id
 *
 *    - Variable Name: DLV - form_name
 *      Type: Data Layer Variable
 *      Data Layer Variable Name: form_name
 *
 *    - Variable Name: DLV - page_path
 *      Type: Data Layer Variable
 *      Data Layer Variable Name: page_path
 *
 * 4. Built-in engagement triggers (enable in GTM):
 *    - Scroll Depth trigger:
 *        Type: Scroll Depth
 *        Vertical Scroll Depths: Percentages — 25, 50, 75, 90
 *        Enable: 'Fire this trigger' = Once per Page (default behavior;
 *        confirm this is NOT set to 'All Events' to avoid firing on every
 *        threshold crossing if the tag is misconfigured to an All Pages trigger)
 *      → Fire a GA4 Event tag with event name 'scroll_depth',
 *        parameter 'percent_scrolled' → {{Scroll Depth Threshold}}
 *
 *    - Outbound click trigger:
 *        Type: Click — Just Links
 *        Fire on: Click URL does not match RegEx for your domain(s)
 *        SITE-SPECIFIC: adjust the regex to match all owned domains.
 *        Single domain example:  ^https?:\/\/([\w-]+\.)?yourdomain\.com
 *        Multi-domain example:   ^https?:\/\/([\w-]+\.)?(yourdomain\.com|checkout\.yourdomain\.com|blog\.yourdomain\.com)
 *        Expose as a named pattern — do not hardcode inline.
 *      → Fire a GA4 Event tag with event name 'outbound_click',
 *        parameter 'link_url'  → {{Click URL}},
 *        parameter 'link_text' → {{Click Text}}
 *
 * 5. In GA4 Admin → Events → mark 'generate_lead' as a Conversion.
 *
 * POST-PUBLISH VALIDATION CHECKLIST:
 *   □ Update any GA4-based automated alerts or dashboard thresholds BEFORE
 *     or immediately after publish. Post-fix pageview and session counts will
 *     drop by approximately half (double-counting eliminated) — existing
 *     alert thresholds based on inflated numbers will fire as false positives.
 *   □ Annotate the publish date in GA4 (Admin → Annotations if available,
 *     or a shared doc) so pre-fix and post-fix data are not compared directly.
 *   □ GTM Preview mode: confirm exactly one GA4 pageview fires per page load.
 *   □ GTM Preview mode: confirm generate_lead fires on form submit with
 *     correct parameter values.
 *   □ GA4 DebugView: confirm events arrive without duplication.
 *   □ After 48 hours: compare GA4 Realtime session counts against Plausible
 *     (if retained) — they should be in the same order of magnitude.
 */
```

## Risks
- Historical data discontinuity: GA4 metrics collected before the fix are corrupted by double-counting. Post-fix metrics will show an apparent drop in pageviews, sessions, and engagement rate — this is the data becoming accurate, not performance degrading. Mitigation: annotate the fix date in GA4 and document that pre-fix data has inflated pageview/session counts. Do not compare pre-fix and post-fix metrics directly without this context.
- GTM container may have additional tags beyond GA4 that reference the standalone gtag.js global: if any GTM tag uses a 'Custom HTML' block that calls gtag() assuming the standalone script initialized it, that tag will break. Mitigation: before removing the standalone script, audit all GTM Custom HTML tags for direct gtag() calls. The GA4 Configuration tag inside GTM initializes its own gtag instance, so standard GA4 tags are unaffected — only custom HTML tags with direct gtag() references are at risk.
- Contact form selector assumption: the dataLayer push code uses a CSS selector (CONTACT_FORM_SELECTOR) that must match the actual form element. If the form is rendered by a third-party embed (Typeform, HubSpot, etc.) inside an iframe, the submit event listener cannot attach. Mitigation: the selector is exposed as a named constant for easy adjustment; if the form is an iframe embed, the tracking must instead use the embed platform's callback/webhook to push to dataLayer.
- Plausible removal decision: if Plausible is retained, the client has two analytics sources with different counting methodologies (GA4 session-based vs Plausible privacy-first). Minor discrepancies between them are expected and normal. If Plausible is removed without stakeholder alignment, someone who relies on its dashboard will lose access. Mitigation: confirm with all stakeholders before removing Plausible.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
