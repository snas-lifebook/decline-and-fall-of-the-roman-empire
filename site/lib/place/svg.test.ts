// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { renderPointMap, MAX_LABELS } from './svg'
import { coordsOfPoint } from './coords'
import { entityHref } from '../entity'

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

  it('**그려진 점은 전부 그림 안에 있다** — 좌표가 뒤집히면 밖으로 나간다', () => {
    // 창을 점인 것만으로 잡으면서(2026-08-18) 멀리 있는 지역 대표점이 프레임을
    // 벗어난다. 그런 것은 아예 안 그리고 화면이 몇 곳인지 적는다 — 그리면
    // `clipPath`에 잘려 보이지도 눌리지도 않으면서 DOM에만 남는다
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

  it('**못 그린 곳은 말없이 지나가지 않는다** — 몇 곳인지 그림이 적는다', () => {
    // 카드가 「몇 중 몇을 세웠습니다」로 밝히는 것과 같은 자리다
    const withNote = [...Array(30)].filter((_, i) => svg(i + 1).includes('map-note')).length
    expect(withNote, '프레임 밖으로 나간 대목이 하나도 없다면 이 규칙이 죽은 것이다').toBeGreaterThan(0)
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

describe('본문 링크와 짝이 맞는가', () => {
  it('**본문에서 올릴 수 있는 지명은 지도가 전부 받는다** — 호버 패널이 주소로 짝을 찾는다', () => {
    // 처음엔 지도만 퍼센트 인코딩을 걸어서 짝이 하나도 안 맞았다(2026-08-18).
    // 화면에서는 지도도 본문도 멀쩡해 보여서 **눈으로는 안 잡혔다**
    //
    // 이제 붙어 있는 지명은 한 점으로 묶이므로 자기 `href`가 없을 수 있다. 그때는
    // 대표 점의 `data-also`가 그 주소를 들고 있어야 한다 — 없으면 `아프리카`에
    // 마우스를 올려도 아무 일이 안 일어난다
    for (const n of [3, 5, 13]) {
      const places = coordsOfPoint(n)
      const s = renderPointMap(places)
      const drawn = new Set([...s.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))
      const also = new Set(
        [...s.matchAll(/data-also="([^"]+)"/g)].flatMap((m) => m[1].split(' ')),
      )
      // 프레임 밖으로 빠진 것은 화면이 이름으로 밝히므로 그쪽에 있으면 통과다
      const note = s.match(/class="map-note"[^>]*>([^<]*)</)?.[1] ?? ''
      for (const p of places) {
        const want = entityHref({ id: p.id, type: 'place', name: p.name })
        const reachable = drawn.has(want) || also.has(want) || note.includes(p.name)
        expect(reachable, `포인트 ${n} — ${p.name} 에 닿을 길이 없다`).toBe(true)
      }
    }
  })

  it('묶인 점이 딸린 주소를 들고 있다', () => {
    const s = renderPointMap(coordsOfPoint(5))
    // 포인트 05는 `카르타고`가 `아프리카`를, `발칸`이 `발칸 반도`를 흡수한다
    expect(s).toContain('data-also=')
    expect(s).toMatch(/\+\d<\/text>/)
  })
})
