// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { MAX_BODY, RATE_MAX, feedbackSchema, isFlooding } from './feedback'

/**
 * 이 파일이 지키는 것은 하나다 — **어느 화면에서 남겼는지 모르는 의견은 안 받는다.**
 * 그게 이 기능의 존재 이유이므로 주소가 없으면 통과시키지 않는다.
 */

const ok = {
  path: '/objects/person/한니발',
  where: '객체 한니발',
  body: '형제 이름이 둘 다 하스드루발로 나옵니다',
}

describe('한 줄 남기기 — 받을 것과 안 받을 것', () => {
  it('화면을 아는 의견은 받는다', () => {
    const r = feedbackSchema.safeParse(ok)
    expect(r.success).toBe(true)
    expect(r.success && r.data.path).toBe('/objects/person/한니발')
  })

  it('주소가 없으면 안 받는다 — 어느 화면인지 모르면 고칠 수가 없다', () => {
    expect(feedbackSchema.safeParse({ ...ok, path: '' }).success).toBe(false)
    expect(feedbackSchema.safeParse({ where: ok.where, body: ok.body }).success).toBe(false)
  })

  it('화면 이름도 같이 받는다 — 주소만 있으면 표를 훑을 때 안 읽힌다', () => {
    expect(feedbackSchema.safeParse({ ...ok, where: '' }).success).toBe(false)
  })

  it('빈 말은 안 받는다 — 공백만 친 것도 빈 말이다', () => {
    expect(feedbackSchema.safeParse({ ...ok, body: '' }).success).toBe(false)
    expect(feedbackSchema.safeParse({ ...ok, body: '   \n  ' }).success).toBe(false)
  })

  it('앞뒤 공백은 털어서 담는다', () => {
    const r = feedbackSchema.safeParse({ ...ok, body: '  띄어쓰기가 틀렸습니다  ' })
    expect(r.success && r.data.body).toBe('띄어쓰기가 틀렸습니다')
  })

  it('길이에 천장이 있다', () => {
    expect(feedbackSchema.safeParse({ ...ok, body: 'ㄱ'.repeat(MAX_BODY) }).success).toBe(true)
    expect(feedbackSchema.safeParse({ ...ok, body: 'ㄱ'.repeat(MAX_BODY + 1) }).success).toBe(false)
  })

  it('벌통이 채워져 있으면 사람이 아니다', () => {
    expect(feedbackSchema.safeParse({ ...ok, trap: '' }).success).toBe(true)
    expect(feedbackSchema.safeParse({ ...ok, trap: 'spam@example.com' }).success).toBe(false)
  })

  it('무엇에 대한 것인지는 없어도 된다', () => {
    expect(feedbackSchema.safeParse({ ...ok, subject: undefined }).success).toBe(true)
    expect(feedbackSchema.safeParse({ ...ok, subject: '하스드루발' }).success).toBe(true)
  })
})

describe('도배 판정', () => {
  it('창 안에서 정해진 수를 채우면 그때부터 막는다', () => {
    expect(isFlooding(RATE_MAX - 1)).toBe(false)
    expect(isFlooding(RATE_MAX)).toBe(true)
  })

  it('두세 줄 이어 남기는 것은 안 막는다 — 그건 도배가 아니라 정상이다', () => {
    expect(RATE_MAX).toBeGreaterThan(3)
    expect(isFlooding(3)).toBe(false)
  })
})
