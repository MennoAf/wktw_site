## Quick Wins MVP

The following fixes deliver the highest impact for the least effort — start here.

### 1. Triple analytics stack (GTM + standalone GA4 gtag.js + Plausible) constitutes 73%+ of total page transfer weight

- **Effort:** Quick Win
- **Cost:** Low
- **Severity:** High
- **Expected impact:** Removing standalone gtag.js eliminates ~159KB of JavaScript transfer. Combined with resolving the duplicate GTM snippet (if confirmed), total analytics payload drops from ~290KB to ~131KB (GTM only) or ~136KB (GTM + Plausible). This is a 45-55% reduction in analytics JavaScript weight.

### 2. No heavy advertising pixels detected — split-pixel strategy not required

- **Effort:** Quick Win
- **Cost:** Low
- **Severity:** Low
- **Expected impact:** Removing the standalone gtag.js eliminates one render-blocking or async-competing script request to googletagmanager.com on every page load. Removing GTM entirely eliminates the GTM container fetch (~100KB+ depending on container size) and its associated DNS lookup, TLS handshake, and script parse/execute cycle. The combined reduction in third-party script overhead directly reduces main thread blocking time during page load, which improves Time to Interactive and INP baseline.

### 3. No tel: or mailto: links detected — mobile users cannot tap-to-call or tap-to-email

- **Effort:** Quick Win
- **Cost:** Low
- **Severity:** Medium
- **Expected impact:** High-intent visitors who have decided to act but prefer phone or email over form submission currently have no path to conversion — they must either complete the form or leave. Adding tel: and mailto: links removes this forced-funnel constraint, capturing leads at peak intent without requiring form completion. The mechanism is friction reduction at the decision moment, not persuasion.

### 4. cache-control: public, max-age=0, must-revalidate — no browser caching of page content

- **Effort:** Quick Win
- **Cost:** Low
- **Severity:** Low
- **Expected impact:** On every repeat page navigation, the browser currently issues a conditional GET (If-None-Match or If-Modified-Since) for every /_astro/* asset before it can render. The server responds 304 Not Modified — the asset bytes are never retransmitted, but the round-trip still occurs. On a mobile network at 80ms RTT with 20 hashed assets, this is 1,600ms of serialized or parallelized revalidation overhead that is entirely eliminated by serving from browser cache. After this fix, repeat visits serve all hashed assets from the local disk cache with zero network round-trips.

### 5. 20 touch targets below 48×48px minimum — mobile navigation, CTA, and footer elements affected

- **Effort:** Quick Win
- **Cost:** Low
- **Severity:** High
- **Expected impact:** Undersized touch targets cause mis-taps, forcing users to retry interactions or accidentally triggering adjacent elements. Expanding all 20+ targets to 48×48px eliminates this friction on the primary mobile navigation, CTA, and footer — the three highest-interaction zones on every page. This directly reduces mobile bounce from navigation frustration and removes friction from the primary conversion action ('Talk to a Founder').

---
Here is the technical roadmap formatted as a client-facing document.

---

# Technical Roadmap: Website Optimization & Enhancement

This roadmap outlines planned initiatives across a 90-day horizon, followed by a backlog of future considerations. Each item is prioritized to deliver the most significant impact on performance, user experience, compliance, and conversion.

## 30-Day Sprint: Immediate Impact & Foundational Fixes

This sprint focuses on critical, high-impact items that address immediate performance bottlenecks, data integrity issues, and core accessibility concerns.

*Sorted by Priority (Highest to Lowest)*

### Analytics & Performance
- **Consolidate to a single analytics architecture: GTM as the sole analytics orchestrator firing one GA4 tag, remove the standalone gtag.js script entirely, and make a deliberate keep-or-kill decision on Plausible. This eliminates ~160KB of redundant JavaScript, fixes double-counted pageviews, and restores GA4 data integrity.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Remove the standalone gtag.js script and consolidate all GA4 tracking exclusively through the existing GTM container. Then evaluate whether GTM itself is justified given zero advertising pixels and zero conversion event instrumentation — if not, replace the entire stack with Plausible-only and remove GTM entirely.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add a netlify.toml [[headers]] block (or _headers file) that applies 'public, max-age=31536000, immutable' exclusively to Astro's content-hashed asset paths (/_astro/*) while leaving the existing HTML document policy ('public, max-age=0, must-revalidate') completely untouched. Simultaneously enable Netlify cache-status response headers on all routes to restore CDN observability.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Eliminate the redundant GA4/GTM stack entirely. Retain Plausible as the sole analytics platform. Configure Plausible custom events to capture the conversion signals (form submissions, CTA clicks) that GA4 was never configured to track anyway. This removes ~290KB of JavaScript, eliminates the double-counting data corruption, and establishes a single source of truth for site analytics.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add tel: and mailto: links at three non-negotiable touchpoints — footer partial (global), /contact page, and service page CTAs — converting plain-text or absent contact information into tappable, trackable links that serve as parallel conversion paths alongside the existing form.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Self-host Inter and Lora font files from the site's own origin/CDN, inline the @font-face CSS into the document <head>, and remove all references to fonts.googleapis.com and fonts.gstatic.com. This eliminates GDPR-violating IP transmission to Google and collapses the four-step serial font discovery waterfall into a single parallel fetch from the origin.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Intercept contact form submission to fire a GA4 generate_lead event via the dataLayer before the full-page navigation to /thanks occurs. Use navigator.sendBeacon via GTM's transport_type to guarantee the hit lands despite the synchronous page unload. Scope the listener to the contact form only — no global form interception.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add a structured conversion terminus block to the About page template — a primary CTA (discovery call or contact), a secondary directional link (services or case studies), and an optional lightweight inline contact form — so that high-intent visitors who finish reading the company narrative and team bios are given a clear, low-friction next step rather than a dead end requiring self-navigation.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add a Netlify _headers file (or netlify.toml [[headers]] rules) that applies Cache-Control: public, max-age=31536000, immutable to all /_astro/* assets, retains must-revalidate on HTML documents, and enables Netlify's CDN-Cache-Control header so edge cache behavior becomes observable. No application code changes required.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Enforce a global 48×48 CSS pixel minimum touch target on all interactive elements at mobile breakpoints, with scoped overrides for the four specific component zones identified: hamburger button, primary nav links, primary CTA, and footer links.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Remove the standalone gtag.js script tag and its window.dataLayer/gtag() initialization from the site's global header. Retain GA4 measurement exclusively through the existing GTM container (GTM-5VQTG6TH), which already contains a GA4 tag configured with the same measurement ID. This eliminates the dual-beacon architecture causing double-counted pageviews in clean environments and ERR_ABORTED in ad-blocker environments — without changing what is measured.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Audit and remediate Open Graph and Twitter Card meta tag quality on utility pages (Contact, About, Terms, Privacy, 404). The crawl confirmed 13 meta tags exist but did not serialize their attribute values, leaving tag presence vs. quality unresolved. The fix has two phases: (1) instrument a diagnostic to enumerate actual tag content, then (2) apply page-specific OG/Twitter Card values to utility pages that currently fall back to generic CMS defaults.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Fix two independent WCAG 4.1.2 (Name, Role, Value) Level A violations on the contact page: (1) remove the honeypot input from the accessibility tree entirely, and (2) add an accessible name to the mobile menu toggle button site-wide. Simultaneously bring the mobile menu button to WCAG 2.5.8 minimum touch target size (48×48px). Both fixes are scoped to their respective components with no changes to surrounding layout or form logic.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Consolidate the triple analytics stack (GTM + standalone gtag.js + redundant runtime) into a single GTM container as the sole analytics entry point, eliminating ~159KB compressed / ~500KB+ parsed of redundant standalone gtag.js and reducing total parsed JavaScript from ~2.5MB to ~1.5MB. Configure the single GTM container with actual conversion events instead of double-counted pageviews.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical

### Accessibility & Usability
- **Establish a global minimum 48×48 CSS pixel interactive bounding box for all touch targets site-wide by introducing a design-system-level CSS layer that enforces minimum tap dimensions on every interactive element category (buttons, links in navigation/footer, icon links), scoped to avoid inflating inline body text links or disrupting existing visual design.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Apply the complete honeypot accessibility hiding pattern to the unlabeled input at the start of the contact form: make it invisible to assistive technology (aria-hidden, tabindex=-1), prevent autofill from poisoning it (autocomplete='off'), and add a visually-hidden label as a fallback safety net. This prevents screen reader confusion, keyboard trap, and legitimate submission rejection from autofill triggering the honeypot.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Codify the structural conditions producing CLS 0.000 into enforceable extension guardrails — CSS custom properties, a layout contract mixin, and a CI lint rule — so that adding images, dynamic content, or additional fonts to this template cannot silently degrade CLS without a build-time failure.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Replace every failing foreground colour with a WCAG AA–compliant equivalent computed from the measured foreground/background pair. All replacement values are arithmetically derived — no design judgment is required.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Restore visible underlines on all inline text links site-wide via a scoped child-theme CSS override, ensuring links within body content, navigation, footers, and widgets are distinguishable by more than color alone — satisfying WCAG 2.1 SC 1.4.1 (Use of Color).**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add a progressive social sharing component to the article template that: (1) surfaces a native Web Share API trigger on mobile, (2) renders platform-specific share buttons (LinkedIn, X/Twitter, copy-link) on desktop, (3) includes an inline mid-article 'share this insight' prompt at a natural reading pause point, and (4) is built to be inert until og:image is resolved — so the component and the metadata fix ship as a coordinated distribution upgrade rather than two disconnected patches. The component must be zero-dependency, WCAG AA compliant, keyboard-navigable, and respect prefers-reduced-motion.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add route-awareness to the consent banner so it auto-suppresses on legal/policy pages, eliminating the circular UX where users must consent before reading the policy that informs their consent. On suppressed pages, render a minimal, non-blocking inline notice instead.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Inject a layered JSON-LD structured data block into the 'proof/our-site' page template covering four Schema.org types in priority order: (1) BreadcrumbList — universal applicability, zero content dependency; (2) Organization — entity disambiguation and Knowledge Graph reinforcement for a brand credibility page; (3) AggregateRating / Review — rich result star-rating eligibility if testimonial content is present; (4) FAQPage — SERP vertical real estate expansion if objection-handling Q&A content exists. Each type is implemented as a separate <script type='application/ld+json'> block to allow independent CMS population, independent Google Search Console validation, and surgical removal if content changes make a type inapplicable. No single monolithic schema block — separation prevents one invalid property from invalidating the entire structured data payload.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Inject schema.org/Person JSON-LD structured data blocks for each named team member on the /about page, referencing the parent Organization entity, to make team member rich results eligible in Google SERPs. This is the primary structured data vehicle for a consultancy whose value proposition is built on named individual expertise — it converts organic impressions into trust-qualified clicks by surfacing name, title, image, and social profiles directly in search results.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Align Astro's build output to consistently produce trailing-slash URLs across canonical tags, og:url, sitemap.xml, and internal links — matching Netlify's server-enforced trailing-slash 301 behavior. This eliminates the contradictory canonicalization signal loop between the server (301 → /page/) and the HTML (canonical → /page).**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Replace the generic submit button text ('Submit', 'Send', 'Send Message') on /contact with action-specific copy that mirrors the page's h1 value proposition ('Talk to a founder.'). Confirm the current button text via DOM inspection before any change — this finding is a high-probability hypothesis, not a confirmed defect.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add fetchpriority='high' to the hero SVG <img> tag and a matching <link rel='preload'> in <head>. Separately, instrument a PerformanceObserver to assert the LCP element is identifiable in field conditions, so future asset swaps do not silently regress without detection.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add a _headers file (or netlify.toml [[headers]] rules) that applies Cache-Control: public, max-age=31536000, immutable to all /_astro/* assets, while leaving HTML document caching untouched. This claims the caching benefit that Astro's content-hashing strategy already makes safe but that Netlify's default policy never activates.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Enforce a 48px minimum touch target height on the primary 'Talk to a Founder' CTA in the global navigation, and establish a design-system-level token that prevents any interactive element from rendering below 48px on touch-capable viewports.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Eliminate the dual-DOM navigation pattern by consolidating into a single <nav> element that adapts layout via CSS and manages ARIA state on mobile toggle. If consolidation is blocked by timeline, apply the immediate ARIA remediation as a standalone fix.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add unique aria-label attributes to every <nav> element in the Astro layout and component templates so screen readers can distinguish landmarks. Hide the mobile nav from the accessibility tree when it is visually closed.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Remove the URL field from the contact form entirely. Reduce the form from 6 fields to 5 (or fewer). If company context is operationally required before a founder call, capture it post-submission via an automated follow-up or enrich it from the submitter's email domain using a data enrichment tool — not by taxing the visitor at the point of first contact.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add a Netlify build-time link verification step that issues HEAD requests against the deploy preview URL for all internal link destinations extracted from the built HTML, failing the deploy if any return non-200 responses. This closes the audit coverage gap permanently without requiring a separate crawl tool or post-deploy manual check.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Add an accessible name (aria-label) to the hamburger menu button and increase its touch target to 48x48 CSS pixels minimum. Both fixes target the single header component template, scoped to avoid side effects on other interactive elements.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Preserve the architectural conditions producing 40ms INP on this template. No remediation required. Establish a regression guard so future changes cannot silently degrade this baseline without detection.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical

## 60-Day Sprint: Core Experience & Compliance Enhancements

This sprint focuses on deeper architectural improvements, comprehensive compliance measures, and conversion optimization across key templates.

*Sorted by Priority (Highest to Lowest)*

### Compliance & Analytics
- **Self-host all Google Fonts WOFF2 files on the site's own origin (or first-party CDN), remove every reference to fonts.googleapis.com and fonts.gstatic.com from the document <head>, global stylesheets, and any CMS plugin/theme settings panel. This eliminates the third-party network connection that transmits visitor IP addresses to Google LLC servers in the United States before consent is obtained, resolving the GDPR Article 44 violation established by LG München Case 3 O 17493/20. As a secondary benefit, it removes one full DNS lookup, TCP handshake, and TLS negotiation from the critical rendering path, reducing font-related connection overhead.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Replace all Google Fonts CDN references (fonts.googleapis.com / fonts.gstatic.com) with self-hosted font files served from the site's own origin. This single infrastructure change simultaneously eliminates the GDPR Article 44 third-country transfer exposure (visitor IP transmitted to Google servers before any consent interaction is possible) and removes the third-party DNS lookup, TCP connection, and TLS handshake overhead that the CDN references impose on every page load. No consent banner modification, no conditional loading logic, and no JavaScript intervention can substitute for this fix — the CDN request fires during the browser's initial resource fetch phase, structurally before any JS-based consent mechanism can execute.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Add a full conversion layer to the insight article template: an end-of-article contextual CTA block, an inline newsletter/insight-series signup form, and a related-content recommendation rail. These three components transform the article template from a traffic sink into a qualified-lead pipeline. A fourth component — a content upgrade / lead magnet gate — is specified as a follow-on once a downloadable asset exists. All components are template-level additions; no platform rebuild is required.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Instrument every CTA interaction (click, form submission, anchor navigation) with a unified dataLayer push that simultaneously satisfies GA4 (via GTM), direct gtag(), and Plausible — eliminating the attribution blind spot across all three tools in a single platform-level fix. The solution must be implemented at the reusable component/template layer so every instance of the CTA pattern is covered, not just the page where the gap was detected. The instrumentation must be idempotent (no double-fires on re-render), attribution-safe (preserves session continuity and UTM parameters), and resilient to partial analytics stack failures (one tool failing must not silence the others).**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Consolidate to a single GTM-managed GA4 property with conversion events configured. Remove the standalone gtag.js script entirely. Remove Plausible or retain it deliberately as a privacy-first secondary source (decision required from client). Configure business-meaningful events in GTM for the primary conversion action ('Talk to a Founder' CTA → contact form submission) and supporting engagement signals.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Replace the three fixed <img src> headshot elements in the team/about template with <picture> elements that supply 1x and 2x WebP srcset descriptors, preserving the existing WebP format and file-size discipline while giving the browser a density-negotiation contract.**
  - Effort: quick_win
  - Cost: low
  - Priority: Critical
- **Eliminate the dual-beacon race condition by removing the standalone gtag.js snippet, retaining GTM as the sole GA4 delivery mechanism, adding server-side GTM or first-party proxy routing to survive ad-blockers, and instrumenting conversion events (generate_lead, cta_click, scroll_depth) that the current stack entirely omits. Plausible remains as the ad-blocker-resilient parallel signal.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Eliminate the dual GA4 initialization (standalone gtag.js + GTM-fired GA4 tag), establish GTM as the single authoritative GA4 instance, configure cross-domain linker for all identified third-party destination domains (/thanks redirect target, scheduling tools), and implement conversion events that survive the cross-domain boundary — restoring attribution integrity from first touch through post-form session.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Eliminate Google Fonts dependency entirely. Self-host Inter as a single variable font WOFF2 (weight axis 100–900) and Lora as a subsetted static WOFF2, both scoped to Latin glyphs only. Remove the render-blocking Google Fonts stylesheet and the two preconnect hints. Serve fonts from the site's own origin with immutable cache headers and content-hash filenames. This resolves the GDPR structural liability, eliminates the two-stage serial request chain, and reduces total font payload from 98KB to approximately 25–32KB.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Self-host Google Fonts as variable WOFF2 files with an optimized loading strategy: replace the render-blocking external <link> to fonts.googleapis.com with locally-served, Latin-subset variable font files, an inlined critical @font-face declaration, and font-display: swap. This eliminates the two third-party domain dependencies (fonts.googleapis.com, fonts.gstatic.com), removes the render-blocking external stylesheet, reduces total font file count from 4 to 2, and returns control of the text rendering strategy to the site.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Replace the broken custom consent implementation with a consent-gated script loading architecture where GTM, GA4, Plausible, and Google Fonts are blocked from loading until the user grants explicit consent. Self-host Google Fonts to eliminate the pre-consent IP transmission entirely. Implement a minimal, spec-compliant consent manager that persists state, replays consent decisions, and injects scripts only after affirmative action.**
  - Effort: medium
  - Cost: medium
  - Priority: High
- **Rebuild the /contact page template with a four-component persuasion scaffold — outcome clarity, social proof, value restatement, and trust mechanics — positioned above and adjacent to the existing form. The form itself is not replaced; the template gains a two-column layout that wraps the form in conversion architecture. A new CMS template variant ('contact-conversion') is created so the bare-form template remains available for utility pages and future contact pages inherit the conversion-optimized structure by default.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Eliminate inter-container tag firing conflicts caused by two simultaneous GTM containers by: (1) auditing both containers to produce a canonical tag ownership registry, (2) consolidating all tags into a single authoritative container with documented ownership boundaries, (3) decommissioning the redundant container, and (4) deploying a runtime deduplication guard as a defensive backstop against any future accidental re-introduction of duplicate firing. The fix must also address the compounding gtag.js duplication identified in 'attribution-duplicate-ga4-measurement' — the three-fire scenario (gtag.js + Container A + Container B) must be reduced to a single authoritative fire path per event.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Atomic consent flow remediation addressing three co-located defects in the consent banner as a single compliant unit: (1) add an inline, clearly visible privacy policy link within the banner body text — not in the footer, not post-acceptance; (2) equalize the visual weight of Accept and Decline/Reject buttons — identical size, identical color treatment, identical placement tier, no hierarchy asymmetry; (3) audit and enforce a hard cookie gate ensuring zero non-essential cookies are set prior to affirmative Accept interaction. All three changes must ship in a single deployment. Shipping any subset leaves the compound GDPR Article 7 / Recital 32 violation materially intact and does not constitute a compliant consent flow under ICO or CNIL enforcement standards.**
  - Effort: medium
  - Cost: low
  - Priority: High
- **Replace the cosmetic consent banner with a consent-gated script loading pipeline: (1) enforce visual parity between Accept and Decline buttons so neither is visually dominant, (2) block all non-essential scripts (GTM, GA4, Plausible, Google Fonts) from loading until explicit consent is granted, (3) persist consent state across sessions, and (4) provide a mechanism to revoke consent post-acceptance.**
  - Effort: medium
  - Cost: medium
  - Priority: High
- **Replace SRI (architecturally incompatible with GTM/gtag.js) with a nonce-based Content Security Policy that governs script execution site-wide, eliminate the redundant standalone gtag.js load (already covered by GTM), and apply SRI to the two resources where it is viable: Plausible's versioned script and the Google Fonts