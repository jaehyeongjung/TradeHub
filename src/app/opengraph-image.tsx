import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TradeHub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: "#060C14",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "64px 72px",
                    fontFamily: "sans-serif",
                }}
            >
                {/* 로고 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                        style={{
                            fontSize: "22px",
                            fontWeight: 900,
                            color: "white",
                            letterSpacing: "-0.06em",
                        }}
                    >
                        TRADEHUB
                    </span>
                    <div
                        style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#00C896",
                            marginBottom: "2px",
                        }}
                    />
                </div>

                {/* 메인 텍스트 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span
                        style={{
                            fontSize: "96px",
                            fontWeight: 900,
                            color: "#00C896",
                            letterSpacing: "-0.06em",
                            lineHeight: 0.85,
                        }}
                    >
                        NO RISK,
                    </span>
                    <span
                        style={{
                            fontSize: "96px",
                            fontWeight: 900,
                            color: "white",
                            letterSpacing: "-0.06em",
                            lineHeight: 0.85,
                        }}
                    >
                        JUST EDGE.
                    </span>
                </div>

                {/* 하단 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "18px", color: "rgba(255,255,255,0.45)", letterSpacing: "-0.01em" }}>
                        더 큰 화면으로, 더 자세하게 즐겨보세요.
                    </span>
                    <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.2)", letterSpacing: "0" }}>
                        tradehub.kr
                    </span>
                </div>
            </div>
        ),
        { ...size }
    );
}
