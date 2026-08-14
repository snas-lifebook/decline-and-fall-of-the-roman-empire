import dagre from '@dagrejs/dagre'

/**
 * 가계도 좌표를 빌드 시점에 계산한다. React도 DOM도 모른다.
 *
 * 규칙 하나가 이 파일의 전부다 — **계승(succeeded)은 레이아웃을 흔들지 않는다.**
 * 제위계승은 혈연과 다른 축이라(`family/족보_표기_설계.md`) 계층 알고리즘에
 * 넣으면 rank 제약으로 취급돼 세대 행이 무너진다. 2026-08-14 스파이크에서
 * 실제로 무너졌다. 그래서 레이아웃은 혈연·혼인으로만 하고 계승은 좌표가
 * 나온 뒤 오버레이 엣지로 얹는다.
 */

export type FamilyPerson = {
  id: string
  label: string
  /** 동명이인 구분 문구. 라벨 아래 작게 붙는다 — "한니발의 동생" */
  note?: string
}

/** `X --child_of--> Y` 는 "X의 자녀가 Y"다. 이름과 반대로 읽는다 (AGENTS.md 함정). */
export type FamilyRel = 'child_of' | 'married' | 'succeeded'

export type FamilyLink = { from: string; rel: FamilyRel; to: string }

export type LayoutNode = {
  id: string
  kind: 'person' | 'union'
  /** 중심 좌표 */
  x: number
  y: number
  width: number
  height: number
  label?: string
  note?: string
}

export type LayoutEdge = {
  /** 혈연·혼인은 `family`, 제위계승은 `succession`. 굵기가 다르다 */
  kind: 'family' | 'succession'
  from: string
  to: string
  points: { x: number; y: number }[]
}

export type FamilyLayout = {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  width: number
  height: number
}

export type LayoutOptions = {
  fontSize?: number
  /** 한글 음절 advance. Apple SD Gothic Neo 실측 0.865em. 웹폰트 바꾸면 다시 잰다 */
  hangulAdvance?: number
}

const DEFAULTS = {
  fontSize: 15,
  hangulAdvance: 0.865,
  padX: 14,
  nodeHeight: 44,
  noteHeight: 14,
  unionSize: 10,
  rankSep: 56,
  nodeSep: 24,
  margin: 16,
} as const

const isHangul = (c: string) => c >= '가' && c <= '힣'

/**
 * 한글 라벨 폭. 한글 음절은 advance가 균일해서(실측) 빌드 시점에 정확히 나온다.
 * 라틴 가변폭보다 오히려 쉽다.
 */
export function textWidth(s: string, fontSize: number, hangulAdvance: number = DEFAULTS.hangulAdvance): number {
  return [...s].reduce((w, c) => {
    const adv = isHangul(c) ? hangulAdvance : /[0-9]/.test(c) ? 0.5 : /[A-Za-z]/.test(c) ? 0.55 : 0.35
    return w + fontSize * adv
  }, 0)
}

const unionId = (a: string, b: string) => `union:${[a, b].sort().join('+')}`

export function layoutFamily(
  people: FamilyPerson[],
  links: FamilyLink[],
  opts: LayoutOptions = {},
): FamilyLayout {
  const fontSize = opts.fontSize ?? DEFAULTS.fontSize
  const hangulAdvance = opts.hangulAdvance ?? DEFAULTS.hangulAdvance

  const known = new Map(people.map((p) => [p.id, p]))
  // 사람 목록에 없는 id를 가리키는 링크는 버린다. 데이터가 덜 찬 상태를 그냥 견딘다.
  const live = links.filter((l) => known.has(l.from) && known.has(l.to))

  const marriages = live.filter((l) => l.rel === 'married')
  const children = live.filter((l) => l.rel === 'child_of')
  const successions = live.filter((l) => l.rel === 'succeeded')

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'TB',
    ranksep: DEFAULTS.rankSep,
    nodesep: DEFAULTS.nodeSep,
    marginx: DEFAULTS.margin,
    marginy: DEFAULTS.margin,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const p of people) {
    const labelW = textWidth(p.label, fontSize, hangulAdvance)
    const noteW = p.note ? textWidth(p.note, fontSize * 0.75, hangulAdvance) : 0
    g.setNode(p.id, {
      width: Math.max(labelW, noteW) + DEFAULTS.padX * 2,
      height: DEFAULTS.nodeHeight + (p.note ? DEFAULTS.noteHeight : 0),
    })
  }

  // 혼인을 노드로 세운다 (족보_표기_설계.md 방침). 배우자 둘이 이 점으로 모이고
  // 자식은 부모 개인이 아니라 이 점에서 내려온다.
  const spouseUnion = new Map<string, string>()
  for (const m of marriages) {
    const id = unionId(m.from, m.to)
    if (!g.hasNode(id)) {
      g.setNode(id, { width: DEFAULTS.unionSize, height: DEFAULTS.unionSize })
      g.setEdge(m.from, id)
      g.setEdge(id, m.to)
    }
    spouseUnion.set(m.from, id)
    spouseUnion.set(m.to, id)
  }

  for (const c of children) {
    // 부모가 혼인 노드를 가지면 거기서 내린다. 아니면 부모에게 직접 붙인다.
    g.setEdge(spouseUnion.get(c.from) ?? c.from, c.to)
  }

  dagre.layout(g)

  const nodes: LayoutNode[] = g.nodes().map((id) => {
    const n = g.node(id)
    const person = known.get(id)
    return {
      id,
      kind: person ? 'person' : 'union',
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      ...(person ? { label: person.label, note: person.note } : {}),
    }
  })

  const center = new Map(nodes.map((n) => [n.id, n]))

  const familyEdges: LayoutEdge[] = g.edges().map((e) => ({
    kind: 'family' as const,
    from: e.v,
    to: e.w,
    points: g.edge(e).points.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y })),
  }))

  // 계승은 레이아웃이 끝난 뒤에 얹는다. 좌표를 흔들지 않고 두 중심을 잇기만 한다.
  const successionEdges: LayoutEdge[] = successions.flatMap((s) => {
    const a = center.get(s.from)
    const b = center.get(s.to)
    if (!a || !b) return []
    return [{ kind: 'succession' as const, from: s.from, to: s.to, points: [{ x: a.x, y: a.y }, { x: b.x, y: b.y }] }]
  })

  // dagre는 빈 그래프에 -Infinity를 준다. 0으로 눌러 둔다.
  const { width, height } = g.graph()

  return {
    nodes,
    edges: [...familyEdges, ...successionEdges],
    width: Math.max(0, width ?? 0),
    height: Math.max(0, height ?? 0),
  }
}
