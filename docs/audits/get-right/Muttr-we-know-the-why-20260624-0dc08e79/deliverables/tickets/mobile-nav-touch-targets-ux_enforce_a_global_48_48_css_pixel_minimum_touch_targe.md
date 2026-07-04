---
finding_id: "mobile-nav-touch-targets-ux"
title: "Mobile navigation links render at 24px height — repeated tap failures likely on primary navigation"
severity: "high"
root_cause_cluster: "Global Touch Target and Interactive Element Sizing Deficit"
why_this_matters: "Navigation links at 24px height are half the WCAG minimum."
fix_summary: "Enforce a global 48×48 CSS pixel minimum touch target on all interactive elements at mobile breakpoints, with scoped overrides for the four specific component zones identified: hamburger button, prim…"
confidence_tier: "confirmed"
---

# Mobile navigation links render at 24px height — repeated tap failures likely on primary navigation

**Finding:** Mobile navigation links render at 24px height — repeated tap failures likely on primary navigation  
**Severity:** High  
**Why this matters:** Navigation links at 24px height are half the WCAG minimum.  
**Root cause:** Global Touch Target and Interactive Element Sizing Deficit  
**Fix:** Enforce a global 48×48 CSS pixel minimum touch target on all interactive elements at mobile breakpoints, with scoped overrides for the four specific component zones identified: hamburger button, prim…

> **Evidence Basis:** Confirmed

---

## Impact

- **Mobile Bounce Rate:** Navigation links at 24px height are half the WCAG minimum. At this size, fat-finger mis-taps and repeated tap failures are near-certain on mobile — users either hit the wrong link or give up. Expanding to 48px eliminates the physical barrier to navigating the site. Every mobile visitor who currently bounces after failing to tap a nav link becomes recoverable.
- **Mobile Task Completion:** The compounding failure (undersized hamburger → undersized nav links) means users face two consecutive difficult taps just to navigate. Fixing both removes the sequential friction — users who open the menu can now reliably reach their destination on the first tap.
- **Accessibility Legal Exposure:** WCAG 2.5.8 (Target Size Minimum) is a Level AA criterion. All four component zones (hamburger, nav links, CTA, footer links) fail this criterion on every page. Remediation eliminates the legal surface area for ADA demand letters targeting touch target compliance.
- **Seo Core Web Vitals:** Touch target sizing is a mobile usability signal in Google's mobile-friendly assessment. Fixing this removes a flag that can suppress mobile search rankings.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_003`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/legal/terms/
**Element:** Primary CTA 'Talk to a Founder' at 345x40px — 8px below 48px minimum touch target
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
Enforce a global 48×48 CSS pixel minimum touch target on all interactive elements at mobile breakpoints, with scoped overrides for the four specific component zones identified: hamburger button, primary nav links, primary CTA, and footer links.

### How
1. Add a Tailwind base-layer rule that sets min-height: 48px and min-width: 48px on all tappable elements (a, button, [role='button'], input:not([type='hidden']), select, textarea, summary) inside a max-width media query (the site's mobile breakpoint — must be confirmed from the existing Tailwind config). Use :not() exclusions to avoid hitting inline text links within prose/body content where the 48px height would break paragraph flow — scope the exclusion to a known prose container class.
2. For the mobile navigation drawer specifically: add vertical padding to each nav link so the tap target reaches 48px without changing the visible text size. The current 24px height is pure line-height; adding 12px top + 12px bottom padding achieves 48px. Apply this via a scoped selector targeting the nav container's direct link children.
3. For the hamburger button: increase from 40×40 to 48×48 via min-height/min-width on the button element. The icon inside remains unchanged; only the tappable zone grows.
4. For the primary CTA ('Talk to a Founder'): increase from 40px height to 48px via min-height. Padding adjustment: change vertical padding from the current value to at least 12px top/bottom (or whatever yields 48px with the current font-size + line-height).
5. For footer links: these are the smallest at ~17px height. Apply the same base-layer rule. If footer links are densely packed, also add a minimum gap/margin of 8px between adjacent targets to prevent overlap of the 48px zones.
6. Test: verify no horizontal overflow is introduced on 320px viewport. Verify that prose/body inline links are excluded and retain normal inline flow. Verify the nav drawer does not exceed viewport height with the added padding (if it does, the drawer needs overflow-y: auto, which it likely already has).

### Code examples
```
/* === Global Mobile Touch Target Enforcement === */
/* File: Add to your Tailwind CSS entry point (e.g., globals.css or app.css) */
/* inside @layer base so it sits below component/utility layers */

/* SITE-SPECIFIC ASSUMPTION: Mobile breakpoint is 768px. */
/* Adjust MOBILE_BREAKPOINT_PX to match your Tailwind config's `md` breakpoint. */
/* SITE-SPECIFIC ASSUMPTION: Prose/body content lives inside .prose or [data-prose]. */
/* Adjust PROSE_CONTAINER_SELECTOR if your CMS uses a different wrapper class. */

@layer base {
  /* --- Constants documented here for implementor reference --- */
  /* MOBILE_BREAKPOINT_PX: 768px — matches Tailwind default `md` */
  /* MIN_TOUCH_TARGET_PX: 48px — WCAG 2.5.8 minimum */
  /* TOUCH_GAP_PX: 8px — minimum spacing between adjacent targets */

  @media (max-width: 767px) {
    /*
     * Global interactive element minimum.
     * :not(.prose a, [data-prose] a) excludes inline text links
     * inside body copy where 48px height would break paragraph flow.
     * :not([type='hidden']) excludes hidden form inputs.
     */
    a:not(.prose a):not([data-prose] a),
    button,
    [role='button'],
    input:not([type='hidden']),
    select,
    textarea,
    summary {
      min-height: 48px; /* MIN_TOUCH_TARGET_PX */
      min-width: 48px;  /* MIN_TOUCH_TARGET_PX */
    }
  }
}

/* === Scoped Component Overrides === */
/* These provide the specific padding/layout adjustments per component */
/* so the 48px minimum is achieved via spacing, not stretching. */

/* --- Mobile Navigation Drawer Links --- */
/* SITE-SPECIFIC ASSUMPTION: Nav drawer links are <a> inside a <nav> */
/* with a class like .mobile-nav or [data-mobile-nav]. */
/* Adjust NAV_CONTAINER_SELECTOR to match your markup. */

@layer components {
  @media (max-width: 767px) {
    /* NAV_CONTAINER_SELECTOR — adjust to your actual nav wrapper */
    [data-mobile-nav] > a,
    [data-mobile-nav] > ul > li > a,
    .mobile-nav > a,
    .mobile-nav > ul > li > a {
      /*
       * 24px current height is line-height only.
       * 12px top + 12px bottom padding = 48px total.
       * NAV_LINK_VERTICAL_PAD: 12px — (48 - 24) / 2
       */
      padding-top: 12px;
      padding-bottom: 12px;
      display: flex;
      align-items: center;
      /* Ensure the link fills the drawer width for full-width tap target */
      width: 100%;
    }

    /* --- Hamburger Button --- */
    /* SITE-SPECIFIC ASSUMPTION: Hamburger is a <button> with */
    /* class .hamburger, [data-hamburger], or [aria-label*='menu']. */
    /* Adjust HAMBURGER_SELECTOR to match your markup. */
    [data-hamburger],
    button[aria-label*='menu'],
    button[aria-label*='Menu'],
    .hamburger {
      min-height: 48px; /* up from 40px */
      min-width: 48px;  /* up from 40px */
      /* Icon inside is unaffected — only the tappable zone grows */
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* --- Primary CTA ('Talk to a Founder') --- */
    /* SITE-SPECIFIC ASSUMPTION: CTA uses a class like .cta-primary */
    /* or [data-cta='primary']. Adjust CTA_SELECTOR. */
    [data-cta='primary'],
    .cta-primary {
      min-height: 48px; /* up from 40px */
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* --- Footer Links --- */
    /* SITE-SPECIFIC ASSUMPTION: Footer links are inside <footer> */
    /* FOOTER_LINK_GAP: 8px — prevents adjacent 48px zones from overlapping */
    footer a {
      min-height: 48px;
      display: inline-flex;
      align-items: center;
      /* Add gap between stacked footer links */
      margin-bottom: 8px; /* FOOTER_LINK_GAP */
    }
  }
}

/* === Fallback: @supports guard for older browsers === */
/* min-height on inline elements requires display change. */
/* The flex display above handles this. For browsers that */
/* don't support flex (effectively none post-2015), the */
/* base min-height still applies via block-level fallback. */
@supports not (display: flex) {
  @media (max-width: 767px) {
    [data-mobile-nav] > a,
    [data-mobile-nav] > ul > li > a {
      display: block;
      padding-top: 12px;
      padding-bottom: 12px;
    }
  }
}
```

## Risks
- Visual spacing change: Adding 12px vertical padding to nav links increases the drawer's total height by ~96px (4 links × 24px added). If the drawer is exactly viewport-height without scroll, it may now require scrolling. Mitigation: verify the nav drawer has overflow-y: auto (it should for any variable-content container). If not, add it to the drawer container.
- Footer layout shift: Footer links jumping from ~17px to 48px height with 8px gaps will significantly increase footer vertical footprint on mobile. This is correct behavior (the old targets were unusable) but may surprise stakeholders visually. Mitigation: review with design before deploy — the layout change is intentional and required for compliance, but the visual treatment (padding distribution, background hit area vs visible element) can be refined.
- Prose link exclusion scope: The :not(.prose a):not([data-prose] a) exclusion assumes body content uses .prose or [data-prose] as a wrapper. If the CMS uses a different class (e.g., .entry-content, .rich-text), inline links within paragraphs will get 48px min-height and break text flow. Mitigation: audit the actual prose container class before deploying and update the selector.
- Selector specificity: The @layer base rule has low specificity by design. If existing component styles use !important or high-specificity selectors that set explicit heights (e.g., height: 24px), the min-height will be overridden. Mitigation: search the codebase for any explicit height declarations on nav links, hamburger, CTA, and footer links. Remove or convert fixed heights to min-heights.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
