-- 종목별 "층" 시스템 (Supabase SQL Editor에서 한 번 실행)
--
-- 한 사람은 한 방에서 하나의 상태만 가진다.
--   holder  = 보유 중   (price = 평단가)
--   watcher = 매수 대기 (price = 희망 매수가)
--
-- price는 종목의 표시 통화 원본값이다. 한국 종목은 원, 해외 종목은 달러.
-- USDT로 환산해 저장하면 환율이 움직일 때 사용자가 입력한 평단가가 저절로
-- 달라져 보이므로(82,400원이 82,900원으로) 입력값을 그대로 보관한다.
--
-- 수량은 받지 않는다. 평단가 하나만으로 층이 정해진다.

create table if not exists public.holdings (
    user_id    uuid not null references auth.users (id) on delete cascade,
    room_id    text not null,
    kind       text not null check (kind in ('holder', 'watcher')),
    price      numeric not null check (price > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, room_id)
);

-- 방 단위 조회(층 분포)가 유일한 읽기 패턴이다
create index if not exists holdings_room_idx on public.holdings (room_id);

alter table public.holdings enable row level security;

-- 층 분포는 모두가 본다. 쓰기는 자기 행만.
drop policy if exists holdings_select_all on public.holdings;
create policy holdings_select_all on public.holdings
    for select using (true);

drop policy if exists holdings_insert_own on public.holdings;
create policy holdings_insert_own on public.holdings
    for insert with check (auth.uid() = user_id);

drop policy if exists holdings_update_own on public.holdings;
create policy holdings_update_own on public.holdings
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists holdings_delete_own on public.holdings;
create policy holdings_delete_own on public.holdings
    for delete using (auth.uid() = user_id);

-- updated_at만 갱신한다. created_at은 "존버 D+238" 카운터의 근거라 절대 건드리지 않는다.
-- (물타기로 평단가를 내려도 입주일은 유지된다)
--
-- 함수 이름에 테이블명을 박아둔다. touch_updated_at 같은 일반적인 이름으로 두면
-- 다른 테이블이 이미 쓰고 있는 동명 함수를 create or replace가 덮어쓴다.
create or replace function public.holdings_touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    new.created_at = old.created_at;
    return new;
end $$;

drop trigger if exists holdings_touch on public.holdings;
create trigger holdings_touch before update on public.holdings
    for each row execute function public.holdings_touch_updated_at();

-- 층 분포 실시간 반영.
-- 이미 등록돼 있으면 alter publication이 에러를 내고, SQL Editor는 스크립트 전체를
-- 한 트랜잭션으로 돌리기 때문에 위 작업까지 같이 롤백된다. 그래서 존재 여부를 먼저 본다.
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'holdings'
    ) then
        alter publication supabase_realtime add table public.holdings;
    end if;
end $$;
