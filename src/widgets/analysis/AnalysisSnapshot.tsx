// /analysis가 크롤러에게 내보내는 본문. 차트는 종목을 고르기 전까지 비어 있어서
// JS 없는 HTML에는 "종목을 선택하세요"만 남았다. 이 화면이 다루는 숫자 —
// 24시간 고가·저가와 그 안에서 현재가가 어디쯤인지 — 를 서버에서 채운다.

import { getFuturesTickers } from "@/shared/lib/market-snapshot.server";
import { SUPPORTED_SYMBOLS, SYMBOL_NAMES } from "@/shared/constants/sim-trading.constants";
import {
    SnapshotSection, ScrollTable, Change, SymbolCell, thClass, tdClass, colSecondary, usd,
} from "@/widgets/shared-modals/SnapshotSection";

const SHOWN = 12;

/** 24시간 레인지 안에서 현재가의 위치(0% = 저가, 100% = 고가) */
function rangePos(last: number, high: number, low: number): number | null {
    const span = high - low;
    if (!(span > 0)) return null;
    return ((last - low) / span) * 100;
}

export async function AnalysisSnapshot() {
    const tickers = await getFuturesTickers();
    if (!tickers) return null;

    const rows = SUPPORTED_SYMBOLS
        .map((s) => tickers.get(s))
        .filter((t) => t != null)
        .sort((a, b) => b.quoteVolume - a.quoteVolume)
        .slice(0, SHOWN);

    if (!rows.length) return null;

    const btc = tickers.get("BTCUSDT");
    const updated = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    return (
        <SnapshotSection
            heading="지금 어느 가격대에 있나요?"
            lead={
                `지지선·저항선은 결국 가격이 반복해서 멈춘 자리입니다. 그 자리를 찾기 전에 먼저 볼 것은 ` +
                `지금 가격이 최근 레인지의 어디쯤에 있느냐입니다. 아래는 분석 도구가 지원하는 종목 가운데 ` +
                `거래대금 상위 ${rows.length}개의 24시간 레인지를 ${updated} 기준으로 정리한 표입니다.`
            }
            note="24시간은 짧은 창이라 이 표만으로 지지·저항을 판단할 수는 없습니다. 위 차트에서 더 긴 구간을 함께 보세요. 표시되는 선과 숫자는 과거 가격에서 계산한 참고 자료이고 미래를 예측하지 않습니다."
        >
            <ScrollTable>
                <caption className="sr-only">분석 지원 종목의 24시간 가격 레인지</caption>
                <thead>
                    <tr className="border-b border-border-subtle">
                        <th scope="col" className={thClass}>종목</th>
                        <th scope="col" className={thClass}>현재가</th>
                        <th scope="col" className={`${thClass} ${colSecondary}`}>24h 저가</th>
                        <th scope="col" className={`${thClass} ${colSecondary}`}>24h 고가</th>
                        <th scope="col" className={thClass}>레인지 내 위치</th>
                        <th scope="col" className={thClass}>변동폭</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((t) => {
                        const pos = rangePos(t.last, t.high, t.low);
                        return (
                            <tr key={t.symbol} className="border-b border-border-subtle last:border-0">
                                <SymbolCell name={SYMBOL_NAMES[t.symbol] ?? t.symbol} symbol={t.symbol} />
                                <td className={tdClass}>{usd(t.last)}</td>
                                <td className={`${tdClass} ${colSecondary}`}>{usd(t.low)}</td>
                                <td className={`${tdClass} ${colSecondary}`}>{usd(t.high)}</td>
                                <td className={tdClass}>{pos == null ? "—" : `${pos.toFixed(0)}%`}</td>
                                <td className={`${tdClass} font-bold`}><Change pct={t.changePct} /></td>
                            </tr>
                        );
                    })}
                </tbody>
            </ScrollTable>

            <p className="mt-3 text-label leading-[1.75] text-text-secondary">
                &ldquo;레인지 내 위치&rdquo;는 하루 저가를 0%, 고가를 100%로 놓았을 때 지금 가격이 놓인 자리입니다.
                90%를 넘겼다면 하루 중 가장 비싼 구간에서 사는 셈이라 손절폭을 어디에 두든 고가 근처가 되고,
                10%를 밑돌면 반대입니다. 진입가가 정해져 있을 때 손절가를 어디에 둘지, 그래서 손익비가 얼마가 되는지는
                위 차트 도구에서 레버리지별로 계산해 볼 수 있습니다.
                {btc && ` 기준이 되는 비트코인은 지금 ${usd(btc.last)}, 하루 변동폭 ${(((btc.high - btc.low) / btc.low) * 100).toFixed(2)}%입니다.`}
            </p>
        </SnapshotSection>
    );
}
