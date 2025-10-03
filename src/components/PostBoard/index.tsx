"use client";
import { supabase } from "@/lib/supabase-browser";
import WriteForm from "@/components/WriteForm";
import Comments from "@/components/Comment";
import { useEffect, useState } from "react";
import Image from "next/image";

type Post = {
    id: string;
    title: string;
    body: string;
    image_url?: string | null;
    user_id: string;
    created_at: string;
};

export default function PostSection() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [mode, setMode] = useState<"list" | "write" | "detail" | "edit">(
        "list"
    );
    const [selected, setSelected] = useState<Post | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // 로그인 세션 + 구독
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUserId(data.session?.user?.id ?? null);
        });

        const { data: sub } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUserId(session?.user?.id ?? null);
            }
        );

        return () => sub.subscription.unsubscribe();
    }, []);

    const loadPosts = async () => {
        const { data, error } = await supabase
            .from("posts")
            .select("id,title,body,image_url,created_at,user_id")
            .order("created_at", { ascending: false });
        if (!error && data) setPosts(data as Post[]);
    };

    useEffect(() => {
        loadPosts();
    }, []);

    // 생성
    const handleCreate = async (
        title: string,
        body: string,
        imageUrl?: string
    ) => {
        if (!userId) return alert("로그인이 필요합니다.");
        const { error } = await supabase
            .from("posts")
            .insert([
                { title, body, image_url: imageUrl ?? null, user_id: userId },
            ]);
        if (error) return alert(error.message);
        await loadPosts();
        setMode("list");
    };

    // 업데이트
    const handleUpdate = async (
        title: string,
        body: string,
        imageUrl?: string
    ) => {
        if (!selected) return;
        const { error } = await supabase
            .from("posts")
            .update({ title, body, image_url: imageUrl ?? null })
            .eq("id", selected.id)
            .eq("user_id", userId); // 내 글만 수정
        if (error) return alert(error.message);
        await loadPosts();
        const fresh = posts.find((p) => p.id === selected.id);
        setSelected(fresh ?? null);
        setMode("detail");
    };

    // 삭제
    const handleDelete = async (id: string) => {
        if (!confirm("게시물을 삭제할까요?")) return;
        const { error } = await supabase
            .from("posts")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);
        if (error) return alert(error.message);
        await loadPosts();
        setMode("list");
        setSelected(null);
    };

    // 썸네일 이미지 (목록)
    const Thumb = ({ url }: { url?: string | null }) =>
        url ? (
            <Image
                src={url}
                alt="thumb"
                width={96} // w-24
                height={96} // h-24
                className="object-cover rounded mr-3 flex-shrink-0"
                unoptimized // Supabase public URL은 최적화 제외 필요
            />
        ) : null;

    // 본문 이미지 (상세)
    const DetailImage = ({ url }: { url?: string | null }) =>
        url ? (
            <Image
                src={url}
                alt="이미지"
                width={600}
                height={400}
                className="mt-3 rounded max-h-96 w-full object-contain bg-neutral-50"
                unoptimized
            />
        ) : null;

    return (
        <div className="p-3 h-full flex flex-col min-h-0">
            {/* 목록 */}
            {mode === "list" && (
                <div className="flex-1 overflow-auto">
                    <button
                        onClick={() => setMode("write")}
                        className="mb-3 border rounded px-3 py-1 bg-black text-gray-100"
                    >
                        글쓰기
                    </button>

                    {posts.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-start border rounded p-3 mb-3 bg-neutral-900 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                                setSelected(p);
                                setMode("detail");
                            }}
                        >
                            <Thumb url={p.image_url} />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm truncate text-gray-100">
                                    {p.title}
                                </h3>
                                <p className="text-xs text-gray-100 line-clamp-2">
                                    {p.body}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    작성자 {p.user_id.slice(0, 8)} ·{" "}
                                    {new Date(p.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 상세 */}
            {mode === "detail" && selected && (
                <div className="flex-1 overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                        <button
                            className="text-sm text-gray-600"
                            onClick={() => setMode("list")}
                        >
                            ✕ 닫기
                        </button>

                        {/* 로그인 상태 && 내 글일 때만 표시 */}
                        {userId && userId === selected.user_id && (
                            <div className="flex gap-2">
                                <button
                                    className="text-sm px-2 py-1 border rounded"
                                    onClick={() => setMode("edit")}
                                >
                                    수정
                                </button>
                                <button
                                    className="text-sm px-2 py-1 border rounded text-red-600"
                                    onClick={() => handleDelete(selected.id)}
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 mb-2 flex justify-between">
                        <span>작성자: {selected.user_id.slice(0, 8)}</span>
                        <span>
                            {new Date(selected.created_at).toLocaleString()}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold">{selected.title}</h2>
                    <p className="mt-2 whitespace-pre-wrap">{selected.body}</p>
                    <DetailImage url={selected.image_url} />

                    {/* 댓글 */}
                    <Comments postId={selected.id} userId={userId} />
                </div>
            )}

            {/* 글쓰기 */}
            {mode === "write" && (
                <WriteForm
                    onCancel={() => setMode("list")}
                    onSubmit={handleCreate}
                />
            )}

            {/* 수정 */}
            {mode === "edit" && selected && (
                <WriteForm
                    initialTitle={selected.title}
                    initialBody={selected.body}
                    initialImage={selected.image_url ?? undefined}
                    onCancel={() => setMode("detail")}
                    onSubmit={handleUpdate}
                />
            )}
        </div>
    );
}
