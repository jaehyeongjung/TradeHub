import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "개인정보처리방침 | TradeHub",
    description: "TradeHub의 개인정보 수집·이용·보관 및 제3자 제공에 관한 방침을 안내합니다.",
    alternates: { canonical: "https://www.tradehub.kr/privacy" },
    robots: { index: true, follow: true },
};

const UPDATED = "2025-06-01";

export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-3xl px-5 py-16 text-white">
            <nav aria-label="breadcrumb" className="mb-8 text-sm text-zinc-500">
                <ol className="flex items-center gap-1">
                    <li><Link href="/" className="hover:text-zinc-300">홈</Link></li>
                    <li>/</li>
                    <li className="text-zinc-300">개인정보처리방침</li>
                </ol>
            </nav>

            <h1 className="text-3xl font-extrabold tracking-tight">개인정보처리방침</h1>
            <p className="mt-3 text-sm text-zinc-500">최종 업데이트: {UPDATED}</p>

            <div className="mt-10 space-y-10 text-zinc-300 leading-relaxed">

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">1. 개요</h2>
                    <p>
                        TradeHub(이하 "서비스")는 이용자의 개인정보를 소중히 여기며, 관련 법령을 준수합니다.
                        본 방침은 서비스가 수집하는 정보의 종류, 이용 목적, 보관 기간 및 제3자 제공에 관한 사항을 안내합니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">2. 수집하는 정보</h2>
                    <p className="mb-3">TradeHub는 서비스 운영을 위해 아래와 같은 정보를 수집하거나 처리할 수 있습니다.</p>
                    <ul className="space-y-2 ml-4">
                        {[
                            "이메일 주소 (소셜 로그인 선택 시)",
                            "브라우저 로컬스토리지에 저장되는 모의투자 거래 내역, 테마 설정 등 (서버에 전송되지 않음)",
                            "서비스 이용 기록, 접속 IP, 브라우저 종류 (Google Analytics를 통해 익명 수집)",
                            "Google AdSense를 통한 광고 노출·클릭 관련 쿠키",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">3. 수집 목적</h2>
                    <ul className="space-y-2 ml-4">
                        {[
                            "회원 식별 및 서비스 제공",
                            "서비스 이용 분석 및 품질 개선",
                            "맞춤형 광고 표시 (Google AdSense)",
                            "불법·부정 이용 탐지 및 방지",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">4. 제3자 서비스</h2>
                    <p className="mb-4">TradeHub는 아래 제3자 서비스를 이용하며, 각 서비스의 개인정보처리방침이 적용됩니다.</p>
                    <div className="space-y-4">
                        {[
                            {
                                name: "Google Analytics",
                                desc: "서비스 이용 통계 분석. 익명화된 데이터만 수집하며, Google의 개인정보처리방침이 적용됩니다.",
                            },
                            {
                                name: "Google AdSense",
                                desc: "광고 게재를 위해 쿠키를 사용합니다. 관심 기반 광고를 비활성화하려면 Google 광고 설정을 이용하세요.",
                            },
                            {
                                name: "Supabase",
                                desc: "회원 인증 정보 저장. 이메일 주소는 Supabase 서버에 보관되며 Supabase의 보안 정책이 적용됩니다.",
                            },
                            {
                                name: "Binance API",
                                desc: "실시간 시세 데이터 조회에 사용됩니다. 개인 식별 정보는 전송되지 않습니다.",
                            },
                        ].map((svc) => (
                            <div key={svc.name} className="rounded-xl bg-zinc-900/60 p-4 ring-1 ring-zinc-800">
                                <h3 className="text-sm font-semibold text-white mb-1">{svc.name}</h3>
                                <p className="text-sm text-zinc-400">{svc.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">5. 쿠키</h2>
                    <p>
                        TradeHub는 서비스 기능 제공 및 광고 목적으로 쿠키를 사용합니다.
                        브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">6. 개인정보 보관 기간</h2>
                    <p>
                        회원 정보는 탈퇴 시 즉시 파기됩니다. 단, 관계 법령에 따라 보존이 필요한 경우 법정 기간 동안 보관합니다.
                        로컬스토리지 데이터는 이용자가 직접 브라우저에서 삭제할 수 있습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">7. 이용자의 권리</h2>
                    <p className="mb-3">이용자는 아래 권리를 보유합니다.</p>
                    <ul className="space-y-2 ml-4">
                        {[
                            "개인정보 열람·수정·삭제 요청",
                            "개인정보 처리 정지 요청",
                            "Google 맞춤 광고 비활성화",
                        ].map((item) => (
                            <li key={item} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#02C076]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-white mb-3">8. 문의</h2>
                    <p>
                        개인정보 관련 문의는 아래 이메일로 연락 바랍니다.
                    </p>
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
