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
