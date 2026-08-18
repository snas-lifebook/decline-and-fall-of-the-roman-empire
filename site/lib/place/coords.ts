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

/**
 * **넓은 것 — 점 하나로 찍으면 거짓말이 되는 종류.**
 *
 * 지도 겹침의 주원인이다(2026-08-18 실측). `아프리카`(region)가 `카르타고`(city)에서
 * 300m 떨어져 있고, `카파도키아`↔`카이사레아`·`터키`↔`에데사`·`발칸반도`↔`발칸`은
 * **좌표가 완전히 같다.** 지역의 대표점을 그 지역 대표 도시에 찍었기 때문이다.
 *
 * **확대해도 안 갈라진다** — 같이 커질 뿐이다. 그래서 기본값에서 꺼 두고, 창을 잡을
 * 때도 빼서 도시들이 화면을 넓게 쓰게 한다. 진짜 답은 영역을 영역으로 그리는 것인데
 * 그건 데이터가 없어 별도 작업으로 남긴다.
 */
export const WIDE_KINDS = ['region', 'sea', 'strait', 'river', 'lake'] as const

export type PlaceCoord = {
  id: string
  name: string
  /** **[경도, 위도].** MapLibre·GeoJSON 순서다 */
  lonLat: [number, number]
  /** `high` 148 · `medium` 53 · `low` 19 (실측). 추정을 확정처럼 그리지 않으려고 들고 온다 */
  confidence: string
  /**
   * city 103 · region 58 · river 16 · building 11 · sea 11 · island 9 ·
   * battlefield 8 · mountain 4 · cape 3 · lake 1 · strait 1 (실측 225/225).
   *
   * **225곳 전부에 있는데 사이트가 그동안 안 읽었다.** 레이어가 새 데이터 없이 되는 이유다.
   */
  kind: string
  /** "로마, 이탈리아" — 오늘 어디인지. 없을 수 있다 */
  modern?: string
  points: number[]
}

const LOCATION = /^location:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/m
const CONFIDENCE = /^coord_confidence:\s*(\w+)/m
const KIND = /^place_kind:\s*"?([a-z_]+)"?/m
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
      kind: text.match(KIND)?.[1] ?? 'city',
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

/**
 * 붙어 있는 지명을 한 점으로 묶는다.
 *
 * ## 왜 확대가 아니라 묶음인가
 *
 * River가 「작은 도시나 광장이나 건물 이름이 나오면 해상도 문제가 발생한다」고 했다.
 * 좌표 224곳을 다 대조해 보니 원인이 둘인데 **성격이 다르다**(2026-08-18 실측).
 *
 *   ① 넓은 것(region·sea)을 점으로 찍었다 — `아프리카`와 `카르타고`가 300m 차이고
 *      `카파도키아`와 `카이사레아`는 **좌표가 같다.** 확대해도 같이 커질 뿐이다
 *   ② 도시 안의 건물 — `성소피아성당`이 `비잔티움`에서 0.0002도(약 20m)다
 *
 * ①이 다수라 **확대·이동 UI는 절반만 듣는 답이다.** ①은 레이어로 가리고(`WIDE_KINDS`),
 * ②는 여기서 묶는다. 20MB짜리 지도 라이브러리를 다시 들이는 것보다 싸고, 8/18에
 * MapLibre를 걷어낸 판단과도 같은 결이다.
 *
 * ## 아무도 지우지 않는다
 *
 * 묶인 것은 대표 아래 `with`로 남는다. **이름을 지우면 「그 지명이 이 대목에 없다」는
 * 거짓말이 된다** — 이름표가 겹칠 때 점을 남기고 글자를 지우는 `svg.ts`의 판단과 같다.
 *
 * 대표는 **점인 것이 맡는다.** 지역이 대표가 되면 도시 이름이 숨는데, 사람이 찾는
 * 것은 대개 도시 쪽이다.
 */
export type PlaceGroup = PlaceCoord & { with: PlaceCoord[] }

/** 이보다 가까우면 같은 자리로 본다. 0.05도는 위도 40도에서 약 4~5km다 */
export const CLUSTER_DEG = 0.05

export function clusterPlaces(places: PlaceCoord[]): PlaceGroup[] {
  const wide = new Set<string>(WIDE_KINDS)
  // 점인 것을 먼저 세워 대표를 맡게 한다. 같은 성격이면 이름순으로 안정시킨다
  const order = [...places].sort(
    (a, b) =>
      Number(wide.has(a.kind)) - Number(wide.has(b.kind)) || a.name.localeCompare(b.name, 'ko'),
  )

  const out: PlaceGroup[] = []
  for (const p of order) {
    const near = out.find(
      (g) =>
        Math.abs(g.lonLat[0] - p.lonLat[0]) < CLUSTER_DEG &&
        Math.abs(g.lonLat[1] - p.lonLat[1]) < CLUSTER_DEG,
    )
    if (near) near.with.push(p)
    else out.push({ ...p, with: [] })
  }
  return out
}
