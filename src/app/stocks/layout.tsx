import type { Metadata } from "next";
import { StocksHeader } from "./StocksHeader";
import { InstallPrompt } from "./InstallPrompt";

/**
 * /stocks는 앱 전체와 다른 manifest를 쓴다.
 *
 * 루트 manifest는 start_url이 "/"라 코인 대시보드가 열린다. 주식 시세를 보러
 * 검색으로 들어온 사람이 홈 화면에 추가했는데 코인 화면이 뜨면 그대로 지운다.
 * 그래서 start_url을 /stocks로 둔 별도 manifest를 여기서만 덮어쓴다.
 */
export const metadata: Metadata = {
    manifest: "/manifest-stocks.json",
    appleWebApp: {
        capable: true,
        title: "TradeHub 주식",
        statusBarStyle: "black-translucent",
    },
    icons: {
        apple: "/favicon-512.png",
    },
};

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
            <InstallPrompt />
        </div>
    );
}
