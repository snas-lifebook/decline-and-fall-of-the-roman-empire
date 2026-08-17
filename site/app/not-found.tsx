import Link from 'next/link'
import { Stack, Heading, Text } from '@astryxdesign/core'
import { Shell } from '../components/Shell'

/**
 * 못 찾은 화면.
 *
 * **앞 판은 Next.js 기본 페이지였다** — 우리 셸도 없고 본문이 `404 / This page
 * could not be found.`라는 영어 두 줄이었다(감사 2026-08-17). 한국어만 쓰는
 * 사이트에서 여기만 영어고, 상단 바도 푸터도 없어 **되돌아갈 길이 화면에 없었다.**
 *
 * 정적 호스팅이라 깨진 링크·오래된 북마크·오타 주소가 전부 여기로 떨어진다.
 * 팀원이 단톡방 링크를 잘못 눌렀을 때 만나는 화면이 이것이다.
 */
export const metadata = { title: '못 찾은 화면 · 산스 인생책 로마쇠망사 자료실' }

export default function NotFound() {
  return (
    <Shell path="/404" where="못 찾은 화면">
      <Stack direction="vertical" gap={2}>
        <Heading level={1}>그 화면은 없습니다</Heading>
        <Text size="lg" color="secondary">
          주소가 바뀌었거나, 오래된 링크일 수 있습니다.
        </Text>
        <Text>
          찾으시는 것이 사람이나 지명이면 위쪽 <strong>찾기</strong>에 이름을 치시면 됩니다.
          초성만 쳐도 나옵니다.
        </Text>
        {/* 되돌아갈 길을 화면 안에 둔다. 사이드바가 없는 폰에서는 이게 유일한 길이다 */}
        <Text>
          아니면 <Link href="/">자료실 첫 화면</Link>에서 다섯 갈래 중 하나로 들어가시거나,{' '}
          <Link href="/faq">자주 묻는 것</Link>을 보십시오.
        </Text>
      </Stack>
    </Shell>
  )
}
