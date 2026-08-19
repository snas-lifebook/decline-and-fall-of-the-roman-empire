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
import { CopyPageButton } from '../../../../components/CopyPageButton'
import { ReadGrid } from '../../../../components/ReadGrid'
import { ReadRail } from '../../../../components/ReadRail'
import { ReadCards } from '../../../../components/ReadCards'
import { FocusExit } from '../../../../components/FocusExit'
import { book, bookHref, textPart, textSlug } from '../../../../lib/book'
import { readDoc } from '../../../../lib/text/point'
import { readLayout, rowCount } from '../../../../lib/read/cards'
import { docSections } from '../../../../lib/doc'
import { navSteps } from '../../../../lib/nav'
import { pageMeta } from '../../../../lib/meta'

/**
 * 책의 앞뒤 글 — 일러두기 · 책머리에 · 옮기고 나서.
 *
 * **셋 다 파일로는 있었는데 사이트 어디에도 안 걸려 있었다.** River가 「01~30뿐만
 * 아니라 앞에 서문이나 이런 것도 다 넣어주시오」라고 한 그 셋이다. 책머리에는
 * 기번이 어떤 사람이었는지를 5,000자로 쓴 **저자 소개 그 자체**라, 없으면 책 화면이
 * 저자에 대해 할 말이 없어진다.
 *
 * 읽는 환경은 대목과 **똑같다** — 같은 글꼴·크기·바탕 설정이 듣고, 오른쪽 패널도
 * 그대로다. 다른 것은 셋뿐이고 전부 데이터가 없어서 그렇다.
 *
 *   - 여백 카드가 없다. 카드는 「이 대목에서 이 사람이 무엇을 했나」가 있어야 서는데
 *     앞뒤 글에는 대목 번호가 없다
 *   - 지도·관계망이 없다. 같은 이유다
 *   - 절이 안 나뉜다. 셋 다 제목 없이 통으로 흐르는 글이라 `ReadRail`이 그렇게 말한다
 */

export function generateStaticParams() {
  return book()
    .parts.filter((p) => p.file)
    .map((p) => ({ slug: textSlug(p.title) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const part = textPart((await params).slug)
  return pageMeta(part?.title ?? '읽기')
}

export default async function BookText({ params }: { params: Promise<{ slug: string }> }) {
  const part = textPart((await params).slug)
  if (!part?.file) notFound()

  const b = book()
  const { lead, md, plain } = readDoc(part.file)
  const { prev, next } = navSteps(part.href)
  // 대목 번호가 없으므로 0을 준다 — 어느 서술과도 안 맞아 카드가 0장이 된다
  const layout = readLayout(0, md, [], [])
  const { sections } = docSections(md)

  const NARROW = { maxWidth: 760, width: '100%' } as const

  return (
    <Shell path={part.href} where={`읽기 ${part.title}`} maxWidth={760 + 24 + 340}>
      <Breadcrumbs variant="supporting" style={NARROW}>
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        <BreadcrumbItem href="/read">읽기</BreadcrumbItem>
        <BreadcrumbItem href={bookHref(b)}>{b.short}</BreadcrumbItem>
        <BreadcrumbItem isCurrent>{part.title}</BreadcrumbItem>
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5} style={NARROW}>
        <Text size="sm" color="secondary">
          {part.kind === 'back' ? '닫는 글' : '여는 글'}
        </Text>
        <Heading level={1}>{part.title}</Heading>
        {lead && lead !== part.title ? (
          <Text size="lg" color="secondary">
            {lead}
          </Text>
        ) : null}
        <Stack direction="horizontal" gap={1} vAlign="center" wrap="wrap">
          <Badge variant="neutral" label={part.page ? `${part.page}쪽` : '30포인트 편역본'} />
          <CopyPageButton markdown={`# ${part.title}\n\n${plain}\n`} />
        </Stack>
      </Stack>

      <Divider />

      <ReadGrid
        layout={layout}
        rail={
          <ReadRail
            rows={rowCount(layout)}
            items={sections.map((s) => ({ id: s.id, label: s.title, level: 2 }))}
          />
        }
      />
      <ReadCards />
      <FocusExit />

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
