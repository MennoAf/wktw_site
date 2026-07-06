---
finding_id: "js-2-jetbrains-mono-font-loaded-unnecessarily"
title: "JetBrains Mono font loaded (31KB) but likely unused on non-technical page types"
severity: "medium"
root_cause_cluster: "JetBrains Mono Font Loaded Globally — Unnecessary on Non-Technical Pages"
why_this_matters: "Eliminates a 31KB font transfer on every non-technical page."
fix_summary: "Eliminate the JetBrains Mono font download on non-technical pages by (1) auditing and removing the CSS rule(s) that trigger the font request on every page, and (2) relocating the @font-face declarati…"
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["font-face-overload-3-families", "resource-loading-font-strategy-good"]
---

# JetBrains Mono font loaded (31KB) but likely unused on non-technical page types

**Finding:** JetBrains Mono font loaded (31KB) but likely unused on non-technical page types  
**Severity:** Medium  
**Why this matters:** Eliminates a 31KB font transfer on every non-technical page.  
**Root cause:** JetBrains Mono Font Loaded Globally — Unnecessary on Non-Technical Pages  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Eliminate the JetBrains Mono font download on non-technical pages by (1) auditing and removing the CSS rule(s) that trigger the font request on every page, and (2) relocating the @font-face declarati…  

> **Evidence Basis:** Confirmed

---

## Also resolves (2)

One fix closes the findings below — they were folded here as the same remediation:

- `font-face-overload-3-families` (Low) — JetBrains Mono font loaded unnecessarily on non-technical pages — unused weight
- `resource-loading-font-strategy-good` (Low) — Font loading well-configured — preloads correct, font-display: swap, self-hosted — PASS with one concern

## Impact

- **Page Weight:** Eliminates a 31KB font transfer on every non-technical page. On the contact page where total transfer is ~106KB, this removes approximately 29% of total page weight — a disproportionate reduction for a zero-utility asset.
- **Lcp And Ttfb:** Font requests consume a connection slot and add a network round-trip. On pages where the font was loading unnecessarily, removing it frees bandwidth for above-fold resources. The effect is most pronounced on constrained mobile connections where connection concurrency is limited.
- **Core Web Vitals:** JetBrains Mono uses font-display: swap, so it does not block rendering, but the unnecessary network request competes with LCP image and critical CSS fetches. Eliminating it on non-technical pages reduces resource contention during the critical load window.
- **Crawl And Seo:** No direct SEO impact from the font itself, but reducing page weight on non-technical pages improves the signal quality of Core Web Vitals data reported to Google Search Console for those URL clusters.
- **Scale:** The fix is architectural — it prevents future font additions to global CSS from silently propagating to unrelated page types. The scoped component pattern enforces the correct loading boundary at the framework level rather than relying on developer discipline.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_008`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Three font families are loaded: Inter (47KB), Lora (21KB), and JetBrains Mono (31KB).. JetBrains Mono is a monospace programming font typically used for code blocks or technical content.

**Measured evidence:**
- Font File: https://weknowthewhy.com/fonts/jetbrainsmono-latin.woff2
- Font Size Kb: 31
- Total Page Transfer Kb: 106
- Percentage Of Total: 29.2%
- Font Family: JetBrains Mono
- Font Display: swap
- Font Face Declarations: 2
- Page Type: contact form — unlikely to contain code blocks

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
Eliminate the JetBrains Mono font download on non-technical pages by (1) auditing and removing the CSS rule(s) that trigger the font request on every page, and (2) relocating the @font-face declaration and any consuming selectors into a scoped Astro component (<CodeBlock> or equivalent) so the font is only bundled into pages that actually render code content.

### How
STEP 1 — LOCATE THE TRIGGERING SELECTOR (precondition: you have the built CSS bundle and the rendered DOM of a non-technical page). Open DevTools on the contact page → Network tab → filter by 'Font' → confirm the JetBrains Mono woff2 request fires. Then open the Computed panel, select the <body> or <html> element, and search for 'JetBrains Mono' in the Styles panel. The matched rule and its source file will be shown. Alternatively, run: grep -r 'JetBrains Mono\|font-mono\|--font-mono' src/ to find every reference in source files.
STEP 2 — IDENTIFY THE DECLARATION SOURCE. Determine whether the @font-face block lives in (a) src/styles/global.css, (b) a <style> block in a base Layout .astro file, or (c) a component .astro file without Astro scoping (i.e., a <style is:global> block). This determines which of the two fix paths below applies.
STEP 3A — IF the triggering selector is a base element selector (code, pre, kbd, samp) in global CSS: Remove the font-family assignment from the global rule. Add it only inside the scoped <CodeBlock> component's <style> block (Astro scopes these automatically). The @font-face declaration must also move into that component's <style is:global> block (because @font-face cannot be scoped — it must be global to be usable, but it will only be emitted into pages that render the component).
STEP 3B — IF the triggering selector is a utility class (.font-mono) or CSS custom property (--font-mono) applied globally: Remove the global assignment. If Tailwind is in use, remove 'font-mono' from any global apply directives. Ensure the class or custom property is only applied inside the <CodeBlock> component template.
STEP 4 — RESTRUCTURE THE FONT DECLARATION. Create or update src/components/CodeBlock.astro. Move the @font-face declaration into a <style is:global> block inside this component. Move all selectors consuming JetBrains Mono into the component's scoped <style> block (no is:global needed for these — Astro will scope them to the component's DOM). Remove the @font-face and all JetBrains Mono font-family references from src/styles/global.css and any base layout <style> blocks.
STEP 5 — VERIFY ASTRO'S BUNDLE BEHAVIOR. Astro only emits a component's <style> block into the page bundle when that component is rendered on that page. After rebuilding (astro build), inspect dist/ output: open the HTML for a non-technical page (e.g., dist/contact/index.html) and confirm no JetBrains Mono @font-face appears in the linked CSS. Open a technical page (e.g., dist/blog/some-post/index.html) and confirm the @font-face IS present.
STEP 6 — AUDIT FOR PRELOAD TAGS. Search base layouts for any <link rel='preload' as='font'> referencing JetBrains Mono. If found, wrap it in a conditional prop passed from the page frontmatter (e.g., {Astro.props.hasCode && <link rel='preload' .../>}) so it only renders on pages that use <CodeBlock>.
STEP 7 — BUILD AND VALIDATE. Run astro build. Use a local HTTP server (e.g., npx serve dist) and DevTools Network tab to confirm: (a) JetBrains Mono does NOT load on /contact, /about, or service pages; (b) JetBrains Mono DOES load on any page rendering <CodeBlock>. Run axe or Lighthouse accessibility audit to confirm no visual regressions.

### Code examples
```
// src/components/CodeBlock.astro
// SITE-SPECIFIC ASSUMPTION: font file paths match your public/ directory structure.
// Adjust the src URLs if fonts are served from a CDN or a different public path.
// SITE-SPECIFIC ASSUMPTION: 'woff2' is the only format needed (covers all modern browsers).
// Add a woff fallback src if you need IE11 support (unlikely for a modern Astro site).

---
interface Props {
  code: string;
  lang?: string;
}
const { code, lang = 'text' } = Astro.props;
---

<pre class="code-block" data-lang={lang}><code>{code}</code></pre>

<!--
  @font-face MUST be is:global — @font-face cannot be scoped to a shadow DOM.
  Astro will only emit this block into pages that render <CodeBlock>,
  so non-technical pages receive zero bytes from this declaration.
-->
<style is:global>
  /*
   * JetBrains Mono — loaded ONLY on pages that render <CodeBlock>.
   * SITE-SPECIFIC ASSUMPTION: font files live at /fonts/JetBrainsMono-Regular.woff2
   * and /fonts/JetBrainsMono-Bold.woff2 inside public/.
   * Adjust weights/files to match what is actually used in code blocks.
   */
  @font-face {
    font-family: 'JetBrains Mono';
    src: url('/fonts/JetBrainsMono-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'JetBrains Mono';
    src: url('/fonts/JetBrainsMono-Bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
</style>

<!--
  Scoped styles: Astro automatically scopes these to .code-block elements
  rendered by THIS component only. No bleed into global scope.
-->
<style>
  /*
   * Scoped to .code-block — will not match <pre> or <code> elements
   * outside of this component, preventing the global selector leak
   * that caused the font to load on every page.
   */
  .code-block {
    font-family: 'JetBrains Mono', ui-monospace, 'Cascadia Code',
      'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
    font-size: 0.875rem; /* SITE-SPECIFIC ASSUMPTION: adjust to match design system */
    line-height: 1.6;   /* SITE-SPECIFIC ASSUMPTION: adjust to match design system */
    overflow-x: auto;
  }

  .code-block code {
    font-family: inherit;
  }
</style>
// src/styles/global.css — AFTER the fix
// Remove these lines if they exist. This is what to DELETE, not add.
//
// DELETE: @font-face { font-family: 'JetBrains Mono'; ... }
// DELETE: code, pre, kbd, samp { font-family: 'JetBrains Mono', monospace; }
// DELETE: .font-mono { font-family: 'JetBrains Mono', monospace; }
// DELETE: :root { --font-mono: 'JetBrains Mono', monospace; }
//         (or narrow --font-mono to a system stack: --font-mono: ui-monospace, monospace;)
//
// If --font-mono is used globally as a CSS custom property and cannot be removed,
// change its value to a system monospace stack so no web font download is triggered
// on pages without <CodeBlock>:

:root {
  /*
   * System monospace stack — no web font download.
   * JetBrains Mono is layered on top only by the CodeBlock component.
   * SITE-SPECIFIC ASSUMPTION: verify this stack matches your design system's
   * fallback intent before deploying.
   */
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro',
    Menlo, Consolas, 'DejaVu Sans Mono', monospace;
}
// src/layouts/BaseLayout.astro — conditional preload guard
// If a <link rel="preload"> for JetBrains Mono exists in the base layout,
// replace it with this conditional pattern so it only fires on pages with code.
//
// SITE-SPECIFIC ASSUMPTION: pages signal code content via a boolean frontmatter prop.
// Adjust the prop name to match your existing frontmatter schema.

---
interface Props {
  title: string;
  hasCodeBlocks?: boolean; // page sets this to true when it renders <CodeBlock>
}
const { title, hasCodeBlocks = false } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{title}</title>

    <!--
      Preload JetBrains Mono ONLY on pages that render code blocks.
      Preloading on every page would re-introduce the unnecessary 31KB
      transfer this fix is designed to eliminate.
      crossorigin is required for font preloads — omitting it causes a
      double-fetch (preload fetch + CSS-triggered fetch use different
      CORS modes and the browser treats them as separate resources).
    -->
    {hasCodeBlocks && (
      <link
        rel="preload"
        as="font"
        type="font/woff2"
        href="/fonts/JetBrainsMono-Regular.woff2"
        crossorigin
      />
    )}
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Risks
- RISK: If any non-CodeBlock element on a technical page applies font-family via a class or custom property that references JetBrains Mono (e.g., inline code in MDX prose), removing the global @font-face will break that element's font rendering. MITIGATION: Before removing the global declaration, run grep -r 'JetBrains Mono\|font-mono\|--font-mono' src/ and audit every match. For inline <code> in MDX/Markdown prose, add a prose-specific rule inside the CodeBlock component's is:global block targeting .prose code or the equivalent Tailwind Typography selector.
- RISK: Astro's CSS bundling behavior for is:global inside components is well-documented for Astro 2+, but verify against your exact Astro 6.4.8 build output. If the project uses a custom Vite CSS plugin or PostCSS configuration that hoists is:global blocks into a shared chunk, the scoping guarantee may not hold. MITIGATION: After astro build, inspect dist/ HTML files directly — do not rely on dev server behavior, which differs from production bundling.
- RISK: If the site uses Astro's View Transitions (client-side navigation), a page that loads without JetBrains Mono may navigate to a page that needs it. The font will load on demand via the CSS that ships with the technical page, but there may be a brief FOUT on the first navigation to a code-heavy page within a session. MITIGATION: font-display: swap is already set, so FOUT is the expected behavior. This is acceptable. If FOUT is unacceptable for brand reasons, preload the font on the first technical page navigation using the View Transitions lifecycle hooks (astro:after-swap).
- RISK: If the @font-face declaration is currently in a CSS file imported by astro.config.mjs as a global style (via vite.css.preprocessorOptions or similar), moving it to a component will not remove it from the global bundle — the config-level import takes precedence. MITIGATION: Check astro.config.mjs for any css or vite.css configuration importing global stylesheets. If found, remove the JetBrains Mono @font-face from that file explicitly.
- RISK: The fix assumes <CodeBlock> is the sole consumer of JetBrains Mono. If a syntax highlighting library (e.g., Shiki, Prism) is configured at the Astro integration level and injects its own font-family rules into the global bundle, the component-scoping approach will not prevent those rules from triggering the font download. MITIGATION: Check astro.config.mjs for markdown.shikiConfig or similar. If Shiki is active, verify its theme does not reference JetBrains Mono as a font-family in its generated CSS.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
