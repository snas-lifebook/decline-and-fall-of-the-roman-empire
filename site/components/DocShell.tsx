import {
  Stack,
  Heading,
  Text,
  Divider,
  Breadcrumbs,
  BreadcrumbItem,
  Outline,
  Item,
} from '@astryxdesign/core'
import { Shell } from './Shell'
import { CopyPageButton } from './CopyPageButton'
import { navCrumbs, navSteps } from '../lib/nav'
import { Faq } from './Faq'
import { faqFor } from '../lib/faq'

/**
 * 문서 한 장의 뼈대. **본문이 무엇으로 만들어졌든 이걸 쓴다.**
 *
 * 빵부스러기 → 제목 → 부제 → 페이지 복사 → 구분선 → 들머리 → H2 절들 →
 * 자주 묻는 것 → 다음 단계 → 이전·다음. 이 순서가 화면마다 같은 것이
 * 「퀄리티」의 정체다. `developers.openai.com`에서 실측해 옮겼다([[DESIGN]]).
 *
 * ## 왜 `DocPage`에서 떼어냈나 (2026-08-19)
 *
 * 앞 판은 이 뼈대가 `DocPage({ href })` 안에 있었고, 그 함수가 하는 첫 일이
 * `loadDoc(href)` — 즉 `content/<href>.md`를 읽는 것이었다. **내용을 넣을 prop이
 * 아예 없었다.** 그래서 본문이 마크다운이 아닌 화면은 뼈대를 쓸 방법이 구조적으로
 * 없었다.
 *
 * 그런데 헌장 17조가 「같은 뼈대가 세 번 반복되면 마크다운이 아니라 데이터다」로
 * 활용하기 네 장을 TSX 카드로 옮기면서 `content/use/*.md`를 지웠다. **두 결정 다
 * 옳았고 둘이 만나는 자리를 아무도 안 봤다** — 그날 활용하기 전체가 빵부스러기·
 * 우측 목차·이전다음을 잃었고 빌드·타입·린트는 전부 통과했다. 헌장 19조가 CSS에서
 * 겪은 것과 같은 종류다. **통과는 걸렸다는 증거가 아니다.**
 *
 * 실측(2026-08-19): 뼈대를 온전히 쓰는 화면이 24장 중 5장. H2가 5~8개인데 우측
 * 목차가 없는 화면이 넷이었다.
 *
 * ## 절은 `id`와 제목을 여기서 같이 받는다
 *
 * 우측 목차와 본문 제목이 **같은 배열 하나**에서 나온다. 페이지가 목차용 배열과
 * 본문 마크업을 따로 쓰면 둘이 어긋나 목차가 빈 곳으로 뛴다 — `id`를 두 번 적을
 * 자리를 아예 안 만드는 것이 이 모양의 이유다.
 */
export type DocSection = {
  /** 우측 목차가 뛰어갈 자리. 본문 `<section>`에 그대로 박힌다 */
  id: string
  /** H2로 그려지고 목차에도 같은 글자가 실린다 */
  title: string
  body: React.ReactNode
}

export function DocShell({
  href,
  title,
  summary,
  sections,
  intro,
  copyMarkdown,
}: {
  /** 지금 화면 주소. 빵부스러기·이전다음·자주 묻는 것이 전부 이것 하나로 정해진다 */
  href: string
  title: string
  /** H1 바로 아래 한 문장. 목차에 들어가기 전에 이 페이지가 무엇인지 말한다 */
  summary?: string
  sections: DocSection[]
  /** 구분선 아래, 첫 H2 위. 경고 배너나 들머리 문단이 오는 자리 */
  intro?: React.ReactNode
  /** 「이 페이지 복사」에 실을 마크다운. 없으면 단추를 안 그린다 */
  copyMarkdown?: string
}) {
  const crumbs = navCrumbs(href)
  const { prev, next } = navSteps(href)

  return (
    <Shell
      path={href}
      where={title}
      aside={
        // 절이 하나뿐이면 목차가 본문을 되풀이할 뿐이다
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
        <Heading level={1}>{title}</Heading>
        {summary ? (
          <Text size="lg" color="secondary">
            {summary}
          </Text>
        ) : null}
        {copyMarkdown ? (
          <Stack direction="horizontal" gap={1}>
            <CopyPageButton markdown={copyMarkdown} />
          </Stack>
        ) : null}
      </Stack>

      <Divider />

      {intro}

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
            {s.body}
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
