"use client";

import { supabase } from "@/lib/supabase-browser";
import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Comment = {
    id: string;
    post_id: string;
    user_id: string;
    body: string;
    created_at: string;
};

// Custom Modal Component (for alerts/confirms)
const CustomModal: React.FC<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isConfirm: boolean;
}> = ({ message, onConfirm, onCancel, isConfirm }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-2xl max-w-sm w-full"
        >
            <p className="text-white mb-6 text-base whitespace-pre-wrap">
                {message}
            </p>
            <div
                className={`flex ${
                    isConfirm ? "justify-between" : "justify-center"
                } gap-3`}
            >
                {isConfirm && (
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 rounded-lg text-sm bg-neutral-700 text-white hover:bg-neutral-600 transition cursor-pointer"
                    >
                        취소
                    </button>
                )}
                <button
                    onClick={onConfirm}
                    className="flex-1 px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
                >
                    {isConfirm ? "확인" : "닫기"}
                </button>
            </div>
        </motion.div>
    </motion.div>
);

export default function Comments({
    postId,
    userId,
}: {
    postId: string;
    userId: string | null;
}) {
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
            .on(
                "postgres_changes",
                {
                    schema: "public",
                    table: "comments",
                    event: "INSERT",
                    filter: `post_id=eq.${postId}`,
                },
                (payload) => {
                    setList((prev) => [...prev, payload.new as Comment]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [postId, load]);

    // 댓글 추가
    const add = async () => {
        if (!userId) {
            setModal({
                message: "로그인이 필요합니다.",
                isConfirm: false,
            });
            return;
        }
        if (!text.trim()) return;
        setLoading(true);
        setError(null);

        const { error: insertError } = await supabase
            .from("comments")
            .insert([{ post_id: postId, user_id: userId, body: text.trim() }]);

        setLoading(false);
        if (insertError) {
            setModal({
                message: "댓글 등록 실패: " + insertError.message,
                isConfirm: false,
            });
            return;
        }

        setText("");
        // 실시간 구독이 없는 경우 대비해서 다시 로드 (혹은 로컬에서 추가)
        // setList((prev) => [...prev, { id: Date.now().toString(), post_id: postId, user_id: userId, body: text.trim(), created_at: new Date().toISOString() }]);
        // 실시간 구독이 확실하므로 load()는 불필요하지만, 보험으로 남겨둠
        // await load();
    };

    // 댓글 삭제
    const remove = (id: string) => {
        setModal({
            message: "정말로 이 댓글을 삭제하시겠습니까?",
            isConfirm: true,
            onConfirm: async () => {
                setModal(null);
                const { error: deleteError } = await supabase
                    .from("comments")
                    .delete()
                    .eq("id", id);

                if (deleteError) {
                    setModal({
                        message: "댓글 삭제 실패: " + deleteError.message,
                        isConfirm: false,
                    });
                    return;
                }

                setList((prev) => prev.filter((c) => c.id !== id));
            },
        });
    };

    return (
        // 전체 스크롤바를 숨기기 위해 scrollbar-hide 클래스를 루트 컨테이너에 추가합니다.
        // 이는 컨테이너가 Canvas보다 커질 때 생기는 스크롤바를 대상으로 합니다.
        <div className="mt-10 flex flex-col gap-4 bg-neutral-950 p-4 rounded-xl shadow-inner border border-neutral-800 scrollbar-hide">
            <h4 className="font-bold text-xl mb-2 text-white">
                댓글 ({list.length})
            </h4>

            {/* 에러 메시지 표시 */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-400"
                        style={{ fontSize: "0.75rem" }}
                    >
                        ⚠️ 오류: {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 입력 */}
            <div className="flex gap-3 mb-3">
                {/* 스크롤바 숨기기 (focus:ring-0 추가, scrollbar-hide 추가) */}
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                        userId
                            ? "댓글을 입력하세요..."
                            : "로그인 후 댓글을 남길 수 있습니다."
                    }
                    className="flex-1 rounded-lg px-3 py-2 text-base border border-neutral-700 bg-neutral-900 text-white shadow-inner 
                                focus:outline-none focus:ring-0 focus:border-emerald-400 transition 
                                scrollbar-hide"
                    maxLength={1000}
                    disabled={!userId}
                />
                <motion.button
                    onClick={add}
                    disabled={loading || !userId || !text.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-lg px-4 py-2 text-base font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor:
                            loading || !userId || !text.trim()
                                ? "#4b5563"
                                : "#10b981",
                        color: "white",
                    }}
                >
                    {loading ? "등록중…" : "등록"}
                </motion.button>
            </div>

            {/* 목록 */}
            <div className="space-y-3">
                {list.map((c) => (
                    <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-lg p-3 text-sm bg-neutral-900 border border-neutral-800 shadow-sm"
                    >
                        <p className="whitespace-pre-wrap text-neutral-200 text-base">
                            {c.body}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800 text-xs text-gray-500">
                            <span className="text-neutral-400">
                                <b className="text-neutral-300 font-semibold">
                                    {c.user_id.slice(0, 8)}
                                </b>{" "}
                                · {new Date(c.created_at).toLocaleString()}
                            </span>
                            {userId === c.user_id && (
                                <motion.button
                                    onClick={() => remove(c.id)}
                                    whileHover={{ color: "#ef4444" }}
                                    className="text-red-500/80 cursor-pointer font-medium hover:text-red-400 transition"
                                >
                                    삭제
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                ))}
                {list.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center py-4 border border-dashed border-neutral-800 rounded-lg">
                        첫 댓글을 남겨보세요!
                    </p>
                )}
            </div>

            {/* Custom Modal 렌더링 */}
            <AnimatePresence>
                {modal && (
                    <CustomModal
                        message={modal.message}
                        isConfirm={modal.isConfirm}
                        onConfirm={modal.onConfirm || (() => setModal(null))}
                        onCancel={() => setModal(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
