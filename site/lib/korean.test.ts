// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { ro } from './korean'

/**
 * 조사 하나지만 **모든 화면 아래에 찍힌다.** 「첫 화면로」가 실제로 745장에 나가
 * 있었고, River가 사이트를 밖에 공유하기 직전에 발견했다.
 */
describe('로 / 으로', () => {
  it('받침이 없으면 로', () => {
    expect(ro('쇠망사')).toBe('로')
    expect(ro('가져가기')).toBe('로')
    expect(ro('읽기')).toBe('로')
  })

  it('받침이 ㄹ이면 로 — 「서울로」지 「서울으로」가 아니다', () => {
    expect(ro('서울')).toBe('로')
    expect(ro('하늘')).toBe('로')
  })

  it('그 밖의 받침이면 으로', () => {
    expect(ro('첫 화면')).toBe('으로') // 실제로 틀려서 나갔던 그 자리
    expect(ro('자주 묻는 것')).toBe('으로')
    expect(ro('탄생')).toBe('으로')
  })

  it('한글이 아니면 로 — 죽지 않는다', () => {
    expect(ro('FAQ')).toBe('로')
    expect(ro('30')).toBe('로')
    expect(ro('')).toBe('로')
  })
})
