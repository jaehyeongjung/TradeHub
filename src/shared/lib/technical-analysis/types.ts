import type { Interval } from "@/shared/types/binance.types";

export type Candle = {
    time: number   // unix ms
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export type PivotType = "high" | "low"

export type Pivot = {
    index: number
    time: number
    price: number
    type: PivotType
}

export type TrendLineType = "uptrend" | "downtrend"

export type TrendLine = {
    id: string
    type: TrendLineType
    pivots: Pivot[]
    slope: number
    intercept: number
    touches: number
    strength: number       // 0–100
    broken: boolean
    startIndex: number
    endIndex: number
    priceAt: (index: number) => number
}

export type SRLevel = {
    price: number
    type: "support" | "resistance"
    touches: number
    strength: number
    lastTouchIndex: number
    volumeWeight?: number  // 거래량 가중치
}

export type FibLevel = {
    ratio: number
    price: number
    label: string
    isKeyLevel: boolean
}

export type FibRetracement = {
    swingHigh: Pivot
    swingLow: Pivot
    direction: "retracement_up" | "retracement_down"   // 어느 방향 되돌림인지
    levels: FibLevel[]
}

// ── 시장 구조 (Market Structure / ICT-SMC) ─────────────────────────────

export type SwingType = "HH" | "HL" | "LH" | "LL"

export type SwingPoint = {
    swingType: SwingType
    index: number
    price: number
    pivotType: "high" | "low"
}

export type BreakOfStructure = {
    direction: "bullish" | "bearish"
    price: number
    index: number
}

export type MarketStructure = {
    trend: "uptrend" | "downtrend" | "ranging"
    swingPoints: SwingPoint[]
    bos: BreakOfStructure | null    // Break of Structure (추세 지속 확인)
    choch: BreakOfStructure | null  // Change of Character (추세 전환 신호)
    trendStrength: number           // 0–100
}

// ── 캔들스틱 패턴 ──────────────────────────────────────────────────────

export type CandlePatternType = "bullish" | "bearish" | "neutral"

export type CandlestickPattern = {
    name: string
    koreanName: string
    type: CandlePatternType
    strength: 1 | 2 | 3   // 1=약, 2=보통, 3=강
    index: number
}

// ── 추세선 기반 타점 ───────────────────────────────────────────────────

export type TrendLineSetupType = "pullback_long" | "pullback_short"

export type TrendLineSetup = {
    id: string
    trendLineId: string
    setupType: TrendLineSetupType
    entryPrice: number
    entryOffset: number   // 현재 캔들 기준 몇 캔들 후 진입 예상
    stopLoss: number
    takeProfit1: number
    takeProfit2: number
    riskReward: number
    confidence: number
    label: string
}

// ── 시그널 / 결론 ──────────────────────────────────────────────────────

export type SignalDirection = "long" | "short" | "neutral"

export type SignalReason = {
    source: string
    description: string
    bullish: boolean
    score: number
}

export type TradeSetup = {
    direction: SignalDirection
    score: number          // -10 ~ +10
    confidence: number     // 0–100
    entry: number
    stopLoss: number
    takeProfit1: number
    takeProfit2: number
    riskReward: number
    reasons: SignalReason[]
}

// ── 분석 결과 통합 ─────────────────────────────────────────────────────

export type AnalysisResult = {
    candles: Candle[]
    pivots: Pivot[]
    trendLines: TrendLine[]
    srLevels: SRLevel[]
    fibonacci: FibRetracement | null
    marketStructure: MarketStructure
    candlestickPatterns: CandlestickPattern[]
    setup: TradeSetup
    trendLineSetups: TrendLineSetup[]
    interval: Interval
    symbol: string
}
