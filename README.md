# wktw-site

Marketing site for **WKTW (We Know The Why)** — a systems-driven growth agency.

## Stack

- **Framework:** [Astro 6](https://astro.build) (static output)
- **UI islands:** [Svelte 5](https://svelte.dev) via `@astrojs/svelte`
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- **Sitemap:** `@astrojs/sitemap`
- **Node:** `>=22.12.0`

## Local development

```sh
npm install
npm run dev      # http://localhost:4321
```

| Command            | What it does                                  |
| :----------------- | :-------------------------------------------- |
| `npm run dev`      | Start the dev server with HMR                 |
| `npm run build`    | Build static site to `./dist/`                |
| `npm run preview`  | Serve `./dist/` locally before deploying      |

## Project layout

```
public/                    # static assets (favicons, OG image, robots.txt)
src/
├── components/            # Astro + Svelte components (Header, Footer, Section, ...)
├── layouts/               # BaseLayout — wraps every page with head, header, footer
├── pages/                 # file-based routing (each .astro = a route)
│   ├── index.astro
│   ├── 404.astro
│   ├── about.astro
│   ├── contact.astro
│   ├── scan.astro
│   ├── insights/          # Phase 2 stub (hidden until first post)
│   ├── proof/             # case studies + own-site audit
│   ├── the-get-right/     # the audit product family
│   └── legal/             # privacy + terms
└── styles/
    └── global.css         # Tailwind import + brand tokens (@theme block)
```

## Brand tokens

All colors, fonts, and spacing live in `src/styles/global.css` inside the
Tailwind `@theme` block. Editing tokens there propagates through every
`bg-*`, `text-*`, and `border-*` utility automatically — no hex codes
should appear in component markup.

Core palette:

| Token                      | Hex       | Usage                          |
| :------------------------- | :-------- | :----------------------------- |
| `--color-bg-surface`       | `#2C211D` | Page background                |
| `--color-accent`           | `#FFB300` | CTAs, links, brand highlights  |
| `--color-primary-text`     | `#EFEBE9` | Body copy on dark surfaces     |
| `--color-secondary-text`   | `#BCAAA4` | Subhead / supporting copy      |

## Deploy

Hosted on **Netlify**. `netlify.toml` declares the build command and publish
directory. Pushing to `main` triggers a deploy.

- **Forms:** `/contact` and `/scan` use [Netlify Forms](https://docs.netlify.com/forms/setup/).
  Submissions land in the Netlify dashboard and trigger email notifications.
  Astro stays `output: 'static'` — no adapter needed at this stage.
- **Scan trigger:** Async. The `/scan` form captures the URL + email, lands
  the submission in Netlify, and a manual Muttr run is kicked off from there
  until Phase 3 wires a Netlify Function to enqueue audits programmatically.
- **Trailing slashes:** Astro's `trailingSlash: 'never'` matches Netlify's
  default Pretty URLs behavior — no redirect config required.

## Conventions

- **No hex codes in components.** Use Tailwind utilities backed by `@theme` tokens.
- **Base styles live inside `@layer base`** in `global.css` so utilities can override them. (Tailwind v4 cascade rules — see commit `4643bce`.)
- **Founder voice.** Copy is direct, anti-fluff, systems-flavored. No "Oops!" no rocket emojis. See `src/pages/404.astro` for the tone.
