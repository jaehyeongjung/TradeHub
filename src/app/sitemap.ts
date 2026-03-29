import type { MetadataRoute } from "next";
import { getAllNewsIds } from "@/lib/news";
import { getAllPostIds } from "@/lib/posts";
import { guides } from "@/lib/guides";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = "https://www.tradehub.kr";

    const newsItems = await getAllNewsIds(500);
    const newsSitemap: MetadataRoute.Sitemap = newsItems.map((news) => ({
        url: `${base}/news/${news.id}`,
        lastModified: new Date(news.published_at),
        changeFrequency: "daily",
        priority: 0.7,
    }));

    const postItems = await getAllPostIds(1000);
    const postsSitemap: MetadataRoute.Sitemap = postItems.map((post) => ({
        url: `${base}/posts/${post.id}`,
        lastModified: new Date(post.created_at),
        changeFrequency: "weekly",
        priority: 0.6,
    }));

    const guideSitemap: MetadataRoute.Sitemap = guides.map((guide) => ({
        url: `${base}/guide/${guide.slug}`,
        lastModified: new Date(guide.updatedAt),
        changeFrequency: "monthly",
        priority: 0.8,
    }));

    return [
        {
            url: `${base}/`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 1,
        },
        {
            url: `${base}/dashboard`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.8,
        },
        {
            url: `${base}/trading`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.9,
        },
        {
            url: `${base}/ranking`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.9,
        },
        {
            url: `${base}/altseason`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.85,
        },
        {
            url: `${base}/guide`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        ...guideSitemap,
        ...newsSitemap,
        ...postsSitemap,
    ];
}

export const revalidate = 3600;
