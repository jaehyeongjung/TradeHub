"use client";
import { useEffect, useState } from "react";

type FNGData = {
    name: string;
    data: {
        value: string;
        value_classification: string;
        timestamp: string;
        time_until_update?: string;
    }[];
    metadata: any;
};

export default function FearGreedWidget() {
    const [info, setInfo] = useState<FNGData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/fear-greed")
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => {
                setInfo(json);
            })
            .catch((e) => {
                setError(e.message);
            });
    }, []);

    if (error) return <div>오류: {error}</div>;
    if (!info) return <div>불러오는 중…</div>;

    const cur = info.data[0];
    return (
        <div className="rounded-lg border bg-neutral-900 p-3 text-white">
            <h4 className="text-sm font-bold">{info.name}</h4>
            <div className="text-2xl font-bold">{cur.value}</div>
            <div className="text-sm">{cur.value_classification}</div>
            {cur.time_until_update != null && (
                <div className="text-xs text-gray-400">
                    업데이트까지 {cur.time_until_update}초
                </div>
            )}
        </div>
    );
}
