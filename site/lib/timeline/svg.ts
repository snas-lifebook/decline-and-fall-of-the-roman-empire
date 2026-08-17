import { textWidth } from '../text/width'
import type { Timeline, Span } from './build'

/**
 * 관계 연표를 SVG 한 덩어리로 굽는다. **빌드 때 끝나고 클라이언트 JS는 0줄이다.**
 *
 * 가계도(`family/svg.ts`)와 같은 방식이다 — 배치가 고정이라 힘 시뮬레이션이 필요
 * 없고, 이름이 SVG 텍스트로 남아 Ctrl+F에 잡힌다.
 *
 * 한글 라벨 폭은 `text/width.ts`가 DOM 없이 재준다(한글 advance 0.865 실측).
 * mermaid를 안 쓴 이유가 정확히 이것이다 — CJK 폭 측정 버그(#4950·#6424).
 */

const W = 760
const GUTTER = 168 // 라벨 칸. 「피정복 — 콘스탄티노플」이 들어가는 폭이다
const RIGHT = 12
const ROW = 24
const BAR = 8
const AXIS = 30
const FONT = 11
const AXIS_FONT = 10

/** 이보다 길면 연표가 본문보다 길어진다. 실측상 로마(40건) 하나만 걸린다 */
export const MAX_ROWS = 24

const PLOT = W - GUTTER - RIGHT

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const round = (n: number) => Math.round(n * 10) / 10

/** 기원전은 음수로 들어 있다 (AGENTS 불변식 3). 축에는 짧게 낸다 */
const axisText = (n: number) => (n < 0 ? `기원전 ${-n}` : `${n}`)

/**
 * 눈금 간격. 대여섯 칸이 되는 값을 고른다 — 촘촘하면 글자가 겹친다.
 *
 * **작은 값이 있어야 한다.** 처음엔 10부터 시작했는데, 카이사르(기원전 60~44년)처럼
 * 16년짜리 연표에 눈금이 **둘밖에 안 서서** 막대가 어디쯤인지 읽히지 않았다.
 * 연표의 폭은 객체마다 16년에서 2,200년까지 벌어진다.
 */
const STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000]
function tickStep(span: number): number {
  return STEPS.find((s) => span / s <= 6) ?? STEPS[STEPS.length - 1]
}

/** 라벨이 칸을 넘으면 잘라서 말줄임한다. 넘친 글자가 막대 위로 흐르면 못 읽는다 */
function fit(s: string, max: number): string {
  if (textWidth(s, FONT) <= max) return s
  let cut = s
  while (cut.length > 1 && textWidth(`${cut}…`, FONT) > max) cut = cut.slice(0, -1)
  return `${cut}…`
}

export type TimelineSvgOptions = {
  /** 낭독기에는 그림 하나로 들린다. 무엇의 연표인지 말해준다 */
  label?: string
  hrefOf?: (id: string) => string | undefined
}

export function renderTimelineSvg(tl: Timeline, opts: TimelineSvgOptions = {}): string {
  const rows = tl.spans.slice(0, MAX_ROWS)
  const H = AXIS + rows.length * ROW + 6

  // 폭이 0이면 모든 막대가 같은 x에 겹친다. 한 해짜리 연표도 눈금은 서야 한다
  const min = tl.min
  const max = tl.max > tl.min ? tl.max : tl.min + 1
  const x = (year: number) => GUTTER + ((year - min) / (max - min)) * PLOT

  const step = tickStep(max - min)
  const ticks: number[] = []
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(t)

  const parts: string[] = []

  // 눈금선은 막대 뒤에 깔린다
  for (const t of ticks) {
    parts.push(
      `<line class="tick" x1="${round(x(t))}" y1="${AXIS - 8}" x2="${round(x(t))}" y2="${H}"/>`,
      `<text class="axis" x="${round(x(t))}" y="${AXIS - 14}">${esc(axisText(t))}</text>`,
    )
  }

  rows.forEach((s, i) => {
    const y = AXIS + i * ROW
    parts.push(`<g class="row ${s.side}">`, row(s, y, x, opts))
    parts.push('</g>')
  })

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;height:auto" xmlns="http://www.w3.org/2000/svg" role="img"${
    opts.label ? ` aria-label="${esc(opts.label)}"` : ''
  }>
<style>
  /*
   * 색은 light-dark() 짝으로만 쓴다. 다크모드를 붙이면서 하드코딩을 전부 걷어냈고
   * 새 그림이 그 규칙을 깨면 다음 사람이 같은 일을 또 한다.
   * 적·동 둘만 색을 지고 나머지는 회색이다 (DESIGN P1 — 색은 절제).
   *
   * **회색이 #8a8a8a가 아니라 #6a6a6a인 이유**: 앞의 값은 라이트 배경(#f1f4f7)에서
   * 3.13:1이라 본문 기준 4.5:1에 미달이었다(2026-08-17 브라우저 실측). #6a6a6a는
   * 4.7:1이다. 같은 값을 쓰던 가계도(family/svg.ts)의 주석 글자도 같이 고쳤다 —
   * 한 군데만 고치면 다음에 또 낮은 쪽을 베껴 쓴다.
   * (이 주석에 백틱을 쓰면 템플릿 리터럴이 끊긴다 — 헌장 18. 실제로 한 번 끊었다.)
   */
  .axis { font: ${AXIS_FONT}px Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif; fill: light-dark(#6a6a6a, #9aa2aa); text-anchor: middle; }
  .tick { stroke: light-dark(#e8e8e8, #2b3035); stroke-width: 1; }
  .label { font: ${FONT}px Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif; fill: light-dark(#111, #e6e9ec); }
  .rel { fill: light-dark(#6a6a6a, #9aa2aa); }
  a:hover .label { text-decoration: underline; }
  .bar { rx: ${BAR / 2}; }
  .neutral .bar { fill: light-dark(#c4c4c4, #4a5157); }
  .hostile .bar { fill: light-dark(#c05a4a, #d97a68); }
  .friendly .bar { fill: light-dark(#3f7f7f, #58b3b3); }
  /* 시점만 있고 끝을 모르는 것. 막대로 그리면 「그때 끝났다」는 거짓말이 된다 */
  .point { stroke-width: 2; }
  .neutral .point { stroke: light-dark(#c4c4c4, #4a5157); }
  .hostile .point { stroke: light-dark(#c05a4a, #d97a68); }
  .friendly .point { stroke: light-dark(#3f7f7f, #58b3b3); }
</style>
${parts.join('\n')}
</svg>`
}

function row(s: Span, y: number, x: (n: number) => number, opts: TimelineSvgOptions): string {
  const mid = y + ROW / 2
  const href = opts.hrefOf?.(s.ref.id)
  const label = fit(s.ref.name, GUTTER - 12 - textWidth(`${s.label} `, FONT))
  const text = `<text class="rel" x="0" y="${mid + 4}" font-size="${FONT}">${esc(s.label)} <tspan class="label">${esc(label)}</tspan></text>`

  const mark =
    s.to === null
      ? // 시작만 아는 것 — 세로 눈금 하나. 오른쪽으로 뻗지 않는다
        `<line class="point" x1="${round(x(s.from))}" y1="${round(mid - 6)}" x2="${round(x(s.from))}" y2="${round(mid + 6)}"/>`
      : `<rect class="bar" x="${round(x(s.from))}" y="${round(mid - BAR / 2)}" width="${round(
          Math.max(x(s.to) - x(s.from), 3),
        )}" height="${BAR}"/>`

  return href ? `<a href="${esc(href)}">${text}</a>${mark}` : `${text}${mark}`
}
