# Get Right — Audit

**Site:** weknowthewhy.com
**Started:** 2026-06-25
**Status:** In progress
**Owner:** Jason

---

## Scope

Muttr audit of weknowthewhy.com (run `Muttr-we-know-the-why-20260624-0dc08e79`).
80 raw findings / ~60 tickets across privacy, accessibility, conversion, SEO, and config.

## Key documents

- **[worklog.md](./worklog.md)** — triage + execution queue. ~60 tickets deduped and
  verified against `src/`, mapped to real files, prioritized. Flags stale / GTM-UI-only /
  mismeasured tickets. **Start here to do the work.**
- **[feedback_for_muttr.md](./feedback_for_muttr.md)** — 8 defects in the audit *tool*
  itself (duplication, empty ticket, stack mismatch, mismeasurement). Public-record;
  each has a Verify section for the Muttr agent.
- **[gtm-investigation.md](./gtm-investigation.md)** — console-side analytics checklist
  handed to Brandon (GTM owner). The ~10 "redundant analytics" tickets live in the GTM
  container, not the repo.
- **`Muttr-…/deliverables/`** — raw audit output (tickets, clusters, exec summary).
- **`Muttr-…/verification/tests.json`** — 1,221 post-launch regression tests.

## Headline triage result

~80 raw findings → **~12 real repo fixes**, ~7 additive enhancements, 3 Netlify-config
jobs, 1 GTM-console audit; the rest stale, false (mismeasured), or no-op. See worklog
disposition table.

## Verifying fixes

The audit ships `Muttr-…/verification/tests.json` (1,221 tests), but it needs **no Python** —
it's a Node/CLI story. Two practical tiers:

**Tier 1 — free, no installs (`curl`).** All 299 `http_header` tests are runnable today with
plain `curl` against the live site. This doubles as validation: it confirmed WL-19/WL-20 are
real. Example:

```sh
for h in x-content-type-options content-security-policy x-frame-options referrer-policy cache-control; do
  curl -sI https://weknowthewhy.com/about | grep -i "^$h:" || echo "  $h: (absent)"
done
# Hashed-asset cache policy (WL-19 target):
curl -sI "https://weknowthewhy.com/_astro/<hashed>.css" | grep -i cache-control
```

**Pre-fix baseline captured 2026-06-25** (live `weknowthewhy.com`):

| Header | State | Worklog item |
| --- | --- | --- |
| `strict-transport-security` | ✓ present (`max-age=31536000`) | WL-20 (partial) |
| `x-content-type-options` | ✗ absent | WL-20 |
| `content-security-policy` | ✗ absent | WL-20 |
| `x-frame-options` | ✗ absent | WL-20 |
| `referrer-policy` | ✗ absent | WL-20 |
| `cache-control` on `/_astro/*` | ✗ `max-age=0, must-revalidate` | WL-19 |

Re-run the same `curl` loop after deploying WL-19/WL-20 to confirm the flips.

**Tier 2 — Node, one Chromium download.** `dom_assertion` (389) runs against the local `dist/`
build with a small Node parser; `performance` / `network_request` / `console_error` / axe
`accessibility` need `npx playwright install chromium` (Node, not Python). 54 `visual_regression`
tests are unrunnable as shipped (null baselines).

> ⚠️ ~half of `tests.json` targets empty or placeholder URLs (`example.com`, `/blog/*`, a typo'd
> domain) and can't run as authored — see **MUTTR-09** in `feedback_for_muttr.md`. Filter to real
> `weknowthewhy.com` targets before trusting a pass.

## Recommendations

<!-- What to change, in priority order. See worklog.md execution order. -->

## Progress log

<!-- Append-only running notes, newest at the bottom. Commit as you go so history is reviewable. -->

- 2026-06-25 — Audit folder scaffolded.
