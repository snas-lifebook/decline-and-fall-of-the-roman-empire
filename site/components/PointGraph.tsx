import { Stack, Text } from '@astryxdesign/core'
import { EgoGraph, type GraphNode, type GraphEdge } from './EgoGraph'
import { pickNodes } from '../lib/graph/size'
import { entityHref } from '../lib/entity'
import type { Entity, Link } from '../lib/ontology'

/**
 * 날개(300px)에 들어가는 개수.
 *
 * 본문 칸(760px)에 있을 때는 18개였다. 날개로 옮기면서 내렸다 — 그림이 보이는
 * 크기는 `글씨크기 ÷ viewBox폭 × 칸너비`라, 칸이 760에서 300으로 줄면 같은
 * 18개가 4px 글씨가 된다. **개수를 같이 안 줄이면 옮기는 순간 못 읽는다.**
 * 10개면 viewBox가 330 언저리에 서서 10px쯤으로 보인다(실측).
 */
const MAX = 10

/**
 * 이 포인트 안의 관계망.
 *
 * 객체 화면의 그래프는 **한 사람을 가운데 두고** 뻗지만, 본문 화면은 그러면 안 된다.
 * 여기서 알고 싶은 것은 "이 대목에서 **누가 누구와** 적이고 편인가"이고, 그건 가운데가
 * 없는 그물이다. 헌장 0-1이 이 도구의 존재 이유로 못박아 둔 바로 그 물음이다.
 *
 * 그래서 **그 포인트에 달린 관계만** 골라 그 양 끝을 노드로 세운다. 포인트에
 * 등장하기만 하고 관계가 없는 객체는 안 그린다 — 선 없는 점은 그림을 흐릴 뿐이고,
 * 그 목록은 아래 「등장 객체」가 이미 글로 준다.
 */
export function PointGraph({
  point,
  entities,
  links,
}: {
  point: number
  entities: Entity[]
  links: Link[]
}) {
  const here = links.filter((l) => l.point === point)
  if (here.length < 2) return null

  const byId = new Map(entities.map((e) => [e.id, e]))
  const ids = new Set(here.flatMap((l) => [l.from, l.to]))

  const allNodes: GraphNode[] = [...ids].flatMap((id) => {
    const e = byId.get(id)
    return e
      ? [{ id, label: e.name, href: entityHref({ id, type: e.type, name: e.name }), kind: 'rel' as const }]
      : []
  })
  const allEdges: GraphEdge[] = here
    .filter((l) => byId.has(l.from) && byId.has(l.to))
    .map((l) => ({ source: l.from, target: l.to, kind: 'rel' as const }))

  // 포인트 13은 관계가 64건이다. 다 그리면 글자가 겹쳐 아무것도 안 읽힌다
  const { nodes, edges, dropped } = pickNodes(allNodes, allEdges, MAX)

  return (
    <Stack direction="vertical" gap={1} as="section">
      <Text size="sm" weight="semibold">
        이 포인트의 관계망
      </Text>
      <EgoGraph nodes={nodes} edges={edges} />
      <Text size="sm" color="secondary">
        이 대목의 관계 {allEdges.length}건 중{' '}
        {/* 잘라놓고 말 안 하면 다 그린 것처럼 읽힌다 */}
        {dropped ? `얽힌 갈래가 많은 ${nodes.length}개` : `${nodes.length}개`}를 그렸습니다. 점을
        끌어 옮기고 휠로 확대할 수 있습니다. 나머지는 본문 아래 「등장 객체」에 다 있습니다.
      </Text>
    </Stack>
  )
}
