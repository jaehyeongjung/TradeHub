"use client";

import { useFearGreed, useKimchi } from "@/shared/hooks/useMarketData";
import { Skeleton } from "./MobileSection";
import { useMobileCopy, type MobileCopy } from "./copy";

/* ─────────────────────────── 공포탐욕지수 ─────────────────────────── */

const ARC_LENGTH = Math.PI * 44; // r=44 반원 호의 길이

function fearGreedTone(v: number, t: MobileCopy) {
    if (v < 25) return { color: "var(--color-down)", label: t.fgExtremeFear };
    if (v < 45) return { color: "#F59E0B", label: t.fgFear };
    if (v < 55) return { color: "var(--text-tertiary)", label: t.fgNeutral };
    if (v < 75) return { color: "var(--color-up)", label: t.fgGreed };
    return { color: "var(--color-up)", label: t.fgExtremeGreed };
}

function FearGreedCard() {
    const { value } = useFearGreed();
    const { t } = useMobileCopy();
    const v = value ?? 0;
    const tone = fearGreedTone(v, t);

    return (
        <div className="rounded-card border border-border-subtle bg-surface-card p-4">
            <h3 className="text-label font-bold text-text-tertiary">{t.fearGreed}</h3>

            {value == null ? (
                <div className="mt-3 flex flex-col items-center gap-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-4 w-16" />
                </div>
            ) : (
                <div className="mt-2 flex flex-col items-center">
                    <svg viewBox="0 0 112 60" className="w-full max-w-[140px]" role="img" aria-label={t.fearGreedAria(v, tone.label)}>
                        <path
                            d="M 12 52 A 44 44 0 0 1 100 52"
                            fill="none"
                            stroke="var(--surface-input)"
                            strokeWidth={9}
                            strokeLinecap="round"
                        />
                        <path
                            d="M 12 52 A 44 44 0 0 1 100 52"
                            fill="none"
                            stroke={tone.color}
                            strokeWidth={9}
                            strokeLinecap="round"
                            strokeDasharray={ARC_LENGTH}
                            strokeDashoffset={ARC_LENGTH * (1 - v / 100)}
                            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                        />
                        <text
                            x="56" y="50"
                            textAnchor="middle"
                            className="font-mono"
                            style={{ fill: "var(--text-primary)", fontSize: 24, fontWeight: 800 }}
                        >
                            {v}
                        </text>
                    </svg>
                    <p className="text-footnote font-bold" style={{ color: tone.color }}>
                        {tone.label}
                    </p>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────── 김치프리미엄 ─────────────────────────── */

function fmtKrw(n: number) {
    return `₩${Math.round(n).toLocaleString("ko-KR")}`;
}

function KimchiCard() {
    const data = useKimchi("BTC");
    const { t } = useMobileCopy();
    const premium = data?.premium ?? null;
    const up = (premium ?? 0) >= 0;

    return (
        <div className="rounded-card border border-border-subtle bg-surface-card p-4">
            <h3 className="text-label font-bold text-text-tertiary">{t.kimchi}</h3>

            {premium == null ? (
                <div className="mt-3 space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
            ) : (
                <>
                    <p
                        className={`mt-2 font-mono text-title2 font-black leading-none ${
                            up ? "text-[var(--color-up-text)]" : "text-[var(--color-down-text)]"
                        }`}
                    >
                        {up ? "+" : ""}{premium.toFixed(2)}%
                    </p>

                    <dl className="mt-3 space-y-1 text-caption">
                        <div className="flex justify-between gap-2">
                            <dt className="text-text-muted">{t.upbit}</dt>
                            <dd className="font-mono text-text-secondary">
                                {data?.upbitKrw != null ? fmtKrw(data.upbitKrw) : "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-text-muted">{t.global}</dt>
                            <dd className="font-mono text-text-secondary">
                                {data?.globalKrw != null ? fmtKrw(data.globalKrw) : "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-text-muted">{t.fx}</dt>
                            <dd className="font-mono text-text-secondary">
                                {data?.usdkrw != null ? `₩${data.usdkrw.toFixed(1)}` : "—"}
                            </dd>
                        </div>
                    </dl>
                </>
            )}
        </div>
    );
}

/** 지표 두 장은 나란히 둔다 — 둘 다 "지금 시장 온도"라서 같이 읽어야 뜻이 산다. */
export function MobileGauges() {
    const { t } = useMobileCopy();
    return (
        <section className="grid grid-cols-2 gap-3 px-4" aria-label={t.marketGauges}>
            <FearGreedCard />
            <KimchiCard />
        </section>
    );
}
