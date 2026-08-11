"""리서치된 지명 좌표를 지명 노트에 심고 지도·이동 통계를 붙인다.

이동 일수는 직선거리 기반 추정이다. 실제 로마 가도는 지형을 따라 돌아가므로
직선거리에 1.3배 우회 계수를 곱했고, 그래도 어림이다. 노트에 가정을 명시한다.
"""
import json
import math
import re
import sys
import unicodedata as ud
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
GEO, NOTES = BASE / "ontology/_geo", BASE / "entities"
VAULT_REL = ("Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/Books/로마제국쇠망사/entities")

ROME = (41.8931, 12.4828)
DETOUR = 1.3          # 직선거리 → 실제 가도 거리 보정
WALK_KMD = 30         # 로마 군단 정규 행군(iter iustum) 하루 약 20로마마일
HORSE_KMD = 60        # 개인 기마 지속 이동
RELAY_KMD = 75        # 국영 역참(cursus publicus) 릴레이
SEA_KMD = 120         # 순풍 시 지중해 항해

# 로마 세계가 실제로 걸치는 범위. 이 밖은 리서치 오류로 본다.
# 북위 상한은 스칸디나비아(고트족 기원지)까지 포함해야 한다.
LON_RANGE, LAT_RANGE = (-12.0, 125.0), (5.0, 71.0)
KIND_KO = {"city": "도시", "region": "지역", "river": "강", "sea": "바다",
           "mountain": "산맥", "island": "섬", "building": "건축물", "battlefield": "전장"}
CONF_KO = {"high": "확실", "medium": "대표점", "low": "추정"}
MARKER = "### 위치"

N = lambda s: ud.normalize("NFC", str(s))


def haversine(a, b):
    R = 6371.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def load_places():
    rows, seen, bad = {}, set(), []
    for f in sorted(GEO.glob("places_*.jsonl")):
        for ln, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line:
                continue
            try:
                p = json.loads(line)
            except json.JSONDecodeError as e:
                bad.append(f"{f.name}:{ln} JSON 실패 {e}")
                continue
            name = N(p.get("name", ""))
            if not name:
                bad.append(f"{f.name}:{ln} name 없음")
                continue
            if name in seen:
                bad.append(f"{f.name}:{ln} 중복 {name}")
                continue
            try:
                lat, lon = float(p["lat"]), float(p["lon"])
            except (KeyError, TypeError, ValueError):
                bad.append(f"{f.name}:{ln} 좌표 없음/형식오류 — {name}")
                continue
            if not (LAT_RANGE[0] <= lat <= LAT_RANGE[1] and LON_RANGE[0] <= lon <= LON_RANGE[1]):
                bad.append(f"{f.name}:{ln} 범위 밖 {name} ({lat}, {lon})")
                continue
            if p.get("confidence") not in CONF_KO:
                bad.append(f"{f.name}:{ln} confidence 값 오류 {name} — {p.get('confidence')}")
                continue
            seen.add(name)
            rows[name] = {**p, "name": name, "lat": lat, "lon": lon}
    return rows, bad


def block(name, p, ents):
    """지명 노트에 붙일 '### 위치' 절."""
    d = haversine(ROME, (p["lat"], p["lon"]))
    road = d * DETOUR
    lines = [MARKER, ""]

    meta = [f"**{KIND_KO.get(p.get('kind'), '미상')}**"]
    if p.get("modern"):
        meta.append(f"현재 {p['modern']}")
    if p.get("ancient"):
        meta.append(f"고대 표기 *{p['ancient']}*")
    lines += [" · ".join(meta), ""]

    if p["confidence"] == "low":
        lines += ["> [!warning] 위치 추정",
                  "> 고대 지명이라 비정이 확실하지 않다. 지도 위치를 그대로 믿지 말 것.",
                  f"> 근거: {p.get('source', '미확인')}", ""]

    lines += [f"```leaflet",
              f"id: place-{re.sub(r'[^0-9A-Za-z가-힣]', '', name)}",
              f"lat: {p['lat']}", f"long: {p['lon']}",
              "height: 320px", "zoom: 6", "minZoom: 3", "maxZoom: 12",
              # marker: 종류,위도,경도,링크,설명 — 링크 자리를 비우면 클릭 시 null.path로 터진다
              f"marker: default,{p['lat']},{p['lon']},[[{ents[name]['note']}]],{name}",
              "```", ""]

    if d < 1:   # 로마 자신
        lines += ["로마 자신이므로 이동 거리는 없다.", ""]
    else:
        lines += ["| 로마에서 | |", "|---|---|",
                  f"| 직선거리 | {d:,.0f} km |",
                  f"| 가도 추정 | {road:,.0f} km |",
                  f"| 도보 행군 | 약 {road / WALK_KMD:,.0f}일 (하루 {WALK_KMD}km) |",
                  f"| 기마 | 약 {road / HORSE_KMD:,.0f}일 (하루 {HORSE_KMD}km) |",
                  f"| 역참 릴레이 | 약 {road / RELAY_KMD:,.0f}일 (하루 {RELAY_KMD}km) |",
                  f"| 해로 | 약 {d / SEA_KMD:,.0f}일 (순풍 하루 {SEA_KMD}km, 직선 기준) |", "",
                  "이동 일수는 직선거리에 우회 계수 1.3을 곱한 어림이다. 실제 로마 가도는 "
                  "지형과 노선에 따라 더 길어지고, 계절·보급·적정에 따라 크게 달라진다. "
                  "바다 건너 목적지는 육로 수치가 성립하지 않으니 해로 쪽을 볼 것.", ""]
    if p.get("source"):
        lines += [f"좌표 출처: {p['source']} (신뢰도 {CONF_KO[p['confidence']]})", ""]
    return "\n".join(lines).rstrip() + "\n"


def main(write):
    places, bad = load_places()
    ents = {N(e["name"]): e for e in
            (json.loads(l) for l in (BASE / "ontology/entities.jsonl").open(encoding="utf-8"))
            if e["type"] == "place"}

    missing = sorted(set(ents) - set(places))
    unknown = sorted(set(places) - set(ents))
    conf = {k: sum(1 for p in places.values() if p["confidence"] == k) for k in CONF_KO}

    print(f"좌표 {len(places)}/{len(ents)}개  (확실 {conf['high']} / 대표점 {conf['medium']} / 추정 {conf['low']})")
    if bad:
        print(f"\n검증 탈락 {len(bad)}건:")
        for b in bad[:15]:
            print("   " + b)
    if unknown:
        print(f"\n객체에 없는 이름 {len(unknown)}건: {unknown[:10]}")
    if missing:
        print(f"\n좌표 못 받은 지명 {len(missing)}건: {missing[:15]}")

    if not write:
        print("\n(dry-run — 미기록)")
        return

    n = 0
    for name, p in places.items():
        e = ents.get(name)
        if not e:
            continue
        f = NOTES / e["type"] / f"{e['note']}.md"
        if not f.exists():
            continue
        t = f.read_text(encoding="utf-8")
        head, body = t.split("\n---\n", 1)
        body = body.split(MARKER)[0].rstrip()      # 기존 위치 절 제거 → 멱등

        # 프론트매터에 좌표 심기. Leaflet은 location 배열을 읽는다.
        head = re.sub(r"\n(location|modern|ancient|place_kind|coord_confidence|"
                      r"dist_from_rome_km|mapmarker):.*", "", head)
        d = haversine(ROME, (p["lat"], p["lon"]))
        add = [f"location: [{p['lat']}, {p['lon']}]",
               f"mapmarker: {p.get('kind', 'default')}",
               f"place_kind: {p.get('kind', '')}",
               f"coord_confidence: {p['confidence']}",
               f"dist_from_rome_km: {round(d)}"]
        if p.get("modern"):
            add.append(f'modern: "{p["modern"]}"')
        if p.get("ancient"):
            add.append(f'ancient: "{p["ancient"]}"')
        head = head.replace("\nbook: 로마제국쇠망사", "\nbook: 로마제국쇠망사\n" + "\n".join(add), 1)

        f.write_text(head + "\n---\n" + body + "\n\n" + block(name, p, ents), encoding="utf-8")
        n += 1
    print(f"\n지명 노트 {n}개에 좌표·지도·이동표 기록")


if __name__ == "__main__":
    main(write="--write" in sys.argv)
