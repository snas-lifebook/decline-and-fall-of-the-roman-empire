import {
  Stack,
  Heading,
  Text,
  Divider,
  Badge,
  Breadcrumbs,
  BreadcrumbItem,
  List,
  ListItem,
} from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { ENTITY_TYPES, loadEntities, type Entity } from '../../../lib/ontology'
import { entityHref } from '../../../lib/entity'
import { TYPE_KO } from '../../../lib/export/table'
import { navCrumbs } from '../../../lib/nav'

/**
 * 타입 하나의 객체 전부.
 *
 * 인물이 262개다. 책에 나온 순서로 늘어놓으면 **찾을 수가 없다** — 가나다순으로
 * 고정한다. 개수는 제목 옆 배지로 먼저 보여준다. "스크롤이 얼마나 남았나"를
 * 모르는 채로 262줄을 내려가게 두지 않는다.
 */

// 장 7개를 그리는 데 파일을 7번 읽을 이유가 없다
const ALL = loadEntities()

export function generateStaticParams() {
  return ENTITY_TYPES.map((type) => ({ type }))
}

export default async function ObjectType({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const href = `/objects/${type}`
  const ko = TYPE_KO[type] ?? type

  const list = ALL.filter((e) => e.type === type).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const crumbs = navCrumbs(href)

  // 22개 객체는 대표 설명 없이 포인트별 서술만 갖는다. 빈 줄 대신 첫 서술을 쓴다
  const lead = (e: Entity) => e.desc ?? e.descs[0]?.desc ?? ''

  return (
    <Shell path={href} where={`찾아보기 ${ko}`}>
      <Breadcrumbs variant="supporting">
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        {crumbs.map((c, i) => (
          <BreadcrumbItem key={c.href} href={c.href} isCurrent={i === crumbs.length - 1}>
            {c.title}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>{ko}</Heading>
        <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
          <Badge variant="neutral" label={`${ko} ${list.length}`} />
          <Text size="sm" color="secondary">
            가나다순
          </Text>
        </Stack>
      </Stack>

      <Divider />

      <List density="balanced" hasDividers>
        {list.map((e) => (
          <ListItem
            key={e.id}
            label={e.name}
            description={lead(e)}
            href={entityHref({ id: e.id, type: e.type, name: e.name })}
          />
        ))}
      </List>
    </Shell>
  )
}
