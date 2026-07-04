#!/usr/bin/env node
// Build-time link + sitemap validation (WL-21).
//
// Runs as a postbuild step (see package.json `build`). It crawls the generated
// `dist/` tree and fails the build (exit 1) when:
//   - an internal <a href> / asset reference points at a path that doesn't exist
//   - the sitemap is missing, empty, lists a URL with no corresponding file, or
//     leaks /scan (which is deliberately excluded — astro.config.mjs)
//
// Self-contained on purpose: no third-party link-checker dependency to vet or
// keep current. External links (http/https/mailto/tel), protocol-relative URLs,
// and same-origin *absolute* URLs are not fetched — the goal is catching broken
// internal wiring at build time, not auditing the live web.
//
// Fragment-only mismatches (#anchor with no matching id) are reported as
// warnings, not failures, because anchors are sometimes injected by client JS.

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const SITE_ORIGIN = 'https://weknowthewhy.com';

if (!existsSync(DIST)) {
  console.error('check-links: dist/ not found — run `astro build` first.');
  process.exit(1);
}

/** Recursively list every file under a directory, as posix paths relative to dist with a leading "/". */
async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full)));
    } else {
      out.push('/' + relative(DIST, full).split(/[\\/]/).join('/'));
    }
  }
  return out;
}

const allFiles = new Set(await listFiles(DIST));
const htmlFiles = [...allFiles].filter((f) => f.endsWith('.html'));

/** Does an internal path resolve to a real file in dist? Handles directory- and
 *  file-format output and trailingSlash:'never'. */
function resolves(path) {
  let p = path;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1); // normalize trailing slash
  if (p === '' || p === '/') return allFiles.has('/index.html');
  if (allFiles.has(p)) return true; // exact asset (e.g. /og-default.png)
  if (allFiles.has(p + '.html')) return true; // file-format route
  if (allFiles.has(posix.join(p, 'index.html'))) return true; // directory-format route
  return false;
}

/** Map a dist HTML file path to the URL path of the page it represents. */
function pageUrl(htmlFile) {
  if (htmlFile === '/index.html') return '/';
  if (htmlFile.endsWith('/index.html')) return htmlFile.slice(0, -'/index.html'.length);
  return htmlFile.slice(0, -'.html'.length);
}

const ATTR_RE = /(?:href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi;
const ID_RE = /\bid\s*=\s*("([^"]*)"|'([^']*)')/gi;

const errors = [];
const warnings = [];

for (const file of htmlFiles) {
  const html = await readFile(join(DIST, file.slice(1)), 'utf8');
  const fromUrl = pageUrl(file);

  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(html)) !== null) {
    const raw = (m[2] ?? m[3] ?? '').trim();
    if (!raw) continue;
    // Skip externals, protocol-relative, non-navigational schemes, and data URIs.
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue;
    if (raw.startsWith('#')) continue; // same-page fragment handled below
    if (raw.startsWith('?')) continue;

    const [pathPart, frag] = raw.split('#');
    const noQuery = pathPart.split('?')[0];

    // Resolve relative to the current page; root-relative stays as-is.
    let target;
    try {
      target = decodeURI(new URL(noQuery, SITE_ORIGIN + fromUrl + '/').pathname);
    } catch {
      target = noQuery; // malformed URI — check the raw path
    }

    if (!resolves(target)) {
      errors.push(`${file}: broken link "${raw}" → ${target} (no matching file in dist/)`);
      continue;
    }

    // Fragment check (warning only) for links within the same page.
    if (frag && (target === fromUrl || noQuery === '' || noQuery.startsWith('#'))) {
      const ids = new Set();
      let im;
      ID_RE.lastIndex = 0;
      while ((im = ID_RE.exec(html)) !== null) ids.add(im[2] ?? im[3] ?? '');
      if (!ids.has(frag)) warnings.push(`${file}: fragment "#${frag}" has no matching id on the page`);
    }
  }
}

// ── Sitemap validation ───────────────────────────────────────────────────────
const sitemapIndex = '/sitemap-index.xml';
if (!allFiles.has(sitemapIndex)) {
  errors.push(`sitemap: ${sitemapIndex} not found (is @astrojs/sitemap configured?)`);
} else {
  // Astro emits sitemap-0.xml (and -1, -2… past 45k URLs). Validate every shard.
  const shards = [...allFiles].filter((f) => /^\/sitemap-\d+\.xml$/.test(f));
  if (shards.length === 0) errors.push('sitemap: index present but no sitemap-N.xml shard found.');

  let locCount = 0;
  for (const shard of shards) {
    const xml = await readFile(join(DIST, shard.slice(1)), 'utf8');
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((mm) => mm[1]);
    for (const loc of locs) {
      locCount++;
      let path;
      try {
        path = decodeURI(new URL(loc).pathname);
      } catch {
        errors.push(`sitemap ${shard}: unparseable <loc> "${loc}"`);
        continue;
      }
      if (path === '/scan' || path.startsWith('/scan/')) {
        errors.push(`sitemap ${shard}: /scan leaked into the sitemap (must be excluded).`);
      }
      if (!resolves(path)) {
        errors.push(`sitemap ${shard}: <loc> "${loc}" → ${path} has no matching file in dist/.`);
      }
    }
  }
  if (locCount === 0) errors.push('sitemap: no <loc> entries found — sitemap is empty.');
}

// ── Report ───────────────────────────────────────────────────────────────────
for (const w of warnings) console.warn(`  ⚠ ${w}`);

if (errors.length > 0) {
  console.error(`\ncheck-links: ${errors.length} broken reference(s) found:\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('');
  process.exit(1);
}

console.log(
  `check-links: OK — ${htmlFiles.length} pages crawled, internal links + sitemap valid` +
    (warnings.length ? ` (${warnings.length} fragment warning(s))` : '') +
    '.',
);
