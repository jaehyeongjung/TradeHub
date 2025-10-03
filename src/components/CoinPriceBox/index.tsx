"use client";

import { useEffect, useState } from "react";

export const CoinPriceBox = ({ symbol }: { symbol: string }) => {
  const [price, setPrice] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol}@ticker`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrice(parseFloat(data.c).toFixed(2));
    };

    return () => ws.close();
  }, [symbol]);

  return (
    <div className="min-w-30 w-full min-h-26 border-gray-900 bg-neutral-900 border rounded-lg shadow-md flex flex-col justify-center items-center">
      <h2 className="text-sm font-bold text-white">{symbol.toUpperCase()}</h2>
      <p className="text-lg font-mono text-green-600">
        {price ? `$${price}` : ""}
      </p>
    </div>
  );
};
