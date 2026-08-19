// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { sourceDoc } from './source'
import { readLayout } from '../read/cards'
import { docSections } from '../doc'
import { bookById } from '../book'

/**
 * 원전 한 장을 절로 나누는 일.
 *
 * 여기서 지키는 것 하나 — **목차의 줄 수와 본문의 앵커 수가 같아야 한다.**
 * 한 장이 12만 자라 목차가 유일한 이동 수단인데, 실제로 15장 목차에 아홉 줄이 뜨고
 * 그중 여덟이 아무 데도 안 가는 채로 나갔다(2026-08-19). 줄 끝 정규식 `\s*$`가
 * 뒤따르는 빈 줄까지 먹어서 제목이 다음 문단에 붙어 버린 것이다.
 */
describe('부(部)를 절로 올린다', () => {
  it('목차 줄 수와 본문 앵커 수가 같다 — 안 그러면 눌러도 아무 데도 안 간다', () => {
    const { md, parts } = sourceDoc('15_Chapter_XV')
    const anchors = readLayout(0, md, [], []).headings.filter(Boolean).length
    const outline = docSections(md).sections.length

    expect(parts, '15장은 부가 여럿이다').toBeGreaterThan(1)
    expect(outline, '목차가 부만큼 안 나온다').toBe(parts)
    expect(anchors, `목차 ${outline}줄인데 앵커가 ${anchors}개다`).toBe(outline)
  })

  it('부가 나뉜 장은 전부 목차와 앵커가 맞는다', () => {
    const chapters = (bookById('gibbon')?.parts ?? []).filter((p) => p.file)
    const broken: string[] = []
    for (const c of chapters) {
      const { md, parts } = sourceDoc(c.file!)
      if (parts < 2) continue
      const anchors = readLayout(0, md, [], []).headings.filter(Boolean).length
      if (anchors !== parts) broken.push(`${c.file}: 부 ${parts} vs 앵커 ${anchors}`)
    }
    expect(broken, '목차와 앵커가 어긋난 장').toEqual([])
  })

  /**
   * 구텐베르크 판은 머리글을 72자쯤에서 접는다. 1장이 그래서 두 줄로 갈라져 있고,
   * 줄 전체를 정규식 하나로 잡았더니 **1장 목차가 통째로 비어 나갔다**(2026-08-19).
   */
  it('머리글이 두 줄로 접힌 장도 잡는다 — 1장이 그렇다', () => {
    const { md, parts } = sourceDoc('01_Chapter_I')
    expect(parts, '1장에 부가 안 잡혔다').toBeGreaterThan(1)
    // 접힌 첫 줄이 본문에 유령으로 남으면 안 된다
    expect(/^Chapter\s+[IVXLC]+\s*:/m.test(md), '접힌 머리글의 첫 줄이 남았다').toBe(false)
  })

  it('부 제목이 제 덩어리에 홀로 선다 — 붙으면 앵커가 안 생긴다', () => {
    const { md } = sourceDoc('15_Chapter_XV')
    const stuck = md.split(/\n\s*\n/).filter((b) => /^## Part /.test(b.trim()) && b.trim().includes('\n'))
    expect(stuck, '제목이 뒷 문단과 한 덩어리다').toEqual([])
  })

  it('제목 줄은 본문에서 뺀다 — 화면이 따로 이고 있다', () => {
    const { md } = sourceDoc('01_Chapter_I')
    expect(md.startsWith('# '), 'H1이 본문에 남았다').toBe(false)
    expect(/^#\s+Chapter/m.test(md), 'H1이 본문 어딘가에 남았다').toBe(false)
  })

  /**
   * `00_서문`은 서문이 아니라 **전집 차례**다. 「Chapter N: …—Part M.」 줄을 249개
   * 갖고 있어서, 규칙을 파일 종류와 무관하게 걸었더니 목차가 249줄이 됐다.
   * 부로 나누는 것은 본문을 나눈다는 뜻이지 목록의 줄마다 제목을 단다는 뜻이 아니다.
   */
  it('본문이 아닌 것에는 절을 안 만든다 — 차례를 249줄로 쪼개지 않는다', () => {
    const { md, parts } = sourceDoc('00_서문')
    expect(parts).toBe(1)
    expect(md.includes('## Part '), '차례 줄이 절로 올라갔다').toBe(false)
  })
})
