/**
 * 「화면 보는 법」 주석 목업 — 빌드타임 SVG 문자열(ChoiceCards·chatmockup 계열).
 *
 * 클라이언트 JS 0, 이미지 0, 의존성 0. `<style>` 안 `light-dark()`로 셀프테마.
 * **실제 스크린샷이 준비되면 교체**한다 — `components/ReadingShot.tsx`가 `img`를 받으면
 * 그쪽을 쓰고, 없으면 이 목업을 그린다. 그때까지 화면 생김새를 도식으로 먼저 보인다.
 *
 * 번호 배지와 캡션은 진짜 `<text>`라 Ctrl+F에 걸리고, svg에 `aria-label`을 달아
 * 낭독기도 뜻을 읽는다(장식이 아니라 설명 그림이므로).
 */

const STYLE = `
  .b{fill:light-dark(#fff,#16191c)}
  .edge{fill:none;stroke:light-dark(#d8dce1,#333a42);stroke-width:1}
  .bar{fill:light-dark(#f4f5f7,#1c2024)}
  .dot{fill:light-dark(#cfd3d8,#3f464e)}
  .ln{fill:light-dark(#e4e8ec,#2b323a)}
  .ln2{fill:light-dark(#ccd1d8,#39414a)}
  .blue{fill:light-dark(#dbe6f0,#24303a)}
  .bluetx{fill:light-dark(#2f5a7d,#8fb6d2);font:600 12px ui-sans-serif,system-ui}
  .panel{fill:light-dark(#f7f8fa,#1a1e23)}
  .pdiv{stroke:light-dark(#e6eaee,#2b323a);stroke-width:1}
  .pin{fill:light-dark(#9a4c37,#d59379)}
  .chip{fill:light-dark(#eceef1,#262c33)}
  .chiptx{fill:light-dark(#4a5058,#aab0b8);font:600 11px ui-sans-serif,system-ui}
  .conn{stroke:light-dark(#b9c2cc,#3a444e);stroke-width:1;stroke-dasharray:3 3}
  .note{fill:light-dark(#1a1d21,#e6e9ec)}
  .notetx{fill:light-dark(#fff,#16191c);font:700 12px ui-sans-serif,system-ui}
  .cap{fill:light-dark(#565c64,#9aa0a8);font:13px ui-sans-serif,system-ui}
`

/** 창 뼈대: 둥근 몸통 + 상단 바 + 점 셋. right에 설정 칩을 그릴지 여부만 받는다 */
function shell(id: string, aria: string, inner: string, bar = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" role="img" aria-label="${aria}" focusable="false">
<style>${STYLE}</style>
<clipPath id="${id}"><rect width="640" height="360" rx="14"/></clipPath>
<g clip-path="url(#${id})">
<rect class="b" width="640" height="360"/>
<rect class="bar" width="640" height="34"/>
<circle class="dot" cx="18" cy="17" r="3.5"/><circle class="dot" cx="30" cy="17" r="3.5"/><circle class="dot" cx="42" cy="17" r="3.5"/>
${bar}
${inner}
</g>
<rect class="edge" x="0.5" y="0.5" width="639" height="359" rx="14"/>
</svg>`
}

/** 번호 배지(원 + 숫자) */
function badge(x: number, y: number, n: number): string {
  return `<circle class="note" cx="${x}" cy="${y}" r="11"/><text class="notetx" x="${x}" y="${y + 4}" text-anchor="middle">${n}</text>`
}

/** 본문 몇 줄. 한 줄에 파란 이름을 심을 수 있다 */
function bodyLines(x: number, w: number): string {
  return `
<rect class="ln2" x="${x}" y="66" width="${w * 0.62}" height="10" rx="5"/>
<rect class="ln" x="${x}" y="92" width="${w}" height="8" rx="4"/>
<rect class="ln" x="${x}" y="112" width="${w}" height="8" rx="4"/>
<rect class="ln" x="${x}" y="132" width="${w * 0.8}" height="8" rx="4"/>`
}

/* 1) 본문 — 파란 이름 */
const text = shell(
  'rs-text',
  '읽기 화면 본문에서 인물 이름이 파랗게 표시되고, 누르면 열린다는 안내',
  `
${bodyLines(40, 420)}
<rect class="blue" x="40" y="160" width="86" height="20" rx="6"/>
<text class="bluetx" x="52" y="174">한니발</text>
<rect class="ln" x="134" y="166" width="300" height="8" rx="4"/>
<rect class="ln" x="40" y="196" width="380" height="8" rx="4"/>
${badge(150, 150, 1)}
<text class="cap" x="40" y="250">1  파란 이름을 누르면 그 자리에서 열려요</text>
`,
)

/* 2) 인물 카드 — 이름 옆에 열림 */
const card = shell(
  'rs-card',
  '파란 이름을 누르면 오른쪽에 인물 카드가 열리고 편·포인트·관계가 담긴다는 안내',
  `
${bodyLines(40, 300)}
<rect class="blue" x="40" y="160" width="86" height="20" rx="6"/>
<text class="bluetx" x="52" y="174">한니발</text>
<rect class="ln" x="134" y="166" width="196" height="8" rx="4"/>
<path class="conn" d="M126 170H392"/>
<rect class="panel" x="392" y="60" width="216" height="240" rx="10"/>
<rect class="edge" x="392.5" y="60.5" width="215" height="239" rx="10"/>
<rect class="ln2" x="410" y="84" width="120" height="11" rx="5"/>
<line class="pdiv" x1="410" y1="112" x2="590" y2="112"/>
<rect class="chip" x="410" y="126" width="52" height="18" rx="9"/><text class="chiptx" x="420" y="139">편</text>
<rect class="ln" x="470" y="130" width="110" height="8" rx="4"/>
<rect class="chip" x="410" y="156" width="52" height="18" rx="9"/><text class="chiptx" x="418" y="169">포인트</text>
<rect class="ln" x="470" y="160" width="90" height="8" rx="4"/>
<rect class="chip" x="410" y="186" width="52" height="18" rx="9"/><text class="chiptx" x="420" y="199">관계</text>
<rect class="ln" x="410" y="214" width="170" height="8" rx="4"/>
<rect class="ln" x="410" y="232" width="150" height="8" rx="4"/>
${badge(392, 60, 2)}
<text class="cap" x="40" y="280">2  이름 옆에 카드가 열려요 (편·포인트·관계)</text>
`,
)

/* 3) 지도 — 스크롤 따라 이동 */
const map = shell(
  'rs-map',
  '본문을 내려 읽으면 오른쪽 지도가 그 대목의 장소로 저절로 움직인다는 안내',
  `
${bodyLines(40, 300)}
<rect class="ln" x="40" y="160" width="300" height="8" rx="4"/>
<rect class="ln" x="40" y="180" width="260" height="8" rx="4"/>
<rect class="panel" x="392" y="60" width="216" height="200" rx="10"/>
<rect class="edge" x="392.5" y="60.5" width="215" height="199" rx="10"/>
<circle class="dot" cx="452" cy="150" r="3"/>
<circle class="dot" cx="560" cy="120" r="3"/>
<circle class="dot" cx="540" cy="210" r="3"/>
<path class="pin" d="M500 150c0-9-7-16-16-16s-16 7-16 16c0 12 16 26 16 26s16-14 16-26z"/>
<circle class="b" cx="484" cy="150" r="5.5"/>
${badge(392, 60, 3)}
<text class="cap" x="40" y="290">3  스크롤을 따라 지도가 그 대목으로 움직여요</text>
`,
)

/* 4) 설정 — 상단 바 오른쪽 */
const settings = shell(
  'rs-set',
  '글자 크기와 밝기는 상단 바 오른쪽의 빼기·100%·더하기·시스템 단추에서 바꾼다는 안내',
  `
${bodyLines(40, 420)}
<rect class="ln" x="40" y="160" width="380" height="8" rx="4"/>
<rect class="ln" x="40" y="180" width="340" height="8" rx="4"/>
${badge(486, 17, 4)}
<text class="cap" x="40" y="250">4  글자 크기와 밝기는 상단 바 오른쪽에서</text>
`,
  // 상단 바 오른쪽 칩: −  100%  +   시스템
  `
<rect class="chip" x="430" y="9" width="88" height="18" rx="9"/>
<text class="chiptx" x="443" y="22">−  100%  +</text>
<rect class="chip" x="526" y="9" width="52" height="18" rx="9"/>
<text class="chiptx" x="536" y="22">시스템</text>
`,
)

export type ReadingMockKind = 'text' | 'card' | 'map' | 'settings'
export const READING_MOCK: Record<ReadingMockKind, string> = { text, card, map, settings }
