// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { SITE_LINKS, linkById, linksByCategory, LINK_CATEGORIES, REPO, ZIP_URL } from './links'

describe('링크 레지스트리 — 주소는 여기 한 곳에만 산다', () => {
  it('id가 겹치지 않는다', () => {
    const ids = SITE_LINKS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('주소가 겹치지 않는다 — 같은 곳을 두 이름으로 부르지 않는다', () => {
    const hrefs = SITE_LINKS.map((l) => l.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('전부 https다', () => {
    expect(SITE_LINKS.every((l) => l.href.startsWith('https://'))).toBe(true)
  })

  it('제목과 설명이 비어 있지 않다', () => {
    expect(SITE_LINKS.every((l) => l.title.length > 0 && l.desc.length > 0)).toBe(true)
  })

  it('선언한 분류를 다 쓴다 — 빈 서랍을 만들지 않는다', () => {
    for (const c of LINK_CATEGORIES) expect(linksByCategory(c).length).toBeGreaterThan(0)
  })

  it('모든 링크가 선언된 분류에 속한다', () => {
    expect(SITE_LINKS.every((l) => LINK_CATEGORIES.includes(l.category))).toBe(true)
  })
})

describe('id로 찾기', () => {
  it('찾아 준다', () => {
    expect(linkById('sheet').href).toContain('docs.google.com/spreadsheets')
    expect(linkById('repo').href).toBe(REPO)
  })

  it('없는 id는 던진다 — 조용히 죽은 링크를 내보내지 않는다', () => {
    expect(() => linkById('없는것')).toThrow()
  })
})

describe('한 곳에서만 관리한다', () => {
  it('ZIP 주소가 레지스트리와 어긋나지 않는다', () => {
    expect(linkById('zip').href).toBe(ZIP_URL)
    expect(ZIP_URL.startsWith(REPO)).toBe(true)
  })

  it('회차에 딸린 것이 표시돼 있다 — 회차가 늘면 이쪽만 바뀐다', () => {
    expect(SITE_LINKS.some((l) => l.perSession)).toBe(true)
  })

  it('텔레그램 방 주소는 안 싣는다 — 「한 줄 남기기」로 일원화했다 (2026-08-14 결정)', () => {
    expect(SITE_LINKS.some((l) => l.href.includes('t.me/'))).toBe(false)
  })

  it('피그마는 실측한 node-id를 쓴다 — 81-38은 깃 주소 한 줄이라 가이드가 안 보인다', () => {
    expect(linkById('figma').href).toContain('node-id=79-192')
  })
})
