import { DocPage } from '../../../components/DocPage'
import { navFind } from '../../../lib/nav'

/**
 * 시작하기 여섯 장. 본문은 `content/start/<slug>.md`가 정본이다.
 *
 * **`links`를 뺀다.** 그 장은 산문이 아니라 링크 카드가 반복되는 화면이라
 * `app/start/links/`가 따로 그린다. 여기서 같은 주소를 또 만들면 빌드가 충돌한다.
 */
const OWN = new Set(['links'])

export function generateStaticParams() {
  return (navFind('/start')?.children ?? [])
    .map((c) => ({ slug: c.href.split('/').pop()! }))
    .filter(({ slug }) => !OWN.has(slug))
}

export default async function StartDoc({ params }: { params: Promise<{ slug: string }> }) {
  return <DocPage href={`/start/${(await params).slug}`} />
}
