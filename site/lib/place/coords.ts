import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT, loadEntities } from '../ontology'
import { mentionedIn } from '../text/mentions'
import { entityIndex } from '../entity'

/**
 * 지명 좌표 — `entities/place/*.md` 프론트매터에서 읽는다.
 *
 * **좌표는 `entities.jsonl`에 없다.** 225개 중 4개만 `attrs`에 lat/lon이 있고, 진짜
 * 자료는 노트 프론트매터의 `location: [위도, 경도]`에 224개가 들어 있다(실측
 * 2026-08-18). 사이트가 그동안 안 읽던 자료다.
 *
 * **뒤집기는 여기 한 곳에서만 한다.** 노트는 `[위도, 경도]`(옵시디언 Leaflet 관례)로
 * 적고 MapLibre·GeoJSON은 `[경도, 위도]`를 받는다. 두 곳에서 뒤집으면 한 곳을 고칠 때
 * 다른 곳이 조용히 틀린다. 나가는 값은 **언제나 `[경도, 위도]`**이고 이름도 `lonLat`이라
 * 부른다 — `coords` 같은 이름을 쓰면 다음 사람이 순서를 또 추측한다.
 *
 * 잘못 뒤집혀도 점은 멀쩡히 그려진다. 로마가 소말리아 앞바다에 찍힐 뿐이라
 * **눈으로는 안 잡힌다.** 그래서 테스트가 위경도 범위를 지킨다.
 */

export const LOW = 'low'

export type PlaceCoord = {
  id: string
  name: string
  /** **[경도, 위도].** MapLibre·GeoJSON 순서다 */
  lonLat: [number, number]
  /** `high` 148 · `medium` 53 · `low` 19 (실측). 추정을 확정처럼 그리지 않으려고 들고 온다 */
  confidence: string
  /** "로마, 이탈리아" — 오늘 어디인지. 없을 수 있다 */
  modern?: string
  points: number[]
}

const LOCATION = /^location:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/m
const CONFIDENCE = /^coord_confidence:\s*(\w+)/m
const MODERN = /^modern:\s*"?([^"\n]+?)"?\s*$/m

let cache: Map<string, PlaceCoord> | null = null

/** 객체 id → 좌표. 파일을 한 번만 읽는다 */
export function placeCoords(root = REPO_ROOT): Map<string, PlaceCoord> {
  if (cache) return cache

  // 노트 파일명이 곧 객체의 `note`다 — `lib/entity.ts`가 쓰는 것과 같은 열쇠
  const byNote = new Map(
    loadEntities(root)
      .filter((e) => e.type === 'place' && e.note)
      .map((e) => [e.note as string, e]),
  )

  const dir = join(root, 'entities/place')
  const out = new Map<string, PlaceCoord>()

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md')) continue
    const entity = byNote.get(file.replace(/\.md$/, ''))
    if (!entity) continue

    const text = readFileSync(join(dir, file), 'utf8')
    const loc = text.match(LOCATION)
    // 좌표가 없는 노트는 조용히 뺀다. 실측 1건이고, 없는 것을 0,0으로 찍으면
    // 기니만 한가운데에 고대 도시가 생긴다
    if (!loc) continue

    out.set(entity.id, {
      id: entity.id,
      name: entity.name,
      lonLat: [Number(loc[2]), Number(loc[1])], // 노트는 [위도, 경도] — 여기서 뒤집는다
      confidence: text.match(CONFIDENCE)?.[1] ?? 'medium',
      modern: text.match(MODERN)?.[1]?.trim() || undefined,
      points: entity.points,
    })
  }

  cache = out
  return out
}

/**
 * 한 대목에 나오는 지명들.
 *
 * **`points` 배열만 보면 안 된다.** 그 배열은 「그 포인트에 딸린 서술이 있다」는
 * 뜻이지 「그 대목에 나온다」가 아니다. 포인트 05가 그 차이를 그대로 보여준다 —
 * 본문이 라인 강·에스파냐·소아시아·아프리카를 부르는데 배열에는 로마 하나뿐이라,
 * 처음 만든 지도에 마커가 **한 개** 찍혔다(2026-08-18 실측).
 *
 * 2026-08-17 감사에서 읽기와 가져가기가 30/30 어긋났던 것과 **같은 병**이고, 그때
 * 만든 `mentionedIn`과의 합집합으로 같이 푼다. 데이터는 안 고친다.
 */
export function coordsOfPoint(point: number, root = REPO_ROOT): PlaceCoord[] {
  const all = placeCoords(root)
  const ids = new Set([...all.values()].filter((p) => p.points.includes(point)).map((p) => p.id))
  for (const ref of mentionedIn(point, entityIndex(root))) {
    if (all.has(ref.id)) ids.add(ref.id)
  }
  return [...ids]
    .map((id) => all.get(id)!)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}
