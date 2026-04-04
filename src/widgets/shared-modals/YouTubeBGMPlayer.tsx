"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { usePathname } from "next/navigation";

interface YTPlayer {
    playVideo: () => void;
    pauseVideo: () => void;
    mute: () => void;
    unMute: () => void;
    setVolume: (volume: number) => void;
    destroy: () => void;
}

interface YTErrorEvent {
    target: YTPlayer;
    data: number;
}

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
    initialVolume?: number;
};

export function YouTubeBGMPlayer({
    videoId,
    initialVolume = 30,
}: Props) {
    const [isMuted, setIsMuted] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const isLight = useTheme();
    const playerRef = useRef<YTPlayer | null>(null);
    const pathname = usePathname();
    const isEn = pathname.startsWith("/en/");

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (!window.YT || typeof window.YT.Player === "undefined") {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }

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
                    onError: (error: YTErrorEvent) => {
                        console.error("YouTube Player Error Code:", error.data);
                    },
                },
            });
        };

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId, initialVolume]);

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
            <div
                id="youtube-player-container"
                style={{ position: "fixed", top: "-1000px", left: "-1000px", width: "1px", height: "1px", zIndex: 0 }}
            />

            <button
                onClick={toggleMute}
                disabled={!isReady}
                className={`
                    group w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-200
                    ${isReady ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}
                    ${isMuted
                        ? isLight
                            ? "bg-white border-neutral-200 hover:border-neutral-300"
                            : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                        : "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                    }
                `}
            >
                <div className={`relative flex items-center justify-center w-7 h-7 rounded-xl transition-colors ${
                    isMuted
                        ? isLight ? "bg-neutral-100" : "bg-neutral-800"
                        : "bg-emerald-500/20"
                }`}>
                    {isMuted ? (
                        <svg className={`w-3.5 h-3.5 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            <div className="absolute -right-1 flex items-center gap-[2px]">
                                <span className="w-[2px] h-2 bg-emerald-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
                                <span className="w-[2px] h-3 bg-emerald-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite]" style={{ animationDelay: "150ms" }} />
                                <span className="w-[2px] h-2 bg-emerald-500 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite]" style={{ animationDelay: "300ms" }} />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex-1 text-left">
                    <p className={`text-xs font-medium ${isLight ? "text-neutral-700" : "text-neutral-200"}`}>
                        Lo-fi BGM
                    </p>
                    <p className={`text-[10px] ${isMuted
                        ? isLight ? "text-neutral-400" : "text-neutral-500"
                        : "text-emerald-500"
                    }`}>
                        {isMuted ? (isEn ? "Click to play" : "클릭하여 켜기") : (isEn ? "Playing · Click to stop" : "재생 중 · 클릭하여 끄기")}
                    </p>
                </div>

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
        </div>
    );
}
