"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { motion } from "framer-motion";

// --- Types ---
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
  long_ratio: number; // 0~1
};

// --- Utils ---
function todayKstDateStr() {
  const nowKST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const yyyy = nowKST.getFullYear();
  const mm = String(nowKST.getMonth() + 1).padStart(2, "0");
  const dd = String(nowKST.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchRatio(roomId: string): Promise<Ratio> {
  const { data, error } = await supabase.rpc("get_long_short_ratio", {
    p_room_id: roomId,
  });
  if (error) throw error;
  return (
    (data?.[0] as Ratio) ?? {
      long_count: 0,
      short_count: 0,
      total: 0,
      long_ratio: 0,
    }
  );
}

/** 텍스트 내 URL 자동 감지 -> <a> 태그로 링크화 (안전: innerHTML 안 씀) */
function linkify(text: string): Array<string | JSX.Element> {
  const parts: Array<string | JSX.Element> = [];
  const regex = /((?:https?:\/\/|www\.)[^\s<]+)/gi; // 단순 URL 감지
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    const start = m.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));

    // 매치 문자열에서 문장부호 꼬리 제거
    const raw = m[0];
    const stripped = raw.replace(/[),.;!?]+$/g, "");
    const trailing = raw.slice(stripped.length);

    const href = stripped.startsWith("http")
      ? stripped
      : `https://${stripped}`;

    parts.push(
      <a
        key={`${start}-${href}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-emerald-300 break-anywhere"
      >
        {stripped}
      </a>
    );

    if (trailing) parts.push(trailing);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function Chat({ roomId = "lobby" }: { roomId?: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

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

  // session
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

  // initial messages
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

  // realtime messages
  useEffect(() => {
    const channelName = `room:${roomId}`;
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
          // 내가 방금 보낸 건 로컬 에코로 이미 반영됨
          if (newMsg.user_id === userIdRef.current) return;

          setMsgs((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev; // 중복 방지
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
    if (sendingRef.current) return;
    sendingRef.current = true;

    try {
      const text = inputRef.current?.value?.trim();
      if (!text || !userIdRef.current) return;

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
      setTimeout(() => (sendingRef.current = false), 0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (composingRef.current) return;
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      void send();
    }
  };

  // ----- Long/Short header state -----
  const [myChoice, setMyChoice] = useState<"long" | "short" | null>(null);
  const [ratio, setRatio] = useState<Ratio>({
    long_count: 0,
    short_count: 0,
    total: 0,
    long_ratio: 0,
  });
  const [loadingChoice, setLoadingChoice] = useState(true);

  // always load ratio (even when logged out)
  useEffect(() => {
    fetchRatio(roomId)
      .then(setRatio)
      .catch(() => {});
  }, [roomId]);

  // load my choice (only when logged in)
  useEffect(() => {
    if (!userId) {
      setMyChoice(null);
      setLoadingChoice(false);
      return;
    }
    const init = async () => {
      const response = (await supabase
        .from("positions")
        .select("choice")
        .eq("room_id", roomId)
        .eq("day", todayKstDateStr())
        .eq("user_id", userId)
        .maybeSingle()) as PostgrestSingleResponse<{
        choice: "long" | "short";
      } | null>;

      const mine = response.data;
      if (mine) setMyChoice(mine.choice);
      setLoadingChoice(false);
    };
    init();
  }, [userId, roomId]);

  // nickname tags map
  const [positionsMap, setPositionsMap] = useState<
    Record<string, "long" | "short">
  >({});

  useEffect(() => {
    const loadPositions = async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("user_id, choice")
        .eq("room_id", roomId)
        .eq("day", todayKstDateStr());
      if (!error && data) {
        const map: Record<string, "long" | "short"> = {};
        (data as Position[]).forEach((p) => (map[p.user_id] = p.choice));
        setPositionsMap(map);
      }
    };
    loadPositions();
  }, [roomId]);

  useEffect(() => {
    const ch = supabase
      .channel(`positions:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "positions",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const today = todayKstDateStr();
          const newPayload = payload.new as PayloadObject | null;
          const oldPayload = payload.old as PayloadObject | null;
          const newDay = newPayload?.day;
          const oldDay = oldPayload?.day;
          if (newDay !== today && oldDay !== today) return;

          if (newPayload?.user_id && newPayload?.choice) {
            setPositionsMap((prev) => ({
              ...prev,
              [newPayload.user_id]: newPayload.choice!,
            }));
          }
          const r = await fetchRatio(roomId);
          setRatio(r);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [roomId]);

  const choose = async (choice: "long" | "short") => {
    if (!userId) return;
    const day = todayKstDateStr();
    const { error } = await supabase
      .from("positions")
      .upsert([{ user_id: userId, room_id: roomId, day, choice }], {
        onConflict: "user_id,room_id,day",
      });
    if (error) {
      console.error("vote error", error);
      return;
    }
    setMyChoice(choice);
    setPositionsMap((prev) => ({ ...prev, [userId]: choice }));
  };

  const longPct = Math.round(ratio.long_ratio * 100);

  return (
    <>
      {/* Scrollbar Hide + long-word wrap utility */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .scrollbar-hide::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none; }
            .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
            /* 긴 URL/토큰 줄바꿈 강제 */
            .break-anywhere { overflow-wrap: anywhere; word-break: break-word; }
          `,
        }}
      />
      <div className="h-full flex flex-col p-3 text-white w-full">
        {/* 헤더 */}
        <div className="mb-3 rounded-xl border border-neutral-700 bg-neutral-900/80 p-3 space-y-2 shadow-lg">
          <div className="flex justify-between items-center text-[12px]">
            <div>
              {loadingChoice && userId ? (
                <span className="text-neutral-400">포지션 로딩중...</span>
              ) : (
                <span className="font-semibold">
                  My Position:{" "}
                  <b
                    className={
                      myChoice === "long"
                        ? "text-green-400"
                        : myChoice === "short"
                        ? "text-red-400"
                        : "text-neutral-400"
                    }
                  >
                    {myChoice ? myChoice.toUpperCase() : "—"}
                  </b>
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-400 bg-neutral-800 px-2 py-[2px] rounded-full">
              총 {ratio.total}명 참여
            </div>
          </div>

          {/* 게이지 */}
          <div className="relative w-full h-[10px] rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-red-600" />
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${longPct}%` }}
              transition={{ duration: 0.45 }}
            />
            {ratio.total === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[7px] font-bold text-neutral-500"></div>
            )}
          </div>

          {!myChoice && (
            <div className="flex gap-2 pt-1">
              <motion.button
                whileHover={{ scale: userId ? 1.02 : 1 }}
                whileTap={{ scale: userId ? 0.98 : 1 }}
                disabled={!userId}
                className={`px-3 py-[6px] rounded-lg text-white text-[12px] font-semibold flex-1 shadow-md transition-colors ${
                  userId
                    ? "bg-green-700 hover:bg-green-600 active:bg-green-800"
                    : "bg-neutral-700 cursor-not-allowed opacity-60"
                }`}
                onClick={() => choose("long")}
              >
                Long
              </motion.button>
              <motion.button
                whileHover={{ scale: userId ? 1.02 : 1 }}
                whileTap={{ scale: userId ? 0.98 : 1 }}
                disabled={!userId}
                className={`px-3 py-[6px] rounded-lg text-white text-[12px] font-semibold flex-1 shadow-md transition-colors ${
                  userId
                    ? "bg-red-700 hover:bg-red-600 active:bg-red-800"
                    : "bg-neutral-700 cursor-not-allowed opacity-60"
                }`}
                onClick={() => choose("short")}
              >
                Short
              </motion.button>
            </div>
          )}
        </div>

        {/* 메시지 리스트 */}
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 pb-2 scrollbar-hide"
        >
          {msgs.map((m) => {
            const userChoice = positionsMap[m.user_id];
            const tag = userChoice ? `[${userChoice.toUpperCase()}] ` : "";
            const nameColor =
              m.user_id === userId ? "text-yellow-300" : "text-blue-400";
            const tagColor =
              userChoice === "long"
                ? "text-green-400 font-semibold"
                : userChoice === "short"
                ? "text-red-400 font-semibold"
                : "text-neutral-500";

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-[13px] border border-neutral-800 rounded-lg px-3 py-2 bg-neutral-900 shadow-sm min-w-0 max-w-full"
              >
                <b className={`${nameColor} text-[13px]`}>
                  <span className={tagColor}>{tag}</span>
                  {m.user_id === userId ? "나 (Me)" : m.user_id.slice(0, 8)}
                </b>
                <span className="mx-2 text-neutral-600">·</span>
                <span className="text-neutral-300 text-[13px] whitespace-pre-wrap break-anywhere">
                  {linkify(m.content)}
                </span>
              </motion.div>
            );
          })}
          {!msgs.length && (
            <div className="text-[12px] text-neutral-500 text-center py-4">
              아직 메시지가 없습니다. 오늘의 첫 포지션을 잡고 메시지를 남겨보세요!
            </div>
          )}
        </div>

        {/* 입력바 */}
        <div className="border-t border-neutral-800 pt-1">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              onCompositionStart={() => (composingRef.current = true)}
              onCompositionEnd={() => (composingRef.current = false)}
              onKeyDown={onKeyDown}
              className="flex-1 border border-neutral-700 px-3 py-2 rounded-lg bg-neutral-900 text-gray-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-400 text-[14px] shadow-inner"
              placeholder={
                userId
                  ? "채팅을 시작하세요."
                  : "로그인 후 메시지를 전송할 수 있어요."
              }
              maxLength={2000}
              disabled={!userId}
            />
            <motion.button
              whileHover={{ scale: userId ? 1.04 : 1 }}
              whileTap={{ scale: userId ? 0.96 : 1 }}
              type="button"
              onClick={send}
              className={`px-3 py-2 rounded-lg transition duration-150 text-[12px] font-bold shadow ${
                userId
                  ? "bg-emerald-500 text-white hover:bg-emerald-500 active:bg-blue-700 cursor-pointer"
                  : "bg-neutral-700 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!userId}
            >
              전송
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}
