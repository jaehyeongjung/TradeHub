// Chat.tsx
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

    // 세션 감지
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
        return () => subscription.unsubscribe();
    }, []);

    // 초기 로드 + 실시간
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("id, content, created_at, user_id, room_id")
                .eq("room_id", roomId)
                .order("created_at", { ascending: false })
                .limit(300);
            if (!cancelled && !error && data) {
                setMsgs(data as Msg[]);
                requestAnimationFrame(() => {
                    listRef.current?.scrollTo({
                        top: listRef.current.scrollHeight,
                    });
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
                        requestAnimationFrame(() => {
                            listRef.current?.scrollTo({
                                top: listRef.current.scrollHeight,
                                behavior: "smooth",
                            });
                        });
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(ch);
        };
    }, [roomId]);

    const send = async () => {
        const text = inputRef.current?.value?.trim();
        if (!text) return;
        if (!userId) return alert("로그인 후 전송할 수 있어요.");
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
        // 부모(오른쪽 패널)가 높이를 갖고 있어야 합니다: 그 부모에 h-full 또는 h-[calc(100vh-헤더높이)] 적용
        <div className="h-full flex flex-col p-3">
            {" "}
            {/* ← 고정높이 삭제, h-full로 */}
            {/* 스크롤 영역 */}
            <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1"
            >
                {msgs.map((m) => (
                    <div
                        key={m.id}
                        className="text-sm border rounded px-3 py-2 bg-neutral-900"
                    >
                        <b
                            className={
                                m.user_id === userId
                                    ? "text-emerald-700"
                                    : "text-emerald-700"
                            }
                        >
                            {m.user_id === userId
                                ? "me"
                                : m.user_id.slice(0, 8)}
                        </b>
                        <span className="mx-1">·</span>
                        <span className="text-gray-200">{m.content}</span>
                    </div>
                ))}
                {!msgs.length && (
                    <div className="text-xs text-gray-600">
                        아직 메시지가 없습니다.
                    </div>
                )}
            </div>
            {/* 입력바 — 스크롤 영역 '밖'이라 항상 하단에 붙음 */}
            <div className="border-t pt-2 ">
                {" "}
                {/* sticky 제거, 여백 원하면 pt-2만 조절 */}
                <div className="flex gap-2 ">
                    <input
                        ref={inputRef}
                        onKeyDown={onKeyDown}
                        className="flex-1 border px-3 py-2 rounded bg-neutral-900 text-emerald-800"
                        placeholder="메시지..."
                        maxLength={2000}
                    />
                    <button
                        onClick={send}
                        className="px-4 py-2 rounded border bg-neutral-900 text-emerald-800"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
