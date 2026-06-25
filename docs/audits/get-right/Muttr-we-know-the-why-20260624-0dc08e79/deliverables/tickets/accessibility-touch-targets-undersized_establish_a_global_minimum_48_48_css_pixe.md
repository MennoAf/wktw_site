---
finding_id: "accessibility-touch-targets-undersized"
title: "20 touch targets below 48×48px minimum — mobile navigation, CTA, and footer elements affected"
severity: "high"
root_cause_cluster: "Global Touch Target and Interactive Element Sizing Deficit"
why_this_matters: "Undersized touch targets cause mis-taps, forcing users to retry interactions or accidentally triggering adjacent elements."
fix_summary: "Establish a global minimum 48×48 CSS pixel interactive bounding box for all touch targets site-wide by introducing a design-system-level CSS layer that enforces minimum tap dimensions on every intera…"
confidence_tier: "confirmed"
---

# 20 touch targets below 48×48px minimum — mobile navigation, CTA, and footer elements affected

**Finding:** 20 touch targets below 48×48px minimum — mobile navigation, CTA, and footer elements affected  
**Severity:** High  
**Why this matters:** Undersized touch targets cause mis-taps, forcing users to retry interactions or accidentally triggering adjacent elements.  
**Root cause:** Global Touch Target and Interactive Element Sizing Deficit  
**Fix:** Establish a global minimum 48×48 CSS pixel interactive bounding box for all touch targets site-wide by introducing a design-system-level CSS layer that enforces minimum tap dimensions on every intera…

> **Evidence Basis:** Confirmed

---

## Impact

- **Mobile Usability:** Undersized touch targets cause mis-taps, forcing users to retry interactions or accidentally triggering adjacent elements. Expanding all 20+ targets to 48×48px eliminates this friction on the primary mobile navigation, CTA, and footer — the three highest-interaction zones on every page. This directly reduces mobile bounce from navigation frustration and removes friction from the primary conversion action ('Talk to a Founder').
- **Accessibility Compliance:** Resolves WCAG 2.5.8 (Target Size) and partially addresses WCAG 4.1.2 (Name, Role, Value) via the hamburger aria-label fix. Eliminates a category of ADA/EAA legal exposure that applies to every page on the site since all affected components are in the global header/footer.
- **Seo Mobile Usability:** Google's mobile usability report flags undersized tap targets. Resolving these removes mobile usability warnings from Search Console, which can suppress mobile search rankings.
- **Conversion Cta:** The primary CTA ('Talk to a Founder') at 40px height is 8px below the WCAG minimum. Users with larger fingers or less precise motor control may miss the target or hit adjacent elements. Expanding to 48px reduces failed taps on the single most important conversion element on the site.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_003`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/legal/privacy/
**Element:** Footer button — undersized touch target
**XPath:** `/html/body/footer[1]/div[1]/div[2]/button[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("/html/body/footer[1]/div[1]/div[2]/button[1]")`
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
Establish a global minimum 48×48 CSS pixel interactive bounding box for all touch targets site-wide by introducing a design-system-level CSS layer that enforces minimum tap dimensions on every interactive element category (buttons, links in navigation/footer, icon links), scoped to avoid inflating inline body text links or disrupting existing visual design.

### How
1. Create a new CSS file (e.g., `touch-target-floors.css`) loaded after the main stylesheet but before any component overrides. This file establishes minimum interactive sizing via `min-height`, `min-width`, and padding adjustments — never overriding explicit visual dimensions, only enforcing floors.

2. Define six scoped rulesets targeting the exact component categories identified:
   (a) Hamburger button: target by its existing selector within the header (e.g., `header button[aria-label]` or the specific class). Set `min-width: 48px; min-height: 48px;`. Also fix the empty accessible name by adding `aria-label="Open menu"` in the HTML template.
   (b) Navigation links: target `nav a` scoped within the site header/footer. Apply `min-height: 48px; display: inline-flex; align-items: center;` and add vertical padding to reach the 48px floor without changing font size.
   (c) Primary CTA ('Talk to a Founder'): target by its specific class or `header a[href]` with the CTA class. Override `min-height: 48px;` — the button already has horizontal padding, only the height is deficient.
   (d) Footer links: target `footer a`. Apply `min-height: 48px; display: inline-flex; align-items: center; padding-block: 12px;` to expand from ~17px to 48px.
   (e) Social/icon links: target by their container class or `footer a[href*="linkedin"], footer a[href*="twitter"]` etc. Set `min-width: 48px; min-height: 48px; display: inline-flex; align-items: center; justify-content: center;`.
   (f) Logo link: target the header logo anchor. Set `min-height: 48px; display: inline-flex; align-items: center;` — width is already adequate at 66px.

3. Scope containment: add `:not(article a):not(main p a):not(.prose a)` to the broad `a` rules to prevent inline body text links from gaining block-level sizing. This ensures only structural/navigational links are affected.

4. Add spacing guard: where adjacent touch targets exist (e.g., footer link lists, nav items), ensure at least 8px gap between targets using `gap` on the parent flex/grid container, preventing overlapping tap zones.

5. Test on iOS Safari (oldest supported), Chrome Android, and desktop browsers. Verify no layout shift (these are min-height additions, not height overrides — existing elements taller than 48px are unaffected).

6. Fix the hamburger button's missing accessible name in the HTML template (not CSS-solvable).

### Code examples
```
/* === touch-target-floors.css ===
 * Global minimum interactive sizing — WCAG 2.5.8 (48×48 CSS px)
 * Load after main stylesheet, before component overrides.
 *
 * SITE-SPECIFIC ASSUMPTIONS:
 * - Header uses <header> element containing <nav>, logo <a>, hamburger <button>, CTA <a>
 * - Footer uses <footer> element containing link lists and social icon links
 * - Body prose links live inside <article>, <main> <p>, or .prose containers
 * - Adjust selectors below to match your actual DOM structure
 */

/* --- Design Token --- */
:root {
  /* Minimum interactive target size per WCAG 2.5.8 */
  --touch-target-min: 48px;
  /* Minimum gap between adjacent targets to prevent mis-taps */
  --touch-target-gap: 8px;
}

/* --- (a) Hamburger / Menu Toggle Button --- */
/* SITE-SPECIFIC: adjust selector to match your hamburger button class or structure */
header button.menu-toggle,
header button[aria-label="Open menu"],
header button[aria-label="Menu"] {
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Preserve existing visual icon size — only the tap bounding box expands */
}

/* --- (b) Navigation Links (header + mobile nav) --- */
/* Scoped to nav containers; excludes inline prose links */
header nav a,
.mobile-nav a,
.site-nav a {
  min-height: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  padding-block: 12px; /* expand from ~24px text to 48px target */
}

/* Parent container spacing to prevent adjacent target overlap */
header nav ul,
header nav ol,
.mobile-nav ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--touch-target-gap);
}

/* --- (c) Primary CTA --- */
/* SITE-SPECIFIC: adjust selector to match your CTA class */
header a.cta-primary,
header a.btn-primary,
a.talk-to-founder {
  min-height: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* --- (d) Footer Links --- */
footer a:not([aria-hidden="true"]) {
  min-height: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  padding-block: 12px; /* expand from ~17px to 48px */
}

/* Footer link list spacing */
footer ul,
footer ol {
  display: flex;
  flex-direction: column;
  gap: var(--touch-target-gap);
}

/* --- (e) Social / Icon Links --- */
/* SITE-SPECIFIC: adjust selector to match your social link container */
footer .social-links a,
.social-icons a {
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.social-links,
.social-icons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--touch-target-gap);
}

/* --- (f) Logo Link --- */
header a.logo,
header .logo a,
a.site-logo {
  min-height: var(--touch-target-min);
  display: inline-flex;
  align-items: center;
  /* Width already adequate at 66px; only height needs floor */
}

/* --- CONTAINMENT: Exclude inline prose links --- */
/* These selectors must NOT match body text links.
 * If any rule above is too broad, add exclusions here.
 * The scoping to header/footer/nav above should prevent collisions,
 * but this is a safety net. */
article a,
main p a,
.prose a,
.rich-text a {
  /* Reset: do not apply touch-target min-height to inline text links */
  min-height: unset;
  display: inline; /* preserve inline flow */
  padding-block: unset;
}
<!-- Hamburger button HTML fix: add accessible name -->
<!-- BEFORE (broken): -->
<!-- <button class="menu-toggle"><svg>...</svg></button> -->

<!-- AFTER (fixed): -->
<button
  class="menu-toggle"
  aria-label="Open menu"
  aria-expanded="false"
  aria-controls="mobile-nav"
>
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
    <!-- hamburger icon paths -->
  </svg>
</button>

<!-- The aria-label provides the accessible name. -->
<!-- aria-expanded must toggle via JS when menu opens/closes. -->
<!-- aria-controls references the id of the navigation panel. -->
```

## Risks
- Layout shift in header/footer: expanding elements from ~17-40px to 48px minimum height will increase the vertical footprint of navigation and footer. Mitigation: use min-height (not height) so elements already ≥48px are unaffected. Visually audit header height on mobile — if the header grows, it may require reducing padding elsewhere in the header container to maintain the same overall height, or accepting the taller header as the correct accessible size.
- Selector specificity collisions: if the site uses Tailwind utility classes with high specificity or inline styles for sizing, the CSS file may be overridden. Mitigation: load the file after Tailwind's utility layer. If Tailwind is used, the preferred approach is adding these as Tailwind @layer components or using @apply within the component classes. Test with DevTools computed styles to verify the min-height is actually applied.
- Inline prose link false positives: if the site has link-heavy content inside elements that don't match the exclusion selectors (article, main p, .prose, .rich-text), those links could incorrectly receive block-level min-height. Mitigation: the containment rules at the bottom of the CSS reset inline links. Audit the actual content containers and add their selectors to the exclusion list before deploying.
- Footer vertical expansion: footer link lists going from ~17px per link to 48px will roughly triple the footer height. This is the correct accessible behavior but may surprise stakeholders. Mitigation: present the before/after to the design team. The footer was previously unusable on touch devices — the expanded size is the minimum viable interactive size.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
