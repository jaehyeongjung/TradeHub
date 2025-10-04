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
                options: object
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
    const playerRef = useRef<YTPlayer | null>(null);

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
            const player = new window.YT.Player("youtube-player-container", {
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
                    // ⭐️ YTErrorEvent 타입 적용
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
        <div className="flex justify-center">
            {/*  플레이어 컨테이너 (화면 밖으로 완전히 숨김) */}
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

            {/*  사용자 컨트롤 버튼 (UI 플로우 내에 배치) */}
            <button
                onClick={toggleMute}
                title={isMuted ? "배경 음악 재생" : "배경 음악 음소거"}
                className={`
                    p-3 rounded-full shadow-lg transition-colors duration-300 w-full
                    ${
                        isMuted
                            ? "bg-neutral-600 hover:bg-neutral-700"
                            : "bg-emerald-800 hover:bg-emerald-600"
                    }
                    ${
                        !isReady
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                    }
                `}
                disabled={!isReady}
            >
                <span className="text-xl text-white">
                    {isMuted ? "🔊 BGM ON" : "🔇 BGM OFF"}
                </span>
            </button>
        </div>
    );
}
