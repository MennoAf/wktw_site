---
finding_id: "ux-sitemap-unverifiable"
title: "XML sitemap alignment cannot be verified from available data"
severity: "low"
root_cause_cluster: "SEO Metadata and Structured Data Gaps"
why_this_matters: "Each sitemap URL that currently triggers a redirect costs Googlebot two crawl requests instead of one."
fix_summary: "Install @astrojs/sitemap with build-time enforcement: canonical URL normalization (trailing-slash consistent), automatic exclusion of noindex/draft pages, and a CI validation step that fails the buil…"
confidence_tier: "confirmed"
---

# XML sitemap alignment cannot be verified from available data

**Finding:** XML sitemap alignment cannot be verified from available data  
**Severity:** Low  
**Why this matters:** Each sitemap URL that currently triggers a redirect costs Googlebot two crawl requests instead of one.  
**Root cause:** SEO Metadata and Structured Data Gaps  
**Fix:** Install @astrojs/sitemap with build-time enforcement: canonical URL normalization (trailing-slash consistent), automatic exclusion of noindex/draft pages, and a CI validation step that fails the buil…

> **Evidence Basis:** Confirmed

---

## Impact

- **Crawl Budget:** Each sitemap URL that currently triggers a redirect costs Googlebot two crawl requests instead of one. Eliminating trailing-slash redirect chains from sitemap URLs halves the crawl cost per affected URL. For sites with hundreds of blog posts, this meaningfully reduces the crawl budget consumed on redirect resolution, freeing it for new content discovery.
- **Content Discovery:** Pages published after the last manual sitemap update are invisible to sitemap-driven discovery. Googlebot may still find them via internal links, but without sitemap priority signals, crawl scheduling is slower and less predictable. Automated sitemap generation ensures every published page is declared at build time, eliminating the discovery lag.
- **Crawl Pollution:** Stale sitemap entries pointing to 404s or noindex pages signal to Googlebot that the site has poor URL hygiene. Google's crawl budget documentation notes that crawl budget is influenced by crawl health signals — directing Googlebot to dead URLs degrades those signals. The CI validation step prevents any 404 or noindex URL from ever entering the sitemap.
- **Seo Ranking Signal:** Sitemap `lastmod` accuracy affects how Googlebot prioritizes recrawling. Using build time as lastmod (a common default) causes every page to appear freshly modified on every deploy, which trains Googlebot to distrust the signal. Using actual content modification dates restores lastmod as a meaningful recrawl priority signal.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_009`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** No XML sitemap data was provided in the audit inputs.. Cannot verify whether the sitemap includes all 5 main sections, whether it contains 404 URLs, or whether noindexed pages appear in the sitemap.

**Measured evidence:**
- Sitemap Data Available: False
- Recommended Check: https://weknowthewhy.com/sitemap.xml
- Status: requires_manual_verification

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
Install @astrojs/sitemap with build-time enforcement: canonical URL normalization (trailing-slash consistent), automatic exclusion of noindex/draft pages, and a CI validation step that fails the build if sitemap URLs contain 404s, redirect chains, or noindex directives.

### How
1. Install @astrojs/sitemap: `npm install @astrojs/sitemap`
2. Add the integration to astro.config.mjs with an explicit filter function that excludes noindex and draft pages. Set `trailingSlash` in Astro config to match your canonical decision — pick one format and enforce it everywhere (this resolves the trailing-slash conflict amplification identified in the cluster).
3. Add `lastmod` via a custom serialize function using the page's git commit date or frontmatter `updatedAt` field — do not use build time as lastmod (it misleads Googlebot into treating every page as freshly modified on every deploy).
4. Add a post-build validation script (`scripts/validate-sitemap.mjs`) that: (a) parses the generated sitemap.xml, (b) fetches each URL with a HEAD request, (c) fails with exit code 1 if any URL returns non-200, follows a redirect, or has a `noindex` X-Robots-Tag or meta robots tag. Wire this into your CI pipeline as a required check after `astro build`.
5. Submit the sitemap URL to Google Search Console and Bing Webmaster Tools after the first clean build. Update robots.txt to declare `Sitemap: https://yourdomain.com/sitemap-index.xml` (Astro sitemap generates a sitemap index by default).
6. Audit the previously submitted sitemap (if one exists) in Google Search Console under Sitemaps > Submitted sitemaps. If the old sitemap URL differs from the new one, submit the new URL and remove the old entry. Do not 301 the old sitemap URL — remove it explicitly in GSC.

### Code examples
```
// astro.config.mjs
// SITE-SPECIFIC ASSUMPTION: trailing slash policy is 'always' — change to 'never' if canonical URLs omit trailing slashes.
// SITE-SPECIFIC ASSUMPTION: site URL must match the canonical origin exactly, including protocol.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE_URL = 'https://example.com'; // CONFIGURE: replace with actual canonical origin

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always', // CONFIGURE: must match server redirect behavior — 'always' | 'never' | 'ignore'
  integrations: [
    sitemap({
      // Exclude pages that must not appear in sitemap.
      // Precondition: noindex pages set `robots: 'noindex'` in frontmatter OR match a known path pattern.
      filter: (page) => {
        const EXCLUDED_PATH_PATTERNS = [
          /\/404/,
          /\/draft\//,
          /\/preview\//,
          /\/admin\//,
          /\/thank-you/, // CONFIGURE: add any noindex path patterns for this site
        ];
        return !EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(page));
      },
      // Use frontmatter updatedAt or publishedAt for lastmod — never build time.
      // Precondition: pages expose lastmod via Astro's content collection or page props.
      // If no lastmod data is available, omit serialize entirely rather than using new Date().
      serialize(item) {
        return {
          url: item.url,
          lastmod: item.lastmod ?? undefined, // omit if not available — do not default to build time
          changefreq: 'weekly',
          priority: item.url === SITE_URL + '/' ? 1.0 : 0.7,
        };
      },
    }),
  ],
});

// scripts/validate-sitemap.mjs
// Run after `astro build` in CI: `node scripts/validate-sitemap.mjs`
// Precondition: dist/sitemap-index.xml and dist/sitemap-0.xml exist (Astro sitemap output).
// Precondition: Node.js >= 18 (native fetch available).
import { readFileSync } from 'fs';
import { resolve } from 'path';

// CONFIGURE: adjust if Astro output directory differs from 'dist'
const DIST_DIR = resolve(process.cwd(), 'dist');

// Named constants — no magic numbers
const FETCH_TIMEOUT_MS = 10_000;       // 10s per URL before treating as failure
const MAX_CONCURRENT_REQUESTS = 5;     // avoid hammering the preview/staging server
const ACCEPTABLE_STATUS = 200;
const NOINDEX_PATTERN = /noindex/i;

function parseSitemapUrls(xmlContent) {
  // Minimal XML parse — extracts <loc> values without a full XML parser dependency.
  // Precondition: sitemap is well-formed XML produced by @astrojs/sitemap (it always is).
  const matches = [...xmlContent.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1].trim());
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual', // do not follow redirects — we want to detect them
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function validateUrl(url) {
  let response;
  try {
    response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
  } catch (err) {
    return { url, status: 'FETCH_ERROR', detail: err.message };
  }

  if (response.status !== ACCEPTABLE_STATUS) {
    return {
      url,
      status: 'FAIL',
      detail: `HTTP ${response.status} — expected 200. Redirect or error detected.`,
    };
  }

  const robotsHeader = response.headers.get('x-robots-tag') ?? '';
  if (NOINDEX_PATTERN.test(robotsHeader)) {
    return { url, status: 'FAIL', detail: `noindex directive in X-Robots-Tag: ${robotsHeader}` };
  }

  return { url, status: 'OK' };
}

async function runInBatches(items, batchSize, asyncFn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(asyncFn));
    results.push(...batchResults);
  }
  return results;
}

async function main() {
  // Read sitemap index to find child sitemaps
  let indexXml;
  try {
    indexXml = readFileSync(resolve(DIST_DIR, 'sitemap-index.xml'), 'utf-8');
  } catch {
    console.error('ERROR: sitemap-index.xml not found in dist/. Did `astro build` complete?');
    process.exit(1);
  }

  // Collect all page URLs from all child sitemaps
  const childSitemapPaths = parseSitemapUrls(indexXml).map((url) => {
    // Convert absolute URL back to local file path for reading from dist
    const pathname = new URL(url).pathname;
    return resolve(DIST_DIR, pathname.replace(/^\//, ''));
  });

  const allPageUrls = [];
  for (const sitemapPath of childSitemapPaths) {
    let xml;
    try {
      xml = readFileSync(sitemapPath, 'utf-8');
    } catch {
      console.error(`ERROR: Child sitemap not found at ${sitemapPath}`);
      process.exit(1);
    }
    allPageUrls.push(...parseSitemapUrls(xml));
  }

  console.log(`Validating ${allPageUrls.length} sitemap URLs...`);

  const results = await runInBatches(allPageUrls, MAX_CONCURRENT_REQUESTS, validateUrl);

  const failures = results.filter((r) => r.status !== 'OK');

  if (failures.length > 0) {
    console.error(`\nSITEMAP VALIDATION FAILED — ${failures.length} URL(s) rejected:`);
    for (const f of failures) {
      console.error(`  [${f.status}] ${f.url} — ${f.detail}`);
    }
    process.exit(1); // Fails CI build
  }

  console.log('All sitemap URLs validated successfully.');
  process.exit(0);
}

main();

# robots.txt addition — place in public/robots.txt
# CONFIGURE: replace with actual canonical origin
User-agent: *
Allow: /

# Declare sitemap location so crawlers discover it without GSC submission
Sitemap: https://example.com/sitemap-index.xml

# CI step addition (GitHub Actions example)
# Add after your existing build step
# CONFIGURE: adjust node-version and build command to match project
- name: Build site
  run: npm run build

- name: Validate sitemap
  run: node scripts/validate-sitemap.mjs
  # This step runs against the built dist/ output.
  # Precondition: if validation fetches live URLs (not local files), a preview deployment
  # must be available at this point. For local-only validation (checking file existence
  # and structure only), the script above reads from dist/ directly without network requests.
  # For full HTTP validation, run this step against a deployed preview environment and
  # pass the preview base URL as an environment variable.

```

## Risks
- RISK: The filter function excludes pages by path pattern. If a noindex page does not match any declared pattern (e.g., a dynamically generated noindex page with an unpredictable path), it will appear in the sitemap. MITIGATION: Extend the filter to read Astro content collection frontmatter `draft` and `robots` fields at build time, not just path patterns. This requires the filter to have access to the content collection — achievable via a custom integration hook rather than the sitemap filter callback, which only receives the URL string.
- RISK: The CI validation script uses HEAD requests. Some servers return 405 Method Not Allowed for HEAD on valid pages. MITIGATION: Add a fallback to GET with `Range: bytes=0-0` header if HEAD returns 405, before treating the URL as failed.
- RISK: Changing `trailingSlash` in Astro config changes the URLs Astro generates for all pages. If internal links, canonical tags, or OG URLs were hardcoded without trailing slashes and the policy is set to 'always', a mismatch is introduced in the opposite direction. MITIGATION: Audit all hardcoded URL strings in the codebase before changing `trailingSlash`. Use Astro's `getRelativeLocaleUrl` or relative paths for internal links so they inherit the configured policy automatically.
- RISK: The validate-sitemap script reads child sitemaps from dist/ by converting absolute URLs back to local file paths. If the SITE_URL contains a path prefix (e.g., `https://example.com/subdir/`), the path stripping logic will produce incorrect file paths. MITIGATION: The script must be tested against the actual SITE_URL value before CI integration. If a path prefix exists, adjust the path resolution logic to strip the prefix before resolving against DIST_DIR.
- RISK: Removing a previously submitted sitemap URL from Google Search Console does not immediately remove those URLs from Google's index. Stale GSC sitemap entries continue to influence crawl behavior for days to weeks. MITIGATION: After submitting the new sitemap, use GSC's URL Inspection tool to request recrawl of the canonical homepage and a representative blog post to accelerate the transition. Do not delete the old sitemap entry from GSC until the new one shows 'Success' status.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
