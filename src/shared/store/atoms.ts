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
