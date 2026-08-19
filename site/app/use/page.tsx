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
/**
 * 네 장을 한 줄씩 소개한다.
 *
 * **앞 판은 한국어가 아니었다.** 「안 주면 AI가 아는 척하고 지어냅니다」처럼 주어가
 * 없이 끊기거나, 「각각 몇 건이었는지까지 세어 뒀습니다」처럼 **만든 사람의 수고를
 * 알리는 말**이 붙어 있었다(River 지적, 2026-08-19). 읽는 사람이 알아야 할 것은
 * 우리가 얼마나 세었는지가 아니라 **이 장을 열면 무엇을 할 수 있는가**다.
 *
 * docs.claude.com 한국어판의 「다음 단계」 항목이 쓰는 형태를 따랐다 — 「빠른 시작:
 * 코드베이스 탐색에서 수정 커밋까지 첫 번째 실제 작업을 진행합니다」처럼 **한 문장,
 * 평서형, 독자가 할 일 중심**이다.
 */
const ABOUT: Record<string, string> = {
  '/use/data': 'AI에게 먼저 붙여넣을 자료 세 가지를 고르는 법입니다.',
  '/use/recipes': '실제로 해보고 결과가 나온 방법만 모았습니다. 프롬프트는 복사해서 쓰시면 됩니다.',
  '/use/skills': 'AI에게 시킬 수 있는 작업을 절차로 정리했습니다. 웹에서 바로 되는 것부터 나옵니다.',
  '/use/pitfalls': '이 자료를 다루면서 AI가 실제로 틀렸던 곳과 그 대처법입니다.',
}

export const metadata = pageMeta('활용하기')

export default function Use() {
  return (
    <Shell path="/use" where="활용하기">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>활용하기</Heading>
        <Text size="lg" color="secondary">
          쓰시던 ChatGPT나 Claude에 이 자료를 붙여넣어 쓰는 방법입니다.
        </Text>
      </Stack>

      <Divider />

      {/*
        경고 문구를 다시 썼다. 앞 판은 「그냥 물어보면 AI가 지어냅니다」였는데
        주어가 없어 무슨 말인지 모른다(River 지적). **무엇을 하면 무엇이 잘못되는지**를
        한 문장에 담고, 예시를 따옴표로 보여준 뒤, 할 일로 끝낸다.
      */}
      <Banner
        status="warning"
        title="자료를 붙여넣지 않으면 AI가 없는 내용을 만들어 냅니다"
        description="「로마제국쇠망사 3번 포인트 정리해줘」라고만 물으면 그럴듯한 답이 나오지만 이 책 내용이 아닙니다. 먼저 자료를 붙여넣고 물어보세요."
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
