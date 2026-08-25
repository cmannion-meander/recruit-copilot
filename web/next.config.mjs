import { resolve } from "node:path";

/* Local development only. The repo keeps one .env at the root — that is what .env.example
 * documents — but Next only looks for env files inside its own project directory, so
 * web/ would otherwise never see MAILJET_* and the capture form would answer 503 on a
 * machine that looks correctly configured.
 *
 * process.loadEnvFile never overwrites a variable that is already set, so a real
 * environment always wins over the file. Production is exactly that case: App Service
 * supplies these as App Settings, and the deployed subtree has no ../.env at all, which
 * is why a missing file is a normal outcome here rather than an error.
 */
try {
  process.loadEnvFile(resolve(import.meta.dirname, "../.env"));
} catch {
  // No root .env: the deployed subtree, CI, or a checkout that has not made one yet.
}

// The apex is canonical; the redirect host permanently redirects to it. See ADR 0005.
// App Service has no hostname redirect of its own, so the rule lives here.
// Both come from the environment — no hardcoded hosts. If either is unset (local dev,
// or a build before the hostnames are bound) the rule is omitted rather than guessed at.
const canonicalHost = process.env.CANONICAL_HOST;
const redirectHost = process.env.REDIRECT_HOST;

// Local dev only, and deliberately a rewrite rather than CORS. Auth is a session
// cookie, not a bearer token (CLAUDE.md: no JWT) — a rewrite makes every request to
// Django same-origin from the browser's point of view, so the cookie just goes along
// for free and there is no CORS-with-credentials configuration to get wrong. Django's
// own address is an env var like everything else; it has no default in production,
// where the API is deployed and reached some other way.
const apiOrigin = process.env.DJANGO_API_ORIGIN;

// Enforced. Every directive here holds without a nonce, so none of it depends on how
// Next renders. frame-ancestors also covers what X-Frame-Options used to.
const enforcedCsp = [
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

// Reported, not enforced, and deliberately so. Next hydrates through inline
// `self.__next_f.push(...)` scripts, which a strict script-src rejects. The supported
// fix is a per-request nonce from middleware — but middleware runs on every request,
// which would take the marketing tree out of static rendering and contradict ADR 0007.
// Static pages with no third-party script are a small target, so the trade is reporting
// now and enforcement when there is a reason to pay for it.
// Fonts are self-hosted by next/font at build time, so font-src stays 'self'.
const reportedCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Marketing routes are static — each one sets `dynamic = "force-static"` itself.
  // App routes opt into dynamic individually.
  reactStrictMode: true,
  poweredByHeader: false,

  async rewrites() {
    if (!apiOrigin) return [];
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },

  async redirects() {
    if (!canonicalHost || !redirectHost) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: redirectHost }],
        destination: `https://${canonicalHost}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // TLS terminates at the App Service front end and https-only is set there;
          // this tells the browser to skip the plaintext request next time.
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: enforcedCsp },
          { key: "Content-Security-Policy-Report-Only", value: reportedCsp },
        ],
      },
    ];
  },
};

export default nextConfig;
