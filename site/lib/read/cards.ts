import type { Entity, Link } from '../ontology'
import { entitySlug } from '../entity'
import { CARD_TYPES } from './types'

/**
 * 여백 카드 — 「이 사람이 누구인지」를 읽던 자리에서 보여준다 (Snow Fall 방식).
 *
 * **카드는 스크롤을 따라 바뀌지 않는다.** 그 사람이 **처음 나오는 문단 옆**에 박혀서
 * 안 움직인다. 그래서 스크롤 관찰자도, 위치 계산도 필요 없다 — 빌드 때 「몇 번째
 * 블록인가」만 세어 두면 CSS 그리드가 알아서 세로를 맞춘다. **클라이언트 JS 0줄.**
 *
 * ## 밀도가 이 기능의 성패다
 *
 * 실측(2026-08-18): 포인트당 고유 객체 **평균 47개**인데 문단은 평균 40개다. 전부
 * 카드로 만들면 문단마다 카드가 붙어 스노우폴이 아니라 **벽**이 된다. 그래서 두 번
 * 거른다.
 *
 *   1. **지명을 뺀다.** 614개로 가장 많고, 지명은 지도가 받는 게 맞다. 이것만으로 절반
 *   2. **이 포인트의 서술이 있는 것만.** 「책이 여기서 뭔가 말한 것」이라는 뜻이고,
 *      동시에 **카드 셋째 줄에 쓸 말이 있다는 뜻**이다. 없으면 이름만 든 빈 카드가 된다
 *
 * 그래도 안 된다. 걸러도 평균 19장이고 **포인트 13은 64블록에 48장** — 네 문단 중 셋에
 * 카드가 붙는다. 관계가 있는 것만 남겨도 38장이라 필터로는 안 풀린다. 그 대목에 정말
 * 27명이 나오기 때문이다. 그래서 **상한을 두고 밝힌다**(관계 연표가 이미 쓰는 방식).
 *
 *   3. **이 대목의 관계가 많은 순으로 자른다.** 관계가 얽힌 사람이 곧 헌장 0-1이 말한
 *      「누가 편이고 누가 적인지 헷갈리는」 그 사람이다. 자른 수는 화면에 적는다
 *
 * ## 언급을 어떻게 찾나
 *
 * 본문 원문의 `[[카이사르]]`를 다시 파싱하지 않는다. `pointDoc`이 이미
 * `linkifyWikilinks`로 `[카이사르](/objects/person/카이사르)`까지 바꿔 놓았으므로
 * **그 주소를 읽는다.** 표시 이름이 달라도(`[[폼페이우스|그나이우스 폼페이우스]]`)
 * 주소는 같아서 한 번에 맞는다.
 */

export { CARD_TYPES } from './types'

/**
 * 한 행에 카드 하나.
 *
 * **그리드는 같은 칸에 든 것을 포갠다.** 처음엔 「한 문단 옆에 셋까지」로 뒀는데,
 * 그게 곧 「한 칸에 셋」이라 브라우저에서 카드 셋이 겹쳐 찍혔다(실측: 포인트 05에서
 * 3건). 한 문단에서 두 사람이 처음 나오면 뒷사람 카드는 다음 행으로 민다 — 언급한
 * 자리에서 한 문단 멀어지는 값을 치르지만, 가려서 안 보이는 것보다 낫다.
 */
export const MAX_PER_BLOCK = 1

/** 한 대목에 이만큼까지 */
export const MAX_CARDS = 14

/**
 * 카드가 문단 수의 이만큼을 넘지 않는다. 짧은 대목에서 상한 14가 무의미해지는 것을 막는다
 * — 27블록짜리 대목에 14장이면 두 문단에 한 장꼴이라 결국 벽이다.
 */
export const MAX_DENSITY = 0.35

export type Card = {
  entity: Entity
  /** 몇 번째 블록 옆에 설 것인가. 1부터 */
  row: number
  /** 카드 셋째 줄. 이 대목에서 이 사람이 무엇을 했나 */
  line: string
}

/**
 * 본문 맨 아래 「### 등장 객체」 절의 제목.
 *
 * **이건 읽는 글이 아니라 목록이다.** 인물·지명·사건을 종류별로 늘어놓은 것이라
 * 본문에 그대로 두면 다 읽고 내려온 사람이 링크 예순 개짜리 벽을 만난다(River가
 * 화면을 보고 짚었다). 관계망·표·FAQ와 같은 성격이므로 같이 접는다.
 *
 * `lib/text/mentions.ts`가 같은 문자열로 이 절을 읽는다 — 거기가 원래 주인이고
 * 여기는 화면에서 어디까지가 본문인지 가르는 데만 쓴다.
 */
/** 이 제목이 곧 「여기부터는 본문이 아니다」는 표시다 */
export const TAIL_TITLE = '등장 객체'

const TAIL_HEADING = /^#{2,4}\s*등장 객체\s*$/m

/**
 * **제목 수준을 고정하지 않는다.** 원본 `points/*.md`는 `### 등장 객체`인데
 * `pointDoc`이 본문을 다듬으면서 `## `로 한 단계 올린다. `'### 등장 객체'`로 찾다가
 * 30개 대목에서 **하나도 안 걸렸다**(2026-08-18). 글자로 찾고 `#` 수는 안 센다.
 */
export const isTailHeading = (block: string) => TAIL_HEADING.test(block.split('\n')[0])

export type ReadLayout = {
  /** 본문 블록. 각각이 그리드 한 행이 된다 */
  blocks: string[]
  /**
   * 본문 뒤에 붙은 「등장 객체」 목록. 화면이 접어서 낸다.
   *
   * **카드도 여기서는 안 뽑는다.** 목록에만 이름이 나오는 사람에게 카드를 세우면
   * 그 카드가 본문 어디와도 짝이 안 맞는다 — 여백 카드는 「읽던 자리 옆」이 전부다.
   */
  tail: string[]
  /**
   * 블록과 같은 길이. 그 블록이 절 제목이면 `{title, id}`, 아니면 `null`.
   *
   * **화면이 아니라 여기서 번호를 매긴다.** `Markdown`은 제목에 id를 안 달아서 우리가
   * 달아야 목차가 뛰는데, 그리는 중에 세면 리액트 규칙(렌더 중 변경 금지)에 걸린다.
   * id 규칙은 `docSections`와 같다 — 문서에 나온 `## ` 순서로 `sec-1`, `sec-2`.
   */
  headings: ({ title: string; id: string } | null)[]
  cards: Card[]
  /** 고를 수 있었던 전체. `cards.length`보다 크면 잘랐다는 뜻이다 */
  total: number
}

/**
 * 그리드가 실제로 쓰는 행 수.
 *
 * **오른쪽 레일이 이 숫자를 알아야 한다.** CSS에 `grid-row: 1 / -1`이라고 적어 두면
 * 열 전체를 차지할 것 같지만 **안 그렇다** — 명시 행(`grid-template-rows`)이 없으면
 * `-1`이 1번 줄로 풀려서 `1 / 1`, 즉 **1행 한 칸**이 된다. 그러면 레일 키만큼 1행이
 * 늘어나 첫 문단 아래에 빈 자리가 생기고(실측 2026-08-19: 첫 블록 135px인데 1행이
 * 388px — 253px가 빈 자리였다. River가 화면을 보고 짚었다), 붙어 있으라고 만든
 * `sticky`도 갈 데가 없어진다.
 *
 * 카드가 밀려 마지막 블록보다 아래 행에 설 수 있으므로 둘 중 큰 쪽을 쓴다.
 */
export const rowCount = (l: Pick<ReadLayout, 'blocks' | 'cards'>) =>
  Math.max(l.blocks.length, ...l.cards.map((c) => c.row), 1)

const HREF = /\]\(\/objects\/([^/]+)\/([^)]+)\)/g

export function readLayout(
  point: number,
  md: string,
  entities: Entity[],
  links: Link[] = [],
): ReadLayout {
  const all = md
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  // 「등장 객체」부터 끝까지는 본문이 아니다. 카드도 여기서 안 뽑는다
  const cut = all.findIndex(isTailHeading)
  const blocks = cut === -1 ? all : all.slice(0, cut)
  const tail = cut === -1 ? [] : all.slice(cut)

  /*
   * 주소로 되찾는다. `entitySlug`는 이름에서 괄호를 지우고 공백을 밑줄로 바꾸므로
   * 여기서도 같은 함수를 써야 한다 — 따로 만들면 `아그리피나(클라우디우스의 아내)`
   * 같은 이름에서 조용히 어긋난다
   */
  const bySlug = new Map(entities.map((e) => [`${e.type}/${entitySlug(e.name)}`, e]))

  // 먼저 후보를 첫 언급 순으로 모은다. 자르는 것은 그다음이다
  const found: { entity: Entity; block: number; line: string }[] = []
  const seen = new Set<string>()

  blocks.forEach((block, i) => {
    for (const m of block.matchAll(HREF)) {
      const e = bySlug.get(`${m[1]}/${decodeURIComponent(m[2])}`)
      if (!e || seen.has(e.id)) continue
      if (!(CARD_TYPES as readonly string[]).includes(e.type)) continue

      const here = e.descs.find((d) => d.point === point)
      if (!here) continue

      seen.add(e.id)
      found.push({ entity: e, block: i, line: here.desc.trim() })
    }
  })

  const cap = Math.min(MAX_CARDS, Math.max(1, Math.floor(blocks.length * MAX_DENSITY)))

  // 이 대목에서 관계가 많은 순으로 남긴다. 동점이면 본문에 먼저 나온 쪽
  const degree = new Map<string, number>()
  for (const l of links) {
    if (l.point !== point) continue
    degree.set(l.from, (degree.get(l.from) ?? 0) + 1)
    degree.set(l.to, (degree.get(l.to) ?? 0) + 1)
  }
  const kept = [...found]
    .sort((a, b) => (degree.get(b.entity.id) ?? 0) - (degree.get(a.entity.id) ?? 0) || a.block - b.block)
    .slice(0, cap)
    .sort((a, b) => a.block - b.block)

  const cards: Card[] = []
  const perRow = new Map<number, number>()
  for (const f of kept) {
    // 그 행이 차 있으면 다음 행으로. 같은 칸에 두 장을 넣으면 그리드가 포갠다
    let row = f.block + 1
    while ((perRow.get(row) ?? 0) >= MAX_PER_BLOCK) row += 1
    perRow.set(row, (perRow.get(row) ?? 0) + 1)
    cards.push({ entity: f.entity, row, line: f.line })
  }

  let seq = 0
  const headings = blocks.map((b) => {
    const m = b.match(/^## (.+)$/)
    if (!m) return null
    seq += 1
    return { title: m[1].trim(), id: `sec-${seq}` }
  })

  // 밀어낸 카드가 순서를 흐트러뜨릴 수 있다. 행 순으로 세운다
  cards.sort((a, b) => a.row - b.row)
  return { blocks, tail, headings, cards, total: found.length }
}
