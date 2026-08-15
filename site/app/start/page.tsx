import { Stack, Heading, Text, Divider, List, ListItem, Banner } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { navFind } from '../../lib/nav'
import { loadDoc } from '../../lib/doc'

/**
 * 시작하기 랜딩 — 목록이지 설명 페이지가 아니다(PLAN 「섹션 랜딩」).
 *
 * 여섯 장의 순서가 곧 초보자가 밟는 순서다. 부제는 각 장의 프론트매터에서
 * 가져온다 — 두 군데에 적으면 어긋난다.
 */
export default function Start() {
  const pages = navFind('/start')?.children ?? []

  return (
    <Shell path="/start" where="시작하기">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>시작하기</Heading>
        <Text size="lg" color="secondary">
          자료를 처음 받으시나요? 위에서부터 차례대로 하시면 됩니다.
        </Text>
      </Stack>

      <Divider />

      <Banner
        status="info"
        title="읽기만 하실 거면 아무것도 안 하셔도 됩니다"
        description="설치는 자료를 내 컴퓨터에 두고 AI에 물리려는 분을 위한 것입니다. 본문과 인물 목록은 이 사이트에서 그냥 보실 수 있습니다."
      />

      <List listStyle="decimal" density="spacious" hasDividers>
        {pages.map((p) => (
          <ListItem
            key={p.href}
            label={p.title}
            description={loadDoc(p.href).summary}
            href={p.href}
          />
        ))}
      </List>
    </Shell>
  )
}
