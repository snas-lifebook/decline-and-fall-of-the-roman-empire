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

/**
 * `X --child_of--> Y` 는 **"X는 Y의 자식"**이다. 영어 이름 그대로 읽는다.
 * 2026-08-14 확정 — 노트 본문과 다수 링크가 이 방향이고, 반대로 읽히는
 * 소수(`안쿠스 마르키우스 --child_of--> 카이사르`)는 데이터 오류로 본다.
 */
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

  const boxOf = (p: FamilyPerson) => {
    const labelW = textWidth(p.label, fontSize, hangulAdvance)
    const noteW = p.note ? textWidth(p.note, fontSize * 0.75, hangulAdvance) : 0
    return {
      width: Math.max(labelW, noteW) + DEFAULTS.padX * 2,
      height: DEFAULTS.nodeHeight + (p.note ? DEFAULTS.noteHeight : 0),
    }
  }

  /**
   * 부부는 **한 노드로 묶어서** 배치한다. 혼인을 별도 노드로 세워 엣지로
   * 이으면 계층 알고리즘이 rank를 한 칸씩 먹어 부부가 두 세대 벌어진다
   * (2026-08-14 유스티니아누스·테오도라에서 실제로 벌어졌다). dagre에는
   * same-rank 제약이 없고 `minlen: 0`은 엣지 라우팅을 깨뜨린다.
   * 배치가 끝난 뒤 이 묶음을 사람 둘 + 혼인점으로 펼친다.
   *
   * ponytail: 한 사람이 두 번 혼인하면 첫 번째만 묶는다. 두 번째 배우자는
   * 그냥 옆 노드로 서고 혼인선이 안 그려진다 — 지금 데이터에 그런 경우가
   * 없다. 생기면 그때 채널을 하나 더 판다.
   */
  const coupleOf = new Map<string, string>() // personId -> coupleNodeId
  const couples: { id: string; a: FamilyPerson; b: FamilyPerson }[] = []
  for (const m of marriages) {
    if (coupleOf.has(m.from) || coupleOf.has(m.to)) continue
    const id = unionId(m.from, m.to)
    const a = known.get(m.from)!
    const b = known.get(m.to)!
    couples.push({ id, a, b })
    coupleOf.set(m.from, id)
    coupleOf.set(m.to, id)
  }

  for (const p of people) {
    if (coupleOf.has(p.id)) continue
    g.setNode(p.id, boxOf(p))
  }
  for (const c of couples) {
    const ba = boxOf(c.a)
    const bb = boxOf(c.b)
    g.setNode(c.id, {
      width: ba.width + DEFAULTS.unionSize + DEFAULTS.nodeSep * 2 + bb.width,
      height: Math.max(ba.height, bb.height),
    })
  }

  /** 사람 id를 그래프에서 실제로 서는 노드 id로 바꾼다 */
  const graphId = (personId: string) => coupleOf.get(personId) ?? personId

  for (const c of children) {
    // `from`이 자식, `to`가 부모다. 그래프 엣지는 부모에서 자식으로 내린다.
    const parent = graphId(c.to)
    const child = graphId(c.from)
    if (parent !== child) g.setEdge(parent, child)
  }

  dagre.layout(g)

  const nodes: LayoutNode[] = []
  for (const id of g.nodes()) {
    const n = g.node(id)
    const person = known.get(id)
    if (person) {
      nodes.push({ id, kind: 'person', x: n.x, y: n.y, width: n.width, height: n.height, label: person.label, note: person.note })
      continue
    }
    // 부부 묶음을 사람 둘 + 혼인점으로 펼친다
    const couple = couples.find((c) => c.id === id)!
    const ba = boxOf(couple.a)
    const bb = boxOf(couple.b)
    const left = n.x - n.width / 2
    nodes.push({ id: couple.a.id, kind: 'person', x: left + ba.width / 2, y: n.y, ...ba, label: couple.a.label, note: couple.a.note })
    nodes.push({ id, kind: 'union', x: n.x, y: n.y, width: DEFAULTS.unionSize, height: DEFAULTS.unionSize })
    nodes.push({ id: couple.b.id, kind: 'person', x: left + n.width - bb.width / 2, y: n.y, ...bb, label: couple.b.label, note: couple.b.note })
  }

  const center = new Map(nodes.map((n) => [n.id, n]))

  const familyEdges: LayoutEdge[] = g.edges().map((e) => ({
    kind: 'family' as const,
    from: e.v,
    to: e.w,
    points: g.edge(e).points.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y })),
  }))

  // 부부를 잇는 짧은 선. 배치가 아니라 표시용이라 좌표에서 바로 만든다.
  for (const c of couples) {
    const a = center.get(c.a.id)
    const b = center.get(c.b.id)
    if (a && b) {
      familyEdges.push({
        kind: 'family',
        from: c.a.id,
        to: c.b.id,
        points: [{ x: a.x + a.width / 2, y: a.y }, { x: b.x - b.width / 2, y: b.y }],
      })
    }
  }

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
