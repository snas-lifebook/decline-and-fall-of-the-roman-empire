import { DocPage } from '../../../components/DocPage'
import { navFind } from '../../../lib/nav'

/** 시작하기 여섯 장. 본문은 `content/start/<slug>.md`가 정본이다 */
export function generateStaticParams() {
  return (navFind('/start')?.children ?? []).map((c) => ({ slug: c.href.split('/').pop()! }))
}

export default async function StartDoc({ params }: { params: Promise<{ slug: string }> }) {
  return <DocPage href={`/start/${(await params).slug}`} />
}
