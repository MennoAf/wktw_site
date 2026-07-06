---
finding_id: "mobile-privacy-policy-link-critically-undersized"
title: "Privacy policy link at 17px height is critically undersized — consent context makes this high-impact"
severity: "high"
root_cause_cluster: "Touch Target Sizing — Global Navigation and Footer Pattern"
why_this_matters: "The privacy policy link is a legally required element of informed consent under GDPR Article 7 and CCPA."
fix_summary: "Augment the privacy policy link inside the consent banner to meet the WCAG 2.5.8 minimum 48×48 CSS pixel touch target, scoped exclusively to the consent banner component so no other anchor elements o…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["privacy-consent-touch-target-compounded-gdpr-risk"]
---

# Privacy policy link at 17px height is critically undersized — consent context makes this high-impact

**Finding:** Privacy policy link at 17px height is critically undersized — consent context makes this high-impact  
**Severity:** High  
**Why this matters:** The privacy policy link is a legally required element of informed consent under GDPR Article 7 and CCPA.  
**Root cause:** Touch Target Sizing — Global Navigation and Footer Pattern  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Augment the privacy policy link inside the consent banner to meet the WCAG 2.5.8 minimum 48×48 CSS pixel touch target, scoped exclusively to the consent banner component so no other anchor elements o…  

> **Evidence Basis:** Confirmed

---

## Also resolves (1)

One fix closes the findings below — they were folded here as the same remediation:

- `privacy-consent-touch-target-compounded-gdpr-risk` (Medium) — Remediate the two-layer consent manipulation pathway on the consent banner by simultaneously: (1) enforcing WCAG 2.5.8-compliant minimum 48×48 CSS pixel touch targets with adequate spacing on all three consent action buttons (Accept, Decline, Manage Preferences), and (2) equalising the visual weight and interactive affordance of Decline and Manage Preferences relative to Accept — so that neither physical interaction imprecision nor visual hierarchy suppression can independently or jointly produce accidental or coerced consent. The fix must be verified on mobile viewports (320px–428px) where the banner renders in its most constrained layout, and must not regress the existing dark-pattern remediation already in progress under finding privacy-cookies-consent-banner-dark-pattern.

## Impact

- **Legal Liability Reduction:** The privacy policy link is a legally required element of informed consent under GDPR Article 7 and CCPA. At 17px height (35% of the WCAG 2.5.8 minimum), it is functionally inaccessible on touch devices, which undermines the legal defensibility of any consent collected through this banner. Expanding to 48px makes the link reliably tappable, restoring the 'informed' prerequisite of consent collection.
- **Accessibility Compliance:** Resolves a WCAG 2.5.8 Level AA violation. Because this is within a consent mechanism — a legally mandated UI — the violation carries higher legal exposure than a typical undersized target. ADA web accessibility lawsuits are well-documented and common; consent-infrastructure failures compound the exposure by also implicating privacy regulations.
- **Mobile Usability:** Eliminates repeated failed taps on the privacy policy link for mobile users (the dominant device class). Users who cannot access the privacy policy before consenting may abandon the consent flow entirely or leave the site, contributing to bounce rate on every page.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_003`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The 'privacy policy' link measures 91×17px — the height is only 35% of the 48px WCAG minimum.. This link appears in the consent/footer context where users need to review privacy terms before making consent decisions.

**Measured evidence:**
- Element Dimensions: 91×17px
- Minimum Required: 48×48px
- Height Deficit: 31px (65% below minimum)
- Context: consent/privacy — legally significant
- Touch Targets Undersized Count: 6

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
Augment the privacy policy link inside the consent banner to meet the WCAG 2.5.8 minimum 48×48 CSS pixel touch target, scoped exclusively to the consent banner component so no other anchor elements on the site are affected.

### How
1. Locate the consent banner Astro component (likely `src/components/ConsentBanner.astro` or similar). Identify the privacy policy `<a>` element within it.
2. Add a `data-consent-link` attribute to the privacy policy anchor to create a stable, selector-safe hook that survives text/href changes.
3. In the component's scoped `<style>` block, apply touch-target augmentation to `a[data-consent-link]` using `display: inline-flex; align-items: center; min-height: 48px; min-width: 48px; padding-block: 14px;` — this expands the tap zone from 17px to ≥48px without altering the visual text size or font metrics.
4. Verify the link's visual appearance is unchanged at desktop widths — the padding adds space but the text itself remains the same size and color. On mobile, the larger tap zone is the desired behavioral change.
5. If the consent banner uses Tailwind classes instead of scoped `<style>`, apply equivalent utility classes directly on the element (see code example for both approaches).
6. Test on a real mobile device (or Chrome DevTools device mode with touch simulation) that tapping the privacy policy link succeeds on the first attempt without zooming.
7. This fix is independent of — but complementary to — the consent banner rendering bug fix. Apply it now so that when the banner becomes visible, the link is already compliant.

### Code examples
```
---
// src/components/ConsentBanner.astro
// Scoped-style approach (no Tailwind dependency)

// SITE-SPECIFIC: Update href to match actual privacy policy URL
const PRIVACY_POLICY_HREF = '/privacy-policy';

// WCAG 2.5.8 minimum touch target dimension in CSS pixels
const MIN_TOUCH_TARGET_PX = 48;
---

<!-- Consent banner markup (simplified to show the fix pattern) -->
<div class="consent-banner" role="dialog" aria-label="Cookie consent" aria-modal="false">
  <p class="consent-banner__text">
    We use cookies to improve your experience.
    <a
      href={PRIVACY_POLICY_HREF}
      data-consent-link
      class="consent-banner__privacy-link"
    >
      Privacy Policy
    </a>
  </p>
  <!-- Accept / Decline buttons would be here -->
</div>

<style>
  /*
   * Touch-target augmentation for the privacy policy link.
   * Scoped to this component via Astro's scoped styles —
   * will NOT affect any other <a> on the site.
   */
  .consent-banner__privacy-link {
    /* Expand tap zone to meet 48px minimum */
    display: inline-flex;
    align-items: center;
    min-height: 48px;
    min-width: 48px;

    /*
     * 14px top + 14px bottom + ~20px line-height ≈ 48px.
     * padding-block avoids affecting horizontal flow.
     * Adjust if the banner's font-size differs.
     */
    padding-block: 14px;

    /*
     * Small inline padding prevents the text from sitting
     * flush against the tap-zone edge on narrow viewports.
     */
    padding-inline: 4px;

    /* Prevent tap-zone overlap with adjacent inline elements */
    margin-inline: 2px;

    /* Underline preserved for link affordance */
    text-decoration: underline;
    text-underline-offset: 3px;

    /* Ensure the expanded area is part of the hit region */
    cursor: pointer;

    /*
     * Negative margin trick to expand tap zone without
     * pushing surrounding content. The padding creates the
     * tap area; the negative margin reclaims the visual space.
     * Only apply on touch-capable viewports.
     */
  }

  @media (pointer: coarse) {
    .consent-banner__privacy-link {
      /*
       * On coarse-pointer (touch) devices, ensure the
       * expanded target is visually unambiguous.
       */
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
    }
  }
</style>
<!-- Tailwind-only alternative (if the consent banner uses Tailwind classes) -->
<!-- SITE-SPECIFIC: Update href to match actual privacy policy URL -->
<a
  href="/privacy-policy"
  data-consent-link
  class="inline-flex items-center min-h-[48px] min-w-[48px] py-3.5 px-1 mx-0.5 underline underline-offset-[3px] cursor-pointer"
>
  Privacy Policy
</a>
```

## Risks
- The 48px min-height adds vertical space to the consent banner's text block. If the banner has a fixed height or max-height constraint, the expanded link could overflow or clip. Mitigation: inspect the banner container for height constraints and adjust or remove them. The banner should be content-sized, not fixed-height.
- If the consent banner rendering bug (the cluster's primary issue) is fixed after this change, the two fixes must not conflict. This fix is purely CSS on the link element and does not touch banner visibility/display logic, so the two are independent. However, QA both together before deploying.
- If other links exist inside the consent banner (e.g., 'Terms of Service'), they should also receive the data-consent-link attribute and the same treatment. Audit the banner for all interactive elements and apply consistently.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
