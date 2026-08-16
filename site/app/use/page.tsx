import { Stack, Heading, Text, Divider, List, ListItem, Banner } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { navFind } from '../../lib/nav'
import { loadDoc } from '../../lib/doc'

/**
 * 활용하기 랜딩 — 목록이지 설명 페이지가 아니다(PLAN 「섹션 랜딩」).
 *
 * 앞 판은 364줄 TSX에 표 두 개와 프롬프트 코드블록 여덟 개를 늘어놓았고 River가
 * 반려했다. 원인은 개수가 아니라 **작동하지 않는다는 것**이었다 — 여덟이 전부
 * "깃허브의 X 레시피를 따라"로 시작하는데 그중 일곱이 로컬 파일을 읽어야 돌아간다.
 * 웹 ChatGPT에 붙이면 AI는 파일을 못 읽고 지어낸다. 화면이 「쓰던 챗 서비스 그대로」를
 * 약속해놓고 재료를 안 줬다.
 *
 * 그래서 순서를 논리로 바꿨다 — **재료 → 사례 → 스킬 → 함정.** 재료가 1번인
 * 이유가 이 화면의 전부다. 본문은 `content/use/*.md`가 정본이다.
 */
export default function Use() {
  const pages = navFind('/use')?.children ?? []

  return (
    <Shell path="/use" where="활용하기">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>활용하기</Heading>
        <Text size="lg" color="secondary">
          이 자료를 AI에게 제대로 물리는 법입니다. 쓰시던 ChatGPT나 Claude 그대로 쓰시면 됩니다.
        </Text>
      </Stack>

      <Divider />

      <Banner
        status="warning"
        title="그냥 물어보면 AI가 지어냅니다"
        description="「로마제국쇠망사 포인트 3 정리해줘」라고만 하면 그럴듯한 글이 나오지만 우리 책 내용이 아닙니다. 재료를 먼저 주는 것이 이 페이지의 요지입니다."
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
