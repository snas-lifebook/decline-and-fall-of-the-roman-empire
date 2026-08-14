import {
  Stack,
  Heading,
  Text,
  Card,
  ClickableCard,
  Divider,
  Banner,
  List,
  ListItem,
  Code,
  Link,
} from '@astryxdesign/core'
import { Page } from '../../components/SiteChrome'
import { WORKSPACE_LINKS, ZIP_URL } from '../../lib/links'

/**
 * 시작하기 — 설치 · 갱신 받는 법 · 작업 공간.
 *
 * **스크린샷은 여기로 옮기지 않는다.** 옵시디언 UI가 바뀌면 전부 다시 찍어야 하고,
 * 그림은 피그마 가이드 한 곳에서만 관리한다. 이 화면은 글로 된 절차만 싣는다.
 *
 * 절차의 정본은 피그마 「옵시디언 설치 가이드」(page `79:2`) 3개 섹션이다 —
 * 가 `79-192` 프로그램 설치 / 나 `79-220` 폴더 연결·깃허브 동기화 / 다 `81-34` 환경 설정.
 * 아래 단계 문구는 거기서 옮겨 적었다.
 */

/** 피그마 링크는 `links.ts`가 단독 관리한다. 주소를 여기 다시 적지 않고 골라 쓴다 */
const FIGMA = WORKSPACE_LINKS.find((l) => l.href.includes('figma.com'))

const INSTALL: { stage: string; steps: { label: string; desc?: string }[] }[] = [
  {
    stage: '먼저 프로그램과 자료를 받습니다',
    steps: [
      { label: '검색창에 ‘Obsidian’을 검색합니다' },
      {
        label: '운영체제에 맞는 설치 파일을 내려받습니다',
        desc: '윈도우와 맥 파일이 따로 있습니다.',
      },
      { label: '주소창에 자료실 깃허브 주소를 넣습니다' },
      {
        label: '‘Code’ 버튼을 눌러 ① 주소를 복사하거나 ② ZIP 파일을 내려받습니다',
        desc: '둘 중 하나만 하시면 됩니다. 깃이 익숙하지 않으면 ②가 편합니다.',
      },
    ],
  },
  {
    stage: '받은 자료를 옵시디언에 연결합니다',
    steps: [
      { label: '② ZIP을 받았다면 압축을 풉니다' },
      { label: '① 주소를 복사했다면 빈 폴더를 하나 만들고 거기에 자료를 받습니다' },
      {
        label: '옵시디언에서 그 폴더를 볼트로 엽니다',
        desc: '볼트는 옵시디언이 폴더를 부르는 이름입니다. 이미 산업스터디 볼트를 쓰고 계시면 그 안 Books/로마제국쇠망사/ 가 같은 자료라 그대로 열면 됩니다.',
      },
    ],
  },
  {
    stage: '플러그인 두 개를 켭니다',
    steps: [
      { label: '설정창으로 이동합니다' },
      { label: '커뮤니티 플러그인으로 이동합니다' },
      { label: '‘제한 모드 종료’를 누릅니다' },
      { label: '커뮤니티 플러그인에서 ‘탐색’을 누릅니다' },
      { label: '‘Dataview’를 검색합니다' },
      { label: '‘설치’를 누릅니다' },
      { label: '‘활성화’를 누릅니다' },
      { label: '‘Leaflet’도 같은 방식으로 진행합니다' },
      { label: '설치된 플러그인과 최종 화면을 확인합니다' },
    ],
  },
]

const UPDATE = [
  {
    title: 'ZIP 다시 받기',
    who: '아무것도 깔지 않고',
    desc: '받은 폴더를 새 것으로 바꾸면 끝입니다. 가장 간단하고, 대부분 이걸로 충분합니다.',
    href: ZIP_URL,
  },
  {
    title: 'Obsidian Git 플러그인',
    who: '옵시디언 안에서 버튼으로',
    desc: '커뮤니티 플러그인에서 ‘Obsidian Git’을 Dataview와 같은 방식으로 설치하면, 옵시디언을 켤 때마다 바뀐 것만 받아옵니다.',
  },
  {
    title: '터미널',
    who: '이미 깃허브에서 받아두셨다면',
    desc: '터미널이 익숙하면 이 한 줄이면 됩니다.',
    code: 'git pull',
  },
]

export default function Start() {
  const perSession = WORKSPACE_LINKS.filter((l) => l.perSession)
  const always = WORKSPACE_LINKS.filter((l) => !l.perSession)

  return (
    <Page where="시작하기" path="/start">
      <Stack direction="vertical" gap={1}>
        <Heading level={1}>시작하기</Heading>
        <Text color="secondary">
          자료를 처음 받으시나요? 여기부터 하시면 됩니다. 읽기만 하실 거면 아무것도 안 하셔도
          됩니다.
        </Text>
      </Stack>

      <Divider />

      <Stack direction="vertical" gap={4}>
        <Stack direction="vertical" gap={1}>
          <Heading level={2}>옵시디언에 자료 열기</Heading>
          <Text size="sm" color="secondary">
            화면 스크린샷은 피그마 가이드에 있습니다. 옵시디언 화면은 버전에 따라 조금씩 달라져서,
            그림은 한 곳에서만 관리합니다.
          </Text>
        </Stack>

        {INSTALL.map((group) => (
          <List
            key={group.stage}
            listStyle="decimal"
            density="compact"
            header={<Text weight="semibold">{group.stage}</Text>}
          >
            {group.steps.map((s) => (
              <ListItem key={s.label} label={s.label} description={s.desc} />
            ))}
          </List>
        ))}

        {/* 막혔을 때 나가는 문. 사람 탓으로 들리지 않게 「흔한 일」을 붙인다 */}
        <Text size="sm" color="secondary">
          여기서 막히면 텔레그램에 물어보세요. 흔한 일입니다.
        </Text>

        <Banner
          status="info"
          title="플러그인을 켜지 않으면"
          description="목록이 자동으로 그려지지 않고 지도가 뜨지 않습니다. 글 자체는 그대로 읽히니 급하지 않으면 나중에 하셔도 됩니다."
        />

        {FIGMA ? (
          <ClickableCard
            label={FIGMA.title}
            href={FIGMA.href}
            target="_blank"
            padding={4}
            maxWidth={520}
          >
            <Stack direction="vertical" gap={0.5}>
              <Text weight="semibold">단계별 화면 보기</Text>
              <Text size="sm" color="secondary">
                {FIGMA.desc}
              </Text>
            </Stack>
          </ClickableCard>
        ) : null}
      </Stack>

      <Divider />

      {/* 초보자가 제일 무서워하는 자리다. 절차보다 「뭐가 좋아지는지」를 먼저 놓는다 */}
      <Stack direction="vertical" gap={3}>
        <Stack direction="vertical" gap={1}>
          <Heading level={2}>AI에 자료 연결하기</Heading>
          <Text size="sm" color="secondary">
            연결해두면 &ldquo;포인트 3 인물 정리해줘&rdquo; 같은 말이 통합니다. 자료를 매번 붙여넣지
            않아도 됩니다.
          </Text>
        </Stack>

        <List listStyle="decimal" density="compact">
          <ListItem
            label="ChatGPT 데스크탑"
            description="앱을 열고 프로젝트를 만든 다음, 위에서 받은 폴더를 불러옵니다. 그다음부터는 그냥 말로 물어보시면 됩니다."
          />
          <ListItem
            label="Claude 데스크탑"
            description="앱을 열고 프로젝트에 폴더를 추가한 뒤, 파일 편집 권한을 허용합니다. 나머지는 같습니다."
          />
        </List>

        <Text size="sm" color="secondary">
          두 앱 모두 화면별 스크린샷이 피그마 가이드에 있습니다. 안 쓰셔도 자료를 보는 데는 지장이
          없습니다.
        </Text>
      </Stack>

      <Divider />

      <Stack direction="vertical" gap={3}>
        <Stack direction="vertical" gap={1}>
          <Heading level={2}>갱신 받는 법</Heading>
          <Text size="sm" color="secondary">
            자료는 계속 고쳐지고 늘어납니다. 셋 중 편한 것 하나만 쓰시면 됩니다.
          </Text>
        </Stack>

        <Stack direction="horizontal" gap={3} wrap="wrap">
          {UPDATE.map((u) => (
            <Card key={u.title} width={296} padding={4}>
              <Stack direction="vertical" gap={1}>
                <Stack direction="vertical" gap={0.5}>
                  <Text weight="semibold">{u.title}</Text>
                  <Text size="sm" color="secondary">
                    {u.who}
                  </Text>
                </Stack>
                <Text size="sm">{u.desc}</Text>
                {u.code ? <Code>{u.code}</Code> : null}
                {u.href ? (
                  <Link href={u.href} size="sm" isExternalLink>
                    ZIP으로 받기 (가장 쉬움)
                  </Link>
                ) : null}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>

      <Divider />

      <Stack direction="vertical" gap={3}>
        <Stack direction="vertical" gap={1}>
          <Heading level={2}>작업 공간</Heading>
          <Text size="sm" color="secondary">
            편데 운영에 쓰는 바깥 자리들입니다.
          </Text>
        </Stack>

        {[
          { label: '01회차', links: perSession },
          { label: '상시', links: always },
        ].map((g) => (
          <Stack key={g.label} direction="vertical" gap={1.5}>
            <Text size="sm" color="secondary">
              {g.label}
            </Text>
            <Stack direction="horizontal" gap={3} wrap="wrap">
              {g.links.map((l) => (
                <ClickableCard
                  key={l.href}
                  label={l.title}
                  href={l.href}
                  target="_blank"
                  width={296}
                  padding={4}
                >
                  <Stack direction="vertical" gap={0.5}>
                    <Text weight="semibold">{l.title}</Text>
                    <Text size="sm" color="secondary">
                      {l.desc}
                    </Text>
                  </Stack>
                </ClickableCard>
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Page>
  )
}
