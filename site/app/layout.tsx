import type { Metadata } from 'next'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral'
import './globals.css'
import { Korean } from '../components/Korean'
import { bootScript } from '../lib/read/boot'

export const metadata: Metadata = {
  title: '산스 인생책 로마쇠망사 자료실',
  description: '기번 『로마제국쇠망사』 편역본과 지식그래프를 편데 운영팀이 쓰는 자리',
  // 암호 없이 열되 검색에는 안 걸린다 (CONSTITUTION 경계 3)
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // `data-theme`을 여기서 박지 않는다 — 아래 스크립트가 칠하기 전 값이라
    // suppressHydrationWarning이 필요하다
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/*
         * 문서가 그려지기 전 브라우저 캔버스 색. 이게 없으면 정적 사이트라
         * 첫 페인트 전까지 흰 바탕이 잠깐 깔린다 — 어둡게 쓰는 사람에게는
         * 그 순간이 번쩍임으로 보인다.
         */}
        <meta name="color-scheme" content="light dark" />
        {/*
         * **첫 페인트 전에** 테마를 칠한다. 이게 없으면 어둡게 쓰는 사람이
         * 페이지마다 흰 화면을 한 번 보고 나서 어두워진다(FOUC).
         *
         * 정적 사이트라 서버가 사용자 설정을 모른다. 그래서 head에서 동기로
         * 읽는 것이 유일한 방법이다 — `<body>`가 그려지기 전에 끝나야 한다.
         * 고른 값이 없으면 기기 설정을 따른다.
         */}
        {/*
         * 무엇을 칠할지는 `lib/read/boot.ts`의 목록 하나가 정한다.
         *
         * **손으로 적던 앞 판은 `read-map`을 빠뜨렸다**(2026-08-18). 지도를 「본문
         * 위에」로 골라둔 사람이 새로고침하면 단추는 그대로인데 화면은 호버로
         * 돌아갔다 — 카드는 칠하고 지도는 안 칠한 비대칭이라 누락이었다. 설정이
         * 여덟 개로 늘어나므로 목록을 돌리고 테스트가 목록과 대조한다.
         */}
        <script dangerouslySetInnerHTML={{ __html: bootScript() }} />
        {/*
         * **글꼴을 자체 호스팅한다 — 이걸로 외부 요청이 0이 됐다.**
         *
         * 앞 판은 Pretendard를 jsdelivr의 `dynamic-subset`으로 받았고, 그게 이
         * 사이트의 마지막 외부 요청이었다. 조각내는 것이 오히려 비싸다는 것을
         * 실측하고(대목 한 장에 1,163KB) `public/fonts/`로 옮겼다. `globals.css`의
         * `@font-face` 넷이 정본이다.
         *
         * 기본값 Pretendard만 미리 받는다. 나머지 셋은 고를 때 받는다.
         */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/Pretendard-Regular.subset.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/*
          astryx 문구를 한국어로. `children`을 prop으로 넘기므로 페이지들은
          서버 컴포넌트 그대로다 — 이 provider만 클라이언트로 간다.
        */}
        <Korean>{children}</Korean>
      </body>
    </html>
  )
}
