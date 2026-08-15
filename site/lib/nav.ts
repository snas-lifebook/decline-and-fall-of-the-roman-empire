import { pointList } from './points'
import { ENTITY_TYPES, loadEntities, type Entity } from './ontology'
import { TYPE_KO } from './export/table'

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

/** 시작하기 여섯 장. 순서가 곧 초보자가 밟는 순서다 */
const START: [string, string][] = [
  ['/start/install', '옵시디언 설치하고 자료 받기'],
  ['/start/open', '볼트로 열고 어디부터 보나'],
  ['/start/plugins', '플러그인 두 개 켜기'],
  ['/start/ai', 'AI에 자료 연결하기'],
  ['/start/update', '갱신 받는 법'],
  ['/start/links', '작업 공간'],
]

/** 타입별 객체 수. 사이드바 라벨에 그대로 실린다 */
function typeCounts(): { type: Entity['type']; count: number }[] {
  const all = loadEntities()
  return ENTITY_TYPES.map((type) => ({ type, count: all.filter((e) => e.type === type).length }))
}

function build(): NavNode[] {
  return [
    {
      href: '/read',
      title: '읽기',
      ready: true,
      children: pointList().map((p) => ({
        href: `/read/point/${p.n}`,
        title: `${String(p.n).padStart(2, '0')} ${p.title}`,
        ready: true,
      })),
    },
    {
      href: '/objects',
      title: '찾아보기',
      ready: true,
      children: typeCounts()
        // 개수순. 인물 262가 먼저고 시대 6이 나중이다
        .sort((a, b) => b.count - a.count)
        .map(({ type, count }) => ({
          href: `/objects/${type}`,
          // 개수를 라벨에 적는다 — "눌러도 되나"라는 망설임이 없어진다 (RESEARCH R-E)
          title: `${TYPE_KO[type]} ${count}`,
          ready: true,
        })),
    },
    { href: '/download', title: '가져가기', ready: true },
    { href: '/use', title: '활용하기', ready: true },
    {
      href: '/start',
      title: '시작하기',
      ready: true,
      children: START.map(([href, title]) => ({ href, title, ready: true })),
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
  const flat = navFlat(tree)
  const i = flat.findIndex((n) => n.href === href)
  if (i === -1) return {}
  return { prev: flat[i - 1], next: flat[i + 1] }
}
