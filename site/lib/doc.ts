import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { entityHref, type EntityRef } from './entity'
import { linkById } from './links'
import { dataCounts } from './datashape'
import { dataDate } from './datadate'

/**
 * `content/**\/*.md` 로더.
 *
 * **화면 문안을 TSX가 아니라 마크다운에 둔다.** 그러면 셋이 공짜로 따라온다 —
 * 「페이지 복사」(원문이 이미 마크다운이다) · 우측 목차(`parseOutlineFromMarkdown`) ·
 * 그림(`![](...)` 한 줄). `app/`은 조립만 한다(헌장 4절).
 *
 * `gray-matter`를 넣지 않는다. 우리가 쓰는 프론트매터는 `title`·`summary` 두 줄뿐이라
 * 정규식도 아니고 `indexOf` 두 번이면 끝난다.
 */

export type Doc = { title: string; summary: string; body: string }

const CONTENT = join(process.cwd(), 'content')

export function splitFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith('---\n')) return { meta: {}, body: raw }
  // 본문 중간의 `---`(수평선)를 끝으로 오해하지 않게 **첫 줄 다음부터** 찾는다
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { meta: {}, body: raw }

  const meta: Record<string, string> = {}
  for (const line of raw.slice(4, end).split('\n')) {
    const c = line.indexOf(':')
    // 값에 `https://`처럼 콜론이 또 있어도 첫 콜론에서만 자른다
    if (c > 0) meta[line.slice(0, c).trim()] = line.slice(c + 1).trim()
  }
  return { meta, body: raw.slice(end + 4).replace(/^\n+/, '') }
}

/** 위키링크 안팎을 가르는 자리. 홀수 칸이 코드다 (`String.split`이 캡처를 끼워 넣는다) */
const CODE = /(```[\s\S]*?```|`[^`\n]*`)/g

/**
 * `[[X]]`·`[[X|Y]]`를 평문으로 편다.
 *
 * **코드블록 안은 안 건드린다.** 「활용하기」의 코드블록은 사람이 그대로 복사해
 * AI에 붙여넣을 프롬프트라, 대괄호를 벗기면 그 프롬프트가 망가진다.
 *
 * 링크로 만들지 않고 평문으로 펴는 이유: 걸 곳(`/objects`)이 아직 없다. F16은
 * 찾아보기와 함께 온다.
 */
export function unwikilink(md: string): string {
  return outsideCode(md, (s) => s.replace(WIKILINK, (_, target, shown) => shown ?? target))
}

/** 코드블록 밖에만 손을 댄다. 홀수 칸이 코드다 (`String.split`이 캡처를 끼워 넣는다) */
const outsideCode = (md: string, f: (s: string) => string) =>
  md
    .split(CODE)
    .map((seg, i) => (i % 2 === 1 ? seg : f(seg)))
    .join('')

const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

/**
 * `[[X]]`를 **객체 페이지 링크로** 바꾼다 (F16).
 *
 * astryx `Markdown`이 마크다운 링크를 이미 렌더하므로 새 컴포넌트가 필요 없다 —
 * 표기만 바꿔주면 된다.
 *
 * **사전에 없으면 평문으로 편다.** 본문에는 `[[00_목차]]` 같은 챕터 이동 링크가
 * 262개 섞여 있는데, 그건 객체가 아니라 파일이라 걸 곳이 없다. 접두 규칙이 따로
 * 없으므로 「객체 사전에 있으면 객체, 없으면 문서」로 가른다.
 */
export function linkifyWikilinks(md: string, index: Map<string, EntityRef>): string {
  return outsideCode(md, (s) =>
    s.replace(WIKILINK, (_, target: string, shown?: string) => {
      const ref = index.get(target)
      if (!ref) return shown ?? target
      // 표시는 `그리스 (집단)`이 아니라 `그리스`다. 접미사는 파일명을 가르는 장치지
      // 사람이 읽을 이름이 아니다
      return `[${shown ?? ref.name}](${entityHref(ref)})`
    }),
  )
}

/**
 * `[제목](link:sheet)`의 `link:<id>`를 실제 주소로 바꾼다.
 *
 * 본문은 평범한 마크다운으로 남고 주소는 `lib/links.ts` 한 곳에만 산다. 사람이
 * `link:sheet`를 보고 "아 이게 그 시트구나"를 안다.
 */
export function resolveLinkRefs(md: string): string {
  return md.replace(/\]\(link:([^)\s]+)\)/g, (_, id: string) => `](${linkById(id).href})`)
}

/**
 * `{{자료기준일}}` 같은 자리를 실제 값으로 바꾼다.
 *
 * **손으로 적은 숫자는 조용히 거짓말이 된다.** `about.md`가 「이 사이트 페이지
 * 730장」·「2026년 8월 16일 기준」이라고 적어뒀는데 실제로는 739장이고 데이터
 * 기준일은 08-13이었다(감사 2026-08-17). 같은 레포의 `DataShape`는 파일을 세서
 * 34·72·644·667을 만들고 전부 맞았다 — 그 규율 밖에 있던 둘만 틀렸다.
 *
 * 그래서 셀 수 있는 것은 세고, 셀 수 없는 것은 **자리를 안 만든다.**
 */
export function resolveFacts(md: string): string {
  const facts: Record<string, () => string> = {
    객체수: () => String(dataCounts().entities),
    관계수: () => String(dataCounts().links),
    자료기준일: () => dataDate(),
  }
  // **`\w`는 한글을 안 잡는다.** 첫 판이 `\{\{(\w+)\}\}`라 `{{자료기준일}}`이 글자
  // 그대로 화면에 나갔다. 한국어만 쓰는 사이트에서 `\w`를 쓰면 늘 이렇게 된다
  return md.replace(/\{\{([^}\s]+)\}\}/g, (whole, key: string) => facts[key]?.() ?? whole)
}

export type DocSection = { id: string; title: string; md: string }

/**
 * H2마다 하나씩 자른다. 우측 목차와 본문이 **같은 하나에서 나오게** 하는 장치다.
 *
 * astryx의 `parseOutlineFromMarkdown`을 안 쓴다 — 슬러그를 `[^a-z0-9]+`로 만들어서
 * 한글 제목이 전부 빈 문자열이 되고 id가 통째로 겹친다(실측). 그리고 `Markdown`은
 * 제목에 `id`를 안 달아서 어차피 앵커가 없다. 그래서 절을 우리가 자르고 제목을
 * 우리가 그린다.
 *
 * **H3로는 자르지 않는다.** 문서가 짧아 2단 목차면 충분하고, 깊어질수록 목차가
 * 본문을 대신하려 든다.
 */
export function docSections(body: string): { intro: string; sections: DocSection[] } {
  const intro: string[] = []
  const titles: string[] = []
  const bodies: string[][] = []
  let inFence = false

  for (const line of body.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence
    // 코드블록 안의 `## `는 붙여넣을 프롬프트의 일부지 제목이 아니다
    if (!inFence && line.startsWith('## ')) {
      titles.push(line.slice(3).trim())
      bodies.push([])
    } else {
      ;(bodies[bodies.length - 1] ?? intro).push(line)
    }
  }

  return {
    intro: intro.join('\n').trim(),
    // id는 순번이다. 한글 제목을 슬러그로 만들려는 시도가 실패하는 자리다
    sections: titles.map((title, i) => ({ id: `sec-${i + 1}`, title, md: bodies[i].join('\n').trim() })),
  }
}

/** `/start/install` → `content/start/install.md`. 없으면 던진다 — 빈 화면을 조용히 내지 않는다 */
export function loadDoc(href: string): Doc {
  const raw = readFileSync(join(CONTENT, `${href.replace(/^\//, '')}.md`), 'utf8')
  const { meta, body } = splitFrontmatter(raw)
  return { title: meta.title ?? '', summary: meta.summary ?? '', body: resolveFacts(resolveLinkRefs(unwikilink(body))) }
}
