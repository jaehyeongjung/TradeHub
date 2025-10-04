"use client";

import { useRef, useState } from "react";
import Chat from "../Chat";
import AuthBox from "../login";
import PostBoard, { PostBoardHandle } from "../PostBoard";
import LiveStatsBox from "../LiveStatsBox";
import FearGreedWidget from "../Greed";
import YouTubeSeamlessPlayer from "@/components/YouTubeBGMPlayer";
import NewsPanel from "../NewsPanel";

export const DashBoard = () => {
    const [tab, setTab] = useState<"board" | "news">("board");
    const postRef = useRef<PostBoardHandle>(null);

    return (
        <div className="flex gap-5 mt-5 min-h-130 h-[calc(100vh-200px)]">
            {/* 왼쪽: 게시판/뉴스 카드 */}
            <div className="min-w-163 w-full h-full border-2 rounded-2xl flex flex-col gap-3 p-3 bg-neutral-950">
                {/* 상단 바: 탭 + (우측) 글쓰기 버튼 */}
                <div className="flex items-center gap-2">
                    {/* 탭 버튼 묶음 */}
                    <div className="inline-flex items-center rounded-lg bg-neutral-800 p-1 ml-3">
                        <button
                            onClick={() => setTab("board")}
                            className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition ${
                                tab === "board"
                                    ? "bg-neutral-700 text-white"
                                    : "text-neutral-300 hover:text-white"
                            }`}
                        >
                            게시판
                        </button>
                        <button
                            onClick={() => setTab("news")}
                            className={`px-3 py-1.5 text-sm rounded-md transition cursor-pointer ${
                                tab === "news"
                                    ? "bg-neutral-700 text-white"
                                    : "text-neutral-300 hover:text-white"
                            }`}
                        >
                            뉴스
                        </button>
                    </div>

                    {/* 우측 정렬 영역 */}
                    <div className="ml-auto">
                        {tab === "board" && (
                            <button
                                onClick={() => postRef.current?.openWrite()}
                                className="border rounded px-3 py-1 bg-black text-xs mr-3 text-gray-100 hover:bg-neutral-800 cursor-pointer"
                            >
                                글쓰기
                            </button>
                        )}
                    </div>
                </div>

                {/* 탭 콘텐츠 */}
                <div className="flex-1 min-h-0">
                    {tab === "board" ? (
                        // 내부 버튼은 숨김 (showInternalWriteButton 생략/false)
                        <PostBoard ref={postRef} />
                    ) : (
                        <NewsPanel roomId="lobby" />
                    )}
                </div>
            </div>

            {/* 가운데: 로그인/지표/위젯 */}
            <div className="flex flex-col gap-5 min-w-57">
                <AuthBox />
                <LiveStatsBox />
                <FearGreedWidget />
                <YouTubeSeamlessPlayer videoId="j23SO29LNWE" />
            </div>

            {/* 오른쪽: 채팅 */}
            <div className="min-w-75 border-2 rounded-2xl flex flex-col items-center gap-3 h-[calc(100vh-200px)] bg-neutral-950">
                <Chat />
            </div>
        </div>
    );
};
