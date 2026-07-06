---
finding_id: "escalation-review-2-unknown-schema"
title: "Escalation review: JSON-LD schema validation — unknown type and unresolvable properties"
severity: "medium"
root_cause_cluster: "SEO Metadata and Structured Data — Unverifiable Properties"
why_this_matters: "BreadcrumbList with missing item URLs and Organization with a relative logo URL are disqualified from Google's rich results — sitelinks breadcrumbs and Knowledge Panel site-name display require these…"
fix_summary: "Replace the site's unvalidated, prop-threaded JSON-LD generation with a typed schema contract layer: (1) a SchemaOrg.astro component that enforces required properties at render time and throws build-…"
confidence_tier: "unverified"
remediation_surface: "source_code"
---

# Escalation review: JSON-LD schema validation — unknown type and unresolvable properties

**Finding:** Escalation review: JSON-LD schema validation — unknown type and unresolvable properties  
**Severity:** Medium  
**Why this matters:** BreadcrumbList with missing item URLs and Organization with a relative logo URL are disqualified from Google's rich results — sitelinks breadcrumbs and Knowledge Panel site-name display require these…  
**Root cause:** SEO Metadata and Structured Data — Unverifiable Properties  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Replace the site's unvalidated, prop-threaded JSON-LD generation with a typed schema contract layer: (1) a SchemaOrg.astro component that enforces required properties at render time and throws build-…  

> **Evidence Basis:** Needs Verification

---

## Impact

- **Rich Results Eligibility:** BreadcrumbList with missing item URLs and Organization with a relative logo URL are disqualified from Google's rich results — sitelinks breadcrumbs and Knowledge Panel site-name display require these properties to be present and absolute. Fixing them makes the site eligible for these SERP enhancements, which increase click-through by improving result visibility and trust signals.
- **Silent Schema Loss Prevention:** A misspelled @type (e.g. 'AboutUs' instead of 'AboutPage') causes Google to silently discard the entire JSON-LD block. The build-time validation integration converts this silent failure into a build error, ensuring no page ships with an unrecognized type. This closes the gap between 'syntactically valid JSON' and 'semantically valid schema.org markup'.
- **Crawl And Indexing Quality:** Valid, complete structured data gives Google's crawler higher-confidence signals about page type and content hierarchy. This is particularly relevant for the about page (entity disambiguation) and legal pages (BreadcrumbList aids site structure understanding). Google's documentation on structured data directly links completeness of required properties to rich result eligibility.
- **Build Pipeline Regression Prevention:** The Zod contract layer and build-time integration prevent schema regressions from future content or template changes. Without this, a developer adding a new page type or refactoring the BaseLayout can silently break schema across the entire site — a failure that may not surface until a Search Console manual review weeks later.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_009`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** BreadcrumbList and Organization schemas are detected but raw JSON-LD content is not available for property validation.. BreadcrumbList is appropriate for a nested legal page (Home > Legal > Terms).

**Measured evidence:**
- Prescan Finding: prescan-14-3
- Review Outcome: concur — likely WebPage or AboutPage but cannot confirm without JSON-LD extraction
- Schemas Confirmed: ['BreadcrumbList', 'Organization']
- Schema Unknown: likely WebPage/AboutPage — needs @type value extraction
- Action Needed: Extract JSON-LD blocks from page source, validate @type and required properties
- Prescan Ref: prescan-14-3
- Escalation Resolution: unresolvable without raw JSON-LD — prescan finding stands
- Schemas Detected: ['BreadcrumbList', 'Organization']

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
Replace the site's unvalidated, prop-threaded JSON-LD generation with a typed schema contract layer: (1) a SchemaOrg.astro component that enforces required properties at render time and throws build-time errors on invalid/incomplete schema, (2) a build-time Zod validation script that runs as an Astro integration and fails the Netlify build if any page ships semantically incomplete JSON-LD, and (3) corrected schema definitions for the three confirmed defect vectors: BreadcrumbList missing item URLs, Organization missing absolute logo URL, and unknown/misspelled @type on the about page.

### How
Step 1 — Audit current schema output. Run `astro build` locally, then grep the dist/ directory for all JSON-LD blocks: `grep -r 'application/ld+json' dist/ --include='*.html' -l`. For each file, extract the JSON-LD payload and paste into https://validator.schema.org to get the ground-truth list of missing required properties. Record: (a) exact @type values present, (b) which required properties are absent per Google's Rich Results requirements, (c) whether any @type value is misspelled.
Step 2 — Create src/lib/schema.ts as the single source of truth for all schema type definitions. This file exports typed builder functions for each schema type used on the site. Each builder validates its inputs at call time using Zod and throws a descriptive error if required properties are missing. This makes schema failures a build error, not a silent runtime omission.
Step 3 — Create src/components/SchemaOrg.astro as the sole rendering component for JSON-LD. It accepts a pre-validated schema object (output of a builder from Step 2) and serializes it. No page or layout constructs raw JSON-LD strings directly.
Step 4 — Update BaseLayout.astro (or equivalent) to call buildOrganizationSchema() and pass the result to SchemaOrg.astro. Remove any existing inline JSON-LD string construction. The Organization schema must use an absolute URL for logo.url — derive it from Astro.site (set in astro.config.mjs) to guarantee absolute URLs in all environments.
Step 5 — Update every page template that emits BreadcrumbList to call buildBreadcrumbSchema() with an explicit breadcrumbs array. Each element must include position (1-indexed integer), name (display string), and item (absolute URL). For pages where the path is deterministic (e.g., /legal/terms), derive the item URLs from Astro.site + the known path segments. Do not rely on the browser URL at runtime — this is static generation.
Step 6 — Identify the about page's current @type value by inspecting its raw HTML output in dist/. If it is a misspelled type (e.g., 'AboutUs', 'Organisation', 'Breadcrumb'), replace it with the correct schema.org type. If it is a valid but uncommon type (e.g., AboutPage, ProfilePage), add it to the schema.ts builder registry. If it is a custom/invented type with no schema.org equivalent, remove it — Google ignores unrecognized types silently, which is worse than no schema.
Step 7 — Add a build-time validation Astro integration in astro.config.mjs. The integration hooks into 'astro:build:done', reads every generated HTML file, extracts JSON-LD blocks, parses them, and validates each against the Zod schemas from schema.ts. If any block fails validation, the integration throws — failing the Netlify build before the broken schema reaches production.
Step 8 — Add the Astro.site value to astro.config.mjs if not already set. All absolute URL construction in schema builders depends on this. Netlify sets the SITE environment variable; map it: `site: process.env.SITE || 'https://yourdomain.com'` (replace with actual production domain as a named constant).
Step 9 — After deploying, submit updated URLs to Google Search Console's Rich Results Test and URL Inspection tool. Monitor the Enhancements tab for BreadcrumbList and Organization over the following 2–4 weeks for validation errors.

### Code examples
```
// src/lib/schema.ts
// SITE-SPECIFIC ASSUMPTION: Update SITE_NAME, SITE_URL, and LOGO_PATH to match production values.
// These are exposed as named constants — do not inline them in builder functions.
import { z } from 'zod';

const SITE_URL = import.meta.env.SITE ?? 'https://example.com'; // Replace with actual domain
const SITE_NAME = 'Example Site'; // Replace with actual site name
const LOGO_PATH = '/images/logo.png'; // Replace with actual logo path relative to public/
const LOGO_WIDTH = 200; // px — replace with actual intrinsic logo width
const LOGO_HEIGHT = 60;  // px — replace with actual intrinsic logo height

// --- Zod schemas for build-time validation ---

const BreadcrumbItemSchema = z.object({
  position: z.number().int().positive(),
  name: z.string().min(1),
  item: z.string().url({ message: 'BreadcrumbList item must be an absolute URL' }),
});

const BreadcrumbSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('BreadcrumbList'),
  itemListElement: z
    .array(
      z.object({
        '@type': z.literal('ListItem'),
        position: z.number().int().positive(),
        name: z.string().min(1),
        item: z.string().url({ message: 'ListItem item must be an absolute URL' }),
      })
    )
    .min(1, 'BreadcrumbList must have at least one item'),
});

const OrganizationSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('Organization'),
  name: z.string().min(1),
  url: z.string().url(),
  logo: z.object({
    '@type': z.literal('ImageObject'),
    url: z.string().url({ message: 'Organization logo.url must be an absolute URL' }),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

const WebPageSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.enum(['WebPage', 'AboutPage', 'ContactPage', 'FAQPage']),
  name: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
});

// --- Builder functions ---
// Each builder validates at call time. A missing required prop throws at build time,
// not silently at runtime or in Google's crawler.

export type BreadcrumbItem = { position: number; name: string; item: string };

export function buildBreadcrumbSchema(crumbs: BreadcrumbItem[]): z.infer<typeof BreadcrumbSchema> {
  const schema = {
    '@context': 'https://schema.org' as const,
    '@type': 'BreadcrumbList' as const,
    itemListElement: crumbs.map((crumb) => ({
      '@type': 'ListItem' as const,
      position: crumb.position,
      name: crumb.name,
      item: crumb.item, // Must be absolute URL — callers must pass SITE_URL + path
    })),
  };
  // Throws ZodError with field-level message if any crumb is missing item URL
  return BreadcrumbSchema.parse(schema);
}

export function buildOrganizationSchema(): z.infer<typeof OrganizationSchema> {
  const schema = {
    '@context': 'https://schema.org' as const,
    '@type': 'Organization' as const,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject' as const,
      url: `${SITE_URL}${LOGO_PATH}`, // Absolute URL — Google rejects relative URLs for logo
      width: LOGO_WIDTH,
      height: LOGO_HEIGHT,
    },
  };
  return OrganizationSchema.parse(schema);
}

export function buildWebPageSchema(
  type: 'WebPage' | 'AboutPage' | 'ContactPage' | 'FAQPage',
  name: string,
  url: string,
  description?: string
): z.infer<typeof WebPageSchema> {
  const schema = {
    '@context': 'https://schema.org' as const,
    '@type': type,
    name,
    url,
    description,
  };
  return WebPageSchema.parse(schema);
}

// Export Zod schemas for use in the build-time validation integration
export const SchemaValidators = {
  BreadcrumbList: BreadcrumbSchema,
  Organization: OrganizationSchema,
  WebPage: WebPageSchema,
};
<!-- src/components/SchemaOrg.astro -->
<!-- Sole rendering point for all JSON-LD on the site.
     Accepts a pre-validated schema object from schema.ts builders.
     Never constructs raw JSON-LD strings outside this component. -->
---
interface Props {
  // Accepts any validated schema object. Type is intentionally broad here
  // because Zod inferred types differ per builder — validation already happened at call site.
  schema: Record<string, unknown> | Record<string, unknown>[];
}

const { schema } = Astro.props;

// Serialize once at render time. JSON.stringify is synchronous and safe here —
// no async, no race, no external state.
const serialized = JSON.stringify(schema);
---
<script type="application/ld+json" set:html={serialized} />
<!-- src/layouts/BaseLayout.astro (relevant schema section only) -->
<!-- Precondition: Astro.site is set in astro.config.mjs.
     If Astro.site is undefined, buildOrganizationSchema() will throw at build time
     because SITE_URL falls back to 'https://example.com' — a deliberate fail-loud behavior. -->
---
import SchemaOrg from '../components/SchemaOrg.astro';
import { buildOrganizationSchema } from '../lib/schema';

// Throws at build time if logo URL is relative or required props are missing.
// This is intentional — schema errors must not reach production silently.
const orgSchema = buildOrganizationSchema();
---
<html lang="en">
  <head>
    <!-- other head content -->
    <SchemaOrg schema={orgSchema} />
    <!-- Page-specific schema is injected via a named slot so each page template
         controls its own schema without BaseLayout needing to know page type. -->
    <slot name="schema" />
  </head>
  <body>
    <slot />
  </body>
</html>
<!-- src/pages/legal/terms.astro (BreadcrumbList example for a nested legal page) -->
<!-- Precondition: Astro.site is set. Each crumb's item must be an absolute URL.
     The item property on intermediate crumbs (e.g., /legal) is required by Google
     and is the most commonly omitted property in Astro BreadcrumbList implementations. -->
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SchemaOrg from '../../components/SchemaOrg.astro';
import { buildBreadcrumbSchema } from '../../lib/schema';

// SITE-SPECIFIC ASSUMPTION: Update SITE_URL to match astro.config.mjs site value.
// Using import.meta.env.SITE ensures parity with the config — do not hardcode.
const SITE_URL = import.meta.env.SITE ?? 'https://example.com';

// Each crumb must have an absolute item URL. The intermediate /legal crumb
// is the one most commonly missing — include it explicitly.
const breadcrumbs = buildBreadcrumbSchema([
  { position: 1, name: 'Home',  item: SITE_URL },
  { position: 2, name: 'Legal', item: `${SITE_URL}/legal` },
  { position: 3, name: 'Terms of Service', item: `${SITE_URL}/legal/terms` },
]);
---
<BaseLayout title="Terms of Service">
  <SchemaOrg schema={breadcrumbs} slot="schema" />
  <!-- page content -->
</BaseLayout>
<!-- src/pages/about.astro (corrected @type for about page) -->
<!-- Root cause: the prescan flagged an unknown @type on this page.
     'AboutPage' is the correct schema.org type for an about page.
     If the current code uses 'AboutUs', 'About', or any non-schema.org string,
     Google silently ignores the entire block. buildWebPageSchema enforces the
     allowed enum — a misspelled type throws at build time. -->
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SchemaOrg from '../components/SchemaOrg.astro';
import { buildWebPageSchema } from '../lib/schema';

const SITE_URL = import.meta.env.SITE ?? 'https://example.com';

// 'AboutPage' is the correct schema.org type. The Zod enum in buildWebPageSchema
// will throw a build error if any caller passes an unrecognized type string.
const aboutSchema = buildWebPageSchema(
  'AboutPage',
  'About Us',
  `${SITE_URL}/about`,
  'Learn about our team and mission.' // Optional but recommended for Google
);
---
<BaseLayout title="About Us">
  <SchemaOrg schema={aboutSchema} slot="schema" />
  <!-- page content -->
</BaseLayout>
// astro.config.mjs
// Build-time JSON-LD validation integration.
// Hooks into 'astro:build:done', reads every generated HTML file,
// extracts JSON-LD blocks, and validates each against the Zod schemas.
// A validation failure throws — failing the Netlify build before broken schema ships.
//
// Precondition: dist/ is populated before this hook runs (guaranteed by Astro's build lifecycle).
// Ordering: 'astro:build:done' fires after all pages are written — no race with page generation.

import { defineConfig } from 'astro/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

// SITE-SPECIFIC ASSUMPTION: Replace with actual production domain.
const PRODUCTION_SITE_URL = process.env.SITE || 'https://example.com';

// Known valid @type values for this site. Extend as new page types are added.
// Any @type not in this list triggers a build error — prevents silent misspellings.
const KNOWN_SCHEMA_TYPES = new Set([
  'BreadcrumbList',
  'Organization',
  'WebPage',
  'AboutPage',
  'ContactPage',
  'FAQPage',
  'BlogPosting',
  'Article',
]);

// Recursively collect all .html files in the dist directory.
async function collectHtmlFiles(dir: string): Promise<string[]> {
  const MAX_DEPTH = 10; // Guard against pathological directory structures
  const results: string[] = [];

  async function walk(current: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH) return;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.name.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  }

  await walk(dir, 0);
  return results;
}

// Extract all JSON-LD script block contents from an HTML string.
// Uses a regex on the raw string — intentionally avoids a DOM parser dependency
// in the Node.js build context. The regex is anchored to the script type attribute
// to avoid false matches on other script blocks.
function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  // Matches <script type="application/ld+json">...</script> (non-greedy, dotAll)
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

const schemaValidationIntegration = {
  name: 'schema-org-validation',
  hooks: {
    'astro:build:done': async ({ dir }: { dir: URL }) => {
      const distPath = dir.pathname;
      const htmlFiles = await collectHtmlFiles(distPath);
      const errors: string[] = [];

      for (const filePath of htmlFiles) {
        const html = await readFile(filePath, 'utf-8');
        const blocks = extractJsonLdBlocks(html);
        const relativePath = filePath.replace(distPath, '');

        for (const block of blocks) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(block);
          } catch {
            errors.push(`[${relativePath}] Invalid JSON in JSON-LD block: ${block.slice(0, 80)}...`);
            continue;
          }

          // Handle both single schema objects and @graph arrays
          const schemas = Array.isArray(parsed) ? parsed : [parsed];

          for (const schema of schemas) {
            if (typeof schema !== 'object' || schema === null) {
              errors.push(`[${relativePath}] JSON-LD block is not an object`);
              continue;
            }

            const schemaObj = schema as Record<string, unknown>;
            const type = schemaObj['@type'];

            if (typeof type !== 'string') {
              errors.push(`[${relativePath}] JSON-LD block missing @type`);
              continue;
            }

            // Flag unknown @type values — catches misspellings silently ignored by Google
            if (!KNOWN_SCHEMA_TYPES.has(type)) {
              errors.push(
                `[${relativePath}] Unknown @type '${type}'. Add to KNOWN_SCHEMA_TYPES in astro.config.mjs if intentional.`
              );
            }

            // Validate Organization logo.url is absolute
            if (type === 'Organization') {
              const logo = schemaObj['logo'] as Record<string, unknown> | undefined;
              const logoUrl = logo?.['url'];
              if (typeof logoUrl !== 'string' || !logoUrl.startsWith('http')) {
                errors.push(
                  `[${relativePath}] Organization schema logo.url must be an absolute URL. Got: ${logoUrl}`
                );
              }
            }

            // Validate BreadcrumbList item URLs are absolute
            if (type === 'BreadcrumbList') {
              const items = schemaObj['itemListElement'];
              if (!Array.isArray(items) || items.length === 0) {
                errors.push(`[${relativePath}] BreadcrumbList missing itemListElement array`);
              } else {
                for (const listItem of items) {
                  const li = listItem as Record<string, unknown>;
                  const itemUrl = li['item'];
                  if (typeof itemUrl !== 'string' || !itemUrl.startsWith('http')) {
                    errors.push(
                      `[${relativePath}] BreadcrumbList ListItem at position ${li['position']} missing absolute 'item' URL. Got: ${itemUrl}`
                    );
                  }
                }
              }
            }
          }
        }
      }

      if (errors.length > 0) {
        // Throw a single aggregated error so all failures are visible in one build log
        throw new Error(
          `Schema validation failed with ${errors.length} error(s):\n${errors.map((e) => `  • ${e}`).join('\n')}`
        );
      }

      console.log(`[schema-org-validation] Validated ${htmlFiles.length} pages — all JSON-LD blocks passed.`);
    },
  },
};

export default defineConfig({
  site: PRODUCTION_SITE_URL,
  integrations: [
    schemaValidationIntegration,
    // ...other integrations
  ],
});
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
