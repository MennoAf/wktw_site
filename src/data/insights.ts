// Single source of truth for insights post metadata (WL-18).
//
// Article *bodies* stay in their own .astro files under src/pages/insights/ —
// they're bespoke, long-form layouts, not uniform prose. This module holds the
// metadata that both the index listing and the article itself consume, so the
// two can't drift (they used to duplicate title/description/date/etc.).
//
// Add a post: append an entry here, then create src/pages/insights/<slug>.astro.
// When publishing volume grows enough that hand-written .astro bodies become the
// friction, this is the seam to graduate into an Astro content collection.

export interface InsightPost {
  /** URL slug; the page lives at src/pages/insights/<slug>.astro. */
  slug: string;
  /** Listing title, article <h1> base, and JSON-LD headline (sentence case). */
  title: string;
  /** <title> override in title case; falls back to `title` when omitted. */
  pageTitle?: string;
  description: string;
  author: string;
  /** schema.org Person @id defined on /about. */
  authorId: string;
  authorTitle: string;
  /** ISO date — drives <time datetime> and JSON-LD datePublished. */
  date: string;
  /** Human-readable date, e.g. "May 24, 2026". */
  dateLabel: string;
  readingTime: string;
  tag: string;
}

export const insights: InsightPost[] = [
  {
    slug: 'why-most-audits-dont-change-anything',
    title: "Why most audits don't change anything",
    pageTitle: "Why Most Audits Don't Change Anything",
    description:
      "There's a structural reason your last six-figure audit ended up in a Google Drive folder nobody opens. It's not your team — it's the shape of the work.",
    author: 'Jason Bauman',
    authorId: 'https://weknowthewhy.com/about#jason-bauman',
    authorTitle: 'Chief Product Officer',
    date: '2026-05-24',
    dateLabel: 'May 24, 2026',
    readingTime: '6 min read',
    tag: 'Audit Process',
  },
];

/** Canonical path for a post. */
export const postHref = (post: InsightPost): string => `/insights/${post.slug}/`;

/** Find a post by slug. Throws if missing so a typo fails the build, not at runtime. */
export function getPost(slug: string): InsightPost {
  const post = insights.find((p) => p.slug === slug);
  if (!post) throw new Error(`No insights post with slug "${slug}"`);
  return post;
}

/** Posts newest-first, for listings. */
export const insightsByDate = (): InsightPost[] =>
  [...insights].sort((a, b) => (a.date < b.date ? 1 : -1));
