
# Muttr Scan Report: We Know the Why

**URL:** https://weknowthewhy.com/
**Scanned:** 2026-06-25 00:57 UTC
**Auditor:** w.k.t.w.

---

## Executive Summary

A comprehensive audit of weknowthewhy.com identified 68 issues across accessibility, security, and regulatory compliance, with 8 findings investigated in depth. The most urgent concern is a critical GDPR violation: tracking scripts load before user consent is obtained and the cookie consent mechanism lacks verified Accept/Decline parity, exposing the business to regulatory fines of up to 4% of annual global revenue. Mobile usability is also significantly compromised, with 20 touch targets falling below the 48×48px minimum threshold, increasing friction and drop-off risk across key navigation and conversion elements. Addressing the consent and accessibility gaps should be prioritized immediately to reduce legal liability and protect user experience across all devices.

---

## Top Findings

8 issues were fully investigated with actionable fix proposals.





### Critical (1)


#### Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure

The page loads Google Tag Manager (GTM-5VQTG6TH), Google Analytics (G-91BP6NPTSM via gtag.js), and Plausible Analytics without any detectable cookie consent management platform (CMP). The DOM shows consent-related button IDs (#consent-decline, #consent-accept) and a button with class 'text-secondary-text text-sm' in the footer, suggesting a custom consent banner exists in the markup. However, the network request log shows GTM and GA scripts loading and firing a collect beacon immediately — the GA4 collect request fired (returned 204 before being aborted, likely by the test environment) without any consent interaction having occurred. This means tracking infrastructure initializes before any user consent decision. If the custom consent banner is purely cosmetic (scripts fire regardless of user choice), this constitutes a consent bypass. Even if the banner functions correctly in production, the architecture of loading GTM unconditionally and relying on GTM's consent mode to gate tags is fragile — any misconfiguration in GTM consent mode settings results in pre-consent data collection. The presence of both #consent-accept and #consent-decline buttons suggests intent to offer choice, but the measured behavior shows tracking requests firing before any interaction with those buttons.



**Category:** privacy_cookies


**Compliance:** gdpr, ccpa




**Fix:** Replace the broken custom consent implementation with a consent-gated script loading architecture where GTM, GA4, Plausible, and Google Fonts are blocked from loading until the user grants explicit consent. Self-host Google Fonts to eliminate the pre-consent IP transmission entirely. Implement a minimal, spec-compliant consent manager that persists state, replays consent decisions, and injects scripts only after affirmative action.

**How:** 1. SELF-HOST GOOGLE FONTS IMMEDIATELY — Download all Google Font files currently loaded from fonts.googleapis.com. Convert to WOFF2 if not already. Serve from the site's own origin or existing CDN. Update all CSS @font-face rules to reference local paths. This eliminates the Google Fonts GDPR vector entirely and removes it from the consent gate (fonts become first-party assets). This step has zero consent dependency and should ship first.

2. REMOVE ALL INLINE GTM/GA4/PLAUSIBLE SCRIPT TAGS FROM HTML TEMPLATES — Delete the hardcoded <script> tags for GTM (GTM-5VQTG6TH), gtag.js (G-91BP6NPTSM), and Plausible from every template. These must never appear in raw HTML. They will be injected dynamically by the consent manager only after consent is granted.

3. DEPLOY THE CONSENT MANAGER (code below) — Add the consent manager script as an inline <script> in the <head>, BEFORE any other scripts. It must be first-party, inline, and synchronous so it executes before anything else. The consent manager: (a) checks localStorage for prior consent state, (b) if no prior state, renders the consent banner and blocks all tracking, (c) on accept, persists consent to localStorage with timestamp and version, then injects tracking scripts, (d) on decline, persists refusal and injects nothing, (e) on subsequent page loads with stored consent, injects scripts immediately without showing the banner.

4. CONFIGURE GOOGLE CONSENT MODE V2 DEFAULTS — Before GTM loads, push default deny states to the dataLayer. When consent is granted, push update commands. This ensures that even if GTM somehow loads before consent (defense in depth), Consent Mode defaults prevent cookie writes and restrict data collection.

5. REPLACE THE EXISTING CONSENT BANNER DOM — Remove the current #consent-accept / #consent-decline elements from server-rendered HTML. The consent manager injects its own banner dynamically. This avoids the current failure mode where the banner exists in DOM but is invisible.

6. ADD A PERSISTENT 'MANAGE COOKIES' LINK IN THE SITE FOOTER — This allows users to revoke or modify consent post-decision, which is required under GDPR Article 7(3). The link calls the consent manager's revoke function, clears stored consent, removes injected scripts' cookies, and re-displays the banner.

7. VERIFY WITH EU-ORIGIN TESTING — After deployment, test from an EU IP (VPN or proxy) to confirm: (a) no network requests to google-analytics.com, googletagmanager.com, or plausible.io before consent interaction, (b) banner renders and is interactive, (c) accept injects scripts and fires beacons, (d) decline persists and no scripts load on subsequent navigation, (e) revoke clears cookies and re-gates scripts.


**Effort:** medium



---






### High (3)


#### Pre-consent tracking [GDPR]

0 non-essential cookie(s) and 3 tracking request(s) fire before any consent interaction.


**Pages affected:** 1


**Category:** privacy_cookies


**Compliance:** gdpr




**Fix:** Gate all third-party network requests (GTM, GA4, any additional vendors) behind explicit consent. No vendor script may load, no network request may fire, and no GTM container may initialize until the user has made an affirmative consent decision in the current session. Google Consent Mode v2 storage-denial defaults are retained as a secondary safeguard but are not the primary enforcement mechanism — script loading itself must be blocked pre-consent.

**How:** 1. REMOVE GTM from <head>/<body> HTML. Delete both the <script> snippet in <head> and the <noscript> iframe in <body> from the CMS theme/layout template. This is the only change that eliminates the sync-blocking pre-consent execution. Partial mitigations (async attribute, defer) do not prevent the network request.
2. IMPLEMENT a consent state module (consent-gate.js) that: (a) reads a first-party consent cookie on page load, (b) if consent is already granted from a prior session, loads GTM immediately via dynamic script injection, (c) if no prior consent exists, renders the consent banner and waits for user action before loading anything.
3. IMPLEMENT the consent banner in raw HTML/CSS with no JS dependency for rendering. The banner must be visible in the DOM on first paint — not injected by JS — so it renders before any script executes and is visible even if JS fails. Use a <div> with inline style='display:block' that consent-gate.js hides after a decision is recorded.
4. WIRE consent-accept and consent-decline buttons to the consent-gate module. On accept: write the consent cookie, dynamically inject GTM, push consent state to dataLayer. On decline: write the decline cookie, do not inject GTM, push denied consent state to dataLayer (for Consent Mode v2 signal only — no GTM load means no network request).
5. IMPLEMENT session persistence: read the consent cookie on every page load in consent-gate.js before any other script runs. If granted, inject GTM. If denied, do not inject. This covers direct-entry traffic to all pages, not just the homepage.
6. VERIFY geo-conditional rendering: if the banner is suppressed for non-EU visitors, the geo-detection logic must run server-side (via CDN edge function or server middleware) and set a response header or cookie that consent-gate.js reads. Client-side geo-detection is too slow and creates a race condition where scripts fire before the geo check resolves.
7. CONFIGURE GTM container: inside GTM, set all tags to fire only on a custom event (consent_granted) pushed to dataLayer by consent-gate.js. This provides defense-in-depth — even if the script injection gate fails, GTM will not fire tags without the dataLayer signal.
8. AUDIT Plausible: Plausible Analytics is cookieless and does not transmit personal data in the same manner as Google's stack, but its script still fires pre-consent and transmits IP + User-Agent to Plausible's servers. Determine whether Plausible is used as a privacy-preserving alternative to GA4 or alongside it. If it is the sole analytics tool and GA4 is removed, Plausible may qualify for a legitimate interest basis under some DPAs — document this decision. If GA4 is retained, gate Plausible identically to GTM.
9. ADD a post-reject network audit: after a user clicks decline, use a PerformanceObserver (entryType: 'resource') to assert that no requests to doubleclick.net, google-analytics.com, or googletagmanager.com appear in the resource timing buffer. Log violations to your own first-party endpoint. This is the behavioral verification layer required by GDPR Article 5(2) accountability.
10. DOCUMENT the lawful basis decision in a Data Processing Record: for each vendor (Google/GTM, GA4, Plausible), record the lawful basis, the consent mechanism, and the technical enforcement method. This record is required under GDPR Article 30 and is the accountability artifact that demonstrates compliance.


**Effort:** medium



---


#### 20 touch targets below 48×48px minimum — mobile navigation, CTA, and footer elements affected

Twenty interactive elements fail the WCAG 2.5.8 minimum touch target size of 48×48 CSS pixels. The most critical failures include: (1) The mobile menu hamburger button at 40×40px — a primary navigation control. (2) Navigation links with heights of only 24px (The Get Right, Insights, Proof, About). (3) The 'Talk to a Founder' CTA at 345×40px — the primary conversion action. (4) Social/external links at 44×44px (close but below threshold). (5) The 'WKTW' logo link at 66×28px. Undersized touch targets cause mis-taps on mobile, leading to navigation frustration and increased bounce rates. The 'Talk to a Founder' CTA being undersized is particularly impactful as it is the primary conversion mechanism.



**Category:** accessibility


**Compliance:** wcag




**Fix:** Establish a global minimum 48×48 CSS pixel interactive bounding box for all touch targets site-wide by introducing a design-system-level CSS layer that enforces minimum tap dimensions on every interactive element category (buttons, links in navigation/footer, icon links), scoped to avoid inflating inline body text links or disrupting existing visual design.

**How:** 1. Create a new CSS file (e.g., `touch-target-floors.css`) loaded after the main stylesheet but before any component overrides. This file establishes minimum interactive sizing via `min-height`, `min-width`, and padding adjustments — never overriding explicit visual dimensions, only enforcing floors.

2. Define six scoped rulesets targeting the exact component categories identified:
   (a) Hamburger button: target by its existing selector within the header (e.g., `header button[aria-label]` or the specific class). Set `min-width: 48px; min-height: 48px;`. Also fix the empty accessible name by adding `aria-label="Open menu"` in the HTML template.
   (b) Navigation links: target `nav a` scoped within the site header/footer. Apply `min-height: 48px; display: inline-flex; align-items: center;` and add vertical padding to reach the 48px floor without changing font size.
   (c) Primary CTA ('Talk to a Founder'): target by its specific class or `header a[href]` with the CTA class. Override `min-height: 48px;` — the button already has horizontal padding, only the height is deficient.
   (d) Footer links: target `footer a`. Apply `min-height: 48px; display: inline-flex; align-items: center; padding-block: 12px;` to expand from ~17px to 48px.
   (e) Social/icon links: target by their container class or `footer a[href*="linkedin"], footer a[href*="twitter"]` etc. Set `min-width: 48px; min-height: 48px; display: inline-flex; align-items: center; justify-content: center;`.
   (f) Logo link: target the header logo anchor. Set `min-height: 48px; display: inline-flex; align-items: center;` — width is already adequate at 66px.

3. Scope containment: add `:not(article a):not(main p a):not(.prose a)` to the broad `a` rules to prevent inline body text links from gaining block-level sizing. This ensures only structural/navigational links are affected.

4. Add spacing guard: where adjacent touch targets exist (e.g., footer link lists, nav items), ensure at least 8px gap between targets using `gap` on the parent flex/grid container, preventing overlapping tap zones.

5. Test on iOS Safari (oldest supported), Chrome Android, and desktop browsers. Verify no layout shift (these are min-height additions, not height overrides — existing elements taller than 48px are unaffected).

6. Fix the hamburger button's missing accessible name in the HTML template (not CSS-solvable).


**Effort:** quick_win



---


#### Cookie consent banner — Accept/Decline button visual parity requires verification for dark pattern compliance

The consent banner contains two buttons: #consent-accept and #consent-decline, both with the class 'px-4 py-2'. While both buttons exist and appear functional, the presence of a consent mechanism with accept/decline buttons requires verification that the 'Decline' button is equally prominent. The banner structure (footer-positioned button with class 'text-secondary-text text-sm' as a separate element) suggests a multi-element consent UI. The class naming convention 'text-secondary-text' on the banner toggle vs the accept/decline buttons suggests potential visual de-emphasis of the decline option. Without computed style data confirming equal visual weight (same size, contrast, and prominence), this is flagged as a moderate-confidence dark pattern risk. Additionally, the consent banner's decline button must actually prevent non-essential cookies and tracking — the GA4 collect request firing (even though it was aborted by the test environment) and the GTM container loading suggest tracking infrastructure initializes before or regardless of consent state.



**Category:** privacy_cookies


**Compliance:** gdpr




**Fix:** Replace the cosmetic consent banner with a consent-gated script loading pipeline: (1) enforce visual parity between Accept and Decline buttons so neither is visually dominant, (2) block all non-essential scripts (GTM, GA4, Plausible, Google Fonts) from loading until explicit consent is granted, (3) persist consent state across sessions, and (4) provide a mechanism to revoke consent post-acceptance.

**How:** 1. **Create a consent gate module** (`consent-gate.js`) that runs as the FIRST inline script in `<head>`. This module exposes a global `ConsentGate` object that all other scripts check before executing. It reads consent state from a first-party cookie (`consent_state`) and exposes `ConsentGate.hasConsented()`, `ConsentGate.hasDeclined()`, and `ConsentGate.isPending()`.

2. **Convert all tracking/analytics script tags to inert templates.** Replace `<script src="https://www.googletagmanager.com/gtm.js?id=...">` and similar with `<template data-consent-required="analytics">` wrappers. The consent gate module activates these templates ONLY after `ConsentGate.hasConsented()` returns true. This is the architectural fix: scripts physically cannot load before consent because they are not script elements until promoted.

3. **Replace Google Fonts `<link>` with a consent-gated loader.** Google Fonts requests transmit IP addresses to Google servers (personal data under GDPR). Move the font URL into a `data-consent-font` attribute on a `<link rel="preconnect">` placeholder. The consent gate promotes this to an active stylesheet link only after consent. Provide a local fallback font stack that loads immediately via `@font-face` with `font-display: swap` so typography is never broken regardless of consent state.

4. **Restyle the consent banner for visual parity.** Both Accept and Decline buttons must have identical dimensions, font weight, font size, border radius, and padding. The ONLY permitted difference is hue (e.g., green Accept / neutral-gray Decline), and both must meet WCAG AA contrast (4.5:1 against the banner background). Neither button may be a ghost/outline/text-only style while the other is filled. Apply styles via a dedicated `consent-banner.css` scoped under a `.consent-banner` parent class — never bare element selectors.

5. **Wire button handlers through the consent gate.** Accept sets `consent_state=granted` cookie (SameSite=Lax, Secure, 365-day expiry, HttpOnly=false since JS must read it), then calls `ConsentGate.activate()` which promotes all `<template data-consent-required>` elements to live `<script>` tags serially (not in parallel — prevents race conditions in GTM/GA4 initialization order). Decline sets `consent_state=denied` cookie with identical attributes, dismisses the banner, and loads nothing.

6. **Persist and respect consent across navigations.** On every page load, `consent-gate.js` reads the `consent_state` cookie BEFORE any other script. If `granted`, it immediately promotes templates (no banner shown). If `denied`, it loads nothing and shows no banner. If absent (new visitor), it shows the banner and blocks all gated scripts.

7. **Add a consent revocation mechanism.** Add a 'Cookie Settings' link in the site footer (visible on all pages). Clicking it re-displays the consent banner and, if the user switches from Accept to Decline, sets `consent_state=denied`, then reloads the page (which will now skip all tracking scripts since the gate reads `denied` on load). This avoids the impossible task of 'unloading' already-executed scripts.

8. **Google Consent Mode v2 integration.** Even with the template-gating approach, configure Consent Mode defaults to `denied` for `analytics_storage` and `ad_storage` in the inline consent gate script. When consent is granted, update these to `granted` BEFORE promoting the GTM template. This provides defense-in-depth: even if a script somehow loads before the gate (e.g., a future developer adds a script tag manually), Consent Mode restricts cookie writes.


**Effort:** medium



---






### Medium (3)


#### Insufficient contrast ratio [WCAG]

3 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at div > a:nth-of-type(5).


**Pages affected:** 9


**Category:** accessibility


**Compliance:** wcag




✓ **Standard remediation (vetted)** — invariant best-practice fix applied from a verified template (no AI generation).


**Fix:** Replace every failing foreground colour with a WCAG AA–compliant equivalent computed from the measured foreground/background pair. All replacement values are arithmetically derived — no design judgment is required.

**How:** For each failing element, replace the CSS ``color`` value with the compliant colour listed below. Each replacement was computed by scaling lightness toward black or white until the WCAG 2.1 relative-luminance contrast ratio reaches ≥4.5:1 (normal text) or ≥3.0:1 (large text ≥18pt / 14pt bold).

Computed replacements (apply to your child theme's style.css or Additional CSS panel):

  - #2C211D → #8B8A89 (4.54:1 on background #2C211D)
  - #2C211D → #8B8A89 (4.54:1 on background #2C211D)
  - #2C211D → #969594 (4.51:1 on background #382C27)

Target each failing element with its CSS selector. Scope overrides to a child theme to survive parent-theme updates.


**Effort:** quick_win



---


#### Color as sole indicator [WCAG]

10 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).


**Pages affected:** 9


**Category:** accessibility


**Compliance:** wcag




✓ **Standard remediation (vetted)** — invariant best-practice fix applied from a verified template (no AI generation).


**Fix:** Restore visible underlines on all inline text links site-wide via a scoped child-theme CSS override, ensuring links within body content, navigation, footers, and widgets are distinguishable by more than color alone — satisfying WCAG 2.1 SC 1.4.1 (Use of Color).

Affected selectors captured by the detector (2 element(s)):
  - li > a:nth-of-type(1)
  - p > a:nth-of-type(1)

**How:** 1. Create a child theme if one does not already exist.
2. In the child theme's style.css, add a scoped rule targeting anchor elements within content regions:

   .entry-content a, .widget a, .site-footer a, .comment-body a {
     text-decoration: underline;
     text-decoration-thickness: 1px;
     text-underline-offset: 0.2em;
   }

3. Exclude intentionally un-underlined UI elements (navigation menus, buttons, card links) via :not() selectors to avoid visual regression.
4. Confirm hover/focus states also retain the underline (or use an alternate non-colour cue such as a dotted underline).
5. Deploy via Customizer Additional CSS for immediate testing, then commit to the child theme for persistence across updates.
6. Validate: inspect any <a> inside a <p> and confirm computed text-decoration resolves to underline.


**Effort:** quick_win



---


#### Missing recommended security headers

Missing recommended security headers: Content-Security-Policy (mitigates XSS / data injection); X-Frame-Options (clickjacking protection); X-Content-Type-Options (MIME-sniffing protection); Referrer-Policy (limits referrer information leakage).


**Pages affected:** 9


**Category:** security_headers





**Fix:** Deploy a two-layer security header configuration: (1) static headers for all non-CSP directives via netlify.toml, and (2) a nonce-based Content-Security-Policy injected per-request via a Netlify Edge Function. The Edge Function generates a cryptographically unique nonce per response, rewrites matching <script> tags in the HTML to carry that nonce, and emits the CSP header referencing it — making GTM's dynamically versioned scripts compliant without SRI.

**How:** 1. Add netlify.toml [[headers]] block for all non-CSP headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS). These are static and safe to serve from CDN edge without per-request logic.
2. Create netlify/edge-functions/csp-nonce.ts. This function: (a) generates a 128-bit cryptographically random nonce via crypto.getRandomValues(), (b) fetches the origin response, (c) rewrites the response body using a streaming TextDecoder/TextEncoder pass to inject nonce='<value>' onto every <script> tag that currently lacks a nonce attribute, (d) sets the Content-Security-Policy response header referencing that nonce.
3. Wire the Edge Function to all routes in netlify.toml [[edge_functions]] with path = '/*'.
4. Audit the CSP script-src directive: include 'nonce-<value>' plus 'strict-dynamic' (which allows GTM's dynamically created child scripts to inherit trust without needing their own nonce), plus https: as a fallback for browsers that do not support strict-dynamic. Do NOT include 'unsafe-inline' — it silently voids nonce protection in browsers that support CSP Level 2+.
5. Set CSP to report-only mode (Content-Security-Policy-Report-Only) for the first deployment cycle. Point report-uri to a free endpoint (e.g., report-uri.com or a Netlify Function echo endpoint) to capture violations before enforcing.
6. After one full traffic cycle with zero unexpected violations, switch to enforced Content-Security-Policy.
7. Verify HSTS preload eligibility at hstspreload.org after confirming the header is live. Submit only after confirming all subdomains also serve HTTPS — HSTS with includeSubDomains preloads the entire domain tree.
8. Test the nonce injection against GTM's tag-firing flow in a staging deploy: fire a custom HTML tag in GTM preview mode and confirm the injected script receives the nonce and executes without CSP violation.


**Effort:** medium



---






### Low (1)


#### Improper content structure [WCAG]

Heading hierarchy issues: heading level jumps from h2 to h4 (skips a level).


**Pages affected:** 8


**Category:** accessibility


**Compliance:** wcag




**Fix:** Refactor shared Astro components that hardcode <h4> to accept a polymorphic `headingLevel` prop, and add a design-system-level guard that decouples visual heading style from semantic heading rank. Add a skip-to-main-content link and fix the 20 undersized touch targets as part of the same accessibility pass.

**How:** 1. AUDIT: Run `grep -r '<h4' src/components/ src/layouts/` to enumerate every component that hardcodes an h4 element. Cross-reference against the 8 affected page templates to identify which components are shared across all of them. Expect to find 1–3 components (card, feature block, or section sub-item) responsible for the majority of violations.
2. REFACTOR SHARED COMPONENTS: For each offending component, replace the hardcoded `<h4>` with a dynamic element driven by a `headingLevel` prop (type: 2|3|4|5|6, default: 3). The component renders the correct semantic element while the visual style is applied via a CSS class — decoupling rank from appearance. See code example 1.
3. UPDATE ALL CALL SITES: At every location where the refactored component is used inside a section that opens with an h2, pass `headingLevel={3}`. Where the component is used inside an h3 section, pass `headingLevel={4}`. This is a mechanical find-and-replace once the audit in step 1 is complete.
4. ADD DESIGN SYSTEM STYLE ALIASES: Create CSS utility classes `.heading-style-label`, `.heading-style-section`, etc. that apply the visual treatment previously achieved by choosing a lower heading rank. This removes the authoring incentive to reach for h4 for visual reasons. See code example 2.
5. ADD SKIP LINK: Insert a visually-hidden-until-focused skip link as the first child of `<body>` in the root layout file (`src/layouts/Layout.astro` or equivalent). See code example 3.
6. FIX TOUCH TARGETS: Locate the 20 undersized interactive elements (buttons, links, toggles). Apply a minimum 48×48px tap target via padding or the `min-height`/`min-width` approach scoped to the specific component classes identified in the audit. Do not apply globally to `button {}` or `a {}`. See code example 4.
7. AUTHORING GUARD (OPTIONAL BUT RECOMMENDED): Add a dev-only runtime assertion in the component that warns when `headingLevel` is not passed and the component is nested inside a section with a known heading level. This prevents regression as new pages are authored. See code example 5.
8. VALIDATE: After deployment, run `npx axe-cli https://weknowthewhy.com` against all 8 affected URLs and confirm zero WCAG 1.3.1 violations. Verify skip link focus behavior manually in Chrome and VoiceOver/NVDA.


**Effort:** medium



---





## Additional Detected Issues

60 additional issues were detected during the scan. These are listed by severity for awareness — a full Muttr audit provides detailed investigation and fix proposals for each.

| # | Severity | Category | Title |
| :--- | :--- | :--- | :--- |

| 1 | CRITICAL | analytics_tracking | Triple analytics stack (GA4 via GTM + direct GA4 + Plausible) makes KPIs unrelia... |

| 2 | CRITICAL | analytics_tracking | Contact form submission has no client-side event tracking — lead attribution is ... |

| 3 | MEDIUM | accessibility | Missing name/role/value [WCAG] |

| 4 | MEDIUM | accessibility | Heading hierarchy skips h3 level — screen reader navigation broken |

| 5 | MEDIUM | accessibility | Duplicate navigation landmarks and consent buttons lack ARIA labels and verified... |

| 6 | MEDIUM | privacy_cookies | Google Fonts loaded from external CDN — privacy implications and variable font o... |

| 7 | MEDIUM | accessibility | Multiple <nav> elements missing distinguishing aria-label attributes — screen re... |

| 8 | MEDIUM | accessibility | Form input missing programmatic label — likely honeypot field requires proper AR... |

| 9 | HIGH | resource_loading | Redundant dual analytics stack (Plausible + GA4/GTM) — excessive overhead and at... |

| 10 | HIGH | server_transport | SRI infeasible for GTM/GA4 scripts — nonce-based CSP is the appropriate mitigati... |

| 11 | HIGH | mobile_ux | Hamburger menu button has empty accessible name and 40x40px touch target — below... |

| 12 | HIGH | mobile_ux | Primary conversion CTA 'Talk to a Founder' is 40px tall — below 48px touch targe... |

| 13 | HIGH | api_network | Triple analytics stack (GTM + standalone GA4 gtag.js + Plausible) constitutes 73... |

| 14 | HIGH | mobile_ux | Mobile navigation links render at 24px height — repeated tap failures likely on ... |

| 15 | HIGH | conversion_paths | Pages lack trust signals — no social proof, testimonials, case studies, or credi... |

| 16 | MEDIUM | seo_metadata | Open Graph, Twitter Card, and meta description completeness unverifiable — meta ... |

| 17 | MEDIUM | seo_metadata | Unknown or unverifiable structured data schema type — raw JSON-LD not available ... |

| 18 | MEDIUM | resource_loading | Google Fonts stylesheet is render-blocking — external CSS without async/preload ... |

| 19 | MEDIUM | analytics_tracking | GA4 collect request aborted (ERR_ABORTED) — analytics data integrity compromised... |

| 20 | MEDIUM | javascript_third_party | 465KB unused JavaScript out of 2.5MB parsed — 18.5% unused rate is acceptable bu... |

| 21 | MEDIUM | conversion_paths | Form submit button likely uses generic text — missed conversion optimization opp... |

| 22 | MEDIUM | navigation_ia | Heading hierarchy skips from h1 to h4 — broken document outline for screen reade... |

| 23 | MEDIUM | revenue_optimization | No social proof, testimonials, or credibility signals on key pages |

| 24 | MEDIUM | navigation_ia | Sparse internal linking — only navigational links present, no contextual in-cont... |

| 25 | MEDIUM | server_transport | No CDN cache-status headers on any resource — cache-hit verification impossible |

| 26 | MEDIUM | security_headers | SRI is technically incompatible with GTM/gtag.js — alternative mitigations requi... |

| 27 | MEDIUM | cms_ghost_markup | Mobile menu contains hidden duplicate navigation links in collapsed DOM state |

| 28 | MEDIUM | api_network | GA4 ERR_ABORTED likely caused by Playwright/headless browser blocking — but prod... |

| 29 | MEDIUM | interactive_elements | Consent banner buttons may lack clear visual hierarchy — accept vs decline disti... |

| 30 | MEDIUM | content_quality | No author attribution on BlogPosting — undermines E-E-A-T and content credibilit... |

| 31 | MEDIUM | conversion_paths | Consent banner competes with page CTAs and creates circular UX — appears on priv... |

| 32 | MEDIUM | resource_loading | Three font files totaling 98KB — variable font consolidation and subsetting coul... |

| 33 | LOW | accessibility | prefers-reduced-motion support unverified — no animations detected in CSS metric... |

| 34 | MEDIUM | navigation_ia | No breadcrumb navigation or BreadcrumbList structured data across site pages |

| 35 | MEDIUM | server_transport | HTML cache-control forces revalidation on every request — verify hashed assets h... |

| 36 | MEDIUM | conversion_paths | URL field in contact form adds unnecessary friction on mobile — website is rarel... |

| 37 | MEDIUM | revenue_optimization | No pricing transparency or engagement model clarity |

| 38 | LOW | accessibility | Language declaration correct — <html lang='en'> is valid BCP 47 |

| 39 | MEDIUM | mobile_ux | No tel: or mailto: links detected — mobile users cannot tap-to-call or tap-to-em... |

| 40 | MEDIUM | seo_metadata | Escalation review: Canonical URL trailing-slash mismatch — confirmed SEO issue |

| 41 | LOW | resource_loading | LCP element is a 2KB SVG hero image — excellent but lacks fetchpriority and prel... |

| 42 | LOW | backwards_compatibility | Backwards compatibility — no issues detected; Astro SSG with minimal CSS and JS ... |

| 43 | LOW | server_transport | Server transport healthy — TTFB, HTTP/2, TLS 1.3, compression, and no mixed cont... |

| 44 | LOW | content_quality | [SUBJECTIVE] Above-fold content is sparse — minimal visual anchors and persuasio... |

| 45 | LOW | visual_stability | Visual stability is excellent — CLS 0.000, no shift sources detected |

| 46 | LOW | api_network | Network waterfall is minimal — no API calls, over-fetching, or sequential depend... |

| 47 | LOW | analytics_tracking | Escalation resolution: Open Graph and Twitter Card meta tags — cannot verify, fl... |

| 48 | LOW | content_quality | Content-to-code ratio is excellent — minimal payload for content-rich pages |

| 49 | LOW | analytics_tracking | cache-control: public, max-age=0, must-revalidate — no browser caching of page c... |

| 50 | LOW | mobile_responsive | Body text size and line-height not verifiable from available data — flag for man... |

| 51 | LOW | seo_metadata | Internal link 404 verification not possible without live crawl — no issues infer... |

| 52 | LOW | resource_loading | Team headshot images lack srcset — serving fixed-size images to all viewports |

| 53 | LOW | navigation_ia | No site search functionality detected — navigation relies entirely on menu struc... |

| 54 | LOW | api_network_waterfall | Minimal API/network waterfall — no issues found |

| 55 | LOW | mobile_ux | No horizontal scroll or viewport overflow issues detected on mobile |

| 56 | LOW | revenue_optimization | Legal page lacks any trust signals or contextual cross-sell — missed opportunity... |

| 57 | LOW | inp_interaction | INP within 'Good' threshold — no interaction responsiveness issues detected |

| 58 | LOW | analytics_tracking | No heavy advertising pixels detected — split-pixel strategy not required |

| 59 | LOW | analytics_tracking | Cross-domain tracking configuration unverifiable — potential self-referral if mu... |

| 60 | LOW | navigation_ia | XML sitemap alignment cannot be verified from available data |




## Issues by Page

A per-page breakdown of every issue measured on each URL. Page-specific issues
(e.g. accessibility) list the failing element locators where available.


### https://weknowthewhy.com/ (3)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `div > a:nth-of-type(1)`, `div > div:nth-of-type(1)`, `#consent-accept`


- **[LOW]** Improper content structure [WCAG] — _accessibility_




### https://weknowthewhy.com/about/ (3)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `div > a:nth-of-type(1)`, `#consent-accept`


- **[LOW]** Improper content structure [WCAG] — _accessibility_




### https://weknowthewhy.com/contact/ (4)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `form > button:nth-of-type(1)`, `#consent-accept`


- **[MEDIUM]** Missing name/role/value [WCAG] — _accessibility_

  - Elements: `form > input:nth-of-type(1)`, `#message`


- **[LOW]** Improper content structure [WCAG] — _accessibility_




### https://weknowthewhy.com/insights/why-most-audits-dont-change-anything/ (2)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `p > a:nth-of-type(1)`, `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `div > a:nth-of-type(1)`, `#consent-accept`




### https://weknowthewhy.com/legal/privacy/ (3)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `p > a:nth-of-type(1)`, `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `#consent-accept`


- **[LOW]** Improper content structure [WCAG] — _accessibility_




### https://weknowthewhy.com/legal/terms/ (3)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `p > a:nth-of-type(1)`, `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `#consent-accept`


- **[LOW]** Improper content structure [WCAG] — _accessibility_




### https://weknowthewhy.com/proof/our-site/ (3)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `div > a:nth-of-type(1)`, `#consent-accept`


- **[LOW]** Improper content structure [WCAG] — _accessibility_




### https://weknowthewhy.com/the-get-right/content/ (3)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `div > a:nth-of-type(1)`, `#consent-accept`


- **[LOW]** Improper content structure [WCAG] — _accessibility_




### https://weknowthewhy.com/the-get-right/platform/ (3)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(5)`, `div > a:nth-of-type(1)`, `#consent-accept`


- **[LOW]** Improper content structure [WCAG] — _accessibility_





### Site-wide (20)

These conditions apply to the whole site/server, not a single page.


- **[CRITICAL]** Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure — _privacy_cookies_ (0 page(s))

- **[CRITICAL]** Triple analytics stack (GA4 via GTM + direct GA4 + Plausible) makes KPIs unreliable with no conversion events configured — _analytics_tracking_ (0 page(s))

- **[HIGH]** Cookie consent banner — Accept/Decline button visual parity requires verification for dark pattern compliance — _privacy_cookies_ (0 page(s))

- **[HIGH]** Hamburger menu button has empty accessible name and 40x40px touch target — below WCAG minimum — _mobile_ux_ (0 page(s))

- **[HIGH]** Mobile navigation links render at 24px height — repeated tap failures likely on primary navigation — _mobile_ux_ (0 page(s))

- **[HIGH]** Pre-consent tracking [GDPR] — _privacy_cookies_ (1 page(s))

- **[HIGH]** Redundant dual analytics stack (Plausible + GA4/GTM) — excessive overhead and attribution confusion — _resource_loading_ (0 page(s))

- **[HIGH]** Triple analytics stack (GTM + standalone GA4 gtag.js + Plausible) constitutes 73%+ of total page transfer weight — _api_network_ (0 page(s))

- **[MEDIUM]** 465KB unused JavaScript out of 2.5MB parsed — 18.5% unused rate is acceptable but worth monitoring — _javascript_third_party_ (0 page(s))

- **[MEDIUM]** Consent banner buttons may lack clear visual hierarchy — accept vs decline distinction unclear — _interactive_elements_ (0 page(s))

- **[MEDIUM]** GA4 ERR_ABORTED likely caused by Playwright/headless browser blocking — but production ad-blocker risk is real — _api_network_ (0 page(s))

- **[MEDIUM]** GA4 collect request aborted (ERR_ABORTED) — analytics data integrity compromised, likely ad-blocker in test but real production risk — _analytics_tracking_ (0 page(s))

- **[MEDIUM]** Google Fonts loaded from external CDN — privacy implications and variable font optimization opportunity — _privacy_cookies_ (0 page(s))

- **[MEDIUM]** Google Fonts stylesheet is render-blocking — external CSS without async/preload strategy introduces FOIT/FOUT risk — _resource_loading_ (0 page(s))

- **[MEDIUM]** Missing recommended security headers — _security_headers_ (9 page(s))

- **[LOW]** Backwards compatibility — no issues detected; Astro SSG with minimal CSS and JS provides strong baseline — _backwards_compatibility_ (0 page(s))

- **[LOW]** Cross-domain tracking configuration unverifiable — potential self-referral if multi-domain journey exists — _analytics_tracking_ (0 page(s))

- **[LOW]** No heavy advertising pixels detected — split-pixel strategy not required — _analytics_tracking_ (0 page(s))

- **[LOW]** No site search functionality detected — navigation relies entirely on menu structure — _navigation_ia_ (0 page(s))

- **[LOW]** XML sitemap alignment cannot be verified from available data — _navigation_ia_ (0 page(s))




## Next Steps

This scan identified **68** issues across **https://weknowthewhy.com/**.


A full Muttr audit provides deep investigation of all 68 detected issues, including:
- Cross-tier fix analysis and regression risk assessment
- Compliance remediation roadmap with legal timeline guidance
- Prioritized 30/60/90-day implementation schedule
- Individual implementation tickets for each finding
- Executive presentation deck


---

*Generated by w.k.t.w.*