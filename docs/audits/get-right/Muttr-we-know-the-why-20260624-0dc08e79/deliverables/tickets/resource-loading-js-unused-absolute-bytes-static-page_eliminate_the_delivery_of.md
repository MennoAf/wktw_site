---
finding_id: "resource-loading-js-unused-absolute-bytes-static-page"
title: "Eliminate the delivery of the full application JavaScript bundle (~2.56MB uncompressed, ~475KB unused) to static content pages (privacy policy, terms of service, legal, about) that have zero interactive JavaScript requirements beyond already-flagged analytics scripts. Implement route-level or page-type-level code splitting so that static text pages receive a minimal JS entrypoint — containing only the platform shell code strictly required for navigation continuity — rather than the monolithic application bundle built for interactive pages (cart, product configurators, checkout, filter/sort systems). The 475KB of parsed-but-never-executed JavaScript represents a page-scoping architectural failure, not a tree-shaking failure, and cannot be resolved by bundle optimization alone."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "Eliminating ~475KB of parsed-but-never-executed JavaScript removes the V8 parse and compile cost for that code on every static page load."
fix_summary: "Eliminate the delivery of the full application JavaScript bundle (~2.56MB uncompressed, ~475KB unused) to static content pages (privacy policy, terms of service, legal, about) that have zero interact…"
confidence_tier: "reviewer_identified"
---

# Eliminate the delivery of the full application JavaScript bundle (~2.56MB uncompressed, ~475KB unused) to static content pages (privacy policy, terms of service, legal, about) that have zero interactive JavaScript requirements beyond already-flagged analytics scripts. Implement route-level or page-type-level code splitting so that static text pages receive a minimal JS entrypoint — containing only the platform shell code strictly required for navigation continuity — rather than the monolithic application bundle built for interactive pages (cart, product configurators, checkout, filter/sort systems). The 475KB of parsed-but-never-executed JavaScript represents a page-scoping architectural failure, not a tree-shaking failure, and cannot be resolved by bundle optimization alone.

**Finding:** Eliminate the delivery of the full application JavaScript bundle (~2.56MB uncompressed, ~475KB unused) to static content pages (privacy policy, terms of service, legal, about) that have zero interactive JavaScript requirements beyond already-flagged analytics scripts. Implement route-level or page-type-level code splitting so that static text pages receive a minimal JS entrypoint — containing only the platform shell code strictly required for navigation continuity — rather than the monolithic application bundle built for interactive pages (cart, product configurators, checkout, filter/sort systems). The 475KB of parsed-but-never-executed JavaScript represents a page-scoping architectural failure, not a tree-shaking failure, and cannot be resolved by bundle optimization alone.  
**Severity:** Medium  
**Why this matters:** Eliminating ~475KB of parsed-but-never-executed JavaScript removes the V8 parse and compile cost for that code on every static page load.  
**Root cause:** Isolated issue  
**Fix:** Eliminate the delivery of the full application JavaScript bundle (~2.56MB uncompressed, ~475KB unused) to static content pages (privacy policy, terms of service, legal, about) that have zero interact…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Main Thread Parse Compile Cost:** Eliminating ~475KB of parsed-but-never-executed JavaScript removes the V8 parse and compile cost for that code on every static page load. JavaScript parse and compile is CPU-bound work that runs on the main thread before any execution occurs — this cost is paid even for code that is never called. On mid-range mobile devices, parsing 475KB of JS can consume 300–800ms of main thread time. Removing it directly reduces Time to Interactive and eliminates a source of INP degradation during the page load window.
- **Time To Interactive:** Static pages currently force the browser to parse, compile, and evaluate the full application bundle before the page is considered interactive. With a minimal static-shell entrypoint targeting <50KB compressed, the JS evaluation phase is reduced from the full application bootstrap sequence to navigation shell initialization only. This directly shortens the gap between FCP (already excellent at 0.30s per the companion finding) and TTI.
- **Inp During Load Window:** The 475KB of unused JS creates long tasks on the main thread during page load. Long tasks (>50ms) block input processing, meaning any user interaction during the load window — scroll, link click, back navigation — is queued behind JS evaluation. Eliminating the unused payload reduces the probability and duration of input-blocking long tasks, improving INP for users who interact early.
- **Bandwidth And Data Cost:** Reducing JS delivery from ~2.56MB to a target of <50KB compressed eliminates approximately 2.5MB of unnecessary data transfer per static page visit. For users on metered mobile connections or in bandwidth-constrained regions, this is a direct reduction in data cost and load time. The impact is proportionally larger on 3G connections where JS transfer time, not just parse time, is the bottleneck.
- **Core Web Vitals Cohort:** Google's Core Web Vitals field data is segmented by device type and connection speed. Sites with heavy JS payloads on content pages frequently appear in the 'poor' INP cohort on mobile, which directly affects Search ranking signals. Reducing the JS surface on static pages moves these pages toward the 'good' INP threshold (<200ms), improving their eligibility for positive ranking treatment in Google Search.
- **Crawl Efficiency:** Googlebot and other crawlers evaluate page resource weight as a signal of crawl efficiency. Delivering 2.56MB of JS to a 7KB content page is a crawl budget inefficiency. Reducing the JS payload on static pages allows crawlers to process more pages per crawl session, which is particularly relevant if the site has a large number of static content pages (legal, help, informational).
- **Cache Efficiency:** A monolithic bundle shared across all page types means any change to an interactive feature (cart, product page) invalidates the cached bundle for static pages too, forcing re-download. Splitting into page-type-specific entrypoints allows static-shell.js to have a long cache TTL that is rarely invalidated, since static page shell code changes infrequently. Interactive feature bundles can be invalidated independently without affecting static page visitors.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/legal/privacy

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
Eliminate the delivery of the full application JavaScript bundle (~2.56MB uncompressed, ~475KB unused) to static content pages (privacy policy, terms of service, legal, about) that have zero interactive JavaScript requirements beyond already-flagged analytics scripts. Implement route-level or page-type-level code splitting so that static text pages receive a minimal JS entrypoint — containing only the platform shell code strictly required for navigation continuity — rather than the monolithic application bundle built for interactive pages (cart, product configurators, checkout, filter/sort systems). The 475KB of parsed-but-never-executed JavaScript represents a page-scoping architectural failure, not a tree-shaking failure, and cannot be resolved by bundle optimization alone.

### How
The implementation path depends on the platform/framework in use. Three concrete paths are provided: (A) Next.js / React-based SSR or SSG, (B) Nuxt.js / Vue-based SSR or SSG, and (C) platform-agnostic manual chunk splitting via a build tool (Webpack/Vite). Identify which applies before beginning.

**Phase 1 — Audit and Classify Page Types (1–2 days)**
1. Enumerate all page templates in the CMS or framework router. Classify each as: STATIC (no interactive JS beyond navigation), INTERACTIVE_LIGHT (forms, accordions, basic UI), or INTERACTIVE_HEAVY (cart, checkout, product configurator, filter/sort).
2. For each STATIC page type, document which JS modules are actually required. Expected answer: platform navigation shell, consent manager initialization, analytics loader (already flagged separately). Nothing else.
3. Use Chrome DevTools Coverage tab (or Playwright with coverage API) to capture per-file unused byte counts for a representative static page. Confirm the 475KB figure and identify which specific bundles contribute it. This is the baseline measurement for post-fix validation.
4. Identify the build entrypoint that produces the monolithic bundle. Confirm it is shared across all page types without conditional splitting.

**Phase 2 — Implement Page-Type-Aware Code Splitting**

Path A — Next.js (App Router or Pages Router):
- In App Router: static pages are Server Components by default. Ensure no 'use client' directive exists on the page component or its imports unless strictly required. Each 'use client' boundary pulls its entire import tree into the client bundle.
- Audit the layout.tsx or _app.tsx for globally imported interactive components (modals, cart drawers, toast systems). Wrap these in dynamic() with ssr:false and a condition that prevents loading on static page types.
- Use next/dynamic with loading boundary to defer non-critical interactive components.

Path B — Nuxt.js:
- Use definePageMeta to assign page-type metadata, then conditionally register plugins and components only for pages that require them.
- Lazy-import heavy components using defineAsyncComponent.

Path C — Webpack/Vite manual splitting:
- Define separate entrypoints for static vs interactive page types in the bundler config.
- Use dynamic import() at the router level to load interactive feature chunks only when the route requires them.

**Phase 3 — Validate and Measure (1 day)**
1. After implementing splitting, re-run Coverage API on the static page. Target: unused JS bytes reduced from ~475KB to <20KB (residual from navigation shell and any unavoidable platform bootstrap).
2. Verify no interactive features are broken on pages that legitimately require them — run smoke tests on cart, checkout, product pages.
3. Measure parse/compile time reduction using Chrome DevTools Performance panel. The main thread JS parse+compile cost for 475KB of unused code is the primary metric to confirm eliminated.
4. Record new total JS transfer size for the static page as the post-fix baseline.

### Code examples
```
// ─────────────────────────────────────────────────────────────────────────────
// PATH A: Next.js App Router — Prevent interactive components from loading
// on static page types by keeping the page as a pure Server Component.
//
// SITE-SPECIFIC ASSUMPTION: This example targets a /privacy route.
// Adjust the path and component names to match your actual routing structure.
// ─────────────────────────────────────────────────────────────────────────────

// app/privacy/page.tsx — NO 'use client' directive.
// This page is a React Server Component. Zero client JS is emitted for it.
// Interactive shell components (nav, consent banner) are loaded via the
// root layout and are already part of the minimal shell bundle.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How we collect, use, and protect your data.',
};

// Pure server render — no hydration, no client bundle for this component.
export default function PrivacyPage() {
  return (
    <main id="main-content">
      <h1>Privacy Policy</h1>
      {/* Static content rendered server-side. No JS shipped for this component. */}
    </main>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// PATH A (continued): Next.js — Lazy-load interactive shell components
// in root layout so they do NOT block static page rendering.
//
// SITE-SPECIFIC ASSUMPTION: CartDrawer, SearchModal, and ToastSystem are
// the interactive components currently imported statically in layout.tsx,
// contributing to the monolithic bundle delivered to all pages.
// Replace these names with your actual component paths.
// ─────────────────────────────────────────────────────────────────────────────

// app/layout.tsx
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// NAMED CONSTANTS — rationale documented inline
// These components are deferred because they are never needed on static pages
// and their import trees pull in cart state, animation libraries, and form
// validation — the primary contributors to the 475KB unused payload.
const CartDrawer = dynamic(
  () => import('@/components/cart/CartDrawer'),
  {
    ssr: false,
    // loading: () => null — intentionally no skeleton; drawer is off-canvas
  }
);

const SearchModal = dynamic(
  () => import('@/components/search/SearchModal'),
  { ssr: false }
);

const ToastSystem = dynamic(
  () => import('@/components/ui/ToastSystem'),
  { ssr: false }
);

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        {/* Navigation is server-rendered — no JS cost for static pages */}
        <header>
          {/* StaticNav — server component, no 'use client' */}
        </header>

        {children}

        {/*
          Interactive shell components are dynamically imported.
          On static pages, Next.js will NOT include their JS in the
          page bundle unless the component is actually rendered into
          the viewport. With ssr:false, they are excluded from the
          server render entirely and loaded client-side only when
          a user action triggers them (e.g., cart icon click).

          SITE-SPECIFIC ASSUMPTION: If your cart drawer is always
          mounted (not conditionally rendered), move it behind a
          client-side gate using useEffect + useState to prevent
          eager loading on static pages.
        */}
        <CartDrawer />
        <SearchModal />
        <ToastSystem />
      </body>
    </html>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// PATH A (continued): Client-side gate pattern for always-mounted
// interactive components. Prevents eager JS loading on static pages
// by deferring mount until after hydration is confirmed.
//
// Use this pattern when a component must be in the DOM on interactive
// pages but has no purpose on static pages.
// ─────────────────────────────────────────────────────────────────────────────

// components/shell/InteractiveShell.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// NAMED CONSTANT — rationale: delay interactive shell mount until after
// LCP paint to avoid competing with critical rendering path.
// 0ms defers to next event loop tick post-hydration; increase if
// shell initialization causes INP regression on low-end devices.
const SHELL_MOUNT_DELAY_MS = 0;

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'));
const SearchModal = dynamic(() => import('@/components/search/SearchModal'));

export function InteractiveShell() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Defer shell mount to prevent blocking LCP on static pages.
    // On static pages, this component should not be included in the
    // layout at all — see layout.tsx page-type routing.
    const timerId = setTimeout(() => {
      setIsMounted(true);
    }, SHELL_MOUNT_DELAY_MS);

    return () => {
      // OBSERVER TEARDOWN: always clear timers on unmount
      clearTimeout(timerId);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <CartDrawer />
      <SearchModal />
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// PATH B: Nuxt.js — Page-type-aware plugin and component loading.
//
// SITE-SPECIFIC ASSUMPTION: Plugin names and page meta keys must match
// your actual Nuxt plugin filenames and routing conventions.
// ─────────────────────────────────────────────────────────────────────────────

// pages/privacy.vue — Static page: opt out of interactive plugins
<script setup lang="ts">
definePageMeta({
  // SITE-SPECIFIC ASSUMPTION: 'pageType' is a custom meta key.
  // Register it in your Nuxt type augmentation if using TypeScript.
  pageType: 'static',
});
</script>

<template>
  <main id="main-content">
    <h1>Privacy Policy</h1>
    <!-- Static content only -->
  </main>
</template>
// plugins/interactive-shell.client.ts — Nuxt plugin that self-disables
// on static page types, preventing interactive component registration.
//
// SITE-SPECIFIC ASSUMPTION: The components registered here (CartDrawer,
// ProductQuickView) are the primary contributors to the unused 475KB.
// Audit your own bundle to confirm which plugins to gate.

import { defineNuxtPlugin, useRoute } from '#app';

// NAMED CONSTANT — page types that must never receive interactive shell JS
const STATIC_PAGE_TYPES = new Set(['static', 'legal', 'informational'] as const);

export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute();
  const pageType = route.meta?.pageType as string | undefined;

  // Bail out entirely on static pages — no components registered,
  // no event listeners attached, no JS cost beyond this guard check.
  if (pageType !== undefined && STATIC_PAGE_TYPES.has(pageType as never)) {
    return;
  }

  // Interactive shell initialization — only runs on non-static pages.
  // Lazy import prevents this module from entering the static page bundle.
  import('@/composables/useCartStore').then(({ useCartStore }) => {
    nuxtApp.provide('cart', useCartStore());
  }).catch((err: unknown) => {
    // NULL-GUARD: log but do not throw — cart failure must not break page render
    console.error('[InteractiveShell] Cart store initialization failed:', err);
  });
});
// ─────────────────────────────────────────────────────────────────────────────
// PATH C: Vite — Manual entrypoint splitting for static vs interactive pages.
// Use when the framework does not provide native route-level splitting.
//
// SITE-SPECIFIC ASSUMPTION: File paths, page type arrays, and chunk names
// must be adjusted to match your actual project structure.
// ─────────────────────────────────────────────────────────────────────────────

// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

// NAMED CONSTANTS — rationale documented inline

// Pages that should receive ONLY the minimal static entrypoint.
// Add new static page paths here as the site grows.
// SITE-SPECIFIC ASSUMPTION: These paths match your HTML file structure
// or your SSR route definitions. Adjust to match actual routes.
const STATIC_PAGE_ROUTES = [
  'privacy',
  'terms',
  'legal',
  'about',
  'accessibility',
] as const;

// Chunk size warning threshold in KB (Vite default: 500KB).
// Lowered to 200KB to surface bundle size regressions earlier.
const CHUNK_SIZE_WARNING_LIMIT_KB = 200;

export default defineConfig({
  build: {
    chunkSizeWarningLimit: CHUNK_SIZE_WARNING_LIMIT_KB,
    rollupOptions: {
      input: {
        // Minimal entrypoint for static pages — imports ONLY:
        // platform navigation shell, consent manager hook, analytics loader.
        // SITE-SPECIFIC ASSUMPTION: Adjust this path to your actual
        // static entrypoint file.
        'static-shell': resolve(__dirname, 'src/entries/static-shell.ts'),

        // Full interactive entrypoint for product, cart, checkout pages.
        // SITE-SPECIFIC ASSUMPTION: Adjust to your actual main entrypoint.
        'app': resolve(__dirname, 'src/entries/app.ts'),
      },
      output: {
        // Deterministic chunk naming for cache-busting and debugging.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',

        manualChunks(id: string) {
          // Isolate vendor libraries into stable chunks for long-term caching.
          // SITE-SPECIFIC ASSUMPTION: Adjust vendor paths to match your
          // actual dependency names in node_modules.
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@shopify') || id.includes('node_modules/storefront-api')) {
            // SITE-SPECIFIC ASSUMPTION: Only relevant for Shopify-based platforms.
            // Remove or replace for non-Shopify implementations.
            return 'vendor-shopify';
          }
          // Cart, checkout, and product configurator logic — never needed
          // on static pages. Isolated here to confirm exclusion from
          // static-shell entrypoint via bundle analysis.
          if (
            id.includes('/src/features/cart/') ||
            id.includes('/src/features/checkout/') ||
            id.includes('/src/features/configurator/')
          ) {
            return 'interactive-features';
          }
        },
      },
    },
  },
});
// src/entries/static-shell.ts — Minimal entrypoint for static pages.
// This file defines the COMPLETE JavaScript surface for static content pages.
// If a module is not imported here, it does not ship to static pages.
//
// Target total transfer size: <30KB compressed.
// If this file's compiled output exceeds 30KB, audit imports immediately.
//
// SITE-SPECIFIC ASSUMPTION: Module paths must match your actual project
// structure. The consent manager and analytics loader referenced here
// are assumed to already exist — do not create new ones for this fix.

// 1. Platform navigation shell — required for menu, skip-link, mobile nav.
//    SITE-SPECIFIC ASSUMPTION: Replace with your actual nav initialization module.
import '@/platform/navigation-shell';

// 2. Consent manager hook — required for GDPR/CCPA compliance on all pages.
//    SITE-SPECIFIC ASSUMPTION: Replace with your actual consent module.
//    This must be the SAME consent module used on interactive pages to
//    prevent consent state fragmentation across page types.
import '@/platform/consent-manager';

// 3. Analytics loader — deferred, non-blocking.
//    Loads only after consent is confirmed. Uses requestIdleCallback
//    to avoid competing with LCP on text-based pages.
//    SITE-SPECIFIC ASSUMPTION: Replace with your actual analytics bootstrap.
if ('requestIdleCallback' in window) {
  // FEATURE-DETECT before use — requestIdleCallback has >95% support
  // but is absent in Safari <16. The setTimeout fallback ensures
  // analytics still loads on unsupported browsers.
  window.requestIdleCallback(() => {
    import('@/platform/analytics-loader').catch((err: unknown) => {
      // NULL-GUARD: analytics failure must never break page functionality
      console.warn('[StaticShell] Analytics loader failed to initialize:', err);
    });
  });
} else {
  // NAMED CONSTANT — rationale: 2000ms gives LCP time to complete on
  // slow connections before analytics initialization competes for bandwidth.
  const ANALYTICS_FALLBACK_DELAY_MS = 2000;
  const fallbackTimer = setTimeout(() => {
    import('@/platform/analytics-loader').catch((err: unknown) => {
      console.warn('[StaticShell] Analytics loader failed to initialize:', err);
    });
  }, ANALYTICS_FALLBACK_DELAY_MS);

  // OBSERVER TEARDOWN: expose cleanup for test environments
  // In production this timer runs to completion; in tests, call this.
  (window as Window & { __staticShellCleanup?: () => void }).__staticShellCleanup = () => {
    clearTimeout(fallbackTimer);
  };
}
// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION SCRIPT — Run post-deployment to confirm bundle reduction.
// Uses Playwright + Chrome Coverage API to measure unused JS bytes.
//
// Run: npx ts-node scripts/validate-static-page-bundle.ts
//
// SITE-SPECIFIC ASSUMPTION: TARGET_URL must be set to your actual
// privacy/static page URL. THRESHOLDS are based on the 475KB baseline
// identified in the audit — adjust if your baseline differs.
// ─────────────────────────────────────────────────────────────────────────────

import { chromium, type Page, type Browser } from 'playwright';

// SITE-SPECIFIC ASSUMPTION: Replace with your actual static page URL.
const TARGET_URL = 'https://example.com/privacy';

// NAMED CONSTANTS — rationale documented inline

// Maximum acceptable total JS transfer size for a static page (bytes, compressed).
// Baseline was 2.56MB; target is navigation shell + consent + analytics only.
// SITE-SPECIFIC ASSUMPTION: Adjust based on your shell bundle output size.
const MAX_TOTAL_JS_TRANSFER_BYTES = 50_000; // 50KB compressed

// Maximum acceptable unused JS bytes after fix.
// Pre-fix baseline: ~475KB. Post-fix target: <20KB (residual bootstrap noise).
const MAX_UNUSED_JS_BYTES = 20_000; // 20KB

// Maximum acceptable unused JS percentage after fix.
const MAX_UNUSED_JS_PCT = 15; // percent

interface CoverageEntry {
  url: string;
  ranges: Array<{ start: number; end: number }>;
  text: string;
}

async function validateStaticPageBundle(): Promise<void> {
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch();
    const page: Page = await browser.newPage();

    await page.coverage.startJSCoverage();
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

    const coverage: CoverageEntry[] = await page.coverage.stopJSCoverage();

    let totalBytes = 0;
    let usedBytes = 0;

    for (const entry of coverage) {
      const entryTotalBytes = entry.text.length;
      totalBytes += entryTotalBytes;

      for (const range of entry.ranges) {
        usedBytes += range.end - range.start;
      }
    }

    const unusedBytes = totalBytes - usedBytes;
    const unusedPct = totalBytes > 0 ? (unusedBytes / totalBytes) * 100 : 0;

    console.log('\n=== Static Page Bundle Validation ===');
    console.log(`Total JS (uncompressed): ${(totalBytes / 1024).toFixed(1)}KB`);
    console.log(`Used JS: ${(usedBytes / 1024).toFixed(1)}KB`);
    console.log(`Unused JS: ${(unusedBytes / 1024).toFixed(1)}KB (${unusedPct.toFixed(1)}%)`);

    const failures: string[] = [];

    if (unusedBytes > MAX_UNUSED_JS_BYTES) {
      failures.push(
        `FAIL: Unused JS ${(unusedBytes / 1024).toFixed(1)}KB exceeds threshold of ${(MAX_UNUSED_JS_BYTES / 1024).toFixed(0)}KB`
      );
    }

    if (unusedPct > MAX_UNUSED_JS_PCT) {
      failures.push(
        `FAIL: Unused JS ${unusedPct.toFixed(1)}% exceeds threshold of ${MAX_UNUSED_JS_PCT}%`
      );
    }

    if (failures.length > 0) {
      console.error('\nValidation FAILED:');
      failures.forEach((f) => console.error(` ${f}`));
      process.exit(1);
    } else {
      console.log('\nValidation PASSED — static page bundle within acceptable thresholds.');
      process.exit(0);
    }
  } finally {
    // OBSERVER TEARDOWN: always close browser, even on error
    if (browser !== undefined) {
      await browser.close();
    }
  }
}

void validateStaticPageBundle();
```

## Risks
- RISK: Shared state fragmentation — If the interactive shell initializes global state (auth tokens, cart counts, feature flags) that static pages silently depend on via shared cookies or localStorage, removing the shell from static pages may cause subtle failures (e.g., nav cart count showing 0, auth-gated links not rendering correctly). MITIGATION: Audit every piece of global state initialized by the current monolithic bundle. For state that static pages legitimately need (auth status for nav rendering), move initialization into the static-shell entrypoint explicitly. Do not assume static pages have no state dependencies — verify with integration tests before deploying.
- RISK: Consent manager state desynchronization — If the consent manager is initialized differently on static vs interactive pages (different module version, different initialization order), consent state may not persist correctly across navigation from a static page to an interactive page. MITIGATION: The static-shell entrypoint must import the IDENTICAL consent manager module used on interactive pages — not a stripped version. Consent state must be stored in a shared mechanism (cookie or localStorage) that both entrypoints read and write identically. Test the full consent → navigate → interactive page flow before deploying.
- RISK: Analytics event loss during entrypoint transition — If a user navigates from a static page (minimal shell) to an interactive page (full app bundle), the analytics initialization sequence may differ, causing session fragmentation or duplicate session starts. MITIGATION: Ensure the analytics loader in the static-shell entrypoint uses the same session ID mechanism as the full app. Test cross-page-type navigation flows in a staging environment with network request monitoring to confirm no duplicate session events or dropped pageviews.
- RISK: Build pipeline complexity increase — Introducing multiple entrypoints increases build configuration surface area. Misconfigured manualChunks or incorrect entrypoint assignment can cause modules to be duplicated across chunks (shipped in both static-shell and app bundles), negating the size reduction. MITIGATION: After implementing splitting, run bundle analysis (rollup-plugin-visualizer for Vite, @next/bundle-analyzer for Next.js) to confirm no module duplication. Add the validation script to CI to catch regressions before deployment.
- RISK: Framework-level global imports bypassing splitting — Some frameworks (older Next.js Pages Router, some Nuxt plugin configurations) import certain modules globally in ways that bypass manual splitting — for example, a plugin registered in nuxt.config.ts without client-only gating will be included in every page's bundle regardless of manualChunks configuration. MITIGATION: Verify splitting effectiveness with the Playwright Coverage validation script against a deployed staging environment, not just by inspecting build output. Build output analysis shows what is in each chunk; Coverage API shows what is actually executed on a specific page.
- RISK: Third-party scripts injected outside the bundle — The companion finding (resource-loading-js-payload-disproportionate) identifies 290KB of analytics scripts. If these are injected via a tag manager (GTM) rather than the application bundle, they will not be affected by entrypoint splitting and will continue to load on static pages. MITIGATION: This fix addresses the application bundle only. The analytics payload is a separate architectural concern addressed by the companion finding. Do not conflate the two — validate each independently. The 475KB unused figure is distinct from the 290KB analytics figure.
- RISK: SSR/SSG hydration mismatch on Next.js — If the static page component is a Server Component but the layout imports Client Components that expect hydration, React may emit hydration mismatch warnings or errors if the server-rendered HTML does not match what the client-side minimal bundle produces. MITIGATION: Test static pages with React strict mode enabled in development. Confirm no hydration warnings in the browser console after implementing the dynamic() splits. If mismatches occur, the root cause is typically a Client Component in the layout that reads browser-only state (window, localStorage) during SSR — fix by wrapping in useEffect or moving to a client-only boundary.

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
