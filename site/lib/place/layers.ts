/**
 * 지도에 기본으로 그리는 지명 종류.
 *
 * **이 파일에 import가 하나도 없다.** `lib/read/types.ts`·`boot.ts`·`fonts.ts`와 같은
 * 이유 — `'use client'` 설정 패널이 이걸 읽는데, `coords.ts`에서 가져오면 그것이 딸린
 * `node:fs`가 브라우저 번들로 끌려간다(2026-08-18에 실제로 빌드가 그걸로 죽었다).
 *
 * **넓은 것이 빠져 있다.** `region` 58곳 · `sea` 11 · `river` 16 · `lake` 1 ·
 * `strait` 1은 점 하나로 찍혀 있는데 그 점이 대개 그 지역 대표 도시 위다 —
 * `아프리카`가 `카르타고`에서 300m, `카파도키아`와 `카이사레아`는 좌표가 아예 같다.
 *
 * 끄면 최근접 두 지명이 12px 미만인 대목이 **29/30 → 8/30**으로 준다(실측 2026-08-18).
 * `WIDE_KINDS`(`coords.ts`)와 짝이며, 어긋나면 테스트가 잡는다.
 */
export const LAYERS_DEFAULT = ['city', 'building', 'battlefield', 'island', 'mountain', 'cape']
