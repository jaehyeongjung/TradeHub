"use client";
import Link from "next/link";
import { LiveMarketStats } from "@/widgets/landing/LiveMarketStats";
import { useRef, useCallback } from "react";
import { FlagKR } from "@/shared/ui/FlagIcons";

export function LandingEN() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-[#00C896] selection:text-black font-sans tracking-tight antialiased">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "TradeHub",
                        url: "https://www.tradehub.kr/en",
                        description:
                            "Simulated crypto trading and real-time market analysis in one dashboard. Practice futures trading with up to 125x leverage — no sign-up required.",
                        applicationCategory: "FinanceApplication",
                        operatingSystem: "Web Browser",
                        inLanguage: "en",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                    }),
                }}
            />

            <nav className="fixed top-0 z-[100] flex w-full items-center justify-between px-6 py-8 md:px-12 md:py-10">
                <div className="flex items-baseline gap-3">
                    <span className="text-xl font-black tracking-[-0.08em] leading-none text-white">
                        TRADEHUB
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <LandingLangSwitch />
                    <Link href="/en/trading" className="landing-nav-link">
                        Get Started
                    </Link>
                </div>
            </nav>

            <main
                className="relative mx-auto max-w-[1600px] px-6 md:px-12 h-screen overflow-y-scroll scrollbar-hide"
                style={{ scrollSnapType: "y mandatory" }}
            >
                {/* Hero */}
                <section
                    className="relative flex h-screen flex-col items-start justify-center pt-20"
                    style={{ scrollSnapAlign: "start" }}
                >
                    <div className="flex flex-col gap-0 select-none">
                        <div className="overflow-hidden">
                            <h1 className="text-[clamp(3rem,min(18vw,25vh),15rem)] font-[1000] leading-[0.75] tracking-[-0.1em] animate-in fade-in slide-in-from-bottom-20 duration-1000 fill-mode-both">
                                <HeroNO />{" "}
                                <span className="text-white">RISK,</span>
                            </h1>
                        </div>
                        <div className="overflow-hidden mt-[-1vw]">
                            <h1 className="text-[clamp(3rem,min(18vw,25vh),15rem)] font-[1000] leading-[0.75] tracking-[-0.11em] italic text-white animate-in fade-in slide-in-from-bottom-40 duration-1000 delay-200 fill-mode-both">
                                JUST <GlowText className="not-italic" />
                            </h1>
                        </div>
                    </div>

                    <div className="mt-[min(4rem,6vh)] ml-2 max-w-2xl">
                        <p className="text-[clamp(1rem,1.8vh,1.5rem)] font-medium leading-[1.5] tracking-tight text-neutral-500">
                            Real market conditions.{" "}
                            <span className="text-neutral-200 font-semibold">
                                Zero risk.
                            </span>
                            <br />
                            Start now with 10,000 USDT — no sign-up required.
                        </p>
                    </div>

                    <div className="mt-[min(6rem,9vh)] w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
                        <Link href="/en/trading" className="landing-cta-btn">
                            <span>Start for Free</span>
                            <svg
                                className="landing-cta-arrow"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </Link>
                        <LiveMarketStats />
                    </div>
                </section>

                {/* Feature Cards */}
                <section
                    className="py-[min(8rem,11vh)] grid grid-cols-1 md:grid-cols-12 gap-2 h-screen content-center"
                    style={{ scrollSnapAlign: "start" }}
                >
                    <div className="col-span-1 md:col-span-7 bg-neutral-900 p-[clamp(2rem,min(3vw,5vh),5rem)] flex flex-col justify-between min-h-[min(560px,62vh)] rounded-3xl">
                        <span className="text-xs font-semibold tracking-[0.3em] text-[#00C896] uppercase">
                            01 / Precision
                        </span>
                        <h2 className="text-[clamp(2.5rem,min(6vw,8vh),4.5rem)] font-black tracking-[-0.06em] leading-none mt-[min(2.5rem,4vh)]">
                            TICK-BY-TICK
                            <br />
                            SYNC.
                        </h2>
                        <p className="mt-[min(2.5rem,4vh)] text-base md:text-lg font-medium text-neutral-500 leading-relaxed">
                            Every bid and ask from Binance mirrored at 0.1-second
                            intervals.
                            <br />
                            Real execution data — slippage included.
                        </p>
                    </div>
                    <div className="col-span-1 md:col-span-5 flex flex-col gap-2">
                        <div className="flex-1 bg-neutral-900 p-[clamp(1.5rem,min(2.5vw,4vh),2.5rem)] flex flex-col justify-between rounded-3xl group">
                            <span className="text-xs font-semibold tracking-[0.3em] text-neutral-600 uppercase">
                                02 / Leverage
                            </span>
                            <div>
                                <h3 className="text-6xl font-black tracking-tighter text-[#00C896]">
                                    125X
                                </h3>
                                <p className="mt-3 text-neutral-500 font-medium tracking-tight text-sm">
                                    Push your instincts to the limit with full leverage.
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 bg-neutral-900 p-[clamp(1.5rem,min(2.5vw,4vh),2.5rem)] flex flex-col justify-between rounded-3xl">
                            <span className="text-xs font-semibold tracking-[0.3em] text-neutral-600 uppercase">
                                03 / Freedom
                            </span>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter text-white">
                                    NO SIGN UP.
                                </h3>
                                <p className="mt-3 text-neutral-500 font-medium tracking-tight text-sm">
                                    Your records stay in your browser. Nothing else.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trading Logic */}
                <section
                    className="flex flex-col md:flex-row gap-[min(5rem,8vw)] items-start h-screen py-[min(8rem,11vh)]"
                    style={{ scrollSnapAlign: "start", paddingTop: "min(22vh,12rem)" }}
                >
                    <div className="md:w-1/3">
                        <h2 className="text-[clamp(2rem,3.5vh,2.5rem)] font-black tracking-[-0.06em] leading-tight">
                            Trading logic <br />
                            <span className="text-[#00C896]">built for real.</span>
                        </h2>
                    </div>
                    <div className="md:w-2/3 space-y-[min(6rem,9vh)]">
                        <FeatureRow
                            title="Isolated & Cross Margin"
                            desc={
                                <span className="whitespace-nowrap">
                                    Isolate or share risk across positions. 100% faithful to
                                    real exchange margin logic.
                                </span>
                            }
                        />
                        <FeatureRow
                            title="Advanced Order Types"
                            desc={
                                <>
                                    Limit and Market are just the start. Practice disciplined
                                    execution with Stop-Market and full TP/SL engine.
                                </>
                            }
                        />
                        <FeatureRow
                            title="Zero-Latency Chart"
                            desc={
                                <>
                                    Real-time charts with no data lag — spot every edge before
                                    the market moves.
                                </>
                            }
                        />
                    </div>
                </section>
            </main>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .hero-no-text {
                    padding-right: 0.06em;
                    background: linear-gradient(
                        90deg,
                        #00C896 0%,
                        #00C896 42%,
                        #7FFFD4 45%,
                        #C8FFF0 48%,
                        #DFFFEF 50%,
                        #C8FFF0 52%,
                        #7FFFD4 55%,
                        #00C896 58%,
                        #00C896 100%
                    );
                    background-size: 300% 100%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: drop-shadow(0 0 24px rgba(0,200,150,0.18));
                    animation: hero-no-shine 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                @keyframes hero-no-shine {
                    0%, 20% { background-position: 100% center; }
                    50%, 100% { background-position: 0% center; }
                }
            `,
                }}
            />
        </div>
    );
}

function GlowText({ className }: { className?: string }) {
    const ref = useRef<HTMLSpanElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        el.style.backgroundImage = `radial-gradient(circle at ${x}% 50%, #AFFFDF 0%, #00C896 40%, #00875A 100%)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.backgroundImage = `linear-gradient(135deg, #00C896 0%, #00A878 100%)`;
    }, []);

    return (
        <span
            ref={ref}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                backgroundImage: "linear-gradient(135deg, #00C896 0%, #00A878 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                transition: "background-image 0.1s ease",
                cursor: "default",
            }}
        >
            EDGE.
        </span>
    );
}

function HeroNO() {
    return <span className="hero-no-text">NO</span>;
}

function LandingLangSwitch() {
    return (
        <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 hover:border-white/30 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
            aria-label="한국어로 전환"
            title="한국어"
        >
            <FlagKR size={22} />
        </Link>
    );
}

function FeatureRow({ title, desc }: { title: string; desc: React.ReactNode }) {
    return (
        <div className="group border-b border-neutral-800 pb-[min(2.5rem,4vh)] transition-colors duration-300 hover:border-neutral-700">
            <h3 className="text-[clamp(1.25rem,2.5vh,1.5rem)] font-black tracking-tight group-hover:text-[#00C896] transition-colors duration-300">
                {title}
            </h3>
            <p className="mt-[min(1rem,1.5vh)] text-base font-medium text-neutral-500 leading-relaxed max-w-xl group-hover:text-neutral-400 transition-colors duration-300">
                {desc}
            </p>
        </div>
    );
}
