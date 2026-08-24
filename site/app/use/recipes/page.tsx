import Link from 'next/link'
import { Stack, Text, Banner } from '@astryxdesign/core'
import { DocShell, type DocSection } from '../../../components/DocShell'
import { RecipeCardV2 } from '../../../components/RecipeCardV2'
import { RecipeControls } from '../../../components/RecipeControls'
import { MaterialCards } from '../../../components/MaterialCards'
import { RECIPES, RECIPE_CATEGORIES, RECIPE_CATEGORY_META, categoryId } from '../../../lib/recipes'
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
 *
 * ## 2026-08-24 롤아웃 (롤모델 리서치 [[롤모델_리서치_레시피카드_20260824]])
 *
 * 카드를 `RecipeCardV2`로 전면 교체했다 — 기본 닫힘(스캔되는 메뉴) + 왕복 도식 +
 * 색 맞춘 삼단. 상단 CategoryCards(4색 타일)는 **선택 표**로 갈았다: 타일과 표가
 * 둘 다 「사례 고르기」라 중복 내비였고(/use에서 고친 그 병), OpenAI "Choose your
 * starting point"식 목표→사례 표가 더 낫다. 표에서 사례를 누르면 그 카드로 뛰어
 * 펼쳐진다. 웹/데이터 필터(`RecipeControls`)가 표 행과 카드·빈 갈래 섹션을 함께 거른다.
 */
export const metadata = pageMeta('활용 사례')

/**
 * 선택 표 — OpenAI "Choose your starting point"식. 하려는 일을 고르면 그 사례로 뛴다.
 * 필터는 표 위에 둔다: 한 조작이 표 행과 아래 카드를 함께 거른다.
 */
function chooser() {
  return (
    <Stack direction="vertical" gap={2}>
      <Text color="secondary">
        하시려는 일을 고르면 그 사례로 바로 갑니다. 「어디서」는 웹만으로 되는지, 자료를 받아야 하는지예요.
      </Text>
      <RecipeControls />
      <table className="recipe-chooser">
        <thead>
          <tr>
            <th>이럴 때</th>
            <th>사례</th>
            <th>어디서</th>
          </tr>
        </thead>
        <tbody>
          {RECIPES.map((r) => (
            <tr key={r.id} data-needs={r.needs}>
              <td>{r.when}</td>
              <td>
                <a href={`#recipe-${r.id}`}>{r.title}</a>
              </td>
              <td>
                <span className="recipe-chip" data-kind={r.needs}>
                  {r.needs === 'web' ? '웹만으로' : '자료 필요'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Stack>
  )
}

function sections(): DocSection[] {
  const cats: DocSection[] = RECIPE_CATEGORIES.flatMap((c) => {
    const items = RECIPES.filter((r) => r.category === c)
    if (!items.length) return []
    return [
      {
        id: categoryId(c),
        title: c,
        body: (
          <Stack direction="vertical" gap={3}>
            {/* 컬렉션 격자에서 뛰어온 자리 — 같은 한 줄로 무슨 갈래인지 다시 세운다 */}
            <Text color="secondary">{RECIPE_CATEGORY_META[c].blurb}</Text>
            {items.map((r) => (
              <RecipeCardV2 key={r.id} r={r} />
            ))}
          </Stack>
        ),
      },
    ]
  })

  return [
    { id: 'chooser', title: '어떤 사례가 필요한가', body: chooser() },
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
