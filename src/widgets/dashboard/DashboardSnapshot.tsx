// /dashboard가 크롤러에게 내보내는 본문. 대시보드 위젯은 전부 WebSocket이라
// JS 없이는 `BTCUSDT $— —`, `연결 중`만 남는다. 같은 지표를 서버에서 한 번 채워
// HTML에 박아둔다. 자세한 사정은 market-snapshot.server.ts 주석에.

import {
    getFuturesTickers, getFearGreed, getKimchiPremium, getBreadth,
} from "@/shared/lib/market-snapshot.server";
import { SYMBOL_NAMES } from "@/shared/constants/sim-trading.constants";
import {
    SnapshotSection, ScrollTable, Change, thClass, tdClass, usd, compactUsd, krw,
} from "@/widgets/shared-modals/SnapshotSection";

const MAJORS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT"];

function pct(n: number) {
    return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export async function DashboardSnapshot() {
    const [tickers, fng, kimchi] = await Promise.all([
        getFuturesTickers(),
        getFearGreed(),
        getKimchiPremium(),
    ]);

    // 시세를 못 가져오면 섹션을 통째로 뺀다. 빈 표를 남기면 크롤러가 보는 본문이
    // 오히려 더 얇아지고, 사람에게도 고장 난 화면으로 보인다.
    if (!tickers) return null;

    const breadth = getBreadth(tickers);
    const rows = MAJORS.map((s) => tickers.get(s)).filter((t) => t != null);
    const btc = tickers.get("BTCUSDT");

    const updated = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    return (
        <SnapshotSection
            heading="지금 시장은 어떤 상태인가요?"
            lead={
                `이 페이지 위쪽 위젯이 실시간으로 그리는 값들을 ${updated} 기준으로 한 번 정리한 표입니다. ` +
                `USDT 무기한 선물 ${breadth.total.toLocaleString("ko-KR")}개 종목 가운데 ` +
                `${breadth.up.toLocaleString("ko-KR")}개가 오르고 ${breadth.down.toLocaleString("ko-KR")}개가 내렸으며, ` +
                `24시간 거래대금은 ${compactUsd(breadth.volume)}입니다.`
            }
            note="위 표는 페이지가 만들어진 시점의 값이고, 화면 상단 위젯은 접속한 뒤 실시간으로 갱신됩니다. 정보 제공이 목적이며 투자 권유가 아닙니다."
        >
            <ScrollTable>
                <caption className="sr-only">주요 코인 24시간 시세</caption>
                <thead>
                    <tr className="border-b border-border-subtle">
                        <th scope="col" className={thClass}>코인</th>
                        <th scope="col" className={thClass}>현재가</th>
                        <th scope="col" className={thClass}>24h 등락</th>
                        <th scope="col" className={thClass}>24h 고가 / 저가</th>
                        <th scope="col" className={thClass}>거래대금</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((t) => (
                        <tr key={t.symbol} className="border-b border-border-subtle last:border-0">
                            <th scope="row" className="px-3 py-2.5 text-left font-bold text-text-primary">
                                {SYMBOL_NAMES[t.symbol] ?? t.symbol}
                                <span className="ml-1.5 font-normal text-text-tertiary">
                                    {t.symbol.replace("USDT", "")}
                                </span>
                            </th>
                            <td className={tdClass}>{usd(t.last)}</td>
                            <td className={`${tdClass} font-bold`}><Change pct={t.changePct} /></td>
                            <td className={tdClass}>{usd(t.high)} / {usd(t.low)}</td>
                            <td className={tdClass}>{compactUsd(t.quoteVolume)}</td>
                        </tr>
                    ))}
                </tbody>
            </ScrollTable>

            <dl className="mt-2.5 space-y-2.5">
                {kimchi && (
                    <div className="rounded-card border border-border-subtle bg-surface-card px-4 pt-3.5 pb-4">
                        <dt className="text-headline font-bold text-text-primary">
                            김치프리미엄 {pct(kimchi.premium)}
                        </dt>
                        <dd className="mt-1.5 text-label leading-[1.75] text-text-secondary">
                            같은 시각 업비트 비트코인이 {krw(kimchi.upbitKrw)}, 바이낸스가 {usd(kimchi.binanceUsdt)}입니다.
                            적용 환율은 {krw(kimchi.usdkrw)}이고, 이 환율로 환산하면 국내 가격이 해외보다{" "}
                            {kimchi.premium >= 0
                                ? `${kimchi.premium.toFixed(2)}% 비쌉니다`
                                : `${Math.abs(kimchi.premium).toFixed(2)}% 쌉니다(역프)`}.
                            국내 수요가 몰리면 올라가고 심리가 식으면 내려가는데, 환율이 움직여도 값이 바뀌기 때문에 환율과 함께 봐야 합니다.
                        </dd>
                    </div>
                )}
                {fng && (
                    <div className="rounded-card border border-border-subtle bg-surface-card px-4 pt-3.5 pb-4">
                        <dt className="text-headline font-bold text-text-primary">
                            공포탐욕지수 {fng.value} ({fng.label})
                        </dt>
                        <dd className="mt-1.5 text-label leading-[1.75] text-text-secondary">
                            변동성·거래량·소셜 언급량 등을 종합해 0에서 100 사이로 시장 심리를 나타낸 값입니다.
                            지금은 {fng.value >= 75 ? "극단적 탐욕에 가까워, 과열을 경계할 구간"
                                  : fng.value >= 55 ? "탐욕 쪽으로 기운 상태"
                                  : fng.value >= 45 ? "공포와 탐욕이 팽팽한 중립 구간"
                                  : fng.value >= 25 ? "공포 쪽으로 기운 상태"
                                  : "극단적 공포 구간"}입니다.
                            가격을 예측하는 지표가 아니라 분위기가 한쪽으로 쏠려 있는지를 확인하는 용도입니다.
                        </dd>
                    </div>
                )}
                {btc && (
                    <div className="rounded-card border border-border-subtle bg-surface-card px-4 pt-3.5 pb-4">
                        <dt className="text-headline font-bold text-text-primary">
                            비트코인 24시간 변동폭 {(((btc.high - btc.low) / btc.low) * 100).toFixed(2)}%
                        </dt>
                        <dd className="mt-1.5 text-label leading-[1.75] text-text-secondary">
                            하루 사이 고가 {usd(btc.high)}, 저가 {usd(btc.low)} 사이를 오갔습니다.
                            변동폭이 커진 날에는 레버리지 포지션의 청산이 함께 몰리는 경향이 있어,
                            화면 위쪽 청산 목록과 같이 보면 어느 방향이 정리됐는지 읽을 수 있습니다.
                        </dd>
                    </div>
                )}
            </dl>
        </SnapshotSection>
    );
}
