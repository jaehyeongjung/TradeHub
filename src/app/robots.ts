import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/mobile"],
            },
            {
                userAgent: "Googlebot",
                allow: "/",
                disallow: ["/api/", "/mobile"],
                crawlDelay: 0,
            },
            {
                userAgent: "Bingbot",
                allow: "/",
                disallow: ["/api/", "/mobile"],
                crawlDelay: 1,
            },
            {
                userAgent: "Yeti",
                allow: "/",
                disallow: ["/api/", "/mobile"],
                crawlDelay: 1,
            },
        ],
        sitemap: "https://www.tradehub.kr/sitemap.xml",
        host: "https://www.tradehub.kr",
    };
}
