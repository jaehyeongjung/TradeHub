"use client";

import React, {
    useEffect,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { supabase } from "@/shared/lib/supabase-browser";
import { sanitizeText } from "@/shared/lib/sanitize";
import { WriteForm } from "@/features/post/WriteForm";
import { Comments } from "@/features/post/Comment";
import Image from "next/image";
import { useToast } from "@/shared/ui/Toast";

type Post = {
    id: string;
    title: string;
    body: string;
    image_url?: string | null;
    user_id: string;
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
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            ref={(el) => el?.focus()}
        >
            <div className={`rounded-2xl p-6 shadow-2xl max-w-sm w-full outline-none ${isLight ? "bg-white border border-neutral-200" : "bg-surface-elevated border border-border-subtle"}`}>
                <p className={`mb-6 text-sm leading-relaxed ${isLight ? "text-neutral-700" : "text-text-primary"}`}>
                    {message}
                </p>
                <div className={`flex ${isConfirm ? "justify-between" : "justify-center"} gap-3`}>
                    {isConfirm && (
                        <button
                            onClick={onCancel}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isLight ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200" : "bg-surface-input text-text-secondary hover:bg-surface-hover"}`}
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
            </div>
        </div>
    );
};

export type PostBoardHandle = {
    openWrite: () => void;
    backToList: () => void;
};

type Props = {
    showInternalWriteButton?: boolean;
    fadeDelay?: number;
};

export const PostBoard = forwardRef<PostBoardHandle, Props>(function PostBoard(
    { showInternalWriteButton = false, fadeDelay = 0 },
    ref
) {
    const { showToast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoaded, setPostsLoaded] = useState(false);
    const [mode, setMode] = useState<"list" | "write" | "detail" | "edit">("list");
    const [selected, setSelected] = useState<Post | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const isLight = useTheme();
    const [modal, setModal] = useState<{
        message: string;
        isConfirm: boolean;
        onConfirm?: () => void;
    } | null>(null);
    const [listScrolled, setListScrolled] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        openWrite: () => setMode("write"),
        backToList: () => setMode("list"),
    }), []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUserId(data.session?.user?.id ?? null);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id ?? null);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    const loadPosts = async () => {
        const { data, error } = await supabase
            .from("posts")
            .select("id,title,body,image_url,created_at,user_id")
            .order("created_at", { ascending: false });
        if (!error && data) setPosts(data as Post[]);
        setPostsLoaded(true);
    };

    useEffect(() => { loadPosts(); }, []);

    const handleCreate = async (title: string, body: string, imageUrl?: string) => {
        if (!userId) { setModal({ message: "로그인이 필요합니다.", isConfirm: false }); return; }
        const safeTitle = sanitizeText(title, 200);
        const safeBody = sanitizeText(body, 5000);
        if (!safeTitle || !safeBody) { setModal({ message: "제목과 내용을 입력해주세요.", isConfirm: false }); return; }
        const { error } = await supabase.from("posts").insert([{ title: safeTitle, body: safeBody, image_url: imageUrl ?? null, user_id: userId }]);
        if (error) { setModal({ message: error.message, isConfirm: false }); return; }
        await loadPosts();
        setMode("list");
        showToast("게시물이 작성되었습니다");
    };

    const handleUpdate = async (title: string, body: string, imageUrl?: string) => {
        if (!selected) return;
        const safeTitle = sanitizeText(title, 200);
        const safeBody = sanitizeText(body, 5000);
        if (!safeTitle || !safeBody) { setModal({ message: "제목과 내용을 입력해주세요.", isConfirm: false }); return; }
        const { error } = await supabase.from("posts").update({ title: safeTitle, body: safeBody, image_url: imageUrl ?? null }).eq("id", selected.id).eq("user_id", userId);
        if (error) { setModal({ message: error.message, isConfirm: false }); return; }
        await loadPosts();
        const fresh = posts.find((p) => p.id === selected.id);
        setSelected(fresh ?? null);
        setMode("detail");
        showToast("게시물이 수정되었습니다");
    };

    const handleDelete = async (id: string) => {
        setModal({
            message: "게시물을 삭제할까요?",
            isConfirm: true,
            onConfirm: async () => {
                setModal(null);
                const { error } = await supabase.from("posts").delete().eq("id", id).eq("user_id", userId);
                if (error) { setModal({ message: error.message, isConfirm: false }); return; }
                await loadPosts();
                setMode("list");
                setSelected(null);
                showToast("게시물이 삭제되었습니다");
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

    const dividerColor = isLight ? "border-neutral-100" : "border-border-subtle";
    const titleColor = isLight ? "text-neutral-800 group-hover:text-teal-600" : "text-text-primary group-hover:text-white";
    const bodyColor = isLight ? "text-neutral-500" : "text-text-tertiary";
    const metaColor = isLight ? "text-neutral-400" : "text-text-muted";
    const articleBg = isLight ? "bg-neutral-50 border border-neutral-100" : "bg-neutral-800/30 border border-neutral-800/50";
    const backBtnClass = isLight
        ? "flex items-center gap-1 text-sm text-neutral-500 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-neutral-100 hover:text-neutral-700 transition-all"
        : "flex items-center gap-1 text-sm text-text-tertiary px-3 py-1.5 rounded-xl cursor-pointer hover:bg-surface-input hover:text-text-primary transition-all";
    const editBtnClass = isLight
        ? "flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl text-neutral-600 bg-neutral-100 cursor-pointer hover:bg-neutral-200 transition-all"
        : "flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl text-text-secondary bg-surface-input cursor-pointer hover:bg-surface-hover transition-all";

    const Thumb = ({ url }: { url?: string | null }) =>
        url ? (
            <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ${isLight ? "bg-neutral-100" : "bg-surface-input"}`}>
                <Image src={url} alt="thumb" width={56} height={56} className="object-cover w-full h-full" unoptimized />
            </div>
        ) : null;

    const DetailImage = ({ url }: { url?: string | null }) =>
        url ? (
            <div className={`mt-4 rounded-2xl overflow-hidden ${isLight ? "bg-neutral-100" : "bg-surface-elevated/50"}`}>
                <Image src={url} alt="이미지" width={600} height={400} className="max-h-96 w-full object-contain" unoptimized />
            </div>
        ) : null;

    return (
        <>
            <div
                className={`p-3 h-full flex flex-col min-h-0 transition-[opacity,transform] duration-700 ${postsLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${fadeDelay}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
                {mode === "list" && (
                    <div
                        ref={listRef}
                        className="flex-1 overflow-auto scrollbar-hide"
                        onScroll={(e) => setListScrolled((e.currentTarget as HTMLDivElement).scrollTop > 0)}
                        style={{
                            maskImage: listScrolled
                                ? "linear-gradient(to bottom, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)"
                                : "linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)",
                            WebkitMaskImage: listScrolled
                                ? "linear-gradient(to bottom, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)"
                                : "linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)",
                        }}
                    >
                        {showInternalWriteButton && (
                            <button
                                onClick={() => setMode("write")}
                                className="mb-3 text-xs px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
                            >
                                글쓰기
                            </button>
                        )}

                        {!postsLoaded && (
                            <div className="space-y-0">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`flex items-start gap-3 py-3 border-b ${dividerColor} animate-pulse`}>
                                        <div className="flex-1 space-y-2">
                                            <div className={`h-3.5 w-3/4 rounded ${isLight ? "bg-neutral-200" : "bg-surface-input"}`} />
                                            <div className={`h-3 w-full rounded ${isLight ? "bg-neutral-200" : "bg-surface-input"}`} />
                                            <div className={`h-2.5 w-24 rounded ${isLight ? "bg-neutral-200" : "bg-surface-input"}`} />
                                        </div>
                                        <div className={`w-14 h-14 rounded-xl ${isLight ? "bg-neutral-200" : "bg-surface-input"}`} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {postsLoaded && posts.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center py-12 ${metaColor}`}>
                                <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                                <p className="text-xs">아직 게시물이 없습니다</p>
                                <button
                                    onClick={() => setMode("write")}
                                    className="mt-3 text-xs text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                                >
                                    첫 글 작성하기
                                </button>
                            </div>
                        ) : postsLoaded && (
                            <ul className="pr-1">
                                {posts.map((p) => (
                                    <li
                                        key={p.id}
                                        className={`group flex items-center gap-3 py-3 border-b last:border-b-0 cursor-pointer transition-colors ${dividerColor} ${isLight ? "hover:bg-neutral-50" : "hover:bg-neutral-800/20"}`}
                                        onClick={() => { setSelected(p); setMode("detail"); }}
                                    >
                                        <Thumb url={p.image_url} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold text-sm truncate transition-colors mb-0.5 ${titleColor}`}>
                                                {p.title}
                                            </h3>
                                            <p className={`text-xs line-clamp-1 leading-relaxed ${bodyColor}`}>
                                                {p.body}
                                            </p>
                                            <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${metaColor}`}>
                                                <span className={`font-mono px-1.5 py-[1px] rounded text-[9px] ${isLight ? "bg-neutral-100" : "bg-surface-input"}`}>
                                                    {p.user_id.slice(0, 6)}
                                                </span>
                                                <span>·</span>
                                                <span>{formatRelativeTime(p.created_at)}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {mode === "detail" && selected && (
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <div className="flex items-center justify-between mb-4">
                            <button className={backBtnClass} onClick={() => setMode("list")}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                목록
                            </button>

                            {userId && userId === selected.user_id && (
                                <div className="flex gap-2">
                                    <button className={editBtnClass} onClick={() => setMode("edit")}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        수정
                                    </button>
                                    <button
                                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl text-red-400 bg-red-500/10 cursor-pointer hover:bg-red-500/20 transition-all"
                                        onClick={() => handleDelete(selected.id)}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        삭제
                                    </button>
                                </div>
                            )}
                        </div>

                        <article className={`rounded-2xl p-4 2xl:p-5 ${articleBg}`}>
                            <h2 className={`text-lg 2xl:text-xl font-bold mb-3 leading-snug ${isLight ? "text-neutral-800" : "text-text-primary"}`}>
                                {selected.title}
                            </h2>

                            <div className={`flex items-center gap-2 pb-3 mb-4 border-b text-[10px] ${dividerColor} ${metaColor}`}>
                                <span className={`font-mono px-1.5 py-[2px] rounded ${isLight ? "bg-neutral-100 text-neutral-500" : "bg-surface-input text-text-tertiary"}`}>
                                    {selected.user_id.slice(0, 8)}
                                </span>
                                <span>·</span>
                                <span>{formatRelativeTime(selected.created_at)}</span>
                            </div>

                            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isLight ? "text-neutral-600" : "text-text-secondary"}`}>
                                {selected.body}
                            </p>
                            <DetailImage url={selected.image_url} />
                        </article>

                        <div className="mt-4">
                            <Comments postId={selected.id} userId={userId} isLight={isLight} />
                        </div>
                    </div>
                )}

                {mode === "write" && (
                    <WriteForm onCancel={() => setMode("list")} onSubmit={handleCreate} isLight={isLight} />
                )}

                {mode === "edit" && selected && (
                    <WriteForm
                        initialTitle={selected.title}
                        initialBody={selected.body}
                        initialImage={selected.image_url ?? undefined}
                        onCancel={() => setMode("detail")}
                        onSubmit={handleUpdate}
                        isLight={isLight}
                    />
                )}
            </div>

            {modal && (
                <CustomModal
                    message={modal.message}
                    isConfirm={modal.isConfirm}
                    onConfirm={modal.onConfirm || (() => setModal(null))}
                    onCancel={() => setModal(null)}
                    isLight={isLight}
                />
            )}
        </>
    );
});

