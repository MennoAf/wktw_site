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

---

## A · Privacy / compliance — repo-actionable (P0)

### ✅ WL-01 — Self-host Google Fonts
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `fonts-google-fonts-privacy-performance`, `resource-3-google-fonts-external-render-blocking-risk`, `resource-loading-font-subsetting-opportunity`, `gdpr-google-fonts-ip-transfer-third-country`, `gdpr-google-fonts-pre-consent-ip-transmission` (5 tickets → 1)
- **Repo truth:** `src/layouts/BaseLayout.astro:66-71` — `preconnect` + `css2?family=Inter…Lora…JetBrains+Mono` link. Real: visitor IPs go to `fonts.gstatic.com` pre-consent, and it's render-blocking.
- **Action:** Download Inter (variable, Latin) + Lora 700 + JetBrains Mono 400/500 as WOFF2 into `public/fonts/`, add `@font-face` to `src/styles/global.css`, remove the three `<link>`s from BaseLayout.
- **Files:** `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `public/fonts/`

### ✅ WL-02 — Gate analytics/font loading behind consent (not just storage)
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `privacy-1-no-consent-mechanism`, `det-gdpr-pre-consent-tracking-https-weknowthewhy-com`, `privacy-cookies-consent-banner-dark-pattern`, `privacy-cookies-compound-consent-dark-pattern` (4 → 1)
- **Repo truth:** Consent Mode v2 default-denied is present (`BaseLayout.astro:26-50`) but GTM (`:52-57`) and Plausible (`:121-125`) **scripts still load** pre-consent; Consent Mode only denies *storage*, not script loading. The privacy link IS in the banner (`ConsentBanner.astro:19`) and buttons already have primary/ghost hierarchy (`:22-35`) — so the "dark pattern / no privacy link" half of these tickets is **already addressed** (see WL-22). The live gap is: Plausible + Google Fonts fire before any consent decision.
- **Decision (Jason, 2026-06-25):** **Keep Plausible always-on** — it's GDPR/PECR-compliant by design (cookieless, no PII stored, EU-processed) and needs no consent. Once WL-01 self-hosts the fonts, **GTM is the only thing left to consent-gate.** So this item narrows to: defer the GTM loader until the user accepts (Consent Mode v2 already denies storage pre-consent, but the GTM *script* still loads today — gate the load itself). The GA4/GTM-side questions go to Brandon via [`gtm-investigation.md`](./gtm-investigation.md).
- **Files:** `src/layouts/BaseLayout.astro`, `src/components/ConsentBanner.astro`

### ✅ WL-03 — Consent banner: route-aware + larger touch targets
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `consent-banner-ux-on-privacy-page`, `ux-interactive-consent-banner-button-clarity` (touch-target portion)
- **Repo truth:** Banner buttons are `px-4 py-2` ≈ 36px tall (`ConsentBanner.astro:22-35`) — below 48px. No route suppression on `/legal/*`.
- **Action:** Bump buttons to ≥48px; auto-suppress banner on `/legal/privacy` + `/legal/terms` (render inline notice instead). Button hierarchy is already fine.
- **Files:** `src/components/ConsentBanner.astro`

---

## B · Accessibility — repo-actionable (P1)

### ✅ WL-04 — Global 48×48 minimum touch targets
- **Status:** ☐ Open · **Closed by:** —
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
- **Status:** ☐ Open · **Closed by:** —
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
- **Status:** ☐ Open · **Closed by:** —
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

### ➕ WL-14 — Engagement-model framing (pre-qualification)
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `ux-revenue-no-pricing-signals`
- **Repo truth:** Additive content. Overlaps your in-flight positioning work on this branch — coordinate, don't double-edit.
- **Files:** `src/pages/the-get-right/index.astro`, `src/pages/index.astro`

---

## D · SEO / structured data — additive (P2)

### ➕ WL-15 — Person schema on /about
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `schema-person-about-page-missing`, `ux-revenue-2` (partial)
- **Repo truth:** BaseLayout already emits Organization JSON-LD referencing `#jon-lister`, `#jason-bauman`, `#brandon-griner` (`BaseLayout.astro:103-107`), and the insights article already has BlogPosting schema with author→Person `@id` (`why-most-audits…astro:370`). The referenced Person `@id`s are **not yet defined** on `/about`. So the work is: define the Person nodes on `/about`. `ux-revenue-2` byline already exists (`:36-38`) — only the schema node is missing.
- **Files:** `src/pages/about.astro`

### ➕ WL-16 — Breadcrumbs (UI + BreadcrumbList JSON-LD)
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `ux-nav-no-breadcrumbs`
- **Repo truth:** Additive. Genuinely absent. Reasonable Astro component using `Astro.url.pathname`.
- **Files:** new `src/components/Breadcrumb.astro`, `src/layouts/BaseLayout.astro`

### ➕ WL-17 — Proof page structured data
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `gap-structured-data-proof-page-001`, `escalation-unknown-schema-type` (validation harness)
- **Repo truth:** Additive. Add BreadcrumbList/Organization (and Review only if real testimonial content exists — do not fabricate).
- **Files:** `src/pages/proof/our-site.astro`, `src/pages/proof/index.astro`

### ➕ WL-18 — Internal linking / related-content
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `navigation-no-search`, `ux-nav-internal-linking-sparse`, `conversion-ux-social-share-1` (3 → 1)
- **Repo truth:** Additive. The Pagefind search + RelatedContent component are reasonable but sizeable. The audit's "Astro content frontmatter schema" assumes content collections — the site currently uses per-page `.astro` files, not a collection, so this needs a content-model decision first.
- **Files:** TBD — needs architecture decision (content collections?)

---

## E · Netlify config — real, not in `src/` (P1–P2)

### 🔧 WL-19 — Cache headers for hashed assets
- **Status:** ☐ Open · **Closed by:** —
- **Folds:** `cache-control-no-caching-static-assets`, `st-6-cache-control-no-immutable-on-hashed-assets`, `server-transport-no-cdn-cache-headers` (3 → 1)
- **Repo truth:** `netlify.toml` has no `[[headers]]` — real gap. `/_astro/*` is content-hashed and safe to cache immutably.
- **Action:** Add `[[headers]]` for `/_astro/*` → `public, max-age=31536000, immutable`; leave HTML on must-revalidate.
- **Files:** `netlify.toml`

### 🔧 WL-20 — Security headers + CSP
- **Status:** ☐ Open · **Closed by:** —
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
- **Status:** ☐ Open · **Closed by:** —
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
