---
finding_id: "resource-3-no-srcset-on-images"
title: "No srcset/sizes on team headshot images — single resolution served to all viewports"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "No LCP impact expected — headshots are below-fold and correctly lazy-loaded."
fix_summary: "Replace static <img src> tags in the team headshot template with a responsive <picture> component that emits srcset/sizes for DPR negotiation and serves correctly-dimensioned WebP variants via Astro'…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["ux-content-02"]
---

# No srcset/sizes on team headshot images — single resolution served to all viewports

**Finding:** No srcset/sizes on team headshot images — single resolution served to all viewports  
**Severity:** Low  
**Why this matters:** No LCP impact expected — headshots are below-fold and correctly lazy-loaded.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Replace static <img src> tags in the team headshot template with a responsive <picture> component that emits srcset/sizes for DPR negotiation and serves correctly-dimensioned WebP variants via Astro'…  

> **Evidence Basis:** Confirmed

---

## Also resolves (1)

One fix closes the findings below — they were folded here as the same remediation:

- `ux-content-02` (Low) — Above-fold content is text-only — strong for performance, verify visual engagement and whitespace ratio

## Impact

- **Lcp And Bandwidth:** No LCP impact expected — headshots are below-fold and correctly lazy-loaded. The fix eliminates unnecessary full-resolution fetches on constrained mobile connections: a browser on a 1x display fetching an 80px headshot will receive an 80px-wide WebP instead of whatever the original resolution is. The structural benefit is DPR correctness: retina displays (2x) will receive 160px or 224px variants instead of the single source, eliminating blurry headshots on high-density screens without over-serving large files to 1x devices.
- **Cls:** Adding explicit width and height attributes to the <img> element eliminates any layout shift caused by the browser not knowing the image's aspect ratio before it loads. If the current static <img> tags lack these attributes, this fix directly reduces CLS contribution from the team section.
- **Crawl And Seo:** No material SEO impact from srcset itself. Descriptive alt text (name + role) on each headshot provides image indexing signal for the team members — verify this is present as part of the fix.
- **Retina Ux:** On 2x displays (most modern phones and MacBooks), headshots will render sharply instead of at half the native pixel density. This is a visual quality improvement, not a performance regression.

## How to verify

**Page:** https://weknowthewhy.com/about
**Element:** Team headshot without srcset — 16KB WebP
**XPath:** `inferred from network: /team/brandon-griner.webp`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("inferred from network: /team/brandon-griner.webp")`
4. This will highlight the problematic element

**Note:** This ticket shows one example location. See `deliverables/issues-list.md` for all occurrences across all pages.

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
Replace static <img src> tags in the team headshot template with a responsive <picture> component that emits srcset/sizes for DPR negotiation and serves correctly-dimensioned WebP variants via Astro's built-in Image component or a hand-authored <picture> element backed by Netlify Image CDN transforms.

### How
1. LOCATE THE TEMPLATE: Find the component rendering team headshots — likely a .astro file in src/components/ (e.g., TeamCard.astro, TeamMember.astro, or an inline section in src/pages/about.astro). Search for the literal <img> tag whose src points to headshot assets.
2. CHOOSE THE RENDERING PATH — two options depending on whether images are local (public/ or src/assets/) or remote (CMS URL):
   OPTION A (local assets, preferred): Use Astro's built-in <Image> component from 'astro:assets'. It generates srcset, sizes, width/height, and WebP automatically at build time. Zero runtime cost.
   OPTION B (remote/CMS URLs or runtime flexibility needed): Author a <picture> element manually using Netlify Image CDN query parameters (?nf_resize=fit&w=N&fm=webp) to generate multiple source URLs at build time inside the .astro template.
3. DETERMINE DISPLAY SIZE: Inspect the rendered headshot size at each breakpoint. Assume a common pattern: ~80px on mobile (single-column), ~96px on tablet, ~112px on desktop. Adjust the sizes attribute to match actual CSS layout — this is the most important correctness step.
4. GENERATE DENSITY VARIANTS: For each display size, provide 1x and 2x DPR variants. For a 112px desktop slot: serve 112w and 224w sources. For an 80px mobile slot: serve 80w and 160w sources.
5. ADD width/height ATTRIBUTES: Always declare intrinsic dimensions to reserve layout space before the image loads, eliminating CLS. Match the largest rendered size (e.g., width='112' height='112' for a square headshot).
6. VERIFY alt TEXT: Confirm each headshot has a descriptive alt (person's name, role) — not empty string (decorative) and not a filename.
7. SCOPE THE CHANGE: Edit only the team headshot component/template. Do not touch other image components. If the team section is embedded in multiple pages via a shared component, the fix propagates automatically — verify by grepping for the component import.
8. TEST: Run `astro build` and inspect the emitted HTML in dist/ to confirm srcset and sizes attributes are present. Verify no CLS regression by checking that width/height are present on the rendered <img>.

### Code examples
```
// OPTION A — Astro built-in Image component (local assets in src/assets/)
// File: src/components/TeamCard.astro
// ASSUMPTION: headshot images are imported as local assets (src/assets/team/)
// ASSUMPTION: display sizes are 80px mobile / 96px tablet / 112px desktop — adjust to match actual CSS
// ASSUMPTION: images are square; adjust width/height if aspect ratio differs

---
import { Image } from 'astro:assets';

// Site-specific config — adjust these to match actual rendered sizes at each breakpoint
const HEADSHOT_SIZES = '(max-width: 639px) 80px, (max-width: 1023px) 96px, 112px';
const HEADSHOT_DISPLAY_WIDTH = 112;  // largest rendered width (desktop), used as intrinsic width
const HEADSHOT_DISPLAY_HEIGHT = 112; // adjust if not square

interface Props {
  name: string;
  role: string;
  // Import the image asset at the call site and pass it in
  // e.g., import headshotSrc from '../assets/team/jane-doe.webp';
  src: ImageMetadata;
}

const { name, role, src } = Astro.props;
---

<div class="team-card">
  <Image
    src={src}
    alt={`${name}, ${role}`}
    width={HEADSHOT_DISPLAY_WIDTH}
    height={HEADSHOT_DISPLAY_HEIGHT}
    sizes={HEADSHOT_SIZES}
    loading="lazy"
    decoding="async"
    class="team-card__headshot"
  />
  <p class="team-card__name">{name}</p>
  <p class="team-card__role">{role}</p>
</div>

<!-- Astro's Image component automatically:
     - Generates srcset with multiple widths derived from the sizes attribute
     - Converts to WebP (or AVIF if configured in astro.config.*)
     - Emits width/height to prevent CLS
     - Applies loading="lazy" (correct: headshots are below-fold on all known layouts)
     No additional build config required beyond default Astro 4+ image service. -->

<style>
  /* Scope to component — never bare element selectors */
  .team-card__headshot {
    border-radius: 50%;
    display: block;
    /* Reserve space matching declared width/height to prevent CLS */
    width: 112px;
    height: 112px;
    object-fit: cover;
  }

  @media (max-width: 1023px) {
    .team-card__headshot {
      width: 96px;
      height: 96px;
    }
  }

  @media (max-width: 639px) {
    .team-card__headshot {
      width: 80px;
      height: 80px;
    }
  }
</style>
// OPTION B — Manual <picture> element with Netlify Image CDN transforms (remote/CMS-hosted images)
// File: src/components/TeamCard.astro
// Use when: headshot URLs come from a CMS, are remote, or cannot be imported as local assets
// PRECONDITION: Netlify Image CDN is enabled on the project (enabled by default on Netlify)
// PRECONDITION: Remote image domain is allowlisted in netlify.toml [images] config if needed
// ASSUMPTION: display sizes are 80px mobile / 96px tablet / 112px desktop — adjust to match actual CSS

---
// Site-specific config — adjust to match actual rendered sizes and breakpoints
const HEADSHOT_DISPLAY_WIDTH = 112;   // largest rendered width (desktop)
const HEADSHOT_DISPLAY_HEIGHT = 112;  // adjust if not square
const HEADSHOT_SIZES = '(max-width: 639px) 80px, (max-width: 1023px) 96px, 112px';

// DPR variants to generate per breakpoint (1x and 2x)
const HEADSHOT_WIDTHS = [80, 96, 112, 160, 192, 224] as const;

interface Props {
  name: string;
  role: string;
  src: string; // Remote URL, e.g. from CMS
}

const { name, role, src } = Astro.props;

// Build Netlify Image CDN srcset string
// Netlify Image CDN transform params: /.netlify/images?url=ENCODED_URL&w=N&fm=webp&fit=cover
// See: https://docs.netlify.com/image-cdn/overview/
function buildNetlifySrcset(originalUrl: string, widths: readonly number[]): string {
  return widths
    .map((w) => {
      const params = new URLSearchParams({
        url: originalUrl,
        w: String(w),
        fm: 'webp',
        fit: 'cover',
      });
      return `/.netlify/images?${params.toString()} ${w}w`;
    })
    .join(', ');
}

// Fallback srcset in original format for browsers without WebP support
function buildFallbackSrcset(originalUrl: string, widths: readonly number[]): string {
  return widths
    .map((w) => {
      const params = new URLSearchParams({
        url: originalUrl,
        w: String(w),
        fit: 'cover',
      });
      return `/.netlify/images?${params.toString()} ${w}w`;
    })
    .join(', ');
}

const webpSrcset = buildNetlifySrcset(src, HEADSHOT_WIDTHS);
const fallbackSrcset = buildFallbackSrcset(src, HEADSHOT_WIDTHS);
// Largest 1x variant as the <img> src fallback (112px)
const fallbackSrc = `/.netlify/images?${new URLSearchParams({ url: src, w: String(HEADSHOT_DISPLAY_WIDTH), fit: 'cover' }).toString()}`;
---

<div class="team-card">
  <picture>
    <source
      type="image/webp"
      srcset={webpSrcset}
      sizes={HEADSHOT_SIZES}
    />
    <source
      srcset={fallbackSrcset}
      sizes={HEADSHOT_SIZES}
    />
    <img
      src={fallbackSrc}
      alt={`${name}, ${role}`}
      width={HEADSHOT_DISPLAY_WIDTH}
      height={HEADSHOT_DISPLAY_HEIGHT}
      loading="lazy"
      decoding="async"
      class="team-card__headshot"
    />
  </picture>
  <p class="team-card__name">{name}</p>
  <p class="team-card__role">{role}</p>
</div>

<!-- Control flow:
     1. Browser reads <source type="image/webp"> first — selects WebP variant matching viewport/DPR
     2. Falls back to second <source> (original format) if WebP unsupported
     3. <img> src is the final fallback for browsers ignoring <picture> entirely (IE11 — negligible)
     4. width/height on <img> reserves layout space regardless of which source is selected
     5. loading="lazy" is correct here — headshots are below-fold; change to "eager" only if
        a headshot is the LCP element on a specific page type -->

<style>
  .team-card__headshot {
    border-radius: 50%;
    display: block;
    width: 112px;
    height: 112px;
    object-fit: cover;
  }

  @media (max-width: 1023px) {
    .team-card__headshot {
      width: 96px;
      height: 96px;
    }
  }

  @media (max-width: 639px) {
    .team-card__headshot {
      width: 80px;
      height: 80px;
    }
  }
</style>
```

## Risks
- SIZES ATTRIBUTE MISCONFIGURATION: If the sizes attribute does not match the actual CSS layout, the browser will select the wrong source variant. Mitigation: measure the rendered headshot width at each breakpoint in DevTools before writing the sizes string. The values in the code examples are assumptions — they must be verified against the actual stylesheet.
- LOADING ATTRIBUTE ON LCP ELEMENT: If any headshot is ever the LCP element (e.g., a founder photo at the top of a single-person about page), loading="lazy" will delay it. Mitigation: audit whether any headshot is above-fold on any page type. If so, add loading="eager" and fetchpriority="high" conditionally via a prop (e.g., isPriority: boolean).
- OPTION A — LOCAL ASSET IMPORT PATTERN: Astro's Image component requires images to be imported as ES module references (import src from '../assets/...'). If headshots are currently referenced as string paths in a data file or CMS, they cannot be passed directly to <Image> without migration to local imports or switching to Option B. Mitigation: audit how headshot paths are currently stored before choosing Option A.
- OPTION B — NETLIFY IMAGE CDN AVAILABILITY: The /.netlify/images endpoint is only active in Netlify-hosted deployments. Local dev (astro dev) will not resolve these URLs unless Netlify Dev CLI is running. Mitigation: add a dev-mode fallback that passes the original src through unchanged, or use Netlify Dev for local testing of image transforms.
- REGRESSION SCOPE: If the team headshot markup is inlined directly in a page file rather than isolated in a component, the fix must be applied carefully to avoid touching adjacent markup. Mitigation: extract the headshot markup into a dedicated TeamCard.astro component before applying the fix — this also future-proofs reuse.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
