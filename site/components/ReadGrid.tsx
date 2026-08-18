import { Fragment } from 'react'
import { Heading, Markdown } from '@astryxdesign/core'
import { MentionCard } from './MentionCard'
import type { ReadLayout } from '../lib/read/cards'

/**
 * 본문 + 여백 카드.
 *
 * **그리드 한 벌이 전부다.** 본문 블록은 1열에 순서대로 흘러 1·2·3행이 되고, 카드는
 * `gridRow`를 명시해 2열의 그 행에 선다. 세로 위치를 맞추려고 스크롤을 관찰하거나
 * 좌표를 재지 않는다 — **글자 크기가 바뀌어도 그리드가 알아서 다시 맞춘다.**
 *
 * **카드는 블록의 형제여야 한다.** 그리드 배치는 직계 자식에게만 걸리므로, 카드를
 * 블록 안에 넣으면 `gridRow`가 조용히 무시된다.
 *
 * DOM 순서는 **읽는 순서 그대로**다(블록, 그 블록에 걸린 카드, 다음 블록…). 그리드는
 * 명시 배치라 DOM 순서를 안 보지만, 좁은 화면에서 그리드를 풀면 그 순서가 그대로 살아
 * 카드가 제 문단 바로 뒤에 붙는다. 낭독기가 읽는 순서도 이것이다.
 *
 * 블록마다 `Markdown`을 따로 부른다. 본문이 문단 1,453 · 제목 168 · 불렛 41뿐이고
 * 표도 코드블록도 없어서(실측 2026-08-18) 빈 줄로 갈라도 마크다운이 안 깨진다.
 */
export function ReadGrid({ layout }: { layout: ReadLayout }) {
  const byRow = new Map<number, ReadLayout['cards']>()
  for (const c of layout.cards) {
    byRow.set(c.row, [...(byRow.get(c.row) ?? []), c])
  }

  /*
   * 제목 블록은 `Markdown`에 안 맡기고 `Heading`으로 낸다 — `Markdown`이 제목에 id를
   * 안 달아서, 그대로 두면 **목차가 아무 데도 못 뛴다.** 번호는 `readLayout`이 미리
   * 매겼다. 그리는 중에 세면 리액트 규칙에 걸린다.
   */
  return (
    <div className="read-grid">
      {layout.blocks.map((block, i) => {
        const h = layout.headings[i]
        return (
          <Fragment key={i}>
            <div className="read-block" {...(h ? { id: h.id } : {})}>
              {h ? <Heading level={2}>{h.title}</Heading> : <Markdown>{block}</Markdown>}
            </div>
            {(byRow.get(i + 1) ?? []).map((c) => (
              <MentionCard key={c.entity.id} card={c} />
            ))}
          </Fragment>
        )
      })}
    </div>
  )
}
