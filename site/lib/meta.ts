import type { Metadata } from 'next'

/**
 * 화면 이름 → 브라우저 탭·북마크·공유 링크에 뜨는 제목.
 *
 * **앞 판은 739장이 전부 같은 제목이었다**(2026-08-17 실측: title 1종 × 739).
 * `app/layout.tsx`에 정적 `metadata`만 있고 라우트가 아무도 덮지 않았다.
 * `<h1>`은 699종으로 멀쩡했으니 데이터는 이미 있었고 밖으로만 안 나갔다.
 *
 * 이게 왜 A급인가 — 팀원이 인물 화면 대여섯 장을 탭으로 열어놓고 발표를
 * 준비한다. 탭이 전부 「산스 인생책 로마쇠망사 자료실」이면 무엇이 무엇인지
 * 못 고른다. 북마크도, 단톡방에 붙인 링크 미리보기도 같이 뭉갠다.
 *
 * 뒤에 사이트 이름을 붙이는 순서(`한니발 · 산스 …`)는 **앞쪽이 잘리지 않게**
 * 하기 위해서다. 탭은 좁고 잘리는 쪽은 늘 뒤다.
 */
const SITE = '산스 인생책 로마쇠망사 자료실'

export function pageMeta(name: string, desc?: string): Metadata {
  return {
    title: `${name} · ${SITE}`,
    ...(desc ? { description: desc } : {}),
  }
}
