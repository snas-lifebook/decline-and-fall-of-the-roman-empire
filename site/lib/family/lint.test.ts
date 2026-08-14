// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { lintFamilyLinks } from './lint'
import type { FamilyLink } from './layout'

const c = (from: string, to: string): FamilyLink => ({ from, rel: 'child_of', to })

describe('방향 부채 세기', () => {
  it('같은 쌍이 양방향이면 모순으로 잡는다', () => {
    const r = lintFamilyLinks([c('a', 'b'), c('b', 'a')])
    expect(r.contradictions).toEqual([{ a: 'a', b: 'b' }])
  })

  it('한 방향만 있으면 모순이 아니다', () => {
    expect(lintFamilyLinks([c('a', 'b')]).contradictions).toHaveLength(0)
  })

  it('중복 링크를 센다', () => {
    const r = lintFamilyLinks([c('a', 'b'), c('a', 'b'), c('a', 'c')])
    expect(r.duplicates).toEqual([{ from: 'a', to: 'b', count: 2 }])
  })

  it('부모가 너무 많은 사람을 잡는다', () => {
    const r = lintFamilyLinks([c('p1', 'kid'), c('p2', 'kid'), c('p3', 'kid')])
    expect(r.tooManyParents).toEqual([{ id: 'kid', count: 3 }])
  })

  it('혼인·계승은 안 본다 — child_of만의 문제다', () => {
    const links: FamilyLink[] = [
      { from: 'a', rel: 'married', to: 'b' },
      { from: 'b', rel: 'married', to: 'a' },
      { from: 'a', rel: 'succeeded', to: 'b' },
    ]
    const r = lintFamilyLinks(links)
    expect(r.contradictions).toHaveLength(0)
    expect(r.duplicates).toHaveLength(0)
  })

  it('빈 입력에 터지지 않는다', () => {
    const r = lintFamilyLinks([])
    expect(r).toEqual({ duplicates: [], contradictions: [], tooManyParents: [] })
  })
})
