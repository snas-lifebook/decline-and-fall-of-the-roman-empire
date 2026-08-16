// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { FAQ, FAQ_CATEGORIES, faqFor, faqByCategory } from './faq'

describe('자주 묻는 것', () => {
  it('id가 겹치지 않는다', () => {
    const ids = FAQ.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('물음표로 끝난다 — 답이 아니라 질문이다', () => {
    expect(FAQ.every((f) => f.q.trim().endsWith('?') || f.q.includes('?'))).toBe(true)
  })

  it('답이 비어 있지 않다 — 답할 수 있는 것만 싣는다', () => {
    expect(FAQ.every((f) => f.a.length > 20)).toBe(true)
  })

  it('선언한 분류를 다 쓴다', () => {
    for (const { items } of faqByCategory()) expect(items.length).toBeGreaterThan(0)
  })

  it('모든 항목이 선언된 분류에 속한다', () => {
    expect(FAQ.every((f) => FAQ_CATEGORIES.includes(f.category))).toBe(true)
  })
})

describe('화면에 딸리는 물음', () => {
  it('하위 경로도 상위 것을 받는다', () => {
    expect(faqFor('/start/install').length).toBeGreaterThan(0)
    expect(faqFor('/start/install')).toEqual(faqFor('/start'))
  })

  it('엉뚱한 화면에는 안 뜬다', () => {
    expect(faqFor('/없는곳')).toEqual([])
  })

  it('접두가 겹치는 다른 경로를 잘못 잡지 않는다', () => {
    // `/read`가 `/readme` 같은 것을 삼키면 안 된다
    expect(faqFor('/readme')).toEqual([])
  })

  it('화면에 안 걸린 것도 분류 목록에는 다 있다', () => {
    const shown = faqByCategory().flatMap((g) => g.items)
    expect(shown).toHaveLength(FAQ.length)
  })
})
