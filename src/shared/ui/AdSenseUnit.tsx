"use client";

import { useEffect, useState } from "react";

declare global {
    interface Window {
        adsbygoogle: unknown[];
    }
}

interface AdSenseUnitProps {
    slot: string;
    format?: "auto" | "rectangle" | "horizontal" | "vertical";
    className?: string;
}

/**
 * Google AdSense 광고 유닛
 * slot: AdSense 대시보드에서 생성한 광고 유닛 ID (예: "1234567890")
 * 새 슬롯은 https://adsense.google.com → 광고 → 광고 단위 → 디스플레이 광고에서 생성
 */
export function AdSenseUnit({ slot, format = "auto", className = "" }: AdSenseUnitProps) {
    // 로컬·프리뷰 도메인에서는 AdSense가 광고를 채우지 않아 큰 흰색 박스만 남는다.
    // 다크 테마에서 특히 눈에 띄어, 실제 서비스 도메인에서만 렌더한다.
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (/(^|\.)tradehub\.kr$/.test(window.location.hostname)) setEnabled(true);
    }, []);

    // ins가 DOM에 올라온 뒤에 push해야 AdSense가 슬롯을 인식한다
    useEffect(() => {
        if (!enabled) return;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // AdSense script not loaded yet
        }
    }, [enabled]);

    if (!enabled) return null;

    return (
        <div className={`overflow-hidden ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client="ca-pub-4322318127284357"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
