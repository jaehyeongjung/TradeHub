import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "TradeHub 소개 — 만든 사람, 데이터 출처, 문의",
    description:
        "TradeHub가 어떤 서비스이고 누가 만들었는지, 시세 데이터는 어디서 오는지, 무엇으로 운영되는지 밝힙니다. 문의는 이메일로 받습니다.",
    alternates: { canonical: "https://www.tradehub.kr/about" },
    robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "whird398@naver.com";

/** 데이터 출처를 한 줄씩 밝힌다 — 시세 사이트에서 이건 신뢰의 근거다 */
const SOURCES = [
    {
        name: "바이낸스 선물 API",
        desc: "코인 시세, 청산 내역, 미결제약정, 주식 토큰(무기한 선물) 가격. 실시간 항목은 WebSocket으로 직접 받습니다.",
    },
    {
        name: "야후 파이낸스",
        desc: "주식 차트의 과거 봉 데이터.",
    },
    {
        name: "환율",
        desc: "원화 환산에 쓰는 USD/KRW. 시세를 원화로 보여줄 때만 씁니다.",
    },
    {
        name: "Supabase",
        desc: "게시판·채팅·모의투자 기록 등 이용자 데이터 저장. 처리 범위는 개인정보처리방침에 적었습니다.",
    },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

export default function AboutPage() {
    return (
        <main className="mx-auto max-w-3xl px-5 py-16 text-white">
            <nav aria-label="breadcrumb" className="mb-8 text-sm text-zinc-500">
                <ol className="flex items-center gap-1">
                    <li><Link href="/" className="hover:text-zinc-300">홈</Link></li>
                    <li>/</li>
                    <li className="text-zinc-300">소개</li>
                </ol>
            </nav>

            <h1 className="text-3xl font-extrabold tracking-tight">TradeHub 소개</h1>
            <p className="mt-3 text-sm text-zinc-500">
                누가 만들었고, 숫자는 어디서 오고, 무엇으로 운영되는지 밝힙니다.
            </p>

            <div className="mt-10 space-y-10 text-zinc-300 leading-relaxed">

                <Section title="어떤 서비스인가">
                    <p>
                        TradeHub는 암호화폐와 주식 토큰의 실시간 시세를 한 화면에서 보고,
                        위험 없이 선물 거래를 연습해볼 수 있는 무료 서비스입니다.
                    </p>
                    <p>
                        시작은 단순한 불편에서였습니다. 청산 내역은 이 사이트에서, 김치프리미엄은
                        저 사이트에서, 공포탐욕지수는 또 다른 곳에서 봐야 했습니다. 탭을 여러 개
                        띄워놓고 번갈아 보는 게 번거로워서, 자주 보는 지표를 한 화면에 모으는
                        것부터 만들었습니다.
                    </p>
                    <p>
                        모의투자를 붙인 이유도 비슷합니다. 선물 거래는 청산이라는 개념을 겪어보기
                        전에는 감이 잡히지 않는데, 그걸 실제 돈으로 배우면 대가가 너무 큽니다.
                    </p>
                </Section>

                <Section title="지금 제공하는 것">
                    <ul className="space-y-2 ml-1">
                        {[
                            "실시간 코인 대시보드 — 청산, 고래 거래, 거래량 트리맵, 김치프리미엄, 공포탐욕지수",
                            "선물 모의투자 — 지정가·시장가·스탑 주문, TP/SL, 청산, 포지션 병합",
                            "수익률 랭킹 — 모의투자 성적 순위",
                            "주식 토큰 시세 — 삼성전자·SK하이닉스·현대차의 24시간 가격",
                            "투자 용어 가이드 — 김치프리미엄, 레버리지, 마진, 청산 등 개념 설명",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="데이터는 어디서 오나">
                    <p>
                        TradeHub는 시세를 직접 만들지 않습니다. 아래 출처에서 받아와 보여주고,
                        원화 환산처럼 보기 편한 형태로 가공할 뿐입니다.
                    </p>
                    <dl className="mt-4 space-y-4">
                        {SOURCES.map((s) => (
                            <div key={s.name} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                                <dt className="font-semibold text-white">{s.name}</dt>
                                <dd className="mt-1 text-sm text-zinc-400">{s.desc}</dd>
                            </div>
                        ))}
                    </dl>
                </Section>

                <Section title="누가 만드나">
                    <p>
                        1인이 개발하고 운영합니다. 기획·디자인·개발·운영을 혼자 하고 있어
                        반영이 느릴 수 있습니다.
                    </p>
                    <p>
                        만들면서 겪은 문제와 해결 과정은 기술 블로그에 시리즈로 기록하고 있습니다.
                        어떤 판단으로 무엇을 만들었는지는 그쪽에 더 자세히 적혀 있습니다.
                    </p>
                </Section>

                <Section title="무엇으로 운영되나">
                    <p>
                        모든 기능은 무료이고 유료 결제가 없습니다. 서버 비용과 API 사용료는
                        페이지에 게재되는 광고(Google AdSense)로 충당합니다.
                    </p>
                    <p>
                        특정 거래소나 상품으로부터 대가를 받고 홍보하지 않습니다. 바이낸스 데이터를
                        쓰는 것은 공개 API로 가장 넓은 시세를 받을 수 있기 때문이고, 제휴 관계가
                        있어서가 아닙니다.
                    </p>
                </Section>

                <Section title="투자 조언이 아닙니다">
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                        <p className="text-amber-300 text-sm font-semibold mb-2">⚠️ 반드시 확인해 주세요</p>
                        <p className="text-sm text-amber-100/80">
                            TradeHub가 제공하는 모든 수치와 설명은 정보 제공이 목적이며 투자 권유가
                            아닙니다. 모의투자는 가상 자산으로 이루어지는 연습 기능이고 실제 거래가
                            아닙니다. 주식 토큰 가격은 해당 종목의 공식 주가가 아니라 주가를 추종하는
                            무기한 선물 가격이며, 정규장 종가와 차이가 납니다. 투자 판단과 그 결과에
                            대한 책임은 이용자 본인에게 있습니다.
                        </p>
                    </div>
                </Section>

                <Section title="문의">
                    <p>
                        기능 제안, 오류 신고, 데이터가 이상하게 보이는 경우, 제휴·광고 문의는
                        모두 아래 이메일로 받습니다. 혼자 운영하고 있어 답변까지 며칠 걸릴 수
                        있습니다.
                    </p>
                    <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="inline-block mt-1 text-[#02C076] hover:underline font-medium"
                    >
                        {CONTACT_EMAIL}
                    </a>
                    <p className="text-sm text-zinc-500">
                        오류를 알려주실 때 어느 페이지에서 무엇을 하다가 생겼는지 함께 적어주시면
                        훨씬 빨리 고칠 수 있습니다.
                    </p>
                </Section>

                <Section title="관련 문서">
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/terms"
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-white/25 transition-colors"
                        >
                            이용약관
                        </Link>
                        <Link
                            href="/privacy"
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-white/25 transition-colors"
                        >
                            개인정보처리방침
                        </Link>
                        <Link
                            href="/guide"
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-white/25 transition-colors"
                        >
                            투자 용어 가이드
                        </Link>
                    </div>
                </Section>
            </div>
        </main>
    );
}
