// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { collideRadius, pickNodes, FONT } from './size'
import { textWidth } from '../text/width'

const node = (id: string, label: string, kind: 'center' | 'rel' | 'co' = 'rel') => ({ id, label, kind })
const edge = (source: string, target: string) => ({ source, target, kind: 'rel' as const })

describe('충돌 반경 — 라벨이 겹치지 않게 하는 것이 전부다', () => {
  it('라벨이 길수록 반경이 크다', () => {
    expect(collideRadius(node('a', '로마'))).toBeLessThan(collideRadius(node('b', '콘스탄티누스 2세')))
  })

  it('두 노드가 반경 합만큼 떨어지면 라벨 상자가 안 겹친다', () => {
    // 앞 판이 깨진 자리다 — 반경이 라벨 폭과 무관한 상수(24 + n*0.7)였다.
    // 「콘스탄티누스 2세」는 폭이 70을 넘는데 반경 45로는 절대 안 갈린다
    const a = node('a', '콘스탄티누스 2세')
    const b = node('b', '에우세비오스')
    const gap = collideRadius(a) + collideRadius(b)
    const halfWidths = textWidth(a.label, FONT.rel) / 2 + textWidth(b.label, FONT.rel) / 2
    expect(gap).toBeGreaterThanOrEqual(halfWidths)
  })

  it('점 자체보다는 항상 크다 — 라벨이 짧아도 원이 겹치면 안 된다', () => {
    expect(collideRadius(node('a', '·'))).toBeGreaterThan(8)
  })

  it('가운데는 글씨가 커서 반경도 더 크다', () => {
    expect(collideRadius(node('a', '카이사르', 'center'))).toBeGreaterThan(
      collideRadius(node('b', '카이사르', 'rel')),
    )
  })
})

describe('노드 고르기 — 다 그리면 아무것도 안 읽힌다', () => {
  const many = Array.from({ length: 30 }, (_, i) => node(`n${i}`, `이름${i}`))
  // n0가 가장 많이 이어지고 뒤로 갈수록 적다
  const edges = many.flatMap((n, i) => (i === 0 ? [] : [edge('n0', n.id), ...(i < 5 ? [edge('n1', n.id)] : [])]))

  it('한도 이하면 그대로 준다', () => {
    const r = pickNodes(many.slice(0, 5), [edge('n0', 'n1')], 18)
    expect(r.nodes).toHaveLength(5)
    expect(r.dropped).toBe(0)
  })

  it('넘으면 한도까지만 남긴다', () => {
    const r = pickNodes(many, edges, 18)
    expect(r.nodes).toHaveLength(18)
    expect(r.dropped).toBe(12)
  })

  it('연결이 많은 것부터 남는다', () => {
    const ids = pickNodes(many, edges, 18).nodes.map((n) => n.id)
    expect(ids).toContain('n0')
    expect(ids).toContain('n1')
  })

  it('가운데는 연결 수와 무관하게 반드시 남는다', () => {
    const withCenter = [node('c', '가운데', 'center'), ...many]
    const r = pickNodes(withCenter, edges, 18)
    expect(r.nodes.some((n) => n.kind === 'center')).toBe(true)
  })

  it('남은 노드 사이의 엣지만 남는다 — 허공으로 뻗는 선이 없다', () => {
    const r = pickNodes(many, edges, 18)
    const ids = new Set(r.nodes.map((n) => n.id))
    expect(r.edges.every((e) => ids.has(e.source) && ids.has(e.target))).toBe(true)
  })

  it('같은 입력에 같은 결과 — 빌드마다 그림이 흔들리면 안 된다', () => {
    expect(pickNodes(many, edges, 18).nodes.map((n) => n.id)).toEqual(
      pickNodes(many, edges, 18).nodes.map((n) => n.id),
    )
  })
})
