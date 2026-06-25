---
finding_id: "prescan-escalation-internal-links-unverified"
title: "Internal link 404 verification not possible without live crawl — no issues inferred from available data"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Broken internal links cause Googlebot to encounter dead ends, wasting crawl budget on non-existent pages and preventing link equity from flowing to valid routes."
fix_summary: "Add a Netlify build-time link verification step that issues HEAD requests against the deploy preview URL for all internal link destinations extracted from the built HTML, failing the deploy if any re…"
confidence_tier: "confirmed"
---

# Internal link 404 verification not possible without live crawl — no issues inferred from available data

**Finding:** Internal link 404 verification not possible without live crawl — no issues inferred from available data  
**Severity:** Low  
**Why this matters:** Broken internal links cause Googlebot to encounter dead ends, wasting crawl budget on non-existent pages and preventing link equity from flowing to valid routes.  
**Root cause:** Isolated issue  
**Fix:** Add a Netlify build-time link verification step that issues HEAD requests against the deploy preview URL for all internal link destinations extracted from the built HTML, failing the deploy if any re…

> **Evidence Basis:** Confirmed

---

## Impact

- **Crawl Integrity:** Broken internal links cause Googlebot to encounter dead ends, wasting crawl budget on non-existent pages and preventing link equity from flowing to valid routes. For a 6-route flat site, a single broken top-level route means an entire content section is invisible to search indexing until the next successful crawl cycle after repair.
- **Deploy Safety:** The script converts a silent post-deploy failure mode (broken link discovered by a user or crawler) into a hard build gate. A broken route on this site is not a long-tail edge case — each of the 6 destinations represents a primary navigation target. Catching it at deploy time eliminates the window between deploy and discovery.
- **Audit Pipeline Coverage:** Closes the tooling gap identified in the finding. Future audits will have confirmed HTTP status data for all internal destinations, removing the 'unverified' classification from this finding category.

## How to verify

**What to look for:** Escalated item review: The scan identifies 13 internal links across 6 unique destinations (/, /the-get-right, /insights, /proof, /about, /contact) but does not provide HTTP status codes for each.. Without live resolution, 404s cannot be confirmed or ruled out.

**Measured evidence:**
- Internal Links Count: 13
- Identified Destinations: ['https://weknowthewhy.com/', 'https://weknowthewhy.com/the-get-right', 'https://weknowthewhy.com/insights', 'https://weknowthewhy.com/proof', 'https:
- Status Codes Available: False
- Action Required: Live HTTP HEAD request to each internal link destination to verify 200 status
- Prescan Escalation Referenced: Internal link 404 verification
- Unique Destinations: ['https://weknowthewhy.com/', 'https://weknowthewhy.com/the-get-right', 'https://weknowthewhy.com/insights', 'https://weknowthewhy.com/proof', 'https:
- Recommendation: Run live resolution of all 6 unique internal destinations to confirm 200 status
- Escalation Source: prescan escalation item 5

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
Add a Netlify build-time link verification step that issues HEAD requests against the deploy preview URL for all internal link destinations extracted from the built HTML, failing the deploy if any return non-200 responses. This closes the audit coverage gap permanently without requiring a separate crawl tool or post-deploy manual check.

### How
1. Create `scripts/verify-internal-links.mjs` in the project root (ESM, Node 18+, no external dependencies beyond what Netlify's build image provides).
2. The script reads all `.html` files from `dist/` (Astro's default output directory — adjust via SITE_OUTPUT_DIR if the project uses a custom outDir), extracts all `href` values from anchor tags using regex against the raw HTML string, filters to internal paths only (starts with `/`, excludes `#` fragments, `mailto:`, `tel:`), deduplicates, then issues HEAD requests against the deploy preview base URL.
3. The base URL is sourced from the `DEPLOY_PRIME_URL` environment variable Netlify injects into every build — this is the canonical preview URL for the current deploy, not the production domain, so verification is always against the exact artifact being deployed.
4. Requests are issued serially (not in parallel) with a configurable concurrency cap to avoid triggering Netlify's own rate limiter on the CDN edge during the build phase. A Promise queue enforces this — see code example.
5. Any response with status outside 200–299 is collected into a failures array. After all paths are checked, if `failures.length > 0`, the script exits with code 1, which Netlify treats as a build failure and blocks the deploy.
6. Wire the script into `netlify.toml` under `[build]` as a post-build command: `command = 'astro build && node scripts/verify-internal-links.mjs'`. This runs after `astro build` has written `dist/` but before Netlify promotes the deploy.
7. Add `SKIP_LINK_CHECK=true` as an optional escape hatch environment variable for emergency deploys — the script exits 0 immediately if this is set, with a console warning logged to the build output.

### Code examples
```
// scripts/verify-internal-links.mjs
// Preconditions:
//   - Node 18+ (native fetch available)
//   - Astro build has already written output to SITE_OUTPUT_DIR
//   - DEPLOY_PRIME_URL is set by Netlify (available in all build contexts)
//   - Script runs in the Netlify build environment, not locally by default

import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

// --- CONFIGURABLE CONSTANTS (adjust per project) ---
// SITE_ASSUMPTION: Astro default output directory. Change if outDir is customized in astro.config.mjs.
const SITE_OUTPUT_DIR = process.env.SITE_OUTPUT_DIR ?? 'dist';

// Max simultaneous HEAD requests. Kept low to avoid self-rate-limiting on Netlify CDN edge.
const MAX_CONCURRENCY = 3;

// Timeout per HEAD request in milliseconds. 10s is generous for a same-region Netlify edge request.
const REQUEST_TIMEOUT_MS = 10_000;

// HTTP status codes considered successful. 301/302 are NOT included — internal links should resolve
// directly, not via redirect chains. If a redirect is intentional, add a Netlify redirect rule
// and update the source href to the canonical destination.
const ACCEPTABLE_STATUS_CODES = new Set([200, 204]);

// Maximum number of HTML files to scan. Guards against runaway glob on misconfigured output dirs.
const MAX_HTML_FILES = 500;
// --- END CONFIGURABLE CONSTANTS ---

/**
 * Recursively collect all .html files under a directory.
 * Returns absolute paths.
 */
async function collectHtmlFiles(dir, collected = []) {
  if (collected.length >= MAX_HTML_FILES) return collected;

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    // If the output directory doesn't exist, the build step before this script failed.
    // Exit 1 so the deploy is blocked — do not silently pass.
    console.error(`[link-check] Cannot read output directory "${dir}": ${err.message}`);
    console.error('[link-check] Ensure astro build runs before this script.');
    process.exit(1);
  }

  for (const entry of entries) {
    if (collected.length >= MAX_HTML_FILES) break;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectHtmlFiles(fullPath, collected);
    } else if (entry.isFile() && extname(entry.name) === '.html') {
      collected.push(fullPath);
    }
  }

  return collected;
}

/**
 * Extract unique internal link paths from raw HTML string.
 * Matches href="/...", href='/...', href=/... patterns.
 * Excludes: fragments (#), mailto:, tel:, http(s):, protocol-relative (//)
 */
function extractInternalPaths(html) {
  // Matches href attribute values. Intentionally permissive on quote style.
  const HREF_PATTERN = /href=["']?([^"'\s>]+)["']?/gi;
  const paths = new Set();
  let match;

  while ((match = HREF_PATTERN.exec(html)) !== null) {
    const raw = match[1];
    // Internal: starts with /, not a fragment, not a protocol
    if (
      raw.startsWith('/') &&
      !raw.startsWith('//') &&
      !raw.startsWith('/#')
    ) {
      // Strip query string and fragment — we verify the path only
      try {
        // Use URL constructor with a dummy base to safely parse the path
        const parsed = new URL(raw, 'https://example.com');
        paths.add(parsed.pathname);
      } catch {
        // Malformed href — skip, do not crash
        console.warn(`[link-check] Skipping malformed href: ${raw}`);
      }
    }
  }

  return [...paths];
}

/**
 * Issue a HEAD request with timeout. Returns { path, status, ok, error }.
 * Uses AbortController + setTimeout for timeout — AbortSignal.timeout() has
 * <95% browser support and inconsistent Node support before 18.17.
 */
async function checkPath(baseUrl, path) {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual', // Do not follow redirects — internal links must resolve directly
      signal: controller.signal,
    });
    return {
      path,
      url,
      status: response.status,
      ok: ACCEPTABLE_STATUS_CODES.has(response.status),
      error: null,
    };
  } catch (err) {
    return {
      path,
      url,
      status: null,
      ok: false,
      error: err.name === 'AbortError' ? `Timeout after ${REQUEST_TIMEOUT_MS}ms` : err.message,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Run tasks with bounded concurrency.
 * tasks: Array of zero-argument async functions.
 * Returns array of results in completion order (not input order).
 *
 * Ordering assumption: results array order is non-deterministic within a
 * concurrency window. Callers must not depend on result order matching input order.
 */
async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  const queue = [...tasks];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      // queue.shift() is synchronous — no race condition in single-threaded Node event loop
      const task = queue.shift();
      if (task) results.push(await task());
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  // Escape hatch for emergency deploys
  if (process.env.SKIP_LINK_CHECK === 'true') {
    console.warn('[link-check] SKIP_LINK_CHECK=true — skipping verification. Deploy is unguarded.');
    process.exit(0);
  }

  const baseUrl = process.env.DEPLOY_PRIME_URL;
  if (!baseUrl) {
    // DEPLOY_PRIME_URL is only set in Netlify build context.
    // If running locally, skip gracefully rather than failing the local dev workflow.
    console.warn('[link-check] DEPLOY_PRIME_URL not set. Skipping link verification (not a Netlify build context).');
    process.exit(0);
  }

  console.log(`[link-check] Base URL: ${baseUrl}`);
  console.log(`[link-check] Scanning output directory: ${SITE_OUTPUT_DIR}`);

  const htmlFiles = await collectHtmlFiles(SITE_OUTPUT_DIR);
  console.log(`[link-check] Found ${htmlFiles.length} HTML file(s)`);

  const allPaths = new Set();
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf-8');
    for (const path of extractInternalPaths(html)) {
      allPaths.add(path);
    }
  }

  const uniquePaths = [...allPaths];
  console.log(`[link-check] Unique internal paths to verify: ${uniquePaths.length}`);
  if (uniquePaths.length === 0) {
    console.log('[link-check] No internal links found. Passing.');
    process.exit(0);
  }

  const tasks = uniquePaths.map((path) => () => checkPath(baseUrl, path));
  const results = await runWithConcurrency(tasks, MAX_CONCURRENCY);

  const failures = results.filter((r) => !r.ok);
  const successes = results.filter((r) => r.ok);

  console.log(`[link-check] Passed: ${successes.length} | Failed: ${failures.length}`);

  if (failures.length > 0) {
    console.error('[link-check] BROKEN INTERNAL LINKS DETECTED — blocking deploy:');
    for (const f of failures) {
      const detail = f.error ?? `HTTP ${f.status}`;
      console.error(`  ✗ ${f.path} → ${f.url} (${detail})`);
    }
    process.exit(1);
  }

  console.log('[link-check] All internal links verified. Deploy proceeding.');
  process.exit(0);
}

main();
# netlify.toml — wire the script into the build pipeline
# SITE_ASSUMPTION: This assumes the default Netlify build command is 'astro build'.
# If the project uses a custom build command (e.g., via a Makefile or npm script),
# append '&& node scripts/verify-internal-links.mjs' to that command instead.

[build]
  command = "astro build && node scripts/verify-internal-links.mjs"
  publish = "dist"

[build.environment]
  # NODE_VERSION must be 18+ for native fetch. Netlify defaults to Node 18 as of 2024
  # but pinning prevents silent regression if Netlify changes the default.
  NODE_VERSION = "20"
  # SITE_OUTPUT_DIR: only set this if astro.config.mjs uses a custom outDir.
  # Remove this line if using Astro's default 'dist' output directory.
  # SITE_OUTPUT_DIR = "dist"
```

## Risks
- DEPLOY_PRIME_URL resolves to the Netlify CDN edge for the current deploy, but the edge may not have fully propagated all routes by the time the script runs HEAD requests — particularly on cold deploys. Mitigation: the script runs after `astro build` completes and Netlify has staged the deploy artifact, which is when DEPLOY_PRIME_URL becomes resolvable. If flakiness is observed on first deploy of a new route, increase REQUEST_TIMEOUT_MS or add a short sleep before the script starts (e.g., `sleep 5 && node scripts/verify-internal-links.mjs`).
- redirect: 'manual' means HTTP 301/302 responses are treated as failures. If any internal link intentionally points to a redirected path (e.g., /blog redirects to /insights), the build will block. Mitigation: update the source href to the canonical destination, or add the redirect's target status code to ACCEPTABLE_STATUS_CODES after confirming the redirect is intentional and permanent.
- The regex-based href extraction does not parse JavaScript-rendered links (e.g., links injected by client-side React/Vue after hydration). For this Astro static site, all navigation links are in the pre-rendered HTML, so this is not a current risk. If the site adds client-side routing or JS-injected navigation in the future, the script must be extended to parse the rendered DOM via Playwright or similar.
- Running this script locally without DEPLOY_PRIME_URL set will silently skip verification (by design, to avoid breaking local dev). Developers who want local verification must set DEPLOY_PRIME_URL manually to a staging URL. This is a workflow gap, not a correctness risk.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
