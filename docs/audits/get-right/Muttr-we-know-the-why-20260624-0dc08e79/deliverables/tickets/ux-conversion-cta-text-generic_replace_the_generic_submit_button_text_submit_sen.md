---
finding_id: "ux-conversion-cta-text-generic"
title: "Form submit button likely uses generic text — missed conversion optimization opportunity"
severity: "medium"
root_cause_cluster: "Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization"
why_this_matters: "The submit button is the final persuasion moment in the only conversion path on the site."
fix_summary: "Replace the generic submit button text ('Submit', 'Send', 'Send Message') on /contact with action-specific copy that mirrors the page's h1 value proposition ('Talk to a founder.')."
confidence_tier: "confirmed"
---

# Form submit button likely uses generic text — missed conversion optimization opportunity

**Finding:** Form submit button likely uses generic text — missed conversion optimization opportunity  
**Severity:** Medium  
**Why this matters:** The submit button is the final persuasion moment in the only conversion path on the site.  
**Root cause:** Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization  
**Fix:** Replace the generic submit button text ('Submit', 'Send', 'Send Message') on /contact with action-specific copy that mirrors the page's h1 value proposition ('Talk to a founder.').

> **Evidence Basis:** Confirmed

---

## Impact

- **Lead Form Conversion Rate:** The submit button is the final persuasion moment in the only conversion path on the site. Generic text ('Submit') signals a system action; specific text ('Talk to a Founder') confirms the user's intent and mirrors the value proposition already established by the h1. The mechanism: reducing cognitive dissonance at the moment of commitment lowers the psychological cost of clicking. This is the terminal step — no downstream funnel exists to recover a user who abandons here.
- **Wcag Compliance:** WCAG 2.4.6 (Headings and Labels, Level AA) requires that labels describe the purpose of the control. 'Submit' is a mechanical label; 'Talk to a Founder' is a purposive label. Fixing this resolves a WCAG AA violation with zero implementation cost if done via CMS field edit.
- **Seo Signal:** No direct ranking impact. Indirect: a higher-converting contact page reduces the signal of users landing and immediately leaving, which can influence engagement metrics used as ranking signals.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_008`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/contact/
**Element:** Primary form submit button — verify text is action-oriented, not generic 'Submit'
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
Replace the generic submit button text ('Submit', 'Send', 'Send Message') on /contact with action-specific copy that mirrors the page's h1 value proposition ('Talk to a founder.'). Confirm the current button text via DOM inspection before any change — this finding is a high-probability hypothesis, not a confirmed defect.

### How
1. CONFIRM DEFECT FIRST — Run DOM inspection against live /contact page to extract actual button innerText. Do not implement if button already reads conversion-aware copy.
2. Locate the submit button in the CMS form builder or template source. The CSS class signature (button::bg-accent text-on-primary) is the selector anchor — do not rely on element type alone.
3. Change button text to 'Talk to a Founder' (matches h1 exactly) or 'Send My Message' (action-confirms the user's intent). Choose based on brand voice; 'Talk to a Founder' is preferred for continuity with the h1 promise.
4. If the CMS exposes a button label field in the form builder UI, edit it there — no code change required. This is the preferred path: zero regression surface.
5. If the CMS does not expose a label field and the button is rendered by a template partial, edit the partial directly. Scope the change to the submit button selector only — do not alter surrounding form markup.
6. If the button is injected by a third-party form plugin with no label override, use the JS progressive enhancement approach in code_examples — applied only after confirming the button exists and reads generic text.
7. After change: verify the button's accessible name (aria-label or innerText) matches the new copy in a screen reader or axe DevTools scan. The button's accessible name must be descriptive — 'Talk to a Founder' passes; 'Submit' fails WCAG 2.4.6 (Headings and Labels).
8. Update the /thanks confirmation page headline to continue the narrative: 'We'll be in touch.' or 'A founder will reach out shortly.' — closes the conversion loop the button text opens.
9. Verify no automated test suite asserts on the old button text (e.g., Cypress/Playwright selectors using getByText('Submit')). Update any such selectors before deploying.

### Code examples
```
// STEP 1: DOM INSPECTION — Run this in Node.js or browser console against live /contact
// Confirms defect before any change is made.
// Precondition: page is fully rendered (run after DOMContentLoaded or via Playwright)

const SUBMIT_BUTTON_SELECTOR = 'button.bg-accent.text-on-primary[type="submit"]';

const btn = document.querySelector(SUBMIT_BUTTON_SELECTOR);
if (btn) {
  console.log('Current button text:', JSON.stringify(btn.innerText.trim()));
} else {
  console.warn('Submit button not found with selector:', SUBMIT_BUTTON_SELECTOR);
  // Fallback: inspect all submit buttons on page
  document.querySelectorAll('button[type="submit"], input[type="submit"]').forEach((el, i) => {
    console.log(`Submit element [${i}]:`, el.tagName, JSON.stringify(el.innerText?.trim() ?? el.value));
  });
}
// STEP 2A: CMS TEMPLATE EDIT (preferred path — no JS required)
// If the submit button is rendered by a Twig/Blade/Liquid/Nunjucks partial,
// locate the template and change the label value directly.
// Example: Twig partial (adapt syntax to your CMS)

{# BEFORE #}
{# <button type="submit" class="bg-accent text-on-primary">Submit</button> #}

{# AFTER — site-specific assumption: button_label is a configurable field #}
{% set CONTACT_SUBMIT_LABEL = 'Talk to a Founder' %}
<button
  type="submit"
  class="bg-accent text-on-primary"
  aria-label="{{ CONTACT_SUBMIT_LABEL }}"
>{{ CONTACT_SUBMIT_LABEL }}</button>
// STEP 2B: JS PROGRESSIVE ENHANCEMENT (fallback — only if CMS/plugin blocks template edit)
// Scoped strictly to /contact. Does not touch any other page or button.
// Preconditions:
//   - Runs only on /contact (pathname guard)
//   - Runs only if button innerText matches a known generic value (defect guard)
//   - Does NOT fire if button already reads conversion-aware copy
//   - Does NOT alter button type, class, or any attribute other than innerText
//   - No async operations — no race conditions possible

(function contactSubmitLabelEnhancement() {
  // SITE-SPECIFIC ASSUMPTION: adjust selector if class names change
  const SUBMIT_BUTTON_SELECTOR = 'button.bg-accent.text-on-primary[type="submit"]';

  // SITE-SPECIFIC ASSUMPTION: update if /contact lives at a different path
  const CONTACT_PATH = '/contact';

  // Named constants — no magic strings inline
  const GENERIC_LABELS = new Set(['submit', 'send', 'send message', 'contact us', 'go']);
  const CONVERSION_LABEL = 'Talk to a Founder';

  // Pathname guard — this script must never mutate buttons on other pages
  if (window.location.pathname.replace(/\/$/, '') !== CONTACT_PATH) {
    return;
  }

  function applyLabel() {
    const btn = document.querySelector(SUBMIT_BUTTON_SELECTOR);
    if (!btn) {
      // Button not found — selector may have changed; fail silently, log for debugging
      if (typeof console !== 'undefined') {
        console.warn('[contactSubmitLabel] Submit button not found. Selector:', SUBMIT_BUTTON_SELECTOR);
      }
      return;
    }

    const currentText = btn.innerText.trim().toLowerCase();

    // Defect guard — only mutate if button reads a known generic value
    if (!GENERIC_LABELS.has(currentText)) {
      // Button already has conversion-aware copy — finding is resolved, no action needed
      return;
    }

    // Mutation is scoped to innerText only — class, type, and all other attributes preserved
    btn.textContent = CONVERSION_LABEL;

    // Sync accessible name — aria-label takes precedence over innerText for AT
    // Only set if not already explicitly authored
    if (!btn.hasAttribute('aria-label')) {
      btn.setAttribute('aria-label', CONVERSION_LABEL);
    }
  }

  // Run after DOM is ready — no timing hacks, no arbitrary delays
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLabel, { once: true });
  } else {
    // DOMContentLoaded already fired (script loaded async/defer)
    applyLabel();
  }
}());
```

## Risks
- SELECTOR BRITTLENESS (JS path only): The selector 'button.bg-accent.text-on-primary[type="submit"]' is derived from the CSS class signature in crawl data, not from a confirmed DOM inspection. If the CMS renders the button with different classes after a theme update, the JS enhancement silently no-ops (defect guard prevents mutation of unrecognized buttons). Mitigation: prefer the CMS template edit path; if using JS, add a console.warn on selector miss so the failure is visible in staging.
- AUTOMATED TEST BREAKAGE: Any Cypress, Playwright, or Selenium test asserting getByText('Submit') or getByRole('button', { name: 'Submit' }) will fail after this change. Mitigation: audit test suite for submit button text assertions before deploying; update selectors to use data-testid or role+name matching the new label.
- TRANSLATION/LOCALIZATION: If the site adds multi-language support later, a hardcoded English string in a JS enhancement will not be picked up by i18n extraction tools. Mitigation: implement via CMS template field (localizable) rather than JS; if JS is used, document the hardcoded string in a comment flagged for i18n review.
- CONFIRMATION PAGE MISMATCH: Changing the button text without updating the /thanks page creates a narrative gap — the user clicks 'Talk to a Founder' and lands on a generic 'Thank you for your message.' confirmation. This partially undermines the conversion narrative improvement. Mitigation: treat /thanks copy update as a required companion change, not optional.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
