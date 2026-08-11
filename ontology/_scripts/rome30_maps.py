"""인물·집단 노트에 '그 대상이 얽힌 지명만' 뜨는 지도를 넣는다.

Leaflet의 linksFrom은 지정 노트가 링크하는 문서들에서 마커를 끌어온다.
지명 노트에 location 프론트매터가 있으므로, 별도 좌표 지정 없이 온톨로지가
지도를 필터링하는 구조가 된다.

실행 순서: rome30_merge.py → rome30_geo.py → 이 스크립트
"""
import json, re, sys, unicodedata as ud
from collections import defaultdict
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
NOTES = BASE / "entities"
MARKER = "### 관련 지도"
MIN_PLACES = 2          # 지명이 하나뿐이면 지도가 의미 없다
TARGET = {"person", "group", "event", "period"}

def main(write):
    ents = {e["id"]: e for e in
            (json.loads(l) for l in (BASE/"ontology/entities.jsonl").open(encoding="utf-8"))}
    links = [json.loads(l) for l in (BASE/"ontology/links.jsonl").open(encoding="utf-8")]
    places = defaultdict(set)
    for l in links:
        for a, b in ((l["from"], l["to"]), (l["to"], l["from"])):
            if ents[a]["type"] in TARGET and ents[b]["type"] == "place":
                places[a].add(b)

    targets = {i: p for i, p in places.items() if len(p) >= MIN_PLACES}
    by_type = defaultdict(int)
    for i in targets: by_type[ents[i]["type"]] += 1
    print(f"지도 대상 {len(targets)}개  {dict(by_type)}")

    if not write:
        print("(dry-run — 미기록)"); return

    n = 0
    for i, ps in targets.items():
        e = ents[i]
        f = NOTES / e["type"] / f"{e['note']}.md"
        if not f.exists(): continue
        t = f.read_text(encoding="utf-8")
        head, body = t.split("\n---\n", 1)
        body = body.split(MARKER)[0].rstrip()          # 멱등
        blk = [MARKER, "",
               f"{e['name']}이(가) 얽힌 지명 {len(ps)}곳. 마커를 누르면 그 지명 노트로 간다.", "",
               "```leaflet",
               f"id: rel-{re.sub(r'[^0-9A-Za-z가-힣]', '', e['note'])}",
               f"linksFrom: [[{e['note']}]]",
               "height: 380px", "zoom: 4", "minZoom: 2", "maxZoom: 12", "unit: km",
               "```", ""]
        f.write_text(head + "\n---\n" + body + "\n\n" + "\n".join(blk), encoding="utf-8")
        n += 1
    print(f"노트 {n}개에 관련 지도 삽입")

if __name__ == "__main__":
    main(write="--write" in sys.argv)
