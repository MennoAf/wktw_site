---
finding_id: "prescan-escalation-internal-links"
title: "Escalation review: Internal link HTTP status — requires live crawl"
severity: "medium"
root_cause_cluster: "SEO Metadata and Structured Data — Unverifiable Properties"
why_this_matters: "Every deploy that would ship a broken internal link is blocked before it reaches production."
fix_summary: "Add a build-time broken link checker to the Astro/Netlify CI pipeline that verifies all 14 internal hrefs resolve to real generated routes before deployment completes."
confidence_tier: "unverified"
remediation_surface: "source_code"
also_satisfies: ["prescan-escalation-skip-link-truncation"]
---

# Escalation review: Internal link HTTP status — requires live crawl

**Finding:** Escalation review: Internal link HTTP status — requires live crawl  
**Severity:** Medium  
**Why this matters:** Every deploy that would ship a broken internal link is blocked before it reaches production.  
**Root cause:** SEO Metadata and Structured Data — Unverifiable Properties  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Add a build-time broken link checker to the Astro/Netlify CI pipeline that verifies all 14 internal hrefs resolve to real generated routes before deployment completes.  

> **Evidence Basis:** Needs Verification

---

## Also resolves (1)

One fix closes the findings below — they were folded here as the same remediation:

- `prescan-escalation-skip-link-truncation` (Low) — Escalation review: Skip-link anchor truncation is likely a data collection artifact — not a bug

## Impact

- **Deployment Safety:** Every deploy that would ship a broken internal link is blocked before it reaches production. The /contact/ route — the site's sole conversion destination — cannot silently break without failing the build. This eliminates the failure mode where a CMS edit or route rename severs the inquiry path without any visible error.
- **Seo Crawlability:** Broken internal links cause Googlebot to encounter dead ends, wasting crawl budget and preventing PageRank flow to destination pages. A build-time gate ensures the internal link graph is always intact at deploy time, which is a precondition for consistent crawl coverage.
- **Structured Data Integrity:** Organization schema referencing a /contact/ URL that returns a non-200 response creates a schema-to-reality mismatch. Keeping the link verified at build time ensures any schema contactPoint or url property remains resolvable, avoiding the compounding SEO risk identified in the related structured data finding.

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_009`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Reviewing prescan-15-1 escalation: 14 internal links present, 0 crawled for status codes.. The /contact/ link is KPI-critical.

**Measured evidence:**
- Prescan Ref: prescan-15-1
- Escalation Resolution: unresolvable without live crawl — prescan finding stands
- Internal Links: 14
- Critical Destination: /contact/ — primary conversion target
- Escalation Ref: prescan-15-1
- Resolution: unresolvable_without_live_crawl
- Kpi Critical Link: /contact/
- Risk Assessment: Lower risk on static SSG (all pages pre-built), but /contact/ verification is essential

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
Add a build-time broken link checker to the Astro/Netlify CI pipeline that verifies all 14 internal hrefs resolve to real generated routes before deployment completes. The checker runs as a post-build step, fails the Netlify build on any broken link, and produces a structured report. No runtime code is added to the site.

### How
1. Install @astrojs/check is already present; separately install the link-checking dependency: `npm install --save-dev broken-link-checker` is too runtime-focused — instead use the purpose-built static-output checker `npm install --save-dev @untitled-ui/astro-link-checker` is not stable. Use the maintained `npm install --save-dev linkinator` (Google-maintained, zero-config, works against a local file:// or served directory).
2. Add a post-build npm script in package.json that (a) serves the Astro dist/ output on a fixed local port using `npx serve` and (b) runs linkinator against that local server, failing on any non-2xx status. The two processes must be sequenced — serve must be ready before linkinator starts. Use the `wait-on` package to gate the linkinator invocation.
3. Install supporting packages: `npm install --save-dev linkinator serve wait-on`.
4. Add the check script to package.json scripts block (see code_examples[0]).
5. In netlify.toml, override the build command to run `npm run build && npm run check:links` so Netlify executes the link check as part of every deploy. A non-zero exit from linkinator cancels the deploy (see code_examples[1]).
6. Add a linkinator config file `.linkinatorrc.json` at the project root to scope the check to internal links only, skip known-external domains, and set a timeout that survives Netlify's build runner latency (see code_examples[2]).
7. Verify the /contact/ route specifically: after first run, confirm linkinator output shows a 200 for the contact path. If the host enforces trailing-slash normalization (Netlify default: redirect /contact → /contact/), ensure all hrefs in the source use the canonical form that matches Netlify's `trailingSlash` setting in astro.config.mjs (see code_examples[3]).
8. Commit .linkinatorrc.json, the updated package.json, and netlify.toml. Push to the branch that triggers Netlify deploys. The first run will surface any existing broken links as a build failure with a line-by-line report in the Netlify build log.
9. For the /contact/ link specifically: open every .astro file that contains an href to /contact or /contact/ and confirm the trailing-slash form matches the astro.config.mjs `trailingSlash` value. Fix any mismatches before merging.

### Code examples
```
// package.json — scripts block addition
// SITE-SPECIFIC ASSUMPTION: dist/ is Astro's default output directory.
// If astro.config.mjs sets `outDir`, update the `serve dist` argument below to match.
// SITE-SPECIFIC ASSUMPTION: port 4001 is chosen to avoid conflict with
// Astro's dev server (4321) and preview server (4321). If 4001 is in use,
// update the port in check:links:serve, check:links:wait, and .linkinatorrc.json skip regex.
// NOTE: package.json is strict JSON — no JS constants are valid here.
// Port is documented above and must be kept in sync across three locations if changed.
{
  "scripts": {
    "build": "astro build",
    "check:links": "npm run check:links:serve & npm run check:links:wait && { npm run check:links:run; STATUS=$?; kill %1 2>/dev/null; exit $STATUS; } || { kill %1 2>/dev/null; exit 1; }",
    "check:links:serve": "serve dist --listen 4001 --no-clipboard",
    "check:links:wait": "wait-on http://localhost:4001 --timeout 30000",
    "check:links:run": "linkinator http://localhost:4001 --config .linkinatorrc.json"
  },
  "devDependencies": {
    "linkinator": "3.1.1",
    "serve": "14.2.3",
    "wait-on": "7.2.0"
  }
}
# netlify.toml
# SITE-SPECIFIC ASSUMPTION: publish directory is dist/.
# If astro.config.mjs sets a different outDir, update [build].publish to match.
[build]
  command   = "npm run build && npm run check:links"
  publish   = "dist"

[build.environment]
  NODE_VERSION = "20"

# Netlify redirects: enforce trailing slash to match Astro's default.
# SITE-SPECIFIC ASSUMPTION: trailingSlash = "always" in astro.config.mjs.
# If trailingSlash = "never", remove this redirect block.
[[redirects]]
  from   = "/contact"
  to     = "/contact/"
  status = 301
  force  = true
// .linkinatorrc.json
// SITE-SPECIFIC ASSUMPTION: the site has no intentional external links
// that should be checked. External link checking is disabled to prevent
// flaky CI failures from third-party uptime. Enable `recurse: true` and
// remove `linksToSkip` patterns if external link checking is desired.
{
  "recurse": true,
  "timeout": 10000,
  "retryErrors": true,
  "retryErrorsCount": 2,
  "retryErrorsJitter": 500,
  "skip": "^(?!http://localhost:4001)",
  "verbosity": "error",
  "markdown": false
}
// astro.config.mjs — trailing slash alignment
// SITE-SPECIFIC ASSUMPTION: Netlify's default static serving adds trailing
// slashes. Setting trailingSlash: 'always' makes Astro generate /contact/index.html
// so that href="/contact/" resolves without a redirect hop.
// If the site intentionally uses trailingSlash: 'never', change all hrefs
// to omit the trailing slash AND update the netlify.toml redirect block accordingly.
import { defineConfig } from 'astro/config';

export default defineConfig({
  trailingSlash: 'always', // must match href conventions in all .astro files
  // ... other config
});

// Example: correct internal link in any .astro component
// Precondition: trailingSlash is 'always' in astro.config.mjs
// Precondition: Netlify publish dir contains dist/contact/index.html after build
---
// src/components/Nav.astro
---
<nav aria-label="Primary navigation">
  <a href="/contact/">Contact</a>
</nav>
```

## Risks
- The `serve & wait-on & linkinator` shell pipeline uses background process management (`kill %1`) which behaves differently on Windows. Netlify build runners are Linux — this is safe in CI. Local Windows development requires a cross-platform alternative such as `concurrently` with a kill-others-on-fail flag. If the team develops on Windows, replace the shell pipeline with a Node.js script using `concurrently` (see note: this is a dev-environment risk only, not a production risk).
- If Astro's build output includes pages with intentional `noindex` or password-protected routes that return non-200 from the local serve process, linkinator will fail the build on those routes. Mitigate by adding their path patterns to the `skip` regex in .linkinatorrc.json before enabling the check.
- The `wait-on` 30-second timeout assumes the local `serve` process starts within 30 seconds on Netlify's build runner. If the runner is under heavy load, this can flake. Increase the timeout to 60000ms if intermittent CI failures appear — this is a tuning concern, not a structural flaw.
- linkinator's `skip` regex `^(?!http://localhost:4001)` uses a negative lookahead to exclude all non-local URLs. If the regex engine used by the installed linkinator version does not support lookaheads (unlikely but version-dependent), replace with the `--skip` CLI flag using a simpler pattern and enumerate external domains explicitly. Pin linkinator to a specific version in package.json to prevent silent behavior changes on `npm install`.
- Trailing-slash mismatch between astro.config.mjs `trailingSlash` and existing hrefs in .astro files is the most likely source of a real broken link on this site. Changing `trailingSlash` in astro.config.mjs without auditing all hrefs will cause linkinator to report failures on the old href forms. Audit all 14 internal hrefs against the configured value before enabling the build gate.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
