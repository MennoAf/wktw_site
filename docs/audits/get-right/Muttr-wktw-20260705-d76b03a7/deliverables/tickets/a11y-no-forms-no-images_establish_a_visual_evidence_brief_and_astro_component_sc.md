---
finding_id: "a11y-no-forms-no-images"
title: "No images or forms on page — alt text and form label audits not applicable"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Case studies with zero images miss the opportunity for image search indexing and rich result eligibility."
fix_summary: "Establish a visual evidence brief and Astro component scaffolding for the case-study template so that when client-approved assets arrive, they slot into an already-accessible, performance-correct ima…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# No images or forms on page — alt text and form label audits not applicable

**Finding:** No images or forms on page — alt text and form label audits not applicable  
**Severity:** Low  
**Why this matters:** Case studies with zero images miss the opportunity for image search indexing and rich result eligibility.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Establish a visual evidence brief and Astro component scaffolding for the case-study template so that when client-approved assets arrive, they slot into an already-accessible, performance-correct ima…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Seo:** Case studies with zero images miss the opportunity for image search indexing and rich result eligibility. Adding structured, alt-tagged images creates additional organic entry points from image search — a channel that text-only pages cannot access.
- **Conversion:** B2B case studies function as proof assets in the sales funnel. Visual evidence (before/after charts, screenshots, results dashboards) reduces cognitive load on the claim-evaluation step. Text-only case studies require the reader to accept claims without corroboration, which increases friction at the trust-building stage of the funnel.
- **Accessibility Legal:** The build-time lint and CaseStudyFigure component enforce alt text as a structural requirement — not an afterthought. Every image added through the component will have a non-optional alt prop, eliminating the class of ADA/WCAG 1.1.1 violations that arise when images are added ad hoc without editorial process.
- **Cls Prevention:** CaseStudyFigure requires explicit width and height props. This reserves layout space before the image loads, preventing Cumulative Layout Shift when images are added to the page — a Core Web Vitals signal with direct search ranking implications.

## How to verify

**What to look for:** The page contains zero images (0 above fold, 0 below fold).. Alt text audit is not applicable.

**Measured evidence:**
- Forms: 0
- Images: 0
- Total Images: 0
- Alt Text Audit: not applicable
- Forms Count: 0

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
Establish a visual evidence brief and Astro component scaffolding for the case-study template so that when client-approved assets arrive, they slot into an already-accessible, performance-correct image pipeline — and add a build-time content lint that warns when a published case study ships with zero images.

### How
1. Create `src/components/CaseStudyFigure.astro` — a self-contained figure component that enforces alt text, width/height, WebP/AVIF via <picture>, and lazy/eager loading based on position prop. This is the only sanctioned way to add images to the case-study template.
2. Add a build-time content lint script (`scripts/lint-casestudy-images.mjs`) that reads all Markdown/MDX files under `src/content/case-studies/`, counts image references, and exits non-zero (blocking the Netlify build) when a file in `draft: false` state has zero images. This enforces the editorial brief without touching runtime code.
3. Wire the lint script into `package.json` as a pre-build step and into `netlify.toml` as a build command prefix so it runs on every deploy.
4. Add a `visualEvidenceBrief` frontmatter field (array of objects: `{ slot, description, approvalStatus }`) to the case-study content schema in `src/content/config.ts`. This makes the editorial gap machine-readable and surfaceable in a CMS or PR review.
5. Render a visible dev-only placeholder in the case-study layout when `import.meta.env.DEV === true` and `visualEvidenceBrief` entries exist with `approvalStatus !== 'approved'` — so authors see reserved image slots during local preview without shipping placeholder markup to production.

### Code examples
```
// src/components/CaseStudyFigure.astro
---
// SITE-SPECIFIC ASSUMPTION: case studies use a 2-column grid at ≥768px.
// Adjust SIZES_ATTR if the layout changes.
const SIZES_ATTR = '(min-width: 768px) 50vw, 100vw';

interface Props {
  src: string;          // path relative to /public or absolute URL
  alt: string;          // required — empty string only for decorative images
  width: number;        // intrinsic pixel width — required to prevent CLS
  height: number;       // intrinsic pixel height — required to prevent CLS
  caption?: string;
  /** 'eager' for the first image in the viewport, 'lazy' for all others */
  loading?: 'eager' | 'lazy';
  /** Only the first above-fold image should be fetchpriority high */
  fetchpriority?: 'high' | 'low' | 'auto';
}

const {
  src,
  alt,
  width,
  height,
  caption,
  loading = 'lazy',
  fetchpriority = 'auto',
} = Astro.props;

// Derive WebP and AVIF src paths.
// SITE-SPECIFIC ASSUMPTION: Netlify Image CDN transform URL pattern.
// Replace with your image CDN's transform API if different.
const base = src.startsWith('http') ? src : src;
const avifSrc = `/.netlify/images?url=${encodeURIComponent(base)}&fm=avif`;
const webpSrc = `/.netlify/images?url=${encodeURIComponent(base)}&fm=webp`;
---

<figure class="case-study-figure">
  <picture>
    <source type="image/avif" srcset={avifSrc} sizes={SIZES_ATTR} />
    <source type="image/webp" srcset={webpSrc} sizes={SIZES_ATTR} />
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchpriority={fetchpriority}
      decoding={loading === 'eager' ? 'sync' : 'async'}
    />
  </picture>
  {caption && <figcaption>{caption}</figcaption>}
</figure>

<style>
  /* Scoped to .case-study-figure — does not bleed to other templates */
  .case-study-figure {
    margin: 0;
  }
  .case-study-figure img {
    display: block;
    max-width: 100%;
    height: auto;
  }
  .case-study-figure figcaption {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin-top: 0.5rem;
  }
</style>
// src/content/config.ts  (extend existing config — do not replace)
import { defineCollection, z } from 'astro:content';

const visualEvidenceBriefItem = z.object({
  slot: z.string(),                          // e.g. 'hero', 'before-after', 'results-chart'
  description: z.string(),                   // editorial brief for the asset
  approvalStatus: z.enum(['pending', 'approved', 'blocked']),
});

export const collections = {
  // SITE-SPECIFIC ASSUMPTION: collection is named 'case-studies'.
  // Adjust key if your collection uses a different directory name.
  'case-studies': defineCollection({
    schema: z.object({
      title: z.string(),
      draft: z.boolean().default(false),
      visualEvidenceBrief: z.array(visualEvidenceBriefItem).optional(),
      // ... existing fields preserved
    }),
  }),
};
// scripts/lint-casestudy-images.mjs
// Run via: node scripts/lint-casestudy-images.mjs
// Exits 1 (blocking build) when a published case study has zero image references.
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

// SITE-SPECIFIC ASSUMPTION: case study content lives here.
const CONTENT_DIR = 'src/content/case-studies';

// Matches Markdown image syntax and MDX <CaseStudyFigure> usage.
// Extend this regex if you add other image components.
const IMAGE_PATTERN = /!\[|<CaseStudyFigure/;
const DRAFT_PATTERN = /^draft:\s*true/m;

async function lint() {
  let files;
  try {
    files = await readdir(CONTENT_DIR);
  } catch (err) {
    // Directory missing entirely — not a case-study site, skip gracefully.
    console.warn(`[lint-casestudy-images] Content dir not found: ${CONTENT_DIR}`);
    process.exit(0);
  }

  const mdFiles = files.filter(f => ['.md', '.mdx'].includes(extname(f)));
  const violations = [];

  for (const file of mdFiles) {
    const content = await readFile(join(CONTENT_DIR, file), 'utf8');
    const isDraft = DRAFT_PATTERN.test(content);
    if (isDraft) continue; // drafts are exempt

    const hasImage = IMAGE_PATTERN.test(content);
    if (!hasImage) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    console.error(
      `[lint-casestudy-images] FAIL: The following published case studies have zero images.\n` +
      `Add client-approved assets or set draft: true before publishing.\n\n` +
      violations.map(f => `  - ${f}`).join('\n')
    );
    process.exit(1);
  }

  console.log(`[lint-casestudy-images] PASS: All ${mdFiles.length} case studies checked.`);
}

lint();
# netlify.toml  (extend existing — do not replace)
[build]
  # SITE-SPECIFIC ASSUMPTION: existing build command is 'astro build'.
  # Prepend the lint; if lint exits 1, Netlify aborts before astro build runs.
  command = "node scripts/lint-casestudy-images.mjs && astro build"
  publish = "dist"
// src/components/CaseStudyImagePlaceholder.astro
// DEV-ONLY component — renders nothing in production.
// Drop this inside the case-study layout wherever image slots should appear.
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  brief: CollectionEntry<'case-studies'>['data']['visualEvidenceBrief'];
}

const { brief } = Astro.props;
const isDev = import.meta.env.DEV;

if (!isDev || !brief || brief.length === 0) {
  // Render nothing in production or when no brief is defined.
  return;
}
---

{isDev && brief && brief.length > 0 && (
  <aside
    class="cs-image-brief"
    aria-label="Image evidence brief (dev only — not visible in production)"
    role="note"
  >
    <p class="cs-image-brief__heading">📋 Visual Evidence Brief</p>
    <ul class="cs-image-brief__list">
      {brief.map(item => (
        <li class="cs-image-brief__item" data-status={item.approvalStatus}>
          <strong>{item.slot}</strong>: {item.description}
          <span class="cs-image-brief__status">({item.approvalStatus})</span>
        </li>
      ))}
    </ul>
  </aside>
)}

<style>
  /* Scoped — cannot leak outside this component */
  .cs-image-brief {
    border: 2px dashed #f59e0b;
    background: #fffbeb;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    font-size: 0.875rem;
  }
  .cs-image-brief__heading {
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .cs-image-brief__list {
    margin: 0;
    padding-left: 1.25rem;
  }
  .cs-image-brief__item[data-status='approved'] { color: #15803d; }
  .cs-image-brief__item[data-status='pending']  { color: #b45309; }
  .cs-image-brief__item[data-status='blocked']  { color: #b91c1c; }
  .cs-image-brief__status {
    font-style: italic;
    margin-left: 0.25rem;
  }
</style>
```

## Risks
- Build-time lint will block deploys for any existing published case study that has zero images at the time the lint is introduced. Mitigation: on first deploy, run the lint in warn-only mode (replace `process.exit(1)` with `process.exit(0)` and log a warning) to audit the backlog without blocking. Flip to hard-fail after the backlog is cleared or all zero-image files are set to `draft: true`.
- Netlify Image CDN transform URLs (`/.netlify/images?url=...`) require the Netlify Image CDN feature to be enabled on the account. If it is not enabled, the <source> elements will 404 silently and the browser will fall back to the base <img> src — which is correct fallback behavior, but AVIF/WebP optimization will not apply. Mitigation: verify Netlify Image CDN is active in the Netlify dashboard before deploying CaseStudyFigure; if not available, replace the transform URL logic with a local build-time image pipeline (e.g., `@astrojs/image` or `sharp` in a custom integration).
- The `visualEvidenceBrief` schema addition is additive and optional (`z.array(...).optional()`), so existing case-study frontmatter without this field will not break. However, if the content collection schema is currently using `z.object({}).strict()`, the new field must be added before deploying or Astro's content layer will throw a validation error at build time. Mitigation: confirm the existing schema is not in strict mode before merging.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
