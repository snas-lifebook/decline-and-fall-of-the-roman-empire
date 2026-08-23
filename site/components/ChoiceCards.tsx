import { Grid, Stack, Heading, Text, Badge, ClickableCard } from '@astryxdesign/core'
import { navLabel } from '../lib/nav'

/**
 * 시작하기 갈래 카드 (#15).
 *
 * 앞 판은 제목 + 한 줄 + 단계뿐이었다. learn.chatgpt 퀵스타트처럼 **카드 맨 위에
 * 창 목업**을 얹어 갈래를 눈으로 가른다. 목업은 빌드타임 SVG 문자열이다
 * (`ChatMockup`과 같은 수법) — 클라이언트 JS가 없고 Ctrl+F에도 안 걸릴 장식이라
 * `aria-hidden`이다. 뜻은 제목·부제가 진다.
 */
export type MockKind = 'browser' | 'vault' | 'chat'

export type ChoicePath = {
  href: string
  title: string
  desc: string
  badge?: string
  mock: MockKind
  steps: readonly string[]
}

/* 창틀 색만 light-dark()로 가른다. 선·바탕 톤은 ChatMockup에서 맞춘 값을 그대로 쓴다 */
const CHROME = `
  .cm-body{fill:light-dark(#fff,#16191c)}
  .cm-edge{fill:none;stroke:light-dark(#d8dce1,#333a42);stroke-width:1}
  .cm-bar{fill:light-dark(#f4f5f7,#1c2024)}
  .cm-dot{fill:light-dark(#cfd3d8,#3f464e)}
  .cm-chip{fill:light-dark(#e9ecf0,#262c33)}
  .cm-side{fill:light-dark(#f7f8fa,#1a1e23)}
  .cm-div{stroke:light-dark(#e6eaee,#2b323a);stroke-width:1}
  .cm-ln{fill:light-dark(#dfe3e8,#2f363d)}
  .cm-ln2{fill:light-dark(#c9ced5,#3a424a)}
  .cm-send{fill:light-dark(#111,#e6e9ec)}
  .cm-arrow{fill:none;stroke:light-dark(#fff,#16191c);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
`

/* 창 뼈대(둥근 몸통 + 헤더 + 점 셋) + 알파 그라데이션 하나. 안쪽만 갈아끼운다 */
function frame(id: string, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="100%" role="img" aria-hidden="true" focusable="false">
<style>${CHROME}</style>
<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="rgb(120 140 175)" stop-opacity="0.14"/>
<stop offset="1" stop-color="rgb(120 140 175)" stop-opacity="0"/>
</linearGradient></defs>
<clipPath id="${id}-clip"><rect width="320" height="160" rx="14"/></clipPath>
<g clip-path="url(#${id}-clip)">
<rect class="cm-body" width="320" height="160"/>
<rect class="cm-bar" width="320" height="28"/>
<circle class="cm-dot" cx="16" cy="14" r="3"/><circle class="cm-dot" cx="28" cy="14" r="3"/><circle class="cm-dot" cx="40" cy="14" r="3"/>
${inner}
</g>
<rect class="cm-edge" x="0.5" y="0.5" width="319" height="159" rx="14"/>
</svg>`
}

/* 웹에서 읽기 — 브라우저 주소칸 + 본문 몇 줄 */
const browser = frame(
  'cm-web',
  `
<rect class="cm-chip" x="60" y="8" width="200" height="12" rx="6"/>
<rect fill="url(#cm-web)" x="16" y="40" width="288" height="104" rx="8"/>
<rect class="cm-ln2" x="32" y="60" width="150" height="9" rx="4"/>
<rect class="cm-ln" x="32" y="82" width="256" height="7" rx="3"/>
<rect class="cm-ln" x="32" y="98" width="256" height="7" rx="3"/>
<rect class="cm-ln" x="32" y="114" width="196" height="7" rx="3"/>
`,
)

/* 내 컴퓨터(옵시디언) — 왼쪽 파일 목록 + 오른쪽 노트 */
const vault = frame(
  'cm-vault',
  `
<rect class="cm-side" x="0" y="28" width="104" height="132"/>
<line class="cm-div" x1="104" y1="28" x2="104" y2="160"/>
<rect class="cm-ln" x="16" y="46" width="64" height="7" rx="3"/>
<rect class="cm-ln" x="16" y="62" width="72" height="7" rx="3"/>
<rect class="cm-ln2" x="16" y="78" width="56" height="7" rx="3"/>
<rect class="cm-ln" x="16" y="94" width="68" height="7" rx="3"/>
<rect fill="url(#cm-vault)" x="120" y="40" width="184" height="104" rx="8"/>
<rect class="cm-ln2" x="132" y="58" width="120" height="9" rx="4"/>
<rect class="cm-ln" x="132" y="82" width="160" height="7" rx="3"/>
<rect class="cm-ln" x="132" y="98" width="160" height="7" rx="3"/>
<rect class="cm-ln" x="132" y="114" width="120" height="7" rx="3"/>
`,
)

/* AI에 연결 — 답 말풍선 + 입력칸 + 보내기 단추 (ChatMockup 축소판) */
const chat = frame(
  'cm-chat',
  `
<rect fill="url(#cm-chat)" x="16" y="40" width="288" height="70" rx="8"/>
<rect class="cm-chip" x="28" y="52" width="184" height="46" rx="12"/>
<rect class="cm-ln" x="40" y="64" width="150" height="6" rx="3"/>
<rect class="cm-ln" x="40" y="78" width="120" height="6" rx="3"/>
<rect class="cm-body" x="16" y="122" width="256" height="26" rx="8"/>
<rect class="cm-edge" x="16.5" y="122.5" width="255" height="25" rx="8"/>
<rect class="cm-ln" x="28" y="132" width="150" height="7" rx="3"/>
<rect class="cm-send" x="280" y="122" width="26" height="26" rx="8"/>
<path class="cm-arrow" d="M293 142v-12M287 136l6-6 6 6"/>
`,
)

const MOCK: Record<MockKind, string> = { browser, vault, chat }

export function ChoiceCards({ items }: { items: readonly ChoicePath[] }) {
  return (
    <Grid columns={{ minWidth: 260 }} gap={3}>
      {items.map((p) => (
        <ClickableCard key={p.href} href={p.href} label={p.title} padding={4}>
          <Stack direction="vertical" gap={1.5}>
            <div className="choice-mock" dangerouslySetInnerHTML={{ __html: MOCK[p.mock] }} />
            <Stack direction="vertical" gap={1}>
              <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                <Heading level={2}>{p.title}</Heading>
                {p.badge ? <Badge variant="neutral" label={p.badge} /> : null}
              </Stack>
              <Text size="sm" color="secondary">
                {p.desc}
              </Text>
              {p.steps.length ? (
                <Text size="sm" color="secondary">
                  {p.steps.map((s, i) => `${i + 1}. ${navLabel(s)}`).join('  →  ')}
                </Text>
              ) : null}
            </Stack>
          </Stack>
        </ClickableCard>
      ))}
    </Grid>
  )
}
