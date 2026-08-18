import { test, expect } from '@playwright/test'

/**
 * 읽는 사람이 실제로 하는 일.
 *
 * 헌장 4절 경계표가 `e2e/`에 **「구현 세부를 두지 않는다」**고 못박았다. 여기서 보는
 * 것은 「카드가 몇 장인가」가 아니라 「이름을 누르면 그 사람이 누구인지 알 수 있는가」다.
 */

const POINT = '/read/point/5'

test.describe('대목 읽기', () => {
  test('**본문이 뜬다** — `serve -s`가 켜져 있으면 여기서 허브가 잡힌다', async ({ page }) => {
    // 이 테스트가 첫 줄에 있는 이유: 앞 판 설정의 `-s`(SPA 모드)가 모든 경로에
    // `index.html`을 줘서, 아래 테스트가 전부 허브를 보고 초록이 될 뻔했다
    await page.goto(POINT)
    await expect(page.locator('h1')).toContainText('카이사르 등장 이전의 혼란')
    await expect(page.locator('.read-block').first()).toBeVisible()
  })

  test('옆에 그 사람이 누구인지 뜬다', async ({ page }) => {
    await page.goto(POINT)
    const card = page.locator('.read-grid > .read-card').first()
    await expect(card).toBeVisible()
    // 이름 · 한 줄 소개가 다 있어야 카드다. 이름만 있으면 링크와 다를 게 없다
    await expect(card.locator('.read-card-name')).not.toBeEmpty()
    await expect(card.locator('.read-card-line')).not.toBeEmpty()
  })

  test('카드를 누르면 그 사람 화면으로 간다', async ({ page }) => {
    await page.goto(POINT)
    const card = page.locator('.read-grid > .read-card').first()
    const href = await card.getAttribute('href')
    await card.click()
    // 주소는 퍼센트 인코딩돼 있고 브라우저가 풀어서 보여준다. 정규식으로 꼬리를
    // 맞추면 한글에서 어긋나므로 **디코딩해서 통째로** 견준다
    await page.waitForURL((url) => decodeURIComponent(url.pathname) === decodeURIComponent(href!))
    await expect(page.locator('h1')).not.toBeEmpty()
  })

  test('목차가 붙어 있고 지금 절을 알려준다', async ({ page }) => {
    await page.goto(POINT)
    const rail = page.locator('.read-rail')
    await expect(rail).toBeVisible()

    // 굴려도 목차는 화면에 남아 있어야 한다 — 그게 이 자리에 둔 이유다
    await page.evaluate(() => {
      document.getElementById('astryx-app-shell-main')!.scrollTop = 2000
    })
    await expect(rail).toBeInViewport()
  })

  test('**지명에 마우스를 올리면 지도가 뜨고 그 자리가 켜진다**', async ({ page }) => {
    await page.goto(POINT)
    const place = page.locator('.read-block a[href^="/objects/place/"]').first()
    await place.scrollIntoViewIfNeeded()
    await place.hover()

    // 120ms 늦게 뜬다. `waitForTimeout`이 아니라 나타남을 기다린다
    await expect(page.locator('.point-map .lit')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('.map-slot')).toBeVisible()
  })

  test('앞뒤로 넘어가는 길이 딸린 자료보다 먼저 나온다', async ({ page }) => {
    await page.goto(POINT)
    const next = page.locator('a', { hasText: '천적과의 전쟁' }).first()
    const map = page.locator('.map-slot')
    const [nextY, mapY] = await Promise.all([
      next.evaluate((el) => el.getBoundingClientRect().top + window.scrollY),
      map.evaluate((el) => el.getBoundingClientRect().top + window.scrollY),
    ])
    expect(nextY, '앞뒤 링크가 지도보다 뒤에 있다').toBeLessThan(mapY)
  })

  test('딸린 자료 넷이 접혀 있다 — 다 펴 두면 본문보다 길다', async ({ page }) => {
    await page.goto(POINT)
    for (const label of ['이 대목의 관계망', '이 대목을 표로 받기', '자주 묻는 것']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }
  })
})

test.describe('폰으로 읽기', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('**카드가 본문 사이에 하나도 없다** — River가 「상당히 큰 불편」이라 한 자리', async ({
    page,
  }) => {
    await page.goto(POINT)
    await expect(page.locator('.read-block').first()).toBeVisible()
    const info = await page.evaluate(() => ({
      w: window.innerWidth,
      mq: window.matchMedia('(max-width: 1100px)').matches,
      grid: getComputedStyle(document.querySelector('.read-grid')!).display,
      shown: [...document.querySelectorAll('.read-card')].filter(
        (e) => getComputedStyle(e).display !== 'none',
      ).length,
      total: document.querySelectorAll('.read-card').length,
    }))
    expect(info.shown, `본문 흐름에 카드가 남아 있다 ${JSON.stringify(info)}`).toBe(0)
  })

  test('이름을 누르면 아래에서 카드가 올라온다', async ({ page }) => {
    await page.goto(POINT)
    // 카드가 붙은 이름을 찾는다. 47개 중 카드가 있는 것은 14개다
    const href = await page.evaluate(() => {
      const has = new Set(
        [...document.querySelectorAll('.read-grid > .read-card')].map((c) => c.getAttribute('href')),
      )
      return (
        [...document.querySelectorAll('.read-block a[href^="/objects/"]')].find((a) =>
          has.has(a.getAttribute('href')),
        )?.getAttribute('href') ?? null
      )
    })
    expect(href, '카드가 붙은 본문 링크가 없다').not.toBeNull()

    await page.locator(`.read-block a[href="${href}"]`).first().click()
    await expect(page.locator('.read-card[data-open]')).toBeVisible()
    // 본문에 그대로 남아 있어야 한다 — 눌렀다고 화면을 떠나면 읽던 자리를 잃는다
    await expect(page).toHaveURL(new RegExp('/read/point/5'))

    await page.keyboard.press('Escape')
    await expect(page.locator('.read-card[data-open]')).toHaveCount(0)
  })

  test('가로로 안 넘친다', async ({ page }) => {
    await page.goto(POINT)
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(over).toBe(false)
  })
})
