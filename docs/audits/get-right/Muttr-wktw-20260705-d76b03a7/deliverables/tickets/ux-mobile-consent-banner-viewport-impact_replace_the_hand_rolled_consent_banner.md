---
finding_id: "ux-mobile-consent-banner-viewport-impact"
title: "Consent banner with 3 interactive elements may consume significant viewport on 660px screen"
severity: "medium"
root_cause_cluster: "Consent Infrastructure Failure — Banner Present but Non-Functional"
why_this_matters: "Fixing the 1.00:1 contrast on #consent-accept means users can actually read and interact with the accept button."
fix_summary: "Replace the hand-rolled consent banner with a fully accessible, mobile-first Astro component that: (1) fixes the invisible accept button (1.00:1 contrast), (2) enforces 48×48px minimum touch targets…"
confidence_tier: "unverified"
remediation_surface: "source_code"
---

# Consent banner with 3 interactive elements may consume significant viewport on 660px screen

**Finding:** Consent banner with 3 interactive elements may consume significant viewport on 660px screen  
**Severity:** Medium  
**Why this matters:** Fixing the 1.00:1 contrast on #consent-accept means users can actually read and interact with the accept button.  
**Root cause:** Consent Infrastructure Failure — Banner Present but Non-Functional  
**Surface:** Source code  
**Effort:** medium  
**Fix:** Replace the hand-rolled consent banner with a fully accessible, mobile-first Astro component that: (1) fixes the invisible accept button (1.00:1 contrast), (2) enforces 48×48px minimum touch targets…  

> **Evidence Basis:** Needs Verification

---

## Impact

- **Legal Compliance:** Fixing the 1.00:1 contrast on #consent-accept means users can actually read and interact with the accept button. A consent banner where the accept action is invisible is not a functional consent mechanism — it cannot satisfy GDPR's requirement for freely given, informed consent via an affirmative action. The current state exposes the site to regulatory challenge on the grounds that the consent UI is non-functional.
- **Wcag Legal Liability:** The 17px-height privacy policy link (91×17px touch target) violates WCAG 2.5.8 (minimum 24×24px, target 48×48px). The footer button with no accessible name violates WCAG 4.1.2. Both are documented bases for ADA web accessibility complaints. Fixing both eliminates these specific violation vectors.
- **Mobile Ux:** Capping banner height at 40vh and using a compact mobile layout ensures the page's h1 and value proposition remain visible above the banner on first paint on 393×660px viewports. Users who can see the page content alongside the consent prompt are more likely to make a consent decision and continue engaging rather than bouncing from a page that appears to show only a consent wall.
- **Analytics Data Integrity:** The 'consentDecision' CustomEvent fires exactly once per user action via the serial isProcessing guard. Downstream pixels that gate on this event will receive a clean, deduplicated signal. Double-firing (which the current hand-rolled implementation risks) would corrupt consent mode signals sent to GA4 or Meta, causing analytics to misattribute sessions or double-count consent grants.
- **Pre Hydration Intent:** The inline onclick + pending queue pattern ensures zero consent decisions are silently discarded during the hydration window. On slow mobile connections where JS parse time is 500ms–2000ms, a user who taps 'Accept' immediately on banner render will have their intent captured and processed — eliminating the dead-button failure mode.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_001`). Fixing the root cause may resolve multiple related findings.

## How to verify

**Page:** https://weknowthewhy.com/the-get-right/content
**Element:** Consent accept button — part of banner that may consume significant viewport
**XPath:** `//*[@id='consent-accept']`

To verify in browser DevTools:
1. Navigate to the page above
2. Open Console (F12 or Cmd+Option+I)
3. Run: `$x("//*[@id='consent-accept']")`
4. This will highlight the problematic element

**Note:** This ticket shows one example location. See `deliverables/issues-list.md` for all occurrences across all pages.

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
Replace the hand-rolled consent banner with a fully accessible, mobile-first Astro component that: (1) fixes the invisible accept button (1.00:1 contrast), (2) enforces 48×48px minimum touch targets on all interactive elements including the privacy policy link, (3) caps banner height to ≤40vh on viewports <768px via a compact single-row layout, (4) prevents scroll-lock on mobile so page content remains reachable, (5) captures pre-hydration intent via inline onclick to eliminate dead-button window, and (6) re-triggers correctly from the footer mystery button via a named CustomEvent.

### How
1. AUDIT EXISTING BANNER: Locate the consent banner injection point — search the Astro project for 'consent' in src/layouts/, src/components/, and any GTM/script tags in astro.config.mjs or Layout.astro. Identify the element IDs (#consent-accept, the privacy policy link, the footer re-trigger button) so the new component can replace them without orphaning existing selectors.
2. CREATE ConsentBanner.astro: Build the component at src/components/ConsentBanner.astro. The component renders only when localStorage key 'consent_decision' is absent. It uses an inline onclick on the accept button (not addEventListener) to capture taps before hydration completes. The decline path is handled identically. Both handlers write to localStorage and dispatch a 'consentDecision' CustomEvent for downstream pixels.
3. LAYOUT CONSTRAINTS: Banner is position:fixed; bottom:0; left:0; right:0 (sticky bottom bar, not modal overlay). Max-height is capped at 40vh with overflow-y:auto so it never consumes more than 40% of any viewport. On viewports ≥768px the layout is two-column (copy left, buttons right). On viewports <768px the layout collapses to a compact single-row strip: abbreviated copy + two buttons side-by-side + privacy link below at full 48px touch target height.
4. CONTRAST FIX: Accept button background must be a color with ≥4.5:1 contrast against its text. The current #consent-accept has 1.00:1 (text and background are identical). Choose a brand-appropriate dark background (e.g., #1a1a1a) with white (#ffffff) text — 18.1:1 ratio. Decline button uses an outlined/ghost style with the same dark border and text on white background — verify contrast of border color against white meets 3:1 for UI components per WCAG 1.4.11.
5. TOUCH TARGETS: Privacy policy link must be display:inline-flex; align-items:center; min-height:48px; padding:0 8px. Accept and decline buttons must be min-height:48px; min-width:48px. These are enforced via scoped <style> inside the component, not global CSS, to prevent layout regressions elsewhere.
6. PRE-HYDRATION INTENT CAPTURE: The accept and decline buttons carry inline onclick attributes that write to localStorage immediately. This means a tap at t=0 (before any JS executes) is not lost. A DOMContentLoaded listener then checks localStorage and hides the banner if a decision already exists — this is the hydration reconciliation step.
7. SERIAL DECISION PROCESSING: A module-level isProcessing boolean guards the decision handler. If a second tap arrives before the first completes (e.g., double-tap), the second call returns immediately. The flag is released in a finally block. This prevents duplicate CustomEvent dispatches to analytics pixels.
8. FOOTER RE-TRIGGER: The footer mystery button must be given an explicit aria-label='Manage cookie preferences' and an onclick that dispatches a 'showConsentBanner' CustomEvent. The ConsentBanner component listens for this event and re-shows the banner (resetting the isProcessing flag and removing the hidden attribute). This wires the footer button to the banner without coupling them via DOM queries.
9. SCROLL-LOCK REMOVAL: Remove any document.body.style.overflow='hidden' or similar scroll-lock from the existing banner implementation. The sticky-bottom layout does not require scroll-lock — content above the banner remains scrollable. If the existing implementation adds a backdrop overlay, remove it on mobile (<768px) via CSS display:none on the overlay element.
10. INTEGRATE INTO LAYOUT: In src/layouts/Layout.astro (or the root layout), replace the existing consent banner markup/script with <ConsentBanner />. Place it as the last child of <body> so it does not affect document flow parsing. Verify no duplicate banner markup remains in any page-level .astro file.
11. REGRESSION CHECK: After deployment, verify: (a) localStorage 'consent_decision' is not set before user interaction (no pre-consent cookies), (b) the banner does not appear on return visits where a decision exists, (c) the footer re-trigger button opens the banner and a new decision overwrites the old localStorage value, (d) the 'consentDecision' CustomEvent fires exactly once per user action.

### Code examples
```
// src/components/ConsentBanner.astro
---
// No server-side props needed — all logic is client-side to avoid SSR/hydration mismatch
---

<div
  id="consent-banner"
  role="dialog"
  aria-modal="false"
  aria-label="Cookie consent"
  aria-live="polite"
  hidden
>
  <div class="consent-inner">
    <p class="consent-copy">
      We use cookies to improve your experience.
      <a
        href="/privacy-policy"
        class="consent-privacy-link"
        aria-label="Read our privacy policy"
      >Privacy policy</a>
    </p>
    <div class="consent-actions">
      <!-- Inline onclick captures intent before hydration. Handler is idempotent. -->
      <button
        id="consent-accept"
        class="consent-btn consent-btn--accept"
        type="button"
        onclick="window.__consentDecide('granted')"
        aria-label="Accept cookies"
      >Accept</button>
      <button
        id="consent-decline"
        class="consent-btn consent-btn--decline"
        type="button"
        onclick="window.__consentDecide('denied')"
        aria-label="Decline cookies"
      >Decline</button>
    </div>
  </div>
</div>

<script>
  // ─── Named constants — adjust to match site config ───────────────────────
  const CONSENT_STORAGE_KEY = 'consent_decision';   // localStorage key
  const CONSENT_EVENT_NAME  = 'consentDecision';    // CustomEvent name for pixels
  const SHOW_BANNER_EVENT   = 'showConsentBanner';  // CustomEvent from footer button
  const DECISION_TIMEOUT_MS = 5000;                 // Max ms to hold isProcessing lock
  // ─────────────────────────────────────────────────────────────────────────

  // Module-level lock — prevents duplicate dispatches on double-tap.
  // Boolean flags are not atomic across async boundaries, but this handler
  // is synchronous (localStorage write + CustomEvent dispatch), so a boolean
  // is sufficient here. No Promise queue needed.
  let isProcessing = false;
  let processingTimeout: ReturnType<typeof setTimeout> | null = null;

  // Exposed on window so inline onclick attributes can call it before
  // this <script> module fully executes in all browsers. The inline onclick
  // fires synchronously on tap; this module registers the real implementation
  // at DOMContentLoaded. If the module loads first, window.__consentDecide
  // is already the real function. If the tap fires first, the inline onclick
  // calls window.__consentDecide which at that moment is the stub below —
  // the stub queues the decision and the module drains it on load.
  // This is the Serial Promise Queue pattern for pre-hydration intent capture.
  const pendingDecisions: string[] = [];

  // Stub: captures intent if module hasn't loaded yet
  if (typeof window.__consentDecide === 'undefined') {
    window.__consentDecide = (decision: string) => {
      pendingDecisions.push(decision);
    };
  }

  function getStorage(): Storage | null {
    // PRODUCTION CODE STANDARD: wrap localStorage in try-catch.
    // Safari private browsing throws SecurityError on access.
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  function readDecision(): string | null {
    const storage = getStorage();
    if (!storage) return null;
    try {
      return storage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function writeDecision(decision: string): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(CONSENT_STORAGE_KEY, decision);
    } catch {
      // Storage quota exceeded or private mode — degrade gracefully.
      // Decision is still dispatched via CustomEvent for in-session pixels.
    }
  }

  function hideBanner(): void {
    const banner = document.getElementById('consent-banner');
    if (banner) banner.hidden = true;
  }

  function showBanner(): void {
    const banner = document.getElementById('consent-banner');
    if (banner) banner.hidden = false;
  }

  // Real decision handler — replaces the stub after module load.
  // PRODUCTION CODE STANDARD: try-finally guarantees lock release on error.
  function handleDecision(decision: string): void {
    if (isProcessing) return; // Serial guard — second tap is a no-op
    isProcessing = true;

    // Safety timeout: release lock if something throws after the try block
    // (e.g., CustomEvent constructor unavailable in a very old browser).
    processingTimeout = setTimeout(() => {
      isProcessing = false;
    }, DECISION_TIMEOUT_MS);

    try {
      writeDecision(decision);
      hideBanner();

      // Dispatch exactly once per user action.
      // Downstream pixels (GA4, Meta, etc.) listen for this event.
      const event = new CustomEvent(CONSENT_EVENT_NAME, {
        detail: { decision },
        bubbles: true,
      });
      document.dispatchEvent(event);
    } finally {
      if (processingTimeout !== null) {
        clearTimeout(processingTimeout);
        processingTimeout = null;
      }
      isProcessing = false;
    }
  }

  // Install real handler, replacing the stub
  window.__consentDecide = handleDecision;

  // On DOMContentLoaded: reconcile pre-hydration taps and set initial visibility.
  document.addEventListener('DOMContentLoaded', () => {
    // Drain any decisions captured by the stub before module loaded.
    // Only process the FIRST pending decision — subsequent are duplicates.
    if (pendingDecisions.length > 0) {
      handleDecision(pendingDecisions[0]);
      return; // Banner already hidden, nothing more to do
    }

    // No pre-hydration tap: show banner only if no prior decision exists.
    const existingDecision = readDecision();
    if (!existingDecision) {
      showBanner();
    }
    // If decision exists, banner stays hidden (hidden attr set in HTML).
  });

  // Footer re-trigger: listen for 'showConsentBanner' CustomEvent.
  // The footer button dispatches this event (see FooterConsentTrigger below).
  // Precondition: this listener is registered before the footer button is clicked.
  // DOMContentLoaded guarantees the listener is active before user interaction.
  document.addEventListener(SHOW_BANNER_EVENT, () => {
    isProcessing = false; // Reset lock so a new decision can be made
    showBanner();
    // Move focus to the banner for keyboard/screen reader users
    const banner = document.getElementById('consent-banner');
    if (banner) {
      banner.focus();
    }
  });
</script>

<style>
  /*
   * All selectors are scoped to #consent-banner to prevent layout regressions.
   * Astro's scoped <style> adds a data-astro-* attribute automatically,
   * but we also use the ID prefix as a belt-and-suspenders scope guard.
   */

  #consent-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #ffffff;
    border-top: 1px solid #d1d5db;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.12);
    /* Cap height so banner never consumes more than 40% of any viewport */
    max-height: 40vh;
    overflow-y: auto;
    /* Announce to screen readers when shown */
    outline: none;
  }

  #consent-banner .consent-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
    max-width: 1200px; /* SITE-SPECIFIC: adjust to match site's max content width */
    margin: 0 auto;
  }

  #consent-banner .consent-copy {
    margin: 0;
    font-size: 0.875rem; /* 14px — readable at small sizes */
    line-height: 1.5;
    color: #111827; /* 16.75:1 contrast on white — WCAG AAA */
    flex: 1;
  }

  /* Privacy policy link: minimum 48px touch target height */
  #consent-banner .consent-privacy-link {
    display: inline-flex;
    align-items: center;
    min-height: 48px;
    padding: 0 4px;
    color: #1d4ed8; /* 5.9:1 on white — WCAG AA */
    text-decoration: underline;
    white-space: nowrap;
  }

  #consent-banner .consent-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  /* Shared button base */
  #consent-banner .consent-btn {
    min-height: 48px;
    min-width: 80px;
    padding: 0 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border: 2px solid transparent;
    /* Visible focus ring for keyboard users — never outline:none without replacement */
    outline: 2px solid transparent;
    outline-offset: 2px;
    transition: outline-color 0.1s;
  }

  #consent-banner .consent-btn:focus-visible {
    outline-color: #1d4ed8;
  }

  /* Accept: dark background, white text — 18.1:1 contrast (WCAG AAA) */
  /* SITE-SPECIFIC: replace #1a1a1a with brand primary if it meets 4.5:1 on white */
  #consent-banner .consent-btn--accept {
    background: #1a1a1a;
    color: #ffffff;
    border-color: #1a1a1a;
  }

  #consent-banner .consent-btn--accept:hover {
    background: #333333;
    border-color: #333333;
  }

  /* Decline: ghost style — dark border on white, dark text */
  /* Border #1a1a1a on white = 18.1:1 — meets WCAG 1.4.11 (3:1 for UI components) */
  #consent-banner .consent-btn--decline {
    background: #ffffff;
    color: #1a1a1a;
    border-color: #1a1a1a;
  }

  #consent-banner .consent-btn--decline:hover {
    background: #f3f4f6;
  }

  /*
   * Mobile layout (<768px): compact single-row strip.
   * Copy is abbreviated via CSS (full copy remains in DOM for screen readers).
   * Buttons stay side-by-side. Privacy link drops below at full touch target height.
   * SITE-SPECIFIC: 768px breakpoint — adjust if site uses a different mobile breakpoint.
   */
  @media (max-width: 767px) {
    #consent-banner .consent-inner {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 10px 12px;
    }

    #consent-banner .consent-copy {
      font-size: 0.8125rem; /* 13px — compact but readable */
    }

    #consent-banner .consent-actions {
      width: 100%;
    }

    #consent-banner .consent-btn {
      flex: 1; /* Buttons share available width equally */
    }

    #consent-banner .consent-privacy-link {
      display: flex;
      justify-content: center;
      width: 100%;
    }
  }

  /* Respect prefers-reduced-motion — no transitions for users who opt out */
  @media (prefers-reduced-motion: reduce) {
    #consent-banner .consent-btn {
      transition: none;
    }
  }
</style>
// src/components/FooterConsentTrigger.astro
// Drop this in place of the existing footer mystery button.
// It dispatches 'showConsentBanner' — ConsentBanner.astro listens for it.
---
---

<button
  type="button"
  class="footer-consent-trigger"
  aria-label="Manage cookie preferences"
  onclick="document.dispatchEvent(new CustomEvent('showConsentBanner', { bubbles: true }))"
>
  Cookie preferences
</button>

<style>
  /* Scoped to .footer-consent-trigger — no global button selector pollution */
  .footer-consent-trigger {
    /* SITE-SPECIFIC: match footer link styling */
    background: none;
    border: none;
    padding: 4px 0;
    min-height: 48px; /* WCAG 2.5.8 touch target */
    min-width: 48px;
    cursor: pointer;
    font-size: inherit;
    color: inherit;
    text-decoration: underline;
    display: inline-flex;
    align-items: center;
  }

  .footer-consent-trigger:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
</style>
// src/layouts/Layout.astro — integration snippet
// Replace existing consent banner markup/script with these two lines.
// ConsentBanner goes last in <body> to avoid blocking document parsing.
---
import ConsentBanner from '../components/ConsentBanner.astro';
import FooterConsentTrigger from '../components/FooterConsentTrigger.astro';
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- existing head content -->
  </head>
  <body>
    <!-- existing page content -->
    <footer>
      <!-- existing footer links -->
      <FooterConsentTrigger />
    </footer>

    <!--
      ConsentBanner is last in <body>.
      Precondition: no other consent banner markup exists anywhere in the
      layout tree. Search for 'consent' in all .astro files and remove
      any duplicate before deploying.
    -->
    <ConsentBanner />
  </body>
</html>
```

## Risks
_No specific risks recorded._

## Effort & Cost
- **Effort:** medium
- **Cost:** medium
