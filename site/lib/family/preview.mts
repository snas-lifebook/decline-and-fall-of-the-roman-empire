/**
 * 눈으로 보기 위한 스크래치 스크립트. 빌드에 안 들어간다.
 *   npx tsx lib/family/preview.mts   또는   node --experimental-strip-types
 *
 * 실제 온톨로지에서 가문 조각을 뽑아 SVG로 굽는다. T1.4가 답해야 하는 것 —
 * 세대가 행으로 서나, 한글 라벨이 박스를 안 넘나, 동명이인이 갈리나.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { loadEntities, loadLinks } from '../ontology'
import { layoutFamily, type FamilyLink, type FamilyPerson } from './layout'
import { renderFamilySvg } from './svg'

const LAYOUT_RELS = new Set(['child_of', 'married', 'succeeded'])

const entities = loadEntities()
const links = loadLinks()
const nameOf = new Map(entities.map((e) => [e.id, e.name]))

const famLinks: FamilyLink[] = links
  .filter((l) => LAYOUT_RELS.has(l.rel))
  .map((l) => ({ from: l.from, rel: l.rel as FamilyLink['rel'], to: l.to }))

// 연결 요소로 가문을 자른다. 데이터가 원래 조각나 있다 — 22개, 최대 27명.
const adj = new Map<string, Set<string>>()
const touch = (a: string, b: string) => {
  if (!adj.has(a)) adj.set(a, new Set())
  adj.get(a)!.add(b)
}
for (const l of famLinks) {
  touch(l.from, l.to)
  touch(l.to, l.from)
}

const seen = new Set<string>()
const groups: string[][] = []
for (const start of adj.keys()) {
  if (seen.has(start)) continue
  const comp: string[] = []
  const stack = [start]
  while (stack.length) {
    const u = stack.pop()!
    if (seen.has(u)) continue
    seen.add(u)
    comp.push(u)
    for (const v of adj.get(u) ?? []) if (!seen.has(v)) stack.push(v)
  }
  groups.push(comp)
}
groups.sort((a, b) => b.length - a.length)

mkdirSync('out-preview', { recursive: true })

const report: string[] = []
for (const [i, ids] of groups.slice(0, 3).entries()) {
  const set = new Set(ids)
  const people: FamilyPerson[] = ids
    .filter((id) => id.startsWith('person:'))
    .map((id) => ({ id, label: nameOf.get(id) ?? id.split(':')[1] }))
  const sub = famLinks.filter((l) => set.has(l.from) && set.has(l.to))
  const layout = layoutFamily(people, sub)
  const svg = renderFamilySvg(layout)
  const file = `out-preview/family-${i}.svg`
  writeFileSync(file, svg)

  const rows = new Set(layout.nodes.filter((n) => n.kind === 'person').map((n) => n.y))
  const succ = layout.edges.filter((e) => e.kind === 'succession').length
  report.push(
    `${file}  인물 ${people.length}  세대행 ${rows.size}  혼인 ${layout.nodes.filter((n) => n.kind === 'union').length}  계승 ${succ}  캔버스 ${Math.round(layout.width)}x${Math.round(layout.height)}`,
  )
}

process.stdout.write(report.join('\n') + '\n')
