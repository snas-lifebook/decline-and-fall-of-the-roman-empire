// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { book, books, bookById, bookHref, textPart, textSlug } from './book'
import { POINT_COUNT } from './points'

/**
 * 책 한 권의 뼈대.
 *
 * 여기서 지키는 것은 둘이다 — **아무도 빠지지 않는 것**과 **쪽수를 지어내지 않는 것**.
 * 앞의 것은 일러두기·책머리에·옮기고 나서가 실제로 사이트에서 사라져 있던 사고를
 * 다시 안 내려는 것이고, 뒤의 것은 종이책을 펴 놓고 같은 자리를 찾는 사람이 있기
 * 때문이다.
 */

describe('책 한 권', () => {
  it('앞뒤 글까지 33편이 읽는 순서로 선다', () => {
    const parts = book().parts
    expect(parts).toHaveLength(POINT_COUNT + 3)
    expect(parts.map((p) => p.kind)).toEqual([
      'front',
      'front',
      ...Array(POINT_COUNT).fill('point'),
      'back',
    ])
  })

  it('번호는 본문 30편에만 붙는다 — 앞뒤 글은 몇 번이 아니다', () => {
    const numbered = book().parts.filter((p) => p.n !== undefined)
    expect(numbered).toHaveLength(POINT_COUNT)
    expect(numbered.map((p) => p.n)).toEqual(
      Array.from({ length: POINT_COUNT }, (_, i) => i + 1),
    )
  })

  it('같은 주소가 두 번 나오지 않는다', () => {
    const hrefs = book().parts.map((p) => p.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(hrefs.every((h) => h.startsWith('/read/'))).toBe(true)
  })

  /**
   * **쪽수는 `points/00_목차.md`에서 읽어 온다.** 화면에 손으로 옮겨 적으면 언젠가
   * 어긋난다 — `resolveFacts`가 「셀 수 있는 것은 센다」고 못박은 것과 같은 자리다.
   */
  it('종이책 쪽수를 차례에서 읽어 온다', () => {
    const at = (title: string) => book().parts.find((p) => p.title === title)?.page
    expect(at('일러두기')).toBe(4)
    expect(at('책머리에')).toBe(6)
    expect(at('옮기고 나서')).toBe(317)
    // 본문 첫 편과 끝 편
    expect(book().parts.find((p) => p.n === 1)?.page).toBe(21)
    expect(book().parts.find((p) => p.n === POINT_COUNT)?.page).toBe(303)
  })

  it('쪽수가 앞에서 뒤로 늘어난다 — 하나라도 어긋나면 파싱이 밀린 것이다', () => {
    const pages = book()
      .parts.map((p) => p.page)
      .filter((p): p is number => p !== undefined)
    expect(pages).toHaveLength(POINT_COUNT + 3)
    expect([...pages].sort((a, b) => a - b)).toEqual(pages)
  })

  it('주소 조각은 공백을 밑줄로 바꾼 것이고, 그 조각으로 되찾을 수 있다', () => {
    expect(textSlug('옮기고 나서')).toBe('옮기고_나서')
    expect(textPart('옮기고_나서')?.file).toBe('99_옮기고_나서')
    expect(textPart('일러두기')?.kind).toBe('front')
    // 본문 30편은 파일이 아니라 번호로 열린다. 여기서 안 걸려야 한다
    expect(textPart('위대한_로마_제국의_탄생')).toBeUndefined()
    expect(textPart('없는글')).toBeUndefined()
  })

  it('책 주소가 하나다', () => {
    expect(bookHref()).toBe('/read/rome30')
  })
})

/**
 * 두 번째 권 — 기번 원전 (2026-08-19).
 *
 * 여기서 지키는 것은 **두 권이 섞이지 않는 것**이다. 온톨로지의 서술은 포인트
 * 번호에 묶여 있고 장 번호에는 안 묶여 있어서, 장에 카드를 붙이면 그 즉시
 * 화면이 거짓말을 한다.
 */
describe('기번 원전', () => {
  const g = () => bookById('gibbon')!

  it('책장에 두 권이 있고 편역본이 먼저다', () => {
    expect(books().map((b) => b.id)).toEqual(['rome30', 'gibbon'])
  })

  it('서문 하나와 71장이다 — 서문에 장 번호를 붙이지 않는다', () => {
    const parts = g().parts
    expect(parts).toHaveLength(72)
    expect(parts[0]).toMatchObject({ kind: 'front', href: '/read/source/0' })
    expect(parts[0].n).toBeUndefined()

    const chapters = parts.filter((p) => p.kind === 'chapter')
    expect(chapters).toHaveLength(71)
    expect(chapters.map((p) => p.n)).toEqual(Array.from({ length: 71 }, (_, i) => i + 1))
  })

  /**
   * 제목은 원문 H1에서 깎아 온다. 「Chapter XV:」는 번호가 이미 말하고
   * 「—Part I.」은 그 장의 첫 부라는 뜻일 뿐이라 둘 다 떨어져야 한다.
   */
  it('장 제목에서 장 번호와 Part 꼬리를 뗀다', () => {
    const titles = g().parts.filter((p) => p.kind === 'chapter').map((p) => p.title)
    expect(titles.some((t) => /^Chapter\s/i.test(t)), '「Chapter N:」이 남았다').toBe(false)
    expect(titles.some((t) => /Part\s+[IVXLC]+/i.test(t)), '「Part I」이 남았다').toBe(false)
    expect(titles.every((t) => t.length > 0), '제목이 빈 장이 있다').toBe(true)
    expect(g().parts.find((p) => p.n === 15)?.title).toBe('Progress Of The Christian Religion')
  })

  it('두 권의 주소가 안 겹친다', () => {
    const all = books().flatMap((b) => b.parts.map((p) => p.href))
    expect(new Set(all).size).toBe(all.length)
  })

  it('원전에는 종이책 쪽수가 없다 — 그 데이터는 편역본 차례에만 있다', () => {
    expect(g().parts.every((p) => p.page === undefined)).toBe(true)
  })

  it('영어 책이라고 밝힌다 — 낭독기가 알아야 한다', () => {
    expect(g().lang).toBe('en')
    expect(book().lang).toBeUndefined()
  })

  it('짧은 이름이 둘 다 있다 — 긴 제목은 사이드바에 안 들어간다', () => {
    expect(books().every((b) => b.short.length > 0 && b.short.length <= 12)).toBe(true)
  })
})
