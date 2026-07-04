import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/checkout", "/success", "/orders"],
    },
    sitemap: "https://lovlos.vercel.app/sitemap.xml",
  };
}
