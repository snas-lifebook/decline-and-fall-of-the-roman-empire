import type { Metadata } from 'next'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '@astryxdesign/theme-neutral'
import './globals.css'
import { Korean } from '../components/Korean'

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
         * **`localStorage`만 따로 감싼다.** 앞 판은 통째로 감싸고 `catch`에서
         * `light`로 떨어뜨렸는데, 사생활 모드처럼 저장이 막힌 브라우저에서는
         * **어두운 기기를 쓰는 사람이 밝은 화면을 받았다**(검수 실측). 저장을
         * 못 읽는 것과 기기 설정을 못 읽는 것은 다른 일이다.
         */}
        {/*
         * 읽기 화면의 「옆에 세울 것」도 같은 자리에서 칠한다. 안 그러면 인물을
         * 꺼둔 사람이 페이지마다 카드가 떴다가 사라지는 것을 본다 — 테마의 흰
         * 화면 번쩍임과 같은 병이다.
         *
         * **값이 없으면 속성을 안 단다.** 속성이 없으면 CSS 규칙이 하나도 안 걸려
         * 전부 보인다. 저장이 막힌 브라우저에서 카드가 통째로 사라지는 쪽보다 낫다.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var m=null;try{m=localStorage.getItem('theme')}catch(e){}" +
              "var d=m==='dark'||((!m||m==='system')&&matchMedia('(prefers-color-scheme:dark)').matches);" +
              "document.documentElement.dataset.theme=d?'dark':'light';" +
              "var c=null;try{c=localStorage.getItem('read-cards')}catch(e){}" +
              "if(c!==null)document.documentElement.dataset.cards=c})()",
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
