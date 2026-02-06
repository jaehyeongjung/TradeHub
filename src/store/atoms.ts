"use client";

import { atom } from "jotai";

/**
 * 트리맵 오버레이 열림 상태
 * - 트리맵이 열려있으면 true, 닫혀있으면 false
 * - 다른 컴포넌트들은 이 상태를 참조하여 불필요한 폴링을 중단
 */
export const treemapOpenAtom = atom(false);

/**
 * 통화 설정 (USD 또는 KRW)
 */
export type Currency = "USD" | "KRW";
export const currencyAtom = atom<Currency>("USD");

/**
 * 환율 정보 (USD → KRW)
 */
export const exchangeRateAtom = atom<number | null>(null);

/**
 * 업비트 KRW 가격 (심볼별)
 * key: 소문자 심볼 (예: "btc", "eth")
 */
export const upbitPricesAtom = atom<Record<string, number>>({});
