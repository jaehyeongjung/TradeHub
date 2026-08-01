// TradeHub 서비스 워커 — 아무것도 캐싱하지 않는다.
//
// 존재 이유는 하나뿐이다. 안드로이드 크롬은 fetch 핸들러를 가진 서비스 워커가
// 있어야 "홈 화면에 추가" 배너를 띄운다. 설치 조건을 만족시키는 게 전부다.
//
// 시세 사이트에서 캐싱은 위험하다. 어제 가격을 오늘 보여주는 순간 서비스가
// 죽는다. 그래서 요청을 가로채되 아무 처리도 하지 않고 네트워크로 흘려보낸다.
// (respondWith를 부르지 않으면 브라우저가 평소대로 요청을 처리한다)
//
// 나중에 웹 푸시를 붙일 때 push·notificationclick 핸들러가 여기로 들어온다.

self.addEventListener("install", () => {
    // 이전 워커를 기다리지 않고 바로 활성화한다
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    // 혹시 과거에 남은 캐시가 있으면 지운다
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
            await self.clients.claim();
        })(),
    );
});

self.addEventListener("fetch", () => {
    // 의도적으로 비워둔다. respondWith를 부르지 않으므로 네트워크로 그대로 나간다.
});
