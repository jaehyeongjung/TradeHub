"use client";
import { useEffect, useState } from "react";
import FearGreedGauge from "@/components/FearGreedGauge";

const FEAR_GREED_DESCRIPTION =
    "암호화폐 시장의 투자 심리를 0(극심한 공포)부터 100(극심한 탐욕)까지 나타내는 지수입니다.<br />" +
    "공포는 가격 하락, 탐욕은 가격 상승과 연관되는 경향이 있습니다.";

export default function FearGreedCard() {
    const [val, setVal] = useState<number | null>(null);
    const [label, setLabel] = useState<string | undefined>(undefined);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        fetch("/api/fear-greed")
            .then((r) => r.json())
            .then((d) => {
                setVal(d.value);
                setLabel(d.label);
            })
            .catch(() => {
                setVal(50);
                setLabel("Neutral");
            }); // 폴백
    }, []);

    if (val == null) {
        return (
            <div
                className="relative rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-white min-h-30" // min-h-30 추가하여 툴팁 공간 확보
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="animate-pulse text-sm text-neutral-400">
                    불러오는 중…
                </div>
                {isHovered && (
                    <div className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-64 -translate-x-1/2 rounded-lg bg-gray-700 p-3 text-xs text-white shadow-xl pointer-events-none">
                        <p className="font-bold mb-1">
                            Crypto Fear & Greed 지수 설명
                        </p>
                        <p
                            dangerouslySetInnerHTML={{
                                __html: FEAR_GREED_DESCRIPTION,
                            }}
                        />
                        <div className="absolute left-1/2 translate-x-[-50%] top-[-5px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px] border-l-transparent border-r-transparent border-b-gray-700" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="relative rounded-2xl border border-neutral-800 bg-neutral-900"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <FearGreedGauge
                value={val}
                subLabel={label}
                title="Crypto Fear & Greed"
            />

            {isHovered && (
                <div className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-64 -translate-x-1/2 rounded-lg bg-gray-700 p-3 text-xs text-white shadow-xl pointer-events-none">
                    <p className="font-bold mb-1">
                        Crypto Fear & Greed 지수 설명
                    </p>
                    <p
                        dangerouslySetInnerHTML={{
                            __html: FEAR_GREED_DESCRIPTION,
                        }}
                    />
                    <div className="absolute left-1/2 translate-x-[-50%] top-[-5px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px] border-l-transparent border-r-transparent border-b-gray-700" />
                </div>
            )}
        </div>
    );
}
