import type { AltseasonData } from "@/app/api/altseason/route";

const STABLECOINS = new Set([
    "tether", "usd-coin", "binance-usd", "dai", "true-usd", "frax",
    "usdd", "paxos-standard", "gemini-dollar", "terrausd", "neutrino",
    "staked-ether", "wrapped-bitcoin", "wrapped-ether", "bitcoin-cash-sv",
]);

type CoinItem = {
    id: string; symbol: string; name: string; image: string;
    price_change_percentage_30d_in_currency: number | null;
};

export async function fetchAltseasonData(): Promise<AltseasonData | null> {
    try {
        const r = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=30d",
            { next: { revalidate: 600 } },
        );
        if (!r.ok) return null;

        const data = (await r.json()) as CoinItem[];
        const btc = data.find((c) => c.id === "bitcoin");
        const btc30d = btc?.price_change_percentage_30d_in_currency ?? 0;

        const alts = data
            .filter((c) =>
                c.id !== "bitcoin" &&
                !STABLECOINS.has(c.id) &&
                c.price_change_percentage_30d_in_currency != null,
            )
            .slice(0, 49);

        const outperformedCount = alts.filter(
            (c) => (c.price_change_percentage_30d_in_currency ?? 0) > btc30d,
        ).length;

        const score = Math.round((outperformedCount / alts.length) * 100);
        const zone: AltseasonData["zone"] =
            score >= 75 ? "altcoin" : score <= 25 ? "bitcoin" : "neutral";

        return {
            score, zone, btc30d, outperformedCount, total: alts.length,
            alts: alts.map((c) => ({
                id: c.id, symbol: c.symbol, name: c.name, image: c.image,
                change30d: c.price_change_percentage_30d_in_currency ?? 0,
                outperformedBtc: (c.price_change_percentage_30d_in_currency ?? 0) > btc30d,
            })),
        };
    } catch {
        return null;
    }
}
