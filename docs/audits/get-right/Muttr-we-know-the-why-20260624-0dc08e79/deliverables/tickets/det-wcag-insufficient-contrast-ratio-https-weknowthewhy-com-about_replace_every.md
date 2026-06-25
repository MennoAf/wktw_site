---
finding_id: "det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com-about"
title: "Insufficient contrast ratio [WCAG]"
severity: "medium"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: ""
fix_summary: "Replace every failing foreground colour with a WCAG AA–compliant equivalent computed from the measured foreground/background pair."
confidence_tier: "confirmed"
---

# Insufficient contrast ratio [WCAG]

**Finding:** Insufficient contrast ratio [WCAG]  
**Severity:** Medium  
**Why this matters:** _See body for impact narrative._  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Replace every failing foreground colour with a WCAG AA–compliant equivalent computed from the measured foreground/background pair.

✓ **Standard remediation (vetted)** — invariant best-practice fix applied from a verified template (no AI generation).

> **Evidence Basis:** Confirmed

---

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

### WCAG 2.1 SC 1.4.3 (AA) — insufficient contrast ratio

**Exposure:** MEDIUM  
**What Failed:** 3 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at div > a:nth-of-type(5).  

**Remediation:** Adjust foreground/background color pairs to meet WCAG AA contrast thresholds: 4.5:1 for body text (<18pt), 3:1 for large text (>=18pt or >=14pt bold). Verify with a contrast checker.

### WCAG 2.1 SC 1.3.1 (A) — improper content structure

**Exposure:** LOW  
**What Failed:** Heading hierarchy issues: heading level jumps from h2 to h4 (skips a level).  

**Remediation:** Use a single h1 per page for the main topic. Nest headings sequentially (h1 > h2 > h3) without skipping levels. Headings should describe the content that follows, not be used for styling.

### WCAG 2.1 SC 1.4.1 (A) — color as sole indicator

**Exposure:** MEDIUM  
**What Failed:** 10 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).  

**Remediation:** Supplement color with additional visual cues: underline inline links, or add icons/patterns. Do not rely on color alone to convey meaning.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/about/
**Element:** insufficient contrast ratio
**XPath:** `div > a:nth-of-type(5)`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("div > a:nth-of-type(5)")`
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
Replace every failing foreground colour with a WCAG AA–compliant equivalent computed from the measured foreground/background pair. All replacement values are arithmetically derived — no design judgment is required.

### How
For each failing element, replace the CSS ``color`` value with the compliant colour listed below. Each replacement was computed by scaling lightness toward black or white until the WCAG 2.1 relative-luminance contrast ratio reaches ≥4.5:1 (normal text) or ≥3.0:1 (large text ≥18pt / 14pt bold).

Computed replacements (apply to your child theme's style.css or Additional CSS panel):

  - #2C211D → #8B8A89 (4.54:1 on background #2C211D)
  - #2C211D → #8B8A89 (4.54:1 on background #2C211D)
  - #2C211D → #969594 (4.51:1 on background #382C27)

Target each failing element with its CSS selector. Scope overrides to a child theme to survive parent-theme updates.

### Code examples
```
/* Apply inside your child theme style.css or Customizer Additional CSS */
/* Old fg: #2C211D on bg: #2C211D → #8B8A89 (computed ratio 4.54:1 ≥ 4.5:1 AA) */
color: #8B8A89;
/* Old fg: #2C211D on bg: #2C211D → #8B8A89 (computed ratio 4.54:1 ≥ 4.5:1 AA) */
color: #8B8A89;
/* Old fg: #2C211D on bg: #382C27 → #969594 (computed ratio 4.51:1 ≥ 4.5:1 AA) */
color: #969594;
/* Verify with axe DevTools or the Chrome DevTools contrast picker
 * after deploying — confirm every targeted element shows ≥4.5:1. */
```

## Risks
- The computed colour preserves hue/saturation from the original foreground but shifts lightness to meet AA. Review each replacement in the live design context to ensure it aligns with the brand palette.
- Large-text elements (≥18pt or ≥14pt bold) only need 3:1; the template uses 4.5:1 as a conservative default for all pairs unless is_large_text is explicitly set in the evidence — verify the computed value is not over-dark for headings.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
