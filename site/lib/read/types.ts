/**
 * 카드가 되는 객체 종류와 그 한국어 이름.
 *
 * **여기에 import가 하나도 없는 것이 이 파일의 존재 이유다.** 「종류 고르기」는
 * `'use client'` 컴포넌트인데, 이 상수를 `lib/read/cards.ts`에서 가져오면 그 파일이
 * 딸린 `lib/entity.ts` → `node:fs`까지 브라우저 번들로 끌려간다. 실제로 빌드가
 * 그걸로 죽었다(2026-08-18, Turbopack `does not support external modules: node:fs`).
 *
 * `TYPE_KO`도 `lib/export/table.ts`에 있는 것을 안 쓴다 — 그쪽도 `entity.ts`를 문다.
 * 이름 일곱 개를 두 벌로 두는 값을 치르는 대신, 테스트가 두 벌이 어긋나지 않게 지킨다.
 */

/** 지명은 없다 — 지도가 받는다 */
export const CARD_TYPES = ['person', 'group', 'event', 'institution', 'work', 'period'] as const

export const CARD_TYPE_KO: Record<string, string> = {
  person: '인물',
  group: '집단',
  event: '사건',
  institution: '제도',
  work: '저작',
  period: '시대',
}
