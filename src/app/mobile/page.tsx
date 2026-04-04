"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import Image from "next/image";

const FEATURES_KO = [
    {
        color: "bg-amber-500/10",
        iconColor: "text-amber-400",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        label: "선물 모의투자",
        desc: "최대 125배 레버리지 · 롱/숏",
        img: "/mobile-trade.png",
        alt: "선물 모의투자",
    },
    {
        color: "bg-emerald-500/10",
        iconColor: "text-emerald-400",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ),
        label: "실시간 대시보드",
        desc: "청산 · 고래 · 김프 · 공포탐욕지수",
        img: "/mobile-dash.png",
        alt: "실시간 대시보드",
    },
    {
        color: "bg-blue-500/10",
        iconColor: "text-blue-400",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
            </svg>
        ),
        label: "거래량 트리맵",
        desc: "150개 코인 등락률 시각화",
        img: "/mobile-tree.png",
        alt: "거래량 트리맵",
    },
];

const FEATURES_EN = [
    { ...FEATURES_KO[0], label: "Futures Sim Trading", desc: "Up to 125x leverage · Long/Short" },
    { ...FEATURES_KO[1], label: "Live Dashboard", desc: "Liquidations · Whales · Kimchi Premium · Fear & Greed" },
    { ...FEATURES_KO[2], label: "Volume Treemap", desc: "150+ coins — price change heatmap" },
];

function MobilePageInner() {
    const [copied, setCopied] = useState(false);
    const isLight = useTheme();
    const searchParams = useSearchParams();
    const isEn = searchParams.get("lang") === "en";

    const FEATURES = isEn ? FEATURES_EN : FEATURES_KO;

    const handleCopy = () => {
        navigator.clipboard.writeText("https://www.tradehub.kr");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`min-h-screen flex flex-col selection:bg-emerald-500/30 ${isLight ? "bg-neutral-50 text-neutral-950" : "bg-[#0A0A0A] text-white"}`}>

            <header className="px-6 pt-14 pb-0 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className={`text-[22px] font-[900] tracking-[-0.08em] leading-none ${isLight ? "text-neutral-900" : "text-white"}`}>
                        TRADEHUB
                    </span>
                    <span className="text-[9px] font-bold tracking-[0.5em] text-emerald-500 mt-1 uppercase">
                        LIVE LAB
                    </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-400 tracking-wide">LIVE</span>
                </div>
            </header>

            <main className="flex-1 px-6 pb-36">

                <section className="pt-12 pb-10">
                    <div className={`w-14 h-14 rounded-[18px] border flex items-center justify-center mb-7 ${isLight ? "bg-white border-neutral-200" : "bg-neutral-900 border-neutral-800"}`}>
                        <svg className={`w-7 h-7 ${isLight ? "text-neutral-400" : "text-neutral-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-[30px] font-bold leading-[1.2] tracking-tight mb-3">
                        {isEn ? (
                            <><span className="text-emerald-500">Better</span> on desktop.</>
                        ) : (
                            <>PC에서 <span className="text-emerald-500">더 잘</span> 보여요</>
                        )}
                    </h1>
                    <p className={`text-[15px] leading-relaxed ${isLight ? "text-neutral-500" : "text-neutral-500"}`}>
                        {isEn ? (
                            <>TradeHub is optimized for desktop.<br />Copy the link and open it on your PC.</>
                        ) : (
                            <>TradeHub는 PC 환경에 최적화되어 있어요.<br />아래 주소를 복사해서 PC 브라우저에서 접속해보세요.</>
                        )}
                    </p>
                </section>

                <div className={`border rounded-2xl p-5 mb-3 ${isLight ? "bg-white border-neutral-200" : "bg-neutral-900 border-neutral-800"}`}>
                    <p className={`text-[11px] mb-3 font-medium tracking-wide uppercase ${isLight ? "text-neutral-400" : "text-neutral-600"}`}>
                        {isEn ? "URL" : "접속 주소"}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <svg className={`w-4 h-4 shrink-0 ${isLight ? "text-neutral-400" : "text-neutral-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className={`font-semibold text-[15px] truncate ${isLight ? "text-neutral-900" : "text-white"}`}>www.tradehub.kr</span>
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 active:scale-95 ${
                                copied
                                    ? "bg-emerald-500 text-white"
                                    : isLight
                                        ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                        : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                            }`}
                        >
                            {copied ? (isEn ? "Copied ✓" : "복사됨 ✓") : (isEn ? "Copy" : "복사")}
                        </button>
                    </div>
                </div>

                <section className="mt-10">
                    <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isLight ? "text-neutral-400" : "text-neutral-600"}`}>
                        {isEn ? "Features" : "주요 기능"}
                    </p>
                    <div className="space-y-3">
                        {FEATURES.map((f) => (
                            <div key={f.label} className={`border rounded-2xl overflow-hidden ${isLight ? "bg-white border-neutral-200" : "bg-neutral-900 border-neutral-800/60"}`}>
                                <div className="relative px-3 pt-3">
                                    <div className="rounded-xl overflow-hidden">
                                        <Image
                                            src={f.img}
                                            alt={f.alt}
                                            width={400}
                                            height={200}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3.5 px-4 py-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.color} ${f.iconColor}`}>
                                        {f.icon}
                                    </div>
                                    <div>
                                        <p className={`text-[14px] font-bold leading-tight ${isLight ? "text-neutral-900" : "text-white"}`}>{f.label}</p>
                                        <p className="text-[12px] text-neutral-500 mt-0.5">{f.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <div className={`fixed bottom-0 left-0 right-0 px-5 pb-10 pt-6 pointer-events-none bg-gradient-to-t ${isLight ? "from-neutral-50 via-neutral-50/95" : "from-[#0A0A0A] via-[#0A0A0A]/95"} to-transparent`}>
                <button
                    onClick={handleCopy}
                    className={`pointer-events-auto w-full h-[56px] rounded-2xl font-bold text-[16px] tracking-tight transition-all duration-200 active:scale-[0.98] shadow-lg ${
                        copied
                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                            : isLight
                                ? "bg-neutral-950 text-white shadow-black/10"
                                : "bg-white text-neutral-950 shadow-white/10"
                    }`}
                >
                    {copied
                        ? (isEn ? "✓  Link copied!" : "✓  주소가 복사됐어요")
                        : (isEn ? "Copy desktop link" : "PC 주소 복사하기")}
                </button>
                <p className={`text-center text-[11px] mt-3 pointer-events-none ${isLight ? "text-neutral-400" : "text-neutral-700"}`}>© 2026 TradeHub. All rights reserved.</p>
            </div>
        </div>
    );
}

export default function MobilePage() {
    return (
        <Suspense fallback={null}>
            <MobilePageInner />
        </Suspense>
    );
}
