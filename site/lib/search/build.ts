import { loadEntities } from '../ontology'
import { pointList } from '../points'
import { entityHref } from '../entity'
import { navFlat } from '../nav'
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

  return [...objects, ...points, ...docs]
}
