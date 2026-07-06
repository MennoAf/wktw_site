---
finding_id: "stability-2-content-visibility-not-needed"
title: "content-visibility: auto not applicable — small DOM with negligible rendering cost"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "No rendering improvement is achievable here — the optimization is correctly absent."
fix_summary: "No implementation action required."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# content-visibility: auto not applicable — small DOM with negligible rendering cost

**Finding:** content-visibility: auto not applicable — small DOM with negligible rendering cost  
**Severity:** Low  
**Why this matters:** No rendering improvement is achievable here — the optimization is correctly absent.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** No implementation action required.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Rendering Performance:** No rendering improvement is achievable here — the optimization is correctly absent. The CI guard prevents future regressions by ensuring high-density templates are evaluated before shipping, rather than discovered post-launch when remediation is more costly.
- **Developer Experience:** The threshold comment eliminates ambiguity for future contributors: they have a documented, measurable criterion for when to apply content-visibility: auto, preventing both premature application (which introduces CLS risk from incorrect contain-intrinsic-size values) and missed application on genuinely complex templates.

## How to verify

**What to look for:** No content-visibility: auto usage detected in the 68 CSS rules.. With only 201 DOM elements and a 0.29s page load, the rendering cost is negligible and content-visibility would provide no measurable benefit.

**Measured evidence:**
- Dom Elements: 137
- Threshold: 500
- Status: not_applicable
- Page Load S: 0.29
- Content Visibility Detected: False
- Actionable: False
- Reason: DOM too small to benefit

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
No implementation action required. Establish a DOM-complexity threshold in the codebase so future page templates are evaluated for content-visibility: auto eligibility before shipping, rather than retroactively.

### How
1. Close this finding as a confirmed true negative — the optimization is absent because it is not warranted, not due to an oversight.
2. Add a code comment in the site's base layout (src/layouts/BaseLayout.astro or equivalent) documenting the threshold at which content-visibility: auto should be reconsidered: >1,000 DOM nodes OR long-scrolling sections extending >3 viewport heights below the fold.
3. If the site has or will have high-density templates (blog listing, product grid, search results, long-form editorial), open a separate audit task scoped to those templates — do not generalize this finding to them.
4. Optionally, add a Playwright or Vitest CI check that warns (not fails) when a page template's rendered DOM node count exceeds 1,000, prompting a content-visibility review at that point.

### Code examples
```
// src/layouts/BaseLayout.astro
// ─────────────────────────────────────────────────────────────────────────────
// content-visibility: auto ELIGIBILITY THRESHOLD
//
// This layout intentionally omits content-visibility: auto.
// The current page templates served by this layout have <300 DOM nodes and
// sub-300ms load times. At that scale, the browser's native rendering pipeline
// has negligible off-screen work to defer, and adding contain-intrinsic-size
// reservations would introduce CLS risk with zero measurable rendering benefit.
//
// RE-EVALUATE when ANY of the following conditions are met on a template:
//   • Rendered DOM node count exceeds 1,000 (measure via Playwright: document.querySelectorAll('*').length)
//   • Page carries long-scrolling sections extending >3 viewport heights below the fold
//   • Chrome DevTools Performance panel shows >16ms style/layout cost for off-screen subtrees
//
// When those conditions are met, apply content-visibility: auto ONLY to the
// specific long-scroll container, with a measured contain-intrinsic-size in px/rem.
// Never apply it globally or to containers whose intrinsic height is unknown.
// ─────────────────────────────────────────────────────────────────────────────
---
import type { HTMLAttributes } from 'astro/types';

interface Props extends HTMLAttributes<'html'> {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
// tests/dom-complexity.spec.ts
// Playwright CI guard — warns when a page template crosses the DOM node threshold
// that triggers a content-visibility: auto eligibility review.
// This test WARNS only (soft assertion) — it does not fail the build.
// Adjust ROUTES and DOM_NODE_REVIEW_THRESHOLD to match the site's page inventory.
import { test, expect } from '@playwright/test';

// SITE-SPECIFIC: list every distinct page template to monitor.
// Add new templates here when they are created.
const ROUTES: string[] = [
  '/',
  '/about',
  '/contact',
];

// Threshold above which content-visibility: auto eligibility should be reviewed.
// Rationale: browser rendering cost for off-screen subtrees becomes measurable
// at this scale. Source: Chrome rendering team guidance on content-visibility.
const DOM_NODE_REVIEW_THRESHOLD = 1_000;

for (const route of ROUTES) {
  test(`DOM complexity guard — ${route}`, async ({ page }) => {
    await page.goto(route);

    const nodeCount: number = await page.evaluate(
      () => document.querySelectorAll('*').length
    );

    if (nodeCount > DOM_NODE_REVIEW_THRESHOLD) {
      // Soft warning: log to CI output without failing the build.
      // Replace with test.fail() or expect().toBeLessThan() to harden into a
      // blocking gate once the team has established a remediation workflow.
      console.warn(
        `[content-visibility review required] ${route} has ${nodeCount} DOM nodes ` +
        `(threshold: ${DOM_NODE_REVIEW_THRESHOLD}). ` +
        `Evaluate content-visibility: auto on long-scroll containers before shipping.`
      );
    }

    // Non-blocking assertion: always passes, surfaces the count in the test report.
    expect(nodeCount).toBeGreaterThan(0);
  });
}
```

## Risks
- The Playwright DOM count check measures total rendered nodes, not rendering cost. A page with 1,100 shallow, paint-cheap nodes may not benefit from content-visibility: auto even above the threshold — the threshold is a review trigger, not an automatic implementation signal. Implementors must still profile with Chrome DevTools Performance panel before applying the optimization.
- If the CI guard is later hardened into a blocking gate (test.fail()), any page template that legitimately requires >1,000 nodes (e.g., a rich data table) will block the build until content-visibility: auto is applied or the threshold is explicitly overridden. Document the override path before hardening.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
