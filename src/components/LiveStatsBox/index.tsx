"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { supabase } from "@/lib/supabase-browser";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { treemapOpenAtom } from "@/store/atoms";
import AnimatedNumber from "@/components/AnimatedNumber";

function getDeviceId() {
    if (typeof window === "undefined") return "server";
    const KEY = "th_device_id";
    let id = localStorage.getItem(KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEY, id); }
    return id;
}

export default function LiveStatsBox({ fadeDelay = 0 }: { fadeDelay?: number } = {}) {
    const deviceIdRef = useRef<string>(getDeviceId());
    const [onlineNow, setOnlineNow] = useState<number>(0);
    const [ready, setReady] = useState(false);
    const [connected, setConnected] = useState<boolean>(false);
    const [isLight, setIsLight] = useState(false);
    const isTreemapOpen = useAtomValue(treemapOpenAtom);

    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        void supabase.from("visits").upsert([{ day: today, device_id: deviceIdRef.current }], { onConflict: "day,device_id" });
    }, [today]);

    const fetchOnline = useCallback(async () => {
        const { count, error } = await supabase
            .from("presence")
            .select("device_id", { count: "exact", head: true })
            .gt("last_seen", new Date(Date.now() - 60_000).toISOString());
        if (!error) { setOnlineNow(count ?? 0); setReady(true); }
    }, []);

    const heartbeatAndFetch = useCallback(async () => {
        await supabase.from("presence").upsert([{ device_id: deviceIdRef.current, last_seen: new Date().toISOString() }], { onConflict: "device_id" });
        await fetchOnline();
    }, [fetchOnline]);

    useVisibilityPolling({ interval: 15_000, onPoll: heartbeatAndFetch, immediate: true, enabled: !isTreemapOpen });

    useEffect(() => {
        const channel = supabase
            .channel("presence-watch")
            .on("postgres_changes", { schema: "public", table: "presence", event: "*" }, () => void fetchOnline())
            .subscribe((status) => setConnected(status === "SUBSCRIBED"));
        return () => { void supabase.removeChannel(channel); };
    }, [fetchOnline]);

    const cardBg = isLight ? "bg-white border-neutral-200" : "bg-neutral-900 border-neutral-800";
    const labelColor = isLight ? "text-neutral-400" : "text-neutral-500";
    const numColor = isLight ? "text-neutral-700" : "text-neutral-100";
    const unitColor = isLight ? "text-neutral-400" : "text-neutral-400";

    return (
        <div
            className={`rounded-2xl border px-4 py-3 2xl:px-5 2xl:py-3.5 flex items-center justify-between transition-[opacity,transform] duration-700 ${cardBg} ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
            <div>
                <div className={`text-[10px] 2xl:text-[11px] font-medium mb-0.5 ${labelColor}`}>
                    지금 함께 보는 중
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl 2xl:text-3xl font-bold tabular-nums leading-none ${numColor}`}>
                        <AnimatedNumber value={onlineNow} />
                    </span>
                    <span className={`text-xs 2xl:text-sm font-medium ${unitColor}`}>명</span>
                </div>
            </div>

            {connected ? (
                <span className="flex items-center gap-1 text-[9px] 2xl:text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                </span>
            ) : (
                <span className={`text-[9px] font-medium px-2 py-1 rounded-full ${isLight ? "bg-neutral-100 text-neutral-400" : "bg-neutral-800 text-neutral-500"}`}>
                    연결 중
                </span>
            )}
        </div>
    );
}
