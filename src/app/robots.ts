import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/_next/"],
            },
            {
                userAgent: "Googlebot",
                allow: "/",
                disallow: ["/api/", "/_next/"],
            },
            {
                userAgent: "Bingbot",
                allow: "/",
                disallow: ["/api/", "/_next/"],
                crawlDelay: 1,
            },
            {
                userAgent: "Yeti",
                allow: "/",
                disallow: ["/api/", "/_next/"],
                crawlDelay: 1,
            },
        ],
        // sitemap-removed.xml은 삭제한 URL의 재크롤을 재촉하는 임시 사이트맵이다. 색인이 정리되면 뺀다.
        sitemap: ["https://www.tradehub.kr/sitemap.xml", "https://www.tradehub.kr/sitemap-removed.xml"],
        host: "https://www.tradehub.kr",
    };
}
