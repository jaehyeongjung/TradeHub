<img width="60" height="60" alt="favicon-512" src="https://github.com/user-attachments/assets/6557641a-0091-4d2a-a8ff-d1905a629115" />

# TradeHub

<br>

“투자는 생각보다 외로웠다.” 

> 그래서 만든, 실시간 트레이더 허브  
> “실시간 Hot 코인·실시간 채팅·코인 뉴스·코인 시세/차트·Top Trader의 포지션을 한 화면에서 볼 수 있는 PC 기반 서비스”
>  
> <sub>⚠️ **PC 버전만 지원** — 대부분의 트레이더는 PC 환경에서 시세를 확인하고 분석하기 때문에, 초기 MVP 단계에서는 **데스크톱 UX 최적화**에 집중했습니다.</sub>

<br>

<p align="center">
<img width="1432" height="706" alt="스크린샷 2025-10-08 오후 6 39 45" src="https://github.com/user-attachments/assets/47728970-ea82-4da5-badb-19f53b4bb7b6" />
</p>


<br>

<p align="center">
  <a href="https://www.tradehub.kr/" target="_blank" rel="noopener noreferrer">
    <img 
      src="https://img.shields.io/badge/🚀 Visit_TradeHub-Click_Here-10B981?style=for-the-badge&logo=vercel&logoColor=white&labelColor=000000"
      alt="Visit TradeHub"
    />
  </a>
</p>

<p align="center">
  <b>TradeHub — 실시간 트레이딩 커뮤니티 바로가기</b>
</p>




---




## Features  

### 1. 실시간 Hot Coin Top 15
**"트레이더들은 돈이 몰리는 곳을 찾는다."**

거래량과 등락률에 따른 실시간 돈이 몰리는 Coin List 

<img width="369" height="60" alt="스크린샷 2025-10-08 오후 11 05 04" src="https://github.com/user-attachments/assets/0d9b92b3-bda0-4411-a0c8-14e36f3a263c" />



---

### 2. 실시간 지정 코인 가격 갱신
#### 원하는 코인 심볼의 실시간 가격과 24h 변동률(%)을 보여주는 작은 카드형 위젯
 클릭 한 번으로 심볼을 바꾸고, 로그인 상태면 내 선호 심볼을 서버에 저장해 다음 접속 때 그대로 복원



<img width="555" height="200" alt="스크린샷 2025-10-05 오후 3 19 37" src="https://github.com/user-attachments/assets/a044e66c-6fe3-490c-948f-3e602abcf6ce" />

<img width="555" height="200" alt="스크린샷 2025-10-08 오후 10 40 47" src="https://github.com/user-attachments/assets/8db7f903-4519-40fd-a1fb-fc2a46d2aafd" />


<img width="300" height="140" alt="스크린샷 2025-10-05 오후 3 20 06" src="https://github.com/user-attachments/assets/d9ec2ba2-0ed6-4c8c-b72a-eec64460e965" />


---

### 3. 실시간 차트 기능
#### Binance 실시간 캔들(kline) 스트림을 사용해 BTC/USDT 차트를 초단위로 갱신
초기에는 REST로 최근 캔들(기본 200개)을 한 번에 로드하고, 이후에는 WebSocket으로 현재 진행 중인 봉의 OHLC를 실시간 업데이트

<img width="419" height="200" alt="스크린샷 2025-10-05 오후 3 20 25" src="https://github.com/user-attachments/assets/f7d1fc05-6937-4f83-a070-026834284c5b" />

---

### 4. 트레이딩 포지션 비율 
#### 5분 단위로 바이낸스 전체 계정 vs Top Traders 롱/숏 비율 갱신

<img width="428" height="141" alt="스크린샷 2025-10-08 오후 11 02 50" src="https://github.com/user-attachments/assets/2af81037-a955-4762-a495-6b37ab77ee11" />


---

### 5. 실시간 채팅 기능 
#### Supabase **Realtime** 기반의 **실시간 채팅**  
본인 포지션을 공유하고 닉네임에 포지션이 표시, 커뮤니티 속 포지션 비율을 한 눈에 확인

<img width="400" height="500" alt="스크린샷 2025-10-05 오후 3 53 16" src="https://github.com/user-attachments/assets/2d933921-b1ac-4c5d-9aa1-846e5ed43421" />

---

### 6. 코인 뉴스 대시보드
#### 1일마다 서버 크론이 Node 런타임에서 rss-parser로 지정한 RSS 피드를 수집해 Supabase news_items 테이블에 url 기준 업서트로 저장
클라이언트는 최신 30개만 쿼리해 카드 리스트로 표시

<img width="701" height="518" alt="스크린샷 2025-10-05 오후 4 00 14" src="https://github.com/user-attachments/assets/85771355-c40f-48a4-9c4d-91fce38c7649" />

#### 뉴스는 페이지 이동이 아닌 iframe 형식으로 페이지 이탈을 줄임 
<img width="700" height="500" alt="스크린샷 2025-10-05 오후 4 00 25" src="https://github.com/user-attachments/assets/25bccf04-8705-4436-8159-463fb477d2f9" />


#### 채팅에 공유 클릭 시 실시간으로 채팅방에 공유 기능
<img width="437" height="146" alt="스크린샷 2025-10-05 오후 4 00 42" src="https://github.com/user-attachments/assets/bf33b498-ccdd-43dd-ab3d-4288b2bfc8c8" />

---

### 7. Crypto Fear & Greed 대시보드 
#### 암호화폐 시장의 투자 심리를 0(극심한 공포)부터 100(극심한 탐욕)까지 나타내는 지수
공포는 가격 하락, 탐욕은 가격 상승과 연관되는 경향이 있고 포지션을 잡는 지표 중 하나 

<img width="281" height="454" alt="스크린샷 2025-10-08 오후 6 37 43" src="https://github.com/user-attachments/assets/198f833f-31fd-4c3c-9d47-6aae3d93acb9" />

---

### 8. 김치 프리미엄 실시간 제공 기능 
#### “국내 암호화폐 시장의 가격이 해외 시장 대비 고평가 또는 저평가되었는지를 보여주며, 한국 투자자들의 심리 파악


<img width="261" height="381" alt="스크린샷 2025-10-08 오후 6 37 25" src="https://github.com/user-attachments/assets/b8cbd969-cc26-42cd-8233-45f75748b0a5" />

---



---

### 9. 게시글 대시보드

<img width="728" height="536" alt="스크린샷 2025-10-09 오후 11 06 48" src="https://github.com/user-attachments/assets/a23c3a35-b2c2-4936-a37b-3486a4571b2c" />


---

## Blog Series  

| 회차 | 제목 | 링크 |
|------|------|------|
| ① | **코인 커뮤니티를 만들기로 마음먹었다 — [왜 coinpan은 대박났을까?]** | [Velog 보기](https://velog.io/@whird625/%EA%B8%B0%ED%9A%8D-%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EC%96%B4%EB%B3%B4%EA%B8%B0) |
| ② | **코인 커뮤니티를 만들기로 마음먹었다 — [구상 과정]** | [Velog 보기](https://velog.io/@whird625/%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EA%B8%B0%EB%A1%9C-%EB%A7%88%EC%9D%8C-%EB%A8%B9%EC%97%88%EB%8B%A4-2%ED%8E%B8-%EA%B5%AC%EC%83%81-%EA%B3%BC%EC%A0%95) |
| ③ | **코인 커뮤니티를 만들기로 마음먹었다 — [사용자 피드백을 받고 UI 고도화를 해 보자]** | [Velog 보기](https://velog.io/@whird625/%EC%BD%94%EC%9D%B8-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0%EB%A5%BC-%EB%A7%8C%EB%93%A4%EA%B8%B0%EB%A1%9C-%EB%A7%88%EC%9D%8C-%EB%A8%B9%EC%97%88%EB%8B%A4-3%ED%8E%B8-%EC%82%AC%EC%9A%A9%EC%9E%90-%ED%94%BC%EB%93%9C%EB%B0%B1-%EB%B0%9B%EA%B8%B0-%EB%A7%88%EC%BC%80%ED%8C%85) |
| ③ | **코인 커뮤니티를 만들기로 마음먹었다 — [바이낸스 api를 사용하던 중 451 error 발생 ]** | [Velog 보기](https://velog.io/@whird625/%EB%B0%94%EC%9D%B4%EB%82%B8%EC%8A%A4-%EC%97%90%EB%9F%AC-%ED%95%B4%EA%B2%B0) |


---

## Tech Stack  

| Category | Stack |
|-----------|--------|
| **Frontend** | [Next.js (App Router)](https://nextjs.org/), TypeScript, TailwindCSS |
| **Backend** | [Supabase](https://supabase.com/) (Postgres · Realtime · Auth · Storage) |
| **Infra / Deploy** | [Vercel](https://vercel.com/) (CI/CD, Edge Ready) |

---

<p align="center">
  <sub>Built by <strong>정재형</strong></sub>
  <sub><strong>Contact: whird398@naver.com</strong></suv>
</p>
