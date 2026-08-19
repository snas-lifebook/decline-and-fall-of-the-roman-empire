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

        {/*
          **메타 줄.** `learn.chatgpt.com` 낱개 화면이 제목 바로 아래 `Easy | 5m`을
          박는다 — 고르기 전에 알아야 하는 값이라 카드 안쪽이 아니라 머리에 있다
          (2026-08-19 크롬으로 실측). 우리는 난이도 대신 「어디서 되나」가 그 자리를
          겸한다. 배지가 이미 답하므로 여기서는 시간만 말한다.
        */}
        <Text size="sm" color="secondary">
          {r.needs === 'web' ? '웹에서 바로' : '자료를 받아야 함'} · 약 {r.minutes}분
        </Text>

        {/*
          **「언제 쓰나」에 라벨을 세운다.** 앞 판은 `when` 값이 라벨 없이 홀로 떠서
          「포인트를 배정받았는데 무엇을 준비할지 막막할 때.」가 서술어 없는 조각으로
          읽혔다 — 아래 형제 행(「1 넣는 것」·「3 나오는 것」)은 전부 라벨이 있는데
          이것만 없었다(River 카피 반려, 2026-08-19).

          같은 것을 `learn.chatgpt.com`은 `Best for`라는 이름 붙은 칸으로 세운다.
          **조각은 라벨이 붙어 있을 때만 허용한다**는 것이 [[CONTENT]]의 판정 기준이다.
        */}
        <MetadataList columns="single" label={{ position: 'start', width: 88 }}>
          <MetadataListItem label="언제 쓰나">{r.when}</MetadataListItem>
        </MetadataList>

        <Divider />

        {/*
          **입력 → 처리 → 출력.** River: "우수사례의 경우에는 입력, 프로세싱,
          출력 이런 식으로 해야 인간의 사고 구조적으로 이해하기가 좋을 것이다."

          앞 판은 「재료·프롬프트·나오는 것」이 평평하게 놓여 어느 것이 내가
          넣는 것이고 어느 것이 나오는 것인지 안 보였다.

          **세로 번호로 간다.** docs.claude.com·Prisma를 조사했더니 단계 표현이
          컬럼이나 그림이 아니라 **번호 + 굵은 라벨**이 압도적으로 흔했다
          (`1. Startup:` `2. User request:`). 세로라 좁은 화면에서 안 깨지고,
          붙여넣을 상자가 온전한 폭을 쓴다.

          라벨은 `SkillCard`와 **같은 말**이어야 한다 — 두 화면에서 같은 단계를
          다른 이름으로 부르면 삼단으로 나눈 값이 사라진다.
        */}
        <Stack direction="vertical" gap={2}>
          <Stack direction="horizontal" gap={1.5} vAlign="center" wrap="wrap">
            <Badge variant="neutral" label="1 넣는 것" />
            <Text size="sm">
              <a href={r.materialHref}>{r.material}</a>
            </Text>
          </Stack>

          {/* 「준비 범위부터 잡기」는 표를 시트에 붙이면 끝이라 프롬프트가 없다. 빈 상자를 안 그린다 */}
          {r.prompt ? (
            <Stack direction="vertical" gap={1}>
              <Stack direction="horizontal">
                <Badge variant="neutral" label="2 시키는 것" />
              </Stack>
              <CodeBlock code={r.prompt} title="AI 창에 붙여넣기" hasCopyButton />
            </Stack>
          ) : null}

          <Stack direction="vertical" gap={1}>
            <Stack direction="horizontal">
              <Badge variant="neutral" label="3 나오는 것" />
            </Stack>
            <Text>{r.result}</Text>
          </Stack>
        </Stack>

        {r.caution ? (
          <MetadataList columns="single" label={{ position: 'start', width: 88 }}>
            <MetadataListItem label="조심할 것">{r.caution}</MetadataListItem>
          </MetadataList>
        ) : null}
      </Stack>
    </Card>
  )
}
