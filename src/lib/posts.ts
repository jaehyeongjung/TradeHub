import { supabase } from "@/lib/supabase-browser";

export async function fetchPosts({
    limit = 20,
    cursor,
}: {
    limit?: number;
    cursor?: string | null;
}) {
    let q = supabase
        .from("posts")
        .select("id, title, body, user_id, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(limit);
    if (cursor) q = q.lt("created_at", cursor); // 커서 기반 페이지네이션
    return await q;
}

export async function createPost({
    title,
    body,
    user_id,
}: {
    title: string;
    body: string;
    user_id: string;
}) {
    return await supabase
        .from("posts")
        .insert([{ title, body, user_id }])
        .select("id")
        .single();
}

export async function deletePost(id: string) {
    return await supabase.from("posts").delete().eq("id", id);
}
