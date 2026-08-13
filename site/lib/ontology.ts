/**
 * 온톨로지 데이터 계약.
 *
 * 이 파일이 유일한 스키마 정본이다. 빌드 게이트(`scripts/validate.ts`)와
 * 테스트(`ontology.test.ts`)가 **같은 것을 import** 한다. 둘이 갈라지면
 * 로컬에서 통과한 게 배포에서 깨진다.
 *
 * 데이터 자체의 규칙은 레포 루트 `AGENTS.md` 「불변식 여섯」이 정본이고
 * 여기는 그것을 코드로 옮긴 것이다. 규칙이 바뀌면 AGENTS.md를 먼저 고친다.
 */
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** 레포 루트. site/ 기준 한 단계 위. */
export const REPO_ROOT = join(process.cwd(), '..')

export const ENTITY_TYPES = [
  'person', 'place', 'event', 'group', 'institution', 'work', 'period',
] as const

/**
 * rel 16종. 2026-08-13에 11 → 16으로 늘었다.
 *
 * child_of는 이름과 반대로 읽는다 — `X --child_of--> Y`는 "X의 자식이 Y"다.
 * 노트 생성기가 그 관례를 따른다. 방향을 "고치지" 마라. (AGENTS.md 함정)
 */
export const RELS = [
  'child_of', 'succeeded', 'allied_with', 'opposed', 'participated_in',
  'occurred_at', 'ruled', 'member_of', 'married', 'conquered', 'created',
  // 2026-08-13 신설
  'located_in', 'protected', 'held_office', 'decided', 'applied_to',
] as const

export const YEAR_BASIS = ['chronology', 'text', 'inferred'] as const

export const EntitySchema = z.object({
  id: z.string().regex(/^[a-z]+:.+/, 'id는 `<타입>:<이름>` 형식이다'),
  name: z.string().min(1),
  type: z.enum(ENTITY_TYPES),
  aliases: z.array(z.string()),
  /**
   * attrs는 자유 필드다. 실측: 문자열 839 · 정수 21 · 실수 8(좌표) · 배열 8.
   * `year`가 어떤 객체엔 정수(622), 어떤 객체엔 문자열("-260")로 들어 있다 —
   * 기존 변이라 여기서 강제하지 않고 넓게 받는다. 좁히려면 데이터를 먼저 고른다.
   */
  attrs: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])),
  points: z.array(z.number().int()),
  // 22개 엔티터가 대표 설명 없이 포인트별 서술만 갖는다. 기존 변이라 선택으로 둔다.
  desc: z.string().optional(),
  descs: z.array(z.object({ point: z.number().int(), desc: z.string() })),
  note: z.string().min(1),
})

export const LinkSchema = z.object({
  from: z.string(),
  to: z.string(),
  rel: z.enum(RELS),
  point: z.number().int(),
  // 311건은 연도 키 자체가 없다. null이 아니라 부재다.
  from_year: z.number().int().nullable().optional(),
  to_year: z.number().int().nullable().optional(),
  year_basis: z.enum(YEAR_BASIS).nullable().optional(),
})

export type Entity = z.infer<typeof EntitySchema>
export type Link = z.infer<typeof LinkSchema>

function readJsonl(path: string): unknown[] {
  return readFileSync(path, 'utf-8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l, i) => {
      try {
        return JSON.parse(l)
      } catch {
        throw new Error(`${path}:${i + 1} JSON 파싱 실패`)
      }
    })
}

export function loadEntities(root = REPO_ROOT): Entity[] {
  return readJsonl(join(root, 'ontology/entities.jsonl')).map((r, i) => {
    const p = EntitySchema.safeParse(r)
    if (!p.success) throw new Error(`entities.jsonl:${i + 1} ${p.error.message}`)
    return p.data
  })
}

export function loadLinks(root = REPO_ROOT): Link[] {
  return readJsonl(join(root, 'ontology/links.jsonl')).map((r, i) => {
    const p = LinkSchema.safeParse(r)
    if (!p.success) throw new Error(`links.jsonl:${i + 1} ${p.error.message}`)
    return p.data
  })
}

export const linkKey = (l: Link) => `${l.from}|${l.rel}|${l.to}|${l.point}`

export type Violation = { rule: string; key: string; detail: string }

/**
 * 불변식 검사. AGENTS.md 「불변식 여섯」 + 연도 역전.
 *
 * 불변식 1(객체 하나에 노트 하나)은 파일시스템을 읽어야 해서 여기 없다 —
 * 테스트 쪽에서 따로 본다.
 */
export function checkInvariants(entities: Entity[], links: Link[]): Violation[] {
  const byId = new Map(entities.map((e) => [e.id, e]))
  const v: Violation[] = []
  const push = (rule: string, l: Link, detail: string) =>
    v.push({ rule, key: linkKey(l), detail })

  for (const l of links) {
    // 6. 끊어진 링크 0
    if (!byId.has(l.from)) push('dangling', l, `from ${l.from} 없음`)
    if (!byId.has(l.to)) push('dangling', l, `to ${l.to} 없음`)

    const from = byId.get(l.from)
    const to = byId.get(l.to)

    // 4. occurred_at의 주어는 event
    if (l.rel === 'occurred_at' && from && from.type !== 'event')
      push('occurred_at-subject', l, `from이 ${from.type}`)

    // 5. participated_in은 인물·집단 → 사건
    if (l.rel === 'participated_in') {
      if (from && from.type !== 'person' && from.type !== 'group')
        push('participated_in-subject', l, `from이 ${from.type}`)
      if (to && to.type !== 'event')
        push('participated_in-object', l, `to가 ${to.type}`)
    }

    // located_in은 인물·집단·장소 → 장소
    if (l.rel === 'located_in') {
      if (from && !['person', 'group', 'place'].includes(from.type))
        push('located_in-subject', l, `from이 ${from.type}`)
      if (to && to.type !== 'place') push('located_in-object', l, `to가 ${to.type}`)
    }

    // 연도 역전. 불변식에는 없지만 2026-08-12에 실제로 2건 나왔다.
    if (l.from_year != null && l.to_year != null && l.from_year > l.to_year)
      push('year-order', l, `${l.from_year} > ${l.to_year}`)
  }
  return v
}
