import Link from 'next/link'
import { Stack, Heading, Text, Divider, Banner } from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { RecipeCard } from '../../../components/RecipeCard'
import { MaterialCards } from '../../../components/MaterialCards'
import { Faq } from '../../../components/Faq'
import { RECIPES, RECIPE_CATEGORIES } from '../../../lib/recipes'
import { faqFor } from '../../../lib/faq'

/**
 * 우수 사례 — 이 섹션에서 **유일하게 마크다운이 아닌 화면**이다.
 *
 * 사례는 문서가 아니라 카드다. 「언제·재료·프롬프트·나오는 것·조심할 것」이라는
 * 같은 뼈대가 여덟 번 반복되는데, 그건 산문이 아니라 표의 성질이다. 마크다운으로
 * 쓰면 라벨이 본문에 섞여 흐르고 사례 경계가 사라진다(앞 판이 그래서 반려됐다).
 *
 * 재료 안내는 「무엇을 AI에 주나」와 **같은 카드 한 벌을 쓴다**(`MaterialCards`).
 * 앞 판은 여기서 셋을 따로 적었는데, 한쪽만 고치면 두 화면이 어긋난다.
 */
export default function Recipes() {
  return (
    <Shell path="/use/recipes" where="우수 사례">
      <Stack direction="vertical" gap={1.5}>
        <Heading level={1}>우수 사례</Heading>
        <Text size="lg" color="secondary">
          실제로 해서 결과가 나온 것만 모았습니다. 지금 상황을 고르고 그대로 따라 하시면 됩니다.
        </Text>
      </Stack>

      <Divider />

      <Banner
        status="info"
        title="재료를 안 주면 AI가 지어냅니다"
        description="아래 사례는 전부 「무엇을 붙여넣는지」부터 적었습니다. 재료는 셋 중 하나입니다."
      />

      <MaterialCards />

      {RECIPE_CATEGORIES.map((c) => {
        const items = RECIPES.filter((r) => r.category === c)
        if (!items.length) return null
        return (
          <Stack key={c} direction="vertical" gap={3} as="section">
            <Heading level={2}>{c}</Heading>
            <Stack direction="vertical" gap={3}>
              {items.map((r) => (
                <RecipeCard key={r.id} r={r} />
              ))}
            </Stack>
          </Stack>
        )
      })}

      <Divider />

      <Stack direction="vertical" gap={1.5}>
        <Heading level={2}>엮어서 쓰기</Heading>
        <Text color="secondary">
          한 건씩 따로 쓰셔도 되지만, 이어 붙이면 발표 준비 한 바퀴가 됩니다.
        </Text>
        <Text>
          맡은 포인트의 표를 받아 범위를 잡고 → 본문을 복사해 대본 초안을 만들고 → 헷갈리는
          인물이 나오면 객체 페이지로 갈라 보고 → 의심되는 서술은 사료와 대조합니다.
        </Text>
        <Text size="sm" color="secondary">
          <Link href="/use/pitfalls">그냥 시키면 틀리는 것</Link>을 먼저 훑어두시면 각 단계에서 무엇을 의심할지
          알 수 있습니다.
        </Text>
      </Stack>

      <Faq items={faqFor('/use/recipes')} />
    </Shell>
  )
}
