import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy | TradeHub",
    description: "TradeHub's privacy policy covering data collection, usage, third-party services, and your rights as a user.",
    alternates: {
        canonical: "https://www.tradehub.kr/en/privacy",
        languages: {
            ko: "https://www.tradehub.kr/privacy",
            en: "https://www.tradehub.kr/en/privacy",
        },
    },
    robots: { index: true, follow: true },
};

const UPDATED = "2025-06-01";

export default function PrivacyPageEN() {
    return (
        <main className="mx-auto max-w-3xl px-5 py-16 text-white">
            <nav aria-label="breadcrumb" className="mb-8 text-sm text-zinc-500">
                <ol className="flex items-center gap-1">
                    <li><Link href="/en" className="hover:text-zinc-300">Home</Link></li>
                    <li>/</li>
                    <li className="text-zinc-300">Privacy Policy</li>
                </ol>
            </nav>

            <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="mt-3 text-sm text-zinc-500">Last updated: {UPDATED}</p>

            <div className="mt-10 space-y-10 text-zinc-300 leading-relaxed">

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">1. Overview</h2>
                    <p>
                        TradeHub (&ldquo;Service&rdquo;) values your privacy and complies with applicable data protection laws.
                        This policy explains what information we collect, how we use it, how long we retain it,
                        and when we share it with third parties.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">2. Information We Collect</h2>
                    <p className="mb-3">TradeHub may collect or process the following information to operate the Service.</p>
                    <ul className="space-y-2 ml-4">
                        {[
                            "Email address (only if you choose to sign in via social login)",
                            "Sim trading history, theme preferences, and other settings stored in your browser's local storage (never sent to our servers)",
                            "Anonymized usage statistics — pages visited, session duration, device type — collected via Google Analytics",
                            "Ad impression and click data collected by Google AdSense cookies",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">3. How We Use Your Information</h2>
                    <ul className="space-y-2 ml-4">
                        {[
                            "To identify users and provide the Service",
                            "To analyze usage and improve Service quality",
                            "To display relevant advertisements (Google AdSense)",
                            "To detect and prevent fraudulent or unauthorized use",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">4. Third-Party Services</h2>
                    <p className="mb-4">TradeHub uses the following third-party services. Each service&apos;s own privacy policy applies.</p>
                    <div className="space-y-4">
                        {[
                            {
                                name: "Google Analytics",
                                desc: "Used for anonymized usage analytics. Google's privacy policy governs data collected through this service.",
                            },
                            {
                                name: "Google AdSense",
                                desc: "Used to serve advertisements via cookies. You can opt out of interest-based ads through Google's Ad Settings.",
                            },
                            {
                                name: "Supabase",
                                desc: "Stores authentication data (email address) for registered users. Supabase's security and privacy policies apply.",
                            },
                            {
                                name: "Binance API",
                                desc: "Used solely to fetch real-time market data. No personally identifiable information is transmitted.",
                            },
                        ].map((svc) => (
                            <div key={svc.name} className="rounded-xl bg-zinc-900/60 p-4 ring-1 ring-zinc-800">
                                <h3 className="text-sm font-semibold text-white mb-1">{svc.name}</h3>
                                <p className="text-sm text-zinc-400">{svc.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">5. Cookies</h2>
                    <p>
                        TradeHub uses cookies to deliver service features and advertisements.
                        You may disable cookies in your browser settings, but some functionality may be limited as a result.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">6. Data Retention</h2>
                    <p>
                        Account information is deleted immediately upon account termination, unless retention is required by applicable law.
                        Data stored in your browser&apos;s local storage can be cleared by you at any time through your browser settings.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">7. Your Rights</h2>
                    <p className="mb-3">You have the following rights regarding your personal data.</p>
                    <ul className="space-y-2 ml-4">
                        {[
                            "Request access to, correction of, or deletion of your personal data",
                            "Request that we restrict processing of your personal data",
                            "Opt out of Google personalized advertising",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">8. Contact</h2>
                    <p>For any privacy-related inquiries, please reach out at:</p>
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
