# Cluster Deep Dive: Caching Architecture Gaps — Static Assets Without Immutable Headers

**Cluster ID:** cluster_007 | **Pattern:** Server-Side | **Systemic:** Yes | **Findings:** 3

---

## 1. The Big Picture

Every time a returning visitor loads the We Know the Why website, their browser makes a network request to verify whether the site's CSS and JavaScript files have changed — even when those files are byte-for-byte identical to what the browser already downloaded on their last visit. This happens because Netlify's default caching policy applies the same revalidation rule to static assets that it correctly applies to HTML documents. For HTML, that behavior is intentional: you want users to always receive the latest page content. For compiled CSS and JavaScript files, it is unnecessary overhead that adds a round-trip to every page load for every returning visitor.

The practical user experience impact is subtle but real. A returning visitor's browser must pause, send a conditional request to the server, wait for a 304 Not Modified response, and only then proceed to render the page — rather than reading those assets directly from local cache with zero network latency. On a fast connection this delay is measured in tens of milliseconds; on a mobile connection or under network congestion, it compounds with other latency sources. Because this site's total transfer weight is 398KB and its architecture is otherwise exceptionally lean, caching is one of the few remaining levers that can meaningfully reduce load time for the repeat-visit cohort — the visitors most likely to convert.

A second, compounding problem makes this harder to diagnose and monitor: none of the 11 audited resources expose CDN cache-status headers. Netlify operates an edge CDN by default, but without headers like `CF-Cache-Status`, `X-Cache`, or `Age` in responses, there is no way to verify whether edge nodes are serving cached copies or forwarding requests to the origin. The caching gap and the observability gap reinforce each other — the team cannot confirm the problem is fixed without also enabling the instrumentation to see it.

---

## 2. The Root Cause

Both problems share a single cause: Netlify's out-of-the-box header configuration has not been overridden for this project. Netlify applies `Cache-Control: public, max-age=0, must-revalidate` as its default policy for all served files, which is a safe and conservative default for HTML but is actively suboptimal for content-hashed static assets. Astro's build pipeline already does its half of the work correctly — it generates filenames like `Section.Dupvz703.css` where the hash suffix changes whenever the file's content changes, making it permanently safe to cache any given URL forever. But Netlify never receives the instruction to take advantage of this guarantee, so the immutable caching benefit Astro's hashing strategy was designed to enable goes unclaimed.

The measured evidence makes this concrete: the audit confirmed a content-hashed asset at `/_astro/Section.Dupvz703.css` with `cache-control: public, max-age=0, must-revalidate` — the same revalidation policy as the HTML document. The fix requires no application code changes and no deployment pipeline modifications. It requires only a configuration declaration telling Netlify to apply a different header rule to `/_astro/*` paths. The platform supports this natively via `netlify.toml` or a `_headers` file; the configuration simply does not exist yet.

---

## 3. Each Finding

### Finding 1: No CDN Cache-Status Headers on Any Resource — Cache-Hit Verification Impossible
**ID:** `server-transport-no-cdn-cache-headers` | **Severity:** Medium | **Effort:** Quick Win

**What's broken:** All 11 resources captured during the audit return no CDN cache-status header of any kind — no `CF-Cache-Status`, no `X-Cache`, no `Age` field. Netlify's edge CDN is active and serving the site, but its caching behavior is entirely opaque. The team has no way to determine whether edge nodes are serving cached responses or proxying every request to the origin.

**Evidence:** The audit measured `resources_without_cdn_status: 11` across a total transfer weight of `398KB`. The HTML document carries `cache-control: public, max-age=0, must-revalidate`. The content-hashed CSS file `Section.Dupvz703.css` is present but its individual cache-control header could not be verified — the audit records it as `no-cdn-status`.

**Why it matters for your KPIs:** Without cache-status visibility, the engineering team cannot distinguish between a caching configuration that is working correctly and one that is silently bypassing the CDN on every request. If static assets are not being served from edge cache, every page load — including for returning visitors — incurs full origin latency. Slower repeat-visit load times directly suppress return visit conversion rates and increase bounce probability. Equally important, the absence of observability means any future caching fix cannot be verified as effective without adding this instrumentation first.

**The fix:** Add `CDN-Cache-Control` and `Netlify-CDN-Cache-Control` response headers via `netlify.toml` or a `_headers` file. This is a configuration-only change that exposes Netlify's edge caching behavior in response headers, making cache-hit ratios observable in browser DevTools and any HTTP monitoring tool.

---

### Finding 2: HTML Cache-Control Forces Revalidation — Hashed Assets Cannot Be Confirmed as Immutably Cached
**ID:** `st-6-cache-control-no-immutable-on-hashed-assets` | **Severity:** Medium | **Effort:** Quick Win

**What's broken:** The Astro build pipeline generates content-hashed asset filenames — `Section.Dupvz703.css` is a confirmed example — which signals that the file at that URL will never change. If the CSS changes, the hash changes and a new URL is generated. This makes it permanently safe to tell browsers: cache this file forever, no revalidation needed. However, the measured `cache-control` header on this asset is `public, max-age=0, must-revalidate` — identical to the HTML document policy — meaning browsers are instructed to revalidate on every request despite the content-hash guarantee making that revalidation structurally unnecessary.

**Evidence:** The audit confirmed `hashed_asset: https://weknowthewhy.com/_astro/Section.Dupvz703.css`, `hash_in_filename: True`, and `cache_control: public, max-age=0, must-revalidate`. The CDN status is recorded as `no-cdn-status (unverifiable)`, meaning the immutable caching that Astro's architecture was designed to enable cannot be confirmed as active.

**Why it matters for your KPIs:** Returning visitors — who represent the highest-intent segment of the audience and the cohort most likely to convert — are the ones penalized most by missing immutable caching. A first-time visitor has no cached assets and pays the full download cost regardless. A returning visitor should pay zero network cost for unchanged assets; instead, they pay a revalidation round-trip cost on every visit. This adds latency to the repeat-visit experience and works against conversion rate for that segment.

**The fix:** Add a `[[headers]]` rule in `netlify.toml` (or a stanza in `public/_headers`) targeting `/_astro/*` with `Cache-Control: public, max-age=31536000, immutable`. This single rule claims the caching benefit that Astro's hashing strategy already makes safe. The HTML document policy is left completely unchanged.

---

### Finding 3: Document-Level Cache-Control Prevents Browser Caching — Static Asset Headers Unverifiable
**ID:** `cache-control-no-caching-static-assets` | **Severity:** Low | **Effort:** Quick Win

**What's broken:** This finding captures the same underlying gap from a slightly different angle: the document-level `cache-control: public, max-age=0, must-revalidate` is correct for HTML, but the audit could not retrieve individual cache-control headers for static assets. With `cdn_status_reported: False` across 10 resources and only one confirmed hashed asset (`_astro/Section.Dupvz703.css`) visible in the data, the full scope of the caching gap — how many CSS, JS, and image files are affected — cannot be determined from the outside.

**Evidence:** `document_cache_control: public, max-age=0, must-revalidate`, `cdn_status_reported: False`, `resources_without_cdn_status: 10`, `astro_hashed_assets: ['_astro/Section.Dupvz703.css']`, `static_asset_cache_headers: not individually available`.

**Why it matters for your KPIs:** The inability to verify static asset cache headers means the team is operating without confirmation that any of the site's compiled assets — CSS, JavaScript, processed images — are being cached efficiently. This is both a performance risk (unnecessary revalidation on every return visit) and an operational risk (no baseline to measure against after remediation). Bounce rate is sensitive to perceived load speed on repeat visits; unverified caching gaps leave that sensitivity unaddressed.

**The fix:** The same `netlify.toml` configuration that resolves Finding 2 resolves this finding. Adding CDN cache-status header exposure (Finding 1's fix) then makes the result verifiable, closing the observability gap that makes this finding's scope uncertain.

---

## 4. The Unified Fix Strategy

All three findings resolve through a single coordinated configuration change. The recommended sequence is:

**Step 1 — Verify the asset output path (5 minutes).** Run `npx astro build` locally and confirm that compiled assets land under `dist/_astro/`. If `astro.config.mjs` defines a custom `build.assets` value, substitute that path in every rule below. Do not proceed with a glob pattern that doesn't match the actual output structure.

**Step 2 — Choose one configuration surface and commit to it (do not mix both).** If a `_headers` file already exists in the project's `public/` directory, extend it. If `netlify.toml` already contains `[[headers]]` blocks, add rules there. Mixing both causes `netlify.toml` to take precedence in unpredictable ways. The `_headers` file must live in `public/` — not in `dist/` — because Astro wipes `dist/` on every build.

**Step 3 — Add three header rules.** The configuration requires three stanzas:

```toml
# netlify.toml

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Add this block after completing cluster_005 font self-hosting:
[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    CDN-Cache-Control = "public, max-age=0, must-revalidate"
```

The `/_astro/*` rule claims the immutable caching benefit Astro's content-hashing already makes safe. The `/fonts/*` rule is a forward-looking placeholder that activates once font self-hosting is completed per cluster_005 — adding it now costs nothing and avoids a second configuration pass later. The `/*` catch-all preserves the existing HTML document policy exactly as-is while adding CDN cache-status header exposure for observability.

**Step 4 — Verify after deploy.** After deploying, run `curl -I https://weknowthewhy.com/_astro/Section.Dupvz703.css` and confirm the response includes `Cache-Control: public, max-age=31536000, immutable`. Check the HTML document separately to confirm it still returns `max-age=0, must-revalidate`. The presence of `CDN-Cache-Control` in responses confirms the observability fix is active.

**Priority rationale:** This cluster ranks fourth in the overall remediation sequence (behind consent-gated script loading, accessibility baseline, and font self-hosting + security headers) because it carries no legal liability and its performance impact is limited to the repeat-visit cohort. However, within its own scope it is the lowest-risk, highest-certainty fix in the entire audit — a five-line configuration change with no application code risk, no deployment pipeline changes, and no possibility of regression on the HTML document policy. It should be batched with the `netlify.toml` changes from cluster_005 and cluster_006 to avoid multiple sequential deploys for configuration-only work.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| `server-transport-no-cdn-cache-headers` | No CDN cache-status headers — cache-hit verification impossible | Medium | Quick Win | **Shared** — CDN header exposure rule in `netlify.toml` `/*` stanza; resolved alongside the two findings below in one deploy |
| `st-6-cache-control-no-immutable-on-hashed-assets` | Hashed assets cannot be confirmed as immutably cached | Medium | Quick Win | **Shared** — `/_astro/*` immutable cache rule; same `netlify.toml` change resolves Finding 3 simultaneously |
| `cache-control-no-caching-static-assets` | Document cache-control prevents verification of static asset headers | Low | Quick Win | **Shared** — fully resolved by the same `/_astro/*` rule and CDN header exposure added for Findings 1 and 2 |
