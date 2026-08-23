"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase-browser";
import { useVisibilityPolling } from "@/shared/hooks/useVisibilityPolling";
import type { KimchiResponse } from "@/app/api/kimchi/route";

/* ─────────────────────────── 핫코인 ─────────────────────────── */

export type HotCoin = {
    symbol: string;
    base: string;
    price: number;
    pct: number;
    quoteVolume: number;
};

type Ticker24h = { symbol: string; priceChangePercent: string; quoteVolume: string; lastPrice: string };

const EXCLUDE = /(UP|DOWN|BULL|BEAR|1000)/;

function isCandidate(sym: string) {
    return sym.endsWith("USDT") && !EXCLUDE.test(sym) && sym !== "USDCUSDT" && sym !== "FDUSDUSDT";
}

/**
 * 거래대금과 변동폭을 함께 본 점수. 거래대금만 보면 BTC·ETH가 늘 위에 고정돼
 * "지금 뜨는 코인"이라는 뜻이 사라지고, 변동폭만 보면 거래가 거의 없는
 * 잡코인이 올라온다. 데스크톱 HotSymbolsTicker와 같은 식을 쓴다.
 */
function scoreOf(t: Ticker24h) {
    const vol = Number(t.quoteVolume) || 0;
    const pct = Math.abs(Number(t.priceChangePercent) || 0) / 100;
    if (vol < 3_000_000) return 0;
    return Math.sqrt(vol) * Math.pow(pct, 2) * 1_000_000;
}

export function useHotCoins(limit = 15) {
    const [coins, setCoins] = useState<HotCoin[]>([]);

    const load = useCallback(async () => {
        try {
            const res = await fetch("https://api.binance.com/api/v3/ticker/24hr", { cache: "no-store" });
            if (!res.ok) return;
            const all = (await res.json()) as Ticker24h[];
            setCoins(
                all
                    .filter((t) => isCandidate(t.symbol))
                    .sort((a, b) => scoreOf(b) - scoreOf(a))
                    .slice(0, limit)
                    .map((t) => ({
                        symbol: t.symbol,
                        base: t.symbol.replace(/USDT$/, ""),
                        price: Number(t.lastPrice) || 0,
                        pct: Number(t.priceChangePercent) || 0,
                        quoteVolume: Number(t.quoteVolume) || 0,
                    })),
            );
        } catch {
            // 다음 폴링에서 다시 시도한다.
        }
    }, [limit]);

    useVisibilityPolling({ interval: 30_000, onPoll: load });

    return coins;
}

/* ─────────────────────────── 김치프리미엄 ─────────────────────────── */

export function useKimchi(symbol = "BTC", pollMs = 10_000) {
    const [data, setData] = useState<KimchiResponse | null>(null);

    const load = useCallback(async () => {
        try {
            const r = await fetch(`/api/kimchi?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" });
            if (!r.ok) return;
            const j = (await r.json()) as KimchiResponse;
            if (typeof j.symbol === "string") setData(j);
        } catch {
            // 직전 값을 그대로 둔다 — 깜빡이는 것보다 낫다.
        }
    }, [symbol]);

    useVisibilityPolling({ interval: pollMs, onPoll: load });

    return data;
}

/* ─────────────────────────── 공포탐욕지수 ─────────────────────────── */

export function useFearGreed() {
    const [state, setState] = useState<{ value: number | null; label: string | null }>({
        value: null,
        label: null,
    });

    useEffect(() => {
        let cancelled = false;
        fetch("/api/fear-greed")
            .then((r) => r.json())
            .then((d: { value: number; label: string }) => {
                if (!cancelled) setState({ value: d.value, label: d.label });
            })
            .catch(() => {
                if (!cancelled) setState({ value: 50, label: "Neutral" });
            });
        return () => { cancelled = true; };
    }, []);

    return state;
}

/* ─────────────────────────── 코인 뉴스 ─────────────────────────── */

export type NewsItem = {
    id: string;
    source: string;
    title: string;
    url: string;
    symbols: string[] | null;
    published_at: string;
};

export function useCryptoNews(limit = 20) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data, error } = await supabase
                .from("news_items")
                .select("id,source,title,url,symbols,published_at")
                .order("published_at", { ascending: false })
                .limit(limit);
            if (cancelled) return;
            if (!error && data) setNews(data as NewsItem[]);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [limit]);

    return { news, loading };
}
