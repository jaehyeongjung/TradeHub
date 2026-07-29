"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { supabase } from "@/shared/lib/supabase-browser";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { sanitizeText } from "@/shared/lib/sanitize";
import { useAnonUserId } from "@/shared/hooks/useAnonUserId";
import { tintOf } from "@/shared/lib/color";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, SmilePlus, X } from "lucide-react";

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
type Reaction = { count: number; mine: boolean };
type ReactionsState = Record<string, Record<string, Reaction>>;

/** 메시지 작성자를 어떻게 보여줄지. 방마다 다른 규칙을 주입할 수 있게 뺐다. */
export type ChatIdentity = {
    name: string;
    badge?: { label: string; tone: "up" | "down" | "info" | "neutral" };
};

// 배지는 전부 작은 글씨라 면용이 아닌 글자용 색을 쓴다 (라이트모드 대비)
const BADGE_TONE: Record<NonNullable<ChatIdentity["badge"]>["tone"], string> = {
    up: "var(--color-up-text)",
    down: "var(--color-down-text)",
    info: "var(--color-info)",
    neutral: "var(--text-tertiary)",
};

const REACTION_HINT_KEY = "th-chat-reaction-hint";

const REACTION_EMOJIS = ["👍", "❤️", "🚀", "😂", "🔥"] as const;
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
                className="underline decoration-[var(--border-strong)] hover:decoration-[var(--color-accent)] hover:text-[var(--color-up-text)] break-anywhere">
                {stripped}
            </a>
        );
        if (trailing) parts.push(trailing);
        lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
}

export function Chat({
    roomId = "lobby",
    fadeDelay = 0,
    header,
    identityFor,
}: {
    roomId?: string;
    fadeDelay?: number;
    /** 넘기면 기본 롱·숏 패널을 대체한다 (관련 쿼리와 구독도 함께 끈다) */
    header?: ReactNode;
    /** 넘기면 user_id 앞 6자리 대신 이 규칙으로 이름·배지를 그린다 */
    identityFor?: (userId: string) => ChatIdentity;
}) {
    // 롱·숏 패널은 기본값일 때만 돈다. 주식 방은 층 패널이 그 자리를 쓴다.
    const useLongShort = header === undefined;
    const userId = useAnonUserId();
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [mounted, setMounted] = useState(false);
    // 네트워크와 무관하게 반드시 실행된다 — 이 값으로만 표시 여부를 정한다
    useEffect(() => { setMounted(true); }, []);
    const pathname = usePathname();
    const isEn = pathname.startsWith("/en/");
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const userIdRef = useRef<string | null>(null);

    useEffect(() => { userIdRef.current = userId; }, [userId]);

    const composingRef = useRef(false);
    const sendingRef = useRef(false);
    // 보낼 게 있는지만 본다. 값을 state로 올리면 한 글자마다 리렌더된다.
    const [hasText, setHasText] = useState(false);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: listRef.current!.scrollHeight, behavior: "smooth" });
        });
    };

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
                fetchReactions(data.map((m) => m.id), userIdRef.current);
            }
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

    const buildReactionsState = (
        rows: { message_id: string; user_id: string; emoji: string }[],
        uid: string | null,
    ): ReactionsState => {
        const state: ReactionsState = {};
        for (const r of rows) {
            if (!state[r.message_id]) state[r.message_id] = {};
            if (!state[r.message_id][r.emoji]) state[r.message_id][r.emoji] = { count: 0, mine: false };
            state[r.message_id][r.emoji].count++;
            if (uid && r.user_id === uid) state[r.message_id][r.emoji].mine = true;
        }
        return state;
    };

    const fetchReactions = async (messageIds: string[], uid: string | null) => {
        if (!messageIds.length) return;
        const { data } = await supabase
            .from("message_reactions")
            .select("message_id, user_id, emoji")
            .in("message_id", messageIds);
        if (data) setReactions(buildReactionsState(data, uid));
    };

    const toggleReaction = async (messageId: string, emoji: string) => {
        if (!userIdRef.current) return;
        const uid = userIdRef.current;
        const isMine = reactions[messageId]?.[emoji]?.mine ?? false;

        setReactions((prev) => {
            const curr = prev[messageId]?.[emoji] ?? { count: 0, mine: false };
            const next = { count: Math.max(0, curr.count + (isMine ? -1 : 1)), mine: !isMine };
            return { ...prev, [messageId]: { ...(prev[messageId] ?? {}), [emoji]: next } };
        });
        setPickerOpenId(null);

        if (isMine) {
            await supabase.from("message_reactions")
                .delete()
                .eq("message_id", messageId)
                .eq("user_id", uid)
                .eq("emoji", emoji);
        } else {
            await supabase.from("message_reactions")
                .upsert([{ message_id: messageId, user_id: uid, emoji }], { onConflict: "message_id,user_id,emoji" });
        }
    };

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
            setHasText(false);
        } finally {
            setTimeout(() => (sendingRef.current = false), 0);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (composingRef.current) return;
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter") { e.preventDefault(); void send(); }
    };

    const [reactions, setReactions] = useState<ReactionsState>({});
    const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);

    // 반응 기능은 아이콘만으로는 여전히 못 보고 지나칠 수 있다.
    // 한 번 써 보면 아는 기능이라, 처음 한 번만 알려주고 이후로는 다시 띄우지 않는다.
    const [showReactionHint, setShowReactionHint] = useState(false);
    useEffect(() => {
        try {
            if (!localStorage.getItem(REACTION_HINT_KEY)) setShowReactionHint(true);
        } catch {
            // 프라이빗 모드 등에서 localStorage가 막히면 힌트를 띄우지 않는다
        }
    }, []);

    const dismissReactionHint = () => {
        setShowReactionHint(false);
        try {
            localStorage.setItem(REACTION_HINT_KEY, "1");
        } catch {
            // 저장 실패는 무시 — 다음 방문에 한 번 더 보일 뿐이다
        }
    };

    const openPicker = (messageId: string, isOpen: boolean) => {
        setPickerOpenId(isOpen ? null : messageId);
        if (showReactionHint) dismissReactionHint();
    };

    useEffect(() => {
        if (!pickerOpenId) return;
        const close = () => setPickerOpenId(null);
        document.addEventListener("click", close, { capture: true });
        return () => document.removeEventListener("click", close, { capture: true });
    }, [pickerOpenId]);

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

    useEffect(() => {
        if (!useLongShort) return;
        fetchRatio(roomId).then(setRatio).catch(() => {});
    }, [roomId, useLongShort]);

    useEffect(() => {
        if (!useLongShort) return;
        if (!userId) { setMyChoice(null); setLoadingChoice(false); return; }
        (async () => {
            const response = (await supabase.from("positions").select("choice")
                .eq("room_id", roomId).eq("day", todayKstDateStr()).eq("user_id", userId)
                .maybeSingle()) as PostgrestSingleResponse<{ choice: "long" | "short" } | null>;
            if (response.data) setMyChoice(response.data.choice);
            setLoadingChoice(false);
        })();
    }, [userId, roomId, useLongShort]);

    useEffect(() => {
        if (!useLongShort) return;
        (async () => {
            const { data, error } = await supabase.from("positions").select("user_id, choice")
                .eq("room_id", roomId).eq("day", todayKstDateStr());
            if (!error && data) {
                const map: Record<string, "long" | "short"> = {};
                (data as Position[]).forEach((p) => (map[p.user_id] = p.choice));
                setPositionsMap(map);
            }
        })();
    }, [roomId, useLongShort]);

    useEffect(() => {
        const ch = supabase.channel(`reactions:${roomId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" },
                async (payload) => {
                    const row = (payload.new ?? payload.old) as { message_id?: string; user_id?: string; emoji?: string } | null;
                    const messageId = row?.message_id;
                    if (!messageId) return;
                    const { data } = await supabase
                        .from("message_reactions")
                        .select("user_id, emoji")
                        .eq("message_id", messageId);
                    if (!data) return;
                    const emojiMap: Record<string, Reaction> = {};
                    for (const r of data) {
                        if (!emojiMap[r.emoji]) emojiMap[r.emoji] = { count: 0, mine: false };
                        emojiMap[r.emoji].count++;
                        if (r.user_id === userIdRef.current) emojiMap[r.emoji].mine = true;
                    }
                    setReactions((prev) => ({ ...prev, [messageId]: emojiMap }));
                })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [roomId]);

    useEffect(() => {
        if (!useLongShort) return;
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
    }, [roomId, useLongShort]);

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

    // 색은 전부 시맨틱 토큰으로 통일한다. isLight 분기 + Tailwind neutral 하드코딩 +
    // globals.css의 !important 오버라이드가 세 겹으로 겹쳐 라이트모드 결과를
    // 예측할 수 없었고, placeholder는 대비 2.2:1로 사실상 보이지 않았다.
    const headerBg = "bg-surface-input";
    const labelColor = "text-text-tertiary";
    const pillBg = "bg-surface-hover text-text-tertiary";
    const inputBg =
        "bg-surface-input text-text-primary placeholder-text-muted ring-1 ring-transparent focus:ring-[var(--color-brand)]";
    const msgAreaBg = "bg-[var(--surface-sunken)]";
    const emptyTextColor = "text-text-muted";

    return (
        <div
            className={`h-full flex flex-col w-full transition-[opacity,transform] duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
            {!useLongShort ? header : (
            <div className={`mb-2 rounded-card p-3 2xl:p-4 ${headerBg}`}>
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <span className={`text-caption font-medium ${labelColor}`}>{isEn ? "Position" : "포지션"}</span>
                        {loadingChoice && userId ? (
                            <span className={`text-caption px-2 py-0.5 rounded-full ${pillBg}`}>{isEn ? "Loading…" : "로딩 중"}</span>
                        ) : myChoice ? (
                            <span
                                className="text-caption font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                                style={{
                                    background: tintOf(
                                        myChoice === "long" ? "var(--color-up)" : "var(--color-down)",
                                        15,
                                    ),
                                    color:
                                        myChoice === "long"
                                            ? "var(--color-up-text)"
                                            : "var(--color-down-text)",
                                }}
                            >
                                {myChoice === "long" ? "LONG" : "SHORT"}
                                <button
                                    onClick={() => setMyChoice(null)}
                                    aria-label={isEn ? "Clear position" : "포지션 지우기"}
                                    className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer ml-0.5"
                                >
                                    <X size={9} strokeWidth={3} />
                                </button>
                            </span>
                        ) : (
                            <span className={`text-caption px-2 py-0.5 rounded-full ${pillBg}`}>{isEn ? "Not voted" : "미참여"}</span>
                        )}
                    </div>
                    <span className={`text-caption 2xl:text-caption ${labelColor}`}>
                        {isEn ? `${ratio.total} participants` : `총 ${ratio.total}명 참여`}
                    </span>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden mb-1.5 bg-[var(--color-down-muted)]">
                    <motion.div
                        className="h-full bg-[var(--color-up)] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${longPct}%` }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                    />
                </div>
                <div className="flex justify-between">
                    <span className="text-caption font-semibold text-[var(--color-up-text)] tabular-nums">Long {longPct}%</span>
                    <span className="text-caption font-semibold text-[var(--color-down-text)] tabular-nums">Short {shortPct}%</span>
                </div>

                {!myChoice && (
                    <div className="flex gap-2 mt-2.5">
                        <motion.button
                            whileHover={{ scale: userId ? 1.02 : 1 }}
                            whileTap={{ scale: userId ? 0.97 : 1 }}
                            disabled={!userId}
                            className={`flex-1 py-2 rounded-control text-white text-xs font-bold transition-all ${
                                userId
                                    ? "bg-[var(--color-up-text)] hover:opacity-90 cursor-pointer"
                                    : "bg-surface-hover cursor-not-allowed opacity-50"
                            }`}
                            onClick={() => choose("long")}
                        >
                            Long
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: userId ? 1.02 : 1 }}
                            whileTap={{ scale: userId ? 0.97 : 1 }}
                            disabled={!userId}
                            className={`flex-1 py-2 rounded-control text-white text-xs font-bold transition-all ${
                                userId
                                    ? "bg-[var(--color-down-text)] hover:opacity-90 cursor-pointer"
                                    : "bg-surface-hover cursor-not-allowed opacity-50"
                            }`}
                            onClick={() => choose("short")}
                        >
                            Short
                        </motion.button>
                    </div>
                )}
            </div>
            )}

            <div className={`relative flex-1 min-h-0 rounded-card overflow-hidden ${msgAreaBg}`}>
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
                                const identity = identityFor?.(m.user_id);
                                // 주식 방은 층 배지, 대시보드는 기존 L/S 배지
                                const badge = identity?.badge
                                    ?? (userChoice
                                        ? { label: userChoice === "long" ? "L" : "S", tone: userChoice === "long" ? "up" as const : "down" as const }
                                        : null);
                                // 이름에서 색을 빼고 굵기로만 나를 구분한다. 층 배지가 이미
                                // 색을 쓰고 있어 이름까지 물들이면 둘이 서로 경쟁한다.
                                const nameColor = isMe ? "text-text-primary" : "text-text-tertiary";
                                const contentColor = "text-text-secondary";
                                const msgReactions = reactions[m.id] ?? {};
                                const hasReactions = Object.values(msgReactions).some((r) => r.count > 0);
                                const isPickerOpen = pickerOpenId === m.id;

                                return (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="group relative py-[3px] min-w-0"
                                    >
                                        <div className="flex items-baseline gap-1.5">
                                            {identity ? (
                                                /* "8층 존버흑두루미" — 층을 닉네임에 붙여 한 덩어리로 읽히게 한다 */
                                                <span className="text-caption font-semibold shrink-0">
                                                    {badge && (
                                                        <span
                                                            className="tabular-nums"
                                                            style={{ color: BADGE_TONE[badge.tone] }}
                                                        >
                                                            {badge.label}{" "}
                                                        </span>
                                                    )}
                                                    <span className={nameColor}>{identity.name}</span>
                                                    {isMe && (
                                                        <span className="font-medium text-text-muted">
                                                            {isEn ? " (me)" : " (나)"}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <>
                                                    {/* 대시보드는 기존 L/S 배지. 폭을 고정해 이름이 세로로 정렬된다 */}
                                                    {badge ? (
                                                        <span
                                                            className="text-caption font-bold px-1 py-[1px] rounded shrink-0 leading-none tabular-nums text-center min-w-[26px]"
                                                            style={{
                                                                background: tintOf(BADGE_TONE[badge.tone]),
                                                                color: BADGE_TONE[badge.tone],
                                                            }}
                                                        >
                                                            {badge.label}
                                                        </span>
                                                    ) : (
                                                        <span className="w-[26px] shrink-0" />
                                                    )}
                                                    <span className={`text-caption font-semibold shrink-0 ${nameColor}`}>
                                                        {isMe ? (isEn ? "Me" : "나") : m.user_id.slice(0, 6)}
                                                    </span>
                                                </>
                                            )}
                                            <span className="text-caption shrink-0 text-[var(--border-strong)]">·</span>
                                            <span className={`text-footnote whitespace-pre-wrap break-anywhere flex-1 ${contentColor}`}>
                                                {linkify(m.content)}
                                            </span>
                                            {/* 예전엔 hover에서만 나타나는 "+"였다. 터치 기기엔 hover가 없어
                                                기능이 있는지조차 알 수 없었다. 항상 보이게 두고, 아이콘도
                                                "무언가 추가"가 아니라 "반응"으로 읽히는 것으로 바꿨다. */}
                                            <button
                                                onClick={() => openPicker(m.id, isPickerOpen)}
                                                aria-label={isEn ? "Add reaction" : "반응 남기기"}
                                                aria-expanded={isPickerOpen}
                                                className={`shrink-0 w-7 h-7 -my-1 flex items-center justify-center rounded-chip transition-colors cursor-pointer ${
                                                    isPickerOpen
                                                        ? "bg-surface-hover text-text-primary"
                                                        : "text-text-disabled hover:bg-surface-input hover:text-text-secondary"
                                                }`}
                                            >
                                                <SmilePlus size={14} strokeWidth={1.9} />
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {isPickerOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                                    transition={{ duration: 0.12 }}
                                                    className="absolute right-0 top-full mt-1 z-30 flex items-center gap-0.5 px-2 py-1.5 rounded-card bg-surface-elevated ring-1 ring-[var(--border-default)] shadow-xl"
                                                >
                                                    {REACTION_EMOJIS.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => toggleReaction(m.id, emoji)}
                                                            aria-pressed={msgReactions[emoji]?.mine ?? false}
                                                            className="w-9 h-9 flex items-center justify-center rounded-control text-headline transition-transform cursor-pointer hover:scale-125 active:scale-110 hover:bg-surface-hover"
                                                            style={
                                                                msgReactions[emoji]?.mine
                                                                    ? { background: tintOf("var(--color-brand)", 18) }
                                                                    : undefined
                                                            }
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {hasReactions && (
                                            <div className="flex flex-wrap gap-1 mt-1 pl-[32px]">
                                                {REACTION_EMOJIS.filter((e) => (msgReactions[e]?.count ?? 0) > 0).map((emoji) => {
                                                    const r = msgReactions[emoji];
                                                    return (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => toggleReaction(m.id, emoji)}
                                                            aria-pressed={r.mine}
                                                            className={`flex items-center gap-1 px-2 py-[3px] rounded-chip text-caption ring-1 transition-colors cursor-pointer active:scale-95 ${
                                                                r.mine
                                                                    ? "ring-[var(--color-brand)]/40 text-[var(--color-brand)]"
                                                                    : "bg-surface-input ring-transparent text-text-tertiary hover:ring-[var(--border-default)]"
                                                            }`}
                                                            style={
                                                                r.mine
                                                                    ? { background: tintOf("var(--color-brand)", 14) }
                                                                    : undefined
                                                            }
                                                        >
                                                            <span className="text-footnote">{emoji}</span>
                                                            <span className="font-semibold tabular-nums">{r.count}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className={`text-caption text-center px-4 leading-relaxed ${emptyTextColor}`}>
                                {isEn ? <>No messages yet.<br />Take a position and start the conversation!</> : <>아직 메시지가 없어요.<br />오늘의 첫 포지션을 잡고 이야기해보세요!</>}
                            </p>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showScrollBtn && (
                        <motion.button
                            initial={{ opacity: 0, y: 8, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.92 }}
                            transition={{ duration: 0.18 }}
                            onClick={handleScrollBtnClick}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-elevated ring-1 ring-[var(--border-default)] text-text-primary text-caption font-semibold shadow-lg hover:bg-surface-hover transition-colors cursor-pointer z-20"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            {unreadCount > 0 ? (isEn ? `${unreadCount} new` : `새 메시지 ${unreadCount}개`) : (isEn ? "Latest" : "최신으로")}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <div className="pt-3 pb-1 px-1 border-t border-border-subtle mt-3">
                {showReactionHint && msgs.length > 0 && (
                    <div className="mb-2 flex items-center gap-2 rounded-control bg-surface-input px-3 py-2">
                        <SmilePlus size={13} strokeWidth={1.9} className="shrink-0 text-text-muted" />
                        <span className="min-w-0 flex-1 text-caption leading-snug text-text-tertiary">
                            {isEn
                                ? "Tap the icon beside a message to react"
                                : "메시지 옆 아이콘을 누르면 이모지로 반응할 수 있어요"}
                        </span>
                        <button
                            type="button"
                            onClick={dismissReactionHint}
                            aria-label={isEn ? "Dismiss" : "닫기"}
                            className="shrink-0 rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text-secondary transition-colors cursor-pointer"
                        >
                            <X size={12} strokeWidth={2.2} />
                        </button>
                    </div>
                )}
                {/* 입력창은 알약, 전송은 원형 아이콘. "전송"이라는 글자 버튼은
                    메신저에서 쓰지 않는다 — 입력창 옆 화살표가 곧 보내기다. */}
                <div className="flex items-center gap-2">
                    {/* 모바일에서 16px 미만이면 iOS Safari가 포커스 시 화면을 확대한다 */}
                    <input
                        ref={inputRef}
                        onCompositionStart={() => (composingRef.current = true)}
                        onCompositionEnd={() => (composingRef.current = false)}
                        onChange={(e) => {
                            const filled = e.target.value.trim().length > 0;
                            setHasText((prev) => (prev === filled ? prev : filled));
                        }}
                        onKeyDown={onKeyDown}
                        className={`h-11 min-w-0 flex-1 rounded-full px-4 text-[16px] sm:text-label focus:outline-none transition-colors ${inputBg}`}
                        placeholder={isEn ? "Chat anonymously" : "익명으로도 채팅 가능"}
                        maxLength={2000}
                        disabled={!userId}
                    />
                    {/* 메신저의 관습: 보낼 내용이 있을 때만 버튼에 색이 든다.
                        비활성일 때도 면과 테두리를 남겨 버튼이 사라지지 않게 한다. */}
                    <button
                        type="button"
                        onClick={send}
                        aria-label={isEn ? "Send" : "전송"}
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all active:scale-95 ${
                            userId && hasText
                                ? "bg-[var(--color-brand-strong)] text-white hover:opacity-92 cursor-pointer"
                                : "bg-[var(--surface-hover)] text-[var(--text-muted)] ring-1 ring-[var(--border-default)] cursor-not-allowed active:scale-100"
                        }`}
                        disabled={!userId || !hasText}
                    >
                        <ArrowUp size={19} strokeWidth={2.6} />
                    </button>
                </div>
            </div>
        </div>
    );
}
