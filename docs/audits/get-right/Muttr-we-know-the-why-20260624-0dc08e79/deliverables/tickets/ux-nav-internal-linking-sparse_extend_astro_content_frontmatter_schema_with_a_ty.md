---
finding_id: "ux-nav-internal-linking-sparse"
title: "Sparse internal linking — only navigational links present, no contextual in-content links to related pages"
severity: "medium"
root_cause_cluster: "Navigation Architecture — Sparse Internal Linking and Content Dead-Ends"
why_this_matters: "Interior pages (insights, services, proof) currently receive internal link equity only from the global nav and footer."
fix_summary: "Extend Astro content frontmatter schema with a typed relationship model (relatedPages, nextStep, proofLinks), then build two shared components — RelatedContent and InlineContextualLink — that consume…"
confidence_tier: "confirmed"
---

# Sparse internal linking — only navigational links present, no contextual in-content links to related pages

**Finding:** Sparse internal linking — only navigational links present, no contextual in-content links to related pages  
**Severity:** Medium  
**Why this matters:** Interior pages (insights, services, proof) currently receive internal link equity only from the global nav and footer.  
**Root cause:** Navigation Architecture — Sparse Internal Linking and Content Dead-Ends  
**Fix:** Extend Astro content frontmatter schema with a typed relationship model (relatedPages, nextStep, proofLinks), then build two shared components — RelatedContent and InlineContextualLink — that consume…

> **Evidence Basis:** Confirmed

---

## Impact

- **Organic Search Ranking:** Interior pages (insights, services, proof) currently receive internal link equity only from the global nav and footer. Adding contextual in-content links creates topical cluster signals — search engines use co-citation patterns between linked pages to assess topical authority. Pages that are contextually linked from thematically related content are better positioned to rank for long-tail queries than pages reachable only through navigational links.
- **Crawl Coverage:** Googlebot follows internal links to discover and re-crawl content. Pages linked only from nav/footer are crawled at the cadence of the homepage's crawl budget. Contextual links from high-engagement content pages create additional crawl paths, increasing the frequency with which interior pages are re-indexed after updates.
- **Session Depth And Engagement:** Every content page currently terminates the user journey — there is no mechanism to guide a user from an Insights article to a related Service page or validating Proof page. Adding RelatedContent and NextStepCTA components creates explicit pathways between content nodes. Users who follow these paths are self-selecting for higher intent, which correlates with downstream conversion actions (contact form, demo request). The mechanism is reduced exit rate from content pages, not a speculative conversion multiplier.
- **B2B Buyer Journey Alignment:** B2B purchase decisions involve multiple touchpoints across multiple sessions. A site architecture that dead-ends every page forces buyers to re-enter via search or direct navigation for each subsequent research step. Contextual links that connect claims (Insights) to validation (Proof) to solutions (Services) reduce the friction of self-directed research and keep the buyer within the site's content ecosystem across sessions.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_010`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The homepage contains only 12 unique internal links, all of which are navigational (header nav + mobile menu duplicates + footer).. There are no contextual internal links within the page content — no links from the hero section to case studies, no links from service descriptions to the Proof page, no links from problem statements to Insights articles.

**Measured evidence:**
- Total Internal Links: 12
- External Links: 0
- Contextual Content Links: 0
- Link Types: All navigational (header, mobile menu, footer)
- Content Body Internal Links: 0
- Related Content Sections: 0
- Next Prev Navigation: False
- Page Type: case study

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
Extend Astro content frontmatter schema with a typed relationship model (relatedPages, nextStep, proofLinks), then build two shared components — RelatedContent and InlineContextualLink — that consume those relationships to render contextual links at the template level. This converts every content page from a dead-end into a node in a navigable content graph without touching global nav, routing, or any existing page layout outside the designated slot zones.

### How
1. SCHEMA EXTENSION — Add a content relationship schema to src/content/config.ts using Astro's built-in Zod-based collection schema. Define three optional arrays: relatedPages (sibling content), nextStep (single CTA destination), proofLinks (case studies / proof pages that validate the current page's claims). All fields are optional so existing pages without frontmatter additions continue to build without error.
2. FRONTMATTER POPULATION — For each existing .md/.mdx file in the insights, services, and proof collections, add the new fields referencing slugs of related pages. Start with the highest-traffic pages first (use Search Console data). Pages with no additions render without the component — no visual regression.
3. RELATEDCONTENT COMPONENT — Build src/components/RelatedContent.astro. It accepts a relatedPages slug array, resolves each slug against the collection via getEntry(), and renders a <nav aria-label='Related content'> block. Render nothing (return early) if the resolved array is empty — no empty containers in the DOM.
4. INLINECONTEXTUALLINK COMPONENT — Build src/components/InlineContextualLink.astro for use inside MDX body content. Accepts a slug and optional label override. Resolves the entry at build time and renders a single <a> with the page's title as fallback text. This enables authors to drop contextual links mid-paragraph in MDX without hardcoding URLs.
5. NEXTSTEP CTA COMPONENT — Build src/components/NextStepCTA.astro. Accepts the nextStep slug, resolves it, and renders a visually distinct CTA block (not a button — an <a> styled as a card) at the bottom of the page body, above the footer. This is the primary mechanism for guiding users toward the next logical trust-building step.
6. TEMPLATE INTEGRATION — In each page template (src/layouts/InsightLayout.astro, ServiceLayout.astro, ProofLayout.astro), import and place the three components in designated slot zones: InlineContextualLink is available as an MDX component, NextStepCTA renders after the main content slot, RelatedContent renders after NextStepCTA. No changes to global nav, header, footer, or any shared layout outside these three layouts.
7. BREADCRUMB COMPONENT — Build src/components/Breadcrumb.astro using JSON-LD BreadcrumbList schema output alongside the visible <nav aria-label='Breadcrumb'> element. Derive breadcrumb path from the collection name and page slug — no additional frontmatter required. Inject into all three layouts above the page <h1>.
8. BUILD VERIFICATION — Run astro build and confirm: (a) no TypeScript errors from schema additions, (b) pages with empty relationship arrays render without RelatedContent or NextStepCTA DOM nodes, (c) pages with populated arrays render correct hrefs resolved from slugs (not hardcoded strings), (d) BreadcrumbList JSON-LD is present in <head> on all three layout types.

### Code examples
```
// src/content/config.ts
// SITE-SPECIFIC ASSUMPTION: collection names 'insights', 'services', 'proof' must match
// your actual Astro content collection directory names under src/content/
import { defineCollection, z } from 'astro:content';

// Reusable relationship schema — shared across all content collections
const contentRelationships = z.object({
  // Slugs of sibling pages in any collection — rendered by RelatedContent component
  relatedPages: z.array(z.string()).optional().default([]),
  // Single slug for the primary next-step destination — rendered by NextStepCTA
  nextStep: z.string().optional(),
  // Slugs of proof/case-study pages that validate this page's claims
  proofLinks: z.array(z.string()).optional().default([]),
});

const insightsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    // Spread relationship fields into every insights entry
  }).merge(contentRelationships),
});

const servicesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }).merge(contentRelationships),
});

const proofCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    client: z.string().optional(),
  }).merge(contentRelationships),
});

export const collections = {
  insights: insightsCollection,
  services: servicesCollection,
  proof: proofCollection,
};
// src/components/RelatedContent.astro
// Preconditions:
//   - slugEntries is an array of {collection, slug} objects resolved by the parent layout
//   - Each entry has already been fetched via getEntry() before being passed here
//   - If slugEntries is empty or all entries failed to resolve, this component renders nothing
---
import type { CollectionEntry } from 'astro:content';

// SITE-SPECIFIC ASSUMPTION: adjust collection union type to match your collections
type SupportedEntry =
  | CollectionEntry<'insights'>
  | CollectionEntry<'services'>
  | CollectionEntry<'proof'>;

interface Props {
  entries: SupportedEntry[];
  heading?: string;
}

const {
  entries,
  // SITE-SPECIFIC ASSUMPTION: heading copy — adjust to match brand voice
  heading = 'Related reading',
} = Astro.props;

// Guard: render nothing if no valid entries were resolved by the parent
const validEntries = entries.filter(Boolean);
if (validEntries.length === 0) return;
---

<nav aria-label={heading} class="related-content">
  <h2 class="related-content__heading">{heading}</h2>
  <ul class="related-content__list" role="list">
    {validEntries.map((entry) => (
      <li class="related-content__item">
        <a
          href={`/${entry.collection}/${entry.slug}/`}
          class="related-content__link"
        >
          {entry.data.title}
          {entry.data.description && (
            <span class="related-content__description">
              {entry.data.description}
            </span>
          )}
        </a>
      </li>
    ))}
  </ul>
</nav>
// src/components/NextStepCTA.astro
// Preconditions:
//   - entry is a fully resolved CollectionEntry, not a slug string
//   - Parent layout is responsible for resolving the slug via getEntry() before passing here
//   - If entry is undefined (slug not found or frontmatter field absent), renders nothing
---
import type { CollectionEntry } from 'astro:content';

// SITE-SPECIFIC ASSUMPTION: adjust collection union type to match your collections
type SupportedEntry =
  | CollectionEntry<'insights'>
  | CollectionEntry<'services'>
  | CollectionEntry<'proof'>;

interface Props {
  entry: SupportedEntry | undefined;
  label?: string;
}

const {
  entry,
  // SITE-SPECIFIC ASSUMPTION: CTA prefix copy — adjust to match brand voice
  label = 'Next step',
} = Astro.props;

// Guard: render nothing if the slug did not resolve to a valid entry
if (!entry) return;

const href = `/${entry.collection}/${entry.slug}/`;
---

<div class="next-step-cta" role="complementary" aria-label={label}>
  <p class="next-step-cta__label">{label}</p>
  <a href={href} class="next-step-cta__link">
    <span class="next-step-cta__title">{entry.data.title}</span>
    {entry.data.description && (
      <span class="next-step-cta__description">{entry.data.description}</span>
    )}
  </a>
</div>
// src/components/InlineContextualLink.astro
// For use inside MDX body content as a component import.
// Resolves slug at build time — no runtime fetch, no hydration required.
// Preconditions:
//   - collection and slug must both be provided
//   - If getEntry() returns undefined (slug not found), falls back to label prop or slug string
//   - This component is intentionally server-only (no client: directive)
---
import { getEntry } from 'astro:content';

interface Props {
  // SITE-SPECIFIC ASSUMPTION: collection must be one of your defined collection names
  collection: 'insights' | 'services' | 'proof';
  slug: string;
  // Optional label override — if omitted, uses resolved page title
  label?: string;
}

const { collection, slug, label } = Astro.props;

// Build-time resolution — getEntry() is safe to call in Astro component frontmatter
const entry = await getEntry(collection, slug);

// Defensive: if slug is wrong or entry was deleted, fall back gracefully
const linkText = label ?? entry?.data.title ?? slug;
const href = entry ? `/${collection}/${slug}/` : '#';
const isBroken = !entry;
---

{isBroken ? (
  <!-- Broken slug: render text only, no dead link in production -->
  <!-- Log warning at build time via console.warn so authors catch it -->
  <span class="inline-link inline-link--unresolved">{linkText}</span>
) : (
  <a href={href} class="inline-link">{linkText}</a>
)}
// src/components/Breadcrumb.astro
// Derives breadcrumb from collection name and slug — no additional frontmatter required.
// Outputs both visible <nav> and JSON-LD BreadcrumbList in <head> via Astro's <Fragment slot="head">.
// Preconditions:
//   - collection and slug are passed by the parent layout
//   - pageTitle is the resolved entry's data.title
//   - siteUrl is the canonical origin (no trailing slash)
---
interface Props {
  collection: string;
  slug: string;
  pageTitle: string;
  // SITE-SPECIFIC ASSUMPTION: set to your canonical origin, e.g. 'https://example.com'
  siteUrl: string;
  // SITE-SPECIFIC ASSUMPTION: human-readable collection label map — extend as needed
  collectionLabels?: Record<string, string>;
}

const {
  collection,
  slug,
  pageTitle,
  siteUrl,
  collectionLabels = {
    insights: 'Insights',
    services: 'Services',
    proof: 'Proof',
  },
} = Astro.props;

const collectionLabel = collectionLabels[collection] ?? collection;
const collectionHref = `${siteUrl}/${collection}/`;
const pageHref = `${siteUrl}/${collection}/${slug}/`;

const breadcrumbJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: collectionLabel,
      item: collectionHref,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: pageTitle,
      item: pageHref,
    },
  ],
});
---

<Fragment slot="head">
  <script type="application/ld+json" set:html={breadcrumbJsonLd} />
</Fragment>

<nav aria-label="Breadcrumb" class="breadcrumb">
  <ol class="breadcrumb__list" role="list">
    <li class="breadcrumb__item">
      <a href={siteUrl} class="breadcrumb__link">Home</a>
    </li>
    <li class="breadcrumb__item">
      <a href={collectionHref} class="breadcrumb__link">{collectionLabel}</a>
    </li>
    <li class="breadcrumb__item" aria-current="page">
      <span class="breadcrumb__current">{pageTitle}</span>
    </li>
  </ol>
</nav>
// src/layouts/InsightLayout.astro — integration example
// Shows how the parent layout resolves slugs before passing entries to components.
// The same pattern applies to ServiceLayout.astro and ProofLayout.astro.
// Preconditions:
//   - entry is a fully resolved CollectionEntry<'insights'> passed from the page
//   - getEntry() returns undefined for missing slugs — all components guard against this
//   - SITE-SPECIFIC ASSUMPTION: siteUrl must be set to your canonical origin
---
import { getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import RelatedContent from '../components/RelatedContent.astro';
import NextStepCTA from '../components/NextStepCTA.astro';
import Breadcrumb from '../components/Breadcrumb.astro';
import InlineContextualLink from '../components/InlineContextualLink.astro';

interface Props {
  entry: CollectionEntry<'insights'>;
}

const { entry } = Astro.props;
const { title, description, relatedPages, nextStep, proofLinks } = entry.data;

// SITE-SPECIFIC ASSUMPTION: set to your canonical origin
const SITE_URL = 'https://example.com';

// Resolve all relationship slugs at build time.
// getEntry() returns undefined for missing slugs — components handle this gracefully.
// relatedPages and proofLinks slugs are stored as 'collection/slug' strings in frontmatter
// to support cross-collection references. Split on first '/' to extract collection and slug.

function parseCollectionSlug(raw: string): { collection: string; slug: string } | null {
  const separatorIndex = raw.indexOf('/');
  if (separatorIndex === -1) return null;
  return {
    collection: raw.slice(0, separatorIndex),
    slug: raw.slice(separatorIndex + 1),
  };
}

// Resolve related pages — filter out nulls from malformed or missing slugs
const resolvedRelated = (
  await Promise.all(
    [...relatedPages, ...proofLinks].map(async (raw) => {
      const parsed = parseCollectionSlug(raw);
      if (!parsed) return null;
      // getEntry accepts a collection name and slug as separate arguments
      // TypeScript requires the collection to be a known literal — cast is safe here
      // because Astro's getEntry will return undefined for unknown collections
      return getEntry(parsed.collection as 'insights' | 'services' | 'proof', parsed.slug);
    })
  )
).filter((e): e is NonNullable<typeof e> => e !== undefined && e !== null);

// Resolve nextStep — single entry, undefined if slug missing or malformed
const resolvedNextStep = nextStep
  ? await (async () => {
      const parsed = parseCollectionSlug(nextStep);
      if (!parsed) return undefined;
      return getEntry(parsed.collection as 'insights' | 'services' | 'proof', parsed.slug);
    })()
  : undefined;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <!-- Breadcrumb injects JSON-LD into head via slot -->
    <Breadcrumb
      collection="insights"
      slug={entry.slug}
      pageTitle={title}
      siteUrl={SITE_URL}
    />
  </head>
  <body>
    <main>
      <slot />
    </main>
    <!-- NextStepCTA renders only when resolvedNextStep is defined -->
    <NextStepCTA entry={resolvedNextStep} />
    <!-- RelatedContent renders only when resolvedRelated has entries -->
    <RelatedContent entries={resolvedRelated} />
  </body>
</html>
```

## Risks
- SLUG DRIFT: If a page's slug changes after being referenced in another page's frontmatter, getEntry() returns undefined silently at build time. The InlineContextualLink component renders a <span> fallback instead of a broken <a>, and RelatedContent/NextStepCTA render nothing — no build failure, but a silent content gap. Mitigation: add a build-time validation script that iterates all frontmatter relationship fields and asserts every referenced slug resolves to a non-undefined entry, failing the build with a descriptive error if any slug is stale.
- CROSS-COLLECTION SLUG COLLISION: The 'collection/slug' string convention for cross-collection references (e.g., 'services/strategy') assumes no collection name contains a forward slash and no slug is ambiguous without its collection prefix. This is safe for standard Astro collection naming conventions but must be documented for content authors. Mitigation: add a Zod .refine() validator on the relatedPages and proofLinks schema fields that asserts each string matches /^[a-z-]+\/[a-z0-9-]+$/ and fails with a descriptive error at build time.
- FRONTMATTER POPULATION EFFORT: The schema change is non-breaking (all fields are optional with defaults), but the value of the fix is proportional to how thoroughly frontmatter relationships are populated. A partial rollout where only 20% of pages have relationships populated delivers proportionally less SEO and engagement benefit. Mitigation: prioritize population by traffic tier using Search Console data — highest-traffic pages first — and track coverage as a content health metric.
- MDX COMPONENT AVAILABILITY: InlineContextualLink is only usable in .mdx files, not .md files. If the insights collection uses plain Markdown, authors cannot use inline contextual links in body content. Mitigation: confirm collection file extension before rollout; migrate .md files to .mdx if inline component usage is required (this is a mechanical find-and-rename, not a content change, but requires a build verification pass).
- BREADCRUMB SLOT INJECTION: The Breadcrumb component uses Astro's named slot ('head') to inject JSON-LD. This requires the parent layout to have a <slot name='head'> or equivalent mechanism. If the existing base layout does not expose a head slot, the JSON-LD will not render. Mitigation: verify base layout slot structure before integrating Breadcrumb; if no head slot exists, move JSON-LD output to a separate <script> tag rendered inline in the Breadcrumb component's body output and position it before </body> — less ideal but functional.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
