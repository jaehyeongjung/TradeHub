// 정규장 개장 여부 판정. 주식 토큰 페이지에서 "지금 원장은 닫혀 있는데 토큰은 거래 중"을
// 보여주기 위해 쓴다. 공휴일은 반영하지 않으므로 표기도 "정규장 시간 기준"으로만 한다.

import type { StockMarket } from "./stock-tokens";

export type MarketStatus = {
    isOpen: boolean;
    /** 사용자에게 보여줄 문구 예: "한국 정규장 열림" */
    label: string;
    /** 원장 시장 이름 */
    marketName: string;
    hours: string;
    timezone: string;
};

const CONFIG: Record<StockMarket, {
    marketName: string;
    timezone: string;
    hours: string;
    openMinutes: number;
    closeMinutes: number;
}> = {
    KR: {
        marketName: "한국거래소(KRX)",
        timezone: "Asia/Seoul",
        hours: "09:00 ~ 15:30 KST",
        openMinutes: 9 * 60,
        closeMinutes: 15 * 60 + 30,
    },
    US: {
        marketName: "미국 증시",
        timezone: "America/New_York",
        hours: "09:30 ~ 16:00 ET",
        openMinutes: 9 * 60 + 30,
        closeMinutes: 16 * 60,
    },
};

/** 특정 타임존에서의 요일(0=일)과 자정 기준 경과 분을 구한다. */
function zonedParts(date: Date, timeZone: string): { weekday: number; minutes: number } {
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const weekdayMap: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    // 24시는 자정을 뜻하므로 0으로 정규화
    const hour = Number(get("hour")) % 24;
    return {
        weekday: weekdayMap[get("weekday")] ?? 0,
        minutes: hour * 60 + Number(get("minute")),
    };
}

export function getMarketStatus(market: StockMarket, now: Date = new Date()): MarketStatus {
    const cfg = CONFIG[market];
    const { weekday, minutes } = zonedParts(now, cfg.timezone);
    const isWeekday = weekday >= 1 && weekday <= 5;
    const isOpen = isWeekday && minutes >= cfg.openMinutes && minutes < cfg.closeMinutes;

    let label: string;
    if (isOpen) {
        label = market === "KR" ? "한국 정규장 열림" : "미국 정규장 열림";
    } else if (!isWeekday) {
        label = market === "KR" ? "주말 · 한국 증시 휴장" : "주말 · 미국 증시 휴장";
    } else {
        label = market === "KR" ? "한국 정규장 마감" : "미국 정규장 마감";
    }

    return {
        isOpen,
        label,
        marketName: cfg.marketName,
        hours: cfg.hours,
        timezone: cfg.timezone,
    };
}

/** 해당 시각의 타임존 오프셋(분). 한국은 고정 +540이지만 미국은 DST가 있어 계산이 필요하다. */
function zoneOffsetMinutes(date: Date, timeZone: string): number {
    const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
    if (!m) return 0;
    return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/**
 * 직전 정규장 마감 시각(UTC ms). 주말이면 금요일 마감으로 되돌린다.
 *
 * "장 마감 이후 얼마나 움직였나"의 기준점이다. 공휴일은 반영하지 않으므로
 * 연휴에는 기준이 실제 마감보다 뒤일 수 있다 — 표기도 시각을 함께 보여준다.
 */
export function getLastSessionCloseMs(market: StockMarket, now: Date = new Date()): number {
    const cfg = CONFIG[market];
    const offset = zoneOffsetMinutes(now, cfg.timezone);

    // now를 현지 벽시계로 옮기면 UTC 필드가 곧 현지 시각이 된다
    const zoned = new Date(now.getTime() + offset * 60_000);
    const nowMinutes = zoned.getUTCHours() * 60 + zoned.getUTCMinutes();

    const close = new Date(zoned);
    close.setUTCHours(0, 0, 0, 0);
    close.setUTCMinutes(cfg.closeMinutes);
    if (nowMinutes < cfg.closeMinutes) close.setUTCDate(close.getUTCDate() - 1);
    while (close.getUTCDay() === 0 || close.getUTCDay() === 6) {
        close.setUTCDate(close.getUTCDate() - 1);
    }

    return close.getTime() - offset * 60_000;
}
