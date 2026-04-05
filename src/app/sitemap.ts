import type { MetadataRoute } from "next";
import { getAllNewsIds } from "@/shared/lib/news";
import { getAllPostIds } from "@/shared/lib/posts";
import { guides } from "@/shared/lib/guides";
import { guidesEn } from "@/shared/lib/guides-en";

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

    const enGuideSitemap: MetadataRoute.Sitemap = guidesEn.map((guide) => ({
        url: `${base}/en/guide/${guide.slug}`,
        lastModified: new Date(guide.updatedAt),
        changeFrequency: "monthly",
        priority: 0.8,
    }));

    const legalSitemap: MetadataRoute.Sitemap = [
        { url: `${base}/terms`,    lastModified: new Date("2025-06-01"), changeFrequency: "yearly", priority: 0.4 },
        { url: `${base}/privacy`,  lastModified: new Date("2025-06-01"), changeFrequency: "yearly", priority: 0.4 },
        { url: `${base}/en/terms`, lastModified: new Date("2025-06-01"), changeFrequency: "yearly", priority: 0.4 },
        { url: `${base}/en/privacy`, lastModified: new Date("2025-06-01"), changeFrequency: "yearly", priority: 0.4 },
    ];

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
            url: `${base}/analysis`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.95,
        },
        {
            url: `${base}/en/analysis`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.95,
        },
        {
            url: `${base}/en/dashboard`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.85,
        },
        {
            url: `${base}/en/trading`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.85,
        },
        {
            url: `${base}/en/ranking`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.85,
        },
{
            url: `${base}/guide`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${base}/en/guide`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        ...guideSitemap,
        ...enGuideSitemap,
        ...legalSitemap,
        ...newsSitemap,
        ...postsSitemap,
    ];
}

export const revalidate = 3600;
