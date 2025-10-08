"use client";
import { useEffect, useState } from "react";
import FearGreedGauge from "@/components/FearGreedGauge";

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
            </div>
        );
    }

    return (
        <div
            className="relative rounded-2xl border border-neutral-800 bg-neutral-900 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <FearGreedGauge
                value={val}
                subLabel={label}
                title="Crypto Fear & Greed"
            />
        </div>
    );
}
