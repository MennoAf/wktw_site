---
finding_id: "structured-data-privacy-policy-webpage-schema"
title: "Inject a JSON-LD structured data block on the privacy policy page template that declares the page as a schema.org WebPage with @type WebPage (subtyped as a legal/policy document via additionalType), and populates the dateModified, datePublished, name, url, description, and inLanguage properties. This gives search engines a machine-readable signal of policy currency and page purpose, converting a generic content page into a verifiable legal document in the knowledge graph."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "Prospective clients reviewing the privacy policy before submitting a contact form are at a high-intent moment in the conversion funnel."
fix_summary: "Inject a JSON-LD structured data block on the privacy policy page template that declares the page as a schema.org WebPage with @type WebPage (subtyped as a legal/policy document via additionalType),…"
confidence_tier: "reviewer_identified"
remediation_surface: "source_code"
also_satisfies: ["ux-mobile-2"]
---

# Inject a JSON-LD structured data block on the privacy policy page template that declares the page as a schema.org WebPage with @type WebPage (subtyped as a legal/policy document via additionalType), and populates the dateModified, datePublished, name, url, description, and inLanguage properties. This gives search engines a machine-readable signal of policy currency and page purpose, converting a generic content page into a verifiable legal document in the knowledge graph.

**Finding:** Inject a JSON-LD structured data block on the privacy policy page template that declares the page as a schema.org WebPage with @type WebPage (subtyped as a legal/policy document via additionalType), and populates the dateModified, datePublished, name, url, description, and inLanguage properties. This gives search engines a machine-readable signal of policy currency and page purpose, converting a generic content page into a verifiable legal document in the knowledge graph.  
**Severity:** Medium  
**Why this matters:** Prospective clients reviewing the privacy policy before submitting a contact form are at a high-intent moment in the conversion funnel.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Inject a JSON-LD structured data block on the privacy policy page template that declares the page as a schema.org WebPage with @type WebPage (subtyped as a legal/policy document via additionalType),…  

> **Evidence Basis:** Reviewer-Identified

---

> **Fix code targets the wrong stack (MUTTR-03).** This site was detected as **Astro**, but the code below uses WordPress/PHP idioms — it is not drop-in and must be hand-ported. Astro uses components/layouts (`.astro`), scoped styles or Tailwind, `astro.config.*`, and `public/` — not child themes, Liquid, or PHP.

## Also resolves (1)

One fix closes the findings below — they were folded here as the same remediation:

- `ux-mobile-2` (Low) — Long-form legal content lacks visible navigation aids — no table of contents, section anchors, or breadcrumbs for users

## Impact

- **Trust Signal At Conversion Checkpoint:** Prospective clients reviewing the privacy policy before submitting a contact form are at a high-intent moment in the conversion funnel. A policy page with no machine-readable dateModified gives no signal of recency — a visitor who inspects the page source or uses a browser extension to check structured data sees nothing. Adding dateModified makes policy currency verifiable without requiring the visitor to read the full document. The technical mechanism: structured data surfaces dateModified in Google's knowledge graph, which can appear in search result snippets and rich results, giving users a recency signal before they even click through.
- **Search Engine Crawl Confidence:** Without WebPage schema, Google's crawler treats the privacy policy as generic content with no declared purpose or update cadence. With dateModified present, Google can programmatically assess whether the policy has been updated since its last crawl — relevant for sites operating under GDPR or CCPA where policy currency is a compliance signal. This does not directly affect rankings for commercial queries, but it contributes to the site's overall structured data coverage, which is a positive signal for entity recognition.
- **Contact Form Conversion Friction Reduction:** For a consultancy where contact form submission is the primary conversion KPI, the privacy policy is a trust checkpoint — not a destination. Visitors who navigate to it are evaluating whether to submit sensitive business information. A policy page that appears current and purposeful (machine-readable type, visible last-modified date rendered from the structured data or displayed on-page) reduces a specific friction point: uncertainty about whether the policy reflects current data handling practices. The fix does not eliminate this friction entirely, but it removes the 'unverifiable' dimension of it.
- **Seo Entity Clarity:** Declaring the page as a WebPage with additionalType LegalService and an about block describing its purpose helps search engines correctly classify the page in the site's entity graph. This is a marginal but cumulative signal — structured data coverage across all page types contributes to overall site entity confidence, which Google's documentation identifies as a factor in knowledge panel eligibility and rich result qualification for the organization.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/legal/privacy

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
Inject a JSON-LD structured data block on the privacy policy page template that declares the page as a schema.org WebPage with @type WebPage (subtyped as a legal/policy document via additionalType), and populates the dateModified, datePublished, name, url, description, and inLanguage properties. This gives search engines a machine-readable signal of policy currency and page purpose, converting a generic content page into a verifiable legal document in the knowledge graph.

### How
1. LOCATE THE TEMPLATE: Identify the CMS template or layout file responsible for rendering the privacy policy page. In WordPress this is typically page-privacy-policy.php, privacy-policy.php, or a page template assigned via the editor. In Webflow it is a static page with a custom code embed block. In Squarespace it is a Code Block injected into the page footer. In a custom build it is the HTML template or server-rendered component for that route.
2. DETERMINE dateModified SOURCE: The dateModified value must reflect the actual last substantive edit to the policy content — not the page's last cache-bust or deployment timestamp. Options in priority order: (a) CMS last-modified date for the page/post (WordPress: the_modified_date(), Webflow: CMS field, custom: database updated_at column); (b) a manually maintained ISO 8601 date constant in the template, updated as part of the policy review process; (c) a build-time environment variable injected at deploy. Option (b) is the safest default for legal pages because it forces a human to consciously update the date when the policy changes, preventing accidental date drift from unrelated deployments.
3. DETERMINE datePublished SOURCE: Use the original publication date of the policy. Same sourcing logic as dateModified — CMS creation date or a manually maintained constant.
4. INJECT THE JSON-LD BLOCK: Place the <script type='application/ld+json'> block inside the <head> element of the privacy policy page template. Do not place it in the <body> — while technically valid per spec, head placement is the canonical convention and avoids parser ambiguity in some crawlers.
5. VALIDATE BEFORE DEPLOYING: Run the output through Google's Rich Results Test (https://search.google.com/test/rich-results) and Schema.org Validator (https://validator.schema.org/) to confirm no syntax errors, no missing required properties, and no type mismatches. Structured data with syntax errors is silently ignored by crawlers — validation is non-optional.
6. VERIFY POST-DEPLOY: After deployment, use Google Search Console's URL Inspection tool on the privacy policy URL to confirm Google has parsed the structured data block. Allow up to 48 hours for recrawl.
7. ESTABLISH A REVIEW PROCESS: Add a calendar reminder or policy review checklist item to update dateModified in the template whenever the privacy policy content is substantively revised. A stale dateModified on a legal page is worse than no dateModified — it actively signals the policy has not been reviewed.

### Code examples
```
<!-- ============================================================
     PRIVACY POLICY PAGE — JSON-LD STRUCTURED DATA BLOCK
     Place inside <head> on the privacy policy page template only.
     Do NOT inject this on every page — it is page-type-specific.

     SITE-SPECIFIC ASSUMPTIONS (update before deploying):
       SITE_BASE_URL        — canonical origin, no trailing slash
       POLICY_PAGE_PATH     — URL path to the privacy policy page
       POLICY_NAME          — human-readable page title
       POLICY_DESCRIPTION   — 150-160 char description of the page
       POLICY_DATE_PUBLISHED — ISO 8601 date of original publication
       POLICY_DATE_MODIFIED  — ISO 8601 date of last substantive edit
                               UPDATE THIS WHENEVER POLICY CHANGES
       SITE_LANGUAGE        — BCP 47 language tag (e.g. 'en-GB')
       ORGANIZATION_NAME    — legal entity name
       ORGANIZATION_URL     — canonical organization URL
     ============================================================ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",

  "@id": "https://SITE_BASE_URL/POLICY_PAGE_PATH#webpage",

  "url": "https://SITE_BASE_URL/POLICY_PAGE_PATH",

  "name": "POLICY_NAME",

  "description": "POLICY_DESCRIPTION",

  "inLanguage": "SITE_LANGUAGE",

  "datePublished": "POLICY_DATE_PUBLISHED",

  "dateModified": "POLICY_DATE_MODIFIED",

  "additionalType": "https://schema.org/LegalService",

  "about": {
    "@type": "Thing",
    "name": "Privacy Policy",
    "description": "Data handling, collection, and user rights disclosure"
  },

  "isPartOf": {
    "@type": "WebSite",
    "@id": "https://SITE_BASE_URL/#website",
    "url": "https://SITE_BASE_URL/",
    "name": "ORGANIZATION_NAME"
  },

  "publisher": {
    "@type": "Organization",
    "@id": "https://SITE_BASE_URL/#organization",
    "name": "ORGANIZATION_NAME",
    "url": "ORGANIZATION_URL"
  }
}
</script>
<!-- ============================================================
     WORDPRESS IMPLEMENTATION — page-privacy-policy.php
     Uses WordPress native functions to source dates dynamically.
     Falls back to a hardcoded constant if get_the_modified_date()
     returns empty (e.g. page was never edited after creation).

     SITE-SPECIFIC ASSUMPTIONS:
       POLICY_DESCRIPTION_CONSTANT — update to match actual page
       SITE_LANGUAGE_CONSTANT      — match your site's BCP 47 tag
     ============================================================ -->
<?php
// SITE-SPECIFIC: Update these constants to match your site.
const POLICY_DESCRIPTION_CONSTANT = 'How ORGANIZATION_NAME collects, uses, and protects personal data submitted through this website.';
const SITE_LANGUAGE_CONSTANT      = 'en-GB'; // BCP 47 — update to match site locale
const POLICY_FALLBACK_DATE        = '2024-01-01'; // ISO 8601 — update to actual publication date

// Source dates from WordPress CMS. Falls back to constant if empty.
$date_published = get_the_date( 'c' ) ?: POLICY_FALLBACK_DATE;
$date_modified  = get_the_modified_date( 'c' ) ?: $date_published;

$structured_data = [
    '@context'       => 'https://schema.org',
    '@type'          => 'WebPage',
    '@id'            => get_permalink() . '#webpage',
    'url'            => get_permalink(),
    'name'           => get_the_title(),
    'description'    => POLICY_DESCRIPTION_CONSTANT,
    'inLanguage'     => SITE_LANGUAGE_CONSTANT,
    'datePublished'  => $date_published,
    'dateModified'   => $date_modified,
    'additionalType' => 'https://schema.org/LegalService',
    'about'          => [
        '@type'       => 'Thing',
        'name'        => 'Privacy Policy',
        'description' => 'Data handling, collection, and user rights disclosure',
    ],
    'isPartOf'       => [
        '@type' => 'WebSite',
        '@id'   => home_url( '/#website' ),
        'url'   => home_url( '/' ),
        'name'  => get_bloginfo( 'name' ),
    ],
    'publisher'      => [
        '@type' => 'Organization',
        '@id'   => home_url( '/#organization' ),
        'name'  => get_bloginfo( 'name' ),
        'url'   => home_url( '/' ),
    ],
];
?>
<script type="application/ld+json">
<?php echo wp_json_encode( $structured_data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ); ?>
</script>
<!-- ============================================================
     WEBFLOW / STATIC HTML IMPLEMENTATION
     For Webflow: paste into Page Settings > Custom Code > Head Code
     on the Privacy Policy page only (not site-wide head code).

     For static HTML builds: inject into <head> of the privacy
     policy template before </head>.

     MAINTENANCE CONTRACT:
     The POLICY_DATE_MODIFIED constant below MUST be updated
     manually whenever the policy content is substantively revised.
     Add this to your policy review checklist.

     SITE-SPECIFIC ASSUMPTIONS — update all values before deploying:
     ============================================================ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://SITE_BASE_URL/privacy-policy#webpage",
  "url": "https://SITE_BASE_URL/privacy-policy",
  "name": "Privacy Policy — ORGANIZATION_NAME",
  "description": "How ORGANIZATION_NAME collects, uses, stores, and protects personal data submitted through this website.",
  "inLanguage": "SITE_LANGUAGE",
  "datePublished": "POLICY_DATE_PUBLISHED",
  "dateModified": "POLICY_DATE_MODIFIED",
  "additionalType": "https://schema.org/LegalService",
  "about": {
    "@type": "Thing",
    "name": "Privacy Policy",
    "description": "Data handling, collection, and user rights disclosure"
  },
  "isPartOf": {
    "@type": "WebSite",
    "@id": "https://SITE_BASE_URL/#website",
    "url": "https://SITE_BASE_URL/",
    "name": "ORGANIZATION_NAME"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://SITE_BASE_URL/#organization",
    "name": "ORGANIZATION_NAME",
    "url": "https://SITE_BASE_URL/"
  }
}
</script>
<!-- ============================================================
     VALIDATION CHECKLIST — run before and after deployment

     1. Google Rich Results Test:
        https://search.google.com/test/rich-results
        Paste the privacy policy URL. Confirm:
        - No syntax errors detected
        - WebPage item detected in parsed items list
        - dateModified and datePublished values shown correctly

     2. Schema.org Validator:
        https://validator.schema.org/
        Paste the privacy policy URL or raw JSON-LD. Confirm:
        - No critical errors
        - No warnings about deprecated types
        - @id values are valid absolute URLs

     3. Google Search Console URL Inspection:
        After deployment, inspect the privacy policy URL.
        Under 'Enhancements', confirm structured data is detected.
        Allow up to 48 hours for Google to recrawl.

     4. Manual JSON syntax check:
        Paste the JSON-LD block into https://jsonlint.com/
        Confirm valid JSON before deploying.
        A single trailing comma or unescaped character silently
        invalidates the entire block.
     ============================================================ -->
```

## Risks
- STALE dateModified IS WORSE THAN ABSENT: If dateModified is hardcoded and not updated when the policy changes, it actively misrepresents policy currency to both crawlers and users. This is a legal credibility risk for a GDPR/CCPA-regulated page. Mitigation: For static implementations (Webflow, Squarespace), add dateModified to the policy review checklist as a mandatory update step. For CMS implementations (WordPress), source the date dynamically from the CMS last-modified field so it updates automatically on save.
- JSON SYNTAX ERRORS SILENTLY INVALIDATE THE BLOCK: A single trailing comma, unescaped character, or malformed @id URL causes the entire JSON-LD block to be ignored by crawlers with no visible error on the page. Mitigation: Validate through both Google Rich Results Test and jsonlint.com before deploying. Add validation to CI/CD pipeline if available (e.g., using a JSON schema linter on the template output).
- DUPLICATE @id COLLISION WITH EXISTING STRUCTURED DATA: If the site already has a WebPage or WebSite schema block injected globally (e.g., via an SEO plugin like Yoast or RankMath), adding a second WebPage block with the same @id will create a duplicate entity conflict in the knowledge graph. Mitigation: Audit existing structured data on the privacy policy page before injecting. Use Google Rich Results Test on the live URL to see all currently parsed structured data blocks. If a global WebPage block exists, extend it rather than adding a second block — or configure the SEO plugin to inject dateModified on legal page templates specifically.
- additionalType LegalService SEMANTIC MISMATCH: schema.org/LegalService is technically defined as a type of LocalBusiness (a law firm or legal practice), not a document type. Using it as additionalType on a WebPage is a semantic approximation — it communicates legal-document intent but is not a formally defined schema.org pattern for policy pages. Mitigation: This is an accepted practice in the structured data community for legal pages without a dedicated schema.org type. If schema.org introduces a dedicated PolicyDocument or PrivacyPolicy type in future, migrate to it. Alternatively, omit additionalType entirely and rely on the about block to communicate page purpose — this is the more conservative and spec-compliant approach.
- CMS DYNAMIC DATE SOURCING MAY REFLECT NON-SUBSTANTIVE EDITS: In WordPress, get_the_modified_date() updates on any save — including fixing a typo, updating a meta field, or a plugin touching the post record. This means dateModified may reflect a trivial edit rather than a substantive policy change. Mitigation: For high-compliance environments, use a custom ACF or meta field (e.g., policy_last_reviewed_date) that is only updated when the policy content is substantively revised, and source dateModified from that field rather than the CMS modified timestamp.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
