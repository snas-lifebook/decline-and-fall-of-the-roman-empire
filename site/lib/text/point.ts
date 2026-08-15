import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from '../ontology'
import { pointTitles } from '../points'
import { splitFrontmatter, unwikilink, linkifyWikilinks } from '../doc'
import { entityIndex } from '../entity'

/**
 * 편역본 포인트 본문을 화면이 쓸 모양으로 바꾼다.
 *
 * 원문 `points/NN_제목.md`는 **파일 하나로 읽히도록** 쓰였다. 그래서 맨 위에 H1이
 * 있고, 몇 편은 제목을 H2로 한 번 더 반복하고, 맨 끝에 앞뒤 이동 줄이 붙는다.
 * 화면은 그 셋을 이미 갖고 있으므로(제목·빵부스러기·이전/다음) 여기서 덜어낸다.
 *
 * 절을 H3에서 H2로 올리는 것도 여기다 — `docSections()`가 H2로 자르기 때문에,
 * 안 올리면 **우측 목차가 통째로 비어 나온다.**
 */

export type PointDoc = {
  title: string
  lead: string
  /** 화면용. 위키링크가 객체 페이지 링크로 살아 있다 */
  md: string
  /** 복사용. AI 창에 붙일 것이라 링크 문법 없이 평문이다 */
  plain: string
}

export function pointDoc(n: number, root = REPO_ROOT): PointDoc {
  const title = pointTitles(root).get(n) ?? ''
  const file = `${String(n).padStart(2, '0')}_${title.replace(/ /g, '_')}.md`
  const { body } = splitFrontmatter(readFileSync(join(root, 'points', file), 'utf8'))

  // 맨 위 한 줄이 이 포인트의 소개다. 뒤에 붙은 「 — 제목」은 H1과 겹쳐서 뗀다.
  // 떼고도 제목과 같은 글이 일곱 편 있는데(13~18·22), 그때는 소개를 비운다
  const one = (body.match(/^# (.+)$/m)?.[1] ?? '').split(' — ')[0]

  return {
    title,
    lead: one === title ? '' : one,
    ...(() => {
      // 이동 줄을 먼저 지우고 위키링크를 손댄다. 순서를 바꾸면 `[[`가 먼저 사라져
      // 이동 줄을 못 찾는다
      const cleaned = body
        .replace(/^(?:#{1,2} .*|.*\[\[00_목차.*)$/gm, '')
        .replace(/^### /gm, '## ')
      return { md: linkifyWikilinks(cleaned, entityIndex(root)), plain: unwikilink(cleaned) }
    })(),
  }
}

/** 목록에 쓰는 한 줄. 본문 전체를 안 들고 다니게 소개만 뽑는다 */
export function pointLead(n: number, root = REPO_ROOT): string {
  return pointDoc(n, root).lead
}
