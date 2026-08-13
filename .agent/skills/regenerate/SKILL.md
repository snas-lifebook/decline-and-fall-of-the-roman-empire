---
name: regenerate
description: ontology/_scripts/rome30_*.py 재생성 파이프라인을 순서·전제·백업까지 확인해 안전하게 돌린다. "온톨로지 재생성해줘", "엔티티 노트 다시 만들어줘", "geo/maps 갱신해줘", "재생성 순서 알려줘" 등에 사용.
version: 1
---

# regenerate

## 언제 쓰는가

새 리서치(좌표·경로·영토·연도)가 `_geo`·`_routes`·`_time` 같은 원료 폴더에 들어왔거나, `entities.jsonl`·`links.jsonl`이 바뀌어서 `entities/<type>/<이름>.md` 642개에 반영해야 할 때. 스크립트 여러 개가 서로의 산출물을 전제로 쌓이는 구조라, 하나만 돌리면 다른 스크립트가 이미 붙여 둔 내용이 지워진다 — 실제로 벌어졌던 사고다. 이 스킬은 **무엇을 어떤 순서로, 어떤 전제 확인 후에 돌려야 하는지 정리**한다. 스크립트를 대신 실행하지 않는다.

## 입력

- 무엇이 바뀌었는지: 새 좌표 리서치(`_geo`)인지, 새 경로/영토 리서치(`_routes`)인지, 새 연도 리서치(`_time`)인지, 아니면 `entities.jsonl`/`links.jsonl` 자체를 사람이 직접 고쳤는지 — 이에 따라 어디서부터 다시 돌려야 하는지가 달라진다.
- 레포 경로(`~/project/active/decline-and-fall-of-the-roman-empire/`)와 볼트 경로 둘 다 인지하고 있어야 한다. 아래 「하지 말 것」 첫 항목 참고.

## 절차

1. **BASE 경로부터 확인한다.** `ontology/_scripts/rome30_*.py` 전부가 스크립트 상단에

   ```
   BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
               "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
               "Books/로마제국쇠망사")
   ```

   로 볼트 경로를 하드코딩하고 있다. 레포 터미널에서 스크립트를 실행해도 실제로 읽고 쓰는 대상은 볼트다 — 레포 자신의 `ontology/entities.jsonl`·`ontology/links.jsonl`·`entities/`는 스크립트가 건드리지 않는다(AGENTS.md대로 "볼트가 정본, 레포는 수동 사본"). 재생성 후 레포에 반영하려면 별도로 다시 복사해야 한다.

2. **백업을 먼저 뜬다.** 볼트는 git이 아니다. `entities.jsonl`·`links.jsonl`·`entities/`를 통째로 백업 폴더에 복사해 둔다. `--write` 없이 dry-run만 돌리는 단계에서는 생략해도 되지만, `--write`를 붙이는 순간부터는 필수다.

3. **순서를 확인한다.** `rome30_backlink.py` 자신의 docstring에 순서가 명시돼 있다:

   ```
   실행 순서: merge → geo → maps → routes → territory → backlink
   ```

   각 스크립트가 하는 일과 왜 순서가 이런지:
   - `rome30_merge.py` — `_parts/entities_*.jsonl`·`_parts/links_*.jsonl`(원시 추출 조각)을 병합해 `entities.jsonl`·`links.jsonl`을 새로 쓰고, `entities/<type>/<이름>.md` 642개를 그 자리에서 덮어쓴다. 자기 docstring에 "1회성"이라고 적혀 있다 — 아래 「하지 말 것」 참고.
   - `rome30_geo.py` — 지명 노트에 좌표·이동 통계(`### 위치`)를 심는다.
   - `rome30_maps.py` — 인물·집단·사건·시대 노트에 관련 지명이 걸린 지도(`### 관련 지도`)를 넣는다. 지명 노트의 `location` 프론트매터(geo가 심음)에 의존하므로 geo 다음이어야 한다.
   - `rome30_routes.py` — 리서치된 이동 경로를 GeoJSON + 경로 노트로 만든다. 연도 시간순·좌표 사전값 일치·로마 세계 범위(위 -12~125도, 위도 5~71도) 셋을 검증하고, 어긋나면 그 경로는 기록하지 않는다.
   - `rome30_territory.py` — 리서치된 왕국 영토를 GeoJSON Polygon + 영토 노트로 만든다. `_routes` 폴더를 같이 읽는다(별도 `_territory` 폴더가 아니다 — 확인 완료, 현재 레포에 `_territory` 디렉터리는 없다).
   - `rome30_backlink.py` — routes·territory 리서치 결과를 그 주체(한니발·카이사르·고트족 등, 스크립트 안 `SUBJECT` 딕셔너리에 하드코딩)가 되는 노트에 `### 이동 경로`로 되돌려 넣는다. routes·territory 산출물이 아직 없으면 넣을 게 없다 — 반드시 그 둘 다음이다.

   이 여섯과 별개로 두 트랙이 더 있다:
   - `rome30_time.py` — `_time/years_*.jsonl`을 `links.jsonl`에 병합해 `from_year`/`to_year`/`year_basis`를 채운다. `entities.jsonl`이 아니라 `links.jsonl`만 읽고 쓰므로 merge 이후 아무 때나 독립적으로 돌려도 된다(geo·maps·routes·territory·backlink와 순서 종속이 없다). `to_year < from_year`면 자동으로 스왑하는 보정 로직이 들어 있다.
   - `rome30_link.py` → `rome30_nav.py` — `points/*.md`(30포인트 편역본 본문)에 위키링크를 걸고 이전/다음 목차 띠를 붙이는 트랙이다. `entities/` 노트 파이프라인과는 별개 대상이라 섞어 생각하지 않는다. `rome30_nav.py`는 자기 docstring에 "link → 이 스크립트" 순서를 명시한다.
   - `rome30_family.py`·`rome30_canvas.py`(족보), `rome30_source_md.py`·`rome30_split.py`(기번 원전 변환, 1회성), `apply_local_graph_colors.py`(옵시디언 로컬 그래프 색 — **옵시디언을 완전히 종료한 뒤에만** 실행, 켜진 채 쓰면 다음 저장 때 덮어써진다)는 이 재생성 체인과 독립적이다.

4. **어디서부터 돌릴지 정한다.** `entities.jsonl`/`links.jsonl` 자체를 사람이 직접 고쳤다면(`propose-change` 병합 등) `merge`는 건너뛰고 `geo`부터 시작한다(아래 「하지 말 것」 참고). 새 `_geo` 리서치만 들어왔다면 `geo`부터, 새 `_routes`/`_territory` 리서치라면 `routes`부터, 그 다음은 항상 하류로 흘려보낸다.

5. **각 스크립트를 `--write` 없이 먼저 돌려 dry-run 결과를 읽는다.** 전 스크립트가 `python3 rome30_X.py`(인자 없음)면 dry-run, `python3 rome30_X.py --write`면 실제 반영이라는 동일한 패턴을 쓴다(`main(write="--write" in sys.argv)`). dry-run 출력(대상 개수, 탈락 사유)을 사람이 확인한 뒤에만 `--write`로 넘어간다.

6. **정해진 순서대로 `--write`를 붙여 실행한다.**

7. **`entities/` 개수를 확인한다.** 642개가 유지되는지(`find entities -name "*.md" | wc -l`), `merge`가 "옛 파일 N개 정리"라고 보고한 수가 예상과 맞는지 본다.

8. **레포 쪽을 수동으로 동기화한다.** 자동 동기화가 없으므로, 볼트의 `ontology/`·`entities/`를 레포의 같은 경로로 다시 복사한다.

## 하지 말 것

- **레포에서 스크립트를 돌리면 레포가 갱신된다고 착각하지 마라.** BASE가 볼트 경로로 고정돼 있어 실제로는 볼트가 갱신된다. 레포 반영은 별도 수동 복사가 필요하다.
- **`merge`를 "최신화" 목적으로 그냥 다시 돌리지 마라.** `merge`는 현재 `entities.jsonl`/`links.jsonl`을 전혀 읽지 않는다 — `_parts/entities_*.jsonl`·`_parts/links_*.jsonl`에서만 완전히 새로 짠다(코드로 확인 완료: `main()`이 `PARTS.glob(...)`만 읽는다). `propose-change`로 사람이 `entities.jsonl`/`links.jsonl`에 직접 병합한 내용은 `_parts`에 반영돼 있지 않은 한 `merge`를 다시 돌리는 순간 통째로 사라진다.
- **`merge`만 돌리고 끝내지 마라.** `merge`가 노트를 제자리 덮어쓰기 때문에, `geo`가 붙인 `### 위치`, `maps`가 붙인 `### 관련 지도`, `backlink`가 붙인 `### 이동 경로` 섹션이 지워진다. 실제로 벌어졌던 사고이고, 하류 스크립트를 다시 돌려 복구했다.
- **`entities/*.md`를 손으로 고치지 마라.** 이 파일들은 파이프라인 산출물이다. 다음 재생성(특히 `merge`) 때 덮어써지거나, `merge`의 stale 정리 로직에 걸려 지워진다.
- **`entities/` 폴더를 미리 손으로 지우고 스크립트를 돌리지 마라.** `merge.py`는 일부러 디렉터리를 통째로 지우지 않고 제자리 덮어쓴 뒤 남은 옛 파일만 지운다 — 자기 코드 주석에 이유가 적혀 있다: "디렉터리를 통째로 지우고 다시 쓰면 iCloud가 삭제·생성 경합을 충돌로 보고 '이름 2.md' 사본을 무더기로 만든다." 미리 지우면 이 보호를 우회해 iCloud 충돌 사본이 생길 수 있다.
- **순서를 건너뛰지 마라.** `maps`는 `geo`가 심은 `location` 프론트매터에, `backlink`는 `routes`·`territory`가 만든 GeoJSON·노트에 의존한다. 앞 단계 없이 뒤 단계만 돌리면 빈손으로 끝나거나(대상 0개) 오래된 데이터를 참조한다.
- **`--write` 없이 실행한 결과를 반영됐다고 보고하지 마라.** 기본은 dry-run이다. 실제 파일이 바뀌는 건 `--write`를 붙였을 때뿐이다.
- **백업 없이 `--write`를 붙이지 마라.** 볼트는 git 레포가 아니라서 되돌릴 수단이 백업뿐이다.
- **스크립트 인자·플래그를 지어내지 마라.** 확인한 전부가 `--write` 하나뿐이다. 다른 플래그가 필요해 보이면 실제로 스크립트를 열어 `sys.argv` 처리 부분을 확인한다.

## 출력 형태

이 스킬의 산출물은 실행 계획 체크리스트다. 예:

```
## 재생성 계획

### 무엇이 바뀌었나
새 _geo 리서치 3건 도착 (place:비잔티움 외 2건 좌표 추가)

### BASE 확인
스크립트 BASE = 볼트 경로. 레포 자체는 이 실행으로 갱신되지 않음 — 완료 후 수동 복사 필요.

### 백업
cp -r ".../로마제국쇠망사/entities" ".../backup_20260813/entities"
cp -r ".../로마제국쇠망사/ontology" ".../backup_20260813/ontology"

### 실행 순서 (merge 건너뜀 — entities.jsonl/links.jsonl 변경 없음)
1. python3 rome30_geo.py          (dry-run, 대상 확인)
2. python3 rome30_geo.py --write
3. python3 rome30_maps.py         (dry-run)
4. python3 rome30_maps.py --write
5. python3 rome30_backlink.py     (dry-run) — routes/territory 변경 없으므로 대상 재확인만
6. (routes/territory 변경 없으면 6은 생략)

### 확인
- entities/ 파일 수 642 유지 확인
- geo dry-run 대상 개수와 --write 완료 로그 대조

### 레포 동기화
볼트 → 레포 ontology/, entities/ 수동 복사 (사람 확인 후)
```
