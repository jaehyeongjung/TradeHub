"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/shared/ui/Toast";

/**
 * 카카오톡 공유 버튼.
 *
 * 동작 우선순위:
 *  1. NEXT_PUBLIC_KAKAO_JS_KEY가 있으면 카카오 SDK로 정식 공유 (sendScrap이 페이지 OG 태그를 긁어
 *     카드 형태로 보낸다 — 우리 페이지는 OG가 갖춰져 있으니 이미지·제목을 따로 넘길 필요가 없다)
 *  2. 키가 없고 모바일이면 Web Share API — 공유 시트에 카카오톡이 뜬다
 *  3. 둘 다 안 되면 링크 복사
 *
 * 공유 대상은 클릭 시점의 document.title / location.href를 쓴다.
 * 헤더는 어느 페이지에 있는지 모르기 때문에 이 방식이 페이지마다 손대지 않아도 맞게 동작한다.
 */

type KakaoSdk = {
    isInitialized: () => boolean;
    init: (key: string) => void;
    Share: {
        sendScrap: (opts: { requestUrl: string }) => void;
    };
};

declare global {
    interface Window {
        Kakao?: KakaoSdk;
    }
}

const SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
const SDK_INTEGRITY = "sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4";

export function KakaoShareButton({ className = "" }: { className?: string }) {
    const { showToast } = useToast();
    const [kakaoReady, setKakaoReady] = useState(false);

    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

    useEffect(() => {
        if (!appKey) return;
        // sendScrap은 카카오 서버가 해당 URL을 직접 크롤링한다. localhost는 접근이 불가능해
        // 실패가 카카오 팝업 안에서 일어나 아래 폴백으로 넘어오지 못한다.
        // 그래서 로컬·프리뷰에서는 SDK를 아예 붙이지 않고 Web Share / 링크 복사로 처리한다.
        if (!/(^|\.)tradehub\.kr$/.test(window.location.hostname)) return;

        function init() {
            const kakao = window.Kakao;
            if (!kakao) return;
            if (!kakao.isInitialized()) kakao.init(appKey!);
            setKakaoReady(true);
        }

        if (window.Kakao) {
            init();
            return;
        }

        // 이미 주입된 스크립트가 있으면 재사용
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SRC}"]`);
        if (existing) {
            existing.addEventListener("load", init, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = SDK_SRC;
        script.integrity = SDK_INTEGRITY;
        script.crossOrigin = "anonymous";
        script.async = true;
        script.addEventListener("load", init, { once: true });
        document.head.appendChild(script);
    }, [appKey]);

    async function handleClick() {
        const url = window.location.href;
        const title = document.title;

        if (kakaoReady && window.Kakao) {
            try {
                window.Kakao.Share.sendScrap({ requestUrl: url });
                return;
            } catch {
                // SDK 실패 시 아래 폴백으로 진행
            }
        }

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
                return;
            } catch (e) {
                // 사용자가 공유 시트를 닫은 경우는 에러가 아니다
                if (e instanceof DOMException && e.name === "AbortError") return;
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            showToast("링크를 복사했어요. 카카오톡에 붙여넣어 공유하세요.", "success");
        } catch {
            showToast("링크 복사에 실패했어요.", "error");
        }
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label="카카오톡으로 공유하기"
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#FEE500] px-3 py-2.5 text-[12px] font-bold text-[#191919] transition-opacity hover:opacity-85 active:opacity-70 ${className}`}
        >
            <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3C6.477 3 2 6.463 2 10.734c0 2.743 1.82 5.152 4.556 6.532-.2.75-.724 2.72-.83 3.142-.13.523.192.516.404.376.166-.11 2.64-1.794 3.71-2.522.71.105 1.44.16 2.16.16 5.523 0 10-3.463 10-7.688C22 6.463 17.523 3 12 3z" />
            </svg>
            공유
        </button>
    );
}
