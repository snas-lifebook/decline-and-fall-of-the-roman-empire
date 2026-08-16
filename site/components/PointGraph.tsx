import { Stack, Heading, Text } from '@astryxdesign/core'
import { EgoGraph, type GraphNode, type GraphEdge } from './EgoGraph'
import { entityHref } from '../lib/entity'
import type { Entity, Link } from '../lib/ontology'

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

  const nodes: GraphNode[] = [...ids].flatMap((id) => {
    const e = byId.get(id)
    return e
      ? [{ id, label: e.name, href: entityHref({ id, type: e.type, name: e.name }), kind: 'rel' as const }]
      : []
  })
  const edges: GraphEdge[] = here
    .filter((l) => byId.has(l.from) && byId.has(l.to))
    .map((l) => ({ source: l.from, target: l.to, kind: 'rel' as const }))

  return (
    <Stack direction="vertical" gap={1.5} as="section">
      <Heading level={2}>이 포인트의 관계망</Heading>
      <Text color="secondary">
        이 대목에 나온 관계 {edges.length}건입니다. 점을 끌어 옮기고 휠로 확대할 수 있습니다.
      </Text>
      <EgoGraph nodes={nodes} edges={edges} />
      <Text size="sm" color="secondary">
        관계가 달린 것만 그립니다. 이름만 나온 인물·지명은 아래 목록에 있습니다.
      </Text>
    </Stack>
  )
}
