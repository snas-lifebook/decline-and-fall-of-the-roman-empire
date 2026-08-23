import { Grid, Stack, Heading, Text, ClickableCard } from '@astryxdesign/core'
import { RECIPES, RECIPE_CATEGORIES, RECIPE_CATEGORY_META, categoryId } from '../lib/recipes'
import { PresentIcon, PeopleIcon, VerifyIcon, FlowIcon } from './icons'

/**
 * 활용 사례 컬렉션 격자 (#17).
 *
 * learn.chatgpt.com/use-cases의 컬렉션 격자를 옮긴다 — 색 있는 아이콘 타일 +
 * 분류명 + 한 줄. 분류는 `RECIPE_CATEGORIES`가 이미 갖고 있던 것이고(지어낸 갈래가
 * 아니다), 여기서 시각만 세운다. 카드는 같은 페이지의 `#sec-N` 절로 뛴다 —
 * `/use` 랜딩이 쓰던 `categoryId`와 같은 자리라 두 화면이 같은 링크를 쓴다.
 *
 * **아이콘·색은 데이터가 아니라 표현이라 여기 둔다.** 글(blurb)만 lib이 쥔다.
 */
const ICON = {
  prep: PresentIcon,
  people: PeopleIcon,
  facts: VerifyIcon,
  flow: FlowIcon,
} as const

export function CategoryCards() {
  return (
    <Grid columns={{ minWidth: 260 }} gap={3}>
      {RECIPE_CATEGORIES.map((c) => {
        const meta = RECIPE_CATEGORY_META[c]
        const Mark = ICON[meta.key]
        const count = RECIPES.filter((r) => r.category === c).length
        return (
          <ClickableCard key={c} href={`/use/recipes#${categoryId(c)}`} label={c} padding={4}>
            <Stack direction="vertical" gap={1}>
              <Stack direction="horizontal" gap={2} vAlign="center">
                <span className={`collection-mark collection-mark--${meta.key}`}>
                  <Mark />
                </span>
                <Heading level={3}>{c}</Heading>
              </Stack>
              <Text size="sm" color="secondary">
                {meta.blurb}
              </Text>
              <Text size="sm" color="secondary">
                사례 {count}건
              </Text>
            </Stack>
          </ClickableCard>
        )
      })}
    </Grid>
  )
}
