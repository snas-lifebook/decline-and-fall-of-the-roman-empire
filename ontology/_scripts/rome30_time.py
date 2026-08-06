"""리서치된 연도를 links.jsonl에 병합한다.

이게 붙어야 "BC 29년에 이 인물이 누구와 어떤 관계였나"를 물을 수 있다.
콘스탄티누스와 리키니우스처럼 동맹이었다가 적이 된 관계도 순서가 생긴다.
"""
import json
import re
import sys
import unicodedata as ud
from collections import Counter
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
TIME, ONTO = BASE / "ontology/_time", BASE / "ontology"

REL_KO = {"child_of": "자녀", "succeeded": "계승", "allied_with": "동맹", "opposed": "적대",
          "participated_in": "참전·관여", "occurred_at": "발생지", "ruled": "통치",
          "member_of": "소속", "married": "혼인", "conquered": "정복", "created": "세움·지음"}
KO_REL = {v: k for k, v in REL_KO.items()}
BASIS = {"text", "chronology", "inferred"}
YEAR_RANGE = (-800, 1500)      # 로마 건국 이전 ~ 콘스탄티노플 함락 이후

N = lambda s: ud.normalize("NFC", str(s)).strip()
key = lambda p, f, r, t: (p, N(f), N(r), N(t))


def main(write):
    ents = {e["id"]: e for e in
            (json.loads(l) for l in (ONTO / "entities.jsonl").open(encoding="utf-8"))}
    links = [json.loads(l) for l in (ONTO / "links.jsonl").open(encoding="utf-8")]
    # 링크를 (포인트, from이름, 관계한글, to이름)으로 색인
    idx = {}
    for i, l in enumerate(links):
        idx[key(l["point"], ents[l["from"]]["name"], REL_KO[l["rel"]], ents[l["to"]]["name"])] = i

    matched, bad, basis_c = {}, [], Counter()
    for f in sorted(TIME.glob("years_*.jsonl")):
        for ln, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError as e:
                bad.append(f"{f.name}:{ln} JSON 실패 {e}")
                continue
            k = key(r.get("point"), r.get("from"), r.get("rel"), r.get("to"))
            if k not in idx:
                bad.append(f"{f.name}:{ln} 링크 불일치 — {k[1]} -{k[2]}-> {k[3]} (p{k[0]})")
                continue
            fy, ty = r.get("from_year"), r.get("to_year")
            if not isinstance(fy, int):
                bad.append(f"{f.name}:{ln} from_year 누락/형식 — {k[1]} -{k[2]}-> {k[3]}")
                continue
            if ty is not None and not isinstance(ty, int):
                ty = None
            if not (YEAR_RANGE[0] <= fy <= YEAR_RANGE[1]) or \
               (ty is not None and not (YEAR_RANGE[0] <= ty <= YEAR_RANGE[1])):
                bad.append(f"{f.name}:{ln} 연도 범위 밖 {fy}~{ty} — {k[1]} -{k[2]}-> {k[3]}")
                continue
            if ty is not None and ty < fy:
                fy, ty = ty, fy          # 뒤집힌 구간은 바로잡는다
            b = r.get("basis") if r.get("basis") in BASIS else "inferred"
            if k in matched and matched[k][2] == "text" and b != "text":
                continue                 # 본문 근거가 우선
            matched[k] = (fy, ty, b)

    for k, (fy, ty, b) in matched.items():
        l = links[idx[k]]
        l["from_year"], l["to_year"], l["year_basis"] = fy, ty, b
        basis_c[b] += 1

    print(f"링크 {len(links)}개 중 연도 부여 {len(matched)}개 ({len(matched)/len(links)*100:.0f}%)")
    print("근거:", dict(basis_c))
    if bad:
        print(f"\n탈락 {len(bad)}건 (상위 10):")
        for x in bad[:10]:
            print("   " + x)
    if not write:
        print("\n(dry-run — 미기록)")
        return
    (ONTO / "links.jsonl").write_text(
        "\n".join(json.dumps(l, ensure_ascii=False) for l in links) + "\n", encoding="utf-8")
    print(f"\n기록 완료: links.jsonl")


if __name__ == "__main__":
    main(write="--write" in sys.argv)
