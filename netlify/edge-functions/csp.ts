// Netlify Edge Function — per-request nonce + strict Content-Security-Policy (WL-20).
//
// The site is statically prerendered, so it can't mint a fresh nonce per request.
// This runs on every HTML response: it generates a nonce, rewrites every
// `<script ...>` to carry that nonce, and sets a nonce-based CSP to match.
//
// 'strict-dynamic' is the key: a script trusted via its nonce may load further
// scripts (our nonced GTM loader -> gtm.js -> GA4), so we don't need to host-
// allowlist Google's rotating script URLs. Browsers that understand
// 'strict-dynamic' ignore the trailing `https: 'unsafe-inline'`; legacy browsers
// ignore the nonce and fall back to them, so nothing hard-breaks on old clients.
//
// Rollout is controlled by the CSP_MODE env var (Netlify UI -> Site settings ->
// Environment variables), so enforcement flips without a code change:
//   - unset / "report-only" (default): emits Content-Security-Policy-Report-Only.
//     Nonces are real here, so violations are ACTUALLY reported — unlike the old
//     static 'unsafe-inline' report-only, which could never fire. Ships safely;
//     blocks nothing.
//   - "enforce": emits Content-Security-Policy. The browser blocks violations.
// Watch reports on a deploy preview first, then set CSP_MODE=enforce. Instant
// and reversible.
import type { Config, Context } from "https://edge.netlify.com";

function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export default async function handler(
  _req: Request,
  ctx: Context,
): Promise<Response> {
  const res = await ctx.next();

  // Only rewrite HTML documents; everything else (assets, redirects) passes through.
  if (!(res.headers.get("content-type") || "").includes("text/html")) {
    return res;
  }

  const nonce = makeNonce();
  const html = await res.text();

  // Add the nonce to every opening <script> tag — inline, module, external, and
  // ld+json alike. The negative lookahead skips any tag that somehow already has
  // one. `</script>` closers don't match (no leading slash form).
  const noncedHtml = html.replace(
    /<script(?![^>]*\bnonce=)/gi,
    `<script nonce="${nonce}"`,
  );

  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    // Styles stay permissive: Astro/Tailwind emit un-nonced <style> + inline
    // style attributes; nonce-ing those is a separate, lower-value lift.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com",
    "font-src 'self'",
    "connect-src 'self' https://plausible.io https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
    "frame-src https://www.googletagmanager.com",
  ].join("; ");

  const enforce =
    (Netlify.env.get("CSP_MODE") || "").toLowerCase() === "enforce";

  const headers = new Headers(res.headers);
  // This edge function is the single owner of CSP — drop any static CSP that
  // netlify.toml may still attach so the two can't disagree.
  headers.delete("content-security-policy");
  headers.delete("content-security-policy-report-only");
  headers.set(
    enforce ? "content-security-policy" : "content-security-policy-report-only",
    policy,
  );

  return new Response(noncedHtml, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export const config: Config = {
  path: "/*",
  // Skip non-HTML paths so the function never buffers large binaries.
  excludedPath: [
    "/_astro/*",
    "/fonts/*",
    "/*.xml",
    "/*.txt",
    "/*.ico",
    "/*.svg",
    "/*.png",
    "/*.jpg",
    "/*.webp",
    "/*.woff2",
  ],
};
