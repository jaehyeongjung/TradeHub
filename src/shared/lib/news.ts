import { supabaseAdmin } from "@/shared/lib/supabase-admin";

export type NewsItem = {
    id: string;
    source: string;
    title: string;
    url: string;
    symbols: string[] | null;
    published_at: string;
};

export async function getNewsById(id: string): Promise<NewsItem | null> {
    const { data, error } = await supabaseAdmin
        .from("news_items")
        .select("id, source, title, url, symbols, published_at")
        .eq("id", id)
        .single();

    if (error || !data) return null;
    return data as NewsItem;
}

export async function getAllNewsIds(limit = 500) {
    const { data, error } = await supabaseAdmin
        .from("news_items")
        .select("id, published_at")
        .order("published_at", { ascending: false })
        .limit(limit);

    if (error) return [];
    return data || [];
}
