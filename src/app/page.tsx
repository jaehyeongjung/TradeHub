"use client"; // 실시간 데이터 페칭을 위해 클라이언트 컴포넌트 사용

import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";

const SITE = "https://www.tradehub.kr";

export default function SimTradingPage() {
    // 실시간 상태 관리
    const [btcPrice, setBtcPrice] = useState<number>(0);
    const [volume, setVolume] = useState<string>("---,---");
    const [isRising, setIsRising] = useState<boolean>(false);

    useEffect(() => {
        // 바이낸스 데이터 페칭 (가격 및 24시간 거래량)
        const fetchMarketData = async () => {
            try {
                const res = await fetch(
                    "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
                );
                const data = await res.json();

                const currentPrice = parseFloat(data.lastPrice);

                // 가격 상승 체크 (플래시 효과용)
                if (currentPrice > btcPrice && btcPrice !== 0) {
                    setIsRising(true);
                    setTimeout(() => setIsRising(false), 500);
                }

                setBtcPrice(currentPrice);
                // ACTIVE TRADERS 대신 실제 24시간 거래량(BTC 수량) 반영
                setVolume(
                    parseFloat(data.volume).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                    }),
                );
            } catch (e) {
                console.error("Data fetch error", e);
            }
        };

        fetchMarketData();
        const interval = setInterval(fetchMarketData, 1500); // 1.5초마다 갱신

        return () => clearInterval(interval);
    }, [btcPrice]);

    return (
        <div className="min-h-screen bg-[#000] text-[#fff] selection:bg-[#02C076] selection:text-black font-sans tracking-tight antialiased">
            <Script
                id="ld-main"
                type="application/ld+json"
                strategy="afterInteractive"
            >
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebApplication",
                    name: "TradeHub",
                    url: SITE,
                    description: "High-end Crypto Simulator",
                })}
            </Script>

            {/* Grainy Noise Overlay */}
            <div className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')]" />

            {/* 내비게이션 */}
            <nav className="fixed top-0 z-[100] flex w-full items-center justify-between px-6 py-8 md:px-12 md:py-12 mix-blend-difference">
                <div className="flex flex-col">
                    <span className="text-2xl font-[1000] tracking-[-0.12em] leading-none text-white">
                        TRADEHUB
                    </span>
                    <span className="text-[9px] font-bold tracking-[0.6em] text-[#02C076] mt-1 uppercase italic">
                        LIVE LAB
                    </span>
                </div>
                <div className="flex items-center gap-10">
                    <Link
                        href="/trading"
                        className="group flex items-center gap-3 px-6 py-2 rounded-full border border-[#02C076]/30 hover:bg-[#02C076] hover:text-black transition-all"
                    >
                        <span className="text-xs font-black tracking-widest uppercase">
                            Launch
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#02C076] group-hover:bg-black animate-pulse" />
                    </Link>
                </div>
            </nav>

            <main className="relative mx-auto max-w-[1600px] px-6">
                {/* Section 1: Hero */}
                <section className="relative flex min-h-screen flex-col items-start justify-center pt-20">
                    <div className="flex flex-col gap-0 select-none">
                        <div className="overflow-hidden">
                            <h1 className="text-[clamp(4rem,18vw,15rem)] font-[1000] leading-[0.75] tracking-[-0.1em] text-zinc-900 animate-in fade-in slide-in-from-bottom-20 duration-1000 fill-mode-both">
                                NO <span className="text-white">RISK,</span>
                            </h1>
                        </div>
                        <div className="overflow-hidden mt-[-1vw]">
                            <h1 className="text-[clamp(4rem,18vw,15rem)] font-[1000] leading-[0.75] tracking-[-0.11em] italic text-white animate-in fade-in slide-in-from-bottom-40 duration-1000 delay-200 fill-mode-both">
                                JUST{" "}
                                <span className="text-[#02C076] not-italic">
                                    EDGE.
                                </span>
                            </h1>
                        </div>
                    </div>

                    <div className="mt-20 ml-2 max-w-2xl border-l border-[#02C076] pl-8">
                        <p className="text-xl md:text-3xl font-medium leading-[1.3] tracking-tighter text-zinc-500">
                            우리는{" "}
                            <span className="text-white font-bold">
                                상승의 에너지
                            </span>
                            를 완벽하게 복제합니다.
                            <br />
                            가입 없이 지급되는 10,000 USDT로 당신의 감각을{" "}
                            <br />
                            날카롭게 벼리세요.
                        </p>
                    </div>

                    <div className="mt-32 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
                        <Link
                            href="/trading"
                            className="group relative inline-flex items-center justify-center h-28 px-20 bg-white text-black text-2xl font-[1000] tracking-tighter rounded-sm overflow-hidden transition-transform hover:scale-95 active:scale-90 shadow-[0_0_50px_rgba(2,192,118,0.2)]"
                        >
                            <span className="relative z-10">
                                START REAL-TIME
                            </span>
                            <div className="absolute inset-0 bg-[#02C076] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                        </Link>

                        <div className="flex flex-col items-end text-right">
                            <span className="text-[10px] font-black tracking-[0.5em] text-zinc-500 mb-4 uppercase">
                                Live Market Status
                            </span>
                            <div className="flex gap-12">
                                <HeroStat
                                    label="BTC/USDT"
                                    value={btcPrice.toLocaleString(undefined, {
                                        minimumFractionDigits: 1,
                                    })}
                                    color={
                                        isRising
                                            ? "text-white scale-105"
                                            : "text-[#02C076]"
                                    }
                                    isRising={isRising}
                                />
                                <HeroStat
                                    label="24H VOL (BTC)"
                                    value={volume}
                                    color="text-white"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Grid */}
                <section className="py-40 grid grid-cols-1 md:grid-cols-12 gap-1 px-2 md:px-0">
                    <div className="col-span-1 md:col-span-7 bg-[#080808] p-12 md:p-20 flex flex-col justify-between min-h-[600px] border border-white/5">
                        <span className="text-xs font-black tracking-[0.5em] text-[#02C076] uppercase italic">
                            01 Precision
                        </span>
                        <h2 className="text-5xl md:text-8xl font-[1000] tracking-[-0.1em] leading-none mt-10">
                            TICK-BY-TICK
                            <br />
                            SYNC.
                        </h2>
                        <p className="mt-12 text-lg md:text-xl font-medium text-zinc-600 leading-relaxed">
                            바이낸스 거래소의 모든 매수/매도 잔량을 0.1초 단위로
                            미러링합니다. <br />
                            슬리피지까지 계산된 진짜 실전 데이터입니다.
                        </p>
                    </div>
                    <div className="col-span-1 md:col-span-5 flex flex-col gap-1">
                        <div className="h-1/2 bg-[#02C076] p-12 flex flex-col justify-between hover:bg-[#02A666] transition-colors group cursor-pointer">
                            <span className="text-xs font-black tracking-[0.5em] text-black/50 uppercase">
                                02 Leverage
                            </span>
                            <h3 className="text-6xl font-[1000] tracking-tighter italic text-black">
                                125X
                            </h3>
                            <p className="text-black/70 font-bold tracking-tight">
                                상승장의 불꽃을 레버리지로 극대화하세요.
                            </p>
                        </div>
                        <div className="h-1/2 bg-zinc-900 p-12 flex flex-col justify-between group transition-all hover:bg-white hover:text-black">
                            <span className="text-xs font-black tracking-[0.5em] text-zinc-700 group-hover:text-black/30 uppercase">
                                03 Freedom
                            </span>
                            <h3 className="text-4xl font-[1000] tracking-tighter">
                                NO SIGN UP.
                            </h3>
                            <p className="text-zinc-500 group-hover:text-black font-medium tracking-tight">
                                기록은 당신의 브라우저에만 남습니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Features - 줄바꿈 적용 */}
                <section className="py-40 flex flex-col md:flex-row gap-20 items-start">
                    <div className="md:w-1/3 sticky top-40">
                        <h2 className="text-4xl font-[1000] tracking-[-0.08em] uppercase leading-tight">
                            실전과 동일한 <br />
                            <span className="text-[#02C076]">매매 로직</span>
                        </h2>
                    </div>
                    <div className="md:w-2/3 space-y-32">
                        <FeatureRow
                            title="Isolated & Cross Margin"
                            desc={
                                <>
                                    포지션마다 리스크를 분리하거나 통합하세요.{" "}
                                    <br /> 실제 거래소의 증거금 로직을 100%
                                    반영했습니다.
                                </>
                            }
                        />
                        <FeatureRow
                            title="Advanced Order Types"
                            desc={
                                <>
                                    Limit, Market은 기본. Stop-Market과 TP/SL
                                    엔진을 통해 <br /> 기계적인 매매를
                                    연습하세요.
                                </>
                            }
                        />
                        <FeatureRow
                            title="Zero-Latency Chart"
                            desc={
                                <>
                                    데이터 지연 없는 실시간 TradingView 차트로{" "}
                                    <br /> 기술적 분석의 정점을 확인하세요.
                                </>
                            }
                        />
                    </div>
                </section>
            </main>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes flash {
                    0% { opacity: 1; filter: brightness(1); }
                    50% { opacity: 0.7; filter: brightness(2) drop-shadow(0 0 10px #02C076); }
                    100% { opacity: 1; filter: brightness(1); }
                }
                .animate-flash { animation: flash 0.4s ease-out; }
                @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
                .animate-progress { animation: progress 3s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
                body { background-color: #000; -webkit-font-smoothing: antialiased; }
                * { cursor: crosshair; }
            `,
                }}
            />
        </div>
    );
}

function HeroStat({
    label,
    value,
    color,
    isRising,
}: {
    label: string;
    value: string;
    color: string;
    isRising?: boolean;
}) {
    return (
        <div className="flex flex-col items-end min-w-[120px]">
            <span className="text-[9px] font-black tracking-widest text-zinc-500 mb-2 uppercase italic">
                {label}
            </span>
            <span
                className={`text-4xl md:text-6xl font-[1000] tracking-tighter ${color} transition-all duration-300 tabular-nums ${isRising ? "animate-flash" : ""}`}
            >
                {value}
            </span>
        </div>
    );
}

function FeatureRow({ title, desc }: { title: string; desc: React.ReactNode }) {
    return (
        <div className="group border-b border-zinc-900 pb-12 transition-all hover:border-[#02C076]">
            <h3 className="text-3xl font-[1000] tracking-tighter group-hover:text-[#02C076] transition-colors uppercase">
                {title}
            </h3>
            <p className="mt-6 text-xl font-medium text-zinc-600 leading-relaxed max-w-xl group-hover:text-zinc-300 transition-colors">
                {desc}
            </p>
        </div>
    );
}
