export const runtime = "nodejs";

import Parser from "rss-parser";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";

type FeedUrl = { source: string; url: string };

type CustomItem = {
    title?: string;
    link?: string;
    isoDate?: string;
    pubDate?: string;
    contentSnippet?: string;
};

type CustomFeed = {
    items: CustomItem[];
};

function getFeedUrls(): FeedUrl[] {
    const raw = process.env.NEWS_FEEDS ?? "";
    const list = raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    const defaults: string[] = [
        "https://www.blockmedia.co.kr/feed",
    ];

    const src = list.length ? list : defaults;

    return src.map((u): FeedUrl => {
        try {
            const host = new URL(u).hostname.replace(/^www\./, "");
            return { source: host, url: u };
        } catch {
            return { source: "custom", url: u };
        }
    });
}

function extractSymbols(text: string): string[] {
    const match = (text || "").match(/\b[A-Z]{2,6}\b/g);
    return match ? Array.from(new Set(match)).slice(0, 4) : [];
}

export async function GET(): Promise<Response> {
    try {
        const feeds = getFeedUrls();

        const parser = new Parser<CustomFeed, CustomItem>({
            headers: { "User-Agent": "TradeHubBot/1.0" },
        });

        for (const f of feeds) {
            try {
                const feed = await parser.parseURL(f.url);

                for (const item of feed.items ?? []) {
                    const title = item.title ?? "";
                    const url = item.link ?? "";
                    if (!title || !url) continue;

                    const published_at = new Date(
                        item.isoDate || item.pubDate || Date.now()
                    ).toISOString();

                    const { error } = await supabaseAdmin
                        .from("news_items")
                        .upsert(
                            [
                                {
                                    source: f.source,
                                    title,
                                    url,
                                    symbols: extractSymbols(title),
                                    summary:
                                        item.contentSnippet?.slice(0, 500) ??
                                        null,
                                    published_at,
                                },
                            ],
                            { onConflict: "url" }
                        );

                    if (error) {
                        console.error("[news upsert error]", error, url);
                    }
                }
            } catch (e) {
                console.error("[feed error]", f.url, e);
            }
        }

        return new Response("ok");
    } catch (e) {
        console.error("[collect fatal]", e);
        return new Response("error", { status: 500 });
    }
}
