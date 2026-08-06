"""족보를 Obsidian Canvas로 생성한다. rome30_family.py와 같은 데이터, 다른 그릇.

왜 Canvas인가 — Mermaid는 배치를 못 정한다. 족보는 세대가 행으로 정렬돼야 읽히는데
Mermaid의 자동 배치는 그걸 보장하지 않는다. Canvas는 x/y를 직접 지정하므로 세대를
행으로 못박을 수 있고, 그룹(범주 레이어)·색·이미지·위키링크를 다 쓴다.
그리고 Canvas는 JSON이라 **손으로 그리지 않고 생성**할 수 있다 — Excalidraw로 그리면
예쁘지만 그 순간 데이터와 갈라져 다시는 안 맞는다.

## 모델 — 혼인은 선이 아니라 노드다

계보학 표준(GEDCOM)은 개인(INDI)과 가족(FAM) 두 레코드를 쓴다. 혼인을 사람 사이의
선으로 그리면 재혼·이복형제·양자를 표현할 수 없다. 혼인을 노드로 두면 전부 풀린다.

    아버지 ─┐
            ├─ [혼인] ─→ 자식들
    어머니 ─┘

같은 사람이 여러 혼인 노드에 붙으면 그게 재혼이고, 자식이 어느 혼인 노드에 달렸는지가
이복 여부다. 양자는 혼인 노드에서 나가는 간선에 라벨을 단다.

## 디자인 체계

색은 한 가지 뜻만 지닌다 — **성별**. 재위·양자 같은 다른 축을 색에 섞으면 읽을 수 없다.
    남 = 5(청록) · 여 = 6(보라) · 미상 = 무색
    혼인 노드 = 3(노랑), 작게
황제는 색이 아니라 **글자**로 표시한다(재위 연도 줄). 범주는 그룹 상자로 두른다.
"""
import json
import re
import sys
import hashlib
from collections import defaultdict
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
OUT = BASE / "family"
NOTE_DIR = "Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/Books/로마제국쇠망사/entities"

# 성별 선언은 rome30_family.py 한 곳에만 둔다. 여기 사본을 두면 한쪽만 고쳐져
# 두 그림의 색이 갈라진다. main()에서 채운다.
FEMALE, MALE = set(), set()

W, H = 230, 104           # 인물 칸. 생몰년·재위 두 줄이 들어간다
UW, UH = 92, 42           # 혼인 칸
# 세로 간격은 간선 라벨이 들어갈 자리다. 좁으면 관계 표시가 겹쳐 안 보인다.
GAP_X, GAP_Y = 160, 320
COL = {"male": "5", "female": "6", "union": "3"}

nid = lambda s: hashlib.md5(s.encode()).hexdigest()[:16]


def sex(name):
    if name in FEMALE:
        return "female"
    return "male" if name in MALE else "unknown"


def generations(comp, child, marry, unions):
    """세대 = 부모 사슬의 최장 길이. 단 배우자는 같은 세대로 맞춘다.

    부모 기록이 없으면 0세대로 올라가는데, 그러면 안토니아(3세대)가 카이사르와
    같은 줄에 선다. 실제로 그렇게 그려져서 족보로 안 읽혔다. 배우자끼리 세대를
    동기화하면 기록 없는 쪽이 배우자를 따라 내려온다.
    """
    par = defaultdict(set)
    for c, p in child:
        if c in comp and p in comp:
            par[c].add(p)
    couples = [tuple(u) for u in unions if len(u) == 2] + \
              [(a, b) for a, b in marry if a in comp and b in comp]
    gen = {n: 0 for n in comp}
    cap = len(comp)      # 세대는 사람 수를 넘을 수 없다. 넘으면 순환이 남아 있다는 뜻이다.
    for _ in range(60):
        changed = False
        for n in comp:
            if par[n]:
                # 배우자 동기화가 올려놓은 세대를 부모 규칙이 도로 끌어내리면 둘이
                # 영원히 핑퐁한다. 두 규칙 다 '올리기만' 해야 멈춘다.
                g = min(max(max(gen[p] for p in par[n]) + 1, gen[n]), cap)
                if g != gen[n]:
                    gen[n], changed = g, True
        for a, b in couples:
            if a in gen and b in gen and gen[a] != gen[b]:
                gen[a] = gen[b] = max(gen[a], gen[b])
                changed = True
        if not changed:
            break
    else:
        # 60회를 다 돌고도 안 멈췄다 = 순환이 있다. 조용히 4만 픽셀짜리 캔버스를
        # 뱉는 대신 알린다. 실제로 한 번 그랬다.
        print("  [경고] 세대 계산이 수렴하지 않았다 — 혈연 관계에 순환이 남아 있다")
    return gen, par


ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


def build(comp, ents, child, marry, succ, title):
    """임상 계보도 표기를 따른다 — 세대는 로마숫자, 개인은 `II-3` 꼴 고유번호,
    부부는 혼인 노드로 잇고 거기서 자녀가 내려온다. 선에는 관계를 반드시 적는다."""
    by_name = {e["name"]: e for e in ents.values()}

    par = defaultdict(set)
    for c, p in child:
        if c in comp and p in comp:
            par[c].add(p)
    # 혼인은 '친부모 쌍'에서만 유추한다. 양자·조모처럼 비혈연 계보(KIN)로 이어진 부모는
    # 빼야 한다 — 안 빼면 아우구스투스의 부모 집합 {카이사르(양자), 율리아(조모)}가
    # 카이사르와 그의 딸을 부부로 만들고, 세대가 진동하다 전부 한 줄로 뭉갠다.
    bio = defaultdict(set)
    for c, p in child:
        if c in comp and p in comp and (c, p) not in KIN_SRC:
            bio[c].add(p)
    unions = defaultdict(list)
    for c in sorted(comp):
        if len(bio[c]) >= 2:
            unions[frozenset(bio[c])].append(c)
    for a, b in marry:
        if a in comp and b in comp and frozenset((a, b)) not in unions:
            unions[frozenset((a, b))] = []

    gen, par = generations(comp, child, marry, unions)

    order = {}
    for g in sorted({gen[n] for n in comp}):
        names = [n for n in comp if gen[n] == g]
        # 부모 위치로 형제를 묶고, 부부는 남 왼쪽·여 오른쪽(계보도 관례)으로 세운다.
        key = lambda n: (min((order.get(p, 99) for p in par[n]), default=99),
                         0 if sex(n) == "male" else 1, n)
        for i, n in enumerate(sorted(names, key=key)):
            order[n] = i

    rows = defaultdict(list)
    for n in sorted(comp, key=lambda x: (gen[x], order[x])):
        rows[gen[n]].append(n)
    # 고유번호. 이게 있어야 "II-3의 자녀"처럼 사람을 지목해 말할 수 있다.
    code = {n: f"{ROMAN[min(gen[n], 9)]}-{i+1}"
            for g, names in rows.items() for i, n in enumerate(names)}

    nodes, edges, pos = [], [], {}
    for g, names in sorted(rows.items()):
        span = len(names) * (W + GAP_X)
        for i, n in enumerate(names):
            x, y = i * (W + GAP_X) - span // 2, g * (H + GAP_Y)
            pos[n] = (x, y)
            reign = (by_name.get(n, {}).get("attrs") or {}).get("reign")
            txt = (f"{code[n]}  {n}*" if n in CTX_PEOPLE else f"{code[n]}  **[[{n}]]**")
            life = LIFE_KO(n)
            if life:
                txt += f"\n{life}"
            if reign:
                txt += f"\n재위 {REIGN_KO(reign)}"
            nodes.append({"id": nid(n), "type": "text", "x": x, "y": y,
                          "width": W, "height": H, "text": txt,
                          **({} if n in CTX_PEOPLE else
                             {"color": COL[sex(n)]} if sex(n) != "unknown" else {})})

    x_left = min(x for x, _ in pos.values())
    for g, names in sorted(rows.items()):
        nodes.append({"id": nid(f"gen{g}:{title}"), "type": "text",
                      "x": x_left - 150, "y": g * (H + GAP_Y) + 18,
                      "width": 96, "height": 52,
                      "text": f"**{ROMAN[min(g, 9)]}**\n{g+1}세대"})

    sib_boxes = []
    for parents, kids in sorted(unions.items(), key=lambda kv: sorted(kv[0])):
        # frozenset은 순회 순서가 실행마다 다르다(문자열 해시 무작위화).
        # 정렬하지 않으면 간선 순서와 id가 매번 바뀌어 멱등이 깨진다.
        ps = [p for p in sorted(parents) if p in pos]
        if not ps:
            continue
        ux = sum(pos[p][0] for p in ps) // len(ps) + (W - UW) // 2
        uy = max(pos[p][1] for p in ps) + H + (GAP_Y - UH) // 2
        uid = nid("union:" + "|".join(sorted(parents)))
        label = UNION_LABEL(parents)
        nodes.append({"id": uid, "type": "text", "x": ux, "y": uy,
                      "width": UW + 84, "height": UH, "color": COL["union"], "text": label})
        for p in ps:
            edges.append({"id": nid(f"e{p}>{uid}"), "fromNode": nid(p), "fromSide": "bottom",
                          "toNode": uid, "toSide": "top", "toEnd": "none",
                          **({"color": DIM} if tuple(sorted(parents)) in CTX_EDGES else {}),
                          "label": "남편" if sex(p) == "male" else
                                   ("아내" if sex(p) == "female" else "배우자")})
        for k in kids:
            kin = KIN_LABEL.get(k)
            lab = f"계자({kin})" if kin else ("아들" if sex(k) == "male" else
                                             ("딸" if sex(k) == "female" else "자녀"))
            edges.append({"id": nid(f"e{uid}>{k}"), "fromNode": uid, "fromSide": "bottom",
                          "toNode": nid(k), "toSide": "top", "label": lab,
                          **({"color": DIM} if any((k, pa) in CTX_EDGES
                                                   for pa in parents) else {})})
        if len(kids) >= 2 and all(k in pos for k in kids):
            xs = [pos[k][0] for k in kids]
            ys = [pos[k][1] for k in kids]
            names = " × ".join(f"{code[p]} {p}" for p in sorted(parents, key=lambda q: pos.get(q, (0,))[0]))
            sib_boxes.append({"id": nid("sib:" + "|".join(sorted(kids))), "type": "group",
                              "x": min(xs) - 18, "y": min(ys) - 46,
                              "width": max(xs) + W - min(xs) + 36,
                              "height": max(ys) + H - min(ys) + 64, "color": "3",
                              "label": f"{names} 사이의 형제"})

    drawn = {k for kids in unions.values() for k in kids}
    for c, p in child:
        if c in comp and p in comp and c not in drawn:
            kin = KIN_LABEL.get(c)
            lab = f"계자({kin})" if kin else ("아버지" if sex(p) == "male" else
                                             ("어머니" if sex(p) == "female" else "부모"))
            edges.append({"id": nid(f"d{p}>{c}"), "fromNode": nid(p), "fromSide": "bottom",
                          "toNode": nid(c), "toSide": "top", "label": lab,
                          **({"color": DIM} if (c, p) in CTX_EDGES else {})})

    for a, b in succ:
        if a in comp and b in comp:
            edges.append({"id": nid(f"s{b}>{a}"), "fromNode": nid(b), "fromSide": "right",
                          "toNode": nid(a), "toSide": "left", "color": "2", "label": "제위 계승"})

    xs = [n["x"] for n in nodes]
    ys = [n["y"] for n in nodes]
    x0, y0 = min(xs) - 90, min(ys) - 120
    legend = ("**범례** — 임상 계보도 표기\n\n"
              "`II-3` = 세대-개인 번호. 사람을 지목할 때 쓴다\n"
              "청록 = 남 · 보라 = 여 · 무색 = 미상\n"
              "칸 안 둘째 줄 = 생몰년. '약'이 붙으면 추정이다\n"
              "흐린 선·이름 뒤 별표 = 이 책 본문에 없는 맥락 보강\n"
              "남자를 왼쪽, 여자를 오른쪽에 세운다\n\n"
              "노랑 칸 = 혼인. 한 사람이 여러 번이면 차수를 적는다\n"
              "노랑 상자 = 그 혼인에서 난 형제\n"
              "선 위의 말 = 관계. 남편·아내·아들·딸·계자\n"
              "계자(양자) = 혈연이 아닌 계승. 한국 족보의 系子\n"
              "주황 선 = 제위 계승. 혈연과 다른 축이다")
    nodes.append({"id": nid("legend:" + title), "type": "text",
                  "x": max(xs) + W + 90, "y": y0 + 120,
                  "width": 330, "height": 330, "text": legend})
    body = {"id": nid("g:" + title), "type": "group", "x": x0, "y": y0,
            "width": max(xs) + W - x0 + 90, "height": max(ys) + H - y0 + 120,
            "label": title, "color": "4"}
    return {"nodes": [body] + sib_boxes + nodes, "edges": edges}


KIN_LABEL = {}
KIN_SRC = set()
CTX_EDGES = set()
CTX_PEOPLE = set()
DIM = "#52525b"      # 보강 간선 색. 본문 근거가 아니라는 표시다
LIFE_KO = lambda n: ""
UNION_LABEL = lambda p: "혼인"
REIGN_KO = str


def main(write):
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "fam", Path(__file__).parent / "rome30_family.py")
    fam = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fam)
    globals()["REIGN_KO"] = fam.reign_ko
    by = fam.born()
    globals()["LIFE_KO"] = lambda n: fam.life_ko(n, by)
    globals()["UNION_LABEL"] = fam.union_label
    KIN_LABEL.update({c: lab for (c, _p), lab in fam.KIN.items()})
    KIN_SRC.update(fam.KIN)
    CTX_EDGES.update(fam.CTX_EDGES)
    CTX_PEOPLE.update(fam.CONTEXT_PEOPLE)
    FEMALE.update(fam.FEM_HINT)
    MALE.update(fam.MAL_HINT)

    ents, child, marry, succ = fam.load()
    comps = [c for c in fam.clusters(child, marry) if len(c) >= 3]
    pts = {e["name"]: len(e["points"]) for e in ents.values()}
    OUT.mkdir(exist_ok=True)
    for c in comps:
        anchor = max(sorted(c), key=lambda n: (pts.get(n, 0), n))
        title = f"족보 {anchor} 계열"
        cv = build(c, ents, child, marry, succ, title)
        ids = [n["id"] for n in cv["nodes"]]
        assert len(ids) == len(set(ids)), f"{title}: 노드 id 중복"
        for e in cv["edges"]:
            assert e["fromNode"] in ids and e["toNode"] in ids, f"{title}: 끊긴 간선"
        print(f"  {len(c):3d}명  {title}  (노드 {len(cv['nodes'])} · 간선 {len(cv['edges'])})")
        if write:
            (OUT / f"{title.replace(' ', '_')}.canvas").write_text(
                json.dumps(cv, ensure_ascii=False, indent=1), encoding="utf-8")
    print("\n" + ("기록 완료" if write else "(dry-run — 미기록)"))


if __name__ == "__main__":
    main("--write" in sys.argv)
