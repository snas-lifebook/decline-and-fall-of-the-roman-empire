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

/**
 * `points/` 아래 한 편을 읽어서 화면용·복사용 두 벌로 낸다.
 *
 * **포인트 30편과 앞뒤 글 세 편이 같은 손질을 받는다.** 일러두기·책머리에·옮기고
 * 나서도 같은 폴더에 같은 규칙으로 쓰였다 — 맨 위 H1, 그 아래 이동 줄. 그래서
 * 손질을 여기 한 번만 적고 둘이 나눠 쓴다. 따로 적으면 한쪽만 고쳐지는 날이 온다.
 */
export function readDoc(file: string, root = REPO_ROOT): { lead: string; md: string; plain: string } {
  const { body } = splitFrontmatter(readFileSync(join(root, 'points', `${file}.md`), 'utf8'))

  // 맨 위 한 줄이 이 글의 소개다. 뒤에 붙은 「 — 제목」은 H1과 겹쳐서 뗀다
  const lead = (body.match(/^# (.+)$/m)?.[1] ?? '').split(' — ')[0]

  // 이동 줄을 먼저 지우고 위키링크를 손댄다. 순서를 바꾸면 `[[`가 먼저 사라져
  // 이동 줄을 못 찾는다
  const cleaned = body.replace(/^(?:#{1,2} .*|.*\[\[00_목차.*)$/gm, '').replace(/^### /gm, '## ')

  return { lead, md: linkifyWikilinks(cleaned, entityIndex(root)), plain: unwikilink(cleaned) }
}

export function pointDoc(n: number, root = REPO_ROOT): PointDoc {
  const title = pointTitles(root).get(n) ?? ''
  const { lead, md, plain } = readDoc(
    `${String(n).padStart(2, '0')}_${title.replace(/ /g, '_')}`,
    root,
  )

  // 소개가 제목과 같은 글이 일곱 편 있다(13~18·22). 그때는 소개를 비운다
  return { title, lead: lead === title ? '' : lead, md, plain }
}

/** 목록에 쓰는 한 줄. 본문 전체를 안 들고 다니게 소개만 뽑는다 */
export function pointLead(n: number, root = REPO_ROOT): string {
  return pointDoc(n, root).lead
}
