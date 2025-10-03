"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Msg = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    room_id?: string;
};

export default function Chat({ roomId = "lobby" }: { roomId?: string }) {
    const [userId, setUserId] = useState<string | null>(null);
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // 세션 감지 (async IIFE 사용, effect는 void만 반환)
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_e, s) => {
            setUserId(s?.user?.id ?? null);
        });

        (async () => {
            const { data } = await supabase.auth.getSession();
            setUserId(data.session?.user?.id ?? null);
        })();

        return () => subscription.unsubscribe(); // ✅
    }, []);

    // 초기 로드 + 실시간 구독 (async IIFE + 정상 cleanup)
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("id, content, created_at, user_id, room_id")
                .eq("room_id", roomId)
                .order("created_at", { ascending: true })
                .limit(300);

            if (!cancelled && !error && data) {
                setMsgs(data as Msg[]);
                // 맨 아래로 스크롤
                requestAnimationFrame(() => {
                    if (listRef.current) {
                        listRef.current.scrollTo({
                            top: listRef.current.scrollHeight,
                            behavior: "auto",
                        });
                    }
                });
            }
        })();

        const ch = supabase
            .channel(`room:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    setMsgs((prev) => {
                        const next = [...prev, payload.new as Msg];
                        // 새 메시지 도착 시 맨 아래로
                        requestAnimationFrame(() => {
                            if (listRef.current) {
                                listRef.current.scrollTo({
                                    top: listRef.current.scrollHeight,
                                    behavior: "smooth",
                                });
                            }
                        });
                        return next;
                    });
                }
            )
            .subscribe();

        // ✅ cleanup은 void만 반환
        return () => {
            cancelled = true;
            supabase.removeChannel(ch);
        };
    }, [roomId]);

    const send = async () => {
        const text = inputRef.current?.value?.trim();
        if (!text) return;
        if (!userId) {
            alert("로그인 후 전송할 수 있어요.");
            return;
        }
        await supabase
            .from("messages")
            .insert([{ room_id: roomId, user_id: userId, content: text }]);
        if (inputRef.current) inputRef.current.value = "";
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            void send();
        }
    };

    return (
        <div className="max-w-md w-full mx-auto  p-3 ">
            <div className="flex flex-col h-[520px]">
                {/* 리스트(스크롤 영역) */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto space-y-2 pr-1"
                >
                    {msgs.map((m) => (
                        <div
                            key={m.id}
                            className="text-sm border rounded px-3 py-2"
                        >
                            <b
                                className={
                                    m.user_id === userId
                                        ? "text-emerald-700"
                                        : "text-gray-700"
                                }
                            >
                                {m.user_id === userId
                                    ? "me"
                                    : m.user_id.slice(0, 8)}
                            </b>
                            <span className="mx-1">·</span>
                            <span>{m.content}</span>
                        </div>
                    ))}
                    {!msgs.length && (
                        <div className="text-xs text-gray-600">
                            아직 메시지가 없습니다.
                        </div>
                    )}
                </div>

                {/* 인풋 바(하단 고정) */}
                <div className="sticky bottom-0 mt-2  pt-2">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            onKeyDown={onKeyDown}
                            className="flex-1 border px-3 py-2 rounded"
                            placeholder="메시지..."
                            maxLength={2000}
                        />
                        <button
                            onClick={send}
                            className="px-4 py-2 rounded border"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
