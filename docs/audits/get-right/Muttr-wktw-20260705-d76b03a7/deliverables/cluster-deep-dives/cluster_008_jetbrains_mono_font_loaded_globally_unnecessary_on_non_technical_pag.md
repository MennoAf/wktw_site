# Cluster Deep Dive: JetBrains Mono Font Loaded Globally — Unnecessary on Non-Technical Pages

**Cluster ID:** cluster_008  
**Pattern:** Resource Loading  
**Findings:** 2  
**Systemic:** Yes

---

## 1. The Big Picture

Every page on the WKTW site — the contact form, the service sales pages, the about page, the legal pages — downloads a 31KB programming font called JetBrains Mono before rendering. JetBrains Mono is a monospace typeface designed for displaying code: think terminal output, syntax-highlighted snippets, and developer documentation. On a contact page containing a heading, a short paragraph, and a form, this font has no visible role. The visitor's browser requests it, downloads it, and parses it anyway, because the instruction to load it lives in the site's global stylesheet and applies unconditionally to every page.

The practical consequence is that 31KB of every lightweight page's transfer budget is consumed by a font that does no work. On the contact page specifically, the audit measured a total page transfer of 106KB — meaning JetBrains Mono alone accounts for 29.2% of everything the browser downloads to render that page. On the service sales page ('Content Authority Audit'), the same font represents approximately 29% of a 116KB total transfer. For visitors on constrained connections or mobile data, this is a meaningful and entirely avoidable cost. For the contact page in particular — the site's primary conversion endpoint — any friction that delays or degrades the loading experience works directly against the contact form KPI.

This is not a catastrophic performance failure. The font uses `font-display: swap`, so it does not block rendering, and the site's overall performance posture is strong. But it is a clean, fixable inefficiency: a single architectural decision is causing unnecessary network requests on every page type that will never use the font. The fix is well-defined, low-risk, and eliminates the problem entirely.

---

## 2. The Root Cause

The underlying cause is straightforward: the two `@font-face` declarations for JetBrains Mono (Regular and Bold variants) live in the site's global CSS bundle — the stylesheet imported at the layout level and therefore included on every page the site generates. In Astro's build model, a global stylesheet is exactly that: global. Whatever font declarations, utility classes, or base styles it contains are shipped to every visitor on every route, regardless of whether the content on that route needs them.

The audit confirmed the font is actively downloaded — not merely declared — on both the contact page and the service sales page (network requests verified in both findings). This means a CSS rule somewhere in the global scope references `font-family: 'JetBrains Mono'`, which causes the browser to fetch the WOFF2 file even on pages with no code content. The `@font-face` declaration alone would not trigger a download; a matching element must exist or a selector must apply. The grep path (`grep -r 'JetBrains Mono\|font-mono\|--font-mono' src/`) will identify the consuming rule. The root cause is therefore two-part: the `@font-face` declarations are globally scoped, and the consuming selector is broad enough to match elements present on non-technical pages. Astro's component-scoped CSS system provides a direct architectural solution — one that the current codebase is already structured to support.

---

## 3. Each Finding

### Finding A: JetBrains Mono Loaded on the Contact Page
**ID:** `js-2-jetbrains-mono-font-loaded-unnecessarily` | **Severity:** Medium | **Effort:** Quick Win

**What's happening:** The contact page — a form page whose entire purpose is to convert a visitor into an enquiry — downloads a 31KB monospace programming font that no element on the page uses for display. The browser issues a network request for `https://weknowthewhy.com/fonts/jetbrainsmono-latin.woff2`, receives and parses the file, and then does nothing with it.

**The evidence:** The audit measured a total page transfer of 106KB for the contact page. JetBrains Mono accounts for 31KB of that — 29.2% of the entire page weight. The font has two `@font-face` declarations (Regular and Bold variants) and is not preloaded, meaning it is fetched as a lower-priority resource during page load rather than ahead of it. `font-display: swap` prevents it from blocking the initial render, but the network request and parse cost still occur.

**Why it matters for your KPIs:** The contact page is the site's sole conversion mechanism — every service enquiry passes through it. Page weight on this specific template has a direct relationship to the contact form KPI: anything that adds unnecessary load time or network overhead on the path to form submission is friction that serves no purpose. A 31KB reduction in transfer weight on this page is a 29% reduction in total page weight, achieved by removing a resource that contributes nothing to the user experience here.

**The fix:** Identify the CSS selector that references `font-family: 'JetBrains Mono'` in the global stylesheet (DevTools Computed panel or a project-wide grep will locate it). Remove the `@font-face` declarations and the consuming rule from the global CSS. Relocate both into a scoped Astro component — a `<CodeBlock>` component with its own `<style>` block — so the font is only bundled into pages that actually render that component.

---

### Finding B: JetBrains Mono Loaded on the Service Sales Page
**ID:** `font-face-overload-3-families` | **Severity:** Low | **Effort:** Quick Win

**What's happening:** The 'Content Authority Audit' service page — a persuasion-oriented page whose job is to move a prospect toward an enquiry — loads the same unnecessary 31KB monospace font. The audit found six `@font-face` declarations on this page: two for Inter, two for Lora, and two for JetBrains Mono. Inter and Lora are appropriate for a sales page (body copy and headings). JetBrains Mono is not, unless the page contains code samples or technical markup examples, which a service description page is unlikely to.

**The evidence:** Total page transfer on this template was measured at 116,267 bytes (approximately 114KB). JetBrains Mono's estimated contribution is 31KB — again approximately 29% of total transfer. The total CSS transfer for this page was measured at 108,844 bytes, indicating the global stylesheet is a significant portion of the page's overall weight, and the font declarations within it are a meaningful component of that.

**Why it matters for your KPIs:** Service pages sit at a critical point in the conversion path — they are where a prospect evaluates whether to make contact. Page load performance on these templates influences bounce rate directly: a visitor who encounters a slow or heavy page before reaching the contact form may not reach it at all. Removing 31KB of unused font weight from service page templates is a concrete, measurable improvement to the load profile of pages that directly precede conversion.

**The fix:** The fix is identical to Finding A and should be executed as a single coordinated change rather than two separate efforts. Once the `@font-face` declarations and consuming selectors are moved into a scoped `<CodeBlock>` component, the font will automatically be excluded from every page — including all service pages — that does not render that component. No per-template configuration is required after the initial refactor.

---

## 4. The Unified Fix Strategy

Because both findings share an identical root cause and an identical fix, they should be treated as a single engineering task rather than two tickets. The work is a one-time refactor with permanent, site-wide effect.

**Recommended execution order:**

**Step 1 — Locate the triggering selector (15 minutes).** Run `grep -r 'JetBrains Mono\|font-mono\|--font-mono' src/` across the project. This will surface both the `@font-face` declarations and every CSS rule that references the font family. Note whether the consuming rule is a bare element selector (e.g., `code { font-family: 'JetBrains Mono' }`) or a utility class. This determines the scope of what needs to move.

**Step 2 — Create or identify the CodeBlock component (30 minutes).** If a `<CodeBlock>` or `<Pre>` component already exists in the Astro project, add a `<style>` block to it containing the two `@font-face` declarations and the consuming CSS rule. If no such component exists, create one that wraps `<pre>` and `<code>` elements. Astro's scoped CSS system will ensure the font declarations are only included in the built output for pages that render this component.

**Step 3 — Remove from global CSS (5 minutes).** Delete the two JetBrains Mono `@font-face` blocks from the global stylesheet and remove or relocate the consuming selector. Verify no other global rules reference the font family.

**Step 4 — Verify (15 minutes).** Build the site and open the contact page and a service page in DevTools. Confirm the JetBrains Mono WOFF2 request no longer appears in the Network tab. Then open a page that does contain a code block and confirm the font loads correctly there.

**Total estimated effort:** This is a genuine quick win. The grep, the component edit, and the global CSS cleanup are a single focused session. The architectural payoff is permanent: every future page added to the site will automatically exclude the font unless it explicitly uses the CodeBlock component.

**What this does not require:** No changes to the build pipeline, no Astro configuration changes, no CDN or server configuration, no design system updates. This is a CSS scoping change within the existing component architecture.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| `js-2-jetbrains-mono-font-loaded-unnecessarily` | JetBrains Mono loaded (31KB) on contact page | Medium | Quick Win | Shared — resolved by single global refactor |
| `font-face-overload-3-families` | JetBrains Mono loaded on service sales page | Low | Quick Win | Shared — resolved by single global refactor |

**Both findings are resolved by a single engineering action.** The fix does not need to be applied per-page or per-template after the initial refactor — Astro's component scoping handles exclusion automatically across all current and future pages.
