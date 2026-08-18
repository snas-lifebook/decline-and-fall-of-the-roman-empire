import { TYPE_KO } from '../lib/export/table'
import { roleKo } from '../lib/vocab'
import { entityHref } from '../lib/entity'
import type { Card } from '../lib/read/cards'

/**
 * 여백 카드 한 장 — 본문에서 그 사람이 처음 나오는 문단 옆에 선다.
 *
 * **작게.** River가 보낸 스노우폴 화면에서 카드는 썸네일 + 이름 + 한 줄이 전부다.
 * 여기에 관계 목록이나 등장 포인트를 더하면 카드가 문단보다 커지고, 그 순간 본문이
 * 아니라 카드를 읽게 된다. 더 알고 싶으면 눌러서 객체 화면으로 간다.
 *
 * **왼쪽 자리는 늘 64×64로 채운다.** 위키미디어 초상 커버리지가 실측 44%라(2026-08-18)
 * 사진이 있을 때만 그리면 절반이 빈 상자가 된다. 사진이 없으면 **타입색 표식**이
 * 들어가서, 있든 없든 카드가 같은 모양이 된다. 사진은 있으면 좋은 것이지 조건이 아니다.
 *
 * `data-type`이 두 가지 일을 한다 — 표식 색을 고르고, 「종류 고르기」의 CSS가
 * 이걸 보고 숨긴다. 자바스크립트는 단추 하나뿐이다.
 */
export function MentionCard({ card }: { card: Card }) {
  const { entity: e, line, row } = card
  const role = e.attrs.role ? roleKo(String(e.attrs.role)) : null

  return (
    <a
      className="read-card"
      data-type={e.type}
      style={{ gridRow: row }}
      href={entityHref({ id: e.id, type: e.type, name: e.name })}
    >
      {/* 이름 첫 글자. 한글은 한 글자가 이미 덩어리라 두 글자를 넣으면 좁아 보인다 */}
      <span className="read-card-mark" aria-hidden="true">
        {e.name.trim()[0]}
      </span>
      <span className="read-card-body">
        <span className="read-card-name">{e.name}</span>
        <span className="read-card-meta">{role ? `${role} · ${TYPE_KO[e.type]}` : TYPE_KO[e.type]}</span>
        <span className="read-card-line">{line}</span>
      </span>
    </a>
  )
}
