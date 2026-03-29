import { supabase } from "@/shared/lib/supabase-browser";

const BUCKET = "imageS";

export function toPublicUrl(pathOrUrl?: string | null): string {
    try {
        if (!pathOrUrl) return "";

        if (/^https?:\/\//i.test(pathOrUrl)) {
            return encodeURI(pathOrUrl); // 혹시 한글/공백 포함되어 있으면 인코딩
        }

        const clean = pathOrUrl.replace(/^\/+/, "");

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(clean);
        if (data?.publicUrl) return data.publicUrl;

        const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (base) {
            return `${base}/storage/v1/object/public/${BUCKET}/${encodeURI(
                clean
            )}`;
        }

        return "";
    } catch {
        return "";
    }
}
