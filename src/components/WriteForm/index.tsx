"use client";

import { useState } from "react";
import { uploadImageToBucket } from "@/lib/uploadImage";

export default function WriteForm({
    onCancel,
    onSubmit,
    initialTitle = "",
    initialBody = "",
    initialImage,
}: {
    onCancel: () => void;
    onSubmit: (title: string, body: string, imageUrl?: string) => void;
    initialTitle?: string;
    initialBody?: string;
    initialImage?: string;
}) {
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        try {
            let imageUrl = initialImage;
            if (file) {
                imageUrl = await uploadImageToBucket(file);
            }
            await onSubmit(title.trim(), body.trim(), imageUrl);
        } catch (e: unknown) {
            if (e instanceof Error) {
                alert(e.message);
            } else {
                alert("업로드 실패");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border rounded-xl p-3 bg-white space-y-2">
            <input
                className="w-full border rounded px-3 py-2"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
                className="w-full border rounded px-3 py-2 h-40 resize-none"
                placeholder="내용"
                value={body}
                onChange={(e) => setBody(e.target.value)}
            />
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex gap-2">
                <button
                    className="border rounded px-3 py-1 bg-emerald-600 text-white disabled:opacity-60"
                    onClick={submit}
                    disabled={loading}
                >
                    {loading ? "저장 중…" : "저장"}
                </button>
                <button className="border rounded px-3 py-1" onClick={onCancel}>
                    취소
                </button>
            </div>
        </div>
    );
}
