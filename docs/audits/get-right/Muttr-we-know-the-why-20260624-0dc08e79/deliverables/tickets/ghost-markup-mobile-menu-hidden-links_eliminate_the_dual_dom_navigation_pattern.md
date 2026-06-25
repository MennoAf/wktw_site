---
finding_id: "ghost-markup-mobile-menu-hidden-links"
title: "Mobile menu contains hidden duplicate navigation links in collapsed DOM state"
severity: "medium"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: "Removing 5 duplicate <a> elements per page eliminates redundant internal links from the crawl graph on every page."
fix_summary: "Eliminate the dual-DOM navigation pattern by consolidating into a single <nav> element that adapts layout via CSS and manages ARIA state on mobile toggle."
confidence_tier: "confirmed"
---

# Mobile menu contains hidden duplicate navigation links in collapsed DOM state

**Finding:** Mobile menu contains hidden duplicate navigation links in collapsed DOM state  
**Severity:** Medium  
**Why this matters:** Removing 5 duplicate <a> elements per page eliminates redundant internal links from the crawl graph on every page.  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Eliminate the dual-DOM navigation pattern by consolidating into a single <nav> element that adapts layout via CSS and manages ARIA state on mobile toggle.

> **Evidence Basis:** Confirmed

---

## Impact

- **Crawl Efficiency:** Removing 5 duplicate <a> elements per page eliminates redundant internal links from the crawl graph on every page. For a small site (5-10 pages), this is minor; the real value is preventing the pattern from scaling as pages are added. Crawlers currently see 10 internal nav links per page instead of 5 — the duplicates dilute link signal clarity.
- **Accessibility Legal Exposure:** Two undifferentiated <nav> landmarks with no aria-hidden management means screen readers announce every link twice on every page. This is a WCAG 2.4.1 (Bypass Blocks) and 1.3.1 (Info and Relationships) failure. ADA web accessibility lawsuits are well-documented and increasingly common — this pattern creates measurable legal surface area. Phase 1 mitigates immediately; Phase 2 eliminates the root cause.
- **Dom Weight:** Removing the duplicate #mobile-menu nav eliminates ~15-20 DOM nodes per page (nav + ul + 5×li + 5×a). On a site this size the performance impact is negligible, but it removes a class of ghost markup that compounds as navigation grows.
- **Seo Landmark Clarity:** Search engines use landmark semantics for content understanding. Two identical nav landmarks with no differentiation degrade the semantic signal. Consolidation provides a single, unambiguous primary navigation landmark.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/about/
**Element:** Mobile menu duplicate link to /the-get-right
**XPath:** `//*[@id='mobile-menu']/div[1]/a[1]`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id='mobile-menu']/div[1]/a[1]")`
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
Eliminate the dual-DOM navigation pattern by consolidating into a single <nav> element that adapts layout via CSS and manages ARIA state on mobile toggle. If consolidation is blocked by timeline, apply the immediate ARIA remediation as a standalone fix.

### How
This is a two-phase fix. Phase 1 (immediate, standalone) adds ARIA state management and landmark differentiation to the existing dual-nav markup — this is safe to ship independently. Phase 2 (template refactor) consolidates into a single <nav> — this is the architectural fix.

Phase 1 — ARIA Remediation (no markup restructuring):
1. Add aria-label='Primary' to the desktop <nav> element.
2. Add aria-label='Mobile' to the #mobile-menu <nav> element.
3. Add aria-hidden='true' to #mobile-menu in its default (collapsed) state in the Astro template.
4. In the existing mobile menu toggle script, synchronize aria-hidden with the menu's visible state: set aria-hidden='false' when opening, aria-hidden='true' when closing.
5. On the toggle button, add aria-expanded='false' (default) and aria-controls='mobile-menu'. Toggle aria-expanded in the same handler.
6. Verify: on desktop viewports, #mobile-menu remains aria-hidden='true' permanently (no toggle fires). On mobile, aria-hidden toggles with menu state.

Phase 2 — Single-Nav Consolidation (template refactor):
1. In the Astro layout component (likely src/layouts/Layout.astro or a Header.astro component), remove the #mobile-menu <nav> entirely.
2. Restructure the remaining desktop <nav> to use CSS-only responsive layout: visible horizontal links on desktop (min-width: 768px), off-canvas or dropdown on mobile via checkbox-hack or details/summary (no JS required for basic toggle), or retain the existing JS toggle but targeting the single <nav>'s inner <ul>.
3. The toggle button targets the single nav's link list, not a separate DOM tree.
4. Apply aria-expanded on the toggle button and aria-hidden on the collapsible link container (not the <nav> itself — the <nav> landmark should always be visible to assistive tech, only the link list collapses).
5. Test: desktop shows horizontal links, mobile shows hamburger → slide/dropdown with same links. Screen readers see one 'Primary navigation' landmark on all viewports.

### Code examples
```
---
/* Phase 1: ARIA remediation on existing dual-nav Astro template */
/* File: src/components/Header.astro (adjust path to match project structure) */
---

<header>
  <!-- Desktop nav: always visible on wide viewports via CSS -->
  <nav aria-label="Primary">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/insights">Insights</a></li>
      <li><a href="/proof">Proof</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>

  <!-- Mobile menu toggle button -->
  <button
    type="button"
    id="mobile-menu-toggle"
    aria-expanded="false"
    aria-controls="mobile-menu"
    aria-label="Open mobile menu"
    class="mobile-menu-toggle"
  >
    <span class="hamburger-icon" aria-hidden="true">&#9776;</span>
  </button>

  <!-- Mobile nav: hidden by default, toggled on mobile -->
  <nav id="mobile-menu" aria-label="Mobile" aria-hidden="true">
    <ul>
      <li><a href="/" tabindex="-1">Home</a></li>
      <li><a href="/about" tabindex="-1">About</a></li>
      <li><a href="/insights" tabindex="-1">Insights</a></li>
      <li><a href="/proof" tabindex="-1">Proof</a></li>
      <li><a href="/contact" tabindex="-1">Contact</a></li>
    </ul>
  </nav>
</header>

<script>
  (function initMobileMenuToggle() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');

    if (!toggle || !menu) return;

    /** @type {NodeListOf<HTMLAnchorElement>} */
    const menuLinks = menu.querySelectorAll('a');

    /**
     * Synchronize ARIA state and tabindex with menu visibility.
     * tabindex management prevents hidden links from entering tab order.
     */
    function setMenuOpen(/** @type {boolean} */ isOpen) {
      toggle.setAttribute('aria-expanded', String(isOpen));
      menu.setAttribute('aria-hidden', String(!isOpen));
      toggle.setAttribute(
        'aria-label',
        isOpen ? 'Close mobile menu' : 'Open mobile menu'
      );

      /* Site-specific assumption: tabindex values assume all menu
         children are <a> elements. Adjust selector if menu contains
         <button> or other focusable elements. */
      menuLinks.forEach(function setTabIndex(link) {
        link.setAttribute('tabindex', isOpen ? '0' : '-1');
      });

      /* Site-specific assumption: 'is-open' class controls CSS
         visibility (transform, display, opacity). Verify against
         existing stylesheet. */
      menu.classList.toggle('is-open', isOpen);
    }

    toggle.addEventListener('click', function handleToggle() {
      var currentlyOpen = toggle.getAttribute('aria-expanded') === 'true';
      setMenuOpen(!currentlyOpen);
    });

    /* Close on Escape key when menu is open */
    document.addEventListener('keydown', function handleEscape(event) {
      if (
        event.key === 'Escape' &&
        toggle.getAttribute('aria-expanded') === 'true'
      ) {
        setMenuOpen(false);
        toggle.focus();
      }
    });
  })();
</script>
---
/* Phase 2: Single-nav consolidation — Astro component */
/* File: src/components/Header.astro */
/* Replaces the entire dual-nav structure from Phase 1 */
---

<header>
  <nav aria-label="Primary">
    <!-- Toggle button: hidden on desktop via CSS, visible on mobile -->
    <button
      type="button"
      id="nav-toggle"
      aria-expanded="false"
      aria-controls="nav-links"
      aria-label="Open navigation menu"
      class="nav-toggle"
    >
      <span class="hamburger-icon" aria-hidden="true">&#9776;</span>
    </button>

    <!-- Single link list: horizontal on desktop, collapsible on mobile -->
    <ul id="nav-links" class="nav-links" role="list">
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/insights">Insights</a></li>
      <li><a href="/proof">Proof</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </nav>
</header>

<style>
  /* Site-specific assumption: 768px breakpoint matches existing
     design system. Adjust MOBILE_BREAKPOINT to match. */

  .nav-toggle {
    display: none; /* Hidden on desktop */
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  @media (max-width: 767px) {
    .nav-toggle {
      display: block;
    }

    .nav-links {
      /* Off-canvas: hidden by default on mobile */
      position: fixed;
      top: 0;
      left: 0;
      width: 80vw;
      max-width: 320px; /* Prevent overly wide menu on tablets */
      height: 100vh;
      height: 100dvh; /* Dynamic viewport height for mobile browsers */
      flex-direction: column;
      background: var(--color-surface, #ffffff);
      padding: 4rem 1.5rem 1.5rem;
      transform: translateX(-100%);
      transition: transform 0.25s ease-out;
      z-index: 1000;
    }

    .nav-links.is-open {
      transform: translateX(0);
    }

    /* Fallback for browsers without dvh support */
    @supports not (height: 100dvh) {
      .nav-links {
        height: 100vh;
      }
    }
  }
</style>

<script>
  (function initNavToggle() {
    var toggle = document.getElementById('nav-toggle');
    var linkList = document.getElementById('nav-links');

    if (!toggle || !linkList) return;

    /** @type {NodeListOf<HTMLAnchorElement>} */
    var links = linkList.querySelectorAll('a');

    /* Site-specific assumption: 768 matches the CSS breakpoint above.
       Must stay in sync. */
    var MOBILE_BREAKPOINT_PX = 768;

    function isMobile() {
      return window.innerWidth < MOBILE_BREAKPOINT_PX;
    }

    function setOpen(/** @type {boolean} */ isOpen) {
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation menu' : 'Open navigation menu'
      );
      linkList.classList.toggle('is-open', isOpen);

      /* On mobile, manage tabindex so collapsed links exit tab order.
         On desktop, links are always tabbable (this function only
         fires from toggle click, which only exists on mobile). */
      if (isMobile()) {
        links.forEach(function setTab(link) {
          link.setAttribute('tabindex', isOpen ? '0' : '-1');
        });
      }
    }

    /* Set initial mobile state: links not tabbable when collapsed */
    if (isMobile()) {
      links.forEach(function hideFromTab(link) {
        link.setAttribute('tabindex', '-1');
      });
    }

    toggle.addEventListener('click', function handleClick() {
      var isCurrentlyOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isCurrentlyOpen);
    });

    document.addEventListener('keydown', function handleEscape(event) {
      if (
        event.key === 'Escape' &&
        toggle.getAttribute('aria-expanded') === 'true'
      ) {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Reset state on resize crossing the breakpoint.
       Uses a flag to avoid redundant DOM writes. */
    var wasMobile = isMobile();
    window.addEventListener('resize', function handleResize() {
      var nowMobile = isMobile();
      if (wasMobile && !nowMobile) {
        /* Crossed to desktop: ensure links are tabbable, menu class removed */
        linkList.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        links.forEach(function resetTab(link) {
          link.removeAttribute('tabindex');
        });
      } else if (!wasMobile && nowMobile) {
        /* Crossed to mobile: hide links from tab order */
        links.forEach(function hideTab(link) {
          link.setAttribute('tabindex', '-1');
        });
      }
      wasMobile = nowMobile;
    });
  })();
</script>
```

## Risks
- Phase 1 risk — existing JS toggle handler: The current mobile menu toggle script likely targets #mobile-menu by ID and toggles a CSS class or inline style. Phase 1 adds aria-hidden and tabindex management to that same handler. If the existing handler uses a different mechanism (e.g., toggling display:none inline, or a different class name than 'is-open'), the aria-hidden toggle will desync from visual state. Mitigation: inspect the existing toggle handler before implementing — the setMenuOpen function must use the same visibility mechanism (class name, attribute, or style) already in use. The code example uses classList.toggle('is-open') as a placeholder; replace with the actual class/mechanism.
- Phase 2 risk — CSS transition on mobile nav: The single-nav approach uses transform:translateX(-100%) for the off-canvas pattern. If the existing site uses a different mobile menu animation (fade, slide-down, overlay), the CSS must be adapted. The structural HTML and ARIA logic remain the same regardless of animation style.
- Phase 2 risk — resize handler without debounce: The resize listener checks breakpoint crossing with a flag (wasMobile) to avoid redundant DOM writes, but does not debounce. On rapid resize (e.g., DevTools responsive mode), this fires frequently. The flag prevents DOM thrashing, so debounce is unnecessary for correctness — but if other resize listeners exist on the page, adding another listener adds marginal overhead. This is acceptable for a single lightweight check.
- Phase 2 risk — Astro view transitions: If the site uses Astro's View Transitions API, the IIFE in <script> may not re-execute on client-side navigation. Astro re-runs <script> tags in <head> but not always inline component scripts on transition. If view transitions are enabled, move the toggle logic to a script with is:inline or use Astro's astro:page-load event instead of DOMContentLoaded/IIFE.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
