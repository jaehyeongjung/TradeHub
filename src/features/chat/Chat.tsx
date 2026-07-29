"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { supabase } from "@/shared/lib/supabase-browser";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { sanitizeText } from "@/shared/lib/sanitize";
import { useAnonUserId } from "@/shared/hooks/useAnonUserId";
import { tintOf } from "@/shared/lib/color";
import { avatarOf } from "@/shared/lib/nickname";
import { kstDateStr } from "@/shared/lib/kst";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, MessageSquare, SmilePlus, X } from "lucide-react";

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

/** 같은 사람이 5분 안에 연달아 보낸 말은 한 묶음으로 본다 */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const TIME_FMT = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

function timeOf(iso: string): string {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? TIME_FMT.format(d) : "";
}

const DATE_FMT = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
});

/** 색만으로 사람을 구분하지 않게, 아바타는 항상 이름과 나란히 놓는다 */
function Avatar({ userId }: { userId: string }) {
    const { hue, initial } = avatarOf(userId);
    return (
        <span
            aria-hidden
            className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-caption font-bold text-[var(--text-secondary)]"
            style={{ background: tintOf(hue, 24) }}
        >
            {initial}
        </span>
    );
}
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
                className="underline decoration-current/40 underline-offset-2 hover:decoration-current break-anywhere">
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

    // 날짜 구분선과 말풍선 묶음은 앞 메시지와 비교해야 나온다
    const rows = useMemo(() => {
        const today = kstDateStr();
        return msgs.map((m, i) => {
            const prev = i > 0 ? msgs[i - 1] : null;
            const day = kstDateStr(new Date(m.created_at));
            const prevDay = prev ? kstDateStr(new Date(prev.created_at)) : null;
            const showDate = day !== prevDay;
            const gap = prev
                ? new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()
                : Infinity;
            return {
                m,
                showDate,
                dateLabel: day === today
                    ? (isEn ? "Today" : "오늘")
                    : DATE_FMT.format(new Date(m.created_at)),
                grouped: !showDate && prev?.user_id === m.user_id && gap < GROUP_WINDOW_MS,
            };
        });
    }, [msgs, isEn]);

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
        [
        "bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]",
        "caret-[var(--color-brand)] ring-1 ring-transparent",
        "hover:ring-[var(--border-default)]",
        "focus:ring-2 focus:ring-[var(--color-brand)] focus:hover:ring-[var(--color-brand)]",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:ring-transparent",
    ].join(" ");
    const msgAreaBg = "bg-[var(--surface-sunken)]";

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
                            className={`flex-1 py-2 rounded-control text-[var(--text-on-fill)] text-xs font-bold transition-all ${
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
                            className={`flex-1 py-2 rounded-control text-[var(--text-on-fill)] text-xs font-bold transition-all ${
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
                    {rows.length > 0 ? (
                        <div className="pb-1">
                            {rows.map(({ m, showDate, dateLabel, grouped }) => {
                                const userChoice = positionsMap[m.user_id];
                                const isMe = m.user_id === userId;
                                const identity = identityFor?.(m.user_id);
                                // 주식 방은 층 배지, 대시보드는 기존 L/S 배지
                                const badge = identity?.badge
                                    ?? (userChoice
                                        ? { label: userChoice === "long" ? "L" : "S", tone: userChoice === "long" ? "up" as const : "down" as const }
                                        : null);
                                const name = identity?.name ?? m.user_id.slice(0, 6);
                                const msgReactions = reactions[m.id] ?? {};
                                const hasReactions = Object.values(msgReactions).some((r) => r.count > 0);
                                const isPickerOpen = pickerOpenId === m.id;

                                // 꼬리는 말풍선 묶음의 첫 장에만 — 카톡·당근이 쓰는 규칙
                                const bubble = isMe
                                    ? `bg-[var(--color-brand-strong)] text-[var(--text-on-fill)] ${grouped ? "rounded-card" : "rounded-card rounded-tr-tail"}`
                                    : `bg-[var(--surface-input)] text-[var(--text-primary)] ${grouped ? "rounded-card" : "rounded-card rounded-tl-tail"}`;

                                const reactionButton = (
                                    <span className="relative shrink-0">
                                        <button
                                            onClick={() => openPicker(m.id, isPickerOpen)}
                                            aria-label={isEn ? "Add reaction" : "반응 남기기"}
                                            aria-expanded={isPickerOpen}
                                            className={`grid h-7 w-7 place-items-center rounded-full transition-colors cursor-pointer ${
                                                isPickerOpen
                                                    ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                                                    : "text-[var(--text-disabled)] hover:bg-[var(--surface-input)] hover:text-[var(--text-secondary)]"
                                            }`}
                                        >
                                            <SmilePlus size={14} strokeWidth={1.9} />
                                        </button>

                                        {/* 위로 열린다 — 최신 메시지는 스크롤 영역 맨 아래에 있어
                                            아래로 열면 잘린다 */}
                                        <AnimatePresence>
                                            {isPickerOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.92, y: 4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.92, y: 4 }}
                                                    transition={{ duration: 0.12 }}
                                                    className={`absolute bottom-full z-30 mb-1.5 flex items-center gap-0.5 rounded-card bg-[var(--surface-elevated)] px-2 py-1.5 ring-1 ring-[var(--border-default)] shadow-xl ${
                                                        isMe ? "left-0" : "right-0"
                                                    }`}
                                                >
                                                    {REACTION_EMOJIS.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => toggleReaction(m.id, emoji)}
                                                            aria-pressed={msgReactions[emoji]?.mine ?? false}
                                                            className="grid h-9 w-9 place-items-center rounded-control text-[17px] transition-transform cursor-pointer hover:scale-125 active:scale-110 hover:bg-[var(--surface-hover)]"
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
                                    </span>
                                );

                                const reactionPills = hasReactions && (
                                    <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? "justify-end" : ""}`}>
                                        {REACTION_EMOJIS.filter((e) => (msgReactions[e]?.count ?? 0) > 0).map((emoji) => {
                                            const r = msgReactions[emoji];
                                            return (
                                                <button
                                                    key={emoji}
                                                    onClick={() => toggleReaction(m.id, emoji)}
                                                    aria-pressed={r.mine}
                                                    className={`flex items-center gap-1 rounded-chip px-2 py-[3px] text-caption ring-1 transition-colors cursor-pointer active:scale-95 ${
                                                        r.mine
                                                            ? "ring-[var(--color-brand)]/40 text-[var(--color-brand)]"
                                                            : "bg-[var(--surface-input)] ring-transparent text-[var(--text-tertiary)] hover:ring-[var(--border-default)]"
                                                    }`}
                                                    style={r.mine ? { background: tintOf("var(--color-brand)", 14) } : undefined}
                                                >
                                                    <span className="text-footnote">{emoji}</span>
                                                    <span className="font-bold tabular-nums">{r.count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );

                                const time = (
                                    <span className="shrink-0 pb-0.5 text-caption tabular-nums text-[var(--text-muted)]">
                                        {timeOf(m.created_at)}
                                    </span>
                                );

                                return (
                                    <div key={m.id}>
                                        {showDate && (
                                            <div className="flex items-center justify-center py-3">
                                                <span className="rounded-full bg-[var(--surface-input)] px-2.5 py-1 text-caption font-medium text-[var(--text-muted)]">
                                                    {dateLabel}
                                                </span>
                                            </div>
                                        )}

                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={grouped ? "mt-0.5" : "mt-3 first:mt-0"}
                                        >
                                            {isMe ? (
                                                <div className="flex justify-end pl-9">
                                                    <div className="flex max-w-[88%] flex-col items-end">
                                                        <div className="flex items-end gap-1">
                                                            {reactionButton}
                                                            {time}
                                                            <div className={`min-w-0 px-3 py-2 text-body break-anywhere whitespace-pre-wrap ${bubble}`}>
                                                                {linkify(m.content)}
                                                            </div>
                                                        </div>
                                                        {reactionPills}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    {grouped ? (
                                                        <span className="w-7 shrink-0" />
                                                    ) : (
                                                        <Avatar userId={m.user_id} />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        {!grouped && (
                                                            <div className="mb-1 flex items-center gap-1.5">
                                                                {badge && (
                                                                    <span
                                                                        className="text-caption font-bold tabular-nums"
                                                                        style={{ color: BADGE_TONE[badge.tone] }}
                                                                    >
                                                                        {badge.label}
                                                                    </span>
                                                                )}
                                                                <span className="truncate text-caption font-semibold text-[var(--text-tertiary)]">
                                                                    {name}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-end gap-1">
                                                            <div className={`min-w-0 max-w-[88%] px-3 py-2 text-body break-anywhere whitespace-pre-wrap ${bubble}`}>
                                                                {linkify(m.content)}
                                                            </div>
                                                            {time}
                                                            {reactionButton}
                                                        </div>
                                                        {reactionPills}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-input)] text-[var(--text-disabled)]">
                                <MessageSquare size={20} strokeWidth={1.8} />
                            </span>
                            <p className="text-center text-footnote leading-relaxed text-[var(--text-muted)]">
                                {isEn ? (
                                    <>No messages yet.<br />Be the first to say something.</>
                                ) : (
                                    <>아직 아무도 말을 걸지 않았어요.<br />첫 마디를 남겨보세요.</>
                                )}
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
                        className={`h-11 min-w-0 flex-1 rounded-full px-4 text-[16px] sm:text-label focus:outline-none transition-all duration-150 ${inputBg}`}
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
                                ? "bg-[var(--color-brand-strong)] text-[var(--text-on-fill)] hover:opacity-92 cursor-pointer"
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
