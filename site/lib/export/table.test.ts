// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { pointTable, EXPORT_HEADER } from './table'
import type { Entity, Link } from '../ontology'

const e = (id: string, name: string, over: Partial<Entity> = {}): Entity => ({
  id,
  name,
  type: 'person',
  aliases: [],
  attrs: {},
  points: [3],
  descs: [],
  note: `entities/person/${name}.md`,
  ...over,
})

const l = (from: string, rel: Link['rel'], to: string, point = 3): Link =>
  ({ from, rel, to, point }) as Link

const 한니발 = e('person:한니발', '한니발', { aliases: ['Hannibal'], desc: '카르타고 장군' })
const 하밀카르 = e('person:하밀카르', '하밀카르 바르카', { points: [2, 3] })
const 로마 = e('place:로마', '로마', { type: 'place', points: [2, 3] })

describe('포인트별 표', () => {
  it('그 포인트에 등장하는 객체만 담는다', () => {
    const 딴사람 = e('person:갈바', '갈바', { points: [12] })
    const rows = pointTable(3, [한니발, 딴사람], [])
    expect(rows.map((r) => r[0])).toEqual(['한니발'])
  })

  it('헤더와 열 수가 맞는다', () => {
    const rows = pointTable(3, [한니발], [])
    expect(rows[0]).toHaveLength(EXPORT_HEADER.length)
  })

  it('책에 나온 순서를 지킨다 — 가나다순이 아니다', () => {
    // 등장 순서는 entities.jsonl의 줄 순서가 나른다 (USECASE 2단계)
    const rows = pointTable(3, [로마, 한니발, 하밀카르], [])
    expect(rows.map((r) => r[0])).toEqual(['로마', '한니발', '하밀카르 바르카'])
  })

  it('별칭을 쉼표로 잇는다', () => {
    const rows = pointTable(3, [한니발], [])
    expect(rows[0]).toContain('Hannibal')
  })
})

describe('이 포인트에서 — 서술 고르기', () => {
  it('해당 포인트의 서술이 있으면 그것을 쓴다', () => {
    const 하스드루발 = e('person:하스드루발', '하스드루발', {
      points: [2, 3],
      desc: '3차 포에니 사령관',
      descs: [
        { point: 2, desc: '파노르무스의 패장' },
        { point: 3, desc: '한니발의 동생' },
      ],
    })
    expect(pointTable(3, [하스드루발], [])[0][2]).toBe('한니발의 동생')
  })

  it('없으면 대표 서술로 떨어진다', () => {
    expect(pointTable(3, [한니발], [])[0][2]).toBe('카르타고 장군')
  })

  it('둘 다 없으면 빈 칸이다 — 지어내지 않는다', () => {
    const 민무늬 = e('person:마고', '마고')
    expect(pointTable(3, [민무늬], [])[0][2]).toBe('')
  })
})

describe('관계를 사람이 읽는 문장으로', () => {
  it('rel을 한국어 라벨로 바꾼다', () => {
    const rows = pointTable(3, [한니발, 로마], [l('person:한니발', 'opposed', 'place:로마')])
    expect(rows[0][4]).toContain('대립: 로마')
  })

  it('child_of는 방향에 따라 라벨이 갈린다', () => {
    // X --child_of--> Y 는 "X는 Y의 자식" (2026-08-14 확정)
    const links = [l('person:한니발', 'child_of', 'person:하밀카르')]
    const rows = pointTable(3, [한니발, 하밀카르], links)
    expect(rows[0][4]).toContain('부모: 하밀카르 바르카')
    expect(rows[1][4]).toContain('자녀: 한니발')
  })

  it('여러 관계를 구분자로 잇는다', () => {
    const links = [
      l('person:한니발', 'opposed', 'place:로마'),
      l('person:한니발', 'child_of', 'person:하밀카르'),
    ]
    const cell = pointTable(3, [한니발, 로마, 하밀카르], links)[0][4]
    expect(cell).toContain('대립: 로마')
    expect(cell).toContain('부모: 하밀카르 바르카')
  })

  it('id가 아니라 이름을 쓴다 — 사람이 읽는 칸이다', () => {
    const rows = pointTable(3, [한니발, 로마], [l('person:한니발', 'opposed', 'place:로마')])
    expect(rows[0][4]).not.toContain('place:')
  })

  it('다른 포인트의 관계는 안 담는다', () => {
    const links = [l('person:한니발', 'opposed', 'place:로마', 12)]
    expect(pointTable(3, [한니발, 로마], links)[0][4]).toBe('')
  })

  it('표에 없는 상대를 가리키는 관계는 버린다', () => {
    const links = [l('person:한니발', 'opposed', 'person:없는사람')]
    expect(pointTable(3, [한니발], links)[0][4]).toBe('')
  })

  it('관계가 없으면 빈 칸이다', () => {
    expect(pointTable(3, [한니발], [])[0][4]).toBe('')
  })
})

describe('출처 — 어디 나온 얘기인가', () => {
  it('등장 포인트를 모두 적는다', () => {
    // DPRR이 관계마다 (Broughton MRR I)를 다는 것과 같은 자리 (RESEARCH R-E)
    expect(pointTable(3, [하밀카르], [])[0][5]).toBe('2, 3')
  })
})
