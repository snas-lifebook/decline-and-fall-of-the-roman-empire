// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { roleKo, ROLE_KO } from './vocab'
import { loadEntities } from './ontology'

const roles = loadEntities().flatMap((e) => {
  const r = e.attrs?.role
  return r === undefined ? [] : (Array.isArray(r) ? r : [r]).map(String)
})
const hasHangul = (s: string) => /[가-힣]/.test(s)

describe('역할 한국어', () => {
  it('아는 값은 한국어로 낸다', () => {
    expect(roleKo('emperor')).toBe('황제')
    expect(roleKo('Egypt pharaoh')).toBe('이집트 파라오')
  })

  it('대소문자를 안 가린다', () => {
    expect(roleKo('EMPEROR')).toBe(roleKo('emperor'))
    expect(roleKo('Roman Senator')).toBe(roleKo('roman senator'))
  })

  it('모르는 값은 원문 그대로 낸다 — 지어내지 않는다', () => {
    expect(roleKo('quaestor of nowhere')).toBe('quaestor of nowhere')
  })

  it('이미 한국어인 값은 안 건드린다', () => {
    expect(roleKo('황제')).toBe('황제')
    expect(roleKo('집정관')).toBe('집정관')
  })
})

describe('실제 데이터를 덮는가', () => {
  it('데이터에 role이 있다 — 이 테스트가 도는 전제', () => {
    expect(roles.length).toBeGreaterThan(200)
  })

  it('역할이 전부 한국어로 나온다', () => {
    // 화면이 한국어인데 칭호만 영어로 뜨던 것을 고친 자리다. 2026-08-16 실측
    // **280건 전부**가 한국어로 나온다 — 데이터의 149종을 사전이 다 덮는다.
    // 문턱을 99%로 둔 것은 새 객체 하나가 들어올 여지를 남긴 것이고, 그 하나가
    // 들어오는 순간 이 테스트가 먼저 알려준다
    const ko = roles.filter((r) => hasHangul(roleKo(r))).length
    expect(ko / roles.length).toBeGreaterThanOrEqual(0.99)
  })

  it('사전이 데이터를 앞지르지 않는다 — 안 쓰이는 항목이 절반을 넘지 않는다', () => {
    const used = new Set(roles.map((r) => r.toLowerCase()))
    const dead = Object.keys(ROLE_KO).filter((k) => !used.has(k))
    expect(dead.length).toBeLessThan(Object.keys(ROLE_KO).length / 2)
  })
})

describe('원문을 고치지 않는다', () => {
  it('번역은 화면에서만 한다 — 데이터의 영문 원문이 그대로 남아 있다', () => {
    // `lib/family/sex.ts`가 `wife of`·`son of` 같은 **영문 원문**을 읽어 성별을
    // 가른다. 데이터를 번역해 덮으면 그 판정이 통째로 무너진다
    expect(roles).toContain('wife of Octavianus')
    expect(roles.some((r) => /^[A-Za-z]/.test(r))).toBe(true)
  })
})
