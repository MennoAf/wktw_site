---
finding_id: "ghost-markup-no-duplicate-landmarks"
title: "No duplicate landmark or ID issues detected — clean DOM structure"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Duplicate IDs break the programmatic association between <label for='x'> and <input id='x'>, between aria-describedby and its target, and between aria-controls and its controlled element."
fix_summary: "Close the open audit thread by adding a deterministic, build-time duplicate-ID enumeration script that runs as part of the Astro build pipeline."
confidence_tier: "unverified"
remediation_surface: "source_code"
---

# No duplicate landmark or ID issues detected — clean DOM structure

**Finding:** No duplicate landmark or ID issues detected — clean DOM structure  
**Severity:** Low  
**Why this matters:** Duplicate IDs break the programmatic association between <label for='x'> and <input id='x'>, between aria-describedby and its target, and between aria-controls and its controlled element.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Close the open audit thread by adding a deterministic, build-time duplicate-ID enumeration script that runs as part of the Astro build pipeline.  

> **Evidence Basis:** Needs Verification

---

## Impact

- **Accessibility:** Duplicate IDs break the programmatic association between <label for='x'> and <input id='x'>, between aria-describedby and its target, and between aria-controls and its controlled element. A single duplicate ID silently corrupts all three associations across the entire page for screen reader users. This script converts a manual, per-deploy assumption into a hard build gate — preventing regressions before they reach users.
- **Seo:** Duplicate IDs cause querySelector and getElementById to return only the first match, making anchor-link navigation (#section-id) non-deterministic. Search engines that follow fragment links for structured content indexing may land on the wrong element. Eliminating duplicates ensures fragment-targeted content is unambiguous.
- **Ci Reliability:** The build gate converts a probabilistic audit finding into a deterministic, zero-maintenance enforcement layer. Any future author error, island component regression, or third-party embed collision is caught at deploy time rather than discovered post-production via manual audit.

## How to verify

**What to look for:** With only 142 DOM elements and a fully static page (no JS injection), the risk of duplicate landmarks, duplicate IDs, or multiple <main> elements is minimal.. The page structure shows a single header with nav, a main content area, and a footer — standard Astro layout.

**Measured evidence:**
- Dom Elements: 142
- Js Injected: 0
- Nav Elements Observed: 1
- Static Generation: True
- Full Id Audit: not performed — requires complete DOM enumeration
- Duplicate Landmarks: none detected
- Duplicate Ids: none detected
- Multiple Main Elements: False

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
Close the open audit thread by adding a deterministic, build-time duplicate-ID enumeration script that runs as part of the Astro build pipeline. This converts a probabilistic assumption ('no duplicates detected') into a verified, CI-enforced guarantee — catching the three residual risk vectors (island key-derived IDs, third-party embed injections caught at SSG time, and author copy-paste errors) before they reach production.

### How
1. Create `scripts/audit-duplicate-ids.mjs` — a Node.js script that parses every HTML file in `dist/` after `astro build` completes, enumerates all `id` attributes using the `node-html-parser` package (zero-runtime, build-only dependency), and exits non-zero if any duplicate is found across the full DOM of each page.
2. Add `node-html-parser` as a devDependency: `npm install --save-dev node-html-parser`.
3. Wire the script into `package.json` as a post-build hook: `"postbuild": "node scripts/audit-duplicate-ids.mjs"`.
4. The script must: (a) glob all `dist/**/*.html` files, (b) parse each file's full DOM, (c) collect every element with an `id` attribute into a Map keyed by id value, (d) report the duplicate id, the file path, and both element tag names to stderr, (e) exit with code 1 if any duplicates exist so Netlify's build pipeline fails the deploy.
5. Add a `netlify.toml` build command override if not already present to ensure the postbuild hook runs in CI: `command = "npm run build"` (postbuild fires automatically after build in npm lifecycle).
6. No Astro runtime code changes are required — this is entirely a build-time verification layer. No hydration, no client JS, no layout changes.

### Code examples
```
// scripts/audit-duplicate-ids.mjs
// Build-time duplicate ID auditor for Astro SSG output.
// Runs via `postbuild` npm hook — never ships to the browser.
//
// SCOPE: Detects duplicate IDs within a single page's HTML output.
// Cross-page ID reuse (e.g., id='hero' on every page) is valid HTML and is NOT flagged.
// Runtime-injected IDs (chat widgets, consent banners added after hydration) are out of scope
// by design — this script audits SSG HTML only. Use Playwright smoke tests for runtime coverage.
//
// LIFECYCLE DEPENDENCY: This script relies on npm's `postbuild` lifecycle hook.
// If the build system is migrated to a parallel task runner (Turborepo, Nx, Makefile),
// the postbuild hook will not fire automatically — wire this script explicitly in that case.
//
// Precondition: `dist/` exists and contains the full Astro build output.
// Exit code 1 fails the Netlify deploy pipeline.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import { parse } from 'node-html-parser';

// SITE-SPECIFIC ASSUMPTION: Astro outputs to `dist/` by default.
// If outDir is overridden in astro.config.*, pass the correct dir as a CLI argument:
//   node scripts/audit-duplicate-ids.mjs build
// or update this constant.
const DIST_DIR = process.argv[2] ?? 'dist';

// Glob pattern for all HTML output files.
// Covers nested routes (e.g., dist/blog/post-1/index.html).
const HTML_GLOB = `${DIST_DIR}/**/*.html`;

// Maximum characters of the opening tag to include in CI log output.
// Extracted as a named constant — adjust if your attribute values are unusually long.
const SNIPPET_TAG_CHAR_LIMIT = 300;

/**
 * Extract the opening tag of an element for diagnostic output.
 * Safer than outerHTML.slice(0, N) — ensures the id= attribute is always visible
 * regardless of attribute ordering or long preceding attributes.
 */
function extractOpeningTag(el) {
  const outer = el.outerHTML ?? '';
  const closeIndex = outer.indexOf('>');
  if (closeIndex === -1) return outer.slice(0, SNIPPET_TAG_CHAR_LIMIT);
  return outer.slice(0, Math.min(closeIndex + 1, SNIPPET_TAG_CHAR_LIMIT));
}

// Track total excess occurrences (sum of occurrences.length - 1 per duplicate ID),
// not just the count of IDs that are duplicated, for accurate severity reporting.
let totalExcessOccurrences = 0;
let totalDuplicateIds = 0;

try {
  // Guard: verify dist/ exists before globbing to emit a clear error if astro build failed.
  if (!existsSync(DIST_DIR)) {
    console.error(
      `[audit-duplicate-ids] ERROR: '${DIST_DIR}/' directory not found. ` +
      'Did astro build succeed? Run `npm run build` before this script, or check for upstream build failures.'
    );
    process.exit(1);
  }

  // Use the `glob` npm package for Node 18/20/22 compatibility.
  // node:fs/promises does not export `glob` until Node 22 (experimental) — do not use it.
  const files = await glob(HTML_GLOB);

  if (files.length === 0) {
    console.error(
      `[audit-duplicate-ids] ERROR: No HTML files found matching '${HTML_GLOB}'. ` +
      `Verify that '${DIST_DIR}/' contains Astro build output, or pass the correct outDir as a CLI argument: ` +
      `node scripts/audit-duplicate-ids.mjs <outDir>`
    );
    process.exit(1);
  }

  for (const filePath of files) {
    const html = await readFile(filePath, 'utf-8');
    const root = parse(html);

    // Collect all elements with an id attribute.
    // node-html-parser querySelectorAll is lenient on malformed HTML — behavior on
    // severely malformed markup (unclosed tags, duplicate quotes) may differ from browsers.
    // Validate against actual site output if WYSIWYG-generated HTML is in scope.
    const elementsWithId = root.querySelectorAll('[id]');

    // Map<string, Array<{tag: string, snippet: string}>>
    const idMap = new Map();

    for (const el of elementsWithId) {
      const id = el.getAttribute('id');

      // Guard: skip empty id attributes (invalid HTML but not a duplicate risk).
      if (!id || id.trim() === '') continue;

      if (!idMap.has(id)) {
        idMap.set(id, []);
      }
      idMap.get(id).push({
        tag: el.tagName.toLowerCase(),
        snippet: extractOpeningTag(el)
      });
    }

    // Report duplicates for this file.
    const relativePath = path.relative(process.cwd(), filePath);
    for (const [id, occurrences] of idMap.entries()) {
      if (occurrences.length > 1) {
        totalDuplicateIds++;
        // Count excess occurrences (e.g., ID appearing 3 times = 2 excess).
        totalExcessOccurrences += occurrences.length - 1;
        console.error(
          `[audit-duplicate-ids] DUPLICATE ID "${id}" found ${occurrences.length} times in ${relativePath}:`
        );
        for (const { tag, snippet } of occurrences) {
          console.error(`  <${tag}> → ${snippet}`);
        }
      }
    }
  }

  if (totalDuplicateIds > 0) {
    console.error(
      `\n[audit-duplicate-ids] FAILED: ${totalDuplicateIds} duplicate ID(s) with ` +
      `${totalExcessOccurrences} excess occurrence(s) detected across ${files.length} page(s). ` +
      'Deploy blocked. Fix duplicate IDs before merging.'
    );
    process.exit(1);
  }

  console.log(
    `[audit-duplicate-ids] PASSED: ${files.length} page(s) audited — no duplicate IDs found.`
  );
  process.exit(0);

} catch (err) {
  console.error('[audit-duplicate-ids] UNEXPECTED ERROR:', err);
  process.exit(1);
}
// package.json (relevant excerpt only — do not replace entire file)
// Precondition: `build` script already calls `astro build`.
// `postbuild` fires automatically after `build` in npm lifecycle — no manual wiring needed.
// NOTE: If build system is migrated away from npm scripts (Turborepo, Nx, Makefile),
// wire `node scripts/audit-duplicate-ids.mjs` explicitly — postbuild will not fire.
{
  "scripts": {
    "build": "astro build",
    "postbuild": "node scripts/audit-duplicate-ids.mjs"
  },
  "devDependencies": {
    "glob": "^10.4.0",
    "node-html-parser": "^6.1.0"
  }
}
# netlify.toml
# Precondition: Netlify build command must invoke npm run build so the
# postbuild hook fires. If your current command is `astro build` directly,
# the postbuild hook is bypassed — this override is required.
[build]
  command = "npm run build"
  publish = "dist"

# Explicitly set NODE_ENV to prevent Netlify from suppressing devDependency installation.
# Without this, NPM_FLAGS=--production or NODE_ENV=production overrides (set by some
# Netlify configurations) will cause `glob` and `node-html-parser` to be skipped,
# breaking the postbuild audit script at deploy time.
[build.environment]
  NODE_ENV = "development"

# No other changes to netlify.toml are required for this fix.
```

## Risks
- Node 18/20 compatibility: `node:fs/promises` does not export a `glob` function in Node 18 or 20 — it was added experimentally in Node 22 and is not available in Netlify's default build environment. The script uses the `glob` npm package (`^10.4.0`) as the primary implementation, which is compatible with Node 18, 20, and 22. Add `glob` to devDependencies: `npm install --save-dev glob`.
- Third-party embed scripts (chat widgets, consent banners) that inject IDs client-side after hydration are invisible to this build-time parser — the script audits SSG HTML output only, not runtime DOM. Mitigation: this is the correct and intentional scope boundary. Runtime injection is a separate concern addressed by Playwright-based post-deploy smoke tests, not build-time static analysis. Document this boundary in the script header.
- If `postbuild` fails on a legitimate false positive (e.g., a third-party Astro integration that generates intentionally scoped IDs with a known collision pattern), the deploy is blocked. Mitigation: the script outputs the exact file path, element tag, and HTML snippet — diagnosis is immediate. The fix is to correct the source, not to suppress the check.
- The `node-html-parser` package must be kept as a devDependency, not a dependency, to avoid inflating the production bundle. Netlify installs devDependencies during build by default — verify `NPM_FLAGS` or `NODE_ENV` overrides in netlify.toml are not suppressing devDependency installation.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
