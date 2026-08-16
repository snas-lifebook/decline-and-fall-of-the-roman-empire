// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { PITFALLS, PITFALL_CATEGORIES, pitfallsByCategory } from './pitfalls'
import { SKILLS } from './skills'

describe('그냥 시키면 틀리는 것', () => {
  it('id가 겹치지 않는다', () => {
    const ids = PITFALLS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('여덟이다 — 화면이 「여덟 군데」라고 약속한다', () => {
    expect(PITFALLS).toHaveLength(8)
  })

  it('모든 항목이 선언된 분류에 속한다', () => {
    expect(PITFALLS.every((p) => PITFALL_CATEGORIES.includes(p.category))).toBe(true)
  })

  it('선언한 분류를 다 쓴다 — 빈 절을 그리지 않는다', () => {
    for (const { items } of pitfallsByCategory()) expect(items.length).toBeGreaterThan(0)
  })

  it('분류 목록이 항목을 하나도 빠뜨리지 않는다', () => {
    expect(pitfallsByCategory().flatMap((g) => g.items)).toHaveLength(PITFALLS.length)
  })
})

describe('일반론을 싣지 않는다', () => {
  it('항목마다 실측 숫자가 붙는다', () => {
    // 이 화면의 존재 이유다 — "AI는 가끔 틀립니다"가 아니라 "68건 중 19건 반려".
    // 숫자 없는 항목이 들어오면 그건 일반론이고, 여기 있으면 안 된다
    expect(PITFALLS.every((p) => /\d/.test(p.count))).toBe(true)
  })

  it('위험과 대처가 둘 다 있다 — 겁만 주고 끝내지 않는다', () => {
    expect(PITFALLS.every((p) => p.risk.length > 20 && p.so.length > 20)).toBe(true)
  })

  it('대처가 「그래서」로 시작하지 않는다 — 라벨이 이미 그 말이다', () => {
    expect(PITFALLS.every((p) => !p.so.startsWith('그래서'))).toBe(true)
  })
})

describe('스킬과 이어진다', () => {
  it('걸러주는 스킬로 지목한 것이 실재한다', () => {
    const ids = new Set(SKILLS.map((s) => s.id))
    for (const p of PITFALLS) if (p.skill) expect(ids.has(p.skill)).toBe(true)
  })

  it('적어도 셋은 스킬로 걸러진다 — 「조심하세요」로 끝나면 쓸모가 없다', () => {
    expect(PITFALLS.filter((p) => p.skill).length).toBeGreaterThanOrEqual(3)
  })
})

describe('스킬의 「조심할 것」', () => {
  it('사료 대조는 발췌하지 말라고 적혀 있다', () => {
    // SKILL.md 원문의 「하지 말 것」이다. 앞 판에서 카드로 옮기며 잘려 나갔다 —
    // 문맥이 끊긴 발췌를 넣으면 인과관계 오류를 통째로 놓친다
    const factCheck = SKILLS.find((s) => s.id === 'fact-check')
    expect(factCheck?.caution).toMatch(/발췌/)
  })

  it('조심할 것이 있으면 한 문장으로 끝난다', () => {
    for (const s of SKILLS) if (s.caution) expect(s.caution.length).toBeLessThan(90)
  })
})
