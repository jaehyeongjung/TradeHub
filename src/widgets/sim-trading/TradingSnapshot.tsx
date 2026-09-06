// /trading이 크롤러에게 내보내는 본문. 모의투자 화면은 주문판·포지션·잔고가
// 전부 클라이언트에서 그려져, JS 없는 HTML에는 한 글자도 남지 않았다.
// 연습할 수 있는 종목과 그 시세를 서버에서 채워 넣는다.

import { getFuturesTickers } from "@/shared/lib/market-snapshot.server";
import { SUPPORTED_SYMBOLS, SYMBOL_NAMES, LEVERAGE_PRESETS } from "@/shared/constants/sim-trading.constants";
import {
    SnapshotSection, ScrollTable, Change, thClass, tdClass, usd, compactUsd,
} from "@/widgets/shared-modals/SnapshotSection";

/** 표에 넣을 종목 수. 56개를 전부 늘어놓으면 표가 페이지를 잡아먹는다. */
const SHOWN = 20;

export async function TradingSnapshot() {
    const tickers = await getFuturesTickers();
    if (!tickers) return null;

    const rows = SUPPORTED_SYMBOLS
        .map((s) => tickers.get(s))
        .filter((t) => t != null)
        .sort((a, b) => b.quoteVolume - a.quoteVolume);

    if (!rows.length) return null;

    const top = rows.slice(0, SHOWN);
    const maxLev = LEVERAGE_PRESETS[LEVERAGE_PRESETS.length - 1];
    const updated = new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    return (
        <SnapshotSection
            heading="어떤 종목으로 연습할 수 있나요?"
            lead={
                `모의투자는 바이낸스 USDT 무기한 선물 ${rows.length}개 종목을 지원하고, 주문은 실제 체결 가격이 아니라 ` +
                `그 시세를 그대로 따라갑니다. 아래는 거래대금이 큰 순서로 ${top.length}개를 ${updated} 기준으로 정리한 표입니다. ` +
                `레버리지는 1배부터 ${maxLev}배까지 고를 수 있는데, 배율을 올릴수록 같은 가격 변동에도 청산가가 진입가에 가까워집니다.`
            }
            note={`표의 시세는 페이지가 만들어진 시점의 값입니다. 실제 주문 화면은 접속한 뒤 실시간 가격으로 갱신되며, 모의투자 결과가 실제 거래의 성과를 보장하지 않습니다.`}
        >
            <ScrollTable>
                <caption className="sr-only">모의투자 지원 종목 24시간 시세</caption>
                <thead>
                    <tr className="border-b border-border-subtle">
                        <th scope="col" className={thClass}>종목</th>
                        <th scope="col" className={thClass}>현재가</th>
                        <th scope="col" className={thClass}>24h 등락</th>
                        <th scope="col" className={thClass}>거래대금</th>
                        <th scope="col" className={thClass}>10배 청산 거리</th>
                    </tr>
                </thead>
                <tbody>
                    {top.map((t) => (
                        <tr key={t.symbol} className="border-b border-border-subtle last:border-0">
                            <th scope="row" className="px-3 py-2.5 text-left font-bold text-text-primary">
                                {SYMBOL_NAMES[t.symbol] ?? t.symbol}
                                <span className="ml-1.5 font-normal text-text-tertiary">
                                    {t.symbol.replace("USDT", "")}
                                </span>
                            </th>
                            <td className={tdClass}>{usd(t.last)}</td>
                            <td className={`${tdClass} font-bold`}><Change pct={t.changePct} /></td>
                            <td className={tdClass}>{compactUsd(t.quoteVolume)}</td>
                            {/* 10배면 약 10% 반대로 밀릴 때 증거금이 사라진다. 그 지점을 가격으로 보여준다 */}
                            <td className={tdClass}>{usd(t.last * 0.9)}</td>
                        </tr>
                    ))}
                </tbody>
            </ScrollTable>
            <p className="mt-3 text-label leading-[1.75] text-text-secondary">
                맨 오른쪽은 지금 가격에 10배 레버리지로 롱을 잡았을 때 증거금이 모두 사라지는 대략적인 가격입니다.
                수수료와 유지 증거금을 뺀 값이라 실제 청산가는 이보다 조금 앞에 놓이지만, 배율을 올린다는 게
                무슨 뜻인지는 이 한 칸으로 충분히 보입니다. 위 표에서 24시간 변동이 10%를 넘긴 종목이라면,
                10배로는 하루 안에 청산될 수 있는 자리였다는 뜻입니다.
            </p>
        </SnapshotSection>
    );
}
