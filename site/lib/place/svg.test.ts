// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { renderPointMap, MAX_LABELS } from './svg'
import { coordsOfPoint } from './coords'

const svg = (n: number) => renderPointMap(coordsOfPoint(n))

describe('이 대목의 지도', () => {
  it('30개 대목 전부에서 그려진다', () => {
    for (let n = 1; n <= 30; n += 1) {
      expect(svg(n), `포인트 ${n}`).toContain('<svg')
    }
  })

  it('**땅이 그려진다** — 해안선이 없으면 점이 허공에 뜬다', () => {
    // MapLibre로 처음 만들었을 때 바로 이게 안 나와서 갈아엎었다(2026-08-18).
    // 바다 위에 마커만 스물여덟 개 뜬 지도였다
    expect(svg(3)).toContain('class="land"')
    expect(svg(3).match(/<path class="land"/g)?.length ?? 0).toBeGreaterThan(0)
  })

  it('점마다 그 화면으로 가는 링크가 걸린다', () => {
    const s = svg(3)
    expect(s).toContain('/objects/place/')
    expect(s).toContain('<a ')
  })

  it('이름이 글자로 남는다 — Ctrl+F로 잡혀야 한다', () => {
    expect(svg(3)).toContain('카르타고')
  })

  it('추정 좌표를 확정처럼 그리지 않는다', () => {
    // `coord_confidence: low`가 19곳 있다
    const any = [...Array(30)].some((_, i) => svg(i + 1).includes('class="pin guessed"'))
    expect(any).toBe(true)
  })

  it('이름표가 겹치면 뒤엣것은 점만 남긴다', () => {
    for (let n = 1; n <= 30; n += 1) {
      const s = svg(n)
      const labels = s.match(/<text class="pin-label"/g)?.length ?? 0
      const dots = s.match(/<circle/g)?.length ?? 0
      expect(labels, `포인트 ${n}`).toBeLessThanOrEqual(Math.min(dots, MAX_LABELS))
    }
  })

  it('**모든 점이 그림 안에 있다** — 좌표가 뒤집히면 밖으로 나간다', () => {
    for (let n = 1; n <= 30; n += 1) {
      const s = svg(n)
      const vb = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!
      const [w, h] = [Number(vb[1]), Number(vb[2])]
      for (const m of s.matchAll(/<circle cx="([\d.-]+)" cy="([\d.-]+)"/g)) {
        expect(Number(m[1]), `포인트 ${n} x`).toBeGreaterThanOrEqual(0)
        expect(Number(m[1]), `포인트 ${n} x`).toBeLessThanOrEqual(w)
        expect(Number(m[2]), `포인트 ${n} y`).toBeGreaterThanOrEqual(0)
        expect(Number(m[2]), `포인트 ${n} y`).toBeLessThanOrEqual(h)
      }
    }
  })

  it('색은 light-dark()로만 쓴다', () => {
    const css = svg(3).replace(/\/\*[\s\S]*?\*\//g, '')
    const bare = [...css.matchAll(/#[0-9a-f]{3,6}/gi)].filter(
      (m) => !css.slice(Math.max(0, m.index - 60), m.index).includes('light-dark('),
    )
    expect(bare.map((m) => m[0])).toEqual([])
  })

  it('지명이 없으면 빈 문자열 — 빈 상자를 그리지 않는다', () => {
    expect(renderPointMap([])).toBe('')
  })
})
