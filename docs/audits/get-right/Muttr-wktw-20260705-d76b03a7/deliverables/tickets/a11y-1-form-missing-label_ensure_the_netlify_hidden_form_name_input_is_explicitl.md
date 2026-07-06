---
finding_id: "a11y-1-form-missing-label"
title: "1 form field missing programmatic label association — screen reader users cannot identify the field"
severity: "high"
root_cause_cluster: "Contact Form Accessibility — Missing Labels and Unverified Error Handling"
why_this_matters: "Eliminates the WCAG 4.1.2 (Name, Role, Value) and 1.3.1 (Info and Relationships) violation on the contact page."
fix_summary: "Ensure the Netlify hidden form-name input is explicitly typed as hidden (type=\"hidden\"), which removes it from the accessibility tree, keyboard tab order, and visual rendering per HTML spec — elimina…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["det-wcag-missing-name-role-value-https-weknowthewhy-com-contact", "form-1-missing-label"]
---

# 1 form field missing programmatic label association — screen reader users cannot identify the field

**Finding:** 1 form field missing programmatic label association — screen reader users cannot identify the field  
**Severity:** High  
**Why this matters:** Eliminates the WCAG 4.1.2 (Name, Role, Value) and 1.3.1 (Info and Relationships) violation on the contact page.  
**Root cause:** Contact Form Accessibility — Missing Labels and Unverified Error Handling  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Ensure the Netlify hidden form-name input is explicitly typed as hidden (type="hidden"), which removes it from the accessibility tree, keyboard tab order, and visual rendering per HTML spec — elimina…  

> **Evidence Basis:** Confirmed

---

## Also resolves (2)

One fix closes the findings below — they were folded here as the same remediation:

- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` (Medium) — Missing name/role/value [WCAG]
- `form-1-missing-label` (Medium) — Contact form has 1 field missing a programmatic label — accessibility and conversion barrier

## Impact

- **Accessibility Compliance:** Eliminates the WCAG 4.1.2 (Name, Role, Value) and 1.3.1 (Info and Relationships) violation on the contact page. Screen reader users will no longer encounter an unidentifiable input field before the actual form fields, removing confusion that can cause form abandonment.
- **Form Conversion:** The contact form is the sole conversion mechanism on /contact/. If the unlabeled input is currently rendering as a visible empty text box (type defaulting to 'text'), it creates a confusing visual artifact that sighted users must skip — removing it eliminates a friction point in the form flow. For keyboard-only users, removing a dead tab stop reduces the interaction cost to reach the first real field.
- **Legal Liability:** Unlabeled form inputs are a common target in ADA web accessibility demand letters. Fixing this removes one concrete, machine-detectable violation from the site's legal surface area.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_006`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/contact
**Element:** First form input — missing programmatic label association
**XPath:** `//*[@id='main-content']/section[1]/div[1]/div[1]/form[1]/input[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id='main-content']/section[1]/div[1]/div[1]/form[1]/input[1]")`
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
Ensure the Netlify hidden form-name input is explicitly typed as hidden (type="hidden"), which removes it from the accessibility tree, keyboard tab order, and visual rendering per HTML spec — eliminating the WCAG 4.1.2 and 1.3.1 violation without breaking Netlify form submission.

### How
1. Open the Astro component file containing the contact form (likely src/pages/contact.astro or a component imported by it, e.g., src/components/ContactForm.astro).
2. Locate the first <input> inside the <form> element — the one carrying name="form-name".
3. Confirm its current state: if it lacks a type attribute entirely, or has type="text", it defaults to a visible, focusable, unlabeled text input. This is the bug.
4. Set type="hidden" on that input. Do NOT add aria-hidden="true" as a substitute — aria-hidden does not remove an element from tab order, so keyboard users would still focus an invisible unlabeled field.
5. Verify the input's value attribute matches the form's name attribute (Netlify requires this parity for routing).
6. Build locally with `astro build` and confirm the rendered HTML output in dist/ contains <input type="hidden" name="form-name" value="...">.
7. Deploy to Netlify preview, submit a test form, and confirm the submission appears in the Netlify Forms dashboard.
8. Run a screen reader pass (VoiceOver + Safari or NVDA + Firefox) on the contact form: the hidden input must not be announced. Tab through the form: focus must land on the first visible field, not an empty unlabeled input.

### Code examples
```
---
/* src/pages/contact.astro (or wherever the contact form lives) */
/* SITE-SPECIFIC ASSUMPTION: form name is "contact" — adjust to match your Netlify form name */
const NETLIFY_FORM_NAME = "contact";
---

<form
  name={NETLIFY_FORM_NAME}
  method="POST"
  data-netlify="true"
>
  <!-- Netlify routing input: type="hidden" ensures it is excluded from
       the accessibility tree, tab order, and visual rendering per HTML spec.
       The value MUST match the form's name attribute for Netlify to route submissions. -->
  <input type="hidden" name="form-name" value={NETLIFY_FORM_NAME} />

  <label for="contact-name">Name</label>
  <input type="text" id="contact-name" name="name" required aria-required="true" />

  <label for="contact-email">Email</label>
  <input type="email" id="contact-email" name="email" required aria-required="true" />

  <!-- SITE-SPECIFIC ASSUMPTION: remaining fields are company/subject and phone/topic.
       Adjust field names, types, and labels to match your actual form. -->
  <label for="contact-subject">Subject</label>
  <input type="text" id="contact-subject" name="subject" />

  <label for="contact-message">Message</label>
  <textarea id="contact-message" name="message" required aria-required="true"></textarea>

  <button type="submit">Send</button>
</form>
```

## Risks
- If the input already has type="hidden" and the audit tool false-flagged it, this change is a no-op — verify the current markup before deploying. No harm if applied redundantly.
- If the form name value in the hidden input does not exactly match the <form name="..."> attribute after the change, Netlify will silently drop submissions. Mitigation: the code example uses a single NETLIFY_FORM_NAME constant for both, making mismatch impossible. Test with a real submission post-deploy.
- If the developer originally omitted type="hidden" intentionally (e.g., debugging), removing visibility could mask future Netlify routing issues. Mitigation: Netlify's Forms dashboard shows submission counts — monitor after deploy.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
