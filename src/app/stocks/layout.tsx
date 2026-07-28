import { StocksHeader } from "./StocksHeader";

// HeaderNav는 /stocks에서 스스로 null을 반환하고, 대신 이 심플 헤더가 걸린다.
export default function StocksLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[var(--surface-page)]">
            <StocksHeader />
            {children}
        </div>
    );
}
