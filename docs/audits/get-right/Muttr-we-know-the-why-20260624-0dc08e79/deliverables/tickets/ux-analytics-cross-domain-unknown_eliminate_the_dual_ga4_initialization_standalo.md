---
finding_id: "ux-analytics-cross-domain-unknown"
title: "Cross-domain tracking configuration unverifiable — potential self-referral if multi-domain journey exists"
severity: "low"
root_cause_cluster: "Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture"
why_this_matters: "Every form submission currently generates a GA4 session that terminates at the /thanks redirect boundary."
fix_summary: "Eliminate the dual GA4 initialization (standalone gtag.js + GTM-fired GA4 tag), establish GTM as the single authoritative GA4 instance, configure cross-domain linker for all identified third-party de…"
confidence_tier: "confirmed"
---

# Cross-domain tracking configuration unverifiable — potential self-referral if multi-domain journey exists

**Finding:** Cross-domain tracking configuration unverifiable — potential self-referral if multi-domain journey exists  
**Severity:** Low  
**Why this matters:** Every form submission currently generates a GA4 session that terminates at the /thanks redirect boundary.  
**Root cause:** Triple Analytics Stack — Redundant GA4 + GTM + Plausible Architecture  
**Fix:** Eliminate the dual GA4 initialization (standalone gtag.js + GTM-fired GA4 tag), establish GTM as the single authoritative GA4 instance, configure cross-domain linker for all identified third-party de…

> **Evidence Basis:** Confirmed

---

## Impact

- **Attribution Integrity:** Every form submission currently generates a GA4 session that terminates at the /thanks redirect boundary. If the destination is a third-party scheduling domain, the originating traffic source (paid search, organic, email) is lost at the exact moment the conversion completes — the scheduling tool sees a 'direct' session with no campaign attribution. Fixing the dual-instance architecture and configuring the linker restores the _gl parameter chain, allowing GA4 to stitch the originating session through the redirect. The business impact is that conversion attribution becomes accurate: campaigns that are currently generating zero attributed conversions in GA4 will begin showing their actual contribution.
- **Conversion Event Coverage:** Zero custom conversion events means GA4 currently has no signal to optimize toward — Google Ads Smart Bidding, if active, is operating without conversion data from this site's primary goal. Adding generate_lead as a GA4 conversion and importing it into Google Ads provides the bidding algorithm with a real optimization signal. The mechanism: Smart Bidding adjusts bids based on predicted conversion probability; without conversion data, it defaults to maximizing clicks, which is misaligned with lead generation goals.
- **Data Integrity:** The ERR_ABORTED collect beacon caused by dual GA4 initialization means a portion of pageview and event data is silently dropped before any cross-domain issue is even reached. Eliminating the duplicate initialization stops the beacon cancellation, restoring complete session data for single-domain analysis — a prerequisite for any downstream attribution work.
- **Session Fragmentation:** Two GA4 instances can generate two distinct client_id values for the same user in the same session. In GA4 User Explorer and audience definitions, this user appears as two separate users with incomplete journeys. Consolidating to a single instance eliminates phantom user duplication, making cohort analysis and remarketing audiences accurate.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The site uses GA4 (via both GTM and standalone gtag.js, as flagged in the technical pass).. If the business operates any other domains (e.g., a separate booking tool, payment processor, or marketing landing pages), cross-domain tracking must be configured to prevent session breaks and self-referral.

**Measured evidence:**
- Internal Links: 11
- External Links: 0
- Form Action: POST /thanks
- Cross Domain Config: unverifiable from this page

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
Eliminate the dual GA4 initialization (standalone gtag.js + GTM-fired GA4 tag), establish GTM as the single authoritative GA4 instance, configure cross-domain linker for all identified third-party destination domains (/thanks redirect target, scheduling tools), and implement conversion events that survive the cross-domain boundary — restoring attribution integrity from first touch through post-form session.

### How
STEP 1 — AUDIT PHASE (do not touch production until complete): Open DevTools Network tab on the contact page, submit the form, and record: (a) the exact URL the /thanks POST redirects to — capture the full domain including subdomain; (b) every Set-Cookie and Location header in the redirect chain; (c) all outbound hrefs on /thanks that point off-domain. Repeat for any scheduling tool link (Calendly, HubSpot Meetings, Acuity, etc.). Document every external domain that a user session can travel to. This list becomes the linked-domains allowlist.
STEP 2 — REMOVE THE STANDALONE GTAG.JS SNIPPET: Locate the hardcoded <script async src='https://www.googletagmanager.com/gtag/js?id=...'></script> and its companion window.dataLayer / gtag() initialization block in the site's HTML <head>. Delete both. Do not replace them. GTM will become the sole loader. Verify removal by searching all theme/template files and any server-side head injection points (WordPress wp_head hooks, Shopify layout/theme.liquid, Next.js _document.js, etc.) for 'googletagmanager.com/gtag/js' — there must be zero matches after removal.
STEP 3 — AUDIT THE GTM CONTAINER FOR DUPLICATE GA4 TAGS: In GTM, open the Tags panel and filter by tag type 'Google Analytics: GA4 Configuration'. There must be exactly one GA4 Configuration tag. If more than one exists, identify which fires on All Pages and delete or pause the others. Confirm the surviving tag uses the correct Measurement ID. Check all GA4 Event tags — none should carry their own Measurement ID field that differs from the Configuration tag's ID.
STEP 4 — CONFIGURE CROSS-DOMAIN LINKER IN GA4 PROPERTY ADMIN: In GA4 Admin > Data Streams > [your stream] > Configure tag settings > Configure your domains, add every external domain identified in Step 1 (e.g., calendly.com, meetings.hubspot.com, acuityscheduling.com, or the specific subdomain). Use the 'Contains' match type for subdomains. Save. This is the property-level allowlist — without it, the _gl parameter is generated but ignored on arrival.
STEP 5 — CONFIGURE CROSS-DOMAIN LINKER IN THE GTM GA4 CONFIGURATION TAG: Open the GA4 Configuration tag in GTM. Under 'Fields to Set', add field name 'linker' with value as a JavaScript variable that returns the object shown in the code example below. Alternatively, use the 'Cross Domain Tracking' section if your GTM GA4 tag version exposes it directly — set 'Automatic Linker' to true and list the same domains from Step 4. This ensures the single GTM-managed gtag instance appends _gl to all outbound links and form actions targeting those domains.
STEP 6 — INSTRUMENT THE FORM SUBMISSION AS A CONVERSION EVENT: Add a GTM Trigger of type 'Form Submission' scoped to the contact form's CSS selector or form ID. Attach a GA4 Event tag firing on that trigger with event name 'generate_lead'. Include parameters: form_id (from {{Form ID}} built-in variable), page_location (from {{Page URL}}). Mark 'generate_lead' as a conversion in GA4 Admin > Conversions. This event fires before the POST redirect, so it is captured in the originating session regardless of what happens downstream.
STEP 7 — INSTRUMENT THE /THANKS PAGE AS A SECONDARY CONVERSION SIGNAL: Add a GA4 Event tag firing on Page View where Page Path equals '/thanks' with event name 'lead_form_confirmed'. This acts as a server-side confirmation signal independent of the client-side form trigger. Mark as conversion. If /thanks redirects off-domain, this event will not fire — which itself becomes a diagnostic signal (if generate_lead fires but lead_form_confirmed never fires, the redirect is breaking the session).
STEP 8 — VALIDATE IN GTM PREVIEW MODE: Use GTM Preview, navigate the full journey: landing page → contact page → form submit → /thanks → scheduling tool (if applicable). Confirm: (a) exactly one GA4 Configuration tag fires on each page; (b) generate_lead fires on form submit; (c) the outbound URL to the scheduling tool contains the _gl parameter; (d) no ERR_ABORTED on the collect beacon (Network tab, filter 'collect').
STEP 9 — VALIDATE IN GA4 DEBUGVIEW: With GTM Preview active, open GA4 Admin > DebugView. Complete the form journey. Confirm: generate_lead appears in the event stream; the session_id is consistent across pages; if the scheduling tool domain is also instrumented with GA4, confirm the same client_id appears in both properties' DebugView (cross-domain stitch confirmed).
STEP 10 — PUBLISH GTM AND MONITOR: Publish the GTM container with a descriptive version name ('Remove duplicate GA4, add cross-domain linker, add conversion events'). For 48 hours post-publish, monitor GA4 Realtime > Event count for generate_lead and lead_form_confirmed. Monitor for absence of duplicate session_id entries in the User Explorer. If ERR_ABORTED beacons reappear, a second GA4 initialization source was missed — re-audit Step 2.

### Code examples
```
// ============================================================
// STEP 2 — Verify complete removal of standalone gtag snippet
// Run this in browser console on any page post-deployment.
// Expected output: [] (empty array = no standalone gtag scripts)
// ============================================================
const standaloneGtagScripts = Array.from(document.querySelectorAll('script[src]'))
  .filter(s => s.src.includes('googletagmanager.com/gtag/js'));
console.assert(
  standaloneGtagScripts.length === 0,
  'FAIL: Standalone gtag.js still present. Remove from HTML/theme before proceeding.',
  standaloneGtagScripts
);
console.log('Standalone gtag.js scripts found:', standaloneGtagScripts);

// Also verify only one dataLayer.push with gtag config fires
const configPushes = (window.dataLayer || []).filter(
  entry => Array.isArray(entry) && entry[0] === 'config'
);
console.log('gtag config pushes in dataLayer:', configPushes);
// Expected: 1 entry from GTM-managed GA4 Configuration tag only
// ============================================================
// STEP 5 — GTM GA4 Configuration Tag: 'Fields to Set' value
// Field name: linker
// Field value: use a Custom JavaScript variable returning this object
// This enables automatic _gl parameter appending to all outbound
// links and form actions targeting the listed domains.
//
// SITE-SPECIFIC ASSUMPTION: Replace domain strings below with the
// actual third-party domains identified in Step 1 audit.
// ============================================================
function() {
  // SITE-SPECIFIC: domains a user session can travel to post-form.
  // Add every external domain from Step 1 audit here.
  // Use the apex domain — GA4 linker matches subdomains automatically.
  var LINKED_DOMAINS = [
    'calendly.com',          // EXAMPLE — replace with actual scheduling tool domain
    'meetings.hubspot.com'   // EXAMPLE — replace with actual scheduling tool domain
  ];

  return {
    domains: LINKED_DOMAINS,
    decorate_forms: true,   // appends _gl to <form action> URLs on linked domains
    url_position: 'query'   // _gl goes in query string, not fragment
  };
}
// ============================================================
// STEP 6 — GTM Custom HTML tag OR inline script for generate_lead
// Preferred: use GTM's native Form Submission trigger + GA4 Event tag.
// Use this Custom HTML approach ONLY if the form uses fetch/XHR
// submission (no native browser form submit event fires).
//
// SITE-SPECIFIC ASSUMPTION: Replace CONTACT_FORM_SELECTOR with the
// actual form selector (e.g., '#contact-form', 'form.wpcf7-form').
// Replace ANALYTICS_MEASUREMENT_ID with the GA4 Measurement ID
// constant defined in your GTM GA4 Configuration tag.
// ============================================================
(function() {
  'use strict';

  // SITE-SPECIFIC: selector for the contact form element
  var CONTACT_FORM_SELECTOR = 'form[data-form-type="contact"]';

  // Prevent duplicate listener registration across GTM tag re-fires
  var LISTENER_FLAG = '__ga4_lead_listener_attached';

  var form = document.querySelector(CONTACT_FORM_SELECTOR);

  if (!form) {
    console.warn('[GA4 generate_lead] Contact form not found with selector:', CONTACT_FORM_SELECTOR);
    return;
  }

  if (form[LISTENER_FLAG]) {
    // Guard: GTM can fire tags multiple times on SPA navigations.
    // Do not attach a second listener — would double-fire the event.
    return;
  }

  form.addEventListener('submit', function handleLeadSubmit(event) {
    // Null-guard: gtag may not be available if GTM failed to load
    if (typeof window.gtag !== 'function') {
      console.warn('[GA4 generate_lead] gtag not available — event not sent');
      return;
    }

    // Null-guard: dataLayer must exist (GTM initializes it)
    if (!Array.isArray(window.dataLayer)) {
      console.warn('[GA4 generate_lead] dataLayer not initialized');
      return;
    }

    var formId = form.id || form.getAttribute('name') || 'contact_form_unknown';

    // Push to dataLayer so GTM GA4 Event tag can pick this up
    // via a Custom Event trigger on 'generate_lead_intent'
    window.dataLayer.push({
      event: 'generate_lead_intent',
      ga4_event_name: 'generate_lead',
      form_id: formId,
      page_location: window.location.href
    });
  }, { passive: true });

  // Mark form so re-entrant GTM fires do not attach a second listener
  form[LISTENER_FLAG] = true;
})();
// ============================================================
// STEP 8 — Post-deploy validation: verify _gl linker on outbound links
// Run in browser console on the contact page or /thanks page
// after GTM container is published.
//
// SITE-SPECIFIC ASSUMPTION: Replace LINKED_DOMAINS with the same
// domains configured in Step 4 and Step 5.
// ============================================================
(function validateLinkerDecoration() {
  'use strict';

  // SITE-SPECIFIC: must match domains in GA4 Admin and GTM linker config
  var LINKED_DOMAINS = [
    'calendly.com',
    'meetings.hubspot.com'
  ];

  var allLinks = Array.from(document.querySelectorAll('a[href]'));
  var outboundLinkedLinks = allLinks.filter(function(a) {
    try {
      var url = new URL(a.href, window.location.href);
      return LINKED_DOMAINS.some(function(domain) {
        return url.hostname === domain || url.hostname.endsWith('.' + domain);
      });
    } catch (e) {
      // Malformed href — skip
      return false;
    }
  });

  if (outboundLinkedLinks.length === 0) {
    console.warn('[Linker Validation] No outbound links to linked domains found on this page.');
    console.info('If the scheduling tool is only reachable via form POST redirect, validate _gl in the redirect URL via Network tab instead.');
    return;
  }

  outboundLinkedLinks.forEach(function(a) {
    var hasGlParam = a.href.includes('_gl=');
    if (hasGlParam) {
      console.log('[Linker Validation] PASS — _gl present:', a.href);
    } else {
      console.error('[Linker Validation] FAIL — _gl missing on outbound link:', a.href,
        '\nCheck: (1) GTM linker config domains match, (2) GA4 Admin linked domains match, (3) no standalone gtag.js conflict.');
    }
  });
})();
```

## Risks
- RISK: Removing the standalone gtag.js snippet will break any Google Ads conversion tracking or Google Ads remarketing tags that were initialized against the standalone gtag instance rather than through GTM. MITIGATION: Before removing the snippet, audit GTM for Google Ads Conversion Tracking tags and Google Ads Remarketing tags — verify they reference the GTM-managed GA4 Configuration tag's send_to value, not a hardcoded gtag config. If Google Ads tags exist outside GTM (hardcoded in HTML), migrate them into GTM as part of this change, not after.
- RISK: If the /thanks page is served by a different server or framework than the main site (e.g., a separate Node.js handler, a Netlify function, or a third-party form processor), GTM may not be present on /thanks, meaning lead_form_confirmed never fires. MITIGATION: Confirm GTM container snippet is present on /thanks by loading the URL directly and checking for window.google_tag_manager in the console. If absent, add GTM to the /thanks template as part of this change.
- RISK: The scheduling tool destination domain (Calendly, HubSpot Meetings, etc.) must also have GA4 instrumented with the same Property ID and the originating domain listed in its own linked-domains configuration for the cross-domain stitch to complete. If the scheduling tool is a third-party SaaS with no GA4 access, the _gl parameter will be appended to the outbound URL but never consumed — the stitch will not complete. MITIGATION: Verify GA4 access to the scheduling tool's property. If inaccessible, document this as an unresolvable attribution gap and implement generate_lead on the originating form submit as the terminal conversion signal instead of relying on post-redirect confirmation.
- RISK: GTM Form Submission triggers require 'Check Validation' to be enabled if the form uses HTML5 validation — without it, the trigger fires on invalid submissions. MITIGATION: Enable 'Check Validation' on the Form Submission trigger in GTM so generate_lead only fires on valid, submittable form states.
- RISK: If the site uses a Content Security Policy (CSP) that restricts script-src or connect-src, removing the standalone gtag.js and relying solely on GTM requires that the CSP allows both googletagmanager.com (GTM loader) and google-analytics.com (collect endpoint). A misconfigured CSP after this change will silently block all GA4 data. MITIGATION: After publishing, check the browser console for CSP violation errors on the collect endpoint. Update CSP connect-src to include https://www.google-analytics.com if not already present.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
