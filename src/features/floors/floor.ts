// 층 계산. "8만전자 = 8층"이라는 이미 존재하는 관용을 그대로 규칙으로 옮긴 것이다.
//
// 층은 정체성이라 세션 중에 값이 흔들리면 안 된다. 그래서 층 단위(floorUnit)는
// 실시간 가격이 아니라 서버가 렌더한 기준가로 한 번만 정한다.

export type StockMarketLike = "KR" | "US";
export type Currency = "KRW" | "USD";
export type ResidentKind = "holder" | "watcher";

/** 층·평단가를 표시할 통화. 한국 종목은 원화가 사용자가 아는 숫자다. */
export function currencyOf(market: StockMarketLike): Currency {
    return market === "KR" ? "KRW" : "USD";
}

/**
 * 1층의 크기.
 *
 * 한국 주식은 만원이 1층("8만전자", "20만닉스")으로 굳어 있어 고정한다.
 * 해외는 가격대가 $3부터 $1,200까지 흩어져 있어 층수가 두 자리로 떨어지는
 * 단위를 자동으로 고른다. $420 → 42층, $180 → 18층, $45 → 45층.
 *
 * 자동 규칙이 어색한 종목은 StockToken.floorUnit으로 덮어쓴다.
 */
export function floorUnitFor(
    market: StockMarketLike,
    override: number | undefined,
    referencePrice: number | null,
): number {
    if (override !== undefined && override > 0) return override;
    if (market === "KR") return 10_000;
    if (referencePrice === null || referencePrice <= 0) return 1;
    const digits = Math.floor(Math.log10(referencePrice)) + 1;
    return 10 ** (digits - 2);
}

/** 내가 사는 층 (정수) */
export function floorOf(price: number, unit: number): number {
    return Math.floor(price / unit);
}

/** 엘리베이터 위치 (소수 — 8.4층처럼 층 사이에 걸린다) */
export function elevatorAt(price: number, unit: number): number {
    return price / unit;
}

export function pnlPercent(current: number, entry: number): number {
    return ((current - entry) / entry) * 100;
}

export function formatNative(price: number, currency: Currency): string {
    return currency === "KRW"
        ? `${Math.round(price).toLocaleString("ko-KR")}원`
        : `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatSignedPercent(pct: number, digits = 1): string {
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct.toFixed(digits)}%`;
}

// ── 단면도에 그릴 창(window) 계산 ───────────────────────────────────────────

export type FloorBucket = { floor: number; holders: number; watchers: number };

export type FloorWindow = {
    /** 위층 → 아래층 순서. 사람이 없는 층도 빈 행으로 채워 등간격을 유지한다. */
    rows: FloorBucket[];
    top: number;
    bottom: number;
    /** 창 밖으로 밀려난 사람들 */
    above: { holders: number; watchers: number };
    below: { holders: number; watchers: number };
    /** 막대 길이 정규화 기준 */
    max: number;
};

const MIN_ROWS = 7;
/** 내 층을 창 안에 넣기 위해 늘려줄 수 있는 최대 행 수 */
const STRETCH = 4;

/**
 * 엘리베이터를 항상 창 안에 두고, 가능하면 내 층도 함께 담는다.
 * 둘의 거리가 너무 멀면 내 층은 창 밖 요약("위 5명")으로 밀린다 —
 * 내 층수와 손익은 어차피 헤더에 크게 떠 있다.
 */
export function buildFloorWindow(
    buckets: FloorBucket[],
    elevator: number,
    myFloor: number | null,
    maxRows = 12,
): FloorWindow {
    const occupied = buckets.filter((b) => b.holders + b.watchers > 0);
    const elevatorFloor = Math.floor(elevator);

    const marks = [elevatorFloor, ...occupied.map((b) => b.floor)];
    if (myFloor !== null) marks.push(myFloor);

    let top = Math.max(...marks) + 1;
    let bottom = Math.min(...marks) - 1;

    // 입주민이 적을 때 단면도가 찌그러져 보이지 않게 최소 높이를 준다
    while (top - bottom + 1 < MIN_ROWS) {
        top += 1;
        if (top - bottom + 1 < MIN_ROWS) bottom -= 1;
    }

    if (top - bottom + 1 > maxRows) {
        // 엘리베이터를 중앙에 두고 자른다
        const half = Math.floor((maxRows - 1) / 2);
        top = elevatorFloor + half + 1;
        bottom = top - maxRows + 1;

        // 내 층이 조금만 벗어났다면 창을 그만큼 늘려서 포함시킨다
        if (myFloor !== null) {
            if (myFloor > top && myFloor - top <= STRETCH) top = myFloor;
            else if (myFloor < bottom && bottom - myFloor <= STRETCH) bottom = myFloor;
        }
    }

    const byFloor = new Map(occupied.map((b) => [b.floor, b]));
    const rows: FloorBucket[] = [];
    for (let f = top; f >= bottom; f--) {
        rows.push(byFloor.get(f) ?? { floor: f, holders: 0, watchers: 0 });
    }

    const above = { holders: 0, watchers: 0 };
    const below = { holders: 0, watchers: 0 };
    for (const b of occupied) {
        if (b.floor > top) {
            above.holders += b.holders;
            above.watchers += b.watchers;
        } else if (b.floor < bottom) {
            below.holders += b.holders;
            below.watchers += b.watchers;
        }
    }

    const max = Math.max(1, ...rows.map((r) => r.holders + r.watchers));

    return { rows, top, bottom, above, below, max };
}

/** 방 전체 요약. 층이 아니라 원본 가격으로 평균을 내야 정확하다. */
export function summarize(
    residents: { kind: ResidentKind; price: number }[],
    currentPrice: number,
    unit: number,
) {
    const holders = residents.filter((r) => r.kind === "holder");
    const watchers = residents.filter((r) => r.kind === "watcher");
    const stuck = holders.filter((r) => r.price > currentPrice).length;
    const avgPrice = holders.length
        ? holders.reduce((s, r) => s + r.price, 0) / holders.length
        : null;

    return {
        holderCount: holders.length,
        watcherCount: watchers.length,
        stuckCount: stuck,
        stuckRatio: holders.length ? stuck / holders.length : 0,
        /** 평균 층 (소수 한 자리로 보여준다) */
        averageFloor: avgPrice === null ? null : avgPrice / unit,
    };
}
