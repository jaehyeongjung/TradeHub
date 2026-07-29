/**
 * 시맨틱 토큰은 var()라서 `#RRGGBBAA`처럼 알파를 덧붙일 수 없다.
 * 배지 배경처럼 같은 색을 옅게 깔아야 할 때 쓴다.
 */
export function tintOf(color: string, percent = 14): string {
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
