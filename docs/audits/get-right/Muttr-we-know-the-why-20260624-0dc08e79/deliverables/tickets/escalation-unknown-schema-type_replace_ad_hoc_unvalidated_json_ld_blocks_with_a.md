---
finding_id: "escalation-unknown-schema-type"
title: "Unknown or unverifiable structured data schema type — raw JSON-LD not available for diagnosis"
severity: "medium"
root_cause_cluster: "SEO Metadata and Structured Data Gaps"
why_this_matters: "Organization and WebSite schemas, when correctly formed and server-rendered, make the site eligible for Google Sitelinks Searchbox in SERPs."
fix_summary: "Replace ad-hoc, unvalidated JSON-LD blocks with a centralized, server-rendered structured data architecture in Astro."
confidence_tier: "confirmed"
---

# Unknown or unverifiable structured data schema type — raw JSON-LD not available for diagnosis

**Finding:** Unknown or unverifiable structured data schema type — raw JSON-LD not available for diagnosis  
**Severity:** Medium  
**Why this matters:** Organization and WebSite schemas, when correctly formed and server-rendered, make the site eligible for Google Sitelinks Searchbox in SERPs.  
**Root cause:** SEO Metadata and Structured Data Gaps  
**Fix:** Replace ad-hoc, unvalidated JSON-LD blocks with a centralized, server-rendered structured data architecture in Astro.

> **Evidence Basis:** Confirmed

---

## Impact

- **Seo Rich Results Eligibility:** Organization and WebSite schemas, when correctly formed and server-rendered, make the site eligible for Google Sitelinks Searchbox in SERPs. Currently the malformed or client-rendered schema is likely being ignored by Googlebot, meaning this eligibility is zero. Fixing server-side rendering and schema completeness restores crawler visibility as the prerequisite for any rich result.
- **Blog Post Serp Appearance:** BreadcrumbList schema on blog posts enables Google to display breadcrumb trails in SERPs instead of raw URLs. BlogPosting schema with datePublished and author enables article rich results. Both are currently absent. These are direct SERP appearance improvements that increase click-through signal quality — Google's documentation confirms these as eligibility requirements, not ranking guarantees.
- **Build Pipeline Regression Prevention:** The postbuild validation step converts schema correctness from a manual, forgettable check into a hard build gate. Any future content or template change that breaks required schema properties will fail the build before deployment, preventing silent regressions that accumulate undetected across redesigns.
- **Crawl Efficiency:** Eliminating client-rendered JSON-LD removes the dependency on JavaScript execution for structured data discovery. Googlebot's crawl budget is not consumed by a second JavaScript-execution pass to find schema that should have been in the initial HTML response.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_009`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Escalated item review: The prescan finding prescan-14-2 correctly flags an 'Unknown' schema type alongside the Organization schema.. Without access to the raw JSON-LD markup, I cannot determine whether this is: (1) A WebSite schema (common companion to Organization, sometimes misclassified by scanners), (2) A BreadcrumbList schema, (3) A malformed @type value (typo), (4) A deprecated schema type, or (5) A scanner parsing error.

**Measured evidence:**
- Schemas Detected: 2
- Known Type: Organization
- Unknown Type: Cannot diagnose without raw JSON-LD markup
- Likely Candidates: ['WebSite', 'BreadcrumbList', 'scanner parsing error']
- Validation Tools: ['https://search.google.com/test/rich-results', 'https://validator.schema.org/']
- Prescan Finding Confirmed: prescan-14-2 severity and description are appropriate
- Prescan Finding Referenced: prescan-14-2
- Action Required: Manual inspection of raw JSON-LD in page source to verify @type value and property completeness

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
Replace ad-hoc, unvalidated JSON-LD blocks with a centralized, server-rendered structured data architecture in Astro. Implement: (1) a typed SchemaGraph utility that composes and serializes all schema types into a single top-level JSON-LD block per page, (2) server-rendered injection via Astro's <head> slot in the shared layout (never client:load), (3) a build-time validation step that fails the build on missing required properties or unknown @type values, and (4) page-type-specific schema factories for Organization+WebSite (global), BreadcrumbList (all interior pages), BlogPosting (blog posts), and Article (content pages).

### How
Step 1 — Audit existing JSON-LD injection points. Search the codebase for all occurrences of 'application/ld+json' across .astro, .ts, .tsx, .js files. Identify whether any are inside components with client: directives. Any schema inside a client:load/client:idle/client:visible component is crawler-invisible — these must be moved to server-rendered slots.
Step 2 — Create src/lib/schema/types.ts defining TypeScript interfaces for each schema type you will emit (Organization, WebSite, BreadcrumbList, BlogPosting, Article). Use strict required/optional property separation so the compiler enforces completeness.
Step 3 — Create src/lib/schema/graph.ts — a SchemaGraph class that accepts schema objects, deduplicates by @type+@id, and serializes to a single @graph JSON-LD block. A single @graph block is the correct pattern for co-emitting Organization + WebSite; it eliminates the nesting-inside-property failure mode identified in the root cause.
Step 4 — Create per-page-type schema factory functions in src/lib/schema/factories/. Each factory accepts typed props and returns a validated schema object. Validation throws at build time if required properties are absent.
Step 5 — In the shared layout component (Layout.astro or BaseHead.astro), import the SchemaGraph and the appropriate factory for the page type passed via props. Render the serialized JSON-LD inside a <script type='application/ld+json'> tag using Astro's set:html directive — this is server-rendered into static HTML, not client-executed.
Step 6 — Add a build-time validation script (scripts/validate-schema.ts) that runs after astro build, crawls the dist/ directory, parses every HTML file for JSON-LD blocks, and validates each against the Google Rich Results schema requirements using schema-dts type definitions. Exit code 1 on any failure to block CI deployment.
Step 7 — Wire the validation script into package.json as a postbuild hook so it runs automatically on every build without requiring developer memory.
Step 8 — Remove or consolidate any legacy JSON-LD script tags that were previously injected ad-hoc. Search dist/ after first build to confirm exactly one <script type='application/ld+json'> per page.
Step 9 — Submit updated pages to Google Search Console's Rich Results Test and URL Inspection tool to confirm crawler visibility and schema recognition.

### Code examples
```
// src/lib/schema/types.ts
// Site-specific assumption: adjust siteUrl and orgName via config, not hardcoded here.
export interface SchemaOrganization {
  '@type': 'Organization';
  '@id': string;
  name: string;
  url: string;
  logo?: SchemaImageObject;
  sameAs?: string[];
}

export interface SchemaWebSite {
  '@type': 'WebSite';
  '@id': string;
  name: string;
  url: string;
  potentialAction?: SchemaSearchAction;
}

export interface SchemaSearchAction {
  '@type': 'SearchAction';
  target: { '@type': 'EntryPoint'; urlTemplate: string };
  'query-input': string;
}

export interface SchemaBreadcrumbList {
  '@type': 'BreadcrumbList';
  itemListElement: SchemaListItem[];
}

export interface SchemaListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface SchemaBlogPosting {
  '@type': 'BlogPosting';
  '@id': string;
  headline: string;
  description: string;
  url: string;
  datePublished: string; // ISO 8601
  dateModified: string;  // ISO 8601
  author: SchemaPerson;
  image: SchemaImageObject;
  publisher: { '@id': string }; // Reference to Organization @id
}

export interface SchemaPerson {
  '@type': 'Person';
  name: string;
  url?: string;
}

export interface SchemaImageObject {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

export type AnySchema =
  | SchemaOrganization
  | SchemaWebSite
  | SchemaBreadcrumbList
  | SchemaBlogPosting
  | SchemaPerson
  | SchemaImageObject;
// src/lib/schema/graph.ts
// Composes multiple schema objects into a single @graph JSON-LD block.
// A single @graph eliminates the nesting-inside-property failure mode
// and is the correct pattern for co-emitting Organization + WebSite.
import type { AnySchema } from './types';

export class SchemaGraph {
  private nodes: AnySchema[] = [];

  add(schema: AnySchema): this {
    this.nodes.push(schema);
    return this;
  }

  serialize(): string {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': this.nodes,
    };
    // JSON.stringify is synchronous and safe here — no async state.
    return JSON.stringify(graph);
  }
}
// src/lib/schema/factories/organization.ts
// Site-specific assumption: SITE_URL and ORG_NAME must be set in
// src/config/site.ts and imported here — do not hardcode.
import type { SchemaOrganization, SchemaWebSite } from '../types';
import { SITE_URL, ORG_NAME, ORG_LOGO_URL, ORG_SAME_AS } from '../../config/site';

export function makeOrganizationSchema(): SchemaOrganization {
  if (!SITE_URL || !ORG_NAME) {
    throw new Error('[Schema] makeOrganizationSchema: SITE_URL and ORG_NAME are required. Set them in src/config/site.ts.');
  }
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: ORG_NAME,
    url: SITE_URL,
    logo: ORG_LOGO_URL
      ? { '@type': 'ImageObject', url: ORG_LOGO_URL }
      : undefined,
    sameAs: ORG_SAME_AS ?? [],
  };
}

export function makeWebSiteSchema(): SchemaWebSite {
  if (!SITE_URL || !ORG_NAME) {
    throw new Error('[Schema] makeWebSiteSchema: SITE_URL and ORG_NAME are required.');
  }
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: ORG_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      // Site-specific assumption: adjust the search URL pattern to match
      // the site's actual search implementation.
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
// src/lib/schema/factories/breadcrumb.ts
import type { SchemaBreadcrumbList, SchemaListItem } from '../types';

export interface BreadcrumbEntry {
  name: string;
  url: string;
}

export function makeBreadcrumbSchema(
  entries: BreadcrumbEntry[]
): SchemaBreadcrumbList {
  if (!entries || entries.length === 0) {
    throw new Error('[Schema] makeBreadcrumbSchema: entries array must not be empty.');
  }
  const itemListElement: SchemaListItem[] = entries.map((entry, index) => {
    if (!entry.name || !entry.url) {
      throw new Error(
        `[Schema] makeBreadcrumbSchema: entry at position ${index + 1} is missing name or url.`
      );
    }
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.url,
    };
  });
  return {
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}
// src/lib/schema/factories/blog-posting.ts
import type { SchemaBlogPosting } from '../types';
import { SITE_URL } from '../../config/site';

export interface BlogPostingProps {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrl?: string;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
}

export function makeBlogPostingSchema(props: BlogPostingProps): SchemaBlogPosting {
  const required: (keyof BlogPostingProps)[] = [
    'headline', 'description', 'url', 'datePublished', 'dateModified',
    'authorName', 'imageUrl',
  ];
  for (const key of required) {
    if (!props[key]) {
      throw new Error(`[Schema] makeBlogPostingSchema: required property '${key}' is missing or empty.`);
    }
  }
  // Validate ISO 8601 format — Google rejects non-ISO dates.
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;
  if (!isoPattern.test(props.datePublished)) {
    throw new Error(`[Schema] makeBlogPostingSchema: datePublished '${props.datePublished}' is not ISO 8601.`);
  }
  if (!isoPattern.test(props.dateModified)) {
    throw new Error(`[Schema] makeBlogPostingSchema: dateModified '${props.dateModified}' is not ISO 8601.`);
  }
  return {
    '@type': 'BlogPosting',
    '@id': `${props.url}#article`,
    headline: props.headline,
    description: props.description,
    url: props.url,
    datePublished: props.datePublished,
    dateModified: props.dateModified,
    author: {
      '@type': 'Person',
      name: props.authorName,
      ...(props.authorUrl ? { url: props.authorUrl } : {}),
    },
    image: {
      '@type': 'ImageObject',
      url: props.imageUrl,
      ...(props.imageWidth ? { width: props.imageWidth } : {}),
      ...(props.imageHeight ? { height: props.imageHeight } : {}),
    },
    // References Organization by @id — avoids duplicating org data inline.
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}
<!-- src/layouts/BaseHead.astro -->
<!-- Precondition: schemaGraph prop is a pre-serialized JSON-LD string.
     It is composed server-side in the parent layout before this component
     is rendered. No client: directive is used — this is static HTML output. -->
---
import { SchemaGraph } from '../lib/schema/graph';
import { makeOrganizationSchema, makeWebSiteSchema } from '../lib/schema/factories/organization';
import { makeBreadcrumbSchema } from '../lib/schema/factories/breadcrumb';
import type { BreadcrumbEntry } from '../lib/schema/factories/breadcrumb';
import type { AnySchema } from '../lib/schema/types';

interface Props {
  title: string;
  description: string;
  canonicalUrl: string;
  // Site-specific assumption: pageType drives which schemas are emitted.
  // Extend this union as new page types are added.
  pageType: 'home' | 'interior' | 'blog-post';
  breadcrumbs?: BreadcrumbEntry[];
  // Additional schemas injected by page-specific templates (e.g., BlogPosting).
  additionalSchemas?: AnySchema[];
}

const {
  title,
  description,
  canonicalUrl,
  pageType,
  breadcrumbs,
  additionalSchemas = [],
} = Astro.props;

const graph = new SchemaGraph();

// Organization and WebSite are emitted on every page.
graph.add(makeOrganizationSchema());
graph.add(makeWebSiteSchema());

// BreadcrumbList is emitted on all interior pages and blog posts.
if ((pageType === 'interior' || pageType === 'blog-post') && breadcrumbs && breadcrumbs.length > 0) {
  graph.add(makeBreadcrumbSchema(breadcrumbs));
}

// Page-specific schemas (e.g., BlogPosting) are injected by the calling template.
for (const schema of additionalSchemas) {
  graph.add(schema);
}

const schemaJson = graph.serialize();
---
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalUrl} />
<!-- set:html is required to inject the JSON string without Astro escaping the braces.
     This renders server-side into static HTML — no JavaScript execution required. -->
<script type="application/ld+json" set:html={schemaJson}></script>
<!-- src/pages/blog/[slug].astro — example of BlogPosting schema injection -->
---
import BaseHead from '../../layouts/BaseHead.astro';
import { makeBlogPostingSchema } from '../../lib/schema/factories/blog-posting';
import { SITE_URL } from '../../config/site';

// Site-specific assumption: getStaticPaths and post data fetching
// are already implemented for this route.
export async function getStaticPaths() {
  // ... existing implementation
}

const { post } = Astro.props;
const postUrl = `${SITE_URL}/blog/${post.slug}`;

// Throws at build time if any required field is missing from post frontmatter.
const blogPostingSchema = makeBlogPostingSchema({
  headline: post.title,
  description: post.description,
  url: postUrl,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt ?? post.publishedAt,
  authorName: post.author.name,
  authorUrl: post.author.url,
  imageUrl: post.coverImage.url,
  imageWidth: post.coverImage.width,
  imageHeight: post.coverImage.height,
});
---
<html lang="en">
  <head>
    <BaseHead
      title={post.title}
      description={post.description}
      canonicalUrl={postUrl}
      pageType="blog-post"
      breadcrumbs={[
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: post.title, url: postUrl },
      ]}
      additionalSchemas={[blogPostingSchema]}
    />
  </head>
  <body>
    <!-- page content -->
  </body>
</html>
// scripts/validate-schema.ts
// Runs as a postbuild hook. Crawls dist/ HTML files, extracts JSON-LD,
// and validates required properties. Exit code 1 blocks CI deployment.
// Precondition: dist/ directory exists (run after `astro build`).
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

// Named constants — adjust thresholds here, not inline.
const DIST_DIR = './dist';
const REQUIRED_GLOBAL_TYPES = ['Organization', 'WebSite'] as const;
const REQUIRED_BLOG_TYPES = ['BlogPosting', 'BreadcrumbList'] as const;
const LD_JSON_PATTERN = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

async function collectHtmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(fullPath)));
    } else if (entry.isFile() && extname(entry.name) === '.html') {
      files.push(fullPath);
    }
  }
  return files;
}

function extractSchemaTypes(html: string): string[] {
  const types: string[] = [];
  let match: RegExpExecArray | null;
  // Reset lastIndex before each use — LD_JSON_PATTERN has /g flag.
  LD_JSON_PATTERN.lastIndex = 0;
  while ((match = LD_JSON_PATTERN.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        for (const node of parsed['@graph']) {
          if (node['@type']) types.push(node['@type']);
        }
      } else if (parsed['@type']) {
        types.push(parsed['@type']);
      }
    } catch {
      // JSON.parse failure = malformed JSON-LD block.
      types.push('__PARSE_ERROR__');
    }
  }
  return types;
}

async function main(): Promise<void> {
  const files = await collectHtmlFiles(DIST_DIR);
  let errorCount = 0;

  for (const file of files) {
    const html = await readFile(file, 'utf-8');
    const types = extractSchemaTypes(html);

    if (types.includes('__PARSE_ERROR__')) {
      console.error(`[schema-validate] FAIL: Malformed JSON-LD in ${file}`);
      errorCount++;
      continue;
    }

    // Every page must have Organization and WebSite.
    for (const required of REQUIRED_GLOBAL_TYPES) {
      if (!types.includes(required)) {
        console.error(`[schema-validate] FAIL: Missing '${required}' schema in ${file}`);
        errorCount++;
      }
    }

    // Blog post pages (heuristic: path contains /blog/ and is not the index).
    // Site-specific assumption: adjust this path pattern to match the site's URL structure.
    if (file.includes('/blog/') && !file.endsWith('/blog/index.html')) {
      for (const required of REQUIRED_BLOG_TYPES) {
        if (!types.includes(required)) {
          console.error(`[schema-validate] FAIL: Missing '${required}' schema in blog post ${file}`);
          errorCount++;
        }
      }
    }
  }

  if (errorCount > 0) {
    console.error(`[schema-validate] ${errorCount} schema validation error(s). Build rejected.`);
    process.exit(1);
  }

  console.log(`[schema-validate] PASS: All ${files.length} pages passed schema validation.`);
}

main().catch((err) => {
  console.error('[schema-validate] Unexpected error:', err);
  process.exit(1);
});
// package.json additions (partial)
// postbuild runs automatically after `astro build` — no developer action required.
{
  "scripts": {
    "build": "astro build",
    "postbuild": "tsx scripts/validate-schema.ts"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
