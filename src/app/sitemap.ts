import type { MetadataRoute } from "next";
import { guides } from "@/shared/lib/guides";
import { stockTokens } from "@/shared/lib/stock-tokens";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base = "https://www.tradehub.kr";

    // 영문(/en/**) 24개도 제거했다. 도구 페이지가 89~167단어짜리 껍데기라
    // (한글에만 붙인 PageExplainer가 영문에는 없었다) 애드센스 "가치가 별로 없는 콘텐츠"
    // 판정의 가장 큰 원인이었다. 다국어를 접고 한글 한 언어만 유지하기로 했다.
    // 색인에 남은 URL은 middleware가 410으로 응답한다.
    //
    // /news/[id]와 /posts/[id]는 제거했다. 둘 다 사이트 안에서 도달할 경로가 없는
    // 고아 페이지였는데(뉴스는 원문 링크만, 게시글은 모달로 보여준다) 사이트맵으로만
    // 각각 500·1,000개가 색인돼 애드센스 "가치가 별로 없는 콘텐츠" 판정을 받았다.
    // 되살릴 거면 페이지에 실제 읽을거리를 채운 뒤에 사이트맵에 다시 넣는다.

    const guideSitemap: MetadataRoute.Sitemap = guides.map((guide) => ({
        url: `${base}/guide/${guide.slug}`,
        lastModified: new Date(guide.updatedAt),
        changeFrequency: "monthly",
        priority: 0.8,
    }));

    // 주식 토큰 — 시세가 계속 바뀌므로 daily
    const stockSitemap: MetadataRoute.Sitemap = stockTokens.map((token) => ({
        url: `${base}/stocks/${token.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: token.market === "KR" ? 0.9 : 0.8,
    }));

    const legalSitemap: MetadataRoute.Sitemap = [
        // 운영자·데이터 출처·수익 모델을 밝히는 페이지. 애드센스 심사에서 자주 요구된다.
        { url: `${base}/about`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
        { url: `${base}/terms`,    lastModified: new Date("2025-06-01"), changeFrequency: "yearly", priority: 0.4 },
        { url: `${base}/privacy`,  lastModified: new Date("2025-06-01"), changeFrequency: "yearly", priority: 0.4 },
    ];

    return [
        {
            url: `${base}/dashboard`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 1,
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
            url: `${base}/guide`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${base}/stocks`,
            lastModified: new Date(),
            changeFrequency: "hourly",
            priority: 0.95,
        },
        ...stockSitemap,
        ...guideSitemap,
        ...legalSitemap,
    ];
}

export const revalidate = 3600;
