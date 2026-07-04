# Cluster Deep Dive: Global Touch Target and Interactive Element Sizing Deficit

**Cluster ID:** cluster_003 | **Pattern:** HTML Structure | **Systemic:** Yes | **Findings:** 4 | **Compliance:** WCAG 2.5.8 (Level AA)

---

## 1. The Big Picture

Pick up a phone and visit We Know the Why. The first thing a mobile visitor needs to do is navigate — and the only way to do that is to tap the hamburger menu button in the top corner. That button measures 40×40 CSS pixels, 8 pixels short of the WCAG minimum on both axes. For a user with average motor control, that shortfall is a minor inconvenience. For a user with a tremor, arthritis, or a large thumb, it is a repeated failure that sends them back to wherever they came from. If they do get the menu open, the navigation links inside — "The Get Right," "Insights," "Proof," "About" — render at only 24px tall, exactly half the required minimum. The "Talk to a Founder" CTA, the single most important conversion action on the site, sits at 40px tall: close, but still below the threshold. Footer links are the worst offenders, with some elements measuring just 17px in height — a 31-pixel shortfall against the standard.

The compounding effect matters here. The hamburger button does not just fail on size — it also has an empty accessible name. There is no `aria-label`, no visible text, no programmatic label of any kind. For a screen reader user, the button is announced as an unlabeled interactive element with no indication of what it does. This means the gateway to all mobile navigation is simultaneously physically difficult to tap for motor-impaired users and completely invisible to assistive technology for blind and low-vision users. These two failures reinforce each other: fixing only the size leaves screen reader users stranded; fixing only the label leaves motor-impaired users still mis-tapping. Both must be resolved together, and the audit data confirms neither has been addressed.

For We Know the Why, whose KPIs include conversion rate and bounce rate, the practical consequence is direct. A visitor who cannot reliably tap the primary CTA does not convert. A visitor who mis-taps navigation links and lands somewhere unexpected bounces. These are not edge cases confined to a small accessibility-specific audience — one-handed mobile use, outdoor glare, and physical fatigue affect the general population. Every mobile session on this site is exposed to these friction points.

---

## 2. The Root Cause

All four findings trace to a single upstream decision: the design system's spacing and sizing tokens were established without a 48px minimum interactive height constraint. This is not a case of individual developers making isolated mistakes on individual pages. The hamburger button, the navigation links, the primary CTA, and the footer links are all separate components, but they all share the same underlying failure — no floor was ever set in the Tailwind configuration or base CSS layer that prevents an interactive element from rendering below the accessibility minimum. Because the design system never enforced this constraint, every component built on top of it inherited the problem.

The measured evidence makes the systemic nature clear. Twenty individual elements across the site fall below the 48×48px threshold. The failures span every major interactive zone: header navigation (hamburger at 40×40px, logo link at 66×28px), mobile menu (nav links at 345×24px, CTA at 345×40px), and footer (links at approximately 90×17px, logo at 66×25px). These elements live in different components and different parts of the page, but they all reflect the same missing constraint at the design system level. This is why the fix is also a design system intervention — patching individual components one by one would address symptoms while leaving the root cause intact and free to produce new violations in any future component.

---

## 3. Each Finding

### Finding 1: 20 Touch Targets Below 48×48px Minimum
**ID:** `accessibility-touch-targets-undersized` | **Severity:** High | **Tier:** Template | **Legal Liability:** Yes

**What's broken:** Twenty interactive elements across the site render below the WCAG 2.5.8 minimum touch target size of 48×48 CSS pixels. This criterion exists because human fingers are not pixel-precise input devices, and elements smaller than 48px create a statistically meaningful rate of mis-taps — particularly for users with motor impairments, but also for general mobile users in real-world conditions.

**The evidence:** The audit measured specific element dimensions on an iPhone 14 Pro (393×660px viewport). The worst offenders by shortfall are: footer links such as "The Get Right" at 90×17px (31px below minimum height), "Platform Audit" at 94×17px (31px below minimum height), the WKTW footer logo at 66×25px (23px below minimum height), the header logo at 66×28px (20px below minimum height), the "Talk to a Founder" CTA at 345×40px (8px below minimum height), and the hamburger button at 40×40px (8px below minimum on both axes). Social links at 44×44px are 4px below the threshold. In total, 20 elements fail across navigation, conversion, and footer zones.

**Why it matters for your KPIs:** The "Talk to a Founder" CTA is the primary conversion mechanism on the site. At 345×40px, it is 8px short of the minimum height. A mis-tap on this element — landing on surrounding content instead of triggering the CTA — interrupts the conversion flow directly. Navigation links at 24px height create the same friction for users trying to move between pages, which increases the probability of abandonment and elevates bounce rate. The mechanism is straightforward: reduced tap reliability → increased user frustration → higher exit rate before conversion.

**The fix:** Introduce a CSS layer that enforces `min-height: 48px` on all interactive element categories — buttons, navigation links, footer links, and icon links — scoped to avoid inflating inline body text links. This is a single stylesheet addition that resolves the majority of the 20 failures without altering visual design, since padding can expand the tap target area without changing the visible text size or layout.

---

### Finding 2: Hamburger Menu Button Has Empty Accessible Name and 40×40px Touch Target
**ID:** `ux-mobile-hamburger-discoverability` | **Severity:** High | **Tier:** Platform | **Legal Liability:** Yes

**What's broken:** The mobile menu toggle button has two simultaneous failures. First, it measures 40×40px — 8px below the 48px minimum on both width and height. Second, it has an empty accessible name: no `aria-label`, no visible text, no title attribute. The button contains only an SVG icon with no programmatic label attached to the interactive element itself.

**The evidence:** The audit confirmed `accessible_name: empty string` and `aria_label: not detected` on the button element, with a measured size of 40×40px against a required minimum of 48×48px. On the iPhone 14 Pro at 393px viewport width, this button is the only mechanism available to access site navigation.

**Why it matters for your KPIs:** This is the highest-severity individual element failure in the cluster because it is the gateway to all other navigation. A screen reader user — using VoiceOver on iOS, for example — will encounter an unlabeled button and have no way to determine its purpose without activating it. A motor-impaired user has an 8px shortfall on both axes to contend with. These are not independent populations: the same user may rely on both assistive technology and switch access or other motor-accommodation tools. The compound effect is a complete navigation barrier for a subset of mobile visitors, which means zero opportunity for conversion from that segment.

**The fix:** Two changes to the single header component template: add `aria-label="Open navigation menu"` to the `<button>` element (not the SVG child), and increase the button's dimensions to a minimum of 48×48px via `min-width: 48px; min-height: 48px`. Both changes are isolated to one component and carry no risk of side effects elsewhere.

---

### Finding 3: Primary Conversion CTA 'Talk to a Founder' Is 40px Tall
**ID:** `ux-mobile-nav-cta-undersized` | **Severity:** High | **Tier:** Template | **Legal Liability:** Yes

**What's broken:** The "Talk to a Founder" button in the mobile navigation renders at 345×40px. It meets the width requirement comfortably but falls 8px short of the 48px minimum height. The desktop version is likely smaller still, as mobile navigation menus typically apply more generous sizing than desktop nav.

**The evidence:** The audit measured the mobile menu CTA at 345×40px on the iPhone 14 Pro viewport, confirming an 8px height deficit against the 48px WCAG 2.5.8 minimum. This element is identified in the audit data as the primary conversion action on the site.

**Why it matters for your KPIs:** This finding has the most direct line to revenue of any element in the cluster. "Talk to a Founder" is the conversion action — the moment a visitor decides to engage. An 8px shortfall means the tappable area ends where a user's finger naturally expects the button to still be active. Mis-taps on a CTA do not just fail to convert; they can produce accidental navigation to adjacent elements, which creates a disorienting experience that increases the likelihood of abandonment. The audit recommendation specifically calls for exceeding the minimum here — a `min-height: 56px` (3.5rem) target — because primary conversion actions benefit from a larger tap area that signals confidence and reduces friction.

**The fix:** Increase vertical padding on the CTA component to achieve a rendered height of at least 48px, with 56px recommended for a primary conversion action. The likely current composition is font size plus line height plus approximately 8–10px vertical padding on each side, totalling ~40px. Adding 4px to each side of the vertical padding reaches the minimum; adding 8px reaches the recommended 56px. This change is scoped to the CTA component class and does not affect other elements.

---

### Finding 4: Mobile Navigation Links Render at 24px Height
**ID:** `mobile-nav-touch-targets-ux` | **Severity:** High | **Tier:** Platform | **Legal Liability:** Yes

**What's broken:** The four primary navigation links — "The Get Right," "Insights," "Proof," "About" — render at 345×24px in the mobile menu. They span the full available width, which is correct, but at 24px tall they are exactly half the required minimum height. This is the largest proportional shortfall among the navigation elements.

**The evidence:** The audit measured all four links at 345×24px on the iPhone 14 Pro (393×660px viewport), confirming a 24px height deficit — the largest gap of any navigation element. Footer links are worse in absolute terms (17px height, 31px deficit), but the navigation links are higher-traffic elements that every mobile visitor encounters before reaching any content.

**Why it matters for your KPIs:** Navigation links at 24px height create a high probability of mis-taps in normal mobile use. A user attempting to tap "Insights" may instead activate whitespace above or below the link, producing no navigation event, or may activate an adjacent link and land on an unintended page. Either outcome increases bounce rate. For users with motor impairments, 24px links are not a minor inconvenience — they represent a functional barrier to site navigation. The bounce rate KPI is directly exposed: a visitor who cannot reliably navigate between pages has no path to conversion.

**The fix:** Increase the vertical padding on navigation link elements to expand the tap target to 48px without changing the visible text size. This is a CSS-only change — `padding-block` on the anchor elements within the mobile nav — that expands the interactive bounding box while leaving the visual layout unchanged. The Tailwind base layer is the appropriate place to enforce this as a floor, using `:not()` exclusions to avoid affecting inline prose links.

---

## 4. The Unified Fix Strategy

Because all four findings share the same root cause — no minimum interactive height constraint in the design system — they can and should be resolved in a single coordinated intervention rather than four separate tickets. The following plan addresses them in priority order.

**Step 1 — Hamburger button (immediate, highest priority):** This is the only finding with two simultaneous failures (size and accessible name) and the only one that creates a complete navigation barrier. Fix first. Add `aria-label="Open navigation menu"` to the button element and set `min-width: 48px; min-height: 48px` in the header component. Effort: one component, two attribute/style changes. This is the fastest path to eliminating the most severe accessibility barrier on the site.

**Step 2 — Design system baseline rule (resolves the remaining 19 elements):** Create a CSS base layer rule — either a new `touch-target-floors.css` file loaded after the main stylesheet, or a Tailwind base layer plugin — that enforces `min-height: 48px` on all interactive element categories: `button`, `a` within `nav` and `footer`, `[role="button"]`, and form controls. Use `:not()` exclusions scoped to prose container classes to avoid inflating inline body text links. This single rule resolves the navigation links (24px → 48px), the footer links (17px → 48px), the logo links (25–28px → 48px), and the social links (44px → 48px).

**Step 3 — Primary CTA sizing (conversion-critical, slightly above minimum):** Apply `min-height: 56px` (3.5rem) specifically to the "Talk to a Founder" CTA component class. The design system baseline in Step 2 will bring it to 48px automatically, but the primary conversion action warrants an explicit override to 56px. This signals intentionality in the design system and provides a more comfortable tap target for the highest-value interactive element on the site.

**Step 4 — CI/CD regression prevention:** Add `axe-core` to the CI/CD pipeline with a rule that fails the build on any WCAG 2.5.8 violation. This prevents the design system baseline from being silently overridden by future component work. Without this step, the fixes are vulnerable to regression as the site evolves.

All four steps are classified as quick wins in the audit data. Steps 1 through 3 require no architectural changes, no new dependencies, and no visual design alterations. Step 4 requires adding a testing library to the build pipeline, which is a one-time configuration change.

---

## 5. Legal Exposure

WCAG 2.5.8 (Target Size Minimum) is a Level AA criterion under WCAG 2.1 and 2.2. In jurisdictions that have adopted WCAG 2.1 AA as the legal accessibility standard — including the United States under the ADA (as interpreted by DOJ guidance and established case law), the European Union under the European Accessibility Act, and the United Kingdom under the Equality Act 2010 — failure to meet Level AA criteria constitutes a potential accessibility violation.

The practical legal risk mechanism is as follows: a user with a motor impairment who cannot reliably activate navigation or conversion elements due to undersized touch targets has grounds to allege that the site fails to provide equal access. The hamburger button's empty accessible name compounds this by creating a separate, independently actionable WCAG failure (Success Criterion 4.1.2, Name, Role, Value) for screen reader users. The presence of 20 measured, documented failures across multiple element categories — including the primary conversion action — means the violation is not incidental or ambiguous. It is systemic and measurable, which is precisely the evidentiary standard that accessibility demand letters and complaints rely on. Remediation before a complaint is filed is materially less costly and disruptive than remediation under legal pressure.

---

## 6. Summary Table

| Finding ID | Title | Severity | Effort | Fix Overlap |
|---|---|---|---|---|
| `accessibility-touch-targets-undersized` | 20 touch targets below 48×48px minimum | High | Quick Win | **Shared** — resolved by design system baseline rule (Step 2) |
| `ux-mobile-hamburger-discoverability` | Hamburger button: empty accessible name + 40×40px | High | Quick Win | **Partially unique** — `aria-label` fix is unique to this element; size fix is shared with Step 2 |
| `ux-mobile-nav-cta-undersized` | Primary CTA 'Talk to a Founder' at 40px height | High | Quick Win | **Partially unique** — baseline brings to 48px; 56px target requires unique CTA override (Step 3) |
| `mobile-nav-touch-targets-ux` | Navigation links at 24px height | High | Quick Win | **Shared** — fully resolved by design system baseline rule (Step 2) |
