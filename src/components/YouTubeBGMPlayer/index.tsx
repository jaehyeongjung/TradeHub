"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// YT.Player의 핵심 메서드만 간략하게 타입 정의
interface YTPlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    mute: () => void;
    unMute: () => void;
    setVolume: (volume: number) => void;
    destroy: () => void;
}

//  YouTube onError 이벤트에 대한 타입 정의 추가
interface YTErrorEvent {
    target: YTPlayer;
    data: number; // 에러 코드가 숫자로 전달됩니다.
}

// 전역 윈도우 객체에 YT API 타입을 추가
declare global {
    interface Window {
        YT: {
            Player: new (
                elementId: string | HTMLElement,
                options: object,
            ) => YTPlayer;
            PlayerState: {
                UNSTARTED: number;
                ENDED: number;
                PLAYING: number;
                PAUSED: number;
                BUFFERING: number;
                CUED: number;
            };
        };
        onYouTubeIframeAPIReady: () => void;
    }
}

type Props = {
    videoId: string;
    /** BGM의 초기 볼륨 (0~100) */
    initialVolume?: number;
};

export default function YouTubeBGMPlayer({
    videoId,
    initialVolume = 30,
}: Props) {
    const [isMuted, setIsMuted] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [isLight, setIsLight] = useState(true);
    const playerRef = useRef<YTPlayer | null>(null);

    // 테마 감지
    useEffect(() => {
        const html = document.documentElement;
        setIsLight(html.classList.contains("light"));

        const observer = new MutationObserver(() => {
            setIsLight(html.classList.contains("light"));
        });
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    // 1. YouTube API 로드 및 플레이어 준비
    useEffect(() => {
        if (typeof window === "undefined") return;

        // API 스크립트가 로드되어 있지 않다면 로드
        if (!window.YT || typeof window.YT.Player === "undefined") {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }

        // 플레이어 생성 함수 정의 (전역 함수로 등록)
        window.onYouTubeIframeAPIReady = () => {
            new window.YT.Player("youtube-player-container", {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    loop: 1,
                    playlist: videoId,
                    controls: 0,
                    mute: 1,
                    disablekb: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                },
                events: {
                    onReady: (event: { target: YTPlayer }) => {
                        playerRef.current = event.target;
                        playerRef.current.setVolume(initialVolume);
                        setIsReady(true);
                    },
                    //  YTErrorEvent 타입 적용
                    onError: (error: YTErrorEvent) => {
                        console.error("YouTube Player Error Code:", error.data);
                    },
                },
            });
        };

        // 클린업 함수: 컴포넌트 언마운트 시 플레이어 제거
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId, initialVolume]);

    // 2. 음소거/음소거 해제 토글 기능
    const toggleMute = useCallback(() => {
        if (!playerRef.current || !isReady) return;

        if (isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    }, [isMuted, isReady]);

    return (
        <div className="w-full">
            {/* 플레이어 컨테이너 (화면 밖으로 완전히 숨김) */}
            <div
                id="youtube-player-container"
                style={{
                    position: "fixed",
                    top: "-1000px",
                    left: "-1000px",
                    width: "1px",
                    height: "1px",
                    zIndex: 0,
                }}
            />

            {/* 미니멀 BGM 컨트롤 */}
            <button
                onClick={toggleMute}
                disabled={!isReady}
                className={`
                    group w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200
                    ${isReady ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}
                    ${isMuted
                        ? isLight
                            ? "bg-white border-neutral-200 hover:border-neutral-300"
                            : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                        : "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                    }
                `}
            >
                {/* 아이콘 + 사운드웨이브 */}
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${
                    isMuted
                        ? isLight ? "bg-neutral-100" : "bg-neutral-800"
                        : "bg-emerald-500/20"
                }`}>
                    {isMuted ? (
                        <svg className={`w-4 h-4 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <>
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            {/* 사운드웨이브 애니메이션 */}
                            <div className="absolute -right-1 flex items-center gap-[2px]">
                                <span className="w-[2px] h-2 bg-emerald-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
                                <span className="w-[2px] h-3 bg-emerald-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite]" style={{ animationDelay: "150ms" }} />
                                <span className="w-[2px] h-2 bg-emerald-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite]" style={{ animationDelay: "300ms" }} />
                            </div>
                        </>
                    )}
                </div>

                {/* 텍스트 */}
                <div className="flex-1 text-left">
                    <p className={`text-xs font-medium ${
                        isMuted
                            ? isLight ? "text-neutral-700" : "text-neutral-200"
                            : "text-emerald-500"
                    }`}>
                        {isMuted ? "BGM 꺼짐" : "재생 중"}
                    </p>
                    <p className={`text-[10px] ${isLight ? "text-neutral-400" : "text-neutral-500"}`}>
                        클릭하여 {isMuted ? "켜기" : "끄기"}
                    </p>
                </div>

                {/* 토글 인디케이터 */}
                <div className={`w-8 h-5 rounded-full p-0.5 transition-colors ${
                    isMuted
                        ? isLight ? "bg-neutral-200" : "bg-neutral-700"
                        : "bg-emerald-500"
                }`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        isMuted ? "translate-x-0" : "translate-x-3"
                    }`} />
                </div>
            </button>

            {/* 사운드웨이브 키프레임 */}
            <style jsx>{`
                @keyframes soundwave {
                    0%, 100% { transform: scaleY(0.5); }
                    50% { transform: scaleY(1); }
                }
            `}</style>
        </div>
    );
}
