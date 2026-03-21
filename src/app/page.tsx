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
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-[#02C076] selection:text-black font-sans tracking-tight antialiased">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(MAIN_JSONLD) }}
            />

            {/* 내비게이션 */}
            <nav className="fixed top-0 z-[100] flex w-full items-center justify-between px-6 py-8 md:px-12 md:py-10">
                <div className="flex items-baseline gap-3">
                    <span className="text-xl font-black tracking-[-0.08em] leading-none text-white">
                        TRADEHUB
                    </span>
                </div>
                <Link
                    href="/trading"
                    className="group flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors duration-200"
                >
                    시작하기
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
            </nav>

            <main className="relative mx-auto max-w-[1600px] px-6 md:px-12 h-screen overflow-y-scroll scrollbar-hide" style={{ scrollSnapType: "y mandatory" }}>
                {/* Section 1: Hero */}
                <section className="relative flex h-screen flex-col items-start justify-center pt-20" style={{ scrollSnapAlign: "start" }}>
                    <div className="flex flex-col gap-0 select-none">
                        <div className="overflow-hidden">
                            <h1 className="text-[clamp(3rem,min(18vw,25vh),15rem)] font-[1000] leading-[0.75] tracking-[-0.1em] animate-in fade-in slide-in-from-bottom-20 duration-1000 fill-mode-both">
                                <HeroNO />{" "}<span className="text-white">RISK,</span>
                            </h1>
                        </div>
                        <div className="overflow-hidden mt-[-1vw]">
                            <h1 className="text-[clamp(3rem,min(18vw,25vh),15rem)] font-[1000] leading-[0.75] tracking-[-0.11em] italic text-white animate-in fade-in slide-in-from-bottom-40 duration-1000 delay-200 fill-mode-both">
                                JUST{" "}
                                <span className="text-[#02C076] not-italic">
                                    EDGE.
                                </span>
                            </h1>
                        </div>
                    </div>

                    <div className="mt-[min(4rem,6vh)] ml-2 max-w-2xl">
                        <p className="text-[clamp(1rem,1.8vh,1.5rem)] font-medium leading-[1.5] tracking-tight text-neutral-500">
                            실전 그대로,{" "}
                            <span className="text-neutral-200 font-semibold">
                                리스크 없이.
                            </span>
                            <br />
                            가입 없이 지급되는 10,000 USDT로
                            지금 바로 시작하세요.
                        </p>
                    </div>

                    <div className="mt-[min(6rem,9vh)] w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
                        <Link
                            href="/trading"
                            className="landing-cta group relative inline-flex items-center justify-center h-16 px-12 bg-[#02C076] text-black text-base font-bold tracking-tight rounded-2xl overflow-hidden transition-all duration-300 hover:bg-[#02b36d] hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="relative z-10">
                                무료로 시작하기
                            </span>
                        </Link>

                        <LiveMarketStats />
                    </div>
                </section>

                {/* Section 2: Grid */}
                <section className="py-[min(8rem,11vh)] grid grid-cols-1 md:grid-cols-12 gap-2 h-screen content-center" style={{ scrollSnapAlign: "start" }}>
                    <div className="col-span-1 md:col-span-7 bg-neutral-900 p-[clamp(2rem,min(3vw,5vh),5rem)] flex flex-col justify-between min-h-[min(560px,62vh)] rounded-3xl">
                        <span className="text-xs font-semibold tracking-[0.3em] text-[#02C076] uppercase">
                            01 / Precision
                        </span>
                        <h2 className="text-[clamp(2.5rem,min(6vw,8vh),4.5rem)] font-black tracking-[-0.06em] leading-none mt-[min(2.5rem,4vh)]">
                            TICK-BY-TICK
                            <br />
                            SYNC.
                        </h2>
                        <p className="mt-[min(2.5rem,4vh)] text-base md:text-lg font-medium text-neutral-500 leading-relaxed">
                            바이낸스 거래소의 모든 매수/매도 잔량을 0.1초 단위로 미러링합니다.
                            <br />
                            슬리피지까지 계산된 진짜 실전 데이터입니다.
                        </p>
                    </div>
                    <div className="col-span-1 md:col-span-5 flex flex-col gap-2">
                        <div className="flex-1 bg-neutral-900 p-[clamp(1.5rem,min(2.5vw,4vh),2.5rem)] flex flex-col justify-between rounded-3xl group">
                            <span className="text-xs font-semibold tracking-[0.3em] text-neutral-600 uppercase">
                                02 / Leverage
                            </span>
                            <div>
                                <h3 className="text-6xl font-black tracking-tighter text-[#02C076]">
                                    125X
                                </h3>
                                <p className="mt-3 text-neutral-500 font-medium tracking-tight text-sm">
                                    레버리지로 실전 감각을 극대화하세요.
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
                                    기록은 당신의 브라우저에만 남습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Features */}
                <section className="flex flex-col md:flex-row gap-[min(5rem,8vw)] items-start h-screen py-[min(8rem,11vh)]" style={{ scrollSnapAlign: "start", paddingTop: "min(22vh,12rem)" }}>
                    <div className="md:w-1/3">
                        <h2 className="text-[clamp(2rem,3.5vh,2.5rem)] font-black tracking-[-0.06em] leading-tight">
                            실전과 동일한 <br />
                            <span className="text-[#02C076]">매매 로직</span>
                        </h2>
                    </div>
                    <div className="md:w-2/3 space-y-[min(6rem,9vh)]">
                        <FeatureRow
                            title="Isolated & Cross Margin"
                            desc={
                                <>
                                    <span className="whitespace-nowrap">포지션마다 리스크를 분리하거나 통합하세요. 실제 거래소의 증거금 로직을 100% 반영했습니다.</span>
                                </>
                            }
                        />
                        <FeatureRow
                            title="Advanced Order Types"
                            desc={
                                <>
                                    Limit, Market은 기본. Stop-Market과 TP/SL
                                    엔진을 통해 기계적인 매매를
                                    연습하세요.
                                </>
                            }
                        />
                        <FeatureRow
                            title="Zero-Latency Chart"
                            desc={
                                <>
                                    데이터 지연 없는 실시간 차트로{" "}
                                    기술적 분석의 정점을 확인하세요.
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
        <div className="group border-b border-neutral-800 pb-[min(2.5rem,4vh)] transition-colors duration-300 hover:border-neutral-700">
            <h3 className="text-[clamp(1.25rem,2.5vh,1.5rem)] font-black tracking-tight group-hover:text-[#02C076] transition-colors duration-300">
                {title}
            </h3>
            <p className="mt-[min(1rem,1.5vh)] text-base font-medium text-neutral-500 leading-relaxed max-w-xl group-hover:text-neutral-400 transition-colors duration-300">
                {desc}
            </p>
        </div>
    );
}
