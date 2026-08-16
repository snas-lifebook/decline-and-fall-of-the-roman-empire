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
import type { Recipe } from '../lib/recipes'

/**
 * 사례 한 건.
 *
 * **산문이 아니라 카드다.** 앞 판은 마크다운으로 「**언제** 발표 전에 …」처럼
 * 라벨을 본문과 같은 줄에 굵게 붙였는데, 그러면 라벨과 내용이 한 문단으로 흘러
 * 눈이 어디를 잡을지 모른다. River가 그걸 보고 반려했다.
 *
 * 고친 것 넷.
 *   1. **카드로 가른다** — 사례의 시작과 끝이 눈에 보인다
 *   2. **라벨을 왼쪽 칸으로 뺀다**(`MetadataList`) — 훑으면 「나오는 것」만 읽을 수 있다
 *   3. **배지로 먼저 답한다** — "내가 지금 할 수 있나"가 제목 옆에서 끝난다
 *   4. **프롬프트를 위로 올린다** — 사람이 원하는 건 복사할 상자다
 */
export function RecipeCard({ r }: { r: Recipe }) {
  return (
    <Card padding={4}>
      <Stack direction="vertical" gap={2}>
        <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap" justify="between">
          <Heading level={3}>{r.title}</Heading>
          {/* 「내가 할 수 있는 건가」에 제목 옆에서 답한다 */}
          <Badge variant="neutral" label={r.needs === 'web' ? '웹만으로' : '자료 연결 필요'} />
        </Stack>

        <Text color="secondary">{r.when}</Text>

        <Divider />

        <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap">
          <Text size="sm" color="secondary">
            재료
          </Text>
          <Text size="sm">
            <a href={r.materialHref}>{r.material}</a>
          </Text>
        </Stack>

        {/* 「준비 범위부터 잡기」는 표를 시트에 붙이면 끝이라 프롬프트가 없다. 빈 상자를 안 그린다 */}
        {r.prompt ? <CodeBlock code={r.prompt} title="AI 창에 붙여넣기" hasCopyButton /> : null}

        <MetadataList columns="single" label={{ position: 'start', width: 88 }}>
          <MetadataListItem label="나오는 것">{r.result}</MetadataListItem>
          {r.caution ? (
            <MetadataListItem label="조심할 것">{r.caution}</MetadataListItem>
          ) : null}
        </MetadataList>
      </Stack>
    </Card>
  )
}
