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
  Collapsible,
  Markdown,
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
export function SkillCard({ s, body }: { s: Skill; body?: string }) {
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

        {/*
          **`RecipeCard`와 같은 삼단, 같은 라벨.** 두 화면에서 같은 단계를 다른
          이름으로 부르면 삼단으로 나눈 값이 사라진다. 순서도 사례 쪽과 맞춘다 —
          넣는 것 → 시키는 것 → 나오는 것. 앞 판은 「나오는 것」이 「시키는 것」보다
          위에 있어서 읽는 순서가 실제 순서와 어긋났다.
        */}
        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap">
            <Badge variant="neutral" label="1 넣는 것" />
            <Text size="sm">{s.input}</Text>
          </Stack>

          <Stack direction="vertical" gap={1}>
            <Stack direction="horizontal">
              <Badge variant="neutral" label="2 시키는 것" />
            </Stack>
            <CodeBlock code={s.say} title="이렇게 말하면 됩니다" hasCopyButton />
          </Stack>

          <Stack direction="vertical" gap={1}>
            <Stack direction="horizontal">
              <Badge variant="neutral" label="3 나오는 것" />
            </Stack>
            <Text>{s.output}</Text>
          </Stack>
        </Stack>

        {/* 원문 여덟 벌의 「하지 말 것」이 이 절차서들의 존재 이유다. 앞 판에서 잘렸다 */}
        {s.caution ? (
          <MetadataList columns="single" label={{ position: 'start', width: 88 }}>
            <MetadataListItem label="조심할 것">{s.caution}</MetadataListItem>
          </MetadataList>
        ) : null}

        {/* 카드는 요약, 여기는 절차서 그 자체다. 빌드 때 SKILL.md에서 읽어 온다(#18) */}
        {body ? (
          <Collapsible defaultIsOpen={false} trigger="이 절차서 전문 보기">
            <Markdown>{body}</Markdown>
          </Collapsible>
        ) : null}
      </Stack>
    </Card>
  )
}
