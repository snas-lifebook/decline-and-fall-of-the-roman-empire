// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { book, bookHref, textPart, textSlug } from './book'
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
