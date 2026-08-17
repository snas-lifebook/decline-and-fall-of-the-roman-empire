import { describe, expect, it } from 'vitest'
import { pointTable } from './table'
import { mentionedIn } from '../text/mentions'
import { loadEntities, loadLinks } from '../ontology'
import { entityIndex } from '../entity'
import { POINT_COUNT } from '../points'

const ENTITIES = loadEntities()
const LINKS = loadLinks()
const INDEX = entityIndex()

/**
 * **읽기 화면과 가져가기 화면이 같은 물음에 다른 답을 주면 안 된다.**
 *
 * 감사(2026-08-17)에서 30포인트 **전부** 어긋나 있었다 — 본문의 「등장 객체」는
 * 합 1,496개이고 표는 959개였다. 포인트 05는 본문이 55개를 이름으로 대는데
 * 표는 18행만 줬다. 시칠리아·이탈리아·에스파냐처럼 **객체가 실재하는데도**
 * 빠졌다. 발표 표를 시트에 붙이는 사람이 본문에서 본 이름을 못 받는다.
 *
 * 원인은 두 화면이 다른 곳을 본 것이다 — 본문은 `points/NN_*.md`의 목록,
 * 표는 `entities.jsonl`의 `points` 배열. 후자가 덜 차 있었다.
 */
describe('본문에 이름이 뜬 객체는 그 포인트 표에도 있어야 한다', () => {
  it('30포인트 전부에서 빠진 이름이 없다', () => {
    const gaps: string[] = []
    for (let n = 1; n <= POINT_COUNT; n += 1) {
      const rows = new Set(pointTable(n, ENTITIES, LINKS).map((r) => r[0]))
      for (const ref of mentionedIn(n, INDEX)) {
        if (!rows.has(ref.name)) gaps.push(`포인트 ${n}: ${ref.name}`)
      }
    }
    expect(gaps).toEqual([])
  })

  it('표가 본문보다 늘어난다 — 앞 판은 959행이었다', () => {
    let total = 0
    for (let n = 1; n <= POINT_COUNT; n += 1) total += pointTable(n, ENTITIES, LINKS).length
    expect(total).toBeGreaterThan(1200)
  })
})

describe('본문 목록 읽기', () => {
  it('객체가 아닌 위키링크는 안 담는다', () => {
    // 본문에는 `[[06_천적과의_전쟁]]` 같은 챕터 이동 링크가 섞여 있다. 객체가 아니다
    const names = mentionedIn(5, INDEX).map((r) => r.name)
    expect(names.some((n) => /^\d\d_/.test(n))).toBe(false)
  })

  it('표시명이 아니라 객체 이름으로 돌려준다', () => {
    // 본문은 `[[그리스 (지명)|그리스]]`로 쓴다. 표에 들어갈 것은 사전의 이름이다
    const ids = mentionedIn(2, INDEX).map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
