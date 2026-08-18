import manifest from '../../data/people.json'
import { lifespan } from './years'

/**
 * 인물에 딸린 바깥 자료 — 초상과 생몰 연대.
 *
 * **`scripts/fetch-portraits.mjs`가 만든 표를 읽기만 한다.** 빌드는 외부로 나가지
 * 않는다 — 그림도 표도 레포에 있다(파비콘 13개와 같은 방식).
 *
 * 초상은 262명 중 164명(63%). 표본 25명으로 미리 쟀을 때는 44%였는데 전수로 돌리니
 * 더 높았다 — **표본이 작으면 무명 인물 쪽으로 치우친다.**
 *
 * 연대는 위키데이터(P569·P570)에서 온다. **우리 데이터에는 사실상 없다** — `birth`가
 * 1명, `death`가 3명이고 그중 둘은 연도가 아니라 「battle」·「execution」이다.
 * 초상이 없는 사람에게도 연대는 있는 경우가 많다(안토니우스·칼리굴라·호노리우스).
 *
 * 라이선스는 퍼블릭 도메인 70장, 나머지는 CC 계열이라 **저작자를 적어야 하는 것이
 * 대부분**이다. 48px 카드에는 못 적으므로 객체 화면 아래에 모아 적는다.
 */

export type Portrait = {
  file: string
  source: string
  license: string | null
  author: string | null
}

type Person = {
  portrait?: Portrait | null
  born?: number | null
  died?: number | null
}

const TABLE = manifest as Record<string, Person | null>

export function portraitOf(id: string): Portrait | null {
  return TABLE[id]?.portrait ?? null
}

/** 「기원전 100~44」. 모르면 `null`이라 카드가 그 줄을 아예 안 그린다 */
export function lifespanOf(id: string): string | null {
  const p = TABLE[id]
  if (!p) return null
  return lifespan(p.born ?? null, p.died ?? null)
}

/** 몇 명에게 있나 — 손으로 적으면 조용히 거짓말이 된다 */
export function peopleCounts(): { face: number; years: number; total: number } {
  const vals = Object.values(TABLE)
  return {
    face: vals.filter((v) => v?.portrait).length,
    years: vals.filter((v) => v && (v.born != null || v.died != null)).length,
    total: vals.length,
  }
}
