// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { skillSources } from './skills'

describe('skillSources', () => {
  const all = skillSources()

  it('여덟 벌을 읽고 필드가 다 찬다', () => {
    expect(all.length).toBeGreaterThanOrEqual(8)
    for (const s of all) {
      expect(s.description.length).toBeGreaterThan(10)
      expect(s.body).toContain('## 언제 쓰는가')
      expect(s.body.startsWith('# ')).toBe(false) // H1 제거됨
    }
  })

  it('로컬 사용자 경로가 새지 않는다', () => {
    expect(all.map((s) => s.body).join('\n')).not.toContain('/Users/')
  })
})
