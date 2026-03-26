"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Chat from "@/features/chat/Chat";
import PostBoard, { PostBoardHandle } from "@/features/post/PostBoard";
import LiveStatsBox from "@/entities/coin/LiveStatsBox";
import FearGreedWidget from "@/entities/market/FearGreedWidget";
import YouTubeSeamlessPlayer from "@/widgets/shared-modals/YouTubeBGMPlayer";
import NewsPanel from "@/features/news/NewsPanel";
import KimchiWidget from "@/entities/market/KimchiWidget";
import HotSymbolsTicker from "@/entities/coin/HotCoin";
import MarketIndicesWidget from "@/entities/market/MarketIndicesWidget";

type TabKey = "board" | "news";

export const DashBoard = () => {
    const postRef = useRef<PostBoardHandle>(null);
    const [mounted, setMounted] = useState(false);
    const isLight = useTheme();

    useEffect(() => { setMounted(true); }, []);

    const router = useRouter();

    const pathname = usePathname() ?? "/"; // string 보장
    const sp = useSearchParams(); // ReadonlyURLSearchParams | null
    const paramsForRead = sp ?? new URLSearchParams(); // 읽기용 대체
    const paramsForWrite = new URLSearchParams(sp?.toString() ?? ""); // 쓰기용 복사본

    const raw = paramsForRead.get("tab");
    const activeTab: TabKey = raw === "board" ? "board" : "news";

    const tabOrder: Record<TabKey, number> = { news: 0, board: 1 };
    const [direction, setDirection] = useState(0);
    const prevTabRef = useRef(activeTab);

    const switchTab = (next: TabKey) => {
        if (next === activeTab) return;
        setDirection(tabOrder[next] > tabOrder[prevTabRef.current] ? 1 : -1);
        prevTabRef.current = next;
        if (next === "news") {
            paramsForWrite.delete("tab");
        } else {
            paramsForWrite.set("tab", "board");
        }
        const qs = paramsForWrite.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    return (
        <section
            aria-label="커뮤니티 게시판 및 채팅"
            className="flex gap-3 2xl:gap-5 mt-3 2xl:mt-5 flex-1 min-h-0 overflow-hidden"
        >
                {/* 왼쪽: 게시판/뉴스 카드 */}
                <article className="min-w-150 w-full h-full  rounded-2xl flex flex-col gap-3 p-3 bg-surface-card border border-border-subtle">
                    {/* 상단 바: 탭 + (우측) 글쓰기 버튼 */}
                    <div className={`relative z-20 flex items-center gap-3 px-2 2xl:py-2 2xl:min-h-14 transition-[opacity,transform] duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "50ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
                        {/* 탭 버튼 */}
                        <div className={`inline-flex items-center rounded-xl p-1 shrink-0 ${isLight ? "bg-neutral-100 border border-neutral-200" : "bg-surface-input/60 border border-border-subtle"}`}>
                            <button
                                onClick={() => switchTab("board")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
                                    activeTab === "board"
                                        ? isLight
                                            ? "bg-white text-neutral-800 shadow-sm border border-neutral-200"
                                            : "bg-surface-hover text-white shadow-sm"
                                        : isLight
                                            ? "text-neutral-500 hover:text-neutral-700"
                                            : "text-text-muted hover:text-text-secondary"
                                }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="whitespace-nowrap">게시판</span>
                            </button>
                            <button
                                onClick={() => switchTab("news")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                                    activeTab === "news"
                                        ? isLight
                                            ? "bg-white text-neutral-800 shadow-sm border border-neutral-200"
                                            : "bg-surface-hover text-white shadow-sm"
                                        : isLight
                                            ? "text-neutral-500 hover:text-neutral-700"
                                            : "text-text-muted hover:text-text-secondary"
                                }`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                                </svg>
                                <span className="whitespace-nowrap">뉴스</span>
                            </button>
                        </div>

                        <div className="flex-1 min-w-0">
                            <HotSymbolsTicker fadeDelay={150} />
                        </div>

                        <div className="ml-auto shrink-0 mr-1">
                            {activeTab === "board" && (
                                <button
                                    onClick={() => postRef.current?.openWrite()}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium shadow-sm transition-all cursor-pointer active:scale-[0.98] ${
                                        isLight
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700"
                                            : "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
                                    }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="whitespace-nowrap">글쓰기</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={activeTab}
                                custom={direction}
                                variants={{
                                    enter: (d: number) => ({ x: d > 0 ? "40%" : "-40%", opacity: 0 }),
                                    center: { x: 0, opacity: 1 },
                                    exit: (d: number) => ({ x: d > 0 ? "-40%" : "40%", opacity: 0 }),
                                }}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full"
                            >
                                {activeTab === "board" ? (
                                    <PostBoard ref={postRef} fadeDelay={0} />
                                ) : (
                                    <NewsPanel roomId="lobby" fadeDelay={0} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </article>

                <aside
                    aria-label="거래 정보 위젯"
                    className="flex flex-col gap-2 2xl:gap-5 min-w-57 2xl:min-w-80"
                >
                    <KimchiWidget fadeDelay={200} />
                    <LiveStatsBox fadeDelay={280} />
                    <FearGreedWidget fadeDelay={350} />
                    <YouTubeSeamlessPlayer videoId="j23SO29LNWE" />
                </aside>

                <div className="flex flex-col gap-2 2xl:gap-5 min-w-115 2xl:min-w-140">
                    <MarketIndicesWidget fadeDelay={280} />
                    <aside
                        aria-label="실시간 채팅"
                        className="border border-border-subtle rounded-2xl flex-1 bg-surface-card overflow-hidden flex flex-col"
                    >
                        <div className="flex-1 min-h-0">
                            <Chat fadeDelay={350} />
                        </div>
                    </aside>
                </div>
        </section>
    );
};

export default DashBoard;
