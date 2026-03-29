"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { createPortal } from "react-dom";
import { supabase } from "@/shared/lib/supabase-browser";
import { useToast } from "@/shared/ui/Toast";

type NewsItem = {
    id: string;
    source: string;
    title: string;
    url: string;
    symbols: string[] | null;
    published_at: string;
};

function formatRelativeTime(iso: string): string {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return "방금";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
}

export function NewsPanel({ roomId, fadeDelay = 0 }: { roomId: string; fadeDelay?: number }) {
    const { showToast } = useToast();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const isLight = useTheme();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const [viewer, setViewer] = useState<{ url: string; title: string } | null>(null);
    const [iframeReady, setIframeReady] = useState(false);
    const [iframeBlocked, setIframeBlocked] = useState(false);

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
            setTimeout(() => {
                const el = scrollRef.current;
                if (el) setCanScrollDown(el.scrollHeight > el.clientHeight + 4);
            }, 100);
        })();
    }, []);

    const shareToChat = async (n: NewsItem) => {
        if (!userId) return;
        const text = `[NEWS] ${n.title}  ${n.url}`;
        const { error } = await supabase
            .from("messages")
            .insert([{ room_id: roomId, user_id: userId, content: text }]);
        if (!error) showToast("뉴스가 채팅방에 공유되었습니다");
    };

    const openViewer = (n: NewsItem) => {
        setViewer({ url: n.url, title: n.title });
        setIframeReady(false);
        setIframeBlocked(false);
    };
    const closeViewer = () => setViewer(null);

    useEffect(() => {
        if (!viewer) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [viewer]);

    useEffect(() => {
        if (!viewer) return;
        setIframeReady(false);
        setIframeBlocked(false);
        const t = setTimeout(() => {
            if (!iframeReady) setIframeBlocked(true);
        }, 3500);
        return () => clearTimeout(t);
    }, [viewer?.url]);

    const cardBg = isLight
        ? "border-neutral-200 bg-white"
        : "border-border-subtle bg-surface-elevated";
    const dividerColor = isLight ? "border-neutral-100" : "border-border-subtle";
    const titleColor = isLight
        ? "text-neutral-800 hover:text-teal-600"
        : "text-text-primary hover:text-teal-400";
    const sourcePill = isLight
        ? "bg-neutral-100 text-neutral-500"
        : "bg-surface-input text-text-tertiary";
    const symPill = isLight
        ? "bg-teal-50 text-teal-600"
        : "bg-teal-500/10 text-teal-400";
    const timeColor = isLight ? "text-neutral-400" : "text-text-muted";
    const openBtn = isLight
        ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
        : "bg-surface-input text-text-secondary hover:bg-surface-hover";
    const shareBtn = "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer";
    const shareBtnDisabled = isLight
        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
        : "bg-surface-input text-text-muted cursor-not-allowed";
    const skeletonBg = isLight ? "bg-neutral-100" : "bg-surface-input";

    return (
        <>
            <div className={`h-full min-h-0 flex flex-col rounded-2xl border overflow-hidden ${cardBg}`}>
                <div
                    ref={scrollRef}
                    className="flex-1 min-h-0 overflow-y-auto scrollbar-hide"
                    style={{
                        transitionDelay: `${fadeDelay}ms`,
                        maskImage: `linear-gradient(to bottom, ${canScrollUp ? "transparent 0px, black 48px" : "black 0px"}, black calc(100% - ${canScrollDown ? "48px" : "0px"}), ${canScrollDown ? "transparent 100%" : "black 100%"})`,
                        WebkitMaskImage: `linear-gradient(to bottom, ${canScrollUp ? "transparent 0px, black 48px" : "black 0px"}, black calc(100% - ${canScrollDown ? "48px" : "0px"}), ${canScrollDown ? "transparent 100%" : "black 100%"})`,
                    }}
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        setCanScrollUp(el.scrollTop > 4);
                        setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
                    }}
                >
                    {loading && (
                        <div className="p-3 space-y-0">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={`flex gap-3 py-3 border-b ${dividerColor} animate-pulse`}>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex gap-1.5">
                                            <div className={`h-4 w-14 rounded-full ${skeletonBg}`} />
                                            <div className={`h-4 w-10 rounded-full ${skeletonBg}`} />
                                        </div>
                                        <div className={`h-3.5 w-full rounded ${skeletonBg}`} />
                                        <div className={`h-3.5 w-2/3 rounded ${skeletonBg}`} />
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <div className={`h-6 w-10 rounded-lg ${skeletonBg}`} />
                                        <div className={`h-6 w-10 rounded-lg ${skeletonBg}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && (
                        <div
                            className={`transition-[opacity,transform] duration-700 opacity-100 translate-y-0`}
                            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                        >
                            {news.length === 0 ? (
                                <div className={`flex flex-col items-center justify-center py-16 ${timeColor}`}>
                                    <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                                    </svg>
                                    <p className="text-xs">표시할 뉴스가 없습니다</p>
                                </div>
                            ) : (
                                <ul className="px-3">
                                    {news.map((n) => (
                                        <li
                                            key={n.id}
                                            className={`flex items-start gap-3 py-3 border-b last:border-b-0 ${dividerColor}`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                                    <span className={`text-[9px] font-semibold px-1.5 py-[2px] rounded-md ${sourcePill}`}>
                                                        {n.source}
                                                    </span>
                                                    {(n.symbols ?? []).slice(0, 3).map((sym) => (
                                                        <span key={sym} className={`text-[9px] font-medium px-1.5 py-[2px] rounded-md ${symPill}`}>
                                                            {sym}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    className={`block w-full text-left text-xs font-medium line-clamp-2 md:line-clamp-1 cursor-pointer transition-colors ${titleColor}`}
                                                    title={n.title}
                                                    onClick={() => openViewer(n)}
                                                >
                                                    {n.title}
                                                </button>
                                            </div>

                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <span className={`text-[9px] tabular-nums ${timeColor}`}>
                                                    {formatRelativeTime(n.published_at)}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        className={`text-[10px] font-medium px-2 py-1 rounded-lg cursor-pointer transition-colors active:scale-[0.97] ${openBtn}`}
                                                        onClick={() => openViewer(n)}
                                                    >
                                                        열기
                                                    </button>
                                                    <button
                                                        disabled={!userId}
                                                        onClick={() => shareToChat(n)}
                                                        className={`text-[10px] font-medium px-2 py-1 rounded-lg transition-colors active:scale-[0.97] ${userId ? shareBtn : shareBtnDisabled}`}
                                                    >
                                                        공유
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {viewer && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4"
                    onClick={closeViewer}
                >
                    <div
                        className="relative w-[90vw] max-w-5xl h-[80vh] rounded-2xl overflow-hidden border border-border-default bg-surface-elevated"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 right-0 h-11 bg-surface-elevated/95 border-b border-border-subtle flex items-center gap-2 px-4">
                            <div className="truncate text-xs text-text-secondary flex-1" title={viewer.title}>
                                {viewer.title}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                    href={viewer.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-surface-input text-text-primary hover:bg-surface-hover whitespace-nowrap transition-colors"
                                >
                                    새 탭
                                </a>
                                <button
                                    onClick={closeViewer}
                                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-surface-input text-text-secondary hover:bg-surface-hover whitespace-nowrap cursor-pointer transition-colors"
                                >
                                    닫기
                                </button>
                            </div>
                        </div>

                        <div className="absolute inset-x-0 top-11 bottom-0">
                            {!iframeReady && (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-text-tertiary">
                                    {iframeBlocked ? (
                                        <div className="text-center space-y-3">
                                            <p className="text-sm text-text-secondary">이 사이트는 보안 정책으로 임베드가 차단되어 있어요.</p>
                                            <a
                                                href={viewer.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-medium transition-colors"
                                            >
                                                새 탭으로 열기
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-surface-input animate-pulse" />
                                    )}
                                </div>
                            )}
                            <iframe
                                key={viewer.url}
                                src={viewer.url}
                                title={viewer.title}
                                className="w-full h-full"
                                onLoad={() => setIframeReady(true)}
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
