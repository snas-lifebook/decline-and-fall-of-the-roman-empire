"""_parts/*.jsonl 병합 → entities.jsonl / links.jsonl + 핵심 객체 노트 승격. 1회성."""
import json
import re
import sys
from collections import Counter, defaultdict
from difflib import SequenceMatcher
import unicodedata as ud
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
PARTS, ONTO, NOTES = BASE / "ontology/_parts", BASE / "ontology", BASE / "entities"

TYPES = {"person", "place", "event", "period", "group", "institution", "work"}
# 실제 추출 결과를 보고 2종 추가. 로마사에서 정복·혼인동맹은 기존 8종에 넣으면 의미가 죽는다.
RELS = {"child_of", "succeeded", "allied_with", "opposed", "participated_in",
        "occurred_at", "ruled", "member_of", "married", "conquered", "created"}
REL_KO = {"child_of": "자녀", "succeeded": "계승", "allied_with": "동맹", "opposed": "적대",
          "participated_in": "참전·관여", "occurred_at": "발생지", "ruled": "통치",
          "member_of": "소속", "married": "혼인", "conquered": "정복", "created": "세움·지음"}
# 에이전트가 지어낸 표현 중 손실 없이 흡수되는 것만 매핑한다.
REL_MAP = {"served_under": "member_of", "led": "member_of", "successor": "succeeded",
           "located_in": "occurred_at", "near": "occurred_at",
           "born": "occurred_at", "fled_to": "occurred_at",
           # 창건·저술·제작 계열은 한 관계로 묶는다 (로마법 대전·코란·콘스탄티노플)
           "authored": "created", "compiled": "created", "founded": "created",
           "founder": "created", "founder_of_reformed": "created",
           "defended": "participated_in", "blockaded": "opposed", "recovered": "conquered"}
# 방향이 뒤집힌 표현. from/to를 바꿔 흡수한다.
REL_REVERSE = {"founded_by": "created", "ancestor": "child_of"}
TYPE_KO = {"person": "인물", "place": "지명", "event": "사건", "period": "시대",
           "group": "집단", "institution": "제도", "work": "저작"}

PROMOTE_MIN = 1   # 등장 포인트 수 하한. 1이면 전 객체가 노트가 된다.
# 지도용 키(location 등)도 예약이다. 에이전트가 `location: 북유럽` 같은 텍스트를 넣으면
# Leaflet이 좌표로 읽으려다 깨진다.
RESERVED_KEYS = {"created", "type", "entity_type", "entity_id", "book", "points", "aliases",
                 "tags", "up", "location", "mapmarker", "place_kind", "coord_confidence",
                 "dist_from_rome_km", "modern", "ancient"}

# 표기 변형이 확실한 것만 손으로 통일한다. 자동 퍼지 병합은 하지 않는다 —
# 콘스탄티우스(p13)와 콘스탄티우스 1세(p20)는 서로 다른 사람이라 기계가 붙이면 사고다.
CANON = {
    # 표기 변형
    "시칠리아 섬": "시칠리아", "코르시카 섬": "코르시카",
    "보스포루스": "보스포루스 해협", "소피아 대성당": "성 소피아 성당",
    "공치황제제": "공치제제", "기독교도": "기독교인",
    # 에이전트가 alias로 지목했고 desc 대조로 동일 개체임을 확인한 것
    "그나이우스 폼페이우스": "폼페이우스", "옥타비아누스": "아우구스투스",
    "콘스탄티누스 대제": "콘스탄티누스", "코르넬리우스 킨나": "킨나",
    "잉글랜드": "브리타니아", "이베리아 반도": "에스파냐", "에피루스": "에페이로스",
    # 붙이지 않은 것: 가이우스/칼리굴라, 가이우스 마리우스/마리우스,
    # 마리우스 안토니우스/안토니우스, 소 카토/카토, 유다/팔레스티나 — 서로 다른 개체다.
    #
    # 아래는 2차 병합(2026-07-30). 포인트마다 따로 추출한 탓에 같은 사람이 맨이름과
    # 정식이름 두 객체로 갈라져 있던 것들이다. 각 쌍의 desc를 대조해 동일 개체임을 확인했다.
    "클레오파트라": "클레오파트라 7세",       # p8·26 "카이사르를 유혹" = p7·9 프톨레마이오스 왕조의 여왕
    "안토니우스": "마르쿠스 안토니우스",       # p9·11 "카이사르의 부관, 클레오파트라와 결합" = p7·8
    "아그리파": "마르쿠스 아그리파",           # p10·11 "아우구스투스의 행정관" = p9 "옥타비아누스의 해전 지휘관"
    "마르쿠스": "마르쿠스 아우렐리우스",        # p20 "디오클레티아누스가 따르고자 한 인도주의 황제"
    "안토니누스": "안토니누스 피우스",         # p20 같은 문맥의 공동 통치자
    "테오도시우스": "테오도시우스 1세",        # p24 "고트족과 협정, 사후 무능한 아들들" = p22 발렌스의 후계
    "리비아": "리비아 드루실라",              # p11 "티베리우스의 어머니" = p9 "옥타비아누스의 세 번째 아내"
    "로마 원로원": "원로원",                  # 같은 기구. 양쪽 다 alias가 Senate였다
    # 콘스탄티우스/콘스탄티우스 1세는 위 주석의 기존 판단을 뒤집고 붙였다. p13 "서부의 부제로
    # 갈리아를 다스리며 기독교 박해에 소극적", p20 "디오클레티아누스의 부제로 갈리아·에스파냐·
    # 브리타니아 방위" — 콘스탄티누스의 아버지 콘스탄티우스 클로루스 한 사람이다.
    "콘스탄티우스": "콘스탄티우스 1세",
    # 붙이지 않은 것(2차): 카토/대 카토 — 카토(p4·7·8)에 대 카토(p4 카르타고)와
    # 소 카토(p7·8 카이사르 내전)가 이미 섞여 있다. 붙이면 잘못된 쪽이 굳는다.
    # 네로/티베리우스 클라우디우스 네로, 드루실라/리비아 드루실라, 세베루스/셉티미우스 세베루스,
    # 베루스/루키우스 베루스, 카시우스/카시우스 카이레아 — 전부 서로 다른 사람이다.
}

# 같은 대상에 에이전트마다 다른 type을 매긴 경우. 이름당 하나로 못박는다.
CANON_TYPE = {"로마": "place", "원로원": "group"}

# 볼트 규약이 인물 링크를 [[EnglishName|KoreanName]]으로 쓴다. 영문명이 별칭에 있어야
# 그 링크가 연결된다. 에이전트가 안 넣은 것만 보충한다.
ALIAS_ADD = {"프톨레마이오스": ["Ptolemy"], "프톨레마이오스 13세": ["Ptolemy XIII"],
             "프톨레마이오스 14세": ["Ptolemy XIV"],
             # CANON으로 흡수한 맨이름은 별칭으로 되살린다. 안 그러면 본문에 그 이름으로
             # 나온 자리가 통째로 링크를 잃는다. 짧은 이름이 다른 사람을 가리킬 위험은
             # rome30_link.py의 보류 규칙이 포인트 단위로 막는다.
             "클레오파트라 7세": ["클레오파트라"],
             "마르쿠스 안토니우스": ["안토니우스"],
             "마르쿠스 아그리파": ["아그리파"],
             "마르쿠스 아우렐리우스": ["마르쿠스"],
             "안토니누스 피우스": ["안토니누스"],
             "테오도시우스 1세": ["테오도시우스"],
             "콘스탄티우스 1세": ["콘스탄티우스"],
             "리비아 드루실라": ["리비아"],
             "원로원": ["로마 원로원"],
             "아우구스투스": ["옥타비아누스"]}

# 진짜 동명이인. (이름, 포인트) 단위로 갈라낸다.
# 가이우스: p10은 율리아와 아그리파의 아들(아우구스투스의 손자), p11은 칼리굴라다.
SPLIT = {("가이우스", 10): "가이우스 카이사르", ("가이우스", 11): "칼리굴라",
         # 율리아는 두 사람이다. 6·8번은 카이사르 가문의 율리아(딸이자 폼페이우스의 아내,
         # 그리고 아우구스투스의 조모), 9~11번은 아우구스투스의 딸이다. 한 객체로 두면
         # 아우구스투스가 율리아의 부모이자 자식이 되는 순환이 생긴다 — 족보를 그려서야
         # 드러났다. 대조 근거는 각 객체 노트의 포인트별 서술.
         ("율리아", 6): "율리아 (카이사르 가문)",
         ("율리아", 8): "율리아 (카이사르 가문)",
         ("율리아", 9): "율리아 (아우구스투스의 딸)",
         ("율리아", 10): "율리아 (아우구스투스의 딸)",
         ("율리아", 11): "율리아 (아우구스투스의 딸)"}

norm = lambda s: re.sub(r"[\s'\"`·•,.\-_()「」『』]", "", str(s))


def canon(n, point=None):
    n = str(n).strip()
    if (n, point) in SPLIT:
        return SPLIT[(n, point)]
    return CANON.get(n, n)


ctype = lambda t, n, p=None: CANON_TYPE.get(canon(n, p), t)
eid = lambda t, n, p=None: f"{ctype(t, n, p)}:{norm(canon(n, p))}"


def load_years():
    """_time/years_*.jsonl → (포인트, from이름, 관계한글, to이름) → (시작, 끝, 근거).

    연도가 링크에 붙어야 "BC 29년에 이 인물이 누구와 어떤 관계였나"를 물을 수 있다.
    별도 스크립트로 두면 병합을 다시 돌릴 때마다 날아가므로 여기서 함께 읽는다.
    """
    out, skipped = {}, 0
    d = BASE / "ontology/_time"
    for f in sorted(d.glob("years_*.jsonl")) if d.exists() else []:
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            fy, ty = r.get("from_year"), r.get("to_year")
            if not isinstance(fy, int):          # null = 에이전트가 연도를 모른다고 표시한 것
                skipped += 1
                continue
            if not isinstance(ty, int):
                ty = None
            if not (-800 <= fy <= 1500) or (ty is not None and not (-800 <= ty <= 1500)):
                continue
            if ty is not None and ty < fy:
                fy, ty = ty, fy
            b = r.get("basis") if r.get("basis") in ("text", "chronology", "inferred") else "inferred"
            k = (r.get("point"), norm(r.get("from")), str(r.get("rel")).strip(), norm(r.get("to")))
            if k in out and out[k][2] == "text" and b != "text":
                continue                          # 본문 근거가 우선
            out[k] = (fy, ty, b)
    return out, skipped


def yr(fy, ty):
    """연도를 사람이 읽는 표기로. 기원전은 음수로 들어온다."""
    f = lambda y: f"기원전 {-y}" if y < 0 else str(y)
    if ty is None:
        return f"{f(fy)}~"
    return f(fy) if fy == ty else f"{f(fy)}~{f(ty)}"


def load(pattern):
    """JSONL 로드. 깨진 줄은 버리지 않고 오류로 모은다."""
    rows, bad = [], []
    for f in sorted(PARTS.glob(pattern)):
        for ln, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append((f.name, ln, json.loads(line)))
            except json.JSONDecodeError as e:
                bad.append(f"{f.name}:{ln} JSON 파싱 실패 — {e}")
    return rows, bad


def main(write):
    years, y_unknown = load_years()
    ent_rows, bad = load("entities_*.jsonl")
    link_rows, bad2 = load("links_*.jsonl")
    errors = bad + bad2

    # --- 객체 병합 -------------------------------------------------------
    merged = {}
    for fname, ln, e in ent_rows:
        t, n = e.get("type"), e.get("name")
        if t not in TYPES:
            errors.append(f"{fname}:{ln} 알 수 없는 type '{t}' ({n})")
            continue
        if not n:
            errors.append(f"{fname}:{ln} name 없음")
            continue
        p0 = (e.get("points") or [None])[0]
        key, t, n = eid(t, n, p0), ctype(t, n, p0), canon(n, p0)
        cur = merged.setdefault(key, {"id": key, "name": n, "type": t, "aliases": [],
                                      "attrs": {}, "points": [], "desc": "", "descs": []})
        pts = e.get("points") or []
        cur["points"] = sorted(set(cur["points"]) | set(pts))
        cur["aliases"] = sorted((set(cur["aliases"]) | set(e.get("aliases") or [])
                                 | set(ALIAS_ADD.get(n, []))) - {n})
        for k, v in (e.get("attrs") or {}).items():
            cur["attrs"].setdefault(k, v)
        # 포인트별 서술을 전부 보존한다. 동명이인이 잘못 뭉쳐지면 여기서 눈에 보인다.
        if e.get("desc"):
            cur["descs"].append({"point": pts[0] if pts else None, "desc": e["desc"]})
            if len(e["desc"]) > len(cur["desc"]):
                cur["desc"] = e["desc"]

    # --- 링크 해석 -------------------------------------------------------
    # 링크의 타입 표기는 에이전트마다 어긋난다(같은 '로마 제국'을 group/place로 제각각).
    # 이름은 신뢰할 수 있으므로 이름으로 먼저 찾고, 이름이 여러 타입에 걸릴 때만 타입을 쓴다.
    by_name = defaultdict(list)
    for e in merged.values():
        by_name[norm(e["name"])].append(e["id"])

    def resolve(name, declared_type, point):
        key = norm(canon(name, point))
        cand = by_name.get(key, [])
        if len(cand) == 1:
            return cand[0]
        exact = eid(declared_type, name, point)
        if exact in merged:
            return exact
        # 이름이 여러 타입에 걸리고 선언 타입도 안 맞으면, 더 많은 포인트에 나온 쪽을 택한다
        if cand:
            return max(cand, key=lambda i: len(merged[i]["points"]))
        return None

    links, unresolved, dropped = [], [], []
    for fname, ln, l in link_rows:
        raw_rel = l.get("rel")
        if raw_rel in REL_REVERSE:                      # founded_by/ancestor는 방향이 반대다
            l["from"], l["to"] = l.get("to"), l.get("from")
            l["from_type"], l["to_type"] = l.get("to_type"), l.get("from_type")
            raw_rel = REL_REVERSE[raw_rel]
        rel = REL_MAP.get(raw_rel, raw_rel)
        if rel not in RELS:
            # 방향이 모호하거나(founded_by/ancestor) 대응 관계가 없는 것(authored)은 버린다.
            dropped.append(f"{fname}:{ln} rel '{l.get('rel')}' 대응 없음 — "
                           f"{l.get('from')} → {l.get('to')}")
            continue
        l["rel"] = rel
        lp = l.get("point")
        a = resolve(l.get("from", ""), l.get("from_type", ""), lp)
        b = resolve(l.get("to", ""), l.get("to_type", ""), lp)
        if not a or not b:
            miss = [n for n, r in ((l.get("from"), a), (l.get("to"), b)) if not r]
            unresolved.append(f"{fname}:{ln} 미해결 {miss} — {l.get('from')} -{rel}-> {l.get('to')}")
            continue
        if a == b:                                      # 자기 자신을 가리키는 링크는 버린다
            dropped.append(f"{fname}:{ln} 자기참조 — {l.get('from')} -{rel}-> {l.get('to')}")
            continue
        rec = {"from": a, "to": b, "rel": l["rel"], "point": l.get("point")}
        y = years.get((l.get("point"), norm(merged[a]["name"]), REL_KO[rel], norm(merged[b]["name"])))
        if y:
            rec["from_year"], rec["to_year"], rec["year_basis"] = y
        links.append(rec)
    # 완전 중복 링크 제거
    links = list({json.dumps(x, sort_keys=True): x for x in links}.values())

    # --- 유사명 충돌 리포트 ----------------------------------------------
    by_type = defaultdict(list)
    for e in merged.values():
        by_type[e["type"]].append(e)
    similar = []
    for t, group in by_type.items():
        for i, a in enumerate(group):
            for b in group[i + 1:]:
                r = SequenceMatcher(None, norm(a["name"]), norm(b["name"])).ratio()
                if r > 0.82:
                    similar.append(f"[{t}] {a['name']} (p{a['points']}) ~ {b['name']} (p{b['points']})  {r:.2f}")

    # --- 검증 ------------------------------------------------------------
    covered = {p for e in merged.values() for p in e["points"]}
    gaps = sorted(set(range(1, 31)) - covered)

    print(f"객체 {len(ent_rows)}건 → 병합 후 {len(merged)}개")
    print(f"링크 {len(link_rows)}건 → 유효 {len(links)}개, 미해결 {len(unresolved)}건, "
          f"규격외 폐기 {len(dropped)}건")
    dated = sum(1 for l in links if "from_year" in l)
    print(f"연도 부여 {dated}/{len(links)}개 ({dated/max(len(links),1)*100:.0f}%), 에이전트가 미상으로 남긴 것 {y_unknown}건")
    print("타입별:", ", ".join(f"{TYPE_KO[t]} {len(v)}" for t, v in sorted(by_type.items())))
    print(f"포인트 커버리지: {len(covered)}/30" + (f"  누락 {gaps}" if gaps else ""))
    print(f"유사명 후보 {len(similar)}쌍, 스키마 오류 {len(errors)}건")

    promoted = sorted([e for e in merged.values() if len(e["points"]) >= PROMOTE_MIN],
                      key=lambda e: (-len(e["points"]), e["type"], e["name"]))
    print(f"승격 대상({PROMOTE_MIN}개 포인트 이상): {len(promoted)}개")

    # 이름만으로는 타입이 다른 동명(그리스=집단/지명)이 서로 덮어쓴다. 겹칠 때만 타입을 붙인다.
    dup = {n for n, c in Counter(e["name"] for e in promoted).items() if c > 1}
    for e in merged.values():
        e["note"] = f"{e['name']} ({TYPE_KO[e['type']]})" if e["name"] in dup else e["name"]
    assert len({e["note"] for e in promoted}) == len(promoted), "노트 파일명 충돌"
    if dup:
        print(f"동명 구분(타입 병기): {sorted(dup)}")

    assert not errors, "스키마 오류:\n  " + "\n  ".join(errors[:20])
    assert not gaps, f"객체를 하나도 내지 못한 포인트: {gaps}"
    assert len(unresolved) <= len(link_rows) * 0.15, \
        f"미해결 링크가 15%를 넘는다 ({len(unresolved)}/{len(link_rows)}) — 이름 표기 불일치 점검 필요"

    if not write:
        print("\n(dry-run — 파일 미기록)")
        return

    # --- 기록 ------------------------------------------------------------
    ONTO.mkdir(parents=True, exist_ok=True)
    (ONTO / "entities.jsonl").write_text(
        "\n".join(json.dumps(e, ensure_ascii=False)
                  for e in sorted(merged.values(), key=lambda e: (e["type"], e["name"]))) + "\n",
        encoding="utf-8")
    (ONTO / "links.jsonl").write_text(
        "\n".join(json.dumps(l, ensure_ascii=False) for l in links) + "\n", encoding="utf-8")
    (ONTO / "_merge_report.txt").write_text("\n".join([
        f"객체 {len(ent_rows)} → {len(merged)} / 링크 {len(link_rows)} → {len(links)}",
        f"승격 {len(promoted)}개 (기준: {PROMOTE_MIN}개 이상 포인트 등장)",
        "", "## 유사명 후보 (표기 변형 의심 — 사람이 한 번 훑을 것)", *similar,
        "", "## 미해결 링크 (이름이 객체와 불일치)", *unresolved,
        "", "## 규격 외 rel로 폐기된 링크", *dropped,
    ]), encoding="utf-8")

    # --- 노트 승격 -------------------------------------------------------
    pmap = {int(p.name[:2]): p.stem for p in (BASE / "points").glob("*.md")}
    out_links = defaultdict(list)
    in_links = defaultdict(list)
    for l in links:
        out_links[l["from"]].append(l)
        in_links[l["to"]].append(l)

    NOTES.mkdir(parents=True, exist_ok=True)
    for e in promoted:
        fm = ["---", "created: 2026-07-28", "type: entity",
              f"entity_type: {e['type']}", f"entity_id: {e['id']}", "book: 로마제국쇠망사",
              f"points: [{', '.join(str(p) for p in e['points'])}]"]
        if e["aliases"]:
            fm.append("aliases:\n" + "\n".join(f"  - {a}" for a in e["aliases"]))
        for k, v in e["attrs"].items():
            # 에이전트가 attrs에 type·points 등을 넣으면 프론트매터 키가 중복되고,
            # YAML이 조용히 덮어써서 옵시디언 속성이 깨진다. 접두사로 피한다.
            if k in RESERVED_KEYS:
                k = f"attr_{k}"
            if not re.fullmatch(r"[\w가-힣][\w가-힣 ]*", k):
                continue
            fm.append(f"{k}: {json.dumps(v, ensure_ascii=False)}")
        # 타입별 태그. 그래프 색 그룹을 속성 검색 대신 태그 검색으로 걸기 위함 —
        # 속성 검색 문법(`[entity_type:person]`)은 파서가 거부하면 그래프 뷰가 통째로 죽는다.
        fm += ["tags:", "  - topic/산스", "  - topic/편데", f"  - entity/{e['type']}",
              *[f"  - point/{n:02d}" for n in e["points"]],
               "up:", '  - "[[로마제국쇠망사_온톨로지]]"', "---", ""]

        body = [f"# {e['name']}", ""]
        # 서술이 여럿이면 포인트별로 나란히 둔다. 같은 이름의 다른 인물이 뭉쳐졌다면 여기서 드러난다.
        seen_d = {}
        for d in e["descs"]:
            seen_d.setdefault(d["desc"], d["point"])
        if len(seen_d) <= 1:
            body += [e["desc"], ""]
        else:
            body += ["### 포인트별 서술", ""]
            body += [f"- **{p}. {pmap[p].split('_', 1)[1].replace('_', ' ')}** — {d}"
                     if p in pmap else f"- {d}" for d, p in seen_d.items()]
            body += [""]
        body += ["### 등장 포인트", ""]
        body += [f"- [[{pmap[p]}]]" for p in e["points"] if p in pmap]
        tag = lambda l: f"  *{yr(l['from_year'], l['to_year'])}*" if "from_year" in l else ""
        rel_lines = ([f"- {REL_KO[l['rel']]} → [[{merged[l['to']]['note']}]]{tag(l)}" for l in out_links[e["id"]]]
                     + [f"- [[{merged[l['from']]['note']}]] ← {REL_KO[l['rel']]}{tag(l)}" for l in in_links[e["id"]]])
        if rel_lines:
            body += ["", "### 관계", ""] + sorted(set(rel_lines))
        (NOTES / e["type"]).mkdir(parents=True, exist_ok=True)
        (NOTES / e["type"] / f"{e['note']}.md").write_text("\n".join(fm + body) + "\n", encoding="utf-8")

    # 디렉터리를 통째로 지우고 다시 쓰면 iCloud가 삭제·생성 경합을 충돌로 보고
    # '이름 2.md' 사본을 무더기로 만든다. 제자리 덮어쓴 뒤 남은 옛 파일만 지운다.
    keep = {ud.normalize("NFC", f"{e['type']}/{e['note']}.md") for e in promoted}
    stale = [f for f in NOTES.rglob("*.md") if ud.normalize("NFC", f.relative_to(NOTES).as_posix()) not in keep]
    for f in stale:
        f.unlink()

    print(f"\n기록 완료: entities.jsonl, links.jsonl, _merge_report.txt, "
          f"entities/ {len(promoted)}개 노트 (옛 파일 {len(stale)}개 정리)")


if __name__ == "__main__":
    main(write="--write" in sys.argv)
