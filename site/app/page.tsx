import { Stack, Grid, Heading, Text, ClickableCard } from '@astryxdesign/core'
import { Shell } from '../components/Shell'
import { BookIcon, SearchIcon, DownloadIcon, SparkIcon, FlagIcon } from '../components/icons'
import { dataCounts } from '../lib/datashape'
import { book } from '../lib/book'

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

/**
 * 첫 화면이 무엇을 가졌는지 한 줄로 말한다.
 *
 * **손으로 안 적는다.** 데이터를 세어 만들므로 자료가 늘면 이 줄이 따라 는다 —
 * 손으로 적은 숫자는 반드시 낡는다(`/about`의 표가 같은 이유로 빌드 때 채워진다).
 *
 * 2026-08-19 실측: 첫 화면은 히어로와 카드 다섯을 합쳐 **220자**였고 「자료를 모아둔
 * 곳」이라고만 했다 — **어느 자료실에나 해당되는 문장**이다. 무슨 책인지도 얼마나
 * 있는지도 없어서, 첫 외부 사용자가 스킬 페이지의 존재를 링크를 받고서야 알았다.
 * 숫자가 산문보다 빠르게 「무엇인가」에 답한다(datasette.io 실측에서 가져온 판단).
 */
function scale(): string {
  const c = dataCounts()
  // 번호가 붙은 편만 센다 — 목차·일러두기·옮기고 나서는 포인트가 아니다
  const points = book().parts.filter((p) => p.n).length
  return [
    `객체 ${c.entities.toLocaleString()}`,
    `관계 ${c.links.toLocaleString()}`,
    `편역본 ${points}포인트`,
    `기번 원전 ${c.source}장`,
  ].join(' · ')
}

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
          <Text size="sm" color="secondary" justify="center">
            {scale()}
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
          「바로 가는 곳」 카드 줄을 여기서 뺐다 (2026-08-17).

          푸터가 이제 **전 화면에** 「바로가기」 칸으로 같은 링크를 아이콘까지
          달아 놓는다. 허브에만 따로 두면 같은 링크가 한 화면에 두 번 나오고,
          카드 줄과 푸터가 구분선 하나를 사이에 두고 붙어 있어서 **아래쪽이
          통째로 「뭔가 잔뜩 있는 곳」으로 뭉개졌다** — River가 지적한 자리다.

          한 종류는 한 자리에 둔다. 허브는 갈림길 다섯만 남는다.
        */}
      </Stack>
    </Shell>
  )
}
