import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://www.tradehub.kr";
    return [
        {
            url: `${base}/`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 1,
        },
        // 다른 고정 페이지가 생기면 여기에 추가
    ];
}
