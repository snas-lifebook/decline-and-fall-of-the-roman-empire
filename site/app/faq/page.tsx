import { DocShell, type DocSection } from '../../components/DocShell'
import { Faq } from '../../components/Faq'
import { faqByCategory, FAQ } from '../../lib/faq'
import { pageMeta } from '../../lib/meta'

/**
 * 전부 모아 분류로 본다. 각 화면 하단에는 그 화면 것만 뜨므로 여기가 유일하게
 * 전체를 보는 자리다.
 *
 * 2026-08-19에 `DocShell`로 옮겼다. 분류마다 H2가 서는데 우측 목차가 없어서,
 * 물음을 위에서부터 훑는 것 말고는 자기 분류로 갈 방법이 없었다.
 *
 * 뼈대가 맨 아래 붙이는 「자주 묻는 것」은 여기서 안 뜬다 — `faqFor('/faq')`가
 * 빈 배열이고 `Faq`가 빈 목록에 `null`을 낸다. 자주 묻는 것 안에 자주 묻는 것이
 * 겹치지 않는다.
 */
export const metadata = pageMeta('자주 묻는 것')

function sections(): DocSection[] {
  // 분류 이름은 한글이라 슬러그가 안 선다. 사이트 규약대로 순번을 쓴다
  return faqByCategory().map(({ category, items }, i) => ({
    id: `sec-${i + 1}`,
    title: category,
    body: <Faq items={items} title={null} />,
  }))
}

export default function FaqPage() {
  return (
    <DocShell
      href="/faq"
      title="자주 묻는 것"
      summary={`실제로 나왔던 물음 ${FAQ.length}개입니다. 여기 없는 것은 화면 아래 「한 줄 남기기」로 물어봐 주세요.`}
      sections={sections()}
    />
  )
}
