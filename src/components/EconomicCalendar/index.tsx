"use client";
import { useEffect, useState } from "react";

// API 응답 타입
type EconomicEvent = {
    Country: string;
    Event: string;
    Date: string; // ISO 문자열
};

export default function EconomicCalendar() {
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            const from = new Date().toISOString().slice(0, 10);
            const to = new Date(Date.now() + 7 * 86400000)
                .toISOString()
                .slice(0, 10);

            try {
                const res = await fetch(
                    `/api/economic-calendar?from=${from}&to=${to}`
                );
                if (!res.ok) {
                    const txt = await res.text();
                    setError(`로드 실패: ${txt}`);
                    return;
                }
                const data: EconomicEvent[] = await res.json(); // 타입 단언
                setEvents(data);
            } catch {
                setError("네트워크 오류");
            }
        };
        fetchEvents();
    }, []);

    // UTC → 한국시간 변환
    const formatKST = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="p-3 border rounded-lg bg-neutral-900 text-white text-sm h-37 overflow-y-auto">
            <h3 className="font-bold mb-2">경제 일정</h3>
            {error && <p className="text-red-400">{error}</p>}
            {!error && events.length === 0 && <p>표시할 일정이 없습니다.</p>}
            <ul className="space-y-1">
                {events.map((e, idx) => (
                    <li
                        key={idx}
                        className="flex flex-col justify-between text-xs"
                    >
                        <span className="whitespace-nowrap">
                            {e.Country} - {e.Event}
                        </span>
                        <span className="text-gray-400 whitespace-nowrap">
                            {formatKST(e.Date)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
