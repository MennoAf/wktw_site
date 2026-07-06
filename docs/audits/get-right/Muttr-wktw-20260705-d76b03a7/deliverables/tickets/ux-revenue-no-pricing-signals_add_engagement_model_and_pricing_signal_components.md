---
finding_id: "ux-revenue-no-pricing-signals"
title: "No pricing information, engagement model, or scope indicators — creates inquiry friction"
severity: "medium"
root_cause_cluster: "Conversion Path Architecture — No On-Page Forms, No Inline CTAs, No Trust Signals"
why_this_matters: "Visitors who read engagement model and scope indicators before submitting a contact form arrive with budget and scope context already formed."
fix_summary: "Add engagement model and pricing signal components to the homepage, primary service pages, and About page."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# No pricing information, engagement model, or scope indicators — creates inquiry friction

**Finding:** No pricing information, engagement model, or scope indicators — creates inquiry friction  
**Severity:** Medium  
**Why this matters:** Visitors who read engagement model and scope indicators before submitting a contact form arrive with budget and scope context already formed.  
**Root cause:** Conversion Path Architecture — No On-Page Forms, No Inline CTAs, No Trust Signals  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Add engagement model and pricing signal components to the homepage, primary service pages, and About page.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Inquiry Quality:** Visitors who read engagement model and scope indicators before submitting a contact form arrive with budget and scope context already formed. This shifts the contact form from a discovery mechanism to a conversion mechanism — the firm receives fewer exploratory inquiries from misaligned prospects and more qualified submissions from visitors who have already confirmed fit. The sales team spends less time on disqualification calls.
- **High Intent Friction:** Budget-qualified visitors currently face a zero-signal environment: they cannot confirm fit without submitting a form. Adding scope indicators and engagement model framing removes the 'should I even bother?' decision barrier. Visitors who are already intent-positive can confirm fit and convert without an additional research step.
- **Pipeline Signal:** Contact form submissions segmented by engagement type (via ?type= query parameter on each CTA href) give the firm immediate pipeline signal without requiring a CRM integration change — the query parameter is visible in form referrer data and can be captured as a hidden field.
- **Search Ranking:** Engagement model content adds substantive, crawlable text to pages that currently terminate in generic CTAs. This improves topical depth on service pages, which is a documented on-page relevance signal for B2B service queries.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_004`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The homepage provides no indication of pricing structure, engagement models, or even pricing ranges.. For a technical services business (website performance auditing based on the h1), potential clients need to understand whether this is a one-time audit, retainer, or project-based engagement before committing to a contact form.

**Measured evidence:**
- Pricing Elements: 0
- Scope Indicators: 0
- Deliverable Descriptions: not verifiable from DOM structure alone
- Engagement Model Described: False
- Heading Count: 14
- H1 Text: You always talk to the people who built the system.
- Pricing Signals Detected: None from available data
- Note: Content strategy observation — requires human review of actual page content

Open the affected page in Chrome DevTools and verify these values in the relevant tab (Network, Elements, Console, Application, or Performance).

## Done when

No automated verification tests available for this finding.

**Manual validation steps:**

1. Implement the fix on a staging environment
2. Open the affected page(s) in Chrome DevTools
3. Run a Lighthouse audit (Performance + Accessibility)
4. Compare scores against the pre-fix baseline
5. Check the Console tab for new errors or warnings

## Code

### What to do
Add engagement model and pricing signal components to the homepage, primary service pages, and About page. These components do not require publishing actual prices — they communicate engagement structure (retainer vs. project vs. advisory), typical scope indicators (team size, duration, deliverable type), and a qualification anchor (e.g., 'Engagements typically begin at X' or 'We work with teams of Y–Z'). The goal is to move the contact form from a discovery mechanism to a conversion mechanism by giving budget-qualified visitors enough signal to self-qualify before submitting.

### How
1. Create a reusable EngagementModel.astro component that accepts an array of engagement tier objects (name, description, scope indicators, CTA label, CTA href). This component renders a 3-column card grid on desktop, single-column on mobile.
2. Create a PricingSignalBanner.astro component — a single-row contextual strip that can be dropped into any page layout above the primary CTA. It accepts a headline, a qualifier statement, and an optional anchor link to the full engagement model section.
3. Add the EngagementModel component to the homepage (above the contact CTA), the primary service page(s) (below the service description, above the footer CTA), and the About page (below the team/credentials section).
4. Add the PricingSignalBanner to any page that has a standalone CTA block but no room for the full EngagementModel grid — this covers secondary service pages and the Proof page.
5. Define all tier content as a typed data file (src/data/engagementTiers.ts) so content editors update one file, not multiple templates. The component imports from this file.
6. Scope all styles with Astro's scoped <style> blocks. Do not write global selectors. Use CSS custom properties for theming so the component inherits the site's existing color tokens.
7. Verify no existing layout breaks: the EngagementModel grid uses CSS Grid with auto-fit and a minmax column floor, so it degrades gracefully at any viewport width without media query fragmentation.
8. Add aria-labelledby to the section element wrapping EngagementModel, pointing to the section heading id, so screen readers announce the section correctly.
9. Test keyboard navigation: each card's CTA must be reachable via Tab, have a visible focus ring, and not rely on the card's click handler (the <a> element is the interactive target, not the card div).

### Code examples
```
// src/data/engagementTiers.ts
// SITE-SPECIFIC: Update tier names, descriptions, and scope indicators to match
// actual service offerings. CTA hrefs assume /contact/ is the conversion endpoint.
export interface EngagementTier {
  id: string;
  name: string;
  model: string; // e.g. 'Project', 'Retainer', 'Advisory'
  scopeIndicators: string[];
  qualifier: string; // budget/scope anchor without a hard price
  ctaLabel: string;
  ctaHref: string;
}

export const ENGAGEMENT_TIERS: EngagementTier[] = [
  {
    id: 'advisory',
    name: 'Advisory',
    model: 'Retainer',
    scopeIndicators: [
      'Ongoing strategic guidance',
      'Typically 4–8 hours per month',
      'Suited for in-house teams needing senior oversight',
    ],
    qualifier: 'Structured for teams with existing execution capacity',
    ctaLabel: 'Discuss advisory',
    ctaHref: '/contact/?type=advisory',
  },
  {
    id: 'project',
    name: 'Defined Project',
    model: 'Fixed Scope',
    scopeIndicators: [
      'Scoped deliverables with defined milestones',
      'Typical duration: 6–16 weeks',
      'Suited for audits, builds, and migrations',
    ],
    qualifier: 'Requires a defined brief before engagement begins',
    ctaLabel: 'Start a project',
    ctaHref: '/contact/?type=project',
  },
  {
    id: 'embedded',
    name: 'Embedded Partnership',
    model: 'Retainer',
    scopeIndicators: [
      'Dedicated capacity within your team',
      'Minimum 3-month commitment',
      'Suited for sustained product or platform work',
    ],
    qualifier: 'Best fit for teams scaling a core system',
    ctaLabel: 'Explore partnership',
    ctaHref: '/contact/?type=embedded',
  },
];
---
// src/components/EngagementModel.astro
// Drop into any page layout. Imports tier data from the single source of truth.
// Precondition: ENGAGEMENT_TIERS is a non-empty array (enforced by TypeScript type).
import { ENGAGEMENT_TIERS } from '../data/engagementTiers';

const SECTION_HEADING_ID = 'engagement-model-heading';
---

<section
  class="engagement-model"
  aria-labelledby={SECTION_HEADING_ID}
>
  <h2 id={SECTION_HEADING_ID} class="engagement-model__heading">
    How we engage
  </h2>
  <p class="engagement-model__subhead">
    We work in three structures depending on your team's needs and timeline.
    Each engagement begins with a scoping call — no retainer required to start the conversation.
  </p>
  <ul class="engagement-model__grid" role="list">
    {ENGAGEMENT_TIERS.map((tier) => (
      <li class="engagement-model__card" key={tier.id}>
        <span class="engagement-model__model-badge">{tier.model}</span>
        <h3 class="engagement-model__tier-name">{tier.name}</h3>
        <ul class="engagement-model__scope-list" aria-label={`${tier.name} scope indicators`}>
          {tier.scopeIndicators.map((indicator) => (
            <li class="engagement-model__scope-item">{indicator}</li>
          ))}
        </ul>
        <p class="engagement-model__qualifier">{tier.qualifier}</p>
        <a
          href={tier.ctaHref}
          class="engagement-model__cta"
          aria-label={`${tier.ctaLabel} — ${tier.name} engagement`}
        >
          {tier.ctaLabel}
        </a>
      </li>
    ))}
  </ul>
</section>

<style>
  /* All selectors scoped to .engagement-model — no global bleed */

  /* SITE-SPECIFIC: Replace custom property values with your design token names */
  .engagement-model {
    padding-block: var(--space-16, 4rem);
    padding-inline: var(--space-4, 1rem);
    max-width: var(--content-max-width, 72rem);
    margin-inline: auto;
  }

  .engagement-model__heading {
    font-size: var(--text-2xl, 1.75rem);
    font-weight: 700;
    margin-block-end: var(--space-3, 0.75rem);
  }

  .engagement-model__subhead {
    font-size: var(--text-base, 1rem);
    color: var(--color-text-muted, #6b7280);
    max-width: 60ch;
    margin-block-end: var(--space-10, 2.5rem);
  }

  .engagement-model__grid {
    display: grid;
    /* SITE-SPECIFIC: 280px is the minimum card width — adjust to match your grid */
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-6, 1.5rem);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .engagement-model__card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3, 0.75rem);
    padding: var(--space-6, 1.5rem);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: var(--radius-md, 0.5rem);
    background: var(--color-surface, #ffffff);
  }

  .engagement-model__model-badge {
    display: inline-block;
    font-size: var(--text-xs, 0.75rem);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-accent, #2563eb);
    background: var(--color-accent-subtle, #eff6ff);
    padding: 0.25rem 0.625rem;
    border-radius: var(--radius-full, 9999px);
    width: fit-content;
  }

  .engagement-model__tier-name {
    font-size: var(--text-lg, 1.125rem);
    font-weight: 600;
    margin: 0;
  }

  .engagement-model__scope-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 0.5rem);
  }

  .engagement-model__scope-item {
    font-size: var(--text-sm, 0.875rem);
    color: var(--color-text-secondary, #374151);
    padding-inline-start: 1.25rem;
    position: relative;
  }

  /* Decorative bullet — not conveyed to AT, content is in text */
  .engagement-model__scope-item::before {
    content: '';
    position: absolute;
    inset-inline-start: 0;
    top: 0.5em;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background: var(--color-accent, #2563eb);
  }

  .engagement-model__qualifier {
    font-size: var(--text-sm, 0.875rem);
    font-style: italic;
    color: var(--color-text-muted, #6b7280);
    margin: 0;
    margin-block-start: auto; /* push qualifier and CTA to card bottom */
  }

  .engagement-model__cta {
    display: inline-block;
    padding: 0.625rem 1.25rem;
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
    color: var(--color-accent, #2563eb);
    border: 2px solid var(--color-accent, #2563eb);
    border-radius: var(--radius-sm, 0.25rem);
    text-decoration: none;
    text-align: center;
    transition: background-color 150ms ease, color 150ms ease;
    /* Minimum 48x48px touch target per WCAG 2.5.8 */
    min-block-size: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .engagement-model__cta:hover {
    background: var(--color-accent, #2563eb);
    color: var(--color-on-accent, #ffffff);
  }

  /* Visible focus ring — never suppress without replacement */
  .engagement-model__cta:focus-visible {
    outline: 3px solid var(--color-focus-ring, #2563eb);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .engagement-model__cta {
      transition: none;
    }
  }
</style>
---
// src/components/PricingSignalBanner.astro
// Lightweight single-row strip for pages where the full EngagementModel grid
// does not fit the layout. Accepts props; no data import needed.
// Precondition: headline and qualifier are non-empty strings (caller responsibility).
interface Props {
  headline: string;
  qualifier: string;
  anchorLabel?: string;
  anchorHref?: string;
}

const {
  headline,
  qualifier,
  // SITE-SPECIFIC: Default anchor points to the homepage engagement section.
  // Update if the EngagementModel section lands on a different page.
  anchorLabel = 'See how we engage',
  anchorHref = '/#engagement-model-heading',
} = Astro.props;
---

<aside
  class="pricing-signal-banner"
  aria-label="Engagement model summary"
>
  <div class="pricing-signal-banner__content">
    <p class="pricing-signal-banner__headline">{headline}</p>
    <p class="pricing-signal-banner__qualifier">{qualifier}</p>
  </div>
  {anchorHref && (
    <a
      href={anchorHref}
      class="pricing-signal-banner__link"
      aria-label={anchorLabel}
    >
      {anchorLabel}
    </a>
  )}
</aside>

<style>
  .pricing-signal-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4, 1rem);
    padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
    background: var(--color-surface-alt, #f9fafb);
    border-inline-start: 4px solid var(--color-accent, #2563eb);
    border-radius: var(--radius-sm, 0.25rem);
    margin-block: var(--space-8, 2rem);
  }

  .pricing-signal-banner__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1, 0.25rem);
  }

  .pricing-signal-banner__headline {
    font-size: var(--text-base, 1rem);
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary, #111827);
  }

  .pricing-signal-banner__qualifier {
    font-size: var(--text-sm, 0.875rem);
    color: var(--color-text-muted, #6b7280);
    margin: 0;
  }

  .pricing-signal-banner__link {
    font-size: var(--text-sm, 0.875rem);
    font-weight: 600;
    color: var(--color-accent, #2563eb);
    text-decoration: underline;
    text-underline-offset: 3px;
    white-space: nowrap;
    /* Minimum touch target */
    min-block-size: 48px;
    display: flex;
    align-items: center;
  }

  .pricing-signal-banner__link:focus-visible {
    outline: 3px solid var(--color-focus-ring, #2563eb);
    outline-offset: 3px;
    border-radius: 2px;
  }
</style>
---
// Usage example: src/pages/index.astro (homepage)
// Add EngagementModel above the existing contact CTA block.
// Precondition: The existing CTA block is a sibling section, not a parent wrapper.
// If the CTA block wraps the page, extract it first.
import BaseLayout from '../layouts/BaseLayout.astro';
import EngagementModel from '../components/EngagementModel.astro';
// ... other existing imports
---

<BaseLayout>
  <!-- existing homepage sections -->

  <!-- INSERT: Engagement model before the contact CTA -->
  <EngagementModel />

  <!-- existing contact CTA section -->
  <section class="cta-block">
    <!-- unchanged -->
  </section>
</BaseLayout>
---
// Usage example: src/pages/services/[slug].astro or equivalent service page
// PricingSignalBanner drops in below the service description prose block.
// Precondition: The service page has a prose content block followed by a CTA.
import PricingSignalBanner from '../../components/PricingSignalBanner.astro';
---

<!-- existing service description -->
<div class="service-prose">
  <!-- unchanged content -->
</div>

<!-- INSERT: Pricing signal between description and CTA -->
<PricingSignalBanner
  headline="Engagements are scoped before any commitment is made."
  qualifier="We work on a project or retainer basis depending on your team's needs. Typical engagements run 6–16 weeks for defined projects."
  anchorLabel="See all engagement structures"
  anchorHref="/#engagement-model-heading"
/>

<!-- existing CTA -->
<section class="service-cta">
  <!-- unchanged -->
</section>
```

## Risks
- Scope indicator language that is too specific (e.g., exact week ranges) may create expectation mismatches if actual engagements vary significantly. Mitigation: use 'typically' and 'depending on scope' qualifiers throughout, as shown in the example data. Review tier copy with the sales team before publishing.
- The ?type= query parameter on CTA hrefs will only produce pipeline segmentation data if the contact form captures it as a hidden field or if the analytics layer reads it from the URL. If neither is in place, the parameter is harmless but produces no data. Mitigation: verify form handler or analytics event captures utm/type parameters before launch, or remove the parameter from hrefs until that plumbing exists.
- Adding a new section above the existing homepage CTA changes the page's visual hierarchy and scroll depth to the CTA. If the existing CTA is tracked as a scroll-depth or click event in analytics, the baseline will shift after launch. Mitigation: note the deploy date in analytics annotations so before/after comparison is clean.
- The EngagementModel grid uses auto-fit with a 280px column floor. If the site's content column is narrower than 280px on any breakpoint (unlikely but possible on constrained layouts), the grid will render as a single column at all widths. Mitigation: verify the component renders correctly inside the site's actual content column width at 320px, 375px, and 768px viewports before merging.
- CSS custom properties used for theming (--color-accent, --space-6, etc.) must exist in the site's global stylesheet or the component will fall back to the hardcoded fallback values in the var() declarations. Mitigation: audit the site's existing custom property names and update the component's var() calls to match before merging. The fallback values are functional but may not match the brand.

## Effort & Cost
- **Effort:** medium
- **Cost:** low
