---
finding_id: "server-transport-no-cdn-cache-headers"
title: "No CDN cache-status headers on any resource — cache-hit verification impossible"
severity: "medium"
root_cause_cluster: "Caching Architecture Gaps — Static Assets Without Immutable Headers"
why_this_matters: "Returning visitors currently re-download every CSS, JS, and font file on each visit because the browser cannot safely cache assets without a max-age directive."
fix_summary: "Add a Netlify _headers file (or netlify.toml [[headers]] rules) that applies Cache-Control: public, max-age=31536000, immutable to all /_astro/* assets, retains must-revalidate on HTML documents, and…"
confidence_tier: "confirmed"
---

# No CDN cache-status headers on any resource — cache-hit verification impossible

**Finding:** No CDN cache-status headers on any resource — cache-hit verification impossible  
**Severity:** Medium  
**Why this matters:** Returning visitors currently re-download every CSS, JS, and font file on each visit because the browser cannot safely cache assets without a max-age directive.  
**Root cause:** Caching Architecture Gaps — Static Assets Without Immutable Headers  
**Fix:** Add a Netlify _headers file (or netlify.toml [[headers]] rules) that applies Cache-Control: public, max-age=31536000, immutable to all /_astro/* assets, retains must-revalidate on HTML documents, and…

> **Evidence Basis:** Confirmed

---

## Impact

- **Repeat Visitor Load Time:** Returning visitors currently re-download every CSS, JS, and font file on each visit because the browser cannot safely cache assets without a max-age directive. After this fix, those assets are served from the browser cache with zero network round-trips. The reduction in transferred bytes is proportional to the total size of /_astro/* assets — measurable directly in WebPageTest repeat-view as bytes transferred dropping from full asset size to near-zero.
- **Cdn Edge Latency:** Without Netlify-CDN-Cache-Control, it is unverifiable whether Netlify's edge nodes are caching /_astro/* assets. If they are not, geographically distant users pay origin round-trip latency on every static asset request. Adding Netlify-CDN-Cache-Control: public, max-age=31536000, immutable explicitly instructs the edge to cache, eliminating origin round-trips for cached assets. Observable via Age header becoming non-zero on repeat requests.
- **Lcp And Fcp Repeat View:** LCP and FCP on repeat visits are directly gated on how quickly the browser can obtain the CSS and JS needed to render above-fold content. If those files are served from browser cache (0ms network) instead of re-downloaded, the rendering pipeline starts earlier. The magnitude depends on asset sizes and user connection speed — largest impact on mobile and high-latency connections.
- **Operational Observability:** The Age header on /_astro/* responses becomes the primary cache-hit signal post-deploy. A non-zero Age confirms CDN cache hit. This closes the monitoring blind spot identified in the finding without requiring access to Netlify's internal analytics dashboard.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_007`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** All 11 resources with headers show 'no-cdn-status' for cache status.. While Netlify provides edge CDN by default, the absence of cache-status headers (CF-Cache-Status, X-Cache, Age, etc.) means cache-hit ratios cannot be verified.

**Measured evidence:**
- Resources Without Cdn Status: 11
- Total Transfer Kb: 398
- Html Cache Control: public,max-age=0,must-revalidate
- Content Hashed Css: Section.Dupvz703.css
- Note: Netlify provides edge CDN implicitly but cache-status headers are not exposed for verification. Static assets with content-hashed filenames should carry immutable or long max-age Cache-Control.

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
Add a Netlify _headers file (or netlify.toml [[headers]] rules) that applies Cache-Control: public, max-age=31536000, immutable to all /_astro/* assets, retains must-revalidate on HTML documents, and enables Netlify's CDN-Cache-Control header so edge cache behavior becomes observable. No application code changes required.

### How
1. VERIFY CURRENT ASSET PATH: Confirm Astro outputs hashed assets to /_astro/* by inspecting dist/ after a local build (npx astro build). If astro.config.mjs sets a custom build.assets value, substitute that path in every rule below.
2. CHOOSE ONE CONFIGURATION SURFACE — do not use both. If a _headers file already exists in the project root (or public/), extend it. If netlify.toml already exists with [[headers]] blocks, add rules there. Mixing both causes netlify.toml to take precedence and _headers rules to be silently ignored for overlapping paths.
3. ADD THE _headers FILE (preferred for header-only projects): Create public/_headers (Astro copies public/ to dist/ verbatim, so this file lands at the site root on deploy). Content: see code_examples[0].
4. ALTERNATIVE — netlify.toml [[headers]] BLOCKS: If the project already uses netlify.toml, append the blocks in code_examples[1]. Do not duplicate rules across both files.
5. SCOPE VALIDATION — BEFORE DEPLOYING: Run netlify dev locally and curl -I http://localhost:8888/_astro/<any-hashed-file>.css. Confirm Cache-Control: public, max-age=31536000, immutable is present. Confirm the HTML root returns Cache-Control: public, max-age=0, must-revalidate. If netlify dev is not available, deploy to a Netlify branch deploy and curl the branch URL.
6. ENABLE CDN CACHE-STATUS OBSERVABILITY: Add the Netlify-CDN-Cache-Control header to /_astro/* rules (included in code_examples). This instructs Netlify's edge to cache the asset at the CDN layer independently of the browser Cache-Control directive. After deploy, curl -I https://your-site.netlify.app/_astro/<file>.css and look for Age: <seconds> in the response — a non-zero Age confirms a CDN cache hit. Netlify does not emit CF-Cache-Status or X-Cache; Age is the observable proxy.
7. FONT FILES (FORWARD-COMPATIBILITY): If the related self-hosting fix is implemented and fonts land under /_astro/* or /fonts/*, the /_astro/* rule covers the former automatically. For a /fonts/* path, add a matching rule from code_examples[0] section 3 before deploying self-hosted fonts.
8. CACHE INVALIDATION CONTRACT: Content-hashed filenames make immutable headers safe — a changed file gets a new hash and a new URL, so browsers never serve stale content. Confirm this contract holds by verifying that astro.config.mjs does NOT set output: 'server' for the affected asset paths (SSR mode bypasses hashing for dynamic routes; static assets under /_astro/* remain hashed regardless).
9. POST-DEPLOY VERIFICATION CHECKLIST: (a) curl -I <prod-url>/_astro/<file>.css → Cache-Control: public, max-age=31536000, immutable. (b) curl -I <prod-url>/ → Cache-Control: public, max-age=0, must-revalidate. (c) Second curl of same asset URL → Age header present and > 0. (d) WebPageTest repeat-view test → static assets show 'Not Modified' or load from cache with 0 bytes transferred.

### Code examples
```
# public/_headers
# ============================================================
# SECTION 1: Hashed static assets — safe for permanent caching
# Astro content-hashes all filenames under /_astro/*.
# A changed file gets a new URL, so immutable is safe here.
# SITE-SPECIFIC ASSUMPTION: Astro build.assets defaults to '_astro'.
# If astro.config.mjs sets build.assets to a different value,
# replace '/_astro/*' with that path throughout this file.
# ============================================================
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
  Netlify-CDN-Cache-Control: public, max-age=31536000, immutable

# ============================================================
# SECTION 2: HTML documents — must revalidate on every request.
# 'public, max-age=0, must-revalidate' is the correct policy
# for versioned HTML: CDN may cache but must revalidate before
# serving. This matches Netlify's existing default for HTML
# and is listed here explicitly to prevent accidental override
# by a future catch-all rule.
# ============================================================
/*
  Cache-Control: public, max-age=0, must-revalidate

# ============================================================
# SECTION 3: Self-hosted fonts (activate when font self-hosting
# fix is deployed). If fonts land under /_astro/*, the rule
# above already covers them — do not duplicate.
# Only add this block if fonts are served from a separate path.
# SITE-SPECIFIC ASSUMPTION: /fonts/* path — adjust if different.
# ============================================================
# /fonts/*
#   Cache-Control: public, max-age=31536000, immutable
#   Netlify-CDN-Cache-Control: public, max-age=31536000, immutable
# netlify.toml — use ONLY if _headers file is not present.
# Mixing both files causes netlify.toml to silently win on
# overlapping paths, making _headers rules unobservable.

# ============================================================
# Hashed static assets
# SITE-SPECIFIC ASSUMPTION: build.assets = '_astro' (Astro default).
# ============================================================
[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Netlify-CDN-Cache-Control = "public, max-age=31536000, immutable"

# ============================================================
# HTML documents — explicit to prevent future catch-all override
# ============================================================
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# ============================================================
# Self-hosted fonts — activate when font self-hosting is deployed
# SITE-SPECIFIC ASSUMPTION: /fonts/* path — adjust if different.
# ============================================================
# [[headers]]
#   for = "/fonts/*"
#   [headers.values]
#     Cache-Control = "public, max-age=31536000, immutable"
#     Netlify-CDN-Cache-Control = "public, max-age=31536000, immutable"
```

## Risks
- RISK: If a future deploy does NOT change a file's content but the build pipeline regenerates it with a different hash (e.g., due to non-deterministic bundling), the old URL becomes a dead link and the new URL is a cache miss. MITIGATION: Astro's build is deterministic for unchanged content — verify by running astro build twice on the same source and diffing dist/_astro/ filenames. If hashes differ across identical builds, fix the non-determinism before enabling immutable headers.
- RISK: The /*  catch-all Cache-Control rule in _headers applies to all paths not matched by a more specific rule. If the site serves API routes, webhooks, or Netlify Functions under paths not prefixed with /_astro/, the must-revalidate policy is correct for those too — but confirm no function route requires a different cache policy (e.g., no-store for authenticated responses). MITIGATION: Audit netlify.toml [functions] and any serverless route definitions before deploying the catch-all rule.
- RISK: If netlify.toml already contains [[headers]] blocks and a public/_headers file is also added, Netlify's documented behavior is that netlify.toml takes precedence for overlapping paths. The _headers rules for those paths will be silently ignored. MITIGATION: Use exactly one configuration surface. Check for existing [[headers]] in netlify.toml before creating _headers.
- RISK: Netlify-CDN-Cache-Control is a Netlify-specific header directive. It has no effect on other CDN providers (Cloudflare, Fastly, Vercel). If the site is ever migrated off Netlify, this header becomes inert and the CDN caching contract must be re-established using the new platform's equivalent mechanism. MITIGATION: Document this dependency in the project README alongside the _headers file.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
