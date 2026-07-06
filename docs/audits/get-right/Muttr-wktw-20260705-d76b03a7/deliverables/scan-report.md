
# Muttr Scan Report: WKTW

**URL:** https://weknowthewhy.com/
**Scanned:** 2026-07-06 01:59 UTC
**Auditor:** w.k.t.w.

---

## Executive Summary

A comprehensive audit of weknowthewhy.com identified 80 issues across accessibility, security, mobile usability, and analytics, with 8 findings investigated in depth. The most urgent concern is the complete absence of GA4 or equivalent analytics, which leaves WKTW without visibility into traffic sources, user behavior, or conversion performance — making data-driven decisions impossible. High-severity accessibility and mobile usability failures, including undersized touch targets, an unlabeled form field, and a critically small privacy policy link, create friction that will cause mobile visitors and screen reader users to abandon key conversion points. Addressing these findings — particularly the analytics gap and the contact form labeling issue — should be prioritized immediately to protect user experience, legal compliance, and the client's ability to measure business outcomes.

---

## Top Findings

8 issues were fully investigated with actionable fix proposals.





### Critical (1)


#### No GA4 or equivalent full-featured analytics — conversion tracking and enhanced measurement absent

The site uses Plausible Analytics as its sole tracking platform. Plausible is a lightweight, privacy-focused analytics tool that provides pageview counts, referrer data, and basic engagement metrics. However, it does not natively support: GA4-style enhanced measurement (scroll depth, outbound clicks, file downloads, site search, video engagement), custom event tracking for key actions (generate_lead, form submissions, CTA clicks), conversion/goal tracking with value parameters, cross-domain tracking, or integration with advertising platforms. For a site whose stated KPIs include conversion_rate, bounce_rate, and contact_form completions, the absence of event-level tracking means the client cannot measure whether visitors are completing the primary conversion action (contacting via the mailto link or navigating to /contact/), cannot attribute conversions to traffic sources with any granularity beyond referrer domain, and cannot identify funnel drop-off points. Plausible does support custom event goals via its API, but there is no evidence of any custom event configuration on this page. The single external script (plausible.io) loads with async and no data-* attributes indicating goal configuration.



**Category:** analytics_tracking





**Fix:** Implement Plausible custom event tracking for all conversion actions (contact form submission, mailto: clicks, CTA button clicks) and configure a first-party proxy to defeat ad blockers. No new analytics platform needed — leverage the existing Plausible investment.

**How:** 1. Create a reusable Astro component (`src/components/PlausibleAnalytics.astro`) that loads Plausible via a Netlify first-party proxy rewrite instead of the third-party `plausible.io` domain. This defeats ad blockers disproportionately used by the B2B technical audience.
2. Add a Netlify rewrite rule in `netlify.toml` to proxy `/js/script.js` → `https://plausible.io/js/script.js` and `/api/event` → `https://plausible.io/api/event`.
3. Create a shared analytics utility module (`src/lib/analytics.ts`) that wraps `window.plausible()` with null-guards, typed event names, and a queue for events fired before the script loads.
4. Instrument the contact form (`/contact/`) with a `submit` event listener that fires a `Contact Form Submitted` custom event via the utility, gated behind form validation state.
5. Instrument all `mailto:` links site-wide using event delegation on `document.body` for `click` events on `a[href^="mailto:"]`, firing an `Email Link Clicked` custom event with the page path as a property.
6. Instrument primary CTA buttons (identified by a data attribute `data-track-cta`) with click tracking firing a `CTA Clicked` event with the button text and destination URL as properties.
7. Configure goals in the Plausible dashboard (Settings → Goals) for each custom event name: `Contact Form Submitted`, `Email Link Clicked`, `CTA Clicked`.
8. Replace the existing `<script>` tag loading Plausible in the site's base layout with the new `PlausibleAnalytics.astro` component.
9. Add `data-track-cta` attributes to primary CTA buttons across the site (a content change, not a code change — grep for the primary CTA class/pattern and add the attribute).


**Effort:** quick_win



---






### High (3)


#### Touch targets below 48x48px minimum — mobile usability and WCAG 2.5.8 failure

8 touch targets fail the 48x48 CSS pixel minimum (WCAG 2.5.8 Target Size). The most critical failures for the contact_form KPI are the navigation links that users must traverse to reach the contact page, and the mailto links that serve as alternative contact methods. Specific failures: 'Home' link (39x20px — 59% undersized on both axes), 'jon@weknowthewhy.com' mailto (217x21px — height 56% undersized), footer mailto (169x44px — height 8% undersized), 'About' (39x48px — width 19% undersized), 'Proof' (36x48px — width 25% undersized), 'Search' (46x48px — width 4% undersized), 'Terms' (41x48px — width 15% undersized), 'privacy policy' (91x17px — height 65% undersized). The 'privacy policy' link at 17px height is particularly concerning as it's referenced from the consent banner — users attempting to review the privacy policy before consenting face a difficult tap target.



**Category:** accessibility


**Compliance:** wcag




**Fix:** Enforce a 48x48 CSS pixel minimum touch target on all interactive elements site-wide via a global Astro layout style, scoped to avoid breaking desktop pointer UX. Apply targeted overrides in the navigation and footer components where layout compression creates the worst violations.

**How:** 1. Create a new global CSS file `src/styles/touch-targets.css` that uses a media query `(pointer: coarse)` to apply minimum touch target sizing only on touch devices. This avoids inflating desktop layouts where mouse precision makes 48px targets unnecessary. 2. Import this file in the root Astro layout (e.g., `src/layouts/Layout.astro`) so it applies to every page. 3. The global rule sets `min-height: 48px` and `min-width: 48px` on all `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, and `[role="button"]` elements, using `display: inline-flex` and `align-items: center` to vertically center text within the enlarged target without shifting text position. 4. In the navigation component (`src/components/Nav.astro` or equivalent), verify that nav links inherit the global rule. If the nav uses a flex container with `gap`, no additional work is needed for spacing. If links are tightly packed, add `gap: 8px` (or Tailwind `gap-2`) to the nav's flex container to ensure adjacent targets don't overlap. 5. In the footer component (`src/components/Footer.astro` or equivalent), apply the same verification. The privacy policy link at 17px height is the most severe — confirm its parent container does not constrain height via `overflow: hidden`, explicit `height`, or `line-height` compression. Remove any such constraint or override it within `@media (pointer: coarse)`. 6. For inline mailto links in body content, the global rule handles them automatically — `inline-flex` with `min-height: 48px` on `<a>` elements ensures even single-word links meet the target. 7. Test on iOS Safari and Android Chrome using real devices or DevTools device emulation with touch simulation enabled. Verify that (a) all interactive elements measure ≥48x48px in the accessibility tree, (b) adjacent targets have ≥8px spacing, and (c) desktop layout is visually unchanged.


**Effort:** quick_win



---


#### 1 form field missing programmatic label association — screen reader users cannot identify the field

The DOM analysis reports 1 missing label in the contact form. The form has 5 fields (text, text, email, text, textarea) and 3 required fields. One input lacks a programmatic label association (either <label for='id'> or wrapping <label>). The unlabeled input appears at XPath //*[@id='main-content']/section[1]/div[1]/div[1]/form[1]/input[1] — this is the first input in the form. Screen reader users will hear 'edit text' with no field identification, making the form partially unusable for assistive technology users. This is a WCAG 2.1 SC 1.3.1 (Info and Relationships) and SC 4.1.2 (Name, Role, Value) violation. Note: det-wcag-missing-name-role-value already captures the name/role/value aspect — this finding focuses specifically on the form label association and its direct impact on the contact_form KPI.



**Category:** accessibility


**Compliance:** wcag




**Fix:** Ensure the Netlify hidden form-name input is explicitly typed as hidden (type="hidden"), which removes it from the accessibility tree, keyboard tab order, and visual rendering per HTML spec — eliminating the WCAG 4.1.2 and 1.3.1 violation without breaking Netlify form submission.

**How:** 1. Open the Astro component file containing the contact form (likely src/pages/contact.astro or a component imported by it, e.g., src/components/ContactForm.astro).
2. Locate the first <input> inside the <form> element — the one carrying name="form-name".
3. Confirm its current state: if it lacks a type attribute entirely, or has type="text", it defaults to a visible, focusable, unlabeled text input. This is the bug.
4. Set type="hidden" on that input. Do NOT add aria-hidden="true" as a substitute — aria-hidden does not remove an element from tab order, so keyboard users would still focus an invisible unlabeled field.
5. Verify the input's value attribute matches the form's name attribute (Netlify requires this parity for routing).
6. Build locally with `astro build` and confirm the rendered HTML output in dist/ contains <input type="hidden" name="form-name" value="...">.
7. Deploy to Netlify preview, submit a test form, and confirm the submission appears in the Netlify Forms dashboard.
8. Run a screen reader pass (VoiceOver + Safari or NVDA + Firefox) on the contact form: the hidden input must not be announced. Tab through the form: focus must land on the first visible field, not an empty unlabeled input.


**Effort:** quick_win



---


#### Privacy policy link at 17px height is critically undersized — consent context makes this high-impact

The 'privacy policy' link measures 91×17px — the height is only 35% of the 48px WCAG minimum. This link appears in the consent/footer context where users need to review privacy terms before making consent decisions. On iPhone 14 Pro, a 17px-tall touch target is nearly impossible to tap accurately without multiple attempts. This is the worst touch target violation on the page and it's in a legally significant context — users have a right to review privacy terms, and making that link practically untappable undermines informed consent. While the technical pass already flagged all 6 undersized targets, this specific element warrants individual attention due to its legal and consent context.



**Category:** accessibility


**Compliance:** wcag




**Fix:** Augment the privacy policy link inside the consent banner to meet the WCAG 2.5.8 minimum 48×48 CSS pixel touch target, scoped exclusively to the consent banner component so no other anchor elements on the site are affected.

**How:** 1. Locate the consent banner Astro component (likely `src/components/ConsentBanner.astro` or similar). Identify the privacy policy `<a>` element within it.
2. Add a `data-consent-link` attribute to the privacy policy anchor to create a stable, selector-safe hook that survives text/href changes.
3. In the component's scoped `<style>` block, apply touch-target augmentation to `a[data-consent-link]` using `display: inline-flex; align-items: center; min-height: 48px; min-width: 48px; padding-block: 14px;` — this expands the tap zone from 17px to ≥48px without altering the visual text size or font metrics.
4. Verify the link's visual appearance is unchanged at desktop widths — the padding adds space but the text itself remains the same size and color. On mobile, the larger tap zone is the desired behavioral change.
5. If the consent banner uses Tailwind classes instead of scoped `<style>`, apply equivalent utility classes directly on the element (see code example for both approaches).
6. Test on a real mobile device (or Chrome DevTools device mode with touch simulation) that tapping the privacy policy link succeeds on the first attempt without zooming.
7. This fix is independent of — but complementary to — the consent banner rendering bug fix. Apply it now so that when the banner becomes visible, the link is already compliant.


**Effort:** quick_win



---






### Medium (4)


#### Insufficient contrast ratio [WCAG]

12 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at div > div:nth-of-type(1).


**Pages affected:** 9


**Category:** accessibility


**Compliance:** wcag




✓ **Standard remediation (vetted)** — invariant best-practice fix applied from a verified template (no AI generation).


**Fix:** Replace every failing foreground colour with a WCAG AA–compliant equivalent computed from the measured foreground/background pair. All replacement values are arithmetically derived — no design judgment is required.

**How:** For each failing element, replace the CSS ``color`` value with the compliant colour listed below. Each replacement was computed by scaling lightness toward black or white until the WCAG 2.1 relative-luminance contrast ratio reaches ≥4.5:1 (normal text) or ≥3.0:1 (large text ≥18pt / 14pt bold).

Computed replacements (apply to your child theme's style.css or Additional CSS panel):

  - #241B17 → #807F7F (4.50:1 on background #1D1512)
  - #4A3D37 → #888381 (4.51:1 on background #241B17)
  - #241B17 → #807F7F (4.50:1 on background #1D1512)
  - #241B17 → #858483 (4.52:1 on background #241B17)

Target each failing element with its CSS selector. Scope overrides to a child theme to survive parent-theme updates.


**Effort:** quick_win



---


#### Color as sole indicator [WCAG]

12 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).


**Pages affected:** 9


**Category:** accessibility


**Compliance:** wcag




✓ **Standard remediation (vetted)** — invariant best-practice fix applied from a verified template (no AI generation).


**Fix:** Restore visible underlines on all inline text links site-wide via a scoped child-theme CSS override, ensuring links within body content, navigation, footers, and widgets are distinguishable by more than color alone — satisfying WCAG 2.1 SC 1.4.1 (Use of Color).

Affected selectors captured by the detector (1 element(s)):
  - li > a:nth-of-type(1)

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

Missing recommended security headers: Content-Security-Policy (mitigates XSS / data injection).


**Pages affected:** 9


**Category:** security_headers


**Compliance:** gdpr




**Fix:** Add a Content-Security-Policy header to all Netlify responses via netlify.toml. Because 7 inline scripts prevent a strict nonce-free policy, deploy a two-phase approach: Phase 1 ships 'unsafe-inline' immediately to close the zero-coverage gap; Phase 2 extracts inline scripts to external files and tightens the policy to remove 'unsafe-inline'.

**How:** 1. AUDIT INLINE SCRIPTS: Run `grep -rn '<script>' src/` and `grep -rn '<script>' public/` to enumerate all 7 inline scripts. Classify each as: (a) config/data injection (can become a .js module or Astro component prop), (b) third-party init snippet (must stay inline — candidate for hash), or (c) analytics (Plausible — already external, needs connect-src allowlist).
2. PHASE 1 — DEPLOY PERMISSIVE CSP IMMEDIATELY: Add the [[headers]] block to netlify.toml (see code_examples[0]). This ships a CSP with 'unsafe-inline' in script-src. It is materially better than no CSP: it blocks data: script execution, restricts object-src to 'none' (blocks Flash/plugin injection), restricts base-uri (prevents base tag hijacking), and allowlists only plausible.io as an external script and connect origin. Deploy and verify via `curl -I https://weknowthewhy.com | grep -i content-security-policy`.
3. VERIFY PHASE 1 IN REPORT-ONLY FIRST: Before merging to production, add the header as Content-Security-Policy-Report-Only with a report-uri pointing to a free CSP reporting endpoint (e.g., report-uri.com free tier or a Netlify Function echo endpoint). Run the site for 24–48 hours and inspect violation reports to confirm no legitimate resources are blocked. Then promote to Content-Security-Policy.
4. PHASE 2 — ELIMINATE 'unsafe-inline' (schedule within 30 days): For each inline script classified in step 1: (a) Config/data scripts → move to a .js file in public/ or src/ and import via <script src='...'> or Astro's <script> component tag (Astro automatically bundles and hashes these). (b) Third-party init snippets that cannot be externalized → compute SHA-256 hash with `echo -n '<script>...content...</script>' | openssl dgst -sha256 -binary | base64` and add the hash to script-src (see code_examples[1]). (c) Plausible → already external, no change needed.
5. PHASE 2 CSP DEPLOYMENT: Once all inline scripts are either extracted or hashed, update netlify.toml to the strict policy in code_examples[2], removing 'unsafe-inline' from script-src and replacing with explicit hashes. Re-run report-only validation before promoting.
6. LOCK IN REGRESSION PREVENTION: Add a Netlify build plugin or CI step (see code_examples[3]) that fails the build if any new inline <script> without a nonce or hash is detected in the build output. This prevents future developers from re-introducing inline scripts that silently break the Phase 2 policy.


**Effort:** medium



---


#### Missing name/role/value [WCAG]

2 UI component(s) lack an accessible name, preventing assistive technology from conveying their purpose.


**Pages affected:** 2


**Category:** accessibility


**Compliance:** wcag




**Fix:** Add programmatic accessible names to two unnamed interactive components: (1) the Netlify hidden form-name field on /contact/ — suppress it from the accessibility tree entirely via aria-hidden and tabindex; (2) the shared template interactive element on / (and all pages) — most likely an icon-only navigation toggle or bare SVG anchor — add an explicit accessible name via aria-label or visually-hidden text. Both fixes are scoped to their respective Astro components to prevent regressions elsewhere.

**How:** 1. IDENTIFY THE EXACT ELEMENTS: Run `npx playwright chromium --dump-dom https://weknowthewhy.com/contact/` and `https://weknowthewhy.com/` and grep for: (a) `input[type='hidden'][name='form-name']` on /contact/, (b) any `<button>`, `<a>`, or `[role='button']` containing only an `<svg>` or `<img>` child with no visible text and no aria-label on /. Confirm element identity before editing.
2. FIX 1 — NETLIFY HIDDEN FORM-NAME FIELD (/contact/ only): Locate the Astro component rendering the contact form (likely `src/components/ContactForm.astro` or `src/pages/contact.astro`). The `<input type='hidden' name='form-name'>` must remain in the DOM for Netlify's form detection bot to work — do NOT remove it. Add `aria-hidden='true'` and `tabindex='-1'` to suppress it from the accessibility tree. Hidden inputs are already excluded from tab order by spec, but `aria-hidden='true'` is required to prevent some screen readers from announcing it as an unlabeled field in form mode.
3. FIX 2 — SHARED ICON-ONLY INTERACTIVE ELEMENT (site-wide, likely header): Locate the Astro layout or component rendering the navigation toggle or icon-only link (likely `src/components/Header.astro`, `src/layouts/BaseLayout.astro`, or a `NavToggle.astro` component). For a hamburger/close button: add `aria-label` directly on the `<button>` element. For a bare `<a>` with SVG child: add `aria-label` on the `<a>` and `aria-hidden='true'` on the `<svg>`. For SVGs used as the sole content: add `aria-hidden='true'` to the SVG and provide a visually-hidden `<span>` as the text alternative — this approach is more robust than aria-label alone because it works with translation tools and voice control software.
4. VERIFY NETLIFY FORM DETECTION IS PRESERVED: Netlify's crawler detects forms by scanning static HTML for `data-netlify='true'` (or `netlify` attribute) and `name='form-name'` on the hidden input. The `aria-hidden` and `tabindex` attributes do not affect Netlify's bot — it reads raw HTML attributes, not the accessibility tree. Confirm by running `netlify build` locally and checking the deploy log for 'Form detected'.
5. AUDIT REMAINING TOUCH TARGETS: The 8 undersized touch targets (numeric_context) share the same root cause — interactive elements built without accessibility review. After fixing the named components, run an axe-core scan (`npx axe https://weknowthewhy.com/ --tags wcag2a,wcag2aa`) to surface any remaining 4.1.2 violations and confirm the two target elements are resolved.
6. REGRESSION TEST: Use axe-playwright or axe-core in a Vitest/Playwright test to assert zero 4.1.2 violations on / and /contact/ as part of CI. This prevents the pattern from re-emerging on future template edits.


**Effort:** quick_win



---








## Additional Detected Issues

72 additional issues were detected during the scan. These are listed by severity for awareness — a full Muttr audit provides detailed investigation and fix proposals for each.

| # | Severity | Category | Title |
| :--- | :--- | :--- | :--- |

| 1 | MEDIUM | privacy_cookies | Consent banner not rendered despite consent infrastructure present in DOM |

| 2 | MEDIUM | privacy_cookies | Plausible analytics script loads before consent interaction — potential pre-cons... |

| 3 | HIGH | conversion_paths | No contact form on page — conversion requires full navigation to /contact/ |

| 4 | HIGH | server_transport | Escalation review: CSP confirmed absent — prescan-2-1 upheld |

| 5 | HIGH | mobile_responsive | Multiple undersized touch targets below 48×48px WCAG minimum — navigation and fo... |

| 6 | HIGH | security_headers | Escalation Resolution: CSP Absence Confirmed with High Confidence |

| 7 | HIGH | ux_conversion | Prescan Review: No Contact Form — Severity Contextually Appropriate |

| 8 | HIGH | revenue_optimization | Article about audit failures does not link to the firm's own audit service page |

| 9 | LOW | accessibility | Improper content structure [WCAG] |

| 10 | MEDIUM | analytics_tracking | All tracking is client-side only — ad blocker and ITP data loss unmitigated, no ... |

| 11 | MEDIUM | analytics_tracking | Consent banner present but analytics not integrated with consent state — users c... |

| 12 | MEDIUM | seo_metadata | Open Graph and Twitter Card meta tag values unverifiable from available scan dat... |

| 13 | MEDIUM | conversion_paths | Legal pages (Privacy Policy, Terms of Service) lack any conversion path or next-... |

| 14 | MEDIUM | javascript_third_party | JetBrains Mono font loaded (31KB) but likely unused on non-technical page types |

| 15 | MEDIUM | interactive_elements | Footer button with no accessible name or visible label — unclear purpose and pot... |

| 16 | MEDIUM | revenue_optimization | No pricing information, engagement model, or scope indicators — creates inquiry ... |

| 17 | MEDIUM | conversion_paths | Primary CTA 'Let's talk' positioned below fold — requires scroll commitment on m... |

| 18 | MEDIUM | resource_loading | Contact form has 1 field missing a programmatic label — accessibility and conver... |

| 19 | MEDIUM | seo_metadata | Escalation review: Internal link HTTP status — requires live crawl |

| 20 | MEDIUM | seo_metadata | BlogPosting JSON-LD required properties not verifiable — image property likely m... |

| 21 | MEDIUM | trust_credibility | Zero social proof elements on key conversion pages — trust deficit at point of c... |

| 22 | MEDIUM | server_transport | Cache-Control forces revalidation on every request — static assets not leveragin... |

| 23 | MEDIUM | seo_metadata | Escalation review: JSON-LD schema validation — unknown type and unresolvable pro... |

| 24 | MEDIUM | conversion_paths | Form error handling and data preservation on failure unverifiable — high-risk ga... |

| 25 | MEDIUM | conversion_paths | Primary CTA competes with navigation links and lacks urgency or value propositio... |

| 26 | MEDIUM | dom_quality | JS runtime console errors unverifiable without live browser execution logs |

| 27 | MEDIUM | revenue_optimization | No social proof, testimonials, or client logos on homepage or About page — trust... |

| 28 | MEDIUM | server_transport | No CDN cache-status headers detected — Netlify edge cache hit/miss ratio unverif... |

| 29 | MEDIUM | resource_loading | JS runtime errors cannot be verified — form submission integrity at risk |

| 30 | MEDIUM | mobile_ux | Consent banner with 3 interactive elements may consume significant viewport on 6... |

| 31 | LOW | accessibility | No images or forms on page — alt text and form label audits not applicable |

| 32 | LOW | accessibility | All images have alt text and dimensions — PASS |

| 33 | LOW | accessibility | HTML lang attribute correctly set to 'en' — PASS |

| 34 | LOW | accessibility | Escalation review: Skip-link anchor truncation is likely a data collection artif... |

| 35 | LOW | accessibility | Navigation fully present in raw HTML — no JS-dependent navigation — PASS |

| 36 | LOW | privacy_cookies | No Cookie Consent Mechanism Detected — But No Pre-Consent Tracking Either |

| 37 | LOW | accessibility | Heading hierarchy correct — single h1, no skipped levels — PASS |

| 38 | LOW | accessibility | All fonts use font-display: swap — no FOIT risk, FOUT acceptable for this site t... |

| 39 | LOW | mobile_ux | JetBrains Mono font loaded unnecessarily on non-technical pages — unused weight |

| 40 | LOW | cms_ghost_markup | Consent banner button visibility state requires verification — may be hidden bef... |

| 41 | LOW | server_transport | No redirect chains or mixed content detected — PASS |

| 42 | LOW | backwards_compatibility | Astro static HTML with minimal JS — strong backwards compatibility posture |

| 43 | LOW | navigation_ia | Search link present but functionality unclear — verify search implementation |

| 44 | LOW | navigation_ia | Long-form legal content lacks visible navigation aids — no table of contents, se... |

| 45 | LOW | inp_interaction | INP performance excellent at 24ms — well within 'Good' threshold — PASS |

| 46 | LOW | inp_interaction | Minimal hydration risk — 100% content in raw HTML, 0 JS-injected elements |

| 47 | LOW | cms_ghost_markup | No duplicate landmark or ID issues detected — clean DOM structure |

| 48 | LOW | resource_loading | Font loading well-configured — preloads correct, font-display: swap, self-hosted... |

| 49 | LOW | resource_loading | LCP not measured — likely text-based LCP with sub-second timing |

| 50 | LOW | resource_loading | Single 7KB stylesheet — no render-blocking or critical CSS concerns |

| 51 | LOW | api_network | Minimal network waterfall — 6 requests, no API calls, no sequential dependencies... |

| 52 | LOW | javascript_third_party | JavaScript payload minimal — 29KB total, single async external script — PASS |

| 53 | LOW | javascript_third_party | Single third-party script (Plausible Analytics) — minimal third-party footprint |

| 54 | LOW | mobile_responsive | Email contact link present but no tel: link for mobile users who prefer calling |

| 55 | LOW | visual_stability | CLS at 0.000 — no layout shifts detected — PASS |

| 56 | LOW | visual_stability | content-visibility: auto not applicable — small DOM with negligible rendering co... |

| 57 | LOW | dom_quality | DOM is lean and well-structured — ~142-146 elements, semantic HTML — PASS |

| 58 | LOW | content_quality | [SUBJECTIVE] CSS Payload Dominates Transfer — 106KB CSS vs ~3KB Content |

| 59 | LOW | content_quality | Above-fold content is text-only — strong for performance, verify visual engageme... |

| 60 | LOW | server_transport | Gzip compression active but Brotli not detected — missed compression optimizatio... |

| 61 | LOW | server_transport | Missing dns-prefetch/preconnect for plausible.io — minor latency optimization |

| 62 | LOW | server_transport | TTFB excellent at 121ms — no server-side bottleneck |

| 63 | LOW | server_transport | HTTP/2 with TLS 1.3 and AES-128-GCM — Transport Layer Optimal |

| 64 | LOW | inp_interaction | No forms on page — serial queue integrity and double-submission prevention not a... |

| 65 | LOW | interactive_elements | No hover-dependent functionality or dead zones detected — PASS for mobile |

| 66 | LOW | mobile_responsive | Mobile viewport correctly configured — no horizontal scroll issues — PASS |

| 67 | LOW | navigation_ia | Navigation depth acceptable — key pages within 1-2 clicks — PASS |

| 68 | LOW | resource_loading | No srcset/sizes on team headshot images — single resolution served to all viewpo... |

| 69 | LOW | resource_loading | Font files reasonably sized — subsetting appears applied |

| 70 | LOW | cms_ghost_markup | No orphaned CSS detected — 100% CSS coverage, no unused stylesheets |

| 71 | LOW | resource_loading | INP at 24ms — excellent interaction responsiveness — PASS |

| 72 | LOW | dom_quality | Zero JS-injected DOM elements — raw and rendered DOM identical — PASS |




## Issues by Page

A per-page breakdown of every issue measured on each URL. Page-specific issues
(e.g. accessibility) list the failing element locators where available.


### https://weknowthewhy.com (3)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `h1 > span:nth-of-type(1)`, `div > a:nth-of-type(1)`, `div > div:nth-of-type(1)`, `#consent-accept`


- **[MEDIUM]** Missing name/role/value [WCAG] — _accessibility_

  - Elements: `div > svg:nth-of-type(1)`




### https://weknowthewhy.com/about (2)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `li > span:nth-of-type(1)`, `div > a:nth-of-type(1)`, `#consent-accept`




### https://weknowthewhy.com/contact (4)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `li > span:nth-of-type(1)`, `form > button:nth-of-type(1)`, `#consent-accept`


- **[MEDIUM]** Missing name/role/value [WCAG] — _accessibility_

  - Elements: `form > input:nth-of-type(1)`, `#message`


- **[LOW]** Improper content structure [WCAG] — _accessibility_




### https://weknowthewhy.com/insights/why-most-audits-dont-change-anything (2)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `li > span:nth-of-type(1)`, `div > a:nth-of-type(1)`, `#consent-accept`




### https://weknowthewhy.com/legal/privacy (2)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `li > span:nth-of-type(1)`




### https://weknowthewhy.com/legal/terms (2)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `li > span:nth-of-type(1)`




### https://weknowthewhy.com/proof/our-site (2)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `li > span:nth-of-type(1)`, `div > a:nth-of-type(1)`, `#consent-accept`




### https://weknowthewhy.com/the-get-right/content (2)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `li > span:nth-of-type(1)`, `div > a:nth-of-type(1)`, `#consent-accept`




### https://weknowthewhy.com/the-get-right/platform (2)


- **[MEDIUM]** Color as sole indicator [WCAG] — _accessibility_

  - Elements: `li > a:nth-of-type(1)`


- **[MEDIUM]** Insufficient contrast ratio [WCAG] — _accessibility_

  - Elements: `div > a:nth-of-type(6)`, `li > span:nth-of-type(1)`, `div > a:nth-of-type(1)`, `#consent-accept`





### Site-wide (17)

These conditions apply to the whole site/server, not a single page.


- **[CRITICAL]** No GA4 or equivalent full-featured analytics — conversion tracking and enhanced measurement absent — _analytics_tracking_ (0 page(s))

- **[MEDIUM]** All tracking is client-side only — ad blocker and ITP data loss unmitigated, no server-side fallback — _analytics_tracking_ (0 page(s))

- **[MEDIUM]** Consent banner not rendered despite consent infrastructure present in DOM — _privacy_cookies_ (0 page(s))

- **[MEDIUM]** Consent banner present but analytics not integrated with consent state — users cannot grant meaningful consent — _analytics_tracking_ (0 page(s))

- **[MEDIUM]** JS runtime console errors unverifiable without live browser execution logs — _dom_quality_ (0 page(s))

- **[MEDIUM]** JS runtime errors cannot be verified — form submission integrity at risk — _resource_loading_ (0 page(s))

- **[MEDIUM]** Missing recommended security headers — _security_headers_ (9 page(s))

- **[MEDIUM]** Plausible analytics script loads before consent interaction — potential pre-consent tracking — _privacy_cookies_ (0 page(s))

- **[LOW]** Astro static HTML with minimal JS — strong backwards compatibility posture — _backwards_compatibility_ (0 page(s))

- **[LOW]** JavaScript payload minimal — 29KB total, single async external script — PASS — _javascript_third_party_ (0 page(s))

- **[LOW]** JetBrains Mono font loaded unnecessarily on non-technical pages — unused weight — _mobile_ux_ (0 page(s))

- **[LOW]** No Cookie Consent Mechanism Detected — But No Pre-Consent Tracking Either — _privacy_cookies_ (0 page(s))

- **[LOW]** No orphaned CSS detected — 100% CSS coverage, no unused stylesheets — _cms_ghost_markup_ (0 page(s))

- **[LOW]** Single 7KB stylesheet — no render-blocking or critical CSS concerns — _resource_loading_ (0 page(s))

- **[LOW]** Single third-party script (Plausible Analytics) — minimal third-party footprint — _javascript_third_party_ (0 page(s))

- **[LOW]** Zero JS-injected DOM elements — raw and rendered DOM identical — PASS — _dom_quality_ (0 page(s))

- **[LOW]** [SUBJECTIVE] CSS Payload Dominates Transfer — 106KB CSS vs ~3KB Content — _content_quality_ (0 page(s))




## Next Steps

This scan identified **80** issues across **https://weknowthewhy.com/**.


A full Muttr audit provides deep investigation of all 80 detected issues, including:
- Cross-tier fix analysis and regression risk assessment
- Compliance remediation roadmap with legal timeline guidance
- Prioritized 30/60/90-day implementation schedule
- Individual implementation tickets for each finding
- Executive presentation deck


---

*Generated by w.k.t.w.*