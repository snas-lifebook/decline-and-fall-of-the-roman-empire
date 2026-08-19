// @vitest-environment node
/**
 * 활용 사례가 **지어낸 것이 아님을 지킨다.**
 *
 * [[USAGE]] 30줄: 「한 번도 해보지 않은 레시피는 이 문서에 올리지 않는다. 그럴듯한
 * 활용법을 지어내는 순간 팀은 이 페이지를 안 믿는다.」 그 규율은 사람이 지키기로
 * 한 약속일 뿐이라, 자료가 바뀌면 조용히 낡는다.
 *
 * 그래서 **사례가 본문에 적어 둔 숫자를 실제 관계 자료에 다시 물어본다.** 2026-08-19에
 * 더한 넷은 전부 `ontology/links.jsonl` 667건에 질의해서 나온 값으로 썼고, 여기서
 * 그 값이 여전히 맞는지 센다. 자료가 바뀌어 숫자가 달라지면 이 테스트가 먼저 깨진다 —
 * 화면에 낡은 숫자가 남는 것보다 빌드가 멈추는 편이 낫다.
 */
import { describe, it, expect } from 'vitest'
import { loadEntities, loadLinks } from './ontology'
import { RECIPES, RECIPE_CATEGORIES } from './recipes'

describe('활용 사례', () => {
  it('갈래가 전부 등록된 것이다', () => {
    for (const r of RECIPES) expect(RECIPE_CATEGORIES).toContain(r.category)
  })

  it('걸리는 시간이 전부 붙어 있다', () => {
    for (const r of RECIPES) {
      expect(r.minutes, `${r.id}에 minutes가 없다`).toBeGreaterThan(0)
      // 30분을 넘으면 사례가 아니라 프로젝트다. 쪼개야 한다
      expect(r.minutes, `${r.id}가 너무 길다 — 쪼개라`).toBeLessThanOrEqual(30)
    }
  })

  it('카드가 무너지지 않는 길이를 지킨다', () => {
    for (const r of RECIPES) {
      expect(r.when.length, `${r.id}의 「언제 쓰나」가 길다`).toBeLessThanOrEqual(40)
      expect(r.title.length, `${r.id}의 제목이 길다`).toBeLessThanOrEqual(30)
      if (r.caution) expect(r.caution.length, `${r.id}의 「조심할 것」이 길다`).toBeLessThanOrEqual(70)
    }
  })

  it('재료를 가지러 갈 자리가 사이트 안이다', () => {
    for (const r of RECIPES) expect(r.materialHref).toMatch(/^\//)
  })
})

/**
 * 여기부터가 이 파일의 존재 이유다. **사례가 말한 숫자를 자료에 다시 물어본다.**
 */
describe('사례가 적어 둔 숫자가 자료와 맞는다', () => {
  const links = loadLinks()
  const entities = loadEntities()
  const nameOf = (id: string) => entities.find((e) => e.id === id)?.name ?? id

  it('편이 뒤집힌 쌍은 네 쌍이다 — side-flip', () => {
    const both = new Map<string, Set<string>>()
    for (const l of links) {
      if (l.rel !== 'opposed' && l.rel !== 'allied_with') continue
      const key = [l.from, l.to].sort().join('|')
      ;(both.get(key) ?? both.set(key, new Set()).get(key)!).add(l.rel)
    }
    const flipped = [...both.values()].filter((s) => s.size === 2)
    expect(flipped, '사례 본문이 「네 쌍」이라고 적고 있다').toHaveLength(4)
  })

  it('세 명 이상 이어지는 계승 사슬이 네 개다 — succession', () => {
    const next = new Map<string, string>()
    for (const l of links) if (l.rel === 'succeeded' && !next.has(l.from)) next.set(l.from, l.to)
    const heads = [...next.keys()].filter((k) => ![...next.values()].includes(k))
    const chains = heads
      .map((h) => {
        const c = [h]
        const seen = new Set(c)
        // 자료에 고리가 있으면 무한히 돈다. 본 것을 다시 만나면 멈춘다
        while (next.has(c[c.length - 1])) {
          const n = next.get(c[c.length - 1])!
          if (seen.has(n)) break
          c.push(n)
          seen.add(n)
        }
        return c
      })
      .filter((c) => c.length >= 3)
    expect(chains, '사례 본문이 「네 개」라고 적고 있다').toHaveLength(4)
    expect(Math.max(...chains.map((c) => c.length)), '가장 긴 사슬이 여섯이라고 적었다').toBe(6)
  })

  it('로마에 걸린 것이 열세 건이다 — place-roll', () => {
    const here = links.filter(
      (l) => (l.rel === 'occurred_at' || l.rel === 'located_in') && nameOf(l.to) === '로마',
    )
    expect(here, '사례 본문이 「로마에 13건」이라고 적고 있다').toHaveLength(13)
  })

  it('바르카스 삼형제가 한 무리로 묶인다 — faction', () => {
    const lions = links
      .filter((l) => l.rel === 'member_of' && nameOf(l.to) === '젊은 사자들')
      .map((l) => nameOf(l.from))
    expect(lions.sort(), '사례 본문이 한니발·하스드루발·마고 셋이라고 적고 있다').toEqual(
      ['마고', '하스드루발', '한니발'].sort(),
    )
  })
})
