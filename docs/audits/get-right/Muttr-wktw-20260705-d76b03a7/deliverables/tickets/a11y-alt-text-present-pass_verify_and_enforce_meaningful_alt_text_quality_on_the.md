---
finding_id: "a11y-alt-text-present-pass"
title: "All images have alt text and dimensions — PASS"
severity: "low"
root_cause_cluster: "Isolated issue"
why_this_matters: "Meaningful alt text on named person images satisfies WCAG 1.1.1 (Level A)."
fix_summary: "Verify and enforce meaningful alt text quality on the three team member images (brandon-griner.webp, jon-lister.webp, jason-bauman.webp) in the Team/About template."
confidence_tier: "confirmed"
remediation_surface: "source_code"
---

# All images have alt text and dimensions — PASS

**Finding:** All images have alt text and dimensions — PASS  
**Severity:** Low  
**Why this matters:** Meaningful alt text on named person images satisfies WCAG 1.1.1 (Level A).  
**Root cause:** Isolated issue  
**Surface:** Source code  
**Effort:** quick_win  
**Fix:** Verify and enforce meaningful alt text quality on the three team member images (brandon-griner.webp, jon-lister.webp, jason-bauman.webp) in the Team/About template.  

> **Evidence Basis:** Confirmed

---

## Impact

- **Accessibility Legal:** Meaningful alt text on named person images satisfies WCAG 1.1.1 (Level A). Screen reader users currently receive either silence (empty alt) or a filename string instead of the person's identity and role — a direct failure of non-text content accessibility. ADA web accessibility lawsuits are well-documented and frequently target exactly this class of failure on About/Team pages where personnel are introduced without accessible identification.
- **Seo Image Search:** Google Image Search uses alt text as the primary signal for indexing and ranking images. A team photo with alt='Brandon Griner, Co-Founder at [Company]' creates a named-entity association between the person, their role, and the brand — contributing to Knowledge Graph signals and branded search. A filename-derived or empty alt provides none of this. The mechanism is direct: Google's image indexing pipeline treats alt as the image's textual representation.
- **Brand Trust:** Team pages are high-intent trust signals for B2B and service businesses. A screen reader announcing 'brandon-griner-dot-webp' instead of 'Brandon Griner, Co-Founder' degrades the credibility of the page for assistive technology users — a segment that includes decision-makers and procurement contacts.

## How to verify

**What to look for:** The DOM reports 0 images missing alt attributes out of 3 total images.. All images have width and height attributes set (0 missing dimensions).

**Measured evidence:**
- Total Images: 3
- Missing Alt: 0
- Missing Dimensions: 0
- Image Filenames: ['brandon-griner.webp', 'jon-lister.webp', 'jason-bauman.webp']
- Images Missing Alt: 0
- Fetchpriority Set: 1
- Lazy Loaded Above Fold: 0
- Image Url: https://weknowthewhy.com/content-hero.svg

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
Verify and enforce meaningful alt text quality on the three team member images (brandon-griner.webp, jon-lister.webp, jason-bauman.webp) in the Team/About template. Attribute presence is confirmed; attribute content is unverified. Promote the data model from implicit (filename-derived or editor-entered freeform) to explicit (structured, co-located with the person record) so alt text is enforced at the component boundary, not left to editorial discretion.

### How
1. INSPECT CURRENT ALT VALUES: Open the rendered About/Team page in browser DevTools → Elements panel. For each <img>, read the actual alt attribute string. Classify each as: (a) empty string — decorative intent, wrong for a named person, (b) filename bleed e.g. 'brandon-griner.webp' or 'Brandon Griner' — CMS auto-populated from filename, (c) generic e.g. 'Photo', 'Team member' — useless, (d) meaningful e.g. 'Brandon Griner, Co-Founder of Acme' — correct target. Do not close this finding until you have read all three strings.
2. LOCATE THE TEAM DATA SOURCE: In the Astro project, find where team member data is defined. Common patterns: (a) a content collection in src/content/team/ with individual .md or .json files, (b) a data file at src/data/team.ts or team.json, (c) props passed inline in the .astro page file. The fix must be applied at the data source, not patched in the template.
3. ADD A REQUIRED alt FIELD TO THE DATA SCHEMA: If using Astro Content Collections (src/content/team/), add an alt field to the collection schema in src/content/config.ts using z.string().min(10) to reject empty or trivially short strings at build time. If using a plain data file, add an alt property to each team member object and add a TypeScript type that marks it required.
4. POPULATE THE alt FIELD FOR ALL THREE MEMBERS: Write the alt string as '[Full Name], [Role] at [Company Name]'. This pattern satisfies WCAG 1.1.1 (non-text content), provides screen reader context, and contributes a named-entity signal to image SEO. Do not reuse the filename slug as the alt value.
5. UPDATE THE TEAM MEMBER COMPONENT: In the .astro component that renders team photos, replace any hardcoded, derived, or optional alt binding with the explicit alt field from the data model. Add a build-time assertion so a missing or empty alt causes a type error, not a silent empty attribute.
6. ADD A BUILD-TIME AUDIT SCRIPT (OPTIONAL BUT RECOMMENDED): Add a Node script runnable via 'astro check' or as a pre-build step that reads all team content entries and asserts alt is present, non-empty, and does not match the image filename. This prevents regression when new team members are added.

### Code examples
```
// src/content/config.ts — enforce alt at the collection schema level
import { defineCollection, z } from 'astro:content';

// SITE-SPECIFIC ASSUMPTION: team member photos are managed via the 'team' content collection.
// Adjust collection name if your project uses a different directory.
const MIN_ALT_LENGTH = 10; // Rejects empty strings, filenames, and single-word values like 'Photo'

const teamCollection = defineCollection({
  type: 'data', // use 'content' if entries are .md files with frontmatter
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      // image() helper validates the path resolves to a real asset at build time
      photo: image(),
      // alt is required and must be substantive — build fails if missing or too short
      alt: z
        .string()
        .min(MIN_ALT_LENGTH, {
          message:
            'alt text must be at least 10 characters. Use format: "[Name], [Role] at [Company]"',
        })
        .refine(
          (val) => !/\.(webp|jpg|jpeg|png|avif|gif)$/i.test(val),
          { message: 'alt text must not be a filename. Provide a descriptive string.' }
        ),
      bio: z.string().optional(),
    }),
});

export const collections = {
  team: teamCollection,
};
// src/content/team/brandon-griner.json — data entry with explicit alt
// Repeat this pattern for jon-lister.json and jason-bauman.json
// SITE-SPECIFIC ASSUMPTION: company name must be updated to match the actual brand name.
{
  "name": "Brandon Griner",
  "role": "Co-Founder",
  "photo": "../../assets/team/brandon-griner.webp",
  "alt": "Brandon Griner, Co-Founder at [Company Name]",
  "bio": "Optional bio text here."
}
// src/components/TeamMemberCard.astro — component consuming the enforced alt field
---
import { Image } from 'astro:assets';

interface Props {
  name: string;
  role: string;
  // photo is typed as ImageMetadata when resolved through Astro's image() schema helper
  photo: ImageMetadata;
  // alt is required — no default, no fallback to name or filename
  alt: string;
  bio?: string;
}

const { name, role, photo, alt, bio } = Astro.props;

// SITE-SPECIFIC ASSUMPTION: width/height values below match the design's card layout.
// Adjust to match actual rendered dimensions to prevent CLS.
const CARD_IMAGE_WIDTH = 400;  // px — intrinsic width served to browser
const CARD_IMAGE_HEIGHT = 400; // px — intrinsic height; preserves aspect ratio reservation
---

<article class="team-card">
  <Image
    src={photo}
    alt={alt}
    width={CARD_IMAGE_WIDTH}
    height={CARD_IMAGE_HEIGHT}
    loading="lazy"
    decoding="async"
    format="webp"
  />
  <div class="team-card__info">
    <h3 class="team-card__name">{name}</h3>
    <p class="team-card__role">{role}</p>
    {bio && <p class="team-card__bio">{bio}</p>}
  </div>
</article>

<style>
  /* Scoped to .team-card — does not bleed to other image contexts */
  .team-card img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    display: block;
  }
</style>
// scripts/audit-alt-text.mjs — pre-build guard, run via: node scripts/audit-alt-text.mjs
// Add to package.json: "prebuild": "node scripts/audit-alt-text.mjs"
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

// SITE-SPECIFIC ASSUMPTION: team content lives at this path. Adjust if different.
const TEAM_CONTENT_DIR = './src/content/team';
const MIN_ALT_LENGTH = 10;
const FILENAME_PATTERN = /\.(webp|jpg|jpeg|png|avif|gif)$/i;

async function auditAltText() {
  let files;
  try {
    files = await readdir(TEAM_CONTENT_DIR);
  } catch (err) {
    console.error(`[alt-audit] Cannot read ${TEAM_CONTENT_DIR}:`, err.message);
    process.exit(1);
  }

  const jsonFiles = files.filter((f) => extname(f) === '.json');
  const failures = [];

  for (const file of jsonFiles) {
    const filePath = join(TEAM_CONTENT_DIR, file);
    let entry;
    try {
      const raw = await readFile(filePath, 'utf-8');
      entry = JSON.parse(raw);
    } catch (err) {
      failures.push(`${file}: JSON parse error — ${err.message}`);
      continue;
    }

    if (!entry.alt || typeof entry.alt !== 'string') {
      failures.push(`${file}: missing 'alt' field`);
    } else if (entry.alt.trim().length < MIN_ALT_LENGTH) {
      failures.push(`${file}: alt text too short ("${entry.alt}")`);
    } else if (FILENAME_PATTERN.test(entry.alt.trim())) {
      failures.push(`${file}: alt text appears to be a filename ("${entry.alt}")`);
    }
  }

  if (failures.length > 0) {
    console.error('[alt-audit] Alt text failures detected:');
    failures.forEach((f) => console.error(' •', f));
    process.exit(1); // Fails the build
  }

  console.log(`[alt-audit] All ${jsonFiles.length} team entries passed alt text validation.`);
}

auditAltText();
```

## Risks
- If the team data is currently defined as inline props in the .astro page (not a content collection or data file), the schema enforcement approach does not apply — the fix must instead be a TypeScript interface with a required alt field on the props type, and the audit script must be adapted to parse .astro frontmatter instead of JSON files.
- The z.string().min(10) guard rejects empty alt strings, which is correct for named persons but would be wrong for decorative images. This schema is scoped to the team collection only — do not apply it globally to an image schema used for decorative or background images.
- If Astro's image() schema helper is not used (e.g., photo is stored as a plain string path rather than a resolved ImageMetadata), the Image component import from 'astro:assets' will throw at build time. Verify the photo field resolves correctly before switching to the Image component.
- The audit script (audit-alt-text.mjs) only covers JSON data files. If team entries are .md files with YAML frontmatter, the script must be updated to parse frontmatter using a library like gray-matter — the current implementation will silently skip .md files.

## Effort & Cost
- **Effort:** quick_win
- **Cost:** low
