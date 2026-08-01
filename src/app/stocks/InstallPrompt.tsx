"use client";

import { useEffect, useState } from "react";

/**
 * /stocks 전용 홈 화면 추가 안내.
 *
 * 검색으로 한 번 들어온 사람이 다음에 스스로 돌아오게 하려면 링크를 기억하게
 * 두는 것보다 홈 화면에 아이콘을 남기는 편이 확실하다. 카톡에 저장한 링크는
 * 대화 스크롤에 묻히지만 아이콘은 묻히지 않는다.
 *
 * 플랫폼마다 방식이 다르다.
 *  - 안드로이드 크롬: beforeinstallprompt를 잡아뒀다가 버튼으로 띄운다
 *  - iOS 사파리: 프로그램으로 띄울 방법이 없다. "공유 → 홈 화면에 추가"를
 *    사람이 직접 눌러야 해서, 그 경로를 그림처럼 설명해주는 수밖에 없다
 *
 * 뜨자마자 보여주면 광고처럼 읽히므로 잠시 머문 뒤에 올린다.
 * 닫으면 한동안 다시 묻지 않는다.
 */

const DISMISS_KEY = "th_install_dismissed_at";
const DISMISS_DAYS = 30;
const SHOW_AFTER_MS = 12_000;

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS 사파리는 표준 display-mode 대신 이 비표준 속성을 쓴다
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function isIos(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    // iPadOS 13+는 UA를 맥으로 보낸다. 터치 지원 여부로 가른다.
    return ua.includes("Macintosh") && window.navigator.maxTouchPoints > 1;
}

/**
 * 카카오톡·네이버 같은 인앱 브라우저는 홈 화면 추가를 지원하지 않는다.
 * 국내 유입은 링크 공유를 타고 오는 경우가 많아 이 비율이 무시할 수 없다.
 * 설치 안내 대신 "기본 브라우저로 열기"를 알려주는 게 맞다.
 */
function isInAppBrowser(): boolean {
    if (typeof window === "undefined") return false;
    return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i.test(
        window.navigator.userAgent,
    );
}

function recentlyDismissed(): boolean {
    try {
        const at = Number(localStorage.getItem(DISMISS_KEY));
        if (!at) return false;
        return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

export function InstallPrompt() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [mode, setMode] = useState<"none" | "ios" | "inapp">("none");
    const [visible, setVisible] = useState(false);

    // 서비스 워커 등록 — scope를 /stocks/로 좁힌다.
    // 루트에 둔 sw.js라도 scope는 더 좁게 지정할 수 있다(넓히는 건 안 된다).
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;
        navigator.serviceWorker.register("/sw.js", { scope: "/stocks/" }).catch(() => {
            // 등록에 실패해도 페이지는 그대로 동작한다 — 설치만 안 될 뿐이다
        });
    }, []);

    useEffect(() => {
        if (isStandalone() || recentlyDismissed()) return;

        const onBeforeInstall = (e: Event) => {
            // 크롬 기본 배너를 막고 우리 UI로 대신 띄운다
            e.preventDefault();
            setDeferred(e as BeforeInstallPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", onBeforeInstall);

        const timer = setTimeout(() => {
            if (isInAppBrowser()) setMode("inapp");
            else if (isIos()) setMode("ios");
            setVisible(true);
        }, SHOW_AFTER_MS);

        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            clearTimeout(timer);
        };
    }, []);

    const dismiss = () => {
        setVisible(false);
        try {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {
            // 사파리 프라이빗 모드 등 — 이번 세션만 안 보이면 충분하다
        }
    };

    const install = async () => {
        if (!deferred) return;
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
        dismiss();
    };

    // 안드로이드는 설치 이벤트가 잡혔을 때만, iOS·인앱은 안내만 띄운다.
    // 셋 다 아니면(데스크톱 등) 아무것도 보여주지 않는다.
    const canShow = visible && (deferred !== null || mode !== "none");
    if (!canShow) return null;

    const title =
        mode === "inapp" ? "브라우저에서 열어주세요" : "홈 화면에 추가하기";
    const lead =
        mode === "inapp"
            ? "지금 보시는 화면은 앱 안의 브라우저라 홈 화면에 추가할 수 없어요. 사파리나 크롬으로 열면 추가할 수 있습니다."
            : "장 마감 후에도 삼전·하이닉스 가격이 궁금할 때, 검색하지 않고 바로 열 수 있어요.";

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 pointer-events-none">
            <div className="mx-auto max-w-md rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-2xl pointer-events-auto">
                <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/favicon.png"
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-body font-bold text-[var(--text-primary)]">{title}</p>
                        <p className="mt-1 text-caption leading-relaxed text-[var(--text-tertiary)]">
                            {lead}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="닫기"
                        className="-mr-1 -mt-1 shrink-0 rounded-chip p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <path
                                d="M1 1l12 12M13 1L1 13"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                {mode === "inapp" ? (
                    <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-caption leading-relaxed text-[var(--text-secondary)]">
                        오른쪽 위(또는 아래)의{" "}
                        <strong className="text-[var(--text-primary)]">⋯</strong> 버튼 →{" "}
                        <strong className="text-[var(--text-primary)]">
                            다른 브라우저로 열기
                        </strong>
                        를 누르면 됩니다.
                    </p>
                ) : mode === "ios" ? (
                    <>
                        <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-caption text-[var(--text-tertiary)]">
                            아이폰은 직접 눌러 추가해야 해요. 두 단계면 끝납니다.
                        </p>
                        <ol className="mt-2 space-y-1.5 text-caption text-[var(--text-secondary)]">
                            <li className="flex gap-2">
                                <span className="text-[var(--text-muted)]">1.</span>
                                <span>
                                    화면 아래{" "}
                                    <strong className="text-[var(--text-primary)]">공유</strong>{" "}
                                    버튼 (□ 위로 화살표가 나온 아이콘)
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[var(--text-muted)]">2.</span>
                                <span>
                                    목록을 아래로 내려{" "}
                                    <strong className="text-[var(--text-primary)]">
                                        홈 화면에 추가
                                    </strong>{" "}
                                    → 우측 상단{" "}
                                    <strong className="text-[var(--text-primary)]">추가</strong>
                                </span>
                            </li>
                        </ol>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={install}
                        className="mt-3 w-full rounded-control bg-[var(--color-accent)] py-2.5 text-footnote font-bold text-black transition-opacity hover:opacity-90 active:opacity-80"
                    >
                        추가하기
                    </button>
                )}
            </div>
        </div>
    );
}
