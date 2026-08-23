"use client";

import { useState } from "react";
import { useCryptoNews } from "@/shared/hooks/useMarketData";
import { MobileSection, Skeleton } from "@/widgets/mobile/MobileSection";
import { useMobileCopy, type MobileCopy } from "@/widgets/mobile/copy";

const COLLAPSED_COUNT = 6;

function relativeTime(iso: string, t: MobileCopy): string {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return t.justNow;
    const m = Math.floor(s / 60);
    if (m < 60) return t.minsAgo(m);
    const h = Math.floor(m / 60);
    if (h < 24) return t.hoursAgo(h);
    return t.daysAgo(Math.floor(h / 24));
}

/**
 * 모바일 최상단 본문. 데스크톱은 패널 안에서 스크롤시키지만
 * 모바일은 페이지 스크롤에 그대로 얹고 접기/펼치기로 길이를 조절한다.
 * 중첩 스크롤 영역은 손가락으로 잡기 어렵다.
 */
export function MobileNews() {
    const { news, loading } = useCryptoNews(20);
    const { t } = useMobileCopy();
    const [expanded, setExpanded] = useState(false);

    const shown = expanded ? news : news.slice(0, COLLAPSED_COUNT);
    const hasMore = news.length > COLLAPSED_COUNT;

    return (
        <MobileSection title={t.news}>
            {loading ? (
                <div className="space-y-3 p-4">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    ))}
                </div>
            ) : news.length === 0 ? (
                <p className="px-4 py-8 text-center text-footnote text-text-muted">
                    {t.newsEmpty}
                </p>
            ) : (
                <>
                    <ul>
                        {shown.map((n, i) => (
                            <li key={n.id}>
                                <a
                                    href={n.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block px-4 py-3.5 transition-colors active:bg-surface-hover ${
                                        i > 0 ? "border-t border-border-subtle" : ""
                                    }`}
                                >
                                    <p className="text-body font-medium leading-snug text-text-primary">
                                        {n.title}
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-1.5 text-caption text-text-muted">
                                        <span className="font-medium">{n.source}</span>
                                        <span aria-hidden="true">·</span>
                                        <span>{relativeTime(n.published_at, t)}</span>
                                        {n.symbols?.slice(0, 2).map((s) => (
                                            <span
                                                key={s}
                                                className="rounded-[5px] bg-surface-input px-1.5 py-0.5 font-bold text-text-tertiary"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>

                    {hasMore && (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="w-full border-t border-border-subtle py-3.5 text-label font-bold text-text-secondary transition-colors active:bg-surface-hover"
                        >
                            {expanded ? t.newsCollapse : t.newsMore(news.length - COLLAPSED_COUNT)}
                        </button>
                    )}
                </>
            )}
        </MobileSection>
    );
}
