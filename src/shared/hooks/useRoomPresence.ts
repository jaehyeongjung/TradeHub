"use client";

import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { supabase } from "@/shared/lib/supabase-browser";
import { roomViewerCountAtom } from "@/shared/store/atoms";

/**
 * 방을 지금 보고 있는 사람 수.
 *
 * presence key를 user_id로 잡아서 같은 사람이 탭을 여러 개 열어도 1명으로 센다.
 * 채널은 메시지·리액션·층 구독과 별개로 하나 더 열지만, supabase-js가 웹소켓
 * 하나에 채널을 다중화하므로 연결은 늘지 않는다.
 *
 * 종목방은 대부분 메시지가 0개로 시작한다. "지금 8명이 보고 있다"는 신호가
 * 없으면 죽은 방으로 읽혀서 아무도 말을 걸지 않는다 — 그걸 막는 게 목적이다.
 */
export function useRoomPresence(roomId: string, userId: string | null): number {
    const [count, setCount] = useState(0);
    const publish = useSetAtom(roomViewerCountAtom);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase.channel(`presence:${roomId}`, {
            config: { presence: { key: userId } },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const next = Object.keys(channel.presenceState()).length;
                setCount(next);
                // 같은 방을 보는 다른 위치의 컴포넌트(히어로 문구)도 이 값을 읽는다
                publish((prev) => (prev[roomId] === next ? prev : { ...prev, [roomId]: next }));
            })
            .subscribe((status) => {
                if (status !== "SUBSCRIBED") return;
                // track이 실패해도 남의 숫자는 계속 받는다 — 조용히 무시한다
                void channel.track({ joined_at: new Date().toISOString() });
            });

        return () => {
            void supabase.removeChannel(channel);
            publish((prev) => {
                if (!(roomId in prev)) return prev;
                const next = { ...prev };
                delete next[roomId];
                return next;
            });
        };
    }, [roomId, userId, publish]);

    return count;
}
