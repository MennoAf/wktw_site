---
finding_id: "revenue-no-service-page-link-in-article"
title: "Article about audit failures does not link to the firm's own audit service page"
severity: "high"
root_cause_cluster: "Conversion Path Architecture — No On-Page Forms, No Inline CTAs, No Trust Signals"
why_this_matters: "Readers arriving via search on audit-failure queries currently reach a persuasion endpoint with no in-content pathway to the service page."
fix_summary: "Establish a two-layer internal linking system: (1) a hand-authored contextual CTA block embedded in the audit-failures article body at the point of maximum persuasion, and (2) a reusable Astro compon…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["trust-signals-absent-at-conversion-points"]
---

# Article about audit failures does not link to the firm's own audit service page

**Finding:** Article about audit failures does not link to the firm's own audit service page  
**Severity:** High  
**Why this matters:** Readers arriving via search on audit-failure queries currently reach a persuasion endpoint with no in-content pathway to the service page.  
**Root cause:** Conversion Path Architecture — No On-Page Forms, No Inline CTAs, No Trust Signals  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Establish a two-layer internal linking system: (1) a hand-authored contextual CTA block embedded in the audit-failures article body at the point of maximum persuasion, and (2) a reusable Astro compon…  

> **Evidence Basis:** Confirmed

---

## Also resolves (1)

One fix closes the findings below — they were folded here as the same remediation:

- `trust-signals-absent-at-conversion-points` (Medium) — Zero social proof elements on key conversion pages — trust deficit at point of consideration

## Impact

- **Organic Conversion Path:** Readers arriving via search on audit-failure queries currently reach a persuasion endpoint with no in-content pathway to the service page. The CTA placed at the agitation-to-conclusion transition intercepts intent at its peak — the moment the reader has accepted the problem framing and is primed for a solution. Without this link, the only conversion path is a separate navigation action after the article ends, which requires the reader to sustain intent across a context switch. The inline CTA eliminates that gap.
- **Seo Link Equity:** Internal links pass PageRank. If the audit-failures article accumulates backlinks over time (the expected outcome for thought-leadership content), that equity currently pools at the article URL and does not flow to /the-get-right/. Each internal link added from a topically relevant article to the service page creates an equity pathway. The effect compounds as more articles are published and linked.
- **Authoring Scalability:** The content-map config converts a discipline-dependent process into a config-dependent one. Future articles require one prop on one component — the correct URL, headline, and copy are resolved from config. This eliminates the class of failure where a new author publishes an article without a CTA because they were not briefed on the linking policy.
- **Analytics Attribution:** The data-cta-source and data-cta-service attributes on the anchor enable GA4 or equivalent to segment /the-get-right/ traffic by entry point. This makes the fix's impact measurable: sessions arriving at the service page via article CTAs become a trackable cohort, distinct from direct nav or search traffic.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The article 'Why most audits don't change anything' is a classic problem-agitation content piece that should naturally lead to the firm's solution.. However, the article does not contain any inline link to /the-get-right/ (which appears to be the service/methodology page based on its nav position).

**Measured evidence:**
- Service Page: /the-get-right/
- Inline Links To Service: 0
- Nav Links To Service: 1
- Article Topic: Why audits fail — directly relevant to the firm's audit service offering

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
Establish a two-layer internal linking system: (1) a hand-authored contextual CTA block embedded in the audit-failures article body at the point of maximum persuasion, and (2) a reusable Astro component with a content-map config that enforces topic-to-service-page linking for all current and future articles — preventing the authoring gap from recurring without relying on author discipline.

### How
STEP 1 — IMMEDIATE FIX (audit-failures article): Open the article's .astro or .md/.mdx source file. Locate the paragraph where the article pivots from agitation to conclusion — typically the final body section before any closing remarks. Insert the <ArticleCTA> component call at that position. This is the moment of maximum persuasion; placing it here captures intent before the reader reaches the end and exits.
STEP 2 — BUILD ArticleCTA COMPONENT: Create src/components/ArticleCTA.astro. The component accepts a required `service` prop (string key), looks up the matching entry in a local CONTENT_MAP config object, and renders a visually distinct inline CTA block. If the key is missing from the map, the component renders nothing and logs a dev-mode warning — it does not throw, so a misconfigured article never breaks the build.
STEP 3 — BUILD CONTENT MAP CONFIG: Create src/config/contentLinkMap.ts. This is the single source of truth mapping topic keys to service page slugs, CTA headline, and CTA body copy. Editors add new mappings here; they never hard-code URLs in article files. This makes the system refactor-safe: if /the-get-right/ is ever renamed, one config change propagates everywhere.
STEP 4 — WIRE MDX SUPPORT (if articles are .mdx): In astro.config.mjs, verify mdx integration is present and add ArticleCTA to the components passed to the MDX provider so authors can use <ArticleCTA service="audit" /> directly in .mdx files without an import statement per file.
STEP 5 — AUDIT EXISTING ARTICLES: Run a grep across src/content/ for articles that do NOT contain an ArticleCTA call. For each hit, identify the closest matching content-map key by topic and insert the component. This is a one-time editorial pass; the component handles all rendering.
STEP 6 — AUTHORING POLICY (process layer): Add a checklist item to whatever PR template or content review process exists: 'Does this article include an ArticleCTA component mapped to a relevant service page?' This is the only process change required — the component itself enforces correct output once the author adds it.

### Code examples
```
// src/config/contentLinkMap.ts
// SITE-SPECIFIC ASSUMPTION: slug values match actual Astro page routes.
// Update slugs here if routes change — one edit propagates to all articles.

export interface ContentLinkEntry {
  slug: string;          // Absolute path to the service page
  ctaHeadline: string;
  ctaBody: string;
  ctaLabel: string;
}

export const CONTENT_MAP: Record<string, ContentLinkEntry> = {
  audit: {
    slug: '/the-get-right/',
    ctaHeadline: 'Audits that actually change things',
    ctaBody:
      'The Get Right is our structured methodology for turning audit findings into shipped improvements. If what you just read resonates, this is what we do.',
    ctaLabel: 'See the methodology',
  },
  // Add additional topic keys here as new service pages are created.
  // Example:
  // performance: {
  //   slug: '/services/performance/',
  //   ctaHeadline: '...',
  //   ctaBody: '...',
  //   ctaLabel: '...',
  // },
} as const;
// src/components/ArticleCTA.astro
// Usage in .astro articles:  <ArticleCTA service="audit" />
// Usage in .mdx articles:    <ArticleCTA service="audit" />
//
// Preconditions:
//   - `service` prop must be a key present in CONTENT_MAP.
//   - If the key is absent, the component renders nothing (no build error).
//   - Component is purely presentational — no async, no fetch, no state.

---
import { CONTENT_MAP } from '../config/contentLinkMap';
import type { ContentLinkEntry } from '../config/contentLinkMap';

interface Props {
  service: string;
}

const { service } = Astro.props;

const entry: ContentLinkEntry | undefined = CONTENT_MAP[service];

if (!entry && import.meta.env.DEV) {
  // Warn during local development; silent in production to avoid build noise.
  console.warn(
    `[ArticleCTA] Unknown service key "${service}". Add it to src/config/contentLinkMap.ts.`
  );
}
---

{entry && (
  <aside
    class="article-cta"
    aria-label={entry.ctaHeadline}
  >
    <div class="article-cta__inner">
      <p class="article-cta__headline">{entry.ctaHeadline}</p>
      <p class="article-cta__body">{entry.ctaBody}</p>
      <a
        href={entry.slug}
        class="article-cta__link"
        data-cta-source="article-inline"
        data-cta-service={service}
      >
        {entry.ctaLabel}
        <span aria-hidden="true"> &rarr;</span>
      </a>
    </div>
  </aside>
)}

<style>
  /* Scoped to .article-cta — no global selector bleed. */
  .article-cta {
    margin-block: 2rem;
    padding: 1.5rem;
    border-inline-start: 4px solid var(--color-accent, #0057ff);
    background-color: var(--color-surface-subtle, #f5f7fa);
    border-radius: 4px;
  }

  .article-cta__headline {
    font-size: 1.125rem;
    font-weight: 700;
    margin-block-end: 0.5rem;
    /* Inherits article body color — no contrast risk introduced. */
  }

  .article-cta__body {
    margin-block-end: 1rem;
    /* Inherits article body font-size and line-height. */
  }

  .article-cta__link {
    display: inline-block;
    font-weight: 600;
    color: var(--color-accent, #0057ff);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* Visible focus indicator — never outline:none without replacement. */
  .article-cta__link:focus-visible {
    outline: 2px solid var(--color-accent, #0057ff);
    outline-offset: 3px;
    border-radius: 2px;
  }

  @media (prefers-reduced-motion: no-preference) {
    .article-cta__link {
      transition: opacity 150ms ease;
    }
    .article-cta__link:hover {
      opacity: 0.8;
    }
  }
</style>
// src/content/articles/why-most-audits-dont-change-anything.mdx
// SITE-SPECIFIC ASSUMPTION: file path matches actual article source location.
// Insert <ArticleCTA> at the paragraph immediately before the closing section —
// after the agitation argument is complete, before the conclusion.
//
// No per-file import needed if ArticleCTA is registered in astro.config.mjs
// MDX components config (see next example). Otherwise add:
// import ArticleCTA from '../../components/ArticleCTA.astro';

...existing article body copy...

The pattern repeats because the audit is treated as the deliverable, not the change.
When findings live in a PDF, they die in a PDF.

<ArticleCTA service="audit" />

## What actually has to happen

...closing section...
// astro.config.mjs
// Registers ArticleCTA globally for all .mdx files so authors
// do not need a per-file import. Requires @astrojs/mdx integration.
// SITE-SPECIFIC ASSUMPTION: mdx integration is already installed.
// If not: `npx astro add mdx`

import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import ArticleCTA from './src/components/ArticleCTA.astro';

export default defineConfig({
  integrations: [
    mdx({
      components: {
        // Key must match the JSX element name used in .mdx files.
        ArticleCTA,
      },
    }),
  ],
});
```

## Risks
- CSS VARIABLE FALLBACKS: The component uses CSS custom properties (--color-accent, --color-surface-subtle) with hardcoded fallback values. If the site's design system uses different variable names, the fallbacks will render with the hardcoded colors (#0057ff, #f5f7fa) rather than the brand palette. Mitigation: verify variable names against the site's global stylesheet before deploying; update fallback values in the component's <style> block to match.
- MDX GLOBAL COMPONENT REGISTRATION: Registering ArticleCTA in astro.config.mjs makes it available in all .mdx files without import. If the site has .mdx files where an element named ArticleCTA already exists for a different purpose (unlikely but possible), the global registration will shadow it. Mitigation: grep src/content/ for existing ArticleCTA usage before adding the global registration.
- CONTENT MAP KEY DISCIPLINE: The system's correctness depends on authors using a key that exists in CONTENT_MAP. A typo (e.g., service="audits" instead of service="audit") silently renders nothing in production. The DEV-mode console.warn catches this locally but not in CI. Mitigation: add a build-time content collection validation script that checks all ArticleCTA service props against CONTENT_MAP keys, or use TypeScript's keyof typeof CONTENT_MAP as the prop type to get compile-time errors.
- EXISTING ARTICLE AUDIT SCOPE: Step 5 requires a manual editorial pass over all existing articles. If the site has a large content archive, this is non-trivial effort. The grep identifies candidates but a human must judge topical fit and insertion point for each. Mitigation: prioritize articles with the highest organic traffic first (available from Search Console); the audit-failures article is the only one with near-perfect topical alignment and should be treated as the immediate fix regardless of the broader pass timeline.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
