import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT, ENTITY_TYPES, loadEntities, type Entity, type Link } from './ontology'
import { REL_KO } from './export/table'

/**
 * 객체 조회 — 본문의 `[[X]]`가 무엇을 가리키고, 그것이 무엇과 이어져 있나.
 *
 * **사전의 열쇠는 노트 파일명이다.** 실측(2026-08-14): 본문 위키링크 2,918개 중
 * 객체 후보 2,656개가 `entities/<타입>/<파일명>.md`와 **619/619 충돌 없이 일대일**로
 * 붙는다. 미아 0건. 그래서 별칭 매칭도, 타입 접두 파싱도 필요 없다.
 *
 * 동명이인은 저자가 본문에 이미 `[[그리스 (집단)]]`처럼 갈라 써놨다. 우리가 풀 문제가
 * 아니라 이미 풀려 있는 문제다.
 */

export type EntityRef = { id: string; type: Entity['type']; name: string }

/**
 * 주소에 쓸 이름.
 *
 * 이름 644개 중 **203개에 공백이나 괄호가 들어 있다**(`갈리아 정복`,
 * `아그리피나(클라우디우스의 아내)`). 괄호를 그대로 두면 마크다운 링크가 첫 `)`에서
 * 끊기고, 퍼센트 인코딩을 하면 한글 주소가 통째로 읽을 수 없게 된다.
 *
 * 괄호를 지우고 공백을 밑줄로 바꾼다. **타입 안에서 충돌 0건**(실측 2026-08-16).
 */
export function entitySlug(name: string): string {
  return name.replace(/[()]/g, '').trim().replace(/\s+/g, '_')
}

/** `/objects/person/카이사르` · `/objects/event/갈리아_정복` */
export function entityHref(ref: EntityRef): string {
  return `/objects/${ref.type}/${entitySlug(ref.name)}`
}

/**
 * 객체 상세의 앞뒤 — 같은 타입 목록에서 가나다순 ±1.
 *
 * 객체 상세 644장은 `navTree`에 없어 `navSteps`가 못 푼다(감사 2026-08-20). 목록
 * 화면(`app/objects/[type]`)이 쓰는 것과 같은 `localeCompare('ko')`로 이웃을 정한다.
 */
export function entitySteps(
  e: Entity,
  root = REPO_ROOT,
): { prev?: { href: string; title: string }; next?: { href: string; title: string } } {
  const sib = loadEntities(root)
    .filter((x) => x.type === e.type)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const i = sib.findIndex((x) => x.id === e.id)
  const step = (x?: Entity) =>
    x ? { href: entityHref({ id: x.id, type: x.type, name: x.name }), title: x.name } : undefined
  return { prev: step(sib[i - 1]), next: step(sib[i + 1]) }
}

/** 주소에서 객체로 되돌아온다. `app/objects/[type]/[slug]`가 쓴다 */
export function entityBySlug(type: string, slug: string, root = REPO_ROOT): Entity | undefined {
  return loadEntities(root).find((e) => e.type === type && entitySlug(e.name) === slug)
}

function build(root: string): Map<string, EntityRef> {
  const entities = loadEntities(root)
  const out = new Map<string, EntityRef>()
  const missed: string[] = []

  for (const type of ENTITY_TYPES) {
    const sameType = entities.filter((e) => e.type === type)
    let files: string[]
    try {
      files = readdirSync(join(root, 'entities', type))
    } catch {
      continue
    }
    for (const f of files) {
      if (!f.endsWith('.md')) continue
      const key = f.slice(0, -3)
      // 정확 일치가 먼저다. `그리스 (집단)`처럼 뒤에 타입이 붙은 것만 접두로 잡는다
      const hit =
        sameType.find((e) => e.name === key) ?? sameType.find((e) => key.startsWith(`${e.name} (`))
      if (hit) out.set(key, { id: hit.id, type: hit.type, name: hit.name })
      else missed.push(`${type}/${f}`)
    }
  }

  // 조용히 넘기면 그 이름이 본문에서 평문으로 죽는다. 늘어나면 즉시 보여야 한다
  if (missed.length) throw new Error(`객체를 못 찾은 노트 ${missed.length}개: ${missed.join(', ')}`)
  return out
}

let cached: Map<string, EntityRef> | undefined

export function entityIndex(root = REPO_ROOT): Map<string, EntityRef> {
  if (root !== REPO_ROOT) return build(root)
  return (cached ??= build(root))
}

/** 같은 사전에서 나온 id 조회표. 빌드 한 번에 700장 넘게 그려서 매번 다시 만들지 않는다 */
const byId = new WeakMap<Map<string, EntityRef>, Map<string, EntityRef>>()

/**
 * **`entityIndex()`의 열쇠는 노트 파일명이지 `person:카이사르` 같은 id가 아니다.**
 * 링크는 id로 말하므로 id로 찾으려면 반드시 이걸 거쳐야 한다. `timeline/build.ts`가
 * 이 사실을 모르고 `index.get(l.to)`를 부르는 바람에 연표가 644장 전부 안 그려졌다
 * (2026-08-17, 테스트가 잡았다).
 */
export function idMap(index: Map<string, EntityRef>): Map<string, EntityRef> {
  let m = byId.get(index)
  if (!m) {
    m = new Map([...index.values()].map((r) => [r.id, r]))
    byId.set(index, m)
  }
  return m
}

export type Neighbor = {
  ref: EntityRef
  rel: string
  /** 화면에 나가는 한국어. 원시 rel 키는 절대 노출하지 않는다 (DESIGN P8) */
  label: string
  direction: 'out' | 'in'
  /** 「이거 어디 나온 얘기야」의 답. 관계 한 줄마다 붙는다 (RESEARCH R-E) */
  point: number
}

export function neighbors(id: string, links: Link[], index: Map<string, EntityRef>): Neighbor[] {
  const ids = idMap(index)
  const out: Neighbor[] = []
  for (const l of links) {
    const isFrom = l.from === id
    if (!isFrom && l.to !== id) continue
    const ref = ids.get(isFrom ? l.to : l.from)
    if (!ref || ref.id === id) continue
    out.push({
      ref,
      rel: l.rel,
      label: REL_KO[l.rel]?.[isFrom ? 'out' : 'in'] ?? l.rel,
      direction: isFrom ? 'out' : 'in',
      point: l.point,
    })
  }
  return out
}

export type CoOccur = { ref: EntityRef; points: number[] }

/**
 * 같은 포인트에 함께 나온 객체.
 *
 * **관계와 절대 섞지 않는다.** 이건 책이 같은 대목에서 함께 이야기했다는 사실이지
 * 둘 사이에 관계가 있다는 뜻이 아니다. 화면에서도 절과 라벨을 갈라 놓는다.
 *
 * 이게 필요한 이유: 실측상 객체 217개(33.7%)가 관계 0개고 그중 지명이 138개다.
 * 그 페이지들에 빈 상자를 보여주지 않으려면 `points` 배열만으로 되는 이 축이 있어야 한다.
 */
export function coOccurring(e: Entity, entities: Entity[], limit?: number): CoOccur[] {
  const mine = new Set(e.points)
  const out: CoOccur[] = []
  for (const other of entities) {
    if (other.id === e.id) continue
    const shared = other.points.filter((p) => mine.has(p))
    if (shared.length) out.push({ ref: { id: other.id, type: other.type, name: other.name }, points: shared })
  }
  // 많이 겹친 것부터. 같으면 이름순 — 빌드마다 순서가 흔들리면 diff가 지저분해진다
  out.sort((a, b) => b.points.length - a.points.length || a.ref.name.localeCompare(b.ref.name))
  return limit === undefined ? out : out.slice(0, limit)
}
