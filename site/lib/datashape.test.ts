// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoTree, sampleLink, dataCounts } from './datashape'
import { REPO_ROOT, loadEntities, loadLinks } from './ontology'

describe('레포 구조', () => {
  it('폴더마다 개수가 붙는다 — 「폴더가 있다」로는 아무것도 안 알려준다', () => {
    expect(repoTree().length).toBeGreaterThan(3)
    expect(repoTree().every((n) => n.count.length > 0)).toBe(true)
  })

  it('개수가 실제 파일 수와 같다 — 손으로 적은 숫자는 반드시 낡는다', () => {
    const c = dataCounts()
    expect(c.entities).toBe(loadEntities().length)
    expect(c.links).toBe(loadLinks().length)
    expect(c.points).toBe(34)
    expect(c.source).toBe(72)
  })

  it('트리 문구에 실제 개수가 박혀 있다', () => {
    const ent = repoTree().find((n) => n.path.startsWith('entities'))
    expect(ent?.count).toContain(String(loadEntities().length))
  })
})

describe('관계 한 줄 해부 — 진짜 레코드여야 한다', () => {
  const s = sampleLink()
  const firstLine = readFileSync(join(REPO_ROOT, 'ontology/links.jsonl'), 'utf-8')
    .split('\n')
    .find((l) => l.trim())!

  it('화면에 뜨는 원문이 파일의 첫 줄과 **글자 하나까지** 같다', () => {
    // 손으로 베껴 적으면 데이터가 바뀌는 순간 화면이 거짓말이 된다.
    // 이 테스트가 그걸 막는 유일한 장치다
    expect(JSON.parse(s.raw)).toEqual(JSON.parse(firstLine))
  })

  it('id가 사람이 읽는 이름으로 풀린다', () => {
    const from = s.fields.find((f) => f.key === 'from')!
    expect(from.value).toContain('로물루스')
    expect(from.means).not.toBe('')
  })

  it('관계 종류가 한국어로 나온다 — 원시 키를 화면에 안 낸다 (DESIGN P8)', () => {
    const rel = s.fields.find((f) => f.key === 'rel')!
    expect(rel.value).toMatch(/[가-힣]/)
  })

  it('모든 칸에 「이게 무슨 뜻인가」가 붙는다', () => {
    expect(s.fields.length).toBeGreaterThanOrEqual(4)
    expect(s.fields.every((f) => f.means.length > 3)).toBe(true)
  })

  it('기원전이 음수 그대로 새어나가지 않는다', () => {
    const year = s.fields.find((f) => f.key === 'from_year')
    if (year) expect(year.value).not.toMatch(/^-\d/)
  })
})
