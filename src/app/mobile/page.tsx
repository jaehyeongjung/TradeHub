"use client";

import { useEffect, useState } from "react";

export default function MobilePage() {
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            setIsLight(document.documentElement.classList.contains("light"));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            title: "실시간 차트",
            desc: "비트코인 실시간 가격과 차트를 한눈에",
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            title: "실시간 포지션",
            desc: "트레이더들의 롱/숏 비율 실시간 확인",
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            title: "실시간 채팅",
            desc: "다른 트레이더들과 실시간 소통",
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            ),
            title: "코인 뉴스",
            desc: "최신 암호화폐 뉴스를 빠르게",
        },
    ];

    return (
        <div className={`min-h-screen flex flex-col ${isLight ? "bg-neutral-50" : "bg-neutral-950"}`}>
            {/* Header */}
            <header className={`px-6 py-4 border-b ${isLight ? "border-neutral-200" : "border-neutral-800"}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? "bg-emerald-500" : "bg-emerald-600"}`}>
                        <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <span className={`font-semibold ${isLight ? "text-neutral-900" : "text-white"}`}>TradeHub</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Icon */}
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${isLight ? "bg-neutral-200" : "bg-neutral-800"}`}>
                    <svg className={`w-10 h-10 ${isLight ? "text-neutral-500" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                {/* Title */}
                <h1 className={`text-2xl font-bold mb-3 text-center ${isLight ? "text-neutral-900" : "text-white"}`}>
                    PC에서 접속해주세요
                </h1>
                <p className={`text-center mb-8 ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                    TradeHub는 PC 환경에 최적화된 서비스입니다.<br />
                    더 나은 트레이딩 경험을 위해<br />
                    PC 브라우저로 접속해주세요.
                </p>

                {/* URL Copy */}
                <div className={`w-full max-w-sm rounded-xl p-4 mb-10 ${isLight ? "bg-neutral-100" : "bg-neutral-900"}`}>
                    <p className={`text-xs mb-2 ${isLight ? "text-neutral-500" : "text-neutral-500"}`}>접속 주소</p>
                    <div className="flex items-center justify-between">
                        <span className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>www.tradehub.kr</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText("https://www.tradehub.kr");
                                alert("주소가 복사되었습니다!");
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                isLight
                                    ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                            }`}
                        >
                            복사
                        </button>
                    </div>
                </div>

                {/* Features */}
                <div className="w-full max-w-sm">
                    <h2 className={`text-sm font-semibold mb-4 ${isLight ? "text-neutral-500" : "text-neutral-500"}`}>
                        주요 기능
                    </h2>
                    <div className="space-y-3">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-4 p-4 rounded-xl ${isLight ? "bg-neutral-100" : "bg-neutral-900"}`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isLight ? "bg-emerald-100 text-emerald-600" : "bg-emerald-900/30 text-emerald-400"
                                }`}>
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className={`font-medium ${isLight ? "text-neutral-900" : "text-white"}`}>
                                        {feature.title}
                                    </h3>
                                    <p className={`text-sm ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className={`px-6 py-6 text-center ${isLight ? "text-neutral-400" : "text-neutral-600"}`}>
                <p className="text-xs">© 2025 TradeHub. All rights reserved.</p>
            </footer>
        </div>
    );
}
