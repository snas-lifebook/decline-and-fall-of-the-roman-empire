/**
 * 첫 페인트 전에 `<html>`에 설정을 칠하는 스크립트.
 *
 * **이 파일에 import가 하나도 없다.** `lib/read/types.ts`와 같은 이유다 — 이 목록을
 * `'use client'` 설정 컴포넌트도 같이 쓰는데, 여기서 무엇이든 가져오면 그것이 딸린
 * `node:fs`까지 브라우저 번들로 끌려간다.
 *
 * ## 왜 head에서 동기로 도는가
 *
 * 정적 사이트라 **서버가 사용자 설정을 모른다.** 리액트가 하이드레이션한 뒤에 칠하면
 * 그 사이에 기본값 화면이 한 번 보인다 — 어둡게 쓰는 사람에게는 흰 화면 번쩍임이고,
 * 카드를 꺼둔 사람에게는 카드가 떴다 사라지는 것이다. `<body>`가 그려지기 전에
 * 끝나야 한다.
 *
 * ## 목록으로 두는 이유
 *
 * 앞 판은 `theme`과 `cards`를 손으로 적었고 **`map`을 빠뜨렸다**(2026-08-18). 지도를
 * 「본문 위에」로 골라둔 사람이 새로고침하면 단추는 그대로인데 화면은 호버로 돌아갔다.
 * 카드는 칠하고 지도는 안 칠한 비대칭이라 설계가 아니라 누락이다.
 *
 * 설정이 여덟 개로 늘어나므로 **하나씩 적는 방식은 반드시 또 빠뜨린다.** 목록 하나를
 * 돌리고, 테스트가 목록과 스크립트를 대조한다.
 */

/**
 * `<html>`에 칠하는 설정 — `[localStorage 키, data 속성 이름]`.
 *
 * **속성 이름은 한 단어로만 쓴다.** `dataset.myThing`은 `data-my-thing`이 되므로
 * 낙타를 쓰면 CSS 선택자와 조용히 어긋난다(테스트가 막는다).
 *
 * 테마는 여기 없다 — 저장값이 없을 때 **기기 설정을 따라야 해서** 모양이 다르다.
 */
export const PAINTED = [
  /** 옆에 세울 객체 종류. 공백으로 이어 붙인 목록 */
  ['read-cards', 'cards'],
  /** 지도를 어떻게 볼지 — hover · side · bottom · off */
  ['read-map', 'map'],
  /** 본문 글꼴 */
  ['read-font', 'font'],
  /** 본문 글자 크기 배율 */
  ['read-size', 'size'],
  /** 바탕 — 회색 읽기 모드. 밝게·어둡게는 `theme`이 받는다 */
  ['read-tone', 'tone'],
  /** 포커스 모드 */
  ['read-focus', 'focus'],
  /** 왼쪽 패널 접힘 */
  ['read-rail', 'rail'],
  /** 지도에 그릴 지명 종류. 공백으로 이어 붙인 목록 */
  ['read-layers', 'layers'],
] as const

export type PaintedKey = (typeof PAINTED)[number][0]

/**
 * 스크립트 한 줄을 만든다.
 *
 * **`localStorage`를 읽는 자리마다 따로 감싼다.** 앞 판은 통째로 감싸고 `catch`에서
 * `light`로 떨어뜨렸는데, 사생활 모드처럼 저장이 막힌 브라우저에서 **어두운 기기를
 * 쓰는 사람이 밝은 화면을 받았다**(2026-08-17 검수 실측). 저장을 못 읽는 것과 기기
 * 설정을 못 읽는 것은 다른 일이다.
 *
 * **값이 없으면 속성을 안 단다.** CSS가 「속성 없음」을 기본값으로 받게 써 있다
 * (`html:is(:not([data-map]), [data-map='hover'])`). 빈 문자열을 칠하면 그 규칙이
 * 안 걸려서, 저장이 막힌 브라우저에서 화면이 통째로 비는 쪽으로 넘어간다.
 */
export function bootScript(): string {
  const theme =
    "var m=null;try{m=localStorage.getItem('theme')}catch(e){}" +
    "var d=m==='dark'||((!m||m==='system')&&matchMedia('(prefers-color-scheme:dark)').matches);" +
    "document.documentElement.dataset.theme=d?'dark':'light';"

  const rest = PAINTED.map(
    ([key, attr]) =>
      `var ${varOf(attr)}=null;try{${varOf(attr)}=localStorage.getItem('${key}')}catch(e){}` +
      `if(${varOf(attr)}!==null)document.documentElement.dataset.${attr}=${varOf(attr)};`,
  ).join('')

  return `(function(){${theme}${rest}})()`
}

/** 스크립트 안에서 쓸 지역 변수 이름. 속성마다 달라야 서로 안 덮는다 */
const varOf = (attr: string) => `_${attr}`
