"use client";

import { supabase } from "@/shared/lib/supabase-browser";
import { sanitizeText } from "@/shared/lib/sanitize";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/shared/ui/Toast";

type Comment = {
    id: string;
    post_id: string;
    user_id: string;
    body: string;
    created_at: string;
};

const CustomModal: React.FC<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isConfirm: boolean;
    isLight: boolean;
}> = ({ message, onConfirm, onCancel, isConfirm, isLight }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); onConfirm(); }
        else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            ref={(el) => el?.focus()}
        >
            <motion.div
                initial={{ scale: 0.95, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 16 }}
                className={`rounded-2xl p-6 shadow-2xl max-w-sm w-full outline-none ${isLight ? "bg-white border border-neutral-200" : "bg-neutral-900 border border-neutral-800"}`}
            >
                <p className={`mb-6 text-sm leading-relaxed ${isLight ? "text-neutral-700" : "text-neutral-200"}`}>
                    {message}
                </p>
                <div className={`flex ${isConfirm ? "justify-between" : "justify-center"} gap-3`}>
                    {isConfirm && (
                        <button
                            onClick={onCancel}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isLight ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"}`}
                        >
                            취소
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        autoFocus
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        {isConfirm ? "확인" : "닫기"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export function Comments({
    postId,
    userId,
    isLight = false,
}: {
    postId: string;
    userId: string | null;
    isLight?: boolean;
}) {
    const { showToast } = useToast();
    const [list, setList] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<{
        message: string;
        isConfirm: boolean;
        onConfirm?: () => void;
    } | null>(null);

    const load = useCallback(async () => {
        setError(null);
        const { data, error: fetchError } = await supabase
            .from("comments")
            .select("id, post_id, user_id, body, created_at")
            .eq("post_id", postId)
            .order("created_at", { ascending: true });
        if (!fetchError && data) setList(data);
        else if (fetchError) setError("댓글 로드 실패: " + fetchError.message);
    }, [postId]);

    useEffect(() => {
        load();
        const channel = supabase
            .channel(`comments:${postId}`)
            .on("postgres_changes", { schema: "public", table: "comments", event: "INSERT", filter: `post_id=eq.${postId}` }, (payload) => {
                const newComment = payload.new as Comment;
                setList((prev) => prev.some((c) => c.id === newComment.id) ? prev : [...prev, newComment]);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [postId, load]);

    const add = async () => {
        if (!userId) { setModal({ message: "로그인이 필요합니다.", isConfirm: false }); return; }
        const sanitized = sanitizeText(text, 1000);
        if (!sanitized) return;
        setLoading(true);
        setError(null);
        const { data: inserted, error: insertError } = await supabase
            .from("comments")
            .insert([{ post_id: postId, user_id: userId, body: sanitized }])
            .select()
            .single();
        setLoading(false);
        if (insertError) { setModal({ message: "댓글 등록 실패: " + insertError.message, isConfirm: false }); return; }
        if (inserted) {
            setList((prev) => prev.some((c) => c.id === inserted.id) ? prev : [...prev, inserted as Comment]);
            showToast("댓글이 등록되었습니다");
        }
        setText("");
    };

    const remove = (id: string) => {
        setModal({
            message: "댓글을 삭제할까요?",
            isConfirm: true,
            onConfirm: async () => {
                setModal(null);
                const { error: deleteError } = await supabase.from("comments").delete().eq("id", id).eq("user_id", userId);
                if (deleteError) { setModal({ message: "댓글 삭제 실패: " + deleteError.message, isConfirm: false }); return; }
                setList((prev) => prev.filter((c) => c.id !== id));
                showToast("댓글이 삭제되었습니다");
            },
        });
    };

    const formatRelativeTime = (dateStr: string): string => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const s = Math.floor(diff / 1000);
        if (s < 60) return "방금";
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}분 전`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}시간 전`;
        const d = Math.floor(h / 24);
        if (d < 7) return `${d}일 전`;
        return new Date(dateStr).toLocaleDateString();
    };

    const dividerColor = isLight ? "border-neutral-100" : "border-neutral-800";
    const inputClass = `flex-1 rounded-xl px-3 py-2.5 text-sm placeholder-neutral-500 focus:outline-none transition ${
        isLight
            ? "bg-neutral-50 border border-neutral-200 text-neutral-800 focus:border-emerald-500"
            : "bg-neutral-800/50 border border-neutral-700/50 text-white focus:border-emerald-500"
    }`;
    const metaColor = isLight ? "text-neutral-400" : "text-neutral-500";
    const bodyTextClass = isLight ? "text-neutral-600" : "text-neutral-300";

    return (
        <div className={`flex flex-col gap-4 pt-4 border-t ${dividerColor}`}>
            <div className="flex items-center gap-2">
                <svg className={`w-3.5 h-3.5 ${metaColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className={`text-xs font-semibold ${isLight ? "text-neutral-700" : "text-neutral-200"}`}>
                    댓글 <span className={`font-normal ${metaColor}`}>{list.length}</span>
                </span>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-1">
                <div className="flex gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !loading && text.trim() && add()}
                        placeholder={userId ? "댓글을 입력하세요" : "로그인 후 댓글 작성 가능"}
                        className={inputClass}
                        maxLength={1000}
                        disabled={!userId}
                    />
                    <button
                        onClick={add}
                        disabled={loading || !userId || !text.trim()}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:active:scale-100 transition-all cursor-pointer"
                    >
                        {loading ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : "등록"}
                    </button>
                </div>
                {text.length > 0 && (
                    <div className={`text-[10px] text-right ${text.length > 900 ? "text-amber-400" : metaColor}`}>
                        {text.length}/1000
                    </div>
                )}
            </div>

            <div>
                {list.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-6 ${metaColor}`}>
                        <svg className="w-7 h-7 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-xs">첫 댓글을 남겨보세요</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {list.map((c) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.18 }}
                                className={`group flex items-start gap-3 py-3 border-b last:border-b-0 ${dividerColor}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className={`flex items-center gap-1.5 mb-1.5 text-[10px] ${metaColor}`}>
                                        <span className={`font-mono font-medium px-1.5 py-[1px] rounded text-[9px] ${isLight ? "bg-neutral-100 text-neutral-500" : "bg-neutral-800 text-neutral-400"}`}>
                                            {c.user_id.slice(0, 6)}
                                        </span>
                                        <span>·</span>
                                        <span>{formatRelativeTime(c.created_at)}</span>
                                    </div>
                                    <p className={`whitespace-pre-wrap text-xs leading-relaxed ${bodyTextClass}`}>
                                        {c.body}
                                    </p>
                                </div>
                                {userId === c.user_id && (
                                    <button
                                        onClick={() => remove(c.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer mt-0.5"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <AnimatePresence>
                {modal && (
                    <CustomModal
                        message={modal.message}
                        isConfirm={modal.isConfirm}
                        onConfirm={modal.onConfirm || (() => setModal(null))}
                        onCancel={() => setModal(null)}
                        isLight={isLight}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
