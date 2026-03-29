import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const preferredRegion = "hnd1";

const FX_SPREAD = Number(process.env.FX_SPREAD ?? "0");
const USDT_USD  = Number(process.env.USDT_USD  ?? "1.0");

type UpbitTicker = Array<{ trade_price: number; timestamp: number }>;
type UpbitOrderbook = Array<{
  orderbook_units: Array<{ ask_price: number; bid_price: number }>;
  timestamp: number;
}>;
type BinanceTicker = { symbol?: string; price?: string };

export type KimchiResponse = {
  symbol: string;
  upbitKrw: number | null;
  upbitPriceSource?: "orderbook_mid" | "trade_price";
  binanceUsdt: number | null;
  usdkrw: number | null;
  globalKrw: number | null;
  premium: number | null;
  updatedAt: string;
  degraded: boolean;
  cached?: boolean;
  upstream?: {
    fxAdj?: number;
    usdtUsd?: number;
  };
};

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function withTimeout(url: string, ms = 3500, init?: RequestInit) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

async function fetchUsdKrw(): Promise<number | null> {
  try {
    const r = await withTimeout("https://api.frankfurter.app/latest?from=USD&to=KRW", 3000, {
      headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
      cache: "no-store",
    });
    if (r.ok) {
      const j = await r.json() as { rates?: { KRW?: number } };
      const krw = j?.rates?.KRW;
      if (isNum(krw)) return krw;
    }
  } catch {}

  const urls = [
    "https://api.exchangerate-api.com/v4/latest/USD",
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
  ];

  for (const url of urls) {
    try {
      const r = await withTimeout(url, 3500, {
        headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
        cache: "no-store",
      });
      if (!r.ok) continue;
      const j = await r.json();

      if (j?.rates?.KRW && isNum(j.rates.KRW)) {
        return j.rates.KRW;
      }

      if (j?.usd?.krw && isNum(j.usd.krw)) {
        return j.usd.krw;
      }
    } catch {}
  }
  return null;
}

async function fetchBinancePrice(symbol: string): Promise<number | null> {
  const hosts = [
    "api.binance.com",
    "api1.binance.com",
    "api2.binance.com",
    "data-api.binance.vision",
  ];
  for (const h of hosts) {
    try {
      const r = await withTimeout(`https://${h}/api/v3/ticker/price?symbol=${symbol}`, 3500, {
        headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
        cache: "no-store",
      });
      if (!r.ok) continue;
      const j = (await r.json()) as BinanceTicker;
      const p = Number(j?.price);
      if (isNum(p)) return p;
    } catch {}
  }
  return null;
}

type UpbitPriceResult = { price: number; source: "orderbook_mid" | "trade_price" } | null;

async function fetchUpbitPrice(market: string): Promise<UpbitPriceResult> {
  try {
    const r = await withTimeout(`https://api.upbit.com/v1/orderbook?markets=${market}`, 1500, {
      headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
      cache: "no-store",
    });
    if (r.ok) {
      const j = (await r.json()) as UpbitOrderbook;
      const u0 = j?.[0]?.orderbook_units?.[0];
      if (u0) {
        const mid = (u0.ask_price + u0.bid_price) / 2;
        if (isNum(mid)) return { price: mid, source: "orderbook_mid" };
      }
    }
  } catch {}

  try {
    const r2 = await withTimeout(`https://api.upbit.com/v1/ticker?markets=${market}`, 1500, {
      headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
      cache: "no-store",
    });
    if (r2.ok) {
      const j2 = (await r2.json()) as UpbitTicker;
      const p = j2?.[0]?.trade_price;
      if (isNum(p)) return { price: p, source: "trade_price" };
    }
  } catch {}

  return null;
}

let lastGood: KimchiResponse | null = null;
let lastUpdated = 0;
const SNAPSHOT_TTL_MS = 60_000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sym = (url.searchParams.get("symbol") || "BTC").toUpperCase();
  const upbitMarket = `KRW-${sym}`;
  const binanceSymbol = `${sym}USDT`;

  try {
    const [usdkrw, binanceUsdt, upbit] = await Promise.all([
      fetchUsdKrw(),
      fetchBinancePrice(binanceSymbol),
      fetchUpbitPrice(upbitMarket),
    ]);

    if (usdkrw === null || binanceUsdt === null || upbit === null) {
      if (lastGood && Date.now() - lastUpdated < SNAPSHOT_TTL_MS) {
        return NextResponse.json({ ...lastGood, degraded: true, cached: true }, {
          headers: { "Cache-Control": "no-store, must-revalidate" },
        });
      }
      const partial: KimchiResponse = {
        symbol: sym,
        upbitKrw: upbit?.price ?? null,
        upbitPriceSource: upbit?.source ?? undefined,
        binanceUsdt: binanceUsdt ?? null,
        usdkrw: usdkrw ?? null,
        globalKrw: null,
        premium: null,
        degraded: true,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json(partial, {
        headers: { "Cache-Control": "no-store, must-revalidate" },
      });
    }

    const usdkrwEffective = usdkrw * (1 + FX_SPREAD);
    const globalKrw = binanceUsdt * USDT_USD * usdkrwEffective;
    const premium = (upbit.price - globalKrw) / globalKrw;

    const body: KimchiResponse = {
      symbol: sym,
      upbitKrw: upbit.price,
      upbitPriceSource: upbit.source,
      binanceUsdt,
      usdkrw,
      globalKrw,
      premium,
      degraded: false,
      updatedAt: new Date().toISOString(),
      upstream: { fxAdj: 1 + FX_SPREAD, usdtUsd: USDT_USD },
    };

    lastGood = body;
    lastUpdated = Date.now();

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch {
    if (lastGood) {
      return NextResponse.json({ ...lastGood, degraded: true, cached: true }, {
        headers: { "Cache-Control": "no-store, must-revalidate" },
      });
    }
    const empty: KimchiResponse = {
      symbol: sym,
      upbitKrw: null,
      binanceUsdt: null,
      usdkrw: null,
      globalKrw: null,
      premium: null,
      degraded: true,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(empty, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  }
}
