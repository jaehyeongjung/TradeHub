import type { Pivot, FibLevel, FibRetracement } from "./types";

/**
 * 피보나치 레벨 정의
 *
 * 핵심 레벨 (isKey=true):
 *   0.382 — 얕은 되돌림, 강한 추세에서 자주 반응
 *   0.5   — 심리적 50% 레벨
 *   0.618 — 황금 되돌림 비율 (가장 중요)
 *   0.786 — 깊은 되돌림, 약한 추세 되돌림
 *   1.618 — 확장 목표가 (Price Target)
 *   2.618 — 강한 확장 목표가
 */
const FIB_RATIOS: { ratio: number; label: string; isKey: boolean }[] = [
    { ratio: 0,     label: "0%",     isKey: false },
    { ratio: 0.236, label: "23.6%",  isKey: false },
    { ratio: 0.382, label: "38.2%",  isKey: true  },
    { ratio: 0.5,   label: "50%",    isKey: true  },
    { ratio: 0.618, label: "61.8%",  isKey: true  },
    { ratio: 0.786, label: "78.6%",  isKey: true  },
    { ratio: 1,     label: "100%",   isKey: false },
    { ratio: 1.272, label: "127.2%", isKey: false },
    { ratio: 1.618, label: "161.8%", isKey: true  },
    { ratio: 2.618, label: "261.8%", isKey: false },
];

/**
 * 피보나치 되돌림 / 확장 레벨 자동 계산
 *
 * 1. 최근 피벗에서 유효한 스윙 고점/저점 선택
 * 2. 고점 → 저점: 상승 후 되돌림 구간 (bearish swing, retracement up)
 * 3. 저점 → 고점: 하락 후 반등 구간 (bullish swing, retracement down)
 * 4. 가장 최근 스윙 방향에 맞춰 되돌림 기준을 결정
 */
export function calculateFibonacci(pivots: Pivot[]): FibRetracement | null {
    if (pivots.length < 4) return null;

    // 최근 10개 피벗에서 스윙 레인지 계산
    const recent     = pivots.slice(-10);
    const highPivots = recent.filter(p => p.type === "high");
    const lowPivots  = recent.filter(p => p.type === "low");

    if (!highPivots.length || !lowPivots.length) return null;

    const swingHigh = highPivots.reduce((a, b) => (a.price > b.price ? a : b));
    const swingLow  = lowPivots.reduce((a, b) => (a.price < b.price ? a : b));

    const range = swingHigh.price - swingLow.price;
    if (range <= 0) return null;

    // 어느 방향 움직임이 더 최근인지 판별
    // - swingHigh가 더 최근 → 가격이 올랐다 내려오는 중 → retracement_down
    // - swingLow가 더 최근 → 가격이 내렸다 올라오는 중 → retracement_up
    const direction: FibRetracement["direction"] = swingLow.index > swingHigh.index
        ? "retracement_up"
        : "retracement_down";

    const levels: FibLevel[] = FIB_RATIOS.map(({ ratio, label, isKey }) => {
        // retracement_up: 저점 → 고점 방향, 되돌림은 위에서 아래로
        // retracement_down: 고점 → 저점 방향, 되돌림은 아래서 위로
        const price = direction === "retracement_up"
            ? swingHigh.price - range * ratio   // 고점에서 아래로
            : swingLow.price  + range * ratio;  // 저점에서 위로

        return { ratio, label, isKeyLevel: isKey, price };
    });

    return { swingHigh, swingLow, direction, levels };
}
