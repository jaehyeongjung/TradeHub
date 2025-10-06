// app/api/kimchi/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// 일부 서버/에지 환경 이슈 회피를 위해 Node 런타임 고정
export const runtime = "nodejs";

type UpbitTicker = Array<{ trade_price: number; timestamp: number }>;
type BinanceTicker = { symbol: string; price: string };
type FxLatest = { rates: { KRW: number } };

type KimchiPayload = {
  symbol: string;
  upbitKrw: number;
  binanceUsdt: number;
  usdkrw: number;
  globalKrw: number;
  premium: number;
  updatedAt: string;
  upstream?: {
    upbit: number;
    binance: number;
    fx: number;
    fxFallback?: number;
  };
};

function n(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

async function getUsdKrw(): Promise<{ value: number; status: number; fallback?: number }> {
  // 1차: exchangerate.host
  const fx = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=KRW", {
    cache: "no-store",
    headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
  });
  if (fx.ok) {
    const j = (await fx.json()) as FxLatest;
    if (n(j?.rates?.KRW)) return { value: j.rates.KRW, status: fx.status };
  }
  // 2차: open.er-api.com
  const fx2 = await fetch("https://open.er-api.com/v6/latest/USD", {
    cache: "no-store",
    headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
  });
  if (fx2.ok) {
    const j2 = (await fx2.json()) as { rates?: { KRW?: number } };
    if (n(j2?.rates?.KRW)) return { value: j2.rates!.KRW!, status: fx.status, fallback: fx2.status };
  }
  throw new Error("Failed to fetch USD/KRW");
}

export async function GET(req: Request) {
  const started = Date.now();
  const url = new URL(req.url);
  const sym = (url.searchParams.get("symbol") || "BTC").toUpperCase();

  // 업비트 KRW-xxx / 바이낸스 xxxUSDT
  const upbitMarket = `KRW-${encodeURIComponent(sym)}`;
  const binanceSymbol = `${encodeURIComponent(sym)}USDT`;

  try {
    const ua = { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" };

    const [upbitRes, binanceRes, fxResult] = await Promise.all([
      fetch(`https://api.upbit.com/v1/ticker?markets=${upbitMarket}`, {
        cache: "no-store",
        headers: { ...ua, Accept: "application/json" },
      }),
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`, {
        cache: "no-store",
        headers: { ...ua, Accept: "application/json" },
      }),
      getUsdKrw(), // 내부에서 2단계 시도
    ]);

    const upstreamStatus = {
      upbit: upbitRes.status,
      binance: binanceRes.status,
      fx: fxResult.status,
      fxFallback: fxResult.fallback,
    };

    if (!upbitRes.ok) {
      const text = await upbitRes.text().catch(() => "");
      console.error("[kimchi] Upbit error", upbitRes.status, text);
      return NextResponse.json(
        { error: true, source: "upbit", status: upbitRes.status, detail: text, upstream: upstreamStatus },
        { status: 502 }
      );
    }
    if (!binanceRes.ok) {
      const text = await binanceRes.text().catch(() => "");
      console.error("[kimchi] Binance error", binanceRes.status, text);
      return NextResponse.json(
        { error: true, source: "binance", status: binanceRes.status, detail: text, upstream: upstreamStatus },
        { status: 502 }
      );
    }

    const upbit = (await upbitRes.json()) as UpbitTicker;
    const binance = (await binanceRes.json()) as BinanceTicker;

    const upbitKrw = upbit?.[0]?.trade_price;
    const binanceUsdt = Number(binance?.price);
    const usdkrw = fxResult.value;

    if (!n(upbitKrw)) {
      console.error("[kimchi] Invalid Upbit payload:", upbit);
      return NextResponse.json(
        { error: true, source: "upbit", status: 500, detail: "Invalid Upbit payload", upstream: upstreamStatus },
        { status: 500 }
      );
    }
    if (!Number.isFinite(binanceUsdt)) {
      console.error("[kimchi] Invalid Binance payload:", binance);
      return NextResponse.json(
        { error: true, source: "binance", status: 500, detail: "Invalid Binance payload", upstream: upstreamStatus },
        { status: 500 }
      );
    }
    if (!n(usdkrw)) {
      console.error("[kimchi] Invalid FX payload");
      return NextResponse.json(
        { error: true, source: "fx", status: 500, detail: "Invalid FX payload", upstream: upstreamStatus },
        { status: 500 }
      );
    }

    const globalKrw = binanceUsdt * usdkrw;
    const premium = (upbitKrw - globalKrw) / globalKrw;

    const body: KimchiPayload = {
      symbol: sym,
      upbitKrw,
      binanceUsdt,
      usdkrw,
      globalKrw,
      premium,
      updatedAt: new Date().toISOString(),
      upstream: upstreamStatus,
    };

    const ms = Date.now() - started;
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "x-duration-ms": String(ms),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "kimchi calc failed";
    console.error("[kimchi] Fatal:", msg);
    return NextResponse.json({ error: true, message: msg }, { status: 500 });
  }
}
