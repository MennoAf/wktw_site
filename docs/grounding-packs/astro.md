# Grounding Pack — Astro (static) + Tailwind

**Applies to:** Astro projects with `output: 'static'` (SSG), typically Tailwind for styles, optional
island components (Svelte/React/Vue), deployed to a static host (Netlify/Vercel/Cloudflare).
**Use when:** you have repo access and an audit report to verify against source.
**Authored from:** the WKTW `weknowthewhy.com` remediation (the commands below are the ones actually used).

> Read `README.md` for the method and the decision rules (real / stale / false / wrong-layer / additive).

---

## 0 · Map the project first

Astro's conventions decide *where* a finding can possibly live. Confirm the layout before grounding
anything:

```sh
ls astro.config.* netlify.toml vercel.json 2>/dev/null   # build + host config
ls src/pages src/layouts src/components src/styles public # source surfaces
```

| Surface | Path | What lives here |
| --- | --- | --- |
| Routes/pages | `src/pages/**/*.{astro,md,mdx}` | Every file here **is a public URL**. Page-level markup. |
| Shared shell | `src/layouts/*.astro` | `<head>`, global scripts, sitewide JSON-LD, header/footer mount. |
| Components | `src/components/*.astro` (+ `.svelte`/`.tsx`) | Reusable UI; islands ship JS only if `client:*`. |
| Global CSS / tokens | `src/styles/*.css` | Tailwind `@import` + `@theme` design tokens. |
| Static assets | `public/**` | Served verbatim at site root (fonts, images, favicons). |
| Build config | `astro.config.mjs` | Integrations (`@astrojs/sitemap`), `site`, `trailingSlash`, `output`. |
| Host config | `netlify.toml` / `_headers` / `vercel.json` | **Headers, caching, redirects, CSP, edge functions.** |
| Build output | `dist/` (after `npm run build`) | Final HTML + `dist/_astro/*` hashed assets. Ground-truth for payload/markup. |

**Two Astro facts that change verdicts:**
- `output: 'static'` → **no SSR bundle**; islands ship tiny per-component JS. Any "multi-MB application
  bundle" finding is almost always **false** here (verify with the JS-payload recipe).
- Injected `<script>` needs `is:inline` or Astro hoists/bundles it. Analytics/consent snippets live in
  the layout as `is:inline` — grep there, not in a CMS header template.

**Translation note (CMS-isms → Astro).** Reports often assume a generic CMS. Map before acting:
`child theme style.css` → `src/styles/global.css`; `{% if %}` Liquid → Astro `{cond && ...}`; "page
template variant" → a new `.astro` component/layout; "install plugin X" → an `astro.config` integration;
`<head> header.php` → `src/layouts/*.astro`.

---

## 1 · Finding-category recipes

Each recipe: **grounding command** → **how to read it** → **verdict** → **where the fix lives**.

### Analytics — standalone gtag / duplicate GA4 / dual GTM
```sh
grep -rn "gtag/js?id=\|gtag('config'\|gtag(\"config\"" src/   # standalone GA4 loader?
grep -rn "GTM-" src/                                            # how many containers?
```
- **No `gtag('config')` / `gtag/js` hit** → the only `gtag()` is the Consent Mode helper. A
  "remove the standalone gtag.js" finding is **wrong-layer** — the duplicate beacon (if real) is
  configured inside the GTM container (console), not the repo. Re-route to the tag-manager owner.
- **One `GTM-XXXX`** → "dual containers" is **false** for the repo (verify console separately).
- **Fix surface (if real & in-code):** `src/layouts/*.astro` (the `is:inline` snippets).

### Consent — scripts loading pre-consent
```sh
grep -n "is:inline\|plausible\|googletagmanager\|gtm.js\|consent" src/layouts/*.astro
```
- Consent Mode `gtag('consent','default',{...denied})` only denies **storage**, not script loading.
  If GTM/Plausible/font `<link>`s load unconditionally above the banner logic → **real** (pre-consent
  network requests fire). **Fix surface:** layout + consent component. Note cookieless tools
  (e.g. Plausible) may be a deliberate keep — confirm posture, don't assume.

### Google Fonts / external CDN
```sh
grep -rn "fonts.googleapis\|fonts.gstatic" src/ public/
```
- **Hit in a layout `<head>`** → **real** (visitor IP → Google pre-consent; render-blocking).
  **Fix:** self-host into `public/fonts/`, add `@font-face` to `src/styles/global.css`, drop the `<link>`s.
- **No hit** → **stale/false**.

### Heading hierarchy skip (h2→h4)
```sh
for f in $(grep -rl "<h[1-6]" src/pages src/components); do
  printf "%-40s " "$f"; grep -oE "<h[1-6]" "$f" | tr -d '<' | tr '\n' ' '; echo
done
```
- A sequence like `h1 h2 h4 h4 h2` → **real** skip. **It's usually systemic** (shared card/footer
  components repeat the pattern) — fix **every** template, not the one URL the report cited.
- **Fix:** change the tag, preserve visual size with a Tailwind size class (`<h3 ... text-xl>` renders
  like the old `h4`). A "build a polymorphic heading component" recommendation is usually over-engineered.

### Color-as-sole-indicator (links not underlined)
```sh
grep -n "text-decoration\|^\s*a\b\|a:hover" src/styles/global.css
```
- `a { text-decoration: none }` with color-only differentiation → **real** (WCAG 1.4.1).
  **Fix:** underline inline content links scoped to prose (`main :is(p,li) a:not([class*="bg-"])`),
  leaving nav/footer/button chrome alone. **Surface:** `src/styles/global.css`.

### Contrast ratio
```sh
grep -n "color-\|#" src/styles/global.css   # read the real @theme token pairs
```
- Compute WCAG ratio on the **actual** token pair (text token on its real background token), not the
  selector the detector cited. **fg == bg (ratio 1.00:1)** or all pairs pass AA → **false/artifact**;
  close no-op. Only a genuinely failing pair is **real** (then a theme-aligned token tweak is fine).

### Touch targets < 48px
```sh
grep -rn "py-1\|py-2\|p-1\|p-2\|h-8\|h-9\|h-10" src/components src/pages | grep -i "button\|nav\|a href\|cta"
```
- Interactive elements computing < 48px (e.g. `p-2` on a 24px icon ≈ 40px) → **real** (WCAG 2.5.8).
  **Fix:** a min-tap utility in `global.css` + per-component `min-h`/`min-w`, scoped to chrome (not body links).

### Reduced motion
```sh
grep -rn "prefers-reduced-motion" src/
grep -rn "transition\|animation\|scroll-behavior" src/styles/global.css
```
- Motion declarations present but **no `prefers-reduced-motion` hit** → **real** (WCAG 2.3.3).
  **Fix:** add a `@media (prefers-reduced-motion: reduce)` block in `global.css`.

### "X MB unused JS bundle" / payload
```sh
npm run build >/dev/null 2>&1 && find dist -name "*.js" -exec du -h {} + | sort -h
```
- Sum the real shipped JS. If total ≪ the claim (a static Astro site often ships tens of KB, not
  megabytes), the finding — and any "cart/checkout/configurator" features it names — is **false**
  (mismeasurement, likely counting analytics JS or a generic e-commerce template). Document & close.

### Security headers / CSP
```sh
curl -sI https://<live-domain>/ | grep -iE "content-security-policy|x-frame-options|x-content-type-options|referrer-policy|strict-transport-security"
grep -n "headers\|X-Frame\|Content-Security" netlify.toml _headers 2>/dev/null
```
- Absent on the live response **and** absent from host config → **real**, **wrong-layer** vs `src/`
  (fix in `netlify.toml` / `_headers`; nonce CSP needs an edge function). SRI is genuinely
  incompatible with GTM's rotating scripts — prefer nonce-CSP.

### Cache headers on hashed assets
```sh
asset=$(curl -s https://<live-domain>/ | grep -oE '/_astro/[^"]+\.(css|js)' | head -1)
curl -sI "https://<live-domain>$asset" | grep -i cache-control
```
- `/_astro/*` (content-hashed) served `max-age=0, must-revalidate` → **real**, **wrong-layer**
  (fix: `[[headers]]` in `netlify.toml` → `immutable`). HTML staying on must-revalidate is correct.

### Sitemap / OG / Twitter meta "missing"
```sh
grep -n "sitemap" astro.config.*
grep -n "og:\|twitter:" src/layouts/*.astro
```
- `@astrojs/sitemap` already imported, or OG/Twitter tags already emitted in the layout → **stale**;
  downgrade to "verify". Per-page overrides may still be **additive**.

### Structured data / schema
```sh
grep -rn "application/ld+json\|@type\|BlogPosting\|Organization\|Person" src/
```
- Organization/BlogPosting already present in layout/page → partially **stale**. Missing `Person`
  nodes, BreadcrumbList, etc. are **additive** (net-new), not defects.

### Contact form — fields / honeypot / CTA
```sh
grep -nE "type=\"url\"|type=\"submit\"|bot-field|honeypot|<button" src/pages/contact.astro
```
- An optional `type="url"` field → friction, **real** (remove). Generic submit text ("Send Message")
  → **real** (rewrite). Honeypot already wrapped in a label → "missing label" is off; the real
  hardening is `aria-hidden`/`tabindex="-1"`/`autocomplete="off"`.

### Mobile nav — dual DOM / aria
```sh
grep -nE "<nav|aria-label|aria-expanded|aria-hidden|mobile-menu|hidden" src/components/Header.astro
```
- One `<nav>` + a separate mobile menu `<div>` toggled by `class="hidden"` → links stay in the a11y
  tree when closed → **real** (add `inert`/`aria-hidden` when closed). If the button already has
  `aria-label` + `aria-expanded`, the "add accessible name" half is **stale**.

### Canonical / trailing slash
```sh
grep -n "trailingSlash\|canonical" astro.config.* src/layouts/*.astro
grep -n "trailing\|Pretty URLs\|redirect" netlify.toml
```
- `trailingSlash: 'never'` + host configured to match (Netlify Pretty URLs) → no contradiction →
  **stale/false**. Only a genuine canonical-vs-301 mismatch is **real**.

---

## 2 · Post-fix verification (every fix)

```sh
npm run build                                   # must complete; static output regenerated
grep -rn "<bad-pattern>" src/ || echo "clean"   # the grounding command should now flip
curl -sI https://<live-domain>/... | grep -i <header>   # for header/config fixes, after deploy
```

For a fuller acceptance pass, the audit's `verification/tests.json` `http_header` + `dom_assertion`
tests are runnable with `curl` + a small Node script (no Python) — but filter to real URLs first
(many ship with empty/placeholder targets).

---

## 3 · Extending to other platforms

Keep the **finding categories** above; swap only the commands and fix locations. E.g. for Sitecore the
"heading hierarchy" recipe greps `.cshtml` / SXA renderings instead of `src/pages`, and the fix surface
is a rendering/partial, not a `.astro` file. The decision rules (real/stale/false/wrong-layer/additive)
are platform-independent.
