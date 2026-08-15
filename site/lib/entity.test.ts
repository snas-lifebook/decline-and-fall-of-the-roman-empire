// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { entityIndex, entityHref, entityBySlug, neighbors, coOccurring } from './entity'
import { loadEntities, loadLinks } from './ontology'

const entities = loadEntities()
const links = loadLinks()
const index = entityIndex()

describe('위키링크 사전 — 본문의 [[X]]가 무엇을 가리키나', () => {
  it('평범한 이름을 찾는다', () => {
    expect(index.get('카이사르')?.id).toBe('person:카이사르')
  })

  it('동명이인은 본문이 이미 갈라 써준 대로 갈린다', () => {
    // 저자가 `[[그리스 (집단)]]`·`[[그리스 (지명)]]`로 손수 역다중화해 뒀다
    expect(index.get('그리스 (집단)')?.type).toBe('group')
    expect(index.get('그리스 (지명)')?.type).toBe('place')
  })

  it('객체가 아닌 것은 사전에 없다 — 챕터·목차는 링크로 만들지 않는다', () => {
    expect(index.get('00_목차')).toBeUndefined()
    expect(index.get('13_로마_제국의_정신적_통일')).toBeUndefined()
    expect(index.get('로마제국쇠망사_온톨로지')).toBeUndefined()
  })

  it('객체 644개가 다 들어온다', () => {
    expect(new Set([...index.values()].map((r) => r.id)).size).toBe(entities.length)
  })
})

describe('객체 주소', () => {
  it('타입과 이름으로 만든다', () => {
    expect(entityHref(index.get('카이사르')!)).toBe('/objects/person/카이사르')
  })

  it('주소에 괄호가 안 들어간다 — 마크다운 링크가 깨진다', () => {
    // 파일명은 `그리스 (집단).md`지만 주소는 타입 폴더가 이미 가른다
    expect(entityHref(index.get('그리스 (집단)')!)).toBe('/objects/group/그리스')
    for (const ref of index.values()) expect(entityHref(ref)).not.toMatch(/[()]/)
  })

  it('공백은 밑줄이 된다 — 이름 644개 중 203개에 공백·괄호가 있다', () => {
    expect(entityHref(index.get('갈리아 정복')!)).toBe('/objects/event/갈리아_정복')
  })

  it('644개 주소가 하나도 안 겹친다 — 겹치면 한 장이 다른 장을 덮어쓴다', () => {
    const hrefs = [...index.values()].map(entityHref)
    expect(new Set(hrefs).size).toBe(entities.length)
  })

  it('주소에서 객체로 되돌아온다', () => {
    expect(entityBySlug('event', '갈리아_정복')?.name).toBe('갈리아 정복')
    expect(entityBySlug('person', '없는사람')).toBeUndefined()
  })
})

describe('연결 — 이 객체가 무엇과 이어져 있나', () => {
  const caesar = neighbors('person:카이사르', links, index)

  it('실측한 개수와 맞는다', () => {
    expect(caesar).toHaveLength(41)
    expect(neighbors('place:로마', links, index)).toHaveLength(64)
  })

  it('한 줄마다 포인트 번호를 단다 — "이거 어디 나온 얘기야"의 답', () => {
    expect(caesar.every((n) => n.point >= 1 && n.point <= 30)).toBe(true)
  })

  it('원시 rel 키를 화면에 내보내지 않는다 (P8)', () => {
    expect(caesar.every((n) => n.label.length > 0 && !/^[a-z_]+$/.test(n.label))).toBe(true)
  })

  it('방향에 따라 라벨이 갈린다', () => {
    const out = neighbors('person:카이사르', links, index).filter((n) => n.direction === 'out')
    const inn = neighbors('person:카이사르', links, index).filter((n) => n.direction === 'in')
    expect(out.length + inn.length).toBe(caesar.length)
  })

  it('자기 자신은 이웃이 아니다', () => {
    expect(caesar.every((n) => n.ref.id !== 'person:카이사르')).toBe(true)
  })

  it('연결이 없는 객체는 빈 배열이다 — 던지지 않는다', () => {
    const lonely = entities.find(
      (e) => !links.some((l) => l.from === e.id || l.to === e.id),
    )!
    expect(neighbors(lonely.id, links, index)).toEqual([])
  })
})

describe('같은 포인트에 함께 나온 객체 — 관계가 0인 217장을 위한 것', () => {
  const lonely = entities.filter((e) => !links.some((l) => l.from === e.id || l.to === e.id))

  it('관계 0인 객체가 실제로 217개다', () => {
    expect(lonely).toHaveLength(217)
  })

  it('그 217개도 동석은 비어 있지 않다 — 빈 상자를 보여주지 않는다', () => {
    const empty = lonely.filter((e) => coOccurring(e, entities).length === 0)
    expect(empty).toEqual([])
  })

  it('자기 자신은 안 들어간다', () => {
    const e = entities.find((x) => x.id === 'person:카이사르')!
    expect(coOccurring(e, entities).every((c) => c.ref.id !== e.id)).toBe(true)
  })

  it('겹치는 포인트를 알려준다 — 왜 같이 뜨는지 사람이 알아야 한다', () => {
    const e = entities.find((x) => x.id === 'person:한니발')!
    const first = coOccurring(e, entities)[0]
    expect(first.points.length).toBeGreaterThan(0)
    expect(first.points.every((p) => e.points.includes(p))).toBe(true)
  })

  it('많이 겹친 것부터 준다', () => {
    const e = entities.find((x) => x.id === 'place:로마')!
    const got = coOccurring(e, entities).map((c) => c.points.length)
    expect([...got].sort((a, b) => b - a)).toEqual(got)
  })

  it('개수를 자를 수 있다 — 로마는 함께 나온 것이 수백 개다', () => {
    const e = entities.find((x) => x.id === 'place:로마')!
    expect(coOccurring(e, entities, 12)).toHaveLength(12)
  })
})
