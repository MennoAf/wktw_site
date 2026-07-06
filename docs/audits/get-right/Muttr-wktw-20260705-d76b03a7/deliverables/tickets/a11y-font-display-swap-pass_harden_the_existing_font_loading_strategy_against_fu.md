---
finding_id: "a11y-font-display-swap-pass"
title: "All fonts use font-display: swap — no FOIT risk, FOUT acceptable for this site type — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The crossorigin verification directly prevents a double-fetch failure mode: if crossorigin is absent, the browser fetches the font twice — once for the preload and once for the @font-face CORS reques…"
fix_summary: "Harden the existing font loading strategy against future template drift by: (1) verifying crossorigin attributes are present on all font preload links, (2) adding a build-time guard that fails the As…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# All fonts use font-display: swap — no FOIT risk, FOUT acceptable for this site type — PASS

**Finding:** All fonts use font-display: swap — no FOIT risk, FOUT acceptable for this site type — PASS  
**Severity:** Low  
**Why this matters:** The crossorigin verification directly prevents a double-fetch failure mode: if crossorigin is absent, the browser fetches the font twice — once for the preload and once for the @font-face CORS reques…  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Harden the existing font loading strategy against future template drift by: (1) verifying crossorigin attributes are present on all font preload links, (2) adding a build-time guard that fails the As…  

> **Evidence Basis:** Confirmed

---

## Impact

- **Lcp And Fout Stability:** The crossorigin verification directly prevents a double-fetch failure mode: if crossorigin is absent, the browser fetches the font twice — once for the preload and once for the @font-face CORS request — meaning the preload provides zero benefit and Inter/Lora arrive later than expected, extending the FOUT window on every page load. Confirming crossorigin is present ensures the preload actually eliminates the font's network round-trip from the critical path for above-fold text.
- **Build Resilience:** The prebuild audit converts a silent runtime regression (JetBrains Mono appearing above the fold without a preload) into a hard build failure. Without this guard, a future template change could introduce a visible FOUT on code-heavy hero sections with no automated signal — the regression would only be caught by manual QA or user reports. The guard eliminates that gap entirely at zero runtime cost.
- **Maintainability:** Centralizing the preload list in fonts.ts means any future contributor adding a font weight or family has a single, documented location to update. Without this, preload links and @font-face declarations can drift out of sync across layout files, producing orphaned preloads (wasted bandwidth) or missing preloads (FOUT regressions).

## How to verify

**What to look for:** All 6 @font-face declarations (Inter, Lora, JetBrains Mono — 2 weights each) use font-display: swap.. This means text is immediately visible in fallback fonts, then swaps to custom fonts when loaded (FOUT — Flash of Unstyled Text).

**Measured evidence:**
- Font Faces: 6
- Font Display Values: ['swap', 'swap', 'swap', 'swap', 'swap', 'swap']
- Fonts: ['Inter', 'Lora', 'JetBrains Mono']
- Font Display Strategy: swap (all 6 declarations)
- Preloaded Fonts: ['inter-latin.woff2', 'lora-latin.woff2']
- Not Preloaded: ['jetbrainsmono-latin.woff2']
- Fout Duration: minimized by preloading critical fonts

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
Harden the existing font loading strategy against future template drift by: (1) verifying crossorigin attributes are present on all font preload links, (2) adding a build-time guard that fails the Astro build if a <code> or <pre> element appears in any component marked as above-fold, and (3) documenting the preload contract as a named constant in the font config so future contributors cannot silently violate it.

### How
1. Open the root layout (e.g., src/layouts/BaseLayout.astro) and locate all <link rel='preload' as='font'> declarations for Inter and Lora. Confirm each has crossorigin='anonymous'. If either is missing crossorigin, add it — without it the browser issues two network requests for the same font file (one for the preload, one for the CORS-fetched @font-face), negating the preload entirely.
2. Create src/config/fonts.ts as the single source of truth for which font families are preloaded. Export a typed PRELOADED_FONTS array and an ABOVE_FOLD_CODE_FONT constant (null by default, set to 'JetBrains Mono' if a code-heavy hero is ever introduced). This makes the preload contract explicit and grep-able.
3. Create scripts/audit-above-fold-code.mjs — a Node.js script that runs during the Astro build (via package.json 'prebuild' hook). It scans all .astro component files in src/components/ and src/layouts/ for any file that (a) is not explicitly tagged @below-fold and (b) contains a <code>, <pre>, or <kbd> element. If found, it logs a warning listing the file and element, and exits with code 1 to fail the build. This converts the silent runtime risk into a loud build-time failure.
4. Add a JSDoc comment block to the @font-face declarations in the global CSS file (e.g., src/styles/fonts.css) documenting the preload contract: which fonts are preloaded, why JetBrains Mono is excluded, and what must change if a code element appears above the fold.
5. Add the prebuild script to package.json so it runs automatically before every Astro build, including Netlify CI builds.

### Code examples
```
// src/config/fonts.ts
// SITE-SPECIFIC ASSUMPTION: Inter and Lora are the only fonts
// that appear above the fold on any current page template.
// JetBrains Mono is excluded from preload because all code samples
// are below the fold. If a code-heavy hero or inline <code> element
// is introduced above the fold, add 'JetBrains Mono' to PRELOADED_FONTS
// AND update the prebuild audit script to allow it.

export const PRELOADED_FONTS: ReadonlyArray<{
  family: string;
  weight: string;
  style: string;
  file: string;
}> = [
  { family: 'Inter',  weight: '400', style: 'normal', file: '/fonts/inter-400.woff2' },
  { family: 'Inter',  weight: '700', style: 'normal', file: '/fonts/inter-700.woff2' },
  { family: 'Lora',   weight: '400', style: 'normal', file: '/fonts/lora-400.woff2' },
  { family: 'Lora',   weight: '700', style: 'normal', file: '/fonts/lora-700.woff2' },
] as const;

// Null = JetBrains Mono is intentionally NOT preloaded.
// Change to 'JetBrains Mono' only after adding its preload link
// to BaseLayout.astro and verifying no above-fold code elements exist.
export const ABOVE_FOLD_CODE_FONT: string | null = null;
<!-- src/layouts/BaseLayout.astro -->
---
import { PRELOADED_FONTS } from '../config/fonts.ts';
---
<head>
  <!--
    Font preload contract — see src/config/fonts.ts for rationale.
    crossorigin='anonymous' is REQUIRED on every font preload.
    Omitting it causes a double-fetch: the browser treats the preload
    request and the subsequent CORS @font-face request as different
    resources and fetches the file twice.
  -->
  {PRELOADED_FONTS.map(font => (
    <link
      rel="preload"
      as="font"
      type="font/woff2"
      href={font.file}
      crossorigin="anonymous"
    />
  ))}
</head>
// scripts/audit-above-fold-code.mjs
// Runs as 'prebuild' in package.json.
// Fails the build (exit 1) if any component that is NOT explicitly
// tagged @below-fold contains a <code>, <pre>, or <kbd> element.
// This converts the silent JetBrains Mono preload-gap risk into a
// loud build-time failure.

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

// SITE-SPECIFIC ASSUMPTION: components live in these two directories.
// Adjust if your project uses a different structure.
const SCAN_DIRS = ['src/components', 'src/layouts'];

// Elements that imply JetBrains Mono may render.
const CODE_ELEMENT_PATTERN = /<(code|pre|kbd)[\s>]/i;

// Opt-out tag: add this comment to a component that intentionally
// renders code elements below the fold.
// Example: <!-- @below-fold: code samples are in a tabbed section -->
const BELOW_FOLD_TAG = '@below-fold';

async function collectFiles(dir) {
  let results = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(await collectFiles(fullPath));
      } else if (entry.name.endsWith('.astro')) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // Directory may not exist in all project configurations — skip silently.
    if (err.code !== 'ENOENT') throw err;
  }
  return results;
}

async function audit() {
  const violations = [];

  for (const dir of SCAN_DIRS) {
    const files = await collectFiles(dir);
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      if (source.includes(BELOW_FOLD_TAG)) continue; // explicitly opted out
      if (CODE_ELEMENT_PATTERN.test(source)) {
        violations.push(relative(process.cwd(), file));
      }
    }
  }

  if (violations.length > 0) {
    console.error(
      '\n[font-audit] BUILD BLOCKED: The following components contain ' +
      '<code>, <pre>, or <kbd> elements but are not tagged @below-fold.\n' +
      'If these elements are guaranteed below the fold, add a comment:\n' +
      '  <!-- @below-fold: <reason> -->\n' +
      'If they appear above the fold, add JetBrains Mono to PRELOADED_FONTS\n' +
      'in src/config/fonts.ts and add its <link rel="preload"> to BaseLayout.astro.\n\n' +
      violations.map(f => `  - ${f}`).join('\n') + '\n'
    );
    process.exit(1);
  }

  console.log('[font-audit] PASS — no above-fold code elements detected.');
}

audit().catch(err => {
  console.error('[font-audit] Unexpected error:', err);
  process.exit(1);
});
// package.json (relevant excerpt)
// 'prebuild' runs automatically before 'astro build' — no manual invocation needed.
// Netlify's build command ('npm run build') will trigger prebuild first.
{
  "scripts": {
    "prebuild": "node scripts/audit-above-fold-code.mjs",
    "build": "astro build",
    "dev": "astro dev"
  }
}
/* src/styles/fonts.css */
/*
  FONT LOADING CONTRACT — read before modifying @font-face or preload links.

  Preloaded (above-fold, Inter + Lora):
    - Inter 400/700: body text, UI labels
    - Lora 400/700: headings, editorial content
    Preload links live in BaseLayout.astro, generated from src/config/fonts.ts.
    Each preload MUST include crossorigin='anonymous' or the browser double-fetches.

  NOT preloaded (below-fold, JetBrains Mono):
    - JetBrains Mono 400/700: code samples only
    - Assumption: all <code>/<pre> blocks are below the fold on every template.
    - This assumption is enforced by scripts/audit-above-fold-code.mjs at build time.
    - If a code-heavy hero is introduced, update PRELOADED_FONTS in fonts.ts
      AND add the preload link to BaseLayout.astro before deploying.

  font-display: swap is applied to all 6 faces.
  FOUT is acceptable for this site type. FOIT is not used.
*/

@font-face {
  font-family: 'Inter';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/inter-400.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/inter-700.woff2') format('woff2');
}

@font-face {
  font-family: 'Lora';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/lora-400.woff2') format('woff2');
}

@font-face {
  font-family: 'Lora';
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/lora-700.woff2') format('woff2');
}

@font-face {
  font-family: 'JetBrains Mono';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/jetbrains-mono-400.woff2') format('woff2');
}

@font-face {
  font-family: 'JetBrains Mono';
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/jetbrains-mono-700.woff2') format('woff2');
}
```

## Risks
- The prebuild regex (/<(code|pre|kbd)[\s>]/i) will match commented-out HTML (<!-- <code> -->) and template strings inside frontmatter script blocks. Mitigation: the @below-fold opt-out tag handles intentional below-fold code components; for false positives from comments or frontmatter, contributors add the opt-out tag with a reason. The false-positive rate is low because Astro frontmatter is fenced by '---' and rarely contains raw HTML element strings.
- If PRELOADED_FONTS in fonts.ts and the actual font files in public/fonts/ drift out of sync (e.g., a file is renamed), the preload link will 404 silently — the browser ignores failed preloads and falls back to the @font-face fetch, so the page does not break, but the preload benefit is lost. Mitigation: the fonts.ts config comment instructs contributors to update both locations together; a future enhancement could add a prebuild file-existence check.
- The PRELOADED_FONTS array drives preload link generation in BaseLayout.astro. If a contributor adds a font to fonts.ts but the corresponding @font-face in fonts.css uses a different file path, the preload will fetch a file the browser never uses. Mitigation: the CSS comment block explicitly cross-references fonts.ts, making the coupling visible.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
