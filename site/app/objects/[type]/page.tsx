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
import { FocusExit } from '../../../components/FocusExit'
import { ENTITY_TYPES, loadEntities, type Entity } from '../../../lib/ontology'
import { entityHref } from '../../../lib/entity'
import { TYPE_KO } from '../../../lib/export/table'
import { navCrumbs } from '../../../lib/nav'
import { pageMeta } from '../../../lib/meta'
import { byChoseong, bucketId } from '../../../lib/choseong'

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

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  return pageMeta(TYPE_KO[type] ?? type)
}

export default async function ObjectType({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const href = `/objects/${type}`
  const ko = TYPE_KO[type] ?? type

  const list = ALL.filter((e) => e.type === type).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const crumbs = navCrumbs(href)
  const buckets = byChoseong(list, (e) => e.name)

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

      {/*
        **가나다 색인.** 인물 262명이 폰에서 20화면(16,707px)이었고 걸러낼 방법이
        화면 안에 없었다(감사 2026-08-17). 상단 「찾기」가 있긴 하지만 목록에
        들어온 사람은 **훑어보려고** 들어온 것이라 검색으로 되돌리면 동선이 어긋난다.

        칸이 적은 목록(가문 6·시대 6)에는 안 붙인다 — 색인이 목록보다 길어진다.
      */}
      {buckets.length > 4 ? (
        <Stack direction="horizontal" gap={2} wrap="wrap" as="nav">
          {buckets.map((b, i) => (
            <Text key={b.key} size="sm">
              <a href={`#${bucketId(i)}`}>{b.key}</a>
              <Text size="sm" color="secondary" as="span">
                {' '}
                {b.items.length}
              </Text>
            </Text>
          ))}
        </Stack>
      ) : null}

      {buckets.map((b, i) => (
        <Stack key={b.key} direction="vertical" gap={1} id={bucketId(i)} as="section">
          {buckets.length > 4 ? (
            <Text size="sm" weight="semibold" color="secondary">
              {b.key}
            </Text>
          ) : null}
          <List density="balanced" hasDividers>
            {b.items.map((e) => (
              <ListItem
                key={e.id}
                label={e.name}
                description={lead(e)}
                href={entityHref({ id: e.id, type: e.type, name: e.name })}
              />
            ))}
          </List>
        </Stack>
      ))}

      {/* 집중해서 읽기에서 나가는 길. 사연은 `app/objects/[type]/[slug]/page.tsx`에 적었다 */}
      <FocusExit />
    </Shell>
  )
}
