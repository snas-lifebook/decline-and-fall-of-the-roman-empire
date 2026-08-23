import { Divider } from '@astryxdesign/core'
import { navSteps } from '../lib/nav'

type Step = { href: string; title: string }

/**
 * 문서 한 장의 끝 — 「다 읽었다 → 어디로」에 답하는 앞뒤 페이지네이션.
 *
 * ## 「다음 단계」 블록을 걷어냈다 (#8, 2026-08-20)
 *
 * 앞 판은 굵은 「다음 단계」 라벨 + `Item`(다음 글) **밑에** 작은 「← 이전 / 다음 →」
 * 글자줄을 또 뒀다. 그런데 두 곳이 `next` **같은 값**을 그려서 — 다음 글이 화면마다
 * 두 번 적혔다(/start/install 실측: 「옵시디언에서 자료 열기」가 카드로 한 번,
 * 오른쪽 링크로 또 한 번). 정보는 하나인데 자리를 둘 먹고, 둘 다 밋밋했다.
 *
 * Mintlify(=docs.claude.com 엔진)·Nextra·OpenAI 문서가 다 쓰는 **앞뒤 카드 한 줄**로
 * 합친다 — 왼쪽 「이전 + 제목」, 오른쪽 「다음 + 제목」. 「다음」 카드가 곧 다음 단계라
 * 따로 부를 필요가 없다. 그래서 `hasNextStep` 플래그도 사라졌다 — 누르던 블록이
 * 없어졌으니 끌 것이 없다. 스타일은 `globals.css`의 `.doc-pager`가 진다.
 *
 * `<a>`는 astryx `Text` 밖 순수 `<nav>`에 둔다 — `.astryx-text a`의 파란 밑줄을
 * 안 타고 카드 모양을 온전히 갖는다(헌장 15: 겹치는 두 스타일을 안 만든다).
 *
 * 객체 상세 644장은 `navTree`에 없어 `navSteps`가 못 푸므로 `prev`·`next`를 직접
 * 받는다(`entitySteps`).
 */
export function DocFooterNav({
  href,
  prev: prevIn,
  next: nextIn,
}: {
  href?: string
  prev?: Step
  next?: Step
}) {
  const nav = href ? navSteps(href) : {}
  const prev = prevIn ?? nav.prev
  const next = nextIn ?? nav.next
  if (!prev && !next) return null
  return (
    <>
      <Divider />
      <nav className="doc-pager" aria-label="문서 앞뒤 이동">
        {prev ? (
          <a className="doc-pager-card doc-pager-prev" href={prev.href}>
            <span className="doc-pager-dir">← 이전</span>
            <span className="doc-pager-title">{prev.title}</span>
          </a>
        ) : (
          // 다음만 있을 때, 격자 왼 칸을 채워 다음 카드를 오른쪽에 붙인다
          <span />
        )}
        {next ? (
          <a className="doc-pager-card doc-pager-next" href={next.href}>
            <span className="doc-pager-dir">다음 →</span>
            <span className="doc-pager-title">{next.title}</span>
          </a>
        ) : null}
      </nav>
    </>
  )
}
