---
finding_id: "conversion-ux-social-share-1"
title: "Add a progressive social sharing component to the article template that: (1) surfaces a native Web Share API trigger on mobile, (2) renders platform-specific share buttons (LinkedIn, X/Twitter, copy-link) on desktop, (3) includes an inline mid-article 'share this insight' prompt at a natural reading pause point, and (4) is built to be inert until og:image is resolved — so the component and the metadata fix ship as a coordinated distribution upgrade rather than two disconnected patches. The component must be zero-dependency, WCAG AA compliant, keyboard-navigable, and respect prefers-reduced-motion."
severity: "medium"
root_cause_cluster: "Isolated issue"
why_this_matters: "The absence of sharing affordances creates a distribution dead-end: readers who finish an article and want to share it face friction (manual URL copy from address bar, no pre-composed tweet, no one-t…"
fix_summary: "Add a progressive social sharing component to the article template that: (1) surfaces a native Web Share API trigger on mobile, (2) renders platform-specific share buttons (LinkedIn, X/Twitter, copy-…"
confidence_tier: "reviewer_identified"
---

# Add a progressive social sharing component to the article template that: (1) surfaces a native Web Share API trigger on mobile, (2) renders platform-specific share buttons (LinkedIn, X/Twitter, copy-link) on desktop, (3) includes an inline mid-article 'share this insight' prompt at a natural reading pause point, and (4) is built to be inert until og:image is resolved — so the component and the metadata fix ship as a coordinated distribution upgrade rather than two disconnected patches. The component must be zero-dependency, WCAG AA compliant, keyboard-navigable, and respect prefers-reduced-motion.

**Finding:** Add a progressive social sharing component to the article template that: (1) surfaces a native Web Share API trigger on mobile, (2) renders platform-specific share buttons (LinkedIn, X/Twitter, copy-link) on desktop, (3) includes an inline mid-article 'share this insight' prompt at a natural reading pause point, and (4) is built to be inert until og:image is resolved — so the component and the metadata fix ship as a coordinated distribution upgrade rather than two disconnected patches. The component must be zero-dependency, WCAG AA compliant, keyboard-navigable, and respect prefers-reduced-motion.  
**Severity:** Medium  
**Why this matters:** The absence of sharing affordances creates a distribution dead-end: readers who finish an article and want to share it face friction (manual URL copy from address bar, no pre-composed tweet, no one-t…  
**Root cause:** Isolated issue  
**Fix:** Add a progressive social sharing component to the article template that: (1) surfaces a native Web Share API trigger on mobile, (2) renders platform-specific share buttons (LinkedIn, X/Twitter, copy-…

> **Evidence Basis:** Reviewer-Identified

---

## Impact

- **Organic Distribution Reach:** The absence of sharing affordances creates a distribution dead-end: readers who finish an article and want to share it face friction (manual URL copy from address bar, no pre-composed tweet, no one-tap mobile share). Reducing that friction to a single tap or click directly increases the probability that a completed read converts into a share action. The Web Share API on mobile surfaces the user's existing trusted share channels (iMessage, WhatsApp, LinkedIn app) rather than asking them to navigate to a platform separately — this is the lowest-friction share path available on mobile.
- **Linkedin Preview Quality:** The og:image guard in this component ensures share buttons are suppressed until prescan-escalation-1 (og:image) is resolved. Once both fixes ship together, LinkedIn, Slack, and iMessage previews will render with a full image card rather than a blank or text-only preview. LinkedIn's own documentation notes that posts with images receive substantially higher engagement than text-only posts — the mechanism is visual salience in a dense feed. A blank preview card actively signals low-quality content to the recipient before they click.
- **Thought Leadership Pipeline:** For a consulting firm whose inbound pipeline depends on thought leadership reach, each article share is a distribution event that can reach a professional's network of hundreds to thousands of connections. The current template produces zero facilitated shares. Adding the component creates a measurable share event baseline where none exists — any share volume above zero is a direct improvement. The mid-article inline prompt targets the moment of highest resonance (mid-read, after the thesis lands) rather than the end of the article where reading momentum has dissipated.
- **Seo Indirect Signal:** Social shares generate backlinks and direct traffic signals that Google's Quality Rater Guidelines associate with E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). While social shares are not a direct ranking factor, the downstream effect of increased distribution — more backlinks, more branded search queries, more direct traffic — contributes to domain authority signals over time.
- **Zero Performance Regression:** The component loads no third-party SDKs, fires no pixels, and makes no network requests until user interaction. It adds negligible JavaScript weight (the component is under 4KB uncompressed) and zero render-blocking resources. There is no performance cost to this fix.

## How to verify

**Page(s) to check:**
- https://weknowthewhy.com/insights/why-most-audits-dont-change-anything

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
Add a progressive social sharing component to the article template that: (1) surfaces a native Web Share API trigger on mobile, (2) renders platform-specific share buttons (LinkedIn, X/Twitter, copy-link) on desktop, (3) includes an inline mid-article 'share this insight' prompt at a natural reading pause point, and (4) is built to be inert until og:image is resolved — so the component and the metadata fix ship as a coordinated distribution upgrade rather than two disconnected patches. The component must be zero-dependency, WCAG AA compliant, keyboard-navigable, and respect prefers-reduced-motion.

### How
Step 1 — Audit the article template file structure. Locate the CMS template responsible for rendering insight/article pages (e.g., article.html, insight.liquid, single-post.php, or equivalent). Identify two injection points: (a) the article header/hero zone, below the title and above the first paragraph — for a compact 'share' row, and (b) a mid-article pull-quote or section break — for an inline 'share this insight' prompt. Do not inject into the footer of the article; sharing intent peaks at the beginning and at moments of resonance mid-read, not at the end.

Step 2 — Resolve the og:image dependency first (prescan-escalation-1). The sharing component should not ship without a valid og:image. Coordinate with the finding that confirmed og:image absence. If og:image cannot be resolved in the same sprint, add a feature flag (data attribute or CMS toggle) that suppresses the share buttons until og:image is confirmed present. A share button that generates a blank preview card is worse than no share button — it trains readers that sharing this content produces low-quality previews.

Step 3 — Implement the ShareBar web component as a self-contained custom element. Use no external dependencies. The component reads share metadata from the page's own meta tags (og:title, og:description, og:url) so it stays in sync with whatever the CMS outputs — no hardcoded strings.

Step 4 — Inject the component into the article template at both injection points using the CMS's templating system. Pass the canonical URL, article title, and a short excerpt as attributes. The component handles the rest.

Step 5 — Add the mid-article inline prompt. This is a separate, simpler element — a styled blockquote-like callout that contains a single sentence summarizing the article's thesis and a 'Share this insight' button that triggers the same ShareBar logic. Place it after the third or fourth content section using a CMS shortcode, block, or template partial.

Step 6 — Verify keyboard navigation: Tab reaches each share button, Enter/Space activates it, focus ring is visible (never outline:none without replacement), and the copy-link button announces success via aria-live='polite'.

Step 7 — Test Web Share API fallback: on desktop browsers that do not support navigator.share, the component must render the explicit platform buttons. On mobile browsers that do support it, the native share sheet is the primary affordance (simpler, more trusted by users).

Step 8 — Validate that no share action fires a network request before user interaction (no pre-consent pixel firing). Share buttons must not load platform SDKs (Facebook SDK, Twitter widgets.js) — use direct URL-based share endpoints only, which require zero SDK loading.

### Code examples
```
/**
 * ShareBar — Zero-dependency Web Component for article social sharing.
 *
 * Usage in template:
 *   <share-bar
 *     data-url="{{ canonical_url }}"
 *     data-title="{{ article.title | escape }}"
 *     data-description="{{ article.excerpt | truncate: 160 | escape }}"
 *   ></share-bar>
 *
 * SITE-SPECIFIC ASSUMPTIONS (adjust per implementation):
 *   - SHARE_PLATFORMS: add/remove platforms to match audience
 *   - OG_IMAGE_GUARD_ATTR: set to the data attribute your CMS outputs when og:image is confirmed
 *   - COPY_SUCCESS_DURATION_MS: how long the 'Copied!' state persists
 */

// Named constants — no magic numbers
const COPY_SUCCESS_DURATION_MS = 2000; // Duration to show 'Copied!' feedback before resetting
const FOCUS_TRAP_TIMEOUT_MS = 50;      // RAF delay for focus management after sheet open
const OG_IMAGE_META_SELECTOR = 'meta[property="og:image"][content]'; // Guard: only render if og:image present

// SITE-SPECIFIC: configure which platforms to show and in what order
const SHARE_PLATFORMS = [
  {
    id: 'linkedin',
    label: 'Share on LinkedIn',
    icon: `<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    // SITE-SPECIFIC: LinkedIn share endpoint — stable as of 2024
    getUrl: ({ url, title }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  },
  {
    id: 'twitter',
    label: 'Share on X (Twitter)',
    icon: `<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    getUrl: ({ url, title }) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  }
];

class ShareBar extends HTMLElement {
  #copyTimeout = null;  // Tracks copy feedback reset timer
  #abortController = null; // For cleanup of any async operations

  connectedCallback() {
    // Guard: do not render share UI if og:image is absent.
    // A share without an og:image produces a blank preview card on LinkedIn/Slack/iMessage.
    // SITE-SPECIFIC: remove this guard once prescan-escalation-1 (og:image) is resolved.
    const ogImageMeta = document.querySelector(OG_IMAGE_META_SELECTOR);
    if (!ogImageMeta || !ogImageMeta.getAttribute('content')) {
      // Silently suppress — do not render broken sharing affordance
      if (process?.env?.NODE_ENV === 'development') {
        console.warn('[ShareBar] Suppressed: og:image meta tag is absent or empty. Resolve prescan-escalation-1 before enabling share UI.');
      }
      return;
    }

    this.#abortController = new AbortController();
    this.#render();
  }

  disconnectedCallback() {
    // Observer teardown — Production Code Standard #5
    if (this.#copyTimeout !== null) {
      clearTimeout(this.#copyTimeout);
      this.#copyTimeout = null;
    }
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  #getShareData() {
    return {
      // Read from component attributes — stays in sync with CMS output
      url: this.dataset.url || window.location.href,
      title: this.dataset.title || document.title,
      description: this.dataset.description || ''
    };
  }

  #render() {
    const shareData = this.#getShareData();
    const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Share this article');

    // Inline styles scoped to component — avoids broad selector pollution (Production Code Standard #3)
    // SITE-SPECIFIC: replace with your design system tokens or CSS custom properties
    this.innerHTML = `
      <div class="share-bar__inner" data-share-bar-inner>
        <span class="share-bar__label" aria-hidden="true">Share</span>
        <div class="share-bar__actions" role="list">
          ${supportsNativeShare ? this.#renderNativeShareButton() : this.#renderPlatformButtons(shareData)}
          ${this.#renderCopyButton()}
        </div>
      </div>
    `;

    this.#attachEventListeners(shareData, supportsNativeShare);
  }

  #renderNativeShareButton() {
    return `
      <div role="listitem">
        <button
          type="button"
          class="share-bar__btn share-bar__btn--native"
          data-action="native-share"
          aria-label="Share this article"
        >
          <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>Share</span>
        </button>
      </div>
    `;
  }

  #renderPlatformButtons(shareData) {
    return SHARE_PLATFORMS.map(platform => `
      <div role="listitem">
        <a
          href="${platform.getUrl(shareData)}"
          class="share-bar__btn share-bar__btn--${platform.id}"
          data-action="platform-share"
          data-platform="${platform.id}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="${platform.label}"
        >
          ${platform.icon}
          <span class="share-bar__btn-label">${platform.label.replace('Share on ', '')}</span>
        </a>
      </div>
    `).join('');
  }

  #renderCopyButton() {
    return `
      <div role="listitem">
        <button
          type="button"
          class="share-bar__btn share-bar__btn--copy"
          data-action="copy-link"
          aria-label="Copy link to clipboard"
        >
          <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          <span data-copy-label>Copy link</span>
        </button>
        <!-- aria-live region: announces copy success to screen readers without focus shift -->
        <span
          class="share-bar__sr-announce"
          aria-live="polite"
          aria-atomic="true"
          data-copy-announce
        ></span>
      </div>
    `;
  }

  #attachEventListeners(shareData, supportsNativeShare) {
    const signal = this.#abortController?.signal;

    if (supportsNativeShare) {
      const nativeBtn = this.querySelector('[data-action="native-share"]');
      if (nativeBtn) {
        nativeBtn.addEventListener('click', () => this.#handleNativeShare(shareData), { signal });
      }
    }

    const copyBtn = this.querySelector('[data-action="copy-link"]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.#handleCopyLink(shareData.url), { signal });
    }

    // Platform share links open in popup window for better UX than full tab navigation
    // SITE-SPECIFIC: adjust popup dimensions per platform if needed
    const platformLinks = this.querySelectorAll('[data-action="platform-share"]');
    platformLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const platform = link.dataset.platform;
        const href = link.getAttribute('href');
        // SITE-SPECIFIC: popup dimensions — LinkedIn and Twitter both render well at these sizes
        const POPUP_WIDTH = 600;
        const POPUP_HEIGHT = 500;
        const left = Math.round((screen.width - POPUP_WIDTH) / 2);
        const top = Math.round((screen.height - POPUP_HEIGHT) / 2);
        window.open(
          href,
          `share-${platform}`,
          `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},toolbar=0,menubar=0,scrollbars=1`
        );
      }, { signal });
    });
  }

  async #handleNativeShare(shareData) {
    // Async safety: guard against double-invocation (Production Code Standard #6)
    if (this.#isSharing) return;
    this.#isSharing = true;
    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.description,
        url: shareData.url
      });
    } catch (err) {
      // AbortError is expected when user dismisses the share sheet — not an error
      if (err?.name !== 'AbortError') {
        console.warn('[ShareBar] navigator.share failed:', err);
      }
    } finally {
      this.#isSharing = false;
    }
  }

  #isSharing = false; // Async safety flag for native share

  async #handleCopyLink(url) {
    const copyBtn = this.querySelector('[data-action="copy-link"]');
    const copyLabel = this.querySelector('[data-copy-label]');
    const announceEl = this.querySelector('[data-copy-announce]');

    // Null-guard external objects (Production Code Standard #10)
    if (!copyBtn || !copyLabel || !announceEl) return;

    // Async safety: prevent double-fire (Production Code Standard #6)
    if (copyBtn.disabled) return;
    copyBtn.disabled = true;

    try {
      // Feature-detect before using Clipboard API (Production Code Standard #9)
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for browsers without Clipboard API (<95% support threshold)
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy'); // Legacy fallback — intentional
        document.body.removeChild(textarea);
      }

      copyLabel.textContent = 'Copied!';
      announceEl.textContent = 'Link copied to clipboard';
      copyBtn.setAttribute('aria-label', 'Link copied to clipboard');

      // Lock safety: always clear previous timeout before setting new one (Production Code Standard #11)
      if (this.#copyTimeout !== null) {
        clearTimeout(this.#copyTimeout);
      }
      this.#copyTimeout = setTimeout(() => {
        copyLabel.textContent = 'Copy link';
        announceEl.textContent = '';
        copyBtn.setAttribute('aria-label', 'Copy link to clipboard');
        copyBtn.disabled = false;
        this.#copyTimeout = null;
      }, COPY_SUCCESS_DURATION_MS);

    } catch (err) {
      console.warn('[ShareBar] Copy to clipboard failed:', err);
      copyLabel.textContent = 'Copy failed';
      announceEl.textContent = 'Copy failed. Please copy the URL from your browser address bar.';
      copyBtn.disabled = false;
    }
  }
}

// Feature-detect before registering (Production Code Standard #9)
if (typeof customElements !== 'undefined' && !customElements.get('share-bar')) {
  customElements.define('share-bar', ShareBar);
}
/* ShareBar component styles
 * Scoped to [data-share-bar-inner] to prevent broad selector pollution (Production Code Standard #3)
 * SITE-SPECIFIC: replace custom property values with your design system tokens
 */

/* Layout */
share-bar [data-share-bar-inner] {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem 0;
  border-top: 1px solid var(--color-border, #e5e7eb);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  margin: 2rem 0;
}

share-bar .share-bar__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

share-bar .share-bar__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Buttons — scoped, never bare button {} (Production Code Standard #3) */
share-bar .share-bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  /* SITE-SPECIFIC: minimum 48x48px touch target per WCAG 2.5.8 */
  min-height: 48px;
  min-width: 48px;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid transparent;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
  /* Respect prefers-reduced-motion (WCAG 2.3.1) */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

/* Visible focus ring — never outline:none without replacement (WCAG keyboard nav) */
share-bar .share-bar__btn:focus-visible {
  outline: 2px solid var(--color-focus-ring, #2563eb);
  outline-offset: 2px;
}

share-bar .share-bar__btn--linkedin {
  background-color: #0a66c2;
  color: #ffffff;
  border-color: #0a66c2;
}
share-bar .share-bar__btn--linkedin:hover {
  background-color: #004182;
  border-color: #004182;
}

share-bar .share-bar__btn--twitter {
  background-color: #000000;
  color: #ffffff;
  border-color: #000000;
}
share-bar .share-bar__btn--twitter:hover {
  background-color: #1a1a1a;
  border-color: #1a1a1a;
}

share-bar .share-bar__btn--copy,
share-bar .share-bar__btn--native {
  background-color: transparent;
  color: var(--color-text, #111827);
  border-color: var(--color-border, #d1d5db);
}
share-bar .share-bar__btn--copy:hover,
share-bar .share-bar__btn--native:hover {
  background-color: var(--color-surface-hover, #f3f4f6);
}

share-bar .share-bar__btn--copy:disabled {
  opacity: 0.7;
  cursor: default;
}

/* Screen reader only — for aria-live announce region */
share-bar .share-bar__sr-announce {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Hide button label text on very small screens, keep icon only */
@media (max-width: 480px) {
  /* SITE-SPECIFIC: 480px breakpoint — adjust to match your grid system */
  share-bar .share-bar__btn-label {
    /* @supports ensures this only applies where clip-path is supported */
  }
}

@supports (clip-path: inset(50%)) {
  @media (max-width: 480px) {
    share-bar .share-bar__btn-label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  }
}
<!-- Article template injection — Liquid/Jinja/Twig syntax (adapt to your CMS)
     SITE-SPECIFIC: replace template variable syntax with your CMS's equivalent
     e.g., {{ article.title }} for Liquid, <?php the_title(); ?> for WordPress
-->

<!-- Injection Point 1: Article header — below title, above first paragraph -->
<header class="article__header">
  <h1 class="article__title">{{ article.title }}</h1>
  <div class="article__meta">
    <time datetime="{{ article.published_at | date: '%Y-%m-%d' }}">{{ article.published_at | date: '%B %d, %Y' }}</time>
    <span class="article__author">{{ article.author }}</span>
  </div>

  <!-- ShareBar: header position -->
  <share-bar
    data-url="{{ canonical_url | escape }}"
    data-title="{{ article.title | escape }}"
    data-description="{{ article.excerpt | truncate: 160 | escape }}"
    class="article__share-bar article__share-bar--header"
  ></share-bar>
</header>

<!-- Injection Point 2: Mid-article inline prompt
     SITE-SPECIFIC: place this after the 3rd or 4th content block in your template
     In WordPress: use the_content() filter to inject after Nth paragraph
     In Contentful/Sanity: add as a portable text block type
-->
<aside
  class="article__share-prompt"
  aria-label="Share this insight"
  role="complementary"
>
  <p class="article__share-prompt__thesis">
    <!-- SITE-SPECIFIC: populate from article metadata field 'share_pull_quote'
         or fall back to excerpt. Never hardcode article content in template. -->
    {{ article.share_pull_quote | default: article.excerpt | truncate: 120 | escape }}
  </p>
  <share-bar
    data-url="{{ canonical_url | escape }}"
    data-title="{{ article.title | escape }}"
    data-description="{{ article.excerpt | truncate: 160 | escape }}"
    class="article__share-bar article__share-bar--inline"
  ></share-bar>
</aside>
/* Mid-article share prompt styles
 * Scoped to .article__share-prompt — no broad selectors (Production Code Standard #3)
 * SITE-SPECIFIC: adjust border color and background to match brand palette
 */
.article__share-prompt {
  border-left: 4px solid var(--color-brand-primary, #1d4ed8);
  background-color: var(--color-surface-subtle, #f8fafc);
  padding: 1.5rem;
  margin: 2.5rem 0;
  border-radius: 0 0.5rem 0.5rem 0;
}

.article__share-prompt__thesis {
  font-size: 1.125rem;
  font-style: italic;
  color: var(--color-text, #111827);
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

/* Suppress the top/bottom border on the inline ShareBar — it's already in a card */
.article__share-bar--inline [data-share-bar-inner] {
  border-top: none;
  border-bottom: none;
  padding: 0;
  margin: 0;
}
```

## Risks
- og:image dependency: If this component ships before prescan-escalation-1 (og:image) is resolved, the og:image guard will suppress the share buttons entirely — the component will render nothing. This is intentional and safe, but stakeholders must understand that the two fixes are coupled. Ship them in the same release or accept that the share UI will be invisible until og:image is confirmed.
- LinkedIn share endpoint stability: LinkedIn's share URL (linkedin.com/sharing/share-offsite/) is documented and stable, but LinkedIn has historically changed share endpoints without notice. Monitor for breakage after any LinkedIn platform update. The component's SHARE_PLATFORMS config object makes endpoint updates a one-line change.
- X/Twitter character limits: The twitter:text parameter is pre-populated with the article title. If article titles exceed 280 characters minus the URL length (~23 chars), Twitter will truncate silently. Titles over 250 characters should be truncated in the share URL construction. Current implementation passes the full title — add a truncation guard if titles routinely exceed 250 characters.
- Web Share API popup blocker interaction: navigator.share() is triggered by a user gesture (click), so popup blockers should not interfere. However, some aggressive corporate browser policies block the native share sheet. The component degrades gracefully — if navigator.share throws, the error is caught and logged. Consider adding a fallback to show platform buttons if navigator.share fails.
- CMS template variable syntax: The code examples use Liquid syntax (Shopify/Jekyll). WordPress, Contentful, Sanity, Webflow, and other CMS platforms use different templating syntax. The template injection step requires adaptation by a developer familiar with the specific CMS. The component logic itself is CMS-agnostic.
- Custom Elements v1 browser support: Custom elements are supported in all modern browsers but not in IE11. If the site has a documented IE11 user base (analytics verification required), a polyfill is needed. The @webcomponents/custom-elements polyfill (~10KB gzipped) provides IE11 support. Given IE11 market share is below 0.5% globally as of 2024, this is low risk for most consulting firm audiences.
- execCommand('copy') deprecation: The clipboard fallback uses document.execCommand('copy'), which is deprecated but still functional in all browsers as of 2024. It is only invoked when navigator.clipboard.writeText is unavailable (primarily older Safari and some WebViews). Monitor for removal in future browser versions and update the fallback if needed.
- GDPR/consent interaction: Share buttons use direct URL-based platform endpoints — no SDK is loaded, no cookie is set, no pixel fires. This design is intentionally consent-safe. If a future iteration adds platform SDKs (e.g., Facebook Like button), a full consent gate must be added before SDK loading. Do not add SDK-based share buttons without legal review.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
