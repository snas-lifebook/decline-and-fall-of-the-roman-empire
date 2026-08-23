// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { navTree, navFlat, navFind, navCrumbs, navSteps } from './nav'
import { POINT_COUNT } from './points'

describe('내비 트리', () => {
  it('다섯 갈래가 전부 있고, 시작하기가 맨 앞이다 (#12)', () => {
    expect(navTree().map((n) => n.href)).toEqual([
      '/start',
      '/read',
      '/objects',
      '/download',
      '/use',
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

  /**
   * 읽기 밑에 **책이 한 겹 끼었다**(2026-08-19). 앞 판은 30포인트가 읽기에 바로
   * 걸려 있었는데, 그러면 일러두기·책머리에·옮기고 나서가 갈 자리가 없다 —
   * 실제로 셋 다 파일로만 있고 사이트 어디에도 안 걸려 있었다.
   */
  it('읽기 아래는 책 두 권이고, 책 아래에 앞뒤 글까지 다 걸린다', () => {
    expect(navFind('/read')?.children?.map((c) => c.href)).toEqual([
      '/read/rome30',
      '/read/gibbon',
    ])
    // 원전은 서문 + 71장
    expect(navFind('/read/gibbon')?.children).toHaveLength(72)

    const parts = navFind('/read/rome30')?.children ?? []
    expect(parts).toHaveLength(POINT_COUNT + 3)
    expect(navFind('/read/point/1')?.title).not.toBe('')

    // 여는 글 둘 → 본문 30 → 닫는 글 하나. 읽는 순서가 곧 이 순서다
    expect(parts[0].href).toBe('/read/text/일러두기')
    expect(parts[1].href).toBe('/read/text/책머리에')
    expect(parts[2].href).toBe('/read/point/1')
    expect(parts[parts.length - 1].href).toBe('/read/text/옮기고_나서')
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
    expect(navCrumbs('/download').map((n) => n.href)).toEqual(['/download'])
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
    // 시작하기가 맨 앞이라, 작업 공간(시작하기 끝) 다음은 읽기다 (#12)
    expect(navSteps('/start/links').next?.href).toBe('/read')
    // 본문 30 다음은 「옮기고 나서」다 — 책을 끝까지 읽고 나서야 그 책을 벗어난다
    expect(navSteps(`/read/point/${POINT_COUNT}`).next?.href).toBe('/read/text/옮기고_나서')
    // 편역본을 다 읽으면 두 번째 권으로 넘어간다
    expect(navSteps('/read/text/옮기고_나서').next?.href).toBe('/read/gibbon')
    // 읽기를 벗어나는 것은 원전 마지막 장 다음이다
    expect(navSteps('/read/source/71').next?.href).toBe('/objects')
  })
})

describe('활용하기 — 다섯 장', () => {
  it('화면 보는 법이 먼저다. 읽고 보는 법이 AI로 쓰는 법보다 앞이다 (Stage B, 2026-08-20)', () => {
    const kids = navFind('/use')?.children ?? []
    expect(kids.map((c) => c.href)).toEqual([
      '/use/reading',
      '/use/data',
      '/use/recipes',
      '/use/skills',
      '/use/pitfalls',
    ])
  })
})

describe('찾아보기 — 타입 일곱', () => {
  it('가계도가 맨 앞이고 그다음이 개수순이다', () => {
    const kids = navFind('/objects')?.children ?? []
    // 헌장 0-1이 「특히 가계도다」라고 지목한 화면이라 타입 목록보다 앞이다
    expect(kids).toHaveLength(8)
    expect(kids[0].href).toBe('/objects/family')
    expect(kids[1].href).toBe('/objects/person')
  })

  it('라벨에 개수를 적는다 — "눌러도 되나"를 없앤다', () => {
    expect(navFind('/objects/person')?.title).toMatch(/^인물 \d+$/)
  })

  it('더 이상 준비 중이 아니다 — 사이드바에 회색 칸이 없다', () => {
    expect(navFind('/objects')?.ready).toBe(true)
    expect(navFlat().every((n) => n.ready)).toBe(true)
  })
})
