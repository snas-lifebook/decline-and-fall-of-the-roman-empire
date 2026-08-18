/**
 * 본문 글꼴 네 종.
 *
 * **이 파일에 import가 하나도 없다.** `lib/read/types.ts`·`boot.ts`와 같은 이유 —
 * `'use client'` 설정 패널이 이걸 읽는데, 무엇이든 가져오면 그것이 딸린 `node:fs`가
 * 브라우저 번들로 끌려간다(2026-08-18에 실제로 빌드가 그걸로 죽었다).
 *
 * ## 전부 자체 호스팅한다 — 그래서 외부 요청이 0이 된다
 *
 * 앞 판은 Pretendard를 jsdelivr에서 받았다. 그게 이 사이트의 **마지막 외부 요청**
 * 이었고, 이번에 없앴다.
 *
 * ## 조각내지 않는다 — 조각이 더 비쌌다
 *
 * 「dynamic-subset이라 화면에 뜬 글자만 내려온다」고 알고 썼는데 **틀렸다.** 그건
 * 글자 단위가 아니라 `unicode-range` 코드포인트 블록 단위(Google Fonts와 같은 기법)라,
 * 한글 음절 블록이 코드포인트 순으로 잘려 있어 **한국어 장문은 조각을 거의 다 긁는다.**
 *
 * 실측(2026-08-18): 대목 한 장에 조각 92개 중 40개가 걸려 **1,163KB**가 내려왔다.
 * 마루 부리 **전체 파일 하나가 424KB**다. 조각내는 것이 두 배 비쌌다.
 *
 * 지금은 **고른 한 종만** 내려온다. 기본값 Pretendard는 261KB — 앞 판의 1/4이다.
 *
 * ## 글리프를 세어서 골랐다
 *
 * 배포본 739장에 실제로 쓰인 글자를 뽑아 대조했다(2026-08-18): **한글 1,096자 ·
 * 확장 라틴 9자 · em-dash 2,290회.** 앞의 셋은 **한 파일로 전부 덮는다**(실측
 * 1096/1096 · 9/9 · 구두점 8/8).
 *
 * **조선일보명조는 여기 없다.** River가 직접 언급했지만 둘 다 치명적이라 뺐다 —
 * ① 라이선스에 웹폰트 조항이 아예 없고(「배포된 형태 그대로」·「PC용으로 개발」)
 * woff2 변환이 회색지대다 ② **em-dash가 없다.** 이 책이 2,290번 쓴다.
 */

export type ReadFont = {
  id: string
  /** 설정 패널에 뜨는 이름 */
  label: string
  /** 명조인지 고딕인지 — 고르는 사람에게 이게 첫 갈림길이다 */
  kind: '명조' | '고딕'
  /** 한 줄 소개. 무엇을 고르는지 알고 고르게 한다 */
  hint: string
  /** `public/fonts/` 아래 파일명 */
  file: string
  /** CSS `font-family` 값 */
  family: string
  /** 귀속 표기. `/about`이 모아서 낸다 */
  by: string
  license: string
}

/**
 * 기본은 **Pretendard**다 — 지금까지 쓰던 그것이라 아무것도 안 만진 사람에게는
 * 바뀌는 것이 없다. 또한 넷 중 가장 가볍다(261KB).
 */
export const FONT_DEFAULT = 'pretendard'

export const READ_FONTS: readonly ReadFont[] = [
  {
    id: 'pretendard',
    label: 'Pretendard',
    kind: '고딕',
    hint: '지금까지 쓰던 글꼴입니다. 화면에서 또렷하고 가장 가볍습니다',
    file: 'Pretendard-Regular.subset.woff2',
    family: 'Pretendard',
    by: 'orioncactus',
    license: 'SIL Open Font License 1.1',
  },
  {
    id: 'maruburi',
    label: '마루 부리',
    kind: '명조',
    hint: '네이버가 화면 본문용으로 만든 명조입니다. 긴 글에 눈이 덜 피로합니다',
    file: 'MaruBuri-Regular.woff2',
    family: 'MaruBuri',
    by: '네이버 · AG 타이포그라피연구소',
    license: '네이버 오픈 라이선스',
  },
  {
    id: 'ridibatang',
    label: '리디바탕',
    kind: '명조',
    hint: '리디북스 전자책 본문 글꼴입니다. 마루 부리보다 획이 굵고 단단합니다',
    file: 'RIDIBatang.woff2',
    family: 'RIDIBatang',
    by: 'RIDI',
    license: 'SIL Open Font License 1.1',
  },
  {
    id: 'notosans',
    label: '본고딕',
    kind: '고딕',
    hint: '가장 널리 쓰이는 고딕입니다. Pretendard보다 획이 고전적입니다',
    file: 'NotoSansKR-Regular.woff2',
    family: 'NotoSansKR',
    by: 'Google',
    license: 'SIL Open Font License 1.1',
  },
]

/**
 * 글자 크기 — 배율 다섯 단계.
 *
 * **배율로 둔다.** 고정 px로 두면 제목·인용·카드가 따로 놀거나, 기기 글자 크기를
 * 키워 둔 사람의 설정을 덮어쓴다. `--read-scale`이 `.doc` 아래 글자 크기에 곱해진다.
 */
export const SIZE_STEPS = [0.9, 1, 1.12, 1.26, 1.42] as const
export const SIZE_DEFAULT = 1

/**
 * 바탕 — 밝게·어둡게는 `theme`이 이미 받는다. 여기서 더하는 것은 **회색**뿐이다.
 *
 * River: 「화이트, 다크, 글을 읽기 가장 좋은 회색」. 종이에 가까운 미색 회색이라
 * 흰 바탕의 눈부심 없이 어둡지도 않다. 대비는 **실측해서 4.5:1을 넘긴 값**으로
 * 고정했다(8/17 검수에서 라이트가 4.64:1로 가장 빡빡했다. 여기서 밑돌면 안 된다).
 */
export const TONE_DEFAULT = 'auto'
