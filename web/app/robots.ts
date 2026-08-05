import type { MetadataRoute } from "next";

/* Static, like everything else outside the workspace: no request-time input, so it is
 * generated at build and served as a file.
 *
 * /prototype is a clickable prototype holding invented people and nothing else. It is
 * kept out of the index because it is not a product and reads as one, not because it
 * is private — obscurity is not access control, which is exactly why no real candidate
 * data goes in it. /app already carries `robots: { index: false }` in its own metadata;
 * the line here is belt as well as braces, since a workspace URL is not something a
 * crawler should be following either. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/prototype", "/app"],
    },
  };
}
