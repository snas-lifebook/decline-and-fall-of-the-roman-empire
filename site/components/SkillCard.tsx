import {
  Stack,
  Heading,
  Text,
  Badge,
  Card,
  Divider,
  CodeBlock,
  MetadataList,
  MetadataListItem,
} from '@astryxdesign/core'
import type { Skill } from '../lib/skills'

/**
 * 스킬 한 벌. `RecipeCard`의 형제다.
 *
 * 앞 판은 마크다운으로 「무엇을 하나: …」 불릿 넷을 늘어놓았고, 영문 슬러그
 * 다섯이 표 한 칸에 뭉쳐 세 줄로 흘렀다. 무엇보다 **사람이 붙여넣을 말이 인라인
 * 코드라 복사 버튼이 없었다.**
 *
 * 셋을 고쳤다 — 제목은 한국어로 하고 코드 이름은 작게 옆에, 라벨은 왼쪽 칸으로,
 * 붙여넣을 말은 복사 버튼 달린 상자로.
 */
export function SkillCard({ s }: { s: Skill }) {
  return (
    <Card padding={4}>
      <Stack direction="vertical" gap={2}>
        <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap">
          <Heading level={3}>{s.title}</Heading>
          {/* 코드 이름은 대조할 때만 필요하다. 제목 자리를 뺏지 않는다 */}
          <Badge variant="neutral" label={s.id} />
        </Stack>

        <Text color="secondary">{s.does}</Text>

        <Divider />

        <MetadataList columns="single" label={{ position: 'start', width: 96 }}>
          <MetadataListItem label="무엇을 주나">{s.input}</MetadataListItem>
          <MetadataListItem label="무엇이 나오나">{s.output}</MetadataListItem>
        </MetadataList>

        <CodeBlock code={s.say} title="이렇게 말하면 됩니다" hasCopyButton />
      </Stack>
    </Card>
  )
}
