/**
 * 한글 조사 고르기.
 *
 * **이 파일에 import가 하나도 없다.** `lib/read/fonts.ts`·`types.ts`와 같은 이유 —
 * `'use client'` 컴포넌트가 이걸 읽는데, 무엇이든 가져오면 그것이 딸린 `node:fs`가
 * 브라우저 번들로 끌려간다.
 */

/**
 * 「로」인가 「으로」인가.
 *
 * 화면 이름을 문장에 끼워 넣으면서 **받침을 안 봐서 「첫 화면로 같이 갑니다」가
 * 나가고 있었다**(2026-08-19, 첫 화면에서 발견). 자리 이름이 화면마다 달라서
 * 손으로 고를 수 없다 — 규칙으로 고른다.
 *
 * 받침이 없거나 받침이 `ㄹ`이면 「로」, 아니면 「으로」. 한글이 아닌 글자로
 * 끝나면(숫자·영문) 「로」를 쓴다 — 이 사이트의 자리 이름은 다 한글이라 거기까지
 * 규칙을 늘릴 값이 없다.
 */
export function ro(word: string): string {
  // 빈 문자열이면 `charCodeAt`이 NaN을 준다. NaN은 어느 부등호에도 안 걸려서
  // 범위 검사를 그냥 통과한다 — 테스트가 잡았다
  const code = word.trim().slice(-1).charCodeAt(0) - 0xac00
  if (!Number.isFinite(code) || code < 0 || code > 11171) return '로'
  const jong = code % 28
  return jong === 0 || jong === 8 ? '로' : '으로'
}
