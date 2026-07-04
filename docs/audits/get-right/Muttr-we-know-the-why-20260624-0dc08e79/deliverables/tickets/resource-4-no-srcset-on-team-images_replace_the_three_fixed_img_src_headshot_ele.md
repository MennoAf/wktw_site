---
finding_id: "resource-4-no-srcset-on-team-images"
title: "Team headshot images lack srcset — serving fixed-size images to all viewports"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "On 2x and 3x DPR screens (the majority of current smartphones and Retina MacBooks), the browser currently upscales the 1x raster to fill the physical pixel grid."
fix_summary: "Replace the three fixed <img src> headshot elements in the team/about template with <picture> elements that supply 1x and 2x WebP srcset descriptors, preserving the existing WebP format and file-size…"
confidence_tier: "confirmed"
---

# Team headshot images lack srcset — serving fixed-size images to all viewports

**Finding:** Team headshot images lack srcset — serving fixed-size images to all viewports  
**Severity:** Low  
**Why this matters:** On 2x and 3x DPR screens (the majority of current smartphones and Retina MacBooks), the browser currently upscales the 1x raster to fill the physical pixel grid.  
**Root cause:** Isolated issue  
**Fix:** Replace the three fixed <img src> headshot elements in the team/about template with <picture> elements that supply 1x and 2x WebP srcset descriptors, preserving the existing WebP format and file-size…

> **Evidence Basis:** Confirmed

---

## Impact

- **Perceived Sharpness On High Dpr Devices:** On 2x and 3x DPR screens (the majority of current smartphones and Retina MacBooks), the browser currently upscales the 1x raster to fill the physical pixel grid. Portrait photography — fine hair, eye detail, skin texture — is the category most visually degraded by upscaling. Serving a 2x variant eliminates the upscale, delivering the image at native physical pixel density. The mechanism is direct: more source pixels mapped to physical pixels = no interpolation blur.
- **Bandwidth On Constrained Connections:** 1x DPR devices and low-DPR emulation modes (common in budget Android handsets) currently receive the same asset as high-DPR devices. With density descriptors, those devices continue to receive the 1x asset. No savings on the 1x path — the 1x asset is already the minimum. The 2x variant adds ~26–32 KB per image (estimated 2x of the 13–16 KB 1x baseline at equivalent quality), downloaded only by devices that can use it. Net effect: no regression for constrained connections, improved fidelity for capable ones.
- **Cls Stability:** Explicit width and height on the inner <img> (already recommended as a prerequisite) reserves layout space before the image loads, preventing reflow. If these attributes are currently missing, adding them here is a secondary CLS fix bundled into this change.
- **Seo And Image Search:** Correct alt text on portrait images contributes to image search indexability. This fix does not change alt text but enforces the pattern that keeps alt on the rendered <img> element, which is what crawlers index.

## How to verify

**What to look for:** All 3 team images are served as single-resolution WebP files without srcset or sizes attributes.. While the images are small (13-16KB each), they are served at the same resolution regardless of device pixel ratio or viewport width.

**Measured evidence:**
- Images Without Srcset: 3
- Image Urls: ['https://weknowthewhy.com/team/brandon-griner.webp', 'https://weknowthewhy.com/team/jon-lister.webp', 'https://weknowthewhy.com/team/jason-bauman.web
- Individual Sizes Kb: [16, 15, 13]
- Total Image Kb: 44
- Recommendation: Low priority — consider adding srcset with 1x/2x variants if image quality on Retina displays is a concern

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
Replace the three fixed <img src> headshot elements in the team/about template with <picture> elements that supply 1x and 2x WebP srcset descriptors, preserving the existing WebP format and file-size discipline while giving the browser a density-negotiation contract.

### How
1. Locate the team section template file (e.g., team.html, about.html, or the CMS partial that renders the headshot grid). Confirm it is the sole render site for these three images — do not touch global image components.
2. For each headshot, generate a 2x variant at double the CSS display dimensions using the existing image pipeline (e.g., if the image renders at 200×200 CSS px, produce a 400×400 WebP at the same quality setting). Name it with a @2x or -2x suffix to avoid colliding with the existing 1x asset.
3. Optionally generate a 0.75x variant (150×150) for low-DPR constrained connections if the image pipeline supports it cheaply; otherwise 1x + 2x is sufficient given the 13–16 KB baseline.
4. Replace each <img> with a <picture> element as shown in the code example. Retain all existing attributes (alt, width, height, class) on the inner <img> to preserve layout reservation and accessibility. Do not add loading='lazy' — confirm whether these images are above or below the fold on the about page; if above the fold, omit lazy; if below, add loading='lazy' and fetchpriority='low'.
5. Add explicit width and height attributes matching the CSS display dimensions on the inner <img> if they are not already present — this is the CLS guard.
6. Validate in DevTools: open Network tab, throttle to 3G, confirm 1x asset is fetched; switch to a 3x DPR device emulation, confirm 2x asset is fetched. No 3x asset is needed given the 13–16 KB ceiling — the visual gain does not justify a third variant at this file size.
7. Scope guard: the change is limited to the team template partial. Run a grep or CMS search for the headshot src filenames to confirm they appear nowhere else in the codebase before deploying.

### Code examples
```
<!-- BEFORE: fixed single-src pattern -->
<img
  src="/images/team/jane-doe.webp"
  alt="Jane Doe, Head of Design"
  class="team__headshot"
  width="200"
  height="200"
/>

<!-- AFTER: density-descriptor responsive pattern -->
<!--
  SITE-SPECIFIC ASSUMPTIONS (adjust per environment):
  - HEADSHOT_DISPLAY_SIZE: 200px CSS pixels (confirm in team.css / layout grid)
  - 1x source: existing asset, no regeneration needed
  - 2x source: regenerate at 400×400px, same WebP quality setting as 1x
  - loading attribute: omit if above fold; add loading="lazy" if below fold
  - fetchpriority: omit if not LCP candidate; add fetchpriority="high" only if
    this image is the Largest Contentful Paint element on the page
-->
<picture>
  <source
    type="image/webp"
    srcset="
      /images/team/jane-doe.webp    1x,
      /images/team/jane-doe-2x.webp 2x
    "
  />
  <!-- Fallback <img> for browsers without <picture> support (>3 years old,
       <1% global share as of 2024, but the fallback costs nothing). -->
  <img
    src="/images/team/jane-doe.webp"
    alt="Jane Doe, Head of Design"
    class="team__headshot"
    width="200"
    height="200"
  />
</picture>
<!-- If the team section is rendered via a CMS loop or template engine,
     parameterise the pattern rather than duplicating it three times.
     Example using Nunjucks/Jinja-style templating: -->

{#
  SITE-SPECIFIC: team_members is the CMS data array for the about page.
  headshot_display_px must match the CSS grid column width for .team__headshot.
  Adjust if the grid is responsive and the display size changes at breakpoints
  (in that case, switch from density descriptors to width descriptors + sizes).
#}
{% set HEADSHOT_DISPLAY_PX = 200 %}

{% for member in team_members %}
<picture>
  <source
    type="image/webp"
    srcset="
      {{ member.headshot_1x_url }} 1x,
      {{ member.headshot_2x_url }} 2x
    "
  />
  <img
    src="{{ member.headshot_1x_url }}"
    alt="{{ member.name }}, {{ member.title }}"
    class="team__headshot"
    width="{{ HEADSHOT_DISPLAY_PX }}"
    height="{{ HEADSHOT_DISPLAY_PX }}"
  />
</picture>
{% endfor %}
/* team.css — scope guard: these rules apply only within .team-section.
   Do not widen the selector. The <picture> element is inline by default;
   the width/height constraint must live on the <img>, not the <picture>. */

/* SITE-SPECIFIC: 200px matches the 2-up mobile and 4-up desktop grid column
   width for the team headshot grid. Adjust if the grid column width changes. */
:root {
  --team-headshot-size: 200px;
}

.team-section .team__headshot {
  width: var(--team-headshot-size);
  height: var(--team-headshot-size);
  object-fit: cover;   /* preserves portrait crop if source aspect ratio varies */
  border-radius: 50%;  /* retain existing circular crop if applicable */
  display: block;      /* eliminates inline baseline gap (CLS micro-source) */
}
```

## Risks
- 2x asset generation: if the source files used to produce the existing 1x WebPs have been discarded or are lower resolution than 400×400px, upscaling to generate a 2x variant defeats the purpose — the 2x file would be a resampled artifact, not a true high-density source. Mitigation: verify source resolution before generating 2x variants; if source is ≤1x display dimensions, skip the 2x variant and document the gap.
- CMS field availability: if the CMS data model for team members stores only a single image URL, the template loop approach requires either a second CMS field (headshot_2x_url) or a URL-transform convention (appending -2x to the filename). Mitigation: confirm CMS schema before choosing the loop approach; if a second field is not feasible, use an image CDN transform parameter (e.g., ?w=400&dpr=2) on the single stored URL.
- Density descriptors vs. width descriptors: density descriptors (1x, 2x) are correct when the image renders at a fixed CSS pixel size across all breakpoints. If the team grid is fluid and the headshot size changes significantly between mobile and desktop (e.g., 120px mobile, 200px desktop), density descriptors will cause the browser to select the wrong variant at some breakpoints. Mitigation: inspect the CSS grid at mobile and desktop breakpoints before committing to density descriptors; if the display size varies by more than ~30%, switch to width descriptors with a sizes attribute.
- Scope containment: the grep/search step in instruction 7 is mandatory. If the headshot src filenames are referenced in a global image component that was assumed to be unaffected, the <picture> wrapper change must be applied there instead — or the global component must be confirmed as not rendering these specific files.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
