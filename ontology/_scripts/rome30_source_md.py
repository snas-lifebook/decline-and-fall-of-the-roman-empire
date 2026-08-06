"""source/*.txt (Gutenberg 기번 원전) → 마크다운. 텍스트 무손실.

하드랩(강제 줄바꿈)을 문단으로 되붙이되, 줄바꿈이 의미를 갖는 덩어리는 그대로 둔다:
- 본문보다 깊게 들여쓴 줄  → 운문·인용 (밀턴 인용, 그리스 시행 등)
- 줄이 유독 짧은 덩어리    → 목차·표제 (00_서문의 Complete Contents)

검증은 토큰 단위로 한다. 마크다운 문법을 걷어내고 공백을 정규화했을 때
원본과 낱말 하나까지 같아야 하며, 다르면 그 파일은 기록하지 않는다.
"""
import re
import sys
from collections import Counter
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사/source")

CHAPTER_RE = re.compile(r"^\s*Chapter\s+([IVXLCDM]+):")
FOOTNOTE_RE = re.compile(r"^\d+ \(return\)")
tokens = lambda s: re.sub(r"\s+", " ", s).strip().split(" ")


def blocks(lines):
    """빈 줄로 갈라 연속된 줄 덩어리로 묶는다."""
    out, cur = [], []
    for l in lines:
        if l.strip():
            cur.append(l.rstrip())
        elif cur:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def convert(text):
    lines = text.split("\n")
    body = [l for l in lines if l.strip()]
    base_indent = Counter(len(l) - len(l.lstrip()) for l in body).most_common(1)[0][0]
    widths = sorted(len(l.rstrip()) for l in body)
    wrap = widths[int(len(widths) * 0.9)]          # 이 파일의 통상 줄 너비

    md, first, depth = [], True, 0
    for blk in blocks(lines):
        indents = [len(l) - len(l.lstrip()) for l in blk]
        stripped = [l.strip() for l in blk]

        if first and CHAPTER_RE.match(blk[0]):
            md.append("# " + " ".join(stripped))
            first = False
            continue

        # 각주는 본문 참조 마커 없이 서사 한복판에 통째로 박혀 있다(72파일 8,529개).
        # 순서는 그대로 두고 인용 블록으로 시각 구분만 한다. 여러 덩어리에 걸치므로
        # 대괄호 균형으로 끝을 잡는다.
        opening = depth == 0 and FOOTNOTE_RE.match(stripped[0])
        if depth or opening:
            joined = "\n".join(stripped)
            depth += joined.count("[") - joined.count("]")
            md.append("\n".join("> " + s for s in stripped))
            first = False
            continue

        # 줄바꿈을 지켜야 하는 덩어리: 더 깊이 들여쓴 운문, 또는 유독 짧은 줄들(목차)
        deeper = min(indents) > base_indent + 2
        short = len(blk) > 1 and sum(len(s) for s in stripped) / len(blk) < wrap * 0.62
        if deeper:
            md.append("\n".join("> " + s for s in stripped))
        elif short:
            md.append("\n".join(stripped))
        else:
            md.append(" ".join(stripped))
        first = False
    return "\n\n".join(md) + "\n"


def unmark(md):
    """마크다운 문법을 걷어내 원문 토큰만 남긴다."""
    prev = None
    while md != prev:          # 중첩 인용(각주 안의 운문)까지 벗긴다
        prev, md = md, re.sub(r"^[>#]\s?", "", md, flags=re.M)
    return md


def main(write):
    ok = fail = 0
    for src in sorted(BASE.glob("*.txt")):
        raw = src.read_text(encoding="utf-8")
        md = convert(raw)
        if tokens(unmark(md)) != tokens(raw):
            fail += 1
            a, b = tokens(unmark(md)), tokens(raw)
            i = next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
            print(f"  !! {src.name} 토큰 불일치 ({len(a)} vs {len(b)}) 첫 차이 #{i}: "
                  f"{a[i-2:i+3]} vs {b[i-2:i+3]}")
            continue
        ok += 1
        if write:
            n = int(src.stem[:2])
            fm = ["---", "created: 2026-07-28", "type: resource",
                  f"chapter: {n}", "book: 로마제국쇠망사", "source: Project Gutenberg #25717",
                  "lang: en", "tags:", "  - topic/산스", "  - topic/편데",
                  "up:", '  - "[[로마제국쇠망사_온톨로지]]"', "---", ""]
            (BASE / f"{src.stem}.md").write_text("\n".join(fm) + md, encoding="utf-8")
    print(f"\n무손실 검증 통과 {ok}개, 실패 {fail}개" + ("" if write else "  (dry-run — 미기록)"))


if __name__ == "__main__":
    main(write="--write" in sys.argv)
