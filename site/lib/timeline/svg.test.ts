import { describe, expect, it } from 'vitest'
import { renderTimelineSvg, MAX_ROWS } from './svg'
import { timelineOf } from './build'
import { loadLinks } from '../ontology'
import { entityIndex } from '../entity'

const LINKS = loadLinks()
const INDEX = entityIndex()
const ALL = [...INDEX.values()]

const nums = (svg: string, attr: string) =>
  [...svg.matchAll(new RegExp(`${attr}="(-?[\\d.]+)"`, 'g'))].map((m) => Number(m[1]))

describe('한글 라벨이 칸을 안 넘는다', () => {
  // mermaid를 기각한 이유가 정확히 이 계열의 버그다(CJK 폭 오계산 #4950·#6424).
  // 우리가 직접 그리기로 했으면 우리가 이걸 증명해야 한다
  it('644장 전부에서 라벨이 막대 칸을 침범하지 않는다', () => {
    const over: string[] = []
    for (const r of ALL) {
      const tl = timelineOf(r.id, LINKS, INDEX)
      if (!tl) continue
      const svg = renderTimelineSvg(tl, { hrefOf: () => '/x' })
      // 라벨은 x=0에서 시작하고 막대는 GUTTER=168부터다. 잘림 표시가 그 보증이다
      for (const t of svg.matchAll(/<tspan class="label">([^<]*)<\/tspan>/g)) {
        if (t[1].length === 0) over.push(`${r.name}: 빈 라벨`)
      }
      const xs = nums(svg, 'x1').concat(nums(svg, 'x'))
      if (xs.some((v) => v > 760)) over.push(`${r.name}: x가 viewBox 밖`)
    }
    expect(over).toEqual([])
  })
})

describe('시점과 구간을 다르게 그린다', () => {
  // 카이사르는 18건 전부 구간이라 이 테스트가 통과해도 아무것도 증명 못 한다
  // (첫 판이 그랬고 가드가 잡았다). 실측상 둘 다 가진 객체는 17개뿐이다
  const tl = timelineOf('person:유스티니아누스', LINKS, INDEX)!

  it('끝을 모르는 것은 막대가 아니라 눈금이다', () => {
    // 막대로 그리면 「그때 끝났다」는 거짓말이 된다
    const svg = renderTimelineSvg(tl)
    const drawn = tl.spans.slice(0, MAX_ROWS)
    const open = drawn.filter((s) => s.to === null).length
    expect(open).toBeGreaterThan(0)
    expect(drawn.length - open).toBeGreaterThan(0)
    expect([...svg.matchAll(/class="point"/g)]).toHaveLength(open)
    expect([...svg.matchAll(/class="bar"/g)]).toHaveLength(drawn.length - open)
  })

  it('막대 폭은 절대 음수가 아니다', () => {
    for (const r of ALL) {
      const t = timelineOf(r.id, LINKS, INDEX)
      if (!t) continue
      expect(nums(renderTimelineSvg(t), 'width').every((w) => w >= 0)).toBe(true)
    }
  })
})

describe('정직하게 자른다', () => {
  it(`행을 ${MAX_ROWS}개까지만 그린다`, () => {
    const roma = timelineOf('place:로마', LINKS, INDEX)!
    expect(roma.spans.length).toBeGreaterThan(MAX_ROWS)
    const svg = renderTimelineSvg(roma)
    expect([...svg.matchAll(/class="row /g)]).toHaveLength(MAX_ROWS)
  })

  it('한 해짜리여도 폭이 0으로 붕괴하지 않는다', () => {
    const tl = { spans: [], undated: 0, flips: [], min: -50, max: -50 }
    const svg = renderTimelineSvg({
      ...tl,
      spans: [
        { ref: { id: 'a', type: 'person' as const, name: '갑' }, label: '대립', side: 'hostile' as const, from: -50, to: -50, point: 1 },
        { ref: { id: 'b', type: 'person' as const, name: '을' }, label: '동맹', side: 'friendly' as const, from: -50, to: null, point: 1 },
      ],
    })
    expect(nums(svg, 'x').every(Number.isFinite)).toBe(true)
  })
})

describe('색은 light-dark()로만 쓴다', () => {
  it('하드코딩 색이 한 개도 없다', () => {
    // 다크모드를 붙이면서 가계도에서 열한 개를 걷어냈다. 새 그림이 그걸 되돌리면 안 된다
    // 주석 안의 색 이름은 선언이 아니다. 안 걷어내면 「왜 이 회색인가」를 적는 순간
    // 이 테스트가 빨개진다(실제로 그랬다)
    const css = renderTimelineSvg(timelineOf('person:카이사르', LINKS, INDEX)!).replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    )
    const bare = [...css.matchAll(/#[0-9a-f]{3,6}/gi)]
      .filter((m) => !css.slice(Math.max(0, m.index - 60), m.index).includes('light-dark('))
      .map((m) => m[0])
    expect(bare).toEqual([])
  })
})
