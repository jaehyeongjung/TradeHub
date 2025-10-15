"use client";

import React, {
    useEffect,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";
import { supabase } from "@/lib/supabase-browser";
import WriteForm from "@/components/WriteForm";
import Comments from "@/components/Comment";
import Image from "next/image";

type Post = {
    id: string;
    title: string;
    body: string;
    image_url?: string | null;
    user_id: string;
    created_at: string;
};

// Custom Modal Component
const CustomModal: React.FC<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isConfirm: boolean;
}> = ({ message, onConfirm, onCancel, isConfirm }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-2xl max-w-sm w-full">
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
                        className="flex-1 px-4 py-2 rounded-lg text-sm bg-neutral-700 text-white hover:bg-neutral-600 transition"
                    >
                        취소
                    </button>
                )}
                <button
                    onClick={onConfirm}
                    className="flex-1 px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition"
                >
                    {isConfirm ? "확인" : "닫기"}
                </button>
            </div>
        </div>
    </div>
);

// 부모가 호출할 수 있는 메서드 타입
export type PostBoardHandle = {
    openWrite: () => void;
    backToList: () => void;
};

type Props = {
    /** 내부에 예전처럼 '글쓰기' 버튼을 보여주고 싶을 때만 true */
    showInternalWriteButton?: boolean;
};

const PostBoard = forwardRef<PostBoardHandle, Props>(function PostBoard(
    { showInternalWriteButton = false },
    ref
) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [mode, setMode] = useState<"list" | "write" | "detail" | "edit">(
        "list"
    );
    const [selected, setSelected] = useState<Post | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [modal, setModal] = useState<{
        message: string;
        isConfirm: boolean;
        onConfirm?: () => void;
    } | null>(null);

    // 부모에서 openWrite()/backToList() 호출 가능
    useImperativeHandle(
        ref,
        () => ({
            openWrite: () => setMode("write"),
            backToList: () => setMode("list"),
        }),
        []
    );

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
        if (!userId) {
            setModal({ message: "로그인이 필요합니다.", isConfirm: false });
            return;
        }
        const { error } = await supabase
            .from("posts")
            .insert([
                { title, body, image_url: imageUrl ?? null, user_id: userId },
            ]);
        if (error) {
            setModal({ message: error.message, isConfirm: false });
            return;
        }
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
        if (error) {
            setModal({ message: error.message, isConfirm: false });
            return;
        }
        await loadPosts();
        const fresh = posts.find((p) => p.id === selected.id);
        setSelected(fresh ?? null);
        setMode("detail");
    };

    // 삭제
    const handleDelete = async (id: string) => {
        setModal({
            message: "게시물을 삭제할까요?",
            isConfirm: true,
            onConfirm: async () => {
                setModal(null);
                const { error } = await supabase
                    .from("posts")
                    .delete()
                    .eq("id", id)
                    .eq("user_id", userId);
                if (error) {
                    setModal({ message: error.message, isConfirm: false });
                    return;
                }
                await loadPosts();
                setMode("list");
                setSelected(null);
            },
        });
    };

    // 썸네일 (목록)
    const Thumb = ({ url }: { url?: string | null }) =>
        url ? (
            <Image
                src={url}
                alt="thumb"
                width={96}
                height={96}
                className="object-cover rounded mr-3 flex-shrink-0"
                unoptimized
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
                className="mt-3 rounded max-h-96 w-full object-contain bg-neutral-950"
                unoptimized
            />
        ) : null;

    return (
        <>
            <style
                dangerouslySetInnerHTML={{
                    __html: `
          .scrollbar-hide::-webkit-scrollbar{width:0!important;height:0!important;display:none}
          .scrollbar-hide{scrollbar-width:none;-ms-overflow-style:none}
        `,
                }}
            />

            <div className="p-3 h-full flex flex-col min-h-0">
                {/* 목록 */}
                {mode === "list" && (
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        {/* 내부 글쓰기 버튼은 기본 숨김 (부모에서 우측 상단 버튼 사용) */}
                        {showInternalWriteButton && (
                            <button
                                onClick={() => setMode("write")}
                                className="mb-3 border rounded px-3 py-1 bg-black text-gray-100 cursor-pointer"
                            >
                               <span className="whitespace-nowrap">글쓰기</span> 
                            </button>
                        )}

                        {posts.map((p) => (
                            <div
                                key={p.id}
                                className="flex items-start border rounded p-3 mb-3 bg-neutral-900 hover:bg-neutral-950 cursor-pointer transition duration-200"
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
                                        {new Date(
                                            p.created_at
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 상세 */}
                {mode === "detail" && selected && (
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
                            <button
                                className="text-sm text-gray-400 p-2 rounded-xl cursor-pointer hover:bg-neutral-900 transition"
                                onClick={() => setMode("list")}
                            >
                                ← 목록으로
                            </button>

                            {/* 로그인 상태 && 내 글일 때만 표시 */}
                            {userId && userId === selected.user_id && (
                                <div className="flex gap-2">
                                    <button
                                        className="text-sm px-3 py-1 border border-gray-600 rounded-lg text-gray-200 cursor-pointer hover:bg-neutral-800 transition"
                                        onClick={() => setMode("edit")}
                                    >
                                        수정
                                    </button>
                                    <button
                                        className="text-sm px-3 py-1 border border-red-700 rounded-lg text-red-500 cursor-pointer hover:bg-red-900/20 transition"
                                        onClick={() =>
                                            handleDelete(selected.id)
                                        }
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

                        <h2 className="text-2xl font-bold text-white mb-3">
                            {selected.title}
                        </h2>
                        <p className="mt-2 whitespace-pre-wrap text-neutral-300">
                            {selected.body}
                        </p>
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

            {/* Custom Modal */}
            {modal && (
                <CustomModal
                    message={modal.message}
                    isConfirm={modal.isConfirm}
                    onConfirm={modal.onConfirm || (() => setModal(null))}
                    onCancel={() => setModal(null)}
                />
            )}
        </>
    );
});

export default PostBoard;
