import { AppShell, TopNav, TopNavHeading, SideNav, SideNavItem, Stack } from '@astryxdesign/core'
import { navTree, type NavNode } from '../lib/nav'
import { SiteFooter } from './SiteFooter'
import { Search } from './Search'
import { ThemeToggle } from './ThemeToggle'
import { RailToggle } from './RailToggle'

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
          startContent={
            /*
              왼쪽 목록 접기. **상단 바 왼쪽에 둔다** — 접는 대상 바로 위라 무엇을
              여닫는 손잡이인지 자리로 말한다. 오른쪽(찾기·밝기)은 화면 전체에
              대한 행동이고 이건 왼쪽 칸에 대한 것이라 자리를 가른다.
            */
            sidebar ? <RailToggle /> : undefined
          }
          endContent={
            <Stack direction="horizontal" gap={2} vAlign="center">
              {/* 객체가 644장이다. 사이드바 목록만으로는 「하스드루발 어디 나오더라」에 답이 안 된다 */}
              {/*
                「이 자료실은」을 상단에서 뺐다 — 이제 푸터가 전 화면에 그것과
                「바뀐 것」·자료 기준일까지 같이 놓는다. 위아래에 같은 링크가
                두 번 있으면 상단 바만 붐빈다. 위에는 **행동**(찾기·밝기)만 둔다.
              */}
              <Search />
              <ThemeToggle />
            </Stack>
          }
        />
      }
      sideNav={sidebar ? <SideNav>{itemsOf(navTree(), path)}</SideNav> : undefined}
    >
      {/*
        **푸터는 본문 칸 밖이다.** 안에 두면 좁은 화면에서 `wrap`이 날개를 본문
        칸 통째 아래로 내리는데, 그 칸의 맨 끝이 푸터다 — 즉 **폰에서 관계망과
        관계 목록이 푸터 아래로 밀려났다**(2026-08-17 실측: 푸터 y=1760, 날개
        y=2338). 푸터 밑까지 내려가 보는 사람은 없으니 674장에서 그 두 칸이
        사실상 사라져 있었다. 밖으로 빼면 폰에서 본문 → 날개 → 푸터가 된다.
      */}
      <Stack direction="vertical" gap={6} padding={6} width="100%" hAlign="center">
        <Stack direction="horizontal" gap={6} justify="center" wrap="wrap" width="100%">
          {/*
            `.doc`는 **본문 칸에만** 붙는 타이포 스코프다. 제목 크기와 여백을
            `app/globals.css`가 이 클래스 아래로만 건다 — 안 가두면 사이드바·상단바·
            카드 글자까지 같이 끌려간다. 날개는 이 Stack의 형제라 자동으로 빠진다.
          */}
          <Stack className="doc" direction="vertical" gap={4} maxWidth={maxWidth} width="100%">
            {children}
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
      </Stack>

      {/*
        **푸터는 화면 끝에서 끝까지 가는 띠다.**

        River: 「맨 아래 이게 뭔가 본문이랑 같이 붙어 있는 느낌을 받아서 구분이 잘
        되지 않는다」. 맞다 — 앞 판은 푸터가 본문과 **같은 칸, 같은 폭, 같은 바탕**에
        있었고 사이에 가로줄 하나뿐이었다. 줄 하나는 「여기서 문단이 바뀝니다」라고
        말하지 「여기서 글이 끝납니다」라고는 말하지 않는다.

        그래서 셋을 바꿨다. 어느 하나만으로는 약하고, 셋이 같이 있어야 눈이 경계로 읽는다.
          - **바탕색이 다르다** — 본문 칸 밖으로 나와 화면 폭을 다 쓰는 띠가 된다
          - **글꼴이 다르다** — `.doc`를 뗐다. 명조로 읽던 사람에게 푸터는 고딕으로
            남고, 글자 크기를 키워도 푸터는 안 커진다. 읽는 글이 아니라 안내판이니까
          - **여백이 다르다** — 위로 넉넉히 띄운다. 붙어 있던 것이 문제였다

        띠는 화면 폭을 다 쓰되 **안쪽 글은 본문과 같은 폭으로 가둔다** — 왼쪽 끝이
        본문과 어긋나면 띠가 아니라 사고로 보인다.
      */}
      <div className="site-footer">
        <div
          className="site-footer-in"
          style={{ maxWidth: aside ? maxWidth + 24 + asideWidth : maxWidth }}
        >
          <SiteFooter where={where} />
        </div>
      </div>
    </AppShell>
  )
}
