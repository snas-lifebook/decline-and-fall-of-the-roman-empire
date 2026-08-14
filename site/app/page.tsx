import { Stack, Heading, Text, Card, ClickableCard, Divider } from '@astryxdesign/core'
import { FeedbackBox } from '../components/FeedbackBox'
import { dataDate } from '../lib/datadate'

/**
 * 목적 허브. `/`는 콘텐츠 페이지가 아니라 **갈림길**이다.
 *
 * 카드를 독자층이 아니라 **동사**로 가른 이유: 사람은 자기가 몇 층 독자인지보다
 * 지금 뭘 하려는지를 훨씬 잘 안다 (SPEC 「진입 구조」).
 *
 * 초보자 규율 셋이 이 화면에 걸린다.
 *   1. 처음 온 사람에게 **길 하나만** 준다. 다섯 갈래는 그다음이다
 *   2. **되는 것을 먼저**, 준비 중인 것을 나중에. 절반이 죽은 첫인상을 주지 않는다
 *   3. 설명은 기능이 아니라 **상황**으로 쓴다 — "언제 여기 오나"
 */

// 첫 카드가 이미 `/download`로 보낸다. 여기 또 두면 초보자는 둘이 다른 곳인 줄 안다
const READY = [
  {
    href: '/use',
    title: '활용하기',
    desc: 'AI 없이 되는 것부터, 쓰던 AI에 물리는 법까지',
  },
  {
    href: '/start',
    title: '시작하기',
    desc: '자료를 처음 받으시거나, 갱신을 못 따라가고 계실 때',
  },
] as const

const COMING = [
  { title: '읽기', desc: '편역본 30포인트 · 기번 원전 · 한영 대조' },
  { title: '찾아보기', desc: '인물·장소·사건 644개와 그 관계. 가계도도 여기' },
] as const

export default function Home() {
  return (
    <Stack direction="vertical" gap={6} padding={6} maxWidth={960}>
      <Stack direction="vertical" gap={1}>
        <Heading level={1}>산스 인생책 로마쇠망사 자료실</Heading>
        <Text color="secondary">
          발표와 토론에 쓰는 자료를 모아둔 곳입니다. 설치도 로그인도 필요 없습니다.
        </Text>
      </Stack>

      {/* 처음 온 사람에게는 길을 하나만 준다. 선택지가 셋이면 초보자는 멈춘다 */}
      <ClickableCard href="/download" label="발표 준비 시작하기" width="100%" padding={4}>
        <Stack direction="vertical" gap={0.5}>
          <Text size="sm" color="secondary">
            처음이시면 여기부터
          </Text>
          <Heading level={2}>맡은 포인트에 누가 나오는지 봅니다</Heading>
          <Text size="sm" color="secondary">
            포인트를 고르면 인물·지명 목록이 나옵니다. 그대로 복사해서 시트에 붙여넣으면 발표 대본
            표가 됩니다.
          </Text>
        </Stack>
      </ClickableCard>

      <Stack direction="vertical" gap={3}>
        <Text size="sm" color="secondary">
          찾는 것이 따로 있으시면
        </Text>
        <Stack direction="horizontal" gap={3} wrap="wrap">
          {READY.map((c) => (
            <ClickableCard key={c.href} href={c.href} label={c.title} width={296} padding={4}>
              <Stack direction="vertical" gap={0.5}>
                <Heading level={2}>{c.title}</Heading>
                <Text size="sm" color="secondary">
                  {c.desc}
                </Text>
              </Stack>
            </ClickableCard>
          ))}
        </Stack>
      </Stack>

      <Divider />

      {/* 아직 없는 곳으로 보내지 않는다. 404보다 「준비 중」이 정직하고, 아래에 둔다 */}
      <Stack direction="vertical" gap={3}>
        <Text size="sm" color="secondary">
          아직 만드는 중입니다
        </Text>
        <Stack direction="horizontal" gap={3} wrap="wrap">
          {COMING.map((c) => (
            <Card key={c.title} width={296} padding={4} variant="muted">
              <Stack direction="vertical" gap={0.5}>
                <Text weight="semibold" color="disabled">
                  {c.title}
                </Text>
                <Text size="sm" color="disabled">
                  {c.desc}
                </Text>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>

      <Divider />

      <Stack direction="horizontal" gap={3} vAlign="center" wrap="wrap">
        <Text size="sm" color="secondary">
          데이터 기준일 {dataDate()}
        </Text>
        <FeedbackBox where="첫 화면" />
      </Stack>
    </Stack>
  )
}
