import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT, loadEntities, loadLinks } from './ontology'
import { entityIndex } from './entity'
import { REL_KO, TYPE_KO } from './export/table'

/**
 * 「자료가 어떻게 생겼나」를 **데이터에서 직접** 만든다.
 *
 * 문서 사이트 여섯 곳(Stripe · docs.claude.com · Prisma · Astro · OpenAI ·
 * GitHub docs)을 조사한 결과가 이 파일의 형태를 정했다.
 *
 *   - **여섯 곳 중 어디도 mermaid를 안 쓴다.** Stripe와 OpenAI는 도식이 아예 0개다
 *   - 설명 하중이 제일 큰 것은 **진짜 값이 든 레코드 한 건**이다. Stripe는
 *     도식 없이 실제 JSON(`"amount": 1099`) 하나로 객체가 무엇인지 다 전달한다.
 *     추상 스키마는 "필드가 있다"만 말하고, 실 레코드는 "값이 이렇게 생겼다"를 말한다
 *   - 그다음이 **개수가 붙은 파일트리**(Astro 방식)
 *
 * 그래서 그림을 그리는 대신 **파일을 읽는다.** 숫자도 원문도 전부 실측이고,
 * 손으로 적은 값은 하나도 없다 — 손으로 적으면 데이터가 바뀌는 순간 화면이
 * 거짓말이 된다. 테스트가 파일 첫 줄과 글자 단위로 대조한다.
 */

export type TreeNode = {
  /** 레포 안 경로. 자료를 받아서 열었을 때 그대로 보이는 이름이다 */
  path: string
  label: string
  /** 몇 개인지. **개수 없는 트리는 「폴더가 있다」만 말한다** */
  count: string
  /** 들여쓰기 단계 */
  depth: number
}

const countFiles = (dir: string, ext = '.md') => {
  try {
    return readdirSync(join(REPO_ROOT, dir)).filter((f) => f.endsWith(ext)).length
  } catch {
    return 0
  }
}

const countRecursive = (dir: string): number => {
  try {
    return readdirSync(join(REPO_ROOT, dir), { withFileTypes: true }).reduce(
      (n, e) => n + (e.isDirectory() ? countRecursive(join(dir, e.name)) : e.name.endsWith('.md') ? 1 : 0),
      0,
    )
  } catch {
    return 0
  }
}

let counts: { points: number; source: number; entities: number; links: number } | undefined

export function dataCounts() {
  return (counts ??= {
    points: countFiles('points'),
    source: countFiles('source'),
    entities: loadEntities().length,
    links: loadLinks().length,
  })
}

let tree: TreeNode[] | undefined

/** 레포를 열었을 때 보이는 모양. 개수는 전부 세어서 채운다 */
export function repoTree(): TreeNode[] {
  return (tree ??= build())
}

function build(): TreeNode[] {
  const c = dataCounts()
  return [
    { path: 'points/', label: '편역본 본문', count: `${c.points}개 파일 (30포인트 + 목차 등)`, depth: 0 },
    { path: 'source/', label: '기번 영문 원전', count: `${c.source}개 (71장 + 서문)`, depth: 0 },
    { path: 'entities/', label: '인물·지명·사건 — 사람이 읽는 쪽', count: `${countRecursive('entities')}개 파일`, depth: 0 },
    { path: 'ontology/entities.jsonl', label: '같은 것을 한 줄씩 — AI가 읽는 쪽', count: `${c.entities}줄`, depth: 1 },
    { path: 'ontology/links.jsonl', label: '관계 — 누가 누구와 어떤 사이인지', count: `${c.links}줄`, depth: 1 },
  ]
}

export type SampleField = {
  /** jsonl의 실제 키. 원문과 대조하라고 그대로 보여준다 */
  key: string
  /** 사람이 읽는 값 */
  value: string
  /** 이 칸이 무슨 뜻인가 */
  means: string
}

/** 기원전은 음수로 들어 있다 (AGENTS 불변식 3). 화면에는 사람이 읽는 꼴로 낸다 */
const yearText = (n: number) => (n < 0 ? `기원전 ${-n}년` : `${n}년`)

/**
 * `links.jsonl`의 **진짜 첫 줄**을 읽어 칸마다 뜻을 붙인다.
 *
 * Stripe의 2단 패턴이다 — 한쪽에 원문 레코드, 다른 쪽에 필드 설명. 원문을
 * 그대로 두는 것이 요점이라 `raw`는 파일에서 읽은 문자열을 손대지 않는다.
 */
export function sampleLink(): { raw: string; fields: SampleField[] } {
  const raw = readFileSync(join(REPO_ROOT, 'ontology/links.jsonl'), 'utf-8')
    .split('\n')
    .find((l) => l.trim())!
    .trim()

  const l = JSON.parse(raw) as Record<string, unknown>
  const index = entityIndex()
  const byId = new Map([...index.values()].map((r) => [r.id, r]))
  const name = (id: string) => {
    const e = byId.get(id)
    return e ? `${e.name} (${TYPE_KO[e.type] ?? e.type})` : id
  }

  const fields: SampleField[] = [
    { key: 'from', value: name(String(l.from)), means: '누가 — 관계를 거는 쪽입니다' },
    { key: 'to', value: name(String(l.to)), means: '누구와 — 관계를 받는 쪽입니다' },
    {
      key: 'rel',
      value: REL_KO[String(l.rel)]?.out ?? String(l.rel),
      means: `어떤 사이인지. 모두 ${new Set(loadLinks().map((x) => x.rel)).size}종뿐이라 셀 수 있습니다`,
    },
    {
      key: 'point',
      value: `포인트 ${l.point}`,
      means: '몇 번 대목에 나온 이야기인지. 「그거 어디 나온 얘기야」에 답하는 칸입니다',
    },
  ]

  if (typeof l.from_year === 'number') {
    fields.push({
      key: 'from_year',
      value: yearText(l.from_year),
      means: '언제부터인지. 자료에는 기원전이 음수로 들어 있습니다',
    })
  }

  return { raw, fields }
}
