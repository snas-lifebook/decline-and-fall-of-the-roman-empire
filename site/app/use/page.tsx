import {
  Stack,
  Grid,
  Heading,
  Text,
  Divider,
  List,
  ListItem,
  Banner,
  ClickableCard,
} from '@astryxdesign/core'
import { Shell } from '../../components/Shell'
import { navFind } from '../../lib/nav'
import { pageMeta } from '../../lib/meta'
import { RECIPES, RECIPE_CATEGORIES, categoryId } from '../../lib/recipes'

/**
 * 활용하기 랜딩 — 어디로 갈지 고르는 자리다.
 *
 * **두 번 뒤집힌 화면이다.** 첫 판은 364줄 TSX에 표 둘과 프롬프트 여덟 개를
 * 늘어놓았다가 반려됐다 — 여덟 중 일곱이 로컬 파일을 요구하는데 화면은 「쓰던 챗
 * 서비스 그대로」를 약속했기 때문이다. 그래서 재료 → 사례 → 스킬 → 함정 순서로
 * 바꿨다.
 *
 * **그 순서도 우리 것이었다.** 자료를 정리한 사람의 순서지 읽는 사람의 순서가
 * 아니다. 읽는 사람은 「나는 지금 발표를 준비한다」로 온다. 2026-08-19에 상황
 * 넷을 먼저 고르게 바꿨다.
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
  '/use/reading': '본문·인물 카드·지도·글자 설정을 화면에서 어떻게 보는지 안내합니다.',
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
          이 자료를 화면에서 읽고 보는 법과, 쓰시던 ChatGPT나 Claude에 붙여넣어 쓰는 법입니다.
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

      {/*
        **상황을 먼저 고르게 한다.** 앞 판은 네 장을 번호 매겨 늘어놓았는데,
        그 순서(재료 → 사례 → 스킬 → 함정)는 **만드는 사람이 자료를 정리한 순서**지
        읽는 사람의 순서가 아니다. 읽는 사람은 「나는 지금 발표를 준비한다」로 온다.

        상황 넷은 지어낸 것이 아니라 `RECIPE_CATEGORIES`가 이미 갖고 있던 갈래다 —
        랜딩으로 끌어올렸을 뿐이다. `learn.chatgpt.com/use-cases`도 낱개 사례 앞에
        컬렉션을 먼저 세운다(2026-08-19 실측).

        갈래마다 **웹에서 바로 되는 것이 몇 건인지**를 같이 적는다. 자료를 아직 안
        받은 사람이 자기 몫을 셀 수 있어야 한다 — 여덟 중 일곱이 자료를 요구한다는
        사실이 지금까지 경고 상자 안에만 있었다.
      */}
      <Stack direction="vertical" gap={3} as="section">
        <Heading level={2}>무엇을 하시려는지 고르세요</Heading>
        <Grid columns={{ minWidth: 240 }} gap={3}>
          {RECIPE_CATEGORIES.map((c) => {
            const items = RECIPES.filter((r) => r.category === c)
            const web = items.filter((r) => r.needs === 'web').length
            return (
              <ClickableCard
                key={c}
                href={`/use/recipes#${categoryId(c)}`}
                label={c}
                padding={4}
              >
                <Stack direction="vertical" gap={0.5}>
                  <Heading level={3}>{c}</Heading>
                  {/*
                    **0을 「0건」이라고 적지 않는다.** 웹에서 되는 것이 없는 갈래가
                    둘이라 그대로 쓰면 카드 둘이 「0건」을 달고 선다. 같은 사실을
                    할 일로 뒤집어 적는다 — 읽는 사람이 알아야 할 것은 개수가 아니라
                    「지금 되나, 준비가 필요한가」다.
                  */}
                  <Text size="sm" color="secondary">
                    사례 {items.length}건 ·{' '}
                    {web > 0 ? `웹에서 바로 되는 것 ${web}건` : '모두 자료를 받아야 합니다'}
                  </Text>
                </Stack>
              </ClickableCard>
            )
          })}
        </Grid>
      </Stack>

      <Stack direction="vertical" gap={1.5} as="section">
        <Heading level={2}>먼저 볼 것</Heading>
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
      </Stack>
    </Shell>
  )
}
