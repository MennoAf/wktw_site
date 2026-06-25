---
finding_id: "a11y-3-form-missing-label"
title: "Form input missing programmatic label — likely honeypot field requires proper ARIA hiding (WCAG 1.3.1)"
severity: "medium"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: "Screen reader users currently encounter an unlabeled input as the first field in the form."
fix_summary: "Apply the complete honeypot accessibility hiding pattern to the unlabeled input at the start of the contact form: make it invisible to assistive technology (aria-hidden, tabindex=-1), prevent autofil…"
confidence_tier: "confirmed"
---

# Form input missing programmatic label — likely honeypot field requires proper ARIA hiding (WCAG 1.3.1)

**Finding:** Form input missing programmatic label — likely honeypot field requires proper ARIA hiding (WCAG 1.3.1)  
**Severity:** Medium  
**Why this matters:** Screen reader users currently encounter an unlabeled input as the first field in the form.  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Apply the complete honeypot accessibility hiding pattern to the unlabeled input at the start of the contact form: make it invisible to assistive technology (aria-hidden, tabindex=-1), prevent autofil…

> **Evidence Basis:** Confirmed

---

## Impact

- **Form Completion Rate:** Screen reader users currently encounter an unlabeled input as the first field in the form. This creates immediate confusion — users hear an unidentified text input, cannot determine its purpose, and may abandon the form or fill it incorrectly. Removing this barrier eliminates a direct abandonment trigger for assistive technology users.
- **Legitimate Submission Recovery:** Browser autofill populating the honeypot field causes the server-side spam check to silently reject legitimate submissions. Users receive no error feedback — their submission simply disappears. Adding autocomplete='off' prevents this silent data loss. The volume of affected submissions depends on how aggressively browsers autofill the current field name, but any field named similarly to common form fields (name, email, etc.) will be autofilled frequently.
- **Legal Liability Reduction:** Missing programmatic labels on form inputs are a well-documented WCAG 1.3.1 violation. ADA web accessibility lawsuits are common and well-documented, particularly targeting forms that exclude screen reader users. This fix eliminates one concrete violation from the site's legal exposure surface.
- **Seo Accessibility Signal:** Google uses accessibility as a quality signal. Fixing WCAG violations contributes to overall page quality assessment, though the impact of any single fix is indirect and incremental.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/contact/
**Element:** First form input — missing <label> association. If honeypot: needs aria-hidden='true' and tabindex='-1'. If visible: needs associated <label>.
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
Apply the complete honeypot accessibility hiding pattern to the unlabeled input at the start of the contact form: make it invisible to assistive technology (aria-hidden, tabindex=-1), prevent autofill from poisoning it (autocomplete='off'), and add a visually-hidden label as a fallback safety net. This prevents screen reader confusion, keyboard trap, and legitimate submission rejection from autofill triggering the honeypot.

### How
1. Locate the honeypot input in the contact form template. It is the first <input type='text'> child of the <form> at XPath /html/body/main[1]/section[1]/div[1]/div[1]/form[1]/input[1]. Confirm it is the honeypot by verifying: (a) it has no associated <label>, (b) it precedes the semantically labeled fields, (c) it is visually hidden via CSS. 2. Wrap the input in a <div> that carries aria-hidden='true'. This removes the entire subtree from the accessibility tree, which is more resilient than putting aria-hidden on the input alone (if the input is ever wrapped in additional markup during CMS updates, the div container still hides it). 3. On the input itself, set tabindex='-1' to remove it from keyboard tab order. Set autocomplete='off' to prevent browser autofill from populating it. Set name to something that does not resemble a real field name — avoid 'name', 'email', 'phone', 'address'. A name like 'website' or 'url' is conventional for honeypots because bots tend to fill URL fields. 4. Add a visually-hidden <label> associated with the input via for/id. This is a defense-in-depth measure: if aria-hidden is ever accidentally removed, the input still has a programmatic label and does not violate WCAG 1.3.1. The label text should be instructional (e.g., 'Do not fill this field') so any human who encounters it knows to leave it empty. 5. Verify the existing CSS hiding mechanism uses a visually-hidden pattern (position:absolute; clip or clip-path; dimensions) rather than display:none. If display:none is used, the honeypot is already hidden from bots that parse CSS — which defeats its purpose. The recommended pattern uses position:absolute with clip-path to be invisible to humans but present in the DOM for bots. 6. Search the entire codebase for reuse of this honeypot pattern (grep for the input's name attribute, or for form inputs without labels). Apply the same fix to any other instances (newsletter signup, quote request, etc.). 7. Test: (a) Submit the form with the honeypot empty — should succeed. (b) Submit with the honeypot filled — should be rejected as spam. (c) Run a screen reader (VoiceOver/NVDA) through the form — the honeypot input must not be announced. (d) Tab through the form with keyboard — the honeypot must be skipped. (e) Open the form in a browser with autofill enabled and saved form data — the honeypot must not be auto-populated.

### Code examples
```
<!-- HONEYPOT FIELD — COMPLETE ACCESSIBILITY HIDING PATTERN -->
<!-- Place this as the first child inside the <form> element, before real fields -->

<!--
  SITE-SPECIFIC ASSUMPTIONS:
  - Honeypot field name: 'website' (configurable — must match server-side validation)
  - Form ID/selector: update 'hp-contact' prefix if form is reused with different IDs
  - CSS class 'hp-visually-hidden' must be defined (see CSS below)
-->

<!-- The aria-hidden on the wrapper removes the entire subtree from the accessibility tree.
     This is more resilient than aria-hidden on the input alone because it survives
     markup changes inside the wrapper. -->
<div aria-hidden="true" class="hp-visually-hidden">
  <label for="hp-contact-website">Do not fill this field</label>
  <input
    type="text"
    id="hp-contact-website"
    name="website"
    tabindex="-1"
    autocomplete="off"
    value=""
  />
</div>

<!--
  CSS — add to the form component stylesheet.
  Uses clip-path for visual hiding while keeping the element in the DOM for bots.
  display:none would hide it from bots too, defeating the honeypot purpose.
  Scoped to .hp-visually-hidden to avoid collisions with other visually-hidden utilities.
-->
<style>
  .hp-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    /* Fallback for browsers without clip-path support (<2%) */
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
```

## Risks
- If the honeypot field's name attribute is changed from its current value to 'website', the server-side validation must also be updated to check the new field name. Mitigation: before deploying the HTML change, confirm the server-side handler checks the correct field name. Deploy server-side and client-side changes together.
- If the existing CSS hiding uses display:none and the fix switches to the clip-path visually-hidden pattern, the honeypot becomes visible in the DOM to bots that previously ignored it (because display:none hid it from their parsers too). This is actually the desired behavior for a honeypot — but if the server-side spam check was not actually functional (dead code), switching to a visible-to-bots pattern could surface that the spam rejection logic is broken. Mitigation: test the honeypot rejection path (fill the field, submit, verify rejection) before deploying.
- Adding autocomplete='off' is respected by most browsers but Chrome may ignore it on fields with names matching common autofill heuristics. Using a non-standard name like 'website' (rather than 'name' or 'email') reinforces the autocomplete='off' directive because Chrome's heuristic matching is weaker on non-standard field names.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
