---
name: relation-query
description: 로마제국쇠망사 온톨로지에서 관계 조건(누가 누구와, 언제, 어떤 rel)으로 links.jsonl을 조회한다. "카이사르가 누구랑 동맹이었어", "이 사람이 정복한 곳", "opposed 관계 전부 보여줘" 등에 사용.
version: 1
---

# relation-query

## 언제 쓰는가

관계 조건 — rel 종류, 상대 객체, 연도 구간, 포인트 번호 중 하나 이상의 조합 — 으로 `ontology/links.jsonl`을 걸러 여러 관계를 뽑을 때. "카이사르가 누구와 동맹이었나", "기원전 250~200년 사이 opposed 관계 전부", "이 인물이 참전한 사건 목록" 같은 질의가 대상이다.

`entity-lookup`과 다르다: entity-lookup은 객체 하나의 설명·좌표·노트까지 포함한 전모를 파는 것이고, 관계는 그 일부다. 이 스킬은 관계 자체가 질문의 중심이고 결과가 여러 줄(여러 객체 쌍)로 나온다. 대상 객체 하나의 전모가 궁금하면 entity-lookup을 먼저 쓴다.

## 입력

- 조건 최소 하나: rel 종류 / 대상 객체(from 또는 to로 등장) / 연도 구간 / 포인트 번호.
- 레포 경로는 고정: `~/project/active/decline-and-fall-of-the-roman-empire/` (읽기 전용으로 다룬다).

## 절차

1. rel 필터가 있으면 실제 쓰이는 rel인지 먼저 확인한다. **기존 11종**(2026-08-13 기준 links.jsonl 건수): `opposed` 124 · `ruled` 106 · `participated_in` 94 · `member_of` 81 · `allied_with` 81 · `occurred_at` 67 · `child_of` 57 · `succeeded` 25 · `created` 21 · `conquered` 9 · `married` 5. **신설 5종**(`located_in` · `protected` · `held_office` · `decided` · `applied_to`)은 2026-08-13 확정됐지만 아직 links.jsonl에 0건이다 — 마이그레이션 전이라 이 rel로 걸면 무조건 0건이 나오고, 그건 정상이다. 5번을 참고해 오용분과 함께 보고한다.
2. 상대 객체가 이름으로 주어지면 `entities.jsonl`에서 id를 먼저 확정한다. 동명이인이 있을 수 있다(`entity-lookup` 스킬의 2번 절차와 동일 — 이름이 같아도 다른 타입·다른 사람일 수 있으니 결과가 여러 건이면 어느 쪽인지 확인받는다).
3. `links.jsonl`을 파싱해 조건에 맞는 줄을 뽑는다. 대상 객체 조건이 있으면 `from`과 `to` 양쪽 다 검사한다 — 단방향 기록이라 한쪽만 걸면 절반을 놓친다. 예: `person:카이사르`가 관련된 `opposed` 관계는 `from`으로만 걸면 카이사르가 상대를 적대한 줄만 나오고, `술라 → 카이사르`·`브루투스 → 카이사르`처럼 카이사르가 `to`인 줄(상대가 카이사르를 적대한 줄)이 빠진다.
4. 연도 필터가 있으면 `from_year`/`to_year` 부호를 그대로 쓴다 — 기원전 음수, 서기 양수. **`from_year`가 `to_year`보다 항상 이르다고 가정하지 마라.** 뒤집힌 줄이 실제 있다(`event:제1차포에니전쟁 → place:로마`, `occurred_at`, `from_year: -241, to_year: -264` — 전쟁은 기원전 264년에 시작해 241년에 끝났는데 필드 순서는 반대). 연도로 거를 땐 두 값 중 이른 연도를 시작으로 삼는다.
5. **rel 오용을 함께 살핀다.** 신설 rel이 아직 없는 자리는 기존 rel이 대신 떠맡고 있다.
   - `located_in`이 필요해 보이는 질의(인물·집단의 소재/체류)인데 결과가 0건이면, `occurred_at`인데 `from`이 event가 아니라 인물·장소인 줄(37건)과 인물→지명 `participated_in`인데 `to`가 event가 아니라 place인 줄(27건)을 대신 뽑아 보여준다. 실제 있는 줄: `person:카이사르 → place:루비콘강 (occurred_at, point 7)`, `person:한니발 → place:알프스 (participated_in, point 3)`.
   - 결과를 낼 땐 "정식 매칭 N건"과 "마이그레이션 전 오용분 M건(어느 rel에 있는지 명시)"을 나눠 표시한다. 섞어서 하나의 목록으로 내지 않는다.
6. rel이 `married` 또는 `succeeded`를 묻는 질의라면 주의한다. 원본 추출 과정에서 혼인 관계가 `succeeded`로 잘못 담긴 이력이 실제 있었다(카이사르 가문 등 — 지금은 족보 스크립트가 수작업 목록으로 바로잡았다). 결과가 의심스러우면(예: 배우자 관계인데 rel이 `succeeded`로 나옴) `entities/<type>/<이름>.md` 노트의 `### 관계` 절과 대조해 이상 여부를 알린다.
7. 결과의 `from`/`to`는 id(`person:카이사르` 등)뿐이니 `entities.jsonl`에서 `name`을 붙여 사람이 읽을 수 있게 만든다. 이때도 `from`/`to`가 `entities.jsonl`에 실재하는지 대조한다.
8. 1~7을 아래 출력 형태로 조립한다.

## 하지 말 것

- rel 조건을 `from`만 또는 `to`만으로 걸지 마라. 단방향 기록이다 — 양쪽 다 훑어야 상대와의 관계 전체가 나온다.
- 신설 5종 rel로 조회해 0건이 나왔다고 "그런 관계 없음"으로 끝내지 마라. 아직 마이그레이션 전이라 데이터가 없는 것뿐이다. `located_in`은 `occurred_at`(from이 인물·집단인 37건)과 인물→지명 `participated_in`(27건)에 오용 형태로 이미 있다 — 나머지 4종(`protected`·`held_office`·`decided`·`applied_to`)은 대응하는 오용 패턴이 아직 파악되지 않았다는 점도 그대로 보고하고, 지어내지 마라.
- `from_year`가 항상 `to_year`보다 이르다고 가정하고 연도 필터링을 하지 마라. 뒤집힌 줄이 있다.
- rel 필드를 항상 정답으로 믿지 마라. `married`가 `succeeded`로 잘못 들어간 이력처럼 추출 단계 오류가 있었다. 결과가 의심스러우면 노트의 `### 관계` 절과 대조하되, 대조 없이 rel을 임의로 고쳐 보고하지도 마라 — 원본 값과 의심 사유를 같이 낸다.
- `entities.jsonl`에 없는 id를 결과에 넣지 마라. `from`/`to`를 대조해 실재를 확인한다.
- 조건에 맞는 줄이 없는데 "아마 있었을 것"으로 채우지 마라. 없으면 없는 것이다.

## 출력 형태

아래는 "`person:카이사르`가 관련된 `opposed` 관계 전부"를 예로 든 뼈대다. 실제 값은 grep 결과를 그대로 옮긴 것이다.

```
# 관계 조회 — person:카이사르, rel=opposed (양방향)

## 조건
- rel: opposed
- 대상 객체: person:카이사르 (from 또는 to)

## 결과 (links.jsonl, 12건)
- 술라 --opposed--> 카이사르 (point 5)
- 소카토 --opposed--> 카이사르 (point 6)
- 카이사르 --opposed--> 폼페이우스 (point 7, 기원전 49~48년, year_basis: text)
- 브루투스 --opposed--> 카이사르 (point 7)
- 렌툴루스 --opposed--> 카이사르 (point 7, 연도 없음)
- 카이사르 --opposed--> 폼페이우스 (point 8, 기원전 49~45년, year_basis: chronology)
- 브루투스 --opposed--> 카이사르 (point 8, 기원전 44년)
- 카시우스 --opposed--> 카이사르 (point 8, 기원전 44년)
- 폼페이우스 --opposed--> 카이사르 (point 8, 기원전 49~45년, year_basis: chronology)
- 스푸린나 --opposed--> 카이사르 (point 8, 연도 없음)
- 카스카 --opposed--> 카이사르 (point 8, 기원전 44년)
- 키케로 --opposed--> 카이사르 (point 8, 연도 없음)

## 비고
- 폼페이우스와의 관계가 세 줄이다: point 7은 "카이사르→폼페이우스"만 한 방향(기원전
  49~48년), point 8은 같은 기원전 49~45년 구간을 "카이사르→폼페이우스"·"폼페이우스→카이사르"
  양방향으로 중복 기록했다. 중복으로 보고 임의로 하나를 지우지 말고 셋 다 낸다 — 포인트별
  서술 시점 차이와 방향 중복이 섞여 있다는 걸 그대로 보여준다.
- `located_in`류 오용분 없음(이 조회는 `opposed` 고정이라 5번 절차 대상 아님).
```

이 블록이 산출물 전체다. 여러 조건을 동시에 걸었으면 "조건" 절에 전부 나열하고, rel 필터가 신설 5종이라 0건 + 오용분을 같이 낸 경우엔 "결과" 절을 "정식 매칭"과 "마이그레이션 전 오용분"으로 나눠 두 개의 하위 목록으로 낸다.
