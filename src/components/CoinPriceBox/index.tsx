"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SymbolPickerModal from "@/components/SymbolPickerModal";
import { supabase } from "@/lib/supabase-browser";

type Props = { boxId: string; defaultSymbol?: string };

export const CoinPriceBox = ({ boxId, defaultSymbol = "btcusdt" }: Props) => {
    // defaultSymbol은 props로 넘어오지만, 내부 상태는 소문자로 유지
    const initialSymbol = defaultSymbol.toLowerCase(); 

    const [symbol, setSymbol] = useState(initialSymbol);
    const [price, setPrice] = useState<number | null>(null);
    const [pct, setPct] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    
    // userId 상태는 로그인 여부와 현재 사용자 ID를 추적합니다.
    const [userId, setUserId] = useState<string | null>(null); 

    // --- 레이스 방지용 ---
    const wsRef = useRef<WebSocket | null>(null);
    const verRef = useRef(0); // 심볼 세대(version)
    const reconnectTimer = useRef<number | null>(null);

    const usd = useMemo(
        () =>
            new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
            }),
        []
    );

    // ********** 핵심 수정된 부분: 심볼 로드 및 로그인 상태 관리 **********
    useEffect(() => {
        // 1. 세션 변경 감지 리스너 설정
        const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
            const uid = session?.user?.id ?? null;
            setUserId(uid); // 유저 ID 업데이트 (로그인/로그아웃 즉시 반영)

            if (uid) {
                // 로그인 상태: DB에서 커스텀 값 로드
                const { data: row } = await supabase
                    .from("user_symbol_prefs")
                    .select("symbol")
                    .eq("user_id", uid)
                    .eq("box_id", boxId)
                    .maybeSingle();
                
                // DB에 저장된 값이 있으면 적용, 없으면 디폴트 심볼로 설정
                if (row?.symbol) {
                    setSymbol(row.symbol.toLowerCase());
                } else {
                    setSymbol(initialSymbol); 
                }
            } else {
                // 로그아웃 상태: 로컬 스토리지 확인 후, 없으면 디폴트값 적용
                const loc = localStorage.getItem(`coin_box:${boxId}`);
                if (loc) {
                    setSymbol(loc);
                } else {
                    // ⭐️ 로컬에도 값이 없으면 디폴트 심볼로 설정 (로그아웃 시 초기화)
                    setSymbol(initialSymbol); 
                }
            }
        });

        // 2. 초기 로드 시점의 세션 정보 처리 (onAuthStateChange가 비동기라 필요)
        (async () => {
            const { data } = await supabase.auth.getSession();
            const uid = data.session?.user?.id ?? null;
            setUserId(uid);

            if (uid) {
                const { data: row } = await supabase
                    .from("user_symbol_prefs")
                    .select("symbol")
                    .eq("user_id", uid)
                    .eq("box_id", boxId)
                    .maybeSingle();
                if (row?.symbol) setSymbol(row.symbol.toLowerCase());
                else setSymbol(initialSymbol); // DB에 저장된 값이 없을 경우 디폴트 심볼 적용
            } else {
                const loc = localStorage.getItem(`coin_box:${boxId}`);
                if (loc) setSymbol(loc);
                else setSymbol(initialSymbol); // 로컬에도 값이 없을 경우 디폴트 심볼 적용
            }
        })();

        return () => sub.subscription.unsubscribe();
    }, [boxId, initialSymbol]); // initialSymbol을 의존성 배열에 추가

    // 실시간 구독 (레이스/재연결 안전)
    useEffect(() => {
        // 새 세대 시작
        const myVer = ++verRef.current;

        // UI 초기화(옛 값 가림)
        setPrice(null);
        setPct(null);

        // 이전 타이머/소켓 정리
        if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
        if (wsRef.current) {
            try {
                wsRef.current.close(1000, "symbol change");
            } catch {}
            wsRef.current = null;
        }

        const stream = symbol.toLowerCase();
        const url = `wss://stream.binance.com:9443/ws/${stream}@ticker`;

        const connect = () => {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onmessage = (ev) => {
                // 세대 불일치면 무시 (옛 소켓에서 온 메시지 차단)
                if (verRef.current !== myVer) return;

                const d = JSON.parse(ev.data);
                const last = parseFloat(d?.c);
                const changePct = parseFloat(d?.P);
                if (!Number.isNaN(last)) setPrice(last);
                if (!Number.isNaN(changePct)) setPct(changePct);
            };

            ws.onclose = () => {
                // 여전히 같은 세대면 재연결 시도
                if (verRef.current === myVer) {
                    reconnectTimer.current = window.setTimeout(connect, 1200);
                }
            };

            ws.onerror = () => {
                try {
                    ws.close();
                } catch {}
            };
        };

        connect();

        // cleanup: 이 이펙트가 끝날 때만 실행(세대 외부에서 닫기)
        return () => {
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }
            if (wsRef.current) {
                try {
                    wsRef.current.close(1000, "cleanup");
                } catch {}
                wsRef.current = null;
            }
        };
    }, [symbol]);

    const saveSymbol = async (next: string) => {
        const s = next.toLowerCase();
        
        // ⭐️ 심볼을 즉시 업데이트 (UI 및 웹소켓 트리거)
        setSymbol(s); 

        if (userId) {
            // 로그인 상태: DB에 저장 (커스텀 값)
            await supabase
                .from("user_symbol_prefs")
                .upsert([{ user_id: userId, box_id: boxId, symbol: s }], {
                    onConflict: "user_id,box_id",
                });
            
            // ⭐️ 로그인 상태에서 로컬 스토리지에 남아있는 값이 있으면 충돌 방지를 위해 삭제하는 것이 좋습니다.
            // localStorage.removeItem(`coin_box:${boxId}`); 
        } else {
            // 로그아웃 상태: 로컬 스토리지에 저장 (임시 값)
            localStorage.setItem(`coin_box:${boxId}`, s);
        }
    };

    const pctColor =
        pct == null
            ? "text-gray-300"
            : pct > 0
            ? "text-emerald-500"
            : pct < 0
            ? "text-red-500"
            : "text-gray-300";
    const arrow = pct == null ? "" : pct > 0 ? "▲" : pct < 0 ? "▼" : "•";
    const pctText =
        pct == null ? "" : `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="min-w-30 w-full min-h-26 cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-3 shadow-md outline-none transition hover:border-neutral-700"
                title="클릭해서 코인 변경"
            >
                <h2 className="text-sm font-bold text-white">
                    {symbol.toUpperCase()}
                </h2>

                <p className={`mt-1 text-lg font-mono ${pctColor}`}>
                    {price != null ? usd.format(price) : "—"}
                </p>
                <div className={`mt-0.5 text-xs font-semibold ${pctColor}`}>
                    {pct != null ? (
                        <>
                            {arrow} {pctText}
                        </>
                    ) : (
                        "—"
                    )}
                </div>
            </button>

            <SymbolPickerModal
                open={open}
                initialSymbol={symbol}
                onClose={() => setOpen(false)}
                onSelect={saveSymbol}
            />
        </>
    );
};
