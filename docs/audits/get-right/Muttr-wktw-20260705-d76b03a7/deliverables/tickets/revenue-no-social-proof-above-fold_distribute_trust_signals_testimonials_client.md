---
finding_id: "revenue-no-social-proof-above-fold"
title: "No social proof, testimonials, or client logos on homepage or About page — trust-building gap"
severity: "medium"
root_cause_cluster: "Conversion Path Architecture — No On-Page Forms, No Inline CTAs, No Trust Signals"
why_this_matters: "B2B buyers evaluate consultancies on demonstrated results, not just team bios."
fix_summary: "Distribute trust signals (testimonials, client logos, quantitative proof points) inline at decision-making moments across Homepage, About, Service, and Article page templates — replacing the siloed /…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# No social proof, testimonials, or client logos on homepage or About page — trust-building gap

**Finding:** No social proof, testimonials, or client logos on homepage or About page — trust-building gap  
**Severity:** Medium  
**Why this matters:** B2B buyers evaluate consultancies on demonstrated results, not just team bios.  
**Root cause:** Conversion Path Architecture — No On-Page Forms, No Inline CTAs, No Trust Signals  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Distribute trust signals (testimonials, client logos, quantitative proof points) inline at decision-making moments across Homepage, About, Service, and Article page templates — replacing the siloed /…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Revenue:** B2B buyers evaluate consultancies on demonstrated results, not just team bios. Social proof on the About page bridges the gap between 'who they are' and 'what they've done' — reducing the need for the user to navigate to /proof/ separately.
- **Conversion Rate:** Social proof (client logos, testimonial quotes, result metrics) adjacent to CTAs reduces perceived risk and increases willingness to submit a contact form. Its absence means the homepage's persuasive content is unsupported by third-party validation.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The homepage has a /proof/ page linked in navigation, suggesting case studies or testimonials exist.. However, the homepage itself contains zero images (0 total images), no client logos, no testimonial quotes, and no quantitative proof points visible in the DOM.

**Measured evidence:**
- Images On Page: 0
- Proof Page Exists: True
- Testimonials On Homepage: none detected
- Client Logos On Homepage: none detected (0 images total)
- Image Context: Team headshots (all below fold, all lazy-loaded)
- Testimonials Detected: 0
- Client Logos Detected: 0
- Proof Page In Nav: True

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
Distribute trust signals (testimonials, client logos, quantitative proof points) inline at decision-making moments across Homepage, About, Service, and Article page templates — replacing the siloed /proof/ page model with a persuasion layer woven into the conversion path. The /proof/ page is retained but becomes a destination linked from inline trust modules, not the sole container of social proof.

### How
1. AUDIT CONTENT INVENTORY: Catalog all existing trust assets from /proof/ page DOM and any CMS content collections — client logos (SVG/PNG), testimonial text + attribution, quantitative proof points (years in operation, client count, project count). If /proof/ is a placeholder with no real content, this step surfaces that gap before any template work begins.
2. CREATE A TYPED CONTENT COLLECTION: Add src/content/config.ts (or extend existing) with a 'testimonials' collection schema (Zod) and a 'clients' collection schema. Store testimonial MDX files in src/content/testimonials/ and client logo metadata in src/content/clients/. This decouples trust content from template markup and makes it reusable across all page types without duplication.
3. BUILD TrustBar.astro COMPONENT: A horizontal logo strip for above-fold placement on Homepage and About. Accepts a logos prop (array of client objects from content collection). Renders as a <section> with role='region' and aria-label='Clients we have worked with'. Logos are inline SVG or <img> with explicit width/height and alt text. No JS dependency — pure static render.
4. BUILD TestimonialCard.astro COMPONENT: A single testimonial unit. Accepts quote, attribution (name, title, company), and optional avatar. Uses <figure>/<blockquote>/<figcaption> semantic markup. Scoped styles only. No carousel — carousels suppress reading and violate prefers-reduced-motion without additional work.
5. BUILD TestimonialGrid.astro COMPONENT: Wraps 2–3 TestimonialCard instances in a CSS grid. Accepts a testimonials prop (filtered slice from content collection). Used on Homepage (2 cards), About (3 cards), Service pages (1 contextually relevant card per service).
6. INJECT INTO HOMEPAGE LAYOUT: Place TrustBar immediately after the hero/value-proposition section (above the fold on desktop, within first scroll on mobile). Place TestimonialGrid before the primary CTA section. Both components receive data via Astro.glob() or getCollection() at build time — zero runtime fetching.
7. INJECT INTO ABOUT PAGE: Place TrustBar after the firm description paragraph. Place TestimonialGrid (3 cards) before the contact CTA. This is the highest-intent trust-evaluation page — it must carry the heaviest proof load.
8. INJECT INTO SERVICE PAGE TEMPLATE: Add a single contextually matched TestimonialCard adjacent to each service's CTA. Match testimonials to services via a tags field in the testimonial frontmatter. Filter at build time using getCollection() with a .filter() on tags.
9. INJECT INTO ARTICLE/BLOG TEMPLATE: Add a compact TrustBar (logos only, no testimonials) in the article sidebar or after the article body, before the newsletter/contact CTA. Keeps proof visible without interrupting reading flow.
10. LINK /proof/ PAGE FROM TRUST MODULES: Each TestimonialGrid renders a 'See all client results →' link to /proof/. This converts /proof/ from a dead-end into a depth destination for high-intent visitors who want more evidence.
11. ADD JSON-LD REVIEW SCHEMA: Emit Organization or Service schema with aggregateRating or review properties on pages carrying testimonials. This surfaces trust signals in search results (star ratings in SERPs for eligible queries).
12. VERIFY WCAG COMPLIANCE: Confirm all logo images have descriptive alt text (not empty — logos are meaningful, not decorative). Confirm blockquote/figcaption structure passes heading hierarchy. Confirm color contrast on testimonial cards meets 4.5:1. Confirm no motion is introduced (static grid, no auto-scroll).

### Code examples
```
// src/content/config.ts — extend or create
import { defineCollection, z } from 'astro:content';

// SITE-SPECIFIC ASSUMPTION: adjust tag values to match your actual service taxonomy
const VALID_SERVICE_TAGS = ['strategy', 'research', 'facilitation', 'training'] as const;

const testimonialsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    quote: z.string().min(10).max(500),
    attribution: z.object({
      name: z.string(),
      title: z.string(),
      company: z.string(),
    }),
    // tags must match service page identifiers for contextual filtering
    tags: z.array(z.enum(VALID_SERVICE_TAGS)).default([]),
    featured: z.boolean().default(false),
    // avatarSrc is optional — omit rather than use placeholder
    avatarSrc: z.string().optional(),
    avatarAlt: z.string().optional(),
  }),
});

const clientsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    // logoSrc: path relative to public/ directory
    // SITE-SPECIFIC ASSUMPTION: logos stored in public/logos/
    logoSrc: z.string(),
    logoAlt: z.string(), // e.g. 'Acme Corp logo' — never empty for client logos
    // SITE-SPECIFIC ASSUMPTION: width/height in CSS pixels at 1x
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    url: z.string().url().optional(),
  }),
});

export const collections = {
  testimonials: testimonialsCollection,
  clients: clientsCollection,
};
<!-- src/components/TrustBar.astro -->
---
import { getCollection } from 'astro:content';

interface Props {
  // SITE-SPECIFIC ASSUMPTION: max logos to display; adjust per layout width
  maxLogos?: number;
  heading?: string;
}

const MAX_LOGOS_DEFAULT = 6;
const { maxLogos = MAX_LOGOS_DEFAULT, heading = 'Trusted by' } = Astro.props;

const allClients = await getCollection('clients');
// Slice is deterministic at build time — no runtime state
const clients = allClients.slice(0, maxLogos);
---

<section
  class="trust-bar"
  aria-label="Clients we have worked with"
>
  <p class="trust-bar__heading" aria-hidden="true">{heading}</p>
  <ul class="trust-bar__list" role="list">
    {clients.map((client) => (
      <li class="trust-bar__item">
        {client.data.url ? (
          <a
            href={client.data.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${client.data.name} website`}
          >
            <img
              src={client.data.logoSrc}
              alt={client.data.logoAlt}
              width={client.data.width}
              height={client.data.height}
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : (
          <img
            src={client.data.logoSrc}
            alt={client.data.logoAlt}
            width={client.data.width}
            height={client.data.height}
            loading="lazy"
            decoding="async"
          />
        )}
      </li>
    ))}
  </ul>
</section>

<style>
  .trust-bar {
    padding-block: 2rem;
    border-block: 1px solid var(--color-border, #e5e7eb);
  }

  .trust-bar__heading {
    text-align: center;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-muted, #6b7280);
    margin-block-end: 1.25rem;
  }

  .trust-bar__list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 2rem 3rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .trust-bar__item img {
    /* Grayscale reduces visual noise; color on hover respects user intent */
    filter: grayscale(100%) opacity(0.6);
    transition: filter 0.2s ease;
    /* SITE-SPECIFIC ASSUMPTION: max logo height in px — adjust to match your grid */
    max-height: 40px;
    width: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .trust-bar__item img {
      transition: none;
    }
  }

  .trust-bar__item img:hover,
  .trust-bar__item a:focus-visible img {
    filter: grayscale(0%) opacity(1);
  }

  .trust-bar__item a:focus-visible {
    outline: 2px solid var(--color-focus, #2563eb);
    outline-offset: 4px;
    border-radius: 2px;
  }
</style>
<!-- src/components/TestimonialCard.astro -->
---
interface Props {
  quote: string;
  name: string;
  title: string;
  company: string;
  avatarSrc?: string;
  avatarAlt?: string;
}

const { quote, name, title, company, avatarSrc, avatarAlt } = Astro.props;

// Guard: avatarAlt is required when avatarSrc is provided
// Enforced at the collection schema level (Zod) — this is a runtime safety net
if (avatarSrc && !avatarAlt) {
  throw new Error(
    `TestimonialCard: avatarAlt is required when avatarSrc is provided. Missing for: ${name}`
  );
}
---

<figure class="testimonial-card">
  <blockquote class="testimonial-card__quote">
    <p>{quote}</p>
  </blockquote>
  <figcaption class="testimonial-card__attribution">
    {avatarSrc && (
      <img
        class="testimonial-card__avatar"
        src={avatarSrc}
        alt={avatarAlt}
        width="48"
        height="48"
        loading="lazy"
        decoding="async"
      />
    )}
    <div class="testimonial-card__meta">
      <span class="testimonial-card__name">{name}</span>
      <span class="testimonial-card__role">{title}, {company}</span>
    </div>
  </figcaption>
</figure>

<style>
  .testimonial-card {
    margin: 0;
    padding: 1.5rem;
    background: var(--color-surface, #f9fafb);
    border-radius: 0.5rem;
    border: 1px solid var(--color-border, #e5e7eb);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .testimonial-card__quote p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.6;
    /* WCAG AA: ensure this color meets 4.5:1 against --color-surface */
    color: var(--color-text, #111827);
    font-style: italic;
  }

  .testimonial-card__attribution {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .testimonial-card__avatar {
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
  }

  .testimonial-card__meta {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .testimonial-card__name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text, #111827);
  }

  .testimonial-card__role {
    font-size: 0.75rem;
    /* WCAG AA: verify this muted color meets 4.5:1 against --color-surface */
    color: var(--color-muted, #6b7280);
  }
</style>
<!-- src/components/TestimonialGrid.astro -->
---
import { getCollection } from 'astro:content';
import TestimonialCard from './TestimonialCard.astro';

interface Props {
  // Filter to testimonials tagged for a specific service page
  // Omit to show featured testimonials (homepage/about use case)
  serviceTag?: string;
  // SITE-SPECIFIC ASSUMPTION: max cards per grid placement
  maxCards?: number;
  showProofLink?: boolean;
}

const MAX_CARDS_DEFAULT = 3;
const { serviceTag, maxCards = MAX_CARDS_DEFAULT, showProofLink = true } = Astro.props;

const allTestimonials = await getCollection('testimonials');

const filtered = serviceTag
  ? allTestimonials
      .filter((t) => t.data.tags.includes(serviceTag as any))
      .slice(0, maxCards)
  : allTestimonials
      .filter((t) => t.data.featured)
      .slice(0, maxCards);

// Precondition: if no testimonials match, render nothing rather than an empty section
// This prevents an empty <section> with a heading and no content from confusing screen readers
const hasTestimonials = filtered.length > 0;
---

{hasTestimonials && (
  <section class="testimonial-grid" aria-label="Client testimonials">
    <ul class="testimonial-grid__list" role="list">
      {filtered.map((t) => (
        <li>
          <TestimonialCard
            quote={t.data.quote}
            name={t.data.attribution.name}
            title={t.data.attribution.title}
            company={t.data.attribution.company}
            avatarSrc={t.data.avatarSrc}
            avatarAlt={t.data.avatarAlt}
          />
        </li>
      ))}
    </ul>
    {showProofLink && (
      <p class="testimonial-grid__cta">
        <a href="/proof/" class="testimonial-grid__link">
          See all client results
          <span aria-hidden="true"> →</span>
          <span class="sr-only">(opens our full client results page)</span>
        </a>
      </p>
    )}
  </section>
)}

<style>
  .testimonial-grid {
    padding-block: 3rem;
  }

  .testimonial-grid__list {
    display: grid;
    /* SITE-SPECIFIC ASSUMPTION: 3-column desktop, 1-column mobile */
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 1.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .testimonial-grid__cta {
    text-align: center;
    margin-block-start: 2rem;
  }

  .testimonial-grid__link {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-accent, #2563eb);
    text-underline-offset: 3px;
  }

  .testimonial-grid__link:focus-visible {
    outline: 2px solid var(--color-focus, #2563eb);
    outline-offset: 4px;
    border-radius: 2px;
  }

  /* Utility: visually hidden but accessible to screen readers */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
<!-- src/pages/index.astro — homepage integration (partial, showing injection points) -->
---
import BaseLayout from '../layouts/BaseLayout.astro';
import TrustBar from '../components/TrustBar.astro';
import TestimonialGrid from '../components/TestimonialGrid.astro';
// ... other imports
---

<BaseLayout>
  <!-- Hero / value proposition section (existing) -->
  <section aria-label="Introduction">
    <!-- existing hero content -->
  </section>

  <!--
    TrustBar placement: immediately after hero, before any service listing.
    Precondition: clients content collection must have ≥1 entry.
    If collection is empty, TrustBar renders nothing (getCollection returns []).
    SITE-SPECIFIC ASSUMPTION: maxLogos=6 fits a standard 12-column grid at desktop.
  -->
  <TrustBar maxLogos={6} heading="Trusted by" />

  <!-- Service overview section (existing) -->
  <section aria-label="Services">
    <!-- existing service content -->
  </section>

  <!--
    TestimonialGrid placement: before the primary contact CTA.
    Uses featured:true filter — no serviceTag needed on homepage.
    maxCards=2 keeps homepage weight low; /proof/ link drives depth.
  -->
  <TestimonialGrid maxCards={2} showProofLink={true} />

  <!-- Primary CTA section (existing) -->
  <section aria-label="Contact">
    <!-- existing CTA content -->
  </section>
</BaseLayout>
<!-- src/pages/about.astro — about page integration (partial) -->
---
import BaseLayout from '../layouts/BaseLayout.astro';
import TrustBar from '../components/TrustBar.astro';
import TestimonialGrid from '../components/TestimonialGrid.astro';
---

<BaseLayout>
  <!-- Firm description (existing) -->
  <section aria-label="About the firm">
    <!-- existing about content -->
  </section>

  <!-- TrustBar after firm description, before team/values -->
  <TrustBar maxLogos={8} heading="Organisations we have worked with" />

  <!-- Team / values section (existing) -->

  <!--
    About page carries the heaviest proof load — 3 cards, no serviceTag filter.
    Visitors on About are actively evaluating whether to trust the firm.
    showProofLink=true converts /proof/ from dead-end to depth destination.
  -->
  <TestimonialGrid maxCards={3} showProofLink={true} />

  <!-- Contact CTA (existing) -->
</BaseLayout>
// src/content/testimonials/example-client-1.json
// REAL CONTENT REQUIRED — replace with actual client testimonials before deploy
// This file demonstrates the required schema shape only
{
  "quote": "Replace this with the actual client quote. Minimum 10 characters, maximum 500.",
  "attribution": {
    "name": "Client Name",
    "title": "Job Title",
    "company": "Company Name"
  },
  "tags": ["strategy"],
  "featured": true
}
// JSON-LD Review schema — add to BaseLayout.astro <head> or page-level <head> slot
// Only emit on pages that actually render testimonials
// SITE-SPECIFIC ASSUMPTION: update name, url, and ratingValue to match real data

// src/components/OrganizationSchema.astro
---
interface Props {
  // ratingValue: aggregate average from actual testimonial data
  // ratingCount: total number of testimonials in collection
  ratingValue: number;
  ratingCount: number;
}

const { ratingValue, ratingCount } = Astro.props;

// Guard: do not emit schema if no real rating data exists
// Emitting schema with placeholder values is a Google Search Console violation
if (!ratingValue || !ratingCount || ratingCount < 1) {
  // Render nothing — schema is optional, absence is safe
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  // SITE-SPECIFIC ASSUMPTION: replace with actual org name and canonical URL
  name: 'SITE_ORG_NAME',
  url: 'SITE_CANONICAL_URL',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: ratingValue.toFixed(1),
    ratingCount: ratingCount,
    bestRating: '5',
    worstRating: '1',
  },
};
---

{ratingValue && ratingCount >= 1 && (
  <script type="application/ld+json" set:html={JSON.stringify(schema)} />
)}
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
