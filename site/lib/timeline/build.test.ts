import { describe, expect, it } from 'vitest'
import { timelineOf, MIN_SPANS } from './build'
import { loadLinks, type Link } from '../ontology'
import { entityIndex } from '../entity'

const LINKS = loadLinks()
const INDEX = entityIndex()

const link = (p: Partial<Link>): Link =>
  ({
    from: 'person:갑',
    to: 'person:을',
    rel: 'opposed',
    point: 1,
    from_year: null,
    to_year: null,
    year_basis: null,
    ...p,
  }) as Link

const idx = new Map([
  ['person:갑', { id: 'person:갑', type: 'person' as const, name: '갑' }],
  ['person:을', { id: 'person:을', type: 'person' as const, name: '을' }],
  ['person:병', { id: 'person:병', type: 'person' as const, name: '병' }],
])

describe('연도 없는 것을 그리지 않는다', () => {
  it('연도 없는 관계는 막대가 아니라 「미상」으로 센다', () => {
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:을', from_year: -60 }),
        link({ to: 'person:병', from_year: -49 }),
        link({ to: 'person:병', from_year: null }),
      ],
      idx,
    )
    expect(tl?.spans).toHaveLength(2)
    expect(tl?.undated).toBe(1)
  })

  it(`날짜 붙은 관계가 ${MIN_SPANS}개 미만이면 아예 안 그린다`, () => {
    // 막대 하나짜리 연표는 연표가 아니다. 「무엇 대비 언제」가 없다
    expect(timelineOf('person:갑', [link({ from_year: -60 })], idx)).toBeNull()
    expect(timelineOf('person:갑', [link({ from_year: null })], idx)).toBeNull()
  })
})

describe('겹쳐 그리지 않는다', () => {
  it('상대·관계·연도가 똑같으면 한 줄이다', () => {
    // 같은 관계가 포인트 둘에 기록돼 있으면 링크는 2건이지만 그림에서는 한 줄이다.
    // 실측: 폼페이우스 화면에 `대립 카이사르` 막대가 x=659 w=89으로 두 번 겹쳐 있었다
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:을', rel: 'opposed', from_year: -49, to_year: -45, point: 7 }),
        link({ to: 'person:을', rel: 'opposed', from_year: -49, to_year: -45, point: 8 }),
        link({ to: 'person:병', rel: 'opposed', from_year: -30 }),
      ],
      idx,
    )
    expect(tl?.spans).toHaveLength(2)
    // 먼저 나오는 포인트를 남긴다 — 「어디 나온 얘기야」의 답이 이른 쪽이다
    expect(tl?.spans[0].point).toBe(7)
  })

  it('연도가 다르면 다른 줄이다', () => {
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:을', rel: 'opposed', from_year: -49, to_year: -48 }),
        link({ to: 'person:을', rel: 'opposed', from_year: -49, to_year: -45 }),
      ],
      idx,
    )
    expect(tl?.spans).toHaveLength(2)
  })

  it('실제 데이터에 똑같은 막대가 겹쳐 있지 않다', () => {
    for (const r of [...INDEX.values()]) {
      const tl = timelineOf(r.id, LINKS, INDEX)
      if (!tl) continue
      const keys = tl.spans.map((s) => `${s.ref.id}|${s.label}|${s.from}|${s.to}`)
      expect(new Set(keys).size, `${r.name}에 겹친 막대`).toBe(keys.length)
    }
  })
})

describe('시간 순서', () => {
  it('이른 것이 위에 온다', () => {
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:병', from_year: -49 }),
        link({ to: 'person:을', from_year: -60 }),
      ],
      idx,
    )
    expect(tl?.spans.map((s) => s.from)).toEqual([-60, -49])
  })

  it('구간 끝이 시작보다 앞서면 뒤집어 담는다', () => {
    // 데이터에 실제로 뒤집힌 값이 있을 수 있다. 음수 폭 막대는 안 그려진다
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:을', from_year: -49, to_year: -60 }),
        link({ to: 'person:병', from_year: -30 }),
      ],
      idx,
    )
    expect(tl?.spans[0].from).toBe(-60)
    expect(tl?.spans[0].to).toBe(-49)
  })

  it('min·max는 구간 끝까지 센다', () => {
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:을', from_year: -60, to_year: -44 }),
        link({ to: 'person:병', from_year: -49 }),
      ],
      idx,
    )
    expect(tl?.min).toBe(-60)
    expect(tl?.max).toBe(-44)
  })
})

describe('편이 뒤집힌 자리', () => {
  it('같은 상대와 동맹 → 적대면 뒤집힘으로 잡는다', () => {
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:을', rel: 'allied_with', from_year: -60 }),
        link({ to: 'person:을', rel: 'opposed', from_year: -49 }),
      ],
      idx,
    )
    expect(tl?.flips).toHaveLength(1)
    expect(tl?.flips[0]).toMatchObject({ name: '을', from: -60, to: -49, became: 'hostile' })
  })

  it('한쪽에 연도가 없으면 뒤집힘이라 하지 않는다', () => {
    // 「언제」를 모르면 뒤집혔다고 말할 수 없다. 실측상 4쌍 중 3쌍이 이 경우다
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:을', rel: 'allied_with', from_year: null }),
        link({ to: 'person:을', rel: 'opposed', from_year: -49 }),
        link({ to: 'person:병', rel: 'opposed', from_year: -30 }),
      ],
      idx,
    )
    expect(tl?.flips).toEqual([])
  })

  it('같은 편이 두 번이면 뒤집힘이 아니다', () => {
    const tl = timelineOf(
      'person:갑',
      [
        link({ to: 'person:을', rel: 'opposed', from_year: -60 }),
        link({ to: 'person:을', rel: 'conquered', from_year: -49 }),
      ],
      idx,
    )
    expect(tl?.flips).toEqual([])
  })
})

describe('실제 데이터', () => {
  it('카이사르는 폼페이우스와 뒤집힌다 — 지금 데이터에서 유일하게 연도가 양쪽에 다 있는 쌍', () => {
    const tl = timelineOf('person:카이사르', LINKS, INDEX)
    const f = tl?.flips.find((x) => x.name === '폼페이우스')
    expect(f).toMatchObject({ from: -60, to: -49, became: 'hostile' })
  })

  it('히에론은 아직 연표가 안 선다 — 관계 2건 모두 연도가 없다', () => {
    // 봉호님이 이슈 #1에서 든 예시가 이것이다. 데이터가 차면 이 테스트가 빨개진다
    expect(timelineOf('person:히에론', LINKS, INDEX)).toBeNull()
  })

  it('연표가 서는 객체가 100개는 넘는다', () => {
    // 사전의 열쇠는 노트 파일명이라 id는 값 쪽에 있다
    const drawn = [...INDEX.values()].filter((r) => timelineOf(r.id, LINKS, INDEX))
    expect(drawn.length).toBeGreaterThan(100)
  })
})
