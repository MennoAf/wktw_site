---
finding_id: "ux-nav-no-breadcrumbs"
title: "No breadcrumb navigation or BreadcrumbList structured data across site pages"
severity: "medium"
root_cause_cluster: "Navigation Architecture — Sparse Internal Linking and Content Dead-Ends"
why_this_matters: "BreadcrumbList JSON-LD enables Google to display breadcrumb trails in SERPs for case study and blog URLs."
fix_summary: "Build a route-aware Breadcrumb Astro component that (1) derives crumb segments from Astro.url.pathname, (2) renders accessible breadcrumb UI, and (3) emits BreadcrumbList JSON-LD — then slot it into…"
confidence_tier: "confirmed"
---

# No breadcrumb navigation or BreadcrumbList structured data across site pages

**Finding:** No breadcrumb navigation or BreadcrumbList structured data across site pages  
**Severity:** Medium  
**Why this matters:** BreadcrumbList JSON-LD enables Google to display breadcrumb trails in SERPs for case study and blog URLs.  
**Root cause:** Navigation Architecture — Sparse Internal Linking and Content Dead-Ends  
**Fix:** Build a route-aware Breadcrumb Astro component that (1) derives crumb segments from Astro.url.pathname, (2) renders accessible breadcrumb UI, and (3) emits BreadcrumbList JSON-LD — then slot it into…

> **Evidence Basis:** Confirmed

---

## Impact

- **Seo Rich Results:** BreadcrumbList JSON-LD enables Google to display breadcrumb trails in SERPs for case study and blog URLs. This replaces the raw URL display with a labeled path hierarchy, which increases result legibility and click-through signal — particularly for depth-3 URLs like /proof/our-site/ where the raw URL communicates no context.
- **Crawl Efficiency:** Breadcrumb anchor links create explicit parent-child internal link relationships that currently do not exist. The audited page has 11 internal links, all flat nav. Adding breadcrumb links gives Googlebot a second, hierarchically-structured path to parent listing pages, reinforcing their crawl priority and PageRank flow.
- **User Wayfinding:** Users landing on a case study or blog post via search have no current mechanism to navigate to the parent listing (/proof/, /blog/) without returning to the global nav. Breadcrumbs reduce this friction, lowering bounce rate on deep-linked entry pages — the mechanism is reduced navigation dead-ends, not a speculative conversion claim.
- **Wcag Compliance:** The nav[aria-label='Breadcrumb'] with aria-current='page' on the terminal crumb satisfies WCAG 2.4.8 (Location) for pages at depth ≥ 2. This closes a documented accessibility gap without introducing new ARIA patterns.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_010`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The page URL is /proof/our-site/ — three levels deep in the site hierarchy.. There are no breadcrumb elements in the DOM (no <nav> with aria-label='breadcrumb', no BreadcrumbList structured data, no visual breadcrumb trail).

**Measured evidence:**
- Structured Data Present: ['Organization']
- Breadcrumb Schema Present: False
- Breadcrumb Nav Present: False
- Site Pages: ['The Get Right', 'Insights', 'Proof', 'About', 'Contact']
- Breadcrumb Detected: False
- Structured Data: 2 schemas detected (Organization, Unknown) — no BreadcrumbList
- Page Depth: Top-level page (/about)
- Breadcrumbs Present: False

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
Build a route-aware Breadcrumb Astro component that (1) derives crumb segments from Astro.url.pathname, (2) renders accessible breadcrumb UI, and (3) emits BreadcrumbList JSON-LD — then slot it into the shared Layout so every page at depth ≥ 2 receives both automatically with zero per-page authoring.

### How
1. Create src/config/breadcrumb-labels.ts — a typed map from URL segment slugs to human-readable labels. This is the single source of truth; it must be updated whenever a new route section is added.
2. Create src/components/Breadcrumb.astro — accepts no props; reads Astro.url.pathname internally. Splits the path into segments, filters the root, maps each segment to a label via the config map (falling back to title-cased slug), builds an ordered crumb array with full absolute hrefs, renders the <nav aria-label='Breadcrumb'> UI, and emits a <script type='application/ld+json'> BreadcrumbList block.
3. In src/layouts/Layout.astro (or whichever file wraps every page), import Breadcrumb and render it immediately after the opening <main> tag, guarded by a segment-count check so the root page and single-depth pages are excluded.
4. Validate the JSON-LD output on one case-study URL and one blog URL using Google's Rich Results Test before merging.
5. Add a Playwright smoke test that asserts (a) nav[aria-label='Breadcrumb'] is present on any URL with path depth ≥ 2, and (b) a <script type='application/ld+json'> block containing '@type':'BreadcrumbList' exists in the DOM.

### Code examples
```
// src/config/breadcrumb-labels.ts
// SITE-SPECIFIC ASSUMPTION: keys are the exact URL path segments used in this site's routing.
// Add a new entry here whenever a new top-level or nested section is created.
export const BREADCRUMB_LABEL_MAP: Record<string, string> = {
  proof: 'Our Work',
  'our-site': 'This Site',
  blog: 'Blog',
  services: 'Services',
  about: 'About',
  // extend as routes are added
} as const;

// Fallback: convert a raw slug to Title Case when no explicit label exists.
export function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
---
// src/components/Breadcrumb.astro
// Reads Astro.url.pathname — no props required.
// Renders nothing for root (/) and single-depth pages (/about).
// Safe to include unconditionally in Layout; depth guard is internal.
import { BREADCRUMB_LABEL_MAP, slugToLabel } from '../config/breadcrumb-labels';

const SITE_ORIGIN = Astro.site?.origin ?? '';
// SITE-SPECIFIC ASSUMPTION: Astro.site must be set in astro.config.mjs for
// absolute hrefs in JSON-LD to be correct. Fallback is empty string (relative).

const rawPath = Astro.url.pathname.replace(/\/$/, '') || '/';
const segments = rawPath === '/' ? [] : rawPath.split('/').filter(Boolean);

// Only render for depth >= 2 (at least one parent + current page).
const shouldRender = segments.length >= 2;

interface Crumb {
  label: string;
  href: string;
}

const crumbs: Crumb[] = shouldRender
  ? [
      { label: 'Home', href: `${SITE_ORIGIN}/` },
      ...segments.map((seg, i) => ({
        label: BREADCRUMB_LABEL_MAP[seg] ?? slugToLabel(seg),
        href: `${SITE_ORIGIN}/${segments.slice(0, i + 1).join('/')}/`,
      })),
    ]
  : [];

// BreadcrumbList JSON-LD — built only when rendering.
const jsonLd = shouldRender
  ? JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
        item: crumb.href,
      })),
    })
  : null;
---

{shouldRender && (
  <>
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <ol>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li>
              {isLast ? (
                <span aria-current="page">{crumb.label}</span>
              ) : (
                <a href={crumb.href}>{crumb.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
    <script type="application/ld+json" set:html={jsonLd} />
  </>
)}

<style>
  /* Scoped to .breadcrumb — does not touch global a or li selectors */
  .breadcrumb ol {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0.25rem;
  }
  .breadcrumb li {
    display: flex;
    align-items: center;
  }
  /* Separator via CSS — no extra DOM nodes, no aria pollution */
  .breadcrumb li + li::before {
    content: '/';
    margin-right: 0.25rem;
    aria-hidden: true;
    color: currentColor;
    opacity: 0.5;
  }
  .breadcrumb a {
    text-decoration: underline;
  }
  .breadcrumb [aria-current='page'] {
    font-weight: 600;
  }
  @media (prefers-reduced-motion: no-preference) {
    .breadcrumb a {
      transition: opacity 150ms ease;
    }
    .breadcrumb a:hover {
      opacity: 0.75;
    }
  }
</style>
---
// src/layouts/Layout.astro — insertion point only (surrounding context abbreviated)
// EXISTING BEHAVIOR PRESERVED: Breadcrumb is additive. It inserts after <main> opens.
// No existing component is modified or removed. The depth guard inside Breadcrumb.astro
// ensures root and single-depth pages are unaffected.
import Breadcrumb from '../components/Breadcrumb.astro';
---
<!-- existing Layout markup above -->
<main>
  <Breadcrumb />
  <slot />
</main>
<!-- existing Layout markup below -->
// tests/breadcrumb.spec.ts — Playwright smoke test
// Run with: npx playwright test tests/breadcrumb.spec.ts
import { test, expect } from '@playwright/test';

// SITE-SPECIFIC ASSUMPTION: these URLs must exist in the deployed/dev environment.
// Update if route structure changes.
const DEPTH_2_URLS = ['/proof/', '/blog/'] as const;
const DEPTH_3_URLS = ['/proof/our-site/'] as const;
const EXCLUDED_URLS = ['/', '/about/'] as const;

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:4321';

for (const path of [...DEPTH_2_URLS, ...DEPTH_3_URLS]) {
  test(`breadcrumb UI and JSON-LD present on ${path}`, async ({ page }) => {
    await page.goto(`${BASE_URL}${path}`);

    const nav = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(nav).toBeVisible();

    const jsonLdHandles = await page.$$('script[type="application/ld+json"]');
    let hasBreadcrumbList = false;
    for (const handle of jsonLdHandles) {
      const text = await handle.textContent();
      if (text && JSON.parse(text)['@type'] === 'BreadcrumbList') {
        hasBreadcrumbList = true;
        break;
      }
    }
    expect(hasBreadcrumbList).toBe(true);
  });
}

for (const path of EXCLUDED_URLS) {
  test(`breadcrumb absent on shallow page ${path}`, async ({ page }) => {
    await page.goto(`${BASE_URL}${path}`);
    const nav = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(nav).not.toBeVisible();
  });
}
```

## Risks
- SLUG-TO-LABEL FALLBACK QUALITY: Any URL segment not in BREADCRUMB_LABEL_MAP will render as a title-cased slug (e.g., 'case-study-acme-corp' → 'Case Study Acme Corp'). This is readable but not brand-controlled. Mitigation: audit all existing depth-2+ URLs before deploy and populate the map exhaustively; add a CI lint step that warns when a new page route introduces an unmapped segment.
- DYNAMIC ROUTES WITH CONTENT-DERIVED TITLES: For blog posts and case studies, the terminal crumb label will be the slug-derived string, not the actual post title (e.g., 'My Great Post' vs 'my-great-post'). If brand-accurate terminal labels are required, the component must accept an optional currentPageLabel prop passed from the page's frontmatter. The current implementation is correct for structural crumbs but not for content-titled terminals. Mitigation: extend the component with an optional prop; the JSON-LD 'name' field for the last ListItem should use the frontmatter title when available.
- ASTRO.SITE NOT CONFIGURED: If astro.config.mjs does not set the site property, SITE_ORIGIN is an empty string and JSON-LD hrefs become relative paths. Google's BreadcrumbList spec requires absolute URLs. Mitigation: assert Astro.site is defined in the component and throw a build-time error if absent — Astro supports build-time errors via throw in the frontmatter fence.
- TRAILING SLASH CONSISTENCY: The href construction appends a trailing slash. If the site uses no-trailing-slash routing, canonical URLs will mismatch. Mitigation: make the trailing slash behavior a named constant (TRAILING_SLASH: boolean) derived from the Astro trailingSlash config value, and apply it conditionally.
- LAYOUT SCOPE: This fix assumes all pages use a single shared Layout.astro. If any page type uses an alternate layout (e.g., a bare landing page layout), those pages will not receive the breadcrumb. Mitigation: audit all layout files before deploy; add the Breadcrumb import to each layout that wraps depth-2+ pages.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
