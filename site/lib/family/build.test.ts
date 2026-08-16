// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { families, familyBySlug } from './build'
import { loadLinks } from '../ontology'

const all = families()

describe('가문 추리기', () => {
  it('세 명 이상만 가문이 된다 — 둘은 그림이 안 된다', () => {
    expect(all.length).toBeGreaterThan(0)
    expect(all.every((f) => f.people.length >= 3)).toBe(true)
  })

  it('가장 큰 가문이 22명이다 (실측)', () => {
    expect(Math.max(...all.map((f) => f.people.length))).toBe(22)
  })

  it('큰 것부터 준다', () => {
    const sizes = all.map((f) => f.people.length)
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes)
  })

  it('슬러그가 겹치지 않는다', () => {
    const s = all.map((f) => f.slug)
    expect(new Set(s).size).toBe(s.length)
  })

  it('한 사람이 두 가문에 속하지 않는다', () => {
    const ids = all.flatMap((f) => f.people.map((p) => p.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('주소에서 가문으로 되돌아온다', () => {
    expect(familyBySlug(all[0].slug)?.title).toBe(all[0].title)
    expect(familyBySlug('없는가문')).toBeUndefined()
  })
})

describe('무엇을 그리나', () => {
  it('혈연과 혼인이 가문을 잇는다', () => {
    const rels = new Set(all.flatMap((f) => f.links.map((l) => l.rel)))
    expect(rels.has('child_of')).toBe(true)
  })

  it('계승은 가문을 만들지 않지만 가문 안에서는 그린다', () => {
    // 제위 계승은 혈연이 아니다. 이것으로 이어졌다고 한 가문이 되면 안 된다
    const withSucc = all.filter((f) => f.links.some((l) => l.rel === 'succeeded'))
    expect(withSucc.length).toBeGreaterThan(0)
  })

  it('링크의 양 끝이 그 가문 사람이다 — 밖으로 뻗는 선이 없다', () => {
    for (const f of all) {
      const ids = new Set(f.people.map((p) => p.id))
      expect(f.links.every((l) => ids.has(l.from) && ids.has(l.to))).toBe(true)
    }
  })
})

describe('아직 못 하는 것 — 데이터가 채워지면 이 테스트가 빨개진다', () => {
  it('바르카스 가문이 아직 없다', () => {
    // USECASE 3단계가 「이 프로젝트의 심장」이라 부른 화면이 이것이다 —
    // 하밀카르·한니발·하스드루발(동생)·하스드루발(사위)을 한 장에 놓고 가르는 것.
    // 지금 데이터에는 그 가계 관계가 없어서 가문이 안 만들어진다.
    // 관계가 들어오면 이 테스트가 실패하고, 그때 이 블록을 지운다.
    const names = all.flatMap((f) => f.people.map((p) => p.label))
    expect(names).not.toContain('한니발')
    expect(loadLinks().filter((l) => l.rel === 'child_of')).toHaveLength(56)
  })
})
