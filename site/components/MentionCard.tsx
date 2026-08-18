import { TYPE_KO } from '../lib/export/table'
import { roleKo } from '../lib/vocab'
import { entityHref } from '../lib/entity'
import { portraitOf, lifespanOf } from '../lib/read/people'
import type { Card } from '../lib/read/cards'

/**
 * 여백 카드 한 장 — 본문에서 그 사람이 처음 나오는 문단 옆에 선다.
 *
 * **작게.** River가 보낸 스노우폴 화면에서 카드는 썸네일 + 이름 + 한 줄이 전부다.
 * 여기에 관계 목록이나 등장 포인트를 더하면 카드가 문단보다 커지고, 그 순간 본문이
 * 아니라 카드를 읽게 된다. 더 알고 싶으면 눌러서 객체 화면으로 간다.
 *
 * **왼쪽 자리는 늘 48×48로 채운다.** 위키미디어 초상은 262명 중 164명(63%)에게만
 * 있다(실측 2026-08-18). 사진이 있을 때만 그리면 나머지 98명이 빈 상자가 된다.
 * 사진이 없으면 **타입색 표식**이 그 자리에 들어가서, 있든 없든 카드가 같은 모양이
 * 된다. 사진은 있으면 좋은 것이지 카드의 조건이 아니다.
 *
 * `data-type`이 두 가지 일을 한다 — 표식 색을 고르고, 「종류 고르기」의 CSS가
 * 이걸 보고 숨긴다. 자바스크립트는 단추 하나뿐이다.
 */
export function MentionCard({ card }: { card: Card }) {
  const { entity: e, line, row } = card
  const role = e.attrs.role ? roleKo(String(e.attrs.role)) : null
  const portrait = portraitOf(e.id)
  // 인물만. 집단·사건에 생몰은 없다
  const years = e.type === 'person' ? lifespanOf(e.id) : null

  return (
    <a
      className="read-card"
      data-type={e.type}
      style={{ gridRow: row }}
      href={entityHref({ id: e.id, type: e.type, name: e.name })}
    >
      {portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="read-card-face"
          src={portrait.file}
          alt=""
          width={48}
          height={48}
          loading="lazy"
        />
      ) : (
        // 이름 첫 글자. 한글은 한 글자가 이미 덩어리라 두 글자를 넣으면 좁아 보인다
        <span className="read-card-mark" aria-hidden="true">
          {e.name.trim()[0]}
        </span>
      )}
      <span className="read-card-body">
        <span className="read-card-name">{e.name}</span>
        {/*
          역할 · 연대. 스노우폴의 「33, Professional freeskier」 자리다 — **그 사람이
          누구인지 한 줄**. 연대가 없으면 그 자리를 비우고 종류를 적는다. 262명 중
          연대가 있는 사람은 위키데이터가 아는 만큼뿐이라, 없는 것을 지어내지 않는다.
        */}
        <span className="read-card-meta">
          {[role ?? TYPE_KO[e.type], years].filter(Boolean).join(' · ')}
        </span>
        <span className="read-card-line">{line}</span>
      </span>
    </a>
  )
}
