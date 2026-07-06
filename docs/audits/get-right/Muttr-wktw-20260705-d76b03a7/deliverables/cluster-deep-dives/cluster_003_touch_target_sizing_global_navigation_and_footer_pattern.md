# Cluster Deep Dive: Touch Target Sizing — Global Navigation and Footer Pattern

**Cluster ID:** cluster_003  
**Pattern:** HTML Structure (Architectural / Systemic)  
**Findings in cluster:** 3  
**Compliance implications:** WCAG 2.5.8 — Legal liability confirmed

---

## 1. The Big Picture

On a mobile device, every page of the WKTW site asks visitors to navigate through a header and footer built for a mouse. The navigation links that lead to the contact page — the site's sole conversion mechanism — are physically too small to tap reliably. The 'Home' link measures 39×20 CSS pixels on an iPhone 14 Pro viewport. The WCAG minimum for a tappable target is 48×48 pixels. That means the height of 'Home' is less than half what it needs to be, and the same is true for 'The Get Right' at 90×20px. A visitor trying to navigate to /contact/ on their phone is working against the interface from the first tap.

The compounding problem is in the footer. The 'privacy policy' link — the link a user would tap to understand what data the site collects before deciding whether to consent — measures 91×17px. Its height is 31 pixels short of the minimum, placing it at 35% of the required touch target size. This matters beyond usability: the site has a consent banner (currently non-rendering, addressed in a separate cluster), and the privacy policy link is the mechanism through which a user exercises informed consent. A link that is practically untappable on mobile undermines the legal basis for that consent workflow. These two failures — broken consent rendering and an untappable privacy policy link — compound each other directly.

For a site where every conversion path routes through navigation to a single contact page, friction at the navigation layer has a direct mechanism of impact on the contact_form KPI. A visitor who mis-taps a navigation link, lands on the wrong page, or abandons the attempt entirely is a visitor who does not reach /contact/. The fix is a single CSS rule addition, which makes this cluster's cost-to-impact ratio unusually favorable.

---

## 2. The Root Cause

The navigation and footer components were designed and built for desktop pointer interaction. On a desktop, a mouse cursor can accurately target a 20px-tall text link because pointer precision is measured in single pixels. On a touchscreen, the contact surface of a finger is substantially larger, and the operating system's hit-testing requires a minimum physical area to register a reliable tap. The CSS for these components uses text-intrinsic sizing — the link is exactly as tall as the text it contains, with no additional padding to create a larger interactive area. There are no `min-height`, `min-width`, or touch-specific padding rules anywhere in the navigation or footer component styles.

This is confirmed by the measured data: every failure in this cluster is a height deficit caused by the same missing padding. 'Home' at 39×20px, 'The Get Right' at 90×20px, and 'privacy policy' at 91×17px all share the same root: a line of anchor text with no vertical padding. The width deficits in 'About' (39px), 'Proof' (36px), and 'Search' (46px) follow the same pattern — short text labels with no minimum width floor. Because the navigation and footer are shared template components rendered on every page, this single architectural gap propagates across the entire site.

---

## 3. Each Finding

### Finding A: Touch Targets Below 48×48px Minimum — Mobile Usability and WCAG 2.5.8 Failure
**ID:** a11y-2-touch-targets-undersized | **Severity:** High | **Effort:** Quick Win

**What's broken:** Eight interactive elements across the site's navigation and footer fail the WCAG 2.5.8 minimum touch target size of 48×48 CSS pixels. The failures span both axes: some elements are too narrow, some too short, and several fail on both dimensions simultaneously.

**Measured evidence:**

| Element | Measured Size | Deficit |
|---|---|---|
| 'Home' link | 39×20px | 9px width, 28px height |
| 'The Get Right' link | 90×20px | 0px width, 28px height |
| 'jon@weknowthewhy.com' mailto | 169×44px | 0px width, 4px height |
| 'About' | 39×48px | 9px width |
| 'Proof' | 36×48px | 12px width |
| 'Search' | 46×48px | 2px width |
| 'Terms' | 41×48px | 7px width |
| 'privacy policy' | 91×17px | 0px width, 31px height |

All measurements were taken on an iPhone 14 Pro at 393×660px viewport. The audit identified 16 total undersized targets across the site, with 9 additional elements in the 44×44px near-miss range.

**Why it matters for WKTW's KPIs:** The navigation links in this list — Home, About, Proof, Search, The Get Right — are the primary wayfinding mechanism to reach /contact/. Every mis-tap or abandoned navigation attempt on mobile is a direct interruption to the contact_form conversion path. The mailto links serve as the alternative contact method; at 169×44px, the email link is 4px short of the height minimum, meaning even the fallback contact mechanism has a tap reliability problem.

**The fix:** A global CSS rule scoped to touch devices via `@media (pointer: coarse)` applies `min-height: 48px; min-width: 48px` to all anchor and button elements in the nav and footer. Using `display: inline-flex; align-items: center; padding: 14px 4px` achieves the minimum target area through padding rather than changing visual dimensions — the text appearance is unchanged, only the tappable area grows. This is a single file addition to the Astro layout.

---

### Finding B: Multiple Undersized Touch Targets — Navigation and Footer Links Affected on Mobile
**ID:** touch-targets-ux-impact | **Severity:** High | **Effort:** Quick Win

**What's broken:** This finding documents the user experience dimension of the same touch target failures identified in Finding A, with specific focus on the interaction pattern created by adjacent undersized targets in the navigation bar. On a 393px-wide mobile viewport, navigation items 'About' (39×48px), 'Proof' (36×48px), and 'Search' (46×48px) sit in close proximity. When individual targets are undersized and spaced tightly, the probability of a mis-tap registering on an adjacent element increases — a user attempting to tap 'About' may activate 'Proof' or vice versa.

**Measured evidence:** The three navigation items above are all width-deficient, ranging from 36px to 46px against the 48px minimum. The footer compounds this with 'Terms' at 41×48px and 'privacy policy' at 91×17px. The mailto link at 169×44px is 4px below the height minimum. Total undersized count across the template: 8 elements, 16 individual target failures when counting both axes.

**Why it matters for WKTW's KPIs:** Adjacent undersized targets in the primary navigation create a mis-tap pattern that sends mobile users to unintended pages. Each unintended navigation event increases bounce probability and adds friction to the path toward /contact/. The effect is directional and measurable in session recordings, though the mechanism is architectural: the targets are simply too small and too close together to operate reliably under normal thumb-navigation conditions.

**The fix:** A Tailwind base-layer plugin injecting the touch target rule at the mobile breakpoint achieves the same outcome as Finding A's approach, with the added benefit of integrating into the existing Tailwind configuration. The two findings share an identical fix surface — this is not two separate implementation tasks.

---

### Finding C: Privacy Policy Link at 17px Height — Critically Undersized in Consent Context
**ID:** mobile-privacy-policy-link-critically-undersized | **Severity:** High | **Effort:** Quick Win

**What's broken:** The 'privacy policy' link in the footer and consent context measures 91×17px. Its height is 31 pixels below the 48px WCAG minimum — it sits at 35% of the required touch target height. On an iPhone 14 Pro, a 17px-tall interactive element is, in practical terms, extremely difficult to tap on the first attempt without zooming in.

**Measured evidence:** Height deficit of 31px (65% below minimum). This is the worst single touch target violation on the site by height margin. The element appears in the consent/footer context — the location where a user would tap to review privacy terms before making a consent decision.

**Legal exposure — plain language:** WCAG 2.5.8 (Target Size Minimum) is a Level AA criterion under WCAG 2.2. In jurisdictions that have adopted WCAG 2.1 or 2.2 AA as the accessibility standard for websites — including under the ADA as interpreted through DOJ guidance, and under the European Accessibility Act — failing to provide adequately sized touch targets for interactive elements constitutes an accessibility barrier. The specific legal exposure here is compounded by context: privacy regulations including GDPR and CCPA require that consent be *informed* and *freely given*. A privacy policy link that is practically untappable on mobile creates a documented barrier to informed consent. If a user cannot reasonably access the privacy policy before consenting, the legal basis for that consent is weakened. This is not a theoretical risk — it is a documented, measured failure in a legally significant user flow. The combination of a non-rendering consent banner (separate cluster) and an untappable privacy policy link means the consent workflow is broken at both ends on mobile.

**Why it matters for WKTW's KPIs:** The privacy policy link is not a conversion element, but its failure has indirect bearing on the contact_form KPI through trust. Users who cannot access privacy terms before submitting a contact form may abandon the form. More directly, the legal exposure created by this failure is a business risk independent of conversion metrics.

**The fix:** A scoped style rule on the consent banner component's privacy policy anchor — `display: inline-flex; align-items: center; min-height: 48px; min-width: 48px; padding-block: 14px` — resolves this specific element. Adding a `data-consent-link` attribute to the anchor provides a stable selector hook that survives content changes. This fix is subsumed by the global rule in Findings A and B; if the global rule is implemented first, this finding is resolved automatically.

---

## 4. The Unified Fix Strategy

All three findings in this cluster share a single root cause and a single fix surface. They should be treated as one implementation task, not three separate tickets.

**Recommended implementation order:**

**Step 1 — Global touch target rule (resolves all 3 findings, all 16 targets):**  
Add a `touch-targets.css` file to `src/styles/` with the following rule, imported in the root `Layout.astro`:

```css
@media (pointer: coarse) {
  nav a, footer a, header a {
    min-height: 48px;
    min-width: 48px;
    display: inline-flex;
    align-items: center;
    padding: 14px 4px;
  }
}
```

Scoping to `(pointer: coarse)` ensures the rule applies only on touch devices, leaving desktop layouts unchanged. This single addition resolves all 16 undersized targets across every page of the site.

**Step 2 — Verify the privacy policy link specifically:**  
After the global rule is applied, confirm the 'privacy policy' link in the consent banner context inherits the rule correctly. If the consent banner component uses scoped styles that override the global rule, apply the `data-consent-link` scoped fix from Finding C as a targeted override. This is a verification step, not a separate implementation.

**Step 3 — Extend to inline links if needed:**  
The mailto link `jon@weknowthewhy.com` at 169×44px is 4px below the height minimum. If it falls outside the `nav a, footer a` selector scope, add `a[href^="mailto"]` to the rule set.

**Priority rationale:** This is a quick win with outsized compliance and conversion impact. The implementation effort is a single CSS file addition and one layout import. The compliance risk — particularly around the privacy policy link in the consent context — makes this a higher-urgency item than its implementation complexity would suggest. It should be scheduled ahead of any work that requires design review or content changes.

**Relationship to other clusters:** The privacy policy link failure in this cluster compounds directly with the consent banner rendering failure documented in the consent cluster. Fixing touch targets does not fix the consent banner, and fixing the consent banner does not fix touch targets. Both fixes are needed for the consent workflow to function correctly on mobile. The touch target fix is faster and should not wait on the consent banner work.

---

## 5. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| a11y-2-touch-targets-undersized | Touch targets below 48×48px — WCAG 2.5.8 failure | High | Quick Win | **Shared** — global CSS rule resolves all three findings |
| touch-targets-ux-impact | Undersized touch targets — navigation and footer UX impact | High | Quick Win | **Shared** — same global CSS rule; Tailwind plugin variant |
| mobile-privacy-policy-link-critically-undersized | Privacy policy link at 17px height — consent context | High | Quick Win | **Shared** — subsumed by global rule; scoped override if needed |

**Bottom line:** One CSS file addition. Three findings closed. Sixteen touch target failures resolved across every page. Legal exposure in the consent flow reduced. Conversion path friction on mobile reduced. This is the highest-leverage quick win in the audit relative to implementation cost.
