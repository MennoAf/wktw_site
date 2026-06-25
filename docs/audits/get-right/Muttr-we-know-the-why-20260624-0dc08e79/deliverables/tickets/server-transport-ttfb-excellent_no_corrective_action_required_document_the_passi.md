---
finding_id: "server-transport-ttfb-excellent"
title: "Server transport healthy — TTFB, HTTP/2, TLS 1.3, compression, and no mixed content all pass"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "The 44ms TTFB is a direct result of Netlify edge-serving pre-built HTML — a configuration state, not a code property."
fix_summary: "No corrective action required."
confidence_tier: "confirmed"
---

# Server transport healthy — TTFB, HTTP/2, TLS 1.3, compression, and no mixed content all pass

**Finding:** Server transport healthy — TTFB, HTTP/2, TLS 1.3, compression, and no mixed content all pass  
**Severity:** Low  
**Why this matters:** The 44ms TTFB is a direct result of Netlify edge-serving pre-built HTML — a configuration state, not a code property.  
**Root cause:** Isolated issue  
**Fix:** No corrective action required.

> **Evidence Basis:** Confirmed

---

## Impact

- **Regression Prevention:** The 44ms TTFB is a direct result of Netlify edge-serving pre-built HTML — a configuration state, not a code property. Without a pinned, version-controlled netlify.toml and a post-deploy smoke test, a future configuration change (added redirect rule, header plugin, build output directory rename) can silently re-introduce origin round-trips or break compression negotiation. The smoke test catches these regressions at deploy time, before they reach production traffic. No current KPI improvement is expected because no current defect exists; the mechanism here is preservation of the verified baseline.
- **Operational Visibility:** Explicit netlify.toml declaration of the trailing-slash redirect prevents the implicit platform default from changing behavior on a Netlify platform update without a visible diff in version control.

## How to verify

**What to look for:** TTFB measured at 44ms (well under 600ms threshold).. HTTP/2 confirmed (multiplexing enabled).

**Measured evidence:**
- Ttfb Ms: 44
- Http Version: HTTP/2
- Tls Version: TLSv1.3
- Cipher: TLS_AES_128_GCM_SHA256
- Compression: gzip
- Server: Netlify
- Cdn Behavior: Netlify edge (implicit CDN)
- Mixed Content: False

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
No corrective action required. Document the passing transport baseline as a configuration checkpoint and establish a regression-detection mechanism so future Netlify configuration changes (headers, redirects, build plugins) do not silently degrade the verified posture.

### How
1. Commit the current netlify.toml (or netlify.toml equivalent) to version control with an inline comment block marking the transport-critical sections: [[headers]] for HSTS/security headers, [[redirects]] for the trailing-slash rule, and [build] for the publish directory. This creates a diff-visible audit trail.
2. Add a Netlify build plugin or CI step (GitHub Actions / Netlify CLI check-deploy) that runs a lightweight smoke test against the deploy preview URL after every production deploy. The test must assert: HTTP status 200, response header 'content-encoding: gzip' or 'br', response header ':status' via HTTP/2 (curl --http2), and TTFB < 600ms via a timed curl invocation.
3. Pin the trailing-slash redirect rule explicitly in netlify.toml so it is declarative and version-controlled rather than relying on Netlify's implicit default behavior, which can change across platform updates.
4. Add the two open findings (HSTS directive and canonical mismatch) as TODO comments in the same netlify.toml block so they are co-located with the configuration they affect and cannot be lost in a separate tracker.
5. No code changes to the site itself are required. All steps are infrastructure/CI configuration only.

### Code examples
```
# netlify.toml — transport baseline checkpoint
# AUDIT BASELINE (server-transport-ttfb-excellent): verified 2024
# TTFB: 44ms | HTTP/2 | TLS 1.3 AES_128_GCM_SHA256 | gzip active
# Open items tracked below: HSTS max-age, canonical mismatch

[build]
  publish = "dist" # SITE-SPECIFIC: adjust to your actual publish directory

# Trailing-slash normalization — explicit declaration prevents implicit platform default drift
# Single 301 hop; below 3-hop latency threshold. Do not add intermediate rules.
[[redirects]]
  from = "/*"
  to = "/:splat/"
  status = 301
  force = false  # Only fires when no file matches — prevents redirect loops on real assets

[[headers]]
  for = "/*"
  [headers.values]
    # TODO (HSTS finding): set max-age=31536000; includeSubDomains; preload
    # Current state is tracked as a separate actionable finding.
    Strict-Transport-Security = "max-age=31536000"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
#!/usr/bin/env bash
# ci/transport-smoke-test.sh
# Runs after every Netlify deploy preview or production deploy.
# Precondition: TARGET_URL env var is set to the deploy URL (no trailing slash).
# Precondition: curl >= 7.66 (HTTP/2 support), bc available.
# Exit code 0 = pass, 1 = regression detected.

set -euo pipefail

# Named constants — adjust thresholds here, not inline
readonly TTFB_THRESHOLD_MS=600
readonly TARGET_URL="${TARGET_URL:?TARGET_URL must be set}"
readonly REQUIRED_ENCODING="gzip"

# Capture TTFB and headers in a single request; -s = silent, -o /dev/null discards body
response=$(curl \
  --http2 \
  --silent \
  --max-time 10 \
  --write-out "%{http_code}|%{time_starttransfer}|%{header_json}" \
  --output /dev/null \
  --dump-header /tmp/smoke_headers.txt \
  "${TARGET_URL}/" 2>&1) || {
    echo "FAIL: curl request failed" >&2
    exit 1
  }

http_status=$(echo "$response" | cut -d'|' -f1)
ttfb_raw=$(echo "$response" | cut -d'|' -f2)          # seconds, e.g. 0.044
ttfb_ms=$(echo "$ttfb_raw * 1000" | bc | cut -d'.' -f1)

fail=0

# Check 1: HTTP 200
if [ "$http_status" != "200" ]; then
  echo "FAIL: Expected HTTP 200, got ${http_status}" >&2
  fail=1
fi

# Check 2: TTFB under threshold
if [ "$ttfb_ms" -ge "$TTFB_THRESHOLD_MS" ]; then
  echo "FAIL: TTFB ${ttfb_ms}ms exceeds threshold ${TTFB_THRESHOLD_MS}ms" >&2
  fail=1
fi

# Check 3: Compression active
if ! grep -qi "content-encoding: ${REQUIRED_ENCODING}" /tmp/smoke_headers.txt; then
  echo "FAIL: content-encoding:${REQUIRED_ENCODING} not present in response headers" >&2
  fail=1
fi

# Check 4: HTTP/2 negotiated (curl reports HTTP/2 in the status line)
if ! grep -q "^HTTP/2" /tmp/smoke_headers.txt; then
  echo "FAIL: HTTP/2 not negotiated" >&2
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "PASS: transport baseline verified — TTFB ${ttfb_ms}ms, HTTP/2, ${REQUIRED_ENCODING}, HTTP ${http_status}"
  exit 0
else
  exit 1
fi
```

## Risks
- Trailing-slash redirect rule: the `from = '/*'` with `to = '/:splat/'` pattern will not fire on requests that already match a static file (Netlify evaluates file existence before redirect rules when force=false), but if the publish directory is misconfigured and no files match, it could redirect asset requests. Mitigation: verify the `publish` directory constant matches the actual build output before deploying the explicit rule.
- Smoke test curl --http2 flag requires curl >= 7.66. Older CI images (e.g., Ubuntu 18.04 default curl 7.58) will silently fall back to HTTP/1.1 and the HTTP/2 check will false-positive fail. Mitigation: pin the CI runner to Ubuntu 22.04+ or explicitly install curl >= 7.66 in the CI setup step.
- The smoke test uses `bc` for floating-point arithmetic. If `bc` is not installed in the CI environment, the TTFB comparison will fail with a command-not-found error. Mitigation: add `bc` to the CI dependency install step, or replace with `awk 'BEGIN{print int(TTFB * 1000)}'` using the captured value.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
