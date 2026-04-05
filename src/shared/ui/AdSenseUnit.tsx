"use client";

import { useEffect } from "react";

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
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // AdSense script not loaded yet
        }
    }, []);

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
