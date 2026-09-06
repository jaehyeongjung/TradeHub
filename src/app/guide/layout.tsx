import { SeoFooter } from "@/widgets/shared-modals/SeoFooter";
import { MobileNav } from "@/widgets/mobile/MobileNav";

/**
 * 좁은 화면에서는 전역 HeaderNav 대신 모바일 헤더를 쓴다.
 *
 * HeaderNav는 로고 + 메뉴 5개 + 제휴 + 공유·트리맵·테마·로그인이 한 줄에
 * flex-shrink-0으로 늘어서 있어서 390px에서는 줄이 넘친다. 넘친 헤더가
 * body를 뷰포트보다 넓게 밀어내는 바람에 본문 오른쪽이 잘려 나갔다.
 * MobileNav를 얹으면 globals.css의 data-mobile-chrome 규칙이 1280px 미만에서
 * 전역 헤더를 감춘다 — /ranking·/analysis가 쓰는 방식 그대로다.
 */
export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileNav />
      {children}
      <SeoFooter />
    </>
  );
}
