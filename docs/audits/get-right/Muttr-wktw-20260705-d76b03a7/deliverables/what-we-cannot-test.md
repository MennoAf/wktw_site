# What We Cannot Test

*w.k.t.w. — Audit Transparency Statement*

Every automated audit has boundaries. This document describes what our testing methodology cannot cover, so you can make informed decisions about supplementary testing or manual review where needed.

---

## Inherent Limitations of Automated Auditing

These limitations apply to all automated website audits, regardless of tooling.

### 1. Server-Side Logic & Backend Code

This audit examines what the browser sees — HTML, CSS, JavaScript, network responses, and performance metrics. We cannot inspect server-side code (PHP, Python, Node.js, database queries, caching layers, CDN configuration rules) that runs before the page reaches the browser. Some performance or reliability issues may have server-side root causes that we can detect symptoms of but cannot directly diagnose.

### 2. A/B Test & Personalization Variants

Our automated crawler visits each page once as a single anonymous user. If the site serves different content based on A/B testing, user segments, cookies, or behavioral personalization, we only see one variant. Issues that exist exclusively in other variants will not be detected.

### 3. Geographic & Language Routing

The audit runs from a single geographic location. Sites that serve different content, pricing, or features based on visitor location (geo-IP routing, regional CDN rules, localized content) are tested from one region only. Regional-specific issues may not surface.

### 4. Authenticated & Gated Content

Pages behind login walls, paywalls, subscription gates, or age verification are not accessible to our automated crawler. The audit covers only publicly accessible pages. If significant site functionality lives behind authentication, those areas are untested.

### 5. Concurrent Load & Traffic Patterns

Performance measurements are taken during a single-user crawl under normal conditions. We cannot simulate high-traffic scenarios, peak load, or concurrent-user stress. Performance under real-world traffic patterns may differ from what we measure.

### 6. Real User Behavior Patterns

While we simulate basic interactions (hovers, clicks, scrolls), we cannot replicate the full diversity of real user journeys — multi-step funnels, form fills with real data, cart additions, checkout flows, or extended session behavior. Issues that only surface during complex user journeys may not be detected.

### 7. Payment & Transaction Flows

We do not enter payment information, complete purchases, or test transactional flows. Issues with payment gateways, order processing, receipt generation, or post-purchase experiences are outside the scope of automated testing.

### 8. Third-Party Service Internals

We detect third-party scripts, measure their performance impact, and verify their loading behavior. However, we cannot inspect what those services do with the data they collect, whether their server-side configuration is correct, or diagnose issues within their platforms (e.g., Google Analytics property misconfigurations, ad server targeting rules, CRM integration logic).

---

## Audit-Specific Limitations

These limitations are specific to this audit run, based on the site's characteristics or configuration choices.

### 1. Real-User Field Data (CrUX) Unavailable

Google's Chrome User Experience Report (CrUX) did not have sufficient data for this origin. This means INP (Interaction to Next Paint), real-user LCP, CLS, and TTFB distributions are based on lab measurements only. Lab data reflects a single device profile and network condition; real-user experience may vary.

### 2. Areas Not Fully Assessed During Coverage Review

The automated coverage reviewer identified 3 area(s) where the audit could not make a definitive assessment. These are data-quality limitations rather than confirmed site problems. Manual review is recommended for: Privacy policy effective date / last-updated date not verified as machine-readable; No CTA or contact form presence confirmed on this page — conversion path unverified; No navigation or information architecture findings — internal linking to contact page unverified.

### 3. Visual Dark Pattern Detection Not Available

Screenshots are captured during the crawl but are not currently analyzed by our AI agents. Visual-only issues — such as deceptive UI patterns (dark patterns), misleading button styling, or manipulative color/contrast choices in consent banners — require human review of the screenshots in the workspace.

---

*This transparency statement is generated automatically based on the actual audit configuration and data collection results. It is not a disclaimer — it is a precise account of what was and was not tested.*
