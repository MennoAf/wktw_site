---
finding_id: "det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about"
title: "Color as sole indicator [WCAG]"
severity: "medium"
root_cause_cluster: "Site-Wide Dark Color Palette Contrast Failures"
why_this_matters: ""
fix_summary: "Restore visible underlines on all inline text links site-wide via a scoped child-theme CSS override, ensuring links within body content, navigation, footers, and widgets are distinguishable by more t…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["a11y-compound-contrast-color-indicator-failure", "det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com"]
---

# Color as sole indicator [WCAG]

**Finding:** Color as sole indicator [WCAG]  
**Severity:** Medium  
**Why this matters:** _See body for impact narrative._  
**Root cause:** Site-Wide Dark Color Palette Contrast Failures  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Restore visible underlines on all inline text links site-wide via a scoped child-theme CSS override, ensuring links within body content, navigation, footers, and widgets are distinguishable by more t…  

✓ **Standard remediation (vetted)** — invariant best-practice fix applied from a verified template (no AI generation).

> **Evidence Basis:** Confirmed

---

> **Fix code targets the wrong stack (MUTTR-03).** This site was detected as **Astro**, but the code below uses WordPress/PHP idioms — it is not drop-in and must be hand-ported. Astro uses components/layouts (`.astro`), scoped styles or Tailwind, `astro.config.*`, and `public/` — not child themes, Liquid, or PHP.

## Also resolves (2)

One fix closes the findings below — they were folded here as the same remediation:

- `a11y-compound-contrast-color-indicator-failure` (Medium) — Resolve a compound WCAG failure on inline link elements that simultaneously violates 1.4.3 (insufficient contrast ratio) and 1.4.1 (color as sole distinguishing indicator). Both criteria must be fixed together in a single design system change — fixing only one leaves the compound failure partially intact and may create a false sense of compliance. The fix must: (1) increase link foreground color luminance to achieve ≥4.5:1 contrast against the page background, (2) add a non-color visual indicator (text-decoration: underline is the lowest-effort, highest-compatibility option) to distinguish links from surrounding body text, and (3) ensure hover/focus states independently satisfy both criteria. Because the link style is defined globally in the site's base CSS or Astro layout component, a single targeted change propagates the fix to every inline link across every page.
- `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com` (Medium) — Insufficient contrast ratio [WCAG]

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

### WCAG 2.1 SC 1.4.3 (AA) — insufficient contrast ratio

**Exposure:** MEDIUM  
**What Failed:** 4 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at #consent-accept.  

**Remediation:** Adjust foreground/background color pairs to meet WCAG AA contrast thresholds: 4.5:1 for body text (<18pt), 3:1 for large text (>=18pt or >=14pt bold). Verify with a contrast checker.

### WCAG 2.1 SC 1.4.1 (A) — color as sole indicator

**Exposure:** MEDIUM  
**What Failed:** 12 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).  

**Remediation:** Supplement color with additional visual cues: underline inline links, or add icons/patterns. Do not rely on color alone to convey meaning.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_002`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/about
**Element:** color as sole indicator
**XPath:** `li > a:nth-of-type(1)`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("li > a:nth-of-type(1)")`
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
Restore visible underlines on all inline text links site-wide via a scoped child-theme CSS override, ensuring links within body content, navigation, footers, and widgets are distinguishable by more than color alone — satisfying WCAG 2.1 SC 1.4.1 (Use of Color).

Affected selectors captured by the detector (1 element(s)):
  - li > a:nth-of-type(1)

### How
1. Create a child theme if one does not already exist.
2. In the child theme's style.css, add a scoped rule targeting anchor elements within content regions:

   .entry-content a, .widget a, .site-footer a, .comment-body a {
     text-decoration: underline;
     text-decoration-thickness: 1px;
     text-underline-offset: 0.2em;
   }

3. Exclude intentionally un-underlined UI elements (navigation menus, buttons, card links) via :not() selectors to avoid visual regression.
4. Confirm hover/focus states also retain the underline (or use an alternate non-colour cue such as a dotted underline).
5. Deploy via Customizer Additional CSS for immediate testing, then commit to the child theme for persistence across updates.
6. Validate: inspect any <a> inside a <p> and confirm computed text-decoration resolves to underline.

### Code examples
```
/* WCAG 1.4.1 — Inline Link Underline Restoration
 * File: wp-content/themes/<child-theme>/style.css
 * Scope to content regions only; exclude nav/button links. */
.entry-content a:not(.wp-block-button__link):not(.btn):not([role='button']),
.widget a:not(.btn):not([role='button']),
.site-footer a:not(.btn):not([role='button']),
.comment-body a:not(.btn):not([role='button']) {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
  text-decoration-color: currentColor;
}
```

## Risks
- Visual regression on links that the design team intentionally styled without underlines. Audit footer, sidebar, and builder-generated sections after deployment.
- High-specificity parent-theme rules or inline styles may override child-theme declarations. Inspect computed styles in DevTools and add specificity or use !important as a documented last resort.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
