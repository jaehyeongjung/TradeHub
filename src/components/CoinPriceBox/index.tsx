// CoinPriceBox.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { symbol: string }; // ex) "btcusdt"

export const CoinPriceBox = ({ symbol }: Props) => {
  const [price, setPrice] = useState<number | null>(null);
  const [pct, setPct] = useState<number | null>(null); // 24h % 변화 (부호 포함)

  // 숫자 포맷터
  const usd = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
    []
  );

  useEffect(() => {
    const stream = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}@ticker`);

    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      // data.c: last price, data.P: 24h change percent (string, e.g. "-3.56")
      const last = parseFloat(data.c);
      const changePct = parseFloat(data.P);

      if (!Number.isNaN(last)) setPrice(last);
      if (!Number.isNaN(changePct)) setPct(changePct);
    };

    return () => ws.close();
  }, [symbol]);

  const pctColor =
    pct == null
      ? "text-gray-300"
      : pct > 0
      ? "text-emerald-500"
      : pct < 0
      ? "text-red-500"
      : "text-gray-300";

  const arrow = pct == null ? "" : pct > 0 ? "▲" : pct < 0 ? "▼" : "•";
  const pctText = pct == null ? "" : `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`;

  return (
    <div className="min-w-30 w-full min-h-26 border border-gray-900 bg-neutral-900 rounded-lg shadow-md flex flex-col justify-center items-center p-3">
      <h2 className="text-sm font-bold text-white tracking-wide">{symbol.toUpperCase()}</h2>

      <p className={`mt-1 text-lg font-mono ${pctColor}`}>
        {price != null ? usd.format(price) : ""}
      </p>

      <div className={`mt-0.5 text-xs font-semibold ${pctColor}`}>
        {arrow} {pctText}
      </div>
    </div>
  );
};
