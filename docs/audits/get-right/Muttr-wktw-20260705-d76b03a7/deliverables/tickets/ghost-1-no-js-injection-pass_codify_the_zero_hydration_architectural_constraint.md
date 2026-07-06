---
finding_id: "ghost-1-no-js-injection-pass"
title: "Zero JS-injected DOM elements — raw and rendered DOM identical — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Prevents accidental hydration boundary introduction on static-only templates."
fix_summary: "Codify the zero-hydration architectural constraint for this page template as an automated CI assertion, preventing future contributors from accidentally introducing Astro island directives (client:lo…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# Zero JS-injected DOM elements — raw and rendered DOM identical — PASS

**Finding:** Zero JS-injected DOM elements — raw and rendered DOM identical — PASS  
**Severity:** Low  
**Why this matters:** Prevents accidental hydration boundary introduction on static-only templates.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Codify the zero-hydration architectural constraint for this page template as an automated CI assertion, preventing future contributors from accidentally introducing Astro island directives (client:lo…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Build Safety:** Prevents accidental hydration boundary introduction on static-only templates. Without this guard, a contributor adding a single client:load directive to a shared component silently reintroduces a hydration gap window — the period between HTML parse and JS execution during which interactive-looking elements discard user input. The CI assertion catches this at build time, before it reaches production.
- **Crawl And Seo Stability:** Astro island markers inject additional <script type='module'> tags and custom elements into the HTML. On a page currently passing with zero such markers, their introduction would increase HTML payload size and add render-blocking or parser-inserted script evaluation. The assertion preserves the current lean, fully-crawlable static output.
- **Maintenance Overhead:** Codifying the architectural intent as a machine-enforced rule eliminates the need for manual code review to catch client: directive drift on this template type. The check is O(n) string scan over built HTML — negligible build time cost.

## How to verify

**What to look for:** The HTML comparison data shows zero elements injected by JavaScript: 154 raw elements → 154 rendered elements (0 injected).. Text content is identical (2,452 chars in both).

**Measured evidence:**
- Raw Elements: 233
- Rendered Elements: 233
- Js Injected Elements: 0
- Raw Text Chars: 3053
- Rendered Text Chars: 3053
- Content Availability Pct: 100
- Js Dependency: low
- Content Availability: 100%

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
Codify the zero-hydration architectural constraint for this page template as an automated CI assertion, preventing future contributors from accidentally introducing Astro island directives (client:load, client:idle, client:visible, client:only) that would break the static-only contract and reintroduce hydration-gap risk.

### How
1. Identify the page template file responsible for this page type (e.g., src/pages/index.astro, src/layouts/StaticPage.astro, or the relevant content collection layout).
2. Add a JSDoc/comment block at the top of the template file declaring the zero-hydration contract explicitly, so contributors understand the constraint before editing.
3. Create a lightweight Astro integration or build-time check script (src/scripts/assert-no-islands.mjs) that parses the compiled HTML output for this template and asserts zero occurrences of Astro's island hydration markers (astro-island custom element, data-astro-cid attributes on interactive components, or <script type='module'> tags injected by client: directives).
4. Wire the assertion script into the Netlify build command so it runs after `astro build` and before deployment. If the assertion fails, the build exits non-zero and Netlify aborts the deploy.
5. Optionally, add an Astro integration hook (astro:build:done) to run the check natively within the Astro build pipeline without a separate shell step.
6. Document the constraint and the CI check in the project README or a CONTRIBUTING.md note scoped to this template.

### Code examples
```
// src/scripts/assert-no-islands.mjs
// PURPOSE: Asserts that the specified built HTML pages contain zero Astro island
// hydration markers. Run after `astro build` to enforce the zero-hydration contract
// on static-only page templates.
//
// SITE-SPECIFIC ASSUMPTION: OUTPUT_DIR and STATIC_TEMPLATES must be adjusted to
// match this project's actual dist/ structure and template output paths.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// --- CONFIGURABLE CONSTANTS (adjust per project) ---

/** Astro's default build output directory. Change if astro.config outDir differs. */
const OUTPUT_DIR = 'dist';

/**
 * Relative paths within OUTPUT_DIR to the HTML files that must remain island-free.
 * Add every static-only template output path here.
 * SITE-SPECIFIC: Update these paths to match actual built output.
 */
const STATIC_TEMPLATES = [
  'index.html',
  // 'about/index.html',
  // 'blog/index.html',
];

/**
 * Astro island hydration markers injected into HTML when any client:* directive
 * is active. Presence of any of these strings indicates a hydration boundary.
 */
const ISLAND_MARKERS = [
  '<astro-island',
  'client:load',
  'client:idle',
  'client:visible',
  'client:only',
  'client:media',
];

// --- ASSERTION LOGIC ---

let failureCount = 0;

for (const templatePath of STATIC_TEMPLATES) {
  const absolutePath = resolve(OUTPUT_DIR, templatePath);

  if (!existsSync(absolutePath)) {
    console.error(`[assert-no-islands] MISSING: ${absolutePath} — build output not found. Check OUTPUT_DIR and STATIC_TEMPLATES config.`);
    failureCount++;
    continue;
  }

  let html;
  try {
    html = readFileSync(absolutePath, 'utf-8');
  } catch (err) {
    console.error(`[assert-no-islands] READ ERROR: ${absolutePath} — ${err.message}`);
    failureCount++;
    continue;
  }

  const foundMarkers = ISLAND_MARKERS.filter((marker) => html.includes(marker));

  if (foundMarkers.length > 0) {
    console.error(
      `[assert-no-islands] FAIL: ${templatePath} contains island hydration markers: ${foundMarkers.join(', ')}\n` +
      `  This template is declared zero-hydration. Remove client:* directives from all components used in this template.`
    );
    failureCount++;
  } else {
    console.log(`[assert-no-islands] PASS: ${templatePath} — zero island markers detected.`);
  }
}

if (failureCount > 0) {
  console.error(`\n[assert-no-islands] ${failureCount} template(s) failed the zero-hydration assertion. Aborting.`);
  process.exit(1);
}

console.log('\n[assert-no-islands] All static templates passed zero-hydration assertion.');
process.exit(0);
// netlify.toml — wire the assertion into the Netlify build pipeline
// SITE-SPECIFIC ASSUMPTION: Adjust base, publish, and command to match project structure.
// The assertion runs after astro build; a non-zero exit aborts the Netlify deploy.

[build]
  base    = "/"                          # monorepo: set to package subdirectory if needed
  publish = "dist"                       # must match astro.config outDir
  command = "astro build && node src/scripts/assert-no-islands.mjs"

[build.environment]
  NODE_VERSION = "20"                    # SITE-SPECIFIC: match your project's Node version
// ALTERNATIVE: Native Astro integration hook (astro.config.mjs)
// Use this approach if you prefer keeping the check inside the Astro build pipeline
// rather than a separate shell step. Runs in astro:build:done, after all HTML is emitted.
//
// SITE-SPECIFIC ASSUMPTION: STATIC_TEMPLATES paths and ISLAND_MARKERS are identical
// to the standalone script above — adjust to match actual output paths.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'astro/config';

/** @type {string[]} Paths relative to the build outDir that must remain island-free. */
const STATIC_TEMPLATES = [
  'index.html',
  // 'about/index.html',
];

const ISLAND_MARKERS = [
  '<astro-island',
  'client:load',
  'client:idle',
  'client:visible',
  'client:only',
  'client:media',
];

/** Astro integration that asserts zero hydration markers on declared static templates. */
function assertNoIslandsIntegration() {
  return {
    name: 'assert-no-islands',
    hooks: {
      'astro:build:done': ({ dir }) => {
        // dir is a URL object pointing to the build output directory
        const outDir = dir.pathname;
        let failureCount = 0;

        for (const templatePath of STATIC_TEMPLATES) {
          const absolutePath = resolve(outDir, templatePath);

          if (!existsSync(absolutePath)) {
            console.error(`[assert-no-islands] MISSING: ${absolutePath}`);
            failureCount++;
            continue;
          }

          let html;
          try {
            html = readFileSync(absolutePath, 'utf-8');
          } catch (err) {
            console.error(`[assert-no-islands] READ ERROR: ${absolutePath} — ${err.message}`);
            failureCount++;
            continue;
          }

          const foundMarkers = ISLAND_MARKERS.filter((marker) => html.includes(marker));

          if (foundMarkers.length > 0) {
            console.error(
              `[assert-no-islands] FAIL: ${templatePath} — found: ${foundMarkers.join(', ')}\n` +
              `  Remove client:* directives from all components used in this template.`
            );
            failureCount++;
          } else {
            console.log(`[assert-no-islands] PASS: ${templatePath}`);
          }
        }

        if (failureCount > 0) {
          // Throwing inside astro:build:done causes Astro to exit non-zero,
          // which Netlify treats as a build failure and aborts the deploy.
          throw new Error(
            `[assert-no-islands] ${failureCount} template(s) violated the zero-hydration contract.`
          );
        }
      },
    },
  };
}

export default defineConfig({
  // SITE-SPECIFIC: add your existing integrations alongside this one
  integrations: [
    assertNoIslandsIntegration(),
  ],
});
```

## Risks
- ISLAND_MARKERS string matching is substring-based, not AST-based. A comment or data attribute containing the literal string 'client:load' (e.g., in documentation embedded in the page) would produce a false positive. Mitigation: scope the check to tag-context patterns (e.g., check for '<astro-island' rather than bare 'client:load') or add a known-false-positive allowlist constant.
- If the project later legitimately needs an island on this template (e.g., a cookie consent widget), the assertion will block the deploy until STATIC_TEMPLATES is updated to remove that path or the check is made per-component rather than per-page. Mitigation: treat STATIC_TEMPLATES as a living config — update it intentionally when the zero-hydration contract is deliberately relaxed for a template.
- The standalone script approach (netlify.toml command chaining) will silently skip the assertion if the build command is overridden in the Netlify UI. Mitigation: prefer the native Astro integration hook approach, which cannot be bypassed without modifying astro.config.mjs.
- The dir.pathname in the astro:build:done hook is a POSIX path on Linux/macOS but may include a leading slash on Windows that causes resolve() to behave unexpectedly. Mitigation: use new URL(templatePath, dir).pathname or fileURLToPath(new URL(templatePath, dir)) for cross-platform safety if the project is developed on Windows.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
