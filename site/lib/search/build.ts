import { loadEntities } from '../ontology'
import { pointList } from '../points'
import { entityHref } from '../entity'
import { navFlat, navLabel } from '../nav'
import { TYPE_KO } from '../export/table'
import { choseong, type SearchItem } from './match'

/**
 * 검색 색인을 굽는다. **빌드 전용 — `fs`를 읽으므로 클라이언트가 부르면 안 된다.**
 * 맞히는 규칙은 `./match`에 있고 그쪽만 브라우저로 간다.
 */

const pad = (n: number) => String(n).padStart(2, '0')

export function buildSearchIndex(): SearchItem[] {
  const objects: SearchItem[] = loadEntities().map((e) => ({
    id: e.id,
    name: e.name,
    group: TYPE_KO[e.type] ?? e.type,
    kind: 'object',
    href: entityHref({ id: e.id, type: e.type, name: e.name }),
    alias: e.aliases,
    cho: choseong(e.name),
  }))

  const points: SearchItem[] = pointList().map((p) => ({
    id: `point:${p.n}`,
    name: `${pad(p.n)} ${p.title}`,
    group: '포인트',
    kind: 'point',
    href: `/read/point/${p.n}`,
    alias: [],
    cho: choseong(`${pad(p.n)} ${p.title}`),
  }))

  // 안내 문서도 같이 찾힌다 — 사람이 「설치」를 칠 수도 있다
  const docs: SearchItem[] = navFlat().map((n) => ({
    id: `doc:${n.href}`,
    name: n.title,
    group: '안내',
    kind: 'doc',
    href: n.href,
    alias: [],
    cho: choseong(n.title),
  }))

  // 트리 밖 문서(About·FAQ·Update)도 색인한다 — navFlat은 navTree만 훑어 이 셋을
  // 빠뜨렸다. 「About이 묻혔다」의 절반이 이것 — 푸터에만 있는 게 아니라 검색에도 안
  // 잡혔다(감사 2026-08-20). 영문 별칭도 걸어 `about`·`faq`로도 찾히게 한다.
  const offTree: SearchItem[] = [
    { href: '/about', alias: ['About', '소개'] },
    { href: '/faq', alias: ['FAQ', '자주 묻는 질문'] },
    { href: '/changelog', alias: ['Update', '업데이트', '바뀐 것'] },
  ].map(({ href, alias }) => ({
    id: `doc:${href}`,
    name: navLabel(href),
    group: '안내',
    kind: 'doc',
    href,
    alias,
    cho: choseong(navLabel(href)),
  }))

  return [...objects, ...points, ...docs, ...offTree]
}
