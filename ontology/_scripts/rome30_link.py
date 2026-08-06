"""points/*.md 본문의 객체명을 위키링크로 바꾸고 하단에 등장 객체 목록을 붙인다.

한글은 어절 경계가 없어 부분일치가 쉽게 난다(`로마`가 `로마인들` 안에서 잡힌다).
- 긴 이름 우선: `로마 제국`이 `로마`보다 먼저 매칭된다
- 앞뒤 경계 검사: 앞 글자가 한글이면 건너뛰고, 뒷 글자가 한글이면 조사일 때만 링크
- 첫 등장만 링크: 같은 이름을 스무 번 링크해봐야 읽기만 나빠진다
재실행해도 결과가 같다(멱등).
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
TYPE_KO = {"person": "인물", "place": "지명", "event": "사건", "period": "시대",
           "group": "집단", "institution": "제도", "work": "저작"}
TYPE_ORDER = ["person", "place", "event", "period", "group", "institution", "work"]
MARKER = "### 등장 객체"
# rome30_nav.py가 심은 이전/다음 띠. 목차 링크가 든 줄이 곧 띠다.
NAV = re.compile(r"^.*\[\[00_목차\|목차\]\].*$", re.M)
NAV_HOLD = "\x00NAV\x00"

# 이름 뒤에 이것들이 붙으면 여전히 그 이름을 가리킨다고 본다.
PARTICLES = ("으로서", "으로써", "이라는", "이라고", "에게서", "에서는", "으로", "에서", "에게",
             "부터", "까지", "보다", "처럼", "라는", "라고", "이나", "이며", "이고", "인데",
             "한테", "조차", "마저", "밖에", "대로", "이란", "이야", "이여", "이었", "같은",
             "같이", "답게", "은", "는", "이", "가", "을", "를", "의", "에", "와", "과",
             "도", "로", "만", "나", "야", "여", "께", "란", "서", "였", "임", "인")

is_hangul = lambda c: "가" <= c <= "힣"


def boundary_ok(text, start, end):
    if start > 0 and is_hangul(text[start - 1]):
        return False
    if end >= len(text) or not is_hangul(text[end]):
        return True
    return text[end:].startswith(PARTICLES)


def link_body(body, surfaces):
    """surfaces: [(표기, 노트명)] — 긴 것부터 정렬되어 있어야 한다."""
    pattern = re.compile("|".join(re.escape(s) for s, _ in surfaces))
    note_of = dict(surfaces)
    linked, count = set(), 0
    out_lines = []
    for line in body.split("\n"):
        if line.startswith("#") or line.startswith(">"):
            out_lines.append(line)
            continue
        # 이미 걸린 위키링크 구간은 건드리지 않는다
        spans = [m.span() for m in re.finditer(r"\[\[[^\]]*\]\]", line)]
        for a, b in spans:
            for s, n in surfaces:
                if f"[[{n}" in line[a:b]:
                    linked.add(n)

        def repl(m):
            nonlocal count
            note = note_of[m.group(0)]
            if note in linked or any(a <= m.start() < b for a, b in spans):
                return m.group(0)
            if not boundary_ok(line, m.start(), m.end()):
                return m.group(0)
            linked.add(note)
            count += 1
            return f"[[{note}|{m.group(0)}]]" if note != m.group(0) else f"[[{note}]]"

        out_lines.append(pattern.sub(repl, line))
    return "\n".join(out_lines), count, linked


def extend(ents_here, all_ents, md, held):
    """등록된 포인트 밖이라도 본문에 이름이 나오면 그 포인트의 객체로 친다.

    추출은 포인트마다 따로 돌았기 때문에, 3번 본문에 뻔히 나오는 '로마 군'이
    17·18번에만 등록돼 있는 식의 누락이 437쌍 있었다. 본문이 근거지 등록부가 아니다.

    다만 그 포인트에 이름이 겹치는 객체가 이미 있으면 손대지 않는다 — 9번의
    '클레오파트라'와 '클레오파트라 7세'처럼 동명이인이거나 갈라진 중복이고,
    둘 중 어느 쪽을 가리키는지는 기계가 정할 문제가 아니다. held에 남겨 보고한다.
    """
    own = {e["id"] for e in ents_here}
    own_persons = [e["name"] for e in ents_here if e["type"] == "person"]
    own_all = [e["name"] for e in ents_here]
    body = md.read_text(encoding="utf-8").split(MARKER)[0]
    body = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", NAV.sub("", body))
    added = []
    for e in all_ents:
        if e["id"] in own:
            continue
        surfaces = [s for s in [e["name"], *e.get("aliases", [])] if s and len(s) >= 2]
        if not any(boundary_ok(body, m.start(), m.end())
                   for s in surfaces for m in re.finditer(re.escape(s), body)):
            continue
        # 표기 하나라도 걸리면 그 객체 전체를 보류한다. 근거는 둘이다.
        #
        # (가) 인물 이름의 짧은 형태. 본문의 맨 '안토니우스'가 마르쿠스 안토니우스를
        #      줄여 부른 것인지 다른 안토니우스인지는 기계가 알 수 없다.
        # (나) 이 포인트의 다른 객체 이름이 그 표기로 '시작'하는 경우. 3번의 '리비아'는
        #      아우구스투스의 아내가 아니라 한니발 군의 리비아인 병사였다. 파생어(리비아인,
        #      기독교인, 로마 군, 그리스어)가 있으면 맨이름은 다른 뜻일 공산이 크다.
        #      반대로 접미가 아니라 접두로 갈리는 것(고트족 ↔ 동고트족, 그리스 ↔ 예수
        #      그리스도)은 링커가 긴 표기를 먼저 매칭하므로 저절로 갈린다.
        clash = next(
            (n for s in surfaces for n in own_all
             if n != e["name"] and (n.startswith(s)
                                    or (e["type"] == "person" and n in own_persons and s in n))),
            None)
        if clash:
            held.append((md.name[:2], e["name"], clash))
        else:
            added.append(e)
    return ents_here + added


def main(write):
    ents = [json.loads(l) for l in (BASE / "ontology/entities.jsonl").open(encoding="utf-8")]
    held = []
    by_point = defaultdict(list)
    for e in ents:
        for p in e["points"]:
            by_point[p].append(e)

    total_inline = 0
    for md in sorted((BASE / "points").glob("*.md")):
        if not md.name[:2].isdigit():      # 목차·부속물 노트는 포인트가 아니다
            continue
        pt = int(md.name[:2])
        ents_here = by_point.get(pt, [])
        if not ents_here:
            print(f"{md.name}: 객체 없음")
            continue

        ents_here = extend(ents_here, ents, md, held)

        text = md.read_text(encoding="utf-8")
        head, body = text.split("\n---\n", 1) if text.startswith("---") else ("", text)
        # 기존 목록·링크를 전부 걷어내고 처음부터 다시 건다. 객체 이름이 바뀌어도
        # 옛 링크가 깨진 채 남지 않는다.
        body = body.split(MARKER)[0].rstrip()
        # rome30_nav.py가 심은 이전/다음 띠는 링크 재작성 대상이 아니다. 잠깐 빼뒀다 되돌린다.
        navs = NAV.findall(body)
        body = NAV.sub(NAV_HOLD, body)
        body = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", body)

        surfaces = []
        for e in ents_here:
            for s in [e["name"], *e.get("aliases", [])]:
                if s and len(s) >= 2:
                    surfaces.append((s, e["note"]))
        # 표기 중복은 먼저 온 것(정식 이름) 우선, 그다음 긴 것 우선
        dedup = {}
        for s, n in surfaces:
            dedup.setdefault(s, n)
        surfaces = sorted(dedup.items(), key=lambda x: -len(x[0]))

        body, n_inline, linked = link_body(body, surfaces)
        for nav in navs:
            body = body.replace(NAV_HOLD, nav, 1)
        total_inline += n_inline

        groups = defaultdict(list)
        for e in ents_here:
            groups[e["type"]].append(e)
        footer = [MARKER, ""]
        for t in TYPE_ORDER:
            if not groups[t]:
                continue
            items = sorted(groups[t], key=lambda e: e["name"])
            cells = ", ".join(f"[[{e['note']}|{e['name']}]]" if e["note"] != e["name"]
                              else f"[[{e['name']}]]" for e in items)
            footer.append(f"- **{TYPE_KO[t]}** — {cells}")
        new = (head + "\n---\n" if head else "") + body + "\n\n" + "\n".join(footer) + "\n"

        print(f"{md.name[:32]:34s} 객체 {len(ents_here):3d}  본문링크 {n_inline:3d}")
        if write:
            md.write_text(new, encoding="utf-8")

    if held:
        print(f"\n[보류] 이름이 겹쳐 자동 연결하지 않은 {len(held)}건 — 중복 객체이거나 동명이인이다:")
        for pt, name, clash in held:
            print(f"  p{pt}  {name}  ↔ 이미 있는 {clash}")
    print(f"\n본문 인라인 링크 총 {total_inline}개" + ("" if write else "  (dry-run — 미기록)"))


if __name__ == "__main__":
    main(write="--write" in sys.argv)
