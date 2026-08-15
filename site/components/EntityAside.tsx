import { Stack, Text, Heading, Collapsible } from '@astryxdesign/core'
import { EgoGraph, type GraphNode, type GraphEdge } from './EgoGraph'
import { entityHref, type Neighbor, type CoOccur } from '../lib/entity'
import type { Entity } from '../lib/ontology'

/**
 * 객체 한 장의 우측 날개 — 「이건 무엇과 이어져 있나」.
 *
 * 두 칸이 이 순서로 온다. 관계 목록 → 같은 포인트에 함께 나온 것.
 * **목록이 먼저다.** 그림은 보조지 유일한 표현이 아니고, 이름이 Ctrl+F에
 * 잡혀야 한다. 그림 자체는 `EntityGraph`가 본문 칸에 그린다 — 날개(220px)에서는
 * 노드 55개가 뭉쳐 라벨이 안 읽혔다.
 *
 * **관계가 0이면 「연결」과 그림을 아예 안 그린다.** 실측상 객체 217개(33.7%)가
 * 관계 0이다. 그 3분의 1에게 빈 상자를 보여주면 사이트가 고장 난 것처럼 보인다.
 * 그 페이지들은 동석 칸 하나로 산다 — 그게 동석 축이 있는 이유다.
 *
 * 동석은 관계가 아니다. 절을 갈라 놓고, 실선/점선으로 갈라 놓고, 범례 밑에
 * 한 줄로 못 박는다 (DESIGN P7).
 */

/** 그림이 이보다 커지면 글자가 겹쳐서 아무것도 안 읽힌다. 로마는 관계만 64건이다 */
const MAX_NODES = 40
/** 목록이 이보다 길면 날개가 본문보다 길어진다. 나머지는 접는다 */
const SHOWN = 8

const pad = (n: number) => String(n).padStart(2, '0')

function NeighborRow({ n }: { n: Neighbor }) {
  return (
    <Text size="sm">
      {n.label} — <a href={entityHref(n.ref)}>{n.ref.name}</a>
      <Text size="sm" color="secondary" as="span">
        {' '}
        (포인트 {pad(n.point)})
      </Text>
    </Text>
  )
}

/**
 * 관계망 그림. **우측 날개가 아니라 본문 칸에 그린다.**
 *
 * 처음에는 날개(220px)에 뒀는데 노드가 55개면 라벨이 뭉쳐 읽히지 않았다(카이사르
 * 실측). 날개에는 같은 내용이 **글로** 남아 있으므로(연결 목록) 그림은 읽히는 자리로
 * 옮긴다 — 헌장 3절 예외의 조건은 「관계 목록이 정적 HTML로 남을 것」이지
 * 「그림이 날개에 있을 것」이 아니다.
 */
export function EntityGraph({ e, nbrs, co }: { e: Entity; nbrs: Neighbor[]; co: CoOccur[] }) {
  const { nodes, edges } = graphData(e, nbrs, co)
  if (!nbrs.length) return null
  return (
    <Stack direction="vertical" gap={1.5}>
      <Heading level={2}>관계망</Heading>
      <EgoGraph nodes={nodes} edges={edges} />
      {/* 범례는 그림 바로 아래 항상 있다 (DESIGN P7) */}
      <Text size="sm" color="secondary">
        실선 관계 · 점선 같은 포인트에 함께 나옴. 점을 끌어 옮기고 휠로 확대할 수 있습니다.
      </Text>
    </Stack>
  )
}

function graphData(e: Entity, nbrs: Neighbor[], co: CoOccur[]) {
  // 같은 상대와 관계가 여러 건일 수 있다. 그림에서는 한 점으로 합친다
  const relNodes: GraphNode[] = []
  const seen = new Set<string>()
  for (const n of nbrs) {
    if (seen.has(n.ref.id)) continue
    seen.add(n.ref.id)
    relNodes.push({ id: n.ref.id, label: n.ref.name, href: entityHref(n.ref), kind: 'rel' })
  }

  const coTop = co.slice(0, SHOWN)
  const withCo = 1 + relNodes.length + coTop.length <= MAX_NODES
  const coNodes: GraphNode[] = withCo
    ? coTop
        .filter((c) => !seen.has(c.ref.id))
        .map((c) => ({ id: c.ref.id, label: c.ref.name, href: entityHref(c.ref), kind: 'co' }))
    : []

  return {
    nodes: [{ id: e.id, label: e.name, kind: 'center' } as GraphNode, ...relNodes, ...coNodes],
    edges: [
      ...relNodes.map((n): GraphEdge => ({ source: e.id, target: n.id, kind: 'rel' })),
      ...coNodes.map((n): GraphEdge => ({ source: e.id, target: n.id, kind: 'co' })),
    ],
  }
}

export function EntityAside({ e, nbrs, co }: { e: Entity; nbrs: Neighbor[]; co: CoOccur[] }) {
  return (
    <Stack direction="vertical" gap={4}>
      {nbrs.length ? (
        <Stack direction="vertical" gap={1}>
          <Text size="sm" weight="semibold">
            연결 {nbrs.length}
          </Text>
          {nbrs.slice(0, SHOWN).map((n, i) => (
            <NeighborRow key={`${n.ref.id}-${n.rel}-${n.point}-${i}`} n={n} />
          ))}
          {nbrs.length > SHOWN ? (
            <Collapsible defaultIsOpen={false} trigger={`관계 ${nbrs.length - SHOWN}건 더 보기`}>
              <Stack direction="vertical" gap={1}>
                {nbrs.slice(SHOWN).map((n, i) => (
                  <NeighborRow key={`${n.ref.id}-${n.rel}-${n.point}-${i}`} n={n} />
                ))}
              </Stack>
            </Collapsible>
          ) : null}
        </Stack>
      ) : null}

      {co.length ? (
        <Stack direction="vertical" gap={1}>
          <Text size="sm" weight="semibold">
            같은 포인트에 함께 나온
          </Text>
          {/*
            관계 0인 객체가 217개(33.7%)다. 그 페이지들은 이 칸 하나만 보이므로
            못 박는 한 줄이 그래프 밑이 아니라 **여기** 있어야 한다
          */}
          <Text size="sm" color="secondary">
            같은 대목에 함께 나왔다는 뜻이지 둘 사이에 관계가 있다는 뜻은 아닙니다.
          </Text>
          {co.map((c) => (
            <Text key={c.ref.id} size="sm">
              <a href={entityHref(c.ref)}>{c.ref.name}</a>
              <Text size="sm" color="secondary" as="span">
                {' '}
                (포인트 {c.points.join(', ')})
              </Text>
            </Text>
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}
