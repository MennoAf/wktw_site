---
finding_id: "ux-revenue-no-social-proof-above-fold"
title: "No social proof, testimonials, or credibility signals on key pages"
severity: "medium"
root_cause_cluster: "Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization"
why_this_matters: "The 'Talk to a Founder' CTA currently fires without adjacent credibility signals."
fix_summary: "Decompose the siloed /proof page into an injectable TrustBlock component system."
confidence_tier: "confirmed"
---

# No social proof, testimonials, or credibility signals on key pages

**Finding:** No social proof, testimonials, or credibility signals on key pages  
**Severity:** Medium  
**Why this matters:** The 'Talk to a Founder' CTA currently fires without adjacent credibility signals.  
**Root cause:** Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization  
**Fix:** Decompose the siloed /proof page into an injectable TrustBlock component system.

> **Evidence Basis:** Confirmed

---

## Impact

- **Contact Form Conversion:** The 'Talk to a Founder' CTA currently fires without adjacent credibility signals. The article's adversarial framing ('most audits don't change anything') creates a skepticism peak immediately before the CTA — the reader's next cognitive move is to look for proof. The component system delivers proof at that exact moment. Removing the credibility gap between claim and CTA reduces the friction that causes readers to leave and research the firm elsewhere before deciding.
- **Bounce Rate On Article Pages:** Articles making industry-critical claims without author attribution read as institutional marketing copy rather than expert analysis. Adding an author bio with specific credentials shifts the reader's trust frame from 'vendor content' to 'expert perspective,' reducing the likelihood of immediate exit after reading the adversarial claim.
- **E E A T And Organic Search:** Author attribution with a named expert, linked to a consistent author page, directly satisfies Google's Experience and Expertise signals in the E-E-A-T framework. Thought-leadership content without author attribution is treated as anonymous institutional content — lower trust weight in quality evaluations. This fix creates the structural conditions for improved E-E-A-T scoring on article pages.
- **Proof Page Dependency:** Currently, all credibility is concentrated on a single destination page that users must navigate to intentionally. Distributing proof contextually means trust signals reach users who never visit /proof — the majority of article and service page visitors who convert or bounce without exploring the full site.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_008`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** This article argues that 'most audits don't change anything' — positioning the firm as different from competitors.. However, the page contains zero trust signals: no client logos, no testimonials, no case study references, no metrics demonstrating results, no author bio with credentials, no 'as seen in' badges.

**Measured evidence:**
- Above Fold Elements: ['navigation', 'hero headline']
- Social Proof Above Fold: False
- Proof Page Exists: True
- Proof Page Url: https://weknowthewhy.com/proof
- Images Above Fold: 0
- Client Logos: 0
- Testimonials: 0
- Case Study References: 0

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
Decompose the siloed /proof page into an injectable TrustBlock component system. Wire TrustBlock into three template slots: (1) article pages — author bio + one contextually matched testimonial above the CTA, (2) service pages — outcome-focused testimonial strip above every 'Talk to a Founder' CTA, (3) the CTA component itself — a single credibility line adjacent to the button. No new content is required; the fix routes existing /proof content into template slots that currently have none.

### How
1. AUDIT EXISTING PROOF CONTENT: Inventory every testimonial, case study, and outcome statement on /proof. Assign each a tag from a controlled vocabulary (e.g., 'audit', 'ecommerce', 'performance', 'strategy'). Store tags as a data attribute or front-matter field on each proof item — this is the selector key for contextual injection.
2. CREATE THE TrustBlock COMPONENT: Build a single reusable partial (Liquid/Nunjucks/PHP include — match your CMS template language) that accepts three props: variant ('testimonial' | 'outcome-strip' | 'cta-credibility-line'), tag (string, matches proof taxonomy), and limit (integer, default 1). The component queries the proof content pool by tag and renders the matched item(s). If no tag match exists, it falls back to the highest-authority untagged item. If the proof pool is empty, the component renders nothing — no empty containers, no broken layout.
3. WIRE INTO ARTICLE TEMPLATE — AUTHOR BIO SLOT: Immediately above the existing CTA block in the article template, inject two slots in sequence: (a) AuthorBio partial — pulls from a site-level author registry keyed by a front-matter 'author' field on the article. If 'author' field is absent, renders nothing. (b) TrustBlock variant='testimonial' with tag matching the article's primary category tag. This satisfies the 'prove it' cognitive demand triggered by adversarial industry claims.
4. WIRE INTO SERVICE PAGE TEMPLATE: Above every instance of the 'Talk to a Founder' CTA on service pages, inject TrustBlock variant='outcome-strip' limit=2 with tag matching the service page's category. The outcome strip renders two short outcome statements (client result + attribution) in a two-column layout at ≥768px, stacked at <768px.
5. WIRE INTO THE CTA COMPONENT ITSELF: Inside the CTA component (the reusable block containing the 'Talk to a Founder' button), add a single credibility line immediately above the button: TrustBlock variant='cta-credibility-line' — renders as a single short quote (≤120 chars) with attribution name and company. This fires on every CTA instance site-wide without per-page configuration.
6. SCOPE THE CSS: All TrustBlock styles must be scoped under a .trust-block BEM root. No bare element selectors. Use :not() guards on any selector that could collide with existing article body styles (e.g., .trust-block__quote blockquote, not blockquote).
7. RESERVE LAYOUT SPACE TO PREVENT CLS: Every TrustBlock variant must declare explicit min-height in px/rem matching its rendered height at each breakpoint. Use contain-intrinsic-size on the wrapper. This prevents CLS from the component rendering after initial paint.
8. AUTHOR REGISTRY: Create a /data/authors.json (or CMS equivalent) with one object per author. Article front-matter references author by slug. The AuthorBio partial reads from this registry. If the slug is missing from the registry, the partial silently omits — no broken template.
9. FALLBACK CHAIN: TrustBlock rendering order: (a) tag-matched proof item → (b) category-matched proof item → (c) highest-authority untagged item → (d) render nothing. Never render an empty container — use a conditional wrapper that suppresses the element entirely when no proof item resolves.
10. QA GATES: Verify (a) no duplicate IDs introduced by repeated TrustBlock instances — IDs must include a generated suffix or use aria-labelledby with class-based targeting only, (b) all testimonial text has non-empty alt on any accompanying avatar image or alt='' if decorative, (c) TrustBlock does not appear inside <main> more than the limit prop specifies, (d) keyboard tab order is unaffected — TrustBlock is read-only content with no interactive elements except the existing CTA.

### Code examples
```
/**
 * trust-block.liquid (Shopify/Jekyll) — adapt template syntax to your CMS.
 * Props injected via include tag:
 *   variant: 'testimonial' | 'outcome-strip' | 'cta-credibility-line'
 *   tag:     string matching proof item taxonomy (optional)
 *   limit:   integer (default 1)
 *
 * SITE-SPECIFIC ASSUMPTION: proof items are stored in site.data.proof_items
 * as an array of objects with fields: quote, attribution_name,
 * attribution_company, tags[], authority_score (integer, higher = more authoritative).
 * Adjust the data source path to match your CMS content API.
 */

{% assign FALLBACK_LIMIT = 1 %}
{% assign resolved_limit = include.limit | default: FALLBACK_LIMIT %}
{% assign requested_tag = include.tag | default: '' %}

{%- comment -%} Step 1: tag-exact match {%- endcomment -%}
{% if requested_tag != '' %}
  {% assign tag_matched = site.data.proof_items
    | where_exp: 'item', 'item.tags contains requested_tag'
    | sort: 'authority_score'
    | reverse
    | slice: 0, resolved_limit %}
{% endif %}

{%- comment -%} Step 2: fallback to highest-authority untagged items {%- endcomment -%}
{% if tag_matched == empty or tag_matched == nil %}
  {% assign tag_matched = site.data.proof_items
    | sort: 'authority_score'
    | reverse
    | slice: 0, resolved_limit %}
{% endif %}

{%- comment -%} Step 3: if pool is empty, render nothing {%- endcomment -%}
{% if tag_matched == empty or tag_matched == nil %}
  {%- comment -%} Intentional no-op — no empty container emitted {%- endcomment -%}
{% else %}

<div
  class="trust-block trust-block--{{ include.variant }}"
  aria-label="Client testimonial"
  role="complementary"
>
  {% for item in tag_matched %}
    <figure class="trust-block__item">
      <blockquote class="trust-block__quote">
        <p>{{ item.quote | escape }}</p>
      </blockquote>
      <figcaption class="trust-block__attribution">
        <span class="trust-block__name">{{ item.attribution_name | escape }}</span>
        {% if item.attribution_company != '' %}
          <span class="trust-block__separator" aria-hidden="true">,&nbsp;</span>
          <span class="trust-block__company">{{ item.attribution_company | escape }}</span>
        {% endif %}
      </figcaption>
    </figure>
  {% endfor %}
</div>

{% endif %}
/* trust-block.css
 * All selectors scoped to .trust-block to prevent collision with
 * existing article body styles (e.g., existing blockquote rules).
 * SITE-SPECIFIC ASSUMPTION: breakpoint tokens match your existing
 * design system. Replace --bp-md value if your system differs.
 */

:root {
  /* SITE-SPECIFIC: adjust to match brand token */
  --trust-block-border-color: #e2e8f0;
  --trust-block-quote-color: #1a202c;
  --trust-block-attribution-color: #4a5568;
  --trust-block-font-size-quote: 1rem;
  --trust-block-font-size-attribution: 0.875rem;

  /* CLS prevention: min-height per variant at default breakpoint.
   * SITE-SPECIFIC: measure rendered height of each variant in your
   * environment and update these values. Using px (not time units)
   * preserves Ctrl+F and native scroll position per audit standard. */
  --trust-block-testimonial-min-height: 120px;
  --trust-block-outcome-strip-min-height: 160px;
  --trust-block-cta-line-min-height: 48px;
}

.trust-block {
  contain-intrinsic-size: auto var(--trust-block-testimonial-min-height);
  content-visibility: auto;
  box-sizing: border-box;
}

/* Variant: testimonial (article pages) */
.trust-block--testimonial {
  min-height: var(--trust-block-testimonial-min-height);
  border-left: 3px solid var(--trust-block-border-color);
  padding: 1rem 1.25rem;
  margin-block: 1.5rem;
}

/* Variant: outcome-strip (service pages) */
.trust-block--outcome-strip {
  min-height: var(--trust-block-outcome-strip-min-height);
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-block: 1.5rem;
}

@media (min-width: 48rem) { /* 768px — SITE-SPECIFIC: adjust to your grid breakpoint */
  .trust-block--outcome-strip {
    grid-template-columns: 1fr 1fr;
  }
}

/* Variant: cta-credibility-line (inline CTA component) */
.trust-block--cta-credibility-line {
  min-height: var(--trust-block-cta-line-min-height);
  margin-block-end: 0.75rem;
}

.trust-block--cta-credibility-line .trust-block__quote p {
  font-size: var(--trust-block-font-size-quote);
  font-style: italic;
  color: var(--trust-block-quote-color);
  margin: 0;

  /* Hard cap: cta-credibility-line quotes must be ≤120 chars.
   * Enforce in content authoring, not CSS — overflow-hidden
   * would silently truncate attribution. */
}

/* Shared item styles — scoped, no bare element selectors */
.trust-block__item {
  margin: 0;
  padding: 0;
}

.trust-block__quote {
  margin: 0 0 0.5rem;
}

/* Explicit :not() guard — prevents collision with existing
 * article body blockquote styles that may set border/padding */
.trust-block__quote:not(article .trust-block__quote) {
  border: none;
  padding: 0;
}

.trust-block__quote p {
  font-size: var(--trust-block-font-size-quote);
  color: var(--trust-block-quote-color);
  line-height: 1.6;
  margin: 0;
}

.trust-block__attribution {
  font-size: var(--trust-block-font-size-attribution);
  color: var(--trust-block-attribution-color);
}

.trust-block__name {
  font-weight: 600;
}

/* Reduced motion: TrustBlock has no animation by default.
 * If fade-in is added later, gate it here. */
@media (prefers-reduced-motion: reduce) {
  .trust-block {
    animation: none;
    transition: none;
  }
}
// author-bio.liquid — article template slot
// SITE-SPECIFIC ASSUMPTION: site.data.authors is a keyed object
// where each key is an author slug string. Adjust to your CMS
// author registry structure.
//
// Front-matter field required on article: author: 'slug-string'
// If absent, this partial renders nothing.

{% assign author_slug = page.author | default: '' %}
{% assign author = site.data.authors[author_slug] %}

{% if author %}
<div class="author-bio" aria-label="About the author">
  {% if author.avatar_url and author.avatar_url != '' %}
  <img
    class="author-bio__avatar"
    src="{{ author.avatar_url | escape }}"
    alt="{{ author.name | escape }}"
    width="64"
    height="64"
    loading="lazy"
    decoding="async"
  />
  {% endif %}
  <div class="author-bio__body">
    <p class="author-bio__name">{{ author.name | escape }}</p>
    {% if author.title and author.title != '' %}
    <p class="author-bio__title">{{ author.title | escape }}</p>
    {% endif %}
    {% if author.bio and author.bio != '' %}
    <p class="author-bio__bio">{{ author.bio | escape }}</p>
    {% endif %}
  </div>
</div>
{% endif %}
// --- End author-bio.liquid ---

// Insertion point in article template (immediately above CTA block):
// {% include 'author-bio' %}
// {% include 'trust-block' variant: 'testimonial', tag: page.category, limit: 1 %}
// {% include 'cta-talk-to-founder' %}
// data/authors.json — author registry
// SITE-SPECIFIC: populate with real author data.
// avatar_url should point to an image served from your CDN,
// not an external domain (avoids additional DNS lookup).
{
  "jane-smith": {
    "name": "Jane Smith",
    "title": "Founder & Principal Consultant",
    "bio": "15 years diagnosing ecommerce performance failures. Former engineering lead at [Company]. Audited 200+ Shopify and custom-stack stores.",
    "avatar_url": "/assets/authors/jane-smith-64.webp"
  }
}
// --- End authors.json ---

// data/proof_items.json — proof content pool
// SITE-SPECIFIC: populate from existing /proof page content.
// authority_score: integer, higher = preferred in fallback sort.
// tags: array of strings matching article/service category taxonomy.
[
  {
    "quote": "The audit identified a checkout bug we'd missed for eight months. Fixed in a week, measurable recovery in the following month.",
    "attribution_name": "Alex R.",
    "attribution_company": "DTC Apparel Brand",
    "tags": ["audit", "ecommerce", "checkout"],
    "authority_score": 90
  },
  {
    "quote": "We'd had three agencies tell us our site was fine. The findings here were specific, prioritized, and actually implemented.",
    "attribution_name": "Maria T.",
    "attribution_company": "B2B SaaS",
    "tags": ["audit", "strategy"],
    "authority_score": 85
  }
]
```

## Risks
- RISK: Proof pool tag mismatch — if article categories and proof item tags use inconsistent vocabulary, the tag-match step always falls through to the authority-score fallback, serving a generic testimonial instead of a contextually matched one. MITIGATION: Define the tag taxonomy once in a shared constants file before tagging either content type. Enforce the vocabulary in the CMS authoring UI with a controlled dropdown, not a free-text field.
- RISK: CLS regression if min-height values in CSS variables are set incorrectly for the actual rendered content. A testimonial longer than the reserved height will cause layout shift on paint. MITIGATION: Measure rendered height of each variant at each breakpoint in staging before deploying. Update the CSS custom property values to match. Re-run CLS measurement in PageSpeed Insights after deploy.
- RISK: Duplicate aria-label='Client testimonial' on pages where TrustBlock renders in multiple slots (e.g., outcome-strip + cta-credibility-line on the same service page). Screen readers will announce two identical landmark labels. MITIGATION: Make the aria-label prop-driven — pass a unique label per include call (e.g., 'Client outcome' for outcome-strip, 'What clients say' for cta-credibility-line). Do not hardcode the label in the component.
- RISK: Author bio partial breaks if the author slug in front-matter does not match any key in authors.json — currently handled by the nil check, but a typo in front-matter produces a silent omission with no authoring feedback. MITIGATION: Add a build-time lint step (CI hook or CMS validation rule) that checks every article's author field against the authors.json key set and fails the build on mismatch.
- RISK: The :not(article .trust-block__quote) CSS guard assumes article body content is always wrapped in an <article> element. If the CMS renders article body inside a <div class='post-body'> or similar, the guard selector will not fire and the bare blockquote styles may still collide. MITIGATION: Inspect the actual rendered DOM of an article page before writing the :not() guard. Scope to the real parent selector, not an assumed semantic element.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
