# Cluster Deep Dive: Site-Wide WCAG Accessibility Failures
**Cluster ID:** cluster_004 | **Architectural Pattern:** HTML Structure | **Systemic:** Yes | **Findings:** 10

---

## 1. The Big Picture

Imagine navigating this website using only a keyboard, or relying on a screen reader to announce what's on the page. On the homepage, the screen reader encounters a heading that jumps from level 1 directly to level 4 — the audio equivalent of a table of contents that skips from chapter one to sub-sub-section four with no chapters in between. The user has no way to know what content they've missed or whether the structure is intentional. They then reach the navigation bar, where two separate `<nav>` landmarks are announced identically as "navigation" — there is no way to distinguish the desktop menu from the mobile menu, so the user must explore both to understand what they contain. When they arrive at the contact form to get in touch, a form field exists in the tab order with no label — the screen reader announces it as a blank input, and the user has no idea what to type. None of these are edge cases. They occur on every page tested across the five URLs in the audit sample.

The failures compound each other in ways that are worse than the sum of their parts. A user navigating by headings — a primary screen reader strategy — cannot build a mental model of the page because the hierarchy is broken. A user navigating by landmarks cannot distinguish navigation regions because `aria-label` attributes are absent. A user relying on color to identify links cannot do so if they have a color vision deficiency, because links are differentiated from body text by color alone with no underline, border, or other visual indicator. And critically, the consent banner's accept button — the first interactive element many users will encounter — has a measured contrast ratio of 1.16:1 against its background, meaning the button text is effectively invisible. A user who cannot read or click that button is blocked from consenting to cookies, which has downstream implications for both the user experience and the site's own analytics data quality.

For business stakeholders: these failures directly affect the site's ability to convert visitors who use assistive technology. The contact page — the primary conversion destination — contains a form with an unlabeled input that screen readers cannot interpret, and a heading structure that jumps from `h1` directly to `h4`, stripping the page of navigable structure. Any visitor using a screen reader who reaches this page faces a degraded, confusing experience that works against conversion. These are not hypothetical edge cases; assistive technology users represent a meaningful share of any general audience, and the failures documented here are measurable and fixable.

---

## 2. The Root Cause

All ten findings in this cluster share a single origin: the design system and component library were built without accessibility as a constraint. This is not a criticism of the engineering team's skill — the underlying Astro SSG architecture is genuinely excellent, with sub-50ms TTFB, zero CLS, and 24ms INP. The problem is that accessibility was never wired into the development workflow as a testable requirement. No automated accessibility checks run in the CI/CD pipeline, so violations are introduced silently and accumulate across releases. The result is a pattern where every component that needed an `aria-label` shipped without one, every heading that needed a semantic level was assigned a visual level instead, and every link style that needed a non-color indicator was styled by color alone — not because anyone decided to skip accessibility, but because there was no mechanism to catch the omission.

The measured evidence makes the systemic nature clear. The contrast failures appear on all five pages tested — homepage, about, contact, an insights article, and the privacy policy — which means they originate in shared template components, not page-specific content. The color-as-sole-indicator violation affects 10 inline links across the same five pages. The missing `aria-label` on `<nav>` elements is present in every page's DOM because it lives in the header component rendered globally. The heading hierarchy skip (`h2 → h4`) is flagged on five pages, and a separate `h1 → h4` skip is confirmed on the contact page. These are template-tier failures: fix the component once, fix every page simultaneously.

---

## 3. Each Finding

### 3.1 Insufficient Contrast Ratio
**WCAG 2.1 SC 1.4.3 (AA) | Severity: Medium | Legal Liability: Yes**

**What's broken:** Three text elements fall below the WCAG AA minimum contrast ratio. Two navigation link elements (`div > a:nth-of-type(5)` and `div > a:nth-of-type(1)`) have a measured foreground color of `rgb(44, 33, 29)` rendered against a background of the same value — a ratio of exactly 1.00:1, meaning the text is completely invisible against its background. This is almost certainly a transitional or hover state where a CSS rule sets both foreground and background to the same dark brown. The consent banner's accept button (`#consent-accept`) has a measured ratio of 1.16:1 — the button label is rendered in `rgb(44, 33, 29)` on a background of `rgb(56, 44, 39)`, two values so close in luminance that the text is functionally unreadable. This failure appears on all five pages tested.

**Why it matters:** The consent banner is the first interactive element most users encounter. A user with low vision, or any user in a suboptimal viewing environment (bright sunlight, low-quality display), cannot read the accept button label. This creates a situation where the consent mechanism itself is inaccessible — a compounding problem given that the consent banner gates analytics tracking. For users who rely on sufficient contrast to read at all, the navigation link failures mean portions of the site's primary navigation are invisible in certain states.

**The fix:** Replace the failing CSS `color` values with computed compliant equivalents. The audit has already calculated the replacement values: `#2C211D` foreground on `#2C211D` background should be replaced with `#8B8A89` (achieving 4.54:1). The consent button requires a separate calculation against its `rgb(56, 44, 39)` background. These are arithmetic substitutions — no design judgment is required, and the changes are scoped to specific CSS selectors.

---

### 3.2 Color as Sole Indicator for Inline Links
**WCAG 2.1 SC 1.4.1 (A) | Severity: Medium | Legal Liability: Yes**

**What's broken:** Ten inline links across all five tested pages are distinguished from surrounding body text by color alone. No underline, border, background change, or other non-color visual indicator is present. The affected selectors are `li > a:nth-of-type(1)` and `p > a:nth-of-type(1)` — list items and paragraph links, meaning this affects body content throughout the site. This is a Level A violation, the most fundamental tier of WCAG conformance.

**Why it matters:** Users with color vision deficiencies — who cannot reliably distinguish hue differences — have no way to identify which words in a paragraph are links. This directly suppresses click-through on in-content links, which are typically high-intent navigation paths. On a site where conversion depends on visitors finding and clicking the right calls to action, invisible links are a conversion barrier. The mechanism is direct: if a link cannot be identified as a link, it cannot be clicked intentionally.

**The fix:** Add `text-decoration: underline` to inline links within body content via a scoped CSS rule. Navigation links and button-style links should be excluded via `:not()` selectors to avoid visual regression. This is a single CSS addition — a genuine quick win with no structural changes required.

---

### 3.3 Improper Content Structure — Heading Hierarchy Skip (h2 → h4)
**WCAG 2.1 SC 1.3.1 (A) | Severity: Low | Legal Liability: Yes**

**What's broken:** The heading hierarchy jumps from `h2` to `h4`, skipping `h3`, on five pages: homepage, about, contact, privacy, and terms. This is confirmed by the deterministic detector and corroborated by the heuristic finding that documents the full heading sequence on the about page as `h1 → h2 → h2 → h2 → h2 → h3 → h3 → h3 → h4 → h4 → h4 → h4 → h4 → h4` — 14 total headings with 6 `h4` elements following only 3 `h3` elements, suggesting some `h4` elements are not properly nested under `h3` parents.

**Why it matters:** Screen reader users navigate pages by heading level as a primary orientation strategy. A jump from `h2` to `h4` signals to the screen reader — and therefore the user — that they have entered a deeply nested subsection. The actual content relationship is not that deep; the skip is a styling artifact, not a semantic one. This breaks the document outline that assistive technology uses to build a navigable page map. The five affected pages include the homepage and contact page, making this a site-wide structural problem.

**The fix:** Refactor shared Astro components that hardcode `<h4>` to accept a polymorphic `headingLevel` prop. A grep of `src/components/` for hardcoded `<h4>` tags will identify the 1–3 components responsible for the majority of violations. The visual appearance of the heading is decoupled from its semantic level via a separate `size` prop — so an `h3` can still render at the visual size of an `h4` if the design requires it.

---

### 3.4 Missing Name/Role/Value — Unlabeled UI Components
**WCAG 2.1 SC 4.1.2 (A) | Severity: Medium | Legal Liability: Yes**

**What's broken:** Two UI components on the contact page lack accessible names. Based on the evidence, these are the honeypot form input (which is visually hidden via CSS but present in the accessibility tree) and the mobile menu toggle button. A screen reader encountering the honeypot input announces a blank, unlabeled text field — the user has no idea what it is or whether they should interact with it. The hamburger button has no `aria-label`, so it is announced without any description of its purpose.

**Why it matters:** The contact page is the primary conversion destination. An unlabeled form field in the tab order creates confusion and friction for screen reader users at the exact moment they are attempting to complete a conversion action. If a user's screen reader autofill populates the honeypot field (because it lacks `autocomplete='off'`), their form submission may be silently rejected by spam filtering — a direct conversion loss with no error feedback.

**The fix:** Add `aria-hidden='true'` and `tabindex='-1'` to the honeypot input to remove it from the accessibility tree entirely. Add `aria-label='Open navigation menu'` to the hamburger button. Both are attribute additions to existing elements — no structural changes required.

---

### 3.5 Heading Hierarchy Skips h3 Level — Screen Reader Navigation Broken
**WCAG 2.1 SC 1.3.1 (A) | Severity: Medium | Legal Liability: Yes**

**What's broken:** This finding provides granular heading sequence data for the about page, confirming the full outline: `h1 → h2 → h2 → h2 → h2 → h3 → h3 → h3 → h4 → h4 → h4 → h4 → h4 → h4`. The `h1` count is correct at 1. The concern flagged is that 6 `h4` elements follow only 3 `h3` elements — likely team member titles (`h4`) under role categories (`h3`) — suggesting some `h4` elements are semantically orphaned. The DOM contains 128 elements on this page.

**Why it matters:** This corroborates and extends finding 3.3. The about page is a trust-building page — it introduces the team and the firm's philosophy. Screen reader users navigating this page by heading will encounter a disorganized outline that does not accurately represent the content hierarchy. This undermines the page's purpose: establishing credibility and encouraging contact.

**The fix:** Same as 3.3 — a shared `Heading.astro` component with a `level` prop resolves both findings simultaneously, since they share the same root cause in hardcoded heading elements within shared components.

---

### 3.6 Duplicate Navigation Landmarks and Consent Buttons Lack ARIA Labels
**WCAG 2.1 SC 4.1.2 (A) and SC 2.1.2 (A) | Severity: Medium | Legal Liability: Yes**

**What's broken:** The consent banner contains two buttons (`consent-decline` and `consent-accept`) with no evidenced `aria-label` or `aria-describedby` attributes. The banner's focus management behavior — whether it traps focus appropriately when visible, or allows keyboard users to interact with underlying content while the banner is displayed — is unverifiable from static analysis but is flagged as a concern. The desktop and mobile navigation landmarks are confirmed to have duplicate destinations without distinguishing `aria-label` attributes.

**Why it matters:** A consent banner that does not manage focus correctly can create a keyboard trap (WCAG 2.1.2, Level A) — a situation where a keyboard user cannot navigate away from the banner, or conversely, can bypass it and interact with content underneath while the banner is still active. Either scenario is a Level A failure. Given that this banner controls GDPR consent behavior, its inaccessibility has both user experience and legal dimensions. A keyboard user who cannot operate the consent banner cannot provide or decline consent — which affects the legal validity of any consent recorded.

**The fix:** Add `aria-label` attributes to both consent buttons. Implement focus trapping on the banner while it is visible, and ensure keyboard dismissal (Escape key) is supported. Add `aria-label='Primary navigation'` and `aria-label='Mobile navigation'` to the respective `<nav>` elements. Synchronize `aria-hidden` on the mobile nav with its visibility state.

---

### 3.7 Form Input Missing Programmatic Label — Honeypot Field
**WCAG 2.1 SC 1.3.1 (A) and SC 3.3.2 (A) | Severity: Medium | Legal Liability: Yes**

**What's broken:** One of six form fields on the contact page lacks an associated `<label>` element. The XPath (`/html/body/main[1]/section[1]/div[1]/div[1]/form[1]/input[1]`) identifies it as the first `input[type='text']` in the form, before the labeled fields — consistent with a honeypot pattern. It is visually hidden via CSS but present in the accessibility tree, meaning screen readers announce it as an unlabeled text input.

**Why it matters:** This is a direct conversion barrier. A screen reader user tabbing through the contact form encounters an unlabeled field as the first form element. They cannot determine whether it requires input. If browser autofill populates it (because `autocomplete='off'` is absent), the form submission triggers spam filtering and is silently rejected. The user receives no error message and their conversion attempt fails invisibly.

**The fix:** Wrap the honeypot input in a container with `aria-hidden='true'`, add `tabindex='-1'` and `autocomplete='off'` directly to the input. This removes it from the accessibility tree and prevents autofill from targeting it. This is a quick win — three attribute additions to one element.

---

### 3.8 Multiple `<nav>` Elements Missing Distinguishing `aria-label` Attributes
**WCAG 2.1 SC 1.3.1 (A) and SC 4.1.2 (A) | Severity: Medium | Legal Liability: Yes**

**What's broken:** The DOM contains navigation links in both a desktop header nav (XPath: `/html/body/header[1]/nav[1]`) and a mobile menu (`#mobile-menu`). Neither `<nav>` element has a verified `aria-label` attribute. Screen readers announce both as generic "navigation" landmarks, making them indistinguishable. A user navigating by landmarks — a standard screen reader technique — cannot tell which navigation region they are in.

**Why it matters:** Landmark navigation is one of the most efficient ways screen reader users orient themselves on a page. When two navigation landmarks are announced identically, the user must explore both to understand their contents. This adds unnecessary cognitive load and time to every page visit for screen reader users. On a site with a clear primary navigation, this is a straightforward fix with immediate usability impact.

**The fix:** Add `aria-label='Main navigation'` to the desktop `<nav>` and `aria-label='Mobile navigation'` to the mobile menu `<nav>`. Add `aria-hidden='true'` to the mobile nav in its default collapsed state, toggled reactively when the menu opens. These are attribute additions to existing elements in the Astro header component.

---

### 3.9 Mobile Menu Contains Hidden Duplicate Navigation Links
**WCAG 2.1 SC 1.3.1 (A) and SC 4.1.2 (A) | Severity: Medium | Legal Liability: Yes**

**What's broken:** The DOM contains five navigation links duplicated between the desktop header nav and the mobile menu (`#mobile-menu`): The Get Right, Insights, Proof, About, and Talk to a Founder. The measured data confirms 13 total internal links with only 6 unique destinations, and 5 duplicate `href` values. On desktop viewports, the mobile menu is hidden via CSS, but its links remain in the DOM and are parsed by both screen readers and search engine crawlers. The `aria-hidden` state of the inactive mobile menu is unverified.

**Why it matters:** If the mobile menu's `<nav>` is not hidden from the accessibility tree when collapsed, screen reader users on desktop encounter two sets of identical navigation links — doubling the navigation overhead on every page. From an SEO perspective, duplicate internal links with identical destinations dilute the link equity signal for each destination page. The fix also has a secondary benefit: a cleaner DOM with properly managed ARIA state is easier to maintain and less likely to introduce regressions.

**The fix:** Phase 1 (immediate): Add `aria-hidden='true'` to `#mobile-menu` in its default collapsed state and toggle it reactively with the menu open/close JavaScript. Add distinguishing `aria-label` attributes to both `<nav>` elements (overlaps with finding 3.8 — one code change resolves both). Phase 2 (architectural): Consolidate into a single `<nav>` element that adapts layout via CSS, eliminating the duplicate DOM pattern entirely.

---

### 3.10 Heading Hierarchy Skips from h1 to h4 — Contact Page
**WCAG 2.1 SC 1.3.1 (A) | Severity: Medium | Legal Liability: Yes**

**What's broken:** The contact page heading structure is `h1 → h4 → h4`, skipping `h2` and `h3` entirely. The `h1` text is "Talk to a founder." The two `h4` elements follow with no intervening heading levels. Total headings on the page: 3. This is the most severe heading hierarchy violation in the cluster — a three-level skip on the site's primary conversion page.

**Why it matters:** A screen reader user navigating the contact page by headings hears "heading level 1: Talk to a founder" followed immediately by "heading level 4" — a signal that they have entered a deeply nested subsection of content that doesn't exist. The page's information architecture is invisible to assistive technology. On a conversion page, where the goal is to guide the user toward completing a form, a broken heading structure removes the navigational scaffolding that screen reader users rely on to understand page layout and locate the form. This directly suppresses form completion for this user group.

**The fix:** Replace hardcoded `<h4>` elements on the contact page template with the polymorphic `Heading` component (same component introduced in findings 3.3 and 3.5), setting `level={2}` to produce the correct semantic structure while preserving visual styling via a `size` prop. This is a template-level change that resolves the violation on every page that uses the component.

---

## 4. Legal Exposure

Every finding in this cluster carries confirmed legal liability. The applicable framework is **WCAG 2.1**, which is incorporated by reference into accessibility regulations in multiple jurisdictions relevant to a US-based business:

- **United States:** The Americans with Disabilities Act (ADA) has been applied to websites by federal courts, with the Department of Justice affirming in 2022 that web accessibility is required under Title III for places of public accommodation. WCAG 2.1 AA is the standard courts and the DOJ reference when evaluating compliance.
- **European Union:** The European Accessibility Act (EAA), effective June 2025, requires digital services to meet EN 301 549, which maps directly to WCAG 2.1 AA. If any portion of We Know the Why's client base or audience is in the EU, this regulation applies.

The practical risk mechanism is straightforward: demand letters and litigation under the ADA targeting website accessibility failures have increased substantially in recent years, with plaintiffs' firms using automated scanning tools — the same tools that identified these violations — to identify targets. The violations documented here are Level A and Level AA failures, the two tiers that define minimum and standard conformance. Level A failures in particular (color as sole indicator, missing labels, missing name/role/value, improper content structure) represent the most fundamental accessibility requirements and are the most difficult to defend against in a legal challenge.

The consent banner's accessibility failure adds a secondary legal dimension: if a user with a disability cannot operate the consent mechanism, the consent recorded (or not recorded) for that user may not be legally valid under GDPR or CCPA frameworks, since valid consent requires that the mechanism be accessible to the user providing it.

Remediation is the most effective risk mitigation. The fixes documented in this cluster are well-defined, scoped to template components, and achievable within a single development sprint.

---

## 5. The Unified Fix Strategy

Because all ten findings originate in the same root cause — a design system and component library built without accessibility constraints — they can be resolved through three coordinated interventions rather than ten separate tickets. The recommended sequence prioritizes legal exposure, then conversion impact, then structural quality.

### Layer 1: Design System — Color and Typography (Priority: High)
Audit the full color palette and compute compliant foreground/background pairs for all combinations used in the UI. The contrast failures on navigation links and the consent button are the most urgent because they affect every page and the primary consent interaction. Add `text-decoration: underline` to inline body content links via a scoped CSS rule. Define heading hierarchy rules in the content model: one `h1` per page, sequential `h2 → h3 → h4` with no skips. These changes are **quick wins** — CSS and attribute changes with no structural refactoring.

### Layer 2: Component Library — ARIA and Semantic Structure (Priority: High)
This layer resolves the majority of findings in a single pass through the Astro component tree:
- Add `aria-label='Main navigation'` to the desktop `<nav>` and `aria-label='Mobile navigation'` to the mobile menu `<nav>` in the header component. Add reactive `aria-hidden` toggling to the mobile menu. *(Resolves findings 3.6, 3.8, 3.9 simultaneously.)*
- Add `aria-hidden='true'`, `tabindex='-1'`, and `autocomplete='off'` to the honeypot input in the contact form template. *(Resolves findings 3.4 and 3.7 simultaneously.)*
- Add `aria-label='Open navigation menu'` and `aria-expanded` state to the hamburger button. *(Resolves the button component of finding 3.4.)*
- Create a polymorphic `Heading.astro` component with `level` and `size` props. Replace all hardcoded `<h4>` (and other mis-leveled) heading elements across page templates and shared components. *(Resolves findings 3.3, 3.5, and 3.10 simultaneously.)*

All Layer 2 items are **quick wins** at the individual fix level; the heading component refactor is a **medium effort** due to the audit and replacement work across the component tree.

### Layer 3: CI/CD — Automated Accessibility Testing (Priority: Medium, Prevents Regression)
Add `axe-core` or an equivalent automated accessibility testing integration to the Astro build pipeline. Configure it to run on every pull request and fail the build on any new Level A or Level AA violation. This is the mechanism that ensures Layers 1 and 2 are not undone by future development. Without this layer, the same violations will reappear as the site evolves. Astro supports this via integration testing hooks. This is a **medium effort** — a one-time pipeline configuration with ongoing protective value.

### Sequencing Rationale
Layers 1 and 2 can be executed in parallel by different team members — design system changes are CSS-only, component library changes are template-only. Layer 3 should be implemented immediately after Layer 2 is merged, so the remediated state becomes the enforced baseline. The heading component refactor (Layer 2) is the only item that requires coordination across multiple templates and should be scoped as its own PR with thorough visual regression testing.

---

## 6. Summary Table

| Finding | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| det-wcag-insufficient-contrast-ratio | Insufficient Contrast Ratio | Medium | Quick Win | Shared — design system color palette |
| det-wcag-color-as-sole-indicator | Color as Sole Indicator for Links | Medium | Quick Win | Shared — design system link styles |
| det-wcag-improper-content-structure | Heading Hierarchy Skip (h2→h4) | Low | Medium | Shared — Heading component (with 3.5, 3.10) |
| det-wcag-missing-name-role-value | Missing Name/Role/Value | Medium | Quick Win | Shared — honeypot fix (with 3.7); button fix (with 3.6) |
| a11y-heading-hierarchy-skip | Heading Hierarchy Skip — Detail | Medium | Medium | Shared — Heading component (with 3.3, 3.10) |
| a11y-5-mobile-menu-duplicate-nav-no-aria-label | Duplicate Nav Landmarks / Consent ARIA | Medium | Medium | Shared — header component ARIA (with 3.8, 3.9) |
| a11y-3-form-missing-label | Form Input Missing Label (Honeypot) | Medium | Quick Win | Shared — honeypot fix (with 3.4) |
| a11y-mobile-menu-nav-no-aria-label | Multiple `<nav>` Missing aria-label | Medium | Quick Win | Shared — header component ARIA (with 3.6, 3.9) |
| ghost-markup-mobile-menu-hidden-links | Hidden Duplicate Navigation Links | Medium | Quick Win | Shared — header component ARIA (with 3.6, 3.8) |
| ux-heading-hierarchy-skip | Heading Skip h1→h4 (Contact Page) | Medium | Medium | Shared — Heading component (with 3.3, 3.5) |
