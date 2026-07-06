---
finding_id: "api-1-minimal-network-waterfall"
title: "Minimal network waterfall — 6 requests, no API calls, no sequential dependencies — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The build-time guard makes it structurally impossible to accidentally introduce a render-blocking stylesheet or synchronous third-party script on content pages during future development."
fix_summary: "Preserve and extend the existing minimal-waterfall architecture to heavier page types (product, search, checkout) by codifying the structural decisions that produced this result into reusable Astro p…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# Minimal network waterfall — 6 requests, no API calls, no sequential dependencies — PASS

**Finding:** Minimal network waterfall — 6 requests, no API calls, no sequential dependencies — PASS  
**Severity:** Low  
**Why this matters:** The build-time guard makes it structurally impossible to accidentally introduce a render-blocking stylesheet or synchronous third-party script on content pages during future development.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Preserve and extend the existing minimal-waterfall architecture to heavier page types (product, search, checkout) by codifying the structural decisions that produced this result into reusable Astro p…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Network Waterfall Regression Prevention:** The build-time guard makes it structurally impossible to accidentally introduce a render-blocking stylesheet or synchronous third-party script on content pages during future development. Without this guard, a single dependency addition in a shared layout can silently undo the current 6-request waterfall across every content page simultaneously.
- **Transactional Page Improvement:** Applying the same build-time data-fetching pattern to product and search pages eliminates client-side fetch waterfalls where the browser must: (1) parse JS, (2) execute fetch, (3) receive data, (4) render — a sequential chain that delays LCP and INP. Moving this to Astro's build-time `getStaticPaths` or server-side `Astro.props` collapses that chain to a single HTML response.
- **Font Loading:** Self-hosting fonts with a preload hint and `font-display: swap` eliminates the DNS lookup, TLS handshake, and connection overhead of a third-party font CDN request. The preload ensures the font is fetched in parallel with the HTML parse rather than discovered after CSS evaluation.

## How to verify

**What to look for:** The page makes only 6 network requests total (1 document, 1 stylesheet, 3 fonts, 1 analytics script).. There are no API calls, no XHR/fetch requests, no GraphQL queries, and no sequential dependency chains.

**Measured evidence:**
- Total Requests: 6
- Api Calls: 0
- Xhr Fetch Requests: 0
- Total Transfer Kb: 105
- Unique Domains: 2
- Domains: ['weknowthewhy.com', 'plausible.io']
- Sequential Dependencies: none detected
- All Requests 200: True

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
Preserve and extend the existing minimal-waterfall architecture to heavier page types (product, search, checkout) by codifying the structural decisions that produced this result into reusable Astro patterns: build-time data fetching, single consolidated stylesheets, same-origin font serving, and async-only third-party scripts.

### How
1. AUDIT HEAVIER PAGE TYPES: Run the same network waterfall analysis on product, search, and checkout templates. Record request count, sequential dependencies, and total transfer size per template. This establishes the gap between the current exemplary content-page architecture and transactional pages.
2. ENFORCE BUILD-TIME DATA FETCHING ON CONTENT PAGES: Confirm all content-page templates use Astro's top-level `await` in the component script fence (not client-side fetch). Add an ESLint rule or Astro integration check that flags `fetch()` calls inside client-side `<script>` tags on content-page layouts.
3. CONSOLIDATE STYLESHEETS: Verify the single-stylesheet pattern is enforced in `astro.config.mjs` via `vite.build.cssCodeSplit: false` for content-page layouts, or that Tailwind's single output file is the only CSS entry point. Confirm no layout imports multiple `<link rel='stylesheet'>` tags.
4. SELF-HOST OR INLINE CRITICAL FONTS: If fonts are currently served from a CDN, move WOFF2 files to `public/fonts/`. Update the global layout to use `<link rel='preload'>` with `crossorigin` for the critical weight. Remove any Google Fonts or third-party font `<link>` tags from content-page layouts.
5. ENFORCE ASYNC-ONLY THIRD-PARTY SCRIPTS: Audit the global layout for any `<script src>` without `defer` or `async`. Plausible is already async — confirm no other analytics, chat, or ad script has been added without the same constraint. Add a comment block in the layout file marking the async-only policy.
6. DOCUMENT THE ARCHITECTURE AS AN ASTRO LAYOUT CONTRACT: Create `src/layouts/ContentPage.astro` as the canonical layout for all content pages. Embed the constraints as code comments and prop validation so future contributors cannot accidentally add render-blocking resources.
7. ADD A BUILD-TIME ASSERTION: Write a Vite plugin or `astro:build:done` integration hook that reads the generated HTML for content-page routes and fails the build if the `<head>` contains more than one `<link rel='stylesheet'>` or any synchronous `<script src>` without `defer`/`async`.

### Code examples
```
// astro.config.mjs — enforce single CSS bundle and async script policy
import { defineConfig } from 'astro/config';
import { contentPageBuildGuard } from './src/integrations/content-page-guard.mjs';

export default defineConfig({
  integrations: [contentPageBuildGuard()],
  vite: {
    build: {
      // Single CSS output for content pages — prevents stylesheet fragmentation
      // SITE-SPECIFIC ASSUMPTION: adjust if transactional pages require code-split CSS
      cssCodeSplit: false,
    },
  },
});
// src/integrations/content-page-guard.mjs
// Build-time assertion: fails the build if content-page HTML violates the
// minimal-waterfall contract (>1 stylesheet or any sync external script).
// SITE-SPECIFIC ASSUMPTION: content pages are identified by routes under /blog/, /docs/, /
// Adjust CONTENT_PAGE_PATTERN to match this site's URL structure.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { glob } from 'node:fs/promises';

const CONTENT_PAGE_PATTERN = /\/(blog|docs|about|contact)\//;
const MAX_STYLESHEETS = 1; // named constant — rationale: single consolidated CSS is the target state

export function contentPageBuildGuard() {
  return {
    name: 'content-page-build-guard',
    hooks: {
      'astro:build:done': async ({ dir, pages }) => {
        const violations = [];

        for (const { pathname } of pages) {
          if (!CONTENT_PAGE_PATTERN.test(pathname)) continue;

          const htmlPath = join(dir.pathname, pathname, 'index.html');
          let html;
          try {
            html = readFileSync(htmlPath, 'utf-8');
          } catch {
            // Page may not produce a file (e.g., redirect) — skip safely
            continue;
          }

          // Count render-blocking stylesheets
          const stylesheetMatches = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) ?? [];
          if (stylesheetMatches.length > MAX_STYLESHEETS) {
            violations.push(
              `${pathname}: ${stylesheetMatches.length} stylesheets (max ${MAX_STYLESHEETS})`
            );
          }

          // Detect synchronous external scripts (no defer, no async, no type=module)
          // type=module is implicitly deferred — safe to allow
          const syncScriptPattern = /<script\s+src=["'][^"']+["'](?![^>]*(defer|async|type=["']module["']))[^>]*>/gi;
          const syncMatches = html.match(syncScriptPattern) ?? [];
          if (syncMatches.length > 0) {
            violations.push(
              `${pathname}: ${syncMatches.length} synchronous external script(s) detected`
            );
          }
        }

        if (violations.length > 0) {
          throw new Error(
            `[content-page-build-guard] Waterfall contract violations:\n${violations.join('\n')}`
          );
        }
      },
    },
  };
}
---
// src/layouts/ContentPage.astro
// Canonical layout for all content pages.
// CONTRACT (enforced by content-page-build-guard at build time):
//   - Single consolidated stylesheet only
//   - No synchronous external scripts
//   - Fonts self-hosted from /fonts/ — no third-party font CDN requests
//   - No client-side fetch() for page content — all data resolved at build time
//
// SITE-SPECIFIC ASSUMPTION: font filenames below must match files in public/fonts/
// SITE-SPECIFIC ASSUMPTION: adjust font-weight values to match the typeface in use

import '../styles/global.css'; // single entry point — Vite consolidates into one file

const {
  title,
  description,
  canonicalUrl,
  ogImage,
} = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    <!-- Self-hosted font preload — crossorigin required to prevent double-fetch -->
    <!-- SITE-SPECIFIC ASSUMPTION: replace with actual font filename and weight -->
    <link
      rel="preload"
      href="/fonts/primary-400.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />

    <!-- Open Graph -->
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:type" content="website" />

    <!-- Plausible: async, no render-blocking, no third-party cookie -->
    <!-- SITE-SPECIFIC ASSUMPTION: replace data-domain with the registered Plausible domain -->
    <script
      defer
      data-domain="PLAUSIBLE_REGISTERED_DOMAIN"
      src="https://plausible.io/js/script.js"
    ></script>
  </head>
  <body>
    <slot />
  </body>
</html>

<style>
  /* Self-hosted font face — no external request -->
  /* SITE-SPECIFIC ASSUMPTION: update font-family name, src path, and weight to match project */
  @font-face {
    font-family: 'PrimaryFont';
    src: url('/fonts/primary-400.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    /* swap: eliminates FOIT; text renders in fallback immediately, swaps when font loads */
    font-display: swap;
  }
</style>
```

## Risks
- cssCodeSplit: false consolidates ALL CSS into one file globally. If transactional pages (checkout, product) have large page-specific CSS that should not ship to content pages, this setting will bloat content-page payloads. Mitigation: scope cssCodeSplit: false only to content-page entry points using Vite's manualChunks, or revert to cssCodeSplit: true and enforce the single-stylesheet contract via the build guard's stylesheet count check instead.
- The build guard's sync-script regex matches on raw HTML string patterns. A script tag with attributes in an unusual order (e.g., `<script src='...' id='x'>`) could evade the pattern if the regex is not comprehensive. Mitigation: the guard is a safety net, not the primary control — the layout contract (ContentPage.astro) is the primary enforcement mechanism. Test the regex against the actual build output before relying on it.
- Moving fonts to public/fonts/ requires the WOFF2 files to be committed to the repository or fetched during CI. If the font license prohibits self-hosting, this step must be skipped and the third-party font CDN request accepted as a known cost. Mitigation: verify font license before implementing self-hosting.
- The CONTENT_PAGE_PATTERN regex in the build guard must be kept in sync with the site's actual route structure. If new content sections are added (e.g., /resources/, /case-studies/), they must be added to the pattern or they will not be guarded. Mitigation: document the pattern in the project README and include it in the onboarding checklist for new route additions.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
