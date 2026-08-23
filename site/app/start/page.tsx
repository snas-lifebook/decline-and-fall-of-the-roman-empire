import { Stack, Heading, Text, Divider, List, ListItem } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { ChoiceCards, type ChoicePath } from '../../components/ChoiceCards'
import { navFind } from '../../lib/nav'
import { loadDoc } from '../../lib/doc'
import { pageMeta } from '../../lib/meta'

/**
 * 시작하기 랜딩.
 *
 * **앞 판은 여섯 장을 번호 매긴 목록 하나였다.** 그러면 읽는 사람이 여섯을 다 밟아야
 * 하는 것으로 읽는다. 실제로는 갈래가 셋이고, 웹에서 읽기만 할 사람은 **한 단계도
 * 밟을 필요가 없다.** 그 사실이 경고 상자 안에 묻혀 있었다.
 *
 * `docs.claude.com` 한국어판이 같은 문제를 푸는 방식을 그대로 가져왔다 — 「Claude
 * Code는 터미널, IDE 확장 프로그램, 데스크톱 앱 및 웹을 포함한 여러 환경에서
 * 실행됩니다. **아래 탭에서 하나를 선택하여 시작하세요.**」 갈래가 있다는 것을 먼저
 * 말하고 고르게 한다.
 *
 * 탭이 아니라 카드를 쓴 이유는 astryx `TabList`가 고른 상태를 들고 있어야 해서
 * 클라이언트 컴포넌트가 되기 때문이다. 갈래가 셋뿐이라 카드로 충분하고, 허브가 이미
 * 같은 문법(`ClickableCard`)을 쓴다 — 화면마다 고르는 방식이 다르면 그게 헷갈림이다.
 */

/**
 * 갈래 셋. **순서가 곧 사람 수다** — 웹에서 읽기만 하는 사람이 가장 많고,
 * AI까지 물리는 사람이 가장 적다.
 *
 * `steps`는 주소만 적는다. 이름은 `navLabel()`이 `lib/nav.ts`에서 끌어온다 —
 * 이름을 두 군데 적으면 바뀔 때 한쪽이 낡는다.
 */
const PATHS: readonly ChoicePath[] = [
  {
    href: '/read',
    title: '웹에서 보기만 하기',
    desc: '설치도 로그인도 없습니다. 지금 바로 읽으실 수 있습니다.',
    badge: '설치 없이 바로',
    mock: 'browser',
    steps: [],
  },
  {
    href: '/start/install',
    title: '자료를 내 컴퓨터에 두기',
    desc: '옵시디언으로 열면 인물 노트와 지도를 함께 볼 수 있습니다.',
    badge: '인물 노트·지도까지',
    mock: 'vault',
    steps: ['/start/install', '/start/open', '/start/plugins'],
  },
  {
    href: '/start/ai',
    title: 'AI에 물려 쓰기',
    desc: '받아둔 자료를 쓰시던 ChatGPT나 Claude에 붙여 씁니다.',
    badge: '쓰던 AI에 연결',
    mock: 'chat',
    steps: ['/start/install', '/start/ai', '/use'],
  },
]

/**
 * 마크다운이 없는 장의 한 줄. **「작업 공간」은 카드 화면이 되면서
 * `content/start/links.md`를 지웠다** — 프론트매터 한 줄을 읽으려고 산문을 남겨두면
 * 카드와 두 벌로 갈라진다(헌장 17 후단). 활용하기 랜딩이 쓰는 것과 같은 방식이다.
 */
const ABOUT: Record<string, string> = {
  '/start/links': '편데 운영에 쓰는 바로가기 모음입니다. 흩어져 있던 곳을 여기서 바로 찾아가시면 됩니다.',
  '/start/ai': '쓰시던 ChatGPT나 Claude에 이 자료를 물려둡니다. 매번 붙여넣지 않아도 됩니다.',
}

export const metadata = pageMeta('시작하기')

export default function Start() {
  const pages = navFind('/start')?.children ?? []

  return (
    <Shell path="/start" where="시작하기">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>시작하기</Heading>
        <Text size="lg" color="secondary">
          자료를 어떻게 쓰실지에 따라 밟는 단계가 다릅니다. 아래에서 하나를 고르세요.
        </Text>
      </Stack>

      <Divider />

      {/* learn.chatgpt 퀵스타트식 — 카드 맨 위 창 목업 + 배지로 갈래를 눈으로 가른다 (#15) */}
      <ChoiceCards items={PATHS} />

      <Stack direction="vertical" gap={1.5} as="section" id="all">
        <Heading level={2}>전체 순서</Heading>
        <Text color="secondary">
          위 갈래와 상관없이 여섯 장 전부를 순서대로 보실 수도 있습니다.
        </Text>
        <List listStyle="decimal" density="spacious" hasDividers>
          {pages.map((p) => (
            <ListItem
              key={p.href}
              label={p.title}
              description={ABOUT[p.href] ?? loadDoc(p.href).summary}
              href={p.href}
            />
          ))}
        </List>
      </Stack>
    </Shell>
  )
}
