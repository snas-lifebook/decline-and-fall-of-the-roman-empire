import { DocPage } from '../../components/DocPage'
import { pageMeta } from '../../lib/meta'

/**
 * 이 자료실은 무엇인가.
 *
 * 사이드바 다섯 갈래에 안 넣는다 — 갈림길이 아니라 각주다. 상단 바 오른쪽에서
 * 들어간다. 본문은 `content/about.md`가 정본이다.
 */
export const metadata = pageMeta('이 자료실은')

export default function About() {
  return <DocPage href="/about" />
}
