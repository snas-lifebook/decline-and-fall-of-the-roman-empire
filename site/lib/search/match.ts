/**
 * 이름으로 찾기 (T3.4).
 *
 * 객체가 644장인데 지금까지 찾을 길이 사이드바 목록뿐이었다. 「하스드루발이
 * 어디 나오더라」에 답이 안 됐다.
 *
 * **초성 검색이 이 기능의 핵심이다.** [[RESEARCH]] R-C가 Pagefind를 뺀 이유가
 * 그것이었다 — 한국어 스테머가 없어 `이사르`로 `카이사르`를 못 찾고, 알파벳
 * 버킷팅 탓에 한글 인덱스가 441KB 단일 청크로 통째로 내려온다.
 *
 * **`es-hangul`도 안 넣는다 (2026-08-16, R-C에서 바꾼 것).** R-C는 그 패키지를
 * 골랐지만, 실제로 필요한 것은 **초성 추출과 부분 일치 둘뿐**이고 초성 추출은
 * 유니코드 산술 한 줄이다(`(코드 - 0xAC00) / 588`). 헌장 「라이브러리를
 * 추가하는 규칙」 1·2가 이 경우를 정확히 가리킨다 — 몇 줄로 되는 것에 의존성을
 * 새로 들이지 않는다. 자모 부분 일치(`카ㅇ`)까지 필요해지면 그때 다시 본다.
 *
 * 색인은 빌드 때 구워 `/search-index.json`으로 내보낸다. 화면마다 들고 다니면
 * 739장 전부에 붙으므로, **팔레트를 처음 열 때 한 번 받는다.**
 *
 * **이 파일에 `fs`를 끌고 오는 import를 넣지 마라.** 클라이언트 컴포넌트가
 * 여기서 가져다 쓴다 — 색인을 굽는 쪽(`./build`)과 같은 파일에 뒀다가
 * `node:fs`가 브라우저 번들에 딸려 들어가 빌드가 통째로 섰다(2026-08-16).
 * `lib/text/width.ts`를 뗀 것과 같은 이유다.
 */

export type SearchKind = 'object' | 'point' | 'doc'

export type SearchItem = {
  id: string
  name: string
  /** 화면에 뜨는 갈래 — 「인물」 「포인트」 「안내」 */
  group: string
  kind: SearchKind
  href: string
  alias: string[]
  /** 미리 구운 초성. 브라우저에서 644번 다시 계산하지 않는다 */
  cho: string
}

const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const

/** 한글 음절에서 첫소리만. 한글이 아닌 글자는 그대로 둔다 */
export function choseong(s: string): string {
  return [...s]
    .map((c) => {
      const i = c.charCodeAt(0) - 0xac00
      return i >= 0 && i < 11172 ? CHO[Math.floor(i / 588)] : c
    })
    .join('')
}

/** 초성만 친 질의인가. 한 글자는 안 친다 — 결과가 수백 개라 쓸모가 없다 */
export function isChoseongQuery(q: string): boolean {
  return q.length >= 2 && [...q].every((c) => (CHO as readonly string[]).includes(c))
}

/** 한 번에 이만큼만 준다. 팔레트가 스크롤 통이 되면 고르는 게 더 느리다 */
const LIMIT = 30

export function searchItems(index: SearchItem[], query: string): SearchItem[] {
  const q = query.trim()
  if (!q) return []

  const cho = isChoseongQuery(q)
  const needle = cho ? q : q.toLowerCase()

  const hits: { item: SearchItem; rank: number }[] = []
  for (const item of index) {
    const fields = cho ? [item.cho] : [item.name.toLowerCase(), ...item.alias.map((a) => a.toLowerCase())]
    let rank = -1
    for (const f of fields) {
      const at = f.indexOf(needle)
      if (at < 0) continue
      // 앞에서 맞으면 앞으로. 별칭 일치는 이름 일치보다 뒤
      const r = (at === 0 ? 0 : 1) + (f === fields[0] ? 0 : 2)
      rank = rank < 0 ? r : Math.min(rank, r)
    }
    if (rank >= 0) hits.push({ item, rank })
  }

  // 같은 순위면 짧은 이름이 먼저(더 정확한 일치), 그래도 같으면 이름순 — 결과가 흔들리면 안 된다
  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.item.name.length - b.item.name.length ||
      a.item.name.localeCompare(b.item.name),
  )
  return hits.slice(0, LIMIT).map((h) => h.item)
}
