import { openSync, readSync, closeSync, readdirSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from './ontology'
import { pointList } from './points'

/**
 * 읽기를 **책 단위로** 묶는다. 지금 두 권이다.
 *
 * 앞 판의 `/read`는 30개가 평평하게 늘어선 목록이었다. 그게 왜 문제인가 —
 * **이 30개는 흩어진 글이 아니라 한 권의 차례다.** 목록으로 두면 「어디까지 왔나」도
 * 「이게 뭔가」도 화면이 답하지 않고, 무엇보다 **일러두기·책머리에·옮기고 나서가
 * 갈 곳이 없었다**(River 지적). 그릇을 만들자 셋이 저절로 제자리를 찾았다.
 *
 * 그릇을 만든 값이 바로 돌아왔다 — **기번 원전을 두 번째 권으로 그냥 얹는다.**
 * `source/`에 72편이 이미 있었고, 없던 것은 그것을 책으로 볼 자리뿐이었다.
 *
 * ## 두 권은 성격이 다르고, 그 차이를 숨기지 않는다
 *
 * |          | 30포인트 편역본 | 기번 원전 |
 * |----------|---------------|----------|
 * | 편수     | 33            | 72       |
 * | 전체     | 23만 자        | **967만 자**(41배) |
 * | 한 편    | 6,800자        | **126,000자**(19배) |
 * | 언어     | 한국어         | 영어      |
 * | 딸린 것  | 카드·지도·관계망 | 없음     |
 *
 * 원전에 카드와 지도가 없는 것은 안 만들어서가 아니라 **붙일 데가 없어서**다 —
 * 온톨로지의 서술과 관계는 전부 **포인트 번호**에 묶여 있고 장 번호에는 안 묶여
 * 있다. 없는 연결을 지어내면 그때부터 화면이 거짓말을 한다.
 *
 * ## 쪽수는 지어내지 않고 차례에서 읽는다
 *
 * `points/00_목차.md`가 **종이책 쪽수를 이미 갖고 있다** — 그 파일이 「책을 펴 놓고
 * 같은 자리를 찾을 수 있다」고 스스로 밝힌 이유다. 화면에 손으로 옮겨 적으면 반드시
 * 어긋나므로 그 줄을 파싱한다.
 */

export type PartKind = 'front' | 'point' | 'back' | 'chapter'

export type BookPart = {
  href: string
  title: string
  kind: PartKind
  /** 본문 30포인트 / 원전 71장일 때의 번호. 서문·앞뒤 글에는 없다 */
  n?: number
  /** 종이책 쪽수. 편역본 차례에 적힌 것만 */
  page?: number
  /** 레포 안 파일명(확장자 없이). 앞뒤 글과 원전을 열 때 이걸로 연다 */
  file?: string
}

export type Book = {
  id: string
  title: string
  /**
   * 사이드바·빵부스러기에 쓰는 짧은 이름.
   *
   * 원전 제목은 「The History of the Decline and Fall of the Roman Empire」라 길 목록에
   * 그대로 넣으면 한 줄이 다 그것이다. 사람이 실제로 부르는 이름을 따로 둔다.
   */
  short: string
  /** 기번의 원저. 편역본이 무엇을 줄인 것인지 */
  original?: string
  by: { role: string; name: string }[]
  publisher: string
  /** 표지 이미지. `public/` 아래 경로. 없으면 화면이 글자로 표지를 짠다 */
  cover?: string
  /** 책장에서 한 줄. 이게 무슨 책인지 */
  blurb: string
  /** 책 화면 첫 문단 */
  about: string
  /** 영어 책이면 화면이 그렇게 밝힌다 */
  lang?: 'en'
  parts: BookPart[]
}

/** 편역본 앞뒤 글 세 편. 파일명과 화면에 낼 이름이 다르다(`_`가 공백이다) */
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
 * 그래서 한 정규식으로 받는다. 못 찾으면 그냥 없는 것으로 둔다.
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

/**
 * 파일 **머리만** 읽는다.
 *
 * 원전 72편이 합쳐 967만 자다. 차례 한 줄을 만들자고 그걸 다 읽으면 빌드가 장마다
 * 9.7MB를 훑는다 — 제목은 앞 400바이트 안에 있으므로 거기까지만 연다.
 */
function head(path: string, bytes = 400): string {
  const fd = openSync(path, 'r')
  try {
    const buf = Buffer.alloc(bytes)
    const read = readSync(fd, buf, 0, bytes, 0)
    return buf.subarray(0, read).toString('utf8')
  } finally {
    closeSync(fd)
  }
}

/**
 * 원전 장 제목.
 *
 * 원문 H1은 `# Chapter XV: Progress Of The Christian Religion.—Part I.` 꼴이다.
 * 「Chapter XV:」는 번호가 이미 말하고 「—Part I.」은 **그 장의 첫 부라는 뜻일 뿐**이라
 * (한 파일에 부가 여섯까지 들어 있다) 둘 다 뗀다. 남는 것이 사람이 부르는 이름이다.
 *
 * **손으로 옮겨 적지 않는다.** 71줄을 베껴 두면 원문이 바뀌는 날 조용히 어긋난다.
 */
function chapterTitle(raw: string): string {
  const h1 = raw.match(/^# (.+)$/m)?.[1] ?? ''
  return h1
    .replace(/^Chapter\s+[IVXLC]+\s*:\s*/i, '')
    .replace(/\s*[—-]\s*Part\s+[IVXLC]+\.?\s*$/i, '')
    .replace(/\.$/, '')
    .trim()
}

function rome30(root: string): Book {
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
    short: '30포인트 편역본',
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
      '포인트 제목이 물음이고 그 아래가 답입니다. 우리가 함께 읽는 것이 이 편역본이고, ' +
      '기번의 영문 원전 일흔한 장은 두 번째 권으로 같이 두었습니다.',
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

function gibbon(root: string): Book {
  const dir = join(root, 'source')
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()

  const parts = files.map((f): BookPart => {
    const file = f.replace(/\.md$/, '')
    const n = Number(file.slice(0, 2))
    // 00은 서문이다. 장 번호를 붙이면 일흔두 장짜리 책이 된다
    const isPreface = n === 0
    return {
      href: `/read/source/${isPreface ? 0 : n}`,
      title: isPreface ? '서문' : chapterTitle(head(join(dir, f))) || `Chapter ${n}`,
      kind: isPreface ? 'front' : 'chapter',
      ...(isPreface ? {} : { n }),
      file,
    }
  })

  return {
    id: 'gibbon',
    title: 'The History of the Decline and Fall of the Roman Empire',
    short: '기번 원전',
    by: [
      { role: '지음', name: 'Edward Gibbon' },
      { role: '주석', name: 'H. H. Milman' },
    ],
    publisher: 'Project Gutenberg #25717',
    blurb: '기번이 쓴 원문 그대로입니다. 영어이고, 편역본의 마흔한 배입니다.',
    about:
      '1776년부터 1788년까지 여섯 권으로 나온 기번의 원전입니다. 편역본이 줄인 것이 ' +
      '이것이고, 「원문은 뭐라고 썼나」가 필요할 때 여기서 확인합니다. 밀먼 주석이 함께 ' +
      '들어 있는 프로젝트 구텐베르크 판이며, 저작권이 풀린 글이라 그대로 싣습니다.',
    lang: 'en',
    parts,
  }
}

// 빌드 한 번에 800장 넘게 그린다. 장마다 차례를 다시 읽을 이유가 없다
let cached: Book[] | undefined

export function books(root = REPO_ROOT): Book[] {
  if (root !== REPO_ROOT) return [rome30(root), gibbon(root)]
  return (cached ??= [rome30(root), gibbon(root)])
}

/** 편역본. 이름 없이 「그 책」이라고 하면 이것이다 */
export const book = (root = REPO_ROOT): Book => books(root)[0]

export const bookById = (id: string, root = REPO_ROOT): Book | undefined =>
  books(root).find((b) => b.id === id)

export const bookHref = (b: Book = book()) => `/read/${b.id}`

/** 주소로 앞뒤 글 한 편을 되찾는다. 없으면 `undefined` — 라우트가 404를 낸다 */
export function textPart(slug: string, root = REPO_ROOT): BookPart | undefined {
  return book(root).parts.find((p) => p.file && textSlug(p.title) === decodeURIComponent(slug))
}

/** 원전 한 장. `0`이 서문이다 */
export const sourcePart = (n: number, root = REPO_ROOT): BookPart | undefined =>
  bookById('gibbon', root)?.parts.find((p) => p.href === `/read/source/${n}`)
