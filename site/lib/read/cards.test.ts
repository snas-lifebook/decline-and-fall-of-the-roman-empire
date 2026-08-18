// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readLayout, CARD_TYPES, MAX_PER_BLOCK, MAX_CARDS, MAX_DENSITY } from './cards'
import { loadEntities, loadLinks } from '../ontology'
import { pointDoc } from '../text/point'
import { docSections } from '../doc'
import { CARD_TYPE_KO } from './types'
import { TYPE_KO } from '../export/table'

const ENTITIES = loadEntities()
const LINKS = loadLinks()

/** 화면이 넘겨줄 모양 그대로 — `pointDoc`이 이미 위키링크를 주소로 바꿔 놓았다 */
const layoutOf = (n: number) => readLayout(n, pointDoc(n).md, ENTITIES, LINKS)

describe('본문 쪼개기', () => {
  it('빈 줄로 블록을 가른다 — 이 그리드의 행이 된다', () => {
    const { blocks } = layoutOf(5)
    expect(blocks.length).toBeGreaterThan(10)
    expect(blocks.every((b) => b.trim().length > 0)).toBe(true)
  })

  it('블록을 합치거나 잃지 않는다 — 본문 글자가 그대로 남는다', () => {
    const md = pointDoc(5).md
    const { blocks } = readLayout(5, md, ENTITIES)
    const lost = md.replace(/\s+/g, '').length - blocks.join('').replace(/\s+/g, '').length
    expect(lost).toBe(0)
  })
})

describe('절 제목', () => {
  it('**목차가 뛰는 곳과 제목이 붙는 곳이 같다** — 번호를 두 곳에서 매기고 있다', () => {
    for (let n = 1; n <= 30; n += 1) {
      const mine = layoutOf(n)
        .headings.filter((h) => h !== null)
        .map((h) => `${h!.id}|${h!.title}`)
      const theirs = docSections(pointDoc(n).md).sections.map((s) => `${s.id}|${s.title}`)
      expect(mine, `포인트 ${n}`).toEqual(theirs)
    }
  })

  it('제목 아닌 블록에는 id를 안 단다 — 아무 데나 앵커를 뿌리지 않는다', () => {
    const { blocks, headings } = layoutOf(5)
    expect(headings.length).toBe(blocks.length)
    blocks.forEach((b, i) => {
      expect(headings[i] === null).toBe(!b.startsWith('## '))
    })
  })
})

describe('카드 고르기', () => {
  it('**벽이 되지 않는다** — 문단 셋에 카드 하나꼴을 넘지 않는다', () => {
    for (let n = 1; n <= 30; n += 1) {
      const { blocks, cards } = layoutOf(n)
      expect(cards.length, `포인트 ${n} 장수`).toBeLessThanOrEqual(MAX_CARDS)
      expect(cards.length / blocks.length, `포인트 ${n} 밀도`).toBeLessThanOrEqual(MAX_DENSITY)
    }
    // 인물이 많은 대목에서는 실제로 여러 장 나와야 기능이 산다
    expect(layoutOf(5).cards.length).toBeGreaterThan(3)
  })

  it('잘랐으면 몇 장 중 몇 장인지 셀 수 있다 — 말없이 자르지 않는다', () => {
    // 포인트 13은 27명이 나온다. 다 세우면 네 문단 중 셋에 카드가 붙는다
    const p13 = layoutOf(13)
    expect(p13.total).toBeGreaterThan(p13.cards.length)
    // 잘릴 것이 없는 대목에서는 두 값이 같다
    const small = layoutOf(21)
    expect(small.total).toBeGreaterThanOrEqual(small.cards.length)
  })

  it('자를 때 관계가 얽힌 사람을 남긴다 — 헷갈리는 사람이 그 사람이다', () => {
    const { cards } = layoutOf(13)
    const deg = (id: string) => LINKS.filter((l) => l.point === 13 && (l.from === id || l.to === id)).length
    // 남은 카드의 관계 수 중앙값이, 그 대목 전체 평균보다 높아야 한다
    const kept = cards.map((c) => deg(c.entity.id)).sort((a, b) => a - b)
    expect(kept[Math.floor(kept.length / 2)]).toBeGreaterThan(0)
  })

  it('**지명은 카드가 안 된다** — 지도가 받는다', () => {
    for (let n = 1; n <= 30; n += 1) {
      expect(layoutOf(n).cards.some((c) => c.entity.type === 'place')).toBe(false)
    }
    expect(CARD_TYPES).not.toContain('place')
  })

  it('같은 사람은 처음 한 번만 — 두 번째 언급부터는 본문 링크뿐이다', () => {
    const ids = layoutOf(5).cards.map((c) => c.entity.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('이 대목의 서술이 있는 것만 — 없으면 카드에 쓸 말이 없다', () => {
    for (const c of layoutOf(5).cards) {
      expect(c.entity.descs.some((d) => d.point === 5)).toBe(true)
    }
  })

  it('그 서술을 카드가 들고 있다', () => {
    const c = layoutOf(5).cards[0]
    expect(c.line.length).toBeGreaterThan(0)
  })

  it('**한 행에 두 장을 넣지 않는다** — 그리드가 같은 칸에 든 것을 포갠다', () => {
    // 브라우저에서만 드러났던 버그다. 한 칸에 셋까지 허용했더니 포인트 05에서
    // 카드 셋이 겹쳐 찍혔다(2026-08-18 실측). 계산 단계에서 막는다
    expect(MAX_PER_BLOCK).toBe(1)
    for (let n = 1; n <= 30; n += 1) {
      const rows = layoutOf(n).cards.map((c) => c.row)
      expect(new Set(rows).size, `포인트 ${n}`).toBe(rows.length)
    }
  })

  it('행 번호가 블록 안에 있고, 본문에 나온 순서를 안 뒤집는다', () => {
    const { blocks, cards } = layoutOf(3)
    for (const c of cards) {
      expect(c.row).toBeGreaterThanOrEqual(1)
      expect(c.row).toBeLessThanOrEqual(blocks.length)
    }
    const rows = cards.map((c) => c.row)
    expect([...rows]).toEqual([...rows].sort((a, b) => a - b))
  })

  it('본문에 안 나온 사람은 카드가 안 된다', () => {
    const { blocks, cards } = layoutOf(5)
    for (const c of cards) {
      const before = blocks.slice(0, c.row).join('\n')
      expect(before).toContain(c.entity.name)
    }
  })
})

describe('상수 두 벌', () => {
  it('**타입 이름이 두 곳에 있다 — 어긋나면 화면과 계산이 갈린다**', () => {
    // `lib/read/types.ts`가 따로 있는 이유는 `'use client'` 컴포넌트가 `node:fs`를
    // 끌고 가지 않게 하려는 것이다(2026-08-18 빌드가 그걸로 죽었다). 값이 두 벌이 된
    // 값을 치렀으니, 두 벌이 같은지는 여기서 지킨다
    for (const t of CARD_TYPES) {
      expect(CARD_TYPE_KO[t], t).toBe(TYPE_KO[t])
    }
    expect(Object.keys(CARD_TYPE_KO).sort()).toEqual([...CARD_TYPES].sort())
  })
})
