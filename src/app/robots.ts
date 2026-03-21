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
        sitemap: "https://www.tradehub.kr/sitemap.xml",
        host: "https://www.tradehub.kr",
    };
}
