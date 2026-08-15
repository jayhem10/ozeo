import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/transactions", "/budgets", "/settings"] },
    ],
    sitemap: "https://ozeo.example.com/sitemap.xml",
  };
}
