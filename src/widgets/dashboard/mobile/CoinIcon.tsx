"use client";

import Image from "next/image";
import { useState } from "react";

/** 바이낸스 CDN에 로고가 없는 선물 전용 코인 오버라이드 */
const OVERRIDES: Record<string, string> = {
    HYPE: "https://coin-images.coingecko.com/coins/images/50882/small/hyperliquid.jpg",
};

function logoUrl(base: string) {
    return OVERRIDES[base] ?? `https://bin.bnbstatic.com/static/assets/logos/${base}.png`;
}

/** 로고가 없으면 첫 글자 배지로 떨어뜨려 목록 정렬이 흐트러지지 않게 한다. */
export function CoinIcon({ base, size = 28 }: { base: string; size?: number }) {
    const [failed, setFailed] = useState(false);
    const sym = base.toUpperCase();

    if (failed) {
        return (
            <span
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-surface-input font-bold text-text-secondary"
                style={{ width: size, height: size, fontSize: size * 0.42 }}
                aria-hidden="true"
            >
                {sym.charAt(0)}
            </span>
        );
    }

    return (
        <Image
            src={logoUrl(sym)}
            alt=""
            width={size}
            height={size}
            unoptimized
            // 바이낸스 CDN은 Referer가 붙으면 403(핫링크 차단)으로 막는다.
            referrerPolicy="no-referrer"
            className="shrink-0 rounded-full"
            onError={() => setFailed(true)}
        />
    );
}
