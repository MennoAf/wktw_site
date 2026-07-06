# Cluster Deep Dive: Cache Configuration — Static Assets Revalidating on Every Request

**Cluster ID:** cluster_007  
**Architectural Pattern:** Server-Side Configuration  
**Findings:** 4  
**Systemic:** Yes  
**Effort to Resolve All 4:** Single configuration file addition

---

## 1. The Big Picture

Every time a visitor loads a page on the WKTW site, their browser is forced to ask the server "has anything changed?" for every single static resource — the stylesheet, and all three font files — even if that visitor has been to the site before and those files are already sitting in their browser cache. This is the browser equivalent of re-reading an instruction manual from cover to cover before every task, even though the manual hasn't been updated in months. The server almost always responds "nothing has changed" (a 304 Not Modified), but the round-trip still happens, still consumes time, and still adds latency before the page renders correctly for returning visitors.

The practical user experience consequence is most visible on repeat visits, which are precisely the visits most likely to convert. A returning visitor — someone who read a blog post last week and came back to explore the services — should experience near-instant page loads because their browser already has everything it needs. Instead, they experience the same revalidation overhead as a first-time visitor. The stylesheet alone carries a content hash in its filename (`Section.iKsGnDKO.css`), which is an explicit signal that the file's URL will change the moment its content changes. The browser has no way to know this, however, because the server is telling it to revalidate regardless. The three font files (`inter-latin.woff2`, `lora-latin.woff2`, `jetbrainsmono-latin.woff2`) are even more clear-cut: web fonts are immutable by nature and collectively represent 99KB of the 106KB revalidation overhead measured in the audit.

This cluster matters to the contact form conversion KPI through a straightforward mechanism: unnecessary latency on repeat visits increases the probability that a returning visitor — already in a higher-intent state — abandons before the page finishes rendering. It also matters to bounce rate, because perceived slowness on return visits is indistinguishable to the user from a site that is simply slow. The good news is that this is entirely a configuration problem, not an engineering problem. The site's underlying architecture — Astro SSG, content-hashed filenames, Netlify CDN — is already perfectly designed to support aggressive caching. The configuration just hasn't been written yet.

---

## 2. The Root Cause

All four findings in this cluster share a single origin: Netlify's default cache behavior. When no explicit cache headers are configured, Netlify serves every file — regardless of type, regardless of whether the filename contains a content hash — with `Cache-Control: public, max-age=0, must-revalidate`. This is a deliberately conservative default designed to prevent stale content from being served on sites that don't use cache-busting strategies. The WKTW site, however, already uses the correct cache-busting strategy: Vite (via Astro) appends a content hash to every built asset filename. The filename `Section.iKsGnDKO.css` will never serve different content — if the CSS changes, the filename changes. The default Netlify behavior is therefore not just unnecessary here; it is actively working against the cache-busting architecture that Astro has already put in place.

The absence of a `_headers` file or `[[headers]]` block in `netlify.toml` is the single configuration gap that produces all four findings. No CDN cache-status headers are present on any of the six measured resources, which means it is currently impossible to verify whether Netlify's edge cache is functioning at all — the site may be hitting the origin server on every request rather than being served from the CDN edge. Brotli compression, which Netlify enables automatically for assets served from its CDN, was not detected, which is consistent with CDN edge caching not being engaged. All of these symptoms point to the same missing configuration.

---

## 3. Each Finding

### Finding 1: Cache-Control Forces Revalidation on Every Request
**ID:** `server-4-cache-control-revalidate-every-request` | **Severity:** Medium

**What's broken:** Every static asset on the site is served with `Cache-Control: public, max-age=0, must-revalidate`. This header instructs the browser to treat its cached copy as immediately stale and to check with the server before using it — on every single page load, for every resource, for every visitor including those who have visited before.

**What the evidence shows:** The audit measured four affected resources: `Section.iKsGnDKO.css` (7KB, content-hashed filename), `inter-latin.woff2` (47KB), `lora-latin.woff2` (21KB), and `jetbrainsmono-latin.woff2` (31KB). The total revalidation overhead across these four files is 106KB per page load. The CSS file's filename already contains a content hash — `iKsGnDKO` — which is Vite's fingerprint confirming the file's content. This fingerprint means the URL is unique to this exact version of the CSS; it will never serve different content at this URL. Serving it with `max-age=0` discards that guarantee entirely.

**Why it matters for WKTW's KPIs:** Revalidation round-trips add latency before the browser can confirm it can use its cached resources. For returning visitors — the cohort most likely to submit a contact form — this means the site performs no better on the second visit than the first. Reducing this overhead directly improves perceived performance for repeat visitors, which is the segment where conversion rate gains are most accessible.

**The fix:** Add a `_headers` file to Astro's `public/` directory (which Netlify reads automatically at deploy time) with a rule for `/_astro/*` setting `Cache-Control: public, max-age=31536000, immutable`. A separate rule for `/fonts/*` applies the same header to font files. This tells the browser: "this file will never change at this URL — cache it for a year and never revalidate." When the CSS actually does change, Astro generates a new filename with a new hash, and the browser fetches it fresh automatically.

---

### Finding 2: No CDN Cache-Status Headers Detected
**ID:** `server-transport-cdn-cache-status-missing` | **Severity:** Medium

**What's broken:** None of the six measured resources returned any CDN cache-status headers — no `X-Cache`, no `CF-Cache-Status`, no `Age`, no Netlify-specific cache indicators. This means there is currently no way to verify whether requests are being served from Netlify's edge CDN or hitting the origin server directly.

**What the evidence shows:** The audit checked for `X-Cache`, `CF-Cache-Status`, `X-NF-Request-ID`, and `Age` headers across all six resources. All returned `none detected`. The `Server: Netlify` header confirms the platform, but the absence of cache-status headers means the CDN layer is either not caching these resources or not reporting its cache behavior. The total transfer measured was 105KB across these resources. With `max-age=0` on every resource, Netlify's CDN has no instruction to cache anything at the edge — it is likely proxying every request to the origin.

**Why it matters for WKTW's KPIs:** CDN edge caching is what makes a static site fast for geographically distributed visitors. Without it, every page load — regardless of visitor location — incurs origin server latency. The absence of cache-status headers also makes performance debugging impossible: there is no way to distinguish a CDN hit from an origin hit, which means any future performance investigation starts blind. For a fully static Astro site, this is the primary mechanism by which Netlify delivers performance; not using it leaves the site's biggest infrastructure advantage on the table.

**The fix:** The same `_headers` or `netlify.toml` configuration that fixes Finding 1 resolves this finding as well. When `max-age=31536000, immutable` is set on static assets, Netlify's CDN will cache them at the edge and begin returning cache-status headers, restoring observability. Adding `max-age=3600, stale-while-revalidate=86400` to HTML documents gives the CDN permission to cache pages at the edge while still serving fresh content within a one-hour window.

---

### Finding 3: Brotli Compression Not Detected
**ID:** `server-transport-no-brotli` | **Severity:** Low

**What's broken:** The audit detected gzip compression on text assets but did not detect Brotli (`br`) encoding. Netlify supports Brotli natively and enables it automatically for assets served from its CDN when the client advertises `Accept-Encoding: br` support. The absence of Brotli is consistent with the CDN edge not being engaged — gzip responses suggest origin-level compression rather than CDN-level compression.

**What the evidence shows:** Compression was confirmed as `gzip`. Brotli was not detected. Total text transfer measured at 25KB; the audit estimates Brotli would reduce this by 10–20KB. The finding notes that this may be a test-client artifact (the probe may not have advertised `br` support), so the recommended first step is verification via a correctly-formed `curl` probe with `--compressed` and `--http2` flags before treating this as a confirmed gap.

**Why it matters for WKTW's KPIs:** In absolute terms, 10–20KB of compression savings on a 25KB text payload is a modest gain. The more meaningful signal is diagnostic: if Brotli is genuinely absent, it confirms that Netlify's CDN edge is not serving these assets, which amplifies the impact of Findings 1 and 2. Brotli's presence or absence is a reliable indicator of whether CDN edge caching is functioning. Resolving the cache header configuration (Findings 1 and 2) should restore Brotli automatically as a byproduct.

**The fix:** Verify first with a `curl --compressed --http2` probe against the live site. If the probe returns `content-encoding: br`, the original finding was a test-environment artifact and no action is required. If it returns `gzip`, the cache header configuration fix should be applied first — Brotli is expected to activate automatically once assets are being served from Netlify's CDN edge. Brotli compression on Netlify is platform-managed and not user-configurable; the only lever available is ensuring CDN edge serving is active.

---

### Finding 4: Missing dns-prefetch/preconnect for plausible.io
**ID:** `server-7-dns-prefetch-preconnect-minimal-external` | **Severity:** Low

**What's broken:** The site loads one external script from `plausible.io` but does not include `<link rel='dns-prefetch'>` or `<link rel='preconnect'>` hints for that domain in the `<head>`. This means the DNS lookup and TLS handshake for `plausible.io` cannot begin until the browser parses the script tag.

**What the evidence shows:** One external domain (`plausible.io`) was detected. No `dns-prefetch` or `preconnect` hints are present. The script is loaded `async` and is not render-blocking. Script load time was measured at 66ms; script timing at 161ms. The audit's own threshold for flagging this issue is more than three external domains — this site has one, so the impact is genuinely minimal.

**Why it matters for WKTW's KPIs:** The async loading means this does not affect First Contentful Paint or Largest Contentful Paint. The 50–100ms DNS/TLS overhead affects only when Plausible begins recording — it does not affect the user experience in any perceptible way. This finding is included because the fix is a two-line addition to the layout component and is best implemented in the same deployment pass as the cache header changes, avoiding a standalone deployment cycle for a sub-minute change.

**The fix:** Add `<link rel='dns-prefetch' href='https://plausible.io'>` and `<link rel='preconnect' href='https://plausible.io'>` to the `<head>` block of the root Astro layout component (the same file that contains the Plausible script tag). Place both hints before the script tag. This is a byproduct fix — implement it in the same commit as the `_headers` file.

---

## 4. The Unified Fix Strategy

All four findings in this cluster are resolved by a single coordinated action: adding a `_headers` file to Astro's `public/` directory and a two-line addition to the root layout component. This is not four separate tickets — it is one configuration file and one template edit, deployable in a single commit.

**Recommended implementation order:**

**Step 1 — Create `public/_headers` (resolves Findings 1, 2, and 3)**  
This is the highest-leverage action in the cluster. Add three rules:

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
```

The `/_astro/*` rule covers all Vite-built assets (CSS, JS, processed images) — every file in this path has a content-hashed filename by Astro's build process. The `/fonts/*` rule covers the three woff2 files. The `/*` rule applies a one-hour cache with a 24-hour stale-while-revalidate window to HTML documents, giving the CDN edge permission to cache pages while ensuring content stays fresh. Place the specific path rules before the wildcard rule — Netlify applies the first matching rule.

**Step 2 — Verify Brotli (Finding 3 confirmation)**  
After deploying Step 1, run a `curl --compressed --http2` probe against a static asset URL. Confirm `content-encoding: br` in the response. If gzip is still returned, open a Netlify support ticket — Brotli is platform-managed and not user-configurable. This step requires no code change; it is a verification gate.

**Step 3 — Add resource hints to layout component (resolves Finding 4)**  
In the same commit as Step 1, add `dns-prefetch` and `preconnect` hints for `plausible.io` to the root layout `<head>`. This is a two-line addition. Bundling it with Step 1 avoids a standalone deployment for a low-severity change.

**What this does not require:** No changes to Astro configuration, no changes to the build pipeline, no new dependencies, no CDN provider changes. The `_headers` file is a plain-text file that Netlify reads natively. The entire fix is additive — nothing is removed or modified, only configured.

**Quick wins vs. larger efforts:** All four findings are quick wins. The `_headers` file can be written in under ten minutes. The layout component edit is under two minutes. The Brotli verification probe takes under five minutes. The total implementation time for this cluster is bounded by deployment time, not development time.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| `server-4-cache-control-revalidate-every-request` | Cache-Control forces revalidation on every request | Medium | Quick win | **Shared** — resolved by `_headers` file |
| `server-transport-cdn-cache-status-missing` | No CDN cache-status headers detected | Medium | Quick win | **Shared** — resolved by `_headers` file |
| `server-transport-no-brotli` | Brotli compression not detected | Low | Quick win | **Shared** — expected byproduct of `_headers` fix; verify only |
| `server-7-dns-prefetch-preconnect-minimal-external` | Missing dns-prefetch/preconnect for plausible.io | Low | Quick win | **Unique** — two-line layout component edit; bundle with `_headers` deploy |
