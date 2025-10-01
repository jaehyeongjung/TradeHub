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
    <div className="w-[120px] h-[80px] border rounded-lg shadow-md flex flex-col justify-center items-center">
      <h2 className="text-sm font-bold">{symbol.toUpperCase()}</h2>
      <p className="text-lg font-mono">
        {price ? `$${price}` : ""}
      </p>
    </div>
  );
};
