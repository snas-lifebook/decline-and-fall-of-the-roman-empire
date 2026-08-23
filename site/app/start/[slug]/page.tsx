import { DocPage } from '../../../components/DocPage'
import { navFind } from '../../../lib/nav'
import { pageMeta } from '../../../lib/meta'
import { loadDoc } from '../../../lib/doc'

/**
 * 시작하기 여섯 장. 본문은 `content/start/<slug>.md`가 정본이다.
 *
 * **`links`·`ai`를 뺀다.** 두 장은 산문이 아니라 카드·토글이 반복되는 화면이라
 * `app/start/links/`·`app/start/ai/`가 따로 그린다. 여기서 같은 주소를 또 만들면
 * 빌드가 충돌한다.
 */
const OWN = new Set(['links', 'ai'])

export function generateStaticParams() {
  return (navFind('/start')?.children ?? [])
    .map((c) => ({ slug: c.href.split('/').pop()! }))
    .filter(({ slug }) => !OWN.has(slug))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return pageMeta(loadDoc(`/start/${slug}`).title || '시작하기')
}

export default async function StartDoc({ params }: { params: Promise<{ slug: string }> }) {
  return <DocPage href={`/start/${(await params).slug}`} />
}
