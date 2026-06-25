---
finding_id: "ux-form-url-field-mobile-friction"
title: "URL field in contact form adds unnecessary friction on mobile — website is rarely critical for initial contact"
severity: "medium"
root_cause_cluster: "Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization"
why_this_matters: "Removing input[type='url'] eliminates the iOS URL keyboard (no spacebar, protocol-prefix required), which is a documented motor and cognitive friction point unique to mobile."
fix_summary: "Remove the URL field from the contact form entirely."
confidence_tier: "confirmed"
---

# URL field in contact form adds unnecessary friction on mobile — website is rarely critical for initial contact

**Finding:** URL field in contact form adds unnecessary friction on mobile — website is rarely critical for initial contact  
**Severity:** Medium  
**Why this matters:** Removing input[type='url'] eliminates the iOS URL keyboard (no spacebar, protocol-prefix required), which is a documented motor and cognitive friction point unique to mobile.  
**Root cause:** Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization  
**Fix:** Remove the URL field from the contact form entirely.

> **Evidence Basis:** Confirmed

---

## Impact

- **Form Completion Rate:** Removing input[type='url'] eliminates the iOS URL keyboard (no spacebar, protocol-prefix required), which is a documented motor and cognitive friction point unique to mobile. Fewer fields directly reduces the perceived effort cost of the form. The mechanism: lower field count + standard keyboard on all remaining fields = fewer abandonment triggers at the terminal conversion point of the entire site funnel.
- **Mobile Conversion:** Every CTA on the site routes to this form. Mobile visitors encountering the URL field face a disproportionate interaction cost relative to desktop. Removing it reduces the gap between mobile and desktop completion rates by eliminating a mobile-only friction source.
- **Data Quality:** URL fields on cold-contact forms are frequently left blank, filled with placeholder values, or entered without protocol prefixes (causing validation failures). Removing the field and replacing it with email-domain enrichment yields higher-confidence company data than self-reported URLs from visitors who are motivated to minimize form effort.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_008`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/contact/
**Element:** Form input — one of 6 fields including a URL type that triggers mobile URL keyboard
**XPath:** `/html/body/main[1]/section[1]/div[1]/div[1]/form[1]/input[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("/html/body/main[1]/section[1]/div[1]/div[1]/form[1]/input[1]")`
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
Remove the URL field from the contact form entirely. Reduce the form from 6 fields to 5 (or fewer). If company context is operationally required before a founder call, capture it post-submission via an automated follow-up or enrich it from the submitter's email domain using a data enrichment tool — not by taxing the visitor at the point of first contact.

### How
1. Audit the form's backend/CRM to confirm whether the URL field value is actually consumed downstream (mapped to a CRM property, used in routing logic, or read before calls). If it is unused or rarely populated, removal has zero operational cost.
2. Remove the URL field from the form template HTML. Do not hide it with CSS — hidden fields still parse, still occupy DOM, and hidden required fields will silently block submission in some browsers.
3. If the form is rendered by a CMS form builder (e.g., Gravity Forms, HubSpot Forms, Webflow Forms), remove the field from the form definition in the CMS admin — do not patch it in the template layer, or it will reappear on the next form sync.
4. If the URL field is required at the server/CRM level (validation rule or required property), update the server-side schema to mark it optional or remove it before removing it from the HTML — removing a required field from the frontend without updating backend validation will cause silent submission failures.
5. Update any form analytics events (GTM triggers, custom dataLayer pushes) that reference the URL field by name or index — stale field references in analytics will cause tracking errors or misattributed abandonment data.
6. If company context is genuinely needed pre-call, implement one of two alternatives: (a) add a plain text 'Company' field (input[type='text'], no URL keyboard, no protocol requirement, no format validation) — lower friction, same signal; or (b) use email domain enrichment post-submission (Clearbit, Apollo, or Hunter.io) to resolve company from the submitter's email address automatically, eliminating the need to ask.
7. After removal, verify the form submits successfully end-to-end in a staging environment: submit without a URL value, confirm the CRM/backend accepts the payload, confirm the confirmation message or redirect fires correctly.
8. Re-test on a physical iOS device (not simulator) to confirm the URL keyboard no longer appears and tab order is logical across the remaining fields.

### Code examples
```
// BEFORE: URL field as it likely exists in the form template
// input[type='url'] triggers iOS URL keyboard — removes spacebar,
// requires protocol prefix (https://), high motor and cognitive cost on touchscreen.
// Remove this entire field block from the template.

/*
<div class="form-field form-field--url">
  <label for="contact-url">Website URL</label>
  <input
    type="url"
    id="contact-url"
    name="url"
    placeholder="https://yourcompany.com"
    autocomplete="url"
  />
</div>
*/

// AFTER OPTION A: Replace with a plain text Company field if company name
// is operationally useful. input[type='text'] triggers standard keyboard.
// No protocol requirement, no format validation, no spacebar removal.
// Scoped with BEM class — does not affect any other input on the page.

// HTML:
/*
<div class="form-field form-field--company">
  <label for="contact-company">Company <span class="form-field__optional">(optional)</span></label>
  <input
    type="text"
    id="contact-company"
    name="company"
    autocomplete="organization"
    aria-describedby="contact-company-hint"
  />
  <span id="contact-company-hint" class="form-field__hint">
    Helps us prepare for the conversation.
  </span>
</div>
*/

// AFTER OPTION B: Remove entirely. No replacement field.
// Post-submission enrichment via email domain (server-side, zero visitor friction).
// Example: Node.js/Express handler enriching from email domain after submission.
// Replace ENRICHMENT_API_KEY and ENRICHMENT_API_BASE_URL with your configured constants.

const ENRICHMENT_API_BASE_URL = 'https://company.clearbit.com/v2/companies/find'; // SITE-SPECIFIC: configure per enrichment provider
const ENRICHMENT_REQUEST_TIMEOUT_MS = 5000; // 5s — enrichment is non-blocking; fail fast
const ENRICHMENT_API_KEY = process.env.ENRICHMENT_API_KEY; // Never hardcode — load from environment

/**
 * Extracts the domain from a validated email address.
 * Precondition: emailAddress has already passed server-side format validation.
 * Returns null for free/consumer domains where enrichment is not meaningful.
 */
function extractCompanyDomain(emailAddress) {
  const CONSUMER_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'me.com', 'aol.com', 'protonmail.com'
  ]); // SITE-SPECIFIC: extend list as needed

  const atIndex = emailAddress.lastIndexOf('@');
  if (atIndex === -1) return null;

  const domain = emailAddress.slice(atIndex + 1).toLowerCase();
  return CONSUMER_DOMAINS.has(domain) ? null : domain;
}

/**
 * Attempts to enrich company data from email domain.
 * Non-blocking: enrichment failure does not block form submission confirmation.
 * Precondition: formPayload.email is a validated, non-empty string.
 */
async function enrichCompanyFromEmail(formPayload) {
  const domain = extractCompanyDomain(formPayload.email);
  if (!domain) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    ENRICHMENT_REQUEST_TIMEOUT_MS
  );

  try {
    const url = new URL(ENRICHMENT_API_BASE_URL);
    url.searchParams.set('domain', domain);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ENRICHMENT_API_KEY}`,
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    if (!response.ok) return null; // Enrichment unavailable — degrade gracefully

    const data = await response.json();
    return data ?? null;
  } catch (err) {
    // AbortError (timeout) or network failure — enrichment is best-effort, not critical path
    return null;
  } finally {
    clearTimeout(timeoutId); // Always clear timeout to prevent memory leak
  }
}

// Usage in form submission handler:
// Enrichment runs after submission is confirmed to CRM — never blocks the visitor's
// confirmation message. No race condition: enrichment result is written to CRM
// asynchronously as a secondary update, not as part of the initial record creation.

async function handleContactSubmission(req, res) {
  const { name, email, message, company } = req.body; // 'company' present only if Option A chosen

  // Step 1: Validate required fields server-side (name, email, message).
  // URL field is no longer in the payload — backend must not require it.
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Required fields missing.' });
  }

  // Step 2: Write lead to CRM. This must complete before responding to visitor.
  let crmRecordId;
  try {
    crmRecordId = await writeToCRM({ name, email, message, company: company ?? null });
  } catch (err) {
    return res.status(500).json({ error: 'Submission failed. Please try again.' });
  }

  // Step 3: Respond to visitor immediately — do not await enrichment.
  res.status(200).json({ success: true });

  // Step 4: Enrich asynchronously. Failure is silent to visitor.
  // No isSubmitting flag needed here — enrichment is a fire-and-update,
  // not a concurrent mutation of the same record during submission.
  enrichCompanyFromEmail({ email })
    .then((companyData) => {
      if (companyData && crmRecordId) {
        return updateCRMRecord(crmRecordId, { enrichedCompany: companyData });
      }
    })
    .catch(() => {
      // Enrichment update failure is non-critical — log for ops visibility but do not re-throw
    });
}
```

## Risks
- CRM/backend requires URL field: If the backend schema marks the URL field as required, removing it from the HTML without updating the server-side validation will cause all submissions to fail silently. Mitigation: audit and update the CRM field definition to optional before touching the template.
- Analytics breakage on field-level tracking: If GTM or custom analytics tracks field interaction by name ('url') or by field index position, removing the field will break those events or shift index-based references to the wrong fields. Mitigation: audit all form-related GTM triggers and dataLayer pushes before deployment; update or remove stale field references.
- CMS form sync overwrites template change: If the form is managed by a CMS form builder that syncs its definition to the template on publish, a template-only removal will be overwritten on the next CMS publish event. Mitigation: remove the field from the CMS form definition, not just the rendered HTML.
- Enrichment API cost and rate limits: If Option B (email domain enrichment) is implemented, enrichment API calls add per-lookup cost and are subject to rate limits. Mitigation: implement enrichment only for non-consumer domains (as shown in code), add a timeout and graceful fallback (already implemented in the code example), and monitor API usage against plan limits.
- Enrichment API key exposure: The enrichment API key must never be embedded in client-side code. The code example correctly loads it from process.env — verify the deployment environment injects this variable and that it is not committed to source control.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
