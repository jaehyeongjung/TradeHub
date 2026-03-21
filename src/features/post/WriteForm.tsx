"use client";

import { useState } from "react";
import { uploadImageToBucket } from "@/shared/lib/upload-image";

export default function WriteForm({
    onCancel,
    onSubmit,
    initialTitle = "",
    initialBody = "",
    initialImage,
    isLight = false,
}: {
    onCancel: () => void;
    onSubmit: (title: string, body: string, imageUrl?: string) => void;
    initialTitle?: string;
    initialBody?: string;
    initialImage?: string;
    isLight?: boolean;
}) {
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        try {
            let imageUrl = initialImage;
            if (file) imageUrl = await uploadImageToBucket(file);
            await onSubmit(title.trim(), body.trim(), imageUrl);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "업로드 실패");
        } finally {
            setLoading(false);
        }
    };

    const labelClass = `text-xs font-medium ${isLight ? "text-neutral-500" : "text-neutral-400"}`;
    const inputClass = `w-full rounded-xl px-4 py-2.5 text-sm placeholder-neutral-500 focus:outline-none transition ${
        isLight
            ? "bg-neutral-50 border border-neutral-200 text-neutral-800 focus:border-emerald-500 focus:bg-white"
            : "bg-neutral-800 border border-neutral-700 text-white focus:border-emerald-500"
    }`;
    const dividerColor = isLight ? "border-neutral-100" : "border-neutral-800";
    const headerTitleClass = isLight ? "text-base font-semibold text-neutral-800" : "text-base font-semibold text-white";
    const closeBtnClass = isLight
        ? "w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
        : "w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer";

    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className={`flex items-center justify-between pb-3 mb-4 border-b ${dividerColor}`}>
                <h2 className={headerTitleClass}>
                    {initialTitle ? "글 수정" : "새 글 작성"}
                </h2>
                <button onClick={onCancel} className={closeBtnClass}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* 폼 */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                {/* 제목 */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className={labelClass}>제목</label>
                        <span className={`text-[10px] ${title.length > 180 ? "text-amber-400" : isLight ? "text-neutral-400" : "text-neutral-500"}`}>
                            {title.length}/200
                        </span>
                    </div>
                    <input
                        className={inputClass}
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                    />
                </div>

                {/* 내용 */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className={labelClass}>내용</label>
                        <span className={`text-[10px] ${body.length > 4500 ? "text-amber-400" : isLight ? "text-neutral-400" : "text-neutral-500"}`}>
                            {body.length}/5000
                        </span>
                    </div>
                    <textarea
                        className={`flex-1 min-h-32 resize-none ${inputClass}`}
                        placeholder="내용을 입력하세요"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        maxLength={5000}
                    />
                </div>

                {/* 이미지 첨부 */}
                <div>
                    <label className={`block ${labelClass} mb-1.5`}>이미지 첨부</label>
                    <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition ${
                        isLight
                            ? "bg-neutral-50 border border-neutral-200 hover:border-neutral-300"
                            : "bg-neutral-800 border border-neutral-700 hover:border-neutral-600"
                    }`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={isLight ? "text-neutral-400" : "text-neutral-500"}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21,15 16,10 5,21" />
                        </svg>
                        <span className={`text-xs ${file ? (isLight ? "text-neutral-700" : "text-neutral-200") : (isLight ? "text-neutral-400" : "text-neutral-500")}`}>
                            {file ? file.name : "이미지 선택"}
                        </span>
                        {file && (
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                                첨부됨
                            </span>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                    </label>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className={`flex gap-3 pt-4 mt-4 border-t ${dividerColor}`}>
                <button
                    onClick={onCancel}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isLight
                            ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                >
                    취소
                </button>
                <button
                    onClick={submit}
                    disabled={loading || !title.trim() || !body.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all cursor-pointer"
                >
                    {loading ? "저장 중..." : initialTitle ? "수정하기" : "등록"}
                </button>
            </div>
        </div>
    );
}
