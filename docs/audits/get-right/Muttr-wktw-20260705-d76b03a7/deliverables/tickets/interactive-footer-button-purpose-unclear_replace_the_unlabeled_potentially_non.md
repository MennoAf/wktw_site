---
finding_id: "interactive-footer-button-purpose-unclear"
title: "Footer button with no accessible name or visible label — unclear purpose and potential dead zone"
severity: "medium"
root_cause_cluster: "Consent Infrastructure Failure — Banner Present but Non-Functional"
why_this_matters: "Resolves a WCAG 2.1 Level A violation (SC 4.1.2: Name, Role, Value) present on 100% of pages."
fix_summary: "Replace the unlabeled, potentially non-functional footer consent re-trigger button with an accessible, functional 'Cookie Settings' button that correctly invokes the consent management UI — or, if no…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["a11y-icon-links-empty-accessible-name-svg"]
---

# Footer button with no accessible name or visible label — unclear purpose and potential dead zone

**Finding:** Footer button with no accessible name or visible label — unclear purpose and potential dead zone  
**Severity:** Medium  
**Why this matters:** Resolves a WCAG 2.1 Level A violation (SC 4.1.2: Name, Role, Value) present on 100% of pages.  
**Root cause:** Consent Infrastructure Failure — Banner Present but Non-Functional  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Replace the unlabeled, potentially non-functional footer consent re-trigger button with an accessible, functional 'Cookie Settings' button that correctly invokes the consent management UI — or, if no…  

> **Evidence Basis:** Confirmed

---

## Also resolves (1)

One fix closes the findings below — they were folded here as the same remediation:

- `a11y-icon-links-empty-accessible-name-svg` (Medium) — Add accessible names to all 9 icon-only links and simultaneously resolve the overlapping touch target failures. Each link currently computes an empty accessible name because its only content is an inline SVG (no <title>), an icon font glyph (<i> or <span> with a Unicode character), or a background-image icon with no child text — all of which contribute zero text to the browser's accessible name computation. The fix has three structural variants depending on element type, plus a mandatory touch target remediation that must be applied in the same pass. The footer button missing an aria-label (a11y-footer-button-missing-aria-label) shares the same root cause and must be fixed in the same template edit.

## Impact

- **Accessibility Compliance:** Resolves a WCAG 2.1 Level A violation (SC 4.1.2: Name, Role, Value) present on 100% of pages. Unlabeled interactive elements are among the most commonly cited failures in ADA web accessibility complaints. Fixing this removes one vector of legal exposure across the entire site.
- **Consent Infrastructure:** If the button is wired to a functional CMP, users regain the ability to modify consent preferences post-dismissal — a requirement under GDPR Article 7(3) and the ePrivacy Directive. Without a working re-trigger, the site has no mechanism for consent withdrawal, which is a regulatory compliance gap.
- **Crawl Efficiency:** Removing or properly labeling the button eliminates a dead interactive zone that screen readers announce without context, reducing noise in assistive technology navigation and preventing search engine quality signals from flagging unexplained interactive elements.
- **User Trust:** A visible 'Cookie Settings' label in the footer signals privacy transparency. The mechanism is direct: users who want to adjust tracking preferences can find and use the control, reducing the likelihood of complaints or regulatory reports.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com
**Element:** Footer button with no visible text content — purpose unclear, potential accessibility gap
**XPath:** `/html/body/footer[1]/div[2]/div[2]/button[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("/html/body/footer[1]/div[2]/div[2]/button[1]")`
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
Replace the unlabeled, potentially non-functional footer consent re-trigger button with an accessible, functional 'Cookie Settings' button that correctly invokes the consent management UI — or, if no consent platform is active, remove the dead interactive element entirely.

### How
1. Locate the footer component in the Astro project (likely `src/components/Footer.astro` or `src/layouts/Footer.astro`). Find the `<button>` with class `inline-flex items-center` that contains only an SVG icon.
2. Determine whether a consent management platform (CMP) is actually integrated. Search the codebase for OneTrust (`otSDKStub`), Cookiebot (`Cookiebot.renew()`), or a custom consent module. Check `astro.config.mjs` for any consent-related integrations or `<script>` tags in the layout head.
3a. IF a CMP exists but its banner never renders (the cluster root cause): fix the banner rendering first (separate finding), then update this button to correctly call the CMP's re-open API with a proper accessible name, visible label text, and focus management.
3b. IF no CMP is active or the consent infrastructure is fully broken with no near-term fix planned: remove the button entirely from the footer template to eliminate the dead interactive zone. Do not leave a non-functional interactive element in the DOM.
4. If keeping the button (path 3a): add a visually hidden text span inside the button alongside the SVG, add `aria-label` as a belt-and-suspenders measure, ensure the SVG has `aria-hidden="true"` and `focusable="false"`, and wire the click handler to the CMP's documented re-open method with a null guard.
5. Verify the fix: run `axe-core` or Lighthouse accessibility audit on any page — confirm zero 'button without accessible name' violations in the footer region. Manually test with VoiceOver/NVDA to confirm the button announces its purpose. Confirm keyboard focus is visible on the button.

### Code examples
```
---
// src/components/ConsentTrigger.astro
// Site-specific: adjust CMP_REOPEN_METHOD if using a different consent platform.
// This component replaces the bare icon button in the footer.
---

<button
  type="button"
  class="consent-trigger inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
  aria-label="Cookie Settings"
  data-consent-trigger
>
  <svg
    aria-hidden="true"
    focusable="false"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="shrink-0"
  >
    <!-- Cookie/shield icon path — replace with your existing SVG path data -->
    <path
      d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM5.5 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm5 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM6 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm3.5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
      fill="currentColor"
    />
  </svg>
  <span class="consent-trigger-label">Cookie Settings</span>
</button>

<script>
  // CMP_REOPEN_METHOD: The global function or object method your consent
  // platform exposes to re-open the consent dialog. Common values:
  //   OneTrust:  () => window.OneTrust?.ToggleInfoDisplay()
  //   Cookiebot: () => window.Cookiebot?.renew()
  //   Custom:    () => document.dispatchEvent(new CustomEvent('consent:open'))
  // Site-specific: update this to match your actual CMP integration.
  const CMP_REOPEN_METHOD = () => {
    if (typeof window.OneTrust !== 'undefined' && typeof window.OneTrust.ToggleInfoDisplay === 'function') {
      window.OneTrust.ToggleInfoDisplay();
      return true;
    }
    if (typeof window.Cookiebot !== 'undefined' && typeof window.Cookiebot.renew === 'function') {
      window.Cookiebot.renew();
      return true;
    }
    // Fallback: dispatch a custom event that a consent module can listen for
    document.dispatchEvent(new CustomEvent('consent:open'));
    return false;
  };

  function initConsentTrigger() {
    const button = document.querySelector('[data-consent-trigger]');
    if (!button) return;

    button.addEventListener('click', () => {
      try {
        const opened = CMP_REOPEN_METHOD();
        if (!opened) {
          // No CMP responded — log for debugging, do not silently swallow
          console.warn('[ConsentTrigger] No consent platform responded to re-open request.');
        }
      } catch (err) {
        console.error('[ConsentTrigger] Error opening consent dialog:', err);
      }
    });
  }

  // Astro re-runs inline scripts on client-side navigation (View Transitions)
  document.addEventListener('astro:page-load', initConsentTrigger);
  // Also run on initial load if no View Transitions
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsentTrigger);
  } else {
    initConsentTrigger();
  }
</script>

<style>
  /* Scoped to .consent-trigger — will not leak to other buttons */
  .consent-trigger {
    /* 48x48 minimum touch target per WCAG 2.5.8 */
    min-height: 48px;
    min-width: 48px;
    padding: 0.5rem;
    cursor: pointer;
    background: none;
    border: none;
  }

  .consent-trigger-label {
    /* Visible label — remove this block and use sr-only if icon-only is required */
  }

  /* If design requires icon-only, uncomment this and remove the block above:
  .consent-trigger-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  */
</style>
---
// Alternative: If NO consent platform is active, remove the dead button.
// In Footer.astro, delete the <button class="inline-flex items-center"> element entirely.
// Before (broken):
//   <button class="inline-flex items-center">
//     <svg>...</svg>
//   </button>
//
// After: element removed. No replacement needed until a CMP is properly integrated.
// If a CMP is added later, use the ConsentTrigger.astro component above.
---
```

## Risks
- If the button's click handler is wired to other functionality beyond consent (e.g., a custom modal or unrelated UI), removing or rewiring it could break that flow. Mitigation: search the codebase for all references to the button's class or any event listeners bound to it before modifying. The `data-consent-trigger` attribute scopes the new handler to only this component.
- If Astro View Transitions are enabled, the inline script must re-initialize on navigation. The fix handles this via `astro:page-load` event listener, but if the project uses a non-standard navigation lifecycle, the listener may not fire. Mitigation: the fallback `DOMContentLoaded` listener covers the initial load; verify View Transitions behavior in staging.
- The CMP_REOPEN_METHOD null-guards OneTrust and Cookiebot specifically. If a different CMP is in use (or a custom implementation), the fallback custom event (`consent:open`) will fire but nothing will listen for it unless the CMP is configured to do so. Mitigation: the console.warn makes this visible during QA; the implementor must update the method to match their actual CMP.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
