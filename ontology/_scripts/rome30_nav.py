"""points/ 를 한 권의 책처럼 읽게 만든다 — 목차 노트 1개 + 각 노트의 이전/다음 띠.

읽기 순서는 파일명 정렬이 곧 책 순서가 되도록 잡혀 있다.
    00_일러두기 → 00_책머리에 → 01..30 → 99_옮기고_나서
목차 노트(00_목차)는 이 사슬에서 빠지고 모든 띠의 가운데에 놓인다.

띠는 목차 링크가 든 한 줄이다. 다시 돌리면 그 줄만 통째로 갈아끼우므로
멱등이고, rome30_link.py 도 이 줄은 건드리지 않는다(거기 NAV 보존 코드 있음).

실행 순서: link → 이 스크립트. 링크를 다시 걸었으면 이것도 다시 돌린다.
"""
import re
import sys
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
POINTS = BASE / "points"
TOC_NOTE = "00_목차"
# 띠는 표시 없이 산다. HTML 주석은 읽기 뷰에서만 숨고 편집 모드에서는 그대로 보여서
# 결국 눈에 밟히는 군더더기였다. 대신 목차 링크가 든 줄을 띠로 식별한다 —
# points/ 안에서 이 링크를 본문에 쓸 일은 없고, 있으면 그 줄이 곧 띠다.
NAV = re.compile(r"^.*\[\[" + TOC_NOTE + r"\|목차\]\].*$\n*", re.M)

# 30개 포인트 이외의 부속물. 목차에서 본문과 갈라 보여준다.
FRONT = ("00_일러두기", "00_책머리에")
BACK = ("99_옮기고_나서",)
# 부속물의 책 쪽수. 본문 30포인트의 쪽수는 rome30_split.py의 TOC가 정본이다.
PAGE = {"00_일러두기": 4, "00_책머리에": 6, "99_옮기고_나서": 317}

label = lambda stem: stem.split("_", 1)[1].replace("_", " ")


def chain():
    """파일명 정렬 = 책 순서. 목차 노트는 사슬에서 뺀다."""
    return [p for p in sorted(POINTS.glob("*.md")) if p.stem != TOC_NOTE]


def bar(files, i):
    n_body = sum(1 for p in files if p.stem[:2].isdigit() and p.stem[:2] not in ("00", "99"))
    here = files[i].stem
    pos = f"{int(here[:2])} / {n_body}" if here[:2].isdigit() and here not in FRONT + BACK else ""
    cells = []
    if i > 0:
        prev = files[i - 1].stem
        cells.append(f"[[{prev}|← {label(prev)}]]")
    cells.append(f"[[{TOC_NOTE}|목차]]" + (f" · {pos}" if pos else ""))
    if i < len(files) - 1:
        nxt = files[i + 1].stem
        cells.append(f"[[{nxt}|{label(nxt)} →]]")
    return "  ·  ".join(cells)


def apply_nav(files, write):
    for i, p in enumerate(files):
        lines = NAV.sub("", p.read_text(encoding="utf-8")).split("\n")
        h1 = next((k for k, l in enumerate(lines) if l.startswith("# ")), None)
        assert h1 is not None, f"{p.name}: H1 제목이 없다"
        b = bar(files, i)
        # 위: 제목 바로 아래 — 지금 어디인지 먼저 보인다
        # 아래: 본문 끝 — 다 읽고 바로 다음으로 넘어간다
        head = "\n".join(lines[:h1 + 1])
        rest = "\n".join(lines[h1 + 1:]).strip("\n")
        text = head + "\n\n" + b + "\n\n" + rest + "\n\n" + b + "\n"
        print(f"  {p.name}")
        if write:
            p.write_text(text, encoding="utf-8")


def toc_note(files, write):
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "split", Path(__file__).parent / "rome30_split.py")
    split = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(split)

    stem_of = {}
    for p in files:
        if p.stem[:2].isdigit() and p.stem not in FRONT + BACK:
            stem_of[int(p.stem[:2])] = p.stem

    out = [
        "---", "created: 2026-07-30", "type: moc", "book: 로마제국쇠망사",
        "tags:", "  - topic/산스", "  - topic/편데", "  - type/moc",
        "up:", '  - "[[로마제국쇠망사_온톨로지]]"', "---", "",
        "# 로마제국쇠망사 목차", "",
        "『30포인트로 읽어내는 로마 제국 쇠망사』(에드워드 기번 지음, 가나모리 시게나리 편역, "
        "한은미 옮김, 북프렌즈)의 차례 그대로다. 포인트 제목은 질문이고, 그 아래가 답이다. "
        "아무 줄이나 눌러 그 대목으로 바로 들어간다. 데이터로 들어가려면 "
        "[[로마제국쇠망사_온톨로지]] 쪽이다.", "",
        "끝의 숫자는 **종이책 쪽수**다. 책을 펴 놓고 같은 자리를 찾을 수 있다.", "",
        "### 여는 글", "",
    ]
    out += [f"- [[{s}|{label(s)}]] · {PAGE[s]}"
            for s in FRONT if (POINTS / f"{s}.md").exists()]
    out += ["", "### 본문 30포인트", ""]
    for i, (page, title, subtitle, subs) in enumerate(split.TOC, 1):
        stem = stem_of.get(i)
        out.append(f"**{i:02d}** [[{stem}|{subtitle}]] — {title} · {page}" if stem
                   else f"**{i:02d}** {subtitle} · {page}")
        out += [f"- {s.split('|')[0]} · {s.split('|')[1]}" for s in subs]
        out.append("")
    out += ["### 닫는 글", ""]
    out += [f"- [[{s}|{label(s)}]] · {PAGE[s]}"
            for s in BACK if (POINTS / f"{s}.md").exists()]
    out += ["", "연표는 `ontology/chronology.csv`, 기번 영문 원전 71장은 `source/` 에 있다.", ""]

    dest = POINTS / f"{TOC_NOTE}.md"
    print(f"  {dest.name}  ({len(split.TOC)}포인트)")
    if write:
        dest.write_text("\n".join(out), encoding="utf-8")


def main(write):
    files = chain()
    assert len(files) >= 30, f"points/ 노트가 {len(files)}개뿐이다 — 부속물 md 생성이 먼저다"
    print(f"읽기 사슬 {len(files)}개:")
    apply_nav(files, write)
    print("목차:")
    toc_note(files, write)
    print("\n완료" if write else "\n(dry-run — 미기록)")


if __name__ == "__main__":
    main(write="--write" in sys.argv)
