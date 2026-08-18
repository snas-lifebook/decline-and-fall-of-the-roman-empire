import { describe, it, expect } from 'vitest'
import { PAINTED, bootScript } from './boot'

/**
 * 첫 페인트 스크립트가 **설정을 하나도 안 빠뜨리는가**.
 *
 * 이 테스트가 있는 이유: `read-map`이 실제로 빠져 있었다(2026-08-18 발견). 지도를
 * 「본문 위에」로 골라둔 사람이 새로고침하면 **단추는 「본문 위에」가 눌린 채인데
 * 화면은 호버로 돌아가 있었다.** `ReadSettings`의 `paint()`는 사람이 단추를 누를
 * 때만 도는데, 첫 페인트 스크립트는 `theme`과 `cards`만 칠하고 있었다.
 *
 * 카드는 칠하고 지도는 안 칠한 **비대칭**이라 설계가 아니라 누락이다. 설정이
 * 여덟 개로 늘어나므로 같은 사고가 반복될 자리가 여덟 배가 된다.
 */

const script = bootScript()

describe('첫 페인트 스크립트', () => {
  it('**칠할 설정을 하나도 안 빠뜨린다** — `read-map`이 이렇게 빠져 있었다', () => {
    for (const [key, attr] of PAINTED) {
      expect(script, `${key} 를 안 읽는다`).toContain(key)
      expect(script, `${attr} 속성을 안 칠한다`).toContain(attr)
    }
  })

  it('테마는 저장값이 없으면 기기 설정을 따른다', () => {
    // 앞 판은 통째로 try로 감싸고 catch에서 light로 떨어뜨려서, 사생활 모드에서
    // **어두운 기기를 쓰는 사람이 밝은 화면을 받았다**(2026-08-17 검수 실측)
    expect(script).toContain('prefers-color-scheme:dark')
    expect(script).toContain("dataset.theme")
  })

  it('**저장이 막혀도 안 죽는다** — 사생활 모드', () => {
    // `localStorage`를 통째로 감싸지 말고 읽는 자리마다 감싼다.
    // catch가 읽기 횟수만큼 있어야 한 곳이 막혀도 나머지가 칠해진다
    const tries = script.match(/try\{/g)?.length ?? 0
    expect(tries, 'try 가 읽는 횟수만큼 있어야 한다').toBeGreaterThanOrEqual(PAINTED.length + 1)
  })

  it('값이 없으면 속성을 안 단다 — 속성이 없을 때가 기본값이다', () => {
    // CSS가 `html:is(:not([data-map]), [data-map='hover'])` 처럼 「없음」을 기본으로
    // 받는다. 빈 문자열을 칠하면 그 규칙이 안 걸린다
    expect(script).toContain('!==null')
  })

  it('**글자 크기는 CSS 변수까지 칠한다** — 속성만으로는 글자가 안 커진다', () => {
    // `data-size`는 값을 기억할 뿐이고 실제로 키우는 것은 `--read-scale`이다.
    // 여기서 빠지면 키워 둔 사람이 페이지마다 기본 크기를 한 번 보고 나서 커진다
    expect(script).toContain('--read-scale')
  })

  it('한 줄이다 — head에서 동기로 돌아야 한다', () => {
    expect(script).not.toContain('\n')
  })

  it('따옴표가 HTML 속성을 안 깬다', () => {
    // dangerouslySetInnerHTML로 <script> 안에 들어간다. `</script>`가 섞이면 끝난다
    expect(script).not.toContain('</')
  })
})

describe('칠할 설정 목록', () => {
  it('키가 겹치지 않는다', () => {
    const keys = PAINTED.map(([k]) => k)
    const attrs = PAINTED.map(([, a]) => a)
    expect(new Set(keys).size, '저장 키가 겹친다').toBe(keys.length)
    expect(new Set(attrs).size, 'data 속성이 겹친다').toBe(attrs.length)
  })

  it('저장 키는 전부 `read-` 로 시작한다 — `theme`만 예외다', () => {
    // 테마는 전 화면 설정이라 읽기 화면 것과 이름을 가른다
    for (const [key] of PAINTED) expect(key, key).toMatch(/^read-/)
  })

  it('data 속성 이름이 camelCase가 아니다 — dataset은 케밥을 낙타로 바꾼다', () => {
    // `dataset.myThing`은 `data-my-thing`이 된다. 여기서 낙타를 쓰면 CSS 선택자와
    // 어긋나므로 한 단어로만 둔다
    for (const [, attr] of PAINTED) expect(attr, attr).toMatch(/^[a-z]+$/)
  })
})
