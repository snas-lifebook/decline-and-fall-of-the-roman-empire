'use client'

import { useEffect, useState } from 'react'

/**
 * 사례 화면의 두 가지 조작 (2026-08-24 롤아웃).
 *
 *   1. **웹/데이터 필터.** `html[data-recipe-filter]`를 세워 CSS가 안 맞는 카드와
 *      빈 갈래 섹션을 숨긴다(read-card의 `data-cards` 관용과 같은 결). NNG: 사람이
 *      고르는 축(웹만으로 되나 / 자료를 받아야 하나)을 맨 앞에 세운다.
 *   2. **해시로 카드 펼치기.** 상단 선택 표에서 사례를 누르면 `#recipe-<id>`로 뛰는데,
 *      네이티브 `<details>`는 해시로 안 열린다 — 그래서 여기서 열고 스크롤한다.
 *      lib/read/boot의 부트 스크립트와 같은 최소 개입.
 *
 * 필터는 상태라 클라이언트 섬 하나가 필요하다. 카드·표·섹션은 전부 서버 렌더고,
 * 이 컴포넌트만 `'use client'`다.
 */
const FILTERS = [
  { key: '', label: '전체' },
  { key: 'web', label: '웹만으로' },
  { key: 'local', label: '자료 필요' },
] as const

export function RecipeControls() {
  const [active, setActive] = useState('')

  useEffect(() => {
    const openHash = () => {
      const id = decodeURIComponent(location.hash.replace(/^#/, ''))
      if (!id) return
      const el = document.getElementById(id)
      if (el instanceof HTMLDetailsElement) {
        el.open = true
        el.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }
    openHash()
    window.addEventListener('hashchange', openHash)
    return () => window.removeEventListener('hashchange', openHash)
  }, [])

  const pick = (key: string) => {
    setActive(key)
    if (key) document.documentElement.dataset.recipeFilter = key
    else delete document.documentElement.dataset.recipeFilter
  }

  return (
    <div className="recipe-filter" role="group" aria-label="사례 거르기">
      {FILTERS.map((f) => (
        <button
          key={f.key || 'all'}
          type="button"
          className="recipe-filter-btn"
          data-active={active === f.key ? '' : undefined}
          onClick={() => pick(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
