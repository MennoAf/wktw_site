# Compliance Remediation Plan

*w.k.t.w. — Regulatory Compliance Assessment for We Know the Why*

> This document is prepared for **legal and compliance stakeholders**. It identifies specific regulatory violations detected during the website audit, maps each to its governing regulation, and provides a prioritized remediation timeline based on legal exposure. For engineering implementation details, refer to the individual finding tickets.

---

## Executive Risk Summary

### Violations by Regulatory Domain

| Domain | Violations | Exposure |
|--------|-----------|----------|
| GDPR (General Data Protection Regulation) | 8 | 8 high |
| CCPA (California Consumer Privacy Act) | 2 | none high |
| WCAG 2.1 / ADA Title III (Accessibility) | 13 | none high |

### Violations by Exposure Level

- **Immediate (0-30 days):** 8 violation(s) — Active legal risk — remediate immediately
- **Short-term (30-90 days):** 11 violation(s) — Regulatory exposure — schedule remediation
- **Ongoing:** 4 violation(s) — Best-practice gap — address in next development cycle

## Remediation Timeline

### Immediate (0-30 days)

*Active legal risk — remediate immediately*

| # | Regulation | Violation | Finding | Severity |
|---|-----------|-----------|---------|----------|
| 1 | GDPR Art. 6(1)(a) + ePrivacy Art. 5(3) | pre-consent tracking | `privacy-1-no-consent-mechanism` | critical |
| 2 | GDPR Art. 6(1)(a) + Art. 13 | missing consent mechanism | `privacy-1-no-consent-mechanism` | critical |
| 3 | GDPR Art. 6(1)(a) + ePrivacy Art. 5(3) | pre-consent tracking | `det-gdpr-pre-consent-tracking-https-weknowthewhy-com` | high |
| 4 | GDPR Art. 6(1)(a) + Art. 13 | missing consent mechanism | `det-gdpr-pre-consent-tracking-https-weknowthewhy-com` | high |
| 5 | GDPR Art. 6(1)(a) + ePrivacy Art. 5(3) | pre-consent tracking | `privacy-cookies-consent-banner-dark-pattern` | high |
| 6 | GDPR Art. 6(1)(a) + Art. 13 | missing consent mechanism | `privacy-cookies-consent-banner-dark-pattern` | high |
| 7 | GDPR Art. 6(1)(a) + ePrivacy Art. 5(3) | pre-consent tracking | `fonts-google-fonts-privacy-performance` | medium |
| 8 | GDPR Art. 6(1)(a) + Art. 13 | missing consent mechanism | `fonts-google-fonts-privacy-performance` | medium |

### Short-term (30-90 days)

*Regulatory exposure — schedule remediation*

| # | Regulation | Violation | Finding | Severity |
|---|-----------|-----------|---------|----------|
| 1 | WCAG 2.1 SC 1.4.3 (AA) | insufficient contrast ratio | `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com-about` | medium |
| 2 | WCAG 2.1 SC 1.4.1 (A) | color as sole indicator | `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com-about` | medium |
| 3 | WCAG 2.1 SC 1.4.3 (AA) | insufficient contrast ratio | `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` | medium |
| 4 | WCAG 2.1 SC 1.4.1 (A) | color as sole indicator | `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` | medium |
| 5 | WCAG 2.1 SC 1.4.3 (AA) | insufficient contrast ratio | `det-wcag-improper-content-structure-https-weknowthewhy-com-about` | low |
| 6 | WCAG 2.1 SC 1.4.1 (A) | color as sole indicator | `det-wcag-improper-content-structure-https-weknowthewhy-com-about` | low |
| 7 | CCPA 1798.120 + 1798.135 | opt-out mechanism deficiency | `privacy-1-no-consent-mechanism` | critical |
| 8 | CCPA 1798.135(e) + Cal. AG Regulations 999.315 | GPC signal non-compliance | `privacy-1-no-consent-mechanism` | critical |
| 9 | WCAG 2.1 SC 1.4.3 (AA) | insufficient contrast ratio | `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` | medium |
| 10 | WCAG 2.1 SC 4.1.2 (A) | missing name/role/value | `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` | medium |
| 11 | WCAG 2.1 SC 1.4.1 (A) | color as sole indicator | `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` | medium |

### Ongoing

*Best-practice gap — address in next development cycle*

| # | Regulation | Violation | Finding | Severity |
|---|-----------|-----------|---------|----------|
| 1 | WCAG 2.1 SC 1.3.1 (A) | improper content structure | `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com-about` | medium |
| 2 | WCAG 2.1 SC 1.3.1 (A) | improper content structure | `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` | medium |
| 3 | WCAG 2.1 SC 1.3.1 (A) | improper content structure | `det-wcag-improper-content-structure-https-weknowthewhy-com-about` | low |
| 4 | WCAG 2.1 SC 1.3.1 (A) | improper content structure | `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` | medium |

## Detailed Remediation by Domain

### GDPR (General Data Protection Regulation)

#### GDPR Art. 6(1)(a) + ePrivacy Art. 5(3)

**Violation type:** pre-consent tracking

**What was found:** 0 non-essential cookie(s) and 3 tracking request(s) detected before user consent interaction

**Required remediation:** Block all non-essential cookies and tracking requests until the user provides affirmative consent via the CMP. Implement Google Consent Mode v2 or equivalent tag-gating. Pre-consent state must have zero non-essential cookies.

**Affected findings:**

- `privacy-1-no-consent-mechanism` — Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure (critical)
- `det-gdpr-pre-consent-tracking-https-weknowthewhy-com` — Pre-consent tracking [GDPR] (high)
- `privacy-cookies-consent-banner-dark-pattern` — Cookie consent banner — Accept/Decline button visual parity requires verification for dark pattern compliance (high)
- `fonts-google-fonts-privacy-performance` — Google Fonts loaded from external CDN — privacy implications and variable font optimization opportunity (medium)

#### GDPR Art. 6(1)(a) + Art. 13

**Violation type:** missing consent mechanism

**What was found:** No consent banner detected, yet non-essential cookies/tracking are active. Users have no mechanism to provide or withhold consent.

**Required remediation:** Implement a GDPR-compliant Consent Management Platform (CMP) that blocks non-essential processing until affirmative consent is obtained. The banner must clearly identify purposes, provide granular controls, and link to the privacy policy.

**Affected findings:**

- `privacy-1-no-consent-mechanism` — Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure (critical)
- `det-gdpr-pre-consent-tracking-https-weknowthewhy-com` — Pre-consent tracking [GDPR] (high)
- `privacy-cookies-consent-banner-dark-pattern` — Cookie consent banner — Accept/Decline button visual parity requires verification for dark pattern compliance (high)
- `fonts-google-fonts-privacy-performance` — Google Fonts loaded from external CDN — privacy implications and variable font optimization opportunity (medium)

### CCPA (California Consumer Privacy Act)

#### CCPA 1798.120 + 1798.135

**Violation type:** opt-out mechanism deficiency

**What was found:** California consumers must be able to opt out of the sale/sharing of personal information. Tracking activity detected that may constitute 'sharing' under CCPA's broad definition.

**Required remediation:** Implement a 'Do Not Sell or Share My Personal Information' link in the website footer. Honor Global Privacy Control (GPC) signals. Ensure opt-out stops cross-context behavioral advertising pixels (Meta, Google Ads, etc.).

**Affected findings:**

- `privacy-1-no-consent-mechanism` — Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure (critical)

#### CCPA 1798.135(e) + Cal. AG Regulations 999.315

**Violation type:** GPC signal non-compliance

**What was found:** Tracking requests fire before consent, suggesting Global Privacy Control (GPC) browser signals may not be honored. CCPA requires businesses to treat GPC as a valid opt-out request.

**Required remediation:** Detect the Sec-GPC: 1 header or navigator.globalPrivacyControl JavaScript API. When present, treat as opt-out of sale/sharing — suppress advertising pixels and cross-site tracking.

**Affected findings:**

- `privacy-1-no-consent-mechanism` — Pre-consent tracking scripts load without visible consent banner — GDPR/consent compliance failure (critical)

### WCAG 2.1 / ADA Title III (Accessibility)

#### WCAG 2.1 SC 1.4.3 (AA)

**Violation type:** insufficient contrast ratio

**What was found:** 3 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at div > a:nth-of-type(5).

**Required remediation:** Adjust foreground/background color pairs to meet WCAG AA contrast thresholds: 4.5:1 for body text (<18pt), 3:1 for large text (>=18pt or >=14pt bold). Verify with a contrast checker.

**Affected findings:**

- `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com-about` — Insufficient contrast ratio [WCAG] (medium)
- `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` — Color as sole indicator [WCAG] (medium)
- `det-wcag-improper-content-structure-https-weknowthewhy-com-about` — Improper content structure [WCAG] (low)
- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` — Missing name/role/value [WCAG] (medium)

#### WCAG 2.1 SC 1.3.1 (A)

**Violation type:** improper content structure

**What was found:** Heading hierarchy issues: heading level jumps from h2 to h4 (skips a level).

**Required remediation:** Use a single h1 per page for the main topic. Nest headings sequentially (h1 > h2 > h3) without skipping levels. Headings should describe the content that follows, not be used for styling.

**Affected findings:**

- `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com-about` — Insufficient contrast ratio [WCAG] (medium)
- `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` — Color as sole indicator [WCAG] (medium)
- `det-wcag-improper-content-structure-https-weknowthewhy-com-about` — Improper content structure [WCAG] (low)
- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` — Missing name/role/value [WCAG] (medium)

#### WCAG 2.1 SC 1.4.1 (A)

**Violation type:** color as sole indicator

**What was found:** 10 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).

**Required remediation:** Supplement color with additional visual cues: underline inline links, or add icons/patterns. Do not rely on color alone to convey meaning.

**Affected findings:**

- `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com-about` — Insufficient contrast ratio [WCAG] (medium)
- `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` — Color as sole indicator [WCAG] (medium)
- `det-wcag-improper-content-structure-https-weknowthewhy-com-about` — Improper content structure [WCAG] (low)
- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` — Missing name/role/value [WCAG] (medium)

#### WCAG 2.1 SC 4.1.2 (A)

**Violation type:** missing name/role/value

**What was found:** 2 UI component(s) lack an accessible name, preventing assistive technology from conveying their purpose.

**Required remediation:** Add accessible names (visible text, aria-label, or aria-labelledby) and appropriate roles. Prefer native HTML semantics over ARIA.

**Affected findings:**

- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` — Missing name/role/value [WCAG] (medium)

## Documentation & Evidence Guidance

Maintaining a record of remediation activity demonstrates good faith and reduces
regulatory exposure. For each violation addressed:

1. **Before-state evidence** — Screenshot or audit log showing the violation
   (this audit report serves as initial documentation)
2. **Remediation action** — Description of the change, who approved it, and
   the date deployed
3. **After-state verification** — Re-test results confirming the violation is
   resolved (automated scan output, manual QA sign-off, or re-audit)
4. **Ongoing monitoring** — How this will be prevented from recurring (CI
   checks, CMP monitoring, accessibility linting in deploy pipeline)

For GDPR/CCPA: retain consent mechanism change logs and Data Protection Impact
Assessment (DPIA) updates. For WCAG/ADA: retain VPAT (Voluntary Product
Accessibility Template) if applicable.

## Re-validation Cadence

| Domain | Recommended Cadence | Trigger Events |
|--------|-------------------|----------------|
| GDPR / ePrivacy | Quarterly | CMP vendor update, new tracking pixel added, cookie policy change |
| CCPA | Semi-annually | New data sharing partner, GPC implementation change |
| WCAG / ADA | After each major release | Template redesign, new interactive component, CMS migration |
| PCI DSS | Per PCI schedule (quarterly ASV + annual SAQ/ROC) | Payment flow change, new PSP integration |

Between scheduled audits, integrate automated checks into CI/CD:
- **Privacy:** CMP validation scripts, network request auditing in staging
- **Accessibility:** axe-core or Lighthouse CI gates on pull requests
- **Security:** HSTS/CSP header checks in deployment pipeline

---

*23 total compliance violation(s) across 3 domain(s) (8 GDPR, 2 CCPA, 13 WCAG). Generated from audit data — no additional API cost.*
