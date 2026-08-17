import Link from 'next/link'
import {
  Stack,
  Heading,
  Text,
  Divider,
  Badge,
  Breadcrumbs,
  BreadcrumbItem,
  Markdown,
  Outline,
} from '@astryxdesign/core'
import { Shell } from '../../../../components/Shell'
import { CopyPageButton } from '../../../../components/CopyPageButton'
import { docSections } from '../../../../lib/doc'
import { navCrumbs, navSteps } from '../../../../lib/nav'
import { POINT_COUNT } from '../../../../lib/points'
import { pointDoc } from '../../../../lib/text/point'
import { pageMeta } from '../../../../lib/meta'
import { PointGraph } from '../../../../components/PointGraph'
import { Faq } from '../../../../components/Faq'
import { faqFor } from '../../../../lib/faq'
import { loadEntities, loadLinks } from '../../../../lib/ontology'

/**
 * 포인트 한 장의 본문.
 *
 * `DocPage`를 그대로 못 쓴다 — 그쪽은 `content/`에서 읽고 여기는 레포 루트의
 * `points/`에서 읽는다. 그래서 **뼈대만 본떠서** 같은 순서로 조립한다.
 * 빵부스러기 → 제목 → 한 줄 소개 → 페이지 복사 → 본문 → 이전·다음 + 우측 목차.
 * 화면마다 이 순서가 같은 것이 「퀄리티」의 정체다.
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

  const { intro, sections } = docSections(md)
  const crumbs = navCrumbs(href)
  const { prev, next } = navSteps(href)

  return (
    <Shell
      path={href}
      where={`읽기 ${title}`}
      asideWidth={300}
      aside={
        <>
          {sections.length > 1 ? (
            <Outline
              label="이 페이지"
              items={sections.map((s) => ({ id: s.id, label: s.title, level: 2 }))}
            />
          ) : null}
          {/*
            관계망이 여기 있다 (River 요청, 2026-08-16). 본문 아래에 두면 다 읽고
            나서야 보이는데, 이 그림은 **읽는 동안 옆에 있어야** 「지금 이 사람이
            누구 편이지」에 답이 된다. 옵시디언 오른쪽 사이드의 그래프뷰 자리다.
            날개가 화면에 붙어 있어 본문을 내려도 안 사라진다.
          */}
          <PointGraph point={n} entities={ENTITIES} links={LINKS} />
        </>
      }
    >
      <Breadcrumbs variant="supporting">
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        {crumbs.map((c, i) => (
          <BreadcrumbItem key={c.href} href={c.href} isCurrent={i === crumbs.length - 1}>
            {c.title}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5}>
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

      {intro ? <Markdown>{intro}</Markdown> : null}

      {/* 간격은 `globals.css`의 H2 마진이 정한다 — `DocPage`와 같은 규칙이다 */}
      <Stack direction="vertical" gap={0}>
        {sections.map((s) => (
          // 우측 목차가 여기로 뛴다. `Markdown`은 제목에 id를 안 달아서 우리가 단다
          <Stack key={s.id} direction="vertical" gap={0} id={s.id} as="section">
            <Heading level={2}>{s.title}</Heading>
            <Markdown>{s.md}</Markdown>
          </Stack>
        ))}
      </Stack>

      {/*
        **본문에서 표로 가는 길.** 감사(2026-08-17)가 잡은 동선 결함이다 — 30장
        어디에도 `/download/N` 단서가 없어서, 본문을 읽고 발표 표가 필요해진
        사람이 사이드바 「가져가기」로 나가 포인트를 다시 골라야 했다(+2클릭).
        읽던 자리에서 바로 넘어간다.
      */}
      <Stack direction="vertical" gap={1} as="section">
        <Heading level={2}>이 대목을 표로 받기</Heading>
        <Text color="secondary">
          여기 나온 인물·지명을 <Link href={`/download/${n}`}>표 한 장</Link>으로 받아 시트에
          붙여넣을 수 있습니다.
        </Text>
      </Stack>

      <Faq items={faqFor(href)} />

      <Stack direction="horizontal" gap={3} justify="between" wrap="wrap">
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
