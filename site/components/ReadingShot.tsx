import { READING_MOCK, type ReadingMockKind } from '../lib/readingmock'

/**
 * 「화면 보는 법」의 그림 한 장.
 *
 * 지금은 SVG 목업을 그린다. **실제 스크린샷이 준비되면 `img`만 채우면 교체**된다
 * (예: `/guide/reading/01-text.webp`). img가 있으면 그쪽을 쓰고, 없으면 목업으로
 * 떨어진다 — 화면 생김새를 지금부터 보이되, 나중에 실사로 바꿀 자리를 열어 둔다.
 */
export function ReadingShot({
  kind,
  img,
  alt,
}: {
  kind: ReadingMockKind
  img?: string
  alt: string
}) {
  if (img) {
    // eslint-disable-next-line @next/next/no-img-element -- 정적 export라 next/image 최적화가 안 돌고, 안내 스크린샷은 리사이즈할 게 없다 (PlatformSteps와 동일)
    return <img className="reading-shot step-shot" src={img} alt={alt} loading="lazy" />
  }
  // 목업 svg가 role="img"+aria-label을 이미 지녀 래퍼엔 안 얹는다
  return <div className="reading-shot" dangerouslySetInnerHTML={{ __html: READING_MOCK[kind] }} />
}
