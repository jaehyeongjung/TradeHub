/**
 * 캔버스에 글자를 그리는 라이브러리(lightweight-charts 등)에 넘길 폰트 스택.
 *
 * CSS는 `var(--font-app)`을 쓰면 되지만 캔버스 API는 var()를 못 읽는다.
 * next/font가 만드는 실제 패밀리 이름도 `__Inter_abc123` 같은 해시라서
 * 문자열로 박아둘 수 없다. 그래서 body의 계산된 값을 그대로 읽어 넘긴다.
 *
 * 지정하지 않으면 lightweight-charts는 자체 기본값
 * `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`를
 * 쓰는데, 이러면 축 라벨이 맥은 SF Pro·윈도우는 Trebuchet MS로 갈라진다.
 */
export function appFontStack(): string {
    if (typeof window === "undefined") return "sans-serif";
    return getComputedStyle(document.body).fontFamily || "sans-serif";
}
