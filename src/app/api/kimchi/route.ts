// app/api/kimchi/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
// Vercel 함수 선호 리전 (서울/도쿄/싱가폴)
export const preferredRegion = ["icn1", "hnd1", "sin1"];

type UpbitTicker = Array<{ trade_price: number; timestamp: number }>;
type BinanceTicker = { symbol?: string; price?: string };
type FxLatest = { rates?: { KRW?: number } };

type KimchiPayload = {
  symbol: string;
  upbitKrw: number;
  binanceUsdt: number;
  usdkrw: number;
  globalKrw: number;
  premium: number;
  updatedAt: string;
  upstream?: { upbit?: number; binance?: number; fx?: number; fxHost?: string };
};

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function withTimeout(url: string, ms = 3500, init?: RequestInit) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

async function fetchUsdKrw(): Promise<{ value: number; status: number }> {
  // 1차
  const r1 = await withTimeout(
    "https://api.exchangerate.host/latest?base=USD&symbols=KRW",
    3500,
    { headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" }, cache: "no-store" }
  );
  if (r1.ok) {
    const j = (await r1.json()) as FxLatest;
    if (isNum(j?.rates?.KRW)) return { value: j.rates!.KRW!, status: r1.status };
  }
  // 2차
  const r2 = await withTimeout("https://open.er-api.com/v6/latest/USD", 3500, {
    headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
    cache: "no-store",
  });
  if (r2.ok) {
    const j2 = (await r2.json()) as { rates?: { KRW?: number } };
    if (isNum(j2?.rates?.KRW)) return { value: j2.rates!.KRW!, status: r2.status };
  }
  throw new Error("FX fetch failed");
}

async function fetchBinancePrice(symbol: string): Promise<{ price: number; status: number; host: string }> {
  const hosts = [
    process.env.BINANCE_HOST?.trim(),
    "api.binance.com",
    "api1.binance.com",
    "api2.binance.com",
    "api3.binance.com",
    "data-api.binance.vision", // 마지막 백업
  ].filter(Boolean) as string[];

  const path = (host: string) => `https://${host}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`;
  const headers = { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)", Accept: "application/json" as const };

  let lastStatus = 0;
  for (const host of hosts) {
    try {
      const r = await withTimeout(path(host), 3500, { headers, cache: "no-store" });
      lastStatus = r.status;
      if (!r.ok) continue;
      const j = (await r.json()) as BinanceTicker;
      const p = Number(j?.price);
      if (Number.isFinite(p)) return { price: p, status: r.status, host };
    } catch {
      // 다음 호스트로 폴백
    }
  }
  throw new Error(`Binance fetch failed (lastStatus=${lastStatus})`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sym = (url.searchParams.get("symbol") || "BTC").toUpperCase();
  const upbitMarket = `KRW-${sym}`;
  const binanceSymbol = `${sym}USDT`;

  try {
    const ua = { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)", Accept: "application/json" };

    const [upbitRes, fx] = await Promise.all([
      withTimeout(`https://api.upbit.com/v1/ticker?markets=${encodeURIComponent(upbitMarket)}`, 3500, {
        headers: ua, cache: "no-store",
      }),
      fetchUsdKrw(),
    ]);

    const upstream: KimchiPayload["upstream"] = { upbit: upbitRes.status, fx: fx.status };

    if (!upbitRes.ok) {
      const txt = await upbitRes.text().catch(() => "");
      return NextResponse.json({ error: true, source: "upbit", status: upbitRes.status, detail: txt, upstream }, { status: 502 });
    }

    const upbit = (await upbitRes.json()) as UpbitTicker;
    const upbitKrw = upbit?.[0]?.trade_price;
    if (!isNum(upbitKrw)) {
      return NextResponse.json({ error: true, source: "upbit", status: 500, detail: "Invalid Upbit payload", upstream }, { status: 500 });
    }

    // Binance 다중 호스트 폴백
    const b = await fetchBinancePrice(binanceSymbol);
    upstream.binance = b.status;
    upstream.fxHost = "multi";

    const binanceUsdt = b.price;
    const usdkrw = fx.value;

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
      upstream,
    };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "kimchi calc failed";
    return NextResponse.json({ error: true, message: msg }, { status: 502 });
  }
}
