import type { Link } from '../ontology'
import { idMap, type EntityRef } from '../entity'
import { REL_KO } from '../export/table'

/**
 * 관계 연표 — **「누가 누구랑 언제부터 언제까지 어떤 사이였나」**.
 *
 * 봉호님이 이슈 #1의 두 번째로 요청한 것이다: "시간이 지나면서 이렇게 변했다,
 * 누가 누구랑 적이고 누가 누구랑 어떤 관계인지를 보여주면 좋겠다."
 *
 * **착수 전에 데이터를 셌고, 그 결과가 이 파일의 모양을 정했다** (2026-08-17 실측).
 *
 * | 잰 것 | 값 |
 * |---|---|
 * | 관계 총계 | 667 |
 * | `from_year`가 있는 것 | **305 (46%)** |
 * | 구간(`from`+`to` 둘 다) | 277 |
 * | 날짜 붙은 관계 2개 이상인 객체 | **114** |
 * | 같은 상대와 적↔동이 둘 다 있는 쌍 | **4쌍** |
 * | 그중 양쪽에 연도가 다 있는 쌍 | **1쌍** (카이사르↔폼페이우스) |
 *
 * 그래서 **화면의 이름을 「편이 언제 뒤집혔나」로 짓지 않는다.** 그렇게 지으면
 * 644장 중 한 장에만 내용이 있는 화면이 된다. 이름은 「관계 연표」고, 뒤집힘은
 * 그 위에서 저절로 드러나는 특별한 경우로 한 줄 덧붙인다.
 *
 * 봉호님이 예로 든 히에론(시라쿠사)은 **관계 2건 모두 연도가 비어 있어 아직
 * 안 그려진다.** 숨기지 않고 화면이 그대로 말한다(헌장 0-4). 데이터가 차면
 * `build.test.ts`의 히에론 테스트가 빨개지는 것이 신호다 — 가계도의 바르카스와
 * 같은 장치다.
 */

/** 막대 하나짜리 연표는 연표가 아니다. 「무엇 대비 언제」가 없다 */
export const MIN_SPANS = 2

/** 적인가 편인가. 나머지는 중성이다 — 색을 세 개보다 늘리지 않는다 (DESIGN P1) */
export type Side = 'hostile' | 'friendly' | 'neutral'

const SIDE: Record<string, Side> = {
  opposed: 'hostile',
  conquered: 'hostile',
  allied_with: 'friendly',
  protected: 'friendly',
}

export type Span = {
  ref: EntityRef
  /** 관계 한국어 라벨. 방향에 따라 `out`/`in`이 갈린다 */
  label: string
  side: Side
  from: number
  /** 시점만 있으면 `null`. 화면에서 막대가 아니라 눈금이 된다 */
  to: number | null
  point: number
}

/** 같은 상대와 편이 바뀐 자리. **양쪽에 연도가 다 있을 때만** 뒤집혔다고 말한다 */
export type Flip = {
  ref: EntityRef
  name: string
  from: number
  to: number
  became: Side
}

export type Timeline = {
  spans: Span[]
  /** 연도가 없어 못 그린 관계 수. 화면이 이 숫자를 그대로 말한다 */
  undated: number
  flips: Flip[]
  min: number
  max: number
}

/**
 * 이 객체의 연표. 그릴 게 없으면 `null`이다 — 빈 상자를 내보내지 않는다.
 *
 * `links`를 통째로 받아 훑는다. 667건이고 644장에서 부르므로 43만 번인데,
 * `neighbors()`가 이미 같은 비용으로 돌고 있어 새로 느려지는 것이 아니다.
 */
export function timelineOf(
  id: string,
  links: Link[],
  index: Map<string, EntityRef>,
): Timeline | null {
  // 사전의 열쇠는 노트 파일명이다. 링크는 id로 말하므로 id 조회표를 거친다
  const ids = idMap(index)
  const spans: Span[] = []
  let undated = 0

  for (const l of links) {
    const out = l.from === id
    if (!out && l.to !== id) continue

    const ref = ids.get(out ? l.to : l.from)
    const ko = REL_KO[l.rel]
    if (!ref || ref.id === id || !ko) continue

    if (l.from_year === null || l.from_year === undefined) {
      undated += 1
      continue
    }

    // 데이터에 끝이 시작보다 앞선 값이 있을 수 있다. 음수 폭 막대는 안 그려진다
    const a = l.from_year
    const b = l.to_year ?? null
    spans.push({
      ref,
      label: out ? ko.out : ko.in,
      side: SIDE[l.rel] ?? 'neutral',
      from: b !== null && b < a ? b : a,
      to: b !== null && b < a ? a : b,
      point: l.point,
    })
  }

  /*
   * 같은 관계가 포인트 여러 곳에 기록돼 있으면 링크는 여러 건이지만 **그림에서는
   * 한 줄이다.** 폼페이우스 화면에 `대립 카이사르` 막대가 x·폭까지 똑같이 두 번
   * 겹쳐 있었다(2026-08-17 브라우저 실측). 두 줄이 정보를 더 주지 않고 자리만 먹는다.
   *
   * 이른 포인트를 남긴다 — 「이거 어디 나온 얘기야」의 답이 그쪽이다.
   */
  const seen = new Set<string>()
  const uniq = spans.filter((s) => {
    const k = `${s.ref.id}|${s.label}|${s.from}|${s.to}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  if (uniq.length < MIN_SPANS) return null

  uniq.sort((x, y) => x.from - y.from || (x.to ?? x.from) - (y.to ?? y.from))

  return {
    spans: uniq,
    undated,
    flips: flipsOf(uniq),
    min: uniq[0].from,
    max: Math.max(...uniq.map((s) => s.to ?? s.from)),
  }
}

/**
 * 같은 상대와 편이 바뀐 자리를 찾는다.
 *
 * **중성은 안 센다.** 「통치」에서 「대립」으로 간 것은 편이 바뀐 게 아니라 관계의
 * 종류가 다른 것이다. 적↔동만 뒤집힘이다.
 */
function flipsOf(spans: Span[]): Flip[] {
  const byRef = new Map<string, Span[]>()
  for (const s of spans) {
    if (s.side === 'neutral') continue
    const cur = byRef.get(s.ref.id)
    if (cur) cur.push(s)
    else byRef.set(s.ref.id, [s])
  }

  const out: Flip[] = []
  for (const group of byRef.values()) {
    for (let i = 1; i < group.length; i += 1) {
      const prev = group[i - 1]
      const now = group[i]
      if (prev.side === now.side) continue
      out.push({ ref: now.ref, name: now.ref.name, from: prev.from, to: now.from, became: now.side })
    }
  }
  return out
}
