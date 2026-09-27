import { describe, it, expect } from 'vitest'
import { shouldShowPromo } from './promo'

describe('홍보 영상 팝업은 첫 화면의 첫 방문자에게만', () => {
  it('첫 화면 첫 방문은 띄운다', () => expect(shouldShowPromo('/', '', null)).toBe(true))
  it('본 사람은 안 띄운다', () => expect(shouldShowPromo('/', '', '2026-09-27')).toBe(false))
  it('다른 화면으로 곧장 들어오면 안 띄운다(링크로 온 사람의 읽기를 막지 않는다)', () =>
    expect(shouldShowPromo('/objects/person/카이사르', '', null)).toBe(false))
  it('?promo=1은 어디서든, ?promo=0은 끈다', () => {
    expect(shouldShowPromo('/read', '?promo=1', 'x')).toBe(true)
    expect(shouldShowPromo('/', '?promo=0', null)).toBe(false)
  })
})
