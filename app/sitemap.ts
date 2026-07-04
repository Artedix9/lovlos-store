import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/women`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/men`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/accessories`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/faq`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/shipping`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/size-guide`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/track`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => !p.isComingSoon)
    .map((p) => ({
      url: `${BASE}/product/${p.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticPages, ...productPages];
}
