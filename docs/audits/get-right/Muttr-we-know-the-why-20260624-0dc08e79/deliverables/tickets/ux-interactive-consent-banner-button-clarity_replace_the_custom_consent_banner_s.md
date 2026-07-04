---
finding_id: "ux-interactive-consent-banner-button-clarity"
title: "Consent banner buttons may lack clear visual hierarchy — accept vs decline distinction unclear"
severity: "medium"
root_cause_cluster: "Pre-Consent Tracking and Consent Mechanism Failures"
why_this_matters: "A confusing consent banner delays page interaction."
fix_summary: "Replace the custom consent banner's visually identical button pair with a WCAG 2.5.8-compliant, hierarchically differentiated accept/decline implementation that: (1) enforces 48px minimum touch targe…"
confidence_tier: "confirmed"
---

# Consent banner buttons may lack clear visual hierarchy — accept vs decline distinction unclear

**Finding:** Consent banner buttons may lack clear visual hierarchy — accept vs decline distinction unclear  
**Severity:** Medium  
**Why this matters:** A confusing consent banner delays page interaction.  
**Root cause:** Pre-Consent Tracking and Consent Mechanism Failures  
**Fix:** Replace the custom consent banner's visually identical button pair with a WCAG 2.5.8-compliant, hierarchically differentiated accept/decline implementation that: (1) enforces 48px minimum touch targe…

> **Evidence Basis:** Confirmed

---

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_002`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/the-get-right/platform/
**Element:** Consent decline button — same CSS class as accept, potentially indistinguishable
**XPath:** `//*[@id='consent-decline']`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id='consent-decline']")`
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
Replace the custom consent banner's visually identical button pair with a WCAG 2.5.8-compliant, hierarchically differentiated accept/decline implementation that: (1) enforces 48px minimum touch targets, (2) applies primary/ghost visual hierarchy so accept and decline are unambiguously distinct, (3) gates all tracking script injection behind a verified consent signal, (4) persists consent state with correct cookie attributes, and (5) exposes a re-consent UI so users can revise their choice — eliminating the dark pattern classification risk and making collected consent signals legally defensible under GDPR Article 7.

### How
STEP 1 — AUDIT EXISTING BANNER MOUNT POINT. Locate the element that renders the consent banner in the DOM (typically a fixed/sticky container injected by a global layout component or <script> in <body>). Identify: (a) the exact selector or component reference, (b) whether tracking scripts are already loaded before banner interaction (pre-consent firing = separate remediation), (c) the current cookie name and attributes used to store consent. Do not proceed to Step 2 until pre-consent script firing is confirmed absent or separately remediated — fixing the button UI while tracking fires unconditionally does not resolve legal exposure.
STEP 2 — DEFINE THE CONSENT COOKIE CONTRACT. Establish a single named constant for the cookie name, version, and TTL. Version the cookie so that if the consent UI changes materially, existing consents are invalidated and re-collected. Set SameSite=Strict, Secure, and a 13-month max-age (ICO/CNIL guidance ceiling for consent persistence). HttpOnly is intentionally omitted — client JS must read this cookie to gate script injection.
STEP 3 — REPLACE BUTTON MARKUP. Swap both buttons to use semantically distinct classes: a filled primary class for 'Accept' and a bordered ghost class for 'Decline'. Apply explicit min-height: 48px and min-width: 48px to both. Ensure DOM order is Decline → Accept (or neutral → affirmative) so that keyboard tab order does not nudge toward acceptance. Add aria-label to each button that includes the consequence ('Accept all cookies', 'Decline non-essential cookies'). Add role='dialog', aria-modal='true', aria-labelledby pointing to the banner heading, and aria-describedby pointing to the policy summary.
STEP 4 — IMPLEMENT CONSENT STATE MACHINE. The banner must have exactly three states: PENDING (no decision), ACCEPTED, DECLINED. State transitions are one-way per session (no re-prompt after decision until cookie expires or version changes). On ACCEPTED: write cookie, dispatch a custom 'consent:accepted' event on window, then and only then inject or unblock tracking scripts. On DECLINED: write cookie with declined value, dispatch 'consent:declined', ensure no tracking scripts are injected. Never inject tracking scripts before state resolves to ACCEPTED.
STEP 5 — IMPLEMENT RE-CONSENT ENTRY POINT. Add a persistent 'Cookie Preferences' link in the site footer (visible on every page) that clears the consent cookie and re-renders the banner. This satisfies the GDPR right to withdraw consent and eliminates the 'no recovery path' failure identified in the root cause. The link must be keyboard-reachable and have sufficient contrast.
STEP 6 — REMOVE BANNER FROM PRIVACY POLICY PAGE OR DEFER IT. The circular consent UX (banner blocking the policy page) must be resolved. Two acceptable approaches: (a) suppress the banner on /privacy-policy (or equivalent) and show a non-blocking notice instead, or (b) make the banner non-modal on that page so users can scroll the policy before deciding. Do not gate the privacy policy behind a consent wall.
STEP 7 — VALIDATE CONTRAST RATIOS. The accept button's filled background + white text must meet 4.5:1 WCAG AA. The decline button's border + text must meet 4.5:1 against the banner background. Run both through a contrast checker before shipping. The specific color values below are site-specific assumptions — replace with brand tokens.
STEP 8 — SCOPE THE CHANGE. The new CSS classes must be namespaced (e.g., .consent-banner__*) and must not use bare element selectors. The JS must be isolated to the banner component and must not attach global event listeners that persist after the banner is dismissed. All observers and listeners must be torn down on banner removal.

### Code examples
```
(No code example provided.)
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
