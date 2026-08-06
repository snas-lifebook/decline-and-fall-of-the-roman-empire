"""리서치된 경로 JSON → GeoJSON LineString + 경로 노트.

경로는 역사 서술이므로 검증을 빡빡하게 건다.
- 연도가 시간순인가 (역행하면 순서가 틀린 것)
- gazetteer에 있다고 표시한 지명의 좌표가 실제 사전값과 일치하는가
- 좌표가 로마 세계 범위 안인가
어긋나면 그 경로는 기록하지 않는다.
"""
import json
import re
import sys
import unicodedata as ud
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
R = BASE / "ontology/_routes"
LON_RANGE, LAT_RANGE = (-12.0, 125.0), (5.0, 71.0)
CONF = {"high": "확실", "medium": "대략", "low": "불확실"}
# 경유지도 신뢰도를 색으로. 전승에 기댄 지점이 한눈에 구분된다.
PT_STYLE = {"high":   {"marker-color": "#2e7d32", "marker-size": "medium"},
            "medium": {"marker-color": "#f9a825", "marker-size": "small"},
            "low":    {"marker-color": "#c62828", "marker-size": "small"}}
COLORS = {"hannibal": "#e0533d", "caesar": "#ff9800", "goths": "#00bcd4",
          "islam": "#4caf50", "alaric": "#9c27b0", "justinian": "#3f51b5", "migration2": "#795548"}
N = lambda s: ud.normalize("NFC", str(s)).strip()
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
        p = line.split("\t")
        if len(p) >= 3:
            g[N(p[0])] = (float(p[1]), float(p[2]))
    return g


def check(route, gaz):
    """경로 하나를 검증. 문제 목록을 돌려준다."""
    bad = []
    wps = route.get("waypoints") or []
    if not (4 <= len(wps) <= 20):
        bad.append(f"경유지 수 이상 ({len(wps)}개)")
    prev = None
    for i, w in enumerate(wps):
        nm = N(w.get("place", ""))
        try:
            lat, lon = float(w["lat"]), float(w["lon"])
        except (KeyError, TypeError, ValueError):
            bad.append(f"[{i}] {nm}: 좌표 없음/형식오류")
            continue
        if not (LAT_RANGE[0] <= lat <= LAT_RANGE[1] and LON_RANGE[0] <= lon <= LON_RANGE[1]):
            bad.append(f"[{i}] {nm}: 좌표 범위 밖 ({lat}, {lon})")
        # 플래그를 안 켰지만 이름이 사전에 있고 좌표도 맞으면 링크로 살린다
        if not w.get("in_gazetteer") and nm in gaz:
            if abs(gaz[nm][0] - lat) < 0.3 and abs(gaz[nm][1] - lon) < 0.3:
                w["in_gazetteer"] = True
        if w.get("in_gazetteer") and nm in gaz:
            glat, glon = gaz[nm]
            if abs(glat - lat) > 0.5 or abs(glon - lon) > 0.5:
                bad.append(f"[{i}] {nm}: 사전 좌표와 불일치 ({lat},{lon} vs {glat},{glon})")
        if w.get("in_gazetteer") and nm not in gaz:
            # 라틴어 표기나 다른 음차를 쓴 경우(아리미누스/리미니, 알렉시아/알레시아).
            # 좌표가 사전 항목과 일치하면 같은 지점이므로 사전 이름으로 맞춘다.
            hit = [g for g, (a, o) in gaz.items()
                   if abs(a - lat) < 0.05 and abs(o - lon) < 0.05]
            if hit:
                w["place"], w["_renamed_from"] = hit[0], nm
            else:
                w["in_gazetteer"] = False       # 좌표는 살리고 위키링크만 포기
        if w.get("confidence") not in CONF:
            bad.append(f"[{i}] {nm}: confidence 값 오류 — {w.get('confidence')}")
        y = w.get("year")
        if isinstance(y, int):
            if prev is not None and y < prev - 1:      # 1년 역행은 허용(같은 해 왕복)
                bad.append(f"[{i}] {nm}: 연도 역행 {prev} → {y}")
            prev = max(prev or y, y)
    return bad


def main(write):
    gaz = gazetteer()
    # 보조 파일(_new_places)과 영역 파일(*_kingdom, *_area)은 경로가 아니다.
    # _area를 빼지 않으면 100개 넘는 영역 파일이 매번 "경유지 0개"로 탈락하며
    # 진짜 오류를 소음에 묻는다.
    files = sorted(f for f in R.glob("*.json")
                   if not f.stem.startswith("_")
                   and not f.stem.endswith(("_kingdom", "_area")))
    ok, skipped = [], []
    for f in files:
        try:
            route = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            skipped.append((f.stem, [f"JSON 파싱 실패 {e}"]))
            continue
        bad = check(route, gaz)
        (skipped if bad else ok).append((f.stem, route if not bad else bad))

    print(f"경로 {len(files)}개 → 통과 {len(ok)} / 탈락 {len(skipped)}")
    for stem, bad in skipped:
        print(f"\n  [{stem}] 탈락")
        for b in bad[:6]:
            print("     " + b)
    for stem, r in ok:
        wps = r["waypoints"]
        c = {k: sum(1 for w in wps if w.get("confidence") == k) for k in CONF}
        g = sum(1 for w in wps if w.get("in_gazetteer"))
        print(f"  [{stem}] {r['name']} · {len(wps)}점 · 확실{c['high']}/대략{c['medium']}/불확실{c['low']} · 사전매칭 {g}")

    if not write:
        print("\n(dry-run — 미기록)")
        return

    for stem, r in ok:
        wps = r["waypoints"]
        gj = {"type": "FeatureCollection", "features": [
            {"type": "Feature",
             "properties": {"name": r["name"], "period": r.get("period", "")},
             "geometry": {"type": "LineString",
                          "coordinates": [[w["lon"], w["lat"]] for w in wps]}},
            *[{"type": "Feature",
               "properties": {"name": w["place"], "year": w.get("year"),
                              "description": f"[{CONF[w['confidence']]}] {yr(w.get('year'))} — {w.get('event','')}",
                              "confidence": w["confidence"], **PT_STYLE[w["confidence"]]},
               "geometry": {"type": "Point", "coordinates": [w["lon"], w["lat"]]}}
              for w in wps]]}
        (R / f"{stem}.geojson").write_text(
            json.dumps(gj, ensure_ascii=False, indent=1), encoding="utf-8")

    # 경로 모음 노트
    body = ["---", "created: 2026-07-29", "type: resource", "book: 로마제국쇠망사",
            "tags:", "  - topic/산스", "  - topic/편데", "up:",
            '  - "[[로마제국쇠망사_온톨로지]]"', "---", "",
            "# 로마사 주요 경로", "",
            "사료 기준으로 조사한 이동 경로를 지도에 선으로 그렸다. "
            "각 지점의 신뢰도는 표에 적었고, 학설이 갈리는 구간은 그대로 표시했다.", ""]
    for stem, r in ok:
        wps = r["waypoints"]
        clat, clon, cz = center(R / f"{stem}.geojson")
        body += [f"## {r['name']}", "",
                 f"**{r.get('period','')}** — {r.get('summary','')}", "",
                 "```leaflet",
                 f"id: route-{stem}",
                 f"geojson: [[{stem}.geojson]]",
                 f"geojsonColor: {COLORS.get(stem, '#3388ff')}",
                 f"lat: {clat:.4f}", f"long: {clon:.4f}", f"zoom: {cz}",
                 "minZoom: 2", "maxZoom: 12",
                 "height: 450px", "zoomFeatures: true", "unit: km", "```", "",
                 "| 연도 | 지점 | 일어난 일 | 신뢰도 |", "|---|---|---|---|"]
        for w in wps:
            link = f"[[{w['place']}]]" if w.get("in_gazetteer") else w["place"]
            body.append(f"| {yr(w.get('year'))} | {link} | {w.get('event','')} | "
                        f"{CONF[w['confidence']]} |")
        if r.get("sources"):
            body += ["", f"출처: {' · '.join(r['sources'])}"]
        body += [""]
    (BASE / "경로.md").write_text("\n".join(body), encoding="utf-8")
    print(f"\n기록: GeoJSON {len(ok)}개 + 경로.md")


if __name__ == "__main__":
    main(write="--write" in sys.argv)
