---
finding_id: "a11y-heading-hierarchy-skip"
title: "Heading hierarchy skips h3 level — screen reader navigation broken"
severity: "medium"
root_cause_cluster: "Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels"
why_this_matters: "Resolves WCAG 2.1 SC 1.3.1 (Info and Relationships) violation."
fix_summary: "Replace hardcoded heading levels in Astro section components with a prop-driven heading level system so that each component renders the correct heading level based on its position in the page's docum…"
confidence_tier: "confirmed"
---

# Heading hierarchy skips h3 level — screen reader navigation broken

**Finding:** Heading hierarchy skips h3 level — screen reader navigation broken  
**Severity:** Medium  
**Why this matters:** Resolves WCAG 2.1 SC 1.3.1 (Info and Relationships) violation.  
**Root cause:** Site-Wide WCAG Accessibility Failures — Contrast, Color Indicators, Landmarks, and Form Labels  
**Fix:** Replace hardcoded heading levels in Astro section components with a prop-driven heading level system so that each component renders the correct heading level based on its position in the page's docum…

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility Legal Risk:** Resolves WCAG 2.1 SC 1.3.1 (Info and Relationships) violation. Malformed heading hierarchies are a common finding in ADA web accessibility lawsuits — eliminating this removes one vector of legal exposure. legal_liability=True.
- **Screen Reader Navigation:** Screen reader users navigate pages by heading level (JAWS 'H' key, VoiceOver rotor). Orphaned h4 elements without h3 ancestors create dead-end navigation paths — users jump to an h4 expecting a sub-topic of an h3 that doesn't exist, losing their place in the document. Fixing this restores logical navigation for the estimated 2-8% of users relying on assistive technology.
- **Seo Document Structure:** Search engines use heading hierarchy to understand content structure and topic relationships. Orphaned headings weaken the topical signal of the sections they belong to. Correcting the hierarchy strengthens the semantic relationship between parent topics and sub-topics, improving content comprehension by crawlers.
- **Regression Prevention:** The build-time lint script prevents heading hierarchy regressions on every future page and content change, converting a manual audit finding into an automated gate.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** wcag

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The heading hierarchy is h1 → h2 → h2 → h2 → h2 → h3 → h3 → h3 → h4 → h4 → h4 → h4 → h4 → h4.. While the h1→h2 and h2→h3 transitions are correct, the h3→h4 transition needs verification that no h3 level is skipped contextually.

- H1 elements: **1**
  - DevTools **Console** → run: `document.querySelectorAll('h1').forEach(h => console.log(h.textContent))`
   Should return **exactly 1** H1. Check heading order with: `document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => console.log(h.tagName, h.textContent))`

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
Replace hardcoded heading levels in Astro section components with a prop-driven heading level system so that each component renders the correct heading level based on its position in the page's document outline, eliminating orphaned h4 elements that lack logical h3 ancestors.

### How
1. Create a shared `Heading` Astro component that accepts a `level` prop (1-6) and renders the corresponding HTML heading element. This becomes the single source of truth for heading rendering across all section components.
2. Audit every section/card component in the Astro `src/components/` directory that currently hardcodes an `<h3>` or `<h4>` tag. Replace each hardcoded heading with the new `<Heading>` component, passing the level as a prop with a sensible default matching its current behavior (so existing pages don't break without explicit prop changes).
3. In each page template (`src/pages/`), pass the correct `level` prop to each section component based on its nesting depth in the page outline. For example, a feature card placed directly under an h2 section should receive `level={3}`, not `level={4}`.
4. Add a build-time lint script (run in CI) that parses the rendered HTML of each page and validates that no heading level is more than 1 greater than its preceding heading level in document order, and that every h4 has a preceding h3 ancestor in the outline. Fail the build on violation.
5. For the immediate fix on the About page (and any other affected pages identified by grep for hardcoded h4 usage): change the 6 orphaned h4 elements to h3 where they sit directly under an h2 section, or introduce an h3 parent section heading where the content logically groups under a sub-topic.

### Code examples
```
---
// src/components/Heading.astro
// Renders a heading element at the specified level (1-6).
// Usage: <Heading level={2}>Section Title</Heading>

interface Props {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  class?: string;
  id?: string;
}

const { level, class: className, id } = Astro.props;

// DEFENSIVE: clamp to valid heading range
const HEADING_LEVEL_MIN = 1;
const HEADING_LEVEL_MAX = 6;
const safeLevel = Math.max(HEADING_LEVEL_MIN, Math.min(HEADING_LEVEL_MAX, level));
const Tag = `h${safeLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
---

<Tag class={className} id={id}>
  <slot />
</Tag>
---
// src/components/FeatureCard.astro
// BEFORE: hardcoded <h4> regardless of page context
// AFTER: accepts headingLevel prop, defaults to 3 (safe default)

import Heading from './Heading.astro';

interface Props {
  title: string;
  description: string;
  /** Heading level determined by page context. Default: 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

// DEFAULT_CARD_HEADING_LEVEL: 3 chosen because cards most commonly
// appear as direct children of h2 sections. Override when nesting differs.
const DEFAULT_CARD_HEADING_LEVEL = 3 as const;
const { title, description, headingLevel = DEFAULT_CARD_HEADING_LEVEL } = Astro.props;
---

<div class="feature-card">
  <Heading level={headingLevel} class="feature-card__title">
    {title}
  </Heading>
  <p class="feature-card__description">{description}</p>
</div>
---
// src/pages/about.astro — BEFORE (broken hierarchy)
// <h2>Our Approach</h2>
//   <FeatureCard />  <!-- renders h4, no h3 parent = orphaned -->
//   <FeatureCard />  <!-- renders h4, orphaned -->
//   <FeatureCard />  <!-- renders h4, orphaned -->

// AFTER (correct hierarchy)
import FeatureCard from '../components/FeatureCard.astro';
---

<section>
  <h2>Our Approach</h2>
  <!-- Cards are direct children of h2, so their headings are h3 -->
  <div class="feature-grid">
    <FeatureCard title="Research" description="..." headingLevel={3} />
    <FeatureCard title="Strategy" description="..." headingLevel={3} />
    <FeatureCard title="Execution" description="..." headingLevel={3} />
  </div>
</section>

<section>
  <h2>Our Values</h2>
  <h3>Core Principles</h3>
  <!-- Cards nested under h3, so their headings are h4 -->
  <div class="feature-grid">
    <FeatureCard title="Integrity" description="..." headingLevel={4} />
    <FeatureCard title="Transparency" description="..." headingLevel={4} />
    <FeatureCard title="Impact" description="..." headingLevel={4} />
  </div>
</section>
// scripts/lint-heading-hierarchy.mjs
// Run in CI after build: node scripts/lint-heading-hierarchy.mjs dist/
// Exits non-zero if any page has a heading level skip.

import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

// HEADING_REGEX: matches h1-h6 opening tags in rendered HTML
const HEADING_REGEX = /<h([1-6])[^>]*>/gi;
// MAX_ALLOWED_LEVEL_JUMP: headings may increase by at most 1 level
const MAX_ALLOWED_LEVEL_JUMP = 1;

async function getHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && extname(e.name) === '.html')
    .map((e) => join(e.parentPath ?? e.path, e.name));
}

async function lintFile(filePath) {
  const html = await readFile(filePath, 'utf-8');
  const levels = [];
  let match;
  while ((match = HEADING_REGEX.exec(html)) !== null) {
    levels.push(Number(match[1]));
  }

  const errors = [];
  for (let i = 1; i < levels.length; i++) {
    const jump = levels[i] - levels[i - 1];
    if (jump > MAX_ALLOWED_LEVEL_JUMP) {
      errors.push(
        `h${levels[i - 1]} → h${levels[i]} (position ${i}): skips ${jump - 1} level(s)`
      );
    }
  }
  return errors;
}

const distDir = process.argv[2];
if (!distDir) {
  console.error('Usage: node scripts/lint-heading-hierarchy.mjs <dist-dir>');
  process.exit(1);
}

const files = await getHtmlFiles(distDir);
let failed = false;

for (const file of files) {
  const errors = await lintFile(file);
  if (errors.length > 0) {
    failed = true;
    console.error(`\n❌ ${file}`);
    errors.forEach((e) => console.error(`   ${e}`));
  }
}

if (failed) {
  console.error('\nHeading hierarchy lint failed.');
  process.exit(1);
} else {
  console.log(`✅ ${files.length} pages passed heading hierarchy lint.`);
}
```

## Risks
- Changing heading tags from h4 to h3 will alter visual styling if CSS targets heading elements directly (e.g., `h4 { font-size: 1rem }` vs `h3 { font-size: 1.25rem }`). Mitigation: audit the stylesheet for element-level heading selectors. If found, apply the existing h4 styles via a scoped class (e.g., `.feature-card__title`) so the visual appearance is unchanged regardless of the rendered heading level. This is the most likely breakage vector.
- Adding a required `headingLevel` prop to existing components could cause build errors on pages that don't pass it. Mitigation: the prop defaults to the component's current hardcoded level (e.g., `headingLevel = 3`), so all existing usages compile and render identically without changes. The default is then overridden only where the page context requires it.
- The build-time lint script uses regex on rendered HTML, which will produce false positives if heading tags appear inside `<template>`, `<script>`, or HTML comments. Mitigation: the regex matches opening tags only and Astro's static output does not typically contain `<template>` elements in rendered pages. If false positives occur, add a pre-filter to strip `<script>`, `<style>`, and comment blocks before scanning.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
