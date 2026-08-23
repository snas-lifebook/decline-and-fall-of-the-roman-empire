import {
  Stack,
  Heading,
  Text,
  Divider,
  Breadcrumbs,
  BreadcrumbItem,
} from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { PlatformSteps, type Platform } from '../../../components/PlatformSteps'
import { linkById } from '../../../lib/links'
import { navCrumbs, navSteps } from '../../../lib/nav'
import { pageMeta } from '../../../lib/meta'

/**
 * AI에 자료 연결하기 — 마크다운이 아니라 토글 절차다.
 *
 * 앞 판은 `content/start/ai.md`가 ChatGPT 5단계와 Claude 4단계를 세로로 쌓았다.
 * 쓰는 앱은 보통 하나인데 두 절차가 다 펼쳐져 있으니 안 쓰는 쪽을 스크롤로 지나쳐야
 * 했다. learn.chatgpt·애플처럼 **알약 토글로 하나만 보여준다**(`PlatformSteps`).
 * 절차 밖의 산문과 링크는 여기 서버 컴포넌트에 남는다 — 토글만 클라이언트다.
 */
export const metadata = pageMeta('AI에 자료 연결하기')

/** 링크는 주소를 손으로 안 적고 `lib/links.ts`의 id로만 부른다. */
const repo = linkById('repo').href
const repoSkills = linkById('repo-skills').href

const PLATFORMS: Platform[] = [
  {
    id: 'chatgpt',
    label: 'ChatGPT 데스크탑',
    steps: [
      {
        text: 'ChatGPT 데스크탑 앱을 엽니다',
        img: '/guide/ai/chatgpt-01-open-app.webp',
        alt: 'ChatGPT 데스크탑 앱을 연 화면',
      },
      {
        text: '프로젝트를 만듭니다',
        img: '/guide/ai/chatgpt-02-create-project.webp',
        alt: 'ChatGPT에서 새 프로젝트를 만드는 화면',
      },
      {
        text: '내 컴퓨터의 폴더를 쓰는 프로젝트로 만듭니다',
        img: '/guide/ai/chatgpt-03-local-project.webp',
        alt: 'ChatGPT에서 로컬 프로젝트를 고르는 화면',
      },
      {
        text: '앞에서 만들어둔 폴더를 불러옵니다',
        img: '/guide/ai/chatgpt-04-load-folder.webp',
        alt: 'ChatGPT에서 폴더를 불러오는 화면',
      },
      {
        text: (
          <>
            준비가 끝났습니다. 이제 말로 시키시면 됩니다. 폴더가 비어 있다면 여기서 복사해둔{' '}
            <a href={repo} target="_blank" rel="noreferrer">
              깃허브 주소
            </a>
            를 주며 자료를 받아달라고 하시면 됩니다.
          </>
        ),
        img: '/guide/ai/chatgpt-05-send-prompt.webp',
        alt: 'ChatGPT에 프롬프트를 보내는 화면',
      },
    ],
  },
  {
    id: 'claude',
    label: 'Claude 데스크탑',
    steps: [
      {
        text: 'Claude 데스크탑 앱을 엽니다',
        img: '/guide/ai/claude-01-open-app.webp',
        alt: 'Claude 데스크탑 앱을 연 화면',
      },
      {
        text: '프로젝트에 폴더를 추가하고 불러옵니다',
        img: '/guide/ai/claude-02-add-folder.webp',
        alt: 'Claude에서 프로젝트 폴더를 추가하는 화면',
      },
      {
        text: '파일 편집 권한을 허용합니다',
        img: '/guide/ai/claude-03-allow-edit.webp',
        alt: 'Claude에서 파일 편집 권한을 허용하는 화면',
      },
      {
        text: '준비가 끝났습니다',
        img: '/guide/ai/claude-04-send-prompt.webp',
        alt: 'Claude에 프롬프트를 보내는 화면',
      },
    ],
  },
]

export default function AiConnect() {
  const crumbs = navCrumbs('/start/ai')
  const { prev, next } = navSteps('/start/ai')

  return (
    <Shell path="/start/ai" where="AI에 자료 연결하기">
      <Breadcrumbs variant="supporting">
        <BreadcrumbItem href="/">자료실</BreadcrumbItem>
        {crumbs.map((c, i) => (
          <BreadcrumbItem key={c.href} href={c.href} isCurrent={i === crumbs.length - 1}>
            {c.title}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>

      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>AI에 자료 연결하기</Heading>
        <Text size="lg" color="secondary">
          쓰시던 ChatGPT나 Claude에 이 자료를 물려둡니다. 매번 붙여넣지 않아도 됩니다.
        </Text>
      </Stack>

      <Divider />

      <Text color="secondary">
        한 번 연결해두면 &ldquo;포인트 3에 나오는 인물 정리해줘&rdquo; 같은 말이 그냥 통합니다.
        자료를 매번 붙여넣을 필요가 없어집니다.
      </Text>
      <Text color="secondary">
        <strong>안 하셔도 됩니다.</strong> 본문과 인물 목록은 이 사이트에서 그냥 보실 수 있고, 한
        페이지 분량은 어느 화면에서든 「이 페이지 복사」 버튼으로 AI에 넘기실 수 있습니다.
      </Text>

      <Stack direction="vertical" gap={2} as="section">
        <Heading level={2}>빈 폴더만 만들고 오셨다면</Heading>
        <Text color="secondary">
          앞에서 ① 주소를 복사하는 쪽을 고르셨다면, 폴더는 만들었지만 아직 비어 있을 겁니다. 아래
          절차가 그 폴더에 자료를 채워 넣는 방법입니다. 마지막 단계에서 복사해둔 주소를 쓰게
          됩니다. ② ZIP으로 받으신 분은 폴더에 자료가 이미 있으니, 아래는 연결만 하시면 됩니다.
        </Text>
      </Stack>

      <Stack direction="vertical" gap={3} as="section">
        <Heading level={2}>쓰시는 앱에서 따라 하기</Heading>
        <PlatformSteps platforms={PLATFORMS} />
      </Stack>

      <Stack direction="vertical" gap={2} as="section">
        <Heading level={2}>무엇을 물어보면 되나</Heading>
        <Text color="secondary">
          무슨 말을 걸어야 할지 모르시겠으면 <a href="/use">활용하기</a>에 그대로 복사해서 쓰실
          프롬프트가 모여 있습니다. 자료 안에는 AI에게 시킬 일을 절차로 적어둔{' '}
          <a href={repoSkills} target="_blank" rel="noreferrer">
            AI 스킬 정의
          </a>
          도 들어 있습니다.
        </Text>
      </Stack>

      {/* 시작하기 여섯 장은 차례대로 밟는 순서다 */}
      <Stack direction="horizontal" gap={3} justify="between" wrap="wrap">
        <Text size="sm" color="secondary">
          {prev ? <a href={prev.href}>← {prev.title}</a> : null}
        </Text>
        <Text size="sm" color="secondary">
          {next ? <a href={next.href}>{next.title} →</a> : null}
        </Text>
      </Stack>
    </Shell>
  )
}
