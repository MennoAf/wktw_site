---
finding_id: "ux-revenue-2"
title: "No author attribution on BlogPosting — undermines E-E-A-T and content credibility"
severity: "medium"
root_cause_cluster: "Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization"
why_this_matters: "Google's quality rater guidelines explicitly evaluate author Experience, Expertise, Authoritativeness, and Trustworthiness at the page level for YMYL-adjacent content including business consulting."
fix_summary: "Wire author Person entities into the BlogPosting template at three layers simultaneously: (1) CMS data model — add structured author profile fields (name, slug/URL, photo, bio, credentials, social li…"
confidence_tier: "confirmed"
---

# No author attribution on BlogPosting — undermines E-E-A-T and content credibility

**Finding:** No author attribution on BlogPosting — undermines E-E-A-T and content credibility  
**Severity:** Medium  
**Why this matters:** Google's quality rater guidelines explicitly evaluate author Experience, Expertise, Authoritativeness, and Trustworthiness at the page level for YMYL-adjacent content including business consulting.  
**Root cause:** Conversion Path Architecture — Missing Trust Signals, Tracking, and Form Optimization  
**Fix:** Wire author Person entities into the BlogPosting template at three layers simultaneously: (1) CMS data model — add structured author profile fields (name, slug/URL, photo, bio, credentials, social li…

> **Evidence Basis:** Confirmed

---

## Impact

- **E E A T And Organic Search:** Google's quality rater guidelines explicitly evaluate author Experience, Expertise, Authoritativeness, and Trustworthiness at the page level for YMYL-adjacent content including business consulting. Anonymous content on a consulting site provides no E-E-A-T signal for Google to evaluate. Adding a Person entity with name, url, and sameAs to BlogPosting JSON-LD gives Google's systems a named expert to associate with the content — a prerequisite for author authority to influence ranking on competitive consulting queries.
- **Trust And Contact Form Conversion:** A visitor who reads an anonymous article and then reaches an anonymous contact form has encountered zero personal credibility signals across their entire session. For a consulting firm where the founders are the product, this is a structural trust gap. Adding a named, credentialed author with a photo and bio at the article level creates a personal credibility signal before the visitor reaches the contact form — directly addressing the compounding trust deficit identified in the cross-page finding.
- **Social Sharing And Referral Traffic:** LinkedIn and Slack link previews render og:article:author when present. Without it, shared articles appear institutional. On professional networks where personal credibility drives sharing behavior, attributed expert content generates meaningfully higher engagement than anonymous organizational content — the mechanism is that readers share content they can vouch for, and vouching requires knowing who wrote it.
- **Structured Data Eligibility:** BlogPosting rich results and author panels in Google Search require a valid Person author entity. An Organization author node does not satisfy this requirement per Google's structured data documentation. Adding the correct Person entity makes these posts eligible for enhanced SERP features they are currently categorically excluded from.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_008`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The page uses BlogPosting structured data but the article has no visible author attribution — no author name, no author bio, no author photo, no credentials.. Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines explicitly value author attribution for YMYL-adjacent content (business consulting advice).

**Measured evidence:**
- Author Name Visible: False
- Author Bio Visible: False
- Author Photo Visible: False
- Structured Data Type: BlogPosting
- Author In Schema: unverified — required property may be missing
- Content Type: consulting thought-leadership (YMYL-adjacent)

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
Wire author Person entities into the BlogPosting template at three layers simultaneously: (1) CMS data model — add structured author profile fields (name, slug/URL, photo, bio, credentials, social links); (2) Template — render a visible author byline block with photo, name, credentials, and bio excerpt above or below article body; (3) JSON-LD — replace any Organization author node with a Person entity carrying name, url, and sameAs properties. All three layers must ship together — partial implementation (schema only, or byline only) leaves the E-E-A-T signal chain broken.

### How
STEP 1 — CMS DATA MODEL: Create an 'Author' content type (or custom post type in WordPress) with fields: full_name (text, required), slug (text, required, URL-safe), photo (image, required), title_credentials (text, e.g. 'Managing Partner, CPA'), short_bio (textarea, 150–200 chars), long_bio (textarea), linkedin_url (URL), twitter_url (URL), personal_site_url (URL). Assign a required Author relationship field on every BlogPosting entry. Backfill all existing posts to the correct author before deploying the template change — a post with a null author relationship will throw on the template if not null-guarded.
STEP 2 — TEMPLATE BYLINE BLOCK: Insert the author block component immediately after the article header (post title + date) and again as an expanded bio card after the article body. The post-body card carries the full bio and social links; the header byline carries only photo, name, and credentials. Scope all new CSS under a BEM namespace (.author-byline__, .author-bio-card__) to prevent collision with existing article styles. Add aria-label='Article author' on the byline container.
STEP 3 — JSON-LD SCHEMA: In the BlogPosting JSON-LD block, replace the author node with a Person entity. Populate author.name from the CMS full_name field, author.url from the CMS slug resolved to an absolute author profile URL, and author.sameAs as an array of all non-null social URLs. If the author profile URL does not yet exist as a live page, set author.url to the site's /about or /team anchor for that person as a temporary measure — do not omit the property.
STEP 4 — AUTHOR PROFILE PAGE: Create a canonical /team/[author-slug] page for each author. This page becomes the target of author.url in JSON-LD and the href on byline name links. It must carry its own Person JSON-LD block. Without this page, the author.url resolves to a 404, which negates the schema signal.
STEP 5 — OPEN GRAPH: Add og:article:author meta tag to every BlogPosting page, set to the author's LinkedIn profile URL or personal site URL. This surfaces the author name in LinkedIn, Slack, and iMessage link previews.
STEP 6 — NULL GUARD AUDIT: Before deploying, query the CMS for any BlogPosting entry with a null or empty author relationship. Block deployment until all posts are assigned. Add a CMS validation rule that makes the author field required on publish — prevent future anonymous posts at the data entry layer, not just the template layer.
STEP 7 — REGRESSION SCOPE: The byline block is additive — it inserts new DOM nodes, does not modify existing article markup. The JSON-LD change replaces a node value inside an existing <script type='application/ld+json'> block. Neither change touches navigation, footer, sidebar, or any interactive component. CSS is namespaced. Risk of breaking existing layout is contained to the article template only.

### Code examples
```
<!-- TEMPLATE: Author byline block (Nunjucks/Jinja2 syntax — adapt to site's templating engine) -->
<!-- ASSUMPTION: post.author is a required resolved object from CMS. Null-guard is mandatory. -->
{% if post.author %}
<div class="author-byline" aria-label="Article author">
  <a href="/team/{{ post.author.slug }}" class="author-byline__link">
    <img
      class="author-byline__photo"
      src="{{ post.author.photo.url }}"
      alt="{{ post.author.full_name }}"
      width="48"
      height="48"
      loading="eager"
    />
  </a>
  <div class="author-byline__meta">
    <a href="/team/{{ post.author.slug }}" class="author-byline__name">
      {{ post.author.full_name }}
    </a>
    {% if post.author.title_credentials %}
    <span class="author-byline__credentials">{{ post.author.title_credentials }}</span>
    {% endif %}
  </div>
</div>
{% endif %}

<!-- POST-BODY: Expanded author bio card -->
{% if post.author %}
<aside class="author-bio-card" aria-label="About the author">
  <a href="/team/{{ post.author.slug }}" class="author-bio-card__photo-link">
    <img
      class="author-bio-card__photo"
      src="{{ post.author.photo.url }}"
      alt="{{ post.author.full_name }}"
      width="80"
      height="80"
      loading="lazy"
    />
  </a>
  <div class="author-bio-card__body">
    <p class="author-bio-card__name">
      <a href="/team/{{ post.author.slug }}">{{ post.author.full_name }}</a>
    </p>
    {% if post.author.title_credentials %}
    <p class="author-bio-card__credentials">{{ post.author.title_credentials }}</p>
    {% endif %}
    <p class="author-bio-card__bio">{{ post.author.short_bio }}</p>
    <ul class="author-bio-card__social" aria-label="{{ post.author.full_name }} social profiles">
      {% if post.author.linkedin_url %}
      <li>
        <a
          href="{{ post.author.linkedin_url }}"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="{{ post.author.full_name }} on LinkedIn"
        >LinkedIn</a>
      </li>
      {% endif %}
      {% if post.author.twitter_url %}
      <li>
        <a
          href="{{ post.author.twitter_url }}"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="{{ post.author.full_name }} on X (Twitter)"
        >X</a>
      </li>
      {% endif %}
    </ul>
  </div>
</aside>
{% endif %}
/* CSS — scoped to BEM namespaces only. No bare element selectors. */
/* ASSUMPTION: Site uses a 16px base font. Adjust rem values if base differs. */

.author-byline {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 12px at 16px base */
  margin-block: 1rem 1.5rem;
}

.author-byline__photo {
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  /* width/height set via HTML attributes — do not override here to avoid CLS */
}

.author-byline__link,
.author-byline__name {
  color: inherit;
  text-decoration: none;
}

.author-byline__name {
  font-weight: 600;
  display: block;
}

.author-byline__name:hover,
.author-byline__name:focus-visible {
  text-decoration: underline;
}

.author-byline__credentials {
  font-size: 0.875rem; /* 14px */
  color: #555; /* ASSUMPTION: verify 4.5:1 contrast against site background */
  display: block;
}

/* Expanded bio card */
.author-bio-card {
  display: flex;
  gap: 1.25rem;
  padding: 1.5rem;
  border-top: 2px solid currentColor;
  margin-block-start: 3rem;
}

.author-bio-card__photo {
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.author-bio-card__name {
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.author-bio-card__name a {
  color: inherit;
  text-decoration: none;
}

.author-bio-card__name a:hover,
.author-bio-card__name a:focus-visible {
  text-decoration: underline;
}

.author-bio-card__credentials {
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
}

.author-bio-card__bio {
  margin: 0 0 0.75rem;
  font-size: 0.9375rem; /* 15px */
}

.author-bio-card__social {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 1rem;
}

/* Reduced-motion: no animations introduced, nothing to suppress here */

@supports not (margin-block: 0) {
  /* Fallback for older Safari/iOS — logical properties not supported pre-2021 */
  .author-byline { margin-top: 1rem; margin-bottom: 1.5rem; }
  .author-bio-card { margin-top: 3rem; }
}
// JSON-LD: BlogPosting schema with Person author entity
// ASSUMPTION: This is server-rendered output. Replace template variables with
// your CMS's output syntax. All values must be resolved before serialization.
// ASSUMPTION: SITE_BASE_URL is a named constant set in your build/server config.

const SITE_BASE_URL = 'https://example.com'; // CONFIGURE: replace with actual domain

function buildBlogPostingSchema(post) {
  // Precondition: post.author must be a resolved object, not null.
  // Caller is responsible for null-checking before invoking this function.
  if (!post || !post.author || !post.author.full_name) {
    throw new Error(
      `buildBlogPostingSchema: post.author.full_name is required. Post slug: ${
        post?.slug ?? 'unknown'
      }`
    );
  }

  const author = post.author;

  // Build sameAs array from non-null social URLs only
  const sameAs = [
    author.linkedin_url ?? null,
    author.twitter_url ?? null,
    author.personal_site_url ?? null,
  ].filter(Boolean);

  // author.url: prefer canonical /team/[slug] page.
  // If that page does not yet exist, fall back to /about — never omit.
  // ASSUMPTION: /team/[slug] pages are deployed before or simultaneously with this schema change.
  const authorUrl = author.slug
    ? `${SITE_BASE_URL}/team/${author.slug}`
    : `${SITE_BASE_URL}/about`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description ?? '',
    url: `${SITE_BASE_URL}/blog/${post.slug}`,
    datePublished: post.published_at, // ISO 8601 string, e.g. '2024-03-15T09:00:00Z'
    dateModified: post.updated_at ?? post.published_at,
    image: post.featured_image?.url ?? null,
    author: {
      '@type': 'Person',
      name: author.full_name,
      url: authorUrl,
      ...(sameAs.length > 0 && { sameAs }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'CONFIGURE: Your Organization Name',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_BASE_URL}/images/logo.png`, // CONFIGURE: actual logo path
      },
    },
  };

  return JSON.stringify(schema);
}

// Usage in server render (Node.js / SSR context):
// <script type="application/ld+json">${buildBlogPostingSchema(post)}</script>
<!-- Open Graph author meta tag — add inside <head> on every BlogPosting page -->
<!-- ASSUMPTION: post.author.linkedin_url is the preferred canonical author URL for OG.
     Fall back to personal_site_url if LinkedIn is absent.
     Do not emit the tag if both are null — an empty og:article:author is worse than omission. -->
{% if post.author.linkedin_url or post.author.personal_site_url %}
<meta
  property="og:article:author"
  content="{{ post.author.linkedin_url or post.author.personal_site_url }}"
/>
{% endif %}

<!-- Also add article:author to existing OG block if not already present -->
<!-- Verify og:type is already set to 'article' on BlogPosting pages -->
<meta property="og:type" content="article" />
// CMS VALIDATION: Pre-deploy null-author audit script (Node.js)
// Run against CMS API or database before deploying template changes.
// ASSUMPTION: CMS exposes a REST or GraphQL endpoint for post listing.
// Replace POSTS_API_ENDPOINT and fetchAllPosts with your CMS client.

const POSTS_API_ENDPOINT = 'CONFIGURE: your CMS posts endpoint';

// Named constants — no magic numbers
const HTTP_OK = 200;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

async function fetchAllPosts(endpoint) {
  // ASSUMPTION: endpoint returns { posts: Array<{ slug: string, author: object|null }> }
  // Replace with actual CMS SDK call if available — prefer SDK over raw fetch.
  const response = await fetch(endpoint);
  if (response.status !== HTTP_OK) {
    throw new Error(`CMS API returned ${response.status} for ${endpoint}`);
  }
  const data = await response.json();
  return data.posts ?? [];
}

async function auditAuthorCoverage() {
  let posts;
  try {
    posts = await fetchAllPosts(POSTS_API_ENDPOINT);
  } catch (err) {
    console.error('Author audit failed — could not fetch posts:', err.message);
    process.exit(1);
  }

  const unattributed = posts.filter(
    (post) => !post.author || !post.author.full_name
  );

  if (unattributed.length > 0) {
    console.error(
      `DEPLOY BLOCKED: ${unattributed.length} post(s) have no author assigned:`
    );
    unattributed.forEach((post) => console.error(`  - /blog/${post.slug}`));
    console.error(
      'Assign an author to every post in the CMS before deploying the author template.'
    );
    process.exit(1); // Non-zero exit blocks CI/CD pipeline
  }

  console.log(`Author audit passed: all ${posts.length} posts have author attribution.`);
  process.exit(0);
}

auditAuthorCoverage();
```

## Risks
- NULL AUTHOR ON EXISTING POSTS: If any published post has no author assigned in the CMS when the template deploys, the null-guard in the template will suppress the byline silently — but the JSON-LD builder will throw, causing a server error on that post's page. Mitigation: run the audit script (Step 6 code example) in CI before deployment and block merge if any post returns null author. Do not deploy template and schema changes until all posts are backfilled.
- AUTHOR PROFILE PAGE 404: If /team/[author-slug] pages are not live when the schema deploys, author.url in JSON-LD resolves to a 404. Google will crawl the URL, find a 404, and the Person entity loses its dereferenceable identity signal. Mitigation: deploy author profile pages in the same release as the schema change, or use the /about fallback URL temporarily and update once profile pages are live.
- PHOTO ASPECT RATIO AND CLS: Author photos rendered without explicit width/height attributes will cause layout shift as they load. The template code examples include width and height on all img elements — implementors must not remove these attributes. If the CMS returns variable-dimension photos, add object-fit: cover and fixed container dimensions in CSS rather than relying on intrinsic image dimensions.
- CREDENTIAL TEXT OVERFLOW: The author-byline__credentials field is free-text from the CMS. Long credential strings (e.g., 'Managing Partner, CPA, CFP, MBA, Harvard Business School') will overflow the byline layout on mobile. Mitigation: add a CMS character limit validation on title_credentials (recommended max: 60 characters) and add overflow: hidden; text-overflow: ellipsis; white-space: nowrap to .author-byline__credentials as a defensive CSS rule.
- SCHEMA INJECTION XSS: The JSON-LD is server-rendered by serializing CMS content. If author.full_name or any other field contains unescaped characters (quotes, angle brackets), JSON.stringify handles this correctly in the Node.js example — but if the output is concatenated via string interpolation in a different language, it creates an XSS vector. Mitigation: always use the language's native JSON serializer (json_encode in PHP, json.dumps in Python, JSON.stringify in JS) — never string-concatenate JSON-LD values.

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
