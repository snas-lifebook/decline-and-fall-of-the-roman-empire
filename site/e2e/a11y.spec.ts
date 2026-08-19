import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * 접근성 — **새 위반이 늘지 않는 것**이 목표다.
 *
 * 헌장 5절이 데이터에 쓰는 규칙을 그대로 옮겼다. 「목표는 위반 0이 아니라 새 위반이
 * 늘지 않는 것」 · 「이유 없이 줄을 추가하지 않는다」 · 「고친 것은 목록에서 지운다」.
 *
 * ## 지금은 실제로 0이다
 *
 * 처음 돌렸을 때 셋이 나왔고(2026-08-18) **전부 고쳤다.** 등록하지 않은 이유는
 * 셋 다 이번에 만든 것이었기 때문이다.
 *
 *   - `color-contrast` ×5 — 카드 페이드의 불투명도가 0.28까지 내려가 글자가 바탕에
 *     섞였다. 「흐리게」의 바닥을 4.5:1이 정하도록 0.62·0.74로 올리고 나머지 느낌은
 *     크기가 맡게 했다
 *   - `aria-allowed-attr` (critical) — 설정 톱니의 `aria-haspopup`을 `<span>`에
 *     붙였다. 평범한 span은 그 속성을 못 가진다. 단추로 옮겼다
 *   - `nested-interactive` — 링크가 든 SVG에 `role="img"`를 걸어 두어 낭독기에서
 *     링크가 가려지면서 키보드 초점만 닿았다. 셋 다 `role="group"`으로 고쳤다
 *
 * 남은 하나는 astryx 내부라 등록했다. 8/17 검수의 미해결 6건(영문 `aria-label`·터치
 * 목표 32px·비텍스트 대비)은 여기 없다 — axe 자동 규칙이 안 잡는 것들이라 목록에
 * 넣으면 아무것도 안 막으면서 「다뤘다」는 착시만 준다. 그건 [[TASKS]]에 남아 있다.
 *
 * **두 모드를 다 본다.** 처음엔 라이트만 훑고 「전 화면 0건」이라고 적을 뻔했는데,
 * 다크에서만 나는 것이 하나 있었다. 프로젝트 둘로 갈라 도는 이유다.
 */

/**
 * 알면서 통과시키는 위반.
 *
 * 줄을 추가할 때는 **반드시 이유를 같이 적는다.** 이유 없는 줄이 하나 들어오는
 * 순간 이 테스트는 아무것도 막지 않는다(헌장 5절 5항을 옮긴 것이다).
 */
const KNOWN: { rule: string; mode: 'light' | 'dark' | 'both'; why: string }[] = [
  {
    rule: 'color-contrast',
    // **다크에서만 난다.** 모드를 안 적으면 라이트에서 같은 규칙이 새로 깨져도 통과한다
    mode: 'dark',
    why:
      '`astryx-button primary`가 다크에서 흰 글자 on rgb(38,148,254) = **3.11:1**이다(실측 ' +
      '2026-08-18, `/download/5`의 「시트에 붙여넣기용 복사」). 우리 CSS는 단추 색을 ' +
      '하나도 안 건드린다 — astryx 기본값이라 라이브러리를 패치해야 바뀐다. 헌장 12절이 ' +
      '「색을 새로 정하지 않는다」이므로 여기서 덮지 않고, 8/17 검수의 astryx 내부 6건과 ' +
      '함께 [[TASKS]]에 남긴다. astryx를 올릴 때마다 다시 본다.',
  },
]

/** 서로 다른 골격만 고른다. 같은 틀을 두 번 재는 것은 시간만 쓴다 */
const SCREENS = [
  '/',
  '/start',
  '/read/point/5',
  // 2026-08-19에 생긴 셋. 책장은 카드 안에 링크가 겹쳐 있고(`ClickableCard`),
  // 책 문패는 목록 33줄에 `startContent`·`endContent`가 붙는다 — 둘 다 새 모양이다
  '/read',
  '/read/rome30',
  '/read/text/책머리에',
  '/objects/person/카이사르',
  '/download/5',
  '/use/recipes',
  '/faq',
  '/about',
  '/changelog',
  '/404',
]

for (const path of SCREENS) {
  test(`접근성 — ${path}`, async ({ page }) => {
    await page.goto(path)
    // 화면이 다 서기 전에 재면 없는 것을 통과시킨다
    await page.waitForLoadState('load')
    await page.waitForTimeout(300)

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    // **모드까지 맞아야 면제한다.** 다크에서만 나는 것을 라이트에서도 봐주면,
    // 라이트가 같은 규칙으로 새로 깨져도 조용히 통과한다
    const mode = test.info().project.name
    const allowed = new Set(
      KNOWN.filter((k) => k.mode === 'both' || k.mode === mode).map((k) => k.rule),
    )
    const fresh = violations.filter((v) => !allowed.has(v.id))

    expect(
      fresh.map((v) => `${v.id} ×${v.nodes.length}: ${v.help}\n    ${v.nodes[0]?.html?.slice(0, 160)}`),
      `${path} 에 새 접근성 위반`,
    ).toEqual([])
  })
}

test('**접힌 것을 펴서도 본다** — 닫혀 있으면 axe가 통째로 지나간다', async ({ page }) => {
  /*
   * 이 테스트가 있는 이유: `EgoGraph`가 `role="img"` 안에 링크를 담고 있었는데,
   * 읽기 화면에서 관계망이 접혀 있어서 **axe가 못 보고 지나갔다**(2026-08-18).
   * 빌드타임 SVG 셋은 잡혔는데 그것만 살아남았다 — 멀쩡해서가 아니라 안 보여서였다.
   *
   * 접는 것이 늘수록 이 구멍도 는다. 하단 넷을 다 펴고 한 번 더 잰다.
   */
  await page.goto('/read/point/5')
  for (const label of ['이 대목의 관계망', '이 대목을 표로 받기', '자주 묻는 것']) {
    await page.getByRole('button', { name: label }).click()
  }
  // 관계망은 힘 계산이 끝나야 링크가 자리를 잡는다
  await page.waitForTimeout(1200)

  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  const mode = test.info().project.name
  const allowed = new Set(
    KNOWN.filter((k) => k.mode === 'both' || k.mode === mode).map((k) => k.rule),
  )
  expect(
    violations.filter((v) => !allowed.has(v.id)).map((v) => `${v.id} ×${v.nodes.length}: ${v.help}`),
    '펼친 상태에서 새 접근성 위반',
  ).toEqual([])
})

test('**고친 것은 목록에서 지웠는가** — 안 지우면 다음 회귀를 못 잡는다', async ({ page }) => {
  // 헌장 5절 4항을 접근성에 옮긴 것이다. `KNOWN`에 있는데 실제로는 안 나오는 규칙이
  // 남아 있으면, 그 자리에서 다시 깨져도 조용히 통과한다.
  //
  // **전 화면을 봐야 한다.** 처음엔 읽기 화면 하나만 보고 「목록이 낡았다」고
  // 빨개졌는데, 등록된 것이 `/download/5`에서만 나는 것이었다. 한 화면으로 재면
  // 목록이 멀쩡한데도 지우라고 조른다
  if (!KNOWN.length) return

  const seen = new Set<string>()
  for (const path of SCREENS) {
    await page.goto(path)
    await page.waitForLoadState('load')
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    violations.forEach((v) => seen.add(v.id))
  }

  const mode = test.info().project.name
  const stale = KNOWN.filter(
    (k) => (k.mode === 'both' || k.mode === mode) && !seen.has(k.rule),
  ).map((k) => `${k.rule} (${k.mode})`)
  expect(stale, '이미 고쳐진 규칙이 목록에 남아 있다. 지워야 다음 회귀를 잡는다').toEqual([])
})

/**
 * 집중해서 읽기에서 **어느 화면에서든** 빠져나온다.
 *
 * 앞 판은 나갈 단추가 읽기 세 화면에만 있었다. 그런데 집중 모드는 `<html>` 속성이라
 * **화면을 옮겨도 켜진 채로 따라간다** — 켜 놓고 객체나 FAQ로 넘어가면 상단 바도
 * 좌우도 없고 나갈 단추도 없어서 **644장 어디서도 못 빠져나왔다**(객체 화면을
 * 검수하다 잡혔다). Esc를 받는 것도 읽기 화면에만 있었다.
 */
test.describe('집중해서 읽기에 갇히지 않는다', () => {
  for (const path of [
    '/objects/person/카이사르',
    '/faq',
    '/about',
    '/download/5',
    '/use/recipes',
    '/read/point/5',
    '/read/source/15',
    '/start/links',
  ]) {
    test(`나갈 길이 있다 — ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.evaluate(() => localStorage.setItem('read-focus', 'on'))
      await page.reload()
      await page.waitForLoadState('load')

      // 정확히 하나. 없으면 갇히고, 둘이면 겹쳐 그려진다
      await expect(page.locator('.focus-exit')).toHaveCount(1)
      const exit = page.locator('.focus-exit button')
      await expect(exit).toBeVisible()
      await exit.click()
      await expect(page.locator('.astryx-app-shell-header')).toBeVisible()
    })
  }
})
