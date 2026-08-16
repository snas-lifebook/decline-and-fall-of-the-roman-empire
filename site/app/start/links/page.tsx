import {
  Stack,
  Heading,
  Text,
  Divider,
  Breadcrumbs,
  BreadcrumbItem,
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { LinkCards } from '../../../components/LinkCards'
import { Faq } from '../../../components/Faq'
import { faqFor } from '../../../lib/faq'
import { linkById } from '../../../lib/links'
import { navCrumbs, navSteps } from '../../../lib/nav'

/**
 * 작업 공간 — 마크다운이 아니라 카드다.
 *
 * 앞 판은 `content/start/links.md`였고 파란 불릿 링크가 여섯 절에 걸쳐 나열됐다.
 * River 평: "뭔가 딱 떠올라서 링크로 가는 느낌이 안 든다." 링크마다 「이름 — 무엇을
 * 하는 곳」이라는 **같은 라벨 묶음이 되풀이되니 그건 산문이 아니라 표의 성질**이고,
 * 마크다운으로 쓰면 설명이 제목과 한 줄로 흘러 항목 경계가 사라진다(헌장 17항).
 * 활용하기 네 장이 같은 이유로 카드가 됐다.
 *
 * 카드는 `components/LinkCards`가 그린다 — 주소는 손으로 안 적고 `lib/links.ts`의
 * id로만 부른다.
 */

/**
 * 맨 위 길잡이. **원래 마크다운에서는 맨 아래 표였다.**
 *
 * 자리를 바꾼 이유: 이건 곁다리 요약이 아니라 「지금 손에 든 것을 어디로 가져가나」에
 * 답하는 표다. 그 답이 정해져야 아래 카드 중 어느 것을 누를지가 정해진다.
 * 오른쪽 칸이 그 자리로 바로 나가므로 표를 읽고 다시 아래에서 카드를 찾을 일이 없다.
 */
const WHERE: { what: string; to: string; id?: string; note?: string }[] = [
  { what: '발표 슬라이드, 회차 자료', to: '회차 자료함', id: 'drive-01' },
  { what: '일정, 담당, 진행 상황', to: '운영 스프레드시트', id: 'sheet' },
  {
    what: '책 본문, 인물·지명 자료',
    to: '깃허브',
    id: 'repo',
    note: '이 사이트가 여기서 나옵니다',
  },
  { what: '발표 당일 함께 보는 화면', to: '회차 캠페인 사이트', id: 'campaign-01' },
  // 「한 줄 남기기」는 바깥 자리가 아니라 이 화면 아래 붙어 있는 칸이라 걸 주소가 없다
  { what: '물어볼 것, 고칠 것', to: '화면 아래 「한 줄 남기기」' },
]

/**
 * 절 다섯. **묶는 기준이 곧 고르는 기준이라** 절마다 왜 그 묶음인지 한 줄이 붙는다.
 * 회차가 바뀌면 첫 절만 바뀐다는 것이 이 배치의 요점이다.
 */
const SECTIONS: { title: string; note?: string; ids: string[] }[] = [
  {
    title: '회차에 딸린 것',
    note: '지금 회차에만 해당하는 자리입니다. 회차가 바뀌면 이 목록도 바뀝니다.',
    ids: ['campaign-01', 'drive-01'],
  },
  {
    title: '늘 쓰는 것',
    note: '회차와 상관없이 계속 쓰는 자리입니다.',
    ids: ['sheet', 'repo', 'zip'],
  },
  {
    title: '자료가 어떻게 생겼나',
    note: '깃허브 안에서 자주 열어보게 되는 두 폴더입니다.',
    ids: ['repo-ontology', 'repo-skills'],
  },
  { title: '도구', ids: ['obsidian', 'figma'] },
  {
    title: '참고자료',
    note: '발표를 준비하다 막힐 때 열어보시면 좋은 곳입니다.',
    ids: ['youtube-sans', 'yt-kingsandgenerals', 'yt-historymarche', 'yt-epichistory'],
  },
]

export default function Links() {
  const crumbs = navCrumbs('/start/links')
  const { prev, next } = navSteps('/start/links')

  return (
    <Shell path="/start/links" where="작업 공간">
      <Breadcrumbs variant="supporting">
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        {crumbs.map((c, i) => (
          <BreadcrumbItem key={c.href} href={c.href} isCurrent={i === crumbs.length - 1}>
            {c.title}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>작업 공간</Heading>
        <Text size="lg" color="secondary">
          편데 운영에 쓰는 바깥 자리들입니다. 흩어진 곳으로 여기서 들어가시면 됩니다.
        </Text>
      </Stack>

      <Divider />

      <Text color="secondary">
        발표와 운영에 쓰는 곳이 몇 군데로 나뉘어 있습니다. 주소를 따로 찾지 않으셔도 되게 여기
        모아뒀습니다.
      </Text>

      <Stack direction="vertical" gap={2} as="section">
        <Heading level={2}>무엇을 어디에 두나</Heading>
        <MetadataList columns="single" label={{ position: 'start', width: 200 }}>
          {WHERE.map((r) => (
            <MetadataListItem key={r.what} label={r.what}>
              {/* 바깥으로 나가는 링크다. 읽던 자리를 뺏지 않게 새 탭으로 연다 */}
              {r.id ? (
                <a href={linkById(r.id).href} target="_blank" rel="noreferrer">
                  {r.to}
                </a>
              ) : (
                r.to
              )}
              {r.note ? ` (${r.note})` : null}
            </MetadataListItem>
          ))}
        </MetadataList>
      </Stack>

      {SECTIONS.map((s) => (
        <Stack key={s.title} direction="vertical" gap={3} as="section">
          <Stack direction="vertical" gap={0.5}>
            <Heading level={2}>{s.title}</Heading>
            {s.note ? (
              <Text size="sm" color="secondary">
                {s.note}
              </Text>
            ) : null}
          </Stack>
          <LinkCards ids={s.ids} />
        </Stack>
      ))}

      <Faq items={faqFor('/start/links')} />

      {/* 시작하기 여섯 장은 차례대로 밟는 순서다. 마지막 장이라 앞으로만 이어진다 */}
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
