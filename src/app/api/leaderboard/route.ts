import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 30;

export async function GET() {
    const { data: accounts, error } = await supabaseAdmin
        .from("sim_accounts")
        .select("user_id, balance, total_deposit");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: positions } = await supabaseAdmin
        .from("sim_positions")
        .select("user_id, margin, unrealized_pnl")
        .eq("status", "OPEN");

    // 유저별 열린 포지션 집계
    const positionsByUser: Record<string, { margin: number; unrealized_pnl: number }[]> = {};
    for (const pos of positions ?? []) {
        if (!positionsByUser[pos.user_id]) positionsByUser[pos.user_id] = [];
        positionsByUser[pos.user_id].push({ margin: pos.margin, unrealized_pnl: pos.unrealized_pnl });
    }

    const leaderboard = (accounts ?? [])
        .map((acc) => {
            const userPositions = positionsByUser[acc.user_id] ?? [];
            const positionValue = userPositions.reduce(
                (sum, p) => sum + (p.margin ?? 0) + (p.unrealized_pnl ?? 0),
                0
            );
            const totalAsset = (acc.balance ?? 0) + positionValue;
            const deposit = acc.total_deposit ?? 10000;
            const roi = deposit > 0 ? ((totalAsset - deposit) / deposit) * 100 : 0;

            return {
                user_id: acc.user_id,
                total_asset: totalAsset,
                roi,
            };
        })
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 100);

    return NextResponse.json(leaderboard);
}
