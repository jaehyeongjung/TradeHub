import { NextResponse } from "next/server";

export async function GET() {
    const url = "https://api.alternative.me/fng/?limit=1&format=json";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
    }
    const json = await res.json();
    return NextResponse.json(json);
}
