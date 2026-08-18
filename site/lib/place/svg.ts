import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { textWidth } from '../text/width'
import { entityHref } from '../entity'
import { clusterPlaces, WIDE_KINDS, type PlaceCoord, type PlaceGroup } from './coords'

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
  /*
   * **창은 점인 것만으로 잡는다.**
   *
   * `region`·`sea`의 대표점이 대목 밖으로 멀리 나가 있으면 창이 그만큼 부풀고, 정작
   * 읽는 사람이 찾는 도시들이 가운데 몇 픽셀 안에 뭉친다. 실측(2026-08-18): 28개
   * 대목 중 6개가 넓은 것 때문에 창이 부풀어 있었고, 포인트 21은 전체 79.6도인데
   * 점인 것만 보면 17.4도였다 — **네 배 넓게 그리고 있었다.**
   *
   * 점인 것이 하나도 없으면(넓은 것만 나오는 대목) 어쩔 수 없이 전부로 잡는다.
   */
  const wide = new Set<string>(WIDE_KINDS)
  const anchors = places.filter((p) => !wide.has(p.kind))
  const base = anchors.length ? anchors : places

  const lons = base.map((p) => p.lonLat[0])
  const lats = base.map((p) => p.lonLat[1])
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

export function renderPointMap(input: PlaceCoord[]): string {
  if (!input.length) return ''

  /*
   * **붙어 있는 것을 먼저 묶는다.** 5km 이내가 61쌍이고, 최악은 좌표가 완전히 같다
   * (`카파도키아`↔`카이사레아`). 묶지 않으면 점 반지름 3.5px짜리가 통째로 포개져서
   * 위엣것 하나만 눌린다 — 아래 것은 화면에 있으면서 못 누르는 상태가 된다.
   */
  const places = clusterPlaces(input)

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
  const edged: PlaceGroup[] = []
  let labelled = 0

  for (const p of places) {
    const [rawX, rawY] = to(...p.lonLat)

    /*
     * **창 밖으로 나간 것은 버리지 않고 가장자리에 붙인다.**
     *
     * 창을 점인 것만으로 잡으므로 멀리 있는 지역 대표점이 프레임을 벗어난다(포인트
     * 05의 `독일`은 y=-203이다). 처음엔 안 그렸는데, 그러면 **본문에서 그 지명에
     * 마우스를 올려도 아무 일이 안 일어나고 눌러서 갈 수도 없다** — 화면에서 통째로
     * 사라지는 것과 같다.
     *
     * 가장자리 점은 「저 바깥 이 방향」이라는 뜻이다. 정확한 자리를 아는 척하지
     * 않으려고 테두리만 있는 모양(`edge`)으로 그리고 이름표는 안 단다.
     */
    const off = rawX < PAD || rawX > W - PAD || rawY < PAD || rawY > H - PAD
    const x = Math.min(Math.max(rawX, PAD / 2), W - PAD / 2)
    const y = Math.min(Math.max(rawY, PAD / 2), H - PAD / 2)
    if (off) edged.push(p)
    /*
     * **본문 링크와 글자 하나까지 같아야 한다.** 호버 패널이 `href`로 짝을 찾기
     * 때문이다. 처음엔 여기서만 `encodeURIComponent`를 걸었는데, 본문 쪽
     * `linkifyWikilinks`는 안 걸어서 **짝이 하나도 안 맞았다**(2026-08-18 실측).
     * 두 곳 다 `entityHref` 하나를 쓴다.
     */
    const href = entityHref({ id: p.id, type: 'place', name: p.name })
    const guessed = p.confidence === 'low' ? ' guessed' : ''
    const edge = off ? ' edge' : ''
    const dot = `<circle cx="${round(x)}" cy="${round(y)}" r="${DOT}" class="pin${guessed}${edge}"/>`

    /*
     * **묶인 것을 이름에 드러낸다.** 「비잔티움 +2」처럼 적어야 그 자리에 더 있다는
     * 것을 알고 눌러 본다. 숨기면 화면에 없는 것과 같아진다.
     */
    const label = p.with.length ? `${p.name} +${p.with.length}` : p.name
    /* 툴팁에는 딸린 이름을 다 적는다 — 「+2」가 무엇인지 답할 데가 여기뿐이다 */
    const title = p.with.length ? `${p.name} · ${p.with.map((w) => w.name).join(' · ')}` : p.name

    const tw = textWidth(label, FONT)
    const box = { x1: x + 6, y1: y - 7, x2: x + 10 + tw, y2: y + 5 }
    const clash =
      off ||
      labelled >= MAX_LABELS ||
      box.x2 > W - 4 ||
      box.y1 < 4 ||
      box.y2 > H - 4 ||
      taken.some((t) => !(box.x2 < t.x1 || box.x1 > t.x2 || box.y2 < t.y1 || box.y1 > t.y2))

    /*
     * `data-kind`가 레이어를 가른다. **카드 종류 끄기와 똑같은 수법** — 빌드 때 다
     * 그려 두고 `html[data-layers]`가 CSS로 숨긴다. 자바스크립트는 단추뿐이다.
     *
     * `data-also`는 **묶여 들어간 것들의 주소**다. 호버 패널이 본문 링크를 `href`로
     * 찾는데, 묶이면 그 주소를 가진 점이 사라져서 `아프리카`에 마우스를 올려도 아무
     * 일이 없다. 여기 적어 두면 패널이 대표 점을 켤 수 있다.
     */
    const also = p.with.length
      ? ` data-also="${p.with.map((w) => entityHref({ id: w.id, type: 'place', name: w.name })).join(' ')}"`
      : ''
    const open = `<a href="${href}" data-kind="${p.kind}"${also}>`

    if (clash) {
      pins.push(`${open}<title>${esc(title)}</title>${dot}</a>`)
      continue
    }

    taken.push(box)
    labelled += 1
    pins.push(
      `${open}<title>${esc(title)}</title>${dot}` +
        `<text class="pin-label" x="${round(x + 7)}" y="${round(y + 3.5)}">${esc(label)}</text></a>`,
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
    /*
      **눌린다는 것을 눈으로 알려야 한다.** 처음엔 아무 표시가 없어서 River가
      「인터랙티브가 안 되는 것 같다」고 했다. 손가락 커서와 hover 강조를 준다.
    */
    .pin.edge { fill: none; stroke: light-dark(#a8543f, #d0806a); stroke-width: 1.2; opacity: .55; }
    .map-note { font-size: 10px; fill: light-dark(#6a6a6a, #9aa2aa); }
    a { cursor: pointer; }
    a:hover .pin-label { fill: light-dark(#fff, #0e161d); stroke: light-dark(#a8543f, #d0806a); }
    a:hover .pin { r: 5; }
    a:focus-visible .pin { outline: 2px solid light-dark(#a8543f, #d0806a); outline-offset: 2px; }
  `

  /*
   * 못 그린 곳을 그림 안에 적는다. **말없이 자르지 않는다** — 카드가 「몇 중 몇을
   * 세웠습니다」로 밝히는 것과 같은 자리다. SVG 안에 두는 것은 이 문자열이 통째로
   * `dangerouslySetInnerHTML`로 들어가서 밖에 덧붙일 데가 없기 때문이다.
   */
  const note = edged.length
    ? `<text class="map-note" x="${W - 10}" y="${H - 10}" text-anchor="end">` +
      `테두리에 붙은 점 ${edged.length}곳은 이 화면 밖입니다</text>`
    : ''

  return (
    `<svg viewBox="0 0 ${W} ${H}" width="100%" role="group" aria-label="이 대목에 나오는 지명 ${places.length}곳">` +
    `<style>${style}</style>` +
    `<clipPath id="map-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="10"/></clipPath>` +
    `<g clip-path="url(#map-clip)">` +
    `<rect class="sea" x="0" y="0" width="${W}" height="${H}"/>` +
    paths.join('') +
    pins.join('') +
    note +
    `</g></svg>`
  )
}
