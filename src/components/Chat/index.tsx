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

    // 세션 감지 및 초기 로드
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

    // 초기 로드 + 실시간 구독
    useEffect(() => {
        let cancelled = false;

        // 1. 초기 데이터 로드
        (async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("id, content, created_at, user_id, room_id")
                .eq("room_id", roomId)
                // 오래된 것부터 가져와서 실시간 업데이트와 순서를 통일 (ascending: true)
                .order("created_at", { ascending: true })
                .limit(300);
            if (!cancelled && !error && data) {
                setMsgs(data as Msg[]);
                // 메시지 로드 후 스크롤을 맨 아래로
                requestAnimationFrame(() => {
                    listRef.current?.scrollTo({
                        top: listRef.current.scrollHeight,
                    });
                });
            }
        })();

        // 2. 실시간 채널 구독
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
                        const newMessage = payload.new as Msg;

                        // ⭐️ 수정: 메시지 ID로 중복 확인하여 중복된 메시지는 무시합니다.
                        if (prev.some((m) => m.id === newMessage.id)) {
                            console.warn(
                                "Realtime: Duplicate message ID detected and ignored:",
                                newMessage.id
                            );
                            return prev;
                        }

                        // 실시간 메시지는 항상 배열의 끝에 추가
                        const next = [...prev, newMessage];
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
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log(`채팅방 ${roomId} 구독 성공.`);
                }
            });

        return () => {
            cancelled = true;
            // useEffect 클린업 시 채널 구독을 확실히 해제하여 중복 구독 방지
            if (ch) {
                supabase.removeChannel(ch);
            }
        };
    }, [roomId]);

    const send = async () => {
        const text = inputRef.current?.value?.trim();
        if (!text) return;

        if (!userId) {
            console.error("로그인 후 전송할 수 있어요.");
            // 사용자에게 안내하기 위해 입력 필드 포커스 또는 에러 표시를 추가할 수 있습니다.
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
        // 부모(오른쪽 패널)가 높이를 갖고 있어야 합니다: 그 부모에 h-full 또는 h-[calc(100vh-헤더높이)] 적용
        <div className="h-full flex flex-col p-3">
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
                                // 💡 사용자 ID를 색상으로 구분
                                m.user_id === userId
                                    ? "text-green-500" // 내 메시지 (구분)
                                    : "text-blue-400" // 다른 사람 메시지 (구분)
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
                <div className="flex gap-2 ">
                    <input
                        ref={inputRef}
                        onKeyDown={onKeyDown}
                        // 💡 입력창 스타일 조정
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
                        onClick={send}
                        // 💡 버튼 스타일 조정
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
