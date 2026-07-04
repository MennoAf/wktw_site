---
finding_id: "gdpr-google-fonts-ip-transfer-third-country"
title: "Self-host all Google Fonts WOFF2 files on the site's own origin (or first-party CDN), remove every reference to fonts.googleapis.com and fonts.gstatic.com from the document <head>, global stylesheets, and any CMS plugin/theme settings panel. This eliminates the third-party network connection that transmits visitor IP addresses to Google LLC servers in the United States before consent is obtained, resolving the GDPR Article 44 violation established by LG München Case 3 O 17493/20. As a secondary benefit, it removes one full DNS lookup, TCP handshake, and TLS negotiation from the critical rendering path, reducing font-related connection overhead."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "Eliminates the GDPR Article 44 violation established by LG München Case 3 O 17493/20."
fix_summary: "Self-host all Google Fonts WOFF2 files on the site's own origin (or first-party CDN), remove every reference to fonts.googleapis.com and fonts.gstatic.com from the document <head>, global stylesheets…"
confidence_tier: "reviewer_identified"
---

# Self-host all Google Fonts WOFF2 files on the site's own origin (or first-party CDN), remove every reference to fonts.googleapis.com and fonts.gstatic.com from the document <head>, global stylesheets, and any CMS plugin/theme settings panel. This eliminates the third-party network connection that transmits visitor IP addresses to Google LLC servers in the United States before consent is obtained, resolving the GDPR Article 44 violation established by LG München Case 3 O 17493/20. As a secondary benefit, it removes one full DNS lookup, TCP handshake, and TLS negotiation from the critical rendering path, reducing font-related connection overhead.

**Finding:** Self-host all Google Fonts WOFF2 files on the site's own origin (or first-party CDN), remove every reference to fonts.googleapis.com and fonts.gstatic.com from the document <head>, global stylesheets, and any CMS plugin/theme settings panel. This eliminates the third-party network connection that transmits visitor IP addresses to Google LLC servers in the United States before consent is obtained, resolving the GDPR Article 44 violation established by LG München Case 3 O 17493/20. As a secondary benefit, it removes one full DNS lookup, TCP handshake, and TLS negotiation from the critical rendering path, reducing font-related connection overhead.  
**Severity:** Medium  
**Why this matters:** Eliminates the GDPR Article 44 violation established by LG München Case 3 O 17493/20.  
**Root cause:** Isolated issue  
**Fix:** Self-host all Google Fonts WOFF2 files on the site's own origin (or first-party CDN), remove every reference to fonts.googleapis.com and fonts.gstatic.com from the document <head>, global stylesheets…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Gdpr Legal Exposure:** Eliminates the GDPR Article 44 violation established by LG München Case 3 O 17493/20. The IP address transmission to Google LLC servers in the United States occurs at the TCP/TLS handshake layer — before JavaScript executes, before the consent banner renders, and before any user interaction. No consent management platform (CMP), consent mode configuration, or GTM trigger can intercept a browser-level DNS/TCP connection initiated by a <link> tag in the document <head>. Self-hosting removes the third-party connection entirely, eliminating the data transfer that constitutes the violation. This is the only technically compliant remediation — there is no partial fix. GDPR enforcement carries significant financial penalties under Article 83; the legal liability is active on every page load until remediated.
- **Performance Ttfb And Fcp:** Removes one complete DNS resolution, TCP connection establishment, and TLS handshake from the critical rendering path. For visitors without a cached DNS entry for fonts.googleapis.com, this connection overhead typically adds 100–300ms of latency before the font stylesheet can be fetched. Eliminating this connection reduces the number of sequential network round-trips required before font files begin downloading, which directly improves First Contentful Paint (FCP) and Largest Contentful Paint (LCP) when text is the LCP element. The magnitude of improvement depends on the visitor's network conditions and geographic distance from Google's servers — users in regions with higher latency to US-based servers see proportionally larger gains.
- **Performance Connection Overhead:** Removes fonts.googleapis.com and fonts.gstatic.com from the connection waterfall entirely. Previously, the browser required: (1) DNS lookup for fonts.googleapis.com, (2) TCP + TLS to fonts.googleapis.com, (3) HTTP request for the CSS stylesheet, (4) DNS lookup for fonts.gstatic.com (a separate origin referenced inside the stylesheet), (5) TCP + TLS to fonts.gstatic.com, (6) HTTP requests for each WOFF2 file. Self-hosting collapses steps 1–5 into zero additional connections — font files are fetched from the same origin as the HTML document, reusing the already-established connection. This is a structural reduction in connection overhead, not a marginal optimization.
- **Performance Caching:** Self-hosted fonts with Cache-Control: public, max-age=31536000, immutable are cached in the browser for one year. On repeat visits, font files are served from the browser cache with zero network requests. Google Fonts' CDN also caches aggressively, but the cache is keyed to the Google origin — it does not benefit from the site's own CDN or edge caching configuration. Self-hosting allows the font files to be distributed via the site's existing CDN, reducing geographic latency for visitors served by edge nodes closer to them than Google's font servers.
- **Privacy Policy Accuracy:** Removes a data processor disclosure that will no longer be accurate post-remediation. Leaving Google LLC listed as a font delivery processor after self-hosting is a secondary compliance issue — Privacy Policies must accurately reflect current processing activities under GDPR Article 13/14.
- **Seo Core Web Vitals:** Faster FCP and LCP from eliminated connection overhead contributes positively to Core Web Vitals scores. Google's Core Web Vitals are a confirmed ranking signal in Google Search. Improvements to LCP move pages toward the 'Good' threshold (<2.5s), which is the boundary Google uses to classify pages as meeting Core Web Vitals standards. The magnitude of ranking impact depends on the competitive landscape for the site's target queries and the baseline LCP score.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com

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
Self-host all Google Fonts WOFF2 files on the site's own origin (or first-party CDN), remove every reference to fonts.googleapis.com and fonts.gstatic.com from the document <head>, global stylesheets, and any CMS plugin/theme settings panel. This eliminates the third-party network connection that transmits visitor IP addresses to Google LLC servers in the United States before consent is obtained, resolving the GDPR Article 44 violation established by LG München Case 3 O 17493/20. As a secondary benefit, it removes one full DNS lookup, TCP handshake, and TLS negotiation from the critical rendering path, reducing font-related connection overhead.

### How
PHASE 1 — AUDIT & INVENTORY (Day 1)

1. Identify every Google Fonts reference in the codebase. Search for all of the following patterns:
   - <link> tags with href containing 'fonts.googleapis.com' in every theme/template <head> file
   - @import url('https://fonts.googleapis.com/...') in any .css, .scss, .less, or inline <style> block
   - CMS plugin/module settings that inject font <link> tags (e.g., WordPress Customizer > Fonts, Elementor Font Manager, Divi Theme Options, WooCommerce Storefront settings)
   - GTM tags or custom HTML tags that inject <link> or <style> nodes referencing Google Fonts
   - Any JavaScript that dynamically creates <link rel='stylesheet'> pointing to fonts.googleapis.com

2. Record every font family, weight, and style variant currently loaded. Example inventory:
   - Inter: 400 (regular), 400italic, 600 (semibold), 700 (bold)
   - Playfair Display: 700 (bold)
   This inventory drives the download step — missing a weight causes fallback font flash in production.

3. Verify the exact unicode-range subsets in use. If the site is Latin-only, the 'latin' subset is sufficient. Do not download full Unicode ranges for Latin-only content — this is a separate performance issue but intersects here.

PHASE 2 — DOWNLOAD & OPTIMIZE FONT FILES (Day 1–2)

4. Use the 'google-webfonts-helper' tool (https://gwfh.mranftl.com/fonts) to download WOFF2 files for every family/weight/style combination identified in Step 2. This tool generates both the files and the @font-face CSS declarations. Select 'Best Support' (WOFF2 + WOFF) or 'Modern Browsers' (WOFF2 only, if IE11/legacy Safari support is not required — verify against site analytics before choosing).

   Alternatively, use the 'fontsource' npm package ecosystem for framework-integrated projects:
   npm install @fontsource/inter @fontsource/playfair-display
   (Fontsource packages are pre-subsetted, versioned, and tree-shakeable.)

5. Verify file sizes. A properly subsetted Latin WOFF2 file for a single weight should be 15–40KB. Flag any file >80KB as likely containing unnecessary Unicode ranges — re-download with explicit subset parameter.

6. Place font files in a stable, cache-friendly directory. Recommended path: /assets/fonts/{family-name}/{filename}.woff2. Do NOT place in a directory that gets cache-busted on every deploy unless the filename itself is content-hashed.

PHASE 3 — WRITE SELF-HOSTED @font-face DECLARATIONS (Day 2)

7. Create a dedicated font stylesheet (e.g., /assets/css/fonts.css or equivalent in the CMS theme). Write @font-face declarations for every variant. See code_examples for the complete template.

8. Set font-display: swap on all @font-face declarations. This ensures text remains visible during font load (FOUT is acceptable; FOIT — invisible text — is not). If brand guidelines prohibit any flash of unstyled text, use font-display: optional, which suppresses the swap entirely on slow connections — evaluate the trade-off with the design team before choosing.

9. Set cache headers for font files: Cache-Control: public, max-age=31536000, immutable. Fonts are static binary assets that never change for a given filename. If filenames are content-hashed (recommended), immutable is safe. If filenames are not hashed, use max-age=2592000 (30 days) without immutable.

PHASE 4 — ADD PRELOAD FOR ABOVE-FOLD FONTS (Day 2)

10. Identify which font files are required to render above-the-fold content (typically the primary body font at regular weight, and the primary heading font). Add <link rel='preload'> tags for these files only — preloading every variant wastes bandwidth. See code_examples for correct syntax including the mandatory crossorigin attribute.

PHASE 5 — REMOVE ALL REMOTE REFERENCES (Day 2–3)

11. Remove every fonts.googleapis.com and fonts.gstatic.com reference identified in Phase 1:
    - Delete <link rel='stylesheet'> tags from <head> templates
    - Delete @import rules from CSS files
    - Disable or reconfigure CMS plugin font settings to 'None' or 'Custom/Self-hosted'
    - Remove any GTM tags injecting Google Fonts
    - Remove dns-prefetch and preconnect hints for fonts.googleapis.com and fonts.gstatic.com (these are now unnecessary and should not remain as ghost hints)

12. Update Content Security Policy (CSP) to remove fonts.googleapis.com and fonts.gstatic.com from font-src and style-src directives. If the CSP previously contained:
    style-src 'self' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    These entries must be removed. Leaving them in CSP is not a violation, but it is misleading and may mask future accidental re-introduction of the remote reference.

PHASE 6 — VERIFY ELIMINATION OF THIRD-PARTY CONNECTION (Day 3)

13. Open Chrome DevTools > Network tab > filter by 'fonts.goo' — confirm zero requests to fonts.googleapis.com or fonts.gstatic.com on any page load, including hard refresh (Ctrl+Shift+R) and incognito mode.

14. Run WebPageTest from a European test location (e.g., Frankfurt) with 'First View' and 'Repeat View'. Confirm no connection waterfall entries for fonts.googleapis.com or fonts.gstatic.com.

15. Verify font rendering visually across: Chrome (latest), Firefox (latest), Safari (latest), Safari iOS 15+, Chrome Android. Check all font weights and styles used in the design system.

16. Run Lighthouse and confirm font-related opportunities (eliminate render-blocking resources, preload key requests) reflect the self-hosted configuration.

PHASE 7 — CMS-SPECIFIC CLEANUP (Day 3–4)

17. WordPress: Check Appearance > Customize > Fonts, any active theme's functions.php for wp_enqueue_style() calls referencing fonts.googleapis.com, and all active plugins (especially page builders, SEO plugins, and WooCommerce extensions) for their own font injection. Use the 'Disable Google Fonts' plugin as a safety net to intercept any plugin-level injection that is missed — but do not rely on it as the primary fix, as it operates at the PHP/WordPress hook layer and may not catch all injection vectors.

18. Shopify: Edit theme.liquid (or layout/theme.liquid) to remove the Google Fonts <link> tag. Check Settings > Fonts in the Shopify admin — Shopify's native font picker injects Google Fonts automatically when a Google Font is selected. Switch to a system font stack or upload custom font files via the theme assets. Note: Shopify's font picker does not support self-hosted WOFF2 upload through the admin UI — this requires direct theme file editing.

19. Webflow: Webflow injects Google Fonts automatically when a Google Font is selected in the Designer. There is no native self-hosting option in Webflow's standard plan. Options: (a) switch all text styles to system fonts or Webflow's built-in fonts, (b) use a custom code embed in <head> to load self-hosted fonts via @font-face and override Webflow's injection — note Webflow will still inject its own <link> tag unless the font is deselected in the Designer, so the font must be changed to a non-Google font in the Designer AND the self-hosted @font-face added via custom code. This is a known Webflow limitation.

PHASE 8 — LEGAL DOCUMENTATION (Day 4)

20. Update the site's Privacy Policy to remove any reference to Google Fonts as a data processor (if previously disclosed). If the Privacy Policy previously listed Google LLC as a data processor for font delivery, this disclosure is no longer accurate and should be removed or updated to reflect self-hosting.

21. Document the remediation date and technical change in the site's GDPR processing records (Article 30 Record of Processing Activities). The record should note: 'Google Fonts migrated to self-hosted delivery on [DATE]. No personal data (IP address) is transmitted to Google LLC for font delivery as of this date.'

22. If a Data Protection Impact Assessment (DPIA) was previously conducted that included Google Fonts as a processing activity, update or re-run the DPIA to reflect the elimination of this transfer.

### Code examples
```
/* ============================================================
   STEP 1: @font-face declarations — /assets/css/fonts.css
   
   SITE-SPECIFIC ASSUMPTION: Font families below (Inter, Playfair Display)
   are placeholders matching the audit inventory. Replace with the actual
   families, weights, and styles identified in Phase 1.
   
   SITE-SPECIFIC ASSUMPTION: File paths assume /assets/fonts/ directory.
   Adjust to match the actual deployment path for this CMS/framework.
   ============================================================ */

/* Inter — Regular (400) */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap; /* FOUT acceptable — text visible during load */
  src:
    url('/assets/fonts/inter/inter-v13-latin-regular.woff2') format('woff2'),
    url('/assets/fonts/inter/inter-v13-latin-regular.woff') format('woff'); /* IE11/legacy Safari fallback */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
    U+2193, U+2212, U+2215, U+FEFF, U+FFFD; /* Latin subset only */
}

/* Inter — Regular Italic (400 italic) */
@font-face {
  font-family: 'Inter';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src:
    url('/assets/fonts/inter/inter-v13-latin-italic.woff2') format('woff2'),
    url('/assets/fonts/inter/inter-v13-latin-italic.woff') format('woff');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
    U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Inter — SemiBold (600) */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src:
    url('/assets/fonts/inter/inter-v13-latin-600.woff2') format('woff2'),
    url('/assets/fonts/inter/inter-v13-latin-600.woff') format('woff');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
    U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Inter — Bold (700) */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src:
    url('/assets/fonts/inter/inter-v13-latin-700.woff2') format('woff2'),
    url('/assets/fonts/inter/inter-v13-latin-700.woff') format('woff');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
    U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Playfair Display — Bold (700) */
@font-face {
  font-family: 'Playfair Display';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src:
    url('/assets/fonts/playfair-display/playfair-display-v30-latin-700.woff2') format('woff2'),
    url('/assets/fonts/playfair-display/playfair-display-v30-latin-700.woff') format('woff');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
    U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191,
    U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
<!-- ============================================================
     STEP 2: <head> template — preload above-fold fonts + load stylesheet
     
     SITE-SPECIFIC ASSUMPTION: Only the primary body font (Inter 400)
     and primary heading font (Playfair Display 700) are preloaded.
     Preloading every variant wastes bandwidth — only preload fonts
     required to render above-the-fold content.
     
     CRITICAL: crossorigin attribute is REQUIRED on font preload links.
     Omitting crossorigin causes a double-fetch: the preload fetches
     the file, then the @font-face rule fetches it again as a CORS
     request. The file is served twice.
     
     SITE-SPECIFIC ASSUMPTION: Paths assume /assets/ directory.
     Adjust to match actual deployment structure.
     ============================================================ -->

<head>
  <!-- Preload: above-fold body font (Inter Regular) -->
  <link
    rel="preload"
    href="/assets/fonts/inter/inter-v13-latin-regular.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />

  <!-- Preload: above-fold heading font (Playfair Display Bold) -->
  <link
    rel="preload"
    href="/assets/fonts/playfair-display/playfair-display-v30-latin-700.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />

  <!-- Self-hosted font stylesheet — replaces fonts.googleapis.com <link> -->
  <!-- REMOVED: <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" /> -->
  <link rel="stylesheet" href="/assets/css/fonts.css" />

  <!-- REMOVED: dns-prefetch and preconnect for Google Fonts origins -->
  <!-- REMOVED: <link rel="preconnect" href="https://fonts.googleapis.com" /> -->
  <!-- REMOVED: <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /> -->
  <!-- REMOVED: <link rel="dns-prefetch" href="//fonts.googleapis.com" /> -->
  <!-- These hints are now unnecessary and must be deleted, not left as comments -->
</head>
# ============================================================
# STEP 3: Server-side cache headers for font files
# 
# SITE-SPECIFIC ASSUMPTION: Apache .htaccess example shown.
# Nginx and CDN (Cloudflare, Fastly, CloudFront) equivalents follow.
# Apply whichever matches the actual server configuration.
# ============================================================

# --- Apache (.htaccess) ---
<IfModule mod_headers.c>
  <FilesMatch "\.(woff2|woff)$">
    # max-age: 31536000 = 1 year in seconds
    # immutable: safe ONLY if filenames are content-hashed (e.g., inter-v13-latin-regular.woff2)
    # If filenames are NOT hashed, use max-age=2592000 (30 days) and remove 'immutable'
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

# --- Nginx (nginx.conf or site config) ---
# location ~* \.(woff2|woff)$ {
#   add_header Cache-Control "public, max-age=31536000, immutable";
#   add_header Access-Control-Allow-Origin "*"; # Required for cross-origin font requests if fonts are on a CDN subdomain
# }

# --- Cloudflare (via Cache Rules in dashboard, or Workers) ---
# Rule: URI path matches /assets/fonts/*
# Cache TTL: 1 year (Edge TTL override)
# Browser TTL: 1 year
# Note: Cloudflare does not cache WOFF2 by default in some plans — verify
# the file extension is included in the cache ruleset.
/* ============================================================
   STEP 4: CSP update — remove Google Fonts origins
   
   Before (example CSP with Google Fonts):
   Content-Security-Policy:
     default-src 'self';
     style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
     font-src 'self' https://fonts.gstatic.com;
   
   After (self-hosted — Google Fonts origins removed):
   Content-Security-Policy:
     default-src 'self';
     style-src 'self' 'unsafe-inline';
     font-src 'self';
   
   SITE-SPECIFIC ASSUMPTION: If fonts are served from a CDN subdomain
   (e.g., cdn.example.com) rather than the same origin, add that
   subdomain to font-src:
     font-src 'self' https://cdn.example.com;
   
   If fonts are served from the same origin as the HTML document,
   'self' is sufficient and no additional font-src entry is needed.
   ============================================================ */

/* HTTP response header — set at server/CDN level, not in CSS */
/* Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; */
// ============================================================
// STEP 5: WordPress — remove Google Fonts via functions.php
// 
// This intercepts Google Fonts enqueued by the active theme
// AND by plugins that use wp_enqueue_style() with a Google Fonts URL.
// It does NOT catch fonts injected via direct HTML in theme templates
// or via GTM custom HTML tags — those must be removed manually.
// 
// SITE-SPECIFIC ASSUMPTION: This dequeue approach targets the
// handle name 'google-fonts' and URL pattern. Actual handle names
// vary by theme — inspect wp_styles()->registered in a test
// environment to find the exact handle names used by this theme.
// ============================================================

/**
 * Remove Google Fonts enqueued by theme and plugins.
 * Runs late (priority 100) to catch all registered styles.
 */
function remove_google_fonts_enqueues() {
  // Collect all registered style handles
  $registered_styles = wp_styles()->registered;

  foreach ( $registered_styles as $handle => $style ) {
    // Check if the source URL references Google Fonts origins
    if (
      isset( $style->src ) &&
      is_string( $style->src ) &&
      (
        strpos( $style->src, 'fonts.googleapis.com' ) !== false ||
        strpos( $style->src, 'fonts.gstatic.com' ) !== false
      )
    ) {
      wp_dequeue_style( $handle );
      wp_deregister_style( $handle );
    }
  }
}
add_action( 'wp_enqueue_scripts', 'remove_google_fonts_enqueues', 100 );
add_action( 'admin_enqueue_scripts', 'remove_google_fonts_enqueues', 100 ); // Admin panel fonts

/**
 * Enqueue the self-hosted font stylesheet.
 * 
 * SITE-SPECIFIC ASSUMPTION: Version string 'v1.0.0' should be
 * updated whenever font files change, to bust browser cache.
 * Use a content hash or deployment timestamp in CI/CD pipelines.
 */
function enqueue_self_hosted_fonts() {
  wp_enqueue_style(
    'self-hosted-fonts',                    // Handle
    get_template_directory_uri() . '/assets/css/fonts.css', // SITE-SPECIFIC: adjust path
    array(),                                // No dependencies
    'v1.0.0'                               // SITE-SPECIFIC: update on font file changes
  );
}
add_action( 'wp_enqueue_scripts', 'enqueue_self_hosted_fonts', 5 ); // Priority 5 = early
// ============================================================
// STEP 6: Verification script — run in browser console or
// as a Playwright/Puppeteer test in CI to confirm zero
// Google Fonts network requests on page load.
// 
// This is a diagnostic tool, not production code.
// Run against staging before deploying to production.
// ============================================================

// Playwright verification test (Node.js)
// Run: npx playwright test verify-fonts.spec.js

const { test, expect } = require('@playwright/test');

// SITE-SPECIFIC ASSUMPTION: Replace with actual site URL
const SITE_URL = 'https://www.example.com';

// Domains that must NOT appear in any network request after remediation
const PROHIBITED_FONT_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// Pages to verify — add all page templates, not just homepage
// SITE-SPECIFIC ASSUMPTION: Expand this list to cover all page types
const PAGES_TO_VERIFY = [
  '/',
  '/about',
  '/products',
  '/blog',
  '/contact',
];

for (const pagePath of PAGES_TO_VERIFY) {
  test(`No Google Fonts requests on ${pagePath}`, async ({ page }) => {
    const googleFontsRequests = [];

    // Intercept all network requests
    page.on('request', (request) => {
      const url = request.url();
      for (const prohibitedDomain of PROHIBITED_FONT_DOMAINS) {
        if (url.includes(prohibitedDomain)) {
          googleFontsRequests.push(url);
        }
      }
    });

    await page.goto(`${SITE_URL}${pagePath}`, {
      waitUntil: 'networkidle', // Wait for all requests to complete
    });

    // Assert zero requests to Google Fonts origins
    expect(
      googleFontsRequests,
      `Found Google Fonts requests on ${pagePath}: ${googleFontsRequests.join(', ')}`
    ).toHaveLength(0);
  });
}

// Also verify self-hosted fonts load successfully (200 OK)
test('Self-hosted fonts return 200 OK', async ({ page }) => {
  // SITE-SPECIFIC ASSUMPTION: Update paths to match actual font file locations
  const FONT_FILES_TO_VERIFY = [
    '/assets/fonts/inter/inter-v13-latin-regular.woff2',
    '/assets/fonts/inter/inter-v13-latin-700.woff2',
    '/assets/fonts/playfair-display/playfair-display-v30-latin-700.woff2',
  ];

  for (const fontPath of FONT_FILES_TO_VERIFY) {
    const response = await page.request.get(`${SITE_URL}${fontPath}`);
    expect(
      response.status(),
      `Font file returned non-200 status: ${fontPath}`
    ).toBe(200);

    const cacheControl = response.headers()['cache-control'] ?? '';
    expect(
      cacheControl,
      `Font file missing long-lived cache header: ${fontPath}`
    ).toContain('max-age=31536000');
  }
});
```

## Risks
- FONT VERSION DRIFT: Google periodically updates font files (hinting improvements, new glyph coverage, bug fixes). Self-hosted files are a snapshot at download time. Establish a periodic review process (recommended: quarterly) to check for upstream font updates and re-download if significant improvements are released. This is a maintenance trade-off, not a blocker.
- INCOMPLETE INVENTORY: If Phase 1 misses a Google Fonts reference (e.g., a plugin that injects fonts conditionally on specific page types, or a font loaded only in the admin panel), that reference will continue to transmit IP addresses. The Playwright verification test in Step 6 must cover all page templates — not just the homepage — to catch conditional injections. Run the verification test against a logged-in session as well, to catch admin-panel font references.
- WOFF FALLBACK OMISSION: If WOFF2-only files are deployed without WOFF fallbacks, Internet Explorer 11 and very old Safari versions will not render the custom font and will fall back to the system font stack. Verify against site analytics whether IE11 or Safari <10 users represent a meaningful audience segment before omitting WOFF files. The google-webfonts-helper tool provides both formats by default.
- MISSING crossorigin ON PRELOAD: If <link rel='preload' as='font'> tags are added without the crossorigin attribute, the browser fetches the font file twice — once for the preload (without CORS headers) and once for the @font-face rule (with CORS headers). These are treated as separate cache entries. The double-fetch wastes bandwidth and negates the preload benefit. The crossorigin attribute is mandatory on font preload links, even when fonts are same-origin.
- CDN CORS HEADERS: If font files are served from a CDN subdomain (e.g., cdn.example.com) rather than the same origin as the HTML document, the CDN must return Access-Control-Allow-Origin: * (or the specific site origin) on font file responses. Without CORS headers, browsers will block cross-origin font requests and fall back to the system font stack. Verify CDN CORS configuration before deploying.
- CMS PLUGIN RE-INJECTION: Some WordPress plugins (page builders, SEO plugins, WooCommerce extensions) re-enqueue Google Fonts independently of the theme. The dequeue function in Step 5 catches wp_enqueue_style() calls, but plugins that inject <link> tags via direct HTML output (e.g., in widget callbacks or shortcode output) bypass the WordPress enqueue system entirely. Manual inspection of rendered HTML is required to confirm complete removal.
- SHOPIFY AND WEBFLOW PLATFORM CONSTRAINTS: Both platforms have limited native support for self-hosted fonts. Shopify requires direct theme file editing and cannot use the admin font picker for self-hosted fonts. Webflow requires the Google Font to be deselected in the Designer AND a custom code embed added — if only one step is done, the Google Fonts connection persists. These platform constraints require careful implementation and post-deployment verification.
- FONT DISPLAY FLASH (FOUT): font-display: swap causes a flash of unstyled text (FOUT) — the browser renders text in the fallback system font, then swaps to the custom font when it loads. This is the correct behavior for performance and accessibility (text is always visible), but it may be visually jarring if the fallback font metrics differ significantly from the custom font. Mitigate with size-adjust, ascent-override, descent-override, and line-gap-override descriptors in @font-face to match fallback font metrics to the custom font. This is an optional refinement, not a blocker.
- CACHE INVALIDATION ON FONT UPDATES: If font files are deployed with long-lived cache headers (max-age=31536000) but without content-hashed filenames, updating the font files will not invalidate the browser cache for returning visitors. Always use content-hashed filenames (e.g., inter-v13-latin-regular.abc123.woff2) or update the version query string in the <link rel='stylesheet'> href when font files change.
- ARTICLE 30 RECORD ACCURACY: If the organization's GDPR Article 30 Record of Processing Activities previously listed Google LLC as a data processor for font delivery, that record must be updated post-remediation. Leaving an inaccurate processing record is a secondary compliance issue under GDPR Article 30.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
