"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/lib/supabase-browser";
import type { ResidentKind } from "./floor";

export type Resident = {
    userId: string;
    kind: ResidentKind;
    /** 종목 표시 통화 기준 원본값 (평단가 또는 희망 매수가) */
    price: number;
    createdAt: string;
};

type Row = {
    user_id: string;
    kind: ResidentKind;
    price: number | string;
    created_at: string;
};

/** numeric 컬럼은 실시간 페이로드에서 문자열로 오는 경우가 있다 */
function toResident(row: Row): Resident | null {
    const price = Number(row.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    if (row.kind !== "holder" && row.kind !== "watcher") return null;
    return { userId: row.user_id, kind: row.kind, price, createdAt: row.created_at };
}

export function useResidents(roomId: string, userId: string | null) {
    const [byUser, setByUser] = useState<Record<string, Resident>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        (async () => {
            const { data, error } = await supabase
                .from("holdings")
                .select("user_id, kind, price, created_at")
                .eq("room_id", roomId);
            if (!alive) return;
            if (!error && data) {
                const next: Record<string, Resident> = {};
                for (const row of data as Row[]) {
                    const r = toResident(row);
                    if (r) next[r.userId] = r;
                }
                setByUser(next);
            }
            setLoading(false);
        })();
        return () => {
            alive = false;
        };
    }, [roomId]);

    useEffect(() => {
        // 채널명뿐 아니라 filter까지 방으로 좁힌다. 필터를 빼면 종목이 늘어나는 만큼
        // 모든 방의 이벤트가 전 클라이언트로 브로드캐스트된다.
        const channel = supabase
            .channel(`holdings:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "holdings",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    if (payload.eventType === "DELETE") {
                        const gone = payload.old as Partial<Row>;
                        if (!gone?.user_id) return;
                        setByUser((prev) => {
                            if (!prev[gone.user_id!]) return prev;
                            const next = { ...prev };
                            delete next[gone.user_id!];
                            return next;
                        });
                        return;
                    }
                    const resident = toResident(payload.new as Row);
                    if (!resident) return;
                    setByUser((prev) => ({ ...prev, [resident.userId]: resident }));
                },
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [roomId]);

    const me = userId ? byUser[userId] ?? null : null;

    const save = useCallback(
        async (kind: ResidentKind, price: number) => {
            if (!userId) return false;
            // 낙관적 반영 — 실시간 이벤트가 곧 같은 값으로 확정한다
            setByUser((prev) => ({
                ...prev,
                [userId]: {
                    userId,
                    kind,
                    price,
                    createdAt: prev[userId]?.createdAt ?? new Date().toISOString(),
                },
            }));
            const { error } = await supabase
                .from("holdings")
                .upsert([{ user_id: userId, room_id: roomId, kind, price }], {
                    onConflict: "user_id,room_id",
                });
            return !error;
        },
        [roomId, userId],
    );

    const remove = useCallback(async () => {
        if (!userId) return false;
        setByUser((prev) => {
            if (!prev[userId]) return prev;
            const next = { ...prev };
            delete next[userId];
            return next;
        });
        const { error } = await supabase
            .from("holdings")
            .delete()
            .eq("user_id", userId)
            .eq("room_id", roomId);
        return !error;
    }, [roomId, userId]);

    const residents = useMemo(() => Object.values(byUser), [byUser]);

    return { residents, byUser, me, loading, save, remove };
}
