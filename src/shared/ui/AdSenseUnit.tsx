"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
    // 클라이언트 사이드 이동마다 ins를 새로 만들기 위한 키다. 아래 key 주석 참고.
    const pathname = usePathname();

    // 로컬·프리뷰 도메인에서는 AdSense가 광고를 채우지 않아 큰 흰색 박스만 남는다.
    // 다크 테마에서 특히 눈에 띄어, 실제 서비스 도메인에서만 렌더한다.
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (/(^|\.)tradehub\.kr$/.test(window.location.hostname)) setEnabled(true);
    }, []);

    // ins가 DOM에 올라온 뒤에 push해야 AdSense가 슬롯을 인식한다.
    // pathname이 의존성에 있어야 클라이언트 사이드 이동 뒤에도 다시 요청이 나간다.
    useEffect(() => {
        if (!enabled) return;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            // 삼키면 안 된다. 여기 잡히는 건 대부분 TagError이고,
            // 조용히 무시하면 "광고 자리는 잡히는데 아무것도 안 뜨는" 상태의
            // 원인을 찾을 방법이 없어진다.
            console.warn("[AdSense] push 실패:", e);
        }
    }, [enabled, pathname]);

    if (!enabled) return null;

    return (
        <div className={`overflow-hidden ${className}`}>
            {/*
             * key에 pathname이 들어가야 한다.
             *
             * 없으면 React가 페이지를 옮겨도 같은 자리의 ins DOM 노드를 재사용하는데,
             * 구글이 이전 페이지에서 붙여둔 data-adsbygoogle-status="done"이 그대로 남는다.
             * 그 상태로 push()하면 "All ins elements in the DOM with class=adsbygoogle
             * already have ads in them" TagError가 나면서 광고 요청 자체가 안 나간다.
             * 요청이 없으면 data-ad-status도 안 붙어서 unfilled 접힘 CSS까지 빗나가고,
             * 결국 높이만 잡힌 빈 박스가 남는다.
             */}
            <ins
                key={`${pathname}-${slot}`}
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
