<img width="60" height="60" alt="favicon-512" src="https://github.com/user-attachments/assets/6557641a-0091-4d2a-a8ff-d1905a629115" />

# TradeHub

<br>

> 실시간 청산·고래 거래·트리맵·김치프리미엄·공포탐욕지수·모의투자·실시간 채팅까지, 코인 트레이더에게 필요한 정보를 한 화면에서.

<br>

## 대시보드

<img width="1432" height="686" alt="스크린샷 2026-02-07 오후 7 19 56" src="https://github.com/user-attachments/assets/7954aa1d-5710-4d74-bb29-04c9ebc837d5" />

| 영역 | 설명 | 데이터 소스 | 갱신 방식 |
|------|------|-------------|-----------|
| 실시간 청산 | 바이낸스 선물 청산 $5,000 이상 필터링 | Binance `!forceOrder@arr` | WebSocket |
| 고래 거래 | BTC·ETH·SOL·BNB·XRP $50K 이상 체결 감지 | Binance `aggTrade` | WebSocket (combined stream) |
| 코인 시세 | 심볼별 실시간 가격, 변동률, 24h 거래량 | Binance `@ticker` | WebSocket + REST 배치 |
| 캔들 차트 | 1m~1d 봉 차트, 과거 데이터 무한 스크롤 | Binance `@kline_{interval}` | WebSocket + REST |
| 김치프리미엄 | 업비트-바이낸스 괴리율 (MID 호가 우선) | 자체 API (`/api/kimchi`) | 5초 폴링 |
| 공포탐욕지수 | Alternative.me Fear & Greed Index | 자체 API (`/api/fear-greed`) | 마운트 시 1회 |
| 롱숏 비율 | Top Trader 포지션 비율 (5m~1d) | Binance Futures API | 60초 폴링 |
| 핫코인 | 거래량×변동성 스코어 상위 15개 로테이션 | Binance 24hr ticker | 30초 폴링, 2초 회전 |
| 시장지수 | S&P 500, Gold, KOSPI 등 | 자체 API (`/api/market-indices`) | 30초 폴링 |
| 실시간 채팅 | 유저 간 실시간 메시지 + 롱/숏 투표 | Supabase Realtime | `postgres_changes` 구독 |
| 뉴스 | 최신 암호화폐 뉴스 30건 | Supabase | 마운트 시 1회 |
| 현재 접속자 | 디바이스 기반 실시간 접속자 수 | Supabase Realtime | 15초 heartbeat |

- 폴링 기반 컴포넌트는 탭 비활성 시 자동 중지 (`useVisibilityPolling`)
- WebSocket 연결은 끊김 시 3초 후 자동 재연결

----

## 선물 모의투자

<img width="1432" height="686" alt="스크린샷 2026-02-07 오후 7 20 26" src="https://github.com/user-attachments/assets/12955b70-0b18-4a74-aeaf-9c7f869924b3" />

| 항목 | 설명 |
|------|------|
| 지원 종목 | BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, DOT, MATIC (USDT) |
| 실시간 시세 | Binance `@ticker` combined stream (WebSocket) |
| 시장 데이터 | 펀딩비·OI·24h 통계·롱숏비율 — 15초 폴링 |
| 차트 | lightweight-charts 캔들스틱 + 거래량 히스토그램 |
| TP/SL | 차트 위 드래그로 조절, Supabase에 실시간 저장 |
| 포지션 관리 | Supabase 기반 주문/포지션 영속 저장 |

---

## Tree Map

<img width="1437" height="684" alt="스크린샷 2026-01-31 오후 5 25 20" src="https://github.com/user-attachments/assets/4b82ac3b-05d2-4c58-84ec-1edbccef0a6b" />

- Binance 24hr ticker에서 거래대금 $500K 이상 필터 → 상위 150개 코인 표시
- 면적: `sqrt(거래량)` 로그 스케일 / 색상: 24h 변동률 기반 red-green gradient
- Squarified Treemap 레이아웃, 30초 폴링

<br>

<p align="center">
  <a href="https://www.tradehub.kr/" target="_blank" rel="noopener noreferrer">
    <img
      src="https://img.shields.io/badge/🚀 Visit_TradeHub-Click_Here-10B981?style=for-the-badge&logo=vercel&logoColor=white&labelColor=000000"
      alt="Visit TradeHub"
    />
  </a>
</p>

<br>

---

## Tech Stack

| Category | Stack |
|-----------|--------|
| **Frontend** | [Next.js (App Router)](https://nextjs.org/), TypeScript, TailwindCSS |
| **State** | Jotai |
| **Realtime** | WebSocket (Binance Stream), Supabase Realtime (`postgres_changes`) |
| **Chart** | lightweight-charts |
| **Backend** | [Supabase](https://supabase.com/) (Postgres · Realtime · Auth · Storage) |
| **Deploy** | [Vercel](https://vercel.com/) |

---

## Blog Series

| 회차 | 제목 | 링크 |
|------|------|------|
| ① | **코인 커뮤니티를 만들기로 마음먹었다 — [왜 coinpan은 대박났을까?]** | [Velog 보기](https://velog.io/@whird625/%EA%B8%B0%ED%9A%8D-%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EC%96%B4%EB%B3%B4%EA%B8%B0) |
| ② | **코인 커뮤니티를 만들기로 마음먹었다 — [구상 과정]** | [Velog 보기](https://velog.io/@whird625/%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EA%B8%B0%EB%A1%9C-%EB%A7%88%EC%9D%8C-%EB%A8%B9%EC%97%88%EB%8B%A4-2%ED%8E%B8-%EA%B5%AC%EC%83%81-%EA%B3%BC%EC%A0%95) |
| ③ | **코인 커뮤니티를 만들기로 마음먹었다 — [사용자 피드백을 받고 UI 고도화를 해 보자]** | [Velog 보기](https://velog.io/@whird625/%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EA%B8%B0%EB%A1%9C-%EB%A7%88%EC%9D%8C-%EB%A8%B9%EC%97%88%EB%8B%A4-3%ED%8E%B8-%EC%82%AC%EC%9A%A9%EC%9E%90-%ED%94%BC%EB%93%9C%EB%B0%B1-%EB%B0%9B%EA%B8%B0-%EB%A7%88%EC%BC%80%ED%8C%85) |
| ④ | **코인 커뮤니티를 만들기로 마음먹었다 — [바이낸스 api를 사용하던 중 451 error 발생 ]** | [Velog 보기](https://velog.io/@whird625/%EB%B0%94%EC%9D%B4%EB%82%B8%EC%8A%A4-%EC%97%90%EB%9F%AC-%ED%95%B4%EA%B2%B0) |
| ⑤ | **코인 커뮤니티를 만들기로 마음먹었다 — [사람들은 돈이 몰리는 곳을 찾는다.]** | [Velog 보기](https://velog.io/@whird625/%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EA%B8%B0%EB%A1%9C-%EB%A7%88%EC%9D%8C-%EB%A8%B9%EC%97%88%EB%8B%A4-5%ED%8E%B8-%EC%82%AC%EB%9E%8C%EB%93%A4%EC%9D%80-%EB%8F%88%EC%9D%B4-%EB%AA%B0%EB%A6%AC%EB%8A%94-%EA%B3%B3%EC%9D%84-%EC%B0%BE%EB%8A%94%EB%8B%A4) |
| ⑥ | **코인 커뮤니티를 만들기로 마음먹었다 — [트리맵 오버레이 최적화 - 낭비되는 리소스 방지]** | [Velog 보기](https://velog.io/@whird625/%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EA%B8%B0%EB%A1%9C-%EB%A7%88%EC%9D%8C-%EB%A8%B9%EC%97%88%EB%8B%A4-6%ED%8E%B8-%ED%8A%B8%EB%A6%AC%EB%A7%B5-%EC%98%A4%EB%B2%84%EB%A0%88%EC%9D%B4-%EC%B5%9C%EC%A0%81%ED%99%94-%EB%B3%B4%EC%9D%B4%EC%A7%80-%EC%95%8A%EB%8A%94-%EA%B3%B3%EC%97%90%EC%84%9C-%EB%82%AD%EB%B9%84%EB%90%98%EB%8A%94-%EB%A6%AC%EC%86%8C%EC%8A%A4) |
| ⑦ | **코인 커뮤니티를 만들기로 마음먹었다 — [리뉴얼, UI 개편과 실시간성]** | [Velog 보기](https://velog.io/@whird625/%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EA%B8%B0%EB%A1%9C-%EB%A7%88%EC%9D%8C-%EB%A8%B9%EC%97%88%EB%8B%A4-6%ED%8E%B8-%EB%A6%AC%EB%89%B4%EC%96%BC-UI-%EA%B0%9C%ED%8E%B8%EA%B3%BC-%EC%8B%A4%EC%8B%9C%EA%B0%84%EC%84%B1) |

---

<p align="center">
  <sub>Built by <strong>정재형</strong></sub>
  <sub><strong>Contact: whird398@naver.com</strong></sub>
</p>
