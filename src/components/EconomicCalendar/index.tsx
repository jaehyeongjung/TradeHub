"use client";
import { useEffect, useState } from "react";

export default function EconomicCalendar() {
    const [events, setEvents] = useState<any[]>([]);
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
                const data = await res.json();
                setEvents(data);
            } catch (err) {
                setError("네트워크 오류");
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="p-3 border rounded-lg bg-neutral-900 text-white text-sm h-37 overflow-y-auto">
            <h3 className="font-bold mb-2">경제 일정</h3>
            {error && <p className="text-red-400">{error}</p>}
            {!error && events.length === 0 && <p>표시할 일정이 없습니다.</p>}
            <ul className="space-y-1 ">
                {events.map((e, idx) => (
                    <li key={idx} className="flex flex-col justify-between text-xs">
                        <span className="whitespace-nowrap">
                            {e.Country} - {e.Event}
                        </span>
                        <span className="text-gray-400 whitespace-nowrap">{e.Date}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
