---
finding_id: "backwards-compat-astro-static-pass"
title: "Astro static HTML with minimal JS — strong backwards compatibility posture"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "IE11 and Android 4.x users currently receive system font fallback due to woff2-only declarations."
fix_summary: "Add woff fallback alongside existing woff2 font declarations to eliminate font-load failure on IE11/Android 4.x, and document the confirmed absence of @supports gaps as a deliberate policy."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# Astro static HTML with minimal JS — strong backwards compatibility posture

**Finding:** Astro static HTML with minimal JS — strong backwards compatibility posture  
**Severity:** Low  
**Why this matters:** IE11 and Android 4.x users currently receive system font fallback due to woff2-only declarations.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Add woff fallback alongside existing woff2 font declarations to eliminate font-load failure on IE11/Android 4.x, and document the confirmed absence of @supports gaps as a deliberate policy.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Font Rendering Legacy:** IE11 and Android 4.x users currently receive system font fallback due to woff2-only declarations. Adding woff ensures the intended typeface renders on these browsers. Given the cohort size (<0.5% global, per StatCounter 2024), the user-visible impact is cosmetic and narrow — brand consistency is preserved for the tail of the user distribution without any risk to the majority.
- **Core Web Vitals:** No impact. The woff file is only fetched by browsers that cannot parse woff2. Modern browsers (Chrome, Firefox, Safari, Edge) ignore the woff src() entry entirely. Adding it does not increase payload or parse time for the >99.5% of users on modern browsers.
- **Seo And Indexability:** No impact. Googlebot uses a modern Chromium-based renderer that supports woff2. The additional woff src() entry is invisible to crawlers.
- **Maintenance Posture:** Documenting the @supports non-finding as a confirmed policy decision prevents future developers from adding unnecessary @supports wrappers, which would increase stylesheet complexity without benefit given the current CSS property set.

## How to verify

**What to look for:** The page is built with Astro (evidenced by _astro/ CSS path), which outputs static HTML with minimal client-side JavaScript.. 8 inline scripts and 1 async external script (Plausible analytics) are present.

**Measured evidence:**
- Js Dependency: low
- Content In Raw Html: 100%
- Js Injected Elements: 0
- Dom Elements: 142
- Css Rules: 68
- Important Count: 2
- Inline Styles: 0
- Font Format: woff2 with font-display: swap fallback

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
Add woff fallback alongside existing woff2 font declarations to eliminate font-load failure on IE11/Android 4.x, and document the confirmed absence of @supports gaps as a deliberate policy. No architectural changes required — this is a cosmetic polish pass on an already-strong backwards compatibility posture.

### How
0. DETECT FONT LOADING STRATEGY FIRST — before grepping for @font-face, determine how fonts are loaded:
   a. Check the <head> of the root layout (e.g., src/layouts/BaseLayout.astro) for <link> tags pointing to fonts.googleapis.com or any other font CDN. If present, the fix path is self-hosting (see Step 0b), not patching existing @font-face rules.
   b. If a Google Fonts <link> is found: download the font files (woff2 + woff) using a tool such as `google-webfonts-helper` (https://gwfh.madebyevan.com/), place them in public/fonts/, replace the <link> import with @font-face declarations as shown in the CSS code example, remove the now-dead <link rel='preconnect' href='https://fonts.gstatic.com'> tag, and add <link rel='preload' as='font' type='font/woff2' crossorigin> for each above-fold font to avoid a font-load delay that could worsen LCP. Skip to Step 4.
   c. If no CDN <link> is found, grep for '@font-face' across src/ and public/ to locate the self-hosted declarations, then continue with Step 1.
1. Locate all @font-face declarations in the self-hosted CSS (global CSS file, <style is:global> block in root layout, or public/ static CSS file).
2. For each @font-face rule, add a woff src() entry immediately before the existing woff2 entry. The browser uses the first format it supports, so woff2 must remain first. The woff file must already exist in public/fonts/ — if it does not, generate it using the build-time script in the code examples. Variable fonts (single file covering a weight range) have no woff equivalent; exclude them from the script and document the IE11/Android 4.x gap explicitly for those weights.
3. Verify the woff file is present at the path referenced before deploying. A 404 on the woff src() is silent on modern browsers (they use woff2 and never attempt woff) but would be a broken fallback for the legacy cohort this change targets. To prevent broken fallbacks from shipping undetected, add a prebuild assertion (package.json `prebuild` script or Netlify build plugin) that checks all font URLs referenced in CSS exist in public/fonts/.
4. Add a comment block above the @font-face rules documenting the support policy: woff2 primary (>97% global support), woff fallback for IE11/Android 4.x, no IE9/10 eot required (intentional policy decision). Include the audit date and a note that the @supports non-finding must be re-validated when new CSS properties are introduced.
5. For the @supports gap: audit the compiled CSS output (dist/_astro/*.css after `astro build`) for any CSS properties with <95% browser support using the 'Can I Use' data. If none are found — which the 7KB stylesheet size and 0% unused CSS strongly suggest — document this as a confirmed non-issue with the audit date. No @supports wrappers are needed unless the audit surfaces a specific property.
6. Run `astro build` and verify the woff src() appears in the compiled output using the explicit command: `grep -o 'format("woff")' dist/_astro/*.css` (without the '2'). Grepping for 'woff' alone will match woff2 entries and produce a false positive.
7. Deploy to Netlify preview branch and verify font loading in BrowserStack on IE11 (Windows 10) and Android 4.4 Chrome if: (a) legacy coverage is a stated business requirement, OR (b) site analytics show materially higher IE11/Android 4.x penetration than the global StatCounter average for this site's specific geographies. If neither condition applies, skip this step — the cohort is statistically negligible at global averages.

### Code examples
```
// src/styles/global.css (or wherever @font-face is declared)
// Font support policy:
//   woff2 — primary, >97% global browser support (StatCounter 2024)
//   woff  — fallback for IE11 and Android Browser 4.x
//   eot   — intentionally omitted (IE9/10, effectively zero usage)
//   No @supports guards required: compiled CSS uses no properties
//   below 95% browser support (confirmed via `astro build` output audit).

@font-face {
  font-family: 'ExampleFont'; /* SITE-SPECIFIC: replace with actual font family name */
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src:
    url('/fonts/example-font-400.woff2') format('woff2'),
    url('/fonts/example-font-400.woff')  format('woff'); /* legacy fallback */
}

@font-face {
  font-family: 'ExampleFont'; /* SITE-SPECIFIC: replace with actual font family name */
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src:
    url('/fonts/example-font-700.woff2') format('woff2'),
    url('/fonts/example-font-700.woff')  format('woff'); /* legacy fallback */
}
# Build-time woff generation (run once, commit output to public/fonts/)
# Requires fonttools with the woff2 extra (provides the Brotli decoder needed
# to read .woff2 files) plus brotli for compression support.
# SITE-SPECIFIC: adjust input paths to match actual font file locations.
#
# WARNING: Variable fonts (single file covering a weight range, e.g., 100-900)
# have no woff equivalent — the gvar/HVAR/VVAR tables are woff2-only.
# If any .woff2 file in this directory is a variable font, exclude it from
# this script and document the IE11/Android 4.x gap explicitly.

pip install 'fonttools[woff2]' brotli

cd public/fonts

for f in *.woff2; do
  base="${f%.woff2}"

  # Step 1: Decompress woff2 → TTF (requires fonttools[woff2] for Brotli decode)
  fonttools ttLib.woff2 decompress "${f}" -o "${base}.ttf"

  # Step 2: Re-wrap TTF as woff (not woff2)
  fonttools ttLib compress --flavor=woff "${base}.ttf" -o "${base}.woff"

  # Step 3: Remove intermediate TTF
  rm "${base}.ttf"

  # Step 4: Smoke-check — verify the output woff is well-formed and readable
  python3 -c "
import fontTools.ttLib as ttLib
tt = ttLib.TTFont('${base}.woff')
# Access the reader to confirm the file parses without error
_ = list(tt.reader.keys())
print('OK: ${base}.woff — tables:', list(tt.reader.keys()))
"

  echo "Generated ${base}.woff"
done
// astro.config.mjs — no changes required for this fix.
// Astro's static build pipeline passes @font-face src() declarations
// through to dist/ without transformation. The woff entries added to
// global.css will appear verbatim in the compiled output.
// This comment is here to confirm: no build config modification needed.

// If fonts are loaded via a third-party CDN (e.g., Google Fonts) rather
// than self-hosted, the fix path changes: download the font files,
// self-host in public/fonts/, and replace the <link> import with the
// @font-face declarations above. This also eliminates the third-party
// DNS connection overhead and removes a GDPR-relevant data transfer.
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // SITE-SPECIFIC: adapter and other config preserved as-is
  adapter: netlify(),
});
```

## Risks
- woff file absent at referenced path: If the woff file is not committed to public/fonts/ before the @font-face src() is added, the fallback declaration is broken for legacy browsers. Mitigation: run the woff generation script and verify file presence before merging. Modern browsers are unaffected — they resolve woff2 first and never attempt the woff URL.
- woff file size increase in public/: woff files are typically 20-40% larger than their woff2 equivalents due to the absence of Brotli compression. This increases the public/fonts/ directory size but has zero effect on modern browser transfer size (woff2 is served to all capable browsers). Mitigation: acceptable trade-off; document in PR description.
- Incorrect font-weight or font-style mapping: If the woff filename does not correspond to the correct weight/style variant, legacy browsers will render the wrong weight. Mitigation: verify woff filename-to-weight mapping against the woff2 source before committing.
- @supports audit surfaces an actual gap: If the compiled CSS output contains a property below 95% browser support (e.g., container queries, :has(), subgrid), the documented non-finding becomes a real finding requiring @supports wrappers. Mitigation: run the audit step (Step 5) before closing this finding — do not skip it based on assumption alone.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
