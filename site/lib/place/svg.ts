import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { textWidth } from '../text/width'
import { entitySlug } from '../entity'
import type { PlaceCoord } from './coords'

/**
 * 이 대목의 지도를 SVG 한 덩어리로 굽는다. **빌드 때 끝나고 클라이언트 JS는 0줄이다.**
 *
 * 가계도(`family/svg.ts`)·관계 연표(`timeline/svg.ts`)와 같은 방식이다. 이름이 SVG
 * 글자로 남아 Ctrl+F에 잡히고, 점마다 링크가 걸린다.
 *
 * ## MapLibre를 걷어낸 이유
 *
 * 먼저 MapLibre + 로컬 GeoJSON으로 만들었다. 마커도 배경도 떴는데 **육지가 한 조각도
 * 안 그려졌다** — 소스 파일을 아예 요청조차 안 했다(2026-08-18 실측: `basemap` 요청
 * 0건). 바다 위에 점만 스물여덟 개 뜬 지도였다. GeoJSON은 200으로 멀쩡히 서빙되고
 * 있었으므로 번들러와 워커 사이의 문제로 보이는데, **그걸 파고드는 값보다 이 그림을
 * 직접 그리는 값이 쌌다.** 덤으로 20MB 의존성과 런타임 자바스크립트가 통째로 빠졌다.
 *
 * 잃은 것은 확대·이동이다. 지명의 91%가 지중해 상자 안에 있고 대목마다 그 대목의
 * 범위로 자동으로 맞추므로, 읽는 중에 지도를 끌 일은 많지 않다고 봤다.
 *
 * ## 투영
 *
 * 정사각도법(plate carrée)에 **중위도 코사인 보정**만 건다. 지중해 한 폭을 그리는
 * 데는 이걸로 충분하고, 보정을 안 하면 위도 40도에서 가로가 30% 늘어나 이탈리아가
 * 옆으로 퍼진다.
 */

const W = 760
const H = 420
const PAD = 28

/** 이보다 많이 적으면 이름표가 서로를 덮는다. 넘치는 것은 점만 남는다 */
export const MAX_LABELS = 22

const FONT = 11
const DOT = 3.5

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const round = (n: number) => Math.round(n * 10) / 10

type Ring = [number, number][]

let land: Ring[] | null = null

/** 육지 폴리곤. Natural Earth 1:110m(퍼블릭 도메인)을 우리 범위로 잘라 커밋해 뒀다 */
function loadLand(): Ring[] {
  if (land) return land
  const raw = readFileSync(join(process.cwd(), 'public/basemap/land.geojson'), 'utf8')
  const data = JSON.parse(raw) as {
    features: { geometry: { type: string; coordinates: unknown } }[]
  }
  const out: Ring[] = []
  for (const f of data.features) {
    const c = f.geometry.coordinates
    if (f.geometry.type === 'Polygon') out.push(...(c as Ring[]))
    else if (f.geometry.type === 'MultiPolygon') for (const poly of c as Ring[][]) out.push(...poly)
  }
  land = out
  return out
}

/**
 * 이 대목의 지명이 다 들어가는 창을 만든다.
 *
 * **최소 크기를 둔다.** 한 곳뿐인 대목이 있는데(포인트 05는 한때 로마 하나였다) 그
 * 점에 딱 맞추면 배율이 무한대가 된다. 8도면 이탈리아 반도가 화면을 채우는 정도다.
 */
function windowOf(places: PlaceCoord[]) {
  const lons = places.map((p) => p.lonLat[0])
  const lats = places.map((p) => p.lonLat[1])
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const kx = Math.cos((midLat * Math.PI) / 180)

  let w = Math.max(Math.max(...lons) - Math.min(...lons), 8)
  let h = Math.max(Math.max(...lats) - Math.min(...lats), 8 / 2)
  // 화면 비율에 맞춘다. 안 맞추면 그림이 한쪽으로 늘어난다
  const aspect = (W - PAD * 2) / (H - PAD * 2)
  if ((w * kx) / h > aspect) h = (w * kx) / aspect
  else w = (h * aspect) / kx

  const cx = (Math.min(...lons) + Math.max(...lons)) / 2
  const cy = midLat
  // 점이 테두리에 딱 붙지 않게 조금 넓힌다
  const pad = 1.12
  return { cx, cy, w: w * pad, h: h * pad, kx }
}

function projector(win: ReturnType<typeof windowOf>) {
  const sx = (W - PAD * 2) / (win.w * win.kx)
  const sy = (H - PAD * 2) / win.h
  return (lon: number, lat: number): [number, number] => [
    W / 2 + (lon - win.cx) * win.kx * sx,
    H / 2 - (lat - win.cy) * sy,
  ]
}

export function renderPointMap(places: PlaceCoord[]): string {
  if (!places.length) return ''

  const win = windowOf(places)
  const to = projector(win)

  /*
   * 창 밖으로 완전히 나간 링은 통째로 버린다. 남은 것은 자르지 않고 그대로 그린 뒤
   * `clipPath`가 화면 밖을 가린다 — 다각형을 정확히 자르는 코드를 쓰는 것보다 싸다.
   */
  const paths: string[] = []
  for (const ring of loadLand()) {
    const lons = ring.map((c) => c[0])
    const lats = ring.map((c) => c[1])
    const half = { w: win.w / 2, h: win.h / 2 }
    if (
      Math.max(...lons) < win.cx - half.w ||
      Math.min(...lons) > win.cx + half.w ||
      Math.max(...lats) < win.cy - half.h ||
      Math.min(...lats) > win.cy + half.h
    )
      continue
    const d = ring
      .map(([lon, lat], i) => {
        const [x, y] = to(lon, lat)
        return `${i ? 'L' : 'M'}${round(x)} ${round(y)}`
      })
      .join('')
    paths.push(`<path class="land" d="${d}Z"/>`)
  }

  /*
   * 이름표 겹침. 먼저 그린 것이 자리를 갖고, 겹치는 것은 **점만 남긴다** — 이름을
   * 지우는 대신 점을 지우면 「그 지명이 이 대목에 없다」는 거짓말이 된다.
   * 한글 폭은 `text/width.ts`가 DOM 없이 재준다.
   */
  const taken: { x1: number; y1: number; x2: number; y2: number }[] = []
  const pins: string[] = []
  let labelled = 0

  for (const p of places) {
    const [x, y] = to(...p.lonLat)
    const href = `/objects/place/${encodeURIComponent(entitySlug(p.name))}`
    const guessed = p.confidence === 'low' ? ' guessed' : ''
    const dot = `<circle cx="${round(x)}" cy="${round(y)}" r="${DOT}" class="pin${guessed}"/>`

    const tw = textWidth(p.name, FONT)
    const box = { x1: x + 6, y1: y - 7, x2: x + 10 + tw, y2: y + 5 }
    const clash =
      labelled >= MAX_LABELS ||
      box.x2 > W - 4 ||
      box.y1 < 4 ||
      box.y2 > H - 4 ||
      taken.some((t) => !(box.x2 < t.x1 || box.x1 > t.x2 || box.y2 < t.y1 || box.y1 > t.y2))

    if (clash) {
      pins.push(`<a href="${href}"><title>${esc(p.name)}</title>${dot}</a>`)
      continue
    }

    taken.push(box)
    labelled += 1
    pins.push(
      `<a href="${href}">${dot}` +
        `<text class="pin-label" x="${round(x + 7)}" y="${round(y + 3.5)}">${esc(p.name)}</text></a>`,
    )
  }

  /*
   * 색은 전부 `light-dark()`다. 다크모드를 붙이면서 가계도에서 하드코딩 색 열한 개를
   * 걷어냈고, 새 그림이 그걸 되돌리면 안 된다(테스트가 지킨다).
   */
  const style = `
    .sea { fill: light-dark(#d6e4ee, #0e161d); }
    .land { fill: light-dark(#f6f5f1, #242c33); stroke: light-dark(#a9bcca, #414c56); stroke-width: .8; }
    .pin { fill: light-dark(#a8543f, #d0806a); }
    .pin.guessed { fill: none; stroke: light-dark(#a8543f, #d0806a); stroke-width: 1.2; stroke-dasharray: 2 1.6; }
    .pin-label { font-size: ${FONT}px; fill: light-dark(#33383d, #d4dade); paint-order: stroke;
      stroke: light-dark(#d6e4ee, #0e161d); stroke-width: 3; stroke-linejoin: round; }
    a:hover .pin-label { fill: light-dark(#000, #fff); }
  `

  return (
    `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="이 대목에 나오는 지명 ${places.length}곳">` +
    `<style>${style}</style>` +
    `<clipPath id="map-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="10"/></clipPath>` +
    `<g clip-path="url(#map-clip)">` +
    `<rect class="sea" x="0" y="0" width="${W}" height="${H}"/>` +
    paths.join('') +
    pins.join('') +
    `</g></svg>`
  )
}
