---
finding_id: "content-to-code-ratio-css-heavy"
title: "[SUBJECTIVE] CSS Payload Dominates Transfer — 106KB CSS vs ~3KB Content"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "If purge is misconfigured, fixing content globs eliminates the unused utility class surface area."
fix_summary: "Verify Tailwind's purge/tree-shake is active in production and add per-route CSS splitting for content-sparse pages."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# [SUBJECTIVE] CSS Payload Dominates Transfer — 106KB CSS vs ~3KB Content

**Finding:** [SUBJECTIVE] CSS Payload Dominates Transfer — 106KB CSS vs ~3KB Content  
**Severity:** Low  
**Why this matters:** If purge is misconfigured, fixing content globs eliminates the unused utility class surface area.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Verify Tailwind's purge/tree-shake is active in production and add per-route CSS splitting for content-sparse pages.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Css Transfer Size:** If purge is misconfigured, fixing content globs eliminates the unused utility class surface area. For a typical Tailwind+Astro site, this reduces compressed CSS from 100KB+ toward 5–25KB — a reduction proportional to how many utility classes the purge scanner was previously missing. The mechanism: smaller CSS = fewer bytes the browser must download and parse before first paint can begin.
- **Render Blocking Latency:** Adding <link rel='preload'> for the primary stylesheet moves CSS fetch to run in parallel with HTML parsing rather than sequentially after it. On connections where TTFB is already elevated, this eliminates one full round-trip from the critical rendering path. The mechanism is deterministic: preload changes the resource discovery point from 'after <head> is parsed' to 'as soon as the preload hint is encountered'.
- **Lcp And Fcp:** Reducing CSS parse time and eliminating render-blocking delay directly shortens the browser's style recalculation phase before first paint. Smaller stylesheets also reduce memory pressure during CSSOM construction, which is measurable on low-memory mobile devices where GC pauses during style recalculation are common.
- **Urgency Qualifier:** If Coverage confirms purge is already active and the 106KB is the genuine minimum, the performance impact of this finding is low — 106KB over HTTP/2 with Brotli transfers in under 100ms on a median mobile connection and is unlikely to be the critical path bottleneck. The preload hint (Step 5) is still worth adding as a zero-risk latency improvement.

## How to verify

**What to look for:** Of the 109KB total transfer, 106KB (97%) is CSS and only ~2.5KB is image content.. The page has 201 DOM elements and 68 stylesheet rules, suggesting the CSS file may be a global stylesheet serving the entire site rather than page-specific styles.

**Measured evidence:**
- Css Transfer Bytes: 108844
- Total Transfer Bytes: 111382
- Css Percentage Of Total: 97.7%
- Css Uncompressed Bytes: 1749756
- Css Unused Pct: 0.0
- Dom Elements: 201
- Stylesheet Rules: 68

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
Verify Tailwind's purge/tree-shake is active in production and add per-route CSS splitting for content-sparse pages. If purge is already active and the 106KB is genuinely minimal, add HTTP/2 server push hints and preload the stylesheet to eliminate any render-blocking latency — the architectural concern is real but the urgency is conditional on whether the stylesheet is render-blocking.

### How
STEP 1 — DIAGNOSE FIRST (5 min): Open Chrome DevTools → Coverage tab → reload the target sparse page. If unused CSS bytes > 10KB, purge is NOT working. If unused CSS ≈ 0KB, purge is working and the 106KB is the legitimate minimum — skip to Step 4.
STEP 2 — VERIFY TAILWIND PURGE CONFIG: Open tailwind.config.* and confirm `content` glob patterns cover all .astro, .ts, .tsx, .js, .jsx, .mdx files. A missing glob (e.g., forgetting src/pages/**/*.astro) silently disables purge for those files, causing the full utility set to ship.
STEP 3 — IF PURGE IS BROKEN: Fix the content globs (see code example 1). Run `astro build` and re-measure. Expect compressed CSS to drop from 106KB toward 5–25KB for a typical Tailwind+Astro site with a modest component surface area.
STEP 4 — ELIMINATE RENDER-BLOCKING LATENCY: Confirm the global stylesheet is NOT in a <link> that blocks first paint on content-sparse pages. In Astro, the global CSS import in a Layout component is automatically inlined or linked — verify it is not a synchronous <link rel='stylesheet'> in <head> without a preload hint.
STEP 5 — ADD PRELOAD HINT FOR THE CRITICAL STYLESHEET: In the root Layout component, add <link rel='preload' as='style'> before the <link rel='stylesheet'> so the browser fetches the CSS in parallel with HTML parsing rather than after it (see code example 2).
STEP 6 — OPTIONAL ROUTE-LEVEL CSS SPLITTING FOR SPARSE PAGES: If after purge the CSS is still >60KB compressed and sparse pages (error pages, landing pages) use a strict subset of components, extract a minimal layout-only stylesheet for those routes using Astro's per-page <style> or a dedicated slim layout (see code example 3). This is only warranted if Step 3 does not resolve the size.
STEP 7 — VERIFY IN PRODUCTION BUILD: Run `astro build && npx serve dist` locally. Use WebPageTest or Lighthouse to confirm: (a) CSS transfer size, (b) stylesheet is not render-blocking (no 'Eliminate render-blocking resources' warning), (c) Coverage unused bytes.

### Code examples
```
// CODE EXAMPLE 1: tailwind.config.mjs — correct content globs for Astro
// SITE-SPECIFIC ASSUMPTION: src/ is the project root for components and pages.
// Adjust glob paths if your project uses a non-standard directory layout.
import { defineConfig } from 'tailwindcss';

export default defineConfig({
  // Every file type that can contain Tailwind class names must be listed.
  // Missing a glob = those classes are never seen by the purge scanner
  // = the full utility set ships to production.
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,mdx,md,svelte,vue}',
    // Include any external component packages that ship Tailwind classes:
    // './node_modules/@your-org/design-system/dist/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
});
// CODE EXAMPLE 2: src/layouts/BaseLayout.astro — preload hint to eliminate
// render-blocking latency on the global stylesheet.
// SITE-SPECIFIC ASSUMPTION: global.css is the single compiled stylesheet.
// If Astro inlines CSS automatically for your build (check dist/), this
// preload is redundant but harmless.
---
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>

    <!--
      Preload the stylesheet so the browser fetches it in parallel with HTML
      parsing. Without this, the browser discovers the <link rel="stylesheet">
      only after parsing the <head>, adding one round-trip of latency.
      The onload/noscript pattern is only needed if you want non-blocking load
      for non-critical CSS — for the primary stylesheet, keep rel="stylesheet"
      but keep the preload hint above it.
    -->
    <link
      rel="preload"
      href="/styles/global.css"
      as="style"
    />
    <link rel="stylesheet" href="/styles/global.css" />

    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
// CODE EXAMPLE 3: src/layouts/SlimLayout.astro — minimal layout for
// content-sparse routes (404, maintenance, simple landing pages).
// Use ONLY when Step 3 (purge fix) still leaves CSS >60KB compressed
// AND the sparse page genuinely uses <20% of the global component surface.
//
// SITE-SPECIFIC ASSUMPTION: The slim layout uses only reset + typography +
// layout utilities. Adjust the imported stylesheet path to match your build.
// This layout must NOT be applied to pages that use nav, cart, modals, or
// any component defined only in the global stylesheet — doing so will cause
// unstyled component regressions.
---
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <!--
      slim.css is a manually curated or separately purged stylesheet
      containing only: CSS reset, typography scale, flex/grid layout utilities,
      and color tokens. Target: <15KB compressed.
      Generate it by running Tailwind's CLI against only this layout file:
        npx tailwindcss -i ./src/styles/base.css -o ./public/styles/slim.css
        --content './src/layouts/SlimLayout.astro,./src/pages/404.astro'
    -->
    <link rel="preload" href="/styles/slim.css" as="style" />
    <link rel="stylesheet" href="/styles/slim.css" />
  </head>
  <body>
    <slot />
  </body>
</html>

// Usage in src/pages/404.astro:
// ---
// import SlimLayout from '../layouts/SlimLayout.astro';
// ---
// <SlimLayout title="Page Not Found">
//   <main>...</main>
// </SlimLayout>
```

## Risks
- PURGE OVER-AGGRESSIVENESS: If content globs are tightened incorrectly (e.g., excluding a dynamically constructed class name like `text-${color}-500`), Tailwind will purge classes that are used at runtime. Mitigation: audit all dynamic class constructions in the codebase and add them to the Tailwind `safelist` array before tightening globs. Run visual regression tests across all page types after the build.
- SLIM LAYOUT REGRESSION (Code Example 3 only): Applying SlimLayout to a page that references a component styled only in global.css will produce an unstyled component with no build-time error — Astro will not warn you. Mitigation: maintain an explicit allowlist of pages permitted to use SlimLayout, enforced via a code comment convention or a lint rule. Never apply SlimLayout to pages with nav, cart, modal, or form components.
- PRELOAD HINT ON ALREADY-INLINED CSS: Astro's Vite pipeline may inline small CSS directly into <style> tags in the HTML output rather than emitting a separate .css file. If that happens, the <link rel='preload' href='/styles/global.css'> in Code Example 2 will 404 silently (preload failures do not block rendering but do generate console warnings). Mitigation: verify the dist/ output after `astro build` to confirm a separate CSS file exists before adding the preload hint. If Astro inlines the CSS, no preload is needed.
- NETLIFY CACHE INVALIDATION: After a purge fix reduces CSS file size, the filename hash in the Astro build output will change (Astro uses content-hashed filenames by default), which automatically busts the CDN cache. No manual cache purge is needed, but verify that Netlify's asset caching headers include immutable for hashed filenames to maximize cache hit rate on subsequent deploys.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
