import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
// Vercel 함수 선호 리전 (서울/도쿄/싱가폴)
export const preferredRegion = ["icn1", "hnd1", "sin1"];

// ===== Config: 현실 보정치 (환경변수로 미세 튜닝) =====
const FX_SPREAD = Number(process.env.FX_SPREAD ?? "0.009"); // +0.9% TT Selling 근사
const USDT_USD  = Number(process.env.USDT_USD  ?? "0.999"); // USDT≈USD 보정

type UpbitTicker = Array<{ trade_price: number; timestamp: number }>;
type BinanceTicker = { symbol?: string; price?: string };
type FxLatest = { rates?: { KRW?: number } };

type UpbitOrderbook = Array<{
  orderbook_units: Array<{ ask_price: number; bid_price: number }>;
  timestamp: number;
}>;

type KimchiPayload = {
  symbol: string;
  upbitKrw: number;
  upbitPriceSource: "orderbook_mid" | "trade_price"; // 어떤 소스로 산출했는지 투명화
  binanceUsdt: number;
  usdkrw: number;
  globalKrw: number;
  premium: number; // 0.019 = 1.9%
  updatedAt: string;
  upstream?: {
    upbit?: number;
    binance?: number;
    fx?: number;
    fxHost?: string;
    fxAdj?: number;   // 환율 보정 계수 (1 + FX_SPREAD)
    usdtUsd?: number; // USDT/USD 보정 계수
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

// ----- 환율 (USD→KRW) -----
async function fetchUsdKrw(): Promise<{ value: number; status: number }> {
  // 1차
  const r1 = await withTimeout(
    "https://api.exchangerate.host/latest?base=USD&symbols=KRW",
    3500,
    {
      headers: { "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)" },
      cache: "no-store",
    }
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

// ----- 바이낸스 USDT 시세 (다중 호스트 폴백) -----
async function fetchBinancePrice(
  symbol: string
): Promise<{ price: number; status: number; host: string }> {
  const hosts = [
    process.env.BINANCE_HOST?.trim(),
    "api.binance.com",
    "api1.binance.com",
    "api2.binance.com",
    "api3.binance.com",
    "data-api.binance.vision", // 마지막 백업
  ].filter(Boolean) as string[];

  const path = (host: string) =>
    `https://${host}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`;

  const headers = {
    "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)",
    Accept: "application/json" as const,
  };

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

// ----- 업비트 호가 중간값(mid) 시도 -----
async function fetchUpbitMid(
  market: string,
  ua: Record<string, string>
): Promise<{ mid: number; ts?: number }> {
  const r = await withTimeout(
    `https://api.upbit.com/v1/orderbook?markets=${encodeURIComponent(market)}`,
    1500,
    { headers: ua, cache: "no-store" }
  );
  if (!r.ok) throw new Error("Upbit orderbook failed");
  const j = (await r.json()) as UpbitOrderbook;
  const u0 = j?.[0]?.orderbook_units?.[0];
  if (!u0) throw new Error("Upbit orderbook empty");
  const mid = (u0.ask_price + u0.bid_price) / 2;
  if (!Number.isFinite(mid)) throw new Error("Upbit mid invalid");
  return { mid, ts: j?.[0]?.timestamp };
}

// ====== Main Handler ======
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sym = (url.searchParams.get("symbol") || "BTC").toUpperCase();
  const upbitMarket = `KRW-${sym}`;
  const binanceSymbol = `${sym}USDT`;

  try {
    const ua = {
      "User-Agent": "TradeHub/1.0 (+https://www.tradehub.kr)",
      Accept: "application/json",
    };

    // 업비트 체결가 + 환율을 우선 불러오고, 체결가 파싱 성공 후 orderbook mid를 시도
    const [upbitRes, fx] = await Promise.all([
      withTimeout(
        `https://api.upbit.com/v1/ticker?markets=${encodeURIComponent(upbitMarket)}`,
        3500,
        { headers: ua, cache: "no-store" }
      ),
      fetchUsdKrw(),
    ]);

    const upstream: KimchiPayload["upstream"] = {
      upbit: upbitRes.status,
      fx: fx.status,
    };

    if (!upbitRes.ok) {
      const txt = await upbitRes.text().catch(() => "");
      return NextResponse.json(
        { error: true, source: "upbit", status: upbitRes.status, detail: txt, upstream },
        { status: 502 }
      );
    }

    const upbit = (await upbitRes.json()) as UpbitTicker;
    const lastTrade = upbit?.[0]?.trade_price;

    // 업비트 가격: orderbook mid 우선, 실패 시 trade_price 사용
    let upbitKrw = lastTrade;
    let upbitPriceSource: KimchiPayload["upbitPriceSource"] = "trade_price";
    try {
      const { mid } = await fetchUpbitMid(upbitMarket, ua);
      if (isNum(mid)) {
        upbitKrw = mid;
        upbitPriceSource = "orderbook_mid";
      }
    } catch {
      // orderbook 실패 → trade_price 사용
    }

    if (!isNum(upbitKrw)) {
      return NextResponse.json(
        { error: true, source: "upbit", status: 500, detail: "Invalid Upbit payload", upstream },
        { status: 500 }
      );
    }

    // Binance 다중 호스트 폴백
    const b = await fetchBinancePrice(binanceSymbol);
    upstream.binance = b.status;
    upstream.fxHost = "multi";

    const binanceUsdt = b.price;
    const usdkrw = fx.value;

    // ===== 현실 보정 적용 =====
    const usdkrwEffective = usdkrw * (1 + FX_SPREAD); // TT Selling 근사
    const globalKrw = binanceUsdt * USDT_USD * usdkrwEffective;
    const premium = (upbitKrw - globalKrw) / globalKrw;

    upstream.fxAdj = 1 + FX_SPREAD;
    upstream.usdtUsd = USDT_USD;

    const body: KimchiPayload = {
      symbol: sym,
      upbitKrw,
      upbitPriceSource,
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
