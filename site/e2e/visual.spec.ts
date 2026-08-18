import { test, expect } from '@playwright/test'

/**
 * 시각회귀 — **화면이 깨졌는지만 본다.**
 *
 * 이 파일이 있는 이유: 8/18 하루에 읽기 화면이 다섯 번 바뀌었고, 그 사이 찌그러진
 * 지도·겹친 카드·안 걸린 CSS를 전부 **눈으로** 잡았다. 다음에 같은 것이 깨지면
 * 눈이 아니라 여기가 먼저 말해야 한다.
 *
 * ## 화면이 아니라 골격을 센다
 *
 * 739장을 다 찍지 않는다. `/objects/person/카이사르`와 `/objects/person/네로`는 같은
 * 틀이라 둘 다 찍을 값이 없다. **서로 다른 골격 열 개**만 본다.
 *
 * ## 찍지 않는 것
 *
 * **`/changelog`은 뺐다.** `git log -- site`에서 만들어지므로 **커밋할 때마다 화면이
 * 바뀐다.** 기준선을 걸면 매번 썩는다. 접근성 검사는 그 화면도 본다.
 *
 * ## 흔들리는 것을 설정이 잡는다
 *
 * `playwright.config.ts`가 `reducedMotion`으로 `EgoGraph`를 가라앉히고, `colorScheme`
 * 프로젝트 둘이 라이트·다크를 가른다. 글꼴은 자체 호스팅이라 CDN을 안 탄다.
 * 여기서 더하는 것은 **글꼴이 다 실릴 때까지 기다리는 것**뿐이다.
 *
 * ## 전장(全長)을 안 찍는다
 *
 * `fullPage`로 찍으면 읽기 화면 한 장이 5,000px이라 파일이 수 MB고, **문단 하나만
 * 고쳐도 빨개진다.** 화면 한 장 크기로 위쪽을 본다 — 레이아웃이 깨지는 것은 거기서
 * 다 드러난다.
 */

const SCREENS: [string, string][] = [
  ['hub', '/'],
  ['start', '/start'],
  ['read', '/read/point/5'],
  // 2026-08-19에 생긴 골격 셋. 책장·책 문패·앞뒤 글은 서로 배치가 다르다
  ['shelf', '/read'],
  ['book', '/read/rome30'],
  ['front', '/read/text/책머리에'],
  ['person', '/objects/person/카이사르'],
  ['download', '/download/5'],
  ['use-recipes', '/use/recipes'],
  ['faq', '/faq'],
  ['about', '/about'],
  ['notfound', '/404'],
]

/** 글꼴이 늦게 오면 글자 폭이 달라져 전부 빨개진다 */
async function settle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
}

test.describe('화면 골격', () => {
  for (const [name, path] of SCREENS) {
    test(name, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(path)
      await settle(page)
      await expect(page).toHaveScreenshot(`${name}.png`)
    })
  }
})

test.describe('폰에서 접히는 화면', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  // 좁아지면 배치가 통째로 바뀌는 넷만. 산문 화면은 폭만 줄어 볼 값이 없다
  for (const [name, path] of SCREENS.filter(([n]) =>
    ['hub', 'read', 'shelf', 'book', 'person', 'download'].includes(n),
  )) {
    test(name, async ({ page }) => {
      await page.goto(path)
      await settle(page)
      await expect(page).toHaveScreenshot(`${name}-390.png`)
    })
  }
})

test.describe('읽기 설정을 바꾼 화면', () => {
  // 설정마다 다 찍지 않는다. **본문이 통째로 다시 그려지는 셋**만 본다
  for (const [name, key, value] of [
    ['maruburi', 'read-font', 'maruburi'],
    ['sepia', 'read-tone', 'sepia'],
    ['focus', 'read-focus', 'on'],
  ] as const) {
    test(name, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/read/point/5')
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value])
      await page.reload()
      await settle(page)
      await expect(page).toHaveScreenshot(`read-${name}.png`)
    })
  }
})
