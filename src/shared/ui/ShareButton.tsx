"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link2, Share, Share2, X } from "lucide-react";
import { useToast } from "@/shared/ui/Toast";

/**
 * 공유 버튼.
 *
 * 예전엔 헤더에 카카오 옐로우 버튼이 박혀 있고, 누르면 카카오 → Web Share → 링크 복사
 * 순으로 알아서 하나를 골라 실행했다. 두 가지가 틀어져 있었다.
 *
 *  1. 라벨이 거짓말을 했다. 카카오 SDK는 tradehub.kr에서만 붙기 때문에(아래 참고)
 *     로컬·프리뷰에선 "카카오톡" 버튼을 눌러도 링크가 복사됐다. aria-label도 늘 카카오였다.
 *  2. 카카오가 준비되면 Web Share로는 절대 못 갔다. 문자·인스타 DM·에어드롭으로 보내려는
 *     사람에게는 길이 없었다.
 *
 * 지금은 채널을 우리가 고르지 않고 사용자가 고른다. 헤더 버튼은 무채색 아이콘 하나이고
 * (이 화면의 주인공은 가격이지 공유가 아니다), 누르면 시트에서 갈 곳을 고른다.
 * 카카오 노랑은 시트 안 아이콘에만 남는다 — 색이 필요한 자리에만 쓴다.
 *
 * 고를 게 하나뿐이면 시트를 띄우지 않고 바로 실행한다.
 */

type KakaoSdk = {
    isInitialized: () => boolean;
    init: (key: string) => void;
    Share: {
        sendScrap: (opts: { requestUrl: string }) => void;
    };
};

declare global {
    interface Window {
        Kakao?: KakaoSdk;
    }
}

const SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
const SDK_INTEGRITY = "sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4";

const KAKAO_PATH =
    "M12 3C6.477 3 2 6.463 2 10.734c0 2.743 1.82 5.152 4.556 6.532-.2.75-.724 2.72-.83 3.142-.13.523.192.516.404.376.166-.11 2.64-1.794 3.71-2.522.71.105 1.44.16 2.16.16 5.523 0 10-3.463 10-7.688C22 6.463 17.523 3 12 3z";

export function ShareButton({ className = "" }: { className?: string }) {
    const { showToast } = useToast();
    const [kakaoReady, setKakaoReady] = useState(false);
    const [canWebShare, setCanWebShare] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);

    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

    useEffect(() => setMounted(true), []);

    // navigator.share는 SSR에 없고 브라우저마다 갈려서, 렌더 중에 읽으면 하이드레이션이 어긋난다.
    useEffect(() => setCanWebShare(typeof navigator !== "undefined" && !!navigator.share), []);

    useEffect(() => {
        if (!appKey) return;
        // sendScrap은 카카오 서버가 해당 URL을 직접 크롤링한다. localhost는 접근이 불가능해
        // 실패가 카카오 팝업 안에서 일어나 아래 폴백으로 넘어오지 못한다.
        // 그래서 로컬·프리뷰에서는 SDK를 아예 붙이지 않고 Web Share / 링크 복사로 처리한다.
        if (!/(^|\.)tradehub\.kr$/.test(window.location.hostname)) return;

        function init() {
            const kakao = window.Kakao;
            if (!kakao) return;
            if (!kakao.isInitialized()) kakao.init(appKey!);
            setKakaoReady(true);
        }

        if (window.Kakao) {
            init();
            return;
        }

        // 이미 주입된 스크립트가 있으면 재사용
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SRC}"]`);
        if (existing) {
            existing.addEventListener("load", init, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = SDK_SRC;
        script.integrity = SDK_INTEGRITY;
        script.crossOrigin = "anonymous";
        script.async = true;
        script.addEventListener("load", init, { once: true });
        document.head.appendChild(script);
    }, [appKey]);

    // Escape로 닫고, Tab이 시트 밖으로 새지 않게 가둔다 (ResidentSheet와 같은 규칙)
    useEffect(() => {
        if (!open) return;
        document.body.classList.add("overflow-hidden");

        /* 열리면 포커스를 시트로 옮긴다. 이게 없으면 아래 Tab 가두기가 아예 안 걸린다 —
           activeElement가 시트 밖(트리거 버튼)이라 first/last 어느 쪽과도 안 맞아서
           첫 Tab이 그대로 뒤에 깔린 페이지로 새어나간다. 스크린리더도 시트가 열린 걸 모른다.
           닫을 땐 트리거로 되돌린다. 안 그러면 포커스가 body로 떨어져서
           키보드 사용자는 처음부터 Tab을 다시 밟아야 한다. */
        const restoreTo = document.activeElement as HTMLElement | null;
        sheetRef.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                return;
            }
            if (e.key !== "Tab") return;
            const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
            );
            if (!focusables || focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            } else if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        };

        window.addEventListener("keydown", onKey);
        return () => {
            document.body.classList.remove("overflow-hidden");
            window.removeEventListener("keydown", onKey);
            restoreTo?.focus();
        };
    }, [open]);

    /* 공유 대상은 클릭 시점의 document.title / location.href를 쓴다.
       헤더는 자기가 어느 페이지에 있는지 모르기 때문에, 이 방식이어야
       페이지마다 손대지 않아도 맞게 동작한다. */
    const sendToKakao = () => {
        try {
            window.Kakao?.Share.sendScrap({ requestUrl: window.location.href });
        } catch {
            showToast("카카오톡 공유에 실패했어요. 링크를 복사해 보내주세요.", "error");
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast("링크를 복사했어요", "success");
        } catch {
            showToast("링크 복사에 실패했어요", "error");
        }
    };

    const openWebShare = async () => {
        try {
            await navigator.share({ title: document.title, url: window.location.href });
        } catch (e) {
            // 사용자가 공유 시트를 닫은 경우는 에러가 아니다
            if (e instanceof DOMException && e.name === "AbortError") return;
            await copyLink();
        }
    };

    const actions = [
        kakaoReady && { key: "kakao", label: "카카오톡으로 보내기", run: sendToKakao },
        { key: "copy", label: "링크 복사", run: copyLink },
        canWebShare && { key: "web", label: "다른 앱으로", run: openWebShare },
    ].filter(Boolean) as { key: string; label: string; run: () => void | Promise<void> }[];

    const handleTrigger = () => {
        // 고를 게 하나뿐이면 시트가 질문이 아니라 방해다
        if (actions.length === 1) {
            void actions[0].run();
            return;
        }
        setOpen(true);
    };

    const run = (action: (typeof actions)[number]) => {
        setOpen(false);
        void action.run();
    };

    const sheet = !mounted
        ? null
        : createPortal(
              <AnimatePresence>
                  {open && (
                      <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
                          <motion.div
                              className="absolute inset-0 bg-black/55"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              onClick={() => setOpen(false)}
                          />

                          <motion.div
                              ref={sheetRef}
                              role="dialog"
                              aria-modal="true"
                              aria-labelledby="share-sheet-title"
                              tabIndex={-1}
                              /* pt는 모바일과 데스크톱이 다르다. 모바일은 위에 손잡이 바가
                                 있어서 그게 여백 노릇을 하지만, 데스크톱은 손잡이가 숨겨져서
                                 (sm:hidden) 제목이 상단 모서리에 바로 붙는다. 같은 pt-3을
                                 쓰면 데스크톱만 답답해 보인다. */
                              className="relative max-h-[88dvh] w-full max-w-[440px] overflow-y-auto overscroll-contain rounded-t-card bg-[var(--surface-card)] px-5 pt-3 shadow-2xl outline-none sm:rounded-card sm:px-6 sm:pt-7"
                              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
                              initial={{ y: "100%" }}
                              animate={{ y: 0 }}
                              exit={{ y: "100%" }}
                              transition={{ type: "spring", stiffness: 260, damping: 28 }}
                              drag="y"
                              dragConstraints={{ top: 0, bottom: 0 }}
                              dragElastic={{ top: 0, bottom: 0.35 }}
                              onDragEnd={(_, info) => {
                                  if (info.offset.y > 110 || info.velocity.y > 600) setOpen(false);
                              }}
                          >
                              <div className="mx-auto mb-5 h-1 w-9 shrink-0 rounded-full bg-[var(--border-strong)] sm:hidden" />

                              {/* 닫는 길이 백드롭 클릭과 Escape뿐이면 데스크톱에서 발견성이 낮다.
                                  모바일은 손잡이 바가 "끌어내리면 닫힌다"를 말해주지만
                                  데스크톱엔 그 신호가 없어서 X를 둔다. */}
                              <button
                                  type="button"
                                  onClick={() => setOpen(false)}
                                  aria-label="닫기"
                                  className="absolute right-3 top-3 hidden h-9 w-9 cursor-pointer place-items-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] sm:grid"
                              >
                                  <X size={17} strokeWidth={2.2} />
                              </button>

                              <h2
                                  id="share-sheet-title"
                                  className="text-title3 font-bold tracking-tight text-[var(--text-primary)]"
                              >
                                  공유하기
                              </h2>
                              {/* 무엇을 보내는지 보여준다. 링크만 복사해놓고 뭘 복사했는지
                                  모르는 상태로 두지 않는다. */}
                              <p className="mt-1.5 truncate text-footnote text-[var(--text-tertiary)]">
                                  {document.title}
                              </p>

                              {/* 제목 묶음과 행 사이는 구분선 대신 여백으로 가른다 */}
                              <div className="mt-5 flex flex-col">
                                  {actions.map((action) => (
                                      <button
                                          key={action.key}
                                          type="button"
                                          onClick={() => run(action)}
                                          className="flex h-14 cursor-pointer items-center gap-3 rounded-control px-2 text-left transition-colors hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)]"
                                      >
                                          {/* 카카오 노랑은 여기 한 곳에만 쓴다. 나머지는 무채색이라
                                              "카카오로 보낸다"는 게 색으로 바로 읽힌다. */}
                                          <span
                                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                                                  action.key === "kakao"
                                                      ? ""
                                                      : "bg-[var(--surface-input)] text-[var(--text-secondary)]"
                                              }`}
                                              style={
                                                  action.key === "kakao"
                                                      ? { background: "#FEE500", color: "#191919" }
                                                      : undefined
                                              }
                                          >
                                              {action.key === "kakao" ? (
                                                  <svg
                                                      className="h-[18px] w-[18px]"
                                                      viewBox="0 0 24 24"
                                                      fill="currentColor"
                                                      aria-hidden="true"
                                                  >
                                                      <path d={KAKAO_PATH} />
                                                  </svg>
                                              ) : action.key === "copy" ? (
                                                  <Link2 size={18} strokeWidth={2} />
                                              ) : (
                                                  <Share2 size={18} strokeWidth={2} />
                                              )}
                                          </span>
                                          <span className="text-body font-medium text-[var(--text-primary)]">
                                              {action.label}
                                          </span>
                                      </button>
                                  ))}
                              </div>
                          </motion.div>
                      </div>
                  )}
              </AnimatePresence>,
              document.body,
          );

    return (
        <>
            <button
                type="button"
                onClick={handleTrigger}
                aria-label="공유하기"
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-chip text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-input)] hover:text-[var(--text-primary)] ${className}`}
            >
                <Share size={17} strokeWidth={2} />
            </button>
            {sheet}
        </>
    );
}
