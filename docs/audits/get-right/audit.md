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

## Recommendations

<!-- What to change, in priority order. See worklog.md execution order. -->

## Progress log

<!-- Append-only running notes, newest at the bottom. Commit as you go so history is reviewable. -->

- 2026-06-25 — Audit folder scaffolded.
