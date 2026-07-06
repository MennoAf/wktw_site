# Compliance Remediation Plan

*w.k.t.w. — Regulatory Compliance Assessment for WKTW*

> This document is prepared for **legal and compliance stakeholders**. It identifies specific regulatory violations detected during the website audit, maps each to its governing regulation, and provides a prioritized remediation timeline based on legal exposure. For engineering implementation details, refer to the individual finding tickets.

---

## Executive Risk Summary

### Violations by Regulatory Domain

| Domain | Violations | Exposure |
|--------|-----------|----------|
| GDPR (General Data Protection Regulation) | 2 | none high |
| WCAG 2.1 / ADA Title III (Accessibility) | 12 | none high |

### Violations by Exposure Level

- **Short-term (30-90 days):** 12 violation(s) — Regulatory exposure — schedule remediation
- **Ongoing:** 2 violation(s) — Best-practice gap — address in next development cycle

## Remediation Timeline

### Short-term (30-90 days)

*Regulatory exposure — schedule remediation*

| # | Regulation | Violation | Finding | Severity |
|---|-----------|-----------|---------|----------|
| 1 | WCAG 2.1 SC 1.4.3 (AA) | insufficient contrast ratio | `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com` | medium |
| 2 | WCAG 2.1 SC 1.4.1 (A) | color as sole indicator | `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com` | medium |
| 3 | WCAG 2.1 SC 1.4.3 (AA) | insufficient contrast ratio | `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` | medium |
| 4 | WCAG 2.1 SC 1.4.1 (A) | color as sole indicator | `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` | medium |
| 5 | WCAG 2.1 SC 1.4.3 (AA) | insufficient contrast ratio | `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` | medium |
| 6 | WCAG 2.1 SC 4.1.2 (A) | missing name/role/value | `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` | medium |
| 7 | WCAG 2.1 SC 1.4.1 (A) | color as sole indicator | `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` | medium |
| 8 | GDPR Art. 13 + Art. 14 | transparency obligation | `privacy-consent-banner-absent` | medium |
| 9 | GDPR Art. 13 + Art. 14 | transparency obligation | `privacy-2-pre-consent-plausible-fires` | medium |
| 10 | WCAG 2.1 SC 1.4.3 (AA) | insufficient contrast ratio | `det-wcag-improper-content-structure-https-weknowthewhy-com-contact` | low |
| 11 | WCAG 2.1 SC 4.1.2 (A) | missing name/role/value | `det-wcag-improper-content-structure-https-weknowthewhy-com-contact` | low |
| 12 | WCAG 2.1 SC 1.4.1 (A) | color as sole indicator | `det-wcag-improper-content-structure-https-weknowthewhy-com-contact` | low |

### Ongoing

*Best-practice gap — address in next development cycle*

| # | Regulation | Violation | Finding | Severity |
|---|-----------|-----------|---------|----------|
| 1 | WCAG 2.1 SC 1.3.1 (A) | improper content structure | `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` | medium |
| 2 | WCAG 2.1 SC 1.3.1 (A) | improper content structure | `det-wcag-improper-content-structure-https-weknowthewhy-com-contact` | low |

## Detailed Remediation by Domain

### GDPR (General Data Protection Regulation)

#### GDPR Art. 13 + Art. 14

**Violation type:** transparency obligation

**What was found:** Privacy/cookie handling issue detected that may affect user rights transparency or data processing documentation

**Required remediation:** Review privacy notice for completeness per Art. 13/14. Ensure all data processing purposes, legal bases, retention periods, and data subject rights are clearly documented and accessible.

**Affected findings:**

- `privacy-consent-banner-absent` — Consent banner not rendered despite consent infrastructure present in DOM (medium)
- `privacy-2-pre-consent-plausible-fires` — Plausible analytics script loads before consent interaction — potential pre-consent tracking (medium)

### WCAG 2.1 / ADA Title III (Accessibility)

#### WCAG 2.1 SC 1.4.3 (AA)

**Violation type:** insufficient contrast ratio

**What was found:** 4 text element(s) fall below the WCAG AA contrast minimum (4.5:1 normal / 3:1 large); lowest measured ratio is 1.00:1 at #consent-accept.

**Required remediation:** Adjust foreground/background color pairs to meet WCAG AA contrast thresholds: 4.5:1 for body text (<18pt), 3:1 for large text (>=18pt or >=14pt bold). Verify with a contrast checker.

**Affected findings:**

- `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com` — Insufficient contrast ratio [WCAG] (medium)
- `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` — Color as sole indicator [WCAG] (medium)
- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` — Missing name/role/value [WCAG] (medium)
- `det-wcag-improper-content-structure-https-weknowthewhy-com-contact` — Improper content structure [WCAG] (low)

#### WCAG 2.1 SC 1.4.1 (A)

**Violation type:** color as sole indicator

**What was found:** 12 inline link(s) are distinguished from surrounding text by color alone (no underline, border, or background).

**Required remediation:** Supplement color with additional visual cues: underline inline links, or add icons/patterns. Do not rely on color alone to convey meaning.

**Affected findings:**

- `det-wcag-insufficient-contrast-ratio-https-weknowthewhy-com` — Insufficient contrast ratio [WCAG] (medium)
- `det-wcag-color-as-sole-indicator-https-weknowthewhy-com-about` — Color as sole indicator [WCAG] (medium)
- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` — Missing name/role/value [WCAG] (medium)
- `det-wcag-improper-content-structure-https-weknowthewhy-com-contact` — Improper content structure [WCAG] (low)

#### WCAG 2.1 SC 4.1.2 (A)

**Violation type:** missing name/role/value

**What was found:** 2 UI component(s) lack an accessible name, preventing assistive technology from conveying their purpose.

**Required remediation:** Add accessible names (visible text, aria-label, or aria-labelledby) and appropriate roles. Prefer native HTML semantics over ARIA.

**Affected findings:**

- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` — Missing name/role/value [WCAG] (medium)
- `det-wcag-improper-content-structure-https-weknowthewhy-com-contact` — Improper content structure [WCAG] (low)

#### WCAG 2.1 SC 1.3.1 (A)

**Violation type:** improper content structure

**What was found:** Heading hierarchy issues: heading level jumps from h1 to h3 (skips a level).

**Required remediation:** Use a single h1 per page for the main topic. Nest headings sequentially (h1 > h2 > h3) without skipping levels. Headings should describe the content that follows, not be used for styling.

**Affected findings:**

- `det-wcag-missing-name-role-value-https-weknowthewhy-com-contact` — Missing name/role/value [WCAG] (medium)
- `det-wcag-improper-content-structure-https-weknowthewhy-com-contact` — Improper content structure [WCAG] (low)

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

*14 total compliance violation(s) across 2 domain(s) (2 GDPR, 12 WCAG). Generated from audit data — no additional API cost.*
