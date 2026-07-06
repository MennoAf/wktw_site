# Cluster Deep Dive: SEO Metadata and Structured Data — Unverifiable Properties

**Cluster ID:** cluster_009  
**Architectural Pattern:** HTML Structure  
**Findings:** 4  
**Systemic:** No  

---

## 1. The Big Picture

This cluster is different in character from every other cluster in this audit. The findings here are not confirmed failures — they are confirmed unknowns. The audit scan detected 13 meta tags on the privacy policy page, a BlogPosting JSON-LD schema block on an article page, and BreadcrumbList and Organization schemas on the about page, but in each case the scan data did not include the actual content of those elements. We can see that the structures exist; we cannot see what they say or whether they are complete. That distinction matters because the risk profile is asymmetric: if the metadata is correct, there is no problem. If it is incomplete or malformed, the site is silently forfeiting search visibility and social sharing quality with no error message, no console warning, and no user-facing symptom to trigger investigation.

The most concrete risk sits with the BlogPosting schema on the article page. Google's rich results for articles — the enhanced search listings that display author, date, and a thumbnail — require four properties: `headline`, `author`, `datePublished`, and `image`. The scan confirmed zero images rendered on that article page. A BlogPosting schema block that references no image, or omits the `image` property entirely, disqualifies that article from rich result eligibility. The article still appears in search, but as a plain blue link rather than an enhanced listing. For a site whose content marketing is its primary top-of-funnel mechanism, that is a quiet but real reduction in click-through quality on every article page.

The remaining findings — unverified Open Graph and Twitter Card tags, an unvalidated schema type on the about page, and unconfirmed internal link HTTP status codes — are lower-urgency but share the same underlying problem: the audit cannot close them without additional data. They represent open questions that carry real risk if the answers turn out to be wrong. The appropriate response is not to treat them as confirmed issues requiring immediate remediation, but to resolve the data gaps first, then act on what the data shows.

---

## 2. The Root Cause

All four findings trace to a single gap: the audit scan did not extract the raw content of meta tag attributes or JSON-LD script blocks, only their presence. This is a scan methodology limitation, not a site architecture failure. However, the reason this matters architecturally is that the site has no build-time enforcement layer that would make these questions answerable without a scan. There is no schema validation step in the Astro build pipeline, no typed contract requiring that every blog post layout resolves an `image` property before the build completes, and no component-level enforcement ensuring that `og:image`, `og:title`, and `og:description` are populated from frontmatter rather than left empty or defaulted to a blank string. The site's Astro SSG architecture is well-suited to enforce exactly these guarantees at build time — the capability exists, it simply has not been applied to SEO metadata.

The evidence supports this framing: the scan confirmed `og_tags_verified: False` and `twitter_tags_verified: False` on the privacy policy page, `json_ld_content: not provided in scan data` on the article page, and `validation_status: not performed` on the about page schema. These are not signs of broken code — they are signs of unverified code. The distinction is important for prioritization: the first action is verification, and the second action is enforcement so that verification is never needed again.

---

## 3. Each Finding

### 3a. Open Graph and Twitter Card Meta Tag Values Unverifiable
**Finding ID:** escalation-2-og-twitter-meta-unverifiable  
**Severity:** Medium | **Effort:** Quick Win

When someone shares a page from this site on LinkedIn, Slack, or iMessage, the platform fetches the page's Open Graph tags to generate a preview card — title, description, and image. If `og:title` is missing, the platform falls back to the page's `<title>` tag, which may be acceptable. If `og:image` is missing, the preview renders with no image, which produces a visually degraded card that performs worse in social feeds. The scan detected 13 meta tags on the privacy policy page but did not enumerate their values, so it is not possible to confirm whether `og:title`, `og:description`, `og:image`, and `og:url` are present and populated.

The finding correctly notes that the privacy policy page is low-stakes for social sharing — it is reached via footer links, not search or social. The risk is higher on the homepage, service pages, and blog posts, where social sharing and SERP appearance directly affect the top of the conversion funnel. The scan data (`individually_enumerated: False`) means those pages carry the same unverified status. Until the meta tag values are extracted and confirmed, the site may be generating blank or malformed social preview cards on its highest-traffic pages without any visible indication that something is wrong.

**Fix in plain language:** Add a `SocialMeta.astro` component to the base layout that accepts typed props from each page's frontmatter and outputs a complete, validated set of Open Graph and Twitter Card tags. For blog posts and service pages, make `og:image` a required field that fails the build if absent. For lower-priority pages like legal pages, allow a site-wide default image as a fallback. This is a one-time template change that closes the gap permanently.

---

### 3b. BlogPosting JSON-LD — Image Property Likely Missing
**Finding ID:** escalation-4-blogposting-schema-completeness  
**Severity:** Medium | **Effort:** Medium

Google's article rich results require a BlogPosting schema block with four properties: `headline`, `author`, `datePublished`, and `image`. The scan confirmed that a BlogPosting schema block exists on the article page and that the page renders zero images (`image_count_on_page: 0`). The JSON-LD content itself was not extracted, so the `image` property cannot be confirmed as present or absent — but the absence of any rendered image on the page makes it likely that either the property is missing or it references a generic asset not visible in the page content. Either condition reduces rich result eligibility.

This matters because article rich results are one of the few search features that directly improve click-through quality for content marketing pages. A site that publishes thought leadership articles as its primary top-of-funnel mechanism and then fails to qualify those articles for enhanced search listings is leaving a meaningful visibility advantage unclaimed. The fix does not require adding images to every article — it requires ensuring that every BlogPosting schema block resolves an `image` property through a fallback chain: frontmatter-specified image first, then a site-wide default social image. That default image also doubles as the `og:image` fallback, making this a two-for-one fix with the previous finding.

**Fix in plain language:** Add a default social/OG image to the site's public directory (minimum 1200×630px). Create a metadata resolution utility in the Astro build pipeline that checks for a frontmatter image, then falls back to the default. Wire this into both the BlogPosting JSON-LD `image` property and the `og:image` meta tag. Add a build-time validation step that confirms the `image` property is never empty on article pages.

---

### 3c. Unknown Schema Type on About Page — Validation Not Performed
**Finding ID:** escalation-review-2-unknown-schema  
**Severity:** Medium | **Effort:** Medium

The about page has two confirmed schema blocks — BreadcrumbList and Organization — and a third schema whose `@type` value could not be read from the scan data. The likely candidates are `WebPage` or `AboutPage`, both of which are valid and appropriate. The problem is not that the schema is wrong; the problem is that it cannot be confirmed as right. BreadcrumbList requires `itemListElement` entries with `position`, `name`, and `item` properties. Organization requires `name`, `url`, and `logo`. Without the raw JSON-LD content, none of these required properties can be verified.

An incomplete or malformed schema block does not break the page — it simply fails silently in Google's structured data processing. Google's Search Console will surface schema errors, but only if the site owner is actively monitoring it. The scan evidence (`validation_status: not performed`, `escalation_resolution: unresolvable without raw JSON-LD`) confirms this is an open question, not a confirmed defect. The risk is that a schema block that looks correct in the template may be missing required properties in its rendered output, and the site would have no automated signal that this is happening.

**Fix in plain language:** Run the Astro build locally, extract all JSON-LD blocks from the built HTML output, and validate each one against Google's Rich Results Test and schema.org validator. Once the ground-truth property list is known, add a Zod-based build-time validation step that confirms required properties are present on every build. This prevents schema regressions from future template changes.

---

### 3d. Internal Link HTTP Status — Requires Live Crawl
**Finding ID:** prescan-escalation-internal-links  
**Severity:** Medium | **Effort:** Quick Win

The scan identified 14 internal links across the page but did not crawl their destinations to confirm HTTP status codes. The most important of these is the `/contact/` link, which is the site's primary conversion target — every page on the site funnels through navigation to this single destination. A broken `/contact/` link would mean that every visitor who attempts to convert hits a dead end, with no inline form or alternative conversion path to fall back on (a pattern noted separately in the audit's conversion architecture findings).

The risk here is lower than it would be on a dynamic CMS site. This is a static Astro SSG build — all pages are pre-rendered at deploy time, so if the build succeeds, all internal links should resolve to 200. The scan evidence supports this assessment (`risk_assessment: Lower risk on static SSG`). However, "should resolve" is not the same as "confirmed resolves," and the `/contact/` page is too KPI-critical to leave unverified. A single HTTP HEAD request to `https://weknowthewhy.com/contact/` would close this finding immediately.

**Fix in plain language:** Add `linkinator` (Google-maintained, zero-config) as a post-build npm script that crawls the built output directory and fails the Netlify deployment if any internal link resolves to a non-200 status. This is a one-time CI configuration change that permanently eliminates the risk of a broken conversion link reaching production.

---

## 4. The Unified Fix Strategy

These four findings share a two-phase resolution path. Phase one resolves the data gaps so the team knows exactly what it is dealing with. Phase two adds build-time enforcement so the gaps cannot reopen.

**Phase 1 — Resolve the unknowns (do this first, before writing any code):**

1. Run an expanded scan or manual extraction that enumerates all meta tag attribute values across the homepage, service pages, and blog post templates — not just the privacy policy page where this was first flagged.
2. Run `astro build` locally, then grep the `dist/` directory for all `application/ld+json` blocks. Paste each block into the Google Rich Results Test and schema.org validator. Record exactly which properties are present, which are missing, and what the `@type` value is on the about page schema.
3. Send a single HTTP HEAD request to `https://weknowthewhy.com/contact/` to confirm 200 status. This closes finding 3d immediately at zero engineering cost.

**Phase 2 — Add enforcement so this never needs manual verification again:**

1. **(Quick Win)** Add `linkinator` as a post-build CI step. This is a package install and a one-line npm script addition. Closes finding 3d permanently.
2. **(Quick Win)** Create a `SocialMeta.astro` component with typed props and fallback defaults. Wire into the base layout. Closes finding 3a permanently and provides the `og:image` fallback infrastructure needed for finding 3b.
3. **(Medium)** Add a site-wide default OG image to `public/images/`. Create a `resolve-seo-meta.ts` utility that implements the fallback chain (frontmatter → default) for both `og:image` and BlogPosting `image`. Wire into the blog post layout. Closes finding 3b.
4. **(Medium)** Add a Zod-based build-time JSON-LD validation step as an Astro integration. Validate required properties for BreadcrumbList, Organization, BlogPosting, and whatever `@type` the about page schema resolves to. Closes finding 3c and prevents future schema regressions.

**Priority rationale:** Phase 1 costs near-zero engineering time and may reveal that some of these findings are non-issues. There is no value in building enforcement infrastructure for a problem that does not exist. The HTTP HEAD request for `/contact/` should happen today — it takes 30 seconds and closes a KPI-critical open question. The `SocialMeta.astro` component is the highest-leverage Phase 2 item because it addresses the highest-traffic pages and provides the infrastructure that the BlogPosting fix depends on.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| escalation-2-og-twitter-meta-unverifiable | OG and Twitter Card values unverifiable | Medium | Quick Win | Shared — `SocialMeta.astro` component and default OG image also used by finding 3b |
| escalation-4-blogposting-schema-completeness | BlogPosting JSON-LD image property likely missing | Medium | Medium | Shared — default OG image and `resolve-seo-meta.ts` utility serve both this finding and finding 3a |
| escalation-review-2-unknown-schema | Unknown schema type, validation not performed | Medium | Medium | Unique — Zod build validation step is specific to this finding, though the validation infrastructure benefits all schema findings |
| prescan-escalation-internal-links | Internal link HTTP status unverified | Medium | Quick Win | Unique — `linkinator` CI step is self-contained and does not overlap with other fixes |
