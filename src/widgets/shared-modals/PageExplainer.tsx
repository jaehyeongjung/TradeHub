import Link from "next/link";

/**
 * 도구 페이지 아래에 붙는 설명 섹션.
 *
 * /dashboard·/trading·/ranking·/analysis는 위젯과 숫자로만 이루어져 있어,
 * JS를 실행하지 않는 크롤러 눈에는 본문이 거의 없는 페이지로 보인다.
 * 실제로 애드센스가 "가치가 별로 없는 콘텐츠"로 사이트 전체 게재를 중단시켰다.
 *
 * 그래서 각 도구가 무엇을 보여주고 그 숫자를 어떻게 읽는지를 HTML에 남긴다.
 * 화면을 처음 본 사람에게도 필요한 설명이라 SEO만을 위한 문구가 아니다.
 */

export type ExplainerItem = {
    term: string;
    body: string;
    /** 더 자세한 설명이 있는 가이드 slug (예: "crypto-liquidation") */
    guide?: string;
};

type Props = {
    heading: string;
    lead: string;
    items: ExplainerItem[];
    /** 문단 하나로 마무리할 내용 (읽는 법, 주의점 등) */
    closing?: string;
};

export function PageExplainer({ heading, lead, items, closing }: Props) {
    return (
        <section className="mx-auto max-w-3xl px-5 pt-14 pb-4 text-zinc-300">
            <h2 className="text-xl font-bold tracking-tight text-white">{heading}</h2>
            <p className="mt-3 leading-[1.8]">{lead}</p>

            <dl className="mt-7 space-y-5">
                {items.map((item) => (
                    <div
                        key={item.term}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                    >
                        <dt className="font-bold text-white">{item.term}</dt>
                        <dd className="mt-1.5 text-sm leading-[1.75] text-zinc-400">
                            {item.body}
                            {item.guide && (
                                <>
                                    {" "}
                                    <Link
                                        href={`/guide/${item.guide}`}
                                        className="font-medium text-[#02C076] hover:underline"
                                    >
                                        자세히 보기
                                    </Link>
                                </>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>

            {closing && <p className="mt-7 leading-[1.8]">{closing}</p>}
        </section>
    );
}
