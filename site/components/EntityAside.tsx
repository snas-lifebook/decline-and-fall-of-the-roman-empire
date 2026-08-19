import { Stack, Text, Heading, Collapsible } from '@astryxdesign/core'
import { EgoGraph, type GraphNode, type GraphEdge } from './EgoGraph'
import { pickNodes } from '../lib/graph/size'
import { entityHref, type Neighbor, type CoOccur } from '../lib/entity'
import type { Entity } from '../lib/ontology'

/**
 * 객체 한 장의 우측 날개 — 「이건 무엇과 이어져 있나」.
 *
 * 두 칸이 이 순서로 온다. 관계망 그림 → 관계 목록.
 * **그림 밑에 늘 목록이 있다.** 그림은 보조지 유일한 표현이 아니고, 이름이
 * Ctrl+F에 잡혀야 한다 — 헌장 3절 예외의 조건이 그것이다.
 *
 * **관계가 0이면 날개를 통째로 안 낸다.** 실측상 객체 217개(33.7%)가 관계 0이다.
 * 그 3분의 1에게 빈 상자를 보여주면 사이트가 고장 난 것처럼 보인다. 그 화면들은
 * 2단을 안 만들고 본문 한 칸으로 산다.
 *
 * **동석이 여기서 나갔다 (2026-08-19).** 날개가 화면보다 길어서 **안에 스크롤이
 * 하나 더 생기고 있었다** — 카이사르에서 실측 990px 내용이 852px 상자에 들어가
 * 있었다. 읽기 화면은 8/18에 스크롤을 하나로 줄였는데 객체 644장이 안 따라왔다.
 * 넘치는 것의 정체는 동석 12줄(378px)이었고, 그건 관계가 아니라 「같은 대목에
 * 나왔다」는 딴 축이라 본문으로 내려보냈다(`CoOccurred`). 남은 날개는 그림 343 +
 * 목록 237 = 596px로 화면 안에 든다.
 *
 * 동석은 관계가 아니다. 칸을 갈라 놓고, 실선/점선으로 갈라 놓고, 범례 밑에
 * 한 줄로 못 박는다 (DESIGN P7).
 */

/**
 * 그림이 이보다 커지면 글자가 겹쳐서 아무것도 안 읽힌다. 로마는 관계만 64건이다.
 *
 * 40 → 18 → 10으로 내려왔다. 마지막은 그림을 **날개(300px)로 옮기면서**다.
 * 보이는 글씨 크기는 `글씨크기 ÷ viewBox폭 × 칸너비`라, 칸이 760에서 300으로
 * 줄면 개수를 같이 줄이지 않고는 못 읽는다.
 */
const MAX_NODES = 10
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
 * 관계망 그림. **우측 날개 맨 위** (River 요청, 2026-08-16).
 *
 * 한 번 왕복했다. 처음엔 날개(220px)에 뒀는데 노드 55개가 뭉쳐 안 읽혀 본문
 * 칸으로 뺐고, 이번에 다시 날개로 왔다. **이번엔 되는 이유가 있다** — 그때는
 * 개수도 배치도 그대로 두고 자리만 옮겼고, 지금은 라벨 폭 기준 충돌(`lib/graph/size`)로
 * 겹침을 없앤 뒤 개수를 10으로 맞췄다. 자리를 옮길 때 **같이 줄여야 하는 것**이
 * 개수라는 걸 그때는 몰랐다.
 *
 * 읽기 화면의 `PointGraph`와 같은 자리·같은 규칙이다.
 */
export function EntityGraph({ e, nbrs, co }: { e: Entity; nbrs: Neighbor[]; co: CoOccur[] }) {
  const { nodes, edges, dropped } = graphData(e, nbrs, co)
  if (!nbrs.length) return null
  return (
    <Stack direction="vertical" gap={1}>
      <Text size="sm" weight="semibold">
        관계망
      </Text>
      <EgoGraph nodes={nodes} edges={edges} />
      {/* 범례는 그림 바로 아래 항상 있다 (DESIGN P7) */}
      <Text size="sm" color="secondary">
        실선 관계 · 점선 같은 포인트에 함께 나옴. 점을 끌어 옮기고 휠로 확대할 수 있습니다.
        {/* 잘라놓고 말 안 하면 다 그린 것처럼 읽힌다 */}
        {dropped ? ` 연결이 많은 것부터 ${nodes.length}개만 그렸고 ${dropped}개는 아래 목록에 있습니다.` : ''}
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

  // 관계가 40건 넘는 객체(로마 64건)는 여기서 잘린다. 자른 개수는 화면이 밝힌다
  return pickNodes(
    [{ id: e.id, label: e.name, kind: 'center' } as GraphNode, ...relNodes, ...coNodes],
    [
      ...relNodes.map((n): GraphEdge => ({ source: e.id, target: n.id, kind: 'rel' })),
      ...coNodes.map((n): GraphEdge => ({ source: e.id, target: n.id, kind: 'co' })),
    ],
    MAX_NODES,
  )
}

/** 동석은 12개까지만 낸다. 로마는 460개다 — 다 뿌리면 한 칸이 화면을 삼킨다 */
export const CO_SHOWN = 12

/** 우측 날개의 관계 목록. 그림(`EntityGraph`) 바로 아래 선다 */
export function EntityAside({ nbrs }: { nbrs: Neighbor[] }) {
  if (!nbrs.length) return null
  return (
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
  )
}

/**
 * 같은 포인트에 함께 나온 것 — **본문 칸이다**(2026-08-19에 날개에서 내려왔다).
 *
 * 자리를 옮긴 이유는 폭이 아니라 **높이**다. 날개에서 이 칸 하나가 378px였고,
 * 그 때문에 날개가 990px이 되어 852px 화면 안에서 **혼자 굴러가고 있었다** —
 * 폰에서는 300px짜리 상자 안의 스크롤이라 더 나쁘다(390px 실측: 796px 상자에
 * 990px 내용). 읽기 화면이 8/18에 없앤 그 두 번째 스크롤이 여기 남아 있었다.
 *
 * 내용은 한 줄도 안 줄였다. 자리만 바뀌었고 폭은 300 → 760으로 오히려 넓어진다.
 *
 * 「등장 포인트」 바로 뒤에 선다 — 둘 다 **같은 대목**이라는 한 축의 물음이라
 * 「이게 어디 나왔나」 다음에 「거기 또 누가 있었나」가 오는 것이 자연스럽다.
 */
export function CoOccurred({
  co,
  coTotal,
}: {
  co: CoOccur[]
  /** 자르기 **전** 개수. 자른 사실을 화면이 말해야 한다 (헌장 0-4) */
  coTotal: number
}) {
  if (!co.length) return null
  return (
    <Stack direction="vertical" gap={2} as="section">
      <Heading level={2}>같은 포인트에 함께 나온</Heading>
      {/*
        관계 0인 객체가 217개(33.7%)다. 그 화면들은 날개가 아예 없어 이 칸이
        유일한 「이어진 것」이므로, 못 박는 한 줄이 여기 있어야 한다
      */}
      {/*
        **자른 사실을 말한다.** 관계망(10개)·연표(24행)·관계 목록(8개)은 전부
        「N건 중 M개」를 밝히는데 이 칸만 빠져 있었다(감사 2026-08-17). 644개 중
        633개가 잘리고 그중 213개는 관계가 0이라 **이 칸이 화면의 유일한 내용**이다.
        그 사람들이 12개를 전부로 읽고 있었다.
      */}
      <Text size="sm" color="secondary">
        같은 대목에 함께 나왔다는 뜻이지 둘 사이에 관계가 있다는 뜻은 아닙니다.
        {coTotal > co.length
          ? ` 함께 나온 것이 ${coTotal}개인데 자주 겹치는 것부터 ${co.length}개만 뒀습니다.`
          : ''}
      </Text>
      <Stack direction="vertical" gap={1}>
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
    </Stack>
  )
}
