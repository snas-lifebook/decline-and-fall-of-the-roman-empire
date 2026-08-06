"""리서치된 왕국 영토 JSON → GeoJSON Polygon + 영토 노트.

폴리곤은 선보다 함정이 많다.
- GeoJSON은 [경도, 위도] 순서다. 뒤집히면 지도 반대편에 그려진다
- 링이 닫혀야 한다(첫 점 = 끝 점). 스크립트가 닫는다
- 자기교차하는 링은 렌더가 깨진다
어긋나면 그 부분은 기록하지 않는다.
"""
import json
import sys
import unicodedata as ud
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
R = BASE / "ontology/_routes"
# 인도·중국·스칸디나비아까지 들어오므로 로마 세계보다 넉넉히 잡는다.
LON_RANGE, LAT_RANGE = (-25.0, 140.0), (0.0, 75.0)
CONF = {"high": "확실", "medium": "대략", "low": "불확실"}
# 신뢰도를 지도 위에서 바로 읽게 한다. 확실한 영토는 진하게, 불확실한 곳은 흐리게.
STYLE = {"high":   {"fill": "#7b1fa2", "fill-opacity": 0.45, "stroke": "#4a148c", "stroke-width": 2},
         "medium": {"fill": "#ab47bc", "fill-opacity": 0.26, "stroke": "#7b1fa2", "stroke-width": 2},
         "low":    {"fill": "#ce93d8", "fill-opacity": 0.12, "stroke": "#ba68c8", "stroke-width": 1}}
N = lambda s: ud.normalize("NFC", str(s)).strip()


def gazetteer():
    g = {}
    for line in (R / "gazetteer.tsv").read_text(encoding="utf-8").splitlines()[1:]:
        p = line.split("\t")
        if len(p) >= 3:
            g[N(p[0])] = (float(p[1]), float(p[2]))
    return g


def seg_cross(a, b, c, d):
    """선분 ab와 cd가 교차하는가."""
    def ccw(p, q, r):
        return (r[1] - p[1]) * (q[0] - p[0]) > (q[1] - p[1]) * (r[0] - p[0])
    return ccw(a, c, d) != ccw(b, c, d) and ccw(a, b, c) != ccw(a, b, d)


def self_intersects(ring):
    n = len(ring)
    for i in range(n):
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue
            if seg_cross(ring[i], ring[(i+1) % n], ring[j], ring[(j+1) % n]):
                return True
    return False


def repair(ring):
    """자기교차하는 링을 중심 기준 각도순으로 다시 세운다.

    에이전트가 꼭짓점을 뒤죽박죽 적으면 링이 꼬인다. 나라 윤곽은 대체로
    별모양(중심에서 모든 변이 보이는 형태)이라 각도 정렬로 대부분 풀린다.
    그래도 안 풀리면 호출부가 그 부분을 버린다.
    """
    import math
    cx = sum(x for x, _ in ring) / len(ring)
    cy = sum(y for _, y in ring) / len(ring)
    return sorted(ring, key=lambda p: math.atan2(p[1] - cy, p[0] - cx))


def repair_strip(ring):
    """길쭉한 띠(해안선 등)를 주축 기준으로 다시 세운다.

    북아프리카 해안처럼 가늘고 긴 영역은 별모양이 아니라 각도 정렬이 안 통한다.
    가장 긴 방향으로 투영해 정렬한 뒤, 그 축 위/아래를 갈라 위쪽은 정방향
    아래쪽은 역방향으로 이으면 꼬이지 않는 띠가 된다.
    """
    import math
    n = len(ring)
    cx = sum(x for x, _ in ring) / n
    cy = sum(y for _, y in ring) / n
    # 주축 각도 (2차 모멘트)
    sxx = sum((x-cx)**2 for x, _ in ring)
    syy = sum((y-cy)**2 for _, y in ring)
    sxy = sum((x-cx)*(y-cy) for x, y in ring)
    th = 0.5 * math.atan2(2*sxy, sxx - syy)
    c, s_ = math.cos(th), math.sin(th)
    proj = [((x-cx)*c + (y-cy)*s_, -(x-cx)*s_ + (y-cy)*c, (x, y)) for x, y in ring]
    up = sorted([p for p in proj if p[1] >= 0], key=lambda p: p[0])
    dn = sorted([p for p in proj if p[1] < 0], key=lambda p: -p[0])
    return [p[2] for p in up + dn]


def check_part(p, i):
    bad = []
    ring = p.get("ring") or []
    if not (3 <= len(ring) <= 60):
        bad.append(f"[{i}] {p.get('part')}: 꼭짓점 수 이상 ({len(ring)}개)")
        return bad
    for j, pt in enumerate(ring):
        if not (isinstance(pt, list) and len(pt) == 2):
            bad.append(f"[{i}] {p.get('part')}: {j}번 좌표 형식 오류")
            return bad
        lon, lat = pt
        # 순서가 뒤집혔는지 판정 — 위도는 절대 90을 넘지 않는다
        if abs(lat) > 90:
            bad.append(f"[{i}] {p.get('part')}: {j}번 좌표 [경도,위도] 순서 뒤집힘 의심 {pt}")
            return bad
        if not (LON_RANGE[0] <= lon <= LON_RANGE[1] and LAT_RANGE[0] <= lat <= LAT_RANGE[1]):
            bad.append(f"[{i}] {p.get('part')}: {j}번 좌표 범위 밖 {pt}")
    if p.get("confidence") not in CONF:
        bad.append(f"[{i}] {p.get('part')}: confidence 값 오류")
    if not bad and self_intersects(ring):
        for fn, how in ((repair, "각도정렬"), (repair_strip, "주축정렬")):
            fixed = fn(ring)
            if not self_intersects(fixed):
                p["ring"], p["_repaired"] = fixed, how
                break
        else:
            bad.append(f"[{i}] {p.get('part')}: 링이 자기교차한다 (복구 실패)")
    return bad


def main(write):
    gaz = gazetteer()
    # _kingdom = 왕국 판도, _area = 속주·바다·섬·민족 분포. 처리는 같다.
    files = sorted(R.glob("*_kingdom.json")) + sorted(R.glob("*_area.json"))
    if not files:
        print("영토 JSON 없음 (*_kingdom.json, *_area.json)")
        return

    for f in files:
        d = json.loads(f.read_text(encoding="utf-8"))
        parts, bad_all = [], []
        for i, p in enumerate(d.get("territory") or []):
            bad = check_part(p, i)
            (bad_all.extend(bad) if bad else parts.append(p))
        cities = []
        for c in d.get("cities") or []:
            nm = N(c.get("place", ""))
            try:
                lat, lon = float(c["lat"]), float(c["lon"])
            except (KeyError, TypeError, ValueError):
                bad_all.append(f"도시 {nm}: 좌표 오류"); continue
            # 플래그를 믿지 않고 이름·좌표로 다시 맞춘다. 에이전트가 in_gazetteer를
            # 안 켰거나 다른 표기(키르타/누미디아)를 쓴 경우를 모두 잡기 위함.
            if nm in gaz and abs(gaz[nm][0]-lat) < 0.3 and abs(gaz[nm][1]-lon) < 0.3:
                c["in_gazetteer"] = True
            elif nm not in gaz:
                hit = [g for g, (a, o) in gaz.items()
                       if abs(a - lat) < 0.05 and abs(o - lon) < 0.05]
                if hit:
                    c["place"], c["in_gazetteer"] = hit[0], True
                else:
                    c["in_gazetteer"] = False
            cities.append(c)

        vtx = sum(len(p["ring"]) for p in parts)
        g = sum(1 for c in cities if c.get("in_gazetteer"))
        print(f"[{f.stem}] {d['name']} · 영토 {len(parts)}부분(꼭짓점 {vtx}) · "
              f"도시 {len(cities)}개(사전매칭 {g})")
        for b in bad_all[:8]:
            print("   탈락: " + b)
        if not write or not parts:
            continue

        gj = {"type": "FeatureCollection", "features": [
            {"type": "Feature",
             "properties": {"name": f"{d['name']} — {p['part']}",
                            "description": f"[{CONF[p['confidence']]}] {p.get('note','')}",
                            "confidence": p["confidence"], **STYLE[p["confidence"]]},
             "geometry": {"type": "Polygon",
                          "coordinates": [[*[list(x) for x in p["ring"]], list(p["ring"][0])]]}}
            for p in parts] + [
            {"type": "Feature",
             "properties": {"name": c["place"],
                            "description": f"[{c.get('role','')}] {c.get('year','')} — {c.get('event','')}",
                            "marker-color": "#4a148c", "marker-size": "medium"},
             "geometry": {"type": "Point", "coordinates": [c["lon"], c["lat"]]}}
            for c in cities]}
        (R / f"{f.stem}.geojson").write_text(
            json.dumps(gj, ensure_ascii=False, indent=1), encoding="utf-8")

        # 별도 노트를 만들지 않는다. 같은 이름의 객체 노트와 충돌하기 때문 —
        # 영토 내용은 rome30_backlink.py가 객체 노트에 직접 심는다.
        print(f"   기록: {f.stem}.geojson (노트는 backlink가 담당)")


if __name__ == "__main__":
    main(write="--write" in sys.argv)
