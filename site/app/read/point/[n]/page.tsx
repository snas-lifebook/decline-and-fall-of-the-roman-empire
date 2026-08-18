import Link from 'next/link'
import {
  Stack,
  Heading,
  Text,
  Divider,
  Badge,
  Breadcrumbs,
  BreadcrumbItem,
  Collapsible,
} from '@astryxdesign/core'
import { Shell } from '../../../../components/Shell'
import { CopyPageButton } from '../../../../components/CopyPageButton'
import { docSections } from '../../../../lib/doc'
import { navCrumbs, navSteps } from '../../../../lib/nav'
import { POINT_COUNT } from '../../../../lib/points'
import { pointDoc } from '../../../../lib/text/point'
import { pageMeta } from '../../../../lib/meta'
import { PointGraph } from '../../../../components/PointGraph'
import { ReadGrid } from '../../../../components/ReadGrid'
import { CardFilter } from '../../../../components/CardFilter'
import { Faq } from '../../../../components/Faq'
import { faqFor } from '../../../../lib/faq'
import { loadEntities, loadLinks } from '../../../../lib/ontology'
import { readLayout } from '../../../../lib/read/cards'

/**
 * 포인트 한 장의 본문.
 *
 * `DocPage`를 그대로 못 쓴다 — 그쪽은 `content/`에서 읽고 여기는 레포 루트의
 * `points/`에서 읽는다. 그래서 **뼈대만 본떠서** 같은 순서로 조립한다.
 *
 * **2026-08-18에 오른쪽을 갈아엎었다.** 전에는 날개에 목차와 관계망이 붙어 있었는데,
 * 이제 그 자리를 **여백 카드**가 쓴다 — 본문에 인물 이름이 나오면 그게 누구인지가
 * 옆에 뜬다(NYT Snow Fall 방식, River 요청). 카드는 스크롤을 따라 바뀌지 않고 그
 * 사람이 **처음 나오는 문단 옆에 박혀** 있다.
 *
 * 그래서 셋이 자리를 옮겼다.
 *   - 목차  → 본문 맨 위 접힌 블록. 포인트 본문은 절이 3~6개라 접으면 한 줄이다
 *   - 관계망 → 본문 끝. 「이 대목의 관계망」으로 이름을 달았다
 *   - 본문  → `Shell`의 날개를 안 쓰고 `ReadGrid`가 자기 그리드를 갖는다
 *
 * 관계망을 없애지 않은 것은 2026-08-16에 River가 직접 요청해 넣은 것이기 때문이다.
 */

const ENTITIES = loadEntities()
const LINKS = loadLinks()

export function generateStaticParams() {
  return Array.from({ length: POINT_COUNT }, (_, i) => ({ n: String(i + 1) }))
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n)
  const { title, lead } = pointDoc(n)
  return pageMeta(`포인트 ${String(n).padStart(2, '0')} ${title}`, lead || undefined)
}

export default async function Point({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n)
  const href = `/read/point/${n}`
  const { title, lead, md } = pointDoc(n)

  const crumbs = navCrumbs(href)
  const { prev, next } = navSteps(href)
  const layout = readLayout(n, md, ENTITIES, LINKS)
  // 목차만 여기서 쓴다. 본문 자르기는 `ReadGrid`가 블록 단위로 다시 한다
  const { sections } = docSections(md)

  // 제목·꼬리는 본문 폭에 맞추고, 본문만 카드 폭까지 넓게 쓴다
  const NARROW = { maxWidth: 760, width: '100%' } as const

  return (
    <Shell path={href} where={`읽기 ${title}`} maxWidth={760 + 24 + 340}>
      <Breadcrumbs variant="supporting" style={NARROW}>
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        {crumbs.map((c, i) => (
          <BreadcrumbItem key={c.href} href={c.href} isCurrent={i === crumbs.length - 1}>
            {c.title}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5} style={NARROW}>
        <Text size="sm" color="secondary">
          포인트 {n}
        </Text>
        <Heading level={1}>{title}</Heading>
        {lead ? (
          <Text size="lg" color="secondary">
            {lead}
          </Text>
        ) : null}
        <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
          <Badge variant="neutral" label="30포인트 편역본" />
          {/* 붙여넣는 사람은 이게 무슨 글인지부터 알아야 한다. 제목과 소개를 같이 싣는다 */}
          <CopyPageButton markdown={`# ${title}\n\n${lead}\n\n${md}\n`} />
        </Stack>
      </Stack>

      <Divider />

      {/*
        목차가 날개에서 여기로 내려왔다. 접어두면 한 줄이라 본문을 안 밀어내고,
        절이 어디까지 있는지 궁금할 때만 편다. 포인트 본문은 절이 3~6개다.
      */}
      {/*
        접힌 것 둘을 나란히 둔다 — 「어디까지 있나」(목차)와 「옆에 무엇을 세울까」
        (카드 종류). 둘 다 펴기 전에는 한 줄이라 본문을 안 밀어낸다.
      */}
      <Stack direction="horizontal" gap={4} wrap="wrap" style={NARROW}>
        <CardFilter />
      </Stack>

      {sections.length > 1 ? (
        <div style={NARROW}>
          <Collapsible defaultIsOpen={false} trigger={`이 대목의 절 ${sections.length}개`}>
            <Stack direction="vertical" gap={1} hAlign="start">
              {sections.map((s) => (
                <Text key={s.id} size="sm" color="secondary">
                  <a href={`#${s.id}`}>{s.title}</a>
                </Text>
              ))}
            </Stack>
          </Collapsible>
        </div>
      ) : null}

      {/* 본문 + 여백 카드. 간격은 `globals.css`의 H2 마진이 정한다 */}
      <ReadGrid layout={layout} />

      {/*
        **말없이 자르지 않는다.** 포인트 13은 27명이 나와서 다 세우면 네 문단 중
        셋에 카드가 붙는다. 관계가 얽힌 순으로 잘랐고, 몇 중 몇인지 여기 적는다.
        관계 연표가 쓰는 방식과 같다.
      */}
      {layout.total > layout.cards.length ? (
        <div style={NARROW}>
          <Text size="sm" color="secondary">
            이 대목에 서술이 딸린 인물·집단이 {layout.total}이라, 관계가 많이 얽힌{' '}
            {layout.cards.length}만 옆에 세웠습니다. 나머지는 본문 링크로 있습니다.
          </Text>
        </div>
      ) : null}

      {/*
        관계망이 날개에서 본문 끝으로 내려왔다 — 그 자리를 여백 카드가 쓴다.
        카드가 「이 사람이 누구인가」에 답하므로, 그림은 다 읽고 나서 「그래서
        누가 누구 편이었나」를 되짚는 자리가 더 맞는다.
      */}
      <div style={NARROW}>
        <Stack direction="vertical" gap={1.5} as="section">
          <Heading level={2}>이 대목의 관계망</Heading>
          <PointGraph point={n} entities={ENTITIES} links={LINKS} />
        </Stack>
      </div>

      {/*
        **본문에서 표로 가는 길.** 감사(2026-08-17)가 잡은 동선 결함이다 — 30장
        어디에도 `/download/N` 단서가 없어서, 본문을 읽고 발표 표가 필요해진
        사람이 사이드바 「가져가기」로 나가 포인트를 다시 골라야 했다(+2클릭).
        읽던 자리에서 바로 넘어간다.
      */}
      <Stack direction="vertical" gap={1} as="section" style={NARROW}>
        <Heading level={2}>이 대목을 표로 받기</Heading>
        <Text color="secondary">
          여기 나온 인물·지명을 <Link href={`/download/${n}`}>표 한 장</Link>으로 받아 시트에
          붙여넣을 수 있습니다.
        </Text>
      </Stack>

      <div style={NARROW}>
        <Faq items={faqFor(href)} />
      </div>

      <Stack direction="horizontal" gap={3} justify="between" wrap="wrap" style={NARROW}>
        <Text size="sm" color="secondary">
          {prev ? <a href={prev.href}>← {prev.title}</a> : null}
        </Text>
        <Text size="sm" color="secondary">
          {next ? <a href={next.href}>{next.title} →</a> : null}
        </Text>
      </Stack>
    </Shell>
  )
}
