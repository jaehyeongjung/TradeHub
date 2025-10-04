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

    // 최신 userId를 콜백에서 안전하게 쓰기 위한 ref
    const userIdRef = useRef<string | null>(null);
    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    // IME 조합 여부 & 전송 락 (중복 호출 방지)
    const composingRef = useRef(false);
    const sendingRef = useRef(false);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            listRef.current?.scrollTo({
                top: listRef.current!.scrollHeight,
                behavior: "smooth",
            });
        });
    };

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

    // 초기 로드
    useEffect(() => {
        (async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("id, content, created_at, user_id, room_id")
                .eq("room_id", roomId)
                .order("created_at", { ascending: true })
                .limit(300);

            if (!error && data) {
                setMsgs(data as Msg[]);
                requestAnimationFrame(() => {
                    listRef.current?.scrollTo({
                        top: listRef.current!.scrollHeight,
                    });
                });
            }
        })();
    }, [roomId]);

    // 실시간 구독 (roomId 기준만 의존)
    useEffect(() => {
        const channelName = `room:${roomId}`;

        // 동일 topic 채널 선 정리 (혹시 남아있을 수 있음)
        supabase
            .getChannels()
            .filter((c) => c.topic === channelName)
            .forEach((c) => supabase.removeChannel(c));

        const ch = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Msg;
                    if (!newMsg?.id) return;

                    // 내 메시지는 send()에서 이미 반영 → 실시간에선 무시
                    if (newMsg.user_id === userIdRef.current) return;

                    setMsgs((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        const next = [...prev, newMsg];
                        scrollToBottom();
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(ch);
        };
    }, [roomId]);

    const send = async () => {
        // 중복 호출 잠금
        if (sendingRef.current) return;
        sendingRef.current = true;

        try {
            const text = inputRef.current?.value?.trim();
            if (!text) return;
            if (!userIdRef.current) return;

            const { data, error } = await supabase
                .from("messages")
                .insert([
                    {
                        room_id: roomId,
                        user_id: userIdRef.current,
                        content: text,
                    },
                ])
                .select()
                .single();

            if (!error && data) {
                const newMsg = data as Msg;
                setMsgs((prev) => {
                    if (prev.some((m) => m.id === newMsg.id)) return prev;
                    const next = [...prev, newMsg];
                    scrollToBottom();
                    return next;
                });
            }

            if (inputRef.current) inputRef.current.value = "";
        } finally {
            // 같은 프레임 중복 방지용: 다음 틱에 락 해제
            setTimeout(() => {
                sendingRef.current = false;
            }, 0);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // IME 조합 중이면 Enter 무시
        if (composingRef.current) return;
        // 일부 브라우저/IME 조합 중 keyCode=229
        if ((e as any).keyCode === 229) return;

        if (e.key === "Enter") {
            e.preventDefault(); // 기본 submit 방지
            void send();
        }
    };

    return (
        <div className="h-full flex flex-col p-3">
            {/* 메시지 리스트 */}
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
                                    ? "text-green-500"
                                    : "text-blue-400"
                            }
                        >
                            {m.user_id === userId
                                ? "나 (me)"
                                : m.user_id.slice(0, 8)}
                        </b>
                        <span className="mx-1 text-gray-400">·</span>
                        <span className="text-gray-200 whitespace-pre-wrap">
                            {m.content}
                        </span>
                    </div>
                ))}
                {!msgs.length && (
                    <div className="text-xs text-gray-600 text-center py-5">
                        아직 메시지가 없습니다. 첫 메시지를 남겨보세요!
                    </div>
                )}
            </div>

            {/* 입력바 */}
            <div className="border-t border-neutral-700 pt-2 ">
                {/* form 쓰지 않음 → Enter 기본 submit 경로 차단 */}
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        onCompositionStart={() => {
                            composingRef.current = true;
                        }}
                        onCompositionEnd={() => {
                            // 조합 확정 직후 들어오는 Enter를 막기 위해 즉시 false로만 전환
                            composingRef.current = false;
                        }}
                        onKeyDown={onKeyDown}
                        className="flex-1 border border-neutral-700 px-3 py-2 rounded bg-neutral-900 text-gray-100 placeholder-neutral-500 focus:outline-none focus:border-green-500"
                        placeholder={
                            userId
                                ? "메시지 입력..."
                                : "로그인 후 메시지를 전송할 수 있어요."
                        }
                        maxLength={2000}
                        disabled={!userId}
                    />
                    <button
                        type="button" // submit 방지
                        onClick={send}
                        className={`px-4 py-2 rounded border border-green-700 transition duration-150 ${
                            userId
                                ? "bg-green-600 text-white hover:bg-green-500"
                                : "bg-neutral-700 text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={!userId}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
