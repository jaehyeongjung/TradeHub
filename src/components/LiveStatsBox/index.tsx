"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

/** 브라우저 당 고정되는 익명 디바이스 ID */
function getDeviceId() {
    if (typeof window === "undefined") return "server";
    const KEY = "th_device_id";
    let id = localStorage.getItem(KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(KEY, id);
    }
    return id;
}

export default function LiveStatsBox() {
    const deviceIdRef = useRef<string>(getDeviceId());
    const [todayVisitors, setTodayVisitors] = useState<number>(0);
    const [onlineNow, setOnlineNow] = useState<number>(0);
    const [connected, setConnected] = useState<boolean>(false);

    const today = new Date().toISOString().slice(0, 10);

    // 오늘 방문(유니크) 기록: 하루에 1번만 upsert
    useEffect(() => {
        const upsertVisit = async () => {
            const { error } = await supabase
                .from("visits")
                .upsert([{ day: today, device_id: deviceIdRef.current }], {
                    onConflict: "day,device_id",
                });

            if (error) console.warn("visit upsert error", error);
        };
        void upsertVisit();
    }, [today]);

    // presence heartbeat (현재 접속자 추정)
    useEffect(() => {
        const beat = async () => {
            await supabase.from("presence").upsert(
                [
                    {
                        device_id: deviceIdRef.current,
                        last_seen: new Date().toISOString(),
                    },
                ],
                { onConflict: "device_id" }
            );
        };

        // 즉시 1회 + 15초마다
        void beat();
        const t = setInterval(() => void beat(), 15_000);
        return () => clearInterval(t);
    }, []);

    // 오늘 방문자 수 조회
    const fetchVisitors = async () => {
        const { count, error } = await supabase
            .from("visits")
            .select("device_id", { count: "exact", head: true })
            .eq("day", today);

        if (!error) setTodayVisitors(count ?? 0);
    };

    // 현재 접속자 수(최근 60초 내 활동)
    const fetchOnline = async () => {
        const { count, error } = await supabase
            .from("presence")
            .select("device_id", { count: "exact", head: true })
            .gt("last_seen", new Date(Date.now() - 60_000).toISOString());

        if (!error) setOnlineNow(count ?? 0);
    };

    // 폴링 + realtime 변화 감지
    useEffect(() => {
        // 처음 로드 시 한번
        void fetchVisitors();
        void fetchOnline();

        // 10초마다 새로고침(백업)
        const poll = setInterval(() => {
            void fetchVisitors();
            void fetchOnline();
        }, 10_000);

        // Realtime 구독 (presence 변경 시 즉시 반영)
        const channel = supabase
            .channel("presence-watch")
            .on(
                "postgres_changes",
                { schema: "public", table: "presence", event: "*" },
                () => void fetchOnline()
            )
            .subscribe((status) => {
                setConnected(status === "SUBSCRIBED");
            });

        return () => {
            clearInterval(poll);
            supabase.removeChannel(channel);
        };
    }, []); // 의존성 없음: 내부에서 자체적으로 최신값을 다시 조회

    return (
        <div className="flex items-center gap-3 rounded-xl border p-3 shadow-sm justify-center ">
            <span className="text-xs flex flex-col ml-1 whitespace-nowrap">
                <b>오늘 방문자</b>
                {todayVisitors.toLocaleString()}명
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs flex flex-col whitespace-nowrap">
                <b>현재 접속</b> {onlineNow.toLocaleString()}명
            </span>
            <span
                className={`inline-block h-2 w-2 rounded-full mt-[-16px]  ${
                    connected ? "bg-emerald-500" : "bg-gray-300"
                }`}
                title={connected ? "Realtime connected" : "Disconnected"}
            />
        </div>
    );
}
