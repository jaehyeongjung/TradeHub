import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service | TradeHub",
    description: "TradeHub Terms of Service. Please read before using the Service.",
    alternates: {
        canonical: "https://www.tradehub.kr/en/terms",
        languages: {
            ko: "https://www.tradehub.kr/terms",
            en: "https://www.tradehub.kr/en/terms",
        },
    },
    robots: { index: true, follow: true },
};

const UPDATED = "2025-06-01";

export default function TermsPageEN() {
    return (
        <main className="mx-auto max-w-3xl px-5 py-16 text-white">
            <nav aria-label="breadcrumb" className="mb-8 text-sm text-zinc-500">
                <ol className="flex items-center gap-1">
                    <li><Link href="/en" className="hover:text-zinc-300">Home</Link></li>
                    <li>/</li>
                    <li className="text-zinc-300">Terms of Service</li>
                </ol>
            </nav>

            <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
            <p className="mt-3 text-sm text-zinc-500">Last updated: {UPDATED}</p>

            <div className="mt-10 space-y-10 text-zinc-300 leading-relaxed">

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">1. Purpose</h2>
                    <p>
                        These Terms govern your access to and use of TradeHub ("Service"), including its
                        cryptocurrency simulated trading and market analysis features.
                        By using the Service you agree to these Terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">2. Service Description</h2>
                    <p className="mb-3">TradeHub provides the following services.</p>
                    <ul className="space-y-2 ml-4">
                        {[
                            "Cryptocurrency futures simulated trading (virtual assets only — no real money involved)",
                            "Real-time Binance price feeds and liquidation data",
                            "Market indicators: whale trades, Kimchi Premium, Fear & Greed Index",
                            "Coin market cap rankings and chart analysis tools",
                            "Cryptocurrency investment education guides",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">3. Investment Disclaimer</h2>
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
                        <p className="text-amber-300 text-sm font-semibold">⚠️ Investment Risk Notice</p>
                    </div>
                    <p className="mb-3">
                        TradeHub is an educational and informational service. Nothing on this Service constitutes
                        investment advice. We explicitly state the following.
                    </p>
                    <ul className="space-y-2 ml-4">
                        {[
                            "Simulated trading results do not guarantee real-world investment performance.",
                            "Market data provided is for reference only and should not be the sole basis for investment decisions.",
                            "Cryptocurrency investments carry significant risk, including total loss of principal.",
                            "TradeHub is not liable for any losses arising from data delays, errors, or inaccuracies.",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">4. User Obligations</h2>
                    <ul className="space-y-2 ml-4">
                        {[
                            "You must not use the Service for any unlawful purpose.",
                            "You must not access or use another user's account without authorization.",
                            "You must not interfere with or disrupt the normal operation of the Service.",
                            "You must not use automated tools (bots, scrapers) to make excessive requests.",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">5. Service Changes & Termination</h2>
                    <p>
                        TradeHub may modify or discontinue all or part of the Service at any time.
                        We will provide advance notice where reasonably possible; in urgent cases,
                        notice may be provided after the fact.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">6. Advertising</h2>
                    <p>
                        TradeHub displays advertisements through third-party ad networks including Google AdSense.
                        Advertising content is independent of the Service, and we are not responsible for
                        any loss arising from third-party advertisements.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">7. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of the Republic of Korea.
                        Any disputes shall be subject to the exclusive jurisdiction of the Seoul Central District Court.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">8. Contact</h2>
                    <p>For any questions regarding these Terms, please contact us at:</p>
                    <a
                        href="mailto:whird398@naver.com"
                        className="mt-3 inline-flex items-center gap-2 text-[#02C076] hover:text-[#02A666] transition-colors text-sm font-semibold"
                    >
                        whird398@naver.com
                    </a>
                </section>

            </div>
        </main>
    );
}
