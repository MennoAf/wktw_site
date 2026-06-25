---
finding_id: "resource-loading-font-subsetting-opportunity"
title: "Three font files totaling 98KB — variable font consolidation and subsetting could reduce to ~30KB"
severity: "medium"
root_cause_cluster: "Google Fonts External Dependency — Privacy, Performance, and Render-Blocking"
why_this_matters: "Removing the Google Fonts stylesheet eliminates a render-blocking cross-origin request that requires a full DNS lookup + TCP + TLS handshake to fonts.googleapis.com before the browser can parse the C…"
fix_summary: "Eliminate Google Fonts dependency entirely."
confidence_tier: "confirmed"
---

# Three font files totaling 98KB — variable font consolidation and subsetting could reduce to ~30KB

**Finding:** Three font files totaling 98KB — variable font consolidation and subsetting could reduce to ~30KB  
**Severity:** Medium  
**Why this matters:** Removing the Google Fonts stylesheet eliminates a render-blocking cross-origin request that requires a full DNS lookup + TCP + TLS handshake to fonts.googleapis.com before the browser can parse the C…  
**Root cause:** Google Fonts External Dependency — Privacy, Performance, and Render-Blocking  
**Fix:** Eliminate Google Fonts dependency entirely.

> **Evidence Basis:** Confirmed

---

## Impact

- **Fcp / Render Unblocking:** Removing the Google Fonts stylesheet eliminates a render-blocking cross-origin request that requires a full DNS lookup + TCP + TLS handshake to fonts.googleapis.com before the browser can parse the CSS and initiate the actual font file downloads from fonts.gstatic.com. This serial two-hop dependency adds latency proportional to the round-trip time to Google's servers on every cold load. Self-hosting collapses this to a single same-origin request that benefits from HTTP/2 multiplexing alongside other page assets, with no cross-origin handshake overhead.
- **Font Payload Reduction:** Subsetting Inter to Latin and consolidating three static weight files into one variable font file reduces font transfer size from 98KB to approximately 25–32KB — a reduction of roughly 65–70% in font bytes. On a page where fonts currently represent nearly 2x the rest of the page payload combined (98KB fonts vs 51KB page), this rebalances the resource budget and reduces total page weight materially.
- **Lcp:** Preloading the Inter variable WOFF2 with fetchpriority implicitly elevated via rel=preload ensures the font is available before the browser paints above-fold text. Combined with font-display: swap, this eliminates invisible text periods (FOIT) while keeping layout stable. The reduction in font payload also means the preload completes faster on constrained connections.
- **Cache Efficiency:** Content-hash filenames with Cache-Control: immutable mean returning visitors load zero font bytes on repeat visits. Under Google Fonts, cache behavior is controlled by Google's TTL policy and URL rotation schedule — both outside the site's control. Self-hosting makes font cache hits deterministic.
- **Gdpr / Legal Liability:** Every page load currently transmits visitor IP addresses to Google's servers (fonts.googleapis.com, fonts.gstatic.com) without a consent mechanism. LG München I (January 2022, Az. 3 O 17493/20) ruled this a GDPR Article 6 violation for a German site using Google Fonts without consent. Eliminating the external font requests removes this data transfer entirely, resolving the structural liability rather than attempting to patch it with consent banners.
- **Resilience:** Removes dependency on Google CDN availability, corporate firewall rules blocking Google domains, and ad-blocker rules targeting Google endpoints. Font rendering becomes fully self-contained.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_005`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Three font files totaling 98KB are loaded.. Inter is available as a variable font, which could replace the 3 separate weight files (400, 500, 600) with a single variable font file, reducing HTTP requests from 3 to 1-2 (Inter variable + Lora).

- Font transfer size: **98 KB**
  - DevTools **Network** tab → filter `Font` → check total transfer size. Compare with expected subsetting savings. Also check `font-display` in **Elements** → **Computed** styles.

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
Eliminate Google Fonts dependency entirely. Self-host Inter as a single variable font WOFF2 (weight axis 100–900) and Lora as a subsetted static WOFF2, both scoped to Latin glyphs only. Remove the render-blocking Google Fonts stylesheet and the two preconnect hints. Serve fonts from the site's own origin with immutable cache headers and content-hash filenames. This resolves the GDPR structural liability, eliminates the two-stage serial request chain, and reduces total font payload from 98KB to approximately 25–32KB.

### How
1. AUDIT CURRENT FONT USAGE: Run `document.fonts.forEach(f => console.log(f.family, f.weight, f.style, f.status))` in DevTools console on a representative page to confirm exactly which weights and styles are actively loaded and rendered. Cross-reference with CSS: grep your stylesheet for `font-weight` values under `font-family: 'Inter'` and `font-family: 'Lora'`. Record the confirmed set — do not subset below what is actually used.
2. DOWNLOAD SOURCE FONT FILES: Inter variable font: download `InterVariable.woff2` from https://github.com/rsms/inter/releases (latest stable release). This single file covers weight axis 100–900. Lora: download the static WOFF2 files for only the confirmed weights/styles from https://fonts.google.com/specimen/Lora using the 'Download family' option, or from the Google Fonts GitHub repo at https://github.com/google/fonts/tree/main/ofl/lora. If Lora usage is limited to one or two weights, static files are preferable over Lora's variable font due to smaller per-weight binary size at narrow axis ranges.
3. SUBSET TO LATIN ONLY: Install fonttools: `pip install fonttools brotli`. Run pyftsubset for each file. For Inter variable: `pyftsubset InterVariable.ttf --output-file=InterVariable-latin.woff2 --flavor=woff2 --layout-features='kern,liga,calt,ss01,ss02,ss03,ss04,ss05,ss06,ss07,ss08' --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'`. For each Lora weight: `pyftsubset Lora-Regular.ttf --output-file=Lora-Regular-latin.woff2 --flavor=woff2 --layout-features='kern,liga' --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'`. Verify output file sizes. Inter variable latin target: 18–22KB. Lora per-weight latin target: 4–7KB.
4. PLACE FILES IN STATIC ASSET DIRECTORY WITH CONTENT-HASH FILENAMES: Name files with a content hash suffix (e.g., `inter-variable-latin-[hash8].woff2`) so cache-busting is automatic on font updates. Place under `/static/fonts/` or equivalent CDN-served static path. Confirm the path is served with `Cache-Control: public, max-age=31536000, immutable`.
5. WRITE THE @font-face CSS: Create a dedicated `fonts.css` file (do not inline in a component stylesheet — this must load before any text renders). Define @font-face blocks as shown in code_examples. Use `font-display: swap` to prevent FOIT. Declare `unicode-range` matching the subset used in step 3 so the browser skips the font for any out-of-range characters.
6. REMOVE GOOGLE FONTS REFERENCES FROM BASE LAYOUT TEMPLATE: Delete the `<link rel='preconnect' href='https://fonts.googleapis.com'>`, `<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>`, and `<link href='https://fonts.googleapis.com/css2?...' rel='stylesheet'>` tags from the `<head>`. Confirm no CMS plugin, theme settings panel, or page builder is re-injecting these — check rendered HTML after removal, not just template source.
7. ADD PRELOAD HINTS FOR CRITICAL FONT FILES IN BASE LAYOUT <head>: Add one `<link rel='preload'>` per font file that is needed above the fold. For Inter variable this is one tag. For Lora, only preload the weight used in the hero/headline if Lora appears above fold. Do not preload every font file — preload is a high-priority fetch hint and over-use competes with LCP image fetches.
8. LOAD fonts.css WITHOUT RENDER-BLOCKING: Reference fonts.css via `<link rel='stylesheet' href='/static/fonts/fonts.css'>` in `<head>`. Because the file is same-origin and small (<2KB), it will not introduce meaningful blocking. Do not use `media='print' onload` async trick for font CSS — font face declarations must be parsed before text renders to prevent FOUT escalating to layout shift.
9. CONFIGURE SERVER CACHE HEADERS: Verify the static file server or CDN returns `Cache-Control: public, max-age=31536000, immutable` for all `.woff2` files. Verify `Content-Type: font/woff2`. Verify `Access-Control-Allow-Origin: *` if fonts are served from a CDN subdomain different from the page origin (required for CORS font loading in Firefox/Safari).
10. VALIDATE AND REGRESSION-TEST: (a) Run Lighthouse on a representative page — confirm FCP improves and no font-related LCP regression. (b) Open Network tab, filter by Font — confirm zero requests to fonts.googleapis.com or fonts.gstatic.com. (c) Check rendered text in Chrome, Firefox, Safari, and on iOS Safari — confirm Inter and Lora render correctly at all used weights. (d) Test with a screen reader (NVDA + Firefox, VoiceOver + Safari) — font changes are transparent to AT but confirm no heading hierarchy was disrupted during template edits. (e) Run `document.fonts.ready.then(() => document.fonts.forEach(f => console.log(f.family, f.weight, f.status)))` — all fonts should report `loaded`.

### Code examples
```
/* ============================================================
   fonts.css — self-hosted, latin-subset, immutable-cached
   SITE-SPECIFIC ASSUMPTION: paths below assume fonts are served
   from /static/fonts/. Adjust to match your CDN or static root.
   Content-hash suffixes must be updated when font files change.
   ============================================================ */

/* Inter: single variable font covers weight 100–900 */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  /* SITE-SPECIFIC ASSUMPTION: weight range matches Inter variable axis.
     Narrow to e.g. 400 600 if only those weights are used and
     you switch to static files instead. */
  font-weight: 100 900;
  font-display: swap;
  src: url('/static/fonts/inter-variable-latin-a1b2c3d4.woff2') format('woff2');
  /* Unicode range: Latin + Latin Extended + common punctuation/symbols.
     Matches the --unicodes argument used in pyftsubset step 3. */
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Lora Regular — adjust weights to match confirmed usage from step 1 */
@font-face {
  font-family: 'Lora';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/static/fonts/lora-regular-latin-e5f6a7b8.woff2') format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Lora Bold — add only if font-weight: 700 is confirmed used */
@font-face {
  font-family: 'Lora';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/static/fonts/lora-bold-latin-c9d0e1f2.woff2') format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}
<!-- Base layout <head> — replace existing Google Fonts block with this.
     SITE-SPECIFIC ASSUMPTION: /static/fonts/ path and content-hash
     suffixes must match actual deployed filenames from step 4.
     Preload only the Inter variable font unconditionally (used on
     every page above fold). Preload Lora only if Lora appears above
     fold on this page type — conditionally inject via server template
     logic if Lora is page-type-specific. -->

<!-- REMOVED: do not include any of these -->
<!-- <link rel="preconnect" href="https://fonts.googleapis.com"> -->
<!-- <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> -->
<!-- <link href="https://fonts.googleapis.com/css2?..." rel="stylesheet"> -->

<!-- Self-hosted font CSS: same-origin, small file, loads without
     cross-origin handshake. Place before any stylesheet that
     references font-family: 'Inter' or font-family: 'Lora'. -->
<link rel="stylesheet" href="/static/fonts/fonts.css">

<!-- Preload Inter variable font. crossorigin attribute is required
     even for same-origin font files — omitting it causes a double
     fetch in all browsers (preload fetch and render fetch use
     different cache keys without crossorigin). -->
<link
  rel="preload"
  href="/static/fonts/inter-variable-latin-a1b2c3d4.woff2"
  as="font"
  type="font/woff2"
  crossorigin
>
# pyftsubset commands — run from directory containing source font files.
# Requires: pip install fonttools brotli
# SITE-SPECIFIC ASSUMPTION: source filenames match Inter and Lora
# downloads from their respective repos (see step 2).
# Adjust --layout-features to match OpenType features your CSS uses.
# Remove ss01–ss08 if Inter stylistic sets are not explicitly enabled
# in your CSS via font-feature-settings.

# Inter variable font (TTF source required; WOFF2 source cannot be
# re-subsetted — download TTF from github.com/rsms/inter/releases)
pyftsubset InterVariable.ttf \
  --output-file=inter-variable-latin-a1b2c3d4.woff2 \
  --flavor=woff2 \
  --layout-features='kern,liga,calt,ss01,ss02,ss03,ss04,ss05,ss06,ss07,ss08' \
  --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

# Lora Regular
pyftsubset Lora-Regular.ttf \
  --output-file=lora-regular-latin-e5f6a7b8.woff2 \
  --flavor=woff2 \
  --layout-features='kern,liga' \
  --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

# Lora Bold (only if confirmed used — see step 1)
pyftsubset Lora-Bold.ttf \
  --output-file=lora-bold-latin-c9d0e1f2.woff2 \
  --flavor=woff2 \
  --layout-features='kern,liga' \
  --unicodes='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

# Verify output sizes before deploying:
# Inter variable latin target: 18–22KB
# Lora per-weight latin target: 4–7KB
# If Inter variable exceeds 25KB, re-check that source TTF is the
# variable font (not a static weight) and that brotli is installed.
# Nginx example — immutable cache headers for self-hosted fonts.
# SITE-SPECIFIC ASSUMPTION: static files served from /static/.
# Adjust location block to match your actual static file path.
# If using a CDN (Cloudflare, Fastly, CloudFront), set equivalent
# Cache-Control and Access-Control-Allow-Origin rules at the CDN layer.

location ~* ^/static/fonts/.*\.woff2$ {
    # immutable: tells browser the file at this URL never changes.
    # Safe only because filenames include content hashes (step 4).
    add_header Cache-Control "public, max-age=31536000, immutable";

    # Required for CORS font loading in Firefox and Safari when
    # fonts are served from a subdomain or CDN origin different
    # from the page origin. Safe to include even for same-origin.
    add_header Access-Control-Allow-Origin "*";

    add_header Content-Type "font/woff2";
}
```

## Risks
- FONT RENDERING REGRESSION IF SUBSET IS TOO AGGRESSIVE: If the unicode-range in pyftsubset omits a character that appears in page content (e.g., curly quotes U+2018/U+2019, em dash U+2014, or currency symbols beyond U+20AC), the browser will fall back to the system font for those glyphs mid-word, producing visible rendering artifacts. Mitigation: run the page through a character inventory tool (e.g., `glyphhanger --spider --format=unicode URL`) before finalizing the unicode-range argument, and add any missing code points to the subset before deploying.
- VARIABLE FONT AXIS NOT SUPPORTED ON ANDROID 4.x / IE 11: Variable fonts require CSS font-variation-settings support. Browser support is >97% globally as of 2024, but if the site has a documented legacy Android or IE11 user base, the variable font will silently fall back to the system font on those browsers. Mitigation: audit analytics for legacy browser share before removing static weight fallbacks. If legacy share is non-trivial, add static WOFF2 fallbacks in the @font-face src stack: `src: url('inter-400-latin.woff2') format('woff2'), url('inter-variable-latin.woff2') format('woff2 supports variations')`.
- CMS OR THEME RE-INJECTING GOOGLE FONTS AFTER TEMPLATE EDIT: Many CMS themes (WordPress, Shopify, Webflow) have a font picker in the admin UI that independently injects Google Fonts link tags, separate from the template HTML. Removing the tag from the template file may not be sufficient if the CMS regenerates it on the next theme save or update. Mitigation: after deploying, load the page and inspect the rendered `<head>` (not the template source) to confirm zero Google Fonts requests. Add a monitoring check (e.g., a Playwright test asserting `page.url()` does not include `fonts.googleapis.com` in network requests) to catch re-injection on future deploys.
- CORS MISCONFIGURATION CAUSING FONT 403 OR SILENT FALLBACK IN FIREFOX/SAFARI: Firefox and Safari enforce CORS for font files. If fonts are served from a CDN subdomain (e.g., cdn.example.com) while the page is on www.example.com, missing Access-Control-Allow-Origin will cause the font to silently fail and fall back to the system font — with no visible error in the UI, only a console warning. Mitigation: verify the CORS header is present on the actual font response (not just configured in Nginx) using `curl -I -H 'Origin: https://www.example.com' https://cdn.example.com/static/fonts/inter-variable-latin-a1b2c3d4.woff2` and confirm `Access-Control-Allow-Origin: *` appears in the response.
- FONT LICENSE COMPLIANCE: Inter is licensed under the SIL Open Font License 1.1, which permits self-hosting and subsetting. Lora is also SIL OFL 1.1. Both licenses require the license text to be distributed with the font files if redistributed. Mitigation: include the OFL license files in the `/static/fonts/` directory alongside the WOFF2 files. This is a compliance requirement, not optional.
- PRELOAD COMPETING WITH LCP IMAGE FETCH: Adding `rel=preload` for font files increases the number of high-priority fetches competing with the LCP image. If the LCP element is an image (common for hero sections), the font preload may delay it. Mitigation: verify LCP score in Lighthouse after adding the preload. If LCP regresses, remove the Lora preload (keep only Inter) or add `fetchpriority='low'` to the font preload to reduce its competition with the LCP image fetch.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
