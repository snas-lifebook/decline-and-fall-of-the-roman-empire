/**
 * AI 채팅창의 생김새 — 빌드타임에 굽는 SVG 한 장. 클라이언트 JS 0줄이다.
 *
 * 태봉호(베타 첫 사용자, 2026-08-19)가 남긴 요청이다 — "일반인은 아예 그 창이
 * 어떤식으로 굴러가는지 모를거에요... 캡쳐는 아니더라도 svg로 화면 목업을
 * 올리는건 어떨까요?" 앞 판은 이 요청에 텍스트만 넣고 끝냈다가 반려됐다.
 *
 * **문서 사이트 넷을 조사하고 고른 형태다.** `code.claude.com/docs/ko/quickstart`는
 * 스크린샷이 0장이고 「입력 코드블록 → 결과는 산문으로 설명」만 쓰는데, 그건 이미
 * `RecipeCard`·`SkillCard`의 「1 넣는 것 → 2 시키는 것 → 3 나오는 것」 삼단과
 * 같은 구조다. `learn.chatgpt.com`은 실제 대화를 텍스트로 그대로 옮겨 적지, 창
 * 테두리를 그리지 않는다. 이 저장소 자체도 실측이 있다 — `DataShape.tsx`가
 * 「Stripe·OpenAI는 도식이 0개인데도 자기 데이터를 완전히 전달한다」고 적어 뒀다.
 *
 * 그래서 **산문·프롬프트 상자는 그대로 두고, 이것 한 장만 더한다.** 넷 중 아무도
 * 안 풀어 준 문제가 하나 남기 때문이다 — 태봉호가 말한 건 "어느 프롬프트가
 * 좋은가"가 아니라 "그 창이 어떻게 생겼는지 자체를 모른다"는 것이다. 그 문제는
 * 자료를 붙이고 보내는 창의 뼈대 하나만 있으면 풀린다. 안의 대화 내용은 지어내지
 * 않는다 — 실제로 뜨는 말풍선 텍스트가 아니라 "여기가 그 자리다"라는 자리 표시일
 * 뿐이고, 라벨은 `RecipeCard`·`SkillCard`가 이미 쓰는 「1 넣는 것·2 시키는 것·
 * 3 나오는 것」을 그대로 가져다 쓴다 — 이 화면 하나만의 새 말을 만들지 않는다.
 *
 * 색·글꼴·다크모드 대응은 `lib/family/svg.ts`·`lib/place/svg.ts`와 같은 방식이다
 * (`light-dark()`, Ctrl+F에 잡히는 SVG `<text>`). 안에 링크가 없어 `role="img"`를
 * 쓴다 — `role="group"`은 안의 링크를 살리려고 쓰는 것인데(가계도 참고) 여기는
 * 누를 것이 없다.
 */

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

const W = 640
const H = 254

function callout(x: number, y: number, w: number, label: string): string {
  return (
    `<rect class="callout" x="${x}" y="${y}" width="${w}" height="22" rx="11"/>` +
    `<text class="callout-text" x="${x + w / 2}" y="${y + 15}" text-anchor="middle">${esc(label)}</text>`
  )
}

export function renderChatMockupSvg(): string {
  const label = 'AI 채팅창 구조 — 아래 입력칸에 자료와 질문을 붙여넣고 보내기를 누르면 위에 답이 뜹니다'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;height:auto" role="img" aria-label="${esc(label)}">
<style>
  .win-body { fill: light-dark(#fff, #16191c); }
  .win-border { fill: none; stroke: light-dark(#b8b8b8, #3a4046); stroke-width: 1; }
  .win-header { fill: light-dark(#f4f4f4, #1c2024); }
  .win-dot { fill: light-dark(#c9c9c9, #454b52); }
  .bubble { fill: light-dark(#f4f4f4, #22272b); stroke: light-dark(#d8d8d8, #3a4046); stroke-width: 1; }
  .bubble-text, .compose-text { font: 13px Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif;
    fill: light-dark(#6a6a6a, #9aa2aa); }
  .compose { fill: light-dark(#fff, #16191c); stroke: light-dark(#b8b8b8, #3a4046); stroke-width: 1; }
  .send-btn { fill: light-dark(#111, #e6e9ec); }
  .send-icon { fill: none; stroke: light-dark(#fff, #16191c); stroke-width: 1.6;
    stroke-linecap: round; stroke-linejoin: round; }
  .callout { fill: light-dark(#eef0f2, #20262b); stroke: light-dark(#c9c9c9, #454b52); stroke-width: 1; }
  .callout-text { font: 600 11px Pretendard, "Apple SD Gothic Neo", system-ui, sans-serif;
    fill: light-dark(#33383d, #d4dade); }
</style>
<clipPath id="chatmock-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath>
<g clip-path="url(#chatmock-clip)">
  <rect class="win-body" x="0" y="0" width="${W}" height="${H}"/>
  <rect class="win-header" x="0" y="0" width="${W}" height="34"/>
  <circle class="win-dot" cx="20" cy="17" r="3.5"/>
  <circle class="win-dot" cx="32" cy="17" r="3.5"/>
  <circle class="win-dot" cx="44" cy="17" r="3.5"/>

  ${callout(24, 48, 100, '3 나오는 것')}
  <rect class="bubble" x="24" y="76" width="320" height="46" rx="12"/>
  <text class="bubble-text" x="40" y="104">AI가 여기에 답합니다</text>

  ${callout(24, 160, 96, '1 넣는 것')}
  ${callout(516, 160, 100, '2 시키는 것')}
  <rect class="compose" x="24" y="190" width="544" height="40" rx="10"/>
  <text class="compose-text" x="40" y="214">자료와 질문을 여기에 붙여넣습니다</text>
  <rect class="send-btn" x="576" y="190" width="40" height="40" rx="10"/>
  <path class="send-icon" d="M596 222V198M588 206L596 198L604 206"/>
</g>
<rect class="win-border" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14"/>
</svg>`
}
