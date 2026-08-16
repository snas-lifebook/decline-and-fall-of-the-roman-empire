import Link from 'next/link'
import { Stack, Heading, Text, Divider, Banner, Grid, ClickableCard } from '@astryxdesign/core'
import { Shell } from '../../../components/Shell'
import { RecipeCard } from '../../../components/RecipeCard'
import { RECIPES, RECIPE_CATEGORIES } from '../../../lib/recipes'

/**
 * 우수 사례 — 이 섹션에서 **유일하게 마크다운이 아닌 화면**이다.
 *
 * 사례는 문서가 아니라 카드다. 「언제·재료·프롬프트·나오는 것·조심할 것」이라는
 * 같은 뼈대가 여덟 번 반복되는데, 그건 산문이 아니라 표의 성질이다. 마크다운으로
 * 쓰면 라벨이 본문에 섞여 흐르고 사례 경계가 사라진다(앞 판이 그래서 반려됐다).
 *
 * 재료 안내는 화면이 직접 그린다 — 세 갈래 카드라 목록보다 카드가 맞다.
 */

const MATERIALS = [
  {
    href: '/read',
    title: '이 페이지 복사',
    desc: '읽기의 포인트 화면과 찾아보기의 객체 화면 위쪽 버튼입니다. 한 덩어리가 약 1만 자라 어느 AI 창에도 그냥 들어갑니다',
  },
  {
    href: '/download',
    title: '시트에 붙여넣기용 복사',
    desc: '가져가기에서 포인트를 고르면 나오는 표입니다. 구글시트나 엑셀에 붙이면 그대로 표가 됩니다',
  },
  {
    href: '/start/ai',
    title: '자료를 통째로 연결',
    desc: '자료를 컴퓨터에 받아 AI에 물려두는 방법입니다. 아래 「자료 연결 필요」 사례가 여기서 열립니다',
  },
] as const

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

      <Grid columns={{ minWidth: 240 }} gap={3}>
        {MATERIALS.map((m) => (
          <ClickableCard key={m.href} href={m.href} label={m.title} padding={4}>
            <Stack direction="vertical" gap={0.5}>
              <Text weight="semibold">{m.title}</Text>
              <Text size="sm" color="secondary">
                {m.desc}
              </Text>
            </Stack>
          </ClickableCard>
        ))}
      </Grid>

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
    </Shell>
  )
}
