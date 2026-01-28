import Image from "next/image";

export default function SeoFooter() {
    return (
        <section
            aria-labelledby="seo-footer-heading"
            className="border-t border-zinc-800 mt-5"
        >
            <div className="mx-auto w-full max-w-screen-xl px-5 py-8 text-zinc-300 ">
                <Image
                    src="/favicon.png"
                    alt="TradeHub 로고"
                    width={80}
                    height={80}
                    className="ml-[-18px]"
                />
                <h2
                    id="seo-footer-heading"
                    className="text-base md:text-xl font-semibold text-white"
                >
                    TradeHub, 코인 선물 커뮤니티
                    <br></br>실시간 포지션과 롱/숏 비율을 한 화면에서
                </h2>
                <p className="mt-5  text-sm md:text-base">
                    TradeHub는 코인 커뮤니티와 코인선물 커뮤니티 기능을 결합해
                    <strong className="font-medium">
                        {" "}
                        실시간 포지션(롱/숏 비율)
                    </strong>
                    ,<strong className="font-medium"> 김치 프리미엄</strong>,
                    코인 뉴스, 실시간 채팅을 제공합니다. <br />
                    <span className="text-amber-400">바이낸스</span> 글로벌·Top
                    트레이더 포지션 비율을 비교하고, 시장 흐름을 한눈에 파악할
                    수 있습니다.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-3">
                    <article className="rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800">
                        <h3 className="text-sm font-semibold text-white">
                            실시간 포지션 · 롱숏 비율
                        </h3>
                        <p className="mt-2 text-sm">
                            글로벌/Top 트레이더 포지션 비율을 실시간으로
                            확인하고 변동 구간을 빠르게 파악하세요.
                        </p>
                        <div className="mt-3"></div>
                    </article>

                    <article className="rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800">
                        <h3 className="text-sm font-semibold text-white">
                            커뮤니티 · 실시간 채팅
                        </h3>
                        <p className="mt-2 text-sm">
                            실시간 채팅으로 트레이더들과 의견을 나누고, 게시글로
                            수익/손실 후기를 공유하세요.
                        </p>
                        <div className="mt-3 space-x-3"></div>
                    </article>
                    <article className="rounded-xl bg-zinc-900/60 p-7 ring-1 ring-zinc-800">
                        <h3 className="text-sm font-semibold text-white">
                            Contact
                        </h3>
                        <ul className="mt-2 text-sm leading-7">
                            <li>
                                이메일:&nbsp;
                                <a
                                    href="mailto:whird398@naver.com"
                                    className="text-teal-400 hover:underline"
                                >
                                    whird398@naver.com
                                </a>
                            </li>

                            {/* 필요 시 내부 문의 페이지가 있으면 활성화 */}
                            {/* <li>
                    <Link href="/contact" className="text-teal-400 hover:underline">
                    문의/제휴 폼 열기
                    </Link>
                </li> */}
                        </ul>
                        <p className="mt-2 text-xs text-zinc-500">
                            피드백이나 버그 제보 환영합니다. 가능한 빠르게
                            답변드리겠습니다.
                        </p>
                    </article>
                </div>

                {/* 작은 각주/브랜딩 */}
                <p className="mt-8 text-xs text-zinc-500">
                    TradeHub는 트레이더를 위한 실시간 포지션·롱숏 비율·김치
                    프리미엄·뉴스·채팅을 한 화면에서 제공하는 코인 선물
                    커뮤니티입니다.
                </p>
            </div>
        </section>
    );
}
