// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { lifespan } from './years'

describe('생몰 연대 한 줄', () => {
  it('둘 다 기원전이면 「기원전」을 한 번만 적는다', () => {
    expect(lifespan(-100, -44)).toBe('기원전 100~44')
  })

  it('시대를 걸치면 양쪽을 다 적는다 — 안 적으면 뜻이 뒤집힌다', () => {
    expect(lifespan(-63, 14)).toBe('기원전 63~서기 14')
  })

  it('둘 다 서기면 연도만', () => {
    expect(lifespan(37, 68)).toBe('37~68')
  })

  it('한쪽만 알면 그것만 적는다 — 없는 쪽을 지어내지 않는다', () => {
    expect(lifespan(-247, null)).toBe('기원전 247 태어남')
    expect(lifespan(null, 423)).toBe('423년 죽음')
  })

  it('아무것도 없으면 null — 빈 자리를 만들지 않는다', () => {
    expect(lifespan(null, null)).toBe(null)
  })
})
