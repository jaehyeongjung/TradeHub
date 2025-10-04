import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://trade-hub-neon.vercel.app";
    return [
        {
            url: `${base}/`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 1,
        },
    ];
}
