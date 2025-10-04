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
                        
                        // ⭐️ 핵심 수정: 서버 에코(내가 보낸 메시지)는 Realtime으로 처리하지 않고,
                        // 오직 다른 사용자(user_id !== userId)의 메시지만 처리합니다.
                        // 내 메시지는 아래 send 함수에서 직접 처리합니다.
                        // (단, 현재 send 함수는 Realtime에 의존하고 있으므로 이 로직을 변경합니다.)

                        // Realtime으로 들어온 메시지가 현재 사용자 ID와 일치하면 무시
                        // 이렇게 하면 Local Echo 또는 Server Echo로 인한 이중 처리를 막습니다.
                        // if (newMessage.user_id === userId) {
                        //     // console.log("Ignoring own message from Realtime.");
                        //     return prev;
                        // }
                        
                        // DB에서 Local Echo가 켜져 있다면, 내가 보낸 메시지도 Realtime으로 돌아옵니다.
                        // 가장 안전한 방법은 ID 중복 체크를 유지하는 것입니다.
                        if (!newMessage || !newMessage.id) return prev;
                        const exists = prev.some(m => m.id === newMessage.id);

                        if (exists) {
                            return prev;
                        }

                        // 실시간 메시지는 항상 배열의 끝에 추가
                        const next = [...prev, newMessage];
                        
                        // 스크롤 이동 로직
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
                if (status === 'SUBSCRIBED') {
                    console.log(`채팅방 ${roomId} 구독 성공.`);
                }
            });

        return () => {
            cancelled = true;
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
            return; 
        }

        // ⭐️ 추가: 메시지 전송 시 응답으로 데이터를 받지 않도록 'minimal'을 사용하고,
        // 대신 Realtime 리스너가 처리하도록 합니다. (중복 방지를 위한 표준 방법)
        const { data, error } = await supabase
            .from("messages")
            .insert([{ room_id: roomId, user_id: userId, content: text }])
            .select() // Realtime 대신 직접 응답을 받으려면 select를 사용해야 합니다.
            .single(); // 단일 객체로 받기

        // ⭐️ 만약 Realtime 리스너를 완전히 신뢰하지 않는다면, 이 시점에서 로컬에 직접 추가합니다.
        // 현재 로직은 Realtime에 의존하므로, 중복 체크 로직만 유지합니다.

        if (error) {
             console.error("메시지 전송 실패:", error);
        } else if (data) {
             // 성공적으로 전송되었고, ID를 포함한 데이터가 반환된 경우 (Local Echo가 켜져 있다면 Realtime 이벤트와 중복 가능성 있음)
             // 여기서 직접 setMsgs를 호출하지 않고 Realtime 리스너에 의존합니다.
             // 만약 중복이 계속 발생한다면, Realtime 리스너에서 내 메시지(user_id === userId)를 명시적으로 무시하도록 변경해야 합니다.

            // Realtime 이벤트가 늦게 올 경우를 대비해, 여기서 임시로 추가하는 것도 고려할 수 있으나,
            // 현재 문제는 중복이므로 Realtime에 모든 처리를 맡깁니다.
        }

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
                        <span className="text-gray-200 whitespace-pre-wrap">{m.content}</span>
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
                        placeholder={userId ? "메시지 입력..." : "로그인 후 메시지를 전송할 수 있어요."}
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
