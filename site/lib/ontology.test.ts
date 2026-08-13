// @vitest-environment node
/**
 * 데이터 계약 테스트.
 *
 * 이 사이트에서 실제로 깨지는 자리는 버튼이 아니라 데이터다. 644개 객체와
 * 667개 관계가 페이지로 변환되는 길목을 지킨다.
 *
 * 알려진 위반은 KNOWN_VIOLATIONS에 적어 통과시킨다. 목적은 "위반 0"이 아니라
 * **새 위반이 늘지 않는 것**이다. 마이그레이션 중이라 잔여분이 있고, 그것을
 * 숨기지 않고 명시적으로 센다.
 */
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  loadEntities, loadLinks, checkInvariants, linkKey, REPO_ROOT,
} from './ontology'

/**
 * 2026-08-13 기준 잔여 위반 12건. 전부 의도적으로 남긴 것이다.
 *
 * - 확신도가 낮아 마이그레이션에서 뺀 것 (테오도라 라벤나 체류 등)
 * - rel 16종으로도 표현이 안 되는 것 (period의 소재, "황제를 조종했다")
 *
 * 이 목록이 줄면 좋고, 늘면 테스트가 실패한다. 늘려야 할 이유가 있으면
 * 여기 한 줄 추가하고 왜인지 적는다.
 */
const KNOWN_VIOLATIONS = new Set([
  // 로마를 place로 볼지 group으로 볼지가 안 정해져 남은 것
  'place:로마|participated_in|event:라틴동맹전쟁|1',
  'place:로마|participated_in|place:아펜니노산맥|1',
  // 체류가 아니라 여행 경로·출신 서술이라 located_in이 안 맞는 것
  'place:나일강|occurred_at|person:클레오파트라7세|7',
  'person:오다이나투스|occurred_at|place:시리아|19',
  'person:테오도라|occurred_at|place:라벤나|26',
  // "포함"이 아니라 "인접 지역 함락" 맥락
  'place:콘스탄티노플|occurred_at|place:발칸반도|30',
  'place:콘스탄티노플|occurred_at|place:소아시아|30',
  // located_in이 period를 안 받는다
  'period:팍스로마나|occurred_at|place:로마제국|15',
  // "황제를 조종했다" — 표현할 rel이 없다
  'person:루피누스|participated_in|person:아르카디우스|24',
  'person:에우트로피우스|participated_in|person:아르카디우스|24',
  'person:에우독시아|participated_in|person:아르카디우스|24',
  'person:안테미우스|participated_in|person:아르카디우스|24',
])

describe('온톨로지 데이터 계약', () => {
  const entities = loadEntities()
  const links = loadLinks()

  it('스키마를 통과한다', () => {
    // load*가 던지지 않았다면 통과다. 규모가 줄면 무언가 잘못된 것이다.
    expect(entities.length).toBeGreaterThan(600)
    expect(links.length).toBeGreaterThan(600)
  })

  it('불변식 1 — 객체 하나에 노트 하나', () => {
    const missing = entities.filter(
      (e) => !existsSync(join(REPO_ROOT, 'entities', e.type, `${e.note}.md`)),
    )
    expect(missing.map((e) => e.id)).toEqual([])
  })

  it('id는 타입 접두사와 실제 타입이 일치한다', () => {
    const bad = entities.filter((e) => !e.id.startsWith(`${e.type}:`))
    expect(bad.map((e) => e.id)).toEqual([])
  })

  it('알려진 것 말고 새 불변식 위반이 없다', () => {
    const fresh = checkInvariants(entities, links).filter(
      (v) => !KNOWN_VIOLATIONS.has(v.key),
    )
    expect(fresh).toEqual([])
  })

  it('알려진 위반 목록이 낡지 않았다', () => {
    // 고쳤는데 목록에서 안 지우면 다음 회귀를 못 잡는다.
    const actual = new Set(checkInvariants(entities, links).map((v) => v.key))
    const stale = [...KNOWN_VIOLATIONS].filter((k) => !actual.has(k))
    expect(stale).toEqual([])
  })

  it('링크에 중복이 없다', () => {
    const seen = new Set<string>()
    const dupes = links.filter((l) => {
      const k = linkKey(l)
      if (seen.has(k)) return true
      seen.add(k)
      return false
    })
    expect(dupes.map(linkKey)).toEqual([])
  })

  it('연도가 있으면 기원전은 음수다', () => {
    // 이 책의 범위는 기원전 8세기 ~ 서기 15세기. 3000년을 넘는 값은 오타다.
    const insane = links.filter(
      (l) =>
        (l.from_year != null && Math.abs(l.from_year) > 3000) ||
        (l.to_year != null && Math.abs(l.to_year) > 3000),
    )
    expect(insane.map(linkKey)).toEqual([])
  })
})
