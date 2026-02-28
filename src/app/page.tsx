import Link from "next/link";
import LiveMarketStats from "@/components/Landing/LiveMarketStats";

const SITE = "https://www.tradehub.kr";

const MAIN_JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TradeHub",
    url: SITE,
    description:
        "비트코인 모의투자와 실시간 시장 분석을 한 화면에서 제공하는 트레이딩 대시보드",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    inLanguage: "ko",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
    },
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#02C076] selection:text-black font-sans tracking-tight antialiased">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(MAIN_JSONLD) }}
            />

            {/* Grainy Noise Overlay */}
            <div className="landing-noise fixed inset-0 z-[9999] pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')]" />

            {/* 내비게이션 */}
            <nav className="landing-nav fixed top-0 z-[100] flex w-full items-center justify-between px-6 py-8 md:px-12 md:py-12 mix-blend-difference">
                <div className="flex flex-col">
                    <span className="text-2xl font-[1000] tracking-[-0.12em] leading-none text-white">
                        TRADEHUB
                    </span>
                    <span className="landing-accent text-[9px] font-bold tracking-[0.6em] text-[#02C076] mt-1 uppercase italic">
                        LIVE LAB
                    </span>
                </div>
                <div className="flex items-center gap-10">
                    <Link
                        href="/trading"
                        className="landing-launch group flex items-center gap-3 px-6 py-2 rounded-full border border-[#02C076]/30 hover:bg-[#02C076] hover:text-black transition-all"
                    >
                        <span className="text-xs font-black tracking-widest uppercase">
                            Launch
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#02C076] group-hover:bg-black animate-pulse" />
                    </Link>
                </div>
            </nav>

            <main className="relative mx-auto max-w-[1600px] px-6 md:px-12">
                {/* Section 1: Hero */}
                <section className="relative flex min-h-screen flex-col items-start justify-center pt-20">
                    <div className="flex flex-col gap-0 select-none">
                        <div className="overflow-hidden">
                            <h1 className="text-[clamp(4rem,18vw,15rem)] font-[1000] leading-[0.75] tracking-[-0.1em] animate-in fade-in slide-in-from-bottom-20 duration-1000 fill-mode-both">
                                <HeroNO />{" "}<span className="text-white">RISK,</span>
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
                        <p className="text-xl md:text-3xl font-medium leading-[1.3] tracking-tighter text-neutral-500">
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
                            className="landing-cta group relative inline-flex items-center justify-center h-28 px-20 bg-white text-black text-2xl font-[1000] tracking-tighter rounded-sm overflow-hidden transition-transform hover:scale-95 active:scale-90 shadow-[0_0_50px_rgba(2,192,118,0.2)]"
                        >
                            <span className="relative z-10 group-hover:text-white">
                                START REAL-TIME
                            </span>
                            <div className="absolute inset-0 bg-[#02C076] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                        </Link>

                        <LiveMarketStats />
                    </div>
                </section>

                {/* Section 2: Grid */}
                <section className="py-40 grid grid-cols-1 md:grid-cols-12 gap-1 px-2 md:px-0">
                    <div className="col-span-1 md:col-span-7 bg-neutral-950 p-12 md:p-20 flex flex-col justify-between min-h-[600px] border border-neutral-800">
                        <span className="text-xs font-black tracking-[0.5em] text-[#02C076] uppercase italic">
                            01 Precision
                        </span>
                        <h2 className="text-5xl md:text-8xl font-[1000] tracking-[-0.1em] leading-none mt-10">
                            TICK-BY-TICK
                            <br />
                            SYNC.
                        </h2>
                        <p className="mt-12 text-lg md:text-xl font-medium text-neutral-500 leading-relaxed">
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
                        <div className="landing-freedom h-1/2 bg-zinc-900 p-12 flex flex-col justify-between group transition-all hover:bg-white hover:text-black">
                            <span className="landing-freedom-label text-xs font-black tracking-[0.5em] text-neutral-600 group-hover:text-black/30 uppercase">
                                03 Freedom
                            </span>
                            <h3 className="text-4xl font-[1000] tracking-tighter">
                                NO SIGN UP.
                            </h3>
                            <p className="landing-freedom-desc text-neutral-500 group-hover:text-black font-medium tracking-tight">
                                기록은 당신의 브라우저에만 남습니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Features */}
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
                .hero-no-text {
                    padding-right: 0.06em;
                    background: linear-gradient(
                        90deg,
                        #02C076 0%,
                        #02C076 42%,
                        #34d399 45%,
                        rgba(255,255,255,0.85) 48%,
                        #ffffff 50%,
                        rgba(255,255,255,0.85) 52%,
                        #34d399 55%,
                        #02C076 58%,
                        #02C076 100%
                    );
                    background-size: 300% 100%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: drop-shadow(0 0 24px rgba(2,192,118,0.18));
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

function HeroNO() {
    return <span className="hero-no-text">NO</span>;
}

function FeatureRow({ title, desc }: { title: string; desc: React.ReactNode }) {
    return (
        <div className="group border-b border-neutral-800 pb-12 transition-all hover:border-[#02C076]">
            <h3 className="text-3xl font-[1000] tracking-tighter group-hover:text-[#02C076] transition-colors uppercase">
                {title}
            </h3>
            <p className="mt-6 text-xl font-medium text-neutral-500 leading-relaxed max-w-xl group-hover:text-zinc-300 transition-colors">
                {desc}
            </p>
        </div>
    );
}
