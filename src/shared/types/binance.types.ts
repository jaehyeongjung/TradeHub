export type KlineRow = [
    number,
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    number,
    string,
    string,
    string
];

export type Interval =
    | "1s"
    | "1m"
    | "3m"
    | "5m"
    | "15m"
    | "30m"
    | "1h"
    | "2h"
    | "4h"
    | "6h"
    | "8h"
    | "12h"
    | "1d"
    | "3d"
    | "1w"
    | "1M";

export type KlineMessage = {
    e: "kline";
    E: number;
    s: string;
    k: {
        t: number;
        T: number;
        s: string;
        i: Interval;
        o: string;
        h: string;
        l: string;
        c: string;
        v: string;
        x: boolean;
    };
};
