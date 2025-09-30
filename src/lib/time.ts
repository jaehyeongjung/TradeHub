import type { UTCTimestamp } from "lightweight-charts";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function toKstUtcTimestamp(ms: number): UTCTimestamp {
    return Math.floor((ms + KST_OFFSET_MS) / 1000) as UTCTimestamp;
}
