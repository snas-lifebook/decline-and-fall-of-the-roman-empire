"""links.jsonl의 혈연·혼인·계승 관계 → 가문별 족보 노트(Mermaid).

손으로 그리지 않는다. 온톨로지가 정본이고 족보는 그 파생물이다. 관계가 고쳐지면
다시 돌려서 족보가 따라오게 한다 — 캔버스나 엑스칼리드로 그리면 그 순간 데이터와
갈라져 다시는 안 맞는다.

플러그인에 기대지 않는다. Mermaid는 옵시디언 코어라 모바일·PDF 내보내기·HTML
내보내기에서 전부 살아 있다. 이 볼트에 가계도 플러그인은 설치돼 있지 않다.

**추출된 관계에는 오류가 있다.** 포인트마다 따로 돌린 결과라 방향이 뒤집히거나
(콘스탄티누스 ↔ 콘스탄티우스 1세가 양방향으로 다 들어 있다) 관계 자체가 틀린 것이
(도미티아누스는 티투스의 아들이 아니라 동생) 섞여 있다. 아래 DROP·ADD·FIX 표가
사람이 대조해 고친 목록이고, 여기 없는 관계는 아직 검증되지 않았다는 뜻이다.
검증 안 된 가문은 노트에 그렇다고 표시된다.
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

BASE = Path("/Users/river/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
            "River's Second Brain/Efforts/Notes/산업스터디/Projects/인생책_읽기_편데/"
            "Books/로마제국쇠망사")
OUT = BASE / "family"

# 사람이 대조해 버린 관계. (자식, 부모) 표기이며 근거를 옆에 적는다.
DROP = {
    ("옥타비아", "아우구스투스"): "누나다. 부녀가 아니다",
    ("도미티아누스", "티투스"): "형제다. 둘 다 베스파시아누스의 아들",
    ("한니발", "하스드루발"): "아버지는 하밀카르 바르카스. 하스드루발은 매형",
    ("안쿠스 마르키우스", "카이사르"): "600년 앞선 왕이다. 카이사르가 주장한 시조",
    ("가이우스 마리우스", "카이사르"): "카이사르의 고모부. 혈연이 반대 방향이고 부자도 아니다",
    ("카이사르", "율리아 (카이사르 가문)"): "율리아는 손윗 친족이지 카이사르의 부모가 아니다",
    ("알렉산드로스 대왕", "피로스"): "무관하다",
    ("클레오파트라 7세", "프톨레마이오스 13세"): "남매이자 공동왕. 아버지는 12세",
    ("예수 그리스도", "세례자 요한"): "친족이나 부자가 아니다",
    ("마르쿠스 아우렐리우스", "콤모두스"): "방향이 뒤집혔다. 콤모두스가 아들",
    ("발레리아누스", "갈리에누스"): "방향이 뒤집혔다. 갈리에누스가 아들",
    ("콘스탄티우스 1세", "콘스탄티누스"): "방향이 뒤집혔다. 콘스탄티누스가 아들",
    ("아그리피나(클라우디우스의 아내)", "아그리피나"): "같은 이름의 모녀가 한 객체로 뭉쳐 자기참조가 됐다",
    # 아우구스투스의 외조모는 카이사르의 '누이' 율리아지 '딸' 율리아가 아니다.
    # 두 율리아를 갈랐는데도 조모 간선이 딸 쪽에 남아 13살 위 손자가 생겼다.
    ("아우구스투스", "율리아 (카이사르 가문)"): "외조모는 카이사르의 누이(동명이인)다. 딸이 아니다",
    ("아브 탈리브", "마호메트"): "방향이 뒤집혔다. 아브 탈리브는 큰아버지이자 후견인",
    # 아래 둘은 객체 자체가 잘못 뭉친 사례다. '율리아' 하나에 카이사르의 누이(아우구스투스의
    # 조모)와 아우구스투스의 딸이 함께 들어 있어, 아우구스투스가 율리아의 부모이자 자식이
    # 되는 순환이 생긴다. 족보를 그려서야 드러났다. 근본 해결은 rome30_merge.py의 SPLIT.
    # 9번의 `아우구스투스 child_of 율리아`는 조모(카이사르의 누이) 쪽 간선인데 분할할 때
    # 딸 쪽에 붙어 아우구스투스 ↔ 딸의 순환을 만들었다. 조모 간선은 8번 것 하나로 족하다.
    ("아우구스투스", "율리아 (아우구스투스의 딸)"): "조모 간선이 딸 쪽에 잘못 붙어 생긴 순환",
    ("콘스탄티아", "콘스탄티누스"): "21번 서술 '콘스탄티누스 대제의 여동생'. 딸이 아니라 누이다",
    ("네로", "아그리피나"): "네로의 어머니는 소 아그리피나다. 대 아그리피나로 걸려 칼리굴라와 형제가 됐다",
}
# 사람이 보태 넣은 관계. 본문에 서술이 있으나 추출에서 빠진 것들.
ADD = [
    # 카이사르의 가정. 추출이 혼인을 succeeded로 잘못 담아 통째로 비어 있었다.
    ("율리아 (카이사르 가문)", "카이사르", "6번 서술 '카이사르의 딸로 폼페이우스와 정략결혼'"),
    ("클라우디우스", "드루수스", "게르마니쿠스의 동생. 11번 본문에 형제 관계가 서술된다"),
    ("클라우디우스", "안토니아", "같은 근거"),
    # 입양은 로마 제정의 계승 방식 자체다. 혈연이 아니라고 빼면 계보가 끊긴다.
    ("아우구스투스", "카이사르", "카이사르의 유언 입양. 제정의 출발점"),
    ("네로", "클라우디우스", "클라우디우스가 아그리피나의 아들을 입양"),
    # 나머지 4가문 대조(2026-07-31). 카이사르 계열과 같은 종류의 누락이 있었다.
    ("콘스탄티아", "콘스탄티우스 1세", "콘스탄티누스의 여동생이므로 같은 아버지의 딸"),
    ("루킬라", "파우스티나", "콤모두스와 남매다. 어머니 쪽 간선이 빠져 있었다"),
    ("아브드 알 무탈리브", "하심", "하심이 증조부이므로 조부는 하심의 아들이다. 대가 끊겨 있었다"),
    # 티베리우스·드루수스의 친아버지는 리비아의 첫 남편이다. 아우구스투스는 의붓아버지이자
    # (티베리우스에 한해) 양부다. 이걸 안 채우면 친형제가 '이복 형제'로 계산된다.
    ("네로", "아그리피나(클라우디우스의 아내)", "12번 서술. 소 아그리피나가 네로의 어머니다"),
    ("티베리우스", "티베리우스 클라우디우스 네로", "9번 서술 '리비아의 첫 남편'"),
    ("드루수스", "티베리우스 클라우디우스 네로", "같은 근거"),
]
# 부자가 아니라 다른 관계인 것. 족보에 남기되 선 종류를 달리한다.
# 혼인. 추출이 succeeded로 잘못 분류했거나 아예 빠뜨린 것을 사람이 선언한다.
MARRY_ADD = [
    ("카이사르", "코르넬리아", "6번 서술 '킨나의 딸로 카이사르의 두 번째 아내'"),
    ("카이사르", "칼푸르니아", "6·8번 서술 '카이사르의 아내'. 객체는 있는데 관계가 없었다"),
    ("폼페이우스", "율리아 (카이사르 가문)", "6번 서술 '폼페이우스와 정략결혼'"),
    ("유스티누스", "황비 루피키나", "26번 서술 '유스티니아누스의 백모이자 당시 황비'"),
    ("아우구스투스", "리비아 드루실라", "9번 서술 '옥타비아누스의 세 번째 아내'"),
    ("아우구스투스", "스크리보니아", "9번 서술 '옥타비아누스의 두 번째 아내'"),
    ("클라우디우스", "아그리피나(클라우디우스의 아내)", "11번 서술 '클라우디우스의 다섯 번째 아내'"),
    ("리비아 드루실라", "티베리우스 클라우디우스 네로", "9번 서술. 리비아의 1차 혼인"),
]
# succeeded로 들어왔지만 실제로는 혼인인 것. 계승 목록에서 뺀다.
SUCC_IS_MARRIAGE = {("카이사르", "코르넬리아"), ("폼페이우스", "율리아 (카이사르 가문)")}

KIN = {
    ("아우구스투스", "카이사르"): "양자",
    ("티베리우스", "아우구스투스"): "양자",
    ("네로", "클라우디우스"): "양자",
    ("스키피오 아이밀리아누스", "스키피오 아프리카누스"): "양손자",
    ("유스티니아누스", "유스티누스"): "외조카·양자",
    ("마호메트", "아브드 알 무탈리브"): "조부",
    ("마호메트", "하심"): "증조부",
    # 본문 26번은 "백부"라 쓰지만 유스티누스는 어머니 비길란티아의 오빠, 곧 외삼촌이다.
    # 책의 말과 사실이 갈리는 자리 — 그림에는 사실을 적고 이 줄에 근거를 남긴다.
    ("유스티니아누스", "황비 루피키나"): "외숙모",
    ("드루수스", "아우구스투스"): "의붓아버지",
}

# 혼인 순서. 데이터에 혼인 연도가 거의 없어 기계가 알 수 없다. 책이 "두 번째 아내"처럼
# 직접 말해주는 곳이 있으므로 (사람, 배우자) → 그 사람 기준 몇 번째인지를 선언한다.
# 순서는 보는 쪽에 따라 다르다 — 리비아에게 아우구스투스는 2번째, 아우구스투스에게
# 리비아는 3번째다. 둘 다 적으면 칸에 둘 다 나온다.
SPOUSE_SEQ = {
    ("카이사르", "코르넬리아"): 2,               # 6번 '카이사르의 두 번째 아내'
    ("카이사르", "칼푸르니아"): 4,               # 코수티아·폼페이아를 포함한 순서. 본문에는 없다
    ("아우구스투스", "스크리보니아"): 2,          # 9번 '옥타비아누스의 두 번째 아내'
    ("아우구스투스", "리비아 드루실라"): 3,       # 9번 '옥타비아누스의 세 번째 아내'
    ("리비아 드루실라", "티베리우스 클라우디우스 네로"): 1,
    ("리비아 드루실라", "아우구스투스"): 2,
    # 11번 '다섯 번째 아내'. 정사(수에토니우스)는 아내를 넷으로 세고 파혼한 약혼은 빼므로
    # 통설로는 ④다. 책을 옮긴 자리이므로 책의 수를 따르고 차이만 여기 적어 둔다.
    ("클라우디우스", "아그리피나(클라우디우스의 아내)"): 5,
}
# 순서 대신 다른 말을 붙일 혼인. 법적 혼인이 아닌 것 등.
UNION_LABEL = {("카이사르", "클레오파트라 7세"): "결합"}
CIRCLED = "①②③④⑤⑥⑦⑧⑨"


def union_label(parents):
    """혼인 칸에 적을 말. 서수가 선언된 쪽은 '이름 ②'로 보인다."""
    key = tuple(sorted(parents))
    if key in UNION_LABEL:
        return UNION_LABEL[key]
    marks = [f"{who} {CIRCLED[SPOUSE_SEQ[(who, o)] - 1]}"
             for who in sorted(parents) for o in parents
             if o != who and (who, o) in SPOUSE_SEQ]
    # 줄바꿈을 넣으면 Mermaid 노드 문법이 깨진다. 한 줄로 잇는다.
    return "혼인" + (" " + " · ".join(marks) if marks else "")


# ─── 맥락 보강 ────────────────────────────────────────────────────────────────
# 여기부터는 **이 책 본문에 없는** 관계다. 조부·숙부가 빠지면 계보의 맥락이 끊겨
# "이 사람이 왜 황제가 됐는지"가 안 보이므로 외부 지식으로 보탠다.
# 위의 ADD·MARRY_ADD와 반드시 갈라 둔다 — 그림에서도 점선·흐림으로 구분해 그린다.
# 근거의 등급이 다른 것을 같은 실선으로 그리면 데이터가 거짓말을 시작한다.

# 볼트에 객체가 없는 인물. 위키링크를 걸지 않고 흐리게만 그린다.
CONTEXT_PEOPLE = {
    "헬레나": {"sex": "female", "born": 246, "died": 330,
               "note": "콘스탄티우스 1세의 아내, 콘스탄티누스의 어머니"},
    "압둘라": {"sex": "male", "born": 545, "died": 570,
               "note": "마호메트의 아버지. 마호메트가 태어나기 전에 죽었다"},
    "비길란티아": {"sex": "female", "born": None, "died": None,
                 "note": "유스티누스의 누이이자 유스티니아누스의 어머니"},
    "율리아 (카이사르의 누이)": {"sex": "female", "born": -101, "died": -51,
                 "note": "카이사르의 누이. 아우구스투스의 외조모 — 같은 이름의 카이사르의 딸과 다른 사람"},
    "아티아": {"sex": "female", "born": -85, "died": -43,
             "note": "율리아의 딸, 아우구스투스의 어머니. 카이사르에게는 조카딸"},
}
# 보강 혈연. (자식, 부모, 근거)
CONTEXT = [
    ("마르쿠스 아우렐리우스", "안토니누스 피우스", "안토니누스 피우스의 양자. 5현제 계승의 고리"),
    ("파우스티나", "안토니누스 피우스", "안토니누스 피우스의 친딸. 그래서 남편과 사촌 간이다"),
    ("안토니누스 피우스", "하드리아누스", "하드리아누스의 양자"),
    ("콘스탄티누스", "헬레나", "헬레나가 콘스탄티누스의 어머니"),
    ("헬레나", None, None),                      # 자리 표시용 — 아래에서 걸러진다
    ("아브 탈리브", "아브드 알 무탈리브", "아브드 알 무탈리브의 아들이자 마호메트의 큰아버지"),
    ("압둘라", "아브드 알 무탈리브", "마호메트의 아버지"),
    ("마호메트", "압둘라", "친아버지. 이걸 넣어야 조부·큰아버지가 제자리를 찾는다"),
    ("유스티니아누스", "비길란티아", "어머니. 유스티누스는 백부가 아니라 외삼촌이다"),
    ("비길란티아", None, None),
    ("아우구스투스", "아티아", "친어머니. 카이사르와의 핏줄은 이 선으로 이어진다"),
    ("아티아", "율리아 (카이사르의 누이)", "외조모. 카이사르의 누이이자 아우구스투스의 외조모"),
]
CONTEXT = [x for x in CONTEXT if x[1]]
CONTEXT_MARRY = [
    ("콘스탄티우스 1세", "헬레나", "콘스탄티누스의 부모"),
    ("루킬라", "루키우스 베루스", "15번에 혼담이 서술된다. 실제 혼인은 외부 근거"),
]
# 보강으로 들어온 사람·관계를 그림에서 갈라내기 위한 집합
CTX_EDGES = {(c, pa) for c, pa, _ in CONTEXT} | \
            {tuple(sorted((a, b))) for a, b, _ in CONTEXT_MARRY}


def reign_ko(v):
    """재위 표기를 사람이 읽는 꼴로. 원자료는 기원전을 음수로 담고 있다."""
    s = str(v).strip()
    m = re.fullmatch(r"(-?\d+)\s*[~-]\s*(-?\d+)", s)
    if not m:
        return s
    f = lambda y: f"기원전 {-int(y)}" if int(y) < 0 else str(y)
    a, b = m.groups()
    return f"{f(a)}~{f(b)}" + ("" if int(a) < 0 or int(b) < 0 else "")


# Mermaid의 문자 이스케이프는 HTML 엔티티에서 &를 뺀 꼴이다. &#40;로 쓰면 '&('로 샌다.
# 성별은 온톨로지에 없다. 캔버스 쪽 선언과 같은 목록을 쓴다.
FEM_HINT = {"클레오파트라 7세", "리비아 드루실라", "옥타비아", "율리아 (카이사르 가문)",
       "율리아 (아우구스투스의 딸)", "안토니아", "리빌라", "아그리피나", "코르넬리아",
       "아그리피나(클라우디우스의 아내)", "빕사니아", "파우스티나", "루킬라", "칼푸르니아",
       "테오도라", "제노비아", "콘스탄티아", "하디자", "세르빌리아", "스크리보니아",
       "살로메", "헤로디아", "황비 루피키나"} | {
       k for k, v in CONTEXT_PEOPLE.items() if v["sex"] == "female"}
MAL_HINT = {"카이사르", "아우구스투스", "티베리우스", "드루수스", "게르마니쿠스", "클라우디우스",
       "칼리굴라", "네로", "브리탄니쿠스", "카이사리온", "가이우스 카이사르", "루키우스",
       "마르쿠스 아그리파", "마르쿠스 아우렐리우스", "콤모두스", "유스티니아누스", "유스티누스",
       "콘스탄티누스", "콘스탄티우스 1세", "콘스탄티누스 2세", "크리스푸스", "마호메트",
       "하심", "아브드 알 무탈리브", "아브 탈리브", "발레리아누스", "갈리에누스", "폼페이우스",
       "마르쿠스 안토니우스", "티베리우스 클라우디우스 네로", "킨나",
       "하드리아누스", "안토니누스 피우스", "루키우스 베루스", "아카키우스"} | {
       k for k, v in CONTEXT_PEOPLE.items() if v["sex"] == "male"}

# Mermaid의 문자 이스케이프는 HTML 엔티티에서 &를 뺀 꼴이다. &#40;로 쓰면 '&('로 샌다.
# 물결은 반드시 백슬래시로 죽인다. 라벨은 GFM으로 파싱되는데 한 칸에 물결이 둘이면
# (`86~161<br/>재위 138~161`) 그 사이를 취소선으로 읽고 'Unsupported markdown: del'을
# 글자로 뱉는다. `#126;` 엔티티는 안 통한다 — 실측으로 확인했다.
MERMAID_ESC = lambda s: (s.replace('"', "'").replace("(", "#40;").replace(")", "#41;")
                          .replace("~", "\\~"))
# 간선 라벨의 괄호는 도형 시작으로 읽혀 도표를 통째로 죽인다. 라벨은 따로 씻는다.
EDGE_ESC = lambda s: str(s).replace('(', '·').replace(')', '').replace('|', '/')


def load():
    ents = {}
    for l in (BASE / "ontology/entities.jsonl").open(encoding="utf-8"):
        e = json.loads(l)
        ents[e["id"]] = e
    name = lambda i: ents.get(i, {}).get("name", "?")

    child, marry, succ = [], [], []
    for l in (BASE / "ontology/links.jsonl").open(encoding="utf-8"):
        x = json.loads(l)
        a, b = name(x["from"]), name(x["to"])
        if a == "?" or b == "?" or a == b:
            continue
        if x["rel"] == "child_of" and (a, b) not in DROP:
            child.append((a, b))
        elif x["rel"] == "married":
            marry.append(tuple(sorted((a, b))))
        elif x["rel"] == "succeeded" and (a, b) not in SUCC_IS_MARRIAGE:
            succ.append((a, b))
    child += [(c, p) for c, p, _ in ADD] + [(c, p) for c, p, _ in CONTEXT]
    marry += [tuple(sorted((a, b))) for a, b, _ in MARRY_ADD] \
           + [tuple(sorted((a, b))) for a, b, _ in CONTEXT_MARRY]
    return ents, sorted(set(child)), sorted(set(marry)), sorted(set(succ))


def clusters(child, marry):
    """혈연·혼인으로 이어진 덩어리를 가문으로 본다."""
    adj = defaultdict(set)
    for a, b in child + list(marry):
        adj[a].add(b)
        adj[b].add(a)
    seen, out = set(), []
    for n in sorted(adj):
        if n in seen:
            continue
        stack, comp = [n], set()
        while stack:
            k = stack.pop()
            if k in comp:
                continue
            comp.add(k)
            stack += [m for m in adj[k] if m not in comp]
        seen |= comp
        out.append(comp)
    return sorted(out, key=len, reverse=True)


def mermaid(comp, ents, child, marry, succ):
    """캔버스와 같은 모델로 그린다 — 혼인은 선이 아니라 노드다.

    혼인을 사람 사이의 점선으로 그으면 부모→자식 실선과 눈으로 구분이 안 된다.
    혼인 노드를 두면 자녀가 거기 매달려 형제가 저절로 드러나고, subgraph로 그 핵가족을
    상자로 두를 수 있다. 모든 간선에 관계를 적는다 — 안 적으면 선이 무슨 뜻인지 모른다.
    """
    from collections import defaultdict as dd
    by_name = {e["name"]: e for e in ents.values()}
    par = dd(set)
    for c, p in child:
        if c in comp and p in comp:
            par[c].add(p)
    # 혼인은 친부모 쌍에서만 유추한다. 양자·조모 같은 비혈연 계보를 섞으면
    # 카이사르와 그의 딸이 부부가 된다. 캔버스 쪽과 같은 규칙이다.
    bio = dd(set)
    for c, p in child:
        if c in comp and p in comp and (c, p) not in KIN:
            bio[c].add(p)
    unions = dd(list)
    for c in sorted(comp):
        if len(bio[c]) >= 2:
            unions[frozenset(bio[c])].append(c)
    for a, b in marry:
        if a in comp and b in comp and frozenset((a, b)) not in unions:
            unions[frozenset((a, b))] = []

    ids = {n: f"n{i}" for i, n in enumerate(sorted(comp))}
    BY = born()
    fem, mal, unk, weds, ctx = [], [], [], [], []
    L = ["```mermaid", "graph TD"]
    for n in sorted(comp):
        reign = (by_name.get(n, {}).get("attrs") or {}).get("reign")
        life = life_ko(n, BY)
        label = MERMAID_ESC(n) + ("*" if n in CONTEXT_PEOPLE else "")
        if life:
            label += f"<br/>{MERMAID_ESC(life)}"
        if reign:
            label += f"<br/>재위 {MERMAID_ESC(reign_ko(reign))}"
        L.append(f'  {ids[n]}["{label}"]')
        (ctx if n in CONTEXT_PEOPLE else
         fem if n in FEM_HINT else mal if n in MAL_HINT else unk).append(ids[n])

    boxed, ui = set(), 0
    for parents, kids in sorted(unions.items(), key=lambda kv: sorted(kv[0])):
        # frozenset은 순회 순서가 실행마다 다르다. 정렬해야 멱등이다.
        ps = [p for p in sorted(parents) if p in comp]
        if not ps:
            continue
        ui += 1
        u = f"u{ui}"
        L.append(f'  {u}(("{MERMAID_ESC(union_label(parents))}"))')
        weds.append(u)
        for p in ps:
            arrow = "-.-" if tuple(sorted(parents)) in CTX_EDGES else "---"
            L.append(f"  {ids[p]} {arrow}|{'남편' if p not in FEM_HINT else '아내'}| {u}")
        # 자녀가 둘 이상이면 형제다. subgraph 상자로 두른다.
        if len(kids) >= 2:
            L.append(f'  subgraph s{ui}["{MERMAID_ESC(" × ".join(sorted(parents)))} 사이의 형제"]')
            L += [f"    {ids[k]}" for k in kids if k not in boxed]
            L.append("  end")
            boxed |= set(kids)
        for k in kids:
            # 부모 중 아무나 집으면 양자 라벨이 붙었다 말았다 한다. 전부 살핀다.
            kin = next((KIN[(k, pa)] for pa in sorted(parents) if (k, pa) in KIN), None)
            a = "-.->" if any((k, pa) in CTX_EDGES for pa in parents) else "-->"
            L.append(f"  {u} {a}|{EDGE_ESC(kin) if kin else '자녀'}| {ids[k]}")

    drawn = {k for kids in unions.values() for k in kids}
    for c, p in child:
        if c in comp and p in comp and c not in drawn:
            kin = KIN.get((c, p))
            a = "-.->" if (c, p) in CTX_EDGES else "-->"
            L.append(f"  {ids[p]} {a}|{EDGE_ESC(kin) if kin else '자녀'}| {ids[c]}")
    for a, b in succ:
        if a in comp and b in comp:
            L.append(f"  {ids[b]} ==>|제위 계승| {ids[a]}")
    # 클래스는 별도 문으로 준다. 도형 선언에 :::를 붙이는 문법은 머메이드 버전을 탄다.
    # 색은 성별만 뜻한다. 캔버스와 같은 규칙 — [[족보_표기_설계]] 참조.
    L += ["  classDef mal fill:#0e5a6b,stroke:#67e8f9,color:#fff",
          "  classDef fem fill:#4c1d6b,stroke:#d8b4fe,color:#fff",
          "  classDef unk fill:#3f3f46,stroke:#a1a1aa,color:#fff",
          "  classDef wed fill:#a16207,stroke:#fde047,color:#fff",
          "  classDef ctx fill:#27272a,stroke:#52525b,color:#a1a1aa,stroke-dasharray:4 3"]
    for cls, members in (("mal", mal), ("fem", fem), ("unk", unk),
                         ("wed", weds), ("ctx", ctx)):
        if members:
            L.append("  class " + ",".join(members) + " " + cls)
    L.append("```")
    return "\n".join(L)


def born():
    """생몰년. 없으면 빈 표 — 나이가 필요한 호칭만 '동기'로 뭉뚱그려진다."""
    f = BASE / "ontology/_family/birthyears.json"
    if not f.exists():
        return {}
    out = {k: v for k, v in json.loads(f.read_text(encoding="utf-8")).items()}
    for k, v in CONTEXT_PEOPLE.items():        # 보강 인물의 연도도 같이 쓴다
        if v.get("born") is not None:
            out.setdefault(k, {"born": v["born"], "died": v.get("died"),
                               "confidence": "medium", "note": v["note"]})
    return out


def life_ko(name, by=None):
    """생몰년을 사람이 읽는 꼴로. 신뢰도가 낮으면 '약'을 붙여 추정임을 밝힌다."""
    d = (by if by is not None else born()).get(name)
    if not d or d.get("born") is None:
        return ""
    f = lambda y: f"기원전 {-y}" if y < 0 else str(y)
    s = f"{f(d['born'])}~" + (f(d["died"]) if d.get("died") is not None else "?")
    return ("약 " if d.get("confidence") == "low" else "") + s


def kinship(comp, child, marry):
    """그래프에서 가까운 친족 호칭을 계산한다.

    "할아버지가 누구인지 알 수 있어야 한다"는 요구의 답이다. 그림만으로는 세대는
    보여도 호칭이 안 나온다. 촌수와 마찬가지로 **혈연 간선만** 타고 올라간다 —
    양자·조모처럼 KIN으로 선언된 계보는 세대를 건너뛰므로 여기서 제외한다.

    한국어 친족 호칭은 아버지 쪽과 어머니 쪽을 가른다(조부/외조부). 나이 순서가
    필요한 호칭(형/제, 백부/숙부)은 데이터에 생몰년이 없어 만들지 않는다.
    """
    bio = defaultdict(set)
    for c, pa in child:
        if c in comp and pa in comp and (c, pa) not in KIN:
            bio[c].add(pa)
    kids = defaultdict(set)
    for c, pas in bio.items():
        for pa in pas:
            kids[pa].add(c)
    sx = lambda n: "male" if n in MAL_HINT else ("female" if n in FEM_HINT else "?")
    BY = born()
    yr = lambda n: (BY.get(n) or {}).get("born")

    def older(a, b):
        """a가 b보다 손위인가. 한쪽이라도 생년이 없으면 None(모름)."""
        x, y = yr(a), yr(b)
        return None if x is None or y is None else x < y

    def sib_term(ego, s):
        """한국어 형제 호칭은 나 자신의 성별과 상대의 성별·나이에 함께 달렸다."""
        o = older(s, ego)
        if o is None:
            return "형제" if sx(s) == "male" else "자매" if sx(s) == "female" else "동기"
        if sx(s) == "male":
            return ("형" if sx(ego) == "male" else "오빠") if o else "남동생"
        if sx(s) == "female":
            return ("누나" if sx(ego) == "male" else "언니") if o else "여동생"
        return "손위 동기" if o else "손아래 동기"

    out = {}
    for n in sorted(comp):
        r = {}
        for pa in sorted(bio[n]):
            r.setdefault("아버지" if sx(pa) == "male" else
                         ("어머니" if sx(pa) == "female" else "부모"), []).append(pa)
            side = "" if sx(pa) == "male" else ("외" if sx(pa) == "female" else "")
            for gp in sorted(bio[pa]):
                key = side + ("조부" if sx(gp) == "male" else
                              ("조모" if sx(gp) == "female" else "조부모"))
                r.setdefault(key, []).append(gp)
                for ggp in sorted(bio[gp]):          # 증조까지만 센다
                    # 호칭의 성별은 그 사람 자신의 것이다. 조부의 호칭을 물려주면
                    # 리비아 드루실라가 '증조부'가 된다.
                    r.setdefault("증" + side + ("조부" if sx(ggp) == "male" else
                                 "조모" if sx(ggp) == "female" else "조부모"), []).append(ggp)
        # 아버지·어머니의 형제자매 → 백부·숙부·고모·외삼촌·이모.
        for pa in sorted(bio[n]):
            for unc in sorted({u for gp in bio[pa] for u in kids[gp]} - {pa}):
                o = older(unc, pa)
                if sx(pa) == "male":
                    k = ("백부" if o else "숙부") if o is not None else "삼촌"
                    if sx(unc) == "female":
                        k = "고모"
                else:
                    k = "외삼촌" if sx(unc) == "male" else "이모" if sx(unc) == "female" else "외척"
                r.setdefault(k, []).append(unc)
        sibs = {s for pa in bio[n] for s in kids[pa]} - {n}
        for s in sorted(sibs, key=lambda x: (yr(x) is None, yr(x) or 0, x)):
            k = sib_term(n, s)
            # 부모가 양쪽 다 기록됐는데 다를 때만 이복이다. 한쪽 기록이 없는 것은
            # 이복이 아니라 미상이다 — 구분하지 않으면 친형제가 이복으로 뒤집힌다.
            if bio[s] == bio[n]:
                pass
            elif len(bio[s]) >= 2 and len(bio[n]) >= 2:
                k = "이복 " + k
            r.setdefault(k, []).append(s)
        for c in sorted(kids[n], key=lambda x: (yr(x) is None, yr(x) or 0, x)):
            r.setdefault("아들" if sx(c) == "male" else
                         ("딸" if sx(c) == "female" else "자녀"), []).append(c)
            for gc in sorted(kids[c]):
                side = "" if sx(c) == "male" else "외"
                r.setdefault(side + ("손자" if sx(gc) == "male" else
                                     "손녀" if sx(gc) == "female" else "손주"), []).append(gc)
        sp = [b if a == n else a for a, b in marry if n in (a, b)]
        if sp:
            r["배우자"] = sorted(sp)
        if r:
            out[n] = r
    return out


def note(comp, ents, child, marry, succ, title, audited):
    by_name = {e["name"]: e for e in ents.values()}
    ordered = sorted(comp, key=lambda n: (-len(by_name.get(n, {}).get("points", [])), n))
    lines = [
        "---", "created: 2026-07-31", "type: moc", "book: 로마제국쇠망사",
        "tags:", "  - topic/산스", "  - topic/편데", "  - type/moc",
        "up:", '  - "[[로마제국쇠망사_온톨로지]]"', "---", "",
        f"# {title}", "",
        f"인물 {len(comp)}명. 온톨로지의 혈연·혼인·계승 관계에서 생성했다 — "
        "손으로 그린 그림이 아니라 데이터의 파생물이라, 관계를 고치고 "
        "`rome30_family.py`를 다시 돌리면 이 그림도 따라 바뀐다.", "",
        "노란 동그라미가 혼인이고, 자녀는 거기서 내려온다. 상자는 그 혼인에서 난 형제다. "
        "모든 선에 관계를 적었다 — 남편·아내·자녀, 그리고 양자·조부처럼 혈연이 아닌 계보. "
        "**점선과 흐린 칸은 이 책 본문에 없는 맥락 보강**이다. 조부·숙부가 빠지면 계보가 "
        "끊겨 보여서 외부 지식으로 보탰고, 이름 뒤 별표는 볼트에 노트가 없는 인물이다. "
        "굵은 선은 제위 계승으로 "
        "혈연과 다른 축이다. 붉은 칸은 재위 기록이 있는 인물이다.", "",
        "더 정밀한 그림은 같은 이름의 `.canvas` 파일에 있다 — 세대 번호·개인 번호·"
        "남녀 배치까지 계보도 표기를 따랐다. 표기 규칙은 [[족보_표기_설계]]에 있다.", "",
    ]
    if not audited:
        lines += ["이 가문은 **아직 대조하지 않았다.** 추출 단계의 오류가 남아 있을 수 있으니 "
                  "그림을 그대로 믿지 말고 각 인물 노트의 서술과 대조할 것.", ""]
    lines += [mermaid(comp, ents, child, marry, succ), ""]
    kin = kinship(comp, child, marry)
    if kin:
        # 표가 길어 본문 흐름을 끊는다. 접어두고 필요할 때만 펴게 한다.
        lines += ["> [!note]- 가까운 친족", ">",
                  "> 그림에서 선을 따라 세면 나오는 것을 표로 옮겼다. 혈연 간선만 타므로 "
                  "양자·조부처럼 대를 건너뛴 계보는 여기 들어가지 않는다. "
                  "호칭은 보는 사람의 성별과 상대의 나이에 따라 달라진다 — "
                  "같은 사람이 누구에게는 백부, 누구에게는 숙부다.", ">",
                  "> | 사람 | 관계 |", "> |---|---|"]
        # 보강 인물은 볼트에 노트가 없으므로 링크를 걸지 않는다 (별표만 붙인다).
        lk = lambda x: f"{x}\\*" if x in CONTEXT_PEOPLE else f"[[{x}]]"
        for n in sorted(kin, key=lambda x: (-len(kin[x]), x)):
            cells = " · ".join(f"**{k}** {', '.join(lk(v) for v in vs)}"
                               for k, vs in kin[n].items())
            lines.append(f"> | {lk(n)} | {cells} |")
        lines.append("")
    lines += ["### 인물", ""]
    for n in ordered:
        e = by_name.get(n, {})
        # 보강 인물은 볼트에 노트가 없다. 위키링크를 걸면 빈 링크가 되므로 걸지 않고,
        # 설명은 선언 표의 note를 그대로 쓴다. 별표는 그림의 별표와 같은 뜻이다.
        if n in CONTEXT_PEOPLE:
            lines.append(f"- {n}\\* — {CONTEXT_PEOPLE[n]['note']} (본문 밖 보강)")
            continue
        desc = (e.get("desc") or "")[:90]
        lines.append(f"- [[{n}]] — {desc}")
    lines.append("")
    return "\n".join(lines)


def check():
    """사람이 적은 판단 표가 실제 데이터와 맞물리는지 검사한다.

    이게 이 시스템의 가장 큰 재현 위험이다. DROP·ADD·KIN·MARRY_ADD는 객체 '이름'을
    적어두는데, merge.py의 CANON이나 SPLIT이 이름을 바꾸면 표의 항목이 아무것도
    가리키지 않게 되고 **조용히 무시된다.** 고쳐놓은 오류가 소리 없이 되살아난다.
    """
    names = {json.loads(l)["name"]
             for l in (BASE / "ontology/entities.jsonl").open(encoding="utf-8")}
    names |= set(CONTEXT_PEOPLE)      # 보강 인물은 노트가 없어도 정상이다
    bad = []
    for label, pairs in (("DROP", DROP), ("KIN", KIN)):
        for (a, b) in pairs:
            for n in (a, b):
                if n not in names:
                    bad.append(f"{label}: '{n}' 라는 객체가 없다")
    for label, rows in (("ADD", ADD), ("MARRY_ADD", MARRY_ADD)):
        for a, b, _why in rows:
            for n in (a, b):
                if n not in names:
                    bad.append(f"{label}: '{n}' 라는 객체가 없다")
    for a, b in SUCC_IS_MARRIAGE:
        for n in (a, b):
            if n not in names:
                bad.append(f"SUCC_IS_MARRIAGE: '{n}' 라는 객체가 없다")
    for label, s in (("FEM_HINT", FEM_HINT), ("MAL_HINT", MAL_HINT)):
        for n in sorted(s - names):
            bad.append(f"{label}: '{n}' 라는 객체가 없다")

    ents, child, marry, succ = load()
    comps = [c for c in clusters(child, marry) if len(c) >= 3]
    # 혈연에 순환이 있으면 세대 계산이 발산한다. 반드시 0이어야 한다.
    g = defaultdict(set)
    for c, pa in child:
        g[c].add(pa)
    seen, stack = set(), []

    def dfs(n):
        if n in stack:
            return stack[stack.index(n):] + [n]
        if n in seen:
            return None
        seen.add(n)
        stack.append(n)
        for m in g[n]:
            r = dfs(m)
            if r:
                return r
        stack.pop()
        return None

    for n in list(g):
        cyc = dfs(n)
        if cyc:
            bad.append("혈연 순환: " + " → ".join(cyc))
            break
    # 친부모가 셋 이상이면 잘못 뭉친 객체다. 양자·의붓아버지는 KIN으로 빠지므로 세지 않는다.
    par = defaultdict(set)
    for c, pa in child:
        if (c, pa) not in KIN:
            par[c].add(pa)
    for n, ps in sorted(par.items()):
        if len(ps) > 2:
            bad.append(f"부모가 {len(ps)}명: {n} ← {sorted(ps)}")

    # 생몰년과 족보는 서로 다른 경로로 만들어졌다. 부모가 자식보다 늦게 태어났으면
    # 둘 중 하나가 틀린 것이다 — 독립적인 두 자료가 서로를 검산한다.
    BY = born()
    n_year = 0
    for c, pa in child:
        if (c, pa) in KIN:
            continue
        a, b = (BY.get(c) or {}).get("born"), (BY.get(pa) or {}).get("born")
        if a is not None and b is not None:
            n_year += 1
            if b >= a:
                bad.append(f"부모가 자식보다 늦게 태어남: {pa}({b}) → {c}({a})")
    for n in sorted(set(BY) - names):
        bad.append(f"birthyears.json: '{n}' 라는 객체가 없다")

    print(f"객체 {len(names)} · 가문 {len(comps)} · 혈연 {len(child)} · 혼인 {len(marry)}"
          f" · 생몰년 {len(BY)}(검산 가능한 부자쌍 {n_year})")
    if bad:
        print(f"\n[문제 {len(bad)}건]")
        for b in bad:
            print("  " + b)
    else:
        print("이상 없음 — 판단 표가 전부 실제 객체를 가리키고, 순환도 없다")
    return not bad


def main(write, only=None):
    ents, child, marry, succ = load()
    comps = [c for c in clusters(child, marry) if len(c) >= 3]
    print(f"관계: 혈연 {len(child)} · 혼인 {len(marry)} · 계승 {len(succ)}")
    print(f"3명 이상 이어진 가문 {len(comps)}개\n")
    OUT.mkdir(exist_ok=True)
    keep = set()
    for c in comps:
        # 집합은 순회 순서가 실행마다 다르다. 정렬해서 넣고 동점이면 이름으로 가른다 —
        # 안 그러면 콤모두스와 마르쿠스 아우렐리우스처럼 등장 포인트가 같은 둘이 번갈아
        # 대표가 되면서 파일명이 매 실행 바뀌고, 정리 루틴이 지웠다 다시 만든다.
        pts = {e["name"]: len(e["points"]) for e in ents.values()}
        anchor = max(sorted(c), key=lambda n: (pts.get(n, 0), n))
        title = f"족보 {anchor} 계열"
        # 다섯 가문 모두 근거를 대조했다(2026-07-31). 새 가문이 생기면 여기 추가한다.
        audited = True
        if only and only not in c:
            continue
        print(f"  {len(c):3d}명  {title}" + ("" if audited else "   (미대조)"))
        f = OUT / f"{title.replace(' ', '_')}.md"
        keep.add(f.name)
        if write:
            f.write_text(note(c, ents, child, marry, succ, title, audited), encoding="utf-8")
    # 대표 인물이 바뀌면 파일명도 바뀐다. 옛 이름이 남아 두 벌이 되지 않게 걷어낸다.
    if write and not only:
        # 이 스크립트가 만든 것만 지운다. 패턴을 넓게 잡으면 손으로 쓴
        # 문서(족보_표기_설계.md)까지 지워버린다. 실제로 한 번 그랬다.
        for old in OUT.glob("족보_*_계열.md"):
            if old.name not in keep:
                old.unlink()
                print(f"  정리: {old.name}")
    print("\n" + ("기록 완료" if write else "(dry-run — 미기록)"))


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(0 if check() else 1)
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main("--write" in sys.argv, args[0] if args else None)
