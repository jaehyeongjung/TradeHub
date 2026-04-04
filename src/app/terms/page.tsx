import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "이용약관 | TradeHub",
    description: "TradeHub 서비스 이용약관입니다. 서비스 이용 전 반드시 확인해 주세요.",
    alternates: { canonical: "https://www.tradehub.kr/terms" },
    robots: { index: true, follow: true },
};

const UPDATED = "2025-06-01";

export default function TermsPage() {
    return (
        <main className="mx-auto max-w-3xl px-5 py-16 text-white">
            <nav aria-label="breadcrumb" className="mb-8 text-sm text-zinc-500">
                <ol className="flex items-center gap-1">
                    <li><Link href="/" className="hover:text-zinc-300">홈</Link></li>
                    <li>/</li>
                    <li className="text-zinc-300">이용약관</li>
                </ol>
            </nav>

            <h1 className="text-3xl font-extrabold tracking-tight">이용약관</h1>
            <p className="mt-3 text-sm text-zinc-500">최종 업데이트: {UPDATED}</p>

            <div className="mt-10 space-y-10 text-zinc-300 leading-relaxed">

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">제1조 (목적)</h2>
                    <p>
                        본 약관은 TradeHub(이하 "서비스")가 제공하는 암호화폐 모의투자 및 시장 분석 서비스의
                        이용 조건과 절차, 이용자와 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">제2조 (서비스 내용)</h2>
                    <p className="mb-3">TradeHub는 다음 서비스를 제공합니다.</p>
                    <ul className="space-y-2 ml-4">
                        {[
                            "암호화폐 선물 모의투자 (가상 자산 사용, 실제 거래 아님)",
                            "바이낸스 실시간 시세 및 청산 데이터 제공",
                            "고래 거래, 김치프리미엄, 공포탐욕지수 등 시장 지표 제공",
                            "코인 시가총액 랭킹 및 차트 분석 도구",
                            "암호화폐 투자 교육 가이드",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">제3조 (투자 면책)</h2>
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
                        <p className="text-amber-300 text-sm font-semibold">⚠️ 투자 위험 고지</p>
                    </div>
                    <p className="mb-3">
                        TradeHub는 교육 및 정보 제공 목적의 서비스입니다. 서비스 내 모든 정보는 투자 조언이 아니며,
                        다음 사항을 명시적으로 고지합니다.
                    </p>
                    <ul className="space-y-2 ml-4">
                        {[
                            "모의투자 결과는 실제 투자 성과를 보장하지 않습니다.",
                            "제공되는 시장 데이터는 참고용이며, 실제 거래 결정의 근거로 사용해서는 안 됩니다.",
                            "암호화폐 투자는 원금 손실 위험이 있습니다.",
                            "서비스 내 데이터 지연, 오류로 인한 투자 손실에 대해 책임을 지지 않습니다.",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">제4조 (이용자 의무)</h2>
                    <ul className="space-y-2 ml-4">
                        {[
                            "서비스를 불법적인 목적으로 사용하지 않아야 합니다.",
                            "타인의 계정을 무단으로 사용하거나 도용하지 않아야 합니다.",
                            "서비스의 정상적인 운영을 방해하는 행위를 하지 않아야 합니다.",
                            "자동화 도구(봇, 스크래퍼)를 이용한 과도한 요청을 하지 않아야 합니다.",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">제5조 (서비스 변경 및 중단)</h2>
                    <p>
                        TradeHub는 운영상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
                        서비스 중단 시 사전 공지를 원칙으로 하며, 불가피한 경우 사후 공지할 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">제6조 (광고)</h2>
                    <p>
                        TradeHub는 Google AdSense 등 제3자 광고 네트워크를 통해 광고를 게재합니다.
                        광고 콘텐츠는 서비스와 무관하며, 광고로 인한 손해에 대해 서비스는 책임을 지지 않습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">제7조 (준거법 및 관할)</h2>
                    <p>
                        본 약관은 대한민국 법률을 준거법으로 하며, 분쟁 발생 시 서울중앙지방법원을 제1심 관할 법원으로 합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">제8조 (문의)</h2>
                    <p>약관에 관한 문의는 아래 이메일로 연락 바랍니다.</p>
                    <a
                        href="mailto:whird398@naver.com"
                        className="mt-3 inline-flex items-center gap-2 text-[#02C076] hover:text-[#02A666] transition-colors text-sm font-semibold"
                    >
                        whird398@naver.com
                    </a>
                </section>

            </div>
        </main>
    );
}
