---
finding_id: "gap-structured-data-proof-page-001"
title: "Inject a layered JSON-LD structured data block into the 'proof/our-site' page template covering four Schema.org types in priority order: (1) BreadcrumbList — universal applicability, zero content dependency; (2) Organization — entity disambiguation and Knowledge Graph reinforcement for a brand credibility page; (3) AggregateRating / Review — rich result star-rating eligibility if testimonial content is present; (4) FAQPage — SERP vertical real estate expansion if objection-handling Q&A content exists. Each type is implemented as a separate <script type='application/ld+json'> block to allow independent CMS population, independent Google Search Console validation, and surgical removal if content changes make a type inapplicable. No single monolithic schema block — separation prevents one invalid property from invalidating the entire structured data payload."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "The primary mechanism: without structured data, Google cannot generate enhanced SERP listings for this page."
fix_summary: "Inject a layered JSON-LD structured data block into the 'proof/our-site' page template covering four Schema.org types in priority order: (1) BreadcrumbList — universal applicability, zero content dep…"
confidence_tier: "reviewer_identified"
---

# Inject a layered JSON-LD structured data block into the 'proof/our-site' page template covering four Schema.org types in priority order: (1) BreadcrumbList — universal applicability, zero content dependency; (2) Organization — entity disambiguation and Knowledge Graph reinforcement for a brand credibility page; (3) AggregateRating / Review — rich result star-rating eligibility if testimonial content is present; (4) FAQPage — SERP vertical real estate expansion if objection-handling Q&A content exists. Each type is implemented as a separate <script type='application/ld+json'> block to allow independent CMS population, independent Google Search Console validation, and surgical removal if content changes make a type inapplicable. No single monolithic schema block — separation prevents one invalid property from invalidating the entire structured data payload.

**Finding:** Inject a layered JSON-LD structured data block into the 'proof/our-site' page template covering four Schema.org types in priority order: (1) BreadcrumbList — universal applicability, zero content dependency; (2) Organization — entity disambiguation and Knowledge Graph reinforcement for a brand credibility page; (3) AggregateRating / Review — rich result star-rating eligibility if testimonial content is present; (4) FAQPage — SERP vertical real estate expansion if objection-handling Q&A content exists. Each type is implemented as a separate <script type='application/ld+json'> block to allow independent CMS population, independent Google Search Console validation, and surgical removal if content changes make a type inapplicable. No single monolithic schema block — separation prevents one invalid property from invalidating the entire structured data payload.  
**Severity:** Medium  
**Why this matters:** The primary mechanism: without structured data, Google cannot generate enhanced SERP listings for this page.  
**Root cause:** Isolated issue  
**Fix:** Inject a layered JSON-LD structured data block into the 'proof/our-site' page template covering four Schema.org types in priority order: (1) BreadcrumbList — universal applicability, zero content dep…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Serp Rich Result Eligibility:** The primary mechanism: without structured data, Google cannot generate enhanced SERP listings for this page. BreadcrumbList replaces the raw URL slug ('/proof/our-site/') with a readable path hierarchy in the SERP listing, improving click-through signal clarity. AggregateRating/Review markup, when validated, makes the page eligible for star rating display directly in search results — a visual differentiator that increases listing prominence relative to competitors showing only title, description, and URL. FAQPage markup, when validated, can expand the SERP listing with inline Q&A accordion entries, significantly increasing the vertical real estate the listing occupies on the results page. These are eligibility gates — without the markup, none of these enhanced formats are possible regardless of content quality.
- **Knowledge Graph Entity Disambiguation:** Organization schema with sameAs social profile links provides Google's Knowledge Graph with explicit entity signals. For a brand credibility page, this reinforces that the site's organization entity is the same entity referenced across LinkedIn, Twitter, and other platforms. This reduces the risk of Google associating the brand with a similarly-named entity and improves the accuracy of brand-related search features (Knowledge Panel, entity cards).
- **Crawl Efficiency:** ItemList schema, if implemented for case studies, provides Google's crawler with an explicit list of child URLs to follow. This is a crawl efficiency signal — not a guarantee of indexation, but a structured signal that reduces reliance on the crawler discovering case study URLs through link traversal alone.
- **Competitive Positioning:** A social proof / case study page competes directly against competitor pages of the same type in SERPs. If competitors have implemented AggregateRating or FAQPage markup and this page has not, competitors receive enhanced listing treatment while this page renders as a plain blue link. The structured data gap is a competitive disadvantage in SERP real estate, not a ranking factor directly, but an indirect CTR signal.
- **Seo Ranking Signal Indirect:** Google has stated that structured data is not a direct ranking factor. However, rich results improve CTR, and CTR is a behavioral signal that Google's systems observe. Improving SERP listing quality through rich results creates a compounding indirect effect: higher CTR → stronger behavioral signal → potential ranking reinforcement over time. This is a directional mechanism, not a guaranteed outcome.
- **Implementation Risk Of Inaction:** The longer this page operates without structured data, the longer competitors with structured data accumulate CTR advantage on overlapping queries. This is a recoverable gap — structured data can be added at any time — but the opportunity cost of delayed implementation is real and ongoing.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/proof/our-site

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
Inject a layered JSON-LD structured data block into the 'proof/our-site' page template covering four Schema.org types in priority order: (1) BreadcrumbList — universal applicability, zero content dependency; (2) Organization — entity disambiguation and Knowledge Graph reinforcement for a brand credibility page; (3) AggregateRating / Review — rich result star-rating eligibility if testimonial content is present; (4) FAQPage — SERP vertical real estate expansion if objection-handling Q&A content exists. Each type is implemented as a separate <script type='application/ld+json'> block to allow independent CMS population, independent Google Search Console validation, and surgical removal if content changes make a type inapplicable. No single monolithic schema block — separation prevents one invalid property from invalidating the entire structured data payload.

### How
Step 1 — Content Audit Before Implementation (30 min, non-technical):
  Map the actual page content to schema eligibility. Answer these questions before writing a single line of JSON-LD:
  a) Does the page have a navigable parent path (e.g., Home > Proof > Our Site)? → BreadcrumbList: YES
  b) Is this page positioned as a brand/company credibility page? → Organization: YES
  c) Does the page surface individual testimonials with attributable authors? → Review: conditional
  d) Does the page surface an aggregate star rating or numeric score? → AggregateRating: conditional
  e) Does the page contain any question-and-answer formatted content? → FAQPage: conditional
  f) Does the page list multiple discrete case studies or client outcomes? → ItemList or Article: conditional
  Document answers. Only implement schema types that match actual page content — Google's quality guidelines penalize schema that does not reflect visible page content.

Step 2 — Implement BreadcrumbList (Always implement first — zero content dependency):
  Inject into the <head> of the proof/our-site page template. Use the canonical URL structure of the site. Mark the SITE_BASE_URL and path segments as site-specific configuration constants.

Step 3 — Implement Organization (Implement if page is brand credibility framing):
  Inject as a second, separate <script> block. Populate sameAs with all verified social profile URLs. This is a static block — hardcode it in the template, not CMS-driven.

Step 4 — Implement AggregateRating + Review (Conditional — only if testimonial content exists):
  If the page surfaces star ratings or individual testimonials, inject a third block. CMS-drive the dynamic values (ratingValue, ratingCount, individual reviews). If the CMS cannot supply these values, do NOT implement with placeholder data — omit this block entirely until real data is available.

Step 5 — Implement FAQPage (Conditional — only if Q&A content exists):
  If the page contains visible question-and-answer formatted content, inject a fourth block. Both the question text and answer text must be visible on the page — hidden FAQ content used only for schema is a Google quality violation.

Step 6 — Implement ItemList (Conditional — only if multiple case studies are listed):
  If the page lists discrete case studies, inject an ItemList block. Each ListItem must link to a real URL.

Step 7 — Validate before deployment:
  a) Run each JSON-LD block through Google's Rich Results Test (https://search.google.com/test/rich-results)
  b) Run through Schema.org validator (https://validator.schema.org/)
  c) Verify no 'Missing field' or 'Invalid value' errors on required properties
  d) Confirm Google Search Console > Enhancements tab shows the new types after indexing (allow 1-2 weeks post-deploy)

Step 8 — CMS Integration Pattern:
  For static properties (BreadcrumbList paths, Organization name/url/logo/sameAs): hardcode in template.
  For dynamic properties (review content, FAQ content, case study titles/URLs): bind to CMS fields. Document which CMS fields map to which schema properties so content editors can maintain accuracy without touching code.

### Code examples
```
<!-- ============================================================
     BLOCK 1: BreadcrumbList
     Always implement. Zero content dependency.
     SITE-SPECIFIC: Update SITE_BASE_URL, breadcrumb path segments,
     and item names to match actual site URL structure and navigation.
     ============================================================ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://SITE_BASE_URL/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Proof",
      "item": "https://SITE_BASE_URL/proof/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Our Site",
      "item": "https://SITE_BASE_URL/proof/our-site/"
    }
  ]
}
</script>
<!-- ============================================================
     BLOCK 2: Organization
     Implement if page is brand credibility / 'about us' framing.
     SITE-SPECIFIC: All values below are placeholders — replace with
     actual organization data. sameAs array must contain only
     verified, active social profile URLs for this organization.
     logo must be a publicly accessible, stable image URL.
     ============================================================ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ORGANIZATION_NAME",
  "url": "https://SITE_BASE_URL/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://SITE_BASE_URL/assets/images/logo.png",
    "width": 200,
    "height": 60
  },
  "description": "ORGANIZATION_DESCRIPTION — match this to the meta description of the page for consistency",
  "sameAs": [
    "https://www.linkedin.com/company/ORGANIZATION_LINKEDIN_HANDLE",
    "https://twitter.com/ORGANIZATION_TWITTER_HANDLE",
    "https://www.facebook.com/ORGANIZATION_FACEBOOK_HANDLE"
  ]
}
</script>
<!-- ============================================================
     BLOCK 3: AggregateRating + Review
     CONDITIONAL — implement ONLY if the page visibly surfaces
     star ratings and/or individual testimonials with attributable
     authors. DO NOT implement with fabricated or placeholder
     rating values — Google's quality guidelines treat schema that
     does not reflect visible page content as spam.

     SITE-SPECIFIC: ratingValue, ratingCount, bestRating, and all
     Review items must be sourced from CMS fields or a data layer
     that reflects actual customer-submitted ratings.

     CMS FIELD MAPPING (document for content team):
       ratingValue       → CMS field: aggregate_rating_score
       ratingCount       → CMS field: total_review_count
       Review[].author   → CMS field: testimonial_author_name
       Review[].reviewBody → CMS field: testimonial_body
       Review[].ratingValue → CMS field: testimonial_star_rating
       Review[].datePublished → CMS field: testimonial_date
     ============================================================ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "ORGANIZATION_NAME",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "CMS_AGGREGATE_RATING_VALUE",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "CMS_TOTAL_REVIEW_COUNT"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "CMS_TESTIMONIAL_AUTHOR_NAME"
      },
      "reviewBody": "CMS_TESTIMONIAL_BODY_TEXT",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "CMS_TESTIMONIAL_STAR_RATING",
        "bestRating": "5",
        "worstRating": "1"
      },
      "datePublished": "CMS_TESTIMONIAL_DATE_ISO8601"
    }
  ]
}
</script>

<!-- NOTE ON @type SELECTION:
     AggregateRating requires a parent entity type. Common choices:
     - Product: if the page promotes a specific product or service offering
     - LocalBusiness: if the organization has a physical location
     - Organization: Google currently does not support AggregateRating
       directly on Organization for rich results — use Product or
       LocalBusiness as the parent type to qualify for star display.
     Verify eligibility at: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
-->
<!-- ============================================================
     BLOCK 4: FAQPage
     CONDITIONAL — implement ONLY if the page contains visible
     question-and-answer formatted content. Both the question text
     and the full answer text must be readable on the page without
     user interaction (not hidden behind accordions that are
     collapsed by default and not in the DOM — verify with
     'View Page Source', not DevTools).

     SITE-SPECIFIC: All question/answer pairs below are structural
     examples. Replace with actual page content. Each acceptedAnswer
     text must match the visible answer text on the page.

     CMS FIELD MAPPING:
       Question[].name           → CMS field: faq_question_text
       Question[].acceptedAnswer → CMS field: faq_answer_text
     ============================================================ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "CMS_FAQ_QUESTION_1",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CMS_FAQ_ANSWER_1"
      }
    },
    {
      "@type": "Question",
      "name": "CMS_FAQ_QUESTION_2",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CMS_FAQ_ANSWER_2"
      }
    }
  ]
}
</script>
<!-- ============================================================
     BLOCK 5: ItemList (Case Studies)
     CONDITIONAL — implement ONLY if the page lists multiple
     discrete case studies or client outcomes, each with its own
     dedicated URL.

     SITE-SPECIFIC: url values must be absolute, canonical URLs
     for each case study page. name must match the visible title
     of each case study as it appears on the page.

     CMS FIELD MAPPING:
       ListItem[].name → CMS field: case_study_title
       ListItem[].url  → CMS field: case_study_canonical_url
     ============================================================ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Client Case Studies",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "CMS_CASE_STUDY_TITLE_1",
      "url": "https://SITE_BASE_URL/proof/CMS_CASE_STUDY_SLUG_1/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "CMS_CASE_STUDY_TITLE_2",
      "url": "https://SITE_BASE_URL/proof/CMS_CASE_STUDY_SLUG_2/"
    }
  ]
}
</script>
/**
 * CMS-Agnostic JSON-LD Injection Utility
 *
 * Use this pattern when your CMS or framework requires programmatic
 * injection rather than static template markup.
 *
 * Production Code Standards applied:
 *   - Named constants for all configurable values (Standard #8)
 *   - Null-guards on all external/CMS data access (Standard #10)
 *   - Try-catch on DOM manipulation (Standard #4 pattern extended)
 *   - No magic numbers (Standard #7)
 *   - Feature detection before DOM API use (Standard #9)
 */

// ── Site-specific configuration ──────────────────────────────────────────────
// SITE-SPECIFIC: All values in this config object must be replaced with
// actual site data before deployment. Do not deploy with placeholder strings.
const STRUCTURED_DATA_CONFIG = {
  siteBaseUrl:          'https://SITE_BASE_URL',          // SITE-SPECIFIC
  organizationName:     'ORGANIZATION_NAME',              // SITE-SPECIFIC
  organizationLogoUrl:  'https://SITE_BASE_URL/assets/images/logo.png', // SITE-SPECIFIC
  organizationLogoW:    200,                              // SITE-SPECIFIC: px
  organizationLogoH:    60,                              // SITE-SPECIFIC: px
  organizationDesc:     'ORGANIZATION_DESCRIPTION',      // SITE-SPECIFIC
  socialProfiles: [                                       // SITE-SPECIFIC: verified profiles only
    'https://www.linkedin.com/company/ORGANIZATION_LINKEDIN_HANDLE',
    'https://twitter.com/ORGANIZATION_TWITTER_HANDLE'
  ],
  breadcrumbs: [                                          // SITE-SPECIFIC: match actual URL structure
    { name: 'Home',     url: '/' },
    { name: 'Proof',    url: '/proof/' },
    { name: 'Our Site', url: '/proof/our-site/' }
  ]
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely injects a JSON-LD <script> block into <head>.
 * Idempotent: checks for existing block by data attribute before injecting.
 *
 * @param {string} schemaType  - Schema.org @type value (used as idempotency key)
 * @param {Object} schemaData  - The complete schema object to serialize
 * @returns {void}
 */
function injectJsonLd(schemaType, schemaData) {
  // Feature detection: guard against non-browser environments (SSR, test runners)
  if (typeof document === 'undefined' || !document.head) {
    return;
  }

  // Idempotency guard: prevent duplicate injection on SPA route re-renders
  const IDEMPOTENCY_ATTR = 'data-schema-type';
  const existingBlock = document.head.querySelector(
    `script[type="application/ld+json"][${IDEMPOTENCY_ATTR}="${schemaType}"]`
  );
  if (existingBlock) {
    return; // Already injected — do not duplicate
  }

  try {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(IDEMPOTENCY_ATTR, schemaType);
    script.textContent = JSON.stringify(schemaData, null, 2);
    document.head.appendChild(script);
  } catch (err) {
    // Non-fatal: structured data injection failure should not break page functionality
    // Log to monitoring but do not rethrow
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[StructuredData] Failed to inject schema type:', schemaType, err);
    }
  }
}

/**
 * Builds and injects BreadcrumbList schema.
 * Always safe to call — no content dependency.
 */
function injectBreadcrumbList() {
  const cfg = STRUCTURED_DATA_CONFIG;

  // Null-guard: breadcrumbs array must exist and have at least one item
  if (!Array.isArray(cfg.breadcrumbs) || cfg.breadcrumbs.length === 0) {
    return;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': cfg.breadcrumbs.map(function(crumb, index) {
      return {
        '@type': 'ListItem',
        'position': index + 1,                          // 1-indexed per spec
        'name': crumb.name || '',
        'item': cfg.siteBaseUrl + (crumb.url || '/')
      };
    })
  };

  injectJsonLd('BreadcrumbList', schema);
}

/**
 * Builds and injects Organization schema.
 * Call only when page is brand credibility framing.
 */
function injectOrganization() {
  const cfg = STRUCTURED_DATA_CONFIG;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': cfg.organizationName || '',
    'url': cfg.siteBaseUrl + '/',
    'logo': {
      '@type': 'ImageObject',
      'url': cfg.organizationLogoUrl || '',
      'width': cfg.organizationLogoW,
      'height': cfg.organizationLogoH
    },
    'description': cfg.organizationDesc || '',
    'sameAs': Array.isArray(cfg.socialProfiles) ? cfg.socialProfiles : []
  };

  injectJsonLd('Organization', schema);
}

/**
 * Builds and injects AggregateRating + Review schema.
 *
 * @param {Object} ratingData - Must come from CMS/data layer, not hardcoded.
 *   Required shape:
 *   {
 *     aggregateScore: number,   // e.g. 4.8
 *     reviewCount:    number,   // e.g. 127
 *     reviews: Array<{
 *       authorName:   string,
 *       reviewBody:   string,
 *       ratingValue:  number,
 *       datePublished: string   // ISO 8601: 'YYYY-MM-DD'
 *     }>
 *   }
 *
 * SAFETY: Returns early without injecting if required fields are absent
 * or if ratingCount < 1 (prevents invalid schema submission).
 */
function injectAggregateRating(ratingData) {
  // Null-guard: entire function is conditional on real data
  if (!ratingData
    || typeof ratingData.aggregateScore !== 'number'
    || typeof ratingData.reviewCount !== 'number'
    || ratingData.reviewCount < 1                       // Must have at least 1 review
    || !Array.isArray(ratingData.reviews)
    || ratingData.reviews.length === 0) {
    return;
  }

  const cfg = STRUCTURED_DATA_CONFIG;

  // SITE-SPECIFIC: @type parent entity — change to 'LocalBusiness' if organization
  // has a physical location. 'Organization' does not qualify for star rich results.
  const RATING_PARENT_TYPE = 'Product'; // SITE-SPECIFIC

  const schema = {
    '@context': 'https://schema.org',
    '@type': RATING_PARENT_TYPE,
    'name': cfg.organizationName || '',
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': String(ratingData.aggregateScore),
      'bestRating': '5',
      'worstRating': '1',
      'ratingCount': String(ratingData.reviewCount)
    },
    'review': ratingData.reviews.map(function(review) {
      // Null-guard each review item — skip malformed entries
      if (!review || !review.authorName || !review.reviewBody) {
        return null;
      }
      return {
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': review.authorName
        },
        'reviewBody': review.reviewBody,
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': String(review.ratingValue || ratingData.aggregateScore),
          'bestRating': '5',
          'worstRating': '1'
        },
        'datePublished': review.datePublished || ''
      };
    }).filter(Boolean)                                  // Remove null entries from malformed reviews
  };

  injectJsonLd('AggregateRating', schema);
}

/**
 * Builds and injects FAQPage schema.
 *
 * @param {Array<{question: string, answer: string}>} faqItems
 *   Must reflect content VISIBLE on the page. Do not pass hidden content.
 *
 * SAFETY: Returns early if faqItems is empty or malformed.
 */
function injectFaqPage(faqItems) {
  if (!Array.isArray(faqItems) || faqItems.length === 0) {
    return;
  }

  const validItems = faqItems.filter(function(item) {
    return item
      && typeof item.question === 'string' && item.question.trim().length > 0
      && typeof item.answer === 'string'   && item.answer.trim().length > 0;
  });

  if (validItems.length === 0) {
    return;
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': validItems.map(function(item) {
      return {
        '@type': 'Question',
        'name': item.question.trim(),
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.answer.trim()
        }
      };
    })
  };

  injectJsonLd('FAQPage', schema);
}

// ── Entry point ───────────────────────────────────────────────────────────────
// Call this function from your page template's initialization logic.
// Pass CMS-sourced data objects for conditional schema types.
//
// SITE-SPECIFIC: Replace null arguments with actual CMS data bindings.
// Pass null for any schema type not applicable to this page.
function initProofPageStructuredData(options) {
  // options shape:
  // {
  //   ratingData: Object|null,   // from CMS — see injectAggregateRating signature
  //   faqItems:   Array|null,    // from CMS — [{question, answer}]
  // }
  var opts = options || {};

  // Always inject — no content dependency
  injectBreadcrumbList();
  injectOrganization();

  // Conditional — only inject if CMS data is available and non-null
  if (opts.ratingData) {
    injectAggregateRating(opts.ratingData);
  }

  if (Array.isArray(opts.faqItems) && opts.faqItems.length > 0) {
    injectFaqPage(opts.faqItems);
  }
}

// Example call (replace with actual CMS data bindings):
// initProofPageStructuredData({
//   ratingData: window.__CMS_RATING_DATA__ || null,
//   faqItems:   window.__CMS_FAQ_ITEMS__   || null
// });
```

## Risks
- CONTENT MISMATCH VIOLATION: Google's structured data quality guidelines explicitly prohibit schema that does not reflect visible page content. If AggregateRating values, FAQ text, or review content are populated with data that does not appear on the rendered page, Google may apply a manual action or algorithmic demotion to the page. Mitigation: implement a pre-deployment checklist requiring a human reviewer to verify that every schema property value is visible on the page before the block is deployed. Never populate schema from a data source that is not also the source for the visible page content.
- AGGREGATE RATING PARENT TYPE MISMATCH: Google does not support AggregateRating rich results on Organization @type directly. Using Organization as the parent entity for AggregateRating will pass schema validation but will not generate star rich results. The parent type must be Product, LocalBusiness, or another supported type. Mitigation: the code example uses 'Product' as the default with a SITE-SPECIFIC comment. Verify the correct parent type against Google's current rich result eligibility documentation before deployment, as Google's supported types list changes.
- FAQ RICH RESULT DEPRECATION RISK: Google has historically modified or restricted FAQPage rich result eligibility (e.g., limiting display to authoritative government/health sites in some regions). Verify current FAQPage eligibility status in Google Search Central documentation at time of implementation. Mitigation: FAQPage schema is still valid structured data even if rich results are not displayed — it provides crawlable semantic structure regardless. Implement it if the content exists; do not skip it due to eligibility uncertainty.
- SPA / FRAMEWORK HYDRATION TIMING: If the page is rendered by a JavaScript framework (React, Vue, Next.js, Nuxt), JSON-LD injected via client-side JS may not be present in the initial HTML response. Googlebot can execute JavaScript, but there is a documented processing delay between initial crawl and JavaScript execution. Mitigation: for SSR/SSG frameworks, inject JSON-LD blocks server-side in the <head> during HTML generation, not via client-side DOM manipulation. The JS utility provided is a fallback for CMS environments without server-side injection capability.
- DUPLICATE SCHEMA INJECTION ON SPA ROUTE CHANGES: Single-page applications that re-render the proof page without a full page reload may inject duplicate JSON-LD blocks if the injection function is called on each route change without cleanup. Mitigation: the injectJsonLd() utility includes an idempotency guard using a data-schema-type attribute. Additionally, implement a cleanup function that removes existing JSON-LD blocks before injecting new ones on route change — especially critical if the same template is reused for multiple proof pages with different content.
- REVIEW DATA FRESHNESS: If AggregateRating values (ratingValue, ratingCount) are hardcoded rather than CMS-driven, they will become stale as new reviews are collected. Stale schema that shows a lower count than the visible page content is a minor inconsistency; schema that shows a higher count than visible content is a quality violation. Mitigation: bind all AggregateRating values to the same data source that populates the visible rating display on the page. Never hardcode numeric rating values.
- VALIDATION BEFORE DEPLOYMENT IS NON-OPTIONAL: Malformed JSON (trailing commas, unescaped characters in review body text, invalid ISO 8601 dates) will cause the entire JSON-LD block to be silently ignored by Google. There is no browser console error for invalid JSON-LD — failures are invisible without explicit validation. Mitigation: run every block through Google's Rich Results Test and Schema.org validator as a mandatory pre-deployment step. Add this to the deployment checklist, not as a post-deployment afterthought.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
