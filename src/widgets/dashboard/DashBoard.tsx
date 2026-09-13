"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { Chat } from "@/features/chat/Chat";
import { LiveStatsBox } from "@/entities/coin/LiveStatsBox";
import { FearGreedCard } from "@/entities/market/FearGreedWidget";
import { YouTubeBGMPlayer } from "@/widgets/shared-modals/YouTubeBGMPlayer";
import { NewsPanel } from "@/features/news/NewsPanel";
import { KimchiWidget } from "@/entities/market/KimchiWidget";
import { HotSymbolsTicker } from "@/entities/coin/HotCoin";
import { MarketIndicesWidget } from "@/entities/market/MarketIndicesWidget";

export const DashBoard = () => {
    const [mounted, setMounted] = useState(false);
    const isLight = useTheme();

    useEffect(() => { setMounted(true); }, []);

    return (
        <section
            aria-label="뉴스 및 채팅"
            className="flex gap-3 2xl:gap-5 mt-3 2xl:mt-5 flex-1 min-h-0 overflow-hidden"
        >
                <article className="min-w-150 w-full h-full  rounded-2xl flex flex-col gap-3 p-3 bg-surface-card border border-border-subtle">
                    <div className={`relative z-20 flex items-center gap-3 px-2 2xl:py-2 2xl:min-h-14 transition-[opacity,transform] duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "50ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
                    {/* 뉴스는 하루 한 번 수집된다 (vercel.json cron "0 3 * * *" = UTC 03:00 = KST 정오).
                        언제 새 글이 오는지 모르면 "안 바뀌는 패널"로 읽히므로 hover로 알려준다. */}
                    <div className="group relative shrink-0">
                        <div
                            tabIndex={0}
                            aria-describedby="news-schedule-tip"
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium cursor-help outline-none ${isLight ? "bg-neutral-100 border border-neutral-200 text-neutral-800" : "bg-surface-input/60 border border-border-subtle text-white"}`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                            </svg>
                            <span className="whitespace-nowrap">뉴스</span>
                        </div>

                        <div
                            id="news-schedule-tip"
                            role="tooltip"
                            className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 w-max max-w-70 rounded-lg bg-surface-elevated px-2.5 py-1.5 text-caption text-text-secondary shadow-lg ring-1 ring-[var(--border-default)] opacity-0 translate-y-[-2px] transition-[opacity,transform] duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                        >
                            <span className="font-semibold text-text-primary">매일 낮 12시</span>에 새 뉴스가 올라옵니다
                        </div>
                    </div>

                        <div className="flex-1 min-w-0">
                            <HotSymbolsTicker fadeDelay={150} />
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
                        <NewsPanel roomId="lobby" fadeDelay={0} />
                    </div>
                </article>

                <aside
                    aria-label="거래 정보 위젯"
                    className="flex flex-col gap-2 2xl:gap-5 min-w-57 2xl:min-w-80"
                >
                    <KimchiWidget fadeDelay={200} />
                    <LiveStatsBox fadeDelay={280} />
                    <FearGreedCard fadeDelay={350} />
                    <YouTubeBGMPlayer />
                </aside>

                <div className="flex flex-col gap-2 2xl:gap-5 min-w-115 2xl:min-w-140">
                    <MarketIndicesWidget fadeDelay={280} />
                    <aside
                        aria-label="실시간 채팅"
                        className="border border-border-subtle rounded-2xl flex-1 bg-surface-card overflow-hidden flex flex-col"
                    >
                        <div className="flex-1 min-h-0">
                            {/* 롱·숏 투표 패널은 쓰지 않는다 — header를 넘기면 그 패널과 관련 구독·쿼리가 함께 꺼진다 */}
                            <Chat fadeDelay={350} header={null} />
                        </div>
                    </aside>
                </div>
        </section>
    );
};

