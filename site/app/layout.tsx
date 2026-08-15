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
    <html lang="ko" data-theme="light">
      <head>
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
