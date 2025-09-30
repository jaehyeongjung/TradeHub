"use client";

import { useEffect, useState } from "react";

interface CoinPriceBoxProps {
  symbol: string; 
}

export const CoinPriceBox = ({ symbol }: CoinPriceBoxProps) => {
  const [price, setPrice] = useState<string>("");

  useEffect(() => {
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrice(parseFloat(data.c).toFixed(2)); // current price
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.close();
  }, [symbol]); // symbol이 바뀌면 새로 연결
  
  return (
    <div className="border rounded-lg p-4 shadow-md text-center">
      <h2 className="text-lg font-bold">{symbol.toUpperCase()}</h2>
      <p className="text-2xl font-mono mt-2">
        {price ? `$${price}` : "Loading..."}
      </p>
    </div>
  );
};
