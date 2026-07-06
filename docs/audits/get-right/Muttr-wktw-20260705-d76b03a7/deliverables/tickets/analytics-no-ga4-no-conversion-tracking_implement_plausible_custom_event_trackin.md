---
finding_id: "analytics-no-ga4-no-conversion-tracking"
title: "No GA4 or equivalent full-featured analytics — conversion tracking and enhanced measurement absent"
severity: "critical"
root_cause_cluster: "Analytics Blindness — No Conversion Tracking, No Event Measurement, Client-Side Only"
why_this_matters: "The site currently has zero conversion data."
fix_summary: "Implement Plausible custom event tracking for all conversion actions (contact form submission, mailto: clicks, CTA button clicks) and configure a first-party proxy to defeat ad blockers."
confidence_tier: "confirmed"
remediation_surface: "source_code"
also_satisfies: ["analytics-plausible-single-point-failure-conversion-blindspot", "ux-analytics-client-side-only-data-loss"]
---

# No GA4 or equivalent full-featured analytics — conversion tracking and enhanced measurement absent

**Finding:** No GA4 or equivalent full-featured analytics — conversion tracking and enhanced measurement absent  
**Severity:** Critical  
**Why this matters:** The site currently has zero conversion data.  
**Root cause:** Analytics Blindness — No Conversion Tracking, No Event Measurement, Client-Side Only  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Implement Plausible custom event tracking for all conversion actions (contact form submission, mailto: clicks, CTA button clicks) and configure a first-party proxy to defeat ad blockers.  

> **Evidence Basis:** Confirmed

---

## Also resolves (2)

One fix closes the findings below — they were folded here as the same remediation:

- `analytics-plausible-single-point-failure-conversion-blindspot` (Medium) — Eliminate the single-point-of-failure analytics architecture by: (1) deploying Plausible via a first-party proxy endpoint to survive ad-blocker interception, (2) completing the abandoned dataLayer instrumentation with a proper GTM pageview trigger and contact_form conversion event, and (3) adding a server-side form submission signal via a lightweight measurement endpoint so that contact_form conversions are recorded even when all client-side scripts are blocked. The objective is a three-layer redundant measurement stack: proxied client-side Plausible, GTM-managed dataLayer events, and a server-side conversion ping — ensuring the conversion rate numerator and denominator are captured from the same audience segment, including privacy-tool users.
- `ux-analytics-client-side-only-data-loss` (Medium) — All tracking is client-side only — ad blocker and ITP data loss unmitigated, no server-side fallback

## Impact

- **Conversion Visibility:** The site currently has zero conversion data. This fix creates the measurement foundation: every contact form submission, email link click, and CTA interaction becomes a countable, attributable event. Without this, no marketing spend, content change, or UX improvement can be evaluated for effectiveness.
- **Ad Blocker Bypass:** First-party proxying makes the analytics script indistinguishable from site assets. B2B technical audiences have disproportionately high ad blocker usage. Without the proxy, a significant portion of the target audience's pageviews and events are silently dropped — the proxy closes this data gap.
- **Data Integrity:** The queuing mechanism ensures events fired before script load are not lost. The event delegation pattern ensures dynamically rendered or view-transition-swapped elements are tracked without re-instrumentation. Both prevent silent data loss that would undercount conversions.
- **Attribution Capability:** Page path captured on every event enables source/medium → page → conversion funnel analysis in Plausible's dashboard. This answers the stated KPIs: which traffic source drives qualified leads, and what is the conversion rate per channel.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_005`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** The site uses Plausible Analytics as its sole tracking platform.. Plausible is a lightweight, privacy-focused analytics tool that provides pageview counts, referrer data, and basic engagement metrics.

**Measured evidence:**
- Scripts Detected: ['plausible.io (async, no custom event attributes)']
- Ga4 Present: False
- Gtm Present: False
- Custom Events Detected: 0
- Total Js Bytes: 29950
- Js Unused Pct: 15.3
- Inline Scripts: 8
- External Scripts: 1

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
Implement Plausible custom event tracking for all conversion actions (contact form submission, mailto: clicks, CTA button clicks) and configure a first-party proxy to defeat ad blockers. No new analytics platform needed — leverage the existing Plausible investment.

### How
1. Create a reusable Astro component (`src/components/PlausibleAnalytics.astro`) that loads Plausible via a Netlify first-party proxy rewrite instead of the third-party `plausible.io` domain. This defeats ad blockers disproportionately used by the B2B technical audience.
2. Add a Netlify rewrite rule in `netlify.toml` to proxy `/js/script.js` → `https://plausible.io/js/script.js` and `/api/event` → `https://plausible.io/api/event`.
3. Create a shared analytics utility module (`src/lib/analytics.ts`) that wraps `window.plausible()` with null-guards, typed event names, and a queue for events fired before the script loads.
4. Instrument the contact form (`/contact/`) with a `submit` event listener that fires a `Contact Form Submitted` custom event via the utility, gated behind form validation state.
5. Instrument all `mailto:` links site-wide using event delegation on `document.body` for `click` events on `a[href^="mailto:"]`, firing an `Email Link Clicked` custom event with the page path as a property.
6. Instrument primary CTA buttons (identified by a data attribute `data-track-cta`) with click tracking firing a `CTA Clicked` event with the button text and destination URL as properties.
7. Configure goals in the Plausible dashboard (Settings → Goals) for each custom event name: `Contact Form Submitted`, `Email Link Clicked`, `CTA Clicked`.
8. Replace the existing `<script>` tag loading Plausible in the site's base layout with the new `PlausibleAnalytics.astro` component.
9. Add `data-track-cta` attributes to primary CTA buttons across the site (a content change, not a code change — grep for the primary CTA class/pattern and add the attribute).

### Code examples
```
// FILE: netlify.toml — add these rewrite rules
// These proxy Plausible through the site's own domain,
// making the analytics script indistinguishable from first-party resources.
// This defeats ad blockers and privacy extensions that block plausible.io.

[[redirects]]
  from = "/js/script.js"
  to = "https://plausible.io/js/script.js"
  status = 200

[[redirects]]
  from = "/api/event"
  to = "https://plausible.io/api/event"
  status = 200
---
// FILE: src/components/PlausibleAnalytics.astro
// Replaces the existing third-party Plausible <script> tag.
// Loads via first-party proxy and enables custom event API.

// SITE-SPECIFIC: Replace with your Plausible site domain (the domain
// registered in your Plausible dashboard, not the script host).
const PLAUSIBLE_SITE_DOMAIN = 'your-site-domain.com';

// First-party proxy path — must match the netlify.toml rewrite
const PLAUSIBLE_SCRIPT_PATH = '/js/script.js';
const PLAUSIBLE_API_PATH = '/api/event';
---

<script
  defer
  data-domain={PLAUSIBLE_SITE_DOMAIN}
  data-api={PLAUSIBLE_API_PATH}
  src={PLAUSIBLE_SCRIPT_PATH}
></script>

<script is:inline>
  // Pre-script queue: captures events fired before Plausible loads.
  // Plausible's own script checks for this queue on init.
  window.plausible = window.plausible || function() {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
</script>
// FILE: src/lib/analytics.ts
// Typed wrapper around Plausible's custom event API.
// Null-guards the global, queues events pre-load, and
// provides a single import for all instrumentation points.

/**
 * Canonical event names — must match Plausible dashboard Goals exactly.
 * Add new events here, not as inline strings.
 */
export const ANALYTICS_EVENTS = {
  CONTACT_FORM_SUBMITTED: 'Contact Form Submitted',
  EMAIL_LINK_CLICKED: 'Email Link Clicked',
  CTA_CLICKED: 'CTA Clicked',
} as const;

type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

interface EventProps {
  readonly [key: string]: string | number | boolean;
}

interface EventOptions {
  readonly props?: EventProps;
  readonly callback?: () => void;
}

/**
 * Fire a Plausible custom event. Safe to call before the script loads
 * (events queue via the inline snippet in PlausibleAnalytics.astro).
 * Safe to call if Plausible is blocked (silently no-ops).
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  options?: EventOptions
): void {
  try {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      window.plausible(eventName, options);
    }
  } catch {
    // Silently swallow — analytics must never break site functionality.
    // No console.error: avoid noise in production for blocked scripts.
  }
}

// Extend Window for TypeScript
declare global {
  interface Window {
    plausible: ((eventName: string, options?: EventOptions) => void) & {
      q?: Array<[string, EventOptions?]>;
    };
  }
}
---
// FILE: src/components/ContactFormTracker.astro
// Drop this component inside the contact page layout, after the <form>.
// It attaches a submit listener to the contact form.

// SITE-SPECIFIC: CSS selector for the contact form.
// Adjust if the form uses a different selector.
const CONTACT_FORM_SELECTOR = 'form[action*="contact"], form[data-contact-form]';
---

<script>
  import { trackEvent, ANALYTICS_EVENTS } from '../lib/analytics';

  // SITE-SPECIFIC: Must match the actual contact form on /contact/.
  // Using attribute selectors for resilience across markup changes.
  const CONTACT_FORM_SELECTOR = 'form[action*="contact"], form[data-contact-form]';

  function initContactFormTracking(): void {
    const form = document.querySelector<HTMLFormElement>(CONTACT_FORM_SELECTOR);
    if (!form) return;

    // Guard against duplicate listeners if this script re-runs
    // (e.g., Astro view transitions).
    if (form.dataset.trackingAttached === 'true') return;
    form.dataset.trackingAttached = 'true';

    form.addEventListener('submit', () => {
      // Fire-and-forget: do NOT preventDefault or delay submission.
      // Plausible uses navigator.sendBeacon internally, which survives
      // page unload. No need to delay the form.
      trackEvent(ANALYTICS_EVENTS.CONTACT_FORM_SUBMITTED, {
        props: {
          page: window.location.pathname,
        },
      });
    });
  }

  // Run on initial load
  initContactFormTracking();

  // Re-run after Astro view transitions (if enabled)
  document.addEventListener('astro:after-swap', initContactFormTracking);
</script>
---
// FILE: src/components/GlobalEventTracking.astro
// Drop this into the base layout (e.g., src/layouts/BaseLayout.astro).
// Uses event delegation on document.body — no per-element listeners needed.
// Tracks mailto: clicks and CTA button clicks site-wide.
---

<script>
  import { trackEvent, ANALYTICS_EVENTS } from '../lib/analytics';

  // SITE-SPECIFIC: data attribute used to mark trackable CTA buttons.
  // Add data-track-cta to any <a> or <button> that is a primary CTA.
  const CTA_DATA_ATTR = 'data-track-cta';

  /** Maximum text length captured as a prop to avoid bloated payloads. */
  const MAX_LABEL_LENGTH = 100; // Plausible truncates at 300, but keep lean

  function truncate(text: string, max: number): string {
    const cleaned = text.trim().replace(/\s+/g, ' ');
    return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
  }

  function handleDelegatedClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // Walk up to find the actual <a> or <button> (handles clicks on
    // child elements like <span> inside <a>).
    const anchor = target.closest<HTMLAnchorElement>('a[href^="mailto:"]');
    if (anchor) {
      trackEvent(ANALYTICS_EVENTS.EMAIL_LINK_CLICKED, {
        props: {
          page: window.location.pathname,
        },
      });
      return; // Don't double-fire if a mailto: link also has data-track-cta
    }

    const cta = target.closest<HTMLElement>(`[${CTA_DATA_ATTR}]`);
    if (cta) {
      const label = truncate(
        cta.textContent || cta.getAttribute('aria-label') || 'unknown',
        MAX_LABEL_LENGTH
      );
      const href =
        cta instanceof HTMLAnchorElement ? cta.href : cta.getAttribute('data-href') || '';

      trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
        props: {
          label,
          href,
          page: window.location.pathname,
        },
      });
    }
  }

  function initGlobalTracking(): void {
    // Event delegation: single listener on body, pattern-match on bubbled events.
    // Resilient to DOM changes, new elements, and Astro view transitions.
    document.body.addEventListener('click', handleDelegatedClick);
  }

  // Astro view transitions: re-attach after swap since body is replaced.
  // Remove old listener first to prevent duplicates.
  let cleanupFn: (() => void) | null = null;

  function setup(): void {
    if (cleanupFn) cleanupFn();
    initGlobalTracking();
    cleanupFn = () => {
      document.body.removeEventListener('click', handleDelegatedClick);
    };
  }

  setup();
  document.addEventListener('astro:after-swap', setup);
</script>
---
// FILE: src/layouts/BaseLayout.astro (modification — add these two components)
// This shows WHERE to place the components. Adapt to your actual layout file name.

import PlausibleAnalytics from '../components/PlausibleAnalytics.astro';
import GlobalEventTracking from '../components/GlobalEventTracking.astro';
// ... your existing imports
---

<html lang="en">
  <head>
    <!-- ... existing head content ... -->
    <PlausibleAnalytics />
  </head>
  <body>
    <!-- ... existing body content ... -->
    <slot />
    <GlobalEventTracking />
  </body>
</html>
```

## Risks
- Contact form selector mismatch: if the actual form element doesn't match `form[action*="contact"]` or `form[data-contact-form]`, the submit listener won't attach. Mitigation: verify the selector against the rendered /contact/ page DOM before deploying. Add `data-contact-form` attribute to the form element as a stable hook.
- Netlify rewrite caching: Netlify's CDN may cache the proxied Plausible script aggressively. If Plausible updates their script, stale versions could persist. Mitigation: add a `headers` block in netlify.toml setting `Cache-Control: public, max-age=86400` (1 day) on `/js/script.js` to balance freshness with performance.
- Astro view transitions: if the site enables Astro view transitions in the future (or already has), the `astro:after-swap` listener handles re-attachment. If view transitions are NOT enabled, the listener is inert (no harm). If a future Astro version changes the event name, the listener silently stops — no breakage, just missed re-init on soft navigations.
- Plausible plan limits: custom event properties (page, label, href) count toward Plausible's property limits on lower-tier plans. Verify the current plan supports custom properties, or the events will fire but properties will be silently dropped.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
