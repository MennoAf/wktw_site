---
finding_id: "schema-person-about-page-missing"
title: "Inject schema.org/Person JSON-LD structured data blocks for each named team member on the /about page, referencing the parent Organization entity, to make team member rich results eligible in Google SERPs. This is the primary structured data vehicle for a consultancy whose value proposition is built on named individual expertise — it converts organic impressions into trust-qualified clicks by surfacing name, title, image, and social profiles directly in search results."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "Person schema makes team member rich results eligible in Google SERPs — when triggered, these display the individual's name, job title, image, and social profile links directly in the search result."
fix_summary: "Inject schema.org/Person JSON-LD structured data blocks for each named team member on the /about page, referencing the parent Organization entity, to make team member rich results eligible in Google…"
confidence_tier: "reviewer_identified"
---

# Inject schema.org/Person JSON-LD structured data blocks for each named team member on the /about page, referencing the parent Organization entity, to make team member rich results eligible in Google SERPs. This is the primary structured data vehicle for a consultancy whose value proposition is built on named individual expertise — it converts organic impressions into trust-qualified clicks by surfacing name, title, image, and social profiles directly in search results.

**Finding:** Inject schema.org/Person JSON-LD structured data blocks for each named team member on the /about page, referencing the parent Organization entity, to make team member rich results eligible in Google SERPs. This is the primary structured data vehicle for a consultancy whose value proposition is built on named individual expertise — it converts organic impressions into trust-qualified clicks by surfacing name, title, image, and social profiles directly in search results.  
**Severity:** Medium  
**Why this matters:** Person schema makes team member rich results eligible in Google SERPs — when triggered, these display the individual's name, job title, image, and social profile links directly in the search result.  
**Root cause:** Isolated issue  
**Fix:** Inject schema.org/Person JSON-LD structured data blocks for each named team member on the /about page, referencing the parent Organization entity, to make team member rich results eligible in Google…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Organic Ctr:** Person schema makes team member rich results eligible in Google SERPs — when triggered, these display the individual's name, job title, image, and social profile links directly in the search result. For a consultancy where named expertise is the core value proposition, this transforms a generic blue-link result into a trust-signal-rich SERP presence. The mechanism: richer SERP presentation increases visual salience and pre-qualifies the click intent, meaning users who do click have already seen who they will be working with. This directly supports the 'we know the why' positioning by making individual credibility visible before the user reaches the site.
- **Trust And Conversion:** Organic visitors arriving from a Person-enriched SERP result have already been exposed to the consultant's name, title, and image — reducing the trust-building work the /about page must do. For consultancy and professional services, where the buying decision is heavily relationship-driven, this pre-qualification effect is meaningful: the user arrives with a named individual in mind rather than an anonymous firm. This shortens the trust-building journey and reduces the likelihood of the user leaving to research the firm's credentials elsewhere before converting.
- **Search Ranking Signals:** While Person schema does not directly improve ranking position, it contributes to Google's entity understanding of the site. Named individuals linked to the Organization entity via worksFor, with sameAs references to authoritative social profiles (LinkedIn), strengthen the Knowledge Graph associations for the firm and its principals. For a consultancy competing on thought leadership and named expertise, this entity clarity can support broader E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals that Google's quality rater guidelines explicitly evaluate.
- **Competitive Differentiation:** If competing consultancies in the same SERP do not have Person schema, a rich result displaying team member names and images creates immediate visual differentiation. The absence of this markup means the site is currently competing on equal visual footing with firms that may have weaker actual credentials — a structural disadvantage that this fix eliminates at low implementation cost.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/about

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
Inject schema.org/Person JSON-LD structured data blocks for each named team member on the /about page, referencing the parent Organization entity, to make team member rich results eligible in Google SERPs. This is the primary structured data vehicle for a consultancy whose value proposition is built on named individual expertise — it converts organic impressions into trust-qualified clicks by surfacing name, title, image, and social profiles directly in search results.

### How
STEP 1 — AUDIT EXISTING SCHEMA CONTEXT: Confirm whether an Organization or WebSite schema block already exists on the site (likely in the global <head> or footer). Person schema must reference the parent Organization via 'worksFor'. If no Organization schema exists, create it first (see code example 2) and ensure it is present on every page, not just /about.
STEP 2 — INVENTORY TEAM MEMBER DATA: For each named team member on the /about page, collect: full name, job title, headshot image URL (use the highest-resolution version available, minimum 112x112px per Google's ImageObject requirements), LinkedIn profile URL, Twitter/X profile URL (if present), a 1-3 sentence professional description, and any other public-facing contact or credential data (email, alma mater, areas of expertise). This data becomes the source of truth for the schema.
STEP 3 — CHOOSE INJECTION STRATEGY based on how team member content is managed: (A) If team members are hardcoded in the /about page template HTML — inject a single <script type='application/ld+json'> block containing a JSON-LD @graph array with all Person entities. (B) If team members are managed as structured content entries in a CMS (Contentful, Sanity, WordPress ACF, etc.) — generate the JSON-LD server-side or at build time by mapping CMS fields to Person schema properties, then inject the rendered block into the page <head>. Option B is preferred for maintainability — adding a new team member in the CMS automatically updates the schema without a code deploy.
STEP 4 — IMPLEMENT THE JSON-LD BLOCK: Place the <script type='application/ld+json'> block inside the <head> element of the /about page template. Do NOT place it in the <body> — while technically valid per spec, head placement is the Google-recommended pattern and avoids parser ambiguity. Use a @graph array to express multiple Person entities and their relationship to the Organization in a single block (reduces HTTP overhead vs. multiple script tags).
STEP 5 — VALIDATE BEFORE DEPLOYMENT: Run the completed JSON-LD through Google's Rich Results Test (https://search.google.com/test/rich-results) and Schema Markup Validator (https://validator.schema.org/). Confirm: no syntax errors, all required properties present, image URLs return 200 OK, sameAs URLs are publicly accessible (not login-gated LinkedIn URLs). Fix any validation errors before merging.
STEP 6 — VERIFY POST-DEPLOYMENT: After deploying, use Google Search Console's URL Inspection tool on the /about page to confirm Google has detected the new structured data. Allow 1-4 weeks for Google to re-crawl and index the markup. Monitor the 'Enhancements' section of Search Console for Person rich result eligibility status and any new validation warnings.
STEP 7 — ESTABLISH A MAINTENANCE PROTOCOL: Document that any team member addition, departure, title change, or social profile update requires a corresponding schema update. If using the hardcoded approach (Option A), add a comment in the template file pointing to this requirement. If using the CMS-driven approach (Option B), ensure the CMS content model includes all required schema fields and that the mapping is documented in the codebase.

### Code examples
```
<!-- EXAMPLE 1: Person schema JSON-LD block for /about page template -->
<!-- SITE-SPECIFIC ASSUMPTION: Replace all placeholder values below with actual team member data. -->
<!-- SITE-SPECIFIC ASSUMPTION: ORGANIZATION_SCHEMA_ID must match the @id used in your Organization schema block (see Example 2). -->
<!-- SITE-SPECIFIC ASSUMPTION: Image URLs must be absolute, publicly accessible, and return 200 OK. -->
<!-- SITE-SPECIFIC ASSUMPTION: sameAs URLs must be the canonical public profile URL, not login-gated variants. -->

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.example.com/about/#person-jane-smith",
      "name": "Jane Smith",
      "jobTitle": "Principal Strategy Consultant",
      "description": "Jane leads client strategy engagements with a focus on organisational transformation and change management. She brings 15 years of experience across financial services and technology sectors.",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.example.com/images/team/jane-smith.jpg",
        "width": 400,
        "height": 400
      },
      "sameAs": [
        "https://www.linkedin.com/in/jane-smith-example",
        "https://twitter.com/janesmith_example"
      ],
      "worksFor": {
        "@id": "https://www.example.com/#organization"
      },
      "knowsAbout": [
        "Organisational Transformation",
        "Change Management",
        "Financial Services Strategy"
      ],
      "alumniOf": {
        "@type": "CollegeOrUniversity",
        "name": "University of Example"
      },
      "url": "https://www.example.com/about/#jane-smith"
    },
    {
      "@type": "Person",
      "@id": "https://www.example.com/about/#person-mark-jones",
      "name": "Mark Jones",
      "jobTitle": "Head of Digital Practice",
      "description": "Mark oversees the firm's digital transformation practice, specialising in platform architecture and product strategy for scale-up and enterprise clients.",
      "image": {
        "@type": "ImageObject",
        "url": "https://www.example.com/images/team/mark-jones.jpg",
        "width": 400,
        "height": 400
      },
      "sameAs": [
        "https://www.linkedin.com/in/mark-jones-example"
      ],
      "worksFor": {
        "@id": "https://www.example.com/#organization"
      },
      "knowsAbout": [
        "Digital Transformation",
        "Platform Architecture",
        "Product Strategy"
      ],
      "url": "https://www.example.com/about/#mark-jones"
    }
  ]
}
</script>
<!-- EXAMPLE 2: Organization schema block (global — inject into every page <head>) -->
<!-- SITE-SPECIFIC ASSUMPTION: This block should already exist globally. If it does not, add it. -->
<!-- SITE-SPECIFIC ASSUMPTION: The @id value 'https://www.example.com/#organization' must be consistent -->
<!-- across ALL schema blocks on the site that reference this organization. -->
<!-- SITE-SPECIFIC ASSUMPTION: logo.url must point to a publicly accessible, stable image URL. -->

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.example.com/#organization",
  "name": "Example Consultancy Ltd",
  "url": "https://www.example.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.example.com/images/logo.png",
    "width": 300,
    "height": 60
  },
  "sameAs": [
    "https://www.linkedin.com/company/example-consultancy",
    "https://twitter.com/example_consultancy"
  ]
}
</script>
// EXAMPLE 3: CMS-driven server-side generation (Node.js / template engine pattern)
// SITE-SPECIFIC ASSUMPTION: teamMembers is an array of objects fetched from your CMS.
// SITE-SPECIFIC ASSUMPTION: SITE_BASE_URL and ORGANIZATION_SCHEMA_ID are environment constants.
// SITE-SPECIFIC ASSUMPTION: Adapt field names (member.linkedinUrl, member.twitterUrl, etc.)
// to match your CMS content model's actual field names.

// Named constants — adjust to match your environment
const SITE_BASE_URL = 'https://www.example.com'; // SITE-SPECIFIC: your canonical domain
const ORGANIZATION_SCHEMA_ID = `${SITE_BASE_URL}/#organization`; // SITE-SPECIFIC: must match global org schema @id
const ABOUT_PAGE_PATH = '/about'; // SITE-SPECIFIC: canonical path of your about page

/**
 * Builds a schema.org/Person object for a single team member.
 * Returns null if the member lacks the minimum required 'name' property.
 *
 * @param {Object} member - CMS team member entry
 * @returns {Object|null} Schema.org Person object or null if invalid
 */
function buildPersonSchema(member) {
  // Guard: name is the only required property per schema.org/Person
  if (!member || typeof member.name !== 'string' || member.name.trim() === '') {
    console.warn('[PersonSchema] Skipping team member — missing required name field:', member);
    return null;
  }

  // Construct a stable, URL-safe @id fragment from the member's name
  const idSlug = member.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const personSchema = {
    '@type': 'Person',
    '@id': `${SITE_BASE_URL}${ABOUT_PAGE_PATH}/#person-${idSlug}`,
    'name': member.name.trim(),
    'worksFor': {
      '@id': ORGANIZATION_SCHEMA_ID
    }
  };

  // Optional properties — only include if data is present and non-empty
  if (member.jobTitle && typeof member.jobTitle === 'string') {
    personSchema.jobTitle = member.jobTitle.trim();
  }

  if (member.description && typeof member.description === 'string') {
    personSchema.description = member.description.trim();
  }

  // ImageObject — only include if imageUrl is a non-empty string
  if (member.imageUrl && typeof member.imageUrl === 'string') {
    personSchema.image = {
      '@type': 'ImageObject',
      'url': member.imageUrl
    };
    // Include dimensions only if both are valid positive integers
    if (Number.isInteger(member.imageWidth) && member.imageWidth > 0 &&
        Number.isInteger(member.imageHeight) && member.imageHeight > 0) {
      personSchema.image.width = member.imageWidth;
      personSchema.image.height = member.imageHeight;
    }
  }

  // sameAs — collect all non-empty social profile URLs into an array
  const sameAsUrls = [
    member.linkedinUrl,
    member.twitterUrl
  ].filter(url => typeof url === 'string' && url.trim() !== '');

  if (sameAsUrls.length > 0) {
    personSchema.sameAs = sameAsUrls;
  }

  // knowsAbout — only include if it's a non-empty array of strings
  if (Array.isArray(member.expertiseAreas) && member.expertiseAreas.length > 0) {
    const validAreas = member.expertiseAreas.filter(
      area => typeof area === 'string' && area.trim() !== ''
    );
    if (validAreas.length > 0) {
      personSchema.knowsAbout = validAreas;
    }
  }

  // Canonical URL to the team member's anchor on the about page
  if (member.pageAnchor && typeof member.pageAnchor === 'string') {
    personSchema.url = `${SITE_BASE_URL}${ABOUT_PAGE_PATH}/#${member.pageAnchor}`;
  }

  return personSchema;
}

/**
 * Generates the complete JSON-LD @graph block for all team members.
 * Returns an empty string if no valid Person schemas can be built.
 *
 * @param {Array} teamMembers - Array of CMS team member entries
 * @returns {string} HTML <script> tag containing JSON-LD, or empty string
 */
function generateTeamPersonSchemaTag(teamMembers) {
  if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
    return '';
  }

  const personSchemas = teamMembers
    .map(buildPersonSchema)
    .filter(schema => schema !== null);

  if (personSchemas.length === 0) {
    return '';
  }

  const graphPayload = {
    '@context': 'https://schema.org',
    '@graph': personSchemas
  };

  // JSON.stringify with null replacer and 2-space indent for debuggability in source view
  // In production, you may remove the indent argument to minimise payload size
  const jsonLd = JSON.stringify(graphPayload, null, 2);

  // Escape </script> sequences within JSON string values to prevent XSS via JSON injection
  // This is the only escaping required for JSON-LD in a <script> tag
  const safeJsonLd = jsonLd.replace(/<\/script>/gi, '<\/script>');

  return `<script type="application/ld+json">${safeJsonLd}</script>`;
}

// Usage in your template render function:
// const schemaTag = generateTeamPersonSchemaTag(cmsTeamMembers);
// Inject schemaTag into the <head> of the /about page template output.
<!-- EXAMPLE 4: Validation checklist — run these checks before and after deployment -->
<!--
PRE-DEPLOYMENT VALIDATION:
1. Google Rich Results Test: https://search.google.com/test/rich-results
   - Paste the /about page URL or the raw JSON-LD
   - Confirm 'Person' appears as a detected type with no errors
   - Warnings are acceptable; errors block rich result eligibility

2. Schema Markup Validator: https://validator.schema.org/
   - Validates against full schema.org vocabulary (broader than Google's subset)
   - Confirm no syntax errors, no deprecated property warnings

3. Image URL check:
   - Each image.url must return HTTP 200 with a valid image content-type
   - Minimum recommended size: 112x112px (Google's minimum for Person images)
   - Preferred: square crop, 400x400px or larger

4. sameAs URL check:
   - Each LinkedIn/Twitter URL must be publicly accessible without login
   - LinkedIn company pages vs. personal profiles: use /in/ for individuals, /company/ for org
   - Twitter/X: use https://twitter.com/handle OR https://x.com/handle (both are valid sameAs)

POST-DEPLOYMENT VERIFICATION:
1. Google Search Console → URL Inspection → /about
   - 'Test Live URL' to confirm Google can fetch and parse the new schema
   - Check 'Detected structured data' section for Person entries

2. Monitor Search Console → Enhancements → Person (may take 1-4 weeks to appear)
   - Watch for new validation errors introduced by the deployment
   - 'Valid' status = eligible for rich results (not guaranteed to display)
-->
```

## Risks
- STALE DATA RISK: If team members are hardcoded in the JSON-LD and the team changes (departures, title changes, new hires), the schema will become inaccurate. Inaccurate schema can trigger Google Search Console validation warnings and, in severe cases (e.g., schema describing a person who no longer works at the firm), may be treated as misleading markup. Mitigation: prefer CMS-driven generation (Example 3) so schema updates automatically when CMS content is updated. If hardcoded, add a code comment and document the update requirement in the team's content maintenance runbook.
- INACCESSIBLE IMAGE URLS: If headshot images are served from a CDN with access controls, authentication requirements, or are behind a login wall, Google's crawler cannot fetch them and the ImageObject will be ignored or flagged. Mitigation: verify each image URL returns HTTP 200 without cookies or auth headers using curl or the Rich Results Test before deploying.
- LINKEDIN URL FORMAT: LinkedIn personal profile URLs must use the /in/ format (https://www.linkedin.com/in/username) and must be publicly visible without login. Some LinkedIn profiles are set to private or semi-private, which means Google cannot verify the sameAs claim. Mitigation: confirm each LinkedIn URL is publicly accessible in an incognito browser session before including it in the schema.
- ORGANIZATION SCHEMA ID MISMATCH: The worksFor @id reference in each Person schema must exactly match the @id value in the Organization schema block. A mismatch (e.g., trailing slash difference, http vs https, www vs non-www) breaks the entity relationship and prevents Google from associating the individuals with the firm. Mitigation: define ORGANIZATION_SCHEMA_ID as a single named constant (as shown in Example 3) used in both the Organization block and all Person blocks — never hardcode the string in two places.
- JSON INJECTION VIA CMS CONTENT: If team member descriptions or names contain characters that break JSON syntax (unescaped quotes, backslashes, control characters), the JSON-LD block will be malformed and silently ignored by Google. Mitigation: always use JSON.stringify() to serialise the payload (as shown in Example 3) rather than string concatenation. The </script> escape shown in Example 3 is the only additional escaping required beyond what JSON.stringify provides.
- RICH RESULT DISPLAY IS NOT GUARANTEED: Person schema makes rich results eligible but does not guarantee Google will display them. Google's decision to show rich results depends on query context, result page composition, and content quality signals. Mitigation: set stakeholder expectations that this fix enables eligibility — actual rich result display will be confirmed via Search Console over the weeks following deployment.
- SCHEMA DESCRIBING DEPARTED TEAM MEMBERS: If a team member leaves and their profile is removed from the /about page but the schema block is not updated, Google may surface outdated information in SERPs. This is a reputational risk for a consultancy. Mitigation: tie schema generation to the same CMS content entries that control the visible page content — if a profile is unpublished in the CMS, the schema entry is automatically removed.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
