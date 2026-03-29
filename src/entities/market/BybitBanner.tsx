"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";

export function BybitBanner({ fadeDelay = 0 }: { fadeDelay?: number }) {
    const [mounted, setMounted] = useState(false);
    const isLight = useTheme();

    useEffect(() => { setMounted(true); }, []);

    return (
        <a
            href="https://www.bybit.com/invite?ref=ADYNPO"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`block rounded-2xl border overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                isLight
                    ? "border-neutral-200 hover:border-neutral-300"
                    : "border-border-subtle hover:border-[#f7a600]/40"
            }`}
            style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${fadeDelay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${fadeDelay}ms, box-shadow 0.2s ease, border-color 0.2s ease`,
            }}
        >
            <div
                className="relative flex items-center gap-3 px-4 py-3"
                style={{
                    background: isLight
                        ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                        : "linear-gradient(135deg, #1a1600 0%, #1f1a00 60%, #231e02 100%)",
                }}
            >
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse at 80% 50%, #f7a600 0%, transparent 70%)",
                    }}
                />

                <div className="relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f7a600" }}>
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                        <path d="M4 8h14l-4 5H4V8z" fill="white" />
                        <path d="M4 14h12l4 5H4v-5z" fill="white" opacity="0.7" />
                        <path d="M4 20h10l4 5H4v-5z" fill="white" opacity="0.4" />
                        <path d="M20 8l8 4-8 4V8z" fill="white" />
                    </svg>
                </div>

                <div className="relative flex-1 min-w-0">
                    <div className={`text-xs font-semibold leading-tight ${isLight ? "text-amber-900" : "text-[#f7a600]"}`}>
                        Bybit 파트너 혜택
                    </div>
                    <div className={`text-[11px] mt-0.5 leading-tight ${isLight ? "text-amber-700" : "text-amber-400/80"}`}>
                        수수료 최대 20% 할인
                    </div>
                </div>

                <div className={`relative shrink-0 ${isLight ? "text-amber-600" : "text-[#f7a600]/70"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>

            <div className={`px-4 py-1 text-center text-[10px] ${isLight ? "bg-amber-50 text-amber-400" : "bg-[#0f0d00] text-amber-900/60"}`}>
                AD · 레퍼럴 링크
            </div>
        </a>
    );
}
