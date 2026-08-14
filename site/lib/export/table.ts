import type { Entity, Link } from '../ontology'

/**
 * 한 포인트의 객체를 시트에 붙일 표로 편다.
 *
 * **관계를 따로 주지 않고 한 칸에 펴 넣는다.** 두 파일로 주면 시트에서
 * 조인해야 하고, 관계 표는 id로만 이어져 있어 사람이 못 읽는다.
 */

export const EXPORT_HEADER = [
  '이름',
  '종류',
  '이 포인트에서',
  '별칭',
  '관계',
  '등장 포인트',
] as const

const TYPE_KO: Record<string, string> = {
  person: '인물',
  place: '지명',
  group: '집단',
  event: '사건',
  institution: '제도',
  work: '저작',
  period: '시대',
}

/**
 * rel의 화면 라벨. DESIGN의 관계 라벨 사전을 승계한다 — 원시 rel 값을
 * 화면에 그대로 쓰지 않는다.
 *
 * `child_of`만 방향에 따라 갈린다. `X --child_of--> Y`는 "X는 Y의 자식"이므로
 * X 쪽에서 보면 Y가 부모고, Y 쪽에서 보면 X가 자녀다.
 */
const REL_KO: Record<string, { out: string; in: string }> = {
  child_of: { out: '부모', in: '자녀' },
  married: { out: '혼인', in: '혼인' },
  succeeded: { out: '계승', in: '피계승' },
  opposed: { out: '대립', in: '대립' },
  allied_with: { out: '동맹', in: '동맹' },
  member_of: { out: '소속', in: '구성원' },
  ruled: { out: '통치', in: '피통치' },
  conquered: { out: '정복', in: '피정복' },
  created: { out: '창설', in: '창설됨' },
  located_in: { out: '위치', in: '소재' },
  protected: { out: '보호', in: '피보호' },
  held_office: { out: '관직', in: '재직자' },
  decided: { out: '결정', in: '결정됨' },
  occurred_at: { out: '발생지', in: '발생' },
  participated_in: { out: '참여', in: '참여자' },
  applied_to: { out: '적용', in: '적용됨' },
}

const descFor = (e: Entity, point: number) =>
  e.descs.find((d) => d.point === point)?.desc ?? e.desc ?? ''

export function pointTable(point: number, entities: Entity[], links: Link[]): string[][] {
  // 순서는 entities 배열 그대로 — 책에 나온 순서를 나른다. 가나다순으로 안 바꾼다.
  const inPoint = entities.filter((e) => e.points.includes(point))
  const name = new Map(inPoint.map((e) => [e.id, e.name]))

  const live = links.filter(
    (l) => l.point === point && name.has(l.from) && name.has(l.to),
  )

  const relationCell = (id: string) =>
    live
      .flatMap((l) => {
        const ko = REL_KO[l.rel]
        if (!ko) return []
        if (l.from === id) return [`${ko.out}: ${name.get(l.to)}`]
        if (l.to === id) return [`${ko.in}: ${name.get(l.from)}`]
        return []
      })
      .join(' / ')

  return inPoint.map((e) => [
    e.name,
    TYPE_KO[e.type] ?? e.type,
    descFor(e, point),
    e.aliases.join(', '),
    relationCell(e.id),
    e.points.join(', '),
  ])
}
