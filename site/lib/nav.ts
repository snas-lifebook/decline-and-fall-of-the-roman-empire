import { books, bookHref } from './book'
import { ENTITY_TYPES, loadEntities, type Entity } from './ontology'
import { TYPE_KO } from './export/table'
import { families } from './family/build'

/**
 * 사이트 내비게이션 트리 — **한 곳에서만 관리한다.**
 *
 * 사이드바·빵부스러기·이전/다음이 전부 이 하나를 먹는다. 세 군데에 순서를 따로
 * 적으면 반드시 어긋난다.
 *
 * `ready: false`는 아직 안 만든 곳이다. 사이드바에는 회색으로 남기되(404보다
 * 정직하다) **이전·다음 순서에서는 뺀다** — 「다음」을 눌렀는데 준비 중이면
 * 그건 막다른 길이다.
 */

export type NavNode = {
  href: string
  title: string
  ready: boolean
  children?: NavNode[]
}

/**
 * 활용하기 네 장.
 *
 * 순서가 곧 논리다 — **재료를 먼저 주고**(안 주면 AI가 지어낸다) 사례를 보고,
 * 스킬을 알고, 함정을 안다. 앞 판은 표 두 개에 프롬프트 여덟 개를 늘어놓았는데
 * 그 여덟이 전부 로컬 파일을 요구해 웹에서는 작동하지 않았다.
 */
/*
  **이름에 수사를 붙이지 않는다.** 앞 판은 「스킬 여덟」·「재료 셋」이었는데 River가
  「이런 말 안 쓴다」고 했다. 맞다 — 「스킬 여덟」은 한국어 관용이 아니다. 개수는
  제목이 아니라 부제나 본문이 진다.

  **형제끼리 문법을 맞춘다.** 앞 판 넷은 의문절(「무엇을 AI에 주나」)·명사구(「우수
  사례」)·명사+수(「스킬 여덟」)·관형절(「그냥 시키면 틀리는 것」)로 넷 다 형태가
  달랐다. 지금은 전부 명사구다.

  docs.claude.com 한국어판의 항목 이름이 기준이다 — 「개요」·「할 수 있는 것」·
  「다음 단계」처럼 **평범한 말**을 쓴다. 조어를 만들지 않는다.
*/
const USE: [string, string][] = [
  // 읽고 보는 법이 먼저, AI로 쓰는 법이 나중 (Stage B, 2026-08-20)
  ['/use/reading', '화면 보는 법'],
  ['/use/data', 'AI에 줄 자료'],
  ['/use/recipes', '활용 사례'],
  ['/use/skills', '스킬'],
  ['/use/pitfalls', '그냥 시키면 틀리는 것'],
]

/** 시작하기 여섯 장. 순서가 곧 초보자가 밟는 순서다 */
const START: [string, string][] = [
  ['/start/install', '옵시디언 설치하고 자료 받기'],
  // 「볼트로 열고 어디부터 보나」였다. 제목 자리에 의문절을 쓰지 않는다
  ['/start/open', '옵시디언에서 자료 열기'],
  ['/start/plugins', '플러그인 두 개 켜기'],
  ['/start/ai', 'AI에 자료 연결하기'],
  ['/start/update', '갱신 받는 법'],
  ['/start/links', '작업 공간'],
]

const familyCount = () => families().length

/** 타입별 객체 수. 사이드바 라벨에 그대로 실린다. /about 「다루는 것」 그리드도 같은 값을 쓴다 */
export function typeCounts(): { type: Entity['type']; count: number }[] {
  const all = loadEntities()
  return ENTITY_TYPES.map((type) => ({ type, count: all.filter((e) => e.type === type).length }))
}

function build(): NavNode[] {
  return [
    /*
      **시작하기가 맨 앞이다**(River #12, 2026-08-20). 앞 판은 읽기가 첫 갈래라
      이전·다음 사슬이 곧장 본문으로 떨어졌는데, 자료를 **처음 받는 사람**이 밟는
      순서는 「깔고 → 열고 → 읽고 → 찾고 → 받고 → 쓴다」다. learn.chatgpt·대다수 문서
      사이트가 퀵스타트를 첫 그룹에 둔다 — 사슬도 시작하기 여섯 장을 다 지나야
      읽기로 넘어간다(그래서 `/start/links` 다음이 이제 `/read`다).
    */
    {
      href: '/start',
      title: '시작하기',
      ready: true,
      children: START.map(([href, title]) => ({ href, title, ready: true })),
    },
    {
      href: '/read',
      title: '읽기',
      ready: true,
      /*
        **한 겹이 늘었다 — 「읽기 › 책 › 대목」.** 앞 판은 읽기 밑에 30개가 바로
        걸려 있었는데, 그러면 일러두기·책머리에·옮기고 나서가 갈 자리가 없다.
        그 셋은 파일로 있으면서 사이트 어디에도 안 걸려 있었다.

        사이드바 이름은 책 제목 전체가 아니라 **「30포인트 편역본」**이다 — 대목마다
        붙어 있는 배지와 같은 말이라, 사람이 이미 아는 이름으로 걸린다. 책 제목
        전체는 책 화면의 제목이 진다.
      */
      children: books().map((b) => ({
        href: bookHref(b),
        title: b.short,
        ready: true,
        children: b.parts.map((p) => ({
          href: p.href,
          // 번호는 발표를 맡은 사람이 기억하는 손잡이다. 앞뒤 글에는 번호가 없다
          title: p.n ? `${String(p.n).padStart(2, '0')} ${p.title}` : p.title,
          ready: true,
        })),
      })),
    },
    {
      href: '/objects',
      title: '찾아보기',
      ready: true,
      children: [
        // 타입 목록보다 앞이다. 헌장 0-1이 이 도구의 존재 이유로 지목한 화면이라
        { href: '/objects/family', title: `가계도 ${familyCount()}가문`, ready: true },
        ...typeCounts()
        // 개수순. 인물 262가 먼저고 시대 6이 나중이다
        .sort((a, b) => b.count - a.count)
        .map(({ type, count }) => ({
          href: `/objects/${type}`,
          // 개수를 라벨에 적는다 — "눌러도 되나"라는 망설임이 없어진다 (RESEARCH R-E)
          title: `${TYPE_KO[type]} ${count}`,
          ready: true,
        })),
      ],
    },
    {
      href: '/download',
      title: '가져가기',
      ready: true,
      /*
        받는 단위 셋(River #6). 자식이 없어 푸터 「가져가기」 칸이 비고 사이드바도
        형제 중 혼자 단항이었다. 이 셋은 별도 라우트가 아니라 `/download` 한 장의
        절 앵커다 — `app/download/page.tsx`가 같은 id로 `<section>`을 굽는다.
        해시 앵커는 `navSteps`의 이전·다음에서 뺀다(같은 페이지로 튀지 않게).
      */
      children: [
        { href: '/download#bundle', title: '전체 자료 한 묶음', ready: true },
        { href: '/download#data', title: '인물·관계 데이터만', ready: true },
        { href: '/download#points', title: '포인트별 표', ready: true },
      ],
    },
    {
      href: '/use',
      title: '활용하기',
      ready: true,
      children: USE.map(([href, title]) => ({ href, title, ready: true })),
    },
  ]
}

// 빌드 한 번에 70장 넘게 그린다. 장마다 `points/`를 다시 읽을 이유가 없다
let cached: NavNode[] | undefined

export function navTree(): NavNode[] {
  return (cached ??= build())
}

/** 깊이우선. 부모가 자식보다 먼저 온다 — 사이드바에 보이는 순서 그대로다 */
export function navFlat(tree: NavNode[] = navTree(), opts: { readyOnly?: boolean } = {}): NavNode[] {
  const { readyOnly = true } = opts
  const out: NavNode[] = []
  const walk = (nodes: NavNode[]) => {
    for (const n of nodes) {
      if (readyOnly && !n.ready) continue
      out.push(n)
      if (n.children) walk(n.children)
    }
  }
  walk(tree)
  return out
}

export function navFind(href: string, tree: NavNode[] = navTree()): NavNode | undefined {
  return navFlat(tree, { readyOnly: false }).find((n) => n.href === href)
}

/**
 * 트리 밖에 있는 화면의 이름. 사이드바에는 안 걸리지만 본문에서 링크로 불린다.
 *
 * 이 표가 있는 이유는 하나다 — **이름을 두 군데 적지 않기 위해서다.** 자주 묻는 것의
 * 「이어서」 링크가 라벨을 직접 들고 있었더니, 2026-08-19에 「스킬 여덟」을 「스킬」로
 * 고치는 순간 여섯 자리가 옛 이름을 부르게 됐다.
 */
const OFF_TREE: Record<string, string> = {
  // nav·푸터·빵부스러기 이름은 「About」(River #10 개명 지시). 온페이지 H1은 한국어
  // 문장("이 자료실은")으로 남긴다 — 전한국어 톤에 영문 제목 한 줄이 튀지 않게
  '/about': 'About',
  '/changelog': '바뀐 것',
  '/faq': '자주 묻는 것',
}

/** 주소로 화면 이름을 찾는다. 못 찾으면 주소를 그대로 낸다 — 빈 링크보다 낫다 */
export function navLabel(href: string): string {
  return navFind(href)?.title ?? OFF_TREE[href] ?? href
}

/** 루트부터 자기까지. 못 찾으면 빈 배열 — 화면이 죽는 것보다 빵부스러기가 없는 게 낫다 */
export function navCrumbs(href: string, tree: NavNode[] = navTree()): NavNode[] {
  const walk = (nodes: NavNode[], trail: NavNode[]): NavNode[] | undefined => {
    for (const n of nodes) {
      const here = [...trail, n]
      if (n.href === href) return here
      const hit = n.children && walk(n.children, here)
      if (hit) return hit
    }
  }
  return walk(tree, []) ?? []
}

export function navSteps(
  href: string,
  tree: NavNode[] = navTree(),
): { prev?: NavNode; next?: NavNode } {
  // 해시 앵커(가져가기의 절들)는 별도 화면이 아니라 한 페이지 안 자리다 — 이전·다음이
  // 같은 페이지로 튀지 않게 뺀다. 사이드바·푸터에는 그대로 남는다(navFlat은 안 거른다)
  const flat = navFlat(tree).filter((n) => !n.href.includes('#'))
  const i = flat.findIndex((n) => n.href === href)
  if (i === -1) return {}
  return { prev: flat[i - 1], next: flat[i + 1] }
}
