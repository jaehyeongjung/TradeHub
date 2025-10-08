"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Chat from "../Chat";
import PostBoard, { PostBoardHandle } from "../PostBoard";
import LiveStatsBox from "../LiveStatsBox";
import FearGreedWidget from "../Greed";
import YouTubeSeamlessPlayer from "@/components/YouTubeBGMPlayer";
import NewsPanel from "../NewsPanel";
import KimchiWidget from "@/components/KimchiWidget";
import HotSymbolsTicker from "../HotCoin";

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
        <div className="flex gap-5 mt-5 min-h-130 h-[calc(100vh-200px)]">
            {/* 왼쪽: 게시판/뉴스 카드 */}
            <div className="min-w-163 w-full h-full border-2 rounded-2xl flex flex-col gap-3 p-3 bg-neutral-950">
                {/* 상단 바: 탭 + (우측) 글쓰기 버튼 */}
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-lg bg-neutral-800 p-1 ml-3">
                        <button
                            onClick={() => switchTab("board")}
                            className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition ${
                                activeTab === "board"
                                    ? "bg-neutral-700 text-white"
                                    : "text-neutral-300 hover:text-white"
                            }`}
                        >
                            게시판
                        </button>
                        <button
                            onClick={() => switchTab("news")}
                            className={`px-3 py-1.5 text-sm rounded-md transition cursor-pointer ${
                                activeTab === "news"
                                    ? "bg-neutral-700 text-white"
                                    : "text-neutral-300 hover:text-white"
                            }`}
                        >
                            뉴스
                        </button>
                    </div>
                    <HotSymbolsTicker></HotSymbolsTicker>
                    <div className="ml-auto">
                        {activeTab === "board" && (
                            <button
                                onClick={() => postRef.current?.openWrite()}
                                className="border rounded px-3 py-1 bg-black text-xs mr-3 text-gray-100 hover:bg-neutral-800 cursor-pointer"
                            >
                                글쓰기
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
            </div>

            <div className="flex flex-col gap-5 min-w-57">
                <KimchiWidget />
                <LiveStatsBox />
                <FearGreedWidget />
                <YouTubeSeamlessPlayer videoId="j23SO29LNWE" />
            </div>

            <div className="min-w-105 border-2 rounded-2xl flex flex-col items-center gap-3 h-[calc(100vh-200px)] bg-neutral-950">
                <Chat />
            </div>
        </div>
    );
};

export default DashBoard;
