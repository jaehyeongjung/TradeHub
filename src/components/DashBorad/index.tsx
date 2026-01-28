"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SeoFooter from "../SeoFooter";
import Chat from "../Chat";
import PostBoard, { PostBoardHandle } from "../PostBoard";
import LiveStatsBox from "../LiveStatsBox";
import FearGreedWidget from "../Greed";
import YouTubeSeamlessPlayer from "@/components/YouTubeBGMPlayer";
import NewsPanel from "../NewsPanel";
import KimchiWidget from "@/components/KimchiWidget";
import HotSymbolsTicker from "../HotCoin";
import MarketIndicesWidget from "@/components/MarketIndicesWidget";

type TabKey = "board" | "news";

export const DashBoard = () => {
    const postRef = useRef<PostBoardHandle>(null);

    const router = useRouter();

    const pathname = usePathname() ?? "/"; // string 보장
    const sp = useSearchParams(); // ReadonlyURLSearchParams | null
    const paramsForRead = sp ?? new URLSearchParams(); // 읽기용 대체
    const paramsForWrite = new URLSearchParams(sp?.toString() ?? ""); // 쓰기용 복사본

    const raw = paramsForRead.get("tab");
    const activeTab: TabKey = raw === "board" ? "board" : "news";

    const switchTab = (next: TabKey) => {
        if (next === "news") {
            // 기본 탭이면 파라미터 제거해서 URL 깔끔히
            paramsForWrite.delete("tab");
        } else {
            paramsForWrite.set("tab", "board");
        }
        const qs = paramsForWrite.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    return (
        <>
            <section
                aria-label="커뮤니티 게시판 및 채팅"
                className="flex gap-5 mt-5 min-h-120 h-[calc(100vh-400px)] lg:h-[calc(100vh-200px)] 2xl:h-[calc(100vh-300px)] border-neutral-800"
            >
                {/* 왼쪽: 게시판/뉴스 카드 */}
                <article className="min-w-150 w-full h-full  rounded-2xl flex flex-col gap-3 p-3 bg-neutral-950 border border-zinc-800">
                    {/* 상단 바: 탭 + (우측) 글쓰기 버튼 */}
                    <div className="flex items-center gap-2 2xl:py-2 2xl:min-h-14">
                        <div className="inline-flex items-center rounded-lg bg-neutral-800 p-1 ml-3 shrink-0">
                            <button
                                onClick={() => switchTab("board")}
                                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition ${
                                    activeTab === "board"
                                        ? "bg-neutral-700 text-white"
                                        : "text-neutral-300 hover:text-white"
                                }`}
                            >
                                <span className="whitespace-nowrap">
                                    게시판
                                </span>
                            </button>
                            <button
                                onClick={() => switchTab("news")}
                                className={`px-3 py-1.5 text-sm rounded-md transition cursor-pointer ${
                                    activeTab === "news"
                                        ? "bg-neutral-700 text-white"
                                        : "text-neutral-300 hover:text-white"
                                }`}
                            >
                                <span className="whitespace-nowrap">뉴스</span>
                            </button>
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <HotSymbolsTicker />
                        </div>
                        <div className="ml-auto shrink-0">
                            {activeTab === "board" && (
                                <button
                                    onClick={() => postRef.current?.openWrite()}
                                    className="border rounded px-3 py-1 bg-black text-xs mr-3 text-gray-100 hover:bg-neutral-800 cursor-pointer"
                                >
                                    <span className="whitespace-nowrap">
                                        글쓰기
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        {activeTab === "board" ? (
                            <PostBoard ref={postRef} />
                        ) : (
                            <NewsPanel roomId="lobby" />
                        )}
                    </div>
                </article>

                <aside
                    aria-label="거래 정보 위젯"
                    className="flex flex-col gap-3 min-w-57 2xl:min-w-80 2xl:gap-7"
                >
                    <KimchiWidget />
                    <LiveStatsBox />
                    <FearGreedWidget />
                    <YouTubeSeamlessPlayer videoId="j23SO29LNWE" />
                </aside>

                <div className="flex flex-col gap-3 2xl:gap-5 min-w-115 2xl:min-w-140">
                    <MarketIndicesWidget />
                    <aside
                        aria-label="실시간 채팅"
                        className="border border-zinc-800 rounded-2xl flex-1 mb-14 bg-neutral-950 overflow-hidden flex flex-col"
                    >
                        <div className="flex-1 min-h-0">
                            <Chat />
                        </div>
                    </aside>
                </div>
            </section>
            <SeoFooter />
        </>
    );
};

export default DashBoard;
