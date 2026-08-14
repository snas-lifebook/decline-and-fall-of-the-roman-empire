// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { layoutFamily, textWidth, type FamilyPerson, type FamilyLink } from './layout'

// 바르카스 가문. 온톨로지에 아직 안 들어간 모양이지만(T2.5 제안서 참조)
// 레이아웃이 감당해야 하는 형태는 이것이다 — 동명이인 둘이 한 화면에 있다.
const people: FamilyPerson[] = [
  { id: 'person:하밀카르_바르카', label: '하밀카르 바르카' },
  { id: 'person:하밀카르의딸', label: '하밀카르의 딸', note: '이름 미전' },
  { id: 'person:하스드루발_미남', label: '하스드루발', note: '하밀카르의 사위' },
  { id: 'person:하스드루발_바르카', label: '하스드루발', note: '한니발의 동생' },
  { id: 'person:한니발', label: '한니발 바르카' },
  { id: 'person:마고_바르카', label: '마고 바르카' },
]

// `X --child_of--> Y` 는 "X의 자녀가 Y"다. 이름과 반대로 읽는다 (AGENTS.md 함정).
const family: FamilyLink[] = [
  { from: 'person:하밀카르_바르카', rel: 'child_of', to: 'person:한니발' },
  { from: 'person:하밀카르_바르카', rel: 'child_of', to: 'person:하스드루발_바르카' },
  { from: 'person:하밀카르_바르카', rel: 'child_of', to: 'person:마고_바르카' },
  { from: 'person:하밀카르_바르카', rel: 'child_of', to: 'person:하밀카르의딸' },
  { from: 'person:하밀카르의딸', rel: 'married', to: 'person:하스드루발_미남' },
]

const succession: FamilyLink[] = [
  { from: 'person:하스드루발_미남', rel: 'succeeded', to: 'person:하밀카르_바르카' },
  { from: 'person:한니발', rel: 'succeeded', to: 'person:하스드루발_미남' },
]

const byId = (r: ReturnType<typeof layoutFamily>, id: string) => {
  const n = r.nodes.find((x) => x.id === id)
  if (!n) throw new Error(`노드가 없다: ${id}`)
  return n
}

describe('한글 라벨 폭', () => {
  it('음절 수에 비례해 늘어난다', () => {
    expect(textWidth('로마', 15)).toBeLessThan(textWidth('하스드루발', 15))
  })

  it('한글은 라틴 문자보다 넓다 — 같은 글자 수에서', () => {
    expect(textWidth('가나다', 15)).toBeGreaterThan(textWidth('abc', 15))
  })

  it('폰트 크기에 비례한다', () => {
    expect(textWidth('한니발', 30)).toBeCloseTo(textWidth('한니발', 15) * 2, 5)
  })
})

describe('세대 배치', () => {
  it('부모가 자식보다 위에 온다', () => {
    const r = layoutFamily(people, family)
    expect(byId(r, 'person:하밀카르_바르카').y).toBeLessThan(byId(r, 'person:한니발').y)
  })

  it('형제는 같은 행에 선다', () => {
    const r = layoutFamily(people, family)
    const y = byId(r, 'person:한니발').y
    expect(byId(r, 'person:하스드루발_바르카').y).toBe(y)
    expect(byId(r, 'person:마고_바르카').y).toBe(y)
  })
})

describe('동명이인', () => {
  it('라벨이 같아도 id가 다르면 좌표가 갈린다', () => {
    const r = layoutFamily(people, family)
    const a = byId(r, 'person:하스드루발_미남')
    const b = byId(r, 'person:하스드루발_바르카')
    expect(a.label).toBe(b.label) // 이름은 같다
    expect([a.x, a.y]).not.toEqual([b.x, b.y]) // 자리는 다르다
  })

  it('구분 문구를 노드가 들고 있다', () => {
    const r = layoutFamily(people, family)
    expect(byId(r, 'person:하스드루발_미남').note).toBe('하밀카르의 사위')
    expect(byId(r, 'person:하스드루발_바르카').note).toBe('한니발의 동생')
  })
})

describe('혼인', () => {
  it('노드가 된다', () => {
    const r = layoutFamily(people, family)
    expect(r.nodes.filter((n) => n.kind === 'union')).toHaveLength(1)
  })

  it('두 배우자가 그 노드로 이어진다', () => {
    const r = layoutFamily(people, family)
    const union = r.nodes.find((n) => n.kind === 'union')!
    const touching = r.edges.filter((e) => e.from === union.id || e.to === union.id)
    const partners = touching.map((e) => (e.from === union.id ? e.to : e.from))
    expect(partners).toContain('person:하밀카르의딸')
    expect(partners).toContain('person:하스드루발_미남')
  })

  it('사람 노드보다 작다 — 점으로 찍힌다', () => {
    const r = layoutFamily(people, family)
    const union = r.nodes.find((n) => n.kind === 'union')!
    const person = byId(r, 'person:한니발')
    expect(union.width).toBeLessThan(person.width)
  })
})

describe('계승은 레이아웃을 흔들지 않는다', () => {
  // 2026-08-14 스파이크에서 실제로 무너진 자리다. 제위계승은 혈연과 다른 축인데
  // 레이아웃 그래프에 넣으면 계층 알고리즘이 rank 제약으로 취급해 세대 행이 깨진다.
  it('계승 링크를 넣어도 사람 노드 좌표가 그대로다', () => {
    const without = layoutFamily(people, family)
    const withIt = layoutFamily(people, [...family, ...succession])
    for (const n of without.nodes.filter((x) => x.kind === 'person')) {
      const m = byId(withIt, n.id)
      expect([m.x, m.y]).toEqual([n.x, n.y])
    }
  })

  it('계승은 별도 채널의 엣지로 나온다', () => {
    const r = layoutFamily(people, [...family, ...succession])
    const succ = r.edges.filter((e) => e.kind === 'succession')
    expect(succ).toHaveLength(2)
    expect(r.edges.filter((e) => e.kind === 'family').length).toBeGreaterThan(0)
  })

  it('계승 엣지도 좌표를 갖는다 — 그릴 수 있어야 한다', () => {
    const r = layoutFamily(people, [...family, ...succession])
    for (const e of r.edges.filter((x) => x.kind === 'succession')) {
      expect(e.points.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('캔버스', () => {
  it('모든 노드를 감싼다', () => {
    const r = layoutFamily(people, [...family, ...succession])
    for (const n of r.nodes) {
      expect(n.x - n.width / 2).toBeGreaterThanOrEqual(0)
      expect(n.x + n.width / 2).toBeLessThanOrEqual(r.width)
      expect(n.y + n.height / 2).toBeLessThanOrEqual(r.height)
    }
  })

  it('빈 가문에도 터지지 않는다', () => {
    const r = layoutFamily([], [])
    expect(r.nodes).toHaveLength(0)
    expect(r.width).toBeGreaterThanOrEqual(0)
  })
})

describe('데이터가 덜 찬 경우', () => {
  it('관계가 없는 사람도 노드로 나온다', () => {
    const r = layoutFamily([{ id: 'person:한노_메시나', label: '한노' }], [])
    expect(r.nodes).toHaveLength(1)
  })

  it('사람 목록에 없는 id를 가리키는 링크는 버린다', () => {
    const r = layoutFamily(people, [
      ...family,
      { from: 'person:한니발', rel: 'child_of', to: 'person:없는사람' },
    ])
    expect(r.nodes.some((n) => n.id === 'person:없는사람')).toBe(false)
  })
})
