import { Stack, Heading, Text, Divider, List, ListItem, Banner } from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { navFind } from '../../lib/nav'
import { pageMeta } from '../../lib/meta'

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
 * 이유가 이 화면의 전부다.
 *
 * 네 장이 모두 `app/use/<이름>/`에서 카드로 그려진다. `content/use/*.md`는 없앴다 —
 * 프론트매터 한 줄을 읽으려고 남겨둔 마크다운 361줄은 카드와 어긋나기만 한다.
 */
/**
 * 부제만으로는 "그 안에 뭐가 있나"를 모른다. 몇 개짜리인지까지 적으면
 * 눌러도 되는지가 목록에서 끝난다 (RESEARCH R-E 「펼치기에 개수를 적는다」).
 */
const ABOUT: Record<string, string> = {
  '/use/data':
    '안 주면 AI가 아는 척하고 지어냅니다. 줄 수 있는 재료 세 가지와 각각의 크기를 적어 뒀습니다.',
  '/use/recipes':
    '실제로 해서 결과가 나온 것만 모았습니다. 상황 넷에 사례 여덟, 프롬프트는 복사해서 씁니다.',
  '/use/skills':
    'AI에게 시킬 일이 절차서로 적혀 있습니다. 여덟 벌을 지금 바로 되는 것과 자료가 필요한 것으로 갈라 뒀습니다.',
  '/use/pitfalls':
    '이 자료에서 AI가 실제로 틀린 자리 여덟 군데입니다. 각각 몇 건이었는지까지 세어 뒀습니다.',
}

export const metadata = pageMeta('활용하기')

export default function Use() {
  return (
    <Shell path="/use" where="활용하기">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>활용하기</Heading>
        <Text size="lg" color="secondary">
          쓰시던 ChatGPT나 Claude에 이 자료를 물리는 법입니다. 새로 깔거나 가입할 것은 없습니다.
        </Text>
      </Stack>

      <Divider />

      <Banner
        status="warning"
        title="그냥 물어보면 AI가 지어냅니다"
        description="「로마제국쇠망사 포인트 3 정리해줘」라고만 하면 그럴듯한 글이 나옵니다. 우리 책 내용은 아닙니다. 그래서 재료부터 줍니다."
      />

      <List listStyle="decimal" density="spacious" hasDividers>
        {(navFind('/use')?.children ?? []).map((p) => (
          <ListItem
            key={p.href}
            label={p.title}
            description={ABOUT[p.href] ?? ''}
            href={p.href}
          />
        ))}
      </List>
    </Shell>
  )
}
