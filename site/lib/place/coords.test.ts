// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { placeCoords, coordsOfPoint, LOW } from './coords'

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
