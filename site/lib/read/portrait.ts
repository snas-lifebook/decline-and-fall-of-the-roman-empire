import manifest from '../../data/portraits.json'

/**
 * 위키미디어 초상.
 *
 * **`scripts/fetch-portraits.mjs`가 만든 표를 읽기만 한다.** 빌드는 외부로 나가지
 * 않는다 — 그림도 표도 레포에 있다(파비콘 13개와 같은 방식).
 *
 * **262명 중 164명(63%)에게 있다**(실측 2026-08-18). 나머지 98명은 카드에서 타입
 * 표식으로 떨어진다. 표본 25명으로 미리 재봤을 때는 44%로 나왔는데, 전수로 돌리니
 * 더 높았다 — **표본이 작으면 무명 인물 쪽으로 치우친다.**
 *
 * 라이선스가 퍼블릭 도메인 70장, 나머지는 CC 계열이라 **저작자를 적어야 하는 것이
 * 대부분**이다. 48px 카드에는 못 적으므로 객체 화면 아래에 모아 적는다.
 */

export type Portrait = {
  file: string
  source: string
  license: string | null
  author: string | null
}

const TABLE = manifest as Record<string, Portrait | null>

export function portraitOf(id: string): Portrait | null {
  return TABLE[id] ?? null
}

/** 몇 명에게 있나 — FAQ가 이 숫자를 쓴다. 손으로 적으면 조용히 거짓말이 된다 */
export function portraitCounts(): { with: number; total: number } {
  const ids = Object.keys(TABLE)
  return { with: ids.filter((id) => TABLE[id]).length, total: ids.length }
}
