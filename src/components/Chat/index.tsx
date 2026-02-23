"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase-browser";
import { sanitizeText } from "@/lib/sanitize";
import { AnimatePresence, motion } from "framer-motion";

interface PostgrestError {
    message: string;
    details: string | null;
    hint: string | null;
    code: string;
}
type PostgrestSingleResponse<T> = {
    data: T | null;
    error: PostgrestError | null;
    status: number;
    statusText: string;
};
interface PayloadObject {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    room_id: string;
    day?: string;
    choice?: "long" | "short";
}
type Msg = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    room_id?: string;
};
type Position = {
    user_id: string;
    choice: "long" | "short";
    day: string;
    room_id: string;
};
type Ratio = {
    long_count: number;
    short_count: number;
    total: number;
    long_ratio: number;
};

function todayKstDateStr() {
    const nowKST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    const yyyy = nowKST.getFullYear();
    const mm = String(nowKST.getMonth() + 1).padStart(2, "0");
    const dd = String(nowKST.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

async function fetchRatio(roomId: string): Promise<Ratio> {
    const { data, error } = await supabase.rpc("get_long_short_ratio", { p_room_id: roomId });
    if (error) throw error;
    return (data?.[0] as Ratio) ?? { long_count: 0, short_count: 0, total: 0, long_ratio: 0 };
}

function linkify(text: string): ReactNode[] {
    const parts: ReactNode[] = [];
    const regex = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
        const start = m.index;
        if (start > lastIndex) parts.push(text.slice(lastIndex, start));
        const raw = m[0];
        const stripped = raw.replace(/[),.;!?]+$/g, "");
        const trailing = raw.slice(stripped.length);
        const href = stripped.startsWith("http") ? stripped : `https://${stripped}`;
        parts.push(
            <a key={`${start}-${href}`} href={href} target="_blank" rel="noreferrer"
                className="underline hover:text-emerald-300 break-anywhere">
                {stripped}
            </a>
        );
        if (trailing) parts.push(trailing);
        lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
}

export default function Chat({ roomId = "lobby", fadeDelay = 0 }: { roomId?: string; fadeDelay?: number }) {
    const [userId, setUserId] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_isAnonymous, setIsAnonymous] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isLight, setIsLight] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const userIdRef = useRef<string | null>(null);

    useEffect(() => {
        const check = () => setIsLight(document.documentElement.classList.contains("light"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => { userIdRef.current = userId; }, [userId]);

    const composingRef = useRef(false);
    const sendingRef = useRef(false);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: listRef.current!.scrollHeight, behavior: "smooth" });
        });
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
            if (s?.user) {
                setUserId(s.user.id);
                setIsAnonymous(s.user.is_anonymous ?? false);
            } else {
                const { data: anonData } = await supabase.auth.signInAnonymously();
                setUserId(anonData?.user?.id ?? null);
                setIsAnonymous(true);
            }
        });
        (async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setUserId(data.session.user.id);
                setIsAnonymous(data.session.user.is_anonymous ?? false);
            } else {
                const { data: anonData } = await supabase.auth.signInAnonymously();
                setUserId(anonData?.user?.id ?? null);
                setIsAnonymous(true);
            }
        })();
        return () => subscription.unsubscribe();
    }, []);

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
                requestAnimationFrame(() => { listRef.current?.scrollTo({ top: listRef.current!.scrollHeight }); });
            }
            setInitialLoading(false);
        })();
    }, [roomId]);

    useEffect(() => {
        const channelName = `room:${roomId}`;
        supabase.getChannels().filter((c) => c.topic === channelName).forEach((c) => supabase.removeChannel(c));
        const ch = supabase.channel(channelName)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
                (payload) => {
                    const newMsg = payload.new as Msg;
                    if (!newMsg?.id) return;
                    setMsgs((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        const next = [...prev, newMsg];
                        if (listRef.current) {
                            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
                            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
                            if (isAtBottom) scrollToBottom();
                            else if (newMsg.user_id !== userIdRef.current) setUnreadCount((c) => c + 1);
                        } else scrollToBottom();
                        return next;
                    });
                })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [roomId]);

    const send = async () => {
        if (sendingRef.current) return;
        sendingRef.current = true;
        try {
            const text = sanitizeText(inputRef.current?.value ?? "", 2000);
            if (!text) return;
            if (!userIdRef.current) {
                await new Promise(resolve => setTimeout(resolve, 300));
                if (!userIdRef.current) await new Promise(resolve => setTimeout(resolve, 500));
            }
            if (!userIdRef.current) return;
            const { data, error } = await supabase
                .from("messages")
                .insert([{ room_id: roomId, user_id: userIdRef.current, content: text }])
                .select().single();
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
            setTimeout(() => (sendingRef.current = false), 0);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (composingRef.current) return;
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter") { e.preventDefault(); void send(); }
    };

    const [myChoice, setMyChoice] = useState<"long" | "short" | null>(null);
    const [ratio, setRatio] = useState<Ratio>({ long_count: 0, short_count: 0, total: 0, long_ratio: 0 });
    const [loadingChoice, setLoadingChoice] = useState(true);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [positionsMap, setPositionsMap] = useState<Record<string, "long" | "short">>({});

    const handleScroll = () => {
        if (!listRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };

    const handleScrollBtnClick = () => { scrollToBottom(); setUnreadCount(0); };

    useEffect(() => { fetchRatio(roomId).then(setRatio).catch(() => {}); }, [roomId]);

    useEffect(() => {
        if (!userId) { setMyChoice(null); setLoadingChoice(false); return; }
        (async () => {
            const response = (await supabase.from("positions").select("choice")
                .eq("room_id", roomId).eq("day", todayKstDateStr()).eq("user_id", userId)
                .maybeSingle()) as PostgrestSingleResponse<{ choice: "long" | "short" } | null>;
            if (response.data) setMyChoice(response.data.choice);
            setLoadingChoice(false);
        })();
    }, [userId, roomId]);

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase.from("positions").select("user_id, choice")
                .eq("room_id", roomId).eq("day", todayKstDateStr());
            if (!error && data) {
                const map: Record<string, "long" | "short"> = {};
                (data as Position[]).forEach((p) => (map[p.user_id] = p.choice));
                setPositionsMap(map);
            }
        })();
    }, [roomId]);

    useEffect(() => {
        const ch = supabase.channel(`positions:${roomId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "positions", filter: `room_id=eq.${roomId}` },
                async (payload) => {
                    const today = todayKstDateStr();
                    const newPayload = payload.new as PayloadObject | null;
                    const oldPayload = payload.old as PayloadObject | null;
                    if (newPayload?.day !== today && oldPayload?.day !== today) return;
                    if (newPayload?.user_id && newPayload?.choice) {
                        setPositionsMap((prev) => ({ ...prev, [newPayload.user_id]: newPayload.choice! }));
                    }
                    const r = await fetchRatio(roomId);
                    setRatio(r);
                })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [roomId]);

    const choose = async (choice: "long" | "short") => {
        if (!userId) return;
        const day = todayKstDateStr();
        const { error } = await supabase.from("positions")
            .upsert([{ user_id: userId, room_id: roomId, day, choice }], { onConflict: "user_id,room_id,day" });
        if (error) return;
        setMyChoice(choice);
        setPositionsMap((prev) => ({ ...prev, [userId]: choice }));
        fetchRatio(roomId).then(setRatio).catch(() => {});
    };

    const longPct = Math.round(ratio.long_ratio * 100);
    const shortPct = 100 - longPct;

    // 스타일 변수
    const headerBg = isLight ? "bg-white border-neutral-200" : "bg-neutral-900 border-neutral-800";
    const labelColor = isLight ? "text-neutral-500" : "text-neutral-500";
    const pillBg = isLight ? "bg-neutral-100 text-neutral-600" : "bg-neutral-800 text-neutral-400";
    const inputBg = isLight
        ? "border-neutral-200 bg-neutral-50 text-neutral-800 placeholder-neutral-400 focus:border-emerald-400"
        : "border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-600 focus:border-emerald-500";
    const msgAreaBg = isLight ? "bg-neutral-50" : "";
    const emptyTextColor = isLight ? "text-neutral-400" : "text-neutral-600";

    return (
        <div
            className={`h-full flex flex-col w-full transition-[opacity,transform] duration-700 ${initialLoading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
            style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
            {/* 포지션 헤더 */}
            <div className={`mb-2 rounded-2xl border p-3 2xl:p-4 ${headerBg}`}>
                {/* 상단: 내 포지션 + 참여 수 */}
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${labelColor}`}>포지션</span>
                        {loadingChoice && userId ? (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${pillBg}`}>로딩 중</span>
                        ) : myChoice ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                myChoice === "long"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-red-500/15 text-red-400"
                            }`}>
                                {myChoice === "long" ? "LONG" : "SHORT"}
                                <button
                                    onClick={() => setMyChoice(null)}
                                    className={`text-[8px] opacity-60 hover:opacity-100 transition-opacity cursor-pointer ml-0.5`}
                                >
                                    ✕
                                </button>
                            </span>
                        ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${pillBg}`}>미참여</span>
                        )}
                    </div>
                    <span className={`text-[9px] 2xl:text-[10px] ${labelColor}`}>
                        총 {ratio.total}명 참여
                    </span>
                </div>

                {/* 비율 바 */}
                <div className={`h-1.5 rounded-full overflow-hidden mb-1.5 ${isLight ? "bg-red-100" : "bg-red-500/20"}`}>
                    <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${longPct}%` }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                    />
                </div>
                <div className="flex justify-between">
                    <span className="text-[9px] font-medium text-emerald-400 tabular-nums">Long {longPct}%</span>
                    <span className="text-[9px] font-medium text-red-400 tabular-nums">Short {shortPct}%</span>
                </div>

                {/* Long/Short 버튼 */}
                {!myChoice && (
                    <div className="flex gap-2 mt-2.5">
                        <motion.button
                            whileHover={{ scale: userId ? 1.02 : 1 }}
                            whileTap={{ scale: userId ? 0.97 : 1 }}
                            disabled={!userId}
                            className={`flex-1 py-2 rounded-xl text-white text-xs font-bold transition-all ${
                                userId
                                    ? "bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
                                    : "bg-neutral-700 cursor-not-allowed opacity-50"
                            }`}
                            onClick={() => choose("long")}
                        >
                            Long
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: userId ? 1.02 : 1 }}
                            whileTap={{ scale: userId ? 0.97 : 1 }}
                            disabled={!userId}
                            className={`flex-1 py-2 rounded-xl text-white text-xs font-bold transition-all ${
                                userId
                                    ? "bg-red-600 hover:bg-red-500 cursor-pointer"
                                    : "bg-neutral-700 cursor-not-allowed opacity-50"
                            }`}
                            onClick={() => choose("short")}
                        >
                            Short
                        </motion.button>
                    </div>
                )}
            </div>

            {/* 메시지 리스트 */}
            <div className={`relative flex-1 min-h-0 rounded-2xl overflow-hidden ${msgAreaBg}`}>
                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 overflow-y-auto px-3 py-2 scrollbar-hide"
                >
                    {msgs.length > 0 ? (
                        <div className="space-y-0.5">
                            {msgs.map((m) => {
                                const userChoice = positionsMap[m.user_id];
                                const isMe = m.user_id === userId;
                                const nameColor = isMe
                                    ? isLight ? "text-teal-600" : "text-teal-400"
                                    : isLight ? "text-neutral-500" : "text-neutral-500";
                                const contentColor = isLight ? "text-neutral-700" : "text-neutral-300";

                                return (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex items-baseline gap-1.5 py-[3px] min-w-0"
                                    >
                                        {/* 포지션 pill */}
                                        {userChoice ? (
                                            <span className={`text-[8px] font-bold px-1 py-[1px] rounded shrink-0 leading-none ${
                                                userChoice === "long"
                                                    ? "bg-emerald-500/15 text-emerald-400"
                                                    : "bg-red-500/15 text-red-400"
                                            }`}>
                                                {userChoice === "long" ? "L" : "S"}
                                            </span>
                                        ) : (
                                            <span className="w-[14px] shrink-0" />
                                        )}
                                        {/* 이름 */}
                                        <span className={`text-[11px] font-semibold shrink-0 ${nameColor}`}>
                                            {isMe ? "나" : m.user_id.slice(0, 6)}
                                        </span>
                                        {/* 구분자 */}
                                        <span className={`text-[10px] shrink-0 ${isLight ? "text-neutral-300" : "text-neutral-700"}`}>·</span>
                                        {/* 내용 */}
                                        <span className={`text-[12px] whitespace-pre-wrap break-anywhere ${contentColor}`}>
                                            {linkify(m.content)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className={`text-[11px] text-center px-4 leading-relaxed ${emptyTextColor}`}>
                                아직 메시지가 없어요.<br />오늘의 첫 포지션을 잡고 이야기해보세요!
                            </p>
                        </div>
                    )}
                </div>

                {/* 스크롤 다운 버튼 */}
                <AnimatePresence>
                    {showScrollBtn && (
                        <motion.button
                            initial={{ opacity: 0, y: 8, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.92 }}
                            transition={{ duration: 0.18 }}
                            onClick={handleScrollBtnClick}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800/95 border border-neutral-700 text-neutral-200 text-[11px] font-medium shadow-lg backdrop-blur-sm hover:bg-neutral-700 transition-colors cursor-pointer z-20"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            {unreadCount > 0 ? `새 메시지 ${unreadCount}개` : "최신으로"}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* 입력바 */}
            <div className={`pt-3 pb-1 px-1 border-t mt-3 ${isLight ? "border-neutral-200" : "border-neutral-800"}`}>
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        onCompositionStart={() => (composingRef.current = true)}
                        onCompositionEnd={() => (composingRef.current = false)}
                        onKeyDown={onKeyDown}
                        className={`flex-1 border px-3 py-2 rounded-xl text-[12px] focus:outline-none transition-colors ${inputBg}`}
                        placeholder="익명으로도 채팅 가능"
                        maxLength={2000}
                        disabled={!userId}
                    />
                    <motion.button
                        whileHover={{ scale: userId ? 1.02 : 1 }}
                        whileTap={{ scale: userId ? 0.97 : 1 }}
                        type="button"
                        onClick={send}
                        className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                            userId
                                ? "bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                                : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                        }`}
                        disabled={!userId}
                    >
                        전송
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
