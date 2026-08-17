import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from '../ontology'
import type { EntityRef } from '../entity'

/**
 * 포인트 본문이 **이름을 부른** 객체들.
 *
 * `points/NN_*.md` 맨 아래 「### 등장 객체」 절의 위키링크를 읽는다.
 * 이 목록은 본문에서 실제로 언급된 이름이라 **`entities.jsonl`의 `points`
 * 배열보다 넓다** — 후자는 「그 포인트에 딸린 서술이 있다」는 뜻이고, 이쪽은
 * 「그 대목에 나온다」는 뜻이다. 발표 준비에 필요한 것은 후자다.
 *
 * 감사(2026-08-17)에서 두 화면이 30/30 어긋났다. 합으로 1,496 대 959였고
 * 포인트 05는 55 대 18이었다. 시칠리아·이탈리아처럼 **객체가 실재하는데도**
 * 표에서 빠져 있었다.
 *
 * **사전에 없는 위키링크는 버린다.** 본문에는 `[[06_천적과의_전쟁]]` 같은
 * 챕터 이동 링크가 섞여 있는데 그건 객체가 아니라 파일이다. 사전(노트 파일명
 * 기준, 실측 619/619 일대일)이 그 둘을 이미 가른다.
 */

const HEADING = '### 등장 객체'
const WIKILINK = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g

let cached: Map<number, EntityRef[]> | undefined

function build(index: Map<string, EntityRef>): Map<number, EntityRef[]> {
  const dir = join(REPO_ROOT, 'points')
  const out = new Map<number, EntityRef[]>()

  for (const f of readdirSync(dir)) {
    const m = /^(\d+)_.*\.md$/.exec(f)
    if (!m) continue
    const n = Number(m[1])
    // 00은 목차·일러두기다. 읽기 화면은 01~30만 굽는다
    if (n < 1) continue

    const raw = readFileSync(join(dir, f), 'utf8')
    const at = raw.indexOf(HEADING)
    if (at < 0) continue

    const seen = new Set<string>()
    const refs: EntityRef[] = []
    for (const [, target] of raw.slice(at).matchAll(WIKILINK)) {
      const ref = index.get(target)
      if (!ref || seen.has(ref.id)) continue
      seen.add(ref.id)
      refs.push(ref)
    }
    out.set(n, refs)
  }
  return out
}

export function mentionedIn(point: number, index: Map<string, EntityRef>): EntityRef[] {
  cached ??= build(index)
  return cached.get(point) ?? []
}
