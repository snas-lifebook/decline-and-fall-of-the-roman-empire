import { describe, expect, it } from 'vitest'
import { byChoseong } from './choseong'
import { loadEntities } from './ontology'

const name = (s: string) => s

describe('가나다 색인', () => {
  it('첫 글자 초성으로 묶는다', () => {
    const b = byChoseong(['가비니우스', '갈리아', '네로', '다키아'], name)
    expect(b.map((x) => x.key)).toEqual(['ㄱ', 'ㄴ', 'ㄷ'])
    expect(b[0].items).toHaveLength(2)
  })

  it('들어온 순서를 안 뒤집는다', () => {
    // 부르는 쪽이 이미 가나다로 정렬해 놨다. 여기서 또 정렬하면 그 결정을 덮어쓴다
    const b = byChoseong(['하나', '가나', '나나'], name)
    expect(b.map((x) => x.key)).toEqual(['ㅎ', 'ㄱ', 'ㄴ'])
  })

  it('한글이 아니면 「그 밖」으로 몬다', () => {
    const b = byChoseong(['Aqua', '3세기 위기', '가나'], name)
    expect(b.find((x) => x.key === '그 밖')?.items).toEqual(['Aqua', '3세기 위기'])
  })

  it('빈 이름에도 안 터진다', () => {
    expect(() => byChoseong([''], name)).not.toThrow()
  })

  it('실제 인물 262명이 칸 하나에 몰리지 않는다', () => {
    // 색인의 값은 「나누는 것」이다. 한 칸이 목록의 절반이면 안 나눈 것과 같다
    const people = loadEntities()
      .filter((e) => e.type === 'person')
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    const b = byChoseong(people, (e) => e.name)
    const biggest = Math.max(...b.map((x) => x.items.length))
    expect(b.length).toBeGreaterThan(8)
    expect(biggest).toBeLessThan(people.length / 3)
  })
})
