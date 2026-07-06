---
finding_id: "server-transport-no-redirect-chains-pass"
title: "No redirect chains or mixed content detected — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The 6-request crawl snapshot cannot confirm HTTPS compliance for third-party scripts, fonts, analytics, or image CDN assets."
fix_summary: "Validate that the PASS reflects full production coverage, not a partial crawl."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# No redirect chains or mixed content detected — PASS

**Finding:** No redirect chains or mixed content detected — PASS  
**Severity:** Low  
**Why this matters:** The 6-request crawl snapshot cannot confirm HTTPS compliance for third-party scripts, fonts, analytics, or image CDN assets.  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Validate that the PASS reflects full production coverage, not a partial crawl.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Crawl Coverage Integrity:** The 6-request crawl snapshot cannot confirm HTTPS compliance for third-party scripts, fonts, analytics, or image CDN assets. A full-page Playwright audit with networkidle wait captures all sub-resources. Any HTTP sub-resource loaded by a third-party script would be invisible to the prior scan but would trigger browser mixed content blocking — silently breaking assets (images, fonts, scripts) for users on modern browsers that enforce mixed content blocking by default.
- **Regression Prevention:** Wiring the audit into CI means a future dependency update, new third-party embed, or CMS content change that introduces an HTTP asset URL is caught in the PR, not in production. The cost of a post-deploy mixed content incident (broken images, blocked scripts, console errors degrading trust signals) is eliminated at the source.
- **Hsts Durability:** The _headers HSTS entry ensures the PASS is structural, not incidental. Without HSTS, a user who navigates to http:// is redirected to https:// on each visit — one redirect hop per session. With HSTS, the browser enforces HTTPS locally after the first visit, eliminating that redirect and its associated latency for returning users.

## How to verify

**What to look for:** All 6 network requests returned HTTP 200 with no 3xx redirects.. All resources are loaded over HTTPS — no mixed content detected.

- Total requests: **6**
  - DevTools **Network** tab → disable cache → reload. Check the request count in the status bar. Filter by type (Doc, JS, CSS, Img, Font, XHR) to identify categories to reduce.

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
Validate that the PASS reflects full production coverage, not a partial crawl. Instrument a Playwright-based network audit that captures all requests (first-party and third-party) on the live production page, then wire the results into CI so mixed content or redirect chain regressions are caught before deploy — not after.

### How
1. Confirm the 6-request anomaly: open the production URL in Chrome DevTools Network tab with cache disabled and throttling off. If the request count is 40+ (expected for a real Astro/Netlify page with fonts, analytics, and images), the prior crawl was a partial snapshot. Document the actual count.
2. Add a Playwright audit script to the repo at scripts/audit-transport.ts. The script loads the production URL, collects every network response, and asserts: (a) no response URL starts with 'http://', (b) no response has a redirect chain length > 0 (Playwright exposes request.redirectedFrom()), (c) response status is not 301/302 for any final resource.
3. Run the script in CI (Netlify build plugin or GitHub Actions post-deploy step) against the deploy preview URL so every PR is checked before merge.
4. Add a Netlify _headers file entry to enforce HSTS and prevent future mixed content at the transport layer — this is the structural fix that makes the PASS durable rather than incidental.
5. Scope the _headers rule to /* so it applies to all routes, not just the audited page. Verify the Netlify deploy log confirms the header is served on the next deploy.

### Code examples
```
// scripts/audit-transport.ts
// Run with: npx playwright test scripts/audit-transport.ts
// Precondition: AUDIT_URL env var is set to the full production or preview URL.
// Precondition: @playwright/test is installed as a dev dependency.

import { test, expect } from '@playwright/test';

// --- Named constants — adjust to match your environment ---
const AUDIT_URL = process.env['AUDIT_URL'] ?? '';
const HTTP_SCHEME_PREFIX = 'http://';
// Netlify preview URLs always start with https://, so this guard is intentional.
const ALLOWED_REDIRECT_CHAIN_LENGTH = 0;
// Playwright's default navigation timeout; increase if your deploy preview is slow.
const NAV_TIMEOUT_MS = 30_000;

if (!AUDIT_URL) {
  throw new Error(
    'AUDIT_URL environment variable is required. ' +
    'Set it to the full production or deploy-preview URL before running this audit.'
  );
}

test.describe('Transport layer audit', () => {
  test('No mixed content and no redirect chains on full page load', async ({ page }) => {
    const mixedContentViolations: string[] = [];
    const redirectChainViolations: string[] = [];

    // Collect every network response before navigation completes.
    page.on('response', (response) => {
      const url = response.url();

      // Check for mixed content: any HTTP resource on an HTTPS page.
      if (url.startsWith(HTTP_SCHEME_PREFIX)) {
        mixedContentViolations.push(url);
      }

      // Check for redirect chains: Playwright exposes the originating request.
      // A redirect chain exists when the final response was reached via one or
      // more intermediate redirects. We walk the chain to count hops.
      let redirectHops = 0;
      let cursor = response.request().redirectedFrom();
      while (cursor !== null) {
        redirectHops++;
        cursor = cursor.redirectedFrom();
      }

      if (redirectHops > ALLOWED_REDIRECT_CHAIN_LENGTH) {
        redirectChainViolations.push(
          `${url} — ${redirectHops} redirect hop(s)`
        );
      }
    });

    await page.goto(AUDIT_URL, {
      waitUntil: 'networkidle',
      timeout: NAV_TIMEOUT_MS,
    });

    // Surface all violations in a single assertion failure for easier triage.
    const report = [
      mixedContentViolations.length
        ? `Mixed content (${mixedContentViolations.length}):\n${mixedContentViolations.join('\n')}`
        : null,
      redirectChainViolations.length
        ? `Redirect chains (${redirectChainViolations.length}):\n${redirectChainViolations.join('\n')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    expect(report, 'Transport violations detected').toBe('');
  });
});

# public/_headers
# Applies to every route served by Netlify.
# Precondition: Netlify build must process public/_headers — confirmed for Astro on Netlify.
# HSTS max-age of 31536000 (1 year) is the minimum for HSTS preload list eligibility.
# includeSubDomains: only add this if ALL subdomains are HTTPS-only — verify before enabling.
# preload: only add after confirming all subdomains are covered and you intend to submit to
# the HSTS preload list (https://hstspreload.org). Removal from the list takes months.
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains

# .github/workflows/transport-audit.yml
# Runs the Playwright transport audit against the Netlify deploy preview after every PR.
# Precondition: NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN secrets are set in the repo.
# Precondition: The deploy preview URL format matches your Netlify site slug.
name: Transport Audit

on:
  deployment_status:

jobs:
  audit:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Node dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run transport audit
        env:
          # github.event.deployment_status.target_url is the Netlify preview URL.
          AUDIT_URL: ${{ github.event.deployment_status.target_url }}
        run: npx playwright test scripts/audit-transport.ts --reporter=list

```

## Risks
- HSTS includeSubDomains will break any subdomain not yet on HTTPS. Audit all subdomains (staging, api, mail) before enabling. If a subdomain serves HTTP, remove includeSubDomains until it is migrated.
- HSTS preload is irreversible on short timescales — browsers cache the preload list for up to 1 year and removal requests take months to propagate. Do not add 'preload' to the _headers entry until you have confirmed permanent HTTPS coverage across all subdomains.
- Playwright's networkidle heuristic waits for 500ms of network silence. Pages with long-polling, WebSocket connections, or infinite scroll may never reach networkidle. If the audit hangs, switch waitUntil to 'load' and add an explicit page.waitForTimeout after navigation — but document the trade-off that late-loading third-party scripts may be missed.
- The GitHub Actions workflow triggers on deployment_status events, which requires Netlify's GitHub integration to post deployment status checks. If the integration is not configured, the workflow will never fire. Verify in the repo's Environments settings that Netlify posts deployment statuses.
- The audit script walks redirect chains via request.redirectedFrom(). Playwright only exposes redirects it observes during the session — server-side 301s that Netlify resolves before the TCP connection reaches Playwright (e.g., at the CDN edge) may not appear as redirect hops. Supplement with a curl --head check in CI for canonical URL variants (www vs. non-www, trailing slash) to catch edge-level redirects.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
