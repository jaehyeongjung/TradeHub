"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type NewsItem = {
    id: string;
    source: string;
    title: string;
    url: string;
    symbols: string[] | null;
    published_at: string;
};

export default function NewsPanel({ roomId }: { roomId: string }) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data: sess } = await supabase.auth.getSession();
            setUserId(sess.session?.user?.id ?? null);

            const { data, error } = await supabase
                .from("news_items")
                .select("id,source,title,url,symbols,published_at")
                .order("published_at", { ascending: false })
                .limit(30);

            if (!error && data) setNews(data as NewsItem[]);
            setLoading(false);
        })();
    }, []);

    const shareToChat = async (n: NewsItem) => {
        if (!userId) return;
        const text = `[NEWS] ${n.title}  ${n.url}`;
        await supabase
            .from("messages")
            .insert([{ room_id: roomId, user_id: userId, content: text }]);
    };

    return (
        <>
            {/* 스크롤바 숨김 유틸 */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
            .scrollbar-hide::-webkit-scrollbar{width:0!important;height:0!important;display:none}
            .scrollbar-hide{scrollbar-width:none;-ms-overflow-style:none}
          `,
                }}
            />
            {/* 바깥 래퍼: 높이 꽉 + 내부 스크롤을 위해 min-h-0 */}
            <div className="h-full min-h-0 flex flex-col rounded-xl border border-neutral-700 bg-neutral-900/70 overflow-hidden">
                {/* 헤더(고정) */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/70 sticky top-0 z-10">
                    <h3 className="text-sm font-semibold">최신 뉴스</h3>
                    <span className="text-xs text-neutral-500">최근 30개</span>
                </div>

                {/* 본문 스크롤 영역 */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 pr-2 scrollbar-hide">
                    {loading ? (
                        <div className="rounded-xl border border-neutral-700 bg-neutral-900/70 p-3 text-sm text-neutral-400">
                            뉴스 로딩중...
                        </div>
                    ) : !news.length ? (
                        <div className="text-xs text-neutral-500">
                            표시할 뉴스가 없습니다.
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {news.map((n) => (
                                <li
                                    key={n.id}
                                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        {/* 내용 영역이 줄어들 수 있도록 min-w-0 필수 */}
                                        <div className="min-w-0">
                                            <div className="text-xs text-neutral-400">
                                                [{n.source}]
                                            </div>
                                            <a
                                                className="block truncate text-sm text-neutral-100 hover:underline"
                                                href={n.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                title={n.title}
                                            >
                                                {n.title}
                                            </a>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {(n.symbols ?? [])
                                                    .slice(0, 4)
                                                    .map((sym) => (
                                                        <span
                                                            key={sym}
                                                            className="rounded bg-neutral-800 px-2 py-[1px] text-[10px] text-neutral-300"
                                                        >
                                                            {sym}
                                                        </span>
                                                    ))}
                                                <span className="ml-auto text-[10px] text-neutral-500">
                                                    {new Date(
                                                        n.published_at
                                                    ).toLocaleString("ko-KR", {
                                                        hour12: false,
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 버튼 영역은 고정 폭/축소 금지 */}
                                        <div className="flex shrink-0 flex-col gap-1">
                                            <a
                                                className="rounded bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-700"
                                                href={n.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                열기
                                            </a>
                                            <button
                                                disabled={!userId}
                                                onClick={() => shareToChat(n)}
                                                className={`rounded px-2 py-1 text-[11px] ${
                                                    userId
                                                        ? "bg-blue-600 text-white hover:bg-blue-500"
                                                        : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                                                }`}
                                            >
                                                채팅에 공유
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
