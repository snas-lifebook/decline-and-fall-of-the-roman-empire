'use client'

import { InternationalizationProvider } from '@astryxdesign/core/i18n'

/**
 * astryx가 내는 문구를 한국어로 바꾼다.
 *
 * **감사(2026-08-17)에서 12종이 영어로 나가고 있었다.** 한국어만 쓰는 사이트인데
 * 탭으로 도는 첫 자리가 `Skip to content`였고, 낭독기는 `Top navigation`·`Side
 * navigation`·`Breadcrumb`을 영어로 읽었다. 더 나쁜 것은 한영 혼합이었다 —
 * `Expand {label}`에 우리 한국어 라벨이 꽂혀 **「Expand 활용하기」**가 됐다.
 *
 * astryx가 `./i18n`과 `locales/*.json`을 export하는데 `ko` 카탈로그가 없고
 * 배선도 안 돼 있었다. **전체 카탈로그를 번역하지 않는다** — `overrides`로
 * **화면에 실제로 나가는 것만** 덮는다. 안 쓰는 컴포넌트(달력·페이지네이션·
 * 채팅)까지 번역하면 안 쓰는 문장을 유지보수하게 된다.
 *
 * **`'use client'`지만 비용이 거의 없다.** `children`을 prop으로 받으므로 우리
 * 페이지들은 서버 컴포넌트 그대로 남는다. astryx의 셸 컴포넌트들이 이미 전부
 * `'use client'`라 이 provider가 SSR 단계에서 그들에게 닿고, **정적 HTML에 한국어가
 * 그대로 구워진다**(실측으로 확인).
 *
 * 못 고치는 것 하나 — `Up arrow`·`Down arrow` 같은 키 이름은 `Kbd.js`에 하드코딩돼
 * 있어 카탈로그에 없다. 그건 우리 쪽에서 `Kbd`를 안 쓰는 것으로 푼다.
 */

const ko = {
  // 셸·길찾기
  '@astryx.appShell.skipToContent': '본문으로 건너뛰기',
  '@astryx.appShell.mobileNavigation': '메뉴',
  '@astryx.topNav.landmarkLabel': '상단 바',
  '@astryx.sideNav.label': '자료실 목록',
  '@astryx.breadcrumbs.label': '지금 있는 곳',
  '@astryx.topNav.heading.openMenu': '메뉴 열기',
  '@astryx.sideNav.heading.openMenu': '메뉴 열기',
  '@astryx.mobileNav.closeNavigation': '메뉴 닫기',
  // 사이드바 접기 — 한영 혼합이 나던 자리다
  '@astryx.sideNavItem.expand': '{label} 펼치기',
  '@astryx.sideNavItem.collapse': '{label} 접기',
  // 찾기
  '@astryx.commandPalette.label': '이름으로 찾기',
  '@astryx.commandPalette.list.label': '찾은 것',
  '@astryx.commandPalette.input.placeholder': '이름을 치세요. 초성도 됩니다',
  '@astryx.commandPalette.emptyBootstrap': '이름을 쳐 보세요',
  '@astryx.commandPalette.emptySearch': '그런 이름은 없습니다',
  '@astryx.commandPalette.noResultsFor': '{query} — 그런 이름은 없습니다',
  '@astryx.commandPalette.loading': '불러오는 중',
  // 코드·표
  '@astryx.codeBlock.copyCode': '복사',
  '@astryx.codeBlock.code': '코드',
  '@astryx.markdown.table': '표',
  '@astryx.table.label': '표',
  '@astryx.table.noData': '내용이 없습니다',
  '@astryx.dialog.close': '닫기',
}

export function Korean({ children }: { children: React.ReactNode }) {
  return (
    <InternationalizationProvider locale="ko" overrides={{ ko }}>
      {children}
    </InternationalizationProvider>
  )
}
