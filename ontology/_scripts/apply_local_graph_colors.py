"""로컬 그래프 색 그룹 주입.

옵시디언이 켜져 있을 때는 이 스크립트 대신 `obsidian eval`로
`leaf.view.engine.setOptions()`를 호출하는 것이 정석이다 (workspace.json을
앱이 살아있는 채로 건드리지 않는다).

전역 그래프(.obsidian/graph.json)와 로컬 그래프(workspace.json 안의 localgraph 리프)는
색 그룹 설정을 공유하지 않는다. 전역만 설정하면 로컬은 여전히 무채색이다.

workspace.json은 옵시디언이 실행 중에 소유하는 라이브 상태다. 앱이 켜진 채 쓰면
다음 저장 때 덮어써진다. **반드시 옵시디언을 완전히 종료한 뒤 실행할 것.**

    python3 apply_local_graph_colors.py          # 현재 상태 확인만
    python3 apply_local_graph_colors.py --write  # 주입
"""
import json
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

VAULT = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
             "River's Second Brain")
OBS = VAULT / ".obsidian"


def obsidian_running():
    try:
        out = subprocess.run(["pgrep", "-f", "Obsidian.app/Contents/MacOS/Obsidian"],
                             capture_output=True, text=True)
        return out.returncode == 0
    except Exception:
        return False


def leaves(node, acc):
    if isinstance(node, dict):
        s = node.get("state", {})
        if node.get("type") == "leaf" and s.get("type") == "localgraph":
            state_dict = s.setdefault("state", {})
            options_dict = state_dict.setdefault("options", {})
            acc.append((state_dict, options_dict))
        for v in node.values():
            leaves(v, acc)
    elif isinstance(node, list):
        for v in node:
            leaves(v, acc)
    return acc


def main(write):
    g = json.loads((OBS / "graph.json").read_text(encoding="utf-8"))
    groups = [x for x in g.get("colorGroups", [])
              if x.get("query", "").startswith("tag:#entity/")
              or "로마제국쇠망사" in x.get("query", "")]
    if not groups:
        print("전역 graph.json에 로마 색 그룹이 없다. 먼저 그쪽을 설정할 것.")
        return

    wpath = OBS / "workspace.json"
    w = json.loads(wpath.read_text(encoding="utf-8"))
    leaves_list = leaves(w, [])
    print(f"전역 색 그룹 {len(groups)}개 / 로컬 그래프 리프 {len(leaves_list)}개")
    for state_dict, options_dict in leaves_list:
        print(f"   현재 색 그룹 {len(options_dict.get('colorGroups', []))}개")

    if not leaves_list:
        print("\n로컬 그래프 리프가 없다. 옵시디언에서 로컬 그래프를 한 번 열어 두고 다시 실행할 것.")
        return
    if not write:
        print("\n(확인만 — 주입하려면 --write)")
        return
    if obsidian_running():
        print("\n!! 옵시디언이 실행 중이다. 종료한 뒤 다시 실행할 것 — 지금 쓰면 덮어써진다.")
        sys.exit(1)

    # 대상 파일 존재 확인 (macOS NFD 처리)
    TARGET = "Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/Books/로마제국쇠망사/로마제국쇠망사_온톨로지.md"
    target_path = VAULT / TARGET
    target_path_nfc = Path(unicodedata.normalize("NFC", str(target_path)))
    if not target_path_nfc.exists():
        print(f"\n!! 대상 파일을 찾을 수 없다: {target_path_nfc}")
        sys.exit(1)

    shutil.copy(wpath, wpath.with_suffix(".json.bak"))
    for state_dict, options_dict in leaves_list:
        state_dict["file"] = unicodedata.normalize("NFC", TARGET)
        options_dict["colorGroups"] = groups
        options_dict["localJumps"] = 2
        options_dict["localBacklinks"] = True
        options_dict["localForelinks"] = True
        options_dict["localInterlinks"] = True
        options_dict["showArrow"] = True
        options_dict["showTags"] = False
        options_dict["showAttachments"] = False
        options_dict["hideUnresolved"] = True
        options_dict["textFadeMultiplier"] = -0.3
        options_dict["nodeSizeMultiplier"] = 1.6
        options_dict["lineSizeMultiplier"] = 2.2
        options_dict["scale"] = 1
        options_dict["collapse-color-groups"] = False
    wpath.write_text(json.dumps(w, ensure_ascii=False), encoding="utf-8")
    print(f"\n로컬 그래프 {len(leaves_list)}개에 색 그룹 {len(groups)}개 주입. 옵시디언을 켜면 반영된다.")
    print(f"백업: {wpath.with_suffix('.json.bak')}")


if __name__ == "__main__":
    main(write="--write" in sys.argv)
