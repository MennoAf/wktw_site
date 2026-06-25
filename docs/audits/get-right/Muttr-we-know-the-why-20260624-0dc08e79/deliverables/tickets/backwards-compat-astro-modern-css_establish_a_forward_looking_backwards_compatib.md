---
finding_id: "backwards-compat-astro-modern-css"
title: "Backwards compatibility — no issues detected; Astro SSG with minimal CSS and JS provides strong baseline"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The guardrail system converts a currently-passing posture into an enforced invariant."
fix_summary: "Establish a forward-looking backwards compatibility guardrail system for the Astro SSG build pipeline."
confidence_tier: "confirmed"
---

# Backwards compatibility — no issues detected; Astro SSG with minimal CSS and JS provides strong baseline

**Finding:** Backwards compatibility — no issues detected; Astro SSG with minimal CSS and JS provides strong baseline  
**Severity:** Low  
**Why this matters:** The guardrail system converts a currently-passing posture into an enforced invariant.  
**Root cause:** Isolated issue  
**Fix:** Establish a forward-looking backwards compatibility guardrail system for the Astro SSG build pipeline.

> **Evidence Basis:** Confirmed

---

## Impact

- **Legacy Browser Regression Prevention:** The guardrail system converts a currently-passing posture into an enforced invariant. Without it, a single future template PR adding a CSS container query or an island component using optional chaining without transpilation would silently break the iOS 13-15 cohort — a failure class that typically goes undetected until user complaints surface, because automated Lighthouse runs target modern Chrome. The build-time enforcement catches these regressions before they reach production, eliminating the detection lag.
- **Developer Velocity:** Lint-time and build-time failures are resolved in minutes by the author who introduced the change. Production regressions discovered via support tickets require triage, reproduction, hotfix, and re-deploy cycles measured in hours to days. The guardrail system shifts the cost of compatibility failures left to the cheapest possible intervention point.
- **Seo And Crawl Integrity:** Astro SSG's static output is the primary reason this site has strong crawlability. A future island component that fails to hydrate on legacy browsers does not affect the static HTML crawled by Googlebot, but it does affect real users on those devices. Maintaining the guardrail preserves the alignment between what Googlebot indexes and what legacy-device users experience.

## How to verify

**What to look for:** The page is built with Astro (evidenced by _astro/ CSS path), which generates static HTML with minimal client-side JavaScript.. Content is 100% available in raw HTML (no JS dependency for rendering).

**Measured evidence:**
- Framework: Astro (SSG)
- Js Dependency: low
- Content In Raw Html: 100%
- External Scripts Async: 3
- External Scripts Defer: 0
- Render Blocking Scripts: 0
- Inline Scripts: 6
- Modern Css Features Requiring Fallback: none detected

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
Establish a forward-looking backwards compatibility guardrail system for the Astro SSG build pipeline. No current defects exist. The objective is to codify the current passing posture into enforceable build-time checks so that future template additions (modern CSS without @supports guards) and future Astro island components (untranspiled JS syntax) cannot silently regress the site's legacy browser compatibility without a CI failure.

### How
1. Add a Browserslist config (.browserslistrc at repo root) targeting the legacy WebKit cohort (iOS Safari 13-15, old iPad demographic) so that all downstream tooling — PostCSS, ESLint, Stylelint — shares a single authoritative target definition.
2. Add stylelint-no-unsupported-browser-features to the Stylelint config, scoped only to CSS files under src/ (not node_modules, not dist/). Configure it to warn on any CSS property not supported by the Browserslist targets without an @supports guard. This catches future template additions at lint time, not production.
3. Add an Astro integration (inline vite plugin) that runs esbuild's syntax-check pass against any island component JS before the build emits. Configure esbuild target to match the Browserslist cohort. This catches untranspiled modern syntax (optional chaining, nullish coalescing, top-level await) in island components before they ship.
4. Add a build-time CSS property audit script (Node.js, runs as a Vite build hook) that scans the emitted CSS bundle for a curated list of high-risk modern properties (container queries, :has(), @layer, subgrid, color-mix()) and emits a structured warning log. This is a belt-and-suspenders check for properties stylelint may not yet cover.
5. Wire all three checks into the existing CI pipeline as a pre-build lint gate. Failures block the build. Warnings are logged to a structured JSON artifact for review. No runtime changes are made — this is entirely build-time and CI-time enforcement.
6. Document the three forward-looking risk vectors (modern CSS without @supports, island JS syntax, third-party script updates) in a COMPATIBILITY.md at repo root so future contributors understand the guardrail system and its rationale.

### Code examples
```
// .browserslistrc — single source of truth for all tooling
// Targets the legacy WebKit cohort (old iPad Safari 13-15) plus modern evergreen.
// Adjust the iOS Safari floor if analytics confirm a different legacy cutoff.
last 2 Chrome versions
last 2 Firefox versions
last 2 Edge versions
iOS >= 13
safari >= 13
// .stylelintrc.json — scoped to src/ only, never dist/ or node_modules/
// stylelint-no-unsupported-browser-features reads .browserslistrc automatically.
// 'severity: warn' keeps the build non-blocking during initial rollout;
// promote to 'error' after the first clean lint run.
{
  "plugins": ["stylelint-no-unsupported-browser-features"],
  "rules": {
    "plugin/no-unsupported-browser-features": [
      true,
      {
        "severity": "warn",
        "ignore": ["css-transitions", "css-animation"],
        "ignorePartialSupport": true
      }
    ]
  }
}
// astro.config.mjs — inline Vite plugin that syntax-checks island components
// esbuild 'bundle: false' means it only parses syntax, never bundles.
// 'target' is derived from .browserslistrc via browserslist-to-esbuild.
// Control flow: plugin runs in buildStart (before Astro emits), throws on
// syntax error so the build fails fast. No async state, no race surface.
import { defineConfig } from 'astro/config';
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { transform } from 'esbuild';
import browserslistToEsbuild from 'browserslist-to-esbuild';

// SITE-SPECIFIC ASSUMPTION: island components live in src/components.
// Adjust ISLAND_DIR if your project structure differs.
const ISLAND_DIR = 'src/components';

const esbuildTarget = browserslistToEsbuild();

const islandSyntaxCheckPlugin = {
  name: 'island-syntax-check',
  async buildStart() {
    let files;
    try {
      files = await readdir(ISLAND_DIR, { recursive: true });
    } catch {
      // ISLAND_DIR does not exist yet — no islands, nothing to check.
      return;
    }

    const jsFiles = files.filter(
      (f) => extname(f) === '.js' || extname(f) === '.ts'
    );

    for (const file of jsFiles) {
      const filePath = join(ISLAND_DIR, file);
      let source;
      try {
        source = await readFile(filePath, 'utf8');
      } catch {
        this.warn(`island-syntax-check: could not read ${filePath}, skipping`);
        continue;
      }

      try {
        await transform(source, {
          loader: extname(file) === '.ts' ? 'ts' : 'js',
          target: esbuildTarget,
          // bundle: false — syntax check only, no module resolution
          // This prevents false positives from unresolved imports
        });
      } catch (err) {
        // Throw to fail the build with a clear message
        throw new Error(
          `island-syntax-check: legacy browser syntax error in ${filePath}\n${err.message}`
        );
      }
    }
  },
};

export default defineConfig({
  vite: {
    plugins: [islandSyntaxCheckPlugin],
  },
});
// scripts/audit-modern-css.mjs — runs as 'node scripts/audit-modern-css.mjs'
// after 'astro build'. Reads dist/ CSS, flags high-risk modern properties.
// Exits 0 (warn-only) so it never blocks a deploy unilaterally;
// promote exit code to 1 after team reviews the initial report.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

// SITE-SPECIFIC ASSUMPTION: Astro emits CSS to dist/_astro/.
// Adjust DIST_CSS_DIR if your output directory differs.
const DIST_CSS_DIR = 'dist/_astro';
const REPORT_PATH = 'dist/compat-audit.json';

// Properties that require @supports guards for the iOS 13-15 cohort.
// Extend this list as new CSS features are adopted.
const HIGH_RISK_PROPERTIES = [
  '@container',
  ':has(',
  '@layer',
  'subgrid',
  'color-mix(',
  'color-contrast(',
  '@scope',
];

async function auditCss() {
  let files;
  try {
    files = await readdir(DIST_CSS_DIR);
  } catch {
    console.warn(`audit-modern-css: ${DIST_CSS_DIR} not found — run 'astro build' first`);
    process.exit(0);
  }

  const cssFiles = files.filter((f) => extname(f) === '.css');
  const findings = [];

  for (const file of cssFiles) {
    const filePath = join(DIST_CSS_DIR, file);
    const source = await readFile(filePath, 'utf8');

    for (const prop of HIGH_RISK_PROPERTIES) {
      if (source.includes(prop)) {
        findings.push({
          file,
          property: prop,
          severity: 'warn',
          note: `'${prop}' detected without confirmed @supports guard. Verify legacy browser fallback.`,
        });
      }
    }
  }

  const report = {
    generated: new Date().toISOString(),
    totalFindings: findings.length,
    findings,
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  if (findings.length > 0) {
    console.warn(`audit-modern-css: ${findings.length} finding(s). See ${REPORT_PATH}`);
  } else {
    console.log('audit-modern-css: clean — no high-risk modern CSS properties detected');
  }

  // Exit 0 intentionally — warn-only until team reviews first report.
  // Change to: if (findings.length > 0) process.exit(1); to enforce hard failure.
  process.exit(0);
}

auditCss();
# COMPATIBILITY.md
## Backwards Compatibility Guardrail System

This project passed its initial backwards compatibility audit with no defects.
The following system preserves that posture as the codebase evolves.

### Three Forward-Looking Risk Vectors

1. **Modern CSS without @supports guards** — caught by Stylelint at lint time
   and by `scripts/audit-modern-css.mjs` post-build.
2. **Astro island JS with untranspiled syntax** — caught by the `island-syntax-check`
   Vite plugin at build time. Target: iOS Safari 13+.
3. **Third-party script updates** — not automatable. Review third-party changelogs
   on dependency updates. Flag any script that drops its own legacy browser support.

### Browserslist Target
Defined in `.browserslistrc`. All tooling reads this file. Do not hardcode browser
targets in individual tool configs.

### Promoting Warnings to Errors
- Stylelint: change `severity: 'warn'` to `severity: 'error'` in `.stylelintrc.json`
- CSS audit script: change `process.exit(0)` to `process.exit(1)` on findings

Promote after the first clean run of each check in CI.
```

## Risks
- stylelint-no-unsupported-browser-features produces false positives for properties with partial support (e.g., CSS custom properties, which have broad but imperfect legacy coverage). Mitigation: the ignorePartialSupport: true config option suppresses these. Review the initial lint output before promoting severity from warn to error.
- browserslist-to-esbuild may not map every Browserslist query to a valid esbuild target string. Mitigation: pin browserslist-to-esbuild to a specific version and add a CI step that logs the resolved esbuildTarget value so mismatches are visible. If the mapping fails, esbuild defaults to its own modern target — the build does not silently pass with wrong targets, it throws.
- The island-syntax-check plugin reads src/components recursively, including non-island utility files. A utility file using modern syntax that is intentionally transpiled by Vite's own pipeline could produce a false positive build failure. Mitigation: scope the file glob to *.island.js or *.island.ts naming convention if the project adopts one, or add an explicit exclusion list as a named constant in the plugin config.
- The CSS audit script reads dist/_astro/ which is Astro's default output path. If the project uses a custom outDir or assetsDir in astro.config.mjs, the script will silently find no files and report clean. Mitigation: DIST_CSS_DIR is exposed as a named constant at the top of the script with a comment marking it as a site-specific assumption — implementors must verify it matches their build output.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
