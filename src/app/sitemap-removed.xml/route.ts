import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { REMOVED_STOCK_SLUGS } from "@/shared/constants/removed-paths";

// 삭제한 URL만 모은 임시 사이트맵. 구글에 "이 주소들을 다시 크롤하라"고 알리는 용도다.
//
// /news·/en·해외 종목은 middleware가 410을 주지만, 사이트맵과 내부 링크에서 빠진 뒤로
// 구글이 다시 찾아오지 않았다. 2026-09-27 기준 색인 868개 중 800개 이상이 7월 크롤 기록 그대로인
// /news/* 였고, 애드센스 "가치가 별로 없는 콘텐츠" 반려가 계속됐다.
// 여기 넣으면 재크롤 → 410 확인 → 색인 제거로 이어진다.
//
// GSC 색인 수가 실제 페이지 수(40개 안팎)로 내려오면 이 라우트와 robots.ts의 등록을 지운다.

const BASE = "https://www.tradehub.kr";
// middleware에 410을 넣은 날. 이후에 수집된 뉴스는 페이지가 없던 시절이라 색인된 적이 없다.
const NEWS_CUTOFF = "2026-08-12";
const PAGE = 1000;

const EN_PATHS = [
    "/en", "/en/dashboard", "/en/trading", "/en/ranking", "/en/analysis",
    "/en/guide", "/en/terms", "/en/privacy",
    ...["kimchi-premium", "fear-greed-index", "crypto-liquidation", "leverage-trading",
        "cross-isolated-margin", "bitcoin-paper-trading", "crypto-whale", "crypto-treemap",
    ].map((slug) => `/en/guide/${slug}`),
];

async function getRemovedNewsIds(): Promise<string[]> {
    const ids: string[] = [];
    for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabaseAdmin
            .from("news_items")
            .select("id")
            .lt("created_at", NEWS_CUTOFF)
            .order("created_at", { ascending: true })
            .range(from, from + PAGE - 1);
        if (error) throw error;
        ids.push(...(data ?? []).map((row) => row.id as string));
        if (!data || data.length < PAGE) return ids;
    }
}

export async function GET() {
    const newsIds = await getRemovedNewsIds();
    const paths = [
        ...newsIds.map((id) => `/news/${id}`),
        ...EN_PATHS,
        ...REMOVED_STOCK_SLUGS.map((slug) => `/stocks/${slug}`),
    ];

    // lastmod를 오늘로 둬야 구글이 "바뀌었다"고 보고 다시 찾아온다.
    const lastmod = new Date().toISOString().slice(0, 10);
    const body =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        paths.map((p) => `<url><loc>${BASE}${p}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n") +
        `\n</urlset>\n`;

    return new Response(body, {
        headers: { "content-type": "application/xml; charset=utf-8" },
    });
}

export const revalidate = 86400;
