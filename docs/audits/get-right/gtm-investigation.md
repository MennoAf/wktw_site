# GTM Investigation — for Brandon

**Owner:** Brandon (manages the GTM container)
**Container:** `GTM-5VQTG6TH`
**Raised:** 2026-06-25
**Source:** Get Right audit — worklog item [WL-22](./worklog.md#f--gtm-ui--analytics--not-repo-work-verify-in-console)

## Why this is a separate doc

The audit raised ~10 tickets about "redundant / dual-beacon analytics" — all of them assume a
**standalone `gtag.js`** in the page HTML. We grepped the site source: **there is none.** The
repo only contains the Consent Mode v2 helper, one GTM loader, and Plausible. So if a duplicate
GA4 beacon is real, it is **configured inside the GTM container** — the Google console, which
only you can see. None of this is fixable in the codebase, so it's broken out here for you.

## What the audit observed (live, in production)

- A GA4 collect request to `google-analytics.com/g/collect` returned `net::ERR_ABORTED` (likely
  ad-blocker in the test environment, but flagged as a production risk).
- GA4 measurement ID seen: **`G-91BP6NPTSM`**.
- Suspected **double-counted pageviews** (a session with two pageview events → inflated sessions,
  suppressed bounce rate).
- No conversion events appear to be instrumented (`generate_lead`, `cta_click`, etc.).

⚠️ Treat these as *hypotheses to confirm in the console*, not confirmed facts — the audit
couldn't see inside the container.

## Investigation checklist

- [ ] **Count the GA4 beacons.** In GTM Preview mode, load any page. Confirm exactly **one** GA4
      Configuration tag fires (not a config tag *plus* a separate gtag). In Chrome DevTools →
      Network → filter `collect`, confirm **one** `204` POST per page load, no `ERR_ABORTED`.
- [ ] **Check for a standalone gtag inside GTM.** Look for a Custom HTML tag or a second GA4
      config tag loading `gtag/js?id=G-91BP6NPTSM` *in addition to* the main GA4 Configuration
      tag. If present, that's the duplicate beacon — remove it.
- [ ] **Confirm only one container exists.** The repo references only `GTM-5VQTG6TH`. Confirm
      there isn't a second container firing tags (audit speculated "dual containers" — the code
      shows only one).
- [ ] **Verify the GA4 config tag fires on All Pages** and that "Send a page view when this
      configuration loads" is checked (so we don't lose pageviews when consolidating).
- [ ] **Consent Mode wiring.** The site sets Consent Mode v2 defaults to *denied* and updates to
      *granted* only after the user accepts (localStorage `wktw-consent`). Confirm the GA4 tags
      respect Consent Mode and don't fire storage before consent.
- [ ] **Conversion events (WL-23).** The site can push a `generate_lead` event to the dataLayer on
      contact-form submit (small code change on our side). Decide the event name/params you want,
      then create the matching GA4 Event tag + trigger in GTM. Tell us the event contract and
      we'll wire the dataLayer push.

## Decisions for Brandon

- [ ] **Keep GA4/GTM, or drop it?** Several audit tickets ask whether GTM is even justified given
      zero ad pixels. Plausible is our primary, always-on, cookieless analytics. If GA4 isn't
      earning its keep, the simplest fix is to remove GTM entirely and go Plausible-only. Your call.
- [ ] If we keep GTM, it must stay **consent-gated** (it's the only thing on the site that needs a
      consent banner now — Plausible is GDPR-compliant and stays on; fonts are being self-hosted).

## Related worklog items / source tickets

- **WL-22** (this investigation) folds: `an-2-duplicate-analytics-gtm-ga4-plausible`,
  `js-4-ga4-collect-aborted-data-loss`, `attribution-split-pixel-not-applicable`,
  `escalation-5-ga4-err-aborted-root-cause`, `ux-analytics-triple-redundancy-kpi-corruption`,
  `ux-analytics-cross-domain-unknown`, `analytics-dual-gtm-inter-container-tag-conflicts`,
  `js-unused-bytes-low-but-present`, `resource-loading-dual-analytics-redundancy`, `escalation-1` (gtag part).
- **WL-23** (split code/console): `ux-analytics-form-submit-untracked`, `analytics-cta-conversion-tracking-gap`.

## Findings log (Brandon to fill in)

<!-- Record what you actually found in the console, and what you changed. -->

- 2026-06-25 — Investigation doc created, awaiting Brandon's console review.
