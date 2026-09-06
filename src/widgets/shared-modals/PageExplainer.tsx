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
 * 접어두지 않는 것도 같은 이유다 — 본문은 펼쳐진 채로 있어야 한다.
 */

export type ExplainerItem = {
    term: string;
    body: string;
    /** 더 자세한 설명이 있는 가이드 slug (예: "crypto-liquidation") */
    guide?: string;
    /**
     * 모바일 뷰에 없는 기능의 설명. 좁은 화면에서 숨긴다.
     *
     * DOM에서 빼지 않고 CSS로만 감추는 건 이 섹션의 존재 이유 때문이다 —
     * 애드센스·크롤러가 읽는 본문이 이 텍스트뿐이라, 뷰포트에 따라 조건부
     * 렌더하면 모바일 크롤러가 수집하는 본문이 그만큼 줄어든다.
     */
    desktopOnly?: boolean;
};

type Props = {
    heading: string;
    lead: string;
    items: ExplainerItem[];
    /** 문단 하나로 마무리할 내용 (읽는 법, 주의점 등) */
    closing?: string;
    /** 가이드 링크 문구. 영어 페이지에서 쓴다. */
};

export function PageExplainer({ heading, lead, items, closing }: Props) {
    return (
        <section className="mx-auto max-w-2xl px-4 pt-12 pb-8 sm:px-5">
            <h2 className="text-title3 font-bold tracking-tight text-text-primary">{heading}</h2>
            <p className="mt-2.5 text-body text-text-secondary">{lead}</p>

            <dl className="mt-6 space-y-2.5">
                {items.map((item) => (
                    <div
                        key={item.term}
                        className={`overflow-hidden rounded-card border border-border-subtle bg-surface-card${
                            item.desktopOnly ? " max-[1279.98px]:hidden" : ""
                        }`}
                    >
                        <div className="px-4 pt-3.5 pb-4">
                            <dt className="text-headline font-bold text-text-primary">{item.term}</dt>
                            <dd className="mt-1.5 text-label leading-[1.75] text-text-secondary">
                                {item.body}
                            </dd>
                        </div>

                        {/* 링크를 본문 끝에 인라인으로 붙이면 문장에 묻히고 터치 영역도 글자만큼밖에 안 된다.
                            줄을 따로 떼어 카드 폭 전체를 누를 수 있게 한다. */}
                        {item.guide && (
                            <Link
                                href={`/guide/${item.guide}`}
                                className="flex items-center justify-between gap-2 border-t border-border-subtle px-4 py-3 text-label font-bold text-[var(--color-accent-text)] transition-colors active:bg-surface-hover"
                            >자세히 보기<svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        )}
                    </div>
                ))}
            </dl>

            {/* 마무리 문단은 대개 주의사항이다. 항목 카드와 같은 무게로 두면
                읽고 나온 사람이 한 번 더 같은 크기의 벽을 만난다. */}
            {closing && (
                <p className="mt-4 rounded-card bg-surface-sunken px-4 py-3.5 text-footnote leading-[1.7] text-text-tertiary">
                    {closing}
                </p>
            )}
        </section>
    );
}
