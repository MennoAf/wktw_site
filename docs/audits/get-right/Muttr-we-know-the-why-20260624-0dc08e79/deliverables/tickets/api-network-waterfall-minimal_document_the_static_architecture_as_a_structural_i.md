---
finding_id: "api-network-waterfall-minimal"
title: "Minimal API/network waterfall — no issues found"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The guard converts a passive architectural property into an actively enforced invariant."
fix_summary: "Document the static architecture as a structural invariant and install a CI guard that fails the build if SSR mode, client-side data fetching, or runtime API dependencies are introduced — preserving…"
confidence_tier: "confirmed"
---

# Minimal API/network waterfall — no issues found

**Finding:** Minimal API/network waterfall — no issues found  
**Severity:** Low  
**Why this matters:** The guard converts a passive architectural property into an actively enforced invariant.  
**Root cause:** Isolated issue  
**Fix:** Document the static architecture as a structural invariant and install a CI guard that fails the build if SSR mode, client-side data fetching, or runtime API dependencies are introduced — preserving…

> **Evidence Basis:** Confirmed

---

## Impact

- **Build Integrity:** The guard converts a passive architectural property into an actively enforced invariant. Without it, a single Astro Island or CMS integration added by any team member silently reintroduces sequential API round-trips before first paint — the exact waterfall problem the SSG architecture eliminates. The CI gate ensures the zero-waterfall property is preserved across team growth and dependency updates without requiring manual review of every PR.
- **Ttfb And Lcp Stability:** Astro SSG's current TTFB advantage (pre-rendered HTML, no server compute, Netlify CDN edge delivery) is contingent on remaining in static mode. Any drift to SSR or client-side fetching degrades TTFB from CDN-edge latency (~20-50ms) toward origin compute latency (200-800ms typical). The guard prevents that regression from reaching production undetected.
- **Developer Experience:** Failing fast at build time (prebuild hook) rather than at runtime monitoring surfaces waterfall regressions in the PR that introduced them, not in a post-deploy incident. This reduces mean time to detection from hours/days to minutes.

## How to verify

**What to look for:** Only 1 fetch request detected (Google Analytics collect beacon, which was aborted — covered in pre-scan finding prescan-16-1).. No API calls for content loading.

**Measured evidence:**
- Total Requests: 10
- Total Transfer Kb: 365
- Api Calls On Load: 1
- Api Calls Detail: GA4 collect (aborted — covered in prescan-16-1)
- Dcl Seconds: 0.28
- Load Seconds: 0.51
- Sequential Chains: False
- Fetch Requests: 1

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
Document the static architecture as a structural invariant and install a CI guard that fails the build if SSR mode, client-side data fetching, or runtime API dependencies are introduced — preserving the zero-waterfall property as the codebase evolves.

### How
1. Add an `astro.config.mjs` assertion: confirm `output` is set to `'static'` (the default) and is not overridden by environment variables. This is the single source of truth for SSG mode.
2. Create a build-time guard script (`scripts/assert-static-mode.mjs`) that reads the resolved Astro config and exits non-zero if `output !== 'static'`. Wire it into `package.json` as a `prebuild` hook so it runs before every Netlify build.
3. Add a Netlify build plugin (`netlify/plugins/assert-no-runtime-fetch/index.js`) that scans the compiled `dist/` directory for any `fetch(`, `axios`, `useSWR`, or `createClient(` patterns in client-side JS bundles. Exit non-zero on match. This catches Astro Islands that introduce runtime data fetching.
4. Add an ADR (Architecture Decision Record) at `docs/adr/001-static-ssg-no-runtime-fetch.md` naming the invariant, the guard mechanism, and the approval process required before introducing SSR or client-side fetching.
5. If the team later legitimately needs client-side data (e.g., personalisation), the approved path is: (a) move the fetch behind a Web Worker, (b) ensure it is non-render-blocking, (c) update the guard allowlist explicitly — not silently.

### Code examples
```
// scripts/assert-static-mode.mjs
// Precondition: Node >=18, Astro project root is cwd.
// Reads the resolved Astro config and fails the build if output mode is not 'static'.
// This script is intentionally synchronous-exit — no async state to race.

import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFIG_PATH = resolve(process.cwd(), 'astro.config.mjs');

// Astro exposes the resolved config via the `defineConfig` return value.
// We parse the raw source for the `output` key rather than importing the
// module (which would require a full Astro runtime boot in CI).
// SITE-SPECIFIC ASSUMPTION: config file is named `astro.config.mjs` at project root.
const source = readFileSync(CONFIG_PATH, 'utf8');

// Match `output: 'static'` or `output: "static"` with optional whitespace.
const STATIC_OUTPUT_PATTERN = /output\s*:\s*['"]static['"]/;
// Match any non-static output declaration explicitly.
const NON_STATIC_OUTPUT_PATTERN = /output\s*:\s*['"](?:server|hybrid)['"]/;

if (NON_STATIC_OUTPUT_PATTERN.test(source)) {
  console.error(
    '[assert-static-mode] FAIL: astro.config.mjs declares output: "server" or "hybrid".\n' +
    'Introducing SSR mode eliminates the zero-API-waterfall guarantee.\n' +
    'See docs/adr/001-static-ssg-no-runtime-fetch.md before proceeding.'
  );
  process.exit(1);
}

if (!STATIC_OUTPUT_PATTERN.test(source) && source.includes('output')) {
  // `output` key present but value is unrecognised — fail safe.
  console.error(
    '[assert-static-mode] FAIL: `output` key found in astro.config.mjs with unrecognised value.\n' +
    'Explicitly set output: \'static\' to pass this guard.'
  );
  process.exit(1);
}

console.log('[assert-static-mode] PASS: Astro output mode is static.');
process.exit(0);
// netlify/plugins/assert-no-runtime-fetch/index.js
// Netlify Build Plugin — runs after the Astro build completes.
// Scans compiled client-side JS bundles in dist/ for runtime fetch patterns
// that would introduce API waterfall risk.
//
// Precondition: Astro has already written output to `dist/` (onPostBuild hook).
// No async state shared between hook invocations — no race possible.

const { readdirSync, readFileSync, statSync } = require('fs');
const { join, extname } = require('path');

// SITE-SPECIFIC ASSUMPTION: Astro output directory is `dist/`.
const DIST_DIR = 'dist';

// Patterns that indicate runtime data fetching in client bundles.
// Extend this list when new data-fetching libraries are adopted.
const RUNTIME_FETCH_PATTERNS = [
  /\bfetch\s*\(/,
  /\baxios\b/,
  /\buseSWR\b/,
  /\bcreateClient\s*\(/,
  /\bApolloClient\b/,
  /\bGraphQLClient\b/,
];

// Allowlist: bundle name substrings explicitly approved for runtime fetch.
// Populate via ADR approval process — never edit inline without ADR reference.
// SITE-SPECIFIC ASSUMPTION: empty by default; update after ADR approval.
const FETCH_ALLOWLIST = [];

function collectJsFiles(dir, results = []) {
  // Bounded recursion: Astro dist/ is shallow (max 3 levels). No symlink follow.
  const MAX_DEPTH = 4;
  function walk(current, depth) {
    if (depth > MAX_DEPTH) return;
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full, depth + 1);
      } else if (extname(entry) === '.js') {
        results.push(full);
      }
    }
  }
  walk(dir, 0);
  return results;
}

module.exports = {
  onPostBuild: ({ utils }) => {
    const jsFiles = collectJsFiles(DIST_DIR);
    const violations = [];

    for (const file of jsFiles) {
      const isAllowlisted = FETCH_ALLOWLIST.some((allowed) => file.includes(allowed));
      if (isAllowlisted) continue;

      const source = readFileSync(file, 'utf8');
      for (const pattern of RUNTIME_FETCH_PATTERNS) {
        if (pattern.test(source)) {
          violations.push({ file, pattern: pattern.toString() });
          break; // one match per file is sufficient to flag
        }
      }
    }

    if (violations.length > 0) {
      const detail = violations
        .map((v) => `  ${v.file} — matched ${v.pattern}`)
        .join('\n');
      utils.build.failBuild(
        `[assert-no-runtime-fetch] ${violations.length} client bundle(s) contain runtime fetch patterns.\n` +
        `This breaks the zero-API-waterfall guarantee.\n` +
        `See docs/adr/001-static-ssg-no-runtime-fetch.md to request an allowlist exemption.\n` +
        `Violations:\n${detail}`
      );
    } else {
      console.log(`[assert-no-runtime-fetch] PASS: ${jsFiles.length} JS bundle(s) scanned, no runtime fetch patterns found.`);
    }
  },
};
```

## Risks
- Pattern-matching compiled bundles for `fetch(` will produce false positives if a legitimate non-data-fetching library (e.g., a polyfill or service worker utility) uses the fetch API internally. Mitigation: the FETCH_ALLOWLIST constant in the plugin provides a named, auditable escape hatch — add the bundle filename substring after ADR review, never silently.
- The `assert-static-mode.mjs` script parses the config file as raw text rather than executing it. If the `output` value is set dynamically (e.g., `output: process.env.ASTRO_OUTPUT`) the guard will not catch it. Mitigation: add a secondary check in the Netlify plugin's `onPreBuild` hook that reads `process.env.ASTRO_OUTPUT` and fails if it is set to a non-static value. This is a known limitation documented in the ADR.
- The Netlify Build Plugin requires registration in `netlify.toml`. If `netlify.toml` is absent or the plugin entry is removed, the post-build scan is silently skipped. Mitigation: the `prebuild` npm hook in `package.json` runs `assert-static-mode.mjs` independently of Netlify, providing a second enforcement layer for local and CI builds outside Netlify.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
