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
    loadVideoById: (videoId: string) => void;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
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

export type BGMTrack = {
    id: string;
    title: string;
    titleEn?: string;
};

// 재생 가능한 BGM 트랙 목록 — 드롭다운으로 선택
const DEFAULT_TRACKS: BGMTrack[] = [
    { id: "jN9o-se_LpE", title: "Protoss Theme 2", titleEn: "Protoss Theme 2" },
    { id: "j23SO29LNWE", title: "Interstellar", titleEn: "Interstellar" },
];

type Props = {
    tracks?: BGMTrack[];
    initialVolume?: number;
};

export function YouTubeBGMPlayer({
    tracks = DEFAULT_TRACKS,
    initialVolume = 30,
}: Props) {
    const [isMuted, setIsMuted] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const isLight = useTheme();
    const playerRef = useRef<YTPlayer | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const isEn = pathname.startsWith("/en/");

    const current = tracks[currentIndex] ?? tracks[0];
    const titleOf = (t: BGMTrack) => (isEn ? t.titleEn ?? t.title : t.title);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (!window.YT || typeof window.YT.Player === "undefined") {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }

        window.onYouTubeIframeAPIReady = () => {
            new window.YT.Player("youtube-player-container", {
                videoId: tracks[0].id,
                playerVars: {
                    autoplay: 1,
                    loop: 1,
                    playlist: tracks[0].id,
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
                    // loadVideoById 이후엔 loop 파라미터가 무효화되므로 종료 시 수동 반복
                    onStateChange: (event: { data: number; target: YTPlayer }) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            event.target.seekTo(0);
                            event.target.playVideo();
                        }
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
        // 플레이어는 최초 1회만 생성 — 트랙 전환은 loadVideoById로 처리
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 드롭다운 바깥 클릭 시 닫기
    useEffect(() => {
        if (!menuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [menuOpen]);

    const toggleMute = useCallback(() => {
        if (!playerRef.current || !isReady) return;
        if (isMuted) {
            playerRef.current.unMute();
            playerRef.current.setVolume(initialVolume);
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    }, [isMuted, isReady, initialVolume]);

    const selectTrack = useCallback(
        (index: number) => {
            setMenuOpen(false);
            if (!playerRef.current || !isReady) return;
            if (index !== currentIndex) {
                setCurrentIndex(index);
                playerRef.current.loadVideoById(tracks[index].id);
            }
            // 트랙 선택 = 재생 의도 → 음소거 해제
            playerRef.current.unMute();
            playerRef.current.setVolume(initialVolume);
            setIsMuted(false);
        },
        [currentIndex, isReady, initialVolume, tracks],
    );

    return (
        <div ref={rootRef} className="relative w-full">
            <div
                id="youtube-player-container"
                style={{ position: "fixed", top: "-1000px", left: "-1000px", width: "1px", height: "1px", zIndex: 0 }}
            />

            <div
                className={`
                    w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-200
                    ${isMuted
                        ? isLight
                            ? "bg-white border-neutral-200"
                            : "bg-neutral-900 border-neutral-800"
                        : "bg-emerald-500/10 border-emerald-500/30"
                    }
                `}
            >
                {/* 아이콘 — 클릭 시 재생/정지 토글 */}
                <button
                    type="button"
                    onClick={toggleMute}
                    disabled={!isReady}
                    aria-label={isMuted ? (isEn ? "Play" : "재생") : (isEn ? "Stop" : "정지")}
                    className={`relative flex items-center justify-center w-7 h-7 rounded-xl transition-colors shrink-0 ${
                        isReady ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                    } ${
                        isMuted
                            ? isLight ? "bg-neutral-100" : "bg-neutral-800"
                            : "bg-emerald-500/20"
                    }`}
                >
                    {isMuted ? (
                        <svg className={`w-3.5 h-3.5 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        // 원 안에 담기는 이퀄라이저 — 원 밖으로 넘치지 않음
                        <div className="flex items-center justify-center gap-[2px] h-3.5">
                            <span className="w-[2px] h-2 bg-emerald-500 rounded-full animate-[soundwave_0.6s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
                            <span className="w-[2px] h-3.5 bg-emerald-500 rounded-full animate-[soundwave_0.6s_ease-in-out_infinite]" style={{ animationDelay: "150ms" }} />
                            <span className="w-[2px] h-2.5 bg-emerald-500 rounded-full animate-[soundwave_0.6s_ease-in-out_infinite]" style={{ animationDelay: "300ms" }} />
                            <span className="w-[2px] h-3 bg-emerald-500 rounded-full animate-[soundwave_0.6s_ease-in-out_infinite]" style={{ animationDelay: "450ms" }} />
                        </div>
                    )}
                </button>

                {/* 트랙명 — 클릭 시 드롭다운 */}
                <button
                    type="button"
                    onClick={() => isReady && setMenuOpen((v) => !v)}
                    disabled={!isReady}
                    aria-haspopup="listbox"
                    aria-expanded={menuOpen}
                    className={`flex-1 text-left ${isReady ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                >
                    <p className={`flex items-center gap-1 text-xs font-medium ${isLight ? "text-neutral-700" : "text-neutral-200"}`}>
                        <span>{titleOf(current)}</span>
                        <svg className={`w-3 h-3 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""} ${isLight ? "text-neutral-400" : "text-neutral-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </p>
                    <p className={`text-[10px] ${isMuted
                        ? isLight ? "text-neutral-400" : "text-neutral-500"
                        : "text-emerald-500"
                    }`}>
                        {isMuted ? (isEn ? "Click to play" : "클릭하여 켜기") : (isEn ? "Playing" : "재생 중")}
                    </p>
                </button>

                {/* 토글 스위치 — 클릭 시 재생/정지 토글 */}
                <button
                    type="button"
                    onClick={toggleMute}
                    disabled={!isReady}
                    aria-label={isMuted ? (isEn ? "Play" : "재생") : (isEn ? "Stop" : "정지")}
                    className={`shrink-0 w-8 h-5 rounded-full p-0.5 transition-colors ${
                        isReady ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                    } ${
                        isMuted
                            ? isLight ? "bg-neutral-200" : "bg-neutral-700"
                            : "bg-emerald-500"
                    }`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        isMuted ? "translate-x-0" : "translate-x-3"
                    }`} />
                </button>
            </div>

            {/* 트랙 드롭다운 */}
            {menuOpen && (
                <ul
                    role="listbox"
                    className={`absolute z-30 left-0 right-0 bottom-full mb-1 py-1 rounded-2xl border shadow-lg overflow-hidden ${
                        isLight
                            ? "bg-white border-neutral-200"
                            : "bg-neutral-900 border-neutral-800"
                    }`}
                >
                    {tracks.map((t, i) => {
                        const active = i === currentIndex;
                        return (
                            <li key={t.id} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    onClick={() => selectTrack(i)}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-xs text-left transition-colors ${
                                        active
                                            ? "text-emerald-500 font-medium"
                                            : isLight
                                                ? "text-neutral-700 hover:bg-neutral-50"
                                                : "text-neutral-200 hover:bg-neutral-800"
                                    }`}
                                >
                                    <span className="flex-1 truncate">{titleOf(t)}</span>
                                    {active && (
                                        <svg className="w-3.5 h-3.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
