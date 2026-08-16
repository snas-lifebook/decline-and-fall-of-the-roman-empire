import { DocPage } from '../../../components/DocPage'
import { navFind } from '../../../lib/nav'

/**
 * 활용하기 본문. `content/use/<slug>.md`가 정본이다.
 *
 * **`recipes`만 뺀다.** 우수 사례는 산문이 아니라 카드 여덟 장이라 `app/use/recipes/`가
 * 따로 그린다. 여기서 같은 주소를 또 만들면 빌드가 충돌한다.
 */
const OWN = new Set(['recipes'])

export function generateStaticParams() {
  return (navFind('/use')?.children ?? [])
    .map((c) => ({ slug: c.href.split('/').pop()! }))
    .filter(({ slug }) => !OWN.has(slug))
}

export default async function UseDoc({ params }: { params: Promise<{ slug: string }> }) {
  return <DocPage href={`/use/${(await params).slug}`} />
}
