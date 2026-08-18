import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from './ontology'
import { pointList } from './points'

/**
 * 읽기를 **책 한 권으로** 묶는다.
 *
 * 앞 판의 `/read`는 30개가 평평하게 늘어선 목록이었다. 그게 왜 문제인가 —
 * **이 30개는 흩어진 글이 아니라 한 권의 차례다.** 목록으로 두면 「어디까지 왔나」도
 * 「이게 뭔가」도 화면이 답하지 않고, 무엇보다 **일러두기·책머리에·옮기고 나서가
 * 갈 곳이 없었다.** 실제로 그 셋은 `points/`에 파일로 있는데 사이트 739장 어디에도
 * 안 걸려 있었다(River 지적: 「01~30뿐만 아니라 앞에 서문이나 이런 것도 다 넣어주시오」).
 *
 * 그래서 여기가 **책의 정본**이다. 책장·책 소개·사이드바·앞뒤 이동이 전부 이 하나를
 * 먹는다. `lib/nav.ts`가 세 군데에 순서를 따로 적지 않는 것과 같은 이유다.
 *
 * ## 쪽수는 지어내지 않고 차례에서 읽는다
 *
 * `points/00_목차.md`가 **종이책 쪽수를 이미 갖고 있다** — 그 파일이 「책을 펴 놓고
 * 같은 자리를 찾을 수 있다」고 스스로 밝힌 이유다. 화면에 손으로 옮겨 적으면 반드시
 * 어긋나므로 그 줄을 파싱한다. `resolveFacts`가 「셀 수 있는 것은 센다」고 한 규율과
 * 같은 자리다.
 */

export type PartKind = 'front' | 'point' | 'back'

export type BookPart = {
  href: string
  title: string
  kind: PartKind
  /** 본문 30포인트일 때의 번호. 앞뒤 글에는 없다 */
  n?: number
  /** 종이책 쪽수. 차례에 적힌 것만 */
  page?: number
  /** `points/` 아래 파일명(확장자 없이). 앞뒤 글을 읽을 때 이걸로 연다 */
  file?: string
}

export type Book = {
  id: string
  title: string
  /** 기번의 원저. 이 책이 무엇을 줄인 것인지 */
  original: string
  by: { role: string; name: string }[]
  publisher: string
  /** 표지 이미지. `public/` 아래 경로. 없으면 화면이 글자로 표지를 짠다 */
  cover?: string
  /** 책장에서 한 줄. 이게 무슨 책인지 */
  blurb: string
  /** 책 화면 첫 문단. 왜 이 책을 이 자료실이 다루는가 */
  about: string
  parts: BookPart[]
}

/** 앞뒤 글 세 편. 파일명과 화면에 낼 이름이 다르다(`_`가 공백이다) */
const EXTRA: { file: string; title: string; kind: PartKind }[] = [
  { file: '00_일러두기', title: '일러두기', kind: 'front' },
  { file: '00_책머리에', title: '책머리에', kind: 'front' },
  { file: '99_옮기고_나서', title: '옮기고 나서', kind: 'back' },
]

/** 주소에 쓰는 조각. 객체 쪽 `entitySlug`와 같은 규칙이라 공백만 밑줄로 바꾼다 */
export const textSlug = (title: string) => title.replace(/ /g, '_')

export const textHref = (title: string) => `/read/text/${textSlug(title)}`

/**
 * 차례에서 쪽수를 읽는다.
 *
 * 두 모양이 있다 — 포인트는 `**01** [[..]] — 부제 · 21`, 앞뒤 글은 `- [[..]] · 4`.
 * 둘 다 **줄 끝의 `· 숫자`**가 쪽수이고 앞의 `[[파일명|...]]`이 누구 것인지 말한다.
 * 그래서 한 정규식으로 받는다. 못 찾으면 그냥 없는 것으로 둔다 — 쪽수가 없다고
 * 화면이 죽을 이유는 없다.
 */
function pagesFromToc(root: string): Map<string, number> {
  const out = new Map<string, number>()
  let raw = ''
  try {
    raw = readFileSync(join(root, 'points', '00_목차.md'), 'utf8')
  } catch {
    return out
  }
  for (const line of raw.split('\n')) {
    const m = line.match(/\[\[([^\]|]+)[^\]]*\]\][^\n]*?·\s*(\d+)\s*$/)
    if (m) out.set(m[1], Number(m[2]))
  }
  return out
}

const two = (n: number) => String(n).padStart(2, '0')

function build(root: string): Book {
  const pages = pagesFromToc(root)
  const part = (e: (typeof EXTRA)[number]): BookPart => ({
    href: textHref(e.title),
    title: e.title,
    kind: e.kind,
    file: e.file,
    page: pages.get(e.file),
  })

  return {
    id: 'rome30',
    title: '30포인트로 읽어내는 로마 제국 쇠망사',
    original: 'The History of the Decline and Fall of the Roman Empire',
    by: [
      { role: '지음', name: '에드워드 기번' },
      { role: '편역', name: '가나모리 시게나리' },
      { role: '옮김', name: '한은미' },
    ],
    publisher: '북프렌즈',
    blurb: '기번의 여섯 권을 서른 개의 물음으로 줄인 편역본입니다.',
    about:
      '에드워드 기번이 스무 해에 걸쳐 쓴 여섯 권을 서른 개의 물음으로 줄인 책입니다. ' +
      '포인트 제목이 물음이고 그 아래가 답입니다. 우리가 함께 읽는 것은 이 편역본이고, ' +
      '기번의 영문 원전 일흔한 장은 따로 갖고 있습니다.',
    parts: [
      ...EXTRA.filter((e) => e.kind === 'front').map(part),
      ...pointList(root).map(
        (p): BookPart => ({
          href: `/read/point/${p.n}`,
          title: p.title,
          kind: 'point',
          n: p.n,
          page: pages.get(`${two(p.n)}_${p.title.replace(/ /g, '_')}`),
        }),
      ),
      ...EXTRA.filter((e) => e.kind === 'back').map(part),
    ],
  }
}

// 빌드 한 번에 700장 넘게 그린다. 장마다 차례를 다시 읽을 이유가 없다
let cached: Book | undefined

export function book(root = REPO_ROOT): Book {
  return root === REPO_ROOT ? (cached ??= build(root)) : build(root)
}

export const bookHref = (b: Book = book()) => `/read/${b.id}`

/** 주소로 앞뒤 글 한 편을 되찾는다. 없으면 `undefined` — 라우트가 404를 낸다 */
export function textPart(slug: string, root = REPO_ROOT): BookPart | undefined {
  return book(root).parts.find((p) => p.file && textSlug(p.title) === decodeURIComponent(slug))
}
