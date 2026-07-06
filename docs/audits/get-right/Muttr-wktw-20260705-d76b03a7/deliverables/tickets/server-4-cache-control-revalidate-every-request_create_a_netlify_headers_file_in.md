---
finding_id: "server-4-cache-control-revalidate-every-request"
title: "Cache-Control forces revalidation on every request — static assets not leveraging browser cache"
severity: "medium"
root_cause_cluster: "Cache Configuration — Static Assets Revalidating on Every Request"
why_this_matters: "Eliminates conditional revalidation round-trips (304 responses) for all static assets on repeat page loads."
fix_summary: "Create a Netlify `_headers` file in Astro's `public/` directory that applies immutable caching to content-hashed assets under `/_astro/*` and long-lived caching to self-hosted font files, overriding…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["resource-loading-css-parse-budget-disproportionate", "server-transport-cdn-cache-status-missing", "server-transport-no-brotli"]
---

# Cache-Control forces revalidation on every request — static assets not leveraging browser cache

**Finding:** Cache-Control forces revalidation on every request — static assets not leveraging browser cache  
**Severity:** Medium  
**Why this matters:** Eliminates conditional revalidation round-trips (304 responses) for all static assets on repeat page loads.  
**Root cause:** Cache Configuration — Static Assets Revalidating on Every Request  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Create a Netlify `_headers` file in Astro's `public/` directory that applies immutable caching to content-hashed assets under `/_astro/*` and long-lived caching to self-hosted font files, overriding…  

> **Evidence Basis:** Confirmed

---

## Also resolves (3)

One fix closes the findings below — they were folded here as the same remediation:

- `resource-loading-css-parse-budget-disproportionate` (Medium) — Reduce the browser's CSS parse budget from 1.53MB uncompressed to a target of 20–60KB per route by identifying the stylesheet's origin (Tailwind, Bootstrap, or CMS bundle), enabling unused-rule elimination at build time, and — where the build pipeline permits — splitting critical-path CSS from deferred CSS. The goal is to eliminate 200–600ms of render-blocking CSSOM construction on low-end Android devices without altering any visual output.
- `server-transport-cdn-cache-status-missing` (Medium) — No CDN cache-status headers detected — Netlify edge cache hit/miss ratio unverifiable
- `server-transport-no-brotli` (Low) — Gzip compression active but Brotli not detected — missed compression optimization

## Impact

- **Ttfb Repeat Visits:** Eliminates conditional revalidation round-trips (304 responses) for all static assets on repeat page loads. For a page loading 6-10 static assets, this removes 6-10 full RTTs per navigation. On mobile networks with 50-150ms RTT, this eliminates 300-1500ms of cumulative latency per repeat page view that currently returns no new data.
- **Lcp Repeat Visits:** CSS and font files that are LCP-blocking will load from disk cache with zero network latency on repeat visits, directly reducing time-to-render for returning visitors.
- **Bandwidth:** Eliminates all conditional request/response overhead (HTTP headers per 304 response) for cached assets across every repeat page view and multi-page session. The bytes saved per request are small (~500B headers), but they multiply across assets × pages × sessions.
- **Inp Indirect:** Reducing network contention from unnecessary revalidation requests frees browser networking threads, reducing input delay during page transitions on resource-constrained mobile devices.
- **Edge Load:** Reduces request volume to Netlify's edge by eliminating revalidation traffic for assets the browser already holds. For multi-page sessions (e.g. 5 pages × 8 assets = 40 requests reduced to 0 on warm cache), this meaningfully reduces origin/edge load.

## Compliance & Legal

**Compliance Domains:** performance_as_liability

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_007`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** All 6 resources return cache-control: public,max-age=0,must-revalidate.. This means every page visit triggers conditional requests (If-None-Match/If-Modified-Since) for all resources, even though the site is fully static.

**Measured evidence:**
- Cache Control Value: public,max-age=0,must-revalidate
- Affected Resources: [{'url': 'Section.iKsGnDKO.css', 'size_kb': 7, 'has_content_hash': True}, {'url': 'inter-latin.woff2', 'size_kb': 47, 'immutable_content': True}, {'ur
- Total Revalidation Overhead Kb: 106
- Cdn Cache Status: no-cdn-status on all resources
- Recommendation: Set cache-control: public,max-age=31536000,immutable on content-hashed CSS and font files. Keep max-age=0,must-revalidate on HTML document only.
- Cache Control: public, max-age=0, must-revalidate
- Fingerprinted Assets: ['Section.iKsGnDKO.css']
- Font Assets: ['inter-latin.woff2', 'lora-latin.woff2', 'jetbrainsmono-latin.woff2']

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
Create a Netlify `_headers` file in Astro's `public/` directory that applies immutable caching to content-hashed assets under `/_astro/*` and long-lived caching to self-hosted font files, overriding Netlify's default `max-age=0, must-revalidate` on every static resource.

### How
1. Create `public/_headers` — Astro copies everything in `public/` to the build output root, so Netlify will discover this file automatically at deploy time. No `netlify.toml` changes required (though a TOML equivalent is provided as an alternative). 2. Add a rule for `/_astro/*` setting `Cache-Control: public, max-age=31536000, immutable`. This path contains all Astro-built CSS, JS, and processed images — every filename is content-hashed by Vite, so the URL is guaranteed unique per content revision. `immutable` tells the browser to skip conditional revalidation entirely; `max-age=31536000` (1 year) is the HTTP standard ceiling for cache duration. 3. Add a rule for `/fonts/*` (adjust path to match actual font location in `public/`) setting `Cache-Control: public, max-age=31536000, immutable`. Font binaries at a given URL never change. 4. Leave all other paths on Netlify's default (`max-age=0, must-revalidate`) — HTML pages, `sitemap.xml`, `robots.txt`, and any non-hashed assets SHOULD revalidate to pick up content changes on deploy. 5. Deploy and verify: run `curl -sI https://YOURDOMAIN/_astro/Section.iKsGnDKO.css | grep -i cache-control` — expect `public, max-age=31536000, immutable`. 6. Verify HTML is NOT cached aggressively: `curl -sI https://YOURDOMAIN/ | grep -i cache-control` — expect Netlify's default `public, max-age=0, must-revalidate`.

### Code examples
```
# File: public/_headers
# Astro copies this verbatim to the build output root.
# Netlify reads it at deploy time to configure edge cache headers.
# Docs: https://docs.netlify.com/routing/headers/

# ── Content-hashed assets (CSS, JS, processed images) ──
# Astro/Vite fingerprints every filename under /_astro/ with a content hash
# (e.g., Section.iKsGnDKO.css). When content changes, the hash changes,
# producing a new URL — the old URL is never served again.
# "immutable" tells browsers to skip conditional revalidation (no 304 round-trips).
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# ── Self-hosted font files ──
# Binary assets that never change at a given URL.
# SITE-SPECIFIC: adjust the path glob if fonts live elsewhere (e.g., /assets/fonts/*).
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
# ALTERNATIVE: netlify.toml equivalent (use ONE approach, not both)
# Place at repository root alongside astro.config.*
# If both _headers and netlify.toml define the same path, _headers wins.

[[headers]]
  # SITE-SPECIFIC: this glob covers all Astro/Vite content-hashed output
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  # SITE-SPECIFIC: adjust path if fonts are served from a different directory
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
#!/usr/bin/env bash
# Verification script — run after deploy to confirm headers are applied.
# SITE-SPECIFIC: replace SITE_ORIGIN with the production domain.
SITE_ORIGIN="https://example.com"

# 1. Hashed asset should be immutable
echo "--- Checking /_astro/ asset ---"
curl -sI "${SITE_ORIGIN}/_astro/Section.iKsGnDKO.css" | grep -i 'cache-control'
# Expected: cache-control: public, max-age=31536000, immutable

# 2. Font should be immutable
echo "--- Checking font asset ---"
curl -sI "${SITE_ORIGIN}/fonts/inter-latin.woff2" | grep -i 'cache-control'
# Expected: cache-control: public, max-age=31536000, immutable

# 3. HTML should NOT be aggressively cached
echo "--- Checking HTML page ---"
curl -sI "${SITE_ORIGIN}/" | grep -i 'cache-control'
# Expected: cache-control: public, max-age=0, must-revalidate
```

## Risks
- Incorrectly broad glob (e.g., `/*` instead of `/_astro/*`) would aggressively cache HTML pages, preventing visitors from seeing content updates until their cache expires. Mitigation: the proposed rules are scoped exclusively to `/_astro/*` and `/fonts/*` — paths that contain only immutable, content-hashed or binary-stable assets. HTML, sitemap, and robots.txt remain on Netlify's revalidation default.
- If fonts are relocated to a different directory in a future redesign (e.g., moved into `/_astro/` via Vite processing or to `/assets/fonts/`), the `/fonts/*` rule becomes a no-op and the new path would fall back to `max-age=0`. Mitigation: the `/_astro/*` rule would automatically cover fonts processed through Vite; only manually-placed fonts in a new `public/` subdirectory would need a header rule update.
- Netlify's `_headers` file has a 50-rule limit on the free tier. This proposal uses 2 rules. No risk unless the site already has 49+ custom header rules (unlikely for a static Astro site).

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
