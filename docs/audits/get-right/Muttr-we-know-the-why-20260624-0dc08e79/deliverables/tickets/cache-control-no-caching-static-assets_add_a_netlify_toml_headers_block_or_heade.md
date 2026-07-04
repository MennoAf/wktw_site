---
finding_id: "cache-control-no-caching-static-assets"
title: "cache-control: public, max-age=0, must-revalidate — no browser caching of page content"
severity: "low"
root_cause_cluster: "Caching Architecture Gaps — Static Assets Without Immutable Headers"
why_this_matters: "On every repeat page navigation, the browser currently issues a conditional GET (If-None-Match or If-Modified-Since) for every /_astro/* asset before it can render."
fix_summary: "Add a netlify.toml [[headers]] block (or _headers file) that applies 'public, max-age=31536000, immutable' exclusively to Astro's content-hashed asset paths (/_astro/*) while leaving the existing HTM…"
confidence_tier: "confirmed"
---

# cache-control: public, max-age=0, must-revalidate — no browser caching of page content

**Finding:** cache-control: public, max-age=0, must-revalidate — no browser caching of page content  
**Severity:** Low  
**Why this matters:** On every repeat page navigation, the browser currently issues a conditional GET (If-None-Match or If-Modified-Since) for every /_astro/* asset before it can render.  
**Root cause:** Caching Architecture Gaps — Static Assets Without Immutable Headers  
**Fix:** Add a netlify.toml [[headers]] block (or _headers file) that applies 'public, max-age=31536000, immutable' exclusively to Astro's content-hashed asset paths (/_astro/*) while leaving the existing HTM…

> **Evidence Basis:** Confirmed

---

## Impact

- **Repeat Visit Latency:** On every repeat page navigation, the browser currently issues a conditional GET (If-None-Match or If-Modified-Since) for every /_astro/* asset before it can render. The server responds 304 Not Modified — the asset bytes are never retransmitted, but the round-trip still occurs. On a mobile network at 80ms RTT with 20 hashed assets, this is 1,600ms of serialized or parallelized revalidation overhead that is entirely eliminated by serving from browser cache. After this fix, repeat visits serve all hashed assets from the local disk cache with zero network round-trips.
- **Cdn Cache Hit Ratio:** Without cache-status headers, it is currently impossible to determine whether Netlify's CDN edge is caching /_astro/* assets or proxying every request to origin. Enabling X-Cache-Status exposes this ratio. If CDN caching is also misconfigured (a separate investigation), origin load and TTFB for cached assets are higher than necessary. This fix establishes the observability baseline required to detect and remediate that condition.
- **Lcp And Fcp On Repeat Visits:** LCP and FCP on repeat visits are directly gated on asset availability. If CSS and JS must be revalidated before the browser can apply styles and execute render-critical scripts, paint metrics are delayed by the revalidation round-trip. Eliminating revalidation for hashed assets removes this gate entirely for returning visitors — the highest-intent cohort.
- **Core Web Vitals Cohort:** Google's Core Web Vitals field data is weighted toward real user sessions, which include a significant proportion of repeat visits. Improving repeat-visit asset load time will improve the field CWV distribution for this site, which directly affects Google Search ranking signals.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_007`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The document-level cache-control header is set to 'public, max-age=0, must-revalidate', meaning the browser must revalidate with the server on every request.. For a static Astro-generated page hosted on Netlify, this is the default Netlify behavior for HTML documents (Netlify uses atomic deploys and relies on CDN-level caching with instant invalidation).

**Measured evidence:**
- Document Cache Control: public, max-age=0, must-revalidate
- Cdn Status Reported: False
- Resources Without Cdn Status: 10
- Astro Hashed Assets: ['_astro/Section.Dupvz703.css']
- Static Asset Cache Headers: not individually available

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
Add a netlify.toml [[headers]] block (or _headers file) that applies 'public, max-age=31536000, immutable' exclusively to Astro's content-hashed asset paths (/_astro/*) while leaving the existing HTML document policy ('public, max-age=0, must-revalidate') completely untouched. Simultaneously enable Netlify cache-status response headers on all routes to restore CDN observability.

### How
1. Confirm the asset path: run 'ls dist/_astro/' after a local 'astro build' to verify all compiled CSS, JS, and processed images land under /_astro/. Do not proceed if the output directory has been customized to a different path — update the glob accordingly.
2. Confirm no existing _headers file conflicts: search the repo root for a file named '_headers'. If it exists, merge the new rules into it rather than creating netlify.toml headers — Netlify applies _headers rules after netlify.toml and the last matching rule wins, so duplicate rules for the same path will produce unpredictable results.
3. Open (or create) netlify.toml at the repo root. Add the [[headers]] blocks shown in the code example. The rule order is intentional: the /_astro/* rule must appear before any catch-all /* rule so Netlify's top-down matching applies the immutable policy first.
4. Do NOT add a [[headers]] rule for /* that changes the Cache-Control value. The existing 'public, max-age=0, must-revalidate' on HTML documents is correct Netlify atomic-deploy behavior and must not be overridden.
5. If self-hosted fonts are served from a path other than /_astro/ (e.g., /fonts/), add a separate [[headers]] block for that path using the identical immutable policy. Only do this if the font filenames are content-hashed — if they are not hashed, use 'public, max-age=604800' (7 days) with no immutable directive instead.
6. Commit and push to trigger a Netlify deploy. After deploy completes, run: 'curl -sI https://your-domain.com/_astro/<any-hashed-filename>.css | grep -i cache-control' and verify the response header reads 'public, max-age=31536000, immutable'.
7. Verify HTML documents are unaffected: 'curl -sI https://your-domain.com/ | grep -i cache-control' must still return 'public, max-age=0, must-revalidate'.
8. Verify CDN observability: 'curl -sI https://your-domain.com/_astro/<filename>.css | grep -i x-cache' should now return a value (HIT or MISS). On a second request to the same URL, confirm the value changes to HIT.
9. If the site uses Netlify's asset optimization (Pretty URLs, asset bundling, or post-processing), verify those features are not rewriting /_astro/ paths — post-processing can strip content hashes, which would make the immutable policy unsafe. Disable Netlify post-processing for the /_astro/ path if this is detected.

### Code examples
```
# netlify.toml — place at repository root
# SITE-SPECIFIC ASSUMPTION: Astro's output directory is 'dist' (default).
# If astro.config.mjs sets outDir to a custom path, verify /_astro/ is still
# the compiled asset subdirectory before deploying this configuration.

[build]
  publish = "dist"

# Rule 1: Astro content-hashed assets — immutable, maximum TTL
# Precondition: every file under /_astro/ carries a content hash in its filename.
# If the hash changes, the URL changes. A given URL therefore serves identical
# bytes forever. The 'immutable' directive tells browsers not to revalidate
# even when the user performs a hard refresh (Ctrl+Shift+R in Chrome/Firefox).
[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    # Expose Netlify CDN cache status for observability.
    # 'x-cache' is the Netlify CDN header; value will be HIT or MISS.
    # This does not affect caching behavior — it is read-only diagnostic data.
    X-Cache-Status = "{{x-cache}}"

# Rule 2: Self-hosted fonts served from a dedicated /fonts/ path.
# SITE-SPECIFIC ASSUMPTION: font files at /fonts/ are content-hashed.
# If they are NOT hashed, replace max-age=31536000 with max-age=604800
# and remove the 'immutable' directive to allow revalidation on redeploy.
# Remove this block entirely if fonts are served via /_astro/ (already covered above)
# or via a third-party CDN (Google Fonts manages its own headers).
[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Rule 3: Catch-all — explicitly preserve Netlify's correct HTML document policy.
# This rule is defensive: it documents intent and prevents a future engineer
# from accidentally inheriting a stale cached HTML document.
# DO NOT change this value. Netlify's atomic deploy model requires HTML
# to be revalidated on every request so new deploys are immediately visible.
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
# Verification script — run after deploy (bash)
# SITE-SPECIFIC ASSUMPTION: replace 'your-domain.com' and the asset filename
# with actual values from your Netlify deploy output.

set -euo pipefail

DOMAIN="your-domain.com"
# Replace with any real hashed filename from dist/_astro/ after build
ASSET_PATH="/_astro/index.BkR9x2mP.js"

echo "=== Checking hashed asset cache headers ==="
curl -sI "https://${DOMAIN}${ASSET_PATH}" | grep -iE "cache-control|x-cache|etag"

echo ""
echo "=== Expected: Cache-Control: public, max-age=31536000, immutable ==="

echo ""
echo "=== Checking HTML document cache headers (must be unchanged) ==="
curl -sI "https://${DOMAIN}/" | grep -iE "cache-control"

echo ""
echo "=== Expected: Cache-Control: public, max-age=0, must-revalidate ==="

echo ""
echo "=== Second request to asset — CDN HIT check ==="
curl -sI "https://${DOMAIN}${ASSET_PATH}" | grep -iE "x-cache"
echo "=== Expected: x-cache: HIT (or equivalent CDN hit indicator) ==="
```

## Risks
- RISK: Non-hashed assets accidentally matched by /_astro/* glob. MITIGATION: Astro's build pipeline guarantees content hashes on all files it emits to /_astro/. Verify with 'ls dist/_astro/' — every filename must contain a hash segment (e.g., 'Component.Abc123xy.js'). If any file in that directory lacks a hash (e.g., 'index.js'), do not apply the immutable policy to that file — it would be served stale after a redeploy until the browser cache TTL expires (up to 1 year). Investigate why Astro emitted an unhashed file before deploying.
- RISK: Netlify post-processing strips or rewrites content hashes. MITIGATION: Netlify's asset optimization features (Pretty URLs, bundle/minify) can rewrite asset paths and strip hashes. Check netlify.toml for [build.processing] settings. If post-processing is active on /_astro/ paths, disable it for that directory or disable it globally. Confirm by comparing 'dist/_astro/' filenames against the actual URLs served in production — they must match exactly.
- RISK: _headers file conflicts with netlify.toml rules. MITIGATION: Netlify applies _headers rules after netlify.toml [[headers]] rules, and the last matching rule wins. If a _headers file exists with a /* catch-all that sets Cache-Control, it will override the netlify.toml /_astro/* rule. Audit the _headers file before deploying and consolidate all header rules into a single source of truth (prefer netlify.toml for maintainability).
- RISK: Self-hosted fonts at /fonts/ are not content-hashed. MITIGATION: If font filenames are static (e.g., 'inter-regular.woff2' with no hash), applying max-age=31536000 + immutable means a font file change on redeploy will not be picked up by browsers with a cached copy for up to 1 year. Use max-age=604800 (7 days) without immutable for unhashed font files, or implement content hashing for font filenames before applying the immutable policy.
- RISK: Stale asset delivery during a rollback. MITIGATION: This is not a new risk introduced by this fix — it is inherent to immutable caching of hashed assets. On rollback, Netlify serves the previous deploy's HTML, which references the previous deploy's hashed asset URLs. Browsers that cached the new deploy's assets will not find those URLs referenced in the rolled-back HTML, so they will fetch the old URLs fresh. This is correct behavior. No mitigation required.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
