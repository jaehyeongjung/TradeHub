import { StocksHeader } from "./StocksHeader";

// HeaderNav는 /stocks에서 스스로 null을 반환하고, 대신 이 심플 헤더가 걸린다.
//
// break-keep = word-break: keep-all.
// 한국어는 기본값(normal)에서 단어 중간이 잘려 "거래됩니 / 다"처럼 읽힌다.
// 상속되는 속성이라 여기 한 번만 걸면 하위 전체에 적용된다.
export default function StocksLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen break-keep bg-[var(--surface-page)]">
            <StocksHeader />
            {children}
        </div>
    );
}
