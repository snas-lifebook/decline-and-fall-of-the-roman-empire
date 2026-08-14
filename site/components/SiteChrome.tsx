import Link from 'next/link'
import { Stack, Text, Divider } from '@astryxdesign/core'
import { FeedbackBox } from './FeedbackBox'
import { dataDate } from '../lib/datadate'

/**
 * 화면 껍데기 — 상단 다섯 갈래 내비 + 하단 기준일·한 줄 남기기.
 *
 * **허브는 첫인상이지 매번 지나야 하는 관문이 아니다**(PLAN 「허브가 통행세가
 * 되지 않게」). 섹션에 들어간 뒤에도 다섯 갈래가 계속 보이고, 텔레그램에 뿌린
 * 딥링크는 허브를 건너뛴다.
 */

export const SECTIONS = [
  { href: '/read', title: '읽기', ready: false },
  { href: '/objects', title: '찾아보기', ready: false },
  { href: '/download', title: '가져가기', ready: true },
  { href: '/use', title: '활용하기', ready: true },
  { href: '/start', title: '시작하기', ready: true },
] as const

function SiteNav({ current }: { current: string }) {
  return (
    <Stack direction="horizontal" gap={3} wrap="wrap" paddingBlock={2}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <Text size="sm" color="secondary">
          자료실
        </Text>
      </Link>
      {SECTIONS.map((s) =>
        s.ready ? (
          <Link key={s.href} href={s.href} style={{ textDecoration: 'none' }}>
            <Text size="sm" weight={s.href === current ? 'semibold' : 'normal'}>
              {s.title}
            </Text>
          </Link>
        ) : (
          <Text key={s.href} size="sm" color="disabled">
            {s.title} (준비 중)
          </Text>
        ),
      )}
    </Stack>
  )
}

/**
 * 화면 하나를 감싼다. 내비·기준일·한 줄 남기기가 여기서 한 번에 붙는다.
 * `where`가 피드백 초안에 그대로 실린다.
 */
export function Page({
  where,
  path,
  children,
}: {
  where: string
  path: string
  children: React.ReactNode
}) {
  return (
    <Stack direction="vertical" gap={4} padding={6} maxWidth={960}>
      <SiteNav current={path} />
      <Divider />
      {children}
      <Divider />
      <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
        <Text size="sm" color="secondary">
          데이터 기준일 {dataDate()}
        </Text>
        <FeedbackBox where={where} />
      </Stack>
    </Stack>
  )
}
