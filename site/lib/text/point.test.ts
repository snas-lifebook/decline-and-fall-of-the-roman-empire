// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { pointDoc } from './point'
import { docSections } from '../doc'
import { POINT_COUNT } from '../points'

const all = Array.from({ length: POINT_COUNT }, (_, i) => pointDoc(i + 1))

describe('포인트 본문 읽기', () => {
  it('30장을 전부 찾아 읽는다', () => {
    expect(all.every((p) => p.md.length > 100)).toBe(true)
  })

  it('제목을 준다', () => {
    expect(pointDoc(2).title).toBe('제1차 포에니 전쟁')
  })
})

describe('화면이 이미 가진 것을 본문에서 덜어낸다', () => {
  it('맨 위 H1이 남지 않는다 — 제목은 화면이 그린다', () => {
    expect(all.every((p) => !/^# /m.test(p.md))).toBe(true)
  })

  it('앞뒤 이동 줄이 남지 않는다 — 이전·다음은 화면이 그린다', () => {
    expect(all.every((p) => !p.md.includes('00_목차'))).toBe(true)
  })

  it('위키링크가 하나도 안 남는다 — 화면에 대괄호가 보이면 실패다', () => {
    expect(all.every((p) => !p.md.includes('[['))).toBe(true)
  })
})

describe('본문의 이름이 객체 링크로 뜬다 (F16)', () => {
  it('30장 전부에 객체 링크가 있다', () => {
    expect(all.every((p) => p.md.includes('](/objects/'))).toBe(true)
  })

  it('실측한 만큼 링크가 나온다 — 본문 산문 절만 1,250개였다', () => {
    const total = all.reduce((n, p) => n + (p.md.match(/\]\(\/objects\//g)?.length ?? 0), 0)
    expect(total).toBeGreaterThan(1200)
  })

  it('챕터 이동 링크는 객체로 안 만든다', () => {
    expect(all.every((p) => !p.md.includes('/objects/undefined'))).toBe(true)
    expect(all.some((p) => p.md.includes('](/objects/person/'))).toBe(true)
  })
})

describe('화면용과 복사용을 가른다', () => {
  it('복사용에는 링크 문법이 없다 — AI 창에 붙일 것이라 평문이 맞다', () => {
    expect(all.every((p) => !p.plain.includes('](/objects/'))).toBe(true)
    expect(all.every((p) => !p.plain.includes('[['))).toBe(true)
  })

  it('복사용도 본문이 통째로 들어 있다', () => {
    expect(all.every((p) => p.plain.length > 100)).toBe(true)
  })
})

describe('절이 목차에 잡힌다', () => {
  it('원문의 H3를 H2로 올려 docSections가 자를 수 있게 한다', () => {
    // 이걸 안 하면 우측 목차가 통째로 비어 나온다
    const withSections = all.filter((p) => docSections(p.md).sections.length > 0)
    expect(withSections.length).toBeGreaterThan(POINT_COUNT / 2)
  })
})

describe('한 줄 소개', () => {
  it('제목과 같은 말이면 비운다 — 같은 글을 두 번 쓰지 않는다', () => {
    expect(all.every((p) => p.lead !== p.title)).toBe(true)
  })

  it('제목 뒤에 붙은 「 — 제목」 꼬리를 뗀다', () => {
    expect(all.every((p) => !p.lead.includes(' — '))).toBe(true)
  })
})
