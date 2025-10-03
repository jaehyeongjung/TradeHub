import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from")!;
    const to = searchParams.get("to")!;
    const countries = searchParams.get("countries");

    const key = process.env.TRADING_ECONOMICS_KEY;
    if (!key) {
        return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const url = new URL("https://api.tradingeconomics.com/calendar");
    url.searchParams.set("d1", from);
    url.searchParams.set("d2", to);
    if (countries) url.searchParams.set("country", countries);
    url.searchParams.set("c", key);
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
        const text = await res.text();
        return new NextResponse(text, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
}
