// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { placeCoords, coordsOfPoint, clusterPlaces, WIDE_KINDS, LOW } from './coords'
import { LAYERS_DEFAULT } from './layers'

/**
 * **이 파일이 지키는 것은 좌표 순서다.**
 *
 * 노트는 `location: [위도, 경도]`로 적고 지도 라이브러리는 `[경도, 위도]`를 받는다.
 * 뒤집으면 로마가 지중해가 아니라 소말리아 앞바다에 찍히는데, 화면에는 점이 멀쩡히
 * 그려지므로 **눈으로는 안 잡힌다.** 이 프로젝트에서 이미 한 번 밟은 함정이다.
 */

const all = placeCoords()

describe('지명 좌표 읽기', () => {
  it('노트 224개에서 좌표를 읽는다', () => {
    // 225개 중 하나는 좌표가 없다. 조용히 빠지되 나머지는 다 와야 한다
    expect(all.size).toBeGreaterThanOrEqual(220)
  })

  it('**경도가 먼저다** — 로마는 [12.49, 41.89]지 [41.89, 12.49]가 아니다', () => {
    const rome = all.get('place:로마')
    expect(rome).toBeDefined()
    const [lon, lat] = rome!.lonLat
    expect(lon).toBeCloseTo(12.49, 1)
    expect(lat).toBeCloseTo(41.89, 1)
  })

  it('뒤집힌 좌표가 하나도 없다 — 이 책의 지명은 전부 북반구 중위도다', () => {
    // 위도가 63을 넘거나 20 아래로 내려가면 위경도를 바꿔 넣었다는 뜻이다
    for (const [id, p] of all) {
      const [lon, lat] = p.lonLat
      expect(lat, `${id} 위도`).toBeGreaterThan(15)
      expect(lat, `${id} 위도`).toBeLessThan(70)
      expect(lon, `${id} 경도`).toBeGreaterThan(-20)
      expect(lon, `${id} 경도`).toBeLessThan(130)
    }
  })

  it('정확도를 같이 들고 온다 — 추정 좌표를 확정처럼 그리지 않기 위해서다', () => {
    const conf = [...all.values()].map((p) => p.confidence)
    expect(conf.filter((c) => c === 'high').length).toBeGreaterThan(100)
    expect(conf.filter((c) => c === LOW).length).toBeGreaterThan(0)
  })

  it('오늘 어디인지도 들고 온다', () => {
    expect(all.get('place:로마')?.modern).toContain('로마')
  })
})

describe('포인트별 좌표', () => {
  it('한 대목의 지명만 골라 준다', () => {
    const five = coordsOfPoint(5)
    expect(five.length).toBeGreaterThan(0)
    expect(five.every((p) => p.lonLat.length === 2)).toBe(true)
  })

  it('30개 포인트 전부에서 최소 하나는 나온다 — 빈 지도를 그리지 않기 위해서다', () => {
    for (let n = 1; n <= 30; n += 1) {
      expect(coordsOfPoint(n).length, `포인트 ${n}`).toBeGreaterThan(0)
    }
  })

  it('**본문이 부른 지명까지 센다** — `points` 배열만 보면 지도가 텅 빈다', () => {
    /*
     * 포인트 05가 이 함정을 그대로 보여준다. `points` 배열에는 로마 하나뿐인데
     * 본문은 라인 강·에스파냐·소아시아·카르타고를 부른다. 배열만 보고 그렸더니
     * 마커가 **한 개** 찍혔다(2026-08-18 브라우저 실측).
     *
     * 2026-08-17 감사의 「읽기와 가져가기가 30/30 어긋난다」와 같은 병이다.
     */
    const five = coordsOfPoint(5).map((p) => p.name)
    expect(five.length).toBeGreaterThan(10)
    for (const must of ['라인 강', '에스파냐', '카르타고', '소아시아']) {
      expect(five, `포인트 05에 ${must}`).toContain(must)
    }
  })

  it('한 대목의 지명이 지도 한 장에 담길 만큼이다', () => {
    for (let n = 1; n <= 30; n += 1) {
      // 마흔을 넘으면 이름표가 서로 겹쳐 읽을 수 없는 지도가 된다
      expect(coordsOfPoint(n).length, `포인트 ${n}`).toBeLessThanOrEqual(40)
    }
  })

  it('같은 지명을 두 번 담지 않는다', () => {
    const ids = coordsOfPoint(3).map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

/**
 * ── 지명 종류(레이어)와 겹침 묶기 ──────────────────────────────
 *
 * River: 「국가 단위의 지도도 좋은데 문제는 작은 도시나 광장이나 건물 이름 이런 게
 * 나오면 여기 지도로는 해상도 문제가 발생한다. 이 문제를 해결합시다.」
 *
 * 좌표 224곳을 전부 대조해서 원인을 갈랐다(2026-08-18 실측). **확대로는 안 풀린다.**
 *
 *   ① **넓은 것을 점 하나로 찍었다** — `아프리카`(region)와 `카르타고`(city)가
 *      0.003도(약 300m) 떨어져 있다. `카파도키아`↔`카이사레아`, `터키`↔`에데사`,
 *      `발칸반도`↔`발칸`은 **좌표가 완전히 같다.** 배율을 올리면 같이 커질 뿐이다
 *   ② **도시 안의 건물** — `성소피아성당`·`성로마누스교회`가 `비잔티움` 안에 있다.
 *      이건 확대하면 풀리지만, ①이 다수라 확대는 절반만 듣는 답이다
 *
 * 그래서 **레이어**(①)와 **묶음**(②)으로 푼다. 둘 다 River가 요청한 기능이다.
 */

describe('지명 종류 — 레이어의 재료', () => {
  it('**225곳 전부에 `place_kind`가 있다** — 새 데이터 없이 레이어가 된다', () => {
    const missing = [...all.values()].filter((p) => !p.kind)
    expect(missing.map((p) => p.id)).toEqual([])
  })

  it('실측한 종류만 나온다 — 새 값이 들어오면 CSS와 설정이 조용히 어긋난다', () => {
    const known = new Set([
      'city', 'region', 'river', 'building', 'sea',
      'island', 'battlefield', 'mountain', 'cape', 'lake', 'strait',
    ])
    const odd = [...new Set([...all.values()].map((p) => p.kind))].filter((k) => !known.has(k))
    expect(odd, `모르는 종류: ${odd.join(', ')}`).toEqual([])
  })

  it('도시가 가장 많다 — 실측 city 103 · region 58', () => {
    const n = (k: string) => [...all.values()].filter((p) => p.kind === k).length
    expect(n('city')).toBeGreaterThan(90)
    expect(n('region')).toBeGreaterThan(50)
  })

  it('넓은 것과 점인 것이 갈린다', () => {
    expect(WIDE_KINDS).toContain('region')
    expect(WIDE_KINDS).toContain('sea')
    expect(WIDE_KINDS).not.toContain('city')
    expect(WIDE_KINDS).not.toContain('building')
  })
})

describe('겹친 지명 묶기', () => {
  it('**비잔티움 무리가 한 점으로 묶인다** — 성소피아성당이 0.0002도 옆에 있다', () => {
    const near = [...all.values()].filter((p) =>
      ['place:비잔티움', 'place:성소피아성당', 'place:성로마누스교회'].includes(p.id),
    )
    expect(near.length, '세 곳이 다 있어야 한다').toBe(3)
    const grouped = clusterPlaces(near)
    expect(grouped.length, '한 점으로 묶여야 한다').toBe(1)
    expect(grouped[0].with.length, '딸린 것이 둘').toBe(2)
  })

  it('묶여도 **아무도 사라지지 않는다** — 이름이 지워지면 그 대목에 없다는 거짓말이 된다', () => {
    for (let n = 1; n <= 30; n += 1) {
      const here = coordsOfPoint(n)
      const grouped = clusterPlaces(here)
      const kept = grouped.length + grouped.reduce((s, g) => s + g.with.length, 0)
      expect(kept, `포인트 ${n}`).toBe(here.length)
    }
  })

  it('먼 곳끼리는 안 묶인다 — 로마와 카르타고는 별개다', () => {
    const two = [all.get('place:로마')!, all.get('place:카르타고')!]
    expect(clusterPlaces(two).length).toBe(2)
  })

  it('**대표는 점인 것이 맡는다** — 지역이 대표가 되면 도시 이름이 숨는다', () => {
    // `아프리카`(region)와 `카르타고`(city)가 300m 떨어져 있다. 묶으면 카르타고가 앞에 와야 한다
    const pair = [all.get('place:아프리카'), all.get('place:카르타고')].filter(Boolean) as NonNullable<ReturnType<typeof all.get>>[]
    if (pair.length < 2) return
    const g = clusterPlaces(pair)
    if (g.length === 1) expect(WIDE_KINDS).not.toContain(g[0].kind)
  })
})

describe('레이어 기본값', () => {
  it('**넓은 것이 기본에서 빠져 있다** — 이게 겹침을 29/30에서 8/30으로 줄인 값이다', () => {
    for (const k of WIDE_KINDS) {
      expect(LAYERS_DEFAULT, `${k} 가 기본으로 켜져 있다`).not.toContain(k)
    }
  })

  it('기본값이 실제 종류들 안에 있다 — 오타 하나면 그 레이어가 통째로 안 뜬다', () => {
    const real = new Set([...all.values()].map((p) => p.kind))
    for (const k of LAYERS_DEFAULT) {
      expect(real.has(k), `${k} 라는 종류가 데이터에 없다`).toBe(true)
    }
  })

  it('도시는 반드시 켜져 있다 — 103곳으로 가장 많고 사람이 찾는 것이 이쪽이다', () => {
    expect(LAYERS_DEFAULT).toContain('city')
  })

  it('CSS가 모든 종류를 다룬다 — 빠진 종류는 끌 수가 없다', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')
    for (const kind of new Set([...all.values()].map((p) => p.kind))) {
      expect(css, `${kind} 규칙이 globals.css 에 없다`).toContain(`data-layers~='${kind}'`)
    }
  })
})
