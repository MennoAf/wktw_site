---
finding_id: "a11y-2-touch-targets-undersized"
title: "Touch targets below 48x48px minimum — mobile usability and WCAG 2.5.8 failure"
severity: "high"
root_cause_cluster: "Touch Target Sizing — Global Navigation and Footer Pattern"
why_this_matters: "Touch targets below 48px force users to zoom or retry taps."
fix_summary: "Enforce a 48x48 CSS pixel minimum touch target on all interactive elements site-wide via a global Astro layout style, scoped to avoid breaking desktop pointer UX."
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["conv-ux-001-touch-target-form-suppression", "mob-touch-001", "navigation-search-functionality", "touch-targets-ux-impact"]
---

# Touch targets below 48x48px minimum — mobile usability and WCAG 2.5.8 failure

**Finding:** Touch targets below 48x48px minimum — mobile usability and WCAG 2.5.8 failure  
**Severity:** High  
**Why this matters:** Touch targets below 48px force users to zoom or retry taps.  
**Root cause:** Touch Target Sizing — Global Navigation and Footer Pattern  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Enforce a 48x48 CSS pixel minimum touch target on all interactive elements site-wide via a global Astro layout style, scoped to avoid breaking desktop pointer UX.  

> **Evidence Basis:** Confirmed

---

## Also resolves (4)

One fix closes the findings below — they were folded here as the same remediation:

- `conv-ux-001-touch-target-form-suppression` (Medium) — Enforce a minimum 48×48 CSS pixel interactive surface on all touch targets across the contact page template — including CTA buttons, icon-only links (phone, email, social), form field labels, and inline anchor links — without altering their visual footprint. The fix uses a layered strategy: (1) a scoped CSS utility class that expands the tap surface via min-height/min-width and padding floors, (2) a ::before pseudo-element tap-target expander for icon-only controls where visual resizing is unacceptable, (3) a form-field association audit to ensure labels are block-level and correctly linked, and (4) a platform-level audit of the global button/link component to prevent recurrence on other pages. All changes must be WCAG 2.5.8 compliant, visually non-destructive, and backwards-compatible to iOS Safari 14 / Android Chrome 88.
- `mob-touch-001` (Medium) — Expand all 16 undersized touch targets on the About page to meet WCAG 2.5.8's 48×48 CSS pixel minimum, prioritized by conversion path position: (1) primary contact/inquiry CTA, (2) primary mobile navigation links, (3) team member social icon links, (4) cookie consent banner action buttons. The fix must expand tap areas without altering visual design — using CSS padding and ::after pseudo-element overlays — and must propagate to every instance of the team grid and mobile navigation components, not just the About page.
- `navigation-search-functionality` (Low) — Search link present but functionality unclear — verify search implementation
- `touch-targets-ux-impact` (High) — Multiple undersized touch targets below 48×48px WCAG minimum — navigation and footer links affected on mobile

## Impact

- **Mobile Usability:** Touch targets below 48px force users to zoom or retry taps. Enlarging targets to 48px eliminates mis-taps on navigation, footer, and inline links — reducing friction on every page interaction for touch users, who represent the majority of mobile traffic.
- **Bounce Rate:** Mis-taps on undersized nav links cause accidental navigation or failed taps that feel unresponsive. Eliminating this friction reduces the likelihood of users abandoning after a failed interaction attempt.
- **Accessibility Compliance:** Resolves WCAG 2.5.8 (AA) failure across all pages. Removes legal liability surface for ADA/EAA claims — web accessibility lawsuits targeting touch target failures are well-documented and increasingly common.
- **Seo:** Google's mobile-friendly assessment flags undersized touch targets. Resolving this removes a negative signal from mobile search ranking evaluation.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_003`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/the-get-right/platform
**Element:** Home link — 39x20px, both dimensions undersized
**XPath:** `/html/body/header[1]/nav[1]/a[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("/html/body/header[1]/nav[1]/a[1]")`
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
Enforce a 48x48 CSS pixel minimum touch target on all interactive elements site-wide via a global Astro layout style, scoped to avoid breaking desktop pointer UX. Apply targeted overrides in the navigation and footer components where layout compression creates the worst violations.

### How
1. Create a new global CSS file `src/styles/touch-targets.css` that uses a media query `(pointer: coarse)` to apply minimum touch target sizing only on touch devices. This avoids inflating desktop layouts where mouse precision makes 48px targets unnecessary. 2. Import this file in the root Astro layout (e.g., `src/layouts/Layout.astro`) so it applies to every page. 3. The global rule sets `min-height: 48px` and `min-width: 48px` on all `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, and `[role="button"]` elements, using `display: inline-flex` and `align-items: center` to vertically center text within the enlarged target without shifting text position. `justify-content: flex-start` is used (not center) to preserve left-aligned text in navigation links and body copy. 4. In the navigation component (`src/components/Nav.astro` or equivalent), verify that nav links inherit the global rule. If the nav uses a flex container with `gap`, no additional work is needed for spacing. If links are tightly packed, add `gap: 8px` to the nav's flex container under `@media (pointer: coarse)` to ensure adjacent targets don't overlap. 5. In the footer component (`src/components/Footer.astro` or equivalent), apply the same verification. The privacy policy link at 17px height is the most severe — confirm its parent container does not constrain height via `overflow: hidden`, explicit `height`, or `line-height` compression. Remove any such constraint or override it within `@media (pointer: coarse)`. To inspect: open DevTools on a touch-emulated viewport, select the privacy policy `<a>` element, and check the Computed panel for `height` — if it reads below 48px, walk up the DOM tree checking each ancestor's `overflow`, `height`, and `line-height` properties until the constraint is found. 6. For inline mailto links in body content, the global rule handles them automatically — `inline-flex` with `min-height: 48px` on `<a>` elements ensures even single-word links meet the target. 7. ESCAPE HATCH: Any element that must opt out of the global rule (e.g., a full-width CTA `<button>` that relies on `display: block`, or a visually compact icon button) should receive the `data-no-touch-target` attribute. Apply `min-height: 48px` directly on that element's own selector to maintain compliance without the `inline-flex` override. Example: `<button data-no-touch-target class="cta-full-width">Buy Now</button>` with `.cta-full-width { min-height: 48px; }` in its component styles. 8. Test on iOS Safari and Android Chrome using real devices or DevTools device emulation with touch simulation enabled. Verify that (a) all interactive elements measure ≥48x48px in the accessibility tree, (b) adjacent targets have ≥8px spacing, (c) desktop layout is visually unchanged, and (d) the 320px viewport (iPhone SE) shows no horizontal overflow in the navigation.

### Code examples
```
/* src/styles/touch-targets.css */

/*
 * WCAG 2.5.8 Touch Target Sizing — applied only on coarse-pointer (touch) devices.
 * `pointer: coarse` matches phones, tablets, and touch-enabled laptops in tablet mode.
 * Desktop mouse users (pointer: fine) are unaffected — no layout shift on desktop.
 *
 * KNOWN LIMITATION: Touch-enabled laptops with a mouse attached (e.g., Surface Pro)
 * report `pointer: fine` even when the touchscreen is active. These users lose touch
 * target sizing when using the touchscreen in that mode. This is a known limitation
 * of the `pointer` media feature and is acceptable for most sites.
 *
 * SITE-SPECIFIC ASSUMPTION: All interactive elements are standard HTML elements
 * or use [role="button"]. If custom components use other roles (e.g., [role="tab"],
 * [role="menuitem"]), add them to the selector list below.
 *
 * ESCAPE HATCH: Add `data-no-touch-target` to any element that must opt out of
 * this rule (e.g., a visually compact icon button that handles its own sizing).
 * Example: <button data-no-touch-target aria-label="Close">×</button>
 */

:root {
  /*
   * MIN_TARGET_SPACING: 8px minimum gap between adjacent touch targets.
   * Matches WCAG 2.5.8 spacing recommendation to prevent mis-taps.
   * Referenced via var(--min-target-spacing) within this file.
   * NOTE: Scoped Astro component <style> blocks cannot consume this custom
   * property without `is:global` or a hardcoded value — see Nav.astro and
   * Footer.astro for their local gap declarations.
   */
  --min-target-spacing: 8px;
}

@media (pointer: coarse) {
  /*
   * Core touch target enforcement.
   * `inline-flex` preserves inline flow (text wraps naturally) while enabling
   * vertical centering and min-height. `inline-block` would also work but
   * doesn't support `align-items` for vertical centering.
   *
   * `justify-content: flex-start` is used (not center) to preserve left-aligned
   * text in navigation links and body copy. Use `center` only for icon-only buttons.
   *
   * The `:not()` exclusions prevent applying to elements where min-height
   * would break layout: hidden inputs, elements inside SVGs, and any element
   * explicitly opted out via `data-no-touch-target`.
   *
   * FULL-WIDTH BUTTON NOTE: If a <button> relies on `display: block` for full-width
   * layout (e.g., a CTA button), `inline-flex` will shrink it to content width.
   * Add `data-no-touch-target` to that button and apply `min-height: 48px` directly
   * on its own selector to preserve full-width behavior.
   */
  a:not([data-no-touch-target]),
  button:not([data-no-touch-target]),
  [role="button"]:not([data-no-touch-target]),
  input:not([type="hidden"]):not([data-no-touch-target]),
  select:not([data-no-touch-target]),
  textarea:not([data-no-touch-target]),
  summary:not([data-no-touch-target]) {
    min-height: 48px;
    min-width: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
  }

  /*
   * Inputs and textareas that are block-level form fields should remain
   * block-level, not inline-flex. Override for form contexts.
   *
   * NOTE: <select> and <textarea> outside a <form> element (valid HTML) will
   * receive `inline-flex` from the rule above and no width correction.
   * This is an edge case — document any such usage and add `data-no-touch-target`
   * with a manual min-height override if needed.
   *
   * NOTE: `align-items: center` on <textarea> may vertically center single-line
   * text in a multi-line textarea on some browsers (notably iOS Safari). Test
   * textarea rendering on iOS Safari if vertical text alignment is critical.
   *
   * NOTE: `display: inline-flex` on <select> has inconsistent flexbox support
   * across browsers (especially Safari). The `min-height: 48px` will apply
   * correctly; do not rely on `align-items`/`justify-content` for select styling.
   */
  form input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([data-no-touch-target]),
  form select:not([data-no-touch-target]),
  form textarea:not([data-no-touch-target]) {
    display: flex;
    width: 100%;
    min-height: 48px;
  }
}
---
// src/layouts/Layout.astro
// Import the global touch target stylesheet.
// This is the ONLY change needed in the layout file.
import '../styles/touch-targets.css';

// ... existing imports and props
const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <!-- touch-targets.css is bundled automatically by Astro's CSS pipeline -->
  </head>
  <body>
    <slot />
  </body>
</html>
---
// src/components/Nav.astro
// Navigation component — touch target spacing fix.
// SITE-SPECIFIC ASSUMPTION: Nav uses a flex container for links.
// Adjust the `nav` selector or class name to match your actual markup.
---

<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/proof">Proof</a></li>
    <li><a href="/search">Search</a></li>
    <li><a href="/the-get-right">The Get Right</a></li>
  </ul>
</nav>

<style>
  /*
   * NAV_LINK_GAP: 8px minimum spacing between adjacent touch targets.
   * Prevents mis-taps when two links are side-by-side.
   * On desktop (pointer: fine), tighter spacing is acceptable.
   */
  ul {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: 4px; /* desktop default — tight spacing is fine for mouse */
  }

  @media (pointer: coarse) {
    ul {
      gap: 8px; /* MIN_TARGET_SPACING — WCAG 2.5.8 adjacent target spacing */
    }
  }
</style>
---
// src/components/Footer.astro
// Footer component — fix for privacy policy link height compression.
// SITE-SPECIFIC ASSUMPTION: Footer links are in a flex or inline container.
// The privacy policy link was measured at 17px height, indicating the parent
// constrains height or line-height. This fix removes that constraint on touch.
---

<footer>
  <div class="footer-links">
    <a href="/terms">Terms</a>
    <a href="/privacy-policy">Privacy Policy</a>
    <a href="mailto:jon@weknowthewhy.com">jon@weknowthewhy.com</a>
  </div>
</footer>

<style>
  .footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px; /* desktop default */
  }

  @media (pointer: coarse) {
    .footer-links {
      gap: 8px; /* MIN_TARGET_SPACING */
    }

    /*
     * Remove any height/line-height compression that collapses
     * link targets below 48px. The global touch-targets.css handles
     * min-height, but if the parent has overflow:hidden or a fixed
     * height, the child's min-height is clipped. This ensures the
     * container does not clip.
     */
    .footer-links a {
      /* Ensure the global min-height: 48px is not overridden */
      line-height: normal;
      overflow: visible;
    }
  }
</style>
```

## Risks
- VISUAL LAYOUT SHIFT ON MOBILE: Links that were previously compact text will now occupy at least 48x48px. In tightly packed layouts (e.g., a horizontal nav with many items), this may cause wrapping or overflow. MITIGATION: The `flex-wrap: wrap` on nav/footer containers allows graceful wrapping. Test on 320px viewport (iPhone SE) to verify no horizontal overflow. The `@media (pointer: coarse)` scoping ensures desktop layout is completely untouched.
- INLINE LINKS IN BODY COPY: An `<a>` tag mid-paragraph will become `inline-flex` with `min-height: 48px`, which may create vertical misalignment with surrounding text. MITIGATION: For body copy links, the 48px min-height creates a larger tap area without visually disrupting text flow because `inline-flex` respects the inline axis. However, if visual misalignment occurs, add `data-no-touch-target` to specific inline links and instead use padding-based enlargement: `padding-block: 12px; margin-block: -12px;` to create an invisible expanded hit area. Test with representative body content.
- DISPLAY OVERRIDE CONFLICTS: The `display: inline-flex` rule may conflict with existing Tailwind utility classes that set `display` on links (e.g., `block`, `flex`, `hidden`). MITIGATION: The `@media (pointer: coarse)` specificity is equal to the base Tailwind utilities, so Tailwind classes declared later in the cascade will win. If a link is intentionally `display: none` (e.g., skip-to-content on non-focus), the global rule won't make it visible because `min-height` on a `display: none` element has no effect. For `display: block` links, `inline-flex` override is acceptable — both are visible. Verify no links rely on `display: block` for full-width clickable areas that `inline-flex` would shrink.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
