-- 한 줄 남기기가 쌓이는 곳.
--
-- **`where`는 SQL 예약어라 칸 이름이 `screen`이다.** 코드에서는 `where`로 부르고
-- 여기서만 이름이 바뀐다 — 경계에서 한 번 갈아끼운다.
--
-- 주소를 두 벌로 적는다. `screen`은 사람이 읽는 이름(「객체 한니발」)이고
-- `path`는 실제 주소(`/objects/person/한니발`)다. 이름만 있으면 같은 이름이
-- 여럿일 때 어느 화면인지 못 가리고, 주소만 있으면 표를 훑을 때 안 읽힌다.
--
-- **IP를 안 담는다.** 도배를 막으려면 같은 사람인지만 알면 되지 누구인지는
-- 알 필요가 없다. 그래서 해시 앞 16자만 담는다 — 세는 데는 충분하고
-- 되돌릴 수는 없다.

create table if not exists feedback (
  id integer primary key autoincrement,
  created_at text not null default (datetime('now')),
  screen text not null,
  path text not null,
  subject text,
  body text not null,
  ua text,
  ip_hash text
);

create index if not exists feedback_created on feedback (created_at desc);

-- 도배 판정이 매번 훑는 칸이다
create index if not exists feedback_iphash on feedback (ip_hash, created_at);
