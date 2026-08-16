import { loadEntities, loadLinks, type Link } from '../ontology'
import { entitySlug } from '../entity'
import type { FamilyPerson, FamilyLink, FamilyRel } from './layout'

/**
 * 관계에서 가문을 추려낸다.
 *
 * **헌장 0-1이 이 도구의 존재 이유로 지목한 화면이다** — "사람들이 실제로 헷갈려
 * 하는 지점 … 딱 거기까지다. 특히 가계도다."
 *
 * 가문의 경계는 **혈연과 혼인**이다. 제위 계승(`succeeded`)으로는 가문을 잇지
 * 않는다 — 양자와 찬탈이 섞여 있어서 그것으로 묶으면 남남이 한 가문이 된다.
 * 다만 가문 **안에서** 일어난 계승은 그린다(다른 축이라 굵은 선으로 갈린다).
 *
 * 셋 미만은 가문으로 안 친다. 둘은 그림이 아니라 한 줄이다.
 */

export type Family = {
  slug: string
  title: string
  people: FamilyPerson[]
  links: FamilyLink[]
}

/** 혈연·혼인만 가문을 잇는다 */
const BINDING: FamilyRel[] = ['child_of', 'married']
const DRAWN: FamilyRel[] = ['child_of', 'married', 'succeeded']

const isRel = (l: Link, of: FamilyRel[]): boolean => (of as string[]).includes(l.rel)

function build(): Family[] {
  const entities = loadEntities()
  const byId = new Map(entities.map((e) => [e.id, e]))
  const links = loadLinks()

  const adj = new Map<string, Set<string>>()
  const touch = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set())
    adj.get(a)!.add(b)
  }
  for (const l of links) {
    if (!isRel(l, BINDING)) continue
    touch(l.from, l.to)
    touch(l.to, l.from)
  }

  // 연결요소 = 한 가문
  const seen = new Set<string>()
  const groups: string[][] = []
  for (const start of adj.keys()) {
    if (seen.has(start)) continue
    const stack = [start]
    const comp: string[] = []
    while (stack.length) {
      const id = stack.pop()!
      if (seen.has(id)) continue
      seen.add(id)
      comp.push(id)
      for (const n of adj.get(id) ?? []) if (!seen.has(n)) stack.push(n)
    }
    if (comp.length >= 3) groups.push(comp)
  }

  const out = groups.map((ids) => {
    const set = new Set(ids)
    const people: FamilyPerson[] = ids.flatMap((id) => {
      const e = byId.get(id)
      return e ? [{ id, label: e.name, note: e.attrs?.role ? String(e.attrs.role) : undefined }] : []
    })
    // 그릴 선은 계승까지. 가문을 **잇는** 것과 가문 안에서 **그리는** 것이 다르다
    const fam: FamilyLink[] = links
      .filter((l) => isRel(l, DRAWN) && set.has(l.from) && set.has(l.to))
      .map((l) => ({ from: l.from, rel: l.rel as FamilyRel, to: l.to }))

    // 가문 이름은 그 안에서 선이 가장 많이 걸린 사람이다. 「카이사르 가문」
    const degree = new Map<string, number>()
    for (const l of fam) {
      degree.set(l.from, (degree.get(l.from) ?? 0) + 1)
      degree.set(l.to, (degree.get(l.to) ?? 0) + 1)
    }
    const head =
      [...people].sort(
        (a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.label.localeCompare(b.label),
      )[0] ?? people[0]

    return {
      slug: entitySlug(head.label),
      title: `${head.label} 가문`,
      people,
      links: fam,
    }
  })

  // 큰 것부터. 같으면 이름순 — 빌드마다 순서가 흔들리면 diff가 지저분해진다
  out.sort((a, b) => b.people.length - a.people.length || a.title.localeCompare(b.title))
  return out
}

let cached: Family[] | undefined

export function families(): Family[] {
  return (cached ??= build())
}

export function familyBySlug(slug: string): Family | undefined {
  return families().find((f) => f.slug === slug)
}

/** 이 사람이 속한 가문. 객체 화면에서 「가계도 보기」를 띄울지 정한다 */
export function familyOf(entityId: string): Family | undefined {
  return families().find((f) => f.people.some((p) => p.id === entityId))
}
