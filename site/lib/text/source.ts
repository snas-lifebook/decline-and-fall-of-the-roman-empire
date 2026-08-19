import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from '../ontology'
import { splitFrontmatter } from '../doc'

/**
 * 기번 원전 한 장을 화면이 쓸 모양으로 바꾼다.
 *
 * 편역본을 다루는 `readDoc`과 **일부러 따로 둔다.** 둘은 손질이 반대다 —
 * 편역본은 위키링크를 객체 링크로 살려야 하고, 원전은 살릴 링크가 없다(영어 원문에
 * `[[ ]]`가 한 번도 안 나온다). 원전에 `linkifyWikilinks`를 도는 것은 **967만 자를
 * 훑어서 0건을 찾는 일**이라 빌드 시간만 먹는다.
 *
 * ## 부(部)를 절로 올린다 — 이게 이 파일의 존재 이유다
 *
 * 한 장이 중앙값 126,000자다. 그대로 내면 **목차가 텅 빈 12만 자짜리 화면**이 되어
 * 어디를 읽고 있는지도, 어디로 뛸지도 알 수 없다.
 *
 * 다행히 원문이 이미 나뉘어 있다. 구텐베르크 판은 장을 부로 쪼개 놓았는데, 그
 * 경계가 **평범한 글줄로** 들어 있다.
 *
 *     Chapter XV: Progress Of The Christian Religion.—Part II.
 *
 * 이 줄을 `## `로 올리면 오른쪽 목차가 그대로 살아난다 — `pointDoc`이 `###`를
 * `##`로 올려 같은 것을 얻는 수법이다. 없던 구조를 지어내는 게 아니라 **글이 이미
 * 갖고 있던 구조를 화면이 읽을 수 있게** 바꾸는 것이다.
 *
 * 첫 부에는 경계 줄이 없다. H1이 그 자리를 겸하기 때문인데, 화면은 제목을 따로
 * 이고 있으므로 H1을 떼면 1부가 이름을 잃는다. 그래서 **부가 둘 이상일 때만**
 * 맨 앞에 「Part I」을 세운다. 하나뿐인 장은 나눌 것이 없으니 그대로 둔다.
 */

/**
 * 부 경계 줄의 꼬리 — `…—Part II.`
 *
 * **줄 전체를 정규식 하나로 잡지 않는다.** 구텐베르크 판은 머리글을 72자쯤에서
 * 접기 때문에 장에 따라 **두 줄로 갈라져 있다.**
 *
 *     Chapter XV: Progress Of The Christian Religion.—Part II.     ← 한 줄
 *
 *     Chapter I: The Extent Of The Empire In The Age Of The        ← 접힌 것
 *     Antonines.—Part II.
 *
 * `^Chapter …—Part …$`로 잡았더니 접힌 장이 통째로 안 걸려서 **1장 목차가 텅 빈 채로
 * 나갔다**(2026-08-19). 그래서 꼬리만 정규식으로 보고, 앞 줄이 접힌 머리글의 첫
 * 줄이면 그것도 같이 걷어낸다.
 */
const PART_TAIL = /[—-]\s*Part\s+([IVXLC]+)\.?[ \t]*$/

/** 접힌 머리글의 첫 줄. 자기는 `Part`로 안 끝난다 */
const HEAD_START = /^Chapter\s+[IVXLC]+\s*:/

/**
 * 머리글은 짧다. 이 길이를 넘으면 우연히 그렇게 끝나는 산문으로 본다 —
 * 967만 자를 훑는 규칙이라 느슨하게 두면 본문 한가운데에 제목이 박힌다.
 */
const HEAD_MAX = 90

export type SourceDoc = { md: string; plain: string; parts: number }

export function sourceDoc(file: string, root = REPO_ROOT): SourceDoc {
  const { body } = splitFrontmatter(readFileSync(join(root, 'source', `${file}.md`), 'utf8'))

  /*
   * **장인지 아닌지를 H1이 가른다.**
   *
   * 71개 장에는 H1이 하나씩 있고 `00_서문`에는 없다(실측). 그리고 그 서문은 서문이
   * 아니라 **전집 차례**라, 「Chapter N: …—Part M.」 줄을 **249개** 갖고 있다. 규칙을
   * 파일 종류와 무관하게 걸었더니 그 249줄이 전부 절로 올라가 목차가 249줄이 됐다.
   *
   * 부로 나누는 것은 「12만 자짜리 본문을 나눈다」는 뜻이지 「목록의 줄마다 제목을
   * 단다」는 뜻이 아니다. 본문이 아닌 것에는 안 건다.
   */
  const isChapter = /^#\s+/m.test(body)

  // 제목은 화면이 따로 이고 있다. 본문에 또 두면 두 번 찍힌다
  const withoutTitle = body.replace(/^#\s+.*$/m, '').replace(/^\n+/, '')
  if (!isChapter) return { md: withoutTitle, plain: withoutTitle, parts: 1 }

  /*
   * 줄 단위로 훑는다. 접힌 머리글 때문에 정규식 하나로는 안 되고, **바꿔 넣은 제목
   * 앞뒤에 빈 줄을 보장해야** 한다 — 안 그러면 제목이 다음 문단과 한 덩어리가 되어
   * `readLayout`이 절로 못 세고, 목차는 뜨는데 눌러도 아무 데도 안 간다.
   */
  const out: string[] = []
  let parts = 0

  for (const line of withoutTitle.split('\n')) {
    const m = line.length <= HEAD_MAX ? line.match(PART_TAIL) : null
    if (!m) {
      out.push(line)
      continue
    }
    // 접힌 머리글의 첫 줄이 앞에 남아 있으면 같이 걷어낸다
    if (out.length && HEAD_START.test(out[out.length - 1]) && !PART_TAIL.test(out[out.length - 1])) {
      out.pop()
    }
    while (out.length && !out[out.length - 1].trim()) out.pop()
    out.push('', `## Part ${m[1]}`, '')
    parts += 1
  }

  const md = out.join('\n')

  return {
    // 부가 하나 이상 나왔다면 1부에도 이름을 준다 — 첫 부는 H1이 겸하던 자리라 표시가 없다
    md: parts ? `## Part I\n\n${md.replace(/^\n+/, '')}` : md,
    plain: withoutTitle,
    parts: parts ? parts + 1 : 1,
  }
}
