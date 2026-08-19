import Link from 'next/link'
import { Stack, Text, Banner } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../../components/DocShell'
import { RecipeCard } from '../../../components/RecipeCard'
import { MaterialCards } from '../../../components/MaterialCards'
import { RECIPES, RECIPE_CATEGORIES } from '../../../lib/recipes'
import { pageMeta } from '../../../lib/meta'

/**
 * 우수 사례 — 이 섹션에서 **유일하게 마크다운이 아닌 화면**이다.
 *
 * 사례는 문서가 아니라 카드다. 「언제·재료·프롬프트·나오는 것·조심할 것」이라는
 * 같은 뼈대가 여덟 번 반복되는데, 그건 산문이 아니라 표의 성질이다. 마크다운으로
 * 쓰면 라벨이 본문에 섞여 흐르고 사례 경계가 사라진다(앞 판이 그래서 반려됐다).
 *
 * 재료 안내는 「무엇을 AI에 주나」와 **같은 카드 한 벌을 쓴다**(`MaterialCards`).
 * 앞 판은 여기서 셋을 따로 적었는데, 한쪽만 고치면 두 화면이 어긋난다.
 *
 * 2026-08-19에 `DocShell`로 옮겼다. 「재료 셋」 제목을 손으로 세워 h1 → h3 건너뜀을
 * 막던 자리가 이제 절 목록의 첫 항목이라, 우측 목차에도 같이 실린다.
 */
export const metadata = pageMeta('활용 사례')

function sections(): DocSection[] {
  const cats: DocSection[] = RECIPE_CATEGORIES.flatMap((c, i) => {
    const items = RECIPES.filter((r) => r.category === c)
    if (!items.length) return []
    return [
      {
        id: `sec-${i + 1}`,
        title: c,
        body: (
          <Stack direction="vertical" gap={3}>
            {items.map((r) => (
              <RecipeCard key={r.id} r={r} />
            ))}
          </Stack>
        ),
      },
    ]
  })

  return [
    { id: 'materials', title: '붙여넣을 자료 고르기', body: <MaterialCards /> },
    ...cats,
    {
      id: 'chain',
      title: '엮어서 쓰기',
      body: (
        <Stack direction="vertical" gap={1.5}>
          <Text color="secondary">
            한 건씩 따로 쓰셔도 되지만, 이어 붙이면 발표 준비 한 바퀴가 됩니다.
          </Text>
          <Text>
            맡은 포인트의 표를 받아 범위를 잡고 → 본문을 복사해 대본 초안을 만들고 → 헷갈리는
            인물이 나오면 객체 페이지로 갈라 보고 → 의심되는 서술은 사료와 대조합니다.
          </Text>
          <Text size="sm" color="secondary">
            <Link href="/use/pitfalls">그냥 시키면 틀리는 것</Link>을 먼저 훑어 두시면 어느 자리에서
            무엇을 의심해야 하는지 보입니다.
          </Text>
        </Stack>
      ),
    },
  ]
}

export default function Recipes() {
  return (
    <DocShell
      href="/use/recipes"
      title="활용 사례"
      summary="실제로 해보고 결과가 나온 방법만 모았습니다. 지금 상황에 맞는 것을 골라 그대로 따라 하시면 됩니다."
      sections={sections()}
      intro={
        <Banner
          status="info"
          title="자료를 붙여넣지 않으면 AI가 없는 내용을 만들어 냅니다"
          description="아래 사례는 모두 무엇을 붙여넣는지부터 적어 두었습니다. 붙여넣을 자료는 아래 세 가지 중 하나입니다."
        />
      }
    />
  )
}
