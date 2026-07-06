---
finding_id: "escalation-resolution-csp"
title: "Escalation Resolution: CSP Absence Confirmed with High Confidence"
severity: "high"
root_cause_cluster: "CSP Absence — No Script Injection Protection"
why_this_matters: "CSP is the only browser-enforced mechanism that restricts which scripts can execute on a page."
fix_summary: "Add a Content-Security-Policy response header to the Netlify configuration that restricts script execution to same-origin and plausible.io, covering the site's 7 inline scripts via hashes and its sin…"
confidence_tier: "unverified"
remediation_surface: "source_code"
also_satisfies: ["det-security-headers-https-weknowthewhy-com-about", "js-plausible-only-third-party", "prescan-escalation-csp-confirmed-absent"]
---

# Escalation Resolution: CSP Absence Confirmed with High Confidence

**Finding:** Escalation Resolution: CSP Absence Confirmed with High Confidence  
**Severity:** High  
**Why this matters:** CSP is the only browser-enforced mechanism that restricts which scripts can execute on a page.  
**Root cause:** CSP Absence — No Script Injection Protection  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Add a Content-Security-Policy response header to the Netlify configuration that restricts script execution to same-origin and plausible.io, covering the site's 7 inline scripts via hashes and its sin…  

> **Evidence Basis:** Needs Verification

---

## Also resolves (3)

One fix closes the findings below — they were folded here as the same remediation:

- `det-security-headers-https-weknowthewhy-com-about` (Medium) — Missing recommended security headers
- `js-plausible-only-third-party` (Low) — Single third-party script (Plausible Analytics) — minimal third-party footprint
- `prescan-escalation-csp-confirmed-absent` (High) — Escalation review: CSP confirmed absent — prescan-2-1 upheld

## Impact

- **Security Posture:** CSP is the only browser-enforced mechanism that restricts which scripts can execute on a page. Without it, any XSS vector — reflected, stored, or DOM-based — executes arbitrary JavaScript with full access to cookies, DOM, and user session. Adding CSP creates a whitelist that causes the browser to block any script not matching an approved origin or hash, neutralizing the primary payload delivery mechanism for XSS attacks. This closes the single remaining gap in an otherwise complete security header configuration.
- **Seo Ranking Signal:** Google's page experience signals include HTTPS and security best practices. While CSP is not a direct ranking factor, sites compromised via XSS that serve malware or spam content trigger Safe Browsing warnings, which immediately suppress search visibility and destroy user trust. CSP is the preventive control against that scenario.
- **Compliance And Trust:** CSP presence is checked by automated security scanners (Mozilla Observatory, SecurityHeaders.com, Qualys SSL Labs). The site currently scores lower than its actual security posture warrants because CSP is the most heavily weighted header in these scoring systems. Adding CSP will align the public security grade with the site's actual configuration quality.

## Compliance & Legal

**LEGAL LIABILITY** — This issue carries regulatory risk.

**Compliance Domains:** gdpr

## Systemic Context

This issue is part of a systemic pattern (cluster: `cluster_010`). Fixing the root cause may resolve multiple related findings.

## How to verify

**What to look for:** Resolving escalation for prescan-2-1.. While 10 headers were omitted from the data, the 7 listed headers include all standard security headers EXCEPT CSP.

**Measured evidence:**
- Escalation Of: prescan-2-1 and escalation item 1
- Resolution: CSP absence confirmed with high confidence
- Reasoning: Security headers are grouped in the listed 7; omitted 10 are likely operational headers
- Recommended Csp: script-src 'self' https://plausible.io; style-src 'self'; img-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
- Note: Netlify supports CSP via _headers file or netlify.toml

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
Add a Content-Security-Policy response header to the Netlify configuration that restricts script execution to same-origin and plausible.io, covering the site's 7 inline scripts via hashes and its single external script dependency.

### How
1. Audit all inline <script> blocks across the built site output (dist/) to collect their SHA-256 hashes. Run: find dist -name '*.html' -exec grep -oP '(?<=<script>).*?(?=</script>)' {} \; | while read -r s; do echo -n "$s" | openssl dgst -sha256 -binary | openssl base64; done — record each unique hash.
2. Create or update the file `public/_headers` (Astro copies public/ contents to dist/ at build time). Add the CSP header targeting all paths.
3. The policy must: (a) default-deny all source types via default-src 'none', (b) allow scripts from 'self' and https://plausible.io plus each inline script hash, (c) allow styles from 'self' plus 'unsafe-inline' only if Astro's scoped styles inject inline style attributes (verify in build output — if all styles are in .css files, use 'self' only), (d) allow images from 'self' and any image CDN observed in crawl, (e) allow fonts from 'self', (f) allow connect-src to 'self' and https://plausible.io (Plausible sends beacons), (g) set frame-ancestors 'none' (replaces X-Frame-Options), (h) set base-uri 'self', form-action 'self', (i) add upgrade-insecure-requests.
4. Deploy to a Netlify preview branch first. Open every distinct page template in the browser with DevTools Console open — any CSP violation will log to console with the blocked directive and source. Fix violations by adding the missing source to the correct directive.
5. Once clean on preview, merge to production. Monitor for violations by adding a report-uri or report-to directive pointing to a free reporting endpoint (e.g., report-uri.com or uriports.com) for the first 30 days.
6. Automate hash generation: add a postbuild script to package.json that extracts inline script hashes from dist/ and patches the _headers file, so new inline scripts added by developers don't silently break the site.

### Code examples
```
# File: public/_headers
# Astro copies this to dist/_headers at build time; Netlify reads it.
# ---
# IMPORTANT: The 'sha256-...' values below are site-specific assumptions.
# You MUST regenerate them from your built output. See step 1 in "how".
# Each hash corresponds to one inline <script> block in the HTML output.
# If any inline script content changes (even whitespace), its hash changes
# and the CSP will block it until the hash is updated here.
#
# The plausible.io domain is the only external script origin observed in
# the crawl. If you add another external script, add its origin here.

/*
  Content-Security-Policy: default-src 'none'; script-src 'self' https://plausible.io 'sha256-REPLACE_WITH_HASH_1' 'sha256-REPLACE_WITH_HASH_2' 'sha256-REPLACE_WITH_HASH_3' 'sha256-REPLACE_WITH_HASH_4' 'sha256-REPLACE_WITH_HASH_5' 'sha256-REPLACE_WITH_HASH_6' 'sha256-REPLACE_WITH_HASH_7'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://plausible.io; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
# File: scripts/generate-csp-hashes.sh
# Run after `astro build` to extract inline script hashes and patch _headers.
# Add to package.json: "postbuild": "bash scripts/generate-csp-hashes.sh"
#!/usr/bin/env bash
set -euo pipefail

# --- Site-specific config ---
# HEADERS_FILE: path to the built _headers file that Netlify reads.
HEADERS_FILE="dist/_headers"
# PLAUSIBLE_DOMAIN: external script origin for analytics.
PLAUSIBLE_DOMAIN="https://plausible.io"
# CSP_REPORT_ENDPOINT: optional reporting URI for violation monitoring.
# Set to empty string to disable report-uri directive.
CSP_REPORT_ENDPOINT=""
# ---

# Extract all inline script content from built HTML files and compute SHA-256 hashes.
# Uses perl to handle multi-line script blocks correctly.
HASHES=$(find dist -name '*.html' -print0 | \
  xargs -0 perl -0777 -ne 'while(/<script>(.+?)<\/script>/sg){print "$1\n---DELIM---\n"}' | \
  awk 'BEGIN{RS="\n---DELIM---\n"} NF{print}' | \
  while IFS= read -r script_content; do
    echo -n "$script_content" | openssl dgst -sha256 -binary | openssl base64
  done | sort -u | sed "s/^/'sha256-/;s/$/'/" | tr '\n' ' ')

if [ -z "$HASHES" ]; then
  echo "Warning: No inline scripts found. CSP will use script-src 'self' ${PLAUSIBLE_DOMAIN} only."
fi

REPORT_DIRECTIVE=""
if [ -n "$CSP_REPORT_ENDPOINT" ]; then
  REPORT_DIRECTIVE="; report-uri ${CSP_REPORT_ENDPOINT}"
fi

# Build the full CSP value.
CSP_VALUE="default-src 'none'; script-src 'self' ${PLAUSIBLE_DOMAIN} ${HASHES}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${PLAUSIBLE_DOMAIN}; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests${REPORT_DIRECTIVE}"

# Write the _headers file.
cat > "$HEADERS_FILE" << HEADERS_EOF
/*
  Content-Security-Policy: ${CSP_VALUE}
HEADERS_EOF

echo "CSP header written to ${HEADERS_FILE} with $(echo $HASHES | wc -w) inline script hashes."
```

## Risks
- Inline script hash mismatch: If any inline script content changes (including whitespace or minification differences between builds), its hash changes and CSP will block it. Mitigation: the postbuild script regenerates hashes from the actual build output on every deploy, so hashes always match. Risk only materializes if the postbuild script is skipped or fails silently — the set -euo pipefail flag ensures the script fails loudly.
- style-src 'unsafe-inline' is a partial concession: Astro's scoped styles may inject inline style attributes (e.g., style="--astro-...") on elements. If so, 'unsafe-inline' is required for style-src. This does not weaken script protection (script-src uses hashes, not unsafe-inline), but it means CSS injection attacks are not mitigated by CSP. Verify in build output — if Astro emits all styles as external .css files, remove 'unsafe-inline' from style-src for a stricter policy.
- Future third-party script additions will be blocked: Any new external script (e.g., adding a chat widget, new analytics provider) will be blocked by CSP until its origin is added to script-src. This is the intended behavior — it forces conscious review of new script dependencies — but developers must know to update _headers when adding scripts. Document this in the project README.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
