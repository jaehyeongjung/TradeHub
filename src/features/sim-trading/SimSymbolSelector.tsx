"use client";

import { useAtom, useAtomValue } from "jotai";
import { simSymbolAtom, simPricesAtom, simChangesAtom } from "@/shared/store/atoms";
import { SUPPORTED_SYMBOLS, SYMBOL_NAMES } from "@/shared/constants/sim-trading.constants";
import { SymbolSelector } from "@/shared/ui/SymbolSelector";

interface Props {
    isLight?: boolean;
}

export function SimSymbolSelector({ isLight = false }: Props) {
    const [simSymbol, setSimSymbol] = useAtom(simSymbolAtom);
    const prices = useAtomValue(simPricesAtom);
    const changes = useAtomValue(simChangesAtom);

    return (
        <SymbolSelector
            value={simSymbol}
            onChange={setSimSymbol}
            symbols={SUPPORTED_SYMBOLS}
            symbolNames={SYMBOL_NAMES}
            prices={prices}
            changes={changes}
            isLight={isLight}
        />
    );
}
