import { supabase } from "@/shared/lib/supabase-browser";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";

export type Post = {
    id: string;
    title: string;
    body: string;
    user_id: string;
    created_at: string;
};

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

// getPostById / getAllPostIds는 제거했다. 게시글 상세 페이지(/posts/[id])와
// 사이트맵 등록만을 위한 함수였는데, 그 페이지는 사이트 안에서 도달할 경로가 없는
// 고아였다(게시판 위젯은 모달로 본문을 띄운다). 최대 1,000개가 색인되면서
// 애드센스 "가치가 별로 없는 콘텐츠" 판정에 얹혔다.
