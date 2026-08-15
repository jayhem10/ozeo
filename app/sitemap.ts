import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://ozeo.example.com", changeFrequency: "monthly", priority: 1 },
    { url: "https://ozeo.example.com/login", changeFrequency: "yearly", priority: 0.5 },
  ];
}
