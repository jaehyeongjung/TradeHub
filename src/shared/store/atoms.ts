"use client";

import { atom } from "jotai";
import type { MarginMode } from "@/shared/types/sim-trading.types";

export const treemapOpenAtom = atom(false);

export const loginDrawerOpenAtom = atom(false);

export const activePageAtom = atom<"main" | "sim">("main");

export const simSymbolAtom = atom("BTCUSDT");

export const simPricesAtom = atom<Record<string, number>>({});

export const simChangesAtom = atom<Record<string, number>>({});

export const simMarginModeAtom = atom<MarginMode>("CROSS");

/**
 * 주식 토큰 현재가 (USDT). key = 바이낸스 심볼 예: "SAMSUNG"
 *
 * /stocks/[slug]에서 StockLiveData가 여는 @ticker 소켓 하나를 층 단면도와 나눠 쓴다.
 * 구독자가 소켓을 따로 열면 같은 스트림이 중복된다.
 */
export const stockPriceAtom = atom<Record<string, number>>({});

/**
 * 방별 실시간 접속자 수. key = roomId 예: "stock:samsung"
 *
 * useRoomPresence가 채운다. 같은 방을 보는 다른 위치의 컴포넌트(히어로 문구 등)가
 * presence 채널을 또 열지 않고 이 값을 읽는다.
 */
export const roomViewerCountAtom = atom<Record<string, number>>({});
