import type { Metadata } from 'next'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral'
import './globals.css'

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
         * **첫 페인트 전에** 테마를 칠한다. 이게 없으면 어둡게 쓰는 사람이
         * 페이지마다 흰 화면을 한 번 보고 나서 어두워진다(FOUC).
         *
         * 정적 사이트라 서버가 사용자 설정을 모른다. 그래서 head에서 동기로
         * 읽는 것이 유일한 방법이다 — `<body>`가 그려지기 전에 끝나야 한다.
         * 고른 값이 없으면 기기 설정을 따른다.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var m=localStorage.getItem('theme');" +
              "var d=m==='dark'||((!m||m==='system')&&matchMedia('(prefers-color-scheme:dark)').matches);" +
              "document.documentElement.dataset.theme=d?'dark':'light'}" +
              "catch(e){document.documentElement.dataset.theme='light'}})()",
          }}
        />
        {/*
         * Pretendard를 실제로 싣는다. `globals.css`가 이름만 적어두고 있었는데,
         * 그러면 이 폰트가 깔린 사람에게만 보이고 윈도우 팀원은 맑은 고딕을 본다.
         * dynamic-subset이라 화면에 뜬 글자의 조각만 내려온다.
         */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
