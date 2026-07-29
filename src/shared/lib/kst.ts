// 한국 시간 기준 판단. 서버(UTC)와 브라우저(로컬)에서 같은 답이 나와야 하는 값들이라
// Date의 로컬 필드 대신 Intl로 KST를 직접 읽는다.

const HOUR_FMT = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
});

const DATE_FMT = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

/** KST 기준 시 (0~23) */
export function kstHour(at: Date = new Date()): number {
    // 자정을 "24"로 주는 환경이 있어 24로 나눈 나머지를 쓴다
    return Number(HOUR_FMT.format(at)) % 24;
}

/** KST 기준 달력 날짜 "YYYY-MM-DD" */
export function kstDateStr(at: Date = new Date()): string {
    return DATE_FMT.format(at);
}

/** 새벽 0~6시. 새벽반 집계와 문구 전환의 기준. */
export function isLateNightKst(at: Date = new Date()): boolean {
    const hour = kstHour(at);
    return hour >= 0 && hour < 6;
}
