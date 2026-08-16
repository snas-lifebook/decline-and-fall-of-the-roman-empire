import type { FamilyLayout } from './layout'

/**
 * 좌표를 SVG 문자열로 굽는다. 클라이언트 JS 0KB — 인물 이름이 HTML 텍스트로
 * 남아서 브라우저 Ctrl+F로 잡힌다. 동명이인을 가르는 화면에서 이건
 * 부수효과가 아니라 기능이다.
 *
 * 색은 쓰지 않는다(CONSTITUTION 12). 굵기와 여백으로만 가른다.
 */

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

export type SvgOptions = {
  fontSize?: number
  /** 하이라이트할 인물. 그 사람만 테두리가 굵어진다 */
  focus?: string
  /** 그 인물 화면으로 가는 주소. 주면 상자가 링크가 된다 */
  hrefOf?: (id: string) => string | undefined
  /** 남녀. `족보_표기_설계.md` 채널 배정 — 청록=남 · 보라=여 · 무색=미상 */
  sexOf?: (id: string) => 'm' | 'f' | undefined
}

export function renderFamilySvg(layout: FamilyLayout, opts: SvgOptions = {}): string {
  const fontSize = opts.fontSize ?? 15

  const edges = layout.edges
    .map((e) => {
      const d = e.points.map((p, i) => `${i ? 'L' : 'M'}${round(p.x)} ${round(p.y)}`).join(' ')
      return `<path class="${e.kind}" d="${d}"/>`
    })
    .join('\n')

  const nodes = layout.nodes
    .map((n) => {
      if (n.kind === 'union') return `<circle class="union" cx="${round(n.x)}" cy="${round(n.y)}" r="4"/>`
      const x = round(n.x - n.width / 2)
      const y = round(n.y - n.height / 2)
      const focused = opts.focus === n.id
      const sex = opts.sexOf?.(n.id)
      const href = opts.hrefOf?.(n.id)
      const baseline = n.note ? round(n.y - 2) : round(n.y + fontSize * 0.35)
      const note = n.note
        ? `<tspan class="note" x="${round(n.x)}" dy="${round(fontSize * 1.05)}">${esc(n.note)}</tspan>`
        : ''
      const box =
        `<g class="person${focused ? ' focus' : ''}${sex ? ` sex-${sex}` : ''}">` +
        `<rect x="${x}" y="${y}" width="${round(n.width)}" height="${round(n.height)}" rx="4"/>` +
        `<text x="${round(n.x)}" y="${baseline}" text-anchor="middle">${esc(n.label ?? n.id)}${note}</text>` +
        `</g>`
      // 상자를 누르면 그 인물 화면으로 간다. 이름이 글자로 남아 있어 Ctrl+F도 그대로 된다
      return href ? `<a href="${esc(href)}">${box}</a>` : box
    })
    .join('\n')

  /*
   * 폭을 픽셀로 박지 않는다. 아우구스투스 가문이 1201px인데 본문 칸이 1100px이라
   * **오른쪽이 잘려 나갔다.** 스크롤 상자 안에 있긴 했지만 맥은 스크롤바를 숨기므로
   * 읽는 사람에게는 그냥 고장으로 보인다.
   *
   * `width="100%"` + `max-width: 자연폭`이면 칸이 좁으면 줄고 넓어도 원래보다는
   * 안 커진다. viewBox가 비율을 지키므로 height는 `auto`로 따라온다.
   *
   * ponytail: 자연폭이 칸의 두 배를 넘으면 글자가 작아진다. 지금 여섯 가문 중
   * 그런 것은 없다(최대 1201 대 1100). 생기면 그때 세대별로 접는다.
   */
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(layout.width)} ${round(layout.height)}" width="100%" style="max-width:${round(layout.width)}px;height:auto" role="img">
<style>
  .person rect { fill: #fff; stroke: #b8b8b8; stroke-width: 1; }
  /* 채널 배정은 family/족보_표기_설계.md를 그대로 승계한다. 새로 정하지 않는다 */
  .person.sex-m rect { stroke: #2a8a8a; }
  .person.sex-f rect { stroke: #7a5aa8; }
  .person.focus rect { stroke: #111; stroke-width: 2; }
  a { cursor: pointer; }
  a:hover .person rect { fill: #f4f4f4; }
  .person text { font: ${fontSize}px Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif; fill: #111; }
  .person .note { font-size: ${round(fontSize * 0.72)}px; fill: #8a8a8a; }
  .union { fill: #b8b8b8; }
  path { fill: none; }
  path.family { stroke: #c9c9c9; stroke-width: 1; }
  path.succession { stroke: #6b6b6b; stroke-width: 2; stroke-dasharray: 6 4; }
</style>
${edges}
${nodes}
</svg>`
}

const round = (n: number) => Math.round(n * 100) / 100
