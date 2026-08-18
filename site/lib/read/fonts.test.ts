// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { FONT_DEFAULT, READ_FONTS, SIZE_DEFAULT, SIZE_STEPS } from './fonts'

/**
 * 글꼴 정의가 **실제 파일·CSS와 어긋나지 않는가**.
 *
 * 이 테스트가 있는 이유: 글꼴은 세 군데에 나뉘어 산다 — 정의(`fonts.ts`),
 * 파일(`public/fonts/`), `@font-face`(`globals.css`). 한 군데만 고치면 **빌드도
 * 타입도 린트도 다 통과하는데 화면에서만 조용히 시스템 글꼴로 떨어진다.**
 * 8/17에 `.doc pre`·`main img` 두 건이 정확히 그렇게 죽어 있었다(헌장 19항).
 */

const ROOT = join(process.cwd())
const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8')

describe('글꼴 정의', () => {
  it('**파일이 실제로 있다**', () => {
    for (const f of READ_FONTS) {
      const p = join(ROOT, 'public/fonts', f.file)
      expect(existsSync(p), `${f.label} — ${f.file} 이 없다`).toBe(true)
    }
  })

  it('파일이 빈 껍데기가 아니다 — 내려받기가 리다이렉트 페이지를 준 적이 있다', () => {
    // 실제로 3KB짜리 HTML을 woff2로 받은 적이 있다(2026-08-18, fonts-archive의
    // NotoSansKR 주소). 크기를 안 보면 그게 그대로 배포된다
    for (const f of READ_FONTS) {
      const kb = statSync(join(ROOT, 'public/fonts', f.file)).size / 1024
      expect(kb, `${f.label} 이 ${Math.round(kb)}KB — 너무 작다`).toBeGreaterThan(100)
    }
  })

  it('woff2가 맞다 — 확장자만 보고 믿지 않는다', () => {
    for (const f of READ_FONTS) {
      const head = readFileSync(join(ROOT, 'public/fonts', f.file)).subarray(0, 4).toString('ascii')
      expect(head, `${f.label} 의 머리가 ${head}`).toBe('wOF2')
    }
  })

  it('**`@font-face`가 넷 다 있다**', () => {
    for (const f of READ_FONTS) {
      expect(css, `${f.label} 의 @font-face 가 없다`).toContain(`font-family: ${f.family};`)
      expect(css, `${f.label} 의 파일 경로가 CSS에 없다`).toContain(`/fonts/${f.file}`)
    }
  })

  it('**고르는 규칙이 넷 다 있다** — 없으면 단추만 눌리고 글꼴은 안 바뀐다', () => {
    for (const f of READ_FONTS) {
      expect(css, `html[data-font='${f.id}'] 규칙이 없다`).toContain(`html[data-font='${f.id}']`)
    }
  })

  it('스택 끝이 Pretendard다 — 본고딕에 없는 두 글자를 그쪽이 받는다', () => {
    // `Petar Milošević`(사진 저작자)의 `ć`·`š`가 본고딕에 없다. 스택이 받으면
    // 그 두 글자만 조용히 넘어가고 나머지는 고른 글꼴로 나온다
    for (const f of READ_FONTS) {
      if (f.id === FONT_DEFAULT) continue
      const rule = css.slice(css.indexOf(`html[data-font='${f.id}']`))
      expect(rule.slice(0, 200), `${f.label} 스택에 Pretendard 가 없다`).toContain('Pretendard')
    }
  })

  it('기본값이 목록 안에 있다', () => {
    expect(READ_FONTS.map((f) => f.id)).toContain(FONT_DEFAULT)
  })

  it('아이디가 안 겹친다', () => {
    const ids = READ_FONTS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('명조와 고딕이 둘 다 있다 — 한쪽만 넷이면 고를 뜻이 없다', () => {
    const kinds = new Set(READ_FONTS.map((f) => f.kind))
    expect(kinds.has('명조')).toBe(true)
    expect(kinds.has('고딕')).toBe(true)
  })

  it('전부 라이선스와 만든 이가 적혀 있다 — `/about`이 이걸 그대로 낸다', () => {
    for (const f of READ_FONTS) {
      expect(f.license.length, `${f.label} 라이선스`).toBeGreaterThan(3)
      expect(f.by.length, `${f.label} 만든 이`).toBeGreaterThan(1)
    }
  })

  it('**밖으로 나가는 글꼴 요청이 없다** — 자체 호스팅이 이 작업의 값이다', () => {
    const fontUrls = [...css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map((m) => m[1])
    const outside = fontUrls.filter((u) => /^https?:/.test(u))
    expect(outside, `외부 글꼴 요청: ${outside.join(', ')}`).toEqual([])
  })
})

describe('글자 크기', () => {
  it('기본값이 단계 안에 있다', () => {
    expect(SIZE_STEPS as readonly number[]).toContain(SIZE_DEFAULT)
  })

  it('오름차순이고 중복이 없다', () => {
    const s = [...SIZE_STEPS]
    expect(s).toEqual([...s].sort((a, b) => a - b))
    expect(new Set(s).size).toBe(s.length)
  })

  it('너무 작거나 크지 않다 — 본문이 안 읽히거나 한 줄에 세 단어가 된다', () => {
    expect(Math.min(...SIZE_STEPS)).toBeGreaterThanOrEqual(0.8)
    expect(Math.max(...SIZE_STEPS)).toBeLessThanOrEqual(1.6)
  })
})
