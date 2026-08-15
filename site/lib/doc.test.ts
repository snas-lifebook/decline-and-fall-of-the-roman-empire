// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  splitFrontmatter,
  unwikilink,
  loadDoc,
  docSections,
  linkifyWikilinks,
  resolveLinkRefs,
} from './doc'
import { entityIndex } from './entity'

describe('프론트매터 분리', () => {
  it('제목과 부제를 떼고 본문만 남긴다', () => {
    const { meta, body } = splitFrontmatter(
      '---\ntitle: 옵시디언 설치\nsummary: 15분이면 끝납니다\n---\n\n## 먼저\n\n본문',
    )
    expect(meta.title).toBe('옵시디언 설치')
    expect(meta.summary).toBe('15분이면 끝납니다')
    expect(body.startsWith('## 먼저')).toBe(true)
  })

  it('프론트매터가 없으면 본문을 그대로 준다', () => {
    const { meta, body } = splitFrontmatter('# 제목\n\n본문')
    expect(meta).toEqual({})
    expect(body).toBe('# 제목\n\n본문')
  })

  it('본문 안의 `---`를 프론트매터 끝으로 오해하지 않는다', () => {
    const { body } = splitFrontmatter('---\ntitle: X\n---\n앞\n\n---\n\n뒤')
    expect(body).toContain('앞')
    expect(body).toContain('뒤')
  })

  it('값에 콜론이 있어도 첫 콜론에서만 자른다', () => {
    const { meta } = splitFrontmatter('---\nsummary: 주소는 https://example.com 입니다\n---\n본문')
    expect(meta.summary).toBe('주소는 https://example.com 입니다')
  })
})

describe('위키링크 펴기', () => {
  it('대괄호를 벗기고 이름만 남긴다', () => {
    expect(unwikilink('[[한니발]]이 알프스를 넘었다')).toBe('한니발이 알프스를 넘었다')
  })

  it('표시명이 있으면 표시명을 쓴다', () => {
    expect(unwikilink('[[person:하스드루발_바르카|하스드루발]]')).toBe('하스드루발')
  })

  it('한 줄에 여러 개가 있어도 다 편다', () => {
    expect(unwikilink('[[로마]]와 [[카르타고]]')).toBe('로마와 카르타고')
  })

  it('코드블록 안은 건드리지 않는다 — 붙여넣을 프롬프트가 망가진다', () => {
    const md = '앞 [[로마]]\n\n```\n[[로마]] 이대로 두어라\n```\n\n뒤 [[로마]]'
    const out = unwikilink(md)
    expect(out).toContain('```\n[[로마]] 이대로 두어라\n```')
    expect(out).toContain('앞 로마')
    expect(out).toContain('뒤 로마')
  })

  it('인라인 코드 안도 건드리지 않는다', () => {
    expect(unwikilink('`[[로마]]` 라고 씁니다')).toBe('`[[로마]]` 라고 씁니다')
  })

  it('이미지 링크를 위키링크로 착각하지 않는다', () => {
    const md = '![설정창 스크린샷](/guide/start/01.webp)'
    expect(unwikilink(md)).toBe(md)
  })
})

describe('위키링크를 객체 링크로', () => {
  const index = entityIndex()
  const go = (md: string) => linkifyWikilinks(md, index)

  it('객체는 마크다운 링크가 된다', () => {
    expect(go('[[카이사르]]가 갈리아로')).toBe('[카이사르](/objects/person/카이사르)가 갈리아로')
  })

  it('동명이인 접미사는 주소가 아니라 폴더가 가른다 — 표시에서 뗀다', () => {
    expect(go('[[그리스 (집단)]]')).toBe('[그리스](/objects/group/그리스)')
  })

  it('표시명이 있으면 표시명을 쓴다', () => {
    expect(go('[[카이사르|그]]')).toBe('[그](/objects/person/카이사르)')
  })

  it('객체가 아니면 평문으로 편다 — 챕터·목차로 링크를 만들지 않는다', () => {
    expect(go('[[00_목차|목차]]로 돌아가기')).toBe('목차로 돌아가기')
    expect(go('[[로마제국쇠망사_온톨로지]]')).toBe('로마제국쇠망사_온톨로지')
  })

  it('코드블록 안은 안 건드린다', () => {
    const md = '앞 [[카이사르]]\n\n```\n[[카이사르]] 이대로\n```'
    expect(go(md)).toContain('```\n[[카이사르]] 이대로\n```')
    expect(go(md)).toContain('앞 [카이사르](/objects/person/카이사르)')
  })

  it('링크가 하나도 안 남는다 — 화면에 대괄호가 보이면 실패다', () => {
    expect(go('[[카이사르]]와 [[00_목차]]와 [[한니발]]')).not.toContain('[[')
  })
})

describe('link: 참조를 실제 주소로', () => {
  it('레지스트리에서 주소를 가져온다', () => {
    expect(resolveLinkRefs('[운영 시트](link:sheet)')).toMatch(
      /^\[운영 시트\]\(https:\/\/docs\.google\.com\/spreadsheets\/\S+\)$/,
    )
  })

  it('한 줄에 여러 개도 편다', () => {
    const out = resolveLinkRefs('[깃허브](link:repo)와 [ZIP](link:zip)')
    expect(out).not.toContain('link:')
  })

  it('없는 id는 던진다 — 죽은 링크를 조용히 내보내지 않는다', () => {
    expect(() => resolveLinkRefs('[없다](link:없는것)')).toThrow(/없는것/)
  })

  it('평범한 마크다운 링크는 안 건드린다', () => {
    const md = '[옵시디언](https://obsidian.md/)'
    expect(resolveLinkRefs(md)).toBe(md)
  })
})

describe('절 자르기 — 우측 목차의 재료', () => {
  const md = '들어가는 말\n\n## 첫째 절\n\n가\n\n## 둘째 절\n\n나\n\n### 안쪽 제목\n\n다'

  it('첫 제목 앞의 도입부를 따로 준다', () => {
    expect(docSections(md).intro.trim()).toBe('들어가는 말')
  })

  it('H2마다 하나씩 자른다 — H3로는 안 자른다', () => {
    expect(docSections(md).sections.map((s) => s.title)).toEqual(['첫째 절', '둘째 절'])
  })

  it('본문을 제목 아래 것만 담는다', () => {
    expect(docSections(md).sections[1].md).toContain('### 안쪽 제목')
    expect(docSections(md).sections[0].md).not.toContain('둘째')
  })

  it('한글 제목에도 겹치지 않는 id를 준다 — astryx 슬러그는 한글에서 빈 문자열이 된다', () => {
    const ids = docSections(md).sections.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => id.length > 0)).toBe(true)
  })

  it('코드블록 안의 `##`를 제목으로 착각하지 않는다', () => {
    const withCode = '## 진짜 제목\n\n```\n## 이건 프롬프트 안이다\n```\n\n끝'
    const s = docSections(withCode).sections
    expect(s).toHaveLength(1)
    expect(s[0].md).toContain('## 이건 프롬프트 안이다')
  })

  it('제목이 하나도 없으면 전부 도입부다', () => {
    expect(docSections('그냥 글').sections).toEqual([])
    expect(docSections('그냥 글').intro).toBe('그냥 글')
  })
})

describe('문서 읽기', () => {
  it('주소로 마크다운을 찾아온다', () => {
    const doc = loadDoc('/start/install')
    expect(doc.title).not.toBe('')
    expect(doc.body.length).toBeGreaterThan(0)
  })

  it('없는 주소는 던진다 — 조용히 빈 화면을 내지 않는다', () => {
    expect(() => loadDoc('/start/없는것')).toThrow()
  })
})
