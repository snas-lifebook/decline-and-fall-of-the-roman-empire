import { Stack, Heading, Text, ClickableCard } from '@astryxdesign/core'

/**
 * 목적 허브. `/`는 콘텐츠 페이지가 아니라 **갈림길**이다.
 *
 * 카드를 독자층이 아니라 **동사**로 가른 이유: 사람은 자기가 몇 층 독자인지보다
 * 지금 뭘 하려는지를 훨씬 잘 안다 (SPEC 「진입 구조」).
 *
 * 「활용하기」가 `/ai`가 아니라 `/use`인 이유: 그 자리 쓰임의 절반이 AI를
 * 안 쓰는 것이다 (USAGE A). 주소는 무엇인지를 말해야 한다 (CONSTITUTION 13).
 */

const CARDS = [
  { href: '/read', title: '읽기', desc: '편역본 30포인트 · 기번 원전 · 한영 대조' },
  { href: '/objects', title: '찾아보기', desc: '인물·장소·사건 644개와 그 관계. 가계도도 여기' },
  { href: '/download', title: '가져가기', desc: '내 포인트만 골라 시트로. 클립보드 복사도' },
  { href: '/use', title: '활용하기', desc: 'AI 없이 되는 것부터, AI에 물리는 법까지' },
  { href: '/start', title: '시작하기', desc: '설치 · 갱신 받는 법 · 작업 공간 링크' },
] as const

export default function Home() {
  return (
    <Stack direction="vertical" gap={6} padding={6} maxWidth={960}>
      <Stack direction="vertical" gap={1}>
        <Heading level={1}>산스 인생책 로마쇠망사 자료실</Heading>
        <Text color="secondary">
          기번 『로마제국쇠망사』 편역본과 거기서 뽑은 지식그래프를 편데 운영팀이 쓰는 자리입니다.
          설치도 로그인도 없습니다.
        </Text>
      </Stack>

      <Stack direction="horizontal" gap={3} wrap="wrap">
        {CARDS.map((c) => (
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

      <Text size="sm" color="secondary">
        데이터 기준일은 각 화면 하단에 있습니다. 틀린 것을 보면 그 자리에서 한 줄 남겨주세요.
      </Text>
    </Stack>
  )
}
