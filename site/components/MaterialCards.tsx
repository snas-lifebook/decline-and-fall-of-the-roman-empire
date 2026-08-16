import {
  Stack,
  Heading,
  Text,
  Badge,
  Divider,
  ClickableCard,
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core'
import { MATERIALS } from '../lib/materials'

/**
 * AI에게 줄 재료 셋. 「무엇을 AI에 주나」와 「우수 사례」가 같이 쓴다.
 *
 * 앞 판은 재료 화면에서 네 칸짜리 마크다운 표였다. 「무엇이 담기나」 칸에 긴
 * 문장이 들어가 표가 무너졌고, 정작 사람이 먼저 알고 싶은 「언제 쓰나」는 다른
 * 절에 따로 있어서 표와 목록을 번갈아 봐야 했다. 카드 하나에 합친다.
 *
 * 누르면 그 재료를 집으러 가는 화면으로 간다 — 읽고 끝나는 카드가 아니다.
 *
 * **가로 격자가 아니라 세로다.** 본문 칸이 760px이라 셋을 나란히 놓으면 2+1로
 * 어긋나게 접히고, 폭을 줄이면 한국어 두 문장이 여덟 줄로 흐른다. 게다가 이 섹션의
 * 나머지 카드(사례·스킬·함정)가 전부 세로 한 벌씩이라 격자만 리듬이 달랐다.
 */
export function MaterialCards() {
  return (
    <Stack direction="vertical" gap={3}>
      {MATERIALS.map((m) => (
        <ClickableCard key={m.id} href={m.href} label={m.title} padding={4}>
          <Stack direction="vertical" gap={1.5}>
            <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap" justify="between">
              <Heading level={3}>{m.title}</Heading>
              {/* 「내 AI 창에 들어가나」는 고르기 전에 끝나야 한다 */}
              <Badge variant="neutral" label={m.size} />
            </Stack>
            {/* 고르는 기준이라 맨 위다 */}
            <Text weight="semibold">{m.when}</Text>
            <Divider />
            <MetadataList columns="single" label={{ position: 'start', width: 88 }}>
              <MetadataListItem label="어디서">{m.how}</MetadataListItem>
              <MetadataListItem label="담기는 것">{m.holds}</MetadataListItem>
            </MetadataList>
          </Stack>
        </ClickableCard>
      ))}
    </Stack>
  )
}
