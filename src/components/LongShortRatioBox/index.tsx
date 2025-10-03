"use client";

import { useEffect, useMemo, useState } from "react";

type Period = "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d";
type Source = "global" | "top-trader" | "taker";

type Props = {
  symbol?: string; // ex) "BTCUSDT"
  period?: Period;
  source?: Source;
  pollMs?: number; // 폴링 주기(ms) 기본 60초
};

type RatioRow = {
  symbol: string;
  longShortRatio: string;           // global/top-trader에서 주로 사용
  longAccount?: string;
  shortAccount?: string;
  longShortRatioBuy?: string;       // taker 전용
  longShortRatioSell?: string;      // taker 전용
  timestamp: number;                // ms 타임스탬프(바이낸스는 ms)
};

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isRatioRowArray(x: unknown): x is RatioRow[] {
  return Array.isArray(x) && x.every(r =>
    r &&
    typeof r === "object" &&
    typeof (r as { timestamp?: unknown }).timestamp === "number"
  );
}

export default function LongShortRatioBox({
  symbol = "BTCUSDT",
  period = "5m",
  source = "global",
  pollMs = 60_000,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [longPct, setLongPct] = useState<number | null>(null);
  const [shortPct, setShortPct] = useState<number | null>(null);
  const [ts, setTs] = useState<number | null>(null);

  const endpoint = useMemo<string>(() => {
    switch (source) {
      case "global":
        return "https://fapi.binance.com/futures/data/globalLongShortAccountRatio";
      case "top-trader":
        return "https://fapi.binance.com/futures/data/topLongShortPositionRatio";
      case "taker":
        return "https://fapi.binance.com/futures/data/takerlongshortRatio";
      default:
        return "";
    }
  }, [source]);

  async function fetchRatio(): Promise<void> {
    try {
      setErr(null);
      const url = `${endpoint}?symbol=${symbol}&period=${period}&limit=30`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json: unknown = await res.json();
      if (!isRatioRowArray(json) || json.length === 0) {
        throw new Error("empty");
      }

      const rows = json;
      const latest = rows[rows.length - 1];
      setTs(latest.timestamp);

      if (source === "taker") {
        const buy = Number.parseFloat(latest.longShortRatioBuy ?? "0");
        // buy가 (매수/매도) ratio라고 가정 → long% = buy / (buy + 1) * 100
        const long = Number.isFinite(buy) ? (buy / (buy + 1)) * 100 : NaN;
        const short = 100 - long;
        setLongPct(Number.isFinite(long) ? long : null);
        setShortPct(Number.isFinite(short) ? short : null);
      } else {
        const lsr = Number.parseFloat(latest.longShortRatio);
        if (!Number.isFinite(lsr)) throw new Error("invalid longShortRatio");
        const long = (lsr / (1 + lsr)) * 100;
        const short = 100 - long;
        setLongPct(long);
        setShortPct(short);
      }

      setLoading(false);
    } catch (e: unknown) {
      setErr(toErrorMessage(e));
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void fetchRatio();
    if (pollMs > 0) {
      const t = setInterval(() => { void fetchRatio(); }, pollMs);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, period, source, pollMs]);

  return (
    <div className="min-w-45 w-full h-[120px] border rounded-lg shadow-sm p-3 bg-white">
      <div className="flex items-center justify-between mb-1">
        <div className="font-semibold text-sm">{symbol}</div>
        <div className="text-[11px] text-gray-500">
          {source === "global" && "Global"}
          {source === "top-trader" && "Top Trader"}
          {source === "taker" && "Taker"}
          {" · "}
          {period}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse h-[72px] bg-gray-100 rounded-md" />
      ) : err ? (
        <div className="text-sm text-amber-600">⚠ {err}</div>
      ) : (
        <>
          <div className="mt-1">
            <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: `${Math.max(0, Math.min(100, longPct ?? 0))}%`,
                }}
                title={`Long ${longPct?.toFixed(2)}%`}
              />
            </div>
            <div className="flex justify-between text-[12px] mt-1">
              <span className="text-emerald-600 font-medium">
                Long {longPct?.toFixed(2)}%
              </span>
              <span className="text-red-500 font-medium">
                Short {shortPct?.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="mt-1 text-[11px] text-gray-400">
            {ts ? new Date(ts).toLocaleString() : ""}
          </div>
        </>
      )}
    </div>
  );
}
