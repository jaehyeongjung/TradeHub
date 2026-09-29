/**
 * CoinGecko 요청 헤더.
 * 키 없이 부르면 CloudFront에서 403으로 막혀 랭킹이 통째로 비었다.
 * 무료 Demo 키를 COINGECKO_API_KEY 환경변수로 넣으면 x-cg-demo-api-key로 붙는다.
 */
export function cgHeaders(): Record<string, string> {
    const key = process.env.COINGECKO_API_KEY;
    return key
        ? { Accept: "application/json", "x-cg-demo-api-key": key }
        : { Accept: "application/json" };
}
