import {
  Stack,
  Heading,
  Text,
  Divider,
  Breadcrumbs,
  BreadcrumbItem,
  Markdown,
  Outline,
  Item,
} from '@astryxdesign/core'
import { Shell } from './Shell'
import { CopyPageButton } from './CopyPageButton'
import { loadDoc, docSections } from '../lib/doc'
import { navCrumbs, navSteps } from '../lib/nav'
import { Faq } from './Faq'
import { faqFor } from '../lib/faq'

/**
 * 문서 한 장의 뼈대. **모든 문서 화면이 이걸 쓴다.**
 *
 * 빵부스러기 → 제목 → 부제 → 페이지 복사 → 본문 → 다음 단계 → 이전·다음.
 * 이 순서가 화면마다 같은 것이 「퀄리티」의 정체다. `developers.openai.com`에서
 * 실측해 옮겼다.
 *
 * 본문은 `content/**\/*.md`가 정본이고 여기는 조립만 한다. 우측 목차와 본문 제목이
 * `docSections()` 하나에서 나오므로 둘이 어긋날 수 없다.
 */
export function DocPage({ href }: { href: string }) {
  const doc = loadDoc(href)
  const { intro, sections } = docSections(doc.body)
  const crumbs = navCrumbs(href)
  const { prev, next } = navSteps(href)

  // 붙여넣는 사람은 이게 무슨 문서인지부터 알아야 한다. 제목과 부제를 같이 싣는다
  const markdown = `# ${doc.title}\n\n${doc.summary}\n\n${doc.body}\n`

  return (
    <Shell
      path={href}
      where={doc.title}
      aside={
        sections.length > 1 ? (
          <Outline
            label="이 페이지"
            items={sections.map((s) => ({ id: s.id, label: s.title, level: 2 }))}
          />
        ) : undefined
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
        <Heading level={1}>{doc.title}</Heading>
        {doc.summary ? (
          <Text size="lg" color="secondary">
            {doc.summary}
          </Text>
        ) : null}
        <Stack direction="horizontal" gap={1}>
          <CopyPageButton markdown={markdown} />
        </Stack>
      </Stack>

      <Divider />

      {intro ? <Markdown>{intro}</Markdown> : null}

      {/*
        **간격을 여기서 안 놓는다.** 절 사이도 제목 밑도 전부 `globals.css`의
        H2 마진(48/16)이 정한다 — Stack gap과 CSS 마진이 둘 다 간격을 놓으면
        서로를 모르는 체계가 둘이 되고, 그래서 H2가 H3보다 좁아지는 사고가 났다.
      */}
      <Stack direction="vertical" gap={0}>
        {sections.map((s) => (
          // 우측 목차가 여기로 뛴다. `Markdown`은 제목에 id를 안 달아서 우리가 단다
          <Stack key={s.id} direction="vertical" gap={0} id={s.id} as="section">
            <Heading level={2}>{s.title}</Heading>
            <Markdown>{s.md}</Markdown>
          </Stack>
        ))}
      </Stack>

      {/* 본문 다음, 이동 링크 앞. 읽고 나서 남는 물음이 여기서 풀린다 */}
      <Faq items={faqFor(href)} />

      {next ? (
        <>
          <Divider />
          <Stack direction="vertical" gap={1.5}>
            <Text weight="semibold">다음 단계</Text>
            <Item label={next.title} href={next.href} description="이어서 하시면 됩니다" />
          </Stack>
        </>
      ) : null}

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
