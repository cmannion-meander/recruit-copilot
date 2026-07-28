// The apex is canonical; the redirect host permanently redirects to it. See ADR 0005.
// App Service has no hostname redirect of its own, so the rule lives here.
// Both come from the environment — no hardcoded hosts. If either is unset (local dev,
// or a build before the hostnames are bound) the rule is omitted rather than guessed at.
const canonicalHost = process.env.CANONICAL_HOST;
const redirectHost = process.env.REDIRECT_HOST;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Marketing routes are static. App routes will opt into dynamic individually.
  reactStrictMode: true,
  poweredByHeader: false,

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
};

export default nextConfig;
