import { DocPage } from '../../../components/DocPage'
import { navFind } from '../../../lib/nav'

/** 활용하기 네 장. 본문은 `content/use/<slug>.md`가 정본이다 */
export function generateStaticParams() {
  return (navFind('/use')?.children ?? []).map((c) => ({ slug: c.href.split('/').pop()! }))
}

export default async function UseDoc({ params }: { params: Promise<{ slug: string }> }) {
  return <DocPage href={`/use/${(await params).slug}`} />
}
