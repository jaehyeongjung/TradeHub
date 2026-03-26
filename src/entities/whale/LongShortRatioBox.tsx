"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { AnimatePresence, motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { treemapOpenAtom } from "@/shared/store/atoms";

type Period = "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d";
type Source = "global" | "top-trader" | "taker";

type Props = {
  symbol?: string;
  period?: Period;
  source?: Source;
  pollMs?: number;
};

type RatioRow = {
  symbol: string;
  longShortRatio: string;
  longAccount?: string;
  shortAccount?: string;
  longShortRatioBuy?: string;
  longShortRatioSell?: string;
  timestamp: number;
};

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

function isRatioRowArray(x: unknown): x is RatioRow[] {
  return Array.isArray(x) &&
    x.every((r) => r && typeof r === "object" && typeof (r as { timestamp?: unknown }).timestamp === "number");
}

function formatRelativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "방금 업데이트";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전 업데이트`;
  return `${Math.floor(m / 60)}시간 전 업데이트`;
}

const SOURCE_LABEL: Record<Source, string> = {
  global: "Global",
  "top-trader": "Top Trader",
  taker: "Taker",
};

const DESCRIPTION_MAP: Record<Source, string> = {
  global: "바이낸스 모든 계정의 롱/숏 비율\n시장 전체의 포지션 성향을 파악할 때 사용합니다.",
  "top-trader": "바이낸스 상위 10% 트레이더 롱/숏 비율\n숙련된 트레이더들의 방향성을 참고합니다.",
  taker: "테이커(시장가) 매수/매도 비율\n즉각적인 공격적 주문 흐름을 반영합니다.",
};

export default function LongShortRatioBox({
  symbol = "BTCUSDT",
  period = "5m",
  source = "global",
  pollMs = 60_000,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [longPct, setLongPct] = useState<number | null>(null);
  const [shortPct, setShortPct] = useState<number | null>(null);
  const [ts, setTs] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isLight = useTheme();
  const isTreemapOpen = useAtomValue(treemapOpenAtom);

  const endpoint = useMemo(() => {
    switch (source) {
      case "global": return "https://fapi.binance.com/futures/data/globalLongShortAccountRatio";
      case "top-trader": return "https://fapi.binance.com/futures/data/topLongShortPositionRatio";
      case "taker": return "https://fapi.binance.com/futures/data/takerlongshortRatio";
      default: return "";
    }
  }, [source]);

  async function fetchRatio() {
    try {
      setErr(null);
      const url = `${endpoint}?symbol=${symbol}&period=${period}&limit=30`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: unknown = await res.json();
      if (!isRatioRowArray(json) || json.length === 0) throw new Error("empty");
      const latest = json[json.length - 1];
      setTs(latest.timestamp);
      if (source === "taker") {
        const buy = Number.parseFloat(latest.longShortRatioBuy ?? "0");
        const long = Number.isFinite(buy) ? (buy / (buy + 1)) * 100 : NaN;
        setLongPct(Number.isFinite(long) ? long : null);
        setShortPct(Number.isFinite(long) ? 100 - long : null);
      } else {
        const lsr = Number.parseFloat(latest.longShortRatio);
        if (!Number.isFinite(lsr)) throw new Error("invalid longShortRatio");
        const long = (lsr / (1 + lsr)) * 100;
        setLongPct(long);
        setShortPct(100 - long);
      }
      setLoading(false);
    } catch (e) {
      setErr(toErrorMessage(e));
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isTreemapOpen) return;
    setLoading(true);
    void fetchRatio();
    if (pollMs > 0) {
      const t = setInterval(() => { void fetchRatio(); }, pollMs);
      return () => clearInterval(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, period, source, pollMs, isTreemapOpen]);

  const isLongDominant = longPct !== null && longPct >= 50;
  const accentBg = longPct === null ? (isLight ? "bg-neutral-300" : "bg-neutral-600")
    : isLongDominant ? "bg-emerald-500" : "bg-red-500";

  const cardBg = isLight ? "bg-white border-neutral-200" : "bg-surface-elevated border-border-subtle";
  const labelColor = isLight ? "text-neutral-400" : "text-text-muted";
  const pillBg = isLight ? "bg-neutral-100 text-neutral-500" : "bg-surface-input text-text-tertiary";
  const tooltipBg = isLight
    ? "bg-white border-neutral-200 text-neutral-600 shadow-lg"
    : "bg-surface-elevated border-border-default text-text-secondary shadow-xl";
  const arrowBorder = isLight ? "border-b-neutral-200" : "border-b-border-default";
  const arrowFill = isLight ? "border-b-white" : "border-b-surface-elevated";

  return (
    <div
      className={`relative flex-1 min-w-0 min-h-30 2xl:min-h-45 rounded-2xl border overflow-hidden cursor-default ${cardBg}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 방향 accent 바 */}
      <div className={`absolute left-0 inset-y-0 w-[3px] transition-colors duration-500 ${accentBg}`} />

      <div className="pl-5 pr-4 pt-4 pb-4 2xl:pl-6 2xl:pr-5 2xl:pt-5 2xl:pb-5 h-full flex flex-col justify-between">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[11px] 2xl:text-xs font-medium ${labelColor}`}>롱/숏 비율</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] 2xl:text-[10px] font-medium px-2 py-0.5 rounded-full ${pillBg}`}>
              {SOURCE_LABEL[source]}
            </span>
            <span className={`text-[9px] 2xl:text-[10px] font-medium px-1.5 py-0.5 rounded-full ${pillBg}`}>
              {period}
            </span>
          </div>
        </div>

        {loading ? (
          <div className={`flex-1 rounded-xl animate-pulse ${isLight ? "bg-neutral-100" : "bg-surface-input"}`} />
        ) : err ? (
          <div className="text-xs text-amber-500 flex-1 flex items-center">데이터 없음</div>
        ) : (
          <>
            {/* 히어로 숫자 */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className={`text-[9px] 2xl:text-[10px] font-medium mb-0.5 ${labelColor}`}>Long</div>
                <div className="text-2xl 2xl:text-3xl font-bold tabular-nums leading-none text-emerald-400">
                  {longPct?.toFixed(1)}%
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[9px] 2xl:text-[10px] font-medium mb-0.5 ${labelColor}`}>Short</div>
                <div className="text-2xl 2xl:text-3xl font-bold tabular-nums leading-none text-red-400">
                  {shortPct?.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 분할 바 */}
            <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? "bg-red-100" : "bg-red-500/20"}`}>
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, longPct ?? 0))}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* 타임스탬프 */}
            {ts && (
              <div className={`mt-2 text-[9px] 2xl:text-[10px] ${labelColor}`}>
                {formatRelativeTime(ts)}
              </div>
            )}
          </>
        )}
      </div>

      {/* 툴팁 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className={`absolute left-1/2 -translate-x-1/2 top-[calc(100%+16px)] w-[230px] text-[11px] rounded-xl py-3.5 px-4 z-50 pointer-events-none border ${tooltipBg}`}
          >
            <div className="font-semibold text-amber-500 mb-1.5">지표 설명</div>
            <p className="leading-relaxed whitespace-pre-line text-[10px]">
              {DESCRIPTION_MAP[source]}
            </p>
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[9px] w-0 h-0 border-l-[5px] border-r-[5px] border-b-[9px] border-transparent ${arrowBorder}`} />
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px] w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-transparent ${arrowFill}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
