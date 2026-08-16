import { AppShell, TopNav, TopNavHeading, SideNav, SideNavItem, Stack, Text, Divider } from '@astryxdesign/core'
import { navTree, type NavNode } from '../lib/nav'
import { dataDate } from '../lib/datadate'
import { FeedbackBox } from './FeedbackBox'
import { Search } from './Search'
import { ThemeToggle } from './ThemeToggle'

/**
 * 사이트 껍데기 — 상단 바 + 좌측 사이드바 + 본문 + 하단.
 *
 * `AppShell`·`TopNav`·`SideNav`는 필수 함수 prop이 없어 **서버 컴포넌트에서 그냥
 * 돈다**(실측). 클라이언트로 넘어가는 것은 「한 줄 남기기」와 「페이지 복사」뿐이다.
 *
 * `as={Link}`로 Next 라우터를 물리지 않고 평범한 `<a>`를 쓴다. 전부 정적 HTML이라
 * 전체 새로고침이 느리지 않고, 하이드레이션 비용이 0이 된다.
 *
 * 허브 `/`는 이 껍데기를 안 쓴다. 갈림길이지 문서가 아니다.
 */

function itemsOf(nodes: NavNode[], path: string) {
  return nodes.map((n) => {
    const inside = path === n.href || path.startsWith(`${n.href}/`)
    return (
      <SideNavItem
        key={n.href}
        label={n.ready ? n.title : `${n.title} (준비 중)`}
        href={n.ready ? n.href : undefined}
        isSelected={path === n.href}
        isDisabled={!n.ready}
        // 30포인트가 늘 펼쳐져 있으면 사이드바가 본문보다 길어진다.
        // 그 안에 들어와 있을 때만 연다
        collapsible={n.children ? { defaultIsCollapsed: !inside } : undefined}
      >
        {n.children ? itemsOf(n.children, path) : undefined}
      </SideNavItem>
    )
  })
}

export function Shell({
  path,
  where,
  aside,
  sidebar = true,
  maxWidth = 760,
  asideWidth = 220,
  children,
}: {
  /** 지금 화면의 주소. 사이드바 선택 표시에 쓴다 */
  path: string
  /** 피드백 초안에 실릴 자리 이름 */
  where: string
  /** 우측 목차. 없으면 2단이 된다 */
  aside?: React.ReactNode
  /** 허브는 끈다 — 갈림길에 갈림길 목록을 또 붙이지 않는다. 상단 바는 그대로 둔다 */
  sidebar?: boolean
  /** 본문 폭. 글은 760, 카드가 깔리는 허브는 960 */
  maxWidth?: number
  /** 날개 폭. 그림이 들어가면 넓힌다 */
  asideWidth?: number
  children: React.ReactNode
}) {
  return (
    <AppShell
      height="fill"
      topNav={
        <TopNav
          heading={<TopNavHeading heading="로마쇠망사 자료실" headingHref="/" />}
          endContent={
            <Stack direction="horizontal" gap={2} vAlign="center">
              {/* 객체가 644장이다. 사이드바 목록만으로는 「하스드루발 어디 나오더라」에 답이 안 된다 */}
              <Search />
              <ThemeToggle />
              <Text size="sm" color="secondary">
                <a href="/about">이 자료실은</a>
              </Text>
            </Stack>
          }
        />
      }
      sideNav={sidebar ? <SideNav>{itemsOf(navTree(), path)}</SideNav> : undefined}
    >
      <Stack direction="horizontal" gap={6} padding={6} justify="center" wrap="wrap">
        {/*
          `.doc`는 **본문 칸에만** 붙는 타이포 스코프다. 제목 크기와 여백을
          `app/globals.css`가 이 클래스 아래로만 건다 — 안 가두면 사이드바·상단바·
          카드 글자까지 같이 끌려간다. 날개는 이 Stack의 형제라 자동으로 빠진다.
        */}
        <Stack className="doc" direction="vertical" gap={4} maxWidth={maxWidth} width="100%">
          {children}
          <Divider />
          <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
            <Text size="sm" color="secondary">
              데이터 기준일 {dataDate()}
            </Text>
            <FeedbackBox where={where} />
          </Stack>
        </Stack>
        {aside ? (
          /*
            날개가 본문을 따라 흐르지 않고 **화면에 붙어 있다.** 포인트 본문이
            길어서, 안 붙이면 관계망이 두 번째 문단쯤에서 위로 사라진다.
            `top`은 상단 바 높이만큼.
          */
          <Stack
            direction="vertical"
            gap={4}
            width={asideWidth}
            style={{
              position: 'sticky',
              top: 24,
              alignSelf: 'flex-start',
              // 날개가 화면보다 길면(카이사르는 관계가 41건이다) 붙여둔 채로는
              // 아래쪽에 손이 안 닿는다. 넘치는 만큼만 안에서 굴린다
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
            }}
          >
            {aside}
          </Stack>
        ) : null}
      </Stack>
    </AppShell>
  )
}
