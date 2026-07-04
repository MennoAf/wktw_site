---
finding_id: "ux-mobile-nav-cta-undersized"
title: "Primary conversion CTA 'Talk to a Founder' is 40px tall — below 48px touch target minimum"
severity: "high"
root_cause_cluster: "Global Touch Target and Interactive Element Sizing Deficit"
why_this_matters: "The 'Talk to a Founder' CTA is the singular conversion action in the mobile navigation."
fix_summary: "Enforce a 48px minimum touch target height on the primary 'Talk to a Founder' CTA in the global navigation, and establish a design-system-level token that prevents any interactive element from render…"
confidence_tier: "confirmed"
---

# Primary conversion CTA 'Talk to a Founder' is 40px tall — below 48px touch target minimum

**Finding:** Primary conversion CTA 'Talk to a Founder' is 40px tall — below 48px touch target minimum  
**Severity:** High  
**Why this matters:** The 'Talk to a Founder' CTA is the singular conversion action in the mobile navigation.  
**Root cause:** Global Touch Target and Interactive Element Sizing Deficit  
**Fix:** Enforce a 48px minimum touch target height on the primary 'Talk to a Founder' CTA in the global navigation, and establish a design-system-level token that prevents any interactive element from render…

> **Evidence Basis:** Confirmed

---

## Impact

- **Mobile Conversion Rate:** The 'Talk to a Founder' CTA is the singular conversion action in the mobile navigation. At 40px height, the touch target falls below the WCAG 2.5.8 minimum, increasing mis-tap probability on mobile — users either tap adjacent elements or require multiple attempts, introducing friction at the exact moment of conversion intent. Increasing to 48px eliminates this friction. The mechanism is direct: larger touch target → fewer failed taps → lower abandonment at the conversion entry point.
- **Bounce Rate Mobile:** Mis-taps on undersized nav CTAs cause unintended navigation (tapping a neighboring link instead of the CTA), which forces users to navigate back and retry. Each failed interaction increases cognitive load and exit probability. Fixing the target size removes this unintended navigation loop.
- **Wcag Compliance:** Resolves WCAG 2.5.8 (Target Size Minimum) violation on the highest-traffic interactive element. This is a Level AA success criterion — failure constitutes a documentable accessibility deficiency with legal exposure under ADA and EAA.
- **Core Web Vitals Inp:** Undersized touch targets do not directly affect INP measurement, but mis-taps generate wasted interaction events (tap wrong element → navigate back → tap again), which inflate observed interaction counts and degrade perceived responsiveness.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_003`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/the-get-right/platform/
**Element:** 'Talk to a Founder' CTA link — 345x40px, below 48px minimum height
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
Enforce a 48px minimum touch target height on the primary 'Talk to a Founder' CTA in the global navigation, and establish a design-system-level token that prevents any interactive element from rendering below 48px on touch-capable viewports.

### How
1. Identify the existing button component or utility class composition that produces the 40px height. The likely stack is: font-size (14-16px) + line-height (1.2-1.5) + vertical padding (8-10px each) = ~40px. The fix increases vertical padding to reach ≥48px rendered height.
2. Create a scoped CSS rule targeting the CTA via its existing selector (data attribute or specific class). Do NOT use bare element selectors. The rule applies min-height: 48px and adjusts padding-block to distribute the 8px deficit (4px top + 4px bottom added).
3. Scope the padding increase to touch-capable viewports using @media (pointer: coarse) so desktop mouse users retain the current tighter visual if desired — or apply universally if the design team accepts the 4px-per-side change on desktop (recommended for simplicity and WCAG compliance regardless of input method).
4. Verify the fix does not clip text or icon content by confirming the CTA uses box-sizing: border-box (standard in all modern resets) and that the increased padding does not push the nav bar height past its container's constraints. If the nav bar has a fixed height, the nav bar height must also be updated.
5. For the broader cluster (20 elements): add a design token / utility class that enforces the 48px minimum on all interactive elements. This is a separate follow-up task — this proposal fixes the highest-impact instance immediately and provides the token for incremental rollout.
6. Test on iOS Safari (smallest common viewport: 320px logical width, iPhone SE) and Android Chrome to confirm the CTA remains fully tappable and visually balanced within the mobile menu overlay.

### Code examples
```
/* === Touch Target Fix: Global Nav CTA ===
 * SITE-SPECIFIC ASSUMPTION: The CTA is identifiable via
 * a data attribute or a specific class. Adjust the selector
 * below to match the actual markup. If using Tailwind,
 * apply these as @apply overrides in the component layer.
 *
 * WHY min-height + padding instead of just min-height:
 * min-height alone does not vertically center text in all
 * layout contexts. Padding ensures the content remains
 * centered and the clickable area is genuinely 48px.
 */

/* --- Design Token: reusable across the 20-element cluster --- */
:root {
  /* 48px = WCAG 2.5.8 minimum touch target size */
  --min-touch-target: 48px;
  /* 12px padding-block produces 48px with 16px font + 1.5 line-height (24px content) */
  --cta-padding-block: 12px;
  /* Horizontal padding unchanged — adjust if site uses a different value */
  --cta-padding-inline: 24px;
}

/* --- Scoped to the nav CTA only --- */
/* SITE-SPECIFIC: Replace '[data-cta="talk-to-founder"]' with the
 * actual selector. Examples:
 *   .nav__cta--primary
 *   [data-action="book-call"]
 *   .header .btn-primary
 * Do NOT use bare 'a' or 'button' selectors. */
[data-cta="talk-to-founder"] {
  min-height: var(--min-touch-target);
  padding-block: var(--cta-padding-block);
  padding-inline: var(--cta-padding-inline);
  /* Ensure padding is inward, not additive */
  box-sizing: border-box;
  /* Vertically center text if flex/grid parent doesn't handle it */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* --- Utility class for the remaining 19 elements in the cluster --- */
/* Apply .touch-target-safe to each element during incremental rollout.
 * This class is additive — it only sets min-height and does not
 * override existing padding, color, or typography. */
.touch-target-safe {
  min-height: var(--min-touch-target);
  /* Only add padding if the element's computed height is still <48px.
   * For elements that already meet 48px via their own styles,
   * min-height is a no-op. */
}

/* --- Optional: restrict to touch devices only --- */
/* Remove this @media wrapper to apply universally (recommended). */
/*
@media (pointer: coarse) {
  [data-cta="talk-to-founder"] {
    min-height: var(--min-touch-target);
    padding-block: var(--cta-padding-block);
  }
}
*/
```

## Risks
- Nav bar height increase: Adding 8px total vertical padding may push the nav bar taller by 4-8px (depending on whether the nav container has a fixed height or uses content-sizing). MITIGATION: If the nav has a fixed height (e.g., height: 64px), update it to accommodate the larger CTA. If it uses padding/auto height, the increase is absorbed naturally. Test on the actual nav to confirm before deploying.
- Visual regression on desktop: The CTA will appear 4px taller per side on desktop if applied universally (without the pointer:coarse media query). MITIGATION: This is a minor visual change — 48px buttons are standard in modern design systems. If the design team objects, scope to @media (pointer: coarse) only, but note this leaves desktop keyboard/switch-device users with the undersized target.
- Selector specificity conflict: If the existing button styles use high-specificity selectors or !important declarations, the new rule may be overridden. MITIGATION: Match or exceed the existing selector's specificity. Inspect the computed styles in DevTools before writing the final selector. The data-attribute approach ([data-cta="talk-to-founder"]) has specificity 0-1-0, which beats single class selectors (0-1-0 ties resolve by source order — place this rule after the component styles).

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
