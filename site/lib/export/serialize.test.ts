// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { toCsv, toTsv, BOM } from './serialize'

const HEADER = ['이름', '설명']

describe('CSV — RFC4180', () => {
  it('쉼표가 든 필드를 따옴표로 감싼다', () => {
    // 2026-08-14 실측: naive join은 여기서 열이 갈렸다
    const csv = toCsv(HEADER, [['카이사르', '공화정, 제정']])
    expect(csv).toContain('"공화정, 제정"')
  })

  it('줄바꿈이 든 필드를 따옴표로 감싼다', () => {
    const csv = toCsv(HEADER, [['기번', '1권\n2권']])
    expect(csv).toContain('"1권\n2권"')
  })

  it('따옴표를 이중화한다 — 백슬래시가 아니다', () => {
    const csv = toCsv(HEADER, [['아우구스투스', '그는 "존엄자"로 불렸다']])
    expect(csv).toContain('"그는 ""존엄자""로 불렸다"')
    expect(csv).not.toContain('\\"')
  })

  it('아무것도 안 든 필드는 감싸지 않는다', () => {
    expect(toCsv(HEADER, [['로마', '도시']])).toContain('로마,도시')
  })

  it('행 종결은 CRLF다', () => {
    expect(toCsv(HEADER, [['로마', '도시']])).toContain('\r\n')
  })

  it('앞뒤 공백을 다듬는다 — 헤더에 공백이 섞이면 컬럼 매칭이 조용히 실패한다', () => {
    expect(toCsv(['  이름  '], [['  로마  ']])).toBe('이름\r\n로마\r\n')
  })

  it('왕복한다 — 쉼표·따옴표·줄바꿈이 다 든 데이터로', () => {
    const rows = [
      ['카이사르', '공화정, 제정'],
      ['아우구스투스', '그는 "존엄자"다'],
      ['기번', '1권\n2권'],
    ]
    expect(parseCsv(toCsv(HEADER, rows))).toEqual([HEADER, ...rows])
  })
})

describe('CSV — BOM', () => {
  it('BOM을 붙이면 EF BB BF로 시작한다', () => {
    // 맥·윈 엑셀 둘 다 BOM 없이는 한글이 깨진다 (RESEARCH R-D 실측)
    const bytes = Buffer.from(BOM + toCsv(HEADER, [['로마', '도시']]), 'utf8')
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  })

  it('BOM은 본문에 안 섞인다 — 첫 헤더가 오염되면 안 된다', () => {
    const text = BOM + toCsv(HEADER, [['로마', '도시']])
    expect(text.slice(1).startsWith('이름')).toBe(true)
  })
})

describe('TSV — 시트에 붙여넣기용', () => {
  it('탭으로 가른다', () => {
    expect(toTsv(HEADER, [['로마', '도시']]).text).toContain('로마\t도시')
  })

  it('쉼표는 건드리지 않는다 — TSV에서 무해하다', () => {
    const { text, replaced } = toTsv(HEADER, [['카이사르', '공화정, 제정']])
    expect(text).toContain('공화정, 제정')
    expect(replaced).toBe(0)
  })

  it('필드 안 탭을 공백으로 바꾼다 — 안 그러면 열이 는다', () => {
    const { text, replaced } = toTsv(HEADER, [['로마', '가\t나']])
    expect(text).toContain('가 나')
    expect(replaced).toBe(1)
  })

  it('필드 안 줄바꿈을 공백으로 바꾼다 — 안 그러면 행이 갈린다', () => {
    const { text, replaced } = toTsv(HEADER, [['기번', '1권\n2권']])
    expect(text.split('\n')).toHaveLength(2) // 헤더 + 1행
    expect(replaced).toBe(1)
  })

  it('무엇을 몇 개 바꿨는지 보고한다 — 화면에서 사람에게 말해야 한다', () => {
    const { replaced } = toTsv(HEADER, [
      ['가\t나', '다\n라'],
      ['멀쩡', '멀쩡'],
    ])
    expect(replaced).toBe(2)
  })

  it('열 수가 모든 행에서 같다', () => {
    const { text } = toTsv(HEADER, [
      ['가\t나', '다'],
      ['라', '마\n바'],
    ])
    const widths = text.split('\n').map((l) => l.split('\t').length)
    expect(new Set(widths).size).toBe(1)
  })
})

/** 테스트 전용 최소 CSV 파서. 왕복 검사에만 쓴다 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\r' && text[i + 1] === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
    } else field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}
