import Link from 'next/link'
import { Stack, Grid, Heading, Text, ClickableCard, Divider } from '@astryxdesign/core'
import { Shell } from '../components/Shell'
import { LinkCards } from '../components/LinkCards'
import { BookIcon, SearchIcon, DownloadIcon, SparkIcon, FlagIcon } from '../components/icons'

/**
 * 목적 허브. `/`는 콘텐츠 페이지가 아니라 **갈림길**이다.
 *
 * 카드를 독자층이 아니라 **동사**로 가른 이유: 사람은 자기가 몇 층 독자인지보다
 * 지금 뭘 하려는지를 훨씬 잘 안다 (SPEC 「진입 구조」).
 *
 * 초보자 규율 둘이 이 화면에 걸린다.
 *   1. **되는 것을 먼저**, 준비 중인 것을 그 자리에 회색으로. 404보다 정직하다
 *   2. 설명은 기능이 아니라 **상황**으로 쓴다 — "언제 여기 오나"
 *
 * 사이드바를 달지 않는다. 갈림길에 갈림길을 또 놓으면 그게 헷갈림이다. 대신
 * 가운데로 모아 첫 화면이 왼쪽 1/3에 몰리지 않게 한다.
 */

// 다섯을 한 격자에 나란히 둔다. 2026-08-16에 「찾아보기」가 붙어 다섯이 다 살았다
//
// 아이콘은 제목을 대신하지 않고 **거든다**. 다섯 장이 한눈에 구별되면 두 번째 방문부터
// 글을 안 읽고도 손이 간다 (2026-08-16 River 요구)
const CARDS = [
  {
    href: '/read',
    title: '읽기',
    desc: '맡은 대목을 지금 바로 읽고 싶으실 때',
    Icon: BookIcon,
  },
  {
    href: '/objects',
    title: '찾아보기',
    desc: '이 사람이 누구 편이었는지 헷갈리실 때',
    Icon: SearchIcon,
  },
  {
    href: '/download',
    title: '가져가기',
    desc: '발표 표를 시트에 붙여넣어 만드셔야 할 때',
    Icon: DownloadIcon,
  },
  {
    href: '/use',
    title: '활용하기',
    desc: '쓰시던 AI에 이 자료를 물려보고 싶으실 때',
    Icon: SparkIcon,
  },
  {
    href: '/start',
    title: '시작하기',
    desc: '자료를 처음 받으시거나, 갱신을 못 따라가고 계실 때',
    Icon: FlagIcon,
  },
] as const

export default function Home() {
  return (
    <Shell path="/" where="첫 화면" sidebar={false} maxWidth={960}>
      <Stack direction="vertical" gap={8}>
        {/* 첫 화면이 상단에 딱 붙으면 급해 보인다. 위를 비워 숨을 준다 */}
        <Stack direction="vertical" gap={1.5} hAlign="center" paddingBlock={10}>
          <Heading level={1} type="display-1" justify="center">
            산스 인생책 로마쇠망사 자료실
          </Heading>
          <Text size="lg" color="secondary" justify="center">
            발표와 토론에 쓰는 자료를 모아둔 곳입니다. 설치도 로그인도 필요 없습니다.
          </Text>
        </Stack>

        <Grid columns={{ minWidth: 280 }} gap={3}>
          {CARDS.map((c) => (
            <ClickableCard key={c.title} href={c.href} label={c.title} padding={4}>
              <Stack direction="vertical" gap={0.5}>
                {/* 아이콘 → 글자 간격은 링크 카드와 같은 8px이다. 화면마다 다르면 아이콘이 붙었다 떨어졌다 한다 */}
                <Stack direction="horizontal" gap={2} vAlign="center">
                  <c.Icon />
                  <Heading level={2}>{c.title}</Heading>
                </Stack>
                <Text size="sm" color="secondary">
                  {c.desc}
                </Text>
              </Stack>
            </ClickableCard>
          ))}
        </Grid>

        {/*
         * 모아둔 링크를 맥락에서 다시 만나게 한다. 「작업 공간」 페이지에 있는 것과
         * **같은 레지스트리에서 같은 id로** 나오므로, 사람이 "아 이게 거기 있던 그
         * 시트구나"를 안다 (2026-08-16 River 요구).
         */}
        <Stack direction="vertical" gap={3}>
          <Divider />
          <Text size="sm" color="secondary">
            바로 가는 곳
          </Text>
          <LinkCards ids={['drive-01', 'sheet', 'repo']} />
          <Text size="sm" color="secondary">
            나머지는 <Link href="/start/links">작업 공간</Link>에 다 모여 있습니다.
          </Text>
        </Stack>
      </Stack>
    </Shell>
  )
}
