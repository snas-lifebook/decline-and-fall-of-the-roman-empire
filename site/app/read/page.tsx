import { Stack, Heading, Text, Divider, Badge, List, ListItem } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { pointList } from '../../lib/points'
import { pointLead } from '../../lib/text/point'
import { pageMeta } from '../../lib/meta'

/**
 * 읽기 랜딩 — 30포인트를 고르는 목록이다(PLAN 「섹션 랜딩」).
 *
 * 번호를 앞에 세운 이유: 발표를 맡은 사람은 「내 포인트가 몇 번」으로 기억한다.
 * 설명은 각 본문 맨 위의 한 줄을 그대로 가져온다 — 두 군데에 적으면 어긋난다.
 */

const two = (n: number) => String(n).padStart(2, '0')

export const metadata = pageMeta('읽기')

export default function Read() {
  return (
    <Shell path="/read" where="읽기">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>읽기</Heading>
        <Text size="lg" color="secondary">
          본문을 여기서 그대로 보실 수 있습니다. 내려받으실 것도 로그인하실 것도 없습니다.
        </Text>
        {/* 어느 판본을 읽고 있는지 화면에 남긴다. 원전이 따로 있다는 뜻이기도 하다 */}
        <Stack direction="horizontal" gap={1}>
          <Badge variant="neutral" label="30포인트 편역본" />
        </Stack>
      </Stack>

      <Divider />

      <List density="spacious" hasDividers>
        {pointList().map((p) => (
          <ListItem
            key={p.n}
            label={`${two(p.n)} ${p.title}`}
            description={pointLead(p.n) || undefined}
            href={`/read/point/${p.n}`}
          />
        ))}
      </List>
    </Shell>
  )
}
