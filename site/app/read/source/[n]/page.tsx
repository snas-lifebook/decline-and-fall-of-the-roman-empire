import { notFound } from 'next/navigation'
import {
  Stack,
  Heading,
  Text,
  Divider,
  Badge,
  Breadcrumbs,
  BreadcrumbItem,
} from '@astryxdesign/core'
import { Shell } from '../../../../components/Shell'
import { ReadGrid } from '../../../../components/ReadGrid'
import { ReadRail } from '../../../../components/ReadRail'
import { ReadCards } from '../../../../components/ReadCards'
import { bookById, bookHref, sourcePart } from '../../../../lib/book'
import { sourceDoc } from '../../../../lib/text/source'
import { readLayout, rowCount } from '../../../../lib/read/cards'
import { docSections } from '../../../../lib/doc'
import { navSteps } from '../../../../lib/nav'
import { pageMeta } from '../../../../lib/meta'

/**
 * 기번 원전 한 장.
 *
 * 읽는 환경은 편역본과 **똑같다** — 같은 글꼴·크기·바탕 설정이 듣고, 오른쪽 목차도
 * 그대로다. 다른 것은 셋이고 전부 데이터가 없어서 그렇다.
 *
 *   - **여백 카드가 없다.** 온톨로지의 서술은 포인트 번호에 묶여 있고 장 번호에는
 *     안 묶여 있다. 없는 연결을 지어내면 그때부터 화면이 거짓말을 한다
 *   - **지도·관계망이 없다.** 같은 이유다
 *   - **절은 부(部)가 대신한다.** 구텐베르크 판이 장을 부로 쪼개 놓았고, 그 경계를
 *     `sourceDoc`이 절로 올린다. 한 장이 12만 자라 이게 없으면 목차가 텅 빈다
 *
 * `points/`가 아니라 `source/`에서 읽으므로 라우트를 따로 뒀다. 주소도 그 사실을
 * 말한다 — `/read/point/5`와 `/read/source/15`.
 */

export function generateStaticParams() {
  return (bookById('gibbon')?.parts ?? []).map((p) => ({
    n: p.href.replace('/read/source/', ''),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const part = sourcePart(Number((await params).n))
  return pageMeta(part ? `${part.n ? `Chapter ${part.n} ` : ''}${part.title}` : '읽기')
}

export default async function SourceChapter({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n)
  const part = sourcePart(n)
  const b = bookById('gibbon')
  if (!part?.file || !b) notFound()

  const { md } = sourceDoc(part.file)
  const { prev, next } = navSteps(part.href)
  // 장 번호는 포인트 번호가 아니다. 0을 줘서 어느 서술과도 안 맞게 한다
  const layout = readLayout(0, md, [], [])
  const { sections } = docSections(md)

  const NARROW = { maxWidth: 760, width: '100%' } as const

  return (
    <Shell path={part.href} where={`원전 ${part.title}`} maxWidth={760 + 24 + 340}>
      <Breadcrumbs variant="supporting" style={NARROW}>
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        <BreadcrumbItem href="/read">읽기</BreadcrumbItem>
        <BreadcrumbItem href={bookHref(b)}>{b.short}</BreadcrumbItem>
        <BreadcrumbItem isCurrent>{part.n ? `Chapter ${part.n}` : part.title}</BreadcrumbItem>
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5} style={NARROW}>
        <Text size="sm" color="secondary">
          {part.n ? `Chapter ${part.n}` : '여는 글'}
        </Text>
        {/*
          영어 제목이다. 낭독기와 번역기가 알아야 하므로 `lang`을 다는데, astryx
          `Heading`은 그 prop을 안 받으므로 안쪽 `span`에 건다
        */}
        <Heading level={1}>
          <span lang="en">{part.title}</span>
        </Heading>
        <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
          <Badge variant="neutral" label="기번 원전 · 영어" />
        </Stack>
      </Stack>

      <Divider />

      {/*
        본문 전체에 `lang="en"`을 건다. 12만 자짜리 영어 글을 한국어로 선언해 두면
        낭독기가 한국어 발음 규칙으로 읽는다.
      */}
      <div lang="en">
        <ReadGrid
          layout={layout}
          rail={
            <ReadRail
              rows={rowCount(layout)}
              items={sections.map((s) => ({ id: s.id, label: s.title, level: 2 }))}
            />
          }
        />
      </div>
      <ReadCards />

      <div style={NARROW}>
        <Stack direction="horizontal" gap={3} justify="between" wrap="wrap" width="100%">
          <Text size="sm" color="secondary">
            {prev ? <a href={prev.href}>← {prev.title}</a> : null}
          </Text>
          <Text size="sm" color="secondary">
            {next ? <a href={next.href}>{next.title} →</a> : null}
          </Text>
        </Stack>
      </div>
    </Shell>
  )
}
