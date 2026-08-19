// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { renderChatMockupSvg } from './chatmockup'

const svg = renderChatMockupSvg()

describe('AI 채팅창 목업', () => {
  it('유효한 SVG가 나온다', () => {
    expect(svg).toContain('<svg')
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+"/)
  })

  it('링크가 없으니 role="img"다 — role="group"은 안의 링크를 살릴 때만 쓴다', () => {
    expect(svg).toContain('role="img"')
    expect(svg).not.toContain('<a ')
  })

  it('이름 있는 그림이다 — aria-label이 비어 있지 않다', () => {
    const m = svg.match(/aria-label="([^"]*)"/)
    expect(m?.[1]?.length ?? 0).toBeGreaterThan(10)
  })

  it('삼단 라벨이 RecipeCard·SkillCard와 같은 말이다', () => {
    expect(svg).toContain('1 넣는 것')
    expect(svg).toContain('2 시키는 것')
    expect(svg).toContain('3 나오는 것')
  })

  it('글자가 SVG 텍스트로 남는다 — Ctrl+F에 잡혀야 한다', () => {
    expect(svg).toContain('<text')
    expect(svg).toContain('붙여넣습니다')
  })

  it('색은 전부 light-dark()다 — 하드코딩 색이 다크모드를 깬다', () => {
    const hexColors = svg.match(/#[0-9a-f]{3,6}/gi) ?? []
    expect(hexColors.length).toBeGreaterThan(0) // light-dark() 인자로는 쓰인다
    // style 블록 밖(도형 속성)에 색이 직접 박히지 않았는지 — fill/stroke는 전부 class로만 준다
    expect(svg).not.toMatch(/(fill|stroke)="#[0-9a-f]/i)
  })

  it('호출마다 같은 그림이 나온다 — 입력이 없으니 결정론적이다', () => {
    expect(renderChatMockupSvg()).toBe(svg)
  })
})
