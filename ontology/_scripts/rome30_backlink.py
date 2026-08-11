"""경로·영토 리서치 결과를 그 주체가 되는 객체 노트에 되돌려 넣는다.

리서치를 별도 노트(경로.md, 반달 왕국.md)에만 두면 정작 그 인물·집단·사건
노트를 열었을 때 아무것도 안 보인다. 주체 객체에 지도와 요약을 심어
어느 쪽에서 들어와도 닿게 한다.

실행 순서: merge → geo → maps → routes → territory → 이 스크립트
"""
import json
import re
import sys
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
R, NOTES = BASE / "ontology/_routes", BASE / "entities"
MARKER = "### 이동 경로"
CONF = {"high": "확실", "medium": "대략", "low": "불확실"}
COLORS = {"hannibal": "#e0533d", "caesar": "#ff9800", "goths": "#00bcd4",
          "islam": "#4caf50", "alaric": "#9c27b0", "justinian": "#3f51b5",
          "migration2": "#795548", "vandal_kingdom": "#7b1fa2",
          "visigoth_kingdom": "#c62828", "ostrogoth_kingdom": "#00838f",
          "carthage_kingdom": "#ef6c00", "sasanian_kingdom": "#283593",
          "gallic_kingdom": "#2e7d32", "lombard_kingdom": "#4e342e"}
# 각 리서치의 주체가 되는 객체. 이름이 바뀌면 여기만 고친다.
SUBJECT = {"hannibal": "한니발", "caesar": "카이사르", "goths": "고트족",
           "migration2": "제2차 이동기", "alaric": "알라리크", "islam": "이슬람 세력",
           "justinian": "유스티니아누스", "vandal_kingdom": "반달 왕국",
           "visigoth_kingdom": "서고트 왕국", "ostrogoth_kingdom": "동고트 왕국",
           "carthage_kingdom": "카르타고", "sasanian_kingdom": "사산조 페르시아 (지명)",
           "gallic_kingdom": "갈리아 제국", "lombard_kingdom": "롬바르드 왕국"}
def center(gj_path):
    """GeoJSON 경계의 중심과 적정 줌. lat/long이 없으면 지도 초기화가 어긋난다."""
    import json as _j
    xs, ys = [], []
    for ft in _j.loads(gj_path.read_text(encoding="utf-8"))["features"]:
        g = ft["geometry"]
        cs = [g["coordinates"]] if g["type"] == "Point" else (
            g["coordinates"] if g["type"] == "LineString" else g["coordinates"][0])
        for x, y in cs:
            xs.append(x); ys.append(y)
    if not xs:
        return 40.0, 20.0, 4
    span = max(max(xs) - min(xs), max(ys) - min(ys))
    z = 3 if span > 30 else 4 if span > 15 else 5 if span > 7 else 6
    return (min(ys) + max(ys)) / 2, (min(xs) + max(xs)) / 2, z


yr = lambda y: (f"기원전 {-y}" if y < 0 else str(y)) if isinstance(y, int) else "?"


def gazetteer():
    g = {}
    for line in (R / "gazetteer.tsv").read_text(encoding="utf-8").splitlines()[1:]:
        c = line.split("\t")
        if len(c) >= 3:
            g[c[0].strip()] = (float(c[1]), float(c[2]))
    return g


def resolve(rows, gaz):
    """리서치 JSON의 in_gazetteer 플래그는 낡을 수 있다(사전이 뒤에 늘어남).
    이름·좌표로 다시 맞춰 링크를 살린다."""
    for w in rows or []:
        nm = str(w.get("place", "")).strip()
        try:
            lat, lon = float(w["lat"]), float(w["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        if nm in gaz and abs(gaz[nm][0]-lat) < 0.3 and abs(gaz[nm][1]-lon) < 0.3:
            w["in_gazetteer"] = True
        elif nm not in gaz:
            hit = [g for g, (a, o) in gaz.items()
                   if abs(a-lat) < 0.05 and abs(o-lon) < 0.05]
            if hit:
                w["place"], w["in_gazetteer"] = hit[0], True
            else:
                w["in_gazetteer"] = False
    return rows


def section(stem, d, is_terr):
    """주체 노트에 넣을 절."""
    clat, clon, cz = center(R / f"{stem}.geojson")
    title = "영토" if is_terr else "이동 경로"
    out = [MARKER.replace("이동 경로", title), "",
           f"**{d.get('period','')}** — {d.get('summary','')}", "",
           "```leaflet", f"id: subj-{stem}",
           f"geojson: [[{stem}.geojson]]",
           f"geojsonColor: {COLORS.get(stem) or d.get('color') or '#7b1fa2'}",
           f"lat: {clat:.4f}", f"long: {clon:.4f}", f"zoom: {cz}",
           "minZoom: 2", "maxZoom: 12",
           # zoomFeatures는 쓰지 않는다. 켜면 계산된 zoom을 덮고 minZoom까지 주저앉아
           # 모든 지도가 세계 규모로 뜬다(실측: 타일 z2). center()가 낸 값이 정확하다.
           "height: 420px", "unit: km"]
    out += ["```", ""]

    if is_terr:
        out += ["면의 진하기가 신뢰도다 — **진함 = 확실 · 중간 = 대략 · 흐림 = 불확실**. "
                "면을 누르면 그 부분의 설명이 뜬다.", ""]
    else:
        out += ["지점 색이 신뢰도다 — **초록 = 확실 · 노랑 = 대략 · 빨강 = 불확실**. "
                "지점을 누르면 연도와 사건이 뜬다.", ""]
    if is_terr and d.get("territory"):
        out += ["> [!note]- 영토 부분 표", ">"]
        out += ["> | 영토 부분 | 비고 | 신뢰도 |", "> |---|---|---|"]
        for t in d["territory"]:
            out.append(f"> | {t['part']} | {t.get('note','')} | {CONF.get(t.get('confidence'),'?')} |")
        out += ["", "경계선은 근사다. 고대 왕국의 국경은 현대적 국경선처럼 확정된 선이 아니었고, "
                "특히 내륙 사막 방면은 실효 지배 범위가 유동적이었다.", ""]
    rows = d.get("cities") if is_terr else d.get("waypoints")
    label = "도시" if is_terr else "경유지"
    out += [f"> [!note]- {label} 표", ">",
            "> | 연도 | 지점 | 일어난 일 | 신뢰도 |", "> |---|---|---|---|"]
    for w in rows or []:
        nm = f"[[{w['place']}]]" if w.get("in_gazetteer") else w["place"]
        ev = w.get("event", "")
        out.append(f"> | {yr(w.get('year'))} | {nm} | {ev[:70]} | {CONF.get(w.get('confidence'),'?')} |")
    if d.get("sources"):
        out += ["", f"출처: {' · '.join(d['sources'])}"]
    if not is_terr:
        out += ["", "다른 경로는 [[경로]]."]
    out += [""]
    return "\n".join(out)


def main(write):
    gaz = gazetteer()
    ent_types = {e["note"]: e["type"] for e in
                 (json.loads(l) for l in (BASE / "ontology/entities.jsonl").open(encoding="utf-8"))}
    n = 0
    # 영토 파일은 JSON 안의 subject가 대상 노트를 가리킨다. 경로 파일만 SUBJECT 표를 쓴다.
    targets = dict(SUBJECT)
    for jf in (sorted(R.glob("*_area.json")) + sorted(R.glob("*_kingdom.json"))
               + sorted(R.glob("*_river.json"))):
        subj = json.loads(jf.read_text(encoding="utf-8")).get("subject")
        if subj:
            targets[jf.stem] = subj
    for stem, subj in targets.items():
        jf = R / f"{stem}.json"
        gf = R / f"{stem}.geojson"
        note = NOTES / ent_types.get(subj, "") / f"{subj}.md"
        if not (jf.exists() and gf.exists()):
            print(f"  건너뜀 {stem}: 리서치 파일 없음")
            continue
        if not note.exists():
            print(f"  건너뜀 {stem}: 객체 노트 없음 — {subj}")
            continue
        d = json.loads(jf.read_text(encoding="utf-8"))
        is_terr = stem.endswith(("_kingdom", "_area"))   # 강은 선이라 경로 쪽 서식을 쓴다
        resolve(d.get("cities") if is_terr else d.get("waypoints"), gaz)

        t = note.read_text(encoding="utf-8")
        head, body = t.split("\n---\n", 1)
        # 기존 절 제거 → 멱등. '### 영토'와 '### 이동 경로' 둘 다 걷어낸다
        body = re.split(r"\n### (?:이동 경로|영토)\n", body)[0].rstrip()
        note.write_text(head + "\n---\n" + body + "\n\n" + section(stem, d, is_terr),
                        encoding="utf-8")
        # 도시 없는 영토가 있다(민족 분포 등). None이면 빈 목록으로 센다.
        cnt = len((d.get("cities") if is_terr else d.get("waypoints")) or [])
        print(f"  {subj:14s} ← {stem}  ({cnt}점)")
        n += 1
    print(f"\n{'기록' if write else 'dry-run'}: 주체 객체 {n}개")


if __name__ == "__main__":
    if "--write" not in sys.argv:
        print("(dry-run 미지원 — 실제로 쓰려면 --write)")
        sys.exit(0)
    main(True)
