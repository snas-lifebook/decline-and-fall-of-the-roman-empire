// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { navTree, navFlat, navFind, navCrumbs, navSteps } from './nav'
import { POINT_COUNT } from './points'

describe('내비 트리', () => {
  it('다섯 갈래가 전부 있다', () => {
    expect(navTree().map((n) => n.href)).toEqual([
      '/read',
      '/objects',
      '/download',
      '/use',
      '/start',
    ])
  })

  it('시작하기는 여섯 장으로 쪼개져 있다', () => {
    expect(navFind('/start')?.children?.map((c) => c.href)).toEqual([
      '/start/install',
      '/start/open',
      '/start/plugins',
      '/start/ai',
      '/start/update',
      '/start/links',
    ])
  })

  it('읽기 아래에 30포인트가 다 걸린다', () => {
    expect(navFind('/read')?.children).toHaveLength(POINT_COUNT)
    expect(navFind('/read/point/1')?.title).not.toBe('')
  })

  it('같은 주소가 두 번 나오지 않는다', () => {
    const hrefs = navFlat(navTree(), { readyOnly: false }).map((n) => n.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})

describe('빵부스러기', () => {
  it('조상부터 자기까지 준다', () => {
    expect(navCrumbs('/start/plugins').map((n) => n.href)).toEqual(['/start', '/start/plugins'])
  })

  it('섹션 자신은 한 칸이다', () => {
    expect(navCrumbs('/use').map((n) => n.href)).toEqual(['/use'])
  })

  it('없는 주소는 빈 배열이다 — 던지지 않는다', () => {
    expect(navCrumbs('/없는곳')).toEqual([])
  })
})

describe('이전·다음', () => {
  it('첫 장에는 이전이 없다', () => {
    const first = navFlat()[0]
    expect(navSteps(first.href).prev).toBeUndefined()
  })

  it('마지막 장에는 다음이 없다 — 순환하지 않는다', () => {
    const flat = navFlat()
    expect(navSteps(flat[flat.length - 1].href).next).toBeUndefined()
  })

  it('형제 순서대로 이어진다', () => {
    expect(navSteps('/start/install').next?.href).toBe('/start/open')
    expect(navSteps('/start/open').prev?.href).toBe('/start/install')
  })

  it('섹션 끝에서 다음 섹션으로 넘어간다', () => {
    expect(navSteps('/start/links').next).toBeUndefined()
    expect(navSteps(`/read/point/${POINT_COUNT}`).next?.href).toBe('/objects')
  })
})

describe('찾아보기 — 타입 일곱', () => {
  it('개수순으로 걸린다. 인물이 제일 많다', () => {
    const kids = navFind('/objects')?.children ?? []
    expect(kids).toHaveLength(7)
    expect(kids[0].href).toBe('/objects/person')
  })

  it('라벨에 개수를 적는다 — "눌러도 되나"를 없앤다', () => {
    expect(navFind('/objects/person')?.title).toMatch(/^인물 \d+$/)
  })

  it('더 이상 준비 중이 아니다 — 사이드바에 회색 칸이 없다', () => {
    expect(navFind('/objects')?.ready).toBe(true)
    expect(navFlat().every((n) => n.ready)).toBe(true)
  })
})
