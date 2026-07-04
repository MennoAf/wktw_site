---
finding_id: "st-6-cache-control-no-immutable-on-hashed-assets"
title: "HTML cache-control forces revalidation on every request — verify hashed assets have immutable caching"
severity: "medium"
root_cause_cluster: "Caching Architecture Gaps — Static Assets Without Immutable Headers"
why_this_matters: "Every hashed asset (CSS, JS, fonts, images) currently triggers a revalidation round-trip to Netlify's CDN edge on every page load, even when the browser holds an identical copy."
fix_summary: "Add a _headers file (or netlify.toml [[headers]] rules) that applies Cache-Control: public, max-age=31536000, immutable to all /_astro/* assets, while leaving HTML document caching untouched."
confidence_tier: "confirmed"
---

# HTML cache-control forces revalidation on every request — verify hashed assets have immutable caching

**Finding:** HTML cache-control forces revalidation on every request — verify hashed assets have immutable caching  
**Severity:** Medium  
**Why this matters:** Every hashed asset (CSS, JS, fonts, images) currently triggers a revalidation round-trip to Netlify's CDN edge on every page load, even when the browser holds an identical copy.  
**Root cause:** Caching Architecture Gaps — Static Assets Without Immutable Headers  
**Fix:** Add a _headers file (or netlify.toml [[headers]] rules) that applies Cache-Control: public, max-age=31536000, immutable to all /_astro/* assets, while leaving HTML document caching untouched.

> **Evidence Basis:** Confirmed

---

## Impact

- **Repeat Visit Load Time:** Every hashed asset (CSS, JS, fonts, images) currently triggers a revalidation round-trip to Netlify's CDN edge on every page load, even when the browser holds an identical copy. With immutable caching, repeat visitors load these assets entirely from the browser's local disk cache — zero network round-trips, zero bytes transferred for unchanged assets. The latency reduction is the full RTT to the CDN edge per asset, multiplied by the number of hashed assets per page.
- **Ttfb And Lcp:** Eliminating revalidation requests reduces connection concurrency pressure during page load. Browsers have per-origin connection limits; freeing those connections for document and above-fold resource fetches directly reduces time-to-first-byte contention and can advance LCP timing on repeat visits.
- **Cdn Origin Load:** Revalidation requests that currently reach Netlify's origin (cache misses or conditional GETs) will be eliminated for all hashed assets. This reduces origin request volume proportionally to the number of repeat visitors and hashed assets per page — directly lowering CDN bandwidth costs and origin compute load.
- **Cache Observability:** Adding the verification step surfaces whether Netlify's edge is actually caching responses (via the 'age' header). Without this, cache misses are operationally invisible — the fix also closes the monitoring gap identified in the 'no-cdn-status' observation.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_007`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The HTML document has cache-control: public,max-age=0,must-revalidate, which is correct for dynamic content.. However, the Astro CSS file (Section.Dupvz703.css) uses a content hash in its filename, indicating it should be served with immutable, long-lived cache headers (e.g., Cache-Control: public, max-age=31536000, immutable).

**Measured evidence:**
- Html Cache Control: public,max-age=0,must-revalidate
- Hashed Asset: https://weknowthewhy.com/_astro/Section.Dupvz703.css
- Hash In Filename: True
- Cdn Cache Status: no-cdn-status (unverifiable)
- Recommendation: Verify Netlify _headers or netlify.toml sets Cache-Control: public, max-age=31536000, immutable for /_astro/* paths
- Cache Control: public, max-age=0, must-revalidate
- Cache Control Header: public, max-age=0, must-revalidate
- Site Generator: Astro (inferred from _astro/ asset path)

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
Add a _headers file (or netlify.toml [[headers]] rules) that applies Cache-Control: public, max-age=31536000, immutable to all /_astro/* assets, while leaving HTML document caching untouched. This claims the caching benefit that Astro's content-hashing strategy already makes safe but that Netlify's default policy never activates.

### How
1. Confirm Astro's output directory is 'dist/' (default). The _headers file must be placed in the Astro 'public/' directory so Astro copies it verbatim into 'dist/' at build time — do NOT place it in 'dist/' directly, as that directory is wiped on every build.
2. Create 'public/_headers' with three stanzas: (a) /_astro/* with immutable caching, (b) /fonts/* with immutable caching if self-hosting fonts per cluster_005 recommendations, (c) /* catch-all that explicitly preserves the existing HTML revalidation policy so the new rules cannot bleed into document responses.
3. Verify Netlify's header precedence: more-specific path rules in _headers take priority over less-specific ones. The /_astro/* rule will win over the /* fallback for hashed assets — this is Netlify's documented behavior, not an assumption.
4. Add a 'Vary: Accept-Encoding' header to the /_astro/* stanza. Netlify's CDN compresses responses; without Vary, a compressed response cached for one client may be served uncompressed to another, causing content corruption on older proxies.
5. Add cache observability: include 'X-Cache-Debug: 1' only in a staging environment header block — do not ship debug headers to production. Instead, verify cache behavior post-deploy by inspecting the 'x-nf-request-id' and 'age' response headers on repeat requests to a hashed asset URL using curl --head.
6. If the project uses netlify.toml, the [[headers]] block is an equivalent alternative. Do not use both _headers and netlify.toml [[headers]] for the same paths — Netlify merges them and the interaction is non-obvious. Pick one and document the choice.
7. After deploy, run the verification command below to confirm the 'cache-control' and 'age' headers are correct on a live hashed asset. A rising 'age' value on a second request confirms edge caching is active.

### Code examples
```
# public/_headers
# ─────────────────────────────────────────────────────────────────────────────
# RULE 1: Astro content-hashed static assets
# Safe to cache forever: filename changes if and only if content changes.
# 'immutable' tells browsers not to revalidate even on hard refresh (F5).
# 'public' permits CDN edge caching in addition to browser caching.
# max-age=31536000 = 1 year in seconds (practical maximum; RFC 7234 cap).
# ─────────────────────────────────────────────────────────────────────────────
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
  Vary: Accept-Encoding

# ─────────────────────────────────────────────────────────────────────────────
# RULE 2: Self-hosted fonts (activate when cluster_005 font migration is done)
# Same immutable treatment — font filenames must be content-hashed by the
# build pipeline before this rule is safe. Verify before enabling.
# ─────────────────────────────────────────────────────────────────────────────
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
  Vary: Accept-Encoding

# ─────────────────────────────────────────────────────────────────────────────
# RULE 3: HTML documents and everything else — preserve existing behavior.
# max-age=0, must-revalidate is correct for HTML: it forces revalidation
# so users always receive the current page structure after a deploy.
# This stanza is defensive — it makes the intent explicit and prevents
# Netlify's default policy from being silently overridden by future
# platform changes.
# ─────────────────────────────────────────────────────────────────────────────
/*
  Cache-Control: public, max-age=0, must-revalidate
# netlify.toml alternative — use this OR public/_headers, not both.
# If netlify.toml already exists in the project, add these blocks to it.
# If public/_headers already exists, do not add [[headers]] here.

[[headers]]
  # Astro content-hashed assets: safe for permanent caching.
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Vary = "Accept-Encoding"

[[headers]]
  # Self-hosted fonts: enable after cluster_005 font migration is verified.
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Vary = "Accept-Encoding"

[[headers]]
  # HTML and all other paths: preserve revalidation behavior.
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
#!/bin/sh
# post-deploy verification script
# Precondition: ASSET_URL must be a real hashed asset URL from the live deploy.
# Find one by inspecting the page source for a /_astro/*.css or /_astro/*.js URL.
# This is a site-specific value — replace before running.
ASSET_URL="https://example.com/_astro/Section.Dupvz703.css"

echo "=== First request (cold) ==="
curl --silent --head "$ASSET_URL" | grep -i -E "cache-control|age|x-nf-request-id|vary"

echo ""
echo "=== Second request (should be edge-cached) ==="
curl --silent --head "$ASSET_URL" | grep -i -E "cache-control|age|x-nf-request-id|vary"

# Expected output on second request:
#   cache-control: public, max-age=31536000, immutable
#   age: <non-zero integer>   ← confirms edge cache hit
#   vary: Accept-Encoding
# If 'age' is 0 or absent on the second request, the edge is not caching —
# check that the _headers file was copied into dist/ and that no conflicting
# netlify.toml [[headers]] block is overriding the rule.
```

## Risks
- RISK: Self-hosted fonts rule activated prematurely. The /fonts/* immutable rule is only safe if font filenames are content-hashed by the build pipeline. If fonts are served with static filenames (e.g., /fonts/inter.woff2) and the file is updated without a filename change, browsers will serve the stale cached version for up to one year. MITIGATION: Leave the /fonts/* stanza commented out until cluster_005 font migration is complete and content-hashing of font filenames is confirmed in the build output.
- RISK: Conflicting header sources. If netlify.toml already contains [[headers]] blocks and public/_headers is also added, Netlify merges both sources. The merge order is documented but non-obvious, and a less-specific rule in one file can override a more-specific rule in the other. MITIGATION: Audit the project for existing netlify.toml [[headers]] blocks before adding _headers. Use exactly one mechanism and remove or consolidate the other.
- RISK: Non-hashed assets accidentally placed under /_astro/. If a developer manually copies a static file into the /_astro/ directory (bypassing Astro's build pipeline), it will receive immutable caching without a content-hash guarantee. A content update to that file will be invisible to cached browsers for up to one year. MITIGATION: Enforce via CI lint or documentation that /_astro/ is a build-output-only directory. All manually managed static assets belong in public/ at a non-/_astro/ path.
- RISK: _headers file not copied to dist/. If the file is placed in the wrong directory (e.g., project root or src/), Astro will not copy it and Netlify will not apply the rules — the deploy will appear to succeed with no visible error. MITIGATION: The post-deploy verification script (third code example) will catch this: if 'age' is absent or 0 on the second request, the headers are not active.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
