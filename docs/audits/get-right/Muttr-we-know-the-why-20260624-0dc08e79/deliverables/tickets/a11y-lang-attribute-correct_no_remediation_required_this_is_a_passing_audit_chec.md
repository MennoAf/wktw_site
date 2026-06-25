---
finding_id: "a11y-lang-attribute-correct"
title: "Language declaration correct — <html lang='en'> is valid BCP 47"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The lang attribute is the mechanism by which screen readers (NVDA, JAWS, VoiceOver, TalkBack) select the correct pronunciation engine."
fix_summary: "No remediation required."
confidence_tier: "confirmed"
---

# Language declaration correct — <html lang='en'> is valid BCP 47

**Finding:** Language declaration correct — <html lang='en'> is valid BCP 47  
**Severity:** Low  
**Why this matters:** The lang attribute is the mechanism by which screen readers (NVDA, JAWS, VoiceOver, TalkBack) select the correct pronunciation engine.  
**Root cause:** Isolated issue  
**Fix:** No remediation required.

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility:** The lang attribute is the mechanism by which screen readers (NVDA, JAWS, VoiceOver, TalkBack) select the correct pronunciation engine. If the attribute is silently stripped by a future CMS build or script, all screen reader users immediately receive incorrect pronunciation — the regression guard prevents this failure mode from reaching production undetected.
- **Seo:** Browser-native translation services (Google Translate, Microsoft Translator) use the lang attribute to identify source language for auto-translation prompts. Loss of the attribute degrades translation accuracy for non-English visitors. No current defect exists; the guard preserves the passing state.
- **Wcag Compliance:** WCAG 2.1 SC 3.1.1 (Language of Page, Level A) requires a programmatically determinable page language. Regression to a missing lang attribute is a Level A failure — the most severe WCAG tier — and constitutes legal exposure under ADA and the European Accessibility Act.

## How to verify

**What to look for:** The <html> element has lang='en', which is a valid BCP 47 language tag.. Screen readers will use English pronunciation rules.

**Measured evidence:**
- Html Lang: en
- Bcp47 Valid: True
- Valid Bcp47: True

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
No remediation required. This is a passing audit check. The proposal below documents a regression guard to prevent future CMS builds or template changes from silently stripping the lang attribute — the only actionable work this finding warrants.

### How
1. Add a CI/CD regression test that asserts lang attribute presence and value on every build output before deployment.
2. If the site uses a headless CMS or SSG (Next.js, Nuxt, Astro, Eleventy), verify the root HTML shell template explicitly sets lang='en' as a hardcoded attribute — not derived from a CMS field that could be null or omitted.
3. If a tag manager (GTM, Tealium) or third-party script rewrites the <html> element, add a MutationObserver guard in the document <head> that detects and restores the lang attribute if removed.
4. Document the current passing state in the audit log so future auditors do not re-escalate this check.

### Code examples
```
// --- Regression Test (Node.js + Playwright, runs in CI pipeline) ---
// ASSUMPTION: baseURL is your staging or preview deployment URL — configure per environment.
// ASSUMPTION: expectedLang matches the BCP 47 tag for your primary content language.
const { chromium } = require('playwright');

const BASE_URL = process.env.AUDIT_BASE_URL || 'https://staging.example.com'; // site-specific
const EXPECTED_LANG = 'en'; // site-specific: update if primary language changes

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const lang = await page.evaluate(() => {
      const html = document.documentElement;
      return html ? html.getAttribute('lang') : null;
    });

    if (!lang) {
      throw new Error(`REGRESSION: <html lang> attribute is missing on ${BASE_URL}`);
    }
    if (lang.trim().toLowerCase() !== EXPECTED_LANG) {
      throw new Error(
        `REGRESSION: <html lang> is '${lang}', expected '${EXPECTED_LANG}' on ${BASE_URL}`
      );
    }

    console.log(`PASS: <html lang='${lang}'> is present and correct.`);
  } finally {
    await browser.close();
  }
})();
// --- MutationObserver Guard (inline in <head>, before any third-party scripts) ---
// PURPOSE: Detects and restores lang attribute if a tag manager or script
// rewrites the <html> element and drops the attribute.
// ASSUMPTION: This script runs synchronously in <head> before GTM or any
// framework hydration. Do not defer or async this script.
// ASSUMPTION: REQUIRED_LANG matches the BCP 47 tag for this page's primary language.

(function () {
  'use strict';

  var REQUIRED_LANG = 'en'; // site-specific: update if primary language changes
  var OBSERVER_TIMEOUT_MS = 30000; // 30s cap — prevents unbounded observation after load
  var html = document.documentElement;

  // Ensure attribute is correct on initial parse before observer starts.
  if (html.getAttribute('lang') !== REQUIRED_LANG) {
    html.setAttribute('lang', REQUIRED_LANG);
  }

  if (typeof MutationObserver === 'undefined') {
    // Graceful fallback: MutationObserver unavailable (pre-IE11 environments).
    // Static setAttribute above is the only guard available.
    return;
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'lang' &&
        html.getAttribute('lang') !== REQUIRED_LANG
      ) {
        // Restore without triggering a second mutation loop:
        // setAttribute to the correct value will fire another mutation,
        // but the guard condition above will be false on re-entry.
        html.setAttribute('lang', REQUIRED_LANG);
      }
    }
  });

  observer.observe(html, { attributes: true, attributeFilter: ['lang'] });

  // Teardown after page is fully loaded — lang attribute is stable post-load.
  var teardownTimer = setTimeout(function () {
    observer.disconnect();
  }, OBSERVER_TIMEOUT_MS);

  // Also disconnect on load event if it fires before the timeout.
  window.addEventListener('load', function onLoad() {
    clearTimeout(teardownTimer);
    observer.disconnect();
    window.removeEventListener('load', onLoad);
  });
})();
```

## Risks
- MutationObserver guard runs synchronously in <head> — if the script itself throws (e.g., document.documentElement is null in a non-browser environment like SSR), it could block page parsing. Mitigation: the IIFE is wrapped in a function scope; add a try-catch wrapper if the site uses isomorphic rendering where this script might execute server-side.
- If a legitimate future requirement changes the primary language (e.g., site relaunches in French), the hardcoded REQUIRED_LANG constant in both the CI test and the MutationObserver guard must be updated in sync. Mitigation: expose REQUIRED_LANG as a single named constant in both files and document it as a site-specific configuration value.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
