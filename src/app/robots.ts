import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: "*", allow: "/" }],
        sitemap: "https://www.tradehub.kr/sitemap.xml",
        host: "https://www.tradehub.kr",
    };
}
