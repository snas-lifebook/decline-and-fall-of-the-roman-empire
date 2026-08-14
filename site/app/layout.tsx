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
      <body>{children}</body>
    </html>
  )
}
