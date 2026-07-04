// Feature flags (WL-18 visible features).
//
// These gate the additive search + social-share surfaces that satisfy the
// Get Right audit's `navigation-no-search` and `conversion-ux-social-share-1`
// checks. They're intentionally toggleable: with a single rich article today,
// site search and share buttons add little real value, so once the re-audit
// records them as present we may flip them off.
//
// To DISABLE a feature: set its flag to `false` and rebuild. The UI (nav links,
// search box, share buttons) disappears everywhere it's gated.
//   - `search` also has a build-time half: Pagefind indexes `dist/` in the
//     `build` script (package.json). Leaving it on with the flag off is
//     harmless (it just generates an unreferenced index); to fully remove it,
//     drop the `pagefind` segment from the build script too.
//   - `socialShare` is pure markup — flipping the flag is the whole switch.
export const features = {
  /** Site search: `/search` page + header/footer "Search" links (Pagefind). */
  search: true,
  /** Social share buttons (X, LinkedIn, Email) on insights articles. */
  socialShare: true,
} as const;
