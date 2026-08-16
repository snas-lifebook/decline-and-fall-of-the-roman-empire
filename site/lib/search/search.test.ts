// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { choseong, isChoseongQuery, searchItems } from './match'
import { buildSearchIndex } from './build'

const INDEX = buildSearchIndex()

describe('초성', () => {
  it('한글에서 첫소리만 뽑는다', () => {
    expect(choseong('카이사르')).toBe('ㅋㅇㅅㄹ')
    expect(choseong('한니발')).toBe('ㅎㄴㅂ')
  })

  it('겹받침 초성도 제자리에 온다', () => {
    expect(choseong('짜장면')).toBe('ㅉㅈㅁ')
  })

  it('한글이 아닌 글자는 그대로 둔다 — 「율리아 (카이사르 가문)」 같은 이름이 있다', () => {
    expect(choseong('로마 2세')).toBe('ㄹㅁ 2ㅅ')
  })

  it('초성만 친 질의를 가려낸다', () => {
    expect(isChoseongQuery('ㅋㅇㅅㄹ')).toBe(true)
    expect(isChoseongQuery('카이')).toBe(false)
    // 한 글자는 초성으로 안 본다 — 결과가 수백 개라 쓸모가 없다
    expect(isChoseongQuery('ㅋ')).toBe(false)
    expect(isChoseongQuery('')).toBe(false)
  })
})

describe('찾기', () => {
  const hit = (q: string) => searchItems(INDEX, q).map((i) => i.name)

  it('이름 일부로 찾는다', () => {
    expect(hit('카이사')).toContain('카이사르')
  })

  it('초성으로 찾는다 — R-C가 Pagefind를 뺀 이유가 이것이다', () => {
    expect(hit('ㅋㅇㅅㄹ')).toContain('카이사르')
  })

  it('가운데 글자로도 찾는다', () => {
    expect(hit('니발')).toContain('한니발')
  })

  it('앞에서 맞는 것이 먼저 온다', () => {
    const r = hit('로마')
    expect(r[0].startsWith('로마')).toBe(true)
  })

  it('별칭으로도 찾힌다', () => {
    // 데이터에 alias가 있는 객체가 실제로 있다
    const withAlias = INDEX.find((i) => i.alias.length > 0)
    expect(withAlias).toBeDefined()
    expect(hit(withAlias!.alias[0])).toContain(withAlias!.name)
  })

  it('빈 질의는 아무것도 안 준다 — 644개를 쏟지 않는다', () => {
    expect(searchItems(INDEX, '')).toEqual([])
    expect(searchItems(INDEX, '   ')).toEqual([])
  })

  it('없는 것을 지어내지 않는다', () => {
    expect(searchItems(INDEX, '츄파춥스')).toEqual([])
  })

  it('한 번에 쏟아붓지 않는다', () => {
    expect(searchItems(INDEX, '로').length).toBeLessThanOrEqual(30)
  })
})

describe('색인', () => {
  it('객체 644개가 다 들어 있다', () => {
    expect(INDEX.filter((i) => i.kind === 'object')).toHaveLength(644)
  })

  it('포인트 30장과 문서도 같이 찾힌다 — 사람이 「설치」를 칠 수도 있다', () => {
    expect(INDEX.filter((i) => i.kind === 'point').length).toBeGreaterThanOrEqual(30)
    expect(INDEX.some((i) => i.kind === 'doc')).toBe(true)
  })

  it('모든 항목에 주소가 있다 — 눌러서 못 가면 검색이 아니다', () => {
    expect(INDEX.every((i) => i.href.startsWith('/'))).toBe(true)
  })

  it('id가 겹치지 않는다', () => {
    const ids = INDEX.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('초성이 미리 구워져 있다 — 브라우저에서 644번 다시 계산하지 않는다', () => {
    const caesar = INDEX.find((i) => i.name === '카이사르')!
    expect(caesar.cho).toBe('ㅋㅇㅅㄹ')
  })
})
