# Get Right Audit — Triage Worklog

**Source audit:** `Muttr-we-know-the-why-20260624-0dc08e79/`
**Triaged:** 2026-06-25
**Verified against:** `src/` on branch `copy/positioning-june-2026`
**Method:** Every ticket cross-checked against the actual repo. The audit conflates three
different layers — repo source, GTM-container config (Google's UI), and deployed/runtime
state — so each item below records *what is actually true in the code today*.

This is the execution queue. The audit's `tickets/` folder is the raw input; this file is
the deduped, repo-grounded, prioritized version. Work items here (WL-xx) collapse ~60 raw
tickets into ~25 distinct units. Tool-quality defects (duplication, stale findings,
mismeasurement) are logged separately in [`feedback_for_muttr.md`](./feedback_for_muttr.md).

---

## Status legend

| Tag | Meaning |
| --- | --- |
| ✅ **DO** | Real defect in repo source. Edit `src/`. |
| 🔧 **CONFIG** | Real, but lives in Netlify config (`netlify.toml` / `_headers` / edge fn), not `src/`. |
| 🎛️ **GTM-UI** | Lives in the Google Tag Manager / GA4 console, not the repo. Cannot be fixed by code edits. |
| ➕ **ADDITIVE** | Not a defect — a net-new enhancement. Optional, value-ranked. |
| 🟡 **STALE** | Premise already satisfied in current code. Verify, then close as done. |
| ❌ **FALSE** | Premise does not hold for this stack (mismeasurement / wrong-CMS assumption). Document & close. |
| ⏸️ **DROP** | No-op: passing check, gold-plated CI guardrail, or empty ticket. |

Each item lists the raw ticket(s) it folds in, a **Status**, and the **commit that closed it**.

---

## Commit ledger

**How we work this audit:** one *major fix* per commit — a single commit may close several WL
items — and every closed item records the commit that closed it. This lets anyone walk the
remediation by reading this table top-to-bottom, or by `git log`-ing the commits. (Stale / false /
no-op items close by documentation here, not by a commit — their row in the ledger is "—".)

**When an item ships:** tick its **Status**, set its **Closed by:** to the short SHA, and add a
row below.

| Commit | Date | WL items closed | Summary |
| --- | --- | --- | --- |
| `edd0218` | 2026-06-25 | WL-10, WL-11 | Contact form: action CTA copy + remove URL field |
| `412c4c7` | 2026-06-25 | WL-05, WL-07, WL-08, WL-09 | A11y pass: content-link underlines, reduced-motion guard, site-wide heading hierarchy (7 files); WL-09 verified no-op |
| `6e3ead2` | 2026-06-25 | WL-01 | Self-host Google Fonts (latin + latin-ext woff2); remove gstatic preconnect + render-blocking stylesheet |
| `f6b2a7e` | 2026-06-25 | WL-02, WL-03 | Defer GTM load until consent (one-shot loader, drop noscript iframe); consent banner ≥48px buttons + legal-route suppression |
| `705377d` | 2026-06-25 | WL-04, WL-06 | A11y: 48px tap targets (hamburger/nav/footer); mobile menu `inert` when closed; honeypot hardening |
| `444cde9` | 2026-06-25 | WL-12 | Add `mailto:` contact paths to footer + contact page (no `tel:` — no number) |
| `fb0a84d` | 2026-06-25 | WL-19, WL-20 | Netlify headers: immutable cache for `/_astro/*` + `/fonts/*`; site-wide security headers + report-only CSP (enforcing nonce-CSP left as follow-up) |
| `60b32b2` | 2026-06-25 | WL-23 (repo half) | `generate_lead` conversion event on `/thanks` (runtime `form_type`); GA4 tag still GTM-side |
| `a920fea` | 2026-06-25 | WL-16, WL-17 | Breadcrumb component (visible nav + BreadcrumbList JSON-LD, sitewide via BaseLayout); CollectionPage/WebPage structured data on the two `/proof` pages |
| `6053c1c` | 2026-06-25 | WL-20 (CSP follow-up) | Nonce-based CSP via Netlify Edge Function (`strict-dynamic`); replaces static report-only; CSP_MODE env flips report-only→enforce |
| `06fc4f6` | 2026-06-25 | WL-14 | Engagement-model expectation-setter under homepage CTAs + `/the-get-right` CTA ("founder replies in 24h") |
| `e198ec7` | 2026-06-25 | WL-18 (content-model foundation) | Typed `src/data/insights.ts` manifest as single source of truth; index + article de-duplicated. Content-model decided: manifest, not collections. |

---

## A · Privacy / compliance — repo-actionable (P0)

### ✅ WL-01 — Self-host Google Fonts
- **Status:** ☑ Done · **Closed by:** `6e3ead2` (2026-06-25) — self-hosted Inter/Lora/JetBrains Mono (latin + latin-ext woff2) in `public/fonts/`, `@font-face` in `global.css`, removed both Google `<link>`s + preconnects, preloaded the two above-fold latin cuts. Build clean: 16 pages, zero googleapis/gstatic refs in dist.
- **Folds:** `fonts-google-fonts-privacy-performance`, `resource-3-google-fonts-external-render-blocking-risk`, `resource-loading-font-subsetting-opportunity`, `gdpr-google-fonts-ip-transfer-third-country`, `gdpr-google-fonts-pre-consent-ip-transmission` (5 tickets → 1)
- **Repo truth:** `src/layouts/BaseLayout.astro:66-71` — `preconnect` + `css2?family=Inter…Lora…JetBrains+Mono` link. Real: visitor IPs go to `fonts.gstatic.com` pre-consent, and it's render-blocking.
- **Action:** Download Inter (variable, Latin) + Lora 700 + JetBrains Mono 400/500 as WOFF2 into `public/fonts/`, add `@font-face` to `src/styles/global.css`, remove the three `<link>`s from BaseLayout.
- **Files:** `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `public/fonts/`

### ✅ WL-02 — Gate analytics/font loading behind consent (not just storage)
- **Status:** ☑ Done · **Closed by:** `f6b2a7e` (2026-06-25) — GTM loader is now a one-shot `window.wktwLoadGTM()`; fires immediately only if a prior `granted` choice is stored, otherwise only from the banner Accept handler (which pushes the consent update first). Removed the `<noscript>` GTM iframe (no-JS visitors can't consent). Fonts already self-hosted (WL-01) and Plausible stays always-on per Jason's decision, so GTM was the only remaining pre-consent load.
- **Folds:** `privacy-1-no-consent-mechanism`, `det-gdpr-pre-consent-tracking-https-weknowthewhy-com`, `privacy-cookies-consent-banner-dark-pattern`, `privacy-cookies-compound-consent-dark-pattern` (4 → 1)
- **Repo truth:** Consent Mode v2 default-denied is present (`BaseLayout.astro:26-50`) but GTM (`:52-57`) and Plausible (`:121-125`) **scripts still load** pre-consent; Consent Mode only denies *storage*, not script loading. The privacy link IS in the banner (`ConsentBanner.astro:19`) and buttons already have primary/ghost hierarchy (`:22-35`) — so the "dark pattern / no privacy link" half of these tickets is **already addressed** (see WL-22). The live gap is: Plausible + Google Fonts fire before any consent decision.
- **Decision (Jason, 2026-06-25):** **Keep Plausible always-on** — it's GDPR/PECR-compliant by design (cookieless, no PII stored, EU-processed) and needs no consent. Once WL-01 self-hosts the fonts, **GTM is the only thing left to consent-gate.** So this item narrows to: defer the GTM loader until the user accepts (Consent Mode v2 already denies storage pre-consent, but the GTM *script* still loads today — gate the load itself). The GA4/GTM-side questions go to Brandon via [`gtm-investigation.md`](./gtm-investigation.md).
- **Files:** `src/layouts/BaseLayout.astro`, `src/components/ConsentBanner.astro`

### ✅ WL-03 — Consent banner: route-aware + larger touch targets
- **Status:** ☑ Done · **Closed by:** `f6b2a7e` (2026-06-25) — buttons bumped to `min-h-[48px] px-5 py-3` (WCAG 2.5.8); floating dialog auto-suppressed on `/legal/privacy` + `/legal/terms` (those pages cover cookies inline and expose the footer Cookie-settings control; `wktwOpenConsent` still works there). Button hierarchy was already fine.
- **Folds:** `consent-banner-ux-on-privacy-page`, `ux-interactive-consent-banner-button-clarity` (touch-target portion)
- **Repo truth:** Banner buttons are `px-4 py-2` ≈ 36px tall (`ConsentBanner.astro:22-35`) — below 48px. No route suppression on `/legal/*`.
- **Action:** Bump buttons to ≥48px; auto-suppress banner on `/legal/privacy` + `/legal/terms` (render inline notice instead). Button hierarchy is already fine.
- **Files:** `src/components/ConsentBanner.astro`

---

## B · Accessibility — repo-actionable (P1)

### ✅ WL-04 — Global 48×48 minimum touch targets
- **Status:** ☑ Done · **Closed by:** `705377d` (2026-06-25) — hamburger → 48×48; mobile menu links + mobile CTA → `min-h-[48px]`; desktop nav CTA + footer links + Cookie-settings button → `min-h-[44px]`. Footer list gap tightened to `space-y-0.5` since links now self-space. Scoped to nav/CTA/hamburger/footer chrome — inline body links untouched.
- **Folds:** `accessibility-touch-targets-undersized`, `mobile-nav-touch-targets-ux`, `ux-mobile-hamburger-discoverability` (size part), `ux-mobile-nav-cta-undersized`, `det-wcag-missing-name-role-value` (touch-target part) (5 → 1)
- **Repo truth:** Nav CTA `px-4 py-2` and hamburger `p-2` on a 24px icon both render ≈40px (`Header.astro:34-39, 43-48`); footer links are inline text. All under WCAG 2.5.8 48px.
- **Action:** Add a minimum-tap-target utility in `global.css` (or per-component min-h/min-w) scoped to nav/CTA/hamburger/footer — not inline body links.
- **Files:** `src/styles/global.css`, `src/components/Header.astro`, `src/components/Footer.astro`

### ✅ WL-05 — Inline links: restore non-color indicator (underline)
- **Status:** ☑ Done · **Closed by:** `412c4c7` (2026-06-25)
- **Folds:** `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about`
- **Repo truth:** `global.css:71-75` — `a { color: accent; text-decoration: none }`. Inline content links are distinguished by color alone → WCAG 1.4.1 fail. (Nav/footer/CTA links are exempt — they're UI chrome with other affordances.)
- **Action:** Underline links inside prose/content contexts (scoped class or `main p a`, `.prose a`), leave nav/footer/buttons alone.
- **Files:** `src/styles/global.css`

### ✅ WL-06 — Hamburger / mobile-menu a11y (dual-DOM + hidden-in-tree)
- **Status:** ☑ Done · **Closed by:** `705377d` (2026-06-25) — `#mobile-menu` now starts `inert aria-hidden="true"` and the toggle handler flips both with open/close, so closed-menu links leave the a11y/focus tree. Honeypot input hardened (`tabindex="-1" autocomplete="off"` + wrapper `aria-hidden`). Hamburger `aria-label`/`aria-expanded` were already present (skipped, as planned).
- **Folds:** `ghost-markup-mobile-menu-hidden-links`, `a11y-5-mobile-menu-duplicate-nav-no-aria-label`, `a11y-mobile-menu-nav-no-aria-label`, `a11y-3-form-missing-label` (honeypot part), `det-wcag-missing-name-role-value` (honeypot part) (5 → 1)
- **Repo truth — partially stale, read carefully:**
  - Hamburger button **already has** `aria-label="Toggle menu"` + `aria-expanded` toggling (`Header.astro:43-48, 87-93`). The "add accessible name" demand is **already done**.
  - There is **one** `<nav>` (`Header.astro:13-54`); the mobile menu is a sibling `<div>` *outside* it (`:57`). So "duplicate `<nav>` landmarks" is **overcounted** — but the mobile menu links remain in the a11y tree while visually `hidden` (toggled via `classList`), which is the real issue.
  - Contact honeypot **already has a wrapped label** (`contact.astro` bot-field) — "missing label" framing is off; the real hardening is `aria-hidden`/`tabindex=-1`/`autocomplete=off`.
- **Action:** (a) When mobile menu is closed, also set `aria-hidden`/`inert` so its links leave the a11y tree; (b) add `aria-hidden tabindex="-1" autocomplete="off"` to the honeypot input. Skip the "add aria-label to hamburger" step — already present.
- **Files:** `src/components/Header.astro`, `src/pages/contact.astro`

### ✅ WL-07 — Heading hierarchy (orphaned h4)
- **Status:** ☑ Done · **Closed by:** `412c4c7` (2026-06-25) — expanded to 7 files (footer + about + scan + 4 the-get-right pages) once grep showed the h2→h4 skip was repo-wide.
- **Folds:** `a11y-heading-hierarchy-skip`, `ux-heading-hierarchy-skip`, `det-wcag-improper-content-structure` (3 → 1)
- **Repo truth:** Footer uses `<h4>` for "Services"/"Company" with no h2/h3 ancestor (`Footer.astro:34, 50`). Audit measured an h2→h4 jump on /about.
- **Action:** Demote footer column headings to `<h3>` (or style-only) and fix the /about jump. The audit's "build a polymorphic heading component" is over-engineered for two footer labels — do the direct fix unless a real pattern emerges.
- **Files:** `src/components/Footer.astro`, `src/pages/about.astro`

### ✅ WL-08 — prefers-reduced-motion guard
- **Status:** ☑ Done · **Closed by:** `412c4c7` (2026-06-25)
- **Folds:** `a11y-6-prefers-reduced-motion-unverified`
- **Repo truth:** Confirmed real — `grep prefers-reduced-motion src/` returns nothing, yet `global.css:27` has `scroll-behavior: smooth` and there are `transition` declarations throughout.
- **Action:** Add a `@media (prefers-reduced-motion: reduce)` block in `global.css` neutralizing transitions/animations/smooth-scroll. Skip the proposed CI lint rule (gold-plating).
- **Files:** `src/styles/global.css`

### 🟡 WL-09 — Contrast ratio fix (VERIFY FIRST — likely artifact)
- **Status:** ☑ Done (no-op — verified) · **Closed by:** `412c4c7` (2026-06-25) — computed all real brand pairs; lowest is `primary-brand` 4.73:1, links 8.72:1, body 13:1. All pass AA. Audit's 1:1 reading was a detector artifact (fg==bg). No code change.
- **Folds:** `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com-about`
- **Repo truth:** Suspicious. Audit reports `#2C211D` foreground on `#2C211D` background = 1.00:1 (foreground == background) — that's a detector artifact, not a real readable element. Brand text is `#EFEBE9`/`#BCAAA4` on `#2C211D`, which passes.
- **Action:** Reproduce on live `/about` with axe DevTools before changing any color. Do **not** blind-apply the audit's computed `#8B8A89` values — they may de-brand passing text. Likely closes as no-op.
- **Files:** `src/styles/global.css` (only if a real failure reproduces)

---

## C · Conversion / UX — repo-actionable (P1)

### ✅ WL-10 — Contact CTA button copy
- **Status:** ☑ Done · **Closed by:** `edd0218` (2026-06-25)
- **Folds:** `ux-conversion-cta-text-generic`
- **Repo truth:** Confirmed — submit button reads "Send Message" (`contact.astro:83-88`).
- **Action:** Replace with action copy mirroring the h1 ("Talk to a founder" → e.g. "Send it to a founder" / "Start the conversation").
- **Files:** `src/pages/contact.astro`

### ✅ WL-11 — Remove URL field from contact form
- **Status:** ☑ Done · **Closed by:** `edd0218` (2026-06-25)
- **Folds:** `ux-form-url-field-mobile-friction`
- **Repo truth:** Confirmed — optional `type="url"` Website URL field exists (`contact.astro:63-69`). Real mobile friction.
- **Action:** Remove the field (enrich company from email domain post-submit if needed). Quick win.
- **Files:** `src/pages/contact.astro`

### ✅ WL-12 — Add tel:/mailto: contact paths
- **Status:** ☑ Done · **Closed by:** `444cde9` (2026-06-25) — `mailto:jon@weknowthewhy.com` added to footer brand column + contact page (email alternative to the form). No `tel:` link — no business number to expose (Jason's call, 2026-06-25). Reused the address already public on `/about`.
- **Folds:** `ux-no-phone-tel-link`
- **Repo truth:** Footer + contact page have no tappable phone/email (`Footer.astro`, `contact.astro`).
- **Action:** Add `mailto:` (and `tel:` if a number exists) to footer + contact page. Confirm with Jason what address/number to expose.
- **Files:** `src/components/Footer.astro`, `src/pages/contact.astro`

### ➕ WL-13 — Trust signals at conversion points
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `ux-conversion-no-trust-signals`, `ux-content-sparse-above-fold`, `ux-revenue-no-social-proof-above-fold`, `no-cross-sell-or-trust-signals`, `conv-ux-001` (about-page terminus), `conv-arch-1` (article conversion layer) (6 → 1 themed effort)
- **Repo truth:** Additive, not a defect. `/proof` exists as a destination; these route proof content into `/contact`, `/about`, service, and article templates. The audit's "CMS template variant / Liquid" code is **not portable** — build as Astro components.
- **Action:** Scope as a follow-on design pass (own branch). Build a `TrustBlock.astro` + slot it. Not a quick fix; needs copy/testimonials from Jason.
- **Files:** new `src/components/TrustBlock.astro`, `src/pages/contact.astro`, `src/pages/about.astro`, service pages, insights article

### ✅ WL-14 — Engagement-model framing (pre-qualification)
- **Status:** ☑ Done · **Closed by:** `06fc4f6` (2026-06-25) — added a one-line expectation-setter under both homepage CTAs (hero + footer) and folded the same first-step promise into the `/the-get-right` CTA: *"A founder replies within 24 hours — no sales team, no account managers. We establish fit before either side commits."* Lowers the perceived commitment of the "Talk to a Founder" ask by making the next step legible before contact. Verified desktop + mobile, both CTAs.
- **Decision (Jason, 2026-06-25):** **One offering, no tiers.** The audit's sample code proposed a 3-tier grid (Diagnostic / Sprint / Advisory) with duration+fee badges — **rejected as inaccurate**: WKTW sells one productized engagement (The Get Right, fixed 90-day sprint). Building fake tiers would describe a business that doesn't exist (the ticket's own #1 risk). The promised first step is the **async founder reply within 24h** already stated on `/thanks` — **not** the audit's assumed "20-minute scoping call." Built in Tailwind/Astro, not the audit's BEM/separate-CSS scaffold.
- **Repo truth:** The audit's "Engagement Model Described: False" was **largely stale for `/the-get-right`** — that page already had an Investment section (project-based, no upfront retainer, custom-scoped), a 90-day timeline, "What you get," and FAQs on cost/duration/retainer. The **genuine** gap was the homepage CTA zone, which had zero expectation-setting. Fixed there; reinforced lightly on `/the-get-right`. No redundant "engagement model" section added.
- **Folds:** `ux-revenue-no-pricing-signals`
- **Files:** `src/pages/index.astro`, `src/pages/the-get-right/index.astro`

---

## D · SEO / structured data — additive (P2)

### ✅ WL-15 — Person schema on /about
- **Status:** ☑ Done (already implemented — premise was stale) · **Closed by:** — (documentation; no commit needed) — verified `about.astro:255-333` already defines a `@graph` of all three Person nodes (`#jon-lister`, `#jason-bauman`, `#brandon-griner`) with `@id`s that match BaseLayout's `founder` references, each with `worksFor` → `#organization`, `knowsAbout`, and `sameAs`. The "referenced but undefined" premise no longer holds (the nodes were added during the positioning work on this branch). No code change.
- **Folds:** `schema-person-about-page-missing`, `ux-revenue-2` (partial)
- **Repo truth:** BaseLayout emits Organization JSON-LD referencing `#jon-lister`, `#jason-bauman`, `#brandon-griner` (`BaseLayout.astro:116-118`); the matching Person nodes now exist on `/about` (`about.astro:255-333`). Byline already present (`:36-38`).
- **Files:** `src/pages/about.astro`

### ✅ WL-16 — Breadcrumbs (UI + BreadcrumbList JSON-LD)
- **Status:** ☑ Done · **Closed by:** `a920fea` (2026-06-25) — `Breadcrumb.astro` auto-derives the trail from `Astro.url.pathname`, rendering a visible `<nav>` + `BreadcrumbList` JSON-LD. Wired into BaseLayout via a `breadcrumb` prop (default true); home + 404 opt out. Section-index segments link to their index; the current page + index-less segments (`/legal`) render as text. Outer `<nav>` is full-width with an inner `max-w-7xl mx-auto` container — needed because BaseLayout's `<body>` is `flex flex-col`, so a bare `mx-auto` nav shrink-wraps and centers. Verified left-aligned + spaced on desktop/mobile across nested, top-level, and legal pages; JSON-LD validated on all routes.
- **Folds:** `ux-nav-no-breadcrumbs`
- **Repo truth:** Additive. Genuinely absent. Reasonable Astro component using `Astro.url.pathname`.
- **Files:** new `src/components/Breadcrumb.astro`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro` + `src/pages/404.astro` (opt out)

### ✅ WL-17 — Proof page structured data
- **Status:** ☑ Done · **Closed by:** `a920fea` (2026-06-25) — `/proof` now emits a `CollectionPage`, `/proof/our-site` a `WebPage`, both tied to the sitewide Organization `@id` (`about`/`publisher`). `BreadcrumbList` auto-emits via the WL-16 component and Organization is sitewide, so the audit's "add BreadcrumbList/Organization" ask is covered. **No Review/Rating nodes** — per the audit's own caveat, we don't fabricate testimonials we haven't earned; add them when real, attributable client results are published. All ld+json on both pages validated as parsing.
- **Folds:** `gap-structured-data-proof-page-001`, `escalation-unknown-schema-type` (validation harness)
- **Repo truth:** Additive. Add BreadcrumbList/Organization (and Review only if real testimonial content exists — do not fabricate).
- **Files:** `src/pages/proof/our-site.astro`, `src/pages/proof/index.astro`

### 🟢 WL-18 — Internal linking / related-content
- **Status:** 🟢 Foundation done; visible features deferred (content-volume-gated) · **Closed by:** `e198ec7` (content-model foundation)
- **Content-model decision (Jason, 2026-06-25):** **typed manifest, NOT Astro content collections.** There's one richly-designed, bespoke 385-line `.astro` article today, so collections (MDX migration of that article) would be abstraction ahead of real friction. The actual friction was metadata *duplication* between the listing and the article — `e198ec7` fixes exactly that with `src/data/insights.ts` (single source of truth, typed `InsightPost`; index uses `insightsByDate()`, article uses `getPost()`). Behavior-preserving (built pages byte-identical to baseline). The manifest is the seam to graduate into a content collection later if publishing volume grows.
- **Folds:** `navigation-no-search`, `ux-nav-internal-linking-sparse`, `conversion-ux-social-share-1` (3 → 1)
- **Repo truth:** Additive. The Pagefind search + RelatedContent component are reasonable but sizeable. With **one** article, related-content has nothing to relate to and search indexes a handful of pages — so these are **deferred until content volume justifies them**. The manifest makes related-content a small add once article #2 lands; Pagefind search and social share are independent of the content model and can ship anytime.
- **Remaining (deferred, not blocked):** RelatedContent component (reads the manifest, filters by tag/excludes current) · Pagefind search over built HTML · social-share buttons on articles.
- **Files:** `src/data/insights.ts`, `src/pages/insights/index.astro`, `src/pages/insights/why-most-audits-dont-change-anything.astro`

---

## E · Netlify config — real, not in `src/` (P1–P2)

### 🔧 WL-19 — Cache headers for hashed assets
- **Status:** ☑ Done · **Closed by:** `fb0a84d` (2026-06-25) — `netlify.toml` `[[headers]]` for `/_astro/*` and `/fonts/*` → `public, max-age=31536000, immutable`. HTML left on Netlify defaults. Verify post-deploy via the curl checks in `audit.md`.
- **Folds:** `cache-control-no-caching-static-assets`, `st-6-cache-control-no-immutable-on-hashed-assets`, `server-transport-no-cdn-cache-headers` (3 → 1)
- **Repo truth:** `netlify.toml` has no `[[headers]]` — real gap. `/_astro/*` is content-hashed and safe to cache immutably.
- **Action:** Add `[[headers]]` for `/_astro/*` → `public, max-age=31536000, immutable`; leave HTML on must-revalidate.
- **Files:** `netlify.toml`

### 🔧 WL-20 — Security headers + CSP
- **Status:** ☑ Done (repo) — **live validation + enforce flip pending (ops)** · **Closed by:** `fb0a84d` (static headers) + `6053c1c` (CSP). `6053c1c` replaces the toothless static report-only CSP (it kept `'unsafe-inline'`, so it could never report a violation) with a **per-request nonce-based CSP** minted in a Netlify Edge Function (`netlify/edge-functions/csp.ts`). It nonces every `<script>` (inline, module, external Plausible, ld+json) and emits a `'strict-dynamic'` policy so the nonced GTM loader can pull in `gtm.js`/GA4 without host-allowlisting Google's rotating URLs. Static headers (XFO, nosniff, Referrer-Policy, HSTS, Permissions-Policy) remain in `netlify.toml`.
  - **Safe rollout:** the function defaults to **report-only** and flips to enforcing via the **`CSP_MODE=enforce`** env var (Netlify UI) — reversible, no code change. The nonce-injection transform is verified against built HTML across 6 routes (every opening `<script>` nonced once, closers balanced, zero leftover).
  - **⚠️ Before flipping `CSP_MODE=enforce` (Jason/Brandon, on a deploy preview):** (1) load several pages, confirm **zero CSP violations** in the console / Netlify function logs in report-only mode; (2) accept cookies → confirm **GTM + GA4 fire** (strict-dynamic propagation) and **Plausible** loads; (3) submit the contact + scan forms → `/thanks` `generate_lead` still pushes; (4) exercise the mobile menu + consent banner (their scripts are nonced). Only then set `CSP_MODE=enforce`. Also still confirm no plain-HTTP subdomain before trusting HSTS `includeSubDomains`.
- **Folds:** `det-security-headers-https-weknowthewhy-com-about`, `escalation-1-sri-gtm-ga-mitigation`, `prescan-escalation-sri-gtm-incompatibility` (3 → 1)
- **Repo truth:** No security headers served — real. Static directives (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, HSTS) go in `netlify.toml`. Nonce-based CSP needs a Netlify Edge Function (the audit's recommendation is sound; SRI is genuinely incompatible with GTM's rotating scripts). CSP is the bigger lift — sequence static headers first, CSP report-only second.
- **Files:** `netlify.toml`, optional `netlify/edge-functions/csp.ts`

### 🔧 WL-21 — Build-time link + sitemap validation
- **Status:** ☐ Open (optional) · **Closed by:** —
- **Folds:** `prescan-escalation-internal-links-unverified`, `ux-sitemap-unverifiable` (validation part)
- **Repo truth:** `@astrojs/sitemap` is **already installed** (`astro.config.mjs:3,9`) — the "install sitemap" premise is stale (see WL-24). What's *not* present is build-time link-checking. Optional hardening.
- **Files:** `netlify.toml` / build script

---

## F · GTM-UI / analytics — NOT repo work (verify in console)

> **Headline finding:** The entire "redundant/dual-beacon analytics" cluster assumes a
> **standalone `gtag.js`** in the page source. There is **none** — `grep` of `src/` finds
> only the Consent Mode v2 `gtag('consent', …)` helper (`BaseLayout.astro:26-50`), one GTM
> loader (`GTM-5VQTG6TH`), and Plausible. There is no `gtag('config', …)`, no `gtag/js?id=`
> loader, and only one GTM container. If the audit saw two GA4 beacons in production, the
> second is configured **inside the GTM container**, which is the Google console — not this
> repo. None of these can be "fixed" by editing code.

### 🎛️ WL-22 — Analytics consolidation (GTM-console audit)
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `an-2-duplicate-analytics-gtm-ga4-plausible`, `js-4-ga4-collect-aborted-data-loss`, `attribution-split-pixel-not-applicable`, `escalation-5-ga4-err-aborted-root-cause`, `js-unused-bytes-low-but-present`, `resource-loading-dual-analytics-redundancy`, `ux-analytics-triple-redundancy-kpi-corruption`, `ux-analytics-cross-domain-unknown`, `analytics-dual-gtm-inter-container-tag-conflicts`, `escalation-1` (gtag part) (10 → 1)
- **Action:** Handed to **Brandon** (manages the container) via **[`gtm-investigation.md`](./gtm-investigation.md)** — a standalone, console-facing checklist. Confirm whether a standalone GA4 config tag AND a separate gtag fire; if the dual-beacon exists, fix it **in GTM**, not the repo. Findings get logged in that doc; closes here once Brandon reports back.

### 🎛️➕ WL-23 — Conversion event instrumentation
- **Status:** 🟢 Repo half done (GTM tag still Brandon's) · **Closed by:** `60b32b2` (2026-06-25) — `/thanks` fires a `generate_lead` dataLayer push (`form_type` read from live URL at runtime: `contact` | `scan`). Self-gates on consent. Validated in-browser. **Remaining (GTM-side):** create the GA4 tag/trigger that consumes `generate_lead` in container GTM-5VQTG6TH — added to `gtm-investigation.md` for Brandon.
- **Folds:** `ux-analytics-form-submit-untracked`, `analytics-cta-conversion-tracking-gap`
- **Repo truth:** Mixed. Firing a `generate_lead` dataLayer push on contact submit is a **small repo edit** (`contact.astro` form `submit` listener → `dataLayer.push`), but the GA4 tag that consumes it is **GTM-side**. Both halves needed.
- **Files:** `src/pages/contact.astro` (+ GTM tag config)

---

## G · Stale — already satisfied, verify & close

| ID | Raw ticket | Why stale (repo evidence) |
| --- | --- | --- |
| 🟡 WL-24 | `ux-sitemap-unverifiable` | `@astrojs/sitemap` already installed & configured with `/scan` excluded (`astro.config.mjs:3,9`). |
| 🟡 WL-25 | `escalation-2-og-twitter-meta-unknown`, `escalation-og-twitter-meta-unverifiable` | Full OG + Twitter Card tags already present (`BaseLayout.astro:79-90`). Per-page overrides optional, but "missing/unknown" is false. |
| 🟡 WL-26 | `prescan-escalation-3-canonical-trailing-slash` | `netlify.toml` comment + `trailingSlash:'never'` (`astro.config.mjs`) already align Netlify Pretty URLs with canonical. No contradiction to fix — verify live, then close. |
| 🟡 WL-27 | `ux-mobile-hamburger-discoverability` (aria part), `det-wcag-missing-name-role-value` (hamburger part) | Hamburger already has `aria-label` + `aria-expanded` (`Header.astro:43-48`). Only touch-target remains → folded into WL-04. |

---

## H · False / mismeasured — document & close

| ID | Raw ticket | Why false for this stack |
| --- | --- | --- |
| ❌ WL-28 | `js-unused-bytes-low-but-present`, `resource-loading-js-unused-absolute-bytes-static-page` | Audit claims a **2.56MB application bundle, ~475KB unused**, citing "cart, product configurators, checkout, filter/sort systems." This is a **static Astro site with no e-commerce**; total built JS is **one 28KB Svelte chunk** (`dist/_astro/client.svelte.*.js`). Pure mismeasurement (likely counting GTM/GA's loaded JS as an app bundle). No action. |
| ❌ WL-29 | `resource-loading-js-transfer-coverage-inconsistency` | A finding about the **audit tool's own measurement harness**, not the site. Not our ticket. |

---

## I · Drop — no-ops, passing checks, empty tickets

These are "passing audit checks" reframed as tickets proposing CI guardrails, plus one empty
ticket. They inflate the count (80 findings) without representing defects. Park, don't build —
unless a specific guardrail earns its keep later.

| ID | Raw ticket | Disposition |
| --- | --- | --- |
| ⏸️ WL-30 | `unknown_untitled.md` | **Empty/malformed** — "Untitled Finding", severity unknown, no fix. Drop. (Logged as MUTTR-02.) |
| ⏸️ WL-31 | `inp-excellent-no-issues` | Passing (40ms INP). No action. |
| ⏸️ WL-32 | `visual-stability-cls-excellent` | Passing (CLS 0.000). No action. |
| ⏸️ WL-33 | `server-transport-ttfb-excellent` | Passing TTFB. No action. |
| ⏸️ WL-34 | `api-1-minimal-network-waterfall`, `api-network-waterfall-minimal` | Passing (static, no waterfall). No action. |
| ⏸️ WL-35 | `a11y-lang-attribute-correct` | Passing (`<html lang="en">` present, `BaseLayout.astro:19`). No action. |
| ⏸️ WL-36 | `backwards-compat-astro-modern-css` | No current defect; proposes speculative CI guard. Park. |
| ⏸️ WL-37 | `resource-loading-lcp-svg-hero` | `fetchpriority`/preload micro-opt; passing LCP. Optional, low value. |
| ⏸️ WL-38 | `resource-4-no-srcset-on-team-images` | Minor; 3 headshots already WebP. Optional. |
| ⏸️ WL-39 | `mobile-text-readability-unverified`, `no-horizontal-scroll-issues`, `ux-content-1` | Unverified spot-checks / housekeeping audits. Park unless a real instance surfaces. |

---

## Disposition summary

| Disposition | Work items | Raw tickets folded |
| --- | --- | --- |
| ✅ DO (repo) | WL-01–12 | ~30 |
| ➕ ADDITIVE | WL-13–18, WL-23 | ~12 |
| 🔧 CONFIG (Netlify) | WL-19–21 | 6 |
| 🎛️ GTM-UI | WL-22 | 10 |
| 🟡 STALE | WL-24–27 | 5 |
| ❌ FALSE | WL-28–29 | 3 |
| ⏸️ DROP | WL-30–39 | ~13 |

**Net:** ~80 raw findings / ~60 tickets → **~12 real repo fixes**, ~7 additive enhancements,
3 Netlify-config jobs, 1 GTM-console audit, the rest stale/false/no-op.

## Suggested execution order

1. **Quick wins (≤1 session):** WL-10, WL-11, WL-05, WL-08, WL-09 (verify), WL-07
2. **Privacy pass (decision-gated):** WL-01, WL-02, WL-03 — needs Jason's call on Plausible gating
3. **A11y pass:** WL-04, WL-06, WL-12
4. **Netlify config:** WL-19, WL-20
5. **GTM console audit:** WL-22, WL-23 (Jason)
6. **Additive / design (own branches):** WL-13–18

## Progress log
- 2026-06-25 — Worklog created; all 60 tickets triaged & repo-verified. Nothing started yet.
- 2026-06-25 — **All repo-actionable items closed** (WL-01–12 + WL-19/20 + WL-23 repo half). Consent gate live-validated in a real browser (14/14 behaviors: GTM never loads pre-consent / after Decline; fires on Accept; fonts fully self-hosted — no gstatic/googleapis). Remaining work is GTM-console (Brandon: WL-22, WL-23 GA4 tag), additive design passes (WL-13–18), and the enforcing nonce-CSP follow-up (WL-20).
- 2026-06-25 — **Adjacent fix (not an audit item)** `ecf9dcd`: `/thanks` scan/contact copy branched on `Astro.url.searchParams` but the page is static, so scan submitters saw the contact copy. Found while wiring WL-23; fixed via runtime `?type=` read (same script as the conversion event). Latent today (scan funnel paused) but correct now for relaunch.
- 2026-06-25 — **Additive SEO pass** `a920fea` (WL-16, WL-17): sitewide breadcrumbs (visible nav + `BreadcrumbList` JSON-LD) and page-level structured data on the `/proof` pages. **WL-15 closed as stale** — the `/about` Person `@graph` already exists (`about.astro:255-333`), so its "undefined `@id`" premise no longer held.
- 2026-06-25 — **WL-20 CSP follow-up closed (repo)** `6053c1c`: nonce-based CSP via Netlify Edge Function with `strict-dynamic`, replacing the static report-only. Defaults to report-only; flips to enforce via `CSP_MODE=enforce`. Repo work done; **live deploy-preview validation + the enforce flip remain an ops step** (checklist in the WL-20 entry above). With this, every repo + Netlify-config item is closed.
- 2026-06-25 — **WL-14 closed** `06fc4f6`: engagement-model expectation-setter under the homepage CTAs + `/the-get-right` CTA. Decided one-offering (rejected the audit's fake 3-tier grid); first-step promise is the async 24h founder reply already on `/thanks`.
- 2026-06-25 — **WL-18 content-model decided + foundation built** `e198ec7`: chose a typed metadata manifest (`src/data/insights.ts`) over Astro content collections — one bespoke article today, so collections would be premature abstraction; the real friction (listing↔article metadata duplication) is now fixed, behavior-preserving. Visible WL-18 features (related-content, Pagefind search, social share) **deferred until content volume justifies them**. Remaining across the audit: **WL-13 deferred** (trust signals — no testimonials yet); WL-18 visible features (content-gated); optional WL-21 (build-time link-checking); ops-only WL-20 enforce flip; GTM-console WL-22 + WL-23 GA4 tag (Brandon).
