"use client";

import { supabase } from "@/lib/supabase-browser";
import { useCallback, useEffect, useState } from "react";

type Comment = {
    id: string;
    post_id: string;
    user_id: string;
    body: string;
    created_at: string;
};

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

    const load = useCallback(async () => {
        const { data, error } = await supabase
            .from("comments")
            .select("id, post_id, user_id, body, created_at")
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

        if (!error && data) setList(data);
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
        if (!userId) return alert("로그인이 필요합니다.");
        if (!text.trim()) return;
        setLoading(true);

        const { error } = await supabase
            .from("comments")
            .insert([{ post_id: postId, user_id: userId, body: text.trim() }]);

        setLoading(false);
        if (error) return alert(error.message);

        setText("");
        // 실시간 구독이 없는 경우 대비해서 다시 로드
        await load();
    };

    // 댓글 삭제
    const remove = async (id: string) => {
        if (!confirm("댓글을 삭제할까요?")) return;
        const { error } = await supabase.from("comments").delete().eq("id", id);
        if (error) return alert(error.message);

        setList((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <div className="mt-6">
            <h4 className="font-semibold mb-2">댓글</h4>

            {/* 입력 */}
            <div className="flex gap-2 mb-3">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="댓글을 입력하세요…"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    maxLength={1000}
                />
                <button
                    onClick={add}
                    disabled={loading}
                    className="border rounded px-3 py-1 bg-blue-600 text-white text-sm disabled:opacity-60"
                >
                    {loading ? "등록중…" : "등록"}
                </button>
            </div>

            {/* 목록 */}
            <div className="space-y-2">
                {list.map((c) => (
                    <div
                        key={c.id}
                        className="border rounded p-2 text-sm bg-white"
                    >
                        <p className="whitespace-pre-wrap">{c.body}</p>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                            <span>
                                {c.user_id.slice(0, 8)} ·{" "}
                                {new Date(c.created_at).toLocaleString()}
                            </span>
                            {userId === c.user_id && (
                                <button
                                    onClick={() => remove(c.id)}
                                    className="text-red-500 hover:underline"
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {list.length === 0 && (
                    <p className="text-xs text-gray-400">
                        첫 댓글을 남겨보세요.
                    </p>
                )}
            </div>
        </div>
    );
}
